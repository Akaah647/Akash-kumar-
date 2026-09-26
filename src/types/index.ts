export interface StorageNode {
  id: string;
  address: string;
  status: 'healthy' | 'suspect' | 'dead' | 'recovering';
  isRaftLeader?: boolean;
  role: 'leader' | 'follower' | 'candidate';
  storedObjects: {
    hash: string;
    key: string;
    version: number;
    size: number;
    corrupted?: boolean;
    checksum: string;
    storedAt: number;
  }[];
  usedCapacityBytes: number;
  totalCapacityBytes: number;
  heartbeatAgeMs: number;
  ringTokens: number[]; // Vnode positions on the hash ring
}

export interface StoredObject {
  key: string;
  hash: string;
  size: number;
  version: number;
  replicas: string[]; // Node IDs
  createdAt: number;
  status: 'nominal' | 'degraded' | 'corrupted' | 'repaired';
  payloadPreview?: string;
}

export interface RaftLogEntry {
  index: number;
  term: number;
  command: string;
  data: any;
  committed: boolean;
}

export interface QuorumConfig {
  n: number; // Replication factor
  w: number; // Write quorum
  r: number; // Read quorum
}

export interface RequirementItem {
  id: string;
  title: string;
  category: 'Durability' | 'Consistency' | 'Availability' | 'Integrity' | 'Cluster Management';
  stage: number;
  description: string;
  howSatisfied: string;
  verificationMethod: string;
  testCommand: string;
  status: 'verified' | 'in-progress' | 'planned';
  codeReference: string;
  rubricNotes: string;
  tradeoffs: string;
}

export interface StageDefinition {
  stage: number;
  title: string;
  subtitle: string;
  summary: string;
  packages: string[];
  keyConcepts: string[];
  testCommand: string;
  sampleOutput: string;
  simplifications: string[];
  files: {
    path: string;
    language: string;
    description: string;
  }[];
}

export interface ChaosRunMetrics {
  totalRequests: number;
  successfulWrites: number;
  failedWrites: number;
  staleReadsDetected: number;
  bitRotDetected: number;
  selfHealedCount: number;
  mttrSeconds: number;
  durabilityPercentage: number;
}
