import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import './App.css';
import Navbar from './components/Navbar';
import GlobalSearchModal from './components/GlobalSearchModal';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultPage from './pages/ResultPage';
import CadastralMapPage from './pages/CadastralMapPage';
import DemoModePage from './pages/DemoModePage';

export default function App() {
  // Main navigation state
  const [activeTab, setActiveTab] = useState('dashboard');
  // Current validated record (shown in ResultPage)
  const [currentRecord, setCurrentRecord] = useState(null);
  // Job queued for processing — { type: 'upload', formData } | { type: 'demo', presetId }
  const [processingJob, setProcessingJob] = useState(null);
  // Cadastral map selection
  const [selectedMapKhasra, setSelectedMapKhasra] = useState('245/2');
  // Global search modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Ctrl+K global search shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Navigation handlers ─────────────────────────────────────────────── */

  const handleStartUpload = (formData) => {
    setProcessingJob({ type: 'upload', formData });
    setActiveTab('processing');
  };

  const handleStartDemo = (presetId) => {
    setProcessingJob({ type: 'demo', presetId });
    setActiveTab('processing');
  };

  const handleProcessingComplete = (record) => {
    setCurrentRecord(record);
    setActiveTab('result');
  };

  const handleNavigateMap = (khasra) => {
    setSelectedMapKhasra(khasra || '245/2');
    setActiveTab('map');
  };

  const handleSelectParcelFromMap = (khasra) => {
    const presetMap = { '245/7': 'khasra_mismatch', '312/1': 'mutation_issue' };
    handleStartDemo(presetMap[khasra] || 'clean_record');
  };

  const handleSelectSearchResult = async (refRecord) => {
    try {
      const res = await fetch(`${API_URL}/api/process-preset/clean_record`, { method: 'POST' });
      const data = await res.json();
      data.reference_record  = refRecord;
      data.extracted_fields.khasra_number = refRecord.khasra_no;
      data.extracted_fields.owner_name    = refRecord.owner_name;
      data.extracted_fields.area          = refRecord.area_hectares;
      setCurrentRecord(data);
      setActiveTab('result');
    } catch (err) {
      console.error('Search result load error:', err);
    }
  };

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        hasResult={!!currentRecord}
      />

      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            onStartUpload={() => setActiveTab('upload')}
            onStartDemo={handleStartDemo}
          />
        )}

        {activeTab === 'upload' && (
          <UploadPage
            onStartProcessing={handleStartUpload}
            onStartDemo={handleStartDemo}
          />
        )}

        {activeTab === 'processing' && processingJob && (
          <ProcessingPage
            job={processingJob}
            onComplete={handleProcessingComplete}
          />
        )}

        {activeTab === 'result' && (
          <ResultPage
            record={currentRecord}
            onNavigateMap={handleNavigateMap}
            onUploadNew={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'map' && (
          <CadastralMapPage
            selectedKhasra={selectedMapKhasra}
            onSelectParcelForReview={handleSelectParcelFromMap}
          />
        )}

        {activeTab === 'demo' && (
          <DemoModePage onSelectDemo={handleStartDemo} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-slate-300">
              National Informatics Centre (NIC) · Land Records Division
            </span>
          </div>
          <span className="text-xs text-slate-500 text-center">
            Smart India Hackathon · AI Decision Support · Final authority rests with authorized revenue officials.
          </span>
        </div>
      </footer>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectRecord={handleSelectSearchResult}
      />
    </div>
  );
}
