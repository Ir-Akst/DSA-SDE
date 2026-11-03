# AlgoRecall 2.0 — Project Structure & Module Organization

## 1. Directory Tree Overview

```
dsa/
├── index.html                           # Application entry point & master HTML shell
├── server.js                            # Zero-dependency local Node.js development server
├── package.json                         # Project metadata, scripts, and test triggers
│
├── css/                                 # Design system & modular stylesheets
│   ├── styles.css                       # Master consolidated production stylesheet
│   ├── tokens.css                       # Design tokens, color palettes, theme variables
│   ├── base.css                         # CSS reset, typography, buttons, accessibility helpers
│   ├── layout.css                       # App shell, navigation drawer, status bar, grids
│   ├── components.css                   # Shared UI components (cards, badges, modals, quiz)
│   └── views.css                        # View-specific styles (Dashboard, Roadmaps, Mock, Analytics)
│
├── js/                                  # Application JavaScript modules (Vanilla JS / IIFE)
│   ├── core/                            # Core cross-cutting utilities
│   │   └── utilities.js                 # Shared CoreUtils (HTML escape, dates, math, localStorage)
│   ├── data/                            # Curated DSA data & educational graphs
│   │   ├── default-sheets.js            # Canonical catalog: 479 curated DSA problems across 16 topics
│   │   ├── patterns-data.js             # 25 core algorithmic patterns & pattern-matching templates
│   │   ├── prerequisite-graph.js        # Topic prerequisite topology & dependency ordering
│   │   └── roadmap-120-curriculum.js    # 120-day dual-stream scheduled problems & milestones
│   ├── learner-repository.js            # Unified data access facade & multi-user profile isolation
│   ├── migration-manager.js             # Data schema migrations (v1 -> v2) with rollback protection
│   ├── storage-engine.js                # LocalStorage management, quota protection, integrity audit
│   ├── srs-engine.js                    # Leitner 5-stage spaced repetition & priority ranking
│   ├── failure-engine.js                # Root-cause diagnostic taxonomy & failure analysis
│   ├── graph-engine.js                  # Topic mastery graph & prerequisite dependency resolver
│   ├── readiness-engine.js              # Interview readiness indexing & confidence scoring
│   ├── ai-engine.js                     # Local heuristic analysis & pattern diagnostic recommendations
│   ├── solution-analysis.js             # Complexity estimator & solution reflection analyzer
│   ├── mock-engine.js                   # Mock interview orchestrator, timer, and evaluation engine
│   ├── gamification-engine.js           # XP calculations, streaks, badges, level progression
│   ├── recommendation-engine.js         # Daily smart recommendations & weakness remediation
│   ├── revision-eligibility-engine.js   # SRS queue filtering, daily capacity limits, overdue math
│   ├── revision-session-controller.js   # Interactive flashcard & review session state machine
│   ├── roadmap-120-engine.js            # 120-day dual-stream roadmap progression & buffer resolver
│   ├── roadmap-engine.js                # General roadmap executor & custom track manager
│   ├── monthly-test.js                  # Retention assessment & monthly challenge evaluator
│   ├── adaptive-learning-engine.js      # Dynamic pace adjustment based on learner performance
│   ├── time-travel-simulator.js         # Spaced repetition retention simulation over time
│   ├── adaptive-benchmark.js            # Benchmark suites for SRS retention predictive models
│   ├── charts.js                        # Chart.js rendering abstractions & responsive visualizations
│   ├── config.js                        # Client configuration constants, endpoints, and timeouts
│   ├── auth-engine.js                   # Supabase authentication controller & session management
│   ├── cloud-repository.js              # Supabase remote database synchronization client
│   ├── cloud-sync-engine.js             # Offline queue, OCC version checking, and auto-sync
│   ├── solution-discovery-engine.js     # 3-tier progressive hint revelation & cognitive coach
│   ├── solution-discovery-controller.js # Solution discovery UI interactions and modal lifecycle
│   ├── analytics-engine.js              # Learner intelligence metrics, topic health, velocity
│   ├── pilot-validation-engine.js       # 28-day pilot measurement protocol (10 core metrics)
│   ├── learning-orchestrator.js         # Cross-module unified learning dispatcher & event broker
│   └── app.js                           # Master application controller, router, and view coordinator
│
├── docs/                                # Technical documentation & design specifications
│   ├── architecture.md                  # System architecture, Leitner model, OCC sync, security
│   ├── project-structure.md             # This document: directory tree, modules, public APIs
│   ├── storage-schema.md                # Storage keys, payload formats, migrations, versioning
│   ├── maintenance.md                   # Developer workflows, test runners, deployment guide
│   ├── stage2-solution-discovery-contracts.md # Solution discovery contract specifications
│   └── stage9-analytics-data-dictionary.md    # 10 pilot metrics mathematical definitions
│
├── test/                                # Automated test suites (Zero external test dependencies)
│   ├── run-all-tests.js                 # Master test runner (executes all 48 test suites)
│   ├── architecture-cleanup-test.js     # Restructuring verification (CoreUtils, CSS, docs, catalog)
│   ├── pilot-validation-test.js         # 28-day pilot measurement protocol tests
│   ├── phase8-release-qa-test.js        # Settings, backup/restore, cloud sync, accessibility
│   ├── progress-analytics-test.js       # Progress & Analytics intelligence dashboard tests
│   ├── mock-interview-test.js           # Mock interview lifecycle, scoring, and history tests
│   ├── dashboard-productivity-test.js   # Command center, session recovery, quick notes tests
│   ├── dashboard-integration-test.js    # Dashboard view switching and data consistency
│   ├── dual-stream-tests.js             # 120-Day dual-stream curriculum resolution tests
│   ├── problems-library-integration-test.js # Problem search, filtering, and tag tests
│   ├── revision-center-integration-test.js  # SRS queue, Leitner promotion, review session tests
│   ├── revision-hardening-test.js       # Edge cases in spaced repetition intervals
│   ├── roadmap-library-editor-test.js   # Custom roadmap creation and plan editor tests
│   └── shell-routes-test.js             # Hash-based router, view rendering, and DOM assertions
│
└── scripts/                             # Maintenance, auditing, and developer tool scripts
    ├── audit_topics.py                  # Python tool to audit canonical topics and problem mappings
    ├── benchmark-performance.js         # Performance benchmark measuring UI render and query times
    ├── build-new-curriculum.js          # Generator tool for updating curriculum schedules
    ├── build_catalog.py                 # Tool for catalog verification and problem integrity
    ├── qa-browser-e2e.js                # Headless browser end-to-end integration verifier
    ├── run-intelligence-eval.js         # Analytics and predictive model evaluator
    ├── test-taxonomy-mapping.js         # Diagnostic failure taxonomy verifier
    └── verify-static-file-security.js   # Directory traversal and static file security checks
```

