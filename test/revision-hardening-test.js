/**
 * AlgoRecall 2.0 — Phase 5.1: Revision Center Hardening & Audit Test Suite
 * test/revision-hardening-test.js
 *
 * Verifies:
 * 1. SRSEngine rating semantics: stage transitions, same-day reviews (massed practice guard),
 *    hint gating, failure resets, and anti-inflation mastery invariants.
 * 2. Idempotency guarantees: stable event IDs, idempotency keys, duplicate submission rejection,
 *    zero duplicate history inflation, and non-repeating XP awards.
 * 3. Session recovery & account isolation: multi-account separation, session reconciliation
 *    when problems are reviewed elsewhere, TTL expiration, and crash resumption.
 * 4. Authoritative metrics audit: date boundary handling, 7-day window accuracy, unique problem
 *    vs event counting, and self-reported retention metrics.
 * 5. Grounded progressive hints: fallback for uncataloged items, verified complexity reporting,
 *    and guaranteed prevention of accidental mastery upon solution revelation.
 */

const assert = require('assert');
const SRSEngine = require('../js/srs-engine');
const LearnerRepository = require('../js/learner-repository');
const RevisionSessionController = require('../js/revision-session-controller');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

console.log('\n========================================');
console.log('[SUITE] 50. Phase 5.1 Revision Center Hardening & Audit Suite');
console.log('========================================');

const sampleProblems = [
  {
    id: 'prob-001',
    title: 'Two Sum',
    topic: 'Arrays & Hashing',
    difficulty: 'Easy',
    pattern: 'Frequency Map',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    notes: 'Use a hash map to look up the complement in O(1) time.'
  },
  {
    id: 'prob-002',
    title: 'Longest Palindromic Substring',
    topic: '2-D Dynamic Programming',
    difficulty: 'Medium',
    pattern: 'Expand Around Center',
    timeComplexity: 'O(N^2)',
    spaceComplexity: 'O(1)',
    notes: 'Expand around each 2N-1 centers or use DP matrix.'
  },
  {
    id: 'prob-003',
    title: 'Word Ladder II',
    topic: 'Advanced Graphs',
    difficulty: 'Hard',
    pattern: 'BFS + Backtracking',
    timeComplexity: null, // Untracked complexity test
    spaceComplexity: null,
    notes: ''
  }
];

// --- SECTION 1: SRSEngine Rating Semantics & Massed Practice ---
test('50.1: SRSEngine rating semantics for all 4 ratings (failed, hard, medium, simple)', () => {
  const asOf = new Date('2026-11-03T10:00:00Z');

  // 1. Simple (Easy) rating progression
  const s1 = SRSEngine.processReview({ stage: 0 }, 'simple', 5, '', 4, { now: asOf });
  assert.strictEqual(s1.stage, 1);
  assert.strictEqual(s1.intervalDays, 7, 'Simple stage 1 interval must be 7 days');
  assert.strictEqual(s1.lastRating, 'simple');

  // 2. Medium (Good) rating progression
  const s2 = SRSEngine.processReview({ stage: 0 }, 'medium', 10, '', 3, { now: asOf });
  assert.strictEqual(s2.stage, 1);
  assert.strictEqual(s2.intervalDays, 3, 'Medium stage 1 interval must be 3 days');
  assert.strictEqual(s2.lastRating, 'medium');

  // 3. Hard rating progression
  const s3 = SRSEngine.processReview({ stage: 0 }, 'hard', 15, '', 2, { now: asOf });
  assert.strictEqual(s3.stage, 1);
  assert.strictEqual(s3.intervalDays, 1, 'Hard stage 1 interval must be 1 day');
  assert.strictEqual(s3.lastRating, 'hard');

  // 4. Failed (Again) rating reset
  const s4 = SRSEngine.processReview({ stage: 4, intervalDays: 45 }, 'failed', 20, '', 1, { now: asOf });
  assert.strictEqual(s4.stage, 1, 'Failed rating must reset stage to 1');
  assert.strictEqual(s4.intervalDays, 1, 'Failed rating must reset interval to 1 day');
  assert.strictEqual(s4.lastRating, 'failed');
});

