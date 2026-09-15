import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Search, X, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight, ExternalLink } from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose, onSelectRecord }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/records?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.reference_records || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-sky-700 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Khasra (e.g. 245/2), Owner Name, Village, or Khata No..."
            className="w-full bg-transparent border-0 text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded font-medium ml-2"
          >
            ESC
          </button>
        </div>

        {/* Search Quick Suggestions */}
        {!query && (
          <div className="p-6 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-2">Try quick search examples:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['245/2', 'Ramesh Kumar', 'Rampur', '312/1', '104', 'UP-LKO-2024-002'].map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="bg-slate-100 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 px-2.5 py-1 rounded-md text-xs transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {loading && (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
              Searching district land registry...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching land records found for "<strong className="text-slate-700">{query}</strong>".
            </div>
          )}

          {!loading && results.map((rec) => {
            const isReview = rec.khasra_no === '245/2';
            const isRisk = rec.dispute_status !== 'CLEAR' || rec.khasra_no === '245/7' || rec.khasra_no === '312/1';
            const statusLabel = isRisk ? 'HIGH RISK' : isReview ? 'REVIEW REQUIRED' : 'VALID';
            const statusBadgeClass = isRisk ? 'badge-risk' : isReview ? 'badge-review' : 'badge-valid';

            return (
              <div
                key={rec.record_id}
                onClick={() => {
                  onSelectRecord(rec);
                  onClose();
                }}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      Parcel {rec.khasra_no}
                    </span>
                    <span className={statusBadgeClass}>
                      {isRisk ? <AlertOctagon className="w-3 h-3" /> : isReview ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {statusLabel}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {rec.record_id}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span>Owner: <strong className="text-slate-800">{rec.owner_name}</strong></span>
                    <span>•</span>
                    <span>Area: <strong className="text-slate-800">{rec.area_hectares} ha</strong></span>
                    <span>•</span>
                    <span>Village: <strong className="text-slate-800">{rec.village}</strong> ({rec.tehsil})</span>
                  </div>

                  {rec.dispute_status !== 'CLEAR' && (
                    <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      Status: {rec.dispute_status.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>

                <div className="text-right flex items-center gap-2 text-sky-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold">Inspect</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex justify-between items-center">
          <span>Official Bhulekh Registry Mirror</span>
          <span>Click any parcel to inspect</span>
        </div>
      </div>
    </div>
  );
}
