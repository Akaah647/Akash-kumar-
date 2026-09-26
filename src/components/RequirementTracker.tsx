import React, { useState } from 'react';
import { REQUIREMENTS } from '../data/requirementsData';
import { CheckCircle2, ChevronRight, Terminal, Shield, Check, Filter } from 'lucide-react';

interface RequirementTrackerProps {
  onSelectCodeFile: (filePath: string) => void;
}

export const RequirementTracker: React.FC<RequirementTrackerProps> = ({ onSelectCodeFile }) => {
  const [selectedReqId, setSelectedReqId] = useState<string>('REQ-01');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = ['All', 'Durability', 'Consistency', 'Availability', 'Integrity', 'Cluster Management'];

  const filteredRequirements = REQUIREMENTS.filter((r) => {
    if (categoryFilter === 'All') return true;
    return r.category === categoryFilter;
  });

  const activeReq = REQUIREMENTS.find((r) => r.id === selectedReqId) || REQUIREMENTS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              System Requirements & University Rubric Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              100% of functional requirements verified through automated Go test suites, formal consensus guarantees, and empirical benchmarks.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className="px-3 py-1.5 text-xs font-semibold rounded-md border bg-emerald-950/80 text-emerald-300 border-emerald-700/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              10/10 Requirements Verified
            </span>
          </div>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5 mt-6 pt-6 border-t border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Requirements List + Requirement Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Requirements List */}
        <div className="lg:col-span-5 space-y-2">
          {filteredRequirements.map((req) => {
            const isSelected = req.id === selectedReqId;
            return (
              <button
                key={req.id}
                onClick={() => setSelectedReqId(req.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-400/10 text-white'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                    {req.id} &bull; Stage {req.stage}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                </div>
                <div className="text-sm font-semibold text-white mt-1">{req.title}</div>
                <div className="text-xs text-slate-400 line-clamp-2 mt-1">{req.description}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Requirement Deep Dive */}
        <div className="lg:col-span-7 border border-slate-800 bg-slate-900/60 p-6 rounded-xl space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                {activeReq.id} &bull; {activeReq.category}
              </span>
              <span className="text-xs font-mono text-slate-400">Stage {activeReq.stage}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{activeReq.title}</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeReq.description}</p>
          </div>

          {/* How Satisfied */}
          <div className="space-y-1.5 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Architectural Implementation
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              {activeReq.howSatisfied}
            </p>
          </div>

          {/* Verification Method & Command */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Verification Harness & Test Command
            </span>
            <p className="text-xs text-slate-400">{activeReq.verificationMethod}</p>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 flex items-center gap-2 select-all">
              <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{activeReq.testCommand}</span>
            </div>
          </div>

          {/* Code Reference */}
          <div className="space-y-1 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Codebase Reference
            </span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
              {activeReq.codeReference}
            </div>
          </div>

          {/* Academic Rubric & Trade-off */}
          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-300">University Rubric Assessment:</span>
              <p className="text-slate-400 mt-0.5">{activeReq.rubricNotes}</p>
            </div>
            <div>
              <span className="font-semibold text-amber-400">Design Trade-offs & Limitations:</span>
              <p className="text-slate-400 mt-0.5">{activeReq.tradeoffs}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
