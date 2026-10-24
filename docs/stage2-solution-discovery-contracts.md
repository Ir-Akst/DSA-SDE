# AlgoRecall 2.0 — Stage 2: Solution Discovery Trainer Architecture & API Contracts

## Executive Summary & Contract Status

This document defines the authoritative architecture, data contracts, persistence protocols, and learning-science policies for the **Solution Discovery Trainer** in AlgoRecall 2.0.

- **Stage 1 Status**: Complete & Verified (Suite 32, 13/13 passing tests for pure domain model & outcome classifier).
- **Stage 2 Status**: Approved with Mandatory Refinements (Contract Finalization, Cloud Isolation Boundary, Exactly-Once Idempotency, and Account Isolation).

---

## 1. Architectural Invariants & Approved Foundation

1. **User-Scoped Local Trainer Drafts**: Active in-progress discovery drafts are persisted strictly within the active user namespace (`algorecall_u_<userId>_trainer_draft_<problemId>`).
2. **Dedicated Guest Namespace**: Guest learners operate in an isolated namespace (`algorecall_guest_trainer_draft_<problemId>`), preventing key collisions or unintended data sharing on shared workstations.
3. **Strict Ephemeral Cloud Isolation**: In-progress trainer drafts are strictly ephemeral local entities. They are categorically purged from cloud snapshots, sync payloads, and backup archives.
4. **Card / Detail Integration**: The Discovery Trainer is accessed via a dedicated launch action from the problem card and problem detail modal, preserving the existing user journey.
5. **Reused Core Infrastructure**: Reuses the validated `SRSEngine` (Leitner 5-stage scheduling), `GamificationEngine` (Mastery XP & streaks), `LearnerRepository` (namespace resolution), and `CloudRepository` (OCC & RLS).
6. **Preserved Three-Stream Dashboard**: The three-stream daily practice layout (Stream 1: Learn, Stream 2: Topic Revision, Stream 3: Spaced Revision) remains 100% untouched.

---

## 2. Outcome State Machine & SRS Mapping Matrix

### 2.1 The 6 Formal Session Outcomes

The trainer recognizes six mutually exclusive outcomes. These outcomes are **not equivalent** and trigger differentiated learning engine behaviors:

| Outcome Key | Condition | Status | SRS Event? | Leitner Stage Effect | Mastery Eligible? | Gamification XP | Verification Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `independent_solve` | Solved with **0 hints** and **0 solution reveals** | `completed` | **Yes** | +1 Stage (if spaced $\ge 18\text{h}$) | **Yes** (if Stage $\ge 4$, 3+ reviews, $21\text{d}$ span) | `independent_solve` (+50 XP) | `trainer_guided_self_reported` |
| `assisted_solve` | Solved with $\ge 1$ hint (levels 1–4) and **0 solution reveals** | `completed` | **Yes** | Preserved (Hint Gating; review in 1–2d) | **No** (Strictly blocked) | `review` (+25 XP) | `trainer_guided_self_reported` |
| `solution_reveal` | Hint Level 5 revealed at any point in session | `completed` | **Yes** | Preserved/Reset (Cap confidence $\le 2$) | **No** (Strictly blocked) | `review` (+25 XP) | `trainer_guided_self_reported` |
| `failed_attempt` | Explicitly marked failed / unsolved | `completed` | **Yes** | Reset to Stage 1 (Interval = 1d) | **No** (Reset) | `review` (+25 XP) | `trainer_guided_self_reported` |
| `paused` | Learner suspends session to resume later | `paused` | **No** | None (Preserved) | **No** | None (0 XP) | `none` |
| `abandoned` | Learner discards session without completing | `abandoned` | **No** | None (Preserved) | **No** | None (0 XP) | `none` |

### 2.2 Strict Invariants Enforced

- **Paused and Abandoned Sessions**: Categorically prohibited from generating SRS events, awarding XP, mutating streaks, or advancing Leitner intervals.
- **Assisted and Solution-Reveal Sessions**: Prohibited from awarding independent mastery credit (`isIndependent: false`, `allowMastery: false`). In `SRSEngine.processReview`, `hintsUsed: true` invokes Priority 3 Hint Gating, locking the problem stage and requiring a 1–2 day retrieval drill.
- **Verification Provenance**: Self-reported completions are explicitly marked `provenance: 'trainer_guided_self_reported'` with `isExternallyVerified: false`. They are never presented as externally verified compiler test runs.
- **Algorithm Invariance**: No modifications to `INTERVAL_MATRIX`, memory stability $S$, retention decay $R(t) = \exp(-t/S)$, or Leitner formulas.

