import React, { useState } from 'react';
import { STAGES } from '../data/stagesData';
import { Terminal, CheckCircle2, AlertCircle, Code, Layers, ArrowRight } from 'lucide-react';

interface StageGuideProps {
  onSelectCodeFile: (filePath: string) => void;
}

export const StageGuide: React.FC<StageGuideProps> = ({ onSelectCodeFile }) => {
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);

  const activeStage = STAGES.find((s) => s.stage === selectedStageNumber) || STAGES[0];

  return (
    <div className="space-y-6">
      {/* Header & Stage Selector */}
      <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              8-Stage Step-by-Step Implementation Guide
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Constructed progressively from a single-node disk engine to a resilient multi-node cluster with Raft consensus, consistent hashing, and automated self-healing.
            </p>
          </div>
        </div>

        {/* Stage Pills Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-6 pt-6 border-t border-slate-800">
          {STAGES.map((s) => (
            <button
              key={s.stage}
              onClick={() => setSelectedStageNumber(s.stage)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedStageNumber === s.stage
                  ? 'border-amber-500/80 bg-amber-400/10 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Stage {s.stage}
              </div>
              <div className="text-xs font-semibold truncate mt-0.5">
                {s.title.replace(`Stage ${s.stage}: `, '')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Stage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Summary & Concepts */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-xl space-y-4">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                Stage {activeStage.stage} Specification
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{activeStage.title}</h3>
              <p className="text-xs font-mono text-slate-400">{activeStage.subtitle}</p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{activeStage.summary}</p>

            {/* Key Concepts */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Core Architectural Mechanisms
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeStage.keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Go Code Files Involved */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Go Packages & Source Files
              </span>
              <div className="space-y-1.5">
                {activeStage.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs text-amber-300 font-semibold">{file.path}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{file.description}</div>
                    </div>
                    <button
                      onClick={() => onSelectCodeFile(file.path)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-3"
                    >
                      <Code className="w-3 h-3 text-amber-400" />
                      View Code
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simplifications & Academic Flags */}
          <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Flagged Simplifications & Academic Trade-offs
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Per university project submission guidelines, these intentional trade-offs are explicitly identified for the report and future enhancements:
            </p>
            <div className="space-y-2">
              {activeStage.simplifications.map((simp, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed"
                >
                  <span className="text-amber-400 font-semibold mr-1.5">&bull;</span>
                  {simp}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: How to Test Locally */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Local Verification & Test Execution
              </h4>
            </div>

            <p className="text-xs text-slate-400">
              Run this command in the terminal to execute the rigorous Go test harness and confirm this stage passes:
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 select-all">
              {activeStage.testCommand}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Sample Verified CLI Output
              </span>
              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
                {activeStage.sampleOutput}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
