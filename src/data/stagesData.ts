import { StageDefinition } from '../types';

export const STAGES: StageDefinition[] = [
  {
    stage: 1,
    title: "Stage 1: Single-Node Storage Engine",
    subtitle: "Local Content Addressing, Atomic Writes & Checksums",
    summary: "Build the foundational block store on local disk. Objects are addressed by their 256-bit SHA-256 digest, written atomically via tempfiles with POSIX rename, and verified for corruption on every read.",
    packages: ["storage"],
    keyConcepts: [
      "SHA-256 Content Addressing (CAS)",
      "Atomic rename via temporary file & fsync()",
      "Two-tier fanout directory structure (data/ab/cd/hash)",
      "Bit-rot detection via io.TeeReader"
    ],
    testCommand: "go test -v ./storage/...",
    sampleOutput: `=== RUN   TestStorageEnginePutGetDelete
--- PASS: TestStorageEnginePutGetDelete (0.04s)
    engine_test.go:42: Successfully stored payload, hash: 5a8e2b...
    engine_test.go:58: Retrieved payload verified against original bytes
    engine_test.go:71: Injected bit-rot byte mutation (byte[0] ^= 0xFF)
    engine_test.go:76: Correctly caught bit-rot corruption: storage: sha256 checksum mismatch
PASS
ok  github.com/vault-storage/vault/storage  0.042s`,
    simplifications: [
      "Files are stored as raw uncompressed blobs rather than packed LSM-tree blocks (e.g. Bitcask or Pebble). This is simpler to inspect but uses more filesystem inodes.",
      "Fixed synchronous fsync() on every write ensures zero data loss on power cut, but caps single-disk write throughput to rotational/SSD commit limits."
    ],
    files: [
      { path: "storage/engine.go", language: "go", description: "Content-addressed storage engine with atomic writes and verification" },
      { path: "storage/engine_test.go", language: "go", description: "Unit tests covering Put, Get, Delete, and bit-rot mutation detection" }
    ]
  },
  {
    stage: 2,
    title: "Stage 2: Multi-Node Cluster & Fixed Replication",
    subtitle: "Local Multi-Node Simulation & REST Interface",
    summary: "Scale from a single machine to a multi-node cluster simulated via Docker Compose. Implement node daemons, HTTP client dispatch, and static replication factor N without automated failure handling yet.",
    packages: ["api", "cmd/vaultd", "cmd/vaultctl", "config"],
    keyConcepts: [
      "Multi-node local container network (Docker Compose)",
      "RESTful Storage Protocol (PUT /objects/:key, GET /objects/:key)",
      "Static parallel dispatch across N nodes",
      "Isolated container volumes for independent disk simulations"
    ],
    testCommand: "docker compose up -d && go test -v ./api/...",
    sampleOutput: `[+] Running 6/6
 ✔ Network vault_vault-net  Created
 ✔ Container vault-node-1   Started
 ✔ Container vault-node-2   Started
 ✔ Container vault-node-3   Started
 ✔ Container vault-node-4   Started
 ✔ Container vault-node-5   Started
=== RUN   TestMultiNodeStaticReplication
--- PASS: TestMultiNodeStaticReplication (0.12s)
PASS`,
    simplifications: [
      "Uses JSON over HTTP/1.1 rather than gRPC with Protobuf. While HTTP/1.1 introduces header overhead, it simplifies manual testing via curl and browser inspection.",
      "Static peer list in configuration rather than auto-discovery via mDNS or DNS SRV records."
    ],
    files: [
      { path: "docker-compose.yml", language: "yaml", description: "5-node Docker compose configuration with persistent volumes" },
      { path: "api/server.go", language: "go", description: "REST HTTP handlers for object upload, download, and health" },
      { path: "cmd/vaultd/main.go", language: "go", description: "Daemon entry point launching local engine, API, and background loops" },
      { path: "cmd/vaultctl/main.go", language: "go", description: "Command-line tool for interacting with the Vault cluster" }
    ]
  },
  {
    stage: 3,
    title: "Stage 3: Metadata Service & Quorum Consistency",
    subtitle: "HashiCorp Raft Consensus & W/R Quorums with Versioning",
    summary: "Separate data path from metadata path. Use an established Raft consensus library to maintain strongly consistent object metadata (key -> chunk hash -> replica nodes -> version). Implement configurable write quorum W and read quorum R.",
    packages: ["metadata", "replication"],
    keyConcepts: [
      "Pigeonhole Principle Quorum: W + R > N guarantees overlap",
      "Raft Replicated State Machine (FSM) via HashiCorp Raft",
      "Monotonically increasing version counter per object",
      "Concurrent read-repair of lagging replicas"
    ],
    testCommand: "go test -v ./metadata/... ./replication/...",
    sampleOutput: `=== RUN   TestRaftMetadataReplication
--- PASS: TestRaftMetadataReplication (0.85s)
=== RUN   TestQuorumConsistency_Pigeonhole
--- PASS: TestQuorumConsistency_Pigeonhole (0.24s)
    coordinator_test.go:45: N=3, W=2, R=2: 100 concurrent writes succeeded with zero stale reads
PASS
ok  github.com/vault-storage/vault/metadata     0.864s
ok  github.com/vault-storage/vault/replication  0.251s`,
    simplifications: [
      "In-memory FSM snapshotting writes full JSON map rather than incremental binary delta chunks.",
      "Read quorum queries all R nodes simultaneously rather than hedged requests (querying 1 first and waiting for timeout), trading network bandwidth for simplicity."
    ],
    files: [
      { path: "metadata/raft.go", language: "go", description: "HashiCorp Raft consensus integration and deterministic FSM" },
      { path: "metadata/store.go", language: "go", description: "Strongly consistent metadata store: key -> hash -> replica nodes -> version" },
      { path: "replication/coordinator.go", language: "go", description: "Quorum coordinator enforcing W + R > N and read repair" }
    ]
  },
  {
    stage: 4,
    title: "Stage 4: Failure Detection & Dynamic Routing",
    subtitle: "Heartbeat Liveness & 2-Tier Suspicion Windows",
    summary: "Storage nodes intermittently fail or suffer transient network delays. Implement a FailureDetector that transitions nodes Healthy -> Suspect -> Dead. The replication coordinator automatically routes reads and writes around dead nodes.",
    packages: ["cluster"],
    keyConcepts: [
      "Heartbeat liveness timers (T_heartbeat = 1s, T_suspect = 3s, T_dead = 8s)",
      "Suspicion state to prevent churn from momentary network spikes",
      "Dynamic candidate filtering before write quorum dispatch",
      "Graceful degradation when cluster has dead members"
    ],
    testCommand: "go test -v ./cluster/...",
    sampleOutput: `=== RUN   TestFailureDetectorTransitions
--- PASS: TestFailureDetectorTransitions (0.15s)
    detector_test.go:30: node-3 stopped sending heartbeats
    detector_test.go:38: node-3 state transitioned: HEALTHY -> SUSPECT
    detector_test.go:45: node-3 state transitioned: SUSPECT -> DEAD
    detector_test.go:52: Coordinator excluded node-3 from write quorum; writes to healthy nodes succeeded
PASS
ok  github.com/vault-storage/vault/cluster  0.165s`,
    simplifications: [
      "Used heartbeat timeout polling rather than the Phi-Accrual Failure Detector algorithm. While Phi-accrual adapts dynamically to network jitter, static timeouts are far easier to reason about in a university setting.",
      "Coordinator acts as the primary failure observer rather than peer-to-peer gossip (e.g. SWIM)."
    ],
    files: [
      { path: "cluster/detector.go", language: "go", description: "Heartbeat failure detector with state machine and dead node filter" }
    ]
  },
  {
    stage: 5,
    title: "Stage 5: Background Repair Engine",
    subtitle: "Automatic Self-Healing of Under-Replicated Data",
    summary: "When a node permanently fails, objects hosted on that node become degraded (replica count drops from N to N-1). The BackgroundRepairer scans metadata, locates degraded objects, pulls pristine copies from surviving nodes, and creates new replicas on healthy nodes.",
    packages: ["replication"],
    keyConcepts: [
      "Continuous replica factor reconciliation loop",
      "Donor node selection from surviving replica set",
      "New replica allocation avoiding existing hosts",
      "Atomic metadata update committing restored replica list"
    ],
    testCommand: "go test -v -run TestBackgroundRepair ./replication/...",
    sampleOutput: `=== RUN   TestBackgroundRepair
--- PASS: TestBackgroundRepair (1.20s)
    repair_test.go:40: Node 4 killed. 25 objects degraded to 2/3 replicas
    repair_test.go:62: Background repair pass started
    repair_test.go:78: Restored 25/25 objects back to 3/3 replicas onto Node 5
    repair_test.go:85: Mean Time to Repair: 1.18s
PASS`,
    simplifications: [
      "Full object copy rather than delta/rsync chunking. For objects under 64MB, whole-blob copy is clean and fast; for multi-GB objects, chunk-level diffing would be preferred.",
      "Repair loop runs sequentially per degraded object rather than a prioritized work-stealing job queue."
    ],
    files: [
      { path: "replication/repair.go", language: "go", description: "Background repair worker restoring under-replicated chunks" }
    ]
  },
  {
    stage: 6,
    title: "Stage 6: Integrity Scrubber & Auto-Repair",
    subtitle: "Dormant Bit-Rot Detection & Peer Healing",
    summary: "Storage media silently suffers bit flips, bad sectors, and disk corruption over time. The Scrubber proactively crawls all stored blocks on disk, computes SHA-256 hashes, detects discrepancies, and heals corrupted blocks from healthy peers.",
    packages: ["storage"],
    keyConcepts: [
      "Silent bit-rot vulnerability in cold storage",
      "Sequential disk streaming with SHA-256 verification",
      "Automatic peer retrieval of corrupted blocks",
      "Atomic overwrite of corrupted files on local disk"
    ],
    testCommand: "go test -v -run TestPeriodicScrubber ./storage/...",
    sampleOutput: `=== RUN   TestPeriodicScrubber
--- PASS: TestPeriodicScrubber (0.42s)
    scrubber_test.go:34: Scanned 120 blocks on disk
    scrubber_test.go:41: Injected bit-rot corruption into block '4f71a9...'
    scrubber_test.go:55: Scrubber detected mismatch: expected 4f71a9, computed e19c02
    scrubber_test.go:64: Successfully fetched pristine block from node-2 and healed disk
PASS`,
    simplifications: [
      "Scrubber scans local filesystem directory directly rather than maintaining a Merkle tree of chunk hashes. Merkle trees would allow rapid anti-entropy comparison with peers without re-reading all bytes from disk.",
      "Runs at unthrottled I/O speed in test mode; in production, token-bucket I/O throttling would be required."
    ],
    files: [
      { path: "storage/scrubber.go", language: "go", description: "Integrity scrubber crawling disk blocks and self-healing bit-rot" }
    ]
  },
  {
    stage: 7,
    title: "Stage 7: Rebalancing with Consistent Hashing",
    subtitle: "Virtual Nodes & Minimal Key Movement (K/N)",
    summary: "Traditional modulo hashing (hash(key) % N) causes ~100% of keys to shuffle when nodes join or leave. Consistent hashing with virtual nodes ensures that only K/N keys are migrated, spreading load evenly across the cluster.",
    packages: ["cluster"],
    keyConcepts: [
      "360-degree Token Ring topology with Murmur3 32-bit hashing",
      "Virtual nodes (vnodes, default 100/node) for uniform distribution",
      "Binary search (sort.Search) for O(log M) replica lookup",
      "Clockwise traversal to select N distinct physical nodes"
    ],
    testCommand: "go test -v -run TestConsistentHashRing ./cluster/...",
    sampleOutput: `=== RUN   TestConsistentHashRing
--- PASS: TestConsistentHashRing (0.08s)
    hashring_test.go:40: Distributed 10,000 keys across 5 nodes
    hashring_test.go:48: Key distribution standard deviation: 3.4% (well within 10% target)
    hashring_test.go:62: Added node-6. Keys migrated: 1,642 (16.4%, ideal is 1/6 = 16.7%)
PASS`,
    simplifications: [
      "Vnodes have equal weighting; does not support heterogeneous hardware weighting (e.g. allocating more vnodes to larger disks).",
      "Key migration during node join is simulated by re-locating keys upon read/write rather than an active live streaming migration protocol."
    ],
    files: [
      { path: "cluster/hashring.go", language: "go", description: "Consistent hash ring with virtual nodes and clockwise walk" }
    ]
  },
  {
    stage: 8,
    title: "Stage 8: Chaos Testing & Durability Benchmarking",
    subtitle: "Random Node Kills, Network Partitions & MTTR Measurement",
    summary: "Subject the Vault cluster to hostile chaos testing: random node kills, partition injections, and bit-rot mutations under continuous concurrent read/write workload. Quantify write success rate, data durability, and Mean Time to Recovery (MTTR).",
    packages: ["chaos"],
    keyConcepts: [
      "Chaos Monkey testing methodology",
      "Concurrent load generation during active failures",
      "Mean Time to Recovery (MTTR) calculation",
      "Verification of zero data loss under quorum boundaries"
    ],
    testCommand: "go test -v -run TestChaosExperiment ./chaos/...",
    sampleOutput: `=== RUN   TestChaosExperiment
--- PASS: TestChaosExperiment (10.04s)
    chaos_test.go:88: === CHAOS EXPERIMENT REPORT (Duration: 10s, Load: 4 workers) ===
    chaos_test.go:90: Total Writes Issued: 1,420 | Successful: 1,398 (98.45%)
    chaos_test.go:92: Total Reads Issued: 473 | Verified Intact: 473 (100.00% Durability)
    chaos_test.go:94: Nodes Killed: 6 | Nodes Recovered: 6
    chaos_test.go:96: Mean Time to Recovery (MTTR): 1.42 seconds
    chaos_test.go:98: Data Loss: 0 objects (Zero silent corruption detected)
PASS`,
    simplifications: [
      "Runs chaos against simulated in-process node instances or Docker containers rather than real physical servers across AWS regions.",
      "Partitions are modeled as binary reachable/unreachable states rather than asymmetric packet loss or latency jitter."
    ],
    files: [
      { path: "chaos/orchestrator.go", language: "go", description: "Chaos orchestrator generating concurrent load and injecting faults" }
    ]
  }
];
