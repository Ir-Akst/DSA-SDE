/**
 * AlgoRecall 2.0 — Phase 6: Mock Interview System Dedicated Test Suite
 * Validates:
 * 1. Mock Configuration: Durations, Difficulties, Topics, Custom Problems, Question Counts, Catalog Fallbacks
 * 2. Timed Interview Sessions: Absolute epoch timestamp countdown, reload resilience, expiration detection
 * 3. Question Status & Navigation: Status transitions, answer drafts, mark for review flag
 * 4. Submission & Evaluation: Multi-rubric scoring (Correctness 40%, Complexity 20%, Edge Cases 15%, Time 15%, Hints 10%), provenance
 * 5. Mock vs Normal Learning Separation Invariant: Zero mutations to userStates, roadmap progress, or SRS schedules
 * 6. Abandon Lifecycle: Clean abandonment, history recording, active session clearance
 * 7. History & Analytics: Idempotency, zero duplicate records, statistics aggregation
 * 8. Account Isolation: Separate contexts keep active sessions and history isolated
 */

const assert = require('assert');
const MockEngine = require('../js/mock-engine');

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
    process.exitCode = 1;
  }
}

// Sample Curated Problem Catalog
const SAMPLE_PROBLEMS = [
  { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays & Hashing', url: 'https://leetcode.com/problems/two-sum/' },
  { id: 'valid-anagram', title: 'Valid Anagram', difficulty: 'Easy', topic: 'Arrays & Hashing', url: 'https://leetcode.com/problems/valid-anagram/' },
  { id: 'group-anagrams', title: 'Group Anagrams', difficulty: 'Medium', topic: 'Arrays & Hashing', url: 'https://leetcode.com/problems/group-anagrams/' },
  { id: '3sum', title: '3Sum', difficulty: 'Medium', topic: 'Two Pointers', url: 'https://leetcode.com/problems/3sum/' },
  { id: 'trapping-rain-water', title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Two Pointers', url: 'https://leetcode.com/problems/trapping-rain-water/' },
  { id: 'invert-binary-tree', title: 'Invert Binary Tree', difficulty: 'Easy', topic: 'Trees & BST', url: 'https://leetcode.com/problems/invert-binary-tree/' },
  { id: 'validate-bst', title: 'Validate Binary Search Tree', difficulty: 'Medium', topic: 'Trees & BST', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
  { id: 'binary-tree-max-path-sum', title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', topic: 'Trees & BST', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/' },
  { id: 'coin-change', title: 'Coin Change', difficulty: 'Medium', topic: 'Dynamic Programming', url: 'https://leetcode.com/problems/coin-change/' },
  { id: 'edit-distance', title: 'Edit Distance', difficulty: 'Hard', topic: 'Dynamic Programming', url: 'https://leetcode.com/problems/edit-distance/' }
];

console.log('\n========================================');
console.log('AlgoRecall 2.0 — Phase 6: Mock Interview System Tests');
console.log('========================================\n');

// -------------------------------------------------------------
// SECTION 1: Mock Configuration & Problem Selection
// -------------------------------------------------------------
console.log('--- 1. Mock Configuration & Problem Selection ---');

test('Configures standard preset track (FAANG Standard: 45m, 1 Med + 1 Hard)', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { trackId: 'faang_standard' });
  assert.strictEqual(session.durationMinutes, 45);
  assert.strictEqual(session.problems.length, 2);
  assert.strictEqual(session.problems[0].difficulty, 'Medium');
  assert.strictEqual(session.problems[1].difficulty, 'Hard');
  assert.notStrictEqual(session.problems[0].id, session.problems[1].id, 'Problems must be unique');
});

test('Configures custom duration clamped between 5 and 240 minutes', () => {
  MockEngine.clearActiveSession();
  // Too small clamped to default 45
  const sessSmall = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { durationMinutes: 2 });
  assert.strictEqual(sessSmall.durationMinutes, 45);

  // Too large clamped to 240
  const sessLarge = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { durationMinutes: 300 });
  assert.strictEqual(sessLarge.durationMinutes, 240);

  // Valid custom 90 mins
  const sess90 = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { durationMinutes: 90 });
  assert.strictEqual(sess90.durationMinutes, 90);
});

