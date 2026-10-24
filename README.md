# 🧠 AlgoRecall 2.0 — Adaptive DSA Learning & SDE Interview Readiness Platform

AlgoRecall is a production-grade, offline-first technical interview preparation and spaced repetition platform for Software Development Engineer (SDE) candidates. It unites rigorous learning science (Leitner 5-stage memory scheduling, Bayesian Knowledge Tracing, prerequisite dependency graphs) with realistic technical interview practice (timed mock loops, multi-rubric grading, progressive AI scaffolding hints, and failure diagnosis).

AlgoRecall operates under a **local-first, cloud-backed architecture** using Vanilla JavaScript, semantic HTML5, Obsidian Dark design system, and Supabase PostgreSQL with Row-Level Security (RLS) and Optimistic Concurrency Control (OCC).

---

## 📁 Repository Structure

```text
dsa/
├── index.html                             # Root SPA & Semantic Layout (755 lines)
├── package.json                           # Project metadata, standardized test scripts
├── package-lock.json                      # Dependency lockfile (devDependencies only)
├── server.js                              # Native Node.js HTTP server (zero runtime dependencies)
├── README.md                              # Authoritative Architecture, Verification & Deployment Guide
├── .gitignore                             # Ignores node_modules, package-lock, scratch artifacts
├── css/
│   └── styles.css                         # Obsidian Dark Design System & Responsive Tokens (2,829 lines)
├── docs/                                  # Architectural Guides & Verification History
│   ├── oauth-setup-guide.md               # Step-by-step Google Cloud & Supabase OAuth configuration
│   ├── stage2-solution-discovery-contracts.md # Discovery Trainer contracts & SRS policy mapping
│   ├── stage3-supabase-cloud-foundation.md# PostgreSQL schema, RLS policies, and OCC design
│   ├── stage4-cloud-primary-storage.md    # 3-step verified checkpoint, cleanup policy, anti-loss safeguards
│   └── stage9-analytics-data-dictionary.md# Analytics formulas, denominators, topic health, and provenance contracts
├── js/                                    # 30 Modular Vanilla JS Engines (IIFE / CommonJS Dual Export)
│   ├── app.js                             # Primary UI orchestrator, event bus, view router, modals
│   ├── analytics-engine.js                # Stage 9 multi-account isolated learning activity & effectiveness analytics
│   ├── solution-discovery-engine.js       # 5-step interactive Solution Discovery pedagogical engine
│   ├── solution-discovery-controller.js   # Discovery Trainer session lifecycle, stepper, auto-save & pipeline
│   ├── auth-engine.js                     # Supabase Auth, Google OAuth PKCE flow, session manager
│   ├── learner-repository.js              # Multi-user namespace isolation (algorecall_u_<uid>_*)
│   ├── cloud-repository.js                # PostgREST client, OCC versioning, payload sanitization
│   ├── cloud-sync-engine.js               # 3-step verified checkpoint, dirty tracking, safe sign-out
│   ├── migration-manager.js               # Guest progress claim, pre-migration backups, deterministic rollback
│   ├── srs-engine.js                      # Leitner 5-stage spaced repetition & Ebbinghaus memory stability
│   ├── roadmap-engine.js                  # Policy A 3-stream daily plan (Learn, Topic Revise, Spaced Revise)
│   ├── readiness-engine.js                # Multi-dimensional interview readiness radar analytics (0–100)
│   ├── failure-engine.js                  # 9-mode failure classification & diagnostic remediation
│   ├── graph-engine.js                    # 16-topic prerequisite dependency DAG traversal
│   ├── mock-engine.js                     # Timed mock interview engine with reload-resilient timers
│   ├── ai-engine.js                       # 5-tier progressive hint scaffolding (100% offline heuristics + API)
│   ├── solution-analysis.js               # Complexity verification & boundary edge-case checklists
│   ├── gamification-engine.js             # Mastery XP, 10 progression tiers, streak shields, badges
│   ├── adaptive-learning-engine.js        # Bayesian Knowledge Tracing (BKT) & Thompson Sampling
│   ├── recommendation-engine.js           # Daily recommendation queues with anti-loop safeguards
│   ├── monthly-test.js                    # Retention assessments & diagnostic grading
│   ├── storage-engine.js                  # Low-level localStorage key-value wrapper with memory fallback
│   ├── time-travel-simulator.js           # SRS interval decay & future timeline simulation
│   ├── adaptive-benchmark.js              # 21-day benchmark scenarios for adaptive engine evaluation
│   ├── charts.js                          # Chart.js visualization wrappers (Radar, Doughnut, Bars)
│   ├── config.js                          # Supabase project URL, anon key, and storage policy settings
│   ├── data/
│   │   ├── default-sheets.js              # Canonical 479 curated DSA problems (Striver, NeetCode, Blind)
│   │   ├── patterns-data.js               # 20+ Canonical algorithmic patterns handbook
│   │   └── prerequisite-graph.js          # 16-node directed acyclic graph of DSA topics
│   └── lib/
│       └── supabase.js                    # Vendored zero-dependency Supabase client v2.49.1
├── scripts/                               # Maintenance, Acceptance & Security Tooling
│   ├── audit_topics.py                    # Problem catalog taxonomy and topic balance auditor
│   ├── build_catalog.py                   # Master dataset deduplication compiler with CommonJS export
│   ├── qa-browser-e2e.js                  # 20-point Chrome CDP browser acceptance runner (51 checks)
│   ├── run-intelligence-eval.js           # 21-day 10-learner adaptive simulation benchmark runner
│   ├── test-postgrest-security.js         # Hardened Stage 5B.2 PostgREST RLS security test runner
│   ├── verify-2-3-browser.js              # v2.3 browser verification runner (skipping, position indicators)
│   ├── verify-2-4-ux.js                   # v2.4 UI/UX responsive design & token acceptance runner
│   ├── verify-auth-ui.js                  # Stage 1 Auth UI state transition acceptance runner
│   ├── verify-stage2-multiuser.js         # Stage 2 Multi-User local data isolation acceptance runner
│   └── verify-stage4-cloud-storage.js     # Stage 4 3-step verified checkpoint & cleanup acceptance runner
├── supabase/                              # Database Migrations & Security Tests
│   ├── migrations/
│   │   ├── 20261023000001_create_profiles.sql
│   │   ├── 20261023000002_create_learner_snapshots.sql
│   │   ├── 20261023000003_create_snapshot_history.sql
│   │   ├── 20261023000004_rls_security_policies.sql
│   │   └── combined_stage3_migration.sql  # Single-paste bootstrap SQL for Supabase SQL Editor
│   └── tests/
│       └── rls_security_tests.sql         # Direct PostgreSQL SQL test harness
└── test/                                  # Automated Node.js Regression Harness
    ├── run-all-tests.js                   # Master test runner (29 suites, 259 tests, 100% green)
    └── simulation-framework.js            # Monte Carlo memory simulation framework
```

