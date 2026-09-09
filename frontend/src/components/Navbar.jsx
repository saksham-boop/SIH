import React from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  LayoutDashboard, 
  MapPin, 
  Sparkles, 
  Search,
  FileCheck2,
  CheckCircle2,
  Building2
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSearch, reviewCount = 1 }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Government Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium tracking-wide">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Government of India • Ministry of Rural Development • Department of Land Resources</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-semibold">SIH 2024–2026 Internal Prototype</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Backend: <strong className="text-emerald-400 font-mono">FastAPI :8000</strong></span>
          <span>OCR: <strong className="text-slate-200 font-mono">Tesseract v5.5.3</strong></span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">English + हिन्दी</span>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white shadow-inner">
        <div className="flex items-center gap-4">
          {/* Official Emblem Shield */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-['Outfit',sans-serif]">
                Intelligent Land Record Validation System
              </h1>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                AI / OCR Verify
              </span>
            </div>
            <p className="text-xs text-sky-200/80 font-normal">
              AI-assisted digitization, validation and anomaly detection • Revenue Department Decision Support
            </p>
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-700/80 shadow-sm transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span>Search Khasra, Owner, Village...</span>
            <kbd className="hidden sm:inline-block bg-slate-950/60 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">Ctrl+K</kbd>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between overflow-x-auto">
        <nav className="flex space-x-1 py-1.5" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-sky-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-sky-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Land Record</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all relative ${
              activeTab === 'review'
                ? 'bg-sky-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Review Record</span>
            {reviewCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'map'
                ? 'bg-sky-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Cadastral GIS Map</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'demo'
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/40'
                : 'text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Demo Records (Judges Mode)</span>
            <span className="bg-amber-900/40 text-amber-200 text-[10px] px-1.5 py-0.5 rounded font-mono">7 Cases</span>
          </button>
        </nav>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Tehsil: <strong>Sadar</strong>, Dist: <strong>Lucknow</strong></span>
        </div>
      </div>
    </header>
  );
}
