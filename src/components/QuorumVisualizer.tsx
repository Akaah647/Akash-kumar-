import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, ArrowRight, Play, CheckCircle2, RotateCcw, Activity } from 'lucide-react';

export const QuorumVisualizer: React.FC = () => {
  const [n, setN] = useState<number>(5);
  const [w, setW] = useState<number>(3);
  const [r, setR] = useState<number>(3);

  // Simulation state
  const [currentVersion, setCurrentVersion] = useState<number>(2);
  const [nodeVersions, setNodeVersions] = useState<number[]>([2, 2, 2, 1, 1]);
  const [queriedReadNodes, setQueriedReadNodes] = useState<number[]>([]);
  const [lastWrittenNodes, setLastWrittenNodes] = useState<number[]>([0, 1, 2]);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [simLog, setSimLog] = useState<string[]>([
    'Initial state: Object "user-photo.png" at v2 replicated on Nodes 1, 2, 3. Nodes 4, 5 lag at v1.',
  ]);

  // Handle N change
  const handleNChange = (newN: number) => {
    setN(newN);
    const newW = Math.min(w, newN);
    const newR = Math.min(r, newN);
    setW(newW);
    setR(newR);
    setNodeVersions(Array(newN).fill(currentVersion));
    setQueriedReadNodes([]);
    setLastWrittenNodes([]);
  };

  const isStrictQuorum = w + r > n;
  const overlapCount = w + r - n;

  // Execute simulated write to W nodes
  const executeSimWrite = () => {
    const nextVer = currentVersion + 1;
    setCurrentVersion(nextVer);

    const indices = Array.from({ length: n }, (_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    const selectedWriteNodes = shuffled.slice(0, w);
    setLastWrittenNodes(selectedWriteNodes);

    setNodeVersions((prev) => {
      const next = [...prev];
      selectedWriteNodes.forEach((idx) => {
        next[idx] = nextVer;
      });
      return next;
    });

    setQueriedReadNodes([]);
    setSimLog((prev) => [
      `[WRITE QUORUM] Wrote version v${nextVer} to ${w} nodes: [${selectedWriteNodes.map((i) => `Node ${i + 1}`).join(', ')}]. Acknowledged W=${w} success.`,
      ...prev.slice(0, 10),
    ]);
  };

  // Execute simulated read across R nodes
  const executeSimRead = () => {
    const indices = Array.from({ length: n }, (_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    const selectedReadNodes = shuffled.slice(0, r);
    setQueriedReadNodes(selectedReadNodes);

    const versionsReturned = selectedReadNodes.map((idx) => nodeVersions[idx] || 1);
    const maxVer = Math.max(...versionsReturned);
    const isUpToDate = maxVer === currentVersion;
    const intersection = selectedReadNodes.filter((idx) => lastWrittenNodes.includes(idx));
    const staleNodesInRead = selectedReadNodes.filter((idx) => nodeVersions[idx] < maxVer);

    let logMsg = `[READ QUORUM] Queried R=${r} nodes: [${selectedReadNodes.map((i) => `Node ${i + 1}`).join(', ')}]. Highest version observed: v${maxVer}.`;

    if (intersection.length > 0) {
      logMsg += ` Overlap confirmed on [${intersection.map((i) => `Node ${i + 1}`).join(', ')}]!`;
    }

    if (isUpToDate) {
      logMsg += ` Strong consistency verified: client received fresh data (v${maxVer}).`;
    } else {
      logMsg += ` STALE READ ANOMALY: Current latest version is v${currentVersion}, but read quorum only observed v${maxVer}! (Occurred because W+R <= N).`;
    }

    if (staleNodesInRead.length > 0) {
      logMsg += ` Triggering READ REPAIR on lagging nodes: [${staleNodesInRead.map((i) => `Node ${i + 1}`).join(', ')}] to v${maxVer}.`;
      setIsRepairing(true);
      setTimeout(() => {
        setNodeVersions((prev) => {
          const healed = [...prev];
          staleNodesInRead.forEach((idx) => {
            healed[idx] = maxVer;
          });
          return healed;
        });
        setIsRepairing(false);
      }, 700);
    }

    setSimLog((prev) => [logMsg, ...prev.slice(0, 10)]);
  };

  // Manually lag a specific node to test read repair
  const toggleLagNode = (idx: number) => {
    setNodeVersions((prev) => {
      const next = [...prev];
      next[idx] = Math.max(1, next[idx] - 1);
      return next;
    });
    setSimLog((prev) => [
      `[MANUAL FAULT] Lagged Node ${idx + 1} to version v${Math.max(1, (nodeVersions[idx] || 1) - 1)}. Run Quorum Read to witness Read Repair.`,
      ...prev.slice(0, 10),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header section with Venn & Mathematical Proof */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Pigeonhole Quorum Theorem
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Quorum Consistency Engine (W + R &gt; N)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              When Write Quorum (<span className="font-mono text-amber-300">W</span>) and Read Quorum (<span className="font-mono text-cyan-300">R</span>) exceed total replicas (<span className="font-mono text-white">N</span>), their intersection is guaranteed to contain at least one up-to-date replica, eliminating stale reads.
            </p>
          </div>

          <div className="self-start lg:self-center">
            <span
              className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 shadow-lg ${
                isStrictQuorum
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 shadow-emerald-950/30'
                  : 'bg-rose-950/80 text-rose-300 border-rose-600/80 shadow-rose-950/30'
              }`}
            >
              {isStrictQuorum ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Strict Quorum: Strong Consistency
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Weak Quorum: Stale Read Risk
                </>
              )}
            </span>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
                Replication Factor (N)
              </label>
              <span className="text-base font-bold font-mono text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {n}
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="9"
              value={n}
              onChange={(e) => handleNChange(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-2">Total storage nodes holding copies of each chunk.</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
                Write Quorum (W)
              </label>
              <span className="text-base font-bold font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {w}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={n}
              value={w}
              onChange={(e) => setW(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-2">Replicas that must ACK before returning success.</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
                Read Quorum (R)
              </label>
              <span className="text-base font-bold font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {r}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={n}
              value={r}
              onChange={(e) => setR(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-2">Replicas queried in parallel to resolve latest version.</p>
          </div>
        </div>

        {/* Dynamic SVG Venn Diagram & Mathematical Proof */}
        <div className="mt-6 p-5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Formal Pigeonhole Invariant
            </span>
            <div className="text-lg font-bold text-white font-mono flex items-center gap-3">
              <span>W ({w}) + R ({r}) = {w + r}</span>
              <span className={isStrictQuorum ? 'text-emerald-400' : 'text-rose-400'}>
                {isStrictQuorum ? '>' : '\u2264'}
              </span>
              <span>N ({n})</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-700">
                Overlap: {overlapCount > 0 ? `+${overlapCount}` : overlapCount} node(s)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              {isStrictQuorum ? (
                <span className="text-emerald-300">
                  Because {w + r} &gt; {n}, by the Pigeonhole Principle any write set and read set must share at least {overlapCount} node(s). The read quorum will always encounter the newest committed version.
                </span>
              ) : (
                <span className="text-rose-300">
                  Hazard: {w + r} &le; {n}. The read set can query nodes that missed the write quorum, allowing clients to observe stale data.
                </span>
              )}
            </p>
          </div>

          {/* SVG Venn Diagram */}
          <div className="shrink-0 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <svg width="240" height="110" viewBox="0 0 240 110" className="overflow-visible">
              {/* Outer universe rectangle */}
              <rect x="5" y="5" width="230" height="100" rx="10" fill="#090d16" stroke="#334155" strokeDasharray="3 3" />
              <text x="15" y="20" fill="#64748b" fontSize="9" fontFamily="monospace">Universe N = {n}</text>

              {/* Write Circle W */}
              <circle
                cx={isStrictQuorum ? '95' : '75'}
                cy="58"
                r="36"
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <text x={isStrictQuorum ? '70' : '70'} y="62" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="monospace">
                W={w}
              </text>

              {/* Read Circle R */}
              <circle
                cx={isStrictQuorum ? '145' : '165'}
                cy="58"
                r="36"
                fill="rgba(6, 182, 212, 0.2)"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              <text x={isStrictQuorum ? '170' : '170'} y="62" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                R={r}
              </text>

              {/* Intersection Label */}
              {isStrictQuorum && (
                <text x="120" y="62" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  &ge;{overlapCount}
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Panel */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl space-y-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Simulated Server Blades &amp; Replica States</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute real concurrent writes and quorum reads. Manually lag nodes to observe automated Read Repair.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={executeSimWrite}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-400/20 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Write Next Version (W={w})</span>
            </button>
            <button
              onClick={executeSimRead}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>Execute Quorum Read (R={r})</span>
            </button>
          </div>
        </div>

        {/* Server Blades Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: n }).map((_, idx) => {
            const ver = nodeVersions[idx] || 1;
            const isLastWritten = lastWrittenNodes.includes(idx);
            const isQueriedInRead = queriedReadNodes.includes(idx);
            const isUpToDate = ver === currentVersion;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                  isQueriedInRead
                    ? 'border-cyan-500/80 bg-cyan-950/20 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : isLastWritten
                    ? 'border-amber-500/80 bg-amber-950/20 shadow-lg shadow-amber-950/40'
                    : 'border-slate-800/80 bg-slate-950/80'
                }`}
              >
                {/* Server Blade Rack Top Edge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isUpToDate ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    <span className="text-xs font-bold text-white font-mono">Node {idx + 1}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">1U Blade</span>
                </div>

                {/* Stored Version Gauge */}
                <div className="my-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Stored Version</span>
                  <span
                    className={`text-base font-mono font-bold ${
                      isUpToDate ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    v{ver}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="space-y-1 text-[10px] font-mono mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Integrity:</span>
                    <span className={isUpToDate ? 'text-emerald-400' : 'text-amber-400'}>
                      {isUpToDate ? 'Latest' : 'Lagging (Stale)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">I/O State:</span>
                    <span className="text-slate-300 truncate">
                      {isLastWritten ? 'Written in W' : isQueriedInRead ? 'Queried in R' : 'Idle'}
                    </span>
                  </div>
                </div>

                {/* Interactive lag injection button */}
                <button
                  onClick={() => toggleLagNode(idx)}
                  className="w-full py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
                >
                  Simulate Lag (-1 ver)
                </button>
              </div>
            );
          })}
        </div>

        {/* Trace Logs Stream */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
            Replication Coordinator Protocol Trace
          </div>
          <div className="p-3.5 bg-slate-950 border border-slate-800/90 rounded-xl max-h-40 overflow-y-auto font-mono text-[11px] space-y-1.5">
            {simLog.map((log, i) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  log.includes('STALE READ')
                    ? 'text-rose-400 font-semibold'
                    : log.includes('READ REPAIR')
                    ? 'text-emerald-400'
                    : log.includes('WRITE QUORUM')
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