---

## 2. Public API Surface & Module Contracts

| Module | Global Export (`window.*`) | Primary Responsibilities |
| :--- | :--- | :--- |
| `js/core/utilities.js` | `window.CoreUtils` | Pure utility functions: `escapeHtml`, `toLocalDateStr`, `calculateMedian`, `getSafeLocalStorage`, `clamp`, `deepClone`. |
| `js/learner-repository.js` | `window.LearnerRepository` | Unified data store facade; mediates all reads/writes with user-scoping. |
| `js/storage-engine.js` | `window.StorageEngine` | Low-level safe storage operations with fallback and error handling. |
| `js/srs-engine.js` | `window.SRSEngine` | Spaced repetition box math, intervals, overdue ranking. |
| `js/roadmap-120-engine.js` | `window.Roadmap120Engine` | Dual-stream 120-day curriculum progress, catchup calculations. |
| `js/mock-engine.js` | `window.MockEngine` | Mock interview generation, session timer, evaluation calculation. |
| `js/analytics-engine.js` | `window.AnalyticsEngine` | Retention rate, topic health badges, study velocity, pilot metric calculator. |
| `js/pilot-validation-engine.js` | `window.PilotValidationEngine` | 28-day pilot validation protocol, metric verification, readiness checklist. |
| `js/app.js` | `window.AlgoRecallApp` | Top-level routing, event handlers, DOM binding, view switching. |

---

## 3. Dependency Graph & Layering Rules

```
[Layer 0: Curated Data & Core Utilities]
  default-sheets.js, roadmap-120-curriculum.js, patterns-data.js, prerequisite-graph.js
  core/utilities.js
         |
         v
[Layer 1: Persistence & Storage]
  storage-engine.js, migration-manager.js, cloud-repository.js, cloud-sync-engine.js
  learner-repository.js (Unified Facade)
         |
         v
[Layer 2: Domain Logic & Engines]
  srs-engine.js, roadmap-120-engine.js, mock-engine.js, failure-engine.js,
  analytics-engine.js, pilot-validation-engine.js, solution-discovery-engine.js
         |
         v
[Layer 3: UI Controllers & Orchestration]
  revision-session-controller.js, solution-discovery-controller.js, learning-orchestrator.js
         |
         v
[Layer 4: Application Shell & Router]
  app.js (Initializes views: Dashboard, Roadmap, Problems, Revision, Mock, Analytics, Settings)
```

### Layering Constraints
- **Higher layers may depend on lower layers**, never the reverse.
- **Engines are headless**: Engines (such as `SRSEngine` or `Roadmap120Engine`) do not manipulate DOM elements directly. They compute states and return data models.
- **Controllers manage state transitions**: UI controllers (like `RevisionSessionController`) handle session state and pass rendering data to `app.js`.

