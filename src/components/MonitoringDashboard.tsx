import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Activity,
  HardDrive,
  Cpu,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface LatencyPoint {
  time: string;
  writeP95: number;
  readP95: number;
  writeP50: number;
  readP50: number;
}

interface NodeUtilization {
  name: string;
  usedGB: number;
  freeGB: number;
  status: 'Healthy' | 'Degraded' | 'Offline';
  chunks: number;
}

interface ThroughputPoint {
  time: string;
  writesPerSec: number;
  readsPerSec: number;
}

const INITIAL_LATENCY_DATA: LatencyPoint[] = [
  { time: '12:00:00', writeP95: 18, readP95: 8, writeP50: 11, readP50: 4 },
  { time: '12:00:05', writeP95: 22, readP95: 9, writeP50: 12, readP50: 5 },
  { time: '12:00:10', writeP95: 25, readP95: 11, writeP50: 14, readP50: 5 },
  { time: '12:00:15', writeP95: 35, readP95: 14, writeP50: 19, readP50: 7 },
  { time: '12:00:20', writeP95: 28, readP95: 10, writeP50: 15, readP50: 5 },
  { time: '12:00:25', writeP95: 20, readP95: 9, writeP50: 12, readP50: 4 },
  { time: '12:00:30', writeP95: 19, readP95: 8, writeP50: 11, readP50: 4 },
  { time: '12:00:35', writeP95: 24, readP95: 10, writeP50: 13, readP50: 5 },
  { time: '12:00:40', writeP95: 29, readP95: 12, writeP50: 16, readP50: 6 },
  { time: '12:00:45', writeP95: 21, readP95: 9, writeP50: 12, readP50: 4 },
];

const INITIAL_NODE_STORAGE: NodeUtilization[] = [
  { name: 'Node 1 (Leader)', usedGB: 42.5, freeGB: 57.5, status: 'Healthy', chunks: 1420 },
  { name: 'Node 2', usedGB: 41.2, freeGB: 58.8, status: 'Healthy', chunks: 1395 },
  { name: 'Node 3', usedGB: 43.8, freeGB: 56.2, status: 'Healthy', chunks: 1445 },
  { name: 'Node 4', usedGB: 38.6, freeGB: 61.4, status: 'Healthy', chunks: 1280 },
  { name: 'Node 5', usedGB: 39.4, freeGB: 60.6, status: 'Healthy', chunks: 1310 },
];

const INITIAL_THROUGHPUT: ThroughputPoint[] = [
  { time: '12:00:00', writesPerSec: 120, readsPerSec: 450 },
  { time: '12:00:05', writesPerSec: 145, readsPerSec: 520 },
  { time: '12:00:10', writesPerSec: 180, readsPerSec: 610 },
  { time: '12:00:15', writesPerSec: 290, readsPerSec: 890 },
  { time: '12:00:20', writesPerSec: 210, readsPerSec: 740 },
  { time: '12:00:25', writesPerSec: 160, readsPerSec: 580 },
  { time: '12:00:30', writesPerSec: 140, readsPerSec: 500 },
  { time: '12:00:35', writesPerSec: 175, readsPerSec: 630 },
  { time: '12:00:40', writesPerSec: 220, readsPerSec: 780 },
  { time: '12:00:45', writesPerSec: 155, readsPerSec: 540 },
];

