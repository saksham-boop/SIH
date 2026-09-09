import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GlobalSearchModal from './components/GlobalSearchModal';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import OfficerReviewPage from './pages/OfficerReviewPage';
import CadastralMapPage from './pages/CadastralMapPage';
import DemoModePage from './pages/DemoModePage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedMapKhasra, setSelectedMapKhasra] = useState('245/2');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Pre-load default demo record (Record B: Area Mismatch) so Review view is ready immediately
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/process-preset/area_mismatch', { method: 'POST' })
      .then(res => res.json())
      .then(data => setCurrentRecord(data))
      .catch(err => console.error("Could not pre-load initial demo record:", err));
  }, []);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleProcessingComplete = (result) => {
    setCurrentRecord(result);
    setActiveTab('review');
  };

  const handleSelectDemoCase = (demoRecord) => {
    setCurrentRecord(demoRecord);
    setActiveTab('review');
  };

  const handleSelectSearchResult = async (refRecord) => {
    try {
      // Find or generate processed record for this Khasra
      const res = await fetch(`http://127.0.0.1:8000/api/process-preset/clean_record`, { method: 'POST' });
      const data = await res.json();
      data.reference_record = refRecord;
      data.extracted_fields.khasra_number = refRecord.khasra_no;
      data.extracted_fields.owner_name = refRecord.owner_name;
      data.extracted_fields.area = refRecord.area_hectares;
      setCurrentRecord(data);
      setActiveTab('review');
    } catch (err) {
      console.error("Search result load error:", err);
    }
  };

  const handleNavigateReview = async (recordId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/records/${recordId}`);
      const data = await res.json();
      setCurrentRecord(data.record || currentRecord);
      setActiveTab('review');
    } catch (err) {
      setActiveTab('review');
    }
  };

  const handleNavigateMap = (khasra) => {
    setSelectedMapKhasra(khasra || '245/2');
    setActiveTab('map');
  };

  const handleSelectParcelFromMap = (khasra) => {
    // If selecting 245/7, load khasra mismatch preset, if 312/1 load mutation preset, etc.
    if (khasra === '245/7') {
      fetch('http://127.0.0.1:8000/api/process-preset/khasra_mismatch', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          setCurrentRecord(data);
          setActiveTab('review');
        });
    } else if (khasra === '312/1') {
      fetch('http://127.0.0.1:8000/api/process-preset/mutation_issue', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          setCurrentRecord(data);
          setActiveTab('review');
        });
    } else {
      setActiveTab('review');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Government Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        reviewCount={currentRecord ? 1 : 0}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigateReview={handleNavigateReview}
            onNavigateUpload={() => setActiveTab('upload')}
            onNavigateDemo={() => setActiveTab('demo')}
          />
        )}

        {activeTab === 'upload' && (
          <UploadPage onProcessingComplete={handleProcessingComplete} />
        )}

        {activeTab === 'review' && (
          <OfficerReviewPage
            recordData={currentRecord}
            onActionSuccess={(decision) => console.log("Recorded:", decision)}
            onNavigateMap={handleNavigateMap}
          />
        )}

        {activeTab === 'map' && (
          <CadastralMapPage
            selectedKhasra={selectedMapKhasra}
            onSelectParcelForReview={handleSelectParcelFromMap}
          />
        )}

        {activeTab === 'demo' && (
          <DemoModePage onSelectDemoCase={handleSelectDemoCase} />
        )}
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectRecord={handleSelectSearchResult}
      />

      {/* Public Sector Official Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="font-medium text-slate-300">
              National Informatics Centre (NIC) • Land Records Computerization Division
            </span>
          </div>
          <div className="text-[11px] text-slate-500 text-center sm:text-right">
            Designed for Smart India Hackathon (SIH) • AI-Assisted Decision Support System • Disclaimer: Final legal decisions remain with authorized revenue officials.
          </div>
        </div>
      </footer>
    </div>
  );
}