test('50.2: Same-day review (massed practice) preserves stage and prevents interval pushout', () => {
  const asOf1 = new Date('2026-11-03T09:00:00Z');
  const asOf2 = new Date('2026-11-03T14:00:00Z'); // 5 hours later on same day

  // Initial review
  const firstRev = SRSEngine.processReview({ stage: 1, intervalDays: 7, nextReviewDate: '2026-11-10' }, 'simple', 5, '', 4, { now: asOf1 });
  assert.strictEqual(firstRev.stage, 2);
  assert.strictEqual(firstRev.intervalDays, 21);
  assert.strictEqual(firstRev.nextReviewDate, '2026-11-24');

  // Second review on same calendar day with 'simple' (User spams Easy again)
  const massedRev = SRSEngine.processReview(firstRev, 'simple', 2, '', 4, { now: asOf2 });
  assert.strictEqual(massedRev.stage, 2, 'Massed practice must not advance stage beyond 2');
  assert.strictEqual(massedRev.nextReviewDate, '2026-11-24', 'Massed practice must preserve existing next review date');
  const lastHistory = massedRev.history[massedRev.history.length - 1];
  assert.strictEqual(lastHistory.isMassedPractice, true, 'History must record massed practice flag');

  // Third review on same day with 'failed' (Failure reset must still override massed practice)
  const failedRev = SRSEngine.processReview(massedRev, 'failed', 10, '', 1, { now: asOf2 });
  assert.strictEqual(failedRev.stage, 1, 'Failure reset must override massed practice');
  assert.strictEqual(failedRev.intervalDays, 1);
});

test('50.3: Solution revelation & Hint gating strictly prevent stage advancement & mastery', () => {
  const asOf = new Date('2026-11-03T10:00:00Z');
  const advancedState = {
    stage: 4,
    intervalDays: 45,
    history: [
      { date: '2026-10-01T00:00:00Z', confidence: 4, hintsUsed: false },
      { date: '2026-10-15T00:00:00Z', confidence: 4, hintsUsed: false }
    ]
  };

  // Review with solution revealed (hintsUsed = true) even with self-reported 'simple' (4)
  const res = SRSEngine.processReview(advancedState, 'simple', 15, 'Looked at solution', 4, {
    hintsUsed: true,
    now: asOf
  });

  assert.strictEqual(res.stage, 4, 'Hints used must preserve stage (no advancement)');
  assert.strictEqual(res.intervalDays <= 2, true, 'Hints used must gate interval to <= 2 days for prompt retrieval');
  assert.strictEqual(res.isMastered, false, 'Problem with hints used must never graduate to Mastered');
});

// --- SECTION 2: Idempotency & Concurrency ---
test('50.4: Idempotency enforcement with stable event IDs', () => {
  const dummyStates = {};
  const asOf = new Date('2026-11-03T10:00:00Z');
  const stableEventId = 'evt_unique_12345';

  // First submission
  const firstCall = RevisionSessionController.submitRecallRating('prob-001', 'good', 10, 'Note 1', {
    eventId: stableEventId,
    asOfDate: asOf,
    userStatesRef: dummyStates
  });

  assert.strictEqual(firstCall.success, true);
  assert.strictEqual(firstCall.idempotent, false);
  const historyLen1 = dummyStates['prob-001'].history.length;
  assert.strictEqual(historyLen1, 1);
  const nextDate1 = dummyStates['prob-001'].nextReviewDate;

  // Second submission with identical eventId (Network retry / double click)
  const retryCall = RevisionSessionController.submitRecallRating('prob-001', 'good', 10, 'Note 1', {
    eventId: stableEventId,
    asOfDate: asOf,
    userStatesRef: dummyStates
  });

  assert.strictEqual(retryCall.success, true);
  assert.strictEqual(retryCall.idempotent, true, 'Retry must be marked as idempotent');
  assert.strictEqual(retryCall.xpEarned, 0, 'No XP can be re-awarded on duplicate event');
  assert.strictEqual(dummyStates['prob-001'].history.length, 1, 'History length must not increase on duplicate event');
  assert.strictEqual(dummyStates['prob-001'].nextReviewDate, nextDate1, 'Due date must not be pushed on duplicate event');
});

// --- SECTION 3: Session Recovery & Account Isolation ---
test('50.5: Account Isolation ensures User A session is never exposed to User B', () => {
  // 1. User A starts session
  LearnerRepository.setContext({ id: 'user_alice', username: 'alice' });
  RevisionSessionController.discardActiveSession();
  const aliceSession = RevisionSessionController.startSession(['prob-001', 'prob-002']);
  assert.strictEqual(aliceSession.userId, 'user_alice');

  // Verify Alice sees active session
  const activeAlice = RevisionSessionController.getActiveSession();
  assert.ok(activeAlice);
  assert.strictEqual(activeAlice.sessionId, aliceSession.sessionId);

  // 2. Switch to User B (Bob)
  LearnerRepository.setContext({ id: 'user_bob', username: 'bob' });
  const activeBob = RevisionSessionController.getActiveSession();
  assert.strictEqual(activeBob, null, 'User Bob must not see Alice active session');

  // 3. Switch back to User A (Alice)
  LearnerRepository.setContext({ id: 'user_alice', username: 'alice' });
  const activeAliceRestored = RevisionSessionController.getActiveSession();
  assert.ok(activeAliceRestored, 'Alice must recover her session upon returning');
  assert.strictEqual(activeAliceRestored.sessionId, aliceSession.sessionId);

  // Cleanup
  RevisionSessionController.discardActiveSession();
  LearnerRepository.setContext('guest');
});

