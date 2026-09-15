import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { 
  MapPin, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  ArrowRight, 
  Compass,
  Maximize2,
  Filter
} from 'lucide-react';

export default function CadastralMapPage({ selectedKhasra, onSelectParcelForReview }) {
  const [parcels, setParcels] = useState([]);
  const [activeParcel, setActiveParcel] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/cadastral-map?village=Rampur`)
      .then(res => res.json())
      .then(data => {
        setParcels(data.parcels || []);
        // If selectedKhasra passed, pre-select it
        if (selectedKhasra) {
          const match = data.parcels?.find(p => p.khasra_no === selectedKhasra);
          if (match) setActiveParcel(match);
        } else if (data.parcels?.length > 0) {
          // Default to 245/2 (the core review parcel)
          const target = data.parcels.find(p => p.khasra_no === '245/2') || data.parcels[0];
          setActiveParcel(target);
        }
      })
      .catch(err => {
        console.error("Map fetch error:", err);
        // Static fallback parcel data for when backend is cold-starting
        const fallbackParcels = [
          { khasra_no: '245/1', village: 'Rampur', owner_name: 'Ramesh Kumar', area_hectares: 0.95, status: 'VALID', dispute_flag: false, polygon_points: [[30,30],[170,30],[170,180],[30,180]], center_x: 100, center_y: 105, reference_record_id: 'UP-LKO-2024-001' },
          { khasra_no: '245/2', village: 'Rampur', owner_name: 'Ramesh Kumar', area_hectares: 1.05, status: 'REVIEW_REQUIRED', dispute_flag: false, polygon_points: [[180,30],[370,30],[370,180],[180,180]], center_x: 275, center_y: 105, reference_record_id: 'UP-LKO-2024-002' },
          { khasra_no: '245/7', village: 'Rampur', owner_name: 'Sunil Verma', area_hectares: 0.65, status: 'HIGH_RISK', dispute_flag: true, polygon_points: [[380,30],[540,30],[540,180],[380,180]], center_x: 460, center_y: 105, reference_record_id: 'UP-LKO-2024-007' },
          { khasra_no: '312/1', village: 'Rampur', owner_name: 'Vikram Singh', area_hectares: 2.10, status: 'HIGH_RISK', dispute_flag: true, polygon_points: [[30,190],[240,190],[240,350],[30,350]], center_x: 135, center_y: 270, reference_record_id: 'UP-LKO-2024-016' },
          { khasra_no: '246/1', village: 'Rampur', owner_name: 'Ramesh Kr.', area_hectares: 0.88, status: 'REVIEW_REQUIRED', dispute_flag: false, polygon_points: [[250,190],[540,190],[540,350],[250,350]], center_x: 395, center_y: 270, reference_record_id: 'UP-LKO-2024-006' },
          { khasra_no: '107/A', village: 'Rampur', owner_name: 'Sunita Devi', area_hectares: 1.75, status: 'VALID', dispute_flag: false, polygon_points: [[30,360],[240,360],[240,480],[30,480]], center_x: 135, center_y: 420, reference_record_id: 'UP-LKO-2024-007' },
          { khasra_no: '54/1', village: 'Rampur', owner_name: 'Harishankar Tiwari', area_hectares: 2.45, status: 'VALID', dispute_flag: false, polygon_points: [[250,360],[540,360],[540,480],[250,480]], center_x: 395, center_y: 420, reference_record_id: 'UP-LKO-2024-010' }
        ];
        setParcels(fallbackParcels);
        const target = fallbackParcels.find(p => p.khasra_no === (selectedKhasra || '245/2')) || fallbackParcels[0];
        setActiveParcel(target);
      })
      .finally(() => setLoading(false));
  }, [selectedKhasra]);

  const filteredParcels = parcels.filter(p => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Map Header Banner */}
      <div className="gov-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-sky-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
              Cadastral GIS Visualization (शजरा मानचित्र)
            </span>
            <span className="text-xs text-slate-500">
              Village: <strong className="text-slate-800">Rampur</strong>, Tehsil: <strong className="text-slate-800">Sadar</strong>, District: <strong className="text-slate-800">Lucknow</strong>
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Interactive Cadastral Parcel Map & Boundary Audit
          </h2>
          <p className="text-xs text-slate-500">
            Spatial representation of surveyed revenue plots color-coded by OCR validation and title status.
          </p>
        </div>

        {/* Map Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            {['ALL', 'VALID', 'REVIEW_REQUIRED', 'HIGH_RISK'].map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  filterStatus === f ? 'bg-sky-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' ? 'All Plots' : f === 'VALID' ? 'Valid' : f === 'REVIEW_REQUIRED' ? 'Review' : 'High Risk'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map & Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Map Canvas Card (8 cols) */}
        <div className="lg:col-span-8 gov-card overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-800" />
              <span className="font-bold text-slate-700">Survey Grid: Sheet No. 04 / Rampur Rural</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Valid</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Review Required</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span> High Risk / Dispute</span>
            </div>
          </div>

          {/* SVG Cadastral Map Container */}
          <div className="bg-slate-900 p-6 flex items-center justify-center relative min-h-[520px] overflow-hidden select-none">
            {/* Background grid lines to mimic survey sheet */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />

            <svg viewBox="0 0 650 560" className="w-full max-w-[620px] h-auto drop-shadow-2xl">
              {/* Surrounding Village Outline Boundary */}
              <polygon
                points="80,70 580,70 580,510 80,510"
                fill="none"
                stroke="#475569"
                strokeWidth="3"
                strokeDasharray="6,4"
              />

              {/* Village Label */}
              <text x="330" y="55" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="bold" letterSpacing="2">
                VILLAGE RAMPUR (मौजा रामपुर) • CADASTRE 2021-2022
              </text>

              {/* Canal / Road feature */}
              <path
                d="M 60,355 Q 320,360 600,355"
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                opacity="0.6"
              />
              <text x="540" y="348" fill="#38bdf8" fontSize="9" fontWeight="bold">
                Chak Marg / Canal
              </text>

              {/* Parcel Polygons */}
              {parcels.map((parcel) => {
                const points = parcel.polygon_points.map(pt => `${pt[0]},${pt[1]}`).join(' ');
                const isSelected = activeParcel?.khasra_no === parcel.khasra_no;
                const isDimmed = filterStatus !== 'ALL' && parcel.status !== filterStatus;

                let fillColor = "rgba(16, 185, 129, 0.25)";
                let strokeColor = "#10b981";
                if (parcel.status === 'REVIEW_REQUIRED') {
                  fillColor = "rgba(245, 158, 11, 0.35)";
                  strokeColor = "#f59e0b";
                } else if (parcel.status === 'HIGH_RISK') {
                  fillColor = "rgba(239, 68, 68, 0.35)";
                  strokeColor = "#ef4444";
                }

                if (isSelected) {
                  strokeColor = "#ffffff";
                }

                return (
                  <g
                    key={parcel.khasra_no}
                    onClick={() => setActiveParcel(parcel)}
                    className="cursor-pointer transition-all duration-150 group"
                    opacity={isDimmed ? 0.2 : 1}
                  >
                    {/* Polygon Shape */}
                    <polygon
                      points={points}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? "3.5" : "1.8"}
                      className="hover:opacity-90 transition-opacity"
                    />

                    {/* Khasra Plot Label */}
                    <text
                      x={parcel.center_x}
                      y={parcel.center_y - 8}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {parcel.khasra_no}
                    </text>

                    {/* Area Label */}
                    <text
                      x={parcel.center_x}
                      y={parcel.center_y + 10}
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="11"
                    >
                      {parcel.area_hectares} ha
                    </text>

                    {/* Status Badge Tag on Map */}
                    {parcel.status === 'REVIEW_REQUIRED' && (
                      <text
                        x={parcel.center_x}
                        y={parcel.center_y + 26}
                        textAnchor="middle"
                        fill="#fef08a"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        ⚠ REVIEW
                      </text>
                    )}
                    {parcel.status === 'HIGH_RISK' && (
                      <text
                        x={parcel.center_x}
                        y={parcel.center_y + 26}
                        textAnchor="middle"
                        fill="#fca5a5"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        🚨 HIGH RISK
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Compass Rose */}
              <g transform="translate(105, 105)">
                <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <path d="M 0,-14 L 4,0 L -4,0 Z" fill="#ef4444" />
                <path d="M 0,14 L 4,0 L -4,0 Z" fill="#94a3b8" />
                <text x="0" y="-18" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">N</text>
              </g>
            </svg>

            {/* Click instruction banner */}
            <div className="absolute bottom-3 left-4 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded text-[11px] text-slate-300 border border-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Click any parcel boundary to inspect registered ownership and dispute alerts</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
            <span>Coordinates Ground-Referenced: <strong>WGS84 EPSG:4326</strong></span>
            <span className="font-mono text-slate-600">Scale: 1:1,000 Cadastral</span>
          </div>
        </div>

        {/* Selected Parcel Summary Card (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {activeParcel ? (
            <div className="gov-card p-5 space-y-4 border-t-4 border-t-sky-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 font-mono uppercase">Selected Parcel</span>
                  <h3 className="text-xl font-black text-slate-900 font-mono">
                    Plot Khasra {activeParcel.khasra_no}
                  </h3>
                </div>
                <span className={
                  activeParcel.status === 'HIGH_RISK' ? 'badge-risk' :
                  activeParcel.status === 'REVIEW_REQUIRED' ? 'badge-review' :
                  'badge-valid'
                }>
                  {activeParcel.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Parcel Attributes */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Owner:</span>
                  <strong className="text-slate-900">{activeParcel.owner_name || "Ramesh Kumar"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cadastral Survey Area:</span>
                  <strong className="text-sky-950 font-mono text-sm">{activeParcel.area_hectares} ha</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Village:</span>
                  <span className="text-slate-800">{activeParcel.village}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tehsil Circle:</span>
                  <span className="text-slate-800">Sadar, Lucknow</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Title Encumbrance:</span>
                  <span className={activeParcel.dispute_flag ? "text-rose-600 font-bold" : "text-emerald-700 font-semibold"}>
                    {activeParcel.dispute_flag ? "ACTIVE DISPUTE RECORDED" : "Clear & Free"}
                  </span>
                </div>
              </div>

              {/* Specific Warning for core demo parcels */}
              {activeParcel.khasra_no === '245/2' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Area Discrepancy on Record
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Cadastral polygon geometry measures <strong>1.05 ha</strong>. Digitized deed claims <strong>1.20 ha</strong> (+14.3% variance). Ground resurvey recommended.
                  </p>
                </div>
              )}

              {activeParcel.khasra_no === '245/7' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-950">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    Boundary Conflict & Ownership Dispute
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Registered to Dinesh Verma (0.65 ha). Document claimant presents conflicting deed.
                  </p>
                </div>
              )}

              {activeParcel.khasra_no === '312/1' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-950">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    Civil Court Injunction Active
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Court order Case No. 412/2020 pending before Tehsildar Court. Succession objection unresolved.
                  </p>
                </div>
              )}

              {/* Action Button: Jump to Review */}
              <button
                onClick={() => onSelectParcelForReview && onSelectParcelForReview(activeParcel.khasra_no)}
                className="w-full bg-sky-900 hover:bg-sky-950 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow transition-colors"
              >
                <span>Inspect Document in Review Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="gov-card p-8 text-center text-slate-500 text-xs">
              Click any parcel on the map to inspect revenue attributes and title status.
            </div>
          )}

          {/* Spatial Audit Card */}
          <div className="gov-card p-4 bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-800" />
              Spatial GIS Ground-Truthing
            </h4>
            <p className="text-slate-600 text-[11px]">
              The system calculates mathematical discrepancies between deed-declared area and GIS polygon boundary coordinates, preventing encroachment on adjacent Gram Sabha pathway land.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
