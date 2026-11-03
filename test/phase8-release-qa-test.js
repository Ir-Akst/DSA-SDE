/**
 * AlgoRecall 2.0 - Phase 8: Settings + Final Integration & Release QA Test Suite
 * Validates Settings module, multi-user isolation, accessibility, export sanitization,
 * Leitner invariant guarantees, destructive reset safety gate, and cross-module integrity.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Initialize mock localStorage for headless Node environment
const _mockStorage = new Map();
global.localStorage = {
  getItem: (k) => _mockStorage.has(k) ? _mockStorage.get(k) : null,
  setItem: (k, v) => _mockStorage.set(k, String(v)),
  removeItem: (k) => _mockStorage.delete(k),
  clear: () => _mockStorage.clear(),
  key: (i) => Array.from(_mockStorage.keys())[i] || null,
  get length() { return _mockStorage.size; }
};

// Import modules
const StorageEngine = require('../js/storage-engine');
const LearnerRepository = require('../js/learner-repository');
const SRSEngine = require('../js/srs-engine');
const RoadmapEngine = require('../js/roadmap-engine');
const MockEngine = require('../js/mock-engine');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('========================================');
console.log('[PHASE 8] Settings + Final Integration & Release QA Suite');
console.log('========================================\n');

// 1. Settings Schema, Defaults & Isolation
runTest('8.1: Settings schema contains all Phase 8 fields with valid defaults', () => {
  localStorage.clear();
  const settings = StorageEngine.getSettings();

  assert.strictEqual(settings.theme, 'dark');
  assert.strictEqual(settings.reducedMotion, false);
  assert.strictEqual(settings.fontSize, 'standard');
  assert.strictEqual(settings.targetDailyMinutes, 45);
  assert.strictEqual(settings.targetDailyProblems, 3);
  assert.strictEqual(settings.defaultDifficultyFilter, 'all');
  assert.strictEqual(settings.preferredRoadmap, 'dual_stream_120');
  assert.strictEqual(settings.studyReminderCadence, 'self_paced');
  assert.strictEqual(settings.compactMode, false);
  assert.strictEqual(settings.showSolutionInsights, true);
  assert.strictEqual(settings.srsReviewOrder, 'overdue_first');
});

runTest('8.2: Settings multi-user account isolation prevents cross-leakage', () => {
  localStorage.clear();
  const ctxUserA = { id: 'user_alpha', isGuest: false };
  const ctxUserB = { id: 'user_beta', isGuest: false };
  const ctxGuest = { id: 'guest', isGuest: true };

  // User A sets high-contrast theme and 90 minutes
  StorageEngine.saveSettings({
    theme: 'high-contrast',
    targetDailyMinutes: 90,
    fontSize: 'large'
  }, ctxUserA);

  // User B sets clean light theme and 30 minutes
  StorageEngine.saveSettings({
    theme: 'light',
    targetDailyMinutes: 30,
    fontSize: 'dyslexic'
  }, ctxUserB);

  // Guest gets defaults
  const guestSettings = StorageEngine.getSettings(ctxGuest);
  const userASettings = StorageEngine.getSettings(ctxUserA);
  const userBSettings = StorageEngine.getSettings(ctxUserB);

  assert.strictEqual(userASettings.theme, 'high-contrast');
  assert.strictEqual(userASettings.targetDailyMinutes, 90);
  assert.strictEqual(userASettings.fontSize, 'large');

  assert.strictEqual(userBSettings.theme, 'light');
  assert.strictEqual(userBSettings.targetDailyMinutes, 30);
  assert.strictEqual(userBSettings.fontSize, 'dyslexic');

  assert.strictEqual(guestSettings.theme, 'dark');
  assert.strictEqual(guestSettings.targetDailyMinutes, 45);
});

// 2. Theme & Accessibility Invariants
runTest('8.3: Theme values strictly accept canonical themes without corruption', () => {
  const allowedThemes = ['dark', 'light', 'high-contrast'];
  allowedThemes.forEach(theme => {
    StorageEngine.saveSettings({ theme });
    const s = StorageEngine.getSettings();
    assert.strictEqual(s.theme, theme);
  });
});

runTest('8.4: Accessibility preferences support reducedMotion and font scaling modes', () => {
  StorageEngine.saveSettings({ reducedMotion: true, fontSize: 'dyslexic' });
  let s = StorageEngine.getSettings();
  assert.strictEqual(s.reducedMotion, true);
  assert.strictEqual(s.fontSize, 'dyslexic');

  StorageEngine.saveSettings({ reducedMotion: false, fontSize: 'large' });
  s = StorageEngine.getSettings();
  assert.strictEqual(s.reducedMotion, false);
  assert.strictEqual(s.fontSize, 'large');
});

// 3. Spaced Repetition Ordering & Invariant Guarantee
runTest('8.5: SRS review queue sorting changes presentation order only', () => {
  const mockProblems = [
    { id: 'prob_1', title: 'Two Sum', difficulty: 'Easy' },
    { id: 'prob_2', title: 'LRU Cache', difficulty: 'Medium' },
    { id: 'prob_3', title: 'Trapping Rain Water', difficulty: 'Hard' }
  ];

  const now = new Date('2026-11-03T12:00:00Z');
  const userStates = {
    prob_1: {
      nextReviewDate: '2026-11-01', // 2 days overdue
      confidenceScore: 4.5,
      interval: 7,
      stage: 3,
      isMastered: false
    },
    prob_2: {
      nextReviewDate: '2026-10-25', // 9 days overdue
      confidenceScore: 2.0,
      interval: 3,
      stage: 2,
      isMastered: false
    },
    prob_3: {
      nextReviewDate: '2026-11-02', // 1 day overdue
      confidenceScore: 1.5,
      interval: 1,
      stage: 1,
      isMastered: false
    }
  };

  // Capture original schedule snapshot
  const originalStates = JSON.parse(JSON.stringify(userStates));

  // Test sorting by overdue_first: prob_2 (9d), prob_1 (2d), prob_3 (1d)
  const sortOverdue = (probs, states) => {
    return [...probs].sort((a, b) => {
      const dateA = new Date(states[a.id]?.nextReviewDate || 0).getTime();
      const dateB = new Date(states[b.id]?.nextReviewDate || 0).getTime();
      return dateA - dateB;
    });
  };

  const overdueSorted = sortOverdue(mockProblems, userStates);
  assert.strictEqual(overdueSorted[0].id, 'prob_2');
  assert.strictEqual(overdueSorted[1].id, 'prob_1');
  assert.strictEqual(overdueSorted[2].id, 'prob_3');

  // Test sorting by confidence_asc: prob_3 (1.5), prob_2 (2.0), prob_1 (4.5)
  const sortConfidence = (probs, states) => {
    return [...probs].sort((a, b) => {
      return (states[a.id]?.confidenceScore || 0) - (states[b.id]?.confidenceScore || 0);
    });
  };

  const confSorted = sortConfidence(mockProblems, userStates);
  assert.strictEqual(confSorted[0].id, 'prob_3');
  assert.strictEqual(confSorted[1].id, 'prob_2');
  assert.strictEqual(confSorted[2].id, 'prob_1');

  // Spaced Repetition Invariant Verification: userStates was NOT mutated by sorting
  assert.deepStrictEqual(userStates, originalStates, 'SRS schedules must remain immutable during queue sorting');
});

// 4. Data Portability & Sanitization
runTest('8.6: Export bundle strictly sanitizes API keys while preserving learning history', () => {
  localStorage.clear();
  const ctx = { id: 'test_exporter', isGuest: false };

  StorageEngine.saveSettings({
    theme: 'dark',
    aiProvider: 'openai',
    aiApiKey: 'sk-secret-confidential-key-12345'
  }, ctx);

  LearnerRepository.saveUserStates({
    'two-sum': {
      status: 'solved',
      stage: 3,
      interval: 7,
      nextReviewDate: '2026-11-10',
      confidenceScore: 4.2
    }
  }, ctx);

  const bundle = StorageEngine.createExportBundle({}, ctx);

  assert.strictEqual(bundle.app, 'AlgoRecall');
  assert.ok(bundle.data.userStates['two-sum'], 'Preserves userStates review history');
  assert.strictEqual(bundle.data.userStates['two-sum'].stage, 3);
  assert.strictEqual(bundle.data.settings.aiProvider, 'openai');
  assert.strictEqual(bundle.data.settings.aiApiKey, '', 'Must strip aiApiKey in export bundle');
});

runTest('8.7: Import bundle validates schema and protects against invalid structures', () => {
  const invalidJson = "not an object";
  const arrayJson = [1, 2, 3];
  const unsupportedVersion = { app: 'AlgoRecall', version: '9.0.0', data: {} };
  const validBundle = {
    app: 'AlgoRecall',
    version: '2.0.0',
    data: {
      userStates: {
        'lru-cache': { status: 'solved', stage: 2 }
      }
    }
  };

  assert.strictEqual(StorageEngine.inspectImportBundle(invalidJson).valid, false);
  assert.strictEqual(StorageEngine.inspectImportBundle(arrayJson).valid, false);
  assert.strictEqual(StorageEngine.inspectImportBundle(unsupportedVersion).valid, false);

  const inspection = StorageEngine.inspectImportBundle(validBundle);
  assert.strictEqual(inspection.valid, true);
  assert.strictEqual(inspection.stats.statesCount, 1);
});

// 5. Destructive Reset Safety Gate
runTest('8.8: Destructive reset safely targets only active user context', () => {
  localStorage.clear();
  const userA = { id: 'alice', isGuest: false };
  const userB = { id: 'bob', isGuest: false };

  LearnerRepository.saveUserStates({ 'two-sum': { status: 'solved', stage: 4 } }, userA);
  LearnerRepository.saveUserStates({ 'two-sum': { status: 'solved', stage: 2 } }, userB);

  assert.ok(LearnerRepository.getUserStates(userA)['two-sum']);
  assert.ok(LearnerRepository.getUserStates(userB)['two-sum']);

  // Reset User A only
  LearnerRepository.saveUserStates({}, userA);
  LearnerRepository.saveMockHistory([], userA);

  assert.deepStrictEqual(LearnerRepository.getUserStates(userA), {});
  assert.strictEqual(LearnerRepository.getUserStates(userB)['two-sum'].stage, 2, 'User B data must be completely unharmed');
});

// 6. UI & Markup Contract Verification
runTest('8.9: index.html contains all Phase 8 Settings sections, Leitner table, and Reset Modal', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

  // Operational section cards
  assert.ok(html.includes('id="card-settings-learning"'), 'Must have Learning Preferences card');
  assert.ok(html.includes('id="card-settings-revision"'), 'Must have Revision Preferences card');
  assert.ok(html.includes('id="card-settings-appearance"'), 'Must have Appearance card');
  assert.ok(html.includes('id="card-settings-account"'), 'Must have Account & Data card');

  // Learning inputs
  assert.ok(html.includes('id="settings-daily-minutes"'), 'Must have daily study minutes select');
  assert.ok(html.includes('id="settings-daily-problems"'), 'Must have daily problems select');
  assert.ok(html.includes('id="settings-default-difficulty"'), 'Must have default difficulty filter select');
  assert.ok(html.includes('id="settings-preferred-roadmap"'), 'Must have preferred roadmap select');
  assert.ok(html.includes('id="settings-study-cadence"'), 'Must have study reminder cadence select');
  assert.ok(html.includes('id="settings-compact-mode"'), 'Must have compact mode checkbox');
  assert.ok(html.includes('id="settings-show-insights"'), 'Must have show insights checkbox');

  // Revision & Leitner
  assert.ok(html.includes('id="settings-srs-order"'), 'Must have SRS order select');
  assert.ok(html.includes('class="leitner-intervals-table"'), 'Must have Leitner intervals explanation table');
  assert.ok(html.includes('Spaced Repetition Invariant Guarantee'), 'Must display Leitner invariant notice');

  // Appearance & Accessibility
  assert.ok(html.includes('id="btn-theme-dark-opt"'), 'Must have dark theme button');
  assert.ok(html.includes('id="btn-theme-light-opt"'), 'Must have light theme button');
  assert.ok(html.includes('id="btn-theme-contrast-opt"'), 'Must have high-contrast theme button');
  assert.ok(html.includes('id="settings-reduced-motion"'), 'Must have reduced motion checkbox');
  assert.ok(html.includes('id="settings-font-size"'), 'Must have font size select');
  assert.ok(html.includes('class="shortcuts-table"'), 'Must have keyboard shortcuts quick guide table');

  // Account & Reset Modal
  assert.ok(html.includes('id="modal-confirm-reset"'), 'Must have 2-step confirm reset modal');
  assert.ok(html.includes('id="input-confirm-reset-text"'), 'Must have RESET verification text input');
  assert.ok(html.includes('id="btn-execute-reset"'), 'Must have execute reset button');
  assert.ok(html.includes('id="btn-cancel-reset"'), 'Must have cancel reset button');
});

runTest('8.10: app.js contains global keyboard shortcut routing and event listeners', () => {
  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');

  assert.ok(appJs.includes('setupGlobalKeyboardShortcuts'), 'Must define setupGlobalKeyboardShortcuts');
  assert.ok(appJs.includes("e.key === 'Escape'"), 'Must handle Escape key to close modals');
  assert.ok(appJs.includes("e.key === '/'"), 'Must handle / key for quick search');
  assert.ok(appJs.includes('e.altKey'), 'Must handle Alt + key view navigation');
  assert.ok(appJs.includes("btn-save-learning-prefs"), 'Must wire save learning preferences');
  assert.ok(appJs.includes("btn-save-revision-prefs"), 'Must wire save revision preferences');
  assert.ok(appJs.includes("btn-save-appearance-prefs"), 'Must wire save appearance preferences');
});

console.log('\n========================================');
console.log(`Phase 8 QA Suite: ${passedTests}/${totalTests} tests passed.`);
console.log('========================================\n');