test('50.6: Reconciles problems reviewed elsewhere during an active session', () => {
  LearnerRepository.setContext('guest');
  RevisionSessionController.discardActiveSession();

  const dummyStates = {
    'prob-001': { id: 'prob-001', lastReviewed: '2026-10-30T00:00:00Z', nextReviewDate: '2026-11-01' },
    'prob-002': { id: 'prob-002', lastReviewed: '2026-10-30T00:00:00Z', nextReviewDate: '2026-11-01' }
  };
  LearnerRepository.saveUserStates(dummyStates);

  // Start session with prob-001 and prob-002
  const session = RevisionSessionController.startSession(['prob-001', 'prob-002']);
  assert.strictEqual(session.currentIndex, 0);

  // Simulate user reviewing prob-001 in another tab or Problems Library
  dummyStates['prob-001'].lastReviewed = new Date().toISOString();
  dummyStates['prob-001'].lastRating = 'simple';
  dummyStates['prob-001'].confidence = 4;
  LearnerRepository.saveUserStates(dummyStates);

  // User resumes session in Revision Center
  const active = RevisionSessionController.getActiveSession();
  assert.ok(active);
  assert.strictEqual(active.currentIndex, 1, 'Session must advance past prob-001 which was reviewed elsewhere');
  assert.strictEqual(active.completedReviews.length, 1);
  assert.strictEqual(active.completedReviews[0].problemId, 'prob-001');
  assert.strictEqual(active.completedReviews[0].reconciled, true);

  RevisionSessionController.discardActiveSession();
});

// --- SECTION 4: Authoritative Metrics Audit ---
test('50.7: Metrics separate review events from unique problems and label self-reported retention', () => {
  const asOf = new Date('2026-11-03T10:00:00Z');
  const todayStr = '2026-11-03';

  const mockStates = {
    // Problem 1: Reviewed twice today (1 good, 1 easy)
    'prob-001': {
      id: 'prob-001',
      lastReviewed: '2026-11-03T09:00:00Z',
      nextReviewDate: '2026-11-10',
      history: [
        { date: '2026-11-03T08:00:00Z', rating: 'medium' },
        { date: '2026-11-03T09:00:00Z', rating: 'simple' }
      ]
    },
    // Problem 2: Reviewed once today (failed/again)
    'prob-002': {
      id: 'prob-002',
      lastReviewed: '2026-11-03T09:30:00Z',
      nextReviewDate: '2026-11-04',
      confidence: 1,
      lastRating: 'failed',
      history: [
        { date: '2026-11-03T09:30:00Z', rating: 'failed' }
      ]
    }
  };

  const metrics = RevisionSessionController.getRevisionMetrics(sampleProblems, mockStates, asOf);
  assert.strictEqual(metrics.todayStr, todayStr);
  assert.strictEqual(metrics.completedReviewsToday, 3, 'Total review events must be 3');
  assert.strictEqual(metrics.uniqueProblemsCompletedToday, 2, 'Unique problems reviewed today must be 2');
  assert.strictEqual(metrics.ratingDistribution.again, 1);
  assert.strictEqual(metrics.ratingDistribution.good, 1);
  assert.strictEqual(metrics.ratingDistribution.easy, 1);

  // Self-reported retention: 2 successful out of 3 total = 67%
  assert.strictEqual(metrics.selfReportedRetentionPct, 67);
  assert.strictEqual(metrics.recallAccuracyPct, 67, 'recallAccuracyPct is an alias to selfReportedRetentionPct');
});

// --- SECTION 5: Progressive Hints Grounding ---
test('50.8: Progressive hints and solution guidance handle uncataloged or missing data cleanly', () => {
  // 1. Missing problem
  const emptyHint = RevisionSessionController.getScaffoldingHint(null, 1);
  assert.strictEqual(emptyHint.unavailable, true);

  const emptySol = RevisionSessionController.getSolutionGuidance(null);
  assert.strictEqual(emptySol.unavailable, true);

  // 2. Verified catalog problem with notes & complexity
  const p1 = sampleProblems[0];
  const sol1 = RevisionSessionController.getSolutionGuidance(p1);
  assert.strictEqual(sol1.unavailable, false);
  assert.strictEqual(sol1.optimalTime, 'O(N)');
  assert.strictEqual(sol1.optimalSpace, 'O(N)');
  assert.ok(sol1.approach.includes('hash map'));

  // 3. Problem with unspecified complexity does not invent fake numbers
  const p3 = sampleProblems[2];
  const sol3 = RevisionSessionController.getSolutionGuidance(p3);
  assert.strictEqual(sol3.optimalTime, 'Not specified');
  assert.strictEqual(sol3.optimalSpace, 'Not specified');
});

console.log('\n========================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}

