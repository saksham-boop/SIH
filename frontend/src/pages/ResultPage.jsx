import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, AlertOctagon,
  FileText, ChevronDown, Map, Upload,
} from 'lucide-react';
import { API_URL } from '../config';
import { buildBehindTheScenesSteps } from '../pipelineData';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function StatusBadge({ status, score }) {
  if (status === 'VALID') {
    return (
      <div className="flex items-center gap-2.5 badge-valid text-sm px-4 py-2">
        <CheckCircle2 className="w-5 h-5" />
        <span>VALID — Record Verified</span>
        <span className="ml-1 opacity-70">{score}%</span>
      </div>
    );
  }
  if (status === 'REVIEW_REQUIRED') {
    return (
      <div className="flex items-center gap-2.5 badge-review text-sm px-4 py-2">
        <AlertTriangle className="w-5 h-5" />
        <span>REVIEW REQUIRED — Discrepancy Detected</span>
        <span className="ml-1 opacity-70">{score}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 badge-risk text-sm px-4 py-2">
      <AlertOctagon className="w-5 h-5" />
      <span>HIGH RISK — Officer Review Required</span>
      <span className="ml-1 opacity-70">{score}%</span>
    </div>
  );
}

function ConfidencePill({ value }) {
  if (value == null || value === 0) return null;
  const v = Number(value);
  const cls = v >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : v >= 65 ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200';
  return (
    <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded ${cls}`}>
      {v}%
    </span>
  );
}

/** Expandable "Behind the scenes" pipeline stage row */
function BtsRow({ step, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] w-5 h-5 flex items-center justify-center bg-slate-100
                           text-slate-500 font-mono font-bold rounded flex-shrink-0">
            {idx + 1}
          </span>
          <span className="text-sm font-semibold text-slate-800">{step.title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="bg-slate-900 text-white px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
          <div>
            <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">Input</div>
            <p className="text-slate-200">{step.input}</p>
          </div>
          <div>
            <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">Processing</div>
            <ul className="space-y-1.5">
              {step.processing.map((p, i) => (
                <li key={i} className="text-slate-200 flex items-start gap-2">
                  <span className="text-sky-400 flex-shrink-0 mt-px">›</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-2">Output</div>
            <p className="text-slate-200">{step.output}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export default function ResultPage({ record, onNavigateMap, onUploadNew }) {
  const [showProcess, setShowProcess] = useState(false);
  const [actionDone,  setActionDone]  = useState(null);

  /* Empty state */
  if (!record) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-slate-500 text-sm">No record loaded yet.</p>
        <button
          onClick={onUploadNew}
          className="bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-800 transition-colors"
        >
          Upload a record
        </button>
      </div>
    );
  }

  /* ── Destructure API response ───────────────────────────────────────── */
  const {
    id,
    tracking_id      = '—',
    filename         = '—',
    validation_status = 'REVIEW_REQUIRED',
    overall_score    = 0,
    score_breakdown  = {},
    issues           = [],
    explainability   = [],
    extracted_fields = {},
    reference_record = {},
    recommended_actions = [],
    original_image_url,
    annotated_image_url,
    preprocessed_image_url,
    preprocessing_meta = {},
    ocr_confidence   = 0,
    word_count       = 0,
  } = record;

  const ef = extracted_fields;
  const sb = score_breakdown;

  const isValid  = validation_status === 'VALID';
  const isRisk   = validation_status === 'HIGH_RISK';
  const isReview = validation_status === 'REVIEW_REQUIRED';

  /* ── Validation checks shown in the "Why?" column ──────────────────── */
  const checks = [
    { label: 'Khasra number matches registry', pass: (sb.khasra_match ?? 0) >= 90 },
    { label: 'Owner name verified',            pass: (sb.owner_match  ?? 0) >= 70 },
    { label: 'Area within tolerance',          pass: (sb.area_match   ?? 0) >= 80 },
    { label: 'OCR confidence acceptable',      pass: (sb.ocr_quality  ?? 0) >= 65 },
    { label: 'No active legal encumbrance',    pass: (sb.historical_consistency ?? 0) >= 80 },
  ];

  /* Primary anomaly to highlight */
  const topExplain = explainability?.find(e => e?.difference) || explainability?.[0];

  /* Extracted fields to display (label, value, confidence) */
  const fieldRows = [
    { label: 'Owner',      value: ef.owner_name,    conf: ef.field_confidences?.owner_name    },
    { label: 'Father',     value: ef.father_name,   conf: ef.field_confidences?.father_name   },
    { label: 'Khasra No.', value: ef.khasra_number, conf: ef.field_confidences?.khasra_number },
    { label: 'Khata No.',  value: ef.khata_number,  conf: ef.field_confidences?.khata_number  },
    { label: 'Area',       value: ef.area ? `${ef.area} ha` : null, conf: ef.field_confidences?.area },
    { label: 'Village',    value: ef.village,       conf: ef.field_confidences?.village       },
    { label: 'District',   value: ef.district,      conf: null },
    { label: 'Land type',  value: ef.land_type,     conf: null },
  ].filter(f => f.value);

  /* ── Officer action handler ─────────────────────────────────────────── */
  const handleAction = async (decision) => {
    setActionDone(decision);
    if (id) {
      try {
        await fetch(`${API_URL}/api/records/${id}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, notes: '' }),
        });
      } catch { /* local state already updated */ }
    }
  };

  /* ── Behind-the-scenes step data ────────────────────────────────────── */
  const btsSteps = buildBehindTheScenesSteps(record);

  /* ── Active image URL (prefer annotated > preprocessed > original) ── */
  const imageUrl = (annotated_image_url || preprocessed_image_url || original_image_url)
    ? `${API_URL}${annotated_image_url || preprocessed_image_url || original_image_url}`
    : null;

  /* ── Score gauge color ──────────────────────────────────────────────── */
  const gaugeColor = isRisk ? 'bg-rose-500' : isReview ? 'bg-amber-500' : 'bg-emerald-500';
  const scoreColor = isRisk ? 'text-rose-600' : isReview ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Status banner ────────────────────────────────────────────────── */}
      <div className={`gov-card p-5 space-y-4 ${
        isRisk   ? 'border-l-4 border-l-rose-500' :
        isReview ? 'border-l-4 border-l-amber-500' :
                   'border-l-4 border-l-emerald-500'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StatusBadge status={validation_status} score={overall_score} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{tracking_id}</span>
            <button
              onClick={onUploadNew}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900
                         border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload className="w-3 h-3" />
              New upload
            </button>
          </div>
        </div>

        {/* Top anomaly highlight (only for non-valid records) */}
        {!isValid && topExplain && (
          <div className={`rounded-lg p-4 text-sm border ${
            isRisk ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`font-bold mb-2 ${isRisk ? 'text-rose-900' : 'text-amber-900'}`}>
              ⚠ {topExplain.title || 'Discrepancy detected'}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-700">
              {topExplain.digitized_value && (
                <span>Declared: <strong>{topExplain.digitized_value}</strong></span>
              )}
              {topExplain.reference_value && (
                <span>Registry: <strong>{topExplain.reference_value}</strong></span>
              )}
              {topExplain.difference && (
                <span className={`font-semibold ${isRisk ? 'text-rose-700' : 'text-amber-700'}`}>
                  Difference: {topExplain.difference}
                </span>
              )}
            </div>
            {topExplain.recommended_action && (
              <div className="mt-2 text-xs text-slate-600">
                Recommended: {topExplain.recommended_action}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3-column grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* LEFT — Document preview */}
        <div className="gov-card p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document</h3>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Land record document scan"
              className="w-full rounded-lg border border-slate-200 object-contain max-h-60"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-12 h-12 text-slate-300" />
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="not-italic text-slate-400">File</span>
              <span className="text-slate-700 truncate ml-2 max-w-[140px]" title={filename}>{filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="not-italic text-slate-400">OCR confidence</span>
              <span className="text-slate-700">{ocr_confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="not-italic text-slate-400">Words detected</span>
              <span className="text-slate-700">{word_count}</span>
            </div>
            {preprocessing_meta.skew_angle != null && (
              <div className="flex justify-between">
                <span className="not-italic text-slate-400">Skew corrected</span>
                <span className="text-slate-700">{preprocessing_meta.skew_angle}°</span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER — Extracted fields */}
        <div className="gov-card p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extracted Fields</h3>

          {fieldRows.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {fieldRows.map(({ label, value, conf }) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-slate-400">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{value}</span>
                    <ConfidencePill value={conf} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">No fields extracted</p>
          )}
        </div>

        {/* RIGHT — Why this result? */}
        <div className="gov-card p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Why this result?</h3>

          {/* Score gauge */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${scoreColor}`}>{overall_score}%</div>
            <div className="text-xs text-slate-400 mt-0.5">Validation score</div>
            <div className="mt-3 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`${gaugeColor} h-2 rounded-full transition-all duration-700`}
                style={{ width: `${overall_score}%` }}
              />
            </div>
          </div>

          {/* Individual checks */}
          <div className="space-y-2">
            {checks.map(({ label, pass }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                {pass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                )}
                <span className={pass ? 'text-slate-600' : 'text-slate-800 font-medium'}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Registry values */}
          {(reference_record?.khasra_no || reference_record?.owner_name) && (
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Registry record
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                {reference_record.owner_name && (
                  <div>Owner: <strong>{reference_record.owner_name}</strong></div>
                )}
                {reference_record.khasra_no && (
                  <div>Khasra: <strong>{reference_record.khasra_no}</strong></div>
                )}
                {reference_record.area_hectares && (
                  <div>Area: <strong>{reference_record.area_hectares} ha</strong></div>
                )}
                {reference_record.dispute_status && (
                  <div>
                    Status:{' '}
                    <strong className={
                      reference_record.dispute_status === 'CLEAR' ? 'text-emerald-700' : 'text-rose-700'
                    }>
                      {reference_record.dispute_status.replace(/_/g, ' ')}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Officer actions (only for non-VALID records) ─────────────────── */}
      {!isValid && (
        <div className="gov-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Officer Action</h3>

          {actionDone ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm">
              ✓ Decision recorded: <strong>{actionDone.replace(/_/g, ' ')}</strong> — entered in audit log.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleAction('APPROVED')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white
                           text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Record
              </button>
              <button
                onClick={() => handleAction('FIELD_SURVEY_REQUIRED')}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white
                           text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <Map className="w-4 h-4" />
                Order Field Survey
              </button>
              <button
                onClick={() => handleAction('REJECTED')}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white
                           text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Flag for Tribunal
              </button>
              <button
                onClick={() => onNavigateMap(ef.khasra_number)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 border border-slate-300
                           text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Map className="w-4 h-4" />
                View on Map
              </button>
            </div>
          )}

          {recommended_actions?.length > 0 && !actionDone && (
            <p className="text-xs text-slate-500">
              Recommended: {recommended_actions.join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* ── Behind the scenes expandable ─────────────────────────────────── */}
      <div className="gov-card overflow-hidden">
        <button
          onClick={() => setShowProcess(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50
                     transition-colors text-left"
        >
          <div>
            <span className="text-sm font-semibold text-slate-800">Show validation process</span>
            <span className="text-xs text-slate-400 ml-2">Input → Processing → Output for each stage</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
            showProcess ? 'rotate-180' : ''
          }`} />
        </button>

        {showProcess && (
          <div className="border-t border-slate-200">
            {btsSteps.map((step, idx) => (
              <BtsRow key={idx} step={step} idx={idx} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
