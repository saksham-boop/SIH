import React from 'react';
import { ShieldCheck, Search, LayoutDashboard, Upload, ClipboardCheck, Map, Play } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'upload',     label: 'Upload Record', icon: Upload },
  { id: 'result',     label: 'Review',        icon: ClipboardCheck, requiresResult: true },
  { id: 'map',        label: 'GIS Map',       icon: Map },
  { id: 'demo',       label: 'Demo Cases',    icon: Play },
];

export default function Navbar({ activeTab, setActiveTab, onOpenSearch, hasResult }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

        {/* Brand */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div className="w-7 h-7 rounded bg-sky-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white hidden sm:block leading-tight">
            Land Record<br className="hidden" /> Validation
          </span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-700 flex-shrink-0" />

        {/* Nav items */}
        <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {NAV_ITEMS.map(item => {
            // Hide "Review" tab until there's a result to show
            if (item.requiresResult && !hasResult) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Search trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 text-xs transition-colors flex-shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Search</span>
          <kbd className="hidden sm:block bg-slate-800 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
