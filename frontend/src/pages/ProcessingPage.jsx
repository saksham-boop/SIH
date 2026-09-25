import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Circle, AlertTriangle, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';
import { PIPELINE_STEPS } from '../pipelineData';

/* Step animation timing (ms) */
const STEP_DURATIONS = [300, 500, 700, 600, 800, 500, 600, 400];

export default function ProcessingPage({ job, onComplete }) {
  const [stepStates, setStepStates] = useState(
    PIPELINE_STEPS.map(() => 'pending')
  );
  const [progress, setProgress] = useState(5);
  const [apiError, setApiError] = useState(null);
  const [isAwaitingServer, setIsAwaitingServer] = useState(false);

  const apiResultRef = useRef(null);
  const apiDoneRef = useRef(false);
  const apiFailedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    /* ── 1. API Call ────────────────────────────────────────────────────────── */
    const callApi = async () => {
      try {
        let res;
        if (job.type === 'demo') {
          res = await fetch(`${API_URL}/api/process-preset/${job.presetId}`, { method: 'POST' });
        } else {
          res = await fetch(`${API_URL}/api/process`, { method: 'POST', body: job.formData });
        }
        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
        const data = await res.json();
        apiResultRef.current = data;
        apiDoneRef.current = true;
      } catch (err) {
        console.error('ProcessingPage API error:', err);
        if (isMounted) {
          apiFailedRef.current = true;
          apiDoneRef.current = true;
          setApiError(err.message || 'Validation server unreachable.');
        }
      }
    };

    /* ── 2. Dynamic Progress & Step Animation ─────────────────────────────── */
    const runPipeline = async () => {
      callApi();

      // Animate steps 0 to PIPELINE_STEPS.length - 2
      for (let i = 0; i < PIPELINE_STEPS.length - 1; i++) {
        if (!isMounted || apiFailedRef.current) break;

        setStepStates(prev => prev.map((s, j) => (j === i ? 'running' : s)));
        await new Promise(r => setTimeout(r, STEP_DURATIONS[i] || 400));

        setStepStates(prev => prev.map((s, j) => (j === i ? 'done' : s)));
        setProgress(Math.round(((i + 1) / PIPELINE_STEPS.length) * 88));
      }

      // Final step: Decision & Review transition
      const lastIdx = PIPELINE_STEPS.length - 1;
      setStepStates(prev => prev.map((s, j) => (j === lastIdx ? 'running' : s)));
      setProgress(92);

      // If backend is still computing, show friendly waiting indicator
      if (!apiDoneRef.current && isMounted) {
        setIsAwaitingServer(true);
      }

      // Poll until API responds or fails
      while (!apiDoneRef.current && isMounted) {
        await new Promise(r => setTimeout(r, 200));
      }

      if (!isMounted) return;
      setIsAwaitingServer(false);

      if (apiFailedRef.current) {
        setStepStates(prev => prev.map((s, j) => (j === lastIdx ? 'error' : s)));
        return;
      }

      // Mark final step done and transition smoothly
      setStepStates(prev => prev.map(() => 'done'));
      setProgress(100);

      await new Promise(r => setTimeout(r, 400));

      if (isMounted && apiResultRef.current) {
        onComplete(apiResultRef.current);
      }
    };

    runPipeline();

    return () => {
      isMounted = false;
    };
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">
          {job.type === 'demo' ? 'Loading Demo Scenario' : 'Processing Land Document'}
        </h2>
        <p className="text-sm text-slate-500">
          Running end-to-end OCR extraction, cadastre cross-referencing, and risk scoring.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-sky-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            {isAwaitingServer ? 'Awaiting cloud OCR engine response...' : 'Validating revenue attributes...'}
          </span>
          <span className="font-semibold text-sky-700">{progress}%</span>
        </div>
      </div>

      {/* Pipeline step list */}
      <div className="space-y-2">
        {PIPELINE_STEPS.map((step, idx) => {
          const state = stepStates[idx];
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                state === 'done'    ? 'bg-emerald-50/70 border-emerald-200' :
                state === 'running' ? 'bg-sky-50 border-sky-300 shadow-sm' :
                state === 'error'   ? 'bg-rose-50 border-rose-200' :
                'bg-white border-slate-100 opacity-60'
              }`}
            >
              {/* Status icon */}
              {state === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : state === 'running' ? (
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin flex-shrink-0" />
              ) : state === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}

              {/* Step label */}
              <div className="flex-1">
                <div className={`text-sm font-semibold ${
                  state === 'done'    ? 'text-emerald-900' :
                  state === 'running' ? 'text-sky-900' :
                  state === 'error'   ? 'text-rose-900' :
                  'text-slate-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-slate-500">
                  {step.subtitle}
                </div>
              </div>

              {/* Badges */}
              {state === 'running' && (
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                  Running
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Cloud cold-start / processing notice */}
      {isAwaitingServer && (
        <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sky-800 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600 flex-shrink-0" />
          <span>
            Server is running Tesseract bilingual OCR and cadastre cross-referencing. This will complete in a few moments...
          </span>
        </div>
      )}

      {/* API error state */}
      {apiError && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-rose-900">Backend Communication Issue</div>
            <div className="text-xs text-rose-700 mt-0.5">{apiError}</div>
            <div className="text-xs text-rose-600 mt-1">
              Backend endpoint: <code className="font-mono bg-rose-100 px-1 rounded">{API_URL}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