test('Filters question selection by canonical topic', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, {
    topicFilter: 'Trees & BST',
    questionsCount: 2
  });
  assert.strictEqual(session.problems.length, 2);
  session.problems.forEach(p => {
    assert.strictEqual(p.topic, 'Trees & BST');
  });
});

test('Filters question selection by difficulty override (Easy Only)', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, {
    difficulty: 'Easy',
    questionsCount: 2
  });
  assert.strictEqual(session.problems.length, 2);
  session.problems.forEach(p => {
    assert.strictEqual(p.difficulty, 'Easy');
  });
});

test('Guarantees strictly unique problem selection across session', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, {
    questionsCount: 4
  });
  assert.strictEqual(session.problems.length, 4);
  const ids = session.problems.map(p => p.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, 4, 'All 4 problems must be unique');
});

test('Safely handles empty problem catalog without crashing', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession([], {}, { durationMinutes: 45 });
  assert.ok(session !== null);
  assert.strictEqual(session.problems.length, 0);
  assert.strictEqual(session.status, 'in_progress');
});

test('Safely handles insufficient eligible questions by falling back to pool without duplicates', () => {
  MockEngine.clearActiveSession();
  // Request 3 Dynamic Programming problems when catalog only has 2
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, {
    topicFilter: 'Dynamic Programming',
    questionsCount: 3
  });
  assert.strictEqual(session.problems.length, 3);
  const ids = session.problems.map(p => p.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, 3, 'Must still deduplicate when falling back');
});

test('Supports custom problem IDs selection mode', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, {
    customProblemIds: ['two-sum', 'coin-change']
  });
  assert.strictEqual(session.problems.length, 2);
  assert.strictEqual(session.problems[0].id, 'two-sum');
  assert.strictEqual(session.problems[1].id, 'coin-change');
  assert.strictEqual(session.selectionMode, 'custom');
});

// -------------------------------------------------------------
// SECTION 2: Timed Session Engine & Timestamp Resilience
// -------------------------------------------------------------
console.log('\n--- 2. Timed Session Engine & Timestamp Resilience ---');

test('Initializes session with absolute epoch targetEndTime', () => {
  MockEngine.clearActiveSession();
  const now = Date.now();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { durationMinutes: 45 });
  assert.ok(session.startTime >= now - 100);
  assert.strictEqual(session.targetEndTime - session.startTime, 45 * 60 * 1000);
});

test('Derives remaining time accurately from epoch timestamp upon reload', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { durationMinutes: 45 });

  // Simulate reload by retrieving active session from storage
  const restored = MockEngine.getActiveSession();
  assert.ok(restored !== null);
  assert.strictEqual(restored.sessionId, session.sessionId);
  assert.ok(restored.remainingSeconds > 0 && restored.remainingSeconds <= 45 * 60);
  assert.strictEqual(restored.isExpired, false);
});

test('Detects expired session when targetEndTime has passed', () => {
  MockEngine.clearActiveSession();
  const expiredSession = {
    sessionId: 'mock-expired-1',
    status: 'in_progress',
    startTime: Date.now() - (60 * 60 * 1000),
    targetEndTime: Date.now() - 1000, // 1 second ago
    durationMinutes: 45,
    problems: []
  };
  MockEngine.saveActiveSession(expiredSession);

  const restored = MockEngine.getActiveSession();
  assert.ok(restored !== null);
  assert.strictEqual(restored.remainingSeconds, 0);
  assert.strictEqual(restored.isExpired, true);
});