---

## 🌟 Core Architecture & Engineering Principles

### 1. 🎯 Empirical Interview Readiness Engine (0–100)
Evaluates genuine problem-solving ability across 6 weighted dimensions grounded in recorded evidence:
- **Independent Solving Ability** (25%): Success without relying on AI hints.
- **Delayed Recall Retention** (20%): Successful reviews after elapsed spaced intervals ($\ge 7$ days).
- **Pattern Breadth & Coverage** (15%): Mastery distributed across all 16 canonical DSA topics.
- **Time Efficiency** (15%): Completion within target interview time constraints (Easy: 15m, Med: 25m, Hard: 45m).
- **Edge-Case Robustness** (15%): Identifying boundary traps (empty arrays, overflow, duplicates).
- **Mock Assessment Rigor** (10%): Performance under timed, multi-question mock pressure.

### 2. 🔄 Leitner 5-Stage Scientific Spaced Repetition (SRS)
- **Exponential Memory Retention Model**: $R(t) = \exp(-t / S)$, where $S$ is memory stability in days.
- **Deterministic Progression Matrix**:
  - Stage 1 $\rightarrow$ 3 days (Medium) / 7 days (Simple)
  - Stage 2 $\rightarrow$ 7 days (Medium) / 21 days (Simple)
  - Stage 3 $\rightarrow$ 21 days (Medium) / 60 days (Simple)
  - Stage 4 $\rightarrow$ 45 days (Medium) / 120 days (Simple)
  - Stage 5 $\rightarrow$ 90 days (Medium) / 240 days (Simple)
