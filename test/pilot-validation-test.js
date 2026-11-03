/**
 * AlgoRecall 2.0 — Phase 9.1: Pilot Launch Readiness & Measurement Audit Suite
 * 
 * Validates:
 * 1. 10 Authoritative Pilot Metric Contracts (Numerators, Denominators, Deduplication, Provenance).
 * 2. 5-Level Cognitive Independence Spectrum (Mutually exclusive, collectively exhaustive).
 * 3. 6-Problem Assessment Sampling (Balanced difficulty, canonical IDs, zero baseline/endline overlap, prior exposure audit).
 * 4. Multi-User Account Isolation & Context Switching Invariance.
 * 5. Telemetry Sanitization & Privacy Invariance (Zero PII, zero tokens, zero remote uploads).
 * 6. Historical Migration & Missing Data Resilience.
 * 7. Mock Interview Score Reconciliation Contract (0-100% and /20 scale).
 * 8. Topic Health Badge Precedence Invariant.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Initialize mock storage
const _mockStorage = new Map();
global.localStorage = {
  getItem: (k) => _mockStorage.has(k) ? _mockStorage.get(k) : null,
  setItem: (k, v) => _mockStorage.set(k, String(v)),
  removeItem: (k) => _mockStorage.delete(k),
  clear: () => _mockStorage.clear(),
  key: (i) => Array.from(_mockStorage.keys())[i] || null,
  get length() { return _mockStorage.size; }
};

const PilotValidationEngine = require('../js/pilot-validation-engine');
const AnalyticsEngine = require('../js/analytics-engine');
const MockEngine = require('../js/mock-engine');
const LearnerRepository = require('../js/learner-repository');
const DEFAULT_DSA_SHEETS = require('../js/data/default-sheets');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
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

console.log('========================================');
console.log('[PHASE 9.1] Pilot Launch Readiness & Measurement Audit Suite');
console.log('========================================\n');

// 1. Metric Specifications & Completeness
it('9.1.1: Defines all 10 pilot metrics with strict operational specifications', () => {
  const specs = PilotValidationEngine.PILOT_METRICS_SPEC;
  const requiredMetrics = [
    'independentSolveRate',
    'firstAttemptSuccessRate',
    'delayedRecallAccuracy',
    'medianSolveTimeByDifficulty',
    'hintDependency',
    'streamACompletion',
    'streamBRevisionCompletion',
    'streamCSrsAdherence',
    'abandonmentAndRecoveryRate',
    'dataIntegritySyncRate'
  ];

  requiredMetrics.forEach(m => {
    assert.ok(specs[m], `Missing metric: ${m}`);
    assert.ok(specs[m].formula, `${m} missing formula`);
    assert.ok(specs[m].eligibleEvents, `${m} missing eligibleEvents`);
    assert.ok(specs[m].exclusionRules, `${m} missing exclusionRules`);
    assert.ok(specs[m].missingDataTreatment, `${m} missing missingDataTreatment`);
    assert.ok(specs[m].limitations, `${m} missing limitations`);
  });
});

// 2. Section 3: 5-Level Cognitive Independence Spectrum
it('9.1.2: Enforces mutually exclusive 5-way cognitive spectrum where sum equals total attempted', () => {
  const userStates = {
    // 1. Independent first-pass: 1 attempt, 0 hints, 0 reveal, solved
    'p-first-pass': {
      solved: true,
      attempts: 1,
      hintsUsed: 0,
      solutionRevealed: false,
      history: [{ rating: 'simple' }]
    },
    // 2. Independent eventual: 2 attempts (first failed), 0 hints, 0 reveal, solved
    'p-eventual': {
      solved: true,
      attempts: 2,
      hintsUsed: 0,
      solutionRevealed: false,
      history: [{ rating: 'failed' }, { rating: 'medium' }]
    },
    // 3. Assisted success: 1 hint used, 0 reveal, solved
    'p-assisted': {
      solved: true,
      attempts: 1,
      hintsUsed: 1,
      solutionRevealed: false,
      history: [{ rating: 'medium' }]
    },
    // 4. Solution revealed: solution revealed, solved
    'p-revealed': {
      solved: true,
      attempts: 1,
      hintsUsed: 2,
      solutionRevealed: true,
      history: [{ rating: 'medium' }]
    },
    // 5. Unsuccessful or abandoned: attempted, but failed rating and not solved
    'p-unsuccessful': {
      solved: false,
      attempts: 1,
      hintsUsed: 0,
      lastRating: 'failed',
      history: [{ rating: 'failed' }]
    }
  };

  const report = PilotValidationEngine.computePilotMetrics({ userStates });
  const spectrum = report.cognitiveIndependenceSpectrum;

  assert.strictEqual(spectrum.independentFirstPass.count, 1);
  assert.strictEqual(spectrum.independentEventual.count, 1);
  assert.strictEqual(spectrum.assistedSuccess.count, 1);
  assert.strictEqual(spectrum.solutionRevealed.count, 1);
  assert.strictEqual(spectrum.unsuccessfulOrAbandoned.count, 1);

  // Invariant: sum of spectrum counts === totalAttemptedProblems
  const spectrumSum = spectrum.independentFirstPass.count +
    spectrum.independentEventual.count +
    spectrum.assistedSuccess.count +
    spectrum.solutionRevealed.count +
    spectrum.unsuccessfulOrAbandoned.count;

  assert.strictEqual(spectrumSum, report.sampleSummary.totalAttemptedProblems);
  assert.strictEqual(spectrumSum, 5);

  // Invariant: independentSolveRate numerator === firstPass + eventual
  assert.strictEqual(report.metrics.independentSolveRate.numerator, 2);
  assert.strictEqual(report.metrics.independentSolveRate.denominator, 5);
  assert.strictEqual(report.metrics.independentSolveRate.numeric, 40); // 2/5 = 40%
});

// 3. Delayed Recall Accuracy (SRS) Filtering & Missing History Resilience
it('9.1.3: Delayed recall accuracy strictly filters interval >= 1 day and handles migrated history', () => {
  const userStates = {
    'p-same-day': {
      history: [
        { interval: 0, rating: 'failed' },  // Same-day immediate repeat -> excluded
        { interval: 0, rating: 'simple' }  // Same-day repeat -> excluded
      ]
    },
    'p-delayed': {
      history: [
        { interval: 1, rating: 'medium' }, // Delayed 1d review -> included (Good/Medium)
        { interval: 3, rating: 'simple' }, // Delayed 3d review -> included (Good/Simple)
        { interval: 7, rating: 'failed' }  // Delayed 7d review -> included (Failed)
      ]
    },
    'p-migrated': {
      // Legacy record with missing interval on history item, but stage >= 1 on state
      stage: 2,
      interval: 3,
      history: [
        { rating: 'medium' } // Missing explicit interval on record -> falls back to state interval (3d)
      ]
    }
  };

  const report = PilotValidationEngine.computePilotMetrics({ userStates });
  const delayedMetric = report.metrics.delayedRecallAccuracy;

  // Delayed events:
  // p-delayed: 1d (med), 3d (simp), 7d (fail) -> 3 events, 2 success
  // p-migrated: fallback 3d (med) -> 1 event, 1 success
  // Total delayed: 4 events, 3 successful
  assert.strictEqual(delayedMetric.denominator, 4);
  assert.strictEqual(delayedMetric.numerator, 3);
  assert.strictEqual(delayedMetric.numeric, 75); // 3/4 = 75%
});

// 4. Assessment Checkpoint Design & Prior Exposure Audit
it('9.1.4: Assessment checkpoints sample balanced difficulty, zero baseline/endline overlap, and audits prior exposure', () => {
  const userStates = {
    // Learner previously practiced prob-3-check-palindrome-number before pilot
    'prob-3-check-palindrome-number': { solved: true, attempts: 1 }
  };

  const baseline = PilotValidationEngine.generateProtocolCheckpoint('baseline', DEFAULT_DSA_SHEETS, userStates);
  const endline = PilotValidationEngine.generateProtocolCheckpoint('endline', DEFAULT_DSA_SHEETS, userStates);

  // Exactly 6 questions each
  assert.strictEqual(baseline.totalQuestions, 6);
  assert.strictEqual(endline.totalQuestions, 6);

  // Balanced distribution: 2 Easy, 3 Medium, 1 Hard
  assert.strictEqual(baseline.difficultyDistribution.Easy, 2);
  assert.strictEqual(baseline.difficultyDistribution.Medium, 3);
  assert.strictEqual(baseline.difficultyDistribution.Hard, 1);
  assert.strictEqual(endline.difficultyDistribution.Easy, 2);
  assert.strictEqual(endline.difficultyDistribution.Medium, 3);
  assert.strictEqual(endline.difficultyDistribution.Hard, 1);

  // Invariant: Zero overlap between baseline and endline problems
  const baseIds = new Set(baseline.problems.map(p => p.id));
  const endIds = new Set(endline.problems.map(p => p.id));
  const overlap = [...baseIds].filter(id => endIds.has(id));
  assert.strictEqual(overlap.length, 0, 'Baseline and Endline must have zero overlapping problems');

  // Prior exposure auditing
  assert.strictEqual(baseline.priorExposureCount, 1, 'Must detect 1 prior exposure on baseline palindrome problem');
  assert.ok(baseline.scientificDisclaimer.includes('sample size (N=6)'), 'Must include scientific sample size limitation disclaimer');
});

// 5. Privacy & Telemetry Sanitization Invariance
it('9.1.5: Telemetry export anonymizes participant ID, strips credentials, and labels self-reported provenance', () => {
  const ctxAuth = { id: 'alice_research_user@university.edu', isGuest: false };
  const userStates = {
    'two-sum': { solved: true, hintsUsed: 0, attempts: 1 }
  };

  const bundle = PilotValidationEngine.generatePilotTelemetryBundle({ userStates }, ctxAuth);

  assert.strictEqual(bundle.app, 'AlgoRecall');
  assert.strictEqual(bundle.schema, 'pilot_evaluation_v1');
  assert.ok(bundle.participantId.startsWith('pilot_'));
  assert.strictEqual(bundle.contextType, 'authenticated');

  // Verify complete absence of PII, emails, tokens, or API keys
  const serialized = JSON.stringify(bundle);
  assert.strictEqual(serialized.includes('alice_research_user@university.edu'), false, 'Must strip user email');
  assert.strictEqual(bundle.apiKey, undefined);
  assert.strictEqual(bundle.token, undefined);
  assert.strictEqual(bundle.password, undefined);
  assert.strictEqual(bundle.email, undefined);
  assert.strictEqual(bundle.aiApiKey, undefined);

  // Verify non-conflated provenance
  assert.ok(bundle.provenance.includes('Compiler Verified: False'));
  assert.ok(bundle.consentAndUsageNotice.includes('never uploaded automatically'));
});

// 6. Multi-User Account Isolation Invariance
it('9.1.6: Multi-user context switching strictly isolates pilot states and metrics', () => {
  localStorage.clear();
  const ctxA = { id: 'pilot_learner_alpha', isGuest: false };
  const ctxB = { id: 'pilot_learner_beta', isGuest: false };

  // Learner Alpha: 10 independent solves
  const statesA = {};
  for (let i = 1; i <= 10; i++) {
    statesA[`alpha-prob-${i}`] = { solved: true, hintsUsed: 0, attempts: 1 };
  }
  LearnerRepository.saveUserStates(statesA, ctxA);

  // Learner Beta: 5 assisted solves
  const statesB = {};
  for (let i = 1; i <= 5; i++) {
    statesB[`beta-prob-${i}`] = { solved: true, hintsUsed: 2, attempts: 1 };
  }
  LearnerRepository.saveUserStates(statesB, ctxB);

  const reportA = PilotValidationEngine.computePilotMetrics({}, ctxA);
  const reportB = PilotValidationEngine.computePilotMetrics({}, ctxB);

  assert.strictEqual(reportA.sampleSummary.totalAttemptedProblems, 10);
  assert.strictEqual(reportA.metrics.independentSolveRate.numeric, 100);

  assert.strictEqual(reportB.sampleSummary.totalAttemptedProblems, 5);
  assert.strictEqual(reportB.metrics.independentSolveRate.numeric, 0); // All 5 were assisted
  assert.strictEqual(reportB.cognitiveIndependenceSpectrum.assistedSuccess.count, 5);
});

// 7. Mock Interview Reconciled Score Contract
it('9.1.7: Reconciles Mock Interview percentage and 20-point rubric scales in AnalyticsEngine', () => {
  const mockHistory = [
    { sessionId: 'm1', status: 'completed', overallPercentage: 90 },
    { sessionId: 'm2', status: 'completed', totalScore: 18 } // 18/20 -> 90%
  ];

  const analytics = AnalyticsEngine.computeMockAnalytics({ mockHistory });

  assert.strictEqual(analytics.averageScore, 90);
  assert.strictEqual(analytics.scoreOutOf20, 18);
  assert.strictEqual(analytics.bestScore, 90);
  assert.strictEqual(analytics.bestScoreOutOf20, 18);
});

// 8. Topic Health Badge Precedence Invariant
it('9.1.8: Topic health precedence strictly enforces At Risk whenever attempts >= 3 and accuracy < 50%', () => {
  const mockCatalog = [
    { id: 'dp-1', topic: 'Dynamic Programming', difficulty: 'Medium' },
    { id: 'dp-2', topic: 'Dynamic Programming', difficulty: 'Medium' },
    { id: 'dp-3', topic: 'Dynamic Programming', difficulty: 'Medium' }
  ];

  const userStates = {
    'dp-1': { solved: true, attempts: 1 },
    'dp-2': { solved: false, attempts: 2, lastRating: 'failed' },
    'dp-3': { solved: false, attempts: 1, lastRating: 'failed' }
  };

  const mastery = AnalyticsEngine.computeTopicMastery({ catalog: mockCatalog, userStates });
  const dp = mastery.topics.find(t => t.topic === 'Dynamic Programming');

  assert.ok(dp);
  assert.strictEqual(dp.attempted, 3);
  assert.strictEqual(dp.solved, 1);
  assert.strictEqual(dp.isAtRisk, true);
  assert.strictEqual(dp.retentionStatus, 'at-risk');
});

console.log('\n========================================');
console.log(`Phase 9.1 Audit Suite: ${passedTests}/${totalTests} tests passed.`);
console.log('========================================\n');
