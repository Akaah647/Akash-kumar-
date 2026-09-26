import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Vote,
  ShieldAlert,
  Compass,
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Concept {
  id: string;
  title: string;
  icon: any;
  simpleAnalogy: string;
  howVaultDoesIt: string;
  interviewTip: string;
}

const CONCEPTS: Concept[] = [
  {
    id: 'quorum',
    title: '1. What is Quorum? (W + R > N)',
    icon: Vote,
    simpleAnalogy:
      'Imagine 3 friends (Alice, Bob, Charlie) voting on a plan. If you tell 2 friends (Write W=2) and later ask any 2 friends (Read R=2), at least 1 person you ask was present when the plan was made! They will give you the updated version.',
    howVaultDoesIt:
      'Vault sets N=3 total copies. Whenever you upload a file, Vault requires at least W=2 nodes to say "I got it!". Whenever you read, Vault asks R=2 nodes. Because 2 + 2 = 4 (which is greater than 3), you never read stale data!',
    interviewTip:
      'In interviews, this is called the Pigeonhole Principle. Always state: "When W + R > N, strong read-your-writes consistency is guaranteed."',
  },
  {
    id: 'bitrot',
    title: '2. What is Bit-Rot & Silent Corruption?',
    icon: ShieldAlert,
    simpleAnalogy:
      'Think of a scratched music CD. The CD player does not throw an error, but the music sounds distorted. Similarly, physical hard drives can flip random 0s to 1s due to magnetic decay or cosmic rays without the operating system noticing.',
    howVaultDoesIt:
      'Every file uploaded to Vault gets a unique cryptographic SHA-256 digital fingerprint. When you read the file or when the background scrubber sweeps the disk, Vault re-calculates the fingerprint. If a single bit changed, Vault detects it and heals it from another healthy node!',
    interviewTip:
      'Interviewers love this question: "How do you detect silent data corruption?" Answer: "End-to-end cryptographic checksums (SHA-256) checked on read and periodic background scrubbing."',
  },
  {
    id: 'consistent-hashing',
    title: '3. What is Consistent Hashing & Ring Rebalancing?',
    icon: Compass,
    simpleAnalogy:
      'Imagine 5 students sitting in a circle. You throw balls with names on them into the circle. Each ball goes to the next closest student clockwise. If a 6th student joins, they only take a few balls from their direct neighbor—the other 4 students don’t have to move anything!',
    howVaultDoesIt:
      'Instead of modulo hashing (hash % N) which causes almost 100% of data to move when adding a server, Vault uses a 360° ring with virtual nodes. When a new node joins, only 1/(N+1) of the data moves.',
    interviewTip:
      'Formula to memorize: With modulo hashing, changing N moves (N-1)/N (~100%) of keys. With consistent hashing, only 1/(N+1) keys move.',
  },
  {
    id: 'raft',
    title: '4. Why Raft Consensus for Metadata?',
    icon: GitPullRequest,
    simpleAnalogy:
      'Imagine a committee of 5 judges. Before an official decision is stamped, a majority (at least 3 judges) must sign the paper. If 2 judges lose internet connection, the 3 judges can still agree and make progress. But if the group is split into 2 and 3, only the group of 3 can act.',
    howVaultDoesIt:
      'Vault uses HashiCorp Raft to record which node holds which file. Because metadata requires strict accuracy (you cannot lose track of where files are), Raft guarantees that split-brain is impossible during network disconnects.',
    interviewTip:
      'In CAP Theorem terms: Raft chooses CP (Consistency and Partition tolerance over 100% availability during network splits).',
  },
  {
    id: 'cas',
    title: '5. What is Content Addressing (CAS)?',
    icon: CheckCircle2,
    simpleAnalogy:
      'Instead of naming a parcel "Package A" or "Box 12", you name it after the exact barcode hash of its contents. If two people send the exact same book, you only need to store one copy because both have the identical barcode!',
    howVaultDoesIt:
      'Vault hashes file bytes with SHA-256. The file path on disk is data/ab/cd/<hash>. This gives automatic deduplication and makes tampering immediately obvious.',
    interviewTip:
      'Git itself works this exact same way! Every Git commit and blob is addressed by its SHA hash.',
  },
];

export const FresherGuide: React.FC = () => {
  const [openConceptId, setOpenConceptId] = useState<string>('quorum');

  return (
    <div className="border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              Beginner&apos;s Mental Models
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-1">
            Distributed Systems Concepts in Simple English
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Designed for freshers, students, and new engineers: real-life analogies to demystify complex distributed storage.
          </p>
        </div>
      </div>

      {/* Accordion List of Concepts */}
      <div className="space-y-3">
        {CONCEPTS.map((c) => {
          const isOpen = openConceptId === c.id;
          const Icon = c.icon;

          return (
            <div
              key={c.id}
              className={`rounded-xl border transition-all ${
                isOpen
                  ? 'border-amber-500/60 bg-slate-950 shadow-md shadow-amber-500/5'
                  : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => setOpenConceptId(isOpen ? '' : c.id)}
                className="w-full text-left p-4 flex items-center justify-between cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      isOpen
                        ? 'bg-amber-400/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-white">{c.title}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 space-y-4 text-xs border-t border-slate-800/80 mt-1">
                  <div>
                    <span className="font-bold text-amber-400 uppercase font-mono text-[10px] block mb-1">
                      Real-Life Analogy
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {c.simpleAnalogy}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-cyan-400 uppercase font-mono text-[10px] block mb-1">
                      How Vault Implements This in Go
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {c.howVaultDoesIt}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-800/60 text-emerald-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Fresher Interview &amp; Exam Tip: </span>
                      <span>{c.interviewTip}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
