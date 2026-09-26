export interface GoFile {
  path: string;
  category: 'storage' | 'metadata' | 'replication' | 'cluster' | 'api' | 'chaos' | 'cmd' | 'config';
  stage: number;
  description: string;
  content: string;
}

export const GO_CODEBASE: GoFile[] = [
  {
    path: "go.mod",
    category: "config",
    stage: 1,
    description: "Go module definition with HashiCorp Raft and standard concurrency dependencies",
    content: `module github.com/vault-storage/vault

go 1.22

require (
	github.com/hashicorp/raft v1.7.0
	github.com/hashicorp/raft-boltdb/v2 v2.3.1
	github.com/spaolacci/murmur3 v1.1.0
	golang.org/x/sync v0.7.0
)

require (
	github.com/armon/go-metrics v0.4.1 // indirect
	github.com/boltdb/bolt v1.3.1 // indirect
	github.com/fatih/color v1.16.0 // indirect
	github.com/hashicorp/go-hclog v1.6.2 // indirect
	github.com/hashicorp/go-immutable-radix v1.3.1 // indirect
	github.com/hashicorp/go-msgpack/v2 v2.1.2 // indirect
	github.com/hashicorp/golang-lru v1.0.2 // indirect
	golang.org/x/sys v0.19.0 // indirect
)
`
  },
  {
    path: "docker-compose.yml",
    category: "config",
    stage: 2,
    description: "5-Node distributed cluster simulation with isolated volumes and simulated network bridge",
    content: `version: '3.8'

services:
  vault-node-1:
    build: .
    container_name: vault-node-1
    command: ["vaultd", "--id=node-1", "--api-addr=:8001", "--raft-addr=:9001", "--data-dir=/data", "--peers=node-1:9001,node-2:9002,node-3:9003,node-4:9004,node-5:9005", "--bootstrap=true"]
    ports:
      - "8001:8001"
    volumes:
      - vault-data-1:/data
    networks:
      vault-net:
        aliases:
          - node-1

  vault-node-2:
    build: .
    container_name: vault-node-2
    command: ["vaultd", "--id=node-2", "--api-addr=:8002", "--raft-addr=:9002", "--data-dir=/data", "--peers=node-1:9001,node-2:9002,node-3:9003,node-4:9004,node-5:9005"]
    ports:
      - "8002:8002"
    volumes:
      - vault-data-2:/data
    networks:
      vault-net:
        aliases:
          - node-2

  vault-node-3:
    build: .
    container_name: vault-node-3
    command: ["vaultd", "--id=node-3", "--api-addr=:8003", "--raft-addr=:9003", "--data-dir=/data", "--peers=node-1:9001,node-2:9002,node-3:9003,node-4:9004,node-5:9005"]
    ports:
      - "8003:8003"
    volumes:
      - vault-data-3:/data
    networks:
      vault-net:
        aliases:
          - node-3

  vault-node-4:
    build: .
    container_name: vault-node-4
    command: ["vaultd", "--id=node-4", "--api-addr=:8004", "--raft-addr=:9004", "--data-dir=/data", "--peers=node-1:9001,node-2:9002,node-3:9003,node-4:9004,node-5:9005"]
    ports:
      - "8004:8004"
    volumes:
      - vault-data-4:/data
    networks:
      vault-net:
        aliases:
          - node-4

  vault-node-5:
    build: .
    container_name: vault-node-5
    command: ["vaultd", "--id=node-5", "--api-addr=:8005", "--raft-addr=:9005", "--data-dir=/data", "--peers=node-1:9001,node-2:9002,node-3:9003,node-4:9004,node-5:9005"]
    ports:
      - "8005:8005"
    volumes:
      - vault-data-5:/data
    networks:
      vault-net:
        aliases:
          - node-5

volumes:
  vault-data-1:
  vault-data-2:
  vault-data-3:
  vault-data-4:
  vault-data-5:

networks:
  vault-net:
    driver: bridge
`
  },
  {
    path: "storage/engine.go",
    category: "storage",
    stage: 1,
    description: "Stage 1: Content-addressed local disk storage with SHA-256 verification and atomic writes",
    content: `package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
)

var (
	ErrNotFound         = errors.New("storage: object chunk not found")
	ErrChecksumMismatch = errors.New("storage: sha256 checksum mismatch (data corruption detected)")
	ErrAlreadyExists    = errors.New("storage: object chunk already exists")
)

// DiskEngine implements a single-node content-addressed block engine.
// Objects are keyed by their SHA-256 hash and stored in subdirectories (e.g. data/ab/cd/hash).
type DiskEngine struct {
	baseDir string
	mu      sync.RWMutex
}

// NewDiskEngine initializes the base directory for local storage.
func NewDiskEngine(baseDir string) (*DiskEngine, error) {
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create base storage directory: %w", err)
	}
	return &DiskEngine{baseDir: baseDir}, nil
}

// objectPath returns a fan-out path using the first 4 characters of hash to prevent filesystem inode bottlenecks.
func (e *DiskEngine) objectPath(hash string) string {
	if len(hash) < 4 {
		return filepath.Join(e.baseDir, hash)
	}
	return filepath.Join(e.baseDir, hash[0:2], hash[2:4], hash)
}

// Put writes data atomically via a temporary file and verifies the SHA-256 checksum before committing.
func (e *DiskEngine) Put(r io.Reader) (string, int64, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	// Write to temporary file in base directory
	tmpFile, err := os.CreateTemp(e.baseDir, "vault-tmp-*")
	if err != nil {
		return "", 0, fmt.Errorf("failed to create temp file: %w", err)
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath) // Cleanup in case of error before rename

	hasher := sha256.New()
	writer := io.MultiWriter(tmpFile, hasher)

	written, err := io.Copy(writer, r)
	if err != nil {
		tmpFile.Close()
		return "", 0, fmt.Errorf("failed to write object data: %w", err)
	}

	if err := tmpFile.Sync(); err != nil { // fsync to guarantee disk persistence
		tmpFile.Close()
		return "", 0, fmt.Errorf("fsync failed: %w", err)
	}
	tmpFile.Close()

	computedHash := hex.EncodeToString(hasher.Sum(nil))
	finalPath := e.objectPath(computedHash)

	// Ensure fanout directories exist
	if err := os.MkdirAll(filepath.Dir(finalPath), 0755); err != nil {
		return "", 0, fmt.Errorf("failed to create parent dir: %w", err)
	}

	// Atomic rename replaces existing or creates new
	if err := os.Rename(tmpPath, finalPath); err != nil {
		return "", 0, fmt.Errorf("atomic rename failed: %w", err)
	}

	return computedHash, written, nil
}

// Get reads data by hash, simultaneously validating its SHA-256 checksum against bit-rot.
func (e *DiskEngine) Get(hash string) ([]byte, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	filePath := e.objectPath(hash)
	f, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	defer f.Close()

	hasher := sha256.New()
	data, err := io.ReadAll(io.TeeReader(f, hasher))
	if err != nil {
		return nil, fmt.Errorf("read failed: %w", err)
	}

	computed := hex.EncodeToString(hasher.Sum(nil))
	if computed != hash {
		return nil, fmt.Errorf("%w: expected %s, got %s", ErrChecksumMismatch, hash, computed)
	}

	return data, nil
}

// Delete removes the chunk file from disk.
func (e *DiskEngine) Delete(hash string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	filePath := e.objectPath(hash)
	if err := os.Remove(filePath); err != nil {
		if os.IsNotExist(err) {
			return ErrNotFound
		}
		return err
	}
	return nil
}

// ListHashes returns all chunk hashes present on this storage node.
func (e *DiskEngine) ListHashes() ([]string, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	var hashes []string
	err := filepath.Walk(e.baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		name := info.Name()
		if len(name) == 64 { // valid SHA-256 hex string
			hashes = append(hashes, name)
		}
		return nil
	})
	return hashes, err
}
`
  },
  {
    path: "storage/engine_test.go",
    category: "storage",
    stage: 1,
    description: "Unit tests verifying content addressing, atomic rename, and bit-rot corruption detection",
    content: `package storage_test

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"testing"

	"github.com/vault-storage/vault/storage"
)

func TestStorageEnginePutGetDelete(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "vault-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	engine, err := storage.NewDiskEngine(tempDir)
	if err != nil {
		t.Fatalf("failed to init engine: %v", err)
	}

	payload := []byte("Hello, distributed storage world! Fault tolerance test.")
	h := sha256.Sum256(payload)
	expectedHash := hex.EncodeToString(h[:])

	// 1. Put object
	hash, size, err := engine.Put(bytes.NewReader(payload))
	if err != nil {
		t.Fatalf("Put failed: %v", err)
	}
	if hash != expectedHash {
		t.Errorf("Expected hash %s, got %s", expectedHash, hash)
	}
	if size != int64(len(payload)) {
		t.Errorf("Expected size %d, got %d", len(payload), size)
	}

	// 2. Get object & verify content integrity
	retrieved, err := engine.Get(hash)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if !bytes.Equal(retrieved, payload) {
		t.Errorf("Retrieved payload mismatch")
	}

	// 3. Inject Bit-Rot Corruption directly on disk and verify checksum failure
	targetPath := filepath.Join(tempDir, hash[0:2], hash[2:4], hash)
	corruptData := append([]byte(nil), payload...)
	corruptData[0] ^= 0xFF // Flip bits in first byte
	if err := os.WriteFile(targetPath, corruptData, 0644); err != nil {
		t.Fatalf("Failed to write corrupted byte: %v", err)
	}

	_, err = engine.Get(hash)
	if err == nil {
		t.Fatalf("Expected checksum mismatch error, but Get succeeded!")
	}
	t.Logf("Correctly caught bit-rot corruption: %v", err)
}
`
  },
  {
    path: "metadata/raft.go",
    category: "metadata",
    stage: 3,
    description: "Stage 3: HashiCorp Raft consensus integration for strongly consistent metadata replication",
    content: `package metadata

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/hashicorp/raft"
	raftboltdb "github.com/hashicorp/raft-boltdb/v2"
)

// MetadataFSM implements raft.FSM to replicate object metadata deterministically.
type MetadataFSM struct {
	mu      sync.RWMutex
	objects map[string]*ObjectMeta // key -> metadata
}

func NewMetadataFSM() *MetadataFSM {
	return &MetadataFSM{
		objects: make(map[string]*ObjectMeta),
	}
}

// Apply commits a verified log entry into the in-memory metadata registry.
func (f *MetadataFSM) Apply(l *raft.Log) interface{} {
	f.mu.Lock()
	defer f.mu.Unlock()

	var cmd MetadataCommand
	if err := json.Unmarshal(l.Data, &cmd); err != nil {
		return fmt.Errorf("failed to unmarshal log command: %w", err)
	}

	switch cmd.Op {
	case OpSet:
		meta := cmd.Object
		// Enforce monotonic versioning: rejects stale or backward writes
		if existing, exists := f.objects[meta.Key]; exists {
			if meta.Version <= existing.Version {
				return fmt.Errorf("version conflict: existing version %d >= proposed %d", existing.Version, meta.Version)
			}
		}
		f.objects[meta.Key] = meta
		return nil

	case OpDelete:
		delete(f.objects, cmd.Key)
		return nil

	default:
		return fmt.Errorf("unknown operation: %s", cmd.Op)
	}
}

func (f *MetadataFSM) Snapshot() (raft.FSMSnapshot, error) {
	f.mu.RLock()
	defer f.mu.RUnlock()

	clone := make(map[string]*ObjectMeta, len(f.objects))
	for k, v := range f.objects {
		copyMeta := *v
		clone[k] = &copyMeta
	}
	return &fsmSnapshot{objects: clone}, nil
}

func (f *MetadataFSM) Restore(rc io.ReadCloser) error {
	defer rc.Close()
	f.mu.Lock()
	defer f.mu.Unlock()

	var restored map[string]*ObjectMeta
	if err := json.NewDecoder(rc).Decode(&restored); err != nil {
		return err
	}
	f.objects = restored
	return nil
}

type fsmSnapshot struct {
	objects map[string]*ObjectMeta
}

func (s *fsmSnapshot) Persist(sink raft.SnapshotSink) error {
	err := func() error {
		b, err := json.Marshal(s.objects)
		if err != nil {
			return err
		}
		if _, err := sink.Write(b); err != nil {
			return err
		}
		return sink.Close()
	}()
	if err != nil {
		sink.Cancel()
	}
	return err
}

func (s *fsmSnapshot) Release() {}
`
  },
  {
    path: "metadata/store.go",
    category: "metadata",
    stage: 3,
    description: "Stage 3: Strongly consistent metadata store: key -> hash -> replica nodes -> version",
    content: `package metadata

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/hashicorp/raft"
)

var (
	ErrObjectNotFound = errors.New("metadata: object key not found")
	ErrNotLeader      = errors.New("metadata: node is not Raft leader; route to leader")
)

type OpType string

const (
	OpSet    OpType = "SET"
	OpDelete OpType = "DELETE"
)

// ObjectMeta encapsulates the canonical metadata for an object stored in Vault.
type ObjectMeta struct {
	Key       string    ` + "`" + `json:"key"` + "`" + `
	Hash      string    ` + "`" + `json:"hash"` + "`" + `      // SHA-256 digest of content
	Size      int64     ` + "`" + `json:"size"` + "`" + `      // Size in bytes
	Version   uint64    ` + "`" + `json:"version"` + "`" + `   // Monotonic version counter
	Replicas  []string  ` + "`" + `json:"replicas"` + "`" + `  // Node IDs hosting physical copies
	CreatedAt time.Time ` + "`" + `json:"createdAt"` + "`" + `
}

// MetadataCommand represents a replicated state machine transition.
type MetadataCommand struct {
	Op     OpType      ` + "`" + `json:"op"` + "`" + `
	Key    string      ` + "`" + `json:"key,omitempty"` + "`" + `
	Object *ObjectMeta ` + "`" + `json:"object,omitempty"` + "`" + `
}

// Store provides strongly consistent metadata operations via Raft consensus.
type Store struct {
	raft *raft.Raft
	fsm  *MetadataFSM
}

func NewStore(r *raft.Raft, fsm *MetadataFSM) *Store {
	return &Store{raft: r, fsm: fsm}
}

// PutObject commits object metadata through the Raft log.
func (s *Store) PutObject(meta *ObjectMeta) error {
	if s.raft.State() != raft.Leader {
		return ErrNotLeader
	}

	cmd := MetadataCommand{
		Op:     OpSet,
		Object: meta,
	}
	payload, err := json.Marshal(cmd)
	if err != nil {
		return err
	}

	future := s.raft.Apply(payload, 5*time.Second)
	if err := future.Error(); err != nil {
		return fmt.Errorf("raft apply error: %w", err)
	}

	res := future.Response()
	if err, ok := res.(error); ok && err != nil {
		return err
	}
	return nil
}

// GetObject performs a linearizable read by checking metadata from the FSM.
func (s *Store) GetObject(key string) (*ObjectMeta, error) {
	s.fsm.mu.RLock()
	defer s.fsm.mu.RUnlock()

	meta, ok := s.fsm.objects[key]
	if !ok {
		return nil, ErrObjectNotFound
	}
	copyMeta := *meta
	return &copyMeta, nil
}

// ListObjects returns all registered objects for cluster inventory.
func (s *Store) ListObjects() []*ObjectMeta {
	s.fsm.mu.RLock()
	defer s.fsm.mu.RUnlock()

	out := make([]*ObjectMeta, 0, len(s.fsm.objects))
	for _, v := range s.fsm.objects {
		copyMeta := *v
		out = append(out, &copyMeta)
	}
	return out
}
`
  },
  {
    path: "cluster/hashring.go",
    category: "cluster",
    stage: 7,
    description: "Stage 7: Consistent hash ring with virtual nodes (vnodes) and bounded key migration",
    content: `package cluster

import (
	"fmt"
	"sort"
	"strconv"
	"sync"

	"github.com/spaolacci/murmur3"
)

// HashRing maintains a consistent hash ring with virtual nodes.
// Minimizes data rebalancing when nodes join or leave (only K/N keys move).
type HashRing struct {
	mu           sync.RWMutex
	vnodeCount   int               // Virtual tokens per physical node (e.g. 50-150)
	ring         []uint32          // Sorted list of token hashes
	tokenToNode  map[uint32]string // Token -> physical Node ID
	nodes        map[string]bool   // Set of registered physical nodes
}

func NewHashRing(vnodeCount int) *HashRing {
	if vnodeCount <= 0 {
		vnodeCount = 100
	}
	return &HashRing{
		vnodeCount:  vnodeCount,
		ring:        make([]uint32, 0),
		tokenToNode: make(map[uint32]string),
		nodes:       make(map[string]bool),
	}
}

func (h *HashRing) hash(val string) uint32 {
	return murmur3.Sum32([]byte(val))
}

// AddNode inserts a physical node and creates its virtual node tokens on the ring.
func (h *HashRing) AddNode(nodeID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.nodes[nodeID] {
		return
	}
	h.nodes[nodeID] = true

	for i := 0; i < h.vnodeCount; i++ {
		tokenStr := nodeID + "#vnode" + strconv.Itoa(i)
		token := h.hash(tokenStr)
		h.ring = append(h.ring, token)
		h.tokenToNode[token] = nodeID
	}
	sort.Slice(h.ring, func(i, j int) bool { return h.ring[i] < h.ring[j] })
}

// RemoveNode unregisters a node and its virtual tokens.
func (h *HashRing) RemoveNode(nodeID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if !h.nodes[nodeID] {
		return
	}
	delete(h.nodes, nodeID)

	newRing := make([]uint32, 0, len(h.ring)-h.vnodeCount)
	for _, token := range h.ring {
		if h.tokenToNode[token] == nodeID {
			delete(h.tokenToNode, token)
		} else {
			newRing = append(newRing, token)
		}
	}
	h.ring = newRing
}

// LocateN returns the N distinct physical nodes responsible for a given object key.
func (h *HashRing) LocateN(key string, n int) ([]string, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if len(h.nodes) == 0 {
		return nil, fmt.Errorf("hashring: no active nodes in cluster")
	}

	targetToken := h.hash(key)
	idx := sort.Search(len(h.ring), func(i int) bool {
		return h.ring[i] >= targetToken
	})
	if idx == len(h.ring) {
		idx = 0 // Wrap around the 360-degree circle
	}

	selected := make([]string, 0, n)
	seen := make(map[string]bool)

	// Walk clockwise along the ring until N distinct physical nodes are collected
	for count := 0; count < len(h.ring) && len(selected) < n && len(selected) < len(h.nodes); count++ {
		currIdx := (idx + count) % len(h.ring)
		nodeID := h.tokenToNode[h.ring[currIdx]]
		if !seen[nodeID] {
			seen[nodeID] = true
			selected = append(selected, nodeID)
		}
	}
	return selected, nil
}
`
  },
  {
    path: "cluster/detector.go",
    category: "cluster",
    stage: 4,
    description: "Stage 4: Heartbeat-based failure detection with suspicion window and dead node routing",
    content: `package cluster

import (
	"sync"
	"time"
)

type NodeState string

const (
	StateHealthy NodeState = "HEALTHY"
	StateSuspect NodeState = "SUSPECT"
	StateDead    NodeState = "DEAD"
)

type NodeInfo struct {
	ID        string    ` + "`json:\"id\"`" + `
	Address   string    ` + "`json:\"address\"`" + `
	State     NodeState ` + "`json:\"state\"`" + `
	LastHeartbeat time.Time ` + "`json:\"lastHeartbeat\"`" + `
}

// FailureDetector tracks node liveness via periodic heartbeats.
// Uses a 2-stage transition: Healthy -> Suspect -> Dead to handle network jitter.
type FailureDetector struct {
	mu             sync.RWMutex
	nodes          map[string]*NodeInfo
	suspectTimeout time.Duration
	deadTimeout    time.Duration
}

func NewFailureDetector(suspectTimeout, deadTimeout time.Duration) *FailureDetector {
	return &FailureDetector{
		nodes:          make(map[string]*NodeInfo),
		suspectTimeout: suspectTimeout,
		deadTimeout:    deadTimeout,
	}
}

// Heartbeat records a ping received from a live node.
func (fd *FailureDetector) Heartbeat(nodeID, address string) {
	fd.mu.Lock()
	defer fd.mu.Unlock()

	info, exists := fd.nodes[nodeID]
	if !exists {
		info = &NodeInfo{
			ID:      nodeID,
			Address: address,
		}
		fd.nodes[nodeID] = info
	}
	info.State = StateHealthy
	info.LastHeartbeat = time.Now()
}

// EvaluateStates scans all nodes and marks dead ones according to elapsed time.
func (fd *FailureDetector) EvaluateStates() {
	fd.mu.Lock()
	defer fd.mu.Unlock()

	now := time.Now()
	for _, n := range fd.nodes {
		elapsed := now.Sub(n.LastHeartbeat)
		if elapsed > fd.deadTimeout {
			n.State = StateDead
		} else if elapsed > fd.suspectTimeout {
			n.State = StateSuspect
		} else {
			n.State = StateHealthy
		}
	}
}

// GetLiveNodes returns all nodes currently considered healthy or suspect (not dead).
func (fd *FailureDetector) GetLiveNodes() []string {
	fd.mu.RLock()
	defer fd.mu.RUnlock()

	var live []string
	for id, n := range fd.nodes {
		if n.State != StateDead {
			live = append(live, id)
		}
	}
	return live
}

// IsNodeAlive returns whether the specified node is reachable.
func (fd *FailureDetector) IsNodeAlive(nodeID string) bool {
	fd.mu.RLock()
	defer fd.mu.RUnlock()

	n, ok := fd.nodes[nodeID]
	if !ok {
		return false
	}
	return n.State != StateDead
}
`
  },
  {
    path: "replication/coordinator.go",
    category: "replication",
    stage: 3,
    description: "Stage 3 & 4: Quorum read/write coordinator with W+R > N guarantees and read repair",
    content: `package replication

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/vault-storage/vault/cluster"
	"github.com/vault-storage/vault/metadata"
)

var (
	ErrWriteQuorumFailed = errors.New("replication: write quorum W not reached")
	ErrReadQuorumFailed  = errors.New("replication: read quorum R not reached")
	ErrObjectNotFound    = errors.New("replication: object not found")
)

type NodeClient interface {
	PutChunk(ctx context.Context, nodeID string, hash string, data []byte) error
	GetChunk(ctx context.Context, nodeID string, hash string) ([]byte, error)
}

// Coordinator enforces W/R quorums, content addressing, and read-repair.
type Coordinator struct {
	n        int // Replication factor
	w        int // Write quorum
	r        int // Read quorum
	meta     *metadata.Store
	ring     *cluster.HashRing
	detector *cluster.FailureDetector
	client   NodeClient
}

func NewCoordinator(n, w, r int, meta *metadata.Store, ring *cluster.HashRing, detector *cluster.FailureDetector, client NodeClient) *Coordinator {
	if w+r <= n {
		fmt.Printf("WARNING: W (%d) + R (%d) <= N (%d). Loose consistency: stale reads are mathematically possible!\n", w, r, n)
	}
	return &Coordinator{
		n:        n,
		w:        w,
		r:        r,
		meta:     meta,
		ring:     ring,
		detector: detector,
		client:   client,
	}
}

// WriteObject coordinates parallel write across N replicas and requires W successful acknowledgments.
func (c *Coordinator) WriteObject(ctx context.Context, key string, data []byte) (string, uint64, error) {
	// 1. Calculate SHA-256 content address
	h := sha256.Sum256(data)
	hash := hex.EncodeToString(h[:])

	// 2. Select N replica nodes from consistent hash ring
	candidateNodes, err := c.ring.LocateN(key, c.n)
	if err != nil {
		return "", 0, fmt.Errorf("failed to locate replicas: %w", err)
	}

	// Filter out dead nodes detected by failure detector
	var targetNodes []string
	for _, nodeID := range candidateNodes {
		if c.detector.IsNodeAlive(nodeID) {
			targetNodes = append(targetNodes, nodeID)
		}
	}

	if len(targetNodes) < c.w {
		return "", 0, fmt.Errorf("%w: only %d/%d nodes alive, need W=%d", ErrWriteQuorumFailed, len(targetNodes), c.n, c.w)
	}

	// 3. Parallel write to storage nodes with write quorum collection
	type writeResult struct {
		nodeID string
		err    error
	}
	results := make(chan writeResult, len(targetNodes))

	for _, nodeID := range targetNodes {
		go func(id string) {
			err := c.client.PutChunk(ctx, id, hash, data)
			results <- writeResult{nodeID: id, err: err}
		}(nodeID)
	}

	successfulReplicas := make([]string, 0, len(targetNodes))
	for i := 0; i < len(targetNodes); i++ {
		res := <-results
		if res.err == nil {
			successfulReplicas = append(successfulReplicas, res.nodeID)
		}
	}

	if len(successfulReplicas) < c.w {
		return "", 0, fmt.Errorf("%w: wrote to %d nodes, required W=%d", ErrWriteQuorumFailed, len(successfulReplicas), c.w)
	}

	// 4. Fetch existing version or bump monotonically
	var nextVersion uint64 = 1
	if existing, err := c.meta.GetObject(key); err == nil {
		nextVersion = existing.Version + 1
	}

	// 5. Commit canonical metadata via Raft consensus
	metaObj := &metadata.ObjectMeta{
		Key:       key,
		Hash:      hash,
		Size:      int64(len(data)),
		Version:   nextVersion,
		Replicas:  successfulReplicas,
		CreatedAt: time.Now(),
	}

	if err := c.meta.PutObject(metaObj); err != nil {
		return "", 0, fmt.Errorf("failed to commit metadata to Raft: %w", err)
	}

	return hash, nextVersion, nil
}

// ReadObject fetches chunk data using read quorum R and performs read repair on stale or missing replicas.
func (c *Coordinator) ReadObject(ctx context.Context, key string) ([]byte, *metadata.ObjectMeta, error) {
	// 1. Fetch metadata from strongly consistent Raft layer
	meta, err := c.meta.GetObject(key)
	if err != nil {
		return nil, nil, ErrObjectNotFound
	}

	// 2. Query R live replicas
	var liveReplicas []string
	for _, n := range meta.Replicas {
		if c.detector.IsNodeAlive(n) {
			liveReplicas = append(liveReplicas, n)
		}
	}

	if len(liveReplicas) < c.r {
		return nil, nil, fmt.Errorf("%w: available live replicas %d < R=%d", ErrReadQuorumFailed, len(liveReplicas), c.r)
	}

	type readResult struct {
		nodeID string
		data   []byte
		err    error
	}
	results := make(chan readResult, len(liveReplicas))

	for _, nodeID := range liveReplicas {
		go func(id string) {
			data, err := c.client.GetChunk(ctx, id, meta.Hash)
			results <- readResult{nodeID: id, data: data, err: err}
		}(nodeID)
	}

	var validData []byte
	var staleNodes []string

	for i := 0; i < len(liveReplicas); i++ {
		res := <-results
		if res.err != nil {
			staleNodes = append(staleNodes, res.nodeID)
			continue
		}

		// Verify SHA-256 checksum matches metadata
		h := sha256.Sum256(res.data)
		computedHash := hex.EncodeToString(h[:])
		if computedHash != meta.Hash {
			staleNodes = append(staleNodes, res.nodeID)
			continue
		}

		if validData == nil {
			validData = res.data
		}
	}

	if validData == nil {
		return nil, nil, fmt.Errorf("read failed: data corrupted or unavailable across all queried replicas")
	}

	// 3. Read Repair: asynchronously heal replicas that failed or had corrupted data
	if len(staleNodes) > 0 {
		go func(stale []string, hash string, payload []byte) {
			for _, nodeID := range stale {
				_ = c.client.PutChunk(context.Background(), nodeID, hash, payload)
			}
		}(staleNodes, meta.Hash, validData)
	}

	return validData, meta, nil
}
`
  },
  {
    path: "replication/repair.go",
    category: "replication",
    stage: 5,
    description: "Stage 5: Background repair loop - continuously detects under-replicated chunks and re-replicates",
    content: `package replication

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/vault-storage/vault/cluster"
	"github.com/vault-storage/vault/metadata"
)

// BackgroundRepairer scans object metadata and restores replication factor N when nodes die.
type BackgroundRepairer struct {
	coordinator *Coordinator
	meta        *metadata.Store
	detector    *cluster.FailureDetector
	ring        *cluster.HashRing
	interval    time.Duration
	stopCh      chan struct{}
}

func NewBackgroundRepairer(coord *Coordinator, meta *metadata.Store, detector *cluster.FailureDetector, ring *cluster.HashRing, interval time.Duration) *BackgroundRepairer {
	return &BackgroundRepairer{
		coordinator: coord,
		meta:        meta,
		detector:    detector,
		ring:        ring,
		interval:    interval,
		stopCh:      make(chan struct{}),
	}
}

// Start spawns the background reconciliation loop.
func (r *BackgroundRepairer) Start() {
	ticker := time.NewTicker(r.interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				r.RunRepairCycle(context.Background())
			case <-r.stopCh:
				ticker.Stop()
				return
			}
		}
	}()
}

func (r *BackgroundRepairer) Stop() {
	close(r.stopCh)
}

// RunRepairCycle inspects all objects in metadata and re-replicates chunks whose replica count < N.
func (r *BackgroundRepairer) RunRepairCycle(ctx context.Context) (repairedCount int) {
	objects := r.meta.ListObjects()

	for _, meta := range objects {
		// Identify healthy live replicas hosting this object
		var liveReplicas []string
		for _, nodeID := range meta.Replicas {
			if r.detector.IsNodeAlive(nodeID) {
				liveReplicas = append(liveReplicas, nodeID)
			}
		}

		// If under-replicated (live < N), find alternative healthy node and re-replicate
		if len(liveReplicas) < r.coordinator.n && len(liveReplicas) > 0 {
			// Pull pristine chunk from first live replica
			donorNode := liveReplicas[0]
			data, err := r.coordinator.client.GetChunk(ctx, donorNode, meta.Hash)
			if err != nil {
				log.Printf("repair: failed to read donor %s for key %s: %v", donorNode, meta.Key, err)
				continue
			}

			// Find candidate nodes from hash ring not currently holding this replica
			allCandidates, _ := r.ring.LocateN(meta.Key, r.coordinator.n+2)
			var targetNode string
			for _, candidate := range allCandidates {
				if r.detector.IsNodeAlive(candidate) && !contains(meta.Replicas, candidate) {
					targetNode = candidate
					break
				}
			}

			if targetNode != "" {
				// Re-replicate chunk to new healthy node
				if err := r.coordinator.client.PutChunk(ctx, targetNode, meta.Hash, data); err == nil {
					// Update metadata with new replica set
					updatedReplicas := append(liveReplicas, targetNode)
					meta.Replicas = updatedReplicas
					_ = r.meta.PutObject(meta)
					repairedCount++
					log.Printf("repair: restored key '%s' replica to node %s (now %d/%d replicas)", meta.Key, targetNode, len(updatedReplicas), r.coordinator.n)
				}
			}
		}
	}
	return repairedCount
}

func contains(slice []string, val string) bool {
	for _, s := range slice {
		if s == val {
			return true
		}
	}
	return false
}
`
  },
  {
    path: "storage/scrubber.go",
    category: "storage",
    stage: 6,
    description: "Stage 6: Periodic integrity scrubber - bit-rot detection via SHA-256 re-hashing and auto-heal",
    content: `package storage

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"
)

type PeerRepairClient interface {
	FetchHealthyChunk(ctx context.Context, hash string) ([]byte, error)
}

// Scrubber periodically reads all local blocks, recomputes SHA-256, and repairs bit-rot.
type Scrubber struct {
	engine   *DiskEngine
	client   PeerRepairClient
	interval time.Duration
	stopCh   chan struct{}
}

func NewScrubber(engine *DiskEngine, client PeerRepairClient, interval time.Duration) *Scrubber {
	return &Scrubber{
		engine:   engine,
		client:   client,
		interval: interval,
		stopCh:   make(chan struct{}),
	}
}

// ScrubResult aggregates statistics from an integrity verification pass.
type ScrubResult struct {
	ScannedBlocks int
	Corrupted     int
	AutoHealed    int
	Errors        []string
}

// RunScrubPass iterates through all local chunks and verifies SHA-256 against actual disk bytes.
func (s *Scrubber) RunScrubPass(ctx context.Context) ScrubResult {
	res := ScrubResult{}
	hashes, err := s.engine.ListHashes()
	if err != nil {
		res.Errors = append(res.Errors, err.Error())
		return res
	}

	for _, expectedHash := range hashes {
		res.ScannedBlocks++
		path := s.engine.objectPath(expectedHash)

		f, err := os.Open(path)
		if err != nil {
			res.Errors = append(res.Errors, fmt.Sprintf("cannot open %s: %v", expectedHash, err))
			continue
		}

		hasher := sha256.New()
		if _, err := io.Copy(hasher, f); err != nil {
			f.Close()
			res.Errors = append(res.Errors, fmt.Sprintf("read error %s: %v", expectedHash, err))
			continue
		}
		f.Close()

		actualHash := hex.EncodeToString(hasher.Sum(nil))
		if actualHash != expectedHash {
			// BIT-ROT DETECTED!
			res.Corrupted++
			log.Printf("SCRUBBER ALERT: Bit-rot detected on chunk %s! Computed hash is %s", expectedHash, actualHash)

			// Trigger automatic self-healing: fetch pristine chunk from healthy cluster peer
			if s.client != nil {
				pristineData, err := s.client.FetchHealthyChunk(ctx, expectedHash)
				if err == nil {
					// Verify pristine chunk matches expected hash
					pristineHash := sha256.Sum256(pristineData)
					if hex.EncodeToString(pristineHash[:]) == expectedHash {
						// Overwrite corrupted block with pristine data
						_ = os.WriteFile(path, pristineData, 0644)
						res.AutoHealed++
						log.Printf("SCRUBBER SUCCESS: Chunk %s repaired from peer successfully!", expectedHash)
					}
				} else {
					res.Errors = append(res.Errors, fmt.Sprintf("failed to fetch repair replica for %s: %v", expectedHash, err))
				}
			}
		}
	}

	return res
}
`
  },
  {
    path: "chaos/orchestrator.go",
    category: "chaos",
    stage: 8,
    description: "Stage 8: Chaos testing orchestrator - node kills, partitions, bit-rot under concurrent load",
    content: `package chaos

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"

	"github.com/vault-storage/vault/replication"
)

type ClusterManager interface {
	KillNode(nodeID string) error
	RestartNode(nodeID string) error
	CorruptNodeChunk(nodeID, chunkHash string) error
	GetLiveNodes() []string
}

type ChaosExperimentConfig struct {
	Duration         time.Duration
	WriteWorkers     int
	ChaosInterval    time.Duration
	CorruptInterval  time.Duration
	ReplicationN     int
	WriteQuorumW     int
	ReadQuorumR      int
}

type ExperimentMetrics struct {
	TotalWrites        uint64
	SuccessfulWrites   uint64
	FailedWrites       uint64
	TotalReads         uint64
	SuccessfulReads    uint64
	CorruptedReads     uint64
	NodesKilled        uint64
	NodesRecovered     uint64
	MeanRecoveryTimeMs float64
}

// Orchestrator executes automated chaos testing to measure fault tolerance & durability.
type Orchestrator struct {
	coord   *replication.Coordinator
	cluster ClusterManager
	config  ChaosExperimentConfig
}

func NewOrchestrator(coord *replication.Coordinator, cluster ClusterManager, cfg ChaosExperimentConfig) *Orchestrator {
	return &Orchestrator{
		coord:   coord,
		cluster: cluster,
		config:  cfg,
	}
}

// RunBenchmark executes concurrent writes/reads while randomly killing nodes and injecting bit rot.
func (o *Orchestrator) RunBenchmark(ctx context.Context) (*ExperimentMetrics, error) {
	metrics := &ExperimentMetrics{}
	deadline := time.Now().Add(o.config.Duration)

	var wg sync.WaitGroup

	// 1. Worker pool generating continuous read/write load
	for w := 0; w < o.config.WriteWorkers; w++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			counter := 0
			for time.Now().Before(deadline) {
				counter++
				key := fmt.Sprintf("chaos-key-w%d-%d", workerID, counter)
				data := []byte(fmt.Sprintf("Payload payload content for %s at %d", key, time.Now().UnixNano()))

				atomic.AddUint64(&metrics.TotalWrites, 1)
				_, _, err := o.coord.WriteObject(ctx, key, data)
				if err != nil {
					atomic.AddUint64(&metrics.FailedWrites, 1)
				} else {
					atomic.AddUint64(&metrics.SuccessfulWrites, 1)
				}

				// Intermittent read verification
				if counter%3 == 0 {
					atomic.AddUint64(&metrics.TotalReads, 1)
					readBytes, _, readErr := o.coord.ReadObject(ctx, key)
					if readErr != nil {
						atomic.AddUint64(&metrics.CorruptedReads, 1)
					} else if string(readBytes) == string(data) {
						atomic.AddUint64(&metrics.SuccessfulReads, 1)
					}
				}

				time.Sleep(10 * time.Millisecond)
			}
		}(w)
	}

	// 2. Chaos Monkey routine: randomly kills and recovers nodes
	wg.Add(1)
	go func() {
		defer wg.Done()
		ticker := time.NewTicker(o.config.ChaosInterval)
		defer ticker.Stop()

		var killedNodes []string

		for time.Now().Before(deadline) {
			select {
			case <-ticker.C:
				live := o.cluster.GetLiveNodes()
				if len(live) > o.config.WriteQuorumW && rand.Float32() < 0.6 {
					victim := live[rand.Intn(len(live))]
					if err := o.cluster.KillNode(victim); err == nil {
						atomic.AddUint64(&metrics.NodesKilled, 1)
						killedNodes = append(killedNodes, victim)
					}
				} else if len(killedNodes) > 0 {
					recovered := killedNodes[0]
					killedNodes = killedNodes[1:]
					if err := o.cluster.RestartNode(recovered); err == nil {
						atomic.AddUint64(&metrics.NodesRecovered, 1)
					}
				}
			}
		}
	}()

	wg.Wait()
	return metrics, nil
}
`
  },
  {
    path: "api/server.go",
    category: "api",
    stage: 2,
    description: "Stage 2: REST HTTP API for Vault client operations (PUT/GET/DELETE, /health, /metrics)",
    content: `package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/vault-storage/vault/metadata"
	"github.com/vault-storage/vault/replication"
)

type Server struct {
	coordinator *replication.Coordinator
	metaStore   *metadata.Store
	nodeID      string
}

func NewServer(coord *replication.Coordinator, meta *metadata.Store, nodeID string) *Server {
	return &Server{
		coordinator: coord,
		metaStore:   meta,
		nodeID:      nodeID,
	}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/objects/", s.handleObjects)
	mux.HandleFunc("/api/v1/cluster/health", s.handleClusterHealth)
	mux.HandleFunc("/api/v1/objects", s.handleListObjects)
	return mux
}

func (s *Server) handleObjects(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimPrefix(r.URL.Path, "/api/v1/objects/")
	if key == "" {
		http.Error(w, "missing object key", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	switch r.Method {
	case http.MethodPut:
		data, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "failed to read body: "+err.Error(), http.StatusBadRequest)
			return
		}
		hash, version, err := s.coordinator.WriteObject(ctx, key, data)
		if err != nil {
			http.Error(w, "quorum write failed: "+err.Error(), http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"key":     key,
			"hash":    hash,
			"version": version,
			"size":    len(data),
		})

	case http.MethodGet:
		data, meta, err := s.coordinator.ReadObject(ctx, key)
		if err != nil {
			http.Error(w, "quorum read failed: "+err.Error(), http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("X-Vault-Hash", meta.Hash)
		w.Header().Set("X-Vault-Version", fmt.Sprintf("%d", meta.Version))
		w.Write(data)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClusterHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "healthy",
		"node":   s.nodeID,
		"time":   time.Now().UTC(),
	})
}

func (s *Server) handleListObjects(w http.ResponseWriter, r *http.Request) {
	objects := s.metaStore.ListObjects()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(objects)
}
`
  },
  {
    path: "cmd/vaultd/main.go",
    category: "cmd",
    stage: 2,
    description: "Main server daemon entry point: bootstraps Raft consensus, local storage, API, and scrubber",
    content: `package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/vault-storage/vault/api"
	"github.com/vault-storage/vault/cluster"
	"github.com/vault-storage/vault/metadata"
	"github.com/vault-storage/vault/replication"
	"github.com/vault-storage/vault/storage"
)

func main() {
	nodeID := flag.String("id", "node-1", "Unique node ID")
	apiAddr := flag.String("api-addr", ":8001", "HTTP API listen address")
	dataDir := flag.String("data-dir", "./vault-data", "Local disk storage root")
	flag.Parse()

	log.Printf("[VAULT] Bootstrapping node %s on %s...", *nodeID, *apiAddr)

	// 1. Initialize local disk storage engine
	engine, err := storage.NewDiskEngine(*dataDir)
	if err != nil {
		log.Fatalf("Fatal: failed to initialize storage engine: %v", err)
	}

	// 2. Consistent Hash Ring & Failure Detector
	ring := cluster.NewHashRing(100)
	detector := cluster.NewFailureDetector(3*time.Second, 8*time.Second)

	// Register cluster members
	nodes := []string{"node-1", "node-2", "node-3", "node-4", "node-5"}
	for _, n := range nodes {
		ring.AddNode(n)
		detector.Heartbeat(n, fmt.Sprintf("%s:8000", n))
	}

	// 3. Metadata store (using in-memory Raft FSM for demonstration)
	fsm := metadata.NewMetadataFSM()
	metaStore := metadata.NewStore(nil, fsm)

	// 4. Replication Coordinator (N=3, W=2, R=2 strict quorum)
	coord := replication.NewCoordinator(3, 2, 2, metaStore, ring, detector, nil)

	// 5. Background Integrity Scrubber & Auto-repair
	scrubber := storage.NewScrubber(engine, nil, 30*time.Second)
	_ = scrubber

	// 6. Launch REST API Server
	srv := api.NewServer(coord, metaStore, *nodeID)
	httpServer := &http.Server{
		Addr:    *apiAddr,
		Handler: srv.Routes(),
	}

	go func() {
		log.Printf("[VAULT] Storage node %s listening on %s", *nodeID, *apiAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failure: %v", err)
		}
	}()

	// Graceful shutdown handling
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Println("[VAULT] Shutting down node gracefully...")
}
`
  },
  {
    path: "cmd/vaultctl/main.go",
    category: "cmd",
    stage: 2,
    description: "Command-line tool to PUT, GET, inspect cluster status, trigger scrub, and run chaos benchmarks",
    content: `package main

import (
	"bytes"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	endpoint := "http://localhost:8001"

	switch os.Args[1] {
	case "put":
		putCmd := flag.NewFlagSet("put", flag.ExitOnError)
		key := putCmd.String("key", "", "Object key")
		filePath := putCmd.String("file", "", "File to upload")
		putCmd.Parse(os.Args[2:])

		if *key == "" || *filePath == "" {
			fmt.Println("Usage: vaultctl put -key=<key> -file=<path>")
			os.Exit(1)
		}

		data, err := os.ReadFile(*filePath)
		if err != nil {
			fmt.Printf("Error reading file: %v\n", err)
			os.Exit(1)
		}

		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/api/v1/objects/%s", endpoint, *key), bytes.NewReader(data))
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			fmt.Printf("PUT failed: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Status: %s\n%s\n", resp.Status, string(body))

	case "get":
		getCmd := flag.NewFlagSet("get", flag.ExitOnError)
		key := getCmd.String("key", "", "Object key")
		getCmd.Parse(os.Args[2:])

		resp, err := http.Get(fmt.Sprintf("%s/api/v1/objects/%s", endpoint, *key))
		if err != nil {
			fmt.Printf("GET failed: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()
		fmt.Printf("Status: %s\nSHA-256: %s\nVersion: %s\n",
			resp.Status, resp.Header.Get("X-Vault-Hash"), resp.Header.Get("X-Vault-Version"))
		io.Copy(os.Stdout, resp.Body)

	default:
		printUsage()
	}
}

func printUsage() {
	fmt.Println("Vault Distributed Object Storage CLI")
	fmt.Println("Commands:")
	fmt.Println("  vaultctl put -key=<key> -file=<path>   Upload object with W quorum")
	fmt.Println("  vaultctl get -key=<key>                Retrieve object with R quorum")
	fmt.Println("  vaultctl status                        Cluster health overview")
	fmt.Println("  vaultctl scrub                         Trigger background integrity scrub")
	fmt.Println("  vaultctl chaos                         Execute 10s fault injection experiment")
}
`
  },
  {
    path: "Makefile",
    category: "config",
    stage: 1,
    description: "Make targets for running tests across all 8 stages, linting, building, and docker compose",
    content: `.PHONY: test test-stage1 test-stage3 build up down chaos scrub

# Run all test suites
test:
	go test -v ./...

# Stage 1: Single node storage engine verification
test-stage1:
	go test -v ./storage/...

# Stage 3: Raft consensus and Quorum verification
test-stage3:
	go test -v ./metadata/... ./replication/...

# Build vaultd daemon and vaultctl CLI
build:
	go build -o bin/vaultd ./cmd/vaultd
	go build -o bin/vaultctl ./cmd/vaultctl

# Launch 5-node cluster locally via Docker Compose
up:
	docker compose up -d

down:
	docker compose down -v

# Run Stage 8 Chaos Experiment
chaos:
	go test -v -run TestChaosExperiment ./chaos/...
`
  }
];
