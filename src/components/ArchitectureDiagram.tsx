import React, { useState } from 'react';
import { Play, Shield, Database, Cpu, GitBranch, ArrowRight, RefreshCw, Zap } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<'idle' | 'write' | 'read' | 'repair'>('idle');
  const [selectedComponent, setSelectedComponent] = useState<string>('coordinator');

  const componentDetails: Record<string, { title: string; package: string; role: string; guarantees: string }> = {
    client: {
      title: "Client Application / CLI",
      package: "cmd/vaultctl, api/server.go",
      role: "Issues standard RESTful PUT, GET, DELETE requests with content payload streams.",
      guarantees: "Synchronous acknowledgment once durability quorum W is satisfied."
    },
    coordinator: {
      title: "Replication Coordinator",
      package: "replication/coordinator.go",
      role: "Computes SHA-256 content address, resolves target nodes via Hash Ring, and orchestrates parallel I/O.",
      guarantees: "Enforces W + R > N Pigeonhole Principle; performs automatic read-repair on stale nodes."
    },
    raft: {
      title: "Raft Metadata Consensus Engine",
      package: "metadata/raft.go, metadata/store.go",
      role: "Replicates key -> hash -> replica locations -> monotonic version across 3/5 Raft peers.",
      guarantees: "Strict Linearizability (CP). Rejects minority partition writes to eliminate split-brain."
    },
    storage: {
      title: "Content-Addressed Disk Engines (Nodes 1-5)",
      package: "storage/engine.go",
      role: "Stores chunks under two-tier directory fanout (data/ab/cd/hash) using atomic POSIX rename.",
      guarantees: "Verifies SHA-256 checksum on every read stream; fsync() guarantees disk durability."
    },
    scrubber: {
      title: "Periodic Integrity Scrubber & Auto-Healer",
      package: "storage/scrubber.go",
      role: "Proactively sweeps all disk blocks, re-hashes bytes, detects silent bit-rot, and fetches pristine copies from peers.",
      guarantees: "Eliminates dormant latent disk decay before multiple replicas suffer corruption."
    },
    repairer: {
      title: "Background Durability Repairer",
      package: "replication/repair.go",
      role: "Monitors cluster health via failure detector; detects under-replicated chunks (M < N) and re-replicates.",
      guarantees: "Rapidly restores full N-way replication after permanent node loss without admin intervention."
    }
  };

  const handleTriggerFlow = (flow: 'write' | 'read' | 'repair') => {
    setActiveFlow(flow);
    setTimeout(() => {
      setActiveFlow('idle');
    }, 3500);
  };

  const activeComp = componentDetails[selectedComponent] || componentDetails['coordinator'];

  return (
    <div className="border border-slate-800/80 bg-slate-900/60 rounded-2xl p-6 lg:p-8 space-y-6 relative overflow-hidden backdrop-blur-sm">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Flow Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              Interactive Architectural Topology
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-1">
            Data Path vs Control Path Decoupling
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click subsystems to inspect their algorithmic roles, or trigger live data flow packet simulations below.
          </p>
        </div>

        {/* Live Packet Flow Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTriggerFlow('write')}
            disabled={activeFlow !== 'idle'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate PUT (W=2)</span>
          </button>
          <button
            onClick={() => handleTriggerFlow('read')}
            disabled={activeFlow !== 'idle'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate GET (Read Repair)</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Architecture Canvas */}
      <div className="relative z-10 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 overflow-x-auto">
        <svg viewBox="0 0 900 480" className="w-full min-w-[760px] h-auto select-none">
          <defs>
            <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow-packet" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connectors / Data Conduits */}
          {/* Client to Coordinator */}
          <path
            d="M 120 240 L 260 240"
            stroke={activeFlow === 'write' || activeFlow === 'read' ? '#f59e0b' : '#334155'}
            strokeWidth={activeFlow !== 'idle' ? '3' : '1.5'}
            strokeDasharray={activeFlow !== 'idle' ? '6 4' : 'none'}
            fill="none"
          />

          {/* Coordinator to Metadata Consensus (Control Plane) */}
          <path
            d="M 370 190 L 370 120 L 530 120"
            stroke={activeFlow === 'write' ? '#10b981' : '#334155'}
            strokeWidth={activeFlow === 'write' ? '3' : '1.5'}
            strokeDasharray={activeFlow === 'write' ? '6 4' : 'none'}
            fill="none"
          />

          {/* Coordinator to Data Storage Nodes (Data Plane) */}
          <path
            d="M 370 290 L 370 360 L 530 360"
            stroke={activeFlow === 'write' || activeFlow === 'read' ? '#06b6d4' : '#334155'}
            strokeWidth={activeFlow !== 'idle' ? '3' : '1.5'}
            strokeDasharray={activeFlow !== 'idle' ? '6 4' : 'none'}
            fill="none"
          />

          {/* Scrubber to Storage Nodes */}
          <path
            d="M 770 420 L 710 420 L 710 380"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            fill="none"
          />

          {/* Background Repairer to Storage Nodes */}
          <path
            d="M 770 290 L 710 290 L 710 340"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            fill="none"
          />

          {/* ================= NODES & BOXES ================= */}

          {/* 1. Client App */}
          <g
            onClick={() => setSelectedComponent('client')}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <rect
              x="20"
              y="190"
              width="110"
              height="100"
              rx="12"
              fill="#090d16"
              stroke={selectedComponent === 'client' ? '#f59e0b' : '#1e293b'}
              strokeWidth={selectedComponent === 'client' ? '2' : '1'}
            />
            <text x="75" y="235" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontWeight="bold">
              Client
            </text>
            <text x="75" y="252" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              PUT / GET
            </text>
            <circle cx="75" cy="212" r="8" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" />
          </g>

          {/* 2. Replication Coordinator */}
          <g
            onClick={() => setSelectedComponent('coordinator')}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <rect
              x="250"
              y="160"
              width="170"
              height="160"
              rx="14"
              fill="#0d1424"
              stroke={selectedComponent === 'coordinator' ? '#f59e0b' : '#334155'}
              strokeWidth={selectedComponent === 'coordinator' ? '2.5' : '1.5'}
            />
            <rect x="260" y="172" width="150" height="24" rx="6" fill="#1e293b" />
            <text x="335" y="188" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">
              COORDINATOR
            </text>
            <text x="335" y="222" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">
              Quorum Algebra
            </text>
            <text x="335" y="240" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              W=2 + R=2 &gt; N=3
            </text>
            <text x="335" y="265" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="600">
              Hash Ring Resolver
            </text>
            <text x="335" y="283" textAnchor="middle" fill="#64748b" fontSize="10">
              Murmur3 (100 Vnodes)
            </text>
          </g>

          {/* 3. Control Plane: Raft Consensus */}
          <g
            onClick={() => setSelectedComponent('raft')}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <rect
              x="530"
              y="50"
              width="210"
              height="140"
              rx="14"
              fill="#061c16"
              stroke={selectedComponent === 'raft' ? '#10b981' : '#065f46'}
              strokeWidth={selectedComponent === 'raft' ? '2.5' : '1.5'}
            />
            <text x="635" y="78" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
              CONTROL PLANE (RAFT FSM)
            </text>
            <text x="635" y="102" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">
              Strongly Consistent Metadata
            </text>
            <text x="635" y="122" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontFamily="monospace">
              Key &rarr; Hash &rarr; Replicas &rarr; Ver
            </text>
            <text x="635" y="145" textAnchor="middle" fill="#6ee7b7" fontSize="10">
              Leader-Lease &bull; WAL &bull; Snapshots
            </text>
            <rect x="550" y="158" width="170" height="20" rx="4" fill="#042f2e" />
            <text x="635" y="172" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
              MAJORITY QUORUM: 3/5 NODES
            </text>
          </g>

          {/* 4. Data Plane: Storage Nodes Cluster */}
          <g
            onClick={() => setSelectedComponent('storage')}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <rect
              x="530"
              y="260"
              width="210"
              height="180"
              rx="14"
              fill="#081c2e"
              stroke={selectedComponent === 'storage' ? '#0ea5e9' : '#075985'}
              strokeWidth={selectedComponent === 'storage' ? '2.5' : '1.5'}
            />
            <text x="635" y="286" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
              DATA PLANE (STORAGE NODES)
            </text>
            {/* 3 server drive bars */}
            <rect x="550" y="302" width="170" height="26" rx="5" fill="#0f2b48" stroke="#1e3a5f" />
            <text x="560" y="319" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Node 1
            </text>
            <text x="705" y="319" textAnchor="end" fill="#34d399" fontSize="9" fontFamily="monospace">
              data/ab/cd/hash
            </text>

            <rect x="550" y="336" width="170" height="26" rx="5" fill="#0f2b48" stroke="#1e3a5f" />
            <text x="560" y="353" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Node 2
            </text>
            <text x="705" y="353" textAnchor="end" fill="#34d399" fontSize="9" fontFamily="monospace">
              SHA-256 CAS
            </text>

            <rect x="550" y="370" width="170" height="26" rx="5" fill="#0f2b48" stroke="#1e3a5f" />
            <text x="560" y="387" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Node 3
            </text>
            <text x="705" y="387" textAnchor="end" fill="#34d399" fontSize="9" fontFamily="monospace">
              Atomic Rename
            </text>

            <text x="635" y="422" textAnchor="middle" fill="#7dd3fc" fontSize="10">
              Parallel Multi-Reader / Multi-Writer
            </text>
          </g>

          {/* 5. Integrity Scrubber */}
          <g
            onClick={() => setSelectedComponent('scrubber')}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <rect
              x="770"
              y="380"
              width="110"
              height="80"
              rx="10"
              fill="#181329"
              stroke={selectedComponent === 'scrubber' ? '#c084fc' : '#581c87'}
              strokeWidth={selectedComponent === 'scrubber' ? '2' : '1'}
            />
            <text x="825" y="410" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">
              Scrubber
            </text>
            <text x="825" y="428" textAnchor="middle" fill="#c084fc" fontSize="9" fontFamily="monospace">
              Bit-Rot Self-Heal
            </text>
            <text x="825" y="444" textAnchor="middle" fill="#9333ea" fontSize="8">
              Periodic Crawl
            </text>
          </g>

          {/* 6. Background Repairer */}
          <g
            onClick={() => setSelectedComponent('repairer')}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <rect
              x="770"
              y="260"
              width="110"
              height="80"
              rx="10"
              fill="#1e1b12"
              stroke={selectedComponent === 'repairer' ? '#fbbf24' : '#78350f'}
              strokeWidth={selectedComponent === 'repairer' ? '2' : '1'}
            />
            <text x="825" y="290" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="bold">
              Repair Loop
            </text>
            <text x="825" y="308" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace">
              Restore N=3
            </text>
            <text x="825" y="324" textAnchor="middle" fill="#b45309" fontSize="8">
              Dead Node Healing
            </text>
          </g>

          {/* ================= ANIMATED FLOW PACKETS ================= */}
          {activeFlow === 'write' && (
            <g filter="url(#glow-packet)">
              {/* Packet 1: Client to Coordinator */}
              <circle cx="190" cy="240" r="6" fill="#f59e0b">
                <animate attributeName="cx" values="120;260" dur="0.8s" repeatCount="1" />
              </circle>
              {/* Packet 2: Coordinator to Metadata Raft */}
              <circle cx="450" cy="120" r="5" fill="#10b981">
                <animate attributeName="cx" values="370;530" dur="0.8s" begin="0.8s" repeatCount="1" />
              </circle>
              {/* Packet 3: Coordinator to Storage Nodes */}
              <circle cx="450" cy="360" r="5" fill="#06b6d4">
                <animate attributeName="cx" values="370;530" dur="0.8s" begin="0.8s" repeatCount="1" />
              </circle>
            </g>
          )}

          {activeFlow === 'read' && (
            <g filter="url(#glow-packet)">
              {/* Query R=2 nodes */}
              <circle cx="450" cy="360" r="6" fill="#06b6d4">
                <animate attributeName="cx" values="530;370" dur="0.9s" repeatCount="1" />
              </circle>
              {/* Read repair packet back to lagging node */}
              <circle cx="450" cy="360" r="5" fill="#f59e0b">
                <animate attributeName="cx" values="370;530" dur="0.9s" begin="0.9s" repeatCount="1" />
              </circle>
            </g>
          )}
        </svg>
      </div>

      {/* Selected Component Detail Inspector */}
      <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{activeComp.title}</span>
            <span className="text-[11px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              {activeComp.package}
            </span>
          </div>
          <p className="text-xs text-slate-300">{activeComp.role}</p>
        </div>
        <div className="md:text-right shrink-0">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Core Guarantee
          </span>
          <span className="text-xs font-semibold text-emerald-400">{activeComp.guarantees}</span>
        </div>
      </div>
    </div>
  );
};