- **Anti-Inflation Mastery Safeguards**: Mastery strictly requires $\ge 3$ spaced reviews, Stage 4+, $\ge 21$ elapsed days span, and hint-free confidence $\ge 4$.
- **Hint Damping**: Using hints dampens stability gains by 50% to prevent mistaking passive recognition for true active recall.
- **Rapid Review Protection**: Early reviews before due dates do not advance the Leitner stage.

### 3. 🗺️ Policy A Three-Stream Daily Plan
Allocates a learner's daily study budget (default: 120 minutes) across three distinct streams:
1. **Today's Learn**: New problems in the currently active learning topic.
2. **Topic Revision**: Targeted deliberate practice in a secondary revision topic.
3. **Spaced Revision**: Strict due-today reviews from past learning across all topics.

### 4. 🛡️ Storage & Multi-User Architecture
- **Guest Mode**: Completely functional offline out-of-the-box. Uses `algorecall_user_states`, preserving 100% backward compatibility with legacy storage keys.
- **LearnerRepository**: Provides isolated local storage namespaces (`algorecall_u_<userId>_*`) for multiple accounts on the same device with zero data cross-talk.
- **MigrationManager**: Automatically detects legacy guest data upon Google Sign-In and offers a 1-click claim. Automatically creates an immutable pre-migration backup (`algorecall_backup_pre_migration_*`) before copying, enabling deterministic rollback.
- **CloudRepository**: Implements Optimistic Concurrency Control (OCC) using monotonic snapshot versioning (`expectedVersion`). Prevents lost updates across multiple devices.
- **CloudSyncEngine**: Enforces a **Three-Step Verified Checkpoint**:
  1. Compute local SHA/checksum ($H_{\text{local}}$).
  2. Upload sanitized snapshot to Supabase PostgreSQL.
  3. Read back committed version and remote checksum ($H_{\text{remote}}$). Only when readback strictly matches is sync metadata recorded.
- **Configurable Storage Policy**:
  - `local_retained` *(Default)*: Retains full local browser cache indefinitely for instant offline loading.
  - `cloud_primary_cleanup`: Cleans departing account's cache on safe sign-out only after a verified cloud checkpoint. If offline or sync fails, destructive cleanup is **blocked** and local data is preserved.

---

## 🔒 Security & Database Foundation

1. **Row-Level Security (RLS)**:
   - `profiles`: Users can read and update only their own profile row (`auth.uid() = id`).
   - `learner_snapshots`: Users can read, insert, update, and delete only their own snapshot (`auth.uid() = user_id`).
   - `learner_snapshot_history`: Direct authenticated client `INSERT`, `UPDATE`, and `DELETE` are revoked. History rows are created exclusively by a PostgreSQL `SECURITY DEFINER` trigger on snapshot update.
2. **OCC Concurrency Guard**:
   - Snapshot updates enforce `WHERE user_id = auth.uid() AND version = expectedVersion`.
   - Concurrent or out-of-date writes fail with `OCC_VERSION_CONFLICT` (HTTP 409).
3. **PII & Secret Sanitization**:
   - Client API keys (`aiApiKey`) and ephemeral draft sessions are automatically purged from snapshot payloads before upload.

