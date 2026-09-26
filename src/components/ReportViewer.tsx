import React, { useState } from 'react';
import { ACADEMIC_REPORT } from '../data/academicReport';
import { Copy, Check, Download, FileText, Bookmark } from 'lucide-react';

export const ReportViewer: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(ACADEMIC_REPORT.sections[0].id);

  const getFullMarkdown = () => {
    let md = `# ${ACADEMIC_REPORT.title}\n`;
    md += `## ${ACADEMIC_REPORT.subtitle}\n`;
    md += `**Author**: ${ACADEMIC_REPORT.author}\n\n`;
    md += `### Abstract\n${ACADEMIC_REPORT.abstract}\n\n`;

    ACADEMIC_REPORT.sections.forEach((sec) => {
      md += `## ${sec.title}\n\n${sec.content}\n\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(getFullMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = getFullMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VAULT_PROJECT_REPORT.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
              Academic Submission Document
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              {ACADEMIC_REPORT.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{ACADEMIC_REPORT.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download REPORT.md</span>
            </button>
          </div>
        </div>

        {/* Abstract Box */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Abstract</span>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
            {ACADEMIC_REPORT.abstract}
          </p>
        </div>
      </div>

      {/* Report Navigation & Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table of Contents Column */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900/60 p-4 rounded-xl space-y-1 self-start sticky top-20">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-2">
            Table of Contents
          </span>
          {ACADEMIC_REPORT.sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSectionId(sec.id);
                const el = document.getElementById(sec.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                activeSectionId === sec.id
                  ? 'bg-amber-400/10 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="truncate">{sec.title}</span>
              <Bookmark className="w-3 h-3 text-slate-600 shrink-0 ml-2" />
            </button>
          ))}
        </div>

        {/* Full Report Content */}
        <div className="lg:col-span-8 space-y-6">
          {ACADEMIC_REPORT.sections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="border border-slate-800 bg-slate-900/60 p-6 rounded-xl space-y-4"
            >
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>{sec.title}</span>
              </h3>
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 text-xs leading-relaxed space-y-3 whitespace-pre-line font-sans">
                {sec.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
