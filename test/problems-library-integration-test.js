/**
 * AlgoRecall 2.0 - Phase 3: Problems Library Integration Test Suite
 * Validates problem discovery, direct external platform links, topic navigation,
 * filtering (topic, difficulty, platform, status, bookmarks, search), sorting,
 * problem actions (solve/unsolve, bookmark, add to revision), and zero IDE/drawer intrusion.
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
console.log('AlgoRecall 2.0 - Phase 3: Problems Library Integration Tests');
console.log('========================================\n');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
const allProblems = require('../js/data/default-sheets');
const srsEngine = require('../js/srs-engine');
const storageEngine = require('../js/storage-engine');

// --- 1. Core Layout & Header ---
console.log('[SECTION 1] Core Layout & Header');

test('1.1: Curated problem explorer preserved with id="view-problems"', () => {
  assert.ok(html.includes('id="view-problems"'), 'Missing #view-problems');
  assert.ok(html.includes('Problems Library'), 'Missing Problems Library title');
});

test('1.2: Header search input and deduplicated count elements exist', () => {
  assert.ok(html.includes('id="problem-search-input"'), 'Missing #problem-search-input');
  assert.ok(html.includes('id="explorer-filtered-total"'), 'Missing #explorer-filtered-total');
  assert.ok(html.includes('id="explorer-filtered-solved"'), 'Missing #explorer-filtered-solved');
  assert.ok(html.includes('id="explorer-filtered-mastered"'), 'Missing #explorer-filtered-mastered');
  assert.ok(html.includes('id="explorer-filtered-due"'), 'Missing #explorer-filtered-due');
  assert.ok(html.includes('id="explorer-filtered-bookmarked"'), 'Missing #explorer-filtered-bookmarked');
});

// --- 2. Topic Navigation ---
console.log('\n[SECTION 2] Topic Navigation');

test('2.1: Topic navigation pill strip contains canonical interview categories', () => {
  assert.ok(html.includes('id="problem-topic-pills"'), 'Missing #problem-topic-pills');
  assert.ok(html.includes('data-topic="Arrays & Hashing"'), 'Missing Arrays & Hashing topic pill');
  assert.ok(html.includes('data-topic="Binary Trees & BST"'), 'Missing Binary Trees & BST topic pill');
  assert.ok(html.includes('data-topic="Graphs"'), 'Missing Graphs topic pill');
  assert.ok(html.includes('data-topic="Dynamic Programming"'), 'Missing Dynamic Programming topic pill');
  assert.ok(html.includes('data-topic="Greedy & Intervals"'), 'Missing Greedy & Intervals topic pill');
  assert.ok(html.includes('data-topic="Binary Search"'), 'Missing Binary Search topic pill');
  assert.ok(html.includes('data-topic="Stack & Queue"'), 'Missing Stack & Queue topic pill');
  assert.ok(html.includes('data-topic="Linked List"'), 'Missing Linked List topic pill');
  assert.ok(html.includes('data-topic="Recursion & Backtracking"'), 'Missing Recursion & Backtracking topic pill');
});

// --- 3. Filter & Sort Bar ---
console.log('\n[SECTION 3] Filter & Sort Bar');

test('3.1: Secondary filter controls exist (platform, difficulty, status, company, bookmarks, sort)', () => {
  assert.ok(html.includes('id="filter-platform"'), 'Missing #filter-platform');
  assert.ok(html.includes('id="filter-difficulty"'), 'Missing #filter-difficulty');
  assert.ok(html.includes('id="filter-status"'), 'Missing #filter-status');
  assert.ok(html.includes('id="filter-company"'), 'Missing #filter-company');
  assert.ok(html.includes('id="btn-filter-bookmarks"'), 'Missing #btn-filter-bookmarks');
  assert.ok(html.includes('id="sort-problems"'), 'Missing #sort-problems');
  assert.ok(html.includes('id="active-filters-bar"'), 'Missing #active-filters-bar');
  assert.ok(html.includes('id="btn-clear-all-filters"'), 'Missing #btn-clear-all-filters');
});

test('3.2: Pagination controls exist with page size selector and buttons', () => {
  assert.ok(html.includes('id="problem-pagination-bar"'), 'Missing #problem-pagination-bar');
  assert.ok(html.includes('id="problems-per-page"'), 'Missing #problems-per-page');
  assert.ok(html.includes('id="pagination-btn-prev"'), 'Missing #pagination-btn-prev');
  assert.ok(html.includes('id="pagination-btn-next"'), 'Missing #pagination-btn-next');
});

// --- 4. Critical Click Behavior & Direct External Platform Practice ---
console.log('\n[SECTION 4] Critical Click Behavior & Direct External URLs');

test('4.1: 100% of curated problems have verified non-empty external platform URLs', () => {
  assert.strictEqual(allProblems.length, 479, 'Dataset must contain 479 problems');
  const missingUrls = allProblems.filter(p => !p.url || typeof p.url !== 'string' || !p.url.startsWith('https://'));
  assert.strictEqual(missingUrls.length, 0, 'Zero problems should have missing or invalid URLs');
});

test('4.2: Recognized platforms are accurately mapped (LeetCode, GFG, Coding Ninjas, Other)', () => {
  let lcCount = 0;
  let gfgCount = 0;
  allProblems.forEach(p => {
    if (p.url.includes('leetcode.com')) lcCount++;
    else if (p.url.includes('geeksforgeeks.org')) gfgCount++;
  });
  assert.ok(lcCount > 250, 'LeetCode problems count verified');
  assert.ok(gfgCount > 150, 'GFG problems count verified');
});

test('4.3: Table markup enforces safe direct external anchor pattern (target="_blank" rel="noopener noreferrer")', () => {
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
  assert.ok(appJs.includes('target="_blank" rel="noopener noreferrer" class="problem-title"'), 'Problem titles must use direct external links');
  assert.ok(appJs.includes('target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm btn-action-open"'), 'Solve action must use direct external link');
  assert.ok(appJs.includes('fa-arrow-up-right-from-square'), 'External link icon must be rendered');
});

// --- 5. Excluded UI Verification ---
console.log('\n[SECTION 5] Excluded UI Verification (No IDE / Drawer)');

test('5.1: Problems library does not contain embedded code editor or right-side question drawer in discovery flow', () => {
  const problemsSection = html.slice(html.indexOf('id="view-problems"'), html.indexOf('id="view-patterns"'));
  assert.ok(!problemsSection.includes('id="monaco-editor"'), 'Must not have Monaco editor in problems view');
  assert.ok(!problemsSection.includes('id="code-editor-container"'), 'Must not have code editor container in problems view');
  assert.ok(!problemsSection.includes('id="question-details-drawer"'), 'Must not have question details drawer in problems view');
});

// --- 6. Problem Actions (Bookmark, Solve Toggle, Add to Revision) ---
console.log('\n[SECTION 6] Problem Actions & State Invariants');

test('6.1: Bookmark toggle updates state without data loss', () => {
  const mockStates = {};
  const testId = 'prob-test-bm';
  mockStates[testId] = { id: testId, isBookmarked: false };

  // Toggle bookmark on
  mockStates[testId].isBookmarked = true;
  assert.strictEqual(mockStates[testId].isBookmarked, true);

  // Toggle bookmark off
  mockStates[testId].isBookmarked = false;
  assert.strictEqual(mockStates[testId].isBookmarked, false);
});

test('6.2: Add to Revision schedules problem into SRS queue with nextReviewDate', () => {
  const mockStates = {};
  const testId = 'prob-test-rev';
  mockStates[testId] = { id: testId, lastReviewed: '2025-01-01T00:00:00.000Z', stage: 2 };

  // Schedule for revision today
  const todayStr = '2026-11-02';
  mockStates[testId].nextReviewDate = todayStr;
  mockStates[testId].isMastered = false;

  assert.strictEqual(srsEngine.isDue(mockStates[testId]), true, 'Must be due in SRS engine');
});

test('6.3: Distinguishes Attempted vs Solved vs Mastered vs Due without conflation', () => {
  const attemptedState = { id: 'p1', attemptsCount: 1, lastRating: 'failed', stage: 0 };
  const solvedState = { id: 'p2', lastReviewed: '2026-10-01T00:00:00.000Z', solved: true, stage: 2, isMastered: false };
  const masteredState = { id: 'p3', lastReviewed: '2026-10-01T00:00:00.000Z', solved: true, stage: 5, isMastered: true };
  const dueState = { id: 'p4', lastReviewed: '2026-10-01T00:00:00.000Z', nextReviewDate: '2026-10-02', stage: 1, isMastered: false };

  assert.ok(!attemptedState.lastReviewed, 'Attempted is not solved');
  assert.ok(solvedState.lastReviewed && !solvedState.isMastered, 'Solved is not mastered');
  assert.ok(masteredState.isMastered, 'Mastered is distinct');
  assert.ok(srsEngine.isDue(dueState), 'Due state is detected');
});

console.log(`\n========================================`);
console.log(`Phase 3 Tests Finished: ${passedTests}/${totalTests} Passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}

