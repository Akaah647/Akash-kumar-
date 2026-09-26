import React, { useState } from 'react';
import { Download, FileText, Menu, X, Shield } from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadZip: () => void;
  onExportReport: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  onExportReport,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'monitoring', label: 'Live Monitoring' },
    { id: 'simulator', label: 'Cluster Simulation' },
    { id: 'quorum', label: 'Quorum (W/R/N)' },
    { id: 'hashring', label: 'Hash Ring' },
    { id: 'freshers', label: 'Fresher 101' },
    { id: 'stages', label: '8 Stages' },
    { id: 'code', label: 'Go Codebase' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'report', label: 'Project Report' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Zone 1: Single text wordmark with subtle dot indicator */}
        <button
          onClick={() => handleNavClick('overview')}
          className="text-left group cursor-pointer focus:outline-none flex items-center gap-2.5"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            Vault Distributed Storage
          </span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden xl:flex items-center gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-amber-400/10 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1-2 primary action buttons + mobile toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportReport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Export University Project Submission Report (Markdown)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Report</span>
          </button>
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-400/20 active:scale-95 whitespace-nowrap cursor-pointer"
            title="Download complete runnable Go project archive"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Download</span>
            <span>Go Code</span>
          </button>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden pt-4 pb-2 border-t border-slate-800/80 mt-3 grid grid-cols-2 gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`p-2.5 rounded-lg text-xs text-left font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-amber-400/10 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              onExportReport();
              setMobileMenuOpen(false);
            }}
            className="col-span-2 p-2.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 flex items-center justify-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Academic Report (Markdown)</span>
          </button>
        </div>
      )}
    </header>
  );
};
