import React, { useState, useEffect } from 'react';
import { Upload, ShieldCheck, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';
import { PIPELINE_STEPS, STEP_ICONS } from '../pipelineData';

/* ── Fallback KPI data (shown when backend is cold-starting) ─────────────── */
const FALLBACK_KPIS = { total_processed: 1250, needs_review: 144, high_risk: 34 };

/* ── Visual story items ──────────────────────────────────────────────────── */
const STORY = [
  'Paper record in',
  'AI reads it',
  'Data extracted',
  'Registry checked',
  'Map verified',
  'Anomalies detected',
  'Uncertain → officer',
  'Validated record out',
];

export default function Dashboard({ onStartUpload, onStartDemo }) {
  const [kpis, setKpis]           = useState(FALLBACK_KPIS);
  const [activeStep, setActiveStep] = useState(null); // id of expanded pipeline step

  /* Fetch live KPIs (non-blocking — fallback data used until resolved) */
  useEffect(() => {
    fetch(`${API_URL}/api/dashboard`)
      .then(r => r.json())
      .then(d => { if (d?.kpis) setKpis(d.kpis); })
      .catch(() => { /* keep fallback */ });
  }, []);

  const activeStepData = PIPELINE_STEPS.find(s => s.id === activeStep);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          Smart India Hackathon 2025 · Team ASCENDX
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
          Intelligent Land Record<br />Validation System
        </h1>

        <p className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed">
          AI-assisted digitization, validation, and anomaly detection for government land records
        </p>

        <button
          onClick={onStartUpload}
          className="inline-flex items-center gap-2.5 bg-sky-700 hover:bg-sky-800 active:bg-sky-900
                     text-white font-semibold px-8 py-3.5 rounded-xl text-sm shadow-sm
                     transition-colors duration-150"
        >
          <Upload className="w-4 h-4" />
          Upload Land Record
        </button>

        <div className="text-xs text-slate-400 mt-1">
          Or{' '}
          <button
            onClick={() => onStartDemo('area_mismatch')}
            className="text-sky-600 hover:underline font-medium"
          >
            try a demo record
          </button>
        </div>
      </div>

      {/* ── 3 KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="gov-card p-5 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {kpis.total_processed.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Records Processed</div>
        </div>

        <div className="gov-card p-5 text-center border-l-4 border-l-amber-400">
          <div className="text-2xl font-bold text-amber-600">
            {kpis.needs_review}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Needs Review</div>
        </div>

        <div className="gov-card p-5 text-center border-l-4 border-l-rose-400">
          <div className="text-2xl font-bold text-rose-600">
            {kpis.high_risk}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">High-Risk Cases</div>
        </div>
      </div>

      {/* ── Interactive Pipeline ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">How it works</h2>
          <p className="text-sm text-slate-500 mt-1">
            Click any step below to see exactly what happens inside the system.
          </p>
        </div>

        {/* Step grid — 4 columns on sm+, 2 on xs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = STEP_ICONS[step.id];
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(isActive ? null : step.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-150 group ${
                  isActive
                    ? 'border-sky-400 bg-sky-50 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded font-mono flex-shrink-0 ${
                    isActive ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>{idx + 1}</span>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-700' : 'text-slate-400 group-hover:text-sky-600'}`} />
                </div>
                <div className={`text-sm font-bold ${isActive ? 'text-sky-900' : 'text-slate-800'}`}>
                  {step.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {step.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded step detail panel */}
        {activeStepData && (
          <div className="bg-slate-900 text-white rounded-xl p-6 space-y-5 relative">
            <button
              onClick={() => setActiveStep(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>

            <div>
              <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider mb-1">
                Step {PIPELINE_STEPS.findIndex(s => s.id === activeStep) + 1} of {PIPELINE_STEPS.length}
              </div>
              <h3 className="text-lg font-bold">{activeStepData.title}</h3>
              <p className="text-slate-400 text-sm mt-1">{activeStepData.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">
                  Input
                </div>
                <p className="text-slate-200">{activeStepData.input}</p>
              </div>

              <div>
                <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">
                  Processing
                </div>
                <ul className="space-y-1.5">
                  {activeStepData.processing.map((item, i) => (
                    <li key={i} className="text-slate-200 flex items-start gap-2">
                      <span className="text-sky-400 flex-shrink-0 mt-px">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">
                  Output
                </div>
                <p className="text-slate-200">{activeStepData.output}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Visual Story strip ────────────────────────────────────────────── */}
      <div className="gov-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          {STORY.map((text, i) => (
            <React.Fragment key={i}>
              <span className={`${i === 0 || i === STORY.length - 1 ? 'font-semibold text-slate-800' : ''}`}>
                {text}
              </span>
              {i < STORY.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

    </div>
  );
}
