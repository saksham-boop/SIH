import React from 'react';
import { Play, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

/* ── 7 SIH demo scenarios ────────────────────────────────────────────────── */
const DEMO_CASES = [
  {
    id: 'clean_record',
    status: 'VALID',
    title: 'Clean & Valid Record',
    headline: '100% field concordance · zero discrepancies',
    khasra: '245/2', owner: 'Ramesh Kumar', area: '1.05 ha',
    score: 97.8,
    highlight: 'Eligible for immediate automated revenue endorsement.',
  },
  {
    id: 'area_mismatch',
    status: 'REVIEW_REQUIRED',
    title: 'Area Mismatch (+14.3%)',
    headline: 'Declared 1.20 ha · registry shows 1.05 ha',
    khasra: '245/2', owner: 'Ramesh Kumar', area: '1.20 ha declared',
    score: 78.5,
    highlight: 'Ground truthing by Revenue Inspector / Patwari recommended.',
  },
  {
    id: 'owner_variation',
    status: 'REVIEW_REQUIRED',
    title: 'Owner Name Variation (94% fuzzy)',
    headline: 'OCR: "Ramesh Kumar" · Registry: "Ramesh Kr."',
    khasra: '246/1', owner: 'Ramesh Kumar / Ramesh Kr.', area: '0.88 ha',
    score: 86.2,
    highlight: 'Identity check against Aadhaar / Voter ID recommended.',
  },
  {
    id: 'khasra_mismatch',
    status: 'HIGH_RISK',
    title: 'Khasra Mismatch (Plot Conflict)',
    headline: 'Applicant claims 245/7 over registered parcel 245/2',
    khasra: '245/7', owner: 'Ramesh Kumar', area: '1.05 ha',
    score: 48.0,
    highlight: 'Prevents potential fraudulent double-claim or boundary encroachment.',
  },
  {
    id: 'mutation_issue',
    status: 'HIGH_RISK',
    title: 'Active Legal Encumbrance',
    headline: 'Civil court injunction + contested inheritance',
    khasra: '312/1', owner: 'Vikram Singh', area: '2.10 ha',
    score: 52.0,
    highlight: 'Active stay detected. Halts unauthorised registration until decree.',
  },
  {
    id: 'degraded_scan',
    status: 'REVIEW_REQUIRED',
    title: 'Degraded Scan / Low OCR Confidence',
    headline: 'Aged archive scan with faded ink — OCR at 58%',
    khasra: '245/2', owner: 'Ramesh Kumar', area: '1.05 ha',
    score: 74.0,
    highlight: 'Officer guided to verify smudged numerical fields manually.',
  },
  {
    id: 'multiple_anomalies',
    status: 'HIGH_RISK',
    title: 'Multiple Critical Anomalies',
    headline: '+123% area inflation · owner mismatch · boundary litigation',
    khasra: '245/7', owner: 'Dinesh Kumar Verma', area: '1.45 ha claimed / 0.65 ha registry',
    score: 34.5,
    highlight: 'Automatic referral to District Anti-Fraud Land Cell.',
  },
];

const STATUS_CONFIG = {
  VALID:           { Icon: CheckCircle2, cls: 'badge-valid',   bg: 'bg-emerald-50 border-emerald-200' },
  REVIEW_REQUIRED: { Icon: AlertTriangle, cls: 'badge-review', bg: 'bg-amber-50 border-amber-200' },
  HIGH_RISK:       { Icon: AlertOctagon,  cls: 'badge-risk',   bg: 'bg-rose-50 border-rose-200' },
};

export default function DemoModePage({ onSelectDemo }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Page header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Demo Scenarios</h2>
        <p className="text-sm text-slate-500">
          Seven pre-configured SIH judging scenarios. Click any card to run the full
          validation pipeline instantly.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_CASES.map((demo, idx) => {
          const { Icon, cls, bg } = STATUS_CONFIG[demo.status];
          return (
            <button
              key={demo.id}
              onClick={() => onSelectDemo(demo.id)}
              className="gov-card text-left p-5 hover:shadow-md hover:border-sky-300 transition-all group"
            >
              {/* Case number + status badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 font-mono">CASE {idx + 1}</span>
                <span className={cls}>
                  <Icon className="w-3 h-3" />
                  {demo.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Title */}
              <div className="text-sm font-bold text-slate-900 mb-1">{demo.title}</div>
              <div className="text-xs text-slate-500 mb-3 leading-relaxed">{demo.headline}</div>

              {/* Field summary */}
              <div className={`rounded-lg border px-3 py-2 mb-3 text-xs space-y-1 ${bg}`}>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khasra</span>
                  <span className="font-mono font-semibold text-slate-800">{demo.khasra}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Owner</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[140px] truncate" title={demo.owner}>
                    {demo.owner}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Area</span>
                  <span className="font-mono font-semibold text-slate-800">{demo.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected score</span>
                  <span className={`font-bold font-mono ${
                    demo.status === 'VALID' ? 'text-emerald-700' :
                    demo.status === 'REVIEW_REQUIRED' ? 'text-amber-700' : 'text-rose-700'
                  }`}>{demo.score}%</span>
                </div>
              </div>

              {/* Highlight */}
              <p className="text-[11px] text-slate-500 leading-relaxed">{demo.highlight}</p>

              {/* CTA */}
              <div className="mt-4 flex items-center gap-1.5 text-sky-700 text-xs font-semibold group-hover:gap-2.5 transition-all">
                <Play className="w-3.5 h-3.5 fill-sky-700" />
                Run this scenario
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
