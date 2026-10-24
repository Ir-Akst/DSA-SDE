/**
 * AlgoRecall 2.2 - Intelligence Evaluation & Optimization Experiment Suite
 * Runs offline simulation across 10 learner profiles and outputs comprehensive benchmark metrics.
 */

const fs = require('fs');
const path = require('path');
const { LearnerSimulationHarness, LEARNER_PROFILES } = require('../test/simulation-framework');

async function runIntelligenceEvaluation() {
  console.log('======================================================================');
  console.log('🧠 AlgoRecall 2.2 — Adaptive Intelligence Evaluation Suite Initializing');
  console.log('======================================================================');

  const harness = new LearnerSimulationHarness();
  const profileKeys = Object.keys(LEARNER_PROFILES);
  console.log(`[SIM] Initializing 21-day trajectories across ${profileKeys.length} diverse learner profiles...`);

  const trajectories = [];
  profileKeys.forEach(key => {
    const profile = LEARNER_PROFILES[key];
    process.stdout.write(`  -> Simulating "${profile.name}" (seed: ${profile.seed})... `);
    const res = harness.simulateLearnerTrajectory(profile, 21);
    trajectories.push(res);
    console.log(`Done (${res.dailyLogs.length} days, final readiness: ${res.finalReadiness.score}%)`);
  });

  // --- PHASE 2: RECOMMENDATION QUALITY EVALUATION ---
  console.log('\n[EVAL 2] Recommendation Quality Audit (Learn & Topic Revision)');
  const recQuality = harness.evaluateRecommendationQuality(trajectories);
  console.log(`  - Total Daily Plans Evaluated: ${recQuality.totalEvaluatedPlans}`);
  console.log(`  - Today's Learning Cards Evaluated: ${recQuality.totalLearnCards}`);
  console.log(`  - Today's Learning Topic Match Rate: ${recQuality.learnTopicMatchRate}%`);
  console.log(`  - Topic Revision Cards Evaluated: ${recQuality.totalTopicRevCards}`);
  console.log(`  - Topic Revision Topic Match Rate: ${recQuality.topicRevMatchRate}%`);
  console.log(`  - Cross-Section Problem Duplicates: ${recQuality.crossSectionDuplicates} (Target: 0)`);
  console.log(`  - Difficulty Distribution: Easy: ${recQuality.difficultyDistribution.Easy}, Medium: ${recQuality.difficultyDistribution.Medium}, Hard: ${recQuality.difficultyDistribution.Hard}`);

  // --- PHASE 3: SRS SCHEDULING VALIDATION ---
  console.log('\n[EVAL 3] Authoritative SRS Scheduling Validation (Controlled Clocks)');
  const srsEval = harness.evaluateSRSScheduling();
  srsEval.results.forEach(r => {
    console.log(`  ${r.passed ? '✓' : '✗'} ${r.test}`);
  });
  console.log(`  - SRS Scheduling Invariants Passed: ${srsEval.allPassed ? 'ALL PASS' : 'FAILURES DETECTED'}`);

  // --- PHASE 4: READINESS CALIBRATION & PROVISIONAL STATUS ---
  console.log('\n[EVAL 4] Interview Readiness Calibration Audit (Two-Factor Evidence)');
  const readinessEval = harness.evaluateReadinessCalibration();
  readinessEval.results.forEach(r => {
    console.log(`  ${r.passed ? '✓' : '✗'} ${r.scenario}: Score ${r.score}% | Provisional: ${r.isProvisional} | Delayed: ${r.delayedScore || 0}%`);
  });
  console.log(`  - Readiness Calibration Invariants Passed: ${readinessEval.allPassed ? 'ALL PASS' : 'FAILURES DETECTED'}`);

  // --- PHASE 5: DYNAMIC ROADMAP HORIZON ACCURACY ---
  console.log('\n[EVAL 5] Dynamic Roadmap Horizon Accuracy & Workload Reduction');
  const horizonEval = harness.evaluateRoadmapHorizonAccuracy(trajectories);
  horizonEval.horizonAudits.forEach(a => {
    console.log(`  ${a.passed ? '✓' : '✗'} ${a.learnerName}: Initial ~${a.initialWeeksRemaining} wks -> Final ~${a.finalWeeksRemaining} wks | Workload reduced: ${a.workloadReduced} problems`);
  });
  console.log(`  - Dynamic Horizon Monotonicity Passed: ${horizonEval.allPassed ? 'ALL PASS' : 'FAILURES DETECTED'}`);

  // --- PHASE 6: SRS BACKLOG ALLOCATION EXPERIMENT ---
  console.log('\n[EVAL 6] Session Allocation Policy Experiment (Policies A vs B vs C)');
  const allocationComparison = harness.runAllocationPolicyComparison();
  console.table(allocationComparison);

  console.log('\n======================================================================');
  console.log('✅ Intelligence Evaluation Completed Successfully');
  console.log('======================================================================');

  // Write full raw results to scratch
  const scratchDir = process.env.SCRATCH_DIR || path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const summaryData = {
    timestamp: new Date().toISOString(),
    profilesCount: profileKeys.length,
    recommendationQuality: recQuality,
    srsEvaluation: srsEval,
    readinessEvaluation: readinessEval,
    horizonEvaluation: horizonEval,
    allocationComparison
  };
  fs.writeFileSync(path.join(scratchDir, 'intelligence-eval-summary.json'), JSON.stringify(summaryData, null, 2));
}

runIntelligenceEvaluation().catch(err => {
  console.error('❌ Error during intelligence evaluation:', err);
  process.exit(1);
});
