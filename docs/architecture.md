# AlgoRecall 2.0 — System Architecture & Design Specification

## 1. Overview & Core Philosophy

AlgoRecall 2.0 is a zero-dependency, client-first, privacy-respecting Spaced Repetition (SRS) & DSA Mastery Engine designed for software engineers. It operates directly inside the browser using standard modern Web APIs, with optional zero-friction cloud synchronization via Supabase.

### Architectural Principles
1. **Zero-Build Vanilla Execution**: No Webpack, Vite, React, or transpile step. Code executes identically in the browser via native script loading and in Node.js test environments.
2. **Determinism & Invariant Safety**: Critical learning algorithms (Leitner 5-stage spaced repetition, dual-stream curriculum resolver, topic health matrices, and pilot evaluation metrics) are completely deterministic and mathematically bounded.
3. **Data Sovereignty & Account Isolation**: Every user's learning history, roadmap progress, revisions, and notes are strictly isolated by unique user ID, whether running purely locally in `localStorage` or synchronized to the cloud.
4. **Resilience & Optimistic Concurrency Control (OCC)**: Offline-first architecture with automatic conflict detection, version incrementing, and retry idempotency.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 Browser UI Layer                                  |
|  [Dashboard Command Center]  [Roadmaps Library]  [Problems Catalog]  [Revision Center] |
|             [Mock Interviews]  [Progress & Analytics]  [Settings / Data Hub]      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           Presentation & Controllers                              |
|   App Shell & Router (app.js)  |  RevisionSessionController  |  DiscoveryController   |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              Domain & Engine Layer                                |
|  - SRSEngine: Leitner 5-box intervals, difficulty scaling, priority ranking       |
|  - Roadmap120Engine: Dual-stream (Curriculum + Topic Mastery), auto-catchup       |
|  - MockEngine: Timed sessions, multi-problem scoring, post-mock analytics         |
|  - AnalyticsEngine: 10 pilot metrics, topic health, retention forecasting         |
|  - SolutionDiscoveryEngine: 3-tier progressive hint revelation, cognitive coach   |
|  - GamificationEngine: XP, streaks, level tiers, achievement milestones           |
|  - FailureEngine: Root-cause taxonomy & diagnostic weakness analysis              |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           Data Access & Persistence Layer                         |
|  - LearnerRepository: Unified facade, schema migration, multi-user isolation     |
|  - StorageEngine: Safe localStorage wrapper, quota protection, integrity check    |
|  - CloudRepository & CloudSyncEngine: Supabase integration with OCC versioning     |
|  - CoreUtils: Escape sanitization, date calculation, math aggregations            |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           Canonical Data & Curricula                              |
|  - DefaultSheets: 479 curated DSA problems across 16 canonical topics             |
|  - Roadmap120Curriculum: 120-day dual-stream scheduled problems & milestone tests |
|  - PatternsData & PrerequisiteGraph: Pedagogical dependency ordering              |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Engine Specifications

### 3.1 Leitner Spaced Repetition System (`SRSEngine`)
- **Stage Intervals**:
  - Box 1: 1 Day
  - Box 2: 3 Days
  - Box 3: 7 Days
  - Box 4: 14 Days
  - Box 5: 30 Days (Mastered)
- **Difficulty Multipliers**:
  - Easy: $1.0\times$
  - Medium: $0.85\times$
  - Hard: $0.7\times$
- **Promotion & Demotion Semantics**:
  - `Pass` / `Easy`: Promotes to $\min(\text{current\_box} + 1, 5)$.
  - `Hard`: Keeps problem in current box with reduced interval.
  - `Fail`: Demotes problem directly to Box 1 for immediate review reinforcement.
- **Priority Scoring Formula**:
  $$\text{Priority} = (\text{Days Overdue} \times 2.0) + (6 - \text{Box}) \times 1.5 + \text{Difficulty Weight}$$

### 3.2 Dual-Stream Curriculum Engine (`Roadmap120Engine`)
- **Stream A (Curriculum Core)**: Core sequential progression through standard DSA patterns and foundational topics.
- **Stream B (Topic Mastery & Reinforcement)**: Targeted practice on secondary topics, advanced variations, and weak-topic remediation.
- **Buffer & Catch-up Mechanics**:
  - Built-in review buffers every 7 days.
  - Roadmap completion of a day requires both streams to be satisfied or explicitly buffered.
  - Independent from SRS obligations (curriculum completion does not automatically mark SRS mastery).

### 3.3 Solution Discovery Trainer (`SolutionDiscoveryEngine`)
- **Three-Tier Progressive Reveal**:
  - Tier 1: Conceptual Pattern & Cognitive Clue (e.g., "Two Pointers / Fast & Slow").
  - Tier 2: Algorithmic Approach & Invariant Explanation.
  - Tier 3: Complete Step-by-Step Pseudocode & Complexity Proof.
- **Independence Metric Tracking**:
  - Pure First-Pass Solve: Solved with 0 hints revealed.
  - Assisted Solve: Solved after viewing 1 or more hint tiers.
  - Distinction recorded in `attempt_provenance` for accurate pilot evaluation.

### 3.4 Mock Interview Simulation (`MockEngine`)
- **Time Pressure Simulation**: 30-minute to 60-minute countdown timers.
- **Comprehensive Evaluation**:
  - Correctness, Space/Time Complexity, Approach, Clean Code, Communication.
  - Unified scale: Normalizes to $0-100\%$ score and maps to Analytics $0-20$ scale ($Score / 5$).
- **Isolation**: Mock attempts do not overwrite curriculum daily tasks or corrupt standard SRS boxes.

---

## 4. Multi-User Isolation & OCC Synchronization

### User Scoping Strategy
- Anonymous Local User: Uses `default_user` prefix or active profile ID.
- Authenticated Cloud User: Supabase Auth JWT provides unique UUID.
- Storage keys follow pattern: `algorecall_${userId}_${resource}`.

### Optimistic Concurrency Control (OCC)
- Every user record maintains an integer `version` field (starting at 1).
- On Cloud Sync:
  1. Client sends payload with `client_version`.
  2. If `db_version === client_version`, DB updates and increments `version = db_version + 1`.
  3. If `db_version > client_version`, conflict detected:
     - Conflict resolution merges non-overlapping problem solve states via maximum timestamp rule.
     - New merged state is committed with `db_version + 1`.

---

## 5. Security & Privacy Model
1. **Zero External Tracking**: No third-party trackers, analytics beacons, or telemetry.
2. **HTML Sanitization**: All user inputs (notes, reflections, search terms) are strictly escaped via `CoreUtils.escapeHtml` before DOM rendering to prevent Cross-Site Scripting (XSS).
3. **Safe Storage Wrappers**: `StorageEngine` wraps all storage operations in `try/catch` with automated storage quota detection and graceful degradation.

