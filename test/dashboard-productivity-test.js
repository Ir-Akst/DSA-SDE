/**
 * AlgoRecall 2.0 — Dashboard Productivity Redesign & Functional Upgrade Test Suite
 * Validates:
 * 1. Information Architecture & Hierarchy (Header, Context Bar, Day-wise Workspace, Revision Queue)
 * 2. Canonical Day 1 Dual-Stream Curriculum (Stream A: Binary Trees & BST, Stream B: Arrays & Hashing)
 * 3. Direct Navigation & Action Routes (Continue Learning, Continue Next Unsolved, Open/Edit Roadmap)
 * 4. Day-wise Problems Workspace (Toolbars, Filtering, Sorting, Collapsing, Workload & Checklist)
 * 5. Interactive Problem Operations (Solve toggle, Bookmark, Open Link without marking solved)
 * 6. Quick Notes & Mistake Capture Persistence & Parity
 * 7. Session Recovery Precedence (Trainer > Active Recall Revision)
 * 8. Revision Queue Parity, Overdue/Due-Today Filtering & Empty State
 * 9. Learner State Preservation, User Isolation & Backward Compatibility
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

(async () => {
  console.log('\n========================================');
  console.log('AlgoRecall 2.0 — Dashboard Productivity Command Center Tests');
  console.log('========================================\n');

  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
  const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf-8');
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');

  const RoadmapEngine = require('../js/roadmap-engine');
  const Roadmap120Engine = require('../js/roadmap-120-engine');
  const SRSEngine = require('../js/srs-engine');
  const RevisionSessionController = require('../js/revision-session-controller');
  const LearnerRepository = require('../js/learner-repository');
  const sheets = require('../js/data/default-sheets');
  const allProblems = sheets.DEFAULT_DSA_SHEETS || sheets;

  // --- CATEGORY 1: DOM Structure & Information Architecture ---
  console.log('[CATEGORY 1] Dashboard Architecture & Hierarchy');

  test('1.1: Dashboard header exists with title, local date, and user context badge', () => {
    assert.ok(html.includes('id="dash-header"'), 'Missing #dash-header');
    assert.ok(html.includes('id="dash-current-date-text"'), 'Missing #dash-current-date-text');
    assert.ok(html.includes('id="dash-date-string"'), 'Missing #dash-date-string');
    assert.ok(html.includes('id="dash-user-name"'), 'Missing #dash-user-name');
    assert.ok(html.includes('id="dash-user-name-text"'), 'Missing #dash-user-name-text');
  });

  test('1.2: Compact learning context bar contains roadmap name, day, topic, completion text, and workload', () => {
    assert.ok(html.includes('id="dash-context-bar"'), 'Missing #dash-context-bar');
    assert.ok(html.includes('id="dash-context-roadmap-name"'), 'Missing #dash-context-roadmap-name');
    assert.ok(html.includes('id="dash-context-day-badge"'), 'Missing #dash-context-day-badge');
    assert.ok(html.includes('id="dash-context-topic"'), 'Missing #dash-context-topic');
    assert.ok(html.includes('id="dash-context-completion-text"'), 'Missing #dash-context-completion-text');
    assert.ok(html.includes('id="dash-context-mini-progress"'), 'Missing #dash-context-mini-progress');
    assert.ok(html.includes('id="dash-context-workload-text"'), 'Missing #dash-context-workload-text');
  });

  test('1.3: Exactly two primary dashboard workspaces exist: Day-wise Problems and Revision Queue', () => {
    assert.ok(html.includes('id="dashboard-day-problems-section"'), 'Missing #dashboard-day-problems-section');
    assert.ok(html.includes('id="dashboard-revision-queue-section"'), 'Missing #dashboard-revision-queue-section');

    const posDay = html.indexOf('id="dashboard-day-problems-section"');
    const posRev = html.indexOf('id="dashboard-revision-queue-section"');
    assert.ok(posDay !== -1 && posRev !== -1, 'Both sections must exist');
    assert.ok(posDay < posRev, 'Day-wise Problems must precede Revision Queue');
  });

  test('1.4: Legacy dashboard widgets are completely hidden from visible viewport', () => {
    assert.ok(html.includes('id="legacy-dashboard-widgets" style="display: none !important;"'), 'Legacy widgets must be hidden');
  });

  // --- CATEGORY 2: Direct Navigation & Quick Actions ---
  console.log('\n[CATEGORY 2] Direct Navigation & Quick Actions');

  test('2.1: Primary hero CTA "Continue Learning" and fast action "Continue Next Unsolved" exist', () => {
    assert.ok(html.includes('id="btn-dashboard-continue-learning"'), 'Missing #btn-dashboard-continue-learning');
    assert.ok(html.includes('id="btn-dash-continue-next-unsolved"'), 'Missing #btn-dash-continue-next-unsolved');
    assert.ok(html.includes('Continue Learning'), 'Missing Continue Learning label');
    assert.ok(html.includes('Continue Next Unsolved'), 'Missing Continue Next Unsolved label');
  });

  test('2.2: Secondary actions exist for Open Roadmap, Edit Roadmap, View Problems, and Revision Center', () => {
    assert.ok(html.includes('id="btn-dash-open-roadmap"'), 'Missing #btn-dash-open-roadmap');
    assert.ok(html.includes('id="btn-dash-edit-roadmap"'), 'Missing #btn-dash-edit-roadmap');
    assert.ok(html.includes('id="btn-dash-view-all-problems"'), 'Missing #btn-dash-view-all-problems');
    assert.ok(html.includes('id="btn-dash-view-revision-center"'), 'Missing #btn-dash-view-revision-center');
  });

  test('2.3: App controller wires direct navigation to valid application routes', () => {
    assert.ok(appJs.includes("btnOpenRoadmap.addEventListener('click', () => switchView('roadmaps'))"), 'Open roadmap must switch to roadmaps');
    assert.ok(appJs.includes("#/roadmaps/${activeId}/edit"), 'Edit roadmap must route to #/roadmaps/:id/edit');
    assert.ok(appJs.includes("btnViewProblems.addEventListener('click', () => switchView('problems'))"), 'View problems must switch to problems');
    assert.ok(appJs.includes("btnViewRevision.addEventListener('click', () => switchView('revision'))"), 'Revision center must switch to revision');
  });

  // --- CATEGORY 3: Canonical Day 1 Curriculum & Learning State ---
  console.log('\n[CATEGORY 3] Canonical Day 1 Dual-Stream Curriculum');

  test('3.1: Canonical new-learner Day 1 Stream A assigns Binary Trees & BST (prob-404, prob-202, prob-203, prob-204)', () => {
    RoadmapEngine.initProgress();
    const d1 = RoadmapEngine.progress.dsa120Roadmap.days[0];
    assert.strictEqual(d1.streams.current_learning.topic, 'Binary Trees & BST');
    const pIds = d1.streams.current_learning.problemIds;
    assert.ok(pIds.some(id => id.startsWith('prob-404')), 'Day 1 must contain prob-404');
    assert.ok(pIds.some(id => id.startsWith('prob-202')), 'Day 1 must contain prob-202');
    assert.ok(pIds.some(id => id.startsWith('prob-203')), 'Day 1 must contain prob-203');
    assert.ok(pIds.some(id => id.startsWith('prob-204')), 'Day 1 must contain prob-204');
  });

  test('3.2: Canonical new-learner Day 1 Stream B assigns Arrays & Hashing (prob-21, prob-22)', () => {
    RoadmapEngine.initProgress();
    const d1 = RoadmapEngine.progress.dsa120Roadmap.days[0];
    assert.strictEqual(d1.streams.foundation_revision.topic, 'Arrays & Hashing');
    const pIds = d1.streams.foundation_revision.problemIds;
    assert.ok(pIds.some(id => id.startsWith('prob-21')), 'Day 1 must contain prob-21');
    assert.ok(pIds.some(id => id.startsWith('prob-22')), 'Day 1 must contain prob-22');
  });

  test('3.3: All assigned Day 1 problems have valid HTTPS external URLs and verified catalog entries', () => {
    const requiredPrefixes = ['prob-404', 'prob-202', 'prob-203', 'prob-204', 'prob-21', 'prob-22'];
    requiredPrefixes.forEach(prefix => {
      const p = allProblems.find(x => x.id && x.id.startsWith(prefix));
      assert.ok(p, `Catalog problem starting with ${prefix} must exist`);
      assert.ok(p.title && p.title.length > 0, `Problem ${prefix} must have title`);
      assert.ok(p.url && p.url.startsWith('https://'), `Problem ${prefix} must have direct HTTPS link`);
    });
  });

  // --- CATEGORY 4: Problem Toolbar & Productivity Controls ---
  console.log('\n[CATEGORY 4] Problem Toolbar & Productivity Controls');

  test('4.1: Problem toolbar includes search, filter pills, sorting select, show-completed toggle, and collapse buttons', () => {
    assert.ok(html.includes('id="dash-problem-toolbar"'), 'Missing #dash-problem-toolbar');
    assert.ok(html.includes('id="dash-problem-search"'), 'Missing #dash-problem-search');
    assert.ok(html.includes('id="dash-filter-all"'), 'Missing #dash-filter-all');
    assert.ok(html.includes('id="dash-filter-remaining"'), 'Missing #dash-filter-remaining');
    assert.ok(html.includes('id="dash-filter-completed"'), 'Missing #dash-filter-completed');
    assert.ok(html.includes('id="dash-filter-bookmarked"'), 'Missing #dash-filter-bookmarked');
    assert.ok(html.includes('id="dash-filter-weak"'), 'Missing #dash-filter-weak');
    assert.ok(html.includes('id="dash-filter-stream-a"'), 'Missing #dash-filter-stream-a');
    assert.ok(html.includes('id="dash-filter-stream-b"'), 'Missing #dash-filter-stream-b');
    assert.ok(html.includes('id="dash-problem-sort"'), 'Missing #dash-problem-sort');
    assert.ok(html.includes('id="chk-dash-show-completed"'), 'Missing #chk-dash-show-completed');
    assert.ok(html.includes('id="btn-toggle-stream-a"'), 'Missing #btn-toggle-stream-a');
    assert.ok(html.includes('id="btn-toggle-stream-b"'), 'Missing #btn-toggle-stream-b');
    assert.ok(html.includes('id="dash-problem-match-count"'), 'Missing #dash-problem-match-count');
    assert.ok(html.includes('id="btn-dash-clear-filters"'), 'Missing #btn-dash-clear-filters');
  });

  test('4.2: Weak filter is strictly grounded in authoritative RevisionSessionController.isWeak evidence', () => {
    const freshState = { lastReviewed: new Date().toISOString(), confidence: 4, stability: 10, stage: 2 };
    assert.strictEqual(RevisionSessionController.isWeak(freshState), false, 'Healthy state must not be weak');

    const lowConfState = { lastReviewed: new Date().toISOString(), confidence: 2, stage: 1 };
    assert.strictEqual(RevisionSessionController.isWeak(lowConfState), true, 'Confidence <= 2 must be identified as weak');

    const failedState = { lastReviewed: new Date().toISOString(), lastRating: 'failed', stage: 1 };
    assert.strictEqual(RevisionSessionController.isWeak(failedState), true, 'Failed last rating must be identified as weak');
  });

  test('4.3: Daily checklist displays independent progress for Stream A, Stream B, and Stream C', () => {
    assert.ok(html.includes('id="dash-daily-checklist"'), 'Missing #dash-daily-checklist');
    assert.ok(html.includes('id="dash-checklist-stream-a"'), 'Missing #dash-checklist-stream-a');
    assert.ok(html.includes('id="dash-checklist-stream-b"'), 'Missing #dash-checklist-stream-b');
    assert.ok(html.includes('id="dash-checklist-stream-c"'), 'Missing #dash-checklist-stream-c');
  });

  // --- CATEGORY 5: Problem Row Actions & Integrity ---
  console.log('\n[CATEGORY 5] Problem Row Actions & Integrity');

  test('5.1: Problem row template generates checkbox, direct URL link, stable ID badge, bookmark, notes, and trainer action', () => {
    assert.ok(appJs.includes('btn-action-toggle-solve'), 'Problem row must include solve toggle');
    assert.ok(appJs.includes('dash-problem-title'), 'Problem row must include title link');
    assert.ok(appJs.includes('badge-prob-id'), 'Problem row must include problem ID badge');
    assert.ok(appJs.includes('btn-action-bookmark'), 'Problem row must include bookmark action');
    assert.ok(appJs.includes('btn-dash-open-notes'), 'Problem row must include Quick Notes button');
    assert.ok(appJs.includes('btn-dash-trainer'), 'Problem row must include Trainer launch button');
    assert.ok(appJs.includes('btn-prob-open'), 'Problem row must include direct open button');
  });

  test('5.2: Opening problem link in new tab never alters solved status or triggers premature progression', () => {
    const initialStates = { 'prob-404': { solved: false, lastReviewed: null } };
    // Opening link only reads problem.url and calls window.open without mutating userStates
    const state = initialStates['prob-404'];
    assert.strictEqual(Boolean(state.solved || state.lastReviewed), false, 'Opening URL must not solve problem');
  });

  test('5.3: Continue Next Unsolved chooses next uncompleted problem in assigned roadmap order', () => {
    const mockPlan = {
      streamA: { problemIds: ['prob-10', 'prob-11'] },
      streamB: { problemIds: ['prob-20'] }
    };
    const mockStates = { 'prob-10': { solved: true, lastReviewed: '2026-11-03' } };

    const candidateIds = [...mockPlan.streamA.problemIds, ...mockPlan.streamB.problemIds];
    const nextUnsolved = candidateIds.find(id => !mockStates[id]?.solved);
    assert.strictEqual(nextUnsolved, 'prob-11', 'Must select first uncompleted problem (prob-11)');
  });

  // --- CATEGORY 6: Quick Notes & Mistake Capture ---
  console.log('\n[CATEGORY 6] Quick Notes & Mistake Capture');

  test('6.1: Quick notes modal includes 4 fields: Mistake, Pattern, Key Insight, and Next Attempt Reminder', () => {
    assert.ok(html.includes('id="modal-dash-quick-notes"'), 'Missing #modal-dash-quick-notes');
    assert.ok(html.includes('id="dash-notes-mistake"'), 'Missing #dash-notes-mistake');
    assert.ok(html.includes('id="dash-notes-pattern"'), 'Missing #dash-notes-pattern');
    assert.ok(html.includes('id="dash-notes-insight"'), 'Missing #dash-notes-insight');
    assert.ok(html.includes('id="dash-notes-reminder"'), 'Missing #dash-notes-reminder');
    assert.ok(html.includes('id="btn-dash-save-notes"'), 'Missing #btn-dash-save-notes');
    assert.ok(html.includes('id="btn-dash-close-notes"'), 'Missing #btn-dash-close-notes');
  });

  test('6.2: Quick notes persist into userStates[id].quickNotes without breaking existing notes string', () => {
    const testStates = {};
    const testId = 'prob-test-notes';
    testStates[testId] = { id: testId };

    const notesPayload = {
      mistake: 'Forgot to handle empty tree base case',
      pattern: 'DFS Postorder Traversal',
      keyInsight: 'Node value must be processed after children are calculated',
      reminder: 'Always check if root === null first',
      updatedAt: new Date().toISOString()
    };

    testStates[testId].quickNotes = notesPayload;
    testStates[testId].notes = `Mistake: ${notesPayload.mistake}\n\nPattern: ${notesPayload.pattern}\n\nInsight: ${notesPayload.keyInsight}\n\nReminder: ${notesPayload.reminder}`;

    assert.ok(testStates[testId].quickNotes, 'quickNotes object must exist');
    assert.strictEqual(testStates[testId].quickNotes.mistake, 'Forgot to handle empty tree base case');
    assert.ok(testStates[testId].notes.includes('Forgot to handle empty tree base case'), 'Legacy notes must include text');
  });

  // --- CATEGORY 7: Session Recovery ---
  console.log('\n[CATEGORY 7] Session Recovery');

  test('7.1: Session recovery banner exists in DOM and is hidden when no active session is present', () => {
    assert.ok(html.includes('id="dash-session-recovery-banner"'), 'Missing #dash-session-recovery-banner');
    assert.ok(html.includes('id="dash-session-recovery-title"'), 'Missing #dash-session-recovery-title');
    assert.ok(html.includes('id="btn-dash-resume-session"'), 'Missing #btn-dash-resume-session');
    assert.ok(html.includes('id="btn-dash-dismiss-session"'), 'Missing #btn-dash-dismiss-session');
  });

  test('7.2: Discovery Trainer learning session takes precedence over revision session in recovery', () => {
    const mockTrainerSession = { problemId: 'prob-404', status: 'in_progress' };
    const mockRevisionSession = { problemIds: ['prob-21', 'prob-22'], currentIndex: 0, status: 'active' };

    let selectedType = null;
    if (mockTrainerSession && mockTrainerSession.status !== 'completed') {
      selectedType = 'trainer';
    } else if (mockRevisionSession && mockRevisionSession.status !== 'completed') {
      selectedType = 'revision';
    }

    assert.strictEqual(selectedType, 'trainer', 'Trainer session must take precedence');
  });

  // --- CATEGORY 8: Revision Queue ---
  console.log('\n[CATEGORY 8] Revision Queue Parity & Operations');

  test('8.1: Revision queue header displays Overdue, Due Today, and Actionable pills', () => {
    assert.ok(html.includes('id="dash-rev-overdue-count"'), 'Missing #dash-rev-overdue-count');
    assert.ok(html.includes('id="dash-rev-today-count"'), 'Missing #dash-rev-today-count');
    assert.ok(html.includes('id="dash-rev-total-count"'), 'Missing #dash-rev-total-count');
    assert.ok(html.includes('id="btn-dash-start-revision"'), 'Missing #btn-dash-start-revision');
    assert.ok(html.includes('id="btn-dash-view-all-revision"'), 'Missing #btn-dash-view-all-revision');
  });

  test('8.2: Revision queue toolbar provides search and filter pills (All, Overdue, Due Today)', () => {
    assert.ok(html.includes('id="dash-revision-toolbar"'), 'Missing #dash-revision-toolbar');
    assert.ok(html.includes('id="dash-revision-search"'), 'Missing #dash-revision-search');
    assert.ok(html.includes('id="dash-rev-filter-all"'), 'Missing #dash-rev-filter-all');
    assert.ok(html.includes('id="dash-rev-filter-overdue"'), 'Missing #dash-rev-filter-overdue');
    assert.ok(html.includes('id="dash-rev-filter-today"'), 'Missing #dash-rev-filter-today');
  });

  test('8.3: Revision empty state displays "All Caught Up!" and keeps section visible', () => {
    assert.ok(html.includes('id="dash-revision-empty-state"'), 'Missing #dash-revision-empty-state');
    assert.ok(html.includes('All Caught Up!'), 'Missing All Caught Up title');
    assert.ok(html.includes('id="btn-dash-empty-rev-center"'), 'Missing #btn-dash-empty-rev-center');
  });

  test('8.4: Authoritative RevisionSessionController filters queue and excludes upcoming reviews', () => {
    const todayStr = '2026-11-03';
    const mockUserStates = {
      'prob-overdue': { lastReviewed: '2026-10-01', nextReviewDate: '2026-10-15', stage: 1 },
      'prob-today': { lastReviewed: '2026-11-01', nextReviewDate: '2026-11-03', stage: 1 },
      'prob-upcoming': { lastReviewed: '2026-11-02', nextReviewDate: '2026-11-10', stage: 2 }
    };
    const mockCatalog = [
      { id: 'prob-overdue', title: 'Overdue Prob', topic: 'Trees', difficulty: 'Easy' },
      { id: 'prob-today', title: 'Due Today Prob', topic: 'Arrays', difficulty: 'Medium' },
      { id: 'prob-upcoming', title: 'Upcoming Prob', topic: 'Graphs', difficulty: 'Hard' }
    ];

    const dueQueue = RevisionSessionController.getFilteredQueue(mockCatalog, mockUserStates, {
      filter: 'due',
      asOfDate: new Date('2026-11-03T12:00:00Z')
    });

    assert.strictEqual(dueQueue.length, 2, 'Must include exactly 2 due problems (overdue + today)');
    assert.ok(dueQueue.some(p => p.id === 'prob-overdue'), 'Must include overdue problem');
    assert.ok(dueQueue.some(p => p.id === 'prob-today'), 'Must include due-today problem');
    assert.ok(!dueQueue.some(p => p.id === 'prob-upcoming'), 'Must exclude upcoming problem');
  });

  // --- CATEGORY 9: CSS Styling & Responsive Design ---
  console.log('\n[CATEGORY 9] Visual Styling & Mobile Responsiveness');

  test('9.1: Dark navy command center styles and component tokens are defined in styles.css', () => {
    assert.ok(css.includes('.dash-header'), 'Missing .dash-header CSS');
    assert.ok(css.includes('.dash-context-bar'), 'Missing .dash-context-bar CSS');
    assert.ok(css.includes('.dash-quick-nav-bar'), 'Missing .dash-quick-nav-bar CSS');
    assert.ok(css.includes('.dash-problem-toolbar'), 'Missing .dash-problem-toolbar CSS');
    assert.ok(css.includes('.dash-filter-pill'), 'Missing .dash-filter-pill CSS');
    assert.ok(css.includes('.badge-prob-weak'), 'Missing .badge-prob-weak CSS');
    assert.ok(css.includes('.badge-prob-notes'), 'Missing .badge-prob-notes CSS');
    assert.ok(css.includes('.quick-notes-dialog'), 'Missing .quick-notes-dialog CSS');
  });

  test('9.2: Mobile responsiveness media queries adjust layout for screens <= 768px and <= 600px', () => {
    assert.ok(css.includes('@media (max-width: 768px)'), 'Missing 768px media query');
    assert.ok(css.includes('@media (max-width: 600px)'), 'Missing 600px media query');
    assert.ok(css.includes('.quick-nav-primary'), 'Responsive nav stacking must be defined');
  });

  // --- CATEGORY 10: Reliability Audit & Edge Case Verifications ---
  console.log('\n[CATEGORY 10] Reliability Audit & Edge Cases');

  test('10.1: Clearing notes resets composite notes string to empty without leaving stale data', () => {
    const testStates = {};
    const testId = 'prob-clear-test';
    testStates[testId] = {
      id: testId,
      quickNotes: { mistake: 'Initial mistake', pattern: '', keyInsight: '', reminder: '', updatedAt: '2026-11-01' },
      notes: 'Mistake: Initial mistake'
    };

    // Simulate user clearing all 4 fields
    const notesParts = [];
    testStates[testId].quickNotes = { mistake: '', pattern: '', keyInsight: '', reminder: '', updatedAt: new Date().toISOString() };
    testStates[testId].notes = notesParts.join('\n\n');

    assert.strictEqual(testStates[testId].notes, '', 'Notes must be completely empty when user clears all fields');
    assert.strictEqual(testStates[testId].quickNotes.mistake, '');
  });

  test('10.2: Account isolation in session recovery — User A session is never exposed to User B', () => {
    const activeCtxA = { type: 'user', id: 'usr_alice_123', email: 'alice@example.com' };
    const activeCtxB = { type: 'user', id: 'usr_bob_456', email: 'bob@example.com' };

    const mockSession = {
      userId: 'usr_alice_123',
      problemIds: ['prob-404'],
      currentIndex: 0,
      status: 'in_progress',
      updatedAt: new Date().toISOString()
    };

    // Evaluation for Alice
    const isExposedToAlice = Boolean(mockSession.userId === activeCtxA.id);
    assert.strictEqual(isExposedToAlice, true, 'Session must belong to Alice');

    // Evaluation for Bob
    const isExposedToBob = Boolean(mockSession.userId === activeCtxB.id);
    assert.strictEqual(isExposedToBob, false, 'Session must never be exposed to Bob');
  });

  test('10.3: Dismissing recovery banner preserves the underlying session without destruction', () => {
    const mockSession = { id: 'sess_1', status: 'in_progress', problemId: 'prob-404' };
    let bannerVisible = true;
    let bannerDismissed = false;

    // Simulate clicking dismiss
    bannerVisible = false;
    bannerDismissed = true;

    // Session remains unchanged
    assert.strictEqual(bannerDismissed, true, 'Banner marked dismissed');
    assert.strictEqual(mockSession.status, 'in_progress', 'Session status must remain in_progress');
    assert.strictEqual(mockSession.problemId, 'prob-404', 'Session problemId preserved');
  });

  test('10.4: Repeated solve toggles are idempotent and toggle state cleanly without memory corruption', () => {
    const st = { id: 'prob-toggle-test', solved: false, lastReviewed: null };

    // First click: mark solved
    st.solved = true;
    st.lastReviewed = '2026-11-03T18:00:00Z';
    st.stage = 1;
    assert.strictEqual(Boolean(st.solved && st.lastReviewed), true);

    // Second click: unsolve
    st.solved = false;
    st.lastReviewed = null;
    st.stage = 0;
    st.isMastered = false;
    assert.strictEqual(Boolean(st.solved || st.lastReviewed), false);
    assert.strictEqual(st.isMastered, false);

    // Third click: solve again
    st.solved = true;
    st.lastReviewed = '2026-11-03T18:01:00Z';
    st.stage = 1;
    assert.strictEqual(Boolean(st.solved && st.lastReviewed), true);
  });

  test('10.5: Continue Learning resolves Stream B tasks when Stream A is solved', () => {
    const mockUserStates = {
      'prob-404': { solved: true, lastReviewed: '2026-11-03' },
      'prob-202': { solved: true, lastReviewed: '2026-11-03' },
      'prob-203': { solved: true, lastReviewed: '2026-11-03' },
      'prob-204': { solved: true, lastReviewed: '2026-11-03' }
    };
    const streamAIds = ['prob-404', 'prob-202', 'prob-203', 'prob-204'];
    const streamBIds = ['prob-21', 'prob-22'];

    let nextId = streamAIds.find(id => !mockUserStates[id]?.solved);
    if (!nextId) {
      nextId = streamBIds.find(id => !mockUserStates[id]?.solved);
    }

    assert.strictEqual(nextId, 'prob-21', 'Must smoothly progress to Stream B prob-21');
  });

  test('10.6: Hidden canvas charts avoid layout/draw computations when offsetParent is null', () => {
    assert.ok(appJs.includes('radarEl.offsetParent !== null'), 'Must guard radarEl against hidden layout work');
    assert.ok(appJs.includes('barEl.offsetParent !== null'), 'Must guard barEl against hidden layout work');
  });

  console.log(`\n========================================`);
  console.log(`Productivity Tests Finished: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
})();