---

## 3. Exactly-Once Durable Event Pipeline

To guarantee that network retries, page reloads, tab switches, and cloud reconciliation never duplicate XP, streaks, mastery, or SRS history entries, all terminal sessions produce a **Durable Completed Event**.

```
+-----------------------------------------------------------------------------+
|                          Solution Discovery Session                         |
|  - sessionId: sds_two-sum_1792762800000_abc123                             |
|  - status: 'completed'                                                      |
|  - classification: { outcome: 'independent_solve', scoreWeight: 1.0 }       |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                      Durable Event Generation (Pure)                         |
|  - eventId: evt_sde_two-sum_sds_two-sum_1792762800000_abc123_...            |
|  - srsMapping: { rating: 'simple', confidence: 4, hintsUsed: false, ... }   |
|  - provenance: 'trainer_guided_self_reported'                               |
+-----------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                      LearnerRepository Event Bus Gate                       |
|  Check: Is eventId in algorecall_u_<uid>_trainer_processed_events_v2?       |
+-----------------------------------------------------------------------------+
         |                                                           |
         | [New Event]                                               | [Duplicate / Replayed]
         v                                                           v
+----------------------------------------+              +---------------------------+
| 1. Commit to processed events set      |              | Idempotent No-Op:         |
| 2. SRSEngine.processReview(...)        |              | Return existing recorded  |
| 3. GamificationEngine.awardXP(...)     |              | state without side-effects|
| 4. Clear local trainer draft           |              +---------------------------+
+----------------------------------------+
```

### Event Schema (`schemaVersion: '2.0.0'`)
```json
{
  "eventId": "evt_sde_two-sum_sds_two-sum_1792762800000_xyz890_independent_solve_1792763400000",
  "schemaVersion": "2.0.0",
  "sessionId": "sds_two-sum_1792762800000_xyz890",
  "problemId": "two-sum",
  "userId": "usr_alice_123",
  "outcome": "independent_solve",
  "classification": {
    "outcome": "independent_solve",
    "isIndependent": true,
    "isAssisted": false,
    "isSolutionReveal": false,
    "isFailure": false,
    "hintCount": 0,
    "revealedLevels": [],
    "solutionRevealed": false,
    "scoreWeight": 1.0
  },
  "srsMapping": {
    "shouldApplySRS": true,
    "outcome": "independent_solve",
    "rating": "simple",
    "confidence": 4,
    "hintsUsed": false,
    "isIndependent": true,
    "allowMastery": true,
    "xpEvent": "independent_solve",
    "timeSpentMinutes": 18,
    "notes": "Solved using single-pass hash map complement lookup",
    "scoreWeight": 1.0,
    "provenance": "trainer_guided_self_reported",
    "isExternallyVerified": false
  },
  "analytics": {
    "scoreWeight": 1.0,
    "metricDenominator": 1,
    "interpretation": "Cognitive independence heuristic (provisional analytics-only; not an SRS multiplier)"
  },
  "provenance": {
    "type": "trainer_guided_self_reported",
    "isExternallyVerified": false,
    "completedAt": 1792763400000
  },
  "createdAt": 1792763400000
}
```

---

## 4. Persistence Contract & Namespace Isolation

### 4.1 Storage Key Hierarchy

| Data Category | Namespace Scope | Key Format | Lifecycle | Cloud Synced? |
| :--- | :--- | :--- | :--- | :--- |
| **Active Trainer Draft** | Authenticated User | `algorecall_u_<safeUserId>_trainer_draft_<problemId>` | Ephemeral (until completed/abandoned) | **NO (Purged)** |
| **Active Trainer Draft** | Guest | `algorecall_guest_trainer_draft_<problemId>` | Ephemeral (until completed/abandoned) | **NO (Local-only)** |
| **Processed Event Registry** | Authenticated User | `algorecall_u_<safeUserId>_trainer_events_v2` | Durable Audit Log | **YES (In Bundle)** |
| **Processed Event Registry** | Guest | `algorecall_guest_trainer_events_v2` | Durable Local Log | **NO (Local-only)** |
| **Resulting SRS States** | Authenticated User | `algorecall_u_<safeUserId>_user_states_v2` | Authoritative Spaced Repetition | **YES (Snapshot)** |
| **Resulting SRS States** | Guest | `algorecall_user_states_v2` / `algorecall_guest_user_states_v2` | Authoritative Local Spaced Repetition | **NO** |

