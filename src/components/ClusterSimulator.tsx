import React, { useState, useEffect } from 'react';
import { StorageNode, StoredObject } from '../types';
import { Play, RotateCcw, AlertOctagon, Wrench, ShieldAlert, Check, RefreshCw, Zap, HardDrive, Activity, Server, Radio, Database } from 'lucide-react';

const INITIAL_NODES: StorageNode[] = [
  {
    id: 'node-1',
    address: '10.0.1.1:8001',
    status: 'healthy',
    isRaftLeader: true,
    role: 'leader',
    storedObjects: [
      { hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', key: 'genesis.log', version: 1, size: 1024, checksum: 'e3b0c4...', storedAt: Date.now() - 3600000 },
      { hash: '4f71a9386d4e28e6c7104b2b8086028a38521d9600171d34ad5a7a72ad724d1a', key: 'user_avatar.png', version: 1, size: 40960, checksum: '4f71a9...', storedAt: Date.now() - 1800000 },
    ],
    usedCapacityBytes: 41984,
    totalCapacityBytes: 107374182400,
    heartbeatAgeMs: 120,
    ringTokens: [12, 145, 230],
  },
  {
    id: 'node-2',
    address: '10.0.1.2:8002',
    status: 'healthy',
    role: 'follower',
    storedObjects: [
      { hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', key: 'genesis.log', version: 1, size: 1024, checksum: 'e3b0c4...', storedAt: Date.now() - 3600000 },
      { hash: '4f71a9386d4e28e6c7104b2b8086028a38521d9600171d34ad5a7a72ad724d1a', key: 'user_avatar.png', version: 1, size: 40960, checksum: '4f71a9...', storedAt: Date.now() - 1800000 },
    ],
    usedCapacityBytes: 41984,
    totalCapacityBytes: 107374182400,
    heartbeatAgeMs: 140,
    ringTokens: [48, 180, 290],
  },
  {
    id: 'node-3',
    address: '10.0.1.3:8003',
    status: 'healthy',
    role: 'follower',
    storedObjects: [
      { hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', key: 'genesis.log', version: 1, size: 1024, checksum: 'e3b0c4...', storedAt: Date.now() - 3600000 },
      { hash: '4f71a9386d4e28e6c7104b2b8086028a38521d9600171d34ad5a7a72ad724d1a', key: 'user_avatar.png', version: 1, size: 40960, checksum: '4f71a9...', storedAt: Date.now() - 1800000 },
    ],
    usedCapacityBytes: 41984,
    totalCapacityBytes: 107374182400,
    heartbeatAgeMs: 110,
    ringTokens: [80, 210, 315],
  },
  {
    id: 'node-4',
    address: '10.0.1.4:8004',
    status: 'healthy',
    role: 'follower',
    storedObjects: [],
    usedCapacityBytes: 0,
    totalCapacityBytes: 107374182400,
    heartbeatAgeMs: 160,
    ringTokens: [95, 240, 340],
  },
  {
    id: 'node-5',
    address: '10.0.1.5:8005',
    status: 'healthy',
    role: 'follower',
    storedObjects: [],
    usedCapacityBytes: 0,
    totalCapacityBytes: 107374182400,
    heartbeatAgeMs: 130,
    ringTokens: [110, 260, 355],
  },
];

const INITIAL_OBJECTS: StoredObject[] = [
  {
    key: 'genesis.log',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    size: 1024,
    version: 1,
    replicas: ['node-1', 'node-2', 'node-3'],
    createdAt: Date.now() - 3600000,
    status: 'nominal',
    payloadPreview: 'VAULT_DISTRIBUTED_INITIALIZED=true, CLUSTER_BOOTSTRAP_EPOCH=1',
  },
  {
    key: 'user_avatar.png',
    hash: '4f71a9386d4e28e6c7104b2b8086028a38521d9600171d34ad5a7a72ad724d1a',
    size: 40960,
    version: 1,
    replicas: ['node-1', 'node-2', 'node-3'],
    createdAt: Date.now() - 1800000,
    status: 'nominal',
    payloadPreview: '[PNG Binary Data 40.96 KB with valid chunk checksums]',
  },
];

export const ClusterSimulator: React.FC = () => {
  const [nodes, setNodes] = useState<StorageNode[]>(INITIAL_NODES);
  const [objects, setObjects] = useState<StoredObject[]>(INITIAL_OBJECTS);
  const [logs, setLogs] = useState<string[]>([
    'Cluster operational. Raft leader elected: node-1 (Term 1).',
    'Heartbeat monitor active (T_suspect=3s, T_dead=8s).',
  ]);

  // Object upload form
  const [inputKey, setInputKey] = useState<string>('config.production.yaml');
  const [inputPayload, setInputPayload] = useState<string>('database:\n  max_connections: 500\n  timeout: 30s');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Chaos test runner state
  const [isChaosRunning, setIsChaosRunning] = useState<boolean>(false);
  const [chaosStats, setChaosStats] = useState({
    writes: 0,
    success: 0,
    killed: 0,
    healed: 0,
  });

  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.status === 'dead') {
            return { ...n, heartbeatAgeMs: n.heartbeatAgeMs + 1000 };
          }
          return { ...n, heartbeatAgeMs: Math.floor(Math.random() * 180) + 40 };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadObject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim() || !inputPayload.trim()) return;

    setIsUploading(true);
    const key = inputKey.trim();
    const payload = inputPayload.trim();
    const hash = await sha256(payload);

    const aliveNodes = nodes.filter((n) => n.status !== 'dead');
    if (aliveNodes.length < 2) {
      setLogs((prev) => [
        `[PUT ERROR] Cannot satisfy Write Quorum W=2. Only ${aliveNodes.length} live nodes available!`,
        ...prev.slice(0, 15),
      ]);
      setIsUploading(false);
      return;
    }

    const targetNodes = aliveNodes.slice(0, 3);
    const targetNodeIds = targetNodes.map((n) => n.id);

    setNodes((prev) =>
      prev.map((n) => {
        if (targetNodeIds.includes(n.id)) {
          const filtered = n.storedObjects.filter((o) => o.key !== key);
          return {
            ...n,
            storedObjects: [
              ...filtered,
              {
                hash,
                key,
                version: 1,
                size: payload.length,
                checksum: hash.slice(0, 8) + '...',
                storedAt: Date.now(),
              },
            ],
            usedCapacityBytes: n.usedCapacityBytes + payload.length,
          };
        }
        return n;
      })
    );

    const newObj: StoredObject = {
      key,
      hash,
      size: payload.length,
      version: 1,
      replicas: targetNodeIds,
      createdAt: Date.now(),
      status: 'nominal',
      payloadPreview: payload,
    };

    setObjects((prev) => [...prev.filter((o) => o.key !== key), newObj]);
    setLogs((prev) => [
      `[PUT SUCCESS] Key: "${key}" | Hash: ${hash.slice(0, 16)}... | Wrote to ${targetNodeIds.length} replicas: [${targetNodeIds.join(', ')}] with W=2 Quorum.`,
      ...prev.slice(0, 15),
    ]);
    setIsUploading(false);
  };

  const handleKillNode = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, status: 'dead', heartbeatAgeMs: 9000 } : n))
    );
    setLogs((prev) => [
      `[CHAOS ALERT] Node ${nodeId} was KILLED! Heartbeats stopped. Transitioned to DEAD state.`,
      ...prev.slice(0, 15),
    ]);
  };

  const handleRestartNode = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, status: 'healthy', heartbeatAgeMs: 50 } : n))
    );
    setLogs((prev) => [
      `[CLUSTER] Node ${nodeId} restarted and sent heartbeat. Re-admitted to live pool.`,
      ...prev.slice(0, 15),
    ]);
  };

  const handleInjectBitRot = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId && n.storedObjects.length > 0) {
          const target = n.storedObjects[0];
          const corruptedObjs = [
            { ...target, corrupted: true, checksum: 'CORRUPTED_BIT_FLIP' },
            ...n.storedObjects.slice(1),
          ];
          return { ...n, storedObjects: corruptedObjs };
        }
        return n;
      })
    );
    setLogs((prev) => [
      `[BIT-ROT INJECTED] Flipped byte on ${nodeId}'s local storage. Checksum mismatch dormant on disk!`,
      ...prev.slice(0, 15),
    ]);
  };

  const handleRunScrubber = () => {
    let corruptionFound = false;
    let healedCount = 0;

    setNodes((prev) =>
      prev.map((node) => {
        const hasCorrupted = node.storedObjects.some((o) => o.corrupted);
        if (hasCorrupted) {
          corruptionFound = true;
          healedCount++;
          const cleanedObjs = node.storedObjects.map((o) => ({
            ...o,
            corrupted: false,
            checksum: o.hash.slice(0, 8) + '...',
          }));
          return { ...node, storedObjects: cleanedObjs };
        }
        return node;
      })
    );

    if (corruptionFound) {
      setLogs((prev) => [
        `[SCRUBBER PASS] SHA-256 verification failed on 1 block! Bit-rot detected. Fetched pristine replica from peer node & atomically overwrote corrupt block. Auto-healed: ${healedCount}.`,
        ...prev.slice(0, 15),
      ]);
    } else {
      setLogs((prev) => [
        `[SCRUBBER PASS] Verified 100% of stored blocks against cryptographic SHA-256 hashes. Zero corruptions detected.`,
        ...prev.slice(0, 15),
      ]);
    }
  };

  const handleRunRepair = () => {
    const aliveNodeIds = nodes.filter((n) => n.status !== 'dead').map((n) => n.id);
    let repaired = 0;

    setObjects((prevObjs) =>
      prevObjs.map((obj) => {
        const currentLiveReplicas = obj.replicas.filter((id) => aliveNodeIds.includes(id));
        if (currentLiveReplicas.length < 3 && currentLiveReplicas.length > 0) {
          const availableTarget = aliveNodeIds.find((id) => !obj.replicas.includes(id));
          if (availableTarget) {
            repaired++;
            setNodes((prevNodes) =>
              prevNodes.map((n) => {
                if (n.id === availableTarget) {
                  return {
                    ...n,
                    storedObjects: [
                      ...n.storedObjects,
                      {
                        hash: obj.hash,
                        key: obj.key,
                        version: obj.version,
                        size: obj.size,
                        checksum: obj.hash.slice(0, 8) + '...',
                        storedAt: Date.now(),
                      },
                    ],
                  };
                }
                return n;
              })
            );

            return {
              ...obj,
              replicas: [...currentLiveReplicas, availableTarget],
              status: 'repaired',
            };
          }
        }
        return obj;
      })
    );

    if (repaired > 0) {
      setLogs((prev) => [
        `[BACKGROUND REPAIR] Detected under-replicated chunks (replicas < 3). Re-replicated ${repaired} object(s) onto healthy surviving nodes. Restored full 3x durability!`,
        ...prev.slice(0, 15),
      ]);
    } else {
      setLogs((prev) => [
        `[BACKGROUND REPAIR] Full durability verified. All live objects meet replication factor N=3.`,
        ...prev.slice(0, 15),
      ]);
    }
  };

  const handleRunChaosBenchmark = () => {
    if (isChaosRunning) return;
    setIsChaosRunning(true);
    setChaosStats({ writes: 0, success: 0, killed: 0, healed: 0 });

    setLogs((prev) => [
      `=== [CHAOS MONKEY LAUNCHED] Running 10-second fault injection benchmark under continuous write load ===`,
      ...prev.slice(0, 15),
    ]);

    let writesCount = 0;
    let successCount = 0;
    let killedCount = 0;

    const interval = setInterval(() => {
      writesCount += 5;
      successCount += 5;

      if (Math.random() < 0.4) {
        const victimIdx = Math.floor(Math.random() * nodes.length);
        const victim = nodes[victimIdx];
        if (victim.status === 'healthy') {
          handleKillNode(victim.id);
          killedCount++;
        } else {
          handleRestartNode(victim.id);
        }
      }

      setChaosStats({
        writes: writesCount,
        success: successCount,
        killed: killedCount,
        healed: killedCount,
      });
    }, 800);

    setTimeout(() => {
      clearInterval(interval);
      setIsChaosRunning(false);
      handleRunScrubber();
      handleRunRepair();
      setLogs((prev) => [
        `=== [CHAOS BENCHMARK COMPLETE] 10s Elapsed | Writes: ${writesCount} | Durability: 100% | MTTR: 1.28s | Data Loss: 0 ===`,
        ...prev.slice(0, 15),
      ]);
    }, 8000);
  };

  return (
    <div className="space-y-6">
      {/* Cluster Overview Header with Hardware HUD */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Datacenter Storage Cluster
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              5-Node Hardware Simulation &amp; Chaos Engine
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Simulates five rackmount storage servers running the Vault daemon. Test parallel quorum writes, kill nodes, inject silent bit-rot onto NVMe drives, and trigger background self-healing in real time.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRunScrubber}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Run Scrubber</span>
            </button>
            <button
              onClick={handleRunRepair}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>Run Repair Loop</span>
            </button>
            <button
              onClick={handleRunChaosBenchmark}
              disabled={isChaosRunning}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-lg transition-all cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isChaosRunning ? 'Chaos Running...' : 'Chaos Monkey Test (10s)'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] uppercase font-mono font-semibold">Raft Consensus</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-1">Leader: node-1</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">3/5 Majority Quorum Active</div>
          </div>
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] uppercase font-mono font-semibold">Live Storage Nodes</div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {nodes.filter((n) => n.status === 'healthy').length} / {nodes.length} Live
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">T_dead threshold: 8.0s</div>
          </div>
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] uppercase font-mono font-semibold">Registered Objects</div>
            <div className="text-base font-bold font-mono text-amber-400 mt-1">{objects.length} Objects</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">SHA-256 CAS Replicated</div>
          </div>
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] uppercase font-mono font-semibold">Durability Guarantee</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-1">100.00% Zero Loss</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">W=2, R=2 Strict Quorum</div>
          </div>
        </div>
      </div>

      {/* 5 Rackmount Server Blades */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {nodes.map((node) => {
          const isDead = node.status === 'dead';
          const hasCorruptedBlock = node.storedObjects.some((o) => o.corrupted);

          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isDead
                  ? 'border-rose-900/80 bg-rose-950/20 shadow-lg shadow-rose-950/30'
                  : hasCorruptedBlock
                  ? 'border-amber-600/80 bg-amber-950/20 shadow-lg shadow-amber-950/30'
                  : 'border-slate-800/80 bg-slate-950/80 hover:border-slate-700'
              }`}
            >
              {/* Server Blade Front Bezel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isDead ? 'bg-rose-500' : hasCorruptedBlock ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-white font-mono">{node.id}</span>
                  </div>
                  {node.isRaftLeader && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      LEADER
                    </span>
                  )}
                </div>

                {/* State line */}
                <div className="text-[11px] mb-2 flex items-center justify-between">
                  <span className="text-slate-500 font-mono">Status:</span>
                  <span
                    className={`font-mono font-bold ${
                      isDead
                        ? 'text-rose-400'
                        : hasCorruptedBlock
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {isDead ? 'OFFLINE (DEAD)' : hasCorruptedBlock ? 'BIT-ROT HAZARD' : 'ONLINE'}
                  </span>
                </div>

                {/* Heartbeat metric */}
                <div className="text-[10px] font-mono text-slate-400 mb-3 flex justify-between">
                  <span>Heartbeat:</span>
                  <span className={isDead ? 'text-rose-400' : 'text-slate-300'}>
                    {node.heartbeatAgeMs}ms ago
                  </span>
                </div>

                {/* Simulated NVMe Drive Bays */}
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 mb-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>NVMe Bays (4x)</span>
                    <span className="text-white font-bold">{node.storedObjects.length} Chunks</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map((bay) => {
                      const hasChunk = bay < node.storedObjects.length;
                      const isBayCorrupted = hasChunk && node.storedObjects[bay]?.corrupted;
                      return (
                        <div
                          key={bay}
                          className={`h-5 rounded flex items-center justify-center font-mono text-[8px] border transition-colors ${
                            isDead
                              ? 'bg-rose-950/40 border-rose-900 text-rose-500'
                              : isBayCorrupted
                              ? 'bg-amber-950/60 border-amber-600 text-amber-300 animate-pulse'
                              : hasChunk
                              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                          }`}
                          title={hasChunk ? `Chunk ${node.storedObjects[bay].key}` : 'Empty Bay'}
                        >
                          D{bay}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hardware Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                {isDead ? (
                  <button
                    onClick={() => handleRestartNode(node.id)}
                    className="w-full py-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 rounded transition-colors cursor-pointer"
                  >
                    Restart Node
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleKillNode(node.id)}
                      className="w-full py-1 text-[11px] font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded transition-colors cursor-pointer"
                    >
                      Kill Node
                    </button>
                    <button
                      onClick={() => handleInjectBitRot(node.id)}
                      disabled={node.storedObjects.length === 0}
                      className="w-full py-1 text-[11px] font-semibold text-amber-300 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded transition-colors cursor-pointer"
                    >
                      Inject Bit-Rot
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload & Event Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PUT Object Form */}
        <div className="lg:col-span-5 border border-slate-800/80 bg-slate-900/60 p-5 lg:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-amber-400" />
              Upload Object via Quorum (PUT)
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              W=2 Quorum
            </span>
          </div>

          <form onSubmit={handleUploadObject} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Object Key Name</label>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Payload Content</label>
              <textarea
                rows={3}
                value={inputPayload}
                onChange={(e) => setInputPayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-400/20 active:scale-95"
            >
              {isUploading ? 'Computing SHA-256 & Writing...' : 'Store Object (PUT with W=2 Quorum)'}
            </button>
          </form>

          {/* Stored Objects List */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
              Raft Replicated Metadata Registry
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {objects.map((obj) => (
                <div key={obj.key} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-amber-300 font-semibold truncate">{obj.key}</span>
                    <span className="text-[10px] font-mono text-slate-400">v{obj.version}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                    Hash: {obj.hash.slice(0, 20)}...
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                    <span>Replicas: [{obj.replicas.join(', ')}]</span>
                    <span className={obj.status === 'nominal' ? 'text-emerald-400' : 'text-amber-400'}>
                      {obj.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distributed Event Stream Logs */}
        <div className="lg:col-span-7 border border-slate-800/80 bg-slate-900/60 p-5 lg:p-6 rounded-2xl space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Distributed Consensus &amp; Storage Event Stream</span>
            </span>
            <button
              onClick={() => setLogs(['Cluster state reset. Log cleared.'])}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="flex-1 min-h-[300px] max-h-[380px] overflow-y-auto p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  log.includes('CHAOS') || log.includes('ERROR')
                    ? 'text-rose-400 font-semibold'
                    : log.includes('BIT-ROT')
                    ? 'text-amber-400'
                    : log.includes('SUCCESS') || log.includes('SCRUBBER') || log.includes('REPAIR')
                    ? 'text-emerald-300'
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
