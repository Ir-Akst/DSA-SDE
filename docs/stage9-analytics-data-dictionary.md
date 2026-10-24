# AlgoRecall 2.0 — Stage 9 Analytics Data Dictionary & Integrity Contract

## 1. Architectural Principles
- **Local-First & Offline Resilience**: All analytics are computed synchronously on the client from authoritative local events (`LearnerRepository.getTrainerProcessedEvents`) and canonical learner state (`LearnerRepository.getUserStates`). Zero external network calls or telemetry beacons.
- **Account-Scoped Isolation**: Analytics metrics are computed strictly within the active learner context (`ctx.id` or `guest`). Switching learner context flushes the internal TTL aggregation cache.
- **Explicit Denominators & Honest Data**: Missing data is never coerced to zero. When no terminal evaluations exist, rates evaluate to `null` with `insufficientData: true`.
- **Deduplication Invariant**: Authoritative events (`eventId`) are deduplicated against SRS review history (`trainerEventId`) to guarantee idempotent counting.
- **Non-Terminal Session Segregation**: Ephemeral in-progress drafts, paused sessions, and abandoned attempts are tracked independently and strictly excluded from completed terminal outcome metrics ($N_{\text{completed}}$).
- **Provenance Integrity**: All analytics carry `isExternallyVerified: false` with notice `trainer_guided_self_reported`. Cognitive independence weights are treated as provisional heuristic metadata, never mutating Leitner intervals.

---

## 2. Core Entities & Scope

| Entity | Definition | Persistence / Storage Key |
| :--- | :--- | :--- |
| **Session** | An initiated attempt in Discovery Trainer (`in_progress`, `paused`, `abandoned`, or completed). | `algorecall_trainer_draft_<probId>` (ephemeral) |
| **Attempt (Terminal Evaluation)** | A finalized learning outcome with an authoritative decision: `independent_solve`, `assisted_solve`, `solution_reveal`, or `failed_attempt`. | `algorecall_trainer_events_v2` / `userStates[pId].history` |
| **Unique Problem** | Distinct canonical algorithm identifier in catalog (e.g., `two-sum`, `lru-cache`). | `DEFAULT_DSA_SHEETS` |

---

## 3. Metrics Data Dictionary

### A. Learning Activity Metrics
| Metric Name | Type | Formula / Definition | Denominator | Data Source |
| :--- | :--- | :--- | :--- | :--- |
| `uniqueProblemsAttempted` | Integer | Count of distinct problem IDs with $\ge 1$ recorded session or review. | Catalog Size | `trainerEvents`, `userStates[pId].history` |
| `uniqueProblemsSolved` | Integer | Count of distinct problem IDs with $\text{stage} \ge 1$ and rating $\ne \text{'failed'}$. | Catalog Size | `userStates[pId].stage` |
| `totalTerminalAttempts` | Integer | $N_{\text{completed}} = N_{\text{ind}} + N_{\text{ast}} + N_{\text{rev}} + N_{\text{fail}}$ | N/A | Evaluated events |
| `totalSessionsInitiated` | Integer | $N_{\text{completed}} + N_{\text{drafts}} + N_{\text{paused}} + N_{\text{abandoned}}$ | N/A | Drafts + Events |
| `independentSolves` | Integer | Count of terminal events with outcome `independent_solve`. | $N_{\text{completed}}$ | Evaluated events |
| `assistedSolves` | Integer | Count of terminal events with outcome `assisted_solve`. | $N_{\text{completed}}$ | Evaluated events |
| `solutionReveals` | Integer | Count of terminal events with outcome `solution_reveal`. | $N_{\text{completed}}$ | Evaluated events |
| `failedAttempts` | Integer | Count of terminal events with outcome `failed_attempt`. | $N_{\text{completed}}$ | Evaluated events |
| `pausedSessions` | Integer | Count of active drafts with `status === 'paused'`. | N/A | Ephemeral drafts |
| `abandonedSessions` | Integer | Count of active drafts with `status === 'abandoned'`. | N/A | Ephemeral drafts |
| `totalReliableTimeMinutes` | Float | $\sum \text{timeSpentMinutes}$ for events where $0 < t < 300$. Capped to prevent runaway timers. | Tracked events | `evt.timeSpentMinutes` |
| `dailyActivity` | Map | `Map<YYYY-MM-DD, count>` of all terminal practice and review events. | N/A | `evt.completedAt` |