---

## ⚡ Quick Start & Development

### Prerequisites
- Node.js (v18+ recommended; tested on Node.js v24)
- Python 3.8+ (for catalog quality auditing and deduplication tools)
- Chrome / Chromium (for browser CDP E2E acceptance tests)

### 1. Start the Local Server
```bash
npm start
```
Starts the native Node.js HTTP server at `http://localhost:3000`.

### 2. Run Automated Test Suites
AlgoRecall provides standardized test commands in `package.json`:

```bash
# Run Master Node.js Regression Suite (40 suites, 365 tests)
npm test

# Run Master Regression Suite explicitly
npm run test:unit

# Run 20-Point Chrome CDP Browser QA Audit (51 checks)
npm run test:browser

# Run Responsive UI/UX Acceptance Suite (40 checks across 5 viewports)
npm run test:ux

# Run 21-Day 10-Learner Adaptive Intelligence Benchmark
npm run test:eval

# Run Stage 2 Multi-User Isolation E2E
npm run test:stage2

# Run Stage 4 Cloud Storage & Verified Checkpoint E2E
npm run test:stage4

# Run Stage 5B.2 Hardened PostgREST Security Runner (requires test credentials)
npm run test:security

# Run Problem Catalog Quality Audit
npm run audit

# Run Catalog Deduplication Compiler
npm run catalog:build
```

---

## 🚀 Production Deployment Playbook

### 1. Static Web Hosting
AlgoRecall is a static Single Page Application (SPA). It can be deployed to any static host:
- **GitHub Pages**: Push to `main`, set GitHub Pages source to `/ (root)`.
- **Vercel / Netlify / Cloudflare Pages**: Deploy with build command `""` (none) and publish directory `.` (root).
- **Node.js Production Server**: Run `node server.js` behind a reverse proxy (Nginx / Caddy) with TLS termination.

### 2. Supabase Cloud Configuration
1. Create a Supabase project in your desired region.
2. In the Supabase Dashboard SQL Editor, run [`supabase/migrations/combined_stage3_migration.sql`](file:///c:/Users/Dell/Desktop/dsa/supabase/migrations/combined_stage3_migration.sql).
3. In **Project Settings ➔ API**, copy the `Project URL` and `anon public key`.
4. In **Authentication ➔ URL Configuration**, configure:
   - **Site URL**: `https://your-production-domain.com/`
   - **Redirect URLs**: `https://your-production-domain.com/` and `http://localhost:3000/` (for local development).
5. Configure Google OAuth credentials by following the step-by-step guide in [`docs/oauth-setup-guide.md`](file:///c:/Users/Dell/Desktop/dsa/docs/oauth-setup-guide.md).
6. Update [`js/config.js`](file:///c:/Users/Dell/Desktop/dsa/js/config.js) with your production `supabaseUrl` and `supabaseAnonKey`.

### 3. Post-Deployment Verification (Smoke Test Checklist)
1. Load `https://your-production-domain.com/`. Verify Obsidian Dark styling, problem catalog (479 problems), and 3-stream daily plan load with zero JavaScript console errors.
2. Verify Guest Mode: Solve a problem independently; verify SRS stage advances to Stage 1.
3. Test Google Sign-In: Sign in with Google OAuth; verify header displays user profile pill.
4. Test Migration Claim: Verify migration modal offers to link guest progress; confirm claim succeeds.
5. Verify Verified Checkpoint: Trigger manual cloud sync; assert committed version increments to 1.
6. Verify Safe Sign-Out: Sign out; verify UI reverts to Guest Mode without data loss.

### 4. Rollback Plan
- **Application Code**: Revert Git commit on `main` and trigger redeployment.
- **Learner Local Data**: Revert from automatic local backup via `MigrationManager.rollbackMigration(backupKey)`.
- **Database Schema**: Revert via SQL migration teardown in `supabase/migrations/`.