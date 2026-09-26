import React, { useState } from 'react';
import { GO_CODEBASE, GoFile } from '../data/goCodebase';
import { Copy, Check, Download, FileCode, Search, Folder, Terminal, Code2, Sparkles } from 'lucide-react';
import JSZip from 'jszip';

interface CodeExplorerProps {
  initialFile?: string;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ initialFile }) => {
  const [selectedPath, setSelectedPath] = useState<string>(initialFile || 'storage/engine.go');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const activeFile = GO_CODEBASE.find((f) => f.path === selectedPath) || GO_CODEBASE[2];

  const filteredFiles = GO_CODEBASE.filter((f) => {
    const matchesSearch = f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAllZip = async () => {
    const zip = new JSZip();
    GO_CODEBASE.forEach((file) => {
      zip.file(file.path, file.content);
    });

    zip.file(
      'README.md',
      `# Vault: Fault-Tolerant Distributed Object Storage System

Vault is an enterprise-grade distributed storage system written in Go featuring:
- Configurable durability quorums (W, R, N)
- Strongly consistent metadata via HashiCorp Raft
- Heartbeat failure detection and routing around dead nodes
- Content addressing with SHA-256 and bit-rot self-healing
- Background replication repair and integrity scrubber
- Consistent hashing with virtual nodes

## Quickstart

\`\`\`bash
# Run all stage tests
make test

# Launch 5-node cluster locally
docker compose up -d

# Build binaries
make build

# Store object with quorum W=2
./bin/vaultctl put -key=my-file -file=test.txt
\`\`\`
`
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vault-distributed-storage-go.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Syntax colorizer helper for Go lines
  const renderSyntaxLine = (line: string) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//')) {
      return <span className="text-slate-500 italic">{line}</span>;
    }
    if (trimmed.startsWith('package ') || trimmed.startsWith('import ') || trimmed.startsWith('type ') || trimmed.startsWith('func ') || trimmed.startsWith('return ') || trimmed.startsWith('if ') || trimmed.startsWith('for ') || trimmed.startsWith('switch ') || trimmed.startsWith('case ') || trimmed.startsWith('const ') || trimmed.startsWith('var ')) {
      return (
        <span>
          <span className="text-amber-400 font-bold">{line.split(' ')[0]} </span>
          <span className="text-slate-200">{line.slice(line.indexOf(' ') + 1)}</span>
        </span>
      );
    }
    if (line.includes('`') || line.includes('"')) {
      return <span className="text-emerald-300">{line}</span>;
    }
    return <span className="text-slate-300">{line}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Code Header */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Production-Ready Implementation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Vault Go Codebase &amp; Architecture Files
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Clean, modular, thoroughly commented Go packages covering the storage engine, Raft metadata FSM, quorum coordinator, failure detector, and chaos tests.
            </p>
          </div>
          <button
            onClick={handleDownloadAllZip}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-400/20 active:scale-95 self-start"
          >
            <Download className="w-4 h-4" />
            <span>Download All Go Files (.zip)</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Go files, functions, packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {['all', 'storage', 'metadata', 'replication', 'cluster', 'api', 'chaos', 'cmd', 'config'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-[11px] font-mono rounded-lg cursor-pointer transition-colors ${
                  categoryFilter === cat
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/80 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Tree Column */}
        <div className="lg:col-span-4 border border-slate-800/80 bg-slate-900/60 p-4 rounded-2xl space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-white uppercase font-mono tracking-wider">
              Project Files ({filteredFiles.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">Go 1.22</span>
          </div>

          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedPath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500/80 bg-amber-400/10 text-white shadow-sm shadow-amber-500/10'
                      : 'border-slate-800/80 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-amber-300 truncate">
                      {file.path}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0 ml-2">
                      Stage {file.stage}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">{file.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Column (IDE Style) */}
        <div className="lg:col-span-8 border border-slate-800/80 bg-slate-950 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          {/* Terminal / IDE Chrome Header */}
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            {/* Mac style dots + File Tab */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="h-4 w-[1px] bg-slate-800 mx-1" />
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold text-white">{activeFile.path}</span>
                <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                  Stage {activeFile.stage}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Description banner */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
            // {activeFile.description}
          </div>

          {/* Code Viewer with Line Numbers and Syntax Colors */}
          <div className="p-4 bg-slate-950 overflow-x-auto flex-1 max-h-[520px] font-mono text-xs leading-relaxed">
            <pre className="whitespace-pre">
              {activeFile.content.split('\n').map((line, i) => (
                <div key={i} className="table-row hover:bg-slate-900/40 transition-colors">
                  <span className="table-cell pr-5 text-slate-600 select-none text-right font-mono text-[11px] w-10">
                    {i + 1}
                  </span>
                  <span className="table-cell select-text">{renderSyntaxLine(line)}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
