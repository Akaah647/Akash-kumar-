import React from 'react';
import { Database, ShieldCheck, RefreshCw, Cpu, Layers, GitBranch, Terminal, ArrowRight, Zap, CheckCircle2, Shield, Activity, HardDrive, Key, LineChart as ChartIcon, Sparkles } from 'lucide-react';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { FresherGuide } from './FresherGuide';

interface OverviewProps {
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section with Technical HUD */}
      <div className="border border-slate-800/80 bg-slate-900/60 rounded-2xl relative overflow-hidden backdrop-blur-md shadow-2xl">
        {/* Glow ambient background mesh */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[250px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="p-8 lg:p-10 relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Fault-Tolerant Distributed Storage
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs font-mono text-slate-400">Go 1.22 &bull; HashiCorp Raft &bull; SHA-256 CAS</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Vault Object Storage Architecture
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              An enterprise distributed storage system engineered to store, replicate, retrieve, and automatically repair large volumes of data across unreliable commodity nodes. Featuring mathematical quorum durability (<span className="font-mono text-amber-300 font-semibold">W + R &gt; N</span>), consistent hashing with 100 vnodes, cryptographic bit-rot self-healing, and Raft metadata consensus.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('monitoring')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
            >
              <ChartIcon className="w-4 h-4 text-slate-950" />
              <span>Live Telemetry Dashboard (Recharts)</span>
            </button>
            <button
              onClick={() => onNavigate('freshers')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-500/40 rounded-lg transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Fresher 101 Simple Guide</span>
            </button>
            <button
              onClick={() => onNavigate('simulator')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Hardware Rack Simulator</span>
            </button>
          </div>

          {/* Live Telemetry HUD Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
                <span>Quorum Formula</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">W + R &gt; N</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Strict Linearizability</div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
                <span>Metadata Layer</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">HashiCorp Raft</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">Majority Quorum: (N/2)+1</div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
                <span>Content Addressing</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">SHA-256 CAS</div>
              <div className="text-[11px] text-cyan-400 font-mono mt-0.5">Bit-Rot Auto-Scrubbing</div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
                <span>Key Rebalance</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">&Delta; = 1 / (N+1)</div>
              <div className="text-[11px] text-amber-400 font-mono mt-0.5">100 Vnodes / Node</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive System Architecture Diagram */}
      <ArchitectureDiagram />

      {/* Beginner-Friendly Fresher Guide Section */}
      <FresherGuide />

      {/* Architectural Separation: Control Plane vs Data Plane */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Control Plane */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-7 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-sm">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Control Plane (Metadata Consensus)</h3>
                <span className="text-[11px] font-mono text-slate-400">Raft WAL &bull; Deterministic FSM</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
              Strong (CP)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Object metadata is strictly isolated from large data payloads. The metadata store uses HashiCorp Raft to maintain a linearizable, replicated log across an odd cluster size ($N=3$ or $N=5$).
          </p>

          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="text-slate-400 font-bold text-[11px]">Replicated Metadata State Machine:</div>
            <div className="text-amber-300">Key &rarr; SHA-256 Hash &rarr; Replica Node IDs &rarr; Monotonic Version</div>
            <div className="text-slate-500 text-[10px]">Rejects minority partitions to guarantee split-brain immunity</div>
          </div>
        </div>

        {/* Data Plane */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-7 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 shadow-sm">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Data Plane (Parallel Quorum Storage)</h3>
                <span className="text-[11px] font-mono text-slate-400">Content Addressing &bull; POSIX Atomic Rename</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
              High Concurrency
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Chunk payloads stream directly between client coordinators and storage nodes. Replicas are identified via consistent hashing and stored under local subdirectories by their SHA-256 hash.
          </p>

          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="text-slate-400 font-bold text-[11px]">Local Content-Addressed Storage:</div>
            <div className="text-emerald-300">data/ab/cd/hash (Atomic fsync &amp; POSIX rename)</div>
            <div className="text-slate-500 text-[10px]">End-to-end cryptographic checksum verification on every read</div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Interactive Modules &amp; Subsystems
          </h3>
          <span className="text-xs text-slate-500 font-mono">Interactive Navigation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 0: Live Monitoring */}
          <button
            onClick={() => onNavigate('monitoring')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-amber-500/50 text-left transition-all cursor-pointer group shadow-sm hover:shadow-amber-500/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/60">
                <ChartIcon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Live Monitoring Dashboard
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Recharts telemetry: Read/Write P95 Latency, Storage Utilization, Request Throughput, and Node Health.
            </p>
          </button>

          {/* Card 1 */}
          <button
            onClick={() => onNavigate('quorum')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-amber-500/50 text-left transition-all cursor-pointer group shadow-sm hover:shadow-amber-500/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Quorum Math Visualizer
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Dynamically adjust N, W, R. Verify the Pigeonhole Principle overlap and simulate stale read repairs in real time.
            </p>
          </button>

          {/* Card 2 */}
          <button
            onClick={() => onNavigate('hashring')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/50 text-left transition-all cursor-pointer group shadow-sm hover:shadow-cyan-500/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                <RefreshCw className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Consistent Hash Ring (Vnodes)
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              360&deg; SVG token ring. Add/remove nodes to witness minimal key rebalancing (&Delta; = 1/(N+1)).
            </p>
          </button>

          {/* Card 3 */}
          <button
            onClick={() => onNavigate('simulator')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-emerald-500/50 text-left transition-all cursor-pointer group shadow-sm hover:shadow-emerald-500/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <Cpu className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Live Cluster &amp; Chaos Engine
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Test real quorum writes, kill nodes, inject silent bit-rot, and trigger automated self-healing loops.
            </p>
          </button>

          {/* Card 4 */}
          <button
            onClick={() => onNavigate('stages')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-purple-500/50 text-left transition-all cursor-pointer group shadow-sm hover:shadow-purple-500/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/60">
                <Layers className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              8 Implementation Stages
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Step-by-step walkthrough from single-node disk engine to Raft quorums, scrubber, and chaos testing.
            </p>
          </button>

          {/* Card 5 */}
          <button
            onClick={() => onNavigate('requirements')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-emerald-500/50 text-left transition-all cursor-pointer group shadow-sm hover:shadow-emerald-500/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Requirements Rubric Matrix
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Track the 10 university requirements, verification test commands, and academic trade-offs.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

