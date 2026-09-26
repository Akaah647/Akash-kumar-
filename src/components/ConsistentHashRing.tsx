import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Database, HelpCircle, ArrowUpRight, RefreshCw, BarChart2, Shield } from 'lucide-react';

interface PhysicalNode {
  id: string;
  name: string;
  color: string;
  bgColor: string;
}

const INITIAL_NODES: PhysicalNode[] = [
  { id: 'node-A', name: 'Node A (us-east-1)', color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.15)' },
  { id: 'node-B', name: 'Node B (us-east-2)', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
  { id: 'node-C', name: 'Node C (us-west-1)', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' },
  { id: 'node-D', name: 'Node D (eu-west-1)', color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.15)' },
  { id: 'node-E', name: 'Node E (ap-southeast-1)', color: '#c084fc', bgColor: 'rgba(192, 132, 252, 0.15)' },
];

interface SampleKey {
  key: string;
  angle: number; // 0 to 360
  size: string;
}

const SAMPLE_KEYS: SampleKey[] = [
  { key: 'user_profile_101.json', angle: 42, size: '24 KB' },
  { key: 'dataset_shard_04.parquet', angle: 118, size: '14.2 MB' },
  { key: 'firmware_v2.bin', angle: 185, size: '8.4 MB' },
  { key: 'invoice_2026_q1.pdf', angle: 260, size: '180 KB' },
  { key: 'analytics_stream_dump.csv', angle: 330, size: '4.1 MB' },
];

export const ConsistentHashRing: React.FC = () => {
  const [nodes, setNodes] = useState<PhysicalNode[]>(INITIAL_NODES);
  const [vnodeFactor, setVnodeFactor] = useState<number>(8);
  const [selectedKey, setSelectedKey] = useState<SampleKey>(SAMPLE_KEYS[0]);
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [keysList, setKeysList] = useState<SampleKey[]>(SAMPLE_KEYS);

  const pseudoHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  };

  const tokens = useMemo(() => {
    const list: { nodeID: string; angle: number; tokenID: string; color: string }[] = [];
    nodes.forEach((node) => {
      for (let i = 0; i < vnodeFactor; i++) {
        const tokenID = `${node.id}-vnode-${i}`;
        const angle = pseudoHash(tokenID);
        list.push({
          nodeID: node.id,
          angle,
          tokenID,
          color: node.color,
        });
      }
    });
    return list.sort((a, b) => a.angle - b.angle);
  }, [nodes, vnodeFactor]);

  const replicasForSelectedKey = useMemo(() => {
    if (tokens.length === 0) return [];
    const targetAngle = selectedKey.angle;

    let startIdx = tokens.findIndex((t) => t.angle >= targetAngle);
    if (startIdx === -1) startIdx = 0;

    const selectedNodeIds: string[] = [];
    for (let i = 0; i < tokens.length && selectedNodeIds.length < 3 && selectedNodeIds.length < nodes.length; i++) {
      const token = tokens[(startIdx + i) % tokens.length];
      if (!selectedNodeIds.includes(token.nodeID)) {
        selectedNodeIds.push(token.nodeID);
      }
    }
    return selectedNodeIds;
  }, [tokens, selectedKey, nodes]);

  const handleAddNode = () => {
    if (nodes.length >= 7) return;
    const newId = `node-${String.fromCharCode(65 + nodes.length)}`;
    const colors = ['#f472b6', '#38bdf8', '#fb923c'];
    const newNode: PhysicalNode = {
      id: newId,
      name: `${newId.toUpperCase()} (eu-central-1)`,
      color: colors[nodes.length % colors.length] || '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.15)',
    };
    setNodes([...nodes, newNode]);
  };

  const handleRemoveNode = () => {
    if (nodes.length <= 3) return;
    setNodes(nodes.slice(0, nodes.length - 1));
  };

  const handleAddCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;
    const angle = pseudoHash(newKeyInput);
    const newEntry: SampleKey = {
      key: newKeyInput.trim(),
      angle,
      size: '64 KB',
    };
    setKeysList((prev) => [...prev, newEntry]);
    setSelectedKey(newEntry);
    setNewKeyInput('');
  };

  const size = 420;
  const center = size / 2;
  const radius = 155;

  return (
    <div className="space-y-6">
      {/* Header card with minimal rebalancing formula */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Ring Partitioning &amp; Virtual Nodes
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Consistent Hashing Topology (Murmur3)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Maps both physical nodes (via multiple virtual token hashes) and object keys to the continuous $[0, 2^{32}-1]$ space. When nodes join or leave, only <span className="font-mono text-amber-300 font-semibold">&Delta; = 1 / (N+1)</span> of keys migrate, preserving cache locality and eliminating catastrophic rehash storms.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={handleAddNode}
              disabled={nodes.length >= 7}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-400/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Node</span>
            </button>
            <button
              onClick={handleRemoveNode}
              disabled={nodes.length <= 3}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 disabled:opacity-40 rounded-lg transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Node</span>
            </button>
          </div>
        </div>

        {/* Ring Controls & Info bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-300 uppercase font-mono tracking-wider">
                Virtual Nodes (Vnodes)
              </span>
              <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {vnodeFactor} tokens/node
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={vnodeFactor}
              onChange={(e) => setVnodeFactor(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-2">
              Total tokens on ring: <span className="font-mono text-white font-bold">{nodes.length * vnodeFactor}</span>. Higher vnode density smooths variance.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <span className="font-semibold text-slate-300 uppercase font-mono tracking-wider block mb-2">
              Active Physical Hosts ({nodes.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {nodes.map((n) => (
                <span
                  key={n.id}
                  className="px-2 py-0.5 rounded text-[11px] font-mono border"
                  style={{ color: n.color, borderColor: n.color + '66', backgroundColor: n.bgColor }}
                >
                  {n.id}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Replica walk: Clockwise traversal to collect N=3 distinct physical hosts.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <span className="font-semibold text-slate-300 uppercase font-mono tracking-wider block mb-2">
              Rebalancing Guarantee
            </span>
            <div className="font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-amber-400 font-bold">&Delta; = 1 / ({nodes.length} + 1) = ~{(100 / (nodes.length + 1)).toFixed(1)}%</div>
              <div className="text-slate-400 text-[10px]">
                Adding 1 node rebalances only {(100 / (nodes.length + 1)).toFixed(1)}% of chunks. Modulo hashing rehashes ~100%.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Hash Ring */}
        <div className="lg:col-span-7 border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
          {/* Subtle radial glow under ring */}
          <div className="absolute w-[320px] h-[320px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

          <div className="relative">
            <svg width={size} height={size} className="overflow-visible">
              <defs>
                <radialGradient id="ring-halo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background ambient halo */}
              <circle cx={center} cy={center} r={radius + 30} fill="url(#ring-halo)" />

              {/* Outer boundary tick ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#334155"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* Inner ring */}
              <circle
                cx={center}
                cy={center}
                r={radius * 0.55}
                fill="#050811"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              {/* Center HUD */}
              <text
                x={center}
                y={center - 10}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[10px] uppercase font-bold tracking-widest"
              >
                Token Space
              </text>
              <text
                x={center}
                y={center + 10}
                textAnchor="middle"
                className="fill-amber-400 font-mono text-sm font-bold"
              >
                0 &rarr; 2³²-1
              </text>
              <text
                x={center}
                y={center + 28}
                textAnchor="middle"
                className="fill-cyan-400 font-mono text-[10px]"
              >
                Clockwise Replica Walk
              </text>

              {/* Vnode Tokens on Ring */}
              {tokens.map((token, i) => {
                const rad = (token.angle * Math.PI) / 180;
                const cx = center + radius * Math.cos(rad);
                const cy = center + radius * Math.sin(rad);
                const isReplicaNode = replicasForSelectedKey.includes(token.nodeID);

                return (
                  <g key={i}>
                    {isReplicaNode && (
                      <circle cx={cx} cy={cy} r="10" fill={token.color} fillOpacity="0.2" className="animate-pulse" />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isReplicaNode ? 6 : 4}
                      fill={token.color}
                      stroke={isReplicaNode ? '#ffffff' : '#050811'}
                      strokeWidth={isReplicaNode ? 2.5 : 1.5}
                      className="transition-all"
                    />
                  </g>
                );
              })}

              {/* Selected Key Marker & Glowing Replica Beams */}
              {selectedKey && (() => {
                const keyRad = (selectedKey.angle * Math.PI) / 180;
                const kx = center + (radius + 28) * Math.cos(keyRad);
                const ky = center + (radius + 28) * Math.sin(keyRad);
                const rkx = center + radius * Math.cos(keyRad);
                const rky = center + radius * Math.sin(keyRad);

                return (
                  <g>
                    {/* Beam connecting key to ring entry point */}
                    <line
                      x1={kx}
                      y1={ky}
                      x2={rkx}
                      y2={rky}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                    />
                    <circle cx={kx} cy={ky} r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                    <text
                      x={kx + (kx > center ? 12 : -12)}
                      y={ky + 4}
                      textAnchor={kx > center ? 'start' : 'end'}
                      className="fill-amber-300 font-mono text-[11px] font-bold"
                    >
                      {selectedKey.key.length > 20 ? selectedKey.key.slice(0, 18) + '...' : selectedKey.key}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400">
              Active Key: <span className="font-mono text-amber-300 font-semibold">{selectedKey.key}</span>
            </span>
          </div>
        </div>

        {/* Replica Placement & Objects List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Replica Placement Box */}
          <div className="border border-slate-800/80 bg-slate-900/60 p-5 rounded-2xl space-y-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Clockwise Replica Set (N=3)
              </span>
              <span className="text-amber-400 font-mono text-xs font-bold">
                Murmur3 = {selectedKey.angle}&deg;
              </span>
            </div>

            <div className="space-y-2">
              {replicasForSelectedKey.map((nodeId, idx) => {
                const nodeObj = nodes.find((n) => n.id === nodeId);
                return (
                  <div
                    key={nodeId}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold bg-slate-900 text-amber-400 border border-slate-800">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white">{nodeObj?.name || nodeId}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {idx === 0 ? 'Primary Replica' : `Backup Replica ${idx}`}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border"
                      style={{
                        color: nodeObj?.color,
                        borderColor: nodeObj?.color + '55',
                        backgroundColor: nodeObj?.bgColor,
                      }}
                    >
                      {nodeId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Keys Selector */}
          <div className="border border-slate-800/80 bg-slate-900/60 p-5 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Test Objects on Ring
              </span>
              <span className="text-[11px] text-slate-400">Click to locate</span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {keysList.map((k) => (
                <button
                  key={k.key}
                  onClick={() => setSelectedKey(k)}
                  className={`w-full text-left p-2.5 rounded-lg font-mono text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedKey.key === k.key
                      ? 'bg-amber-400/10 text-amber-300 border border-amber-500/50 font-semibold'
                      : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  <span className="truncate">{k.key}</span>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">{k.angle}&deg;</span>
                </button>
              ))}
            </div>

            {/* Custom key input */}
            <form onSubmit={handleAddCustomKey} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Enter new object key (e.g. video.mp4)..."
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
              >
                Add Key
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