### 4.2 Account Switching & Sign-Out Protocol

1. **User A $\rightarrow$ User B Switch**:
   - `LearnerRepository.setContext('user:usr_bob')` notifies all engines.
   - User A's drafts in `algorecall_u_usr_alice_trainer_draft_*` remain untouched on disk.
   - User B's active trainer drafts are loaded exclusively from `algorecall_u_usr_bob_trainer_draft_*`.
   - Zero in-memory cross-talk: Active editor fields are re-initialized from User B's drafts.
2. **User A $\rightarrow$ Guest (Sign-Out)**:
   - If storage policy is `cloud_primary_cleanup`, a verified 3-step cloud checkpoint commits durable state (`userStates`, `gamification`, etc.) before purging User A's private keys.
   - In-progress drafts for User A are cleanly purged during cache cleanup or retained safely if `local_retained`.
   - Guest namespace re-activates with its independent drafts.
3. **Guest $\rightarrow$ Authenticated Transition (Sign-In)**:
   - **Zero Silent Merging**: Guest drafts and learning records are **never** silently merged into the authenticated account.
   - If legacy progress is detected, `MigrationManager` prompts the user with an explicit modal (Claim Progress vs. Start Fresh).
   - If Claim is chosen: A verified pre-migration backup (`algorecall_backup_pre_migration_*`) is created before copying durable records. Guest drafts remain in guest storage or are explicitly discarded.
   - If Start Fresh is chosen: A clean account namespace is initialized.

### 4.3 Resilience to Corrupt or Stale Drafts

1. **Corrupt Draft Recovery**:
   - `deserializeSession` and `getTrainerDraft` validate JSON integrity and session shape (`isValidSession`).
   - If parse fails or required fields are missing: The corrupt record is quarantined (`algorecall_corrupt_draft_<problemId>_<timestamp>`), a warning is logged, and a clean fallback is returned without throwing unhandled exceptions.
2. **Stale / Concurrent Draft Overwrites**:
   - Drafts maintain an atomic `updatedAt` epoch and monotonic `draftVersion` integer.
   - In-flight writes compare incoming `draftVersion` against persisted `draftVersion`. Stale writes from background tabs are rejected with `STALE_DRAFT_WRITE`.

---

## 5. Cloud Boundary & Sanitization Contract

### 5.1 Cloud Sanitization (`CloudRepository.sanitizePayload`)

The cloud repository enforces strict sanitization on all payload bundles prior to upload to `public.learner_snapshots`:

```javascript
function sanitizePayload(payload) {
  // 1. Purge client secrets from settings
  if (clean.settings) delete clean.settings.aiApiKey;

  // 2. Purge ephemeral in-flight sessions & trainer drafts
  delete clean.activeExamSession;
  delete clean.activeMockSession;
  delete clean.activeTrainerDraft;
  delete clean.trainerDrafts;

  // 3. Purge any keys starting with trainer draft prefixes
  Object.keys(clean).forEach(k => {
    if (k.startsWith('trainer_draft') || k.startsWith('algorecall_trainer_draft')) {
      delete clean[k];
    }
  });

  return clean;
}
```

### 5.2 Verification Checkpoints & Checksum Invariance

- In-progress drafts do **not** enter `CloudSyncEngine.getLocalBundle()`.
- Therefore, the deterministic FNV-1a checksum ($H_{\text{local}}$) computed by `CloudSyncEngine.isDirty()` is completely independent of draft presence, typing, or auto-saving.
- Adding, updating, or abandoning a trainer draft causes **zero dirty flags** in cloud synchronization.
- Only terminal completed events that write to `userStates` and `gamification` mark the local state dirty and schedule a verified cloud checkpoint.

---

