import React, { useState } from 'react';
import { TopNav } from './components/TopNav';
import { Overview } from './components/Overview';
import { QuorumVisualizer } from './components/QuorumVisualizer';
import { ConsistentHashRing } from './components/ConsistentHashRing';
import { ClusterSimulator } from './components/ClusterSimulator';
import { StageGuide } from './components/StageGuide';
import { CodeExplorer } from './components/CodeExplorer';
import { RequirementTracker } from './components/RequirementTracker';
import { ReportViewer } from './components/ReportViewer';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { FresherGuide } from './components/FresherGuide';
import { GO_CODEBASE } from './data/goCodebase';
import { ACADEMIC_REPORT } from './data/academicReport';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>('storage/engine.go');

  const handleSelectCodeFile = (path: string) => {
    setSelectedCodeFile(path);
    setActiveTab('code');
  };

  const handleDownloadZip = async () => {
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

  const handleExportReport = () => {
    let md = `# ${ACADEMIC_REPORT.title}\n`;
    md += `## ${ACADEMIC_REPORT.subtitle}\n`;
    md += `**Author**: ${ACADEMIC_REPORT.author}\n\n`;
    md += `### Abstract\n${ACADEMIC_REPORT.abstract}\n\n`;

    ACADEMIC_REPORT.sections.forEach((sec) => {
      md += `## ${sec.title}\n\n${sec.content}\n\n`;
    });

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        onExportReport={handleExportReport}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && <Overview onNavigate={setActiveTab} />}
        {activeTab === 'monitoring' && <MonitoringDashboard />}
        {activeTab === 'quorum' && <QuorumVisualizer />}
        {activeTab === 'hashring' && <ConsistentHashRing />}
        {activeTab === 'simulator' && <ClusterSimulator />}
        {activeTab === 'freshers' && <FresherGuide />}
        {activeTab === 'stages' && <StageGuide onSelectCodeFile={handleSelectCodeFile} />}
        {activeTab === 'code' && <CodeExplorer initialFile={selectedCodeFile} />}
        {activeTab === 'requirements' && <RequirementTracker onSelectCodeFile={handleSelectCodeFile} />}
        {activeTab === 'report' && <ReportViewer />}
      </main>

      {/* Clean footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Vault Distributed Storage</span>
            <span>&bull;</span>
            <span>Distributed Systems Engineering Final Project</span>
          </div>
          <div className="text-[11px] font-mono text-slate-600">
            HashiCorp Raft &bull; SHA-256 CAS &bull; Murmur3 Vnodes &bull; W+R &gt; N
          </div>
        </div>
      </footer>
    </div>
  );
}
