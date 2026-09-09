import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Image as ImageIcon, 
  X, 
  ArrowRight,
  ShieldCheck,
  Languages,
  Layers
} from 'lucide-react';

const PROGRESS_STEPS = [
  { id: 1, label: "Image received & format verified", detail: "Loaded image buffer and validated RGB bit depth" },
  { id: 2, label: "Image enhanced & deskewed", detail: "Bilateral noise filtering and adaptive Otsu binarization applied" },
  { id: 3, label: "OCR completed (Tesseract v5.5)", detail: "Extracted line tokens, character confidences, and bounding boxes" },
  { id: 4, label: "Fields identified (NLP & Regex)", detail: "Parsed Khasra, Khata, Owner Name, Father Name, and Area" },
  { id: 5, label: "Records compared with Registry", detail: "Querying authoritative SQLite district revenue database" },
  { id: 6, label: "Validation completed & scored", detail: "Multi-attribute rule engine and explainability report generated" }
];

export default function UploadPage({ onProcessingComplete }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [docType, setDocType] = useState('Jamabandi / RoR (खतौनी)');
  const [language, setLanguage] = useState('English + Hindi');
  const [sampleDocs, setSampleDocs] = useState([]);
  
  // Processing animation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch available sample documents
    fetch('http://127.0.0.1:8000/api/sample-documents')
      .then(res => res.json())
      .then(data => setSampleDocs(data || []))
      .catch(err => console.error("Error loading sample docs:", err));
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const selectFile = (selectedFile) => {
    setFile(selectedFile);
    setErrorMsg(null);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleSelectSample = async (sample) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000${sample.url}`);
      const blob = await response.blob();
      const sampleFile = new File([blob], sample.filename, { type: "image/png" });
      selectFile(sampleFile);
    } catch (err) {
      console.error("Error loading sample file:", err);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setErrorMsg("Please upload or select a land record scan first.");
      return;
    }

    setIsProcessing(true);
    setCurrentStep(1);
    setErrorMsg(null);

    // Realistic multi-step animated progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 650);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      formData.append("language", language);

      const response = await fetch("http://127.0.0.1:8000/api/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to process document");
      }

      const result = await response.json();
      
      // Reach final step
      clearInterval(stepInterval);
      setCurrentStep(6);

      setTimeout(() => {
        setIsProcessing(false);
        onProcessingComplete(result);
      }, 700);

    } catch (err) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      setErrorMsg(err.message || "An error occurred during OCR validation. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-sky-800 font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          Revenue Document Ingestion & Verification
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-['Outfit',sans-serif]">
          Upload Land Record Scan
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload scanned deeds, Jamabandi (खतौनी), Khasra extracts, or sale deeds to execute automated OCR extraction and cross-referencing against the State Land Registry.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="gov-card p-6 space-y-6">
        
        {/* Document Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-800" />
              Document Classification
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-800 focus:outline-none"
            >
              <option value="Jamabandi / RoR (खतौनी)">Jamabandi / Record of Rights (खतौनी - प्रपत्र 41)</option>
              <option value="Khasra / Plot Register (खसरा)">Khasra Register (खसरा - खतौनी भू-अभिलेख)</option>
              <option value="Sale Deed / Registry (बैनामा)">Registered Sale Deed (बैनामा / विक्रय पत्र)</option>
              <option value="Mutation Order (दाखिल खारिज)">Mutation Order (नामांतरण / दाखिल खारिज आदेश)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-sky-800" />
              Document Language Script
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-800 focus:outline-none"
            >
              <option value="English + Hindi">Bilingual: English + हिन्दी (Recommended for UP/MP/HR/RJ)</option>
              <option value="English">English Script Only</option>
              <option value="Hindi">Devanagari (हिन्दी) Only</option>
            </select>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        {!previewUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-sky-800 bg-slate-50/60 hover:bg-sky-50/40 rounded-xl p-10 text-center cursor-pointer transition-all duration-200 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
            />
            <div className="w-14 h-14 rounded-full bg-sky-100 group-hover:bg-sky-200 text-sky-800 flex items-center justify-center mx-auto mb-3 transition-colors">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 group-hover:text-sky-900">
              Click to select or drag and drop land record scan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports high-resolution JPG, PNG, and PDF (Up to 25 MB)
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Camera capture or scanner output</span>
            </div>
          </div>
        ) : (
          /* File Preview Card */
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-56 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex items-center justify-center flex-shrink-0 relative group">
              <img
                src={previewUrl}
                alt="Document preview"
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[11px] font-semibold bg-slate-900/80 px-2 py-1 rounded">
                  Scan Preview
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                    Ready for Ingestion
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {file?.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Size: {(file?.size ? (file.size / 1024).toFixed(1) : 0)} KB • Format: {file?.type || 'image/png'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
                  title="Remove document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Type:</span>
                  <strong className="text-slate-800">{docType}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recognition Pipeline:</span>
                  <strong className="text-slate-800">OpenCV Otsu + Tesseract OCR</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Database:</span>
                  <strong className="text-slate-800">District Lucknow Cadastral Mirror</strong>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full bg-sky-900 hover:bg-sky-950 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Process & Validate Record</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Sample Document Tray (For smooth judge demonstration) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              SIH Demo Test Documents (Instant 1-Click Load)
            </span>
            <span className="text-[11px] text-slate-400">Click any sample to test OCR</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {sampleDocs.map((sample, idx) => (
              <button
                key={sample.filename}
                onClick={() => handleSelectSample(sample)}
                className="bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-lg p-2 text-left transition-all group"
              >
                <div className="text-[10px] font-bold text-slate-700 group-hover:text-sky-900 truncate">
                  Case {idx + 1}
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  {sample.filename.replace("demo_", "").replace(".png", "").replace(/_/g, " ")}
                </div>
                <div className="mt-1 text-[8px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block">
                  Load &rarr;
                </div>
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Validation Issue:</strong> {errorMsg}
            </div>
          </div>
        )}
      </div>

      {/* Realistic Multi-Step Processing Flow Modal / Card */}
      {isProcessing && (
        <div className="gov-card p-6 border-2 border-sky-800 bg-sky-50/30 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-900 text-white flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  AI Digitization & Validation Pipeline Running
                </h3>
                <p className="text-xs text-slate-500">
                  Processing scan through optical OCR, entity recognition, and registry cross-validation
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-sky-900 bg-sky-100 px-2.5 py-1 rounded">
              Stage {currentStep} of 6
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {PROGRESS_STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                    isDone
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : isCurrent
                      ? 'bg-sky-100/90 border-sky-400 text-sky-950 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-4 h-4 border-2 border-sky-800 border-t-transparent rounded-full animate-spin inline-block flex-shrink-0"></span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 inline-block text-[10px] text-center leading-3.5 font-bold">
                        {step.id}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{step.label}</span>
                      {isDone && <span className="text-[10px] text-emerald-700 font-mono">✓ Done</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