## 6. Analytics Metric Governance & Provisional Constraints

### 6.1 Score Weight Definition

The domain engine produces provisional score weights:
- `independent_solve`: `1.00`
- `assisted_solve`: `1.00 - (hintCount * 0.10)` (range: `0.60` to `0.90`)
- `solution_reveal`: `0.25`
- `failed_attempt`: `0.00`
- `paused` / `abandoned`: `null` (not evaluated)

### 6.2 Governance Rules

1. **Provisional Analytics Only**: These weights are designated exclusively for candidate self-reflection and exploratory analytics dashboards.
2. **Strict Prohibition as Multipliers**: Score weights **must never** be used as multipliers for Leitner intervals ($I \ne I_0 \times W$), memory stability ($S \ne S_0 \times W$), or Bayesian Knowledge Tracing transition probabilities ($P(T) \ne P_0 \times W$).
3. **Metric Denominator**: The metric denominator is defined as $N_{\text{completed}}$: the total number of terminal completed attempts for the problem or session set. Paused and abandoned attempts are strictly excluded from the denominator.
4. **Interpretation**: Represents a normalized heuristic cognitive independence index (0.0 to 1.0) indicating the degree of algorithmic reasoning achieved without progressive hint scaffolding.

---

## 7. Conflict Analysis with Existing Implementations

| Subsystem | Existing Implementation | Proposed Discovery Trainer Contract | Conflict Status | Resolution / Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Leitner SRS (`SRSEngine`)** | `processReview(state, rating, timeSpent, notes, conf, opts)` | `mapOutcomeToSRS` produces exact arguments; respects Priority 1 Failure Reset, Priority 2 Massed Practice Guard, and Priority 3 Hint Gating | **NO CONFLICT** | Reuses `SRSEngine.processReview` directly. Hint gating naturally halts Leitner stage advancement for assisted solves. |
| **Gamification (`GamificationEngine`)** | `awardXP(eventType)` ('independent_solve': 50, 'review': 25) | Only `independent_solve` maps to 'independent_solve' XP; assisted and reveal map to 'review' | **NO CONFLICT** | Clean 1-to-1 event mapping. |
| **Namespace Repository (`LearnerRepository`)** | `resolveKey(key, ctx)` isolates `algorecall_u_<uid>_*` vs `algorecall_guest_*` | New draft keys follow identical resolver convention: `algorecall_u_<uid>_trainer_draft_<id>` | **NO CONFLICT** | Seamlessly uses `resolveKey` helper. |
| **Cloud Repository (`CloudRepository`)** | Strips `activeExamSession` and `activeMockSession` | Also strips `trainerDrafts` and draft keys | **NO CONFLICT** | Defense-in-depth sanitization extension. |
| **Three-Stream Dashboard (`RoadmapEngine`)** | 3 streams (Learn, Topic Revise, Spaced Revise) | Preserved; Trainer launched from Problem Card / Detail Modal action | **NO CONFLICT** | Dashboard cards and stream filtering untouched. |
| **Account Migration (`MigrationManager`)** | Migrates un-namespaced legacy data upon explicit consent | Guest drafts remain in guest namespace; zero silent inheritance | **NO CONFLICT** | Preserves user consent boundary. |

---

## 8. Migration Risks & Rollback Protocol

1. **Risk: User switches accounts while trainer draft is active in memory**.
   - *Mitigation*: `LearnerRepository.onContextChange` listener notifies Discovery Trainer controller to immediately serialize active draft to current namespace and flush editor before switching context.
2. **Risk: Offline learner signs in; guest trainer draft overwrites authenticated user draft**.
   - *Mitigation*: Strict key namespacing (`algorecall_guest_trainer_draft_*` vs `algorecall_u_<id>_trainer_draft_*`). Keys never collide.
3. **Risk: Browser crash during session completion causes duplicate review recording on restart**.
   - *Mitigation*: Exactly-once event ID check in `LearnerRepository.isTrainerEventProcessed(eventId)` ensures any replayed completion event is an idempotent no-op.
4. **Rollback Safety**:
   - If any unexpected regression occurs, the trainer module can be disabled via a feature flag in `config.js` (`config.features.solutionDiscoveryTrainer = false`) without affecting existing problem cards, detail modals, or SRS review flows.