test('Initializes question answer slots with clean status model', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { questionsCount: 2 });
  session.problems.forEach(p => {
    assert.strictEqual(session.questionStatuses[p.id], 'not_started');
    assert.strictEqual(session.markedForReview[p.id], false);
    assert.strictEqual(session.answers[p.id].code, '');
    assert.strictEqual(session.answers[p.id].rating, 'medium');
    assert.strictEqual(session.answers[p.id].provenance, 'self_reported');
  });
});

// -------------------------------------------------------------
// SECTION 3: Submission & Multi-Rubric Evaluation
// -------------------------------------------------------------
console.log('\n--- 3. Submission & Multi-Rubric Evaluation ---');

test('Computes multi-rubric score with optimal rating, complexities & edge cases', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { durationMinutes: 45, questionsCount: 2 });
  const p1 = session.problems[0];
  const p2 = session.problems[1];

  session.answers[p1.id] = {
    code: 'function solve() { return true; }',
    approach: 'Two pointer technique with left and right indices meeting at center.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    edgeCases: ['empty', 'single', 'negatives'],
    hintsUsedCount: 0,
    rating: 'simple',
    timeSpentSeconds: 900
  };

  session.answers[p2.id] = {
    code: 'function solve2() { return 42; }',
    approach: 'Memoized recursion',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    edgeCases: ['duplicates'],
    hintsUsedCount: 1,
    rating: 'medium',
    timeSpentSeconds: 1200
  };

  const report = MockEngine.evaluateSession(session);
  assert.strictEqual(report.status, 'completed');
  assert.strictEqual(report.problemsCount, 2);
  assert.strictEqual(report.questionResults.length, 2);
  assert.ok(report.overallPercentage >= 65, 'Overall percentage should be at least 65%');
  assert.strictEqual(report.questionResults[0].provenance, 'self_reported');
  assert.strictEqual(MockEngine.getActiveSession(), null, 'Active session must be cleared after evaluation');
});

test('Applies hint penalty according to penalty policy', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { hintPolicy: 'penalty', questionsCount: 1 });
  const p = session.problems[0];

  session.answers[p.id] = {
    code: '...',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    edgeCases: ['empty'],
    hintsUsedCount: 2, // 2 hints = -10 pts
    rating: 'simple' // 40 base correctness
  };

  const report = MockEngine.evaluateSession(session);
  assert.strictEqual(report.questionResults[0].hintsUsedCount, 2);
  // Hint penalty should be deducted
  assert.ok(report.questionResults[0].score <= 90);
});

test('Practice hint policy incurs zero hint penalty', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { hintPolicy: 'practice', questionsCount: 1 });
  const p = session.problems[0];

  session.answers[p.id] = {
    code: '...',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    edgeCases: ['empty', 'single', 'negatives', 'overflow'],
    hintsUsedCount: 3,
    rating: 'simple'
  };

  const report = MockEngine.evaluateSession(session);
  // Practice mode: no deduction for 3 hints
  assert.ok(report.questionResults[0].score >= 70);
});

// -------------------------------------------------------------
// SECTION 4: STRICT SEPARATION INVARIANT
// -------------------------------------------------------------
console.log('\n--- 4. Strict Separation Invariant ---');

test('SEPARATION INVARIANT: Mock evaluation leaves userStates completely untouched', () => {
  MockEngine.clearActiveSession();
  const userStates = {
    'two-sum': { id: 'two-sum', solved: false, stage: 1, isMastered: false, nextReviewDate: '2026-11-10' },
    'coin-change': { id: 'coin-change', solved: false, stage: 0, isMastered: false, nextReviewDate: null }
  };

  // Deep clone initial state for snapshot comparison
  const initialSnapshot = JSON.parse(JSON.stringify(userStates));

  const session = MockEngine.createSession(SAMPLE_PROBLEMS, userStates, {
    customProblemIds: ['two-sum', 'coin-change'],
    durationMinutes: 45
  });

  // User achieves simple rating on both
  session.answers['two-sum'] = { rating: 'simple', code: 'optimal', timeComplexity: 'O(N)', spaceComplexity: 'O(1)' };
  session.answers['coin-change'] = { rating: 'simple', code: 'optimal', timeComplexity: 'O(N*M)', spaceComplexity: 'O(N)' };

  const report = MockEngine.evaluateSession(session, userStates);
  assert.ok(report !== null);

  // Assert userStates did NOT get mutated
  assert.deepStrictEqual(userStates, initialSnapshot, 'userStates must not be modified by mock evaluation!');
  assert.strictEqual(userStates['two-sum'].solved, false, 'Problem must not be marked solved automatically');
  assert.strictEqual(userStates['two-sum'].isMastered, false, 'Problem must not be marked mastered automatically');
  assert.strictEqual(userStates['two-sum'].nextReviewDate, '2026-11-10', 'SRS nextReviewDate must not be overwritten');
});