### B. Learning Effectiveness Metrics
| Metric Name | Type | Formula / Range | Insufficient Data Condition | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| `independentSolveRate` | Percentage | $\frac{N_{\text{ind}}}{N_{\text{completed}}} \times 100\%$ | $N_{\text{completed}} = 0$ (`null`) | Solved without progressive hints or external reveals. |
| `assistedSolveRate` | Percentage | $\frac{N_{\text{ast}}}{N_{\text{completed}}} \times 100\%$ | $N_{\text{completed}} = 0$ (`null`) | Solved using 1–4 progressive guidance hints. |
| `solutionRevealRate` | Percentage | $\frac{N_{\text{rev}}}{N_{\text{completed}}} \times 100\%$ | $N_{\text{completed}} = 0$ (`null`) | Full solution unlocked prior to solving. |
| `failureRate` | Percentage | $\frac{N_{\text{fail}}}{N_{\text{completed}}} \times 100\%$ | $N_{\text{completed}} = 0$ (`null`) | Attempt explicitly flagged failed. |
| `hintDependencyIndex` | Heuristic | $\frac{1.5 N_{\text{ast}} + 5 N_{\text{rev}} + 2 N_{\text{fail}}}{N_{\text{completed}}}$ | $N_{\text{completed}} = 0$ (`null`) | Estimated average hints consumed per attempt (0.0 to 5.0). |
| `provisionalIndependenceScore` | Heuristic | $\frac{1.0 N_{\text{ind}} + 0.75 N_{\text{ast}} + 0.25 N_{\text{rev}} + 0.0 N_{\text{fail}}}{N_{\text{completed}}}$ | $N_{\text{completed}} = 0$ (`null`) | Provisional cognitive independence score (0.00 to 1.00). Flagged `isProvisional: true`. |

### C. Retention & Spaced Review Adherence
| Metric Name | Type | Formula | Denominator | Data Source |
| :--- | :--- | :--- | :--- | :--- |
| `adherenceRate` | Percentage | $\frac{N_{\text{onTimeReviews}}}{N_{\text{totalReviews}}} \times 100\%$ | Total reviews | Scheduled date vs review date |
| `dueReviews` | Integer | Count of problems where `SRSEngine.isDue(state) === true`. | Catalog problems | `userStates[pId]` |
| `overdueReviews` | Integer | Count of due problems where `nextReviewDate < today`. | Catalog problems | `userStates[pId]` |
| `consistencyScore` | Percentage | $\frac{\text{Active Days in Last 30d}}{30} \times 100\%$ | 30 days | `dailyActivity` |

---

## 4. Topic Health Classification Contract
For each canonical topic $T$ with catalog count $C_T$:
- **Mastered Count ($M_T$)**: Problems at $\text{stage} \ge 4$ with $\text{confidence} \ge 4$.
- **Solved Count ($S_T$)**: Problems at $\text{stage} \ge 1$ and rating $\ne \text{'failed'}$.
- **Mastery Score**:
$$\text{MasteryScore}_T = \min\left(100, \text{round}\left(\frac{1.0 \times M_T + 0.5 \times (S_T - M_T)}{\max(1, C_T)} \times 100\right)\right)$$
- **Health Classification**:
  - `unattempted`: $\text{Attempted}_T = 0$
  - `strong`: $\text{Attempted}_T > 0$ and $\text{MasteryScore}_T \ge 70$
  - `moderate`: $\text{Attempted}_T > 0$ and $40 \le \text{MasteryScore}_T < 70$
  - `at_risk`: $\text{Attempted}_T > 0$ and $\text{MasteryScore}_T < 40$
