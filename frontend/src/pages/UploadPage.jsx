import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

/* ── 3 demo records shown on the upload screen ───────────────────────────── */
const DEMO_RECORDS = [
  {
    id: 'clean_record',
    label: 'Clean Record',
    description: 'Full concordance · zero discrepancies',
    status: 'VALID',
    khasra: '245/2',
  },
  {
    id: 'area_mismatch',
    label: 'Area Mismatch',
    description: 'Declared 1.20 ha · registry shows 1.05 ha',
    status: 'REVIEW_REQUIRED',
    khasra: '245/2',
  },
  {
    id: 'khasra_mismatch',
    label: 'Khasra / Owner Mismatch',
    description: 'Plot identity conflict · HIGH risk flag',
    status: 'HIGH_RISK',
    khasra: '245/7',
  },
];

const STATUS_BADGE = {
  VALID:            { cls: 'badge-valid',   Icon: CheckCircle2 },
  REVIEW_REQUIRED:  { cls: 'badge-review',  Icon: AlertTriangle },
  HIGH_RISK:        { cls: 'badge-risk',    Icon: AlertOctagon },
};

export default function UploadPage({ onStartProcessing, onStartDemo }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  /* ── File selection ────────────────────────────────────────────────────── */

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  const selectFile = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      setError('Please select a JPG, PNG, or PDF file.');
      return;
    }
    setError(null);
    setFile(f);
    if (f.type !== 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const handleChange = (e) => selectFile(e.target.files?.[0]);

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  /* ── Submit ────────────────────────────────────────────────────────────── */

  const handleSubmit = () => {
    if (!file) { setError('Please select a file first.'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', 'Jamabandi / RoR');
    fd.append('language', 'English + Hindi');
    onStartProcessing(fd);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">

      {/* Page title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Upload Land Record</h2>
        <p className="text-sm text-slate-500">
          Upload a scanned deed, Jamabandi, or Khasra extract to run the full validation pipeline.
        </p>
      </div>

      {/* ── Drop zone ──────────────────────────────────────────────────────── */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
            ${dragOver
              ? 'border-sky-400 bg-sky-50'
              : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50/40 bg-white'
            }`}
        >
          <UploadCloud className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-base font-semibold text-slate-700">Drop land record here</p>
          <p className="text-sm text-slate-400 mt-1">JPG, PNG, or PDF</p>
          <button
            type="button"
            className="mt-4 text-xs bg-slate-900 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        /* ── File selected preview card ────────────────────────────────── */
        <div className="gov-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{file.name}</div>
                <div className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(0)} KB · {file.type.split('/')[1]?.toUpperCase()}
                </div>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-48 object-contain rounded-lg border border-slate-200"
            />
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Run Validation Pipeline
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-rose-600 text-center">{error}</p>
      )}

      {/* ── Demo records ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">Or try a demo record</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_RECORDS.map(rec => {
            const { cls, Icon } = STATUS_BADGE[rec.status];
            return (
              <button
                key={rec.id}
                onClick={() => onStartDemo(rec.id)}
                className="gov-card p-4 text-left hover:border-sky-300 hover:shadow-md transition-all group"
              >
                <span className={cls}>
                  <Icon className="w-3 h-3" />
                  {rec.status.replace(/_/g, ' ')}
                </span>
                <div className="text-sm font-semibold text-slate-900 mt-2">{rec.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{rec.description}</div>
                <div className="text-xs text-slate-400 mt-2 font-mono">Khasra {rec.khasra}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