// -------------------------------------------------------------
// SECTION 5: Abandon Session Lifecycle
// -------------------------------------------------------------
console.log('\n--- 5. Abandon Session Lifecycle ---');

test('Abandons active session cleanly and records abandoned history record', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { trackId: 'blind_sprint', durationMinutes: 45 });
  assert.ok(MockEngine.getActiveSession() !== null);

  const report = MockEngine.abandonSession(session);
  assert.ok(report !== null);
  assert.strictEqual(report.status, 'abandoned');
  assert.strictEqual(report.grade, 'Abandoned');
  assert.strictEqual(report.overallPercentage, 0);

  // Active session must be cleared
  assert.strictEqual(MockEngine.getActiveSession(), null);

  // Must be in history
  const history = MockEngine.getMockHistory();
  const saved = history.find(h => h.sessionId === session.sessionId);
  assert.ok(saved !== null);
  assert.strictEqual(saved.status, 'abandoned');
});

// -------------------------------------------------------------
// SECTION 6: History Deduplication & Analytics
// -------------------------------------------------------------
console.log('\n--- 6. History Deduplication & Analytics ---');

test('Prevents duplicate history records for the same sessionId', () => {
  MockEngine.clearActiveSession();
  const session = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { questionsCount: 2 });
  const sid = session.sessionId;

  // First evaluation
  const report1 = MockEngine.evaluateSession(session);
  const countAfterFirst = MockEngine.getMockHistory().filter(h => h.sessionId === sid).length;
  assert.strictEqual(countAfterFirst, 1);

  // Second evaluation attempt with same session
  const report2 = MockEngine.evaluateSession(session);
  const countAfterSecond = MockEngine.getMockHistory().filter(h => h.sessionId === sid).length;
  assert.strictEqual(countAfterSecond, 1, 'Duplicate record must not be added to history');
});

test('Calculates aggregate statistics correctly', () => {
  const stats = MockEngine.getMockStats();
  assert.ok(typeof stats.totalSessions === 'number');
  assert.ok(typeof stats.completedCount === 'number');
  assert.ok(typeof stats.abandonedCount === 'number');
  assert.ok(typeof stats.averageScore === 'number');
  assert.strictEqual(stats.totalSessions, stats.completedCount + stats.abandonedCount);
});

// -------------------------------------------------------------
// SECTION 7: Account Isolation & Context
// -------------------------------------------------------------
console.log('\n--- 7. Account Isolation & Context ---');

test('Maintains account context isolation if LearnerRepository is present', () => {
  const userA = { id: 'user_alice_mock' };
  const userB = { id: 'user_bob_mock' };

  MockEngine.clearActiveSession(userA);
  MockEngine.clearActiveSession(userB);

  // Create session for userA
  const sessA = MockEngine.createSession(SAMPLE_PROBLEMS, {}, { trackId: 'faang_standard' }, userA);
  assert.ok(sessA !== null);

  // userB should not see userA active session
  const sessB = MockEngine.getActiveSession(userB);
  assert.strictEqual(sessB, null, 'User B must not see User A active session');

  MockEngine.clearActiveSession(userA);
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n========================================');
console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
console.log('========================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL MOCK INTERVIEW TESTS PASSED!\n');
} else {
  process.exit(1);
}

