import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Circle, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';
import { PIPELINE_STEPS } from '../pipelineData';

/* Per-step animation duration in ms — realistic pacing for a live pipeline feel */
const STEP_DURATIONS = [350, 650, 950, 750, 1050, 550, 700, 450];

/* Minimum total animation time so the pipeline always feels substantial */
const MIN_TOTAL_MS = 4200;

export default function ProcessingPage({ job, onComplete }) {
  /* 'pending' | 'running' | 'done' | 'error' for each pipeline step */
  const [stepStates, setStepStates] = useState(
    PIPELINE_STEPS.map(() => 'pending')
  );
  const [progress, setProgress]   = useState(0);
  const [apiError, setApiError]   = useState(null);

  const apiResultRef   = useRef(null);
  const apiDoneRef     = useRef(false);
  const animDoneRef    = useRef(false);

  const checkBothDone = () => {
    if (animDoneRef.current && apiDoneRef.current) {
      if (apiResultRef.current) {
        onComplete(apiResultRef.current);
      }
    }
  };

  useEffect(() => {
    const startTs = Date.now();

    /* ── API call ────────────────────────────────────────────────────────── */
    const callApi = async () => {
      try {
        let res;
        if (job.type === 'demo') {
          res = await fetch(`${API_URL}/api/process-preset/${job.presetId}`, { method: 'POST' });
        } else {
          res = await fetch(`${API_URL}/api/process`, { method: 'POST', body: job.formData });
        }
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        apiResultRef.current = await res.json();
      } catch (err) {
        console.error('ProcessingPage API error:', err);
        setApiError(err.message || 'Failed to reach validation server.');
      } finally {
        apiDoneRef.current = true;
        checkBothDone();
      }
    };

    /* ── Step animation ──────────────────────────────────────────────────── */
    const animateSteps = async () => {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        /* Mark step as running */
        setStepStates(prev => prev.map((s, j) => (j === i ? 'running' : s)));

        await new Promise(r => setTimeout(r, STEP_DURATIONS[i]));

        /* Mark step as done, advance progress */
        setStepStates(prev => prev.map((s, j) => (j === i ? 'done' : s)));
        setProgress(Math.round(((i + 1) / PIPELINE_STEPS.length) * 100));
      }

      /* Ensure minimum display time for realism */
      const elapsed = Date.now() - startTs;
      if (elapsed < MIN_TOTAL_MS) {
        await new Promise(r => setTimeout(r, MIN_TOTAL_MS - elapsed));
      }

      animDoneRef.current = true;
      checkBothDone();
    };

    callApi();
    animateSteps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-8">

      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">
          {job.type === 'demo' ? 'Loading demo scenario' : 'Processing document'}
        </h2>
        <p className="text-sm text-slate-500">
          Running the full validation pipeline — this typically takes a few seconds.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-sky-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right text-xs font-semibold text-sky-700">{progress}%</div>
      </div>

      {/* Pipeline step list */}
      <div className="space-y-2">
        {PIPELINE_STEPS.map((step, idx) => {
          const state = stepStates[idx];
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                state === 'done'    ? 'bg-emerald-50 border-emerald-200' :
                state === 'running' ? 'bg-sky-50 border-sky-300 shadow-sm' :
                'bg-white border-slate-100'
              }`}
            >
              {/* Status icon */}
              {state === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : state === 'running' ? (
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}

              {/* Step label */}
              <div>
                <div className={`text-sm font-semibold ${
                  state === 'done'    ? 'text-emerald-900' :
                  state === 'running' ? 'text-sky-900' :
                  'text-slate-400'
                }`}>
                  {step.title}
                </div>
                <div className={`text-xs ${
                  state !== 'pending' ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  {step.subtitle}
                </div>
              </div>

              {/* "Running" label */}
              {state === 'running' && (
                <span className="ml-auto text-[10px] font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                  Running
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* API error state */}
      {apiError && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-rose-900">Backend unreachable</div>
            <div className="text-xs text-rose-700 mt-0.5">{apiError}</div>
            <div className="text-xs text-rose-600 mt-1">
              Make sure the FastAPI server is running at{' '}
              <code className="font-mono bg-rose-100 px-1 rounded">{API_URL}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
