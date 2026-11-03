# AlgoRecall 2.0 — Maintenance & Operations Guide

## 1. Local Development & Testing

AlgoRecall requires zero installation or compilation steps. A standard installation of Node.js (v18+) is all that is required for running tests and the local development server.

### Starting the Local Development Server
```bash
node server.js
```
The server starts at `http://localhost:8080/`. It serves static files with appropriate MIME types and security headers.

### Running Test Suites

AlgoRecall includes a comprehensive test suite of 48 test files with zero external testing framework dependencies (no Jest, Mocha, or npm install required).

#### Master Test Runner
```bash
node test/run-all-tests.js
```
Executes all 48 subsystem suites and reports overall pass/fail status, performance benchmarks, and assertion counts.

#### Individual Subsystem Test Suites
```bash
# Architecture and cleanup verification
node test/architecture-cleanup-test.js

# Pilot validation protocol & 10 core metrics
node test/pilot-validation-test.js

# Phase 8 release QA & settings
node test/phase8-release-qa-test.js

# Progress & Analytics dashboard
node test/progress-analytics-test.js

# Mock interview system
node test/mock-interview-test.js

# Dashboard productivity command center
node test/dashboard-productivity-test.js

# 120-Day dual stream curriculum
node test/dual-stream-tests.js

# Revision Center & SRS Leitner intervals
node test/revision-center-integration-test.js
```

---

## 2. Managing the Curated Problem Catalog

The canonical DSA catalog consists of **479 curated problems** across **16 canonical topics**, stored in `js/data/default-sheets.js`.

### Canonical Problem Invariants
1. Every problem must have a unique `id` (kebab-case).
2. Every problem must have a valid `title`, `difficulty` (`Easy` | `Medium` | `Hard`), `topic`, and `url`.
3. Every problem's topic must match one of the 16 canonical topics:
   `Arrays`, `Two Pointers`, `Sliding Window`, `Stack`, `Binary Search`, `Linked List`, `Trees`, `Tries`, `Heap / Priority Queue`, `Backtracking`, `Graphs`, `Advanced Graphs`, `1-D DP`, `2-D DP`, `Greedy`, `Bit Manipulation`.

### Validating Catalog Integrity
```bash
python scripts/build_catalog.py
python scripts/audit_topics.py
```

---

## 3. Updating Roadmaps & Curricula

Roadmaps are defined in `js/data/roadmap-120-curriculum.js`.

### Adding or Modifying Curriculum Days
- Every day must define:
  - `day`: Day number (1 - 120).
  - `phase`: Associated learning phase.
  - `streamA`: Array of problem IDs for core curriculum.
  - `streamB`: Array of problem IDs for topic mastery reinforcement.
  - `isBuffer`: Boolean flag indicating catch-up / review day.
- Run `node test/dual-stream-tests.js` to ensure the curriculum graph remains valid and free of cyclic prerequisites.

---

## 4. 28-Day Pilot Validation Protocol

To verify learning effectiveness and run pilot checkpoints:

### Metric Registry Verification
1. Access the Pilot Validation Engine via `PilotValidationEngine`.
2. Inspect the 10 core metrics:
   - Target Completion Rate ($\ge 80\%$)
   - 28-Day Retention Rate ($\ge 75\%$)
   - Topic Mastery Velocity
   - Mock Interview Readiness Index ($\ge 70\%$)
   - SRS Review Adherence ($\ge 85\%$)
   - Independent First-Pass Solve Rate ($\ge 60\%$)
   - Weak Topic Remediation Time
   - Study Streak Consistency
   - Time-to-Mastery Acceleration
   - Net Pedagogical Score
3. Run automated verification:
   ```bash
   node test/pilot-validation-test.js
   ```

---

## 5. Deployment Guide (GitHub Pages)

AlgoRecall 2.0 is designed for direct static hosting on GitHub Pages, Cloudflare Pages, or Netlify.

### GitHub Pages Deployment Steps
1. Ensure all tests pass:
   ```bash
   node test/run-all-tests.js
   ```
2. Verify static assets and entry point:
   - Root `index.html` is present.
   - `css/styles.css` and modular stylesheets in `css/` are committed.
   - All scripts in `js/` and `js/data/` are referenced with cache-busting version strings (e.g., `?v=2.1.2`).
3. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "release: deploy AlgoRecall 2.0 production build"
   git push origin main
   ```
4. On GitHub repository settings:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`.
   - Click **Save**.
5. The application is live at `https://<username>.github.io/<repo>/`.

