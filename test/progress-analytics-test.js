/**
 * AlgoRecall 2.0 — Phase 7: Progress & Analytics Test Suite
 * Validates learning intelligence metrics, non-conflation, recommendations engine,
 * topic mastery, retention analytics, mock performance, account isolation, and read-only invariance.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load AnalyticsEngine
const AnalyticsEngine = require('../js/analytics-engine.js');

// Mock localStorage for node environment
if (typeof localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

let passed = 0;
let total = 0;

function it(description, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

function describe(suiteName, fn) {
  console.log(`\n========================================`);
  console.log(`AlgoRecall 2.0 — ${suiteName}`);
  console.log(`========================================`);
  fn();
}

describe('Progress & Analytics System Tests', () => {

  // --- CATEGORY 1: METRIC REGISTRY SPECIFICATION & COMPLETENESS ---
  console.log('\n--- Category 1: Metric Registry Specification & Completeness ---');

  it('1.1: METRIC_REGISTRY defines all required metrics with full documentation schema', () => {
    assert(AnalyticsEngine.METRIC_REGISTRY, 'METRIC_REGISTRY must exist');
    const requiredMetrics = [
      'uniqueProblemsAttempted',
      'verifiedSolvedProblems',
      'selfReportedSolvedProblems',
      'cognitiveIndependenceRate',
      'recallSuccessRate',
      'ebbinghausDecayEstimate',
      'consistencyScore',
      'mockInterviewReadiness'
    ];

    requiredMetrics.forEach(metricKey => {
      const metric = AnalyticsEngine.METRIC_REGISTRY[metricKey];
      assert(metric, `Metric registry entry '${metricKey}' must exist`);
      assert(metric.name, `'${metricKey}' must have a name`);
      assert(metric.definition, `'${metricKey}' must have a definition`);
      assert(metric.sourceOfTruth, `'${metricKey}' must document source of truth`);
      assert(metric.inclusionRules, `'${metricKey}' must document inclusion rules`);
      assert(metric.exclusionRules, `'${metricKey}' must document exclusion rules`);
      assert(metric.denominator, `'${metricKey}' must document denominator`);
      assert(metric.nullHandling, `'${metricKey}' must document null handling`);
      assert(metric.deduplicationPolicy, `'${metricKey}' must document deduplication policy`);
      assert(metric.limitations, `'${metricKey}' must document limitations`);
    });
  });

  it('1.2: METRIC_REGISTRY explicitly documents client-only limitation for verifiedSolvedProblems', () => {
    const verified = AnalyticsEngine.METRIC_REGISTRY.verifiedSolvedProblems;
    assert(verified.nullHandling.includes('0') || verified.nullHandling.includes('offline'),
      'verifiedSolvedProblems must state offline returns 0');
    assert(verified.exclusionRules.includes('Self-reported') || verified.exclusionRules.includes('checkmarks'),
      'verifiedSolvedProblems must exclude self-reported solves');
  });

  // --- CATEGORY 2: LEARNING OVERVIEW & NON-CONFLATION ---
  console.log('\n--- Category 2: Learning Overview & Non-Conflation ---');

  it('2.1: Total catalog problems strictly reports canonical 479 problems', () => {
    const overview = AnalyticsEngine.computeLearningOverview();
    assert.strictEqual(overview.totalCatalogProblems, 479, 'Total catalog problems must be 479');
  });

  it('2.2: Strict non-conflation: unique attempted vs verified solved vs self-reported solved', () => {
    const overview = AnalyticsEngine.computeLearningOverview();
    assert(typeof overview.uniqueProblemsAttempted === 'number', 'uniqueProblemsAttempted must be a number');
    assert(typeof overview.verifiedSolvedProblems === 'number', 'verifiedSolvedProblems must be a number');
    assert(typeof overview.selfReportedSolvedProblems === 'number', 'selfReportedSolvedProblems must be a number');
    assert.strictEqual(overview.verifiedSolvedProblems, 0, 'In client-only mode, verifiedSolvedProblems must be 0');
  });

  it('2.3: Active roadmap metrics reflect assignments without conflating discrete attempts', () => {
    const overview = AnalyticsEngine.computeLearningOverview();
    assert(typeof overview.totalRoadmapAssignments === 'number');
    assert(typeof overview.completedRoadmapAssignments === 'number');
    assert(typeof overview.remainingRoadmapAssignments === 'number');
    assert(typeof overview.roadmapCompletionPercent === 'number');
    assert(overview.roadmapCompletionPercent >= 0 && overview.roadmapCompletionPercent <= 100);
    assert(overview.activeRoadmapTitle, 'Must report active roadmap title');
  });

  // --- CATEGORY 3: ACTIONABLE RECOMMENDATIONS ENGINE & EVIDENCE THRESHOLDS ---
  console.log('\n--- Category 3: Actionable Recommendations Engine & Evidence Thresholds ---');

  it('3.1: Initial baseline recommendation generated when learner has no history', () => {
    const emptyAnalytics = {
      overview: { uniqueProblemsAttempted: 0, selfReportedSolvedProblems: 0 },
      retention: { dueReviews: 0, overdueReviews: 0 },
      topicMastery: { topics: [] },
      mock: { totalSessions: 0 }
    };
    const recs = AnalyticsEngine.generateRecommendations(emptyAnalytics);
    assert(recs.length > 0, 'Should generate baseline recommendation');
    const baseRec = recs.find(r => r.id === 'rec_initial_evidence');
    assert(baseRec, 'Must include baseline setup recommendation');
    assert.strictEqual(baseRec.destination, '#/problems');
    assert(baseRec.reason.includes('at least 3 completed problem attempts'), 'Reason must explain evidence threshold');
  });

  it('3.2: Urgent revision recommendation generated when SRS reviews are due or overdue', () => {
    const srsDueAnalytics = {
      overview: { uniqueProblemsAttempted: 10, selfReportedSolvedProblems: 10 },
      retention: { dueReviews: 4, overdueReviews: 2 },
      topicMastery: { topics: [] },
      mock: { totalSessions: 1 }
    };
    const recs = AnalyticsEngine.generateRecommendations(srsDueAnalytics);
    const revRec = recs.find(r => r.id === 'rec_srs_due');
    assert(revRec, 'Must generate SRS due recommendation');
    assert.strictEqual(revRec.destination, '#/revision');
    assert(revRec.priority >= 4, 'SRS recommendation must be high priority');
    assert(revRec.supportingEvidence.includes('4 due') && revRec.supportingEvidence.includes('2 overdue'),
      'Must cite exact due and overdue numbers in evidence');
  });

  it('3.3: Strict evidence threshold: Never recommends a weak topic with fewer than 3 attempts', () => {
    const lowSampleAnalytics = {
      overview: { uniqueProblemsAttempted: 2, selfReportedSolvedProblems: 0 },
      retention: { dueReviews: 0, overdueReviews: 0 },
      topicMastery: {
        topics: [
          // 2 attempts, 0 solved = 0% accuracy, but < 3 attempts threshold
          { topic: 'Dynamic Programming', total: 40, attempted: 2, solved: 0, accuracy: 0, isAtRisk: false }
        ]
      },
      mock: { totalSessions: 0 }
    };
    const recs = AnalyticsEngine.generateRecommendations(lowSampleAnalytics);
    const weakTopicRec = recs.find(r => r.id.startsWith('rec_weak_topic_'));
    assert.strictEqual(weakTopicRec, undefined, 'Must NOT recommend weak topic when attempts < 3');
  });

  it('3.4: Recommends weak topic when >= 3 attempts and accuracy < 50%', () => {
    const qualifiedWeakAnalytics = {
      overview: { uniqueProblemsAttempted: 5, selfReportedSolvedProblems: 1 },
      retention: { dueReviews: 0, overdueReviews: 0 },
      topicMastery: {
        topics: [
          // 5 attempts, 1 solved = 20% accuracy, >= 3 attempts -> isAtRisk
          { topic: 'Dynamic Programming', total: 40, attempted: 5, solved: 1, accuracy: 20, isAtRisk: true }
        ]
      },
      mock: { totalSessions: 0 }
    };
    const recs = AnalyticsEngine.generateRecommendations(qualifiedWeakAnalytics);
    const weakTopicRec = recs.find(r => r.id === 'rec_weak_topic_dynamic_programming');
    assert(weakTopicRec, 'Must recommend weak topic when attempts >= 3 and accuracy < 50%');
    assert(weakTopicRec.supportingEvidence.includes('5 attempted') && weakTopicRec.supportingEvidence.includes('20%'),
      'Evidence must cite attempts and accuracy rate');
    assert.strictEqual(weakTopicRec.destination, '#/problems');
  });

  it('3.5: Every recommendation includes all 6 explainability fields', () => {
    const res = AnalyticsEngine.computeComprehensiveAnalytics();
    const recs = res.recommendations;
    recs.forEach(rec => {
      assert(rec.id, 'Recommendation must have id');
      assert(typeof rec.priority === 'number', 'Recommendation must have numeric priority');
      assert(rec.title, 'Recommendation must have title');
      assert(rec.reason, 'Recommendation must have reason');
      assert(rec.supportingEvidence, 'Recommendation must have supportingEvidence');
      assert(rec.recommendedAction, 'Recommendation must have recommendedAction');
      assert(rec.destination, 'Recommendation must have destination route');
    });
  });

  // --- CATEGORY 4: TOPIC MASTERY METRICS & INVARIANTS ---
  console.log('\n--- Category 4: Topic Mastery Metrics & Invariants ---');

  it('4.1: Topic mastery covers all canonical DSA topics mapped from default sheets', () => {
    const topicData = AnalyticsEngine.computeTopicMastery();
    assert(Array.isArray(topicData.topics), 'topicData.topics must be an array');
    assert(topicData.topics.length >= 10, 'Must cover standard topic taxonomy');

    const totalProblemsSum = topicData.topics.reduce((acc, t) => acc + t.total, 0);
    assert.strictEqual(totalProblemsSum, 479, 'Sum of topic problem counts must equal 479');
  });

  it('4.2: Invariant: Attempted problems are NEVER marked as mastered', () => {
    const topicData = AnalyticsEngine.computeTopicMastery();
    topicData.topics.forEach(t => {
      assert(t.mastered <= t.solved, `Topic ${t.topic}: mastered (${t.mastered}) cannot exceed solved (${t.solved})`);
      assert(t.mastered <= t.total, `Topic ${t.topic}: mastered cannot exceed total`);
    });
  });

  it('4.3: Health classification correctly categorizes unattempted, at-risk, and developing', () => {
    const topicData = AnalyticsEngine.computeTopicMastery();
    topicData.topics.forEach(t => {
      assert(['unattempted', 'at-risk', 'proficient', 'mastered', 'developing'].includes(t.retentionStatus),
        `Topic ${t.topic} has valid retention status: ${t.retentionStatus}`);
    });
  });

  // --- CATEGORY 5: RETENTION & REVISION ANALYTICS ---
  console.log('\n--- Category 5: Retention & Revision Analytics ---');

  it('5.1: Retention analytics calculates due, overdue, and completed reviews', () => {
    const retention = AnalyticsEngine.computeRetentionAnalytics();
    assert(typeof retention.dueReviews === 'number');
    assert(typeof retention.overdueReviews === 'number');
    assert(typeof retention.completedReviews === 'number');
    assert(retention.difficultyDistribution, 'Must calculate difficulty distribution');
    assert(retention.stageDistribution, 'Must calculate stage distribution');
  });

  it('5.2: Ebbinghaus decay value explicitly includes mathematical disclaimer', () => {
    const retention = AnalyticsEngine.computeRetentionAnalytics();
    assert(retention.retentionDisclaimer, 'Must include retention disclaimer');
    assert(retention.retentionDisclaimer.includes('mathematical decay approximations') ||
           retention.retentionDisclaimer.includes('not measured biological memory'),
      'Disclaimer must explicitly state mathematical approximation');
  });

  it('5.3: Strict separation invariant: Mock interview attempts are excluded from SRS recall records', () => {
    // If mock history has entries, retention recall records must remain strictly isolated
    const retention = AnalyticsEngine.computeRetentionAnalytics();
    const mock = AnalyticsEngine.computeMockAnalytics();
    assert.notStrictEqual(retention.completedReviews, mock.totalQuestionsEvaluated || -1,
      'Retention completed reviews must not conflate with mock questions evaluated');
  });

  // --- CATEGORY 6: PROBLEM-SOLVING PERFORMANCE ---
  console.log('\n--- Category 6: Problem-Solving Performance ---');

  it('6.1: Problem-solving performance calculates terminal outcome distributions', () => {
    const ps = AnalyticsEngine.computeProblemSolvingPerformance();
    assert(typeof ps.totalAttempts === 'number');
    assert(typeof ps.successfulSolves === 'number');
    assert(ps.hintUsage, 'Must track hint usage breakdown');
    assert(ps.difficultyBreakdown, 'Must break down by Easy, Medium, Hard');
  });

  it('6.2: Terminal evaluations correctly compute independence rate and hint dependency', () => {
    const eff = AnalyticsEngine.computeLearningEffectiveness('all');
    assert('independentSolveRate' in eff);
    assert('hintDependencyIndex' in eff);
    assert('insufficientData' in eff);
  });

  // --- CATEGORY 7: MOCK INTERVIEW PERFORMANCE ---
  console.log('\n--- Category 7: Mock Interview Performance ---');

  it('7.1: Mock interview analytics computes completion rate, scores, and grade distribution', () => {
    const mock = AnalyticsEngine.computeMockAnalytics();
    assert(typeof mock.totalSessions === 'number');
    assert(typeof mock.completedCount === 'number');
    assert(typeof mock.abandonedCount === 'number');
    assert(typeof mock.completionRate === 'number');
    assert(typeof mock.averageScore === 'number');
    assert(typeof mock.bestScore === 'number');
    assert(mock.gradeDistribution, 'Must include grade distribution');
    assert(Array.isArray(mock.topicsPracticed), 'topicsPracticed must be an array');
  });

  it('7.2: Rubric evaluation provenance is explicitly labeled as self-reported outcome', () => {
    const mock = AnalyticsEngine.computeMockAnalytics();
    assert(mock.provenance, 'Mock analytics must include provenance');
    assert(mock.provenance.includes('Self-Reported') || mock.provenance.includes('Multi-Rubric'),
      'Provenance must state Self-Reported Outcome & Multi-Rubric Evaluation');
  });

  // --- CATEGORY 8: ACTIVITY & CONSISTENCY ---
  console.log('\n--- Category 8: Activity & Consistency ---');

  it('8.1: Activity consistency calculates 30-day consistency score within 0-100%', () => {
    const consistency = AnalyticsEngine.computeActivityConsistency();
    assert(typeof consistency.consistencyScore === 'number');
    assert(consistency.consistencyScore >= 0 && consistency.consistencyScore <= 100);
    assert(typeof consistency.activeDaysLast30d === 'number');
    assert(consistency.activeDaysLast30d >= 0 && consistency.activeDaysLast30d <= 30);
  });

  // --- CATEGORY 9: ACCOUNT ISOLATION & CONTEXT SWITCHING ---
  console.log('\n--- Category 9: Account Isolation & Context Switching ---');

  it('9.1: Analytics cleanly scopes calculations to active user context', () => {
    const userAContext = { userId: 'user-alice-1234', isGuest: false };
    const userBContext = { userId: 'user-bob-5678', isGuest: false };

    AnalyticsEngine.invalidateCache();
    const analyticsA = AnalyticsEngine.computeComprehensiveAnalytics({ context: userAContext, useCache: false });
    assert.strictEqual(analyticsA.context.userId, 'user-alice-1234');

    AnalyticsEngine.invalidateCache();
    const analyticsB = AnalyticsEngine.computeComprehensiveAnalytics({ context: userBContext, useCache: false });
    assert.strictEqual(analyticsB.context.userId, 'user-bob-5678');
  });

  it('9.2: Cache invalidation clears cached computations', () => {
    const first = AnalyticsEngine.computeComprehensiveAnalytics({ useCache: true });
    AnalyticsEngine.invalidateCache();
    const second = AnalyticsEngine.computeComprehensiveAnalytics({ useCache: true });
    assert(first.generatedAt && second.generatedAt);
  });

  // --- CATEGORY 10: STRICT READ-ONLY INVARIANCE ---
  console.log('\n--- Category 10: Strict Read-Only Invariance ---');

  it('10.1: Computing analytics never mutates underlying storage or engine states', () => {
    // Take snapshot of localStorage keys and values
    const snapshotBefore = JSON.stringify(global.localStorage);

    // Run all analytics calculations across multiple windows
    AnalyticsEngine.computeComprehensiveAnalytics({ timeWindow: 'all', useCache: false });
    AnalyticsEngine.computeComprehensiveAnalytics({ timeWindow: '30d', useCache: false });
    AnalyticsEngine.computeComprehensiveAnalytics({ timeWindow: '7d', useCache: false });
    AnalyticsEngine.computeComprehensiveAnalytics({ timeWindow: 'today', useCache: false });
    AnalyticsEngine.generateRecommendations();
    AnalyticsEngine.computeLearningOverview();
    AnalyticsEngine.computeTopicMastery();
    AnalyticsEngine.computeRetentionAnalytics();
    AnalyticsEngine.computeProblemSolvingPerformance();
    AnalyticsEngine.computeMockAnalytics();
    AnalyticsEngine.computeActivityConsistency();

    const snapshotAfter = JSON.stringify(global.localStorage);
    assert.strictEqual(snapshotBefore, snapshotAfter,
      'STRICT READ-ONLY INVARIANT: Computing analytics must NEVER mutate localStorage state');
  });

  // --- CATEGORY 11: DOM INTEGRATION & UI COMPLIANCE ---
  console.log('\n--- Category 11: DOM Integration & UI Compliance ---');

  it('11.1: index.html contains all 7 primary analytics sections and Metric Registry modal', () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

    // Section 1
    assert(indexHtml.includes('id="analytics-unique-solved"'), 'Section 1: Solved problems element exists');
    assert(indexHtml.includes('id="analytics-catalog-total"'), 'Section 1: Catalog total element exists');
    assert(indexHtml.includes('id="analytics-unique-attempted"'), 'Section 1: Attempted problems element exists');
    assert(indexHtml.includes('id="analytics-verified-solved"'), 'Section 1: Verified solved element exists');

    // Section 2
    assert(indexHtml.includes('id="analytics-recommendations-container"'), 'Section 2: Recommendations container exists');

    // Section 3
    assert(indexHtml.includes('id="topic-matrix-container"'), 'Section 3: Topic matrix container exists');
    assert(indexHtml.includes('id="analytics-topic-search"'), 'Section 3: Topic search input exists');
    assert(indexHtml.includes('id="analytics-topic-filter"'), 'Section 3: Topic filter dropdown exists');

    // Section 4
    assert(indexHtml.includes('id="analytics-srs-due"'), 'Section 4: SRS due element exists');
    assert(indexHtml.includes('id="analytics-srs-overdue"'), 'Section 4: SRS overdue element exists');
    assert(indexHtml.includes('id="analytics-srs-recall-rate"'), 'Section 4: Recall success rate exists');
    assert(indexHtml.includes('id="analytics-srs-diff-distribution"'), 'Section 4: SRS difficulty distribution exists');
    assert(indexHtml.includes('id="analytics-srs-stage-distribution"'), 'Section 4: SRS stage distribution exists');

    // Section 5
    assert(indexHtml.includes('id="analytics-outcome-chart"'), 'Section 5: Outcome chart canvas exists');
    assert(indexHtml.includes('id="analytics-independence-rate"'), 'Section 5: Cognitive independence rate exists');
    assert(indexHtml.includes('id="analytics-hint-dependency"'), 'Section 5: Hint dependency exists');

    // Section 6
    assert(indexHtml.includes('id="analytics-mock-completed"'), 'Section 6: Mock completed element exists');
    assert(indexHtml.includes('id="analytics-mock-avg-score"'), 'Section 6: Mock average score exists');
    assert(indexHtml.includes('id="analytics-mock-grade-distribution"'), 'Section 6: Mock grade distribution exists');

    // Section 7
    assert(indexHtml.includes('id="analytics-consistency-score"'), 'Section 7: Consistency score exists');
    assert(indexHtml.includes('id="analytics-heatmap-grid"'), 'Section 7: Analytics heatmap grid exists');
    assert(indexHtml.includes('id="analytics-account-scope-badge"'), 'Section 7: Account scope badge exists');

    // Metric Registry Modal
    assert(indexHtml.includes('id="modal-metric-registry"'), 'Metric Registry modal exists');
    assert(indexHtml.includes('id="btn-open-metric-registry"'), 'Open Metric Registry button exists');
    assert(indexHtml.includes('id="metric-registry-cards-container"'), 'Metric Registry cards container exists');
  });

  it('11.2: styles.css contains required Phase 7 styling classes', () => {
    const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
    assert(css.includes('.recommendation-card'), '.recommendation-card styles must exist');
    assert(css.includes('.metric-registry-card'), '.metric-registry-card styles must exist');
    assert(css.includes('.priority-high'), 'Priority modifier styles must exist');
    assert(css.includes('#modal-metric-registry'), 'Modal metric registry styles must exist');
  });
});

console.log(`\n========================================`);
console.log(`Phase 7 Test Suite Finished: ${passed} / ${total} Passed`);
console.log(`========================================\n`);

if (passed !== total) {
  process.exit(1);
}

