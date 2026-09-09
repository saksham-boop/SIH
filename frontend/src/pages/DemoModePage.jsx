import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ArrowRight, 
  FileText, 
  ShieldCheck, 
  Clock,
  Play,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function DemoModePage({ onSelectDemoCase }) {
  const [demoCases, setDemoCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/demo-cases')
      .then(res => res.json())
      .then(data => setDemoCases(data || []))
      .catch(err => console.error("Demo cases fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleRunDemo = async (presetId) => {
    setLoadingId(presetId);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/process-preset/${presetId}`, {
        method: "POST"
      });
      const data = await res.json();
      onSelectDemoCase(data);
    } catch (err) {
      console.error("Demo load error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* SIH Presentation Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-white p-6 rounded-2xl border border-amber-700/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400 text-amber-950 font-black text-[11px] px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
              SIH Evaluator Mode
            </span>
            <span className="text-amber-200 text-xs font-mono">7 Pre-Configured Test Scenarios</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white font-['Outfit',sans-serif]">
            Demonstration Presets & Anomaly Showcases
          </h2>
          <p className="text-xs text-amber-100/80 max-w-2xl mt-1">
            Engineered specifically for Smart India Hackathon jury evaluations. Test clean concordances, numeric area variances, orthographic fuzzy matching, boundary conflicts, and legal encumbrances with 100% deterministic reliability.
          </p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/30 text-xs space-y-1.5 flex-shrink-0">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Recommended 3-Min Jury Pitch
          </div>
          <p className="text-[11px] text-slate-300">
            1. Show Case 1 (Valid baseline)<br />
            2. Show Case 2 (Area mismatch +0.15 ha)<br />
            3. Show Case 3 (Fuzzy owner name 94%)<br />
            4. Show Case 4 or 7 (Boundary conflict / Stay)
          </p>
        </div>
      </div>

      {/* Grid of 7 SIH Judging Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoCases.map((c) => {
          const isRisk = c.expected_status === 'HIGH_RISK';
          const isReview = c.expected_status === 'REVIEW_REQUIRED';
          const badgeClass = isRisk ? 'badge-risk' : isReview ? 'badge-review' : 'badge-valid';
          const isLoading = loadingId === c.id;

          return (
            <div
              key={c.id}
              className={`gov-card p-5 flex flex-col justify-between border-t-4 transition-all duration-150 hover:-translate-y-1 ${
                isRisk ? 'border-t-rose-600' : isReview ? 'border-t-amber-500' : 'border-t-emerald-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 font-['Outfit',sans-serif]">
                    {c.title}
                  </h3>
                  <span className={badgeClass}>
                    {isRisk ? <AlertOctagon className="w-3 h-3" /> : isReview ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {c.expected_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {c.description}
                </p>

                {/* Key Attributes Box */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khasra / Khata:</span>
                    <strong className="text-slate-900 font-mono">{c.khasra} (Khata {c.khata})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant / Owner:</span>
                    <strong className="text-slate-900">{c.owner}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Digitized vs Ref Area:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {c.area_ha} ha <span className="text-slate-400">vs</span> {c.ref_area_ha} ha
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-sky-950 font-semibold">
                    <span>Expected AI Score:</span>
                    <span className="font-mono text-emerald-700 font-bold">{c.expected_score}%</span>
                  </div>
                </div>

                {/* Highlight Notice */}
                <div className="text-[11px] bg-amber-50/80 border border-amber-200 text-amber-950 p-2 rounded flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{c.highlight}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleRunDemo(c.id)}
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-sky-950 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Loading Analysis...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>Inspect in Review View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Philosophy Statement Callout Card */}
      <div className="gov-card p-6 bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
            Core SIH Hackathon Value Proposition
          </span>
          <blockquote className="text-base font-bold text-slate-100 italic">
            “The system does not just digitize land records. It identifies which digitized records may not be trustworthy yet — and explains why with transparent evidence.”
          </blockquote>
          <p className="text-xs text-slate-400">
            Eliminating arbitrary black-box AI decisions and delivering actionable administrative ground-truthing recommendations to revenue officers.
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="text-center p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
            <span className="text-xs font-bold text-white block">Audit-Ready</span>
            <span className="text-[10px] text-slate-400">U.P. Revenue Code 2006</span>
          </div>
        </div>
      </div>

    </div>
  );
}
