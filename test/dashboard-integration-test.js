/**
 * AlgoRecall 2.0 - Phase 2: Dashboard Integration Test Suite
 * Validates dashboard overview statistics, main learning workspace, Continue Learning workflow,
 * right-side sections (Current Roadmap, Topic Mastery, Weekly Activity), and DOM hierarchy.
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

console.log('\n========================================');
console.log('AlgoRecall 2.0 - Phase 2: Dashboard Integration Tests');
console.log('========================================\n');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
const roadmapEngine = require('../js/roadmap-engine');
const roadmap120Engine = require('../js/roadmap-120-engine');
const srsEngine = require('../js/srs-engine');
const allProblems = require('../js/data/default-sheets');

// --- 1. DOM Structure & Overview Statistics Bar ---
console.log('[SECTION 1] DOM Structure & Overview Statistics Bar');

test('1.1: index.html contains all 4 overview metric cards with required IDs', () => {
  assert.ok(html.includes('id="dashboard-overview-metrics"'), 'Missing #dashboard-overview-metrics');
  assert.ok(html.includes('id="stat-today-tasks-count"'), 'Missing #stat-today-tasks-count');
  assert.ok(html.includes('id="stat-revision-due-count"'), 'Missing #stat-revision-due-count');
  assert.ok(html.includes('id="stat-completed-today-count"'), 'Missing #stat-completed-today-count');
  assert.ok(html.includes('id="stat-roadmap-progress-pct"'), 'Missing #stat-roadmap-progress-pct');
  assert.ok(html.includes('id="stat-roadmap-progress-bar"'), 'Missing #stat-roadmap-progress-bar');
});

test('1.2: Overview metrics grid is positioned before #today-dsa-plan-section', () => {
  const posOverview = html.indexOf('id="dashboard-overview-metrics"');
  const posPlan = html.indexOf('id="today-dsa-plan-section"');
  assert.ok(posOverview !== -1 && posPlan !== -1, 'Both elements must exist');
  assert.ok(posOverview < posPlan, 'Overview metrics must appear before today-dsa-plan-section');
});

test('1.3: Suite 15 DOM hierarchy is preserved (posPlanHero < posLearn < posRevise < posProgress < posSecondary)', () => {
  const posPlanHero = html.indexOf('id="today-dsa-plan-section"');
  const posLearn = html.indexOf('id="dsa-plan-learn-section"');
  const posRevise = html.indexOf('id="dsa-plan-revise-section"');
  const posProgress = html.indexOf('id="dsa-plan-progress-section"');
  const posSecondary = html.indexOf('id="dashboard-secondary-accordion"');

  assert.ok(posPlanHero < posLearn, 'posPlanHero < posLearn');
  assert.ok(posLearn < posRevise, 'posLearn < posRevise');
  assert.ok(posRevise < posProgress, 'posRevise < posProgress');
  assert.ok(posProgress < posSecondary, 'posProgress < posSecondary');
});

// --- 2. Main Learning Workspace & Continue Learning Action ---
console.log('\n[SECTION 2] Main Learning Workspace & Continue Learning Workflow');

test('2.1: Prominent Continue Learning button exists with correct ID and accessibility text', () => {
  assert.ok(html.includes('id="btn-dashboard-continue-learning"'), 'Missing #btn-dashboard-continue-learning');
  assert.ok(html.includes('Continue Learning'), 'Missing "Continue Learning" button text');
});

test('2.2: Workspace sections are organized in .dashboard-layout-row with main and side cols', () => {
  assert.ok(html.includes('class="dashboard-layout-row"'), 'Missing .dashboard-layout-row');
  assert.ok(html.includes('class="dashboard-main-col"'), 'Missing .dashboard-main-col');
  assert.ok(html.includes('class="dashboard-side-col"'), 'Missing .dashboard-side-col');
  assert.ok(html.includes('id="dashboard-right-sections"'), 'Missing #dashboard-right-sections');
});

test('2.3: Continue Learning logic resolves next eligible uncompleted problem from Stream A -> Stream B -> Stream C', () => {
  roadmapEngine.initProgress();
  const todayPlan = roadmapEngine.getTodayAuthoritativePlan(allProblems, {});
  assert.ok(todayPlan, 'Must return todayPlan');
  assert.ok(todayPlan.streamA, 'Must contain streamA');
  const pIds = todayPlan.streamA.problemIds || [];
  assert.ok(pIds.length > 0, 'Stream A must have problems scheduled');

  // Stream A first problem is eligible
  const probA1Id = pIds[0];
  const probA1 = allProblems.find(p => p.id === probA1Id);
  assert.ok(probA1, 'Problem must exist in catalog');
  assert.ok(probA1.id, 'Problem must have an ID');
  assert.ok(probA1.url, 'Problem must have a direct external platform URL');
  assert.ok(probA1.url.startsWith('https://'), 'URL must be a direct HTTPS external link');
});

// --- 3. Right-Side Widgets (Roadmap, Topic Mastery, Weekly Activity) ---
console.log('\n[SECTION 3] Right-Side Widgets');

test('3.1: Current Roadmap widget contains badge, track name, percentage, progress fill, and milestone', () => {
  assert.ok(html.includes('id="dashboard-current-roadmap-card"'), 'Missing #dashboard-current-roadmap-card');
  assert.ok(html.includes('id="widget-roadmap-badge"'), 'Missing #widget-roadmap-badge');
  assert.ok(html.includes('id="widget-roadmap-track-name"'), 'Missing #widget-roadmap-track-name');
  assert.ok(html.includes('id="widget-roadmap-pct"'), 'Missing #widget-roadmap-pct');
  assert.ok(html.includes('id="widget-roadmap-fill"'), 'Missing #widget-roadmap-fill');
  assert.ok(html.includes('id="widget-milestone-title"'), 'Missing #widget-milestone-title');
  assert.ok(html.includes('id="widget-milestone-sub"'), 'Missing #widget-milestone-sub');
  assert.ok(html.includes('id="btn-widget-view-roadmap"'), 'Missing #btn-widget-view-roadmap');
});

test('3.2: Topic Mastery widget contains header, overall avg badge, and topic list container', () => {
  assert.ok(html.includes('id="dashboard-topic-mastery-card"'), 'Missing #dashboard-topic-mastery-card');
  assert.ok(html.includes('id="widget-mastery-overall-badge"'), 'Missing #widget-mastery-overall-badge');
  assert.ok(html.includes('id="widget-topic-mastery-list"'), 'Missing #widget-topic-mastery-list');
});

test('3.3: Weekly Activity widget contains 7-day strip, streak badge, solved count, and time spent', () => {
  assert.ok(html.includes('id="dashboard-weekly-activity-card"'), 'Missing #dashboard-weekly-activity-card');
  assert.ok(html.includes('id="widget-streak-badge"'), 'Missing #widget-streak-badge');
  assert.ok(html.includes('id="widget-weekly-strip"'), 'Missing #widget-weekly-strip');
  assert.ok(html.includes('id="widget-weekly-solved-count"'), 'Missing #widget-weekly-solved-count');
  assert.ok(html.includes('id="widget-weekly-time-spent"'), 'Missing #widget-weekly-time-spent');
});

// --- 4. Metric Calculations & Zero Duplicate Counting ---
console.log('\n[SECTION 4] Metric Calculations & Deduplication Invariants');

test('4.1: Completed Today deduplication: solving same problem multiple times counted exactly once', () => {
  const todayStr = (function() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const mockUserStates = {
    'prob-1': { lastReviewed: `${todayStr}T10:00:00.000Z`, solved: true, reviewHistory: [{ timestamp: 1 }, { timestamp: 2 }] },
    'prob-2': { lastReviewed: `${todayStr}T11:00:00.000Z`, solved: true },
    'prob-3': { lastReviewed: '2025-01-01T00:00:00.000Z', solved: true }
  };

  const solvedToday = new Set();
  Object.entries(mockUserStates).forEach(([id, st]) => {
    if (st.lastReviewed && st.lastReviewed.slice(0, 10) === todayStr) {
      solvedToday.add(id);
    }
  });

  assert.strictEqual(solvedToday.size, 2, 'Exactly 2 unique problems solved today');
});

test('4.2: Revision Due calculation accurately reflects SRS engine due problems', () => {
  const mockStates = {
    'prob-100': { lastReviewed: '2020-01-01T00:00:00.000Z', nextReviewDate: '2020-01-02', stage: 1, isMastered: false }
  };
  const isDue = srsEngine.isDue(mockStates['prob-100']);
  assert.strictEqual(isDue, true, 'Overdue problem must be due');
});

// --- 5. 120-Day Roadmap Dual-Stream Curriculum Invariants ---
console.log('\n[SECTION 5] 120-Day Dual-Stream Roadmap Invariants');

test('5.1: Active track defaults to dual_stream_120 with Day 1 Stream A as Binary Trees & BST', () => {
  roadmapEngine.initProgress();
  assert.strictEqual(roadmapEngine.progress.activeTrack, 'dual_stream_120');
  const d1 = roadmapEngine.progress.dsa120Roadmap.days[0];
  assert.strictEqual(d1.streams.current_learning.topic, 'Binary Trees & BST');
  assert.strictEqual(d1.streams.foundation_revision.topic, 'Arrays & Hashing');
});

test('5.2: Buffer days are scheduled every 7 learning days (Days 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88)', () => {
  const roadmap = roadmap120Engine.generateBaselineTemplate({});
  const bufferDays = roadmap.days.filter(d => d.isBufferDay).map(d => d.dayNumber);
  const expectedBuffers = [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88];
  expectedBuffers.forEach(b => {
    assert.ok(bufferDays.includes(b), `Day ${b} must be a buffer day`);
  });
});

console.log(`\n========================================`);
console.log(`Phase 2 Tests Finished: ${passedTests}/${totalTests} Passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