export const MonitoringDashboard: React.FC = () => {
  const [latencyData, setLatencyData] = useState<LatencyPoint[]>(INITIAL_LATENCY_DATA);
  const [nodeStorage, setNodeStorage] = useState<NodeUtilization[]>(INITIAL_NODE_STORAGE);
  const [throughputData, setThroughputData] = useState<ThroughputPoint[]>(INITIAL_THROUGHPUT);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [showFresherTips, setShowFresherTips] = useState<boolean>(true);

  // Live telemetry pulse
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      // Add small jitter
      const nextWriteP95 = Math.floor(Math.random() * 15) + 16;
      const nextReadP95 = Math.floor(Math.random() * 6) + 7;
      const nextWriteP50 = Math.floor(nextWriteP95 * 0.6);
      const nextReadP50 = Math.floor(nextReadP95 * 0.5);

      setLatencyData((prev) => [
        ...prev.slice(1),
        {
          time: timeStr,
          writeP95: nextWriteP95,
          readP95: nextReadP95,
          writeP50: nextWriteP50,
          readP50: nextReadP50,
        },
      ]);

      const nextWrites = Math.floor(Math.random() * 80) + 130;
      const nextReads = Math.floor(Math.random() * 250) + 480;

      setThroughputData((prev) => [
        ...prev.slice(1),
        {
          time: timeStr,
          writesPerSec: nextWrites,
          readsPerSec: nextReads,
        },
      ]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Simulate a sudden load spike (great for demos)
  const handleSimulateSpike = () => {
    const now = new Date().toTimeString().split(' ')[0];
    setLatencyData((prev) => [
      ...prev.slice(1),
      { time: now, writeP95: 84, readP95: 42, writeP50: 48, readP50: 22 },
    ]);
    setThroughputData((prev) => [
      ...prev.slice(1),
      { time: now, writesPerSec: 640, readsPerSec: 2100 },
    ]);
  };

  // Reset telemetry
  const handleReset = () => {
    setLatencyData(INITIAL_LATENCY_DATA);
    setNodeStorage(INITIAL_NODE_STORAGE);
    setThroughputData(INITIAL_THROUGHPUT);
  };

  const healthColors = {
    Healthy: '#10b981',
    Degraded: '#f59e0b',
    Offline: '#f43f5e',
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Live Cluster Telemetry &amp; Metrics
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Vault Cluster Health &amp; Performance Telemetry
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time monitoring of P95/P50 read and write latencies, per-node disk utilization, and request throughput. Designed with intuitive guides for beginners learning distributed systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowFresherTips(!showFresherTips)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                showFresherTips
                  ? 'bg-amber-400/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{showFresherTips ? "Fresher's Mode ON" : "Fresher's Mode"}</span>
            </button>

            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              {isLiveStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resume Stream</span>
                </>
              )}
            </button>

            <button
              onClick={handleSimulateSpike}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-400/20 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Simulate Load Spike</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
              title="Reset data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Beginner's Welcome Banner */}
        {showFresherTips && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-cyan-500/10 border border-amber-500/30 text-xs text-slate-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">
                Fresher&apos;s Quick Distributed Systems Cheat Sheet:
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                &bull; <strong className="text-white">Write Latency &gt; Read Latency</strong>: Writes take longer because Vault writes to multiple nodes concurrently (<span className="font-mono text-amber-300">W=2</span>) and waits for acknowledgments. Reads return as soon as the read quorum (<span className="font-mono text-cyan-300">R=2</span>) verifies the highest version.<br />
                &bull; <strong className="text-white">P95 vs P50</strong>: P50 is the median response time. P95 represents the slowest 5% of requests (caused by network jitter or disk commit stalls). Production engineers always optimize for P95/P99!
              </p>
            </div>
          </div>
        )}

        {/* Live Top Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
              <span>Write Latency (P95)</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {latencyData[latencyData.length - 1].writeP95} ms
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">W=2 Quorum Parallel ACK</div>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
              <span>Read Latency (P95)</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
              {latencyData[latencyData.length - 1].readP95} ms
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">R=2 Quorum &amp; SHA-256 Check</div>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
              <span>Cluster Throughput</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {throughputData[throughputData.length - 1].writesPerSec +
                throughputData[throughputData.length - 1].readsPerSec}{' '}
              <span className="text-xs text-slate-400">ops/s</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              {throughputData[throughputData.length - 1].writesPerSec} writes &bull;{' '}
              {throughputData[throughputData.length - 1].readsPerSec} reads
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono font-semibold">
              <span>Cluster Availability</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">99.995%</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">5/5 Nodes Online &bull; Leader Term 1</div>
          </div>
        </div>
      </div>

      {/* Grid of Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Read/Write Latency (ms) Area Chart */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-5 lg:p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Read &amp; Write Latency (ms)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time percentile tracking across concurrent quorum requests.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
              P95 &amp; P50 Percentiles
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="writeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontStyle="monospace" />
                <YAxis stroke="#64748b" fontSize={10} fontStyle="monospace" unit="ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="writeP95"
                  name="Write Latency P95 (ms)"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#writeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="readP95"
                  name="Read Latency P95 (ms)"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#readGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {showFresherTips && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold font-mono">Why does this matter?</span> In Vault, a write requires <span className="text-white">W=2</span> physical nodes to save the file and fsync to disk before returning, which causes write latency to be higher than read latency.
            </div>
          )}
        </div>

        {/* Chart 2: Storage Utilization per Node Bar Chart */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-5 lg:p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Node Storage Utilization (GB)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Disk usage balance achieved by Consistent Hash Ring with 100 vnodes.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/30">
              100 GB Disk / Node
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nodeStorage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontStyle="monospace" />
                <YAxis stroke="#64748b" fontSize={10} fontStyle="monospace" unit="GB" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="usedGB" name="Used Storage (GB)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="freeGB" name="Free Space (GB)" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {showFresherTips && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <span className="text-cyan-400 font-semibold font-mono">Why does this matter?</span> Consistent hashing ensures every storage node carries roughly equal load (~40 GB each). If one node had 90 GB and another had 5 GB, that would be a hot-spot skew.
            </div>
          )}
        </div>

        {/* Chart 3: Cluster Throughput (Ops/sec) Line Chart */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-5 lg:p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Request Throughput (Ops/sec)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Concurrent client PUT vs GET workload throughput.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
              Read-Heavy Workload (4:1)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontStyle="monospace" />
                <YAxis stroke="#64748b" fontSize={10} fontStyle="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="readsPerSec"
                  name="Reads / sec (GET)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="writesPerSec"
                  name="Writes / sec (PUT)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {showFresherTips && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold font-mono">Why does this matter?</span> Real-world object storage systems (like Amazon S3 or Google Cloud Storage) are read-heavy: typically 80% to 90% of requests are reads, and 10% to 20% are writes.
            </div>
          )}
        </div>

        {/* Chart 4: Storage Node Health & Replicas Balance Breakdown */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-5 lg:p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Node Health &amp; Replica Chunks</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current cluster status and chunk distribution across live nodes.
              </p>
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/30">
              N=3 Replicas
            </span>
          </div>

          {/* Table of Nodes with live badges */}
          <div className="space-y-2 overflow-x-auto">
            {nodeStorage.map((node, i) => (
              <div
                key={node.name}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div>
                    <span className="font-semibold text-white font-mono">{node.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2">({node.chunks} chunks stored)</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400">Used: {node.usedGB} GB</span>
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${node.usedGB}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                    {node.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {showFresherTips && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <span className="text-purple-400 font-semibold font-mono">Why does this matter?</span> If Node 2 dies, the background repair engine immediately copies its chunks onto remaining nodes (Nodes 3, 4, 5) to keep replication factor at <span className="text-white">N=3</span>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
