/**
 * AlgoRecall 2.2 - Deterministic Learner Simulation & Intelligence Evaluation Framework
 *
 * Implements an offline, reproducible evaluation harness for:
 * - 10 Diverse Learner Profiles with seeded PRNG (Mulberry32).
 * - Multi-day simulated trajectories under controlled virtual clocks.
 * - Recommendation Quality Evaluation (Learn & Topic Revision).
 * - Authoritative SRS Scheduling Validation (controlled clock experiments).
 * - Readiness Calibration & Two-Factor Evidence Threshold Auditing.
 * - Dynamic Roadmap Horizon Accuracy (Predicted vs Simulated Actual Effort).
 * - SRS Backlog Allocation Policy Experiment (Policy A vs B vs C).
 *
 * Completely isolated from LocalStorage and production learner progress.
 */

const DEFAULT_DSA_SHEETS = require('../js/data/default-sheets');
const RoadmapEngine = require('../js/roadmap-engine');
const SRSEngine = require('../js/srs-engine');
const ReadinessEngine = require('../js/readiness-engine');
const FailureEngine = require('../js/failure-engine');
const RecommendationEngine = require('../js/recommendation-engine');
const AdaptiveLearningEngine = require('../js/adaptive-learning-engine');
const GraphEngine = require('../js/graph-engine');

// --- DETERMINISTIC PRNG (Mulberry32) ---
function createPRNG(seed = 1337) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- 10 LEARNER PROFILES ---
const LEARNER_PROFILES = {
  // 1. Beginner: low confidence, limited solved problems, slower pace
  beginner: {
    id: 'beginner',
    name: 'Beginner Learner',
    description: 'Foundations stage: low initial confidence, slower solving speed, higher initial failure rate',
    seed: 101,
    dailyMinutes: 60,
    weeklyStudyDays: 3,
    baseSkill: 0.35,
    difficultySuccess: { Easy: 0.70, Medium: 0.30, Hard: 0.05 },
    hintUsageRate: 0.30,
    averageSolveTimeMultiplier: 1.3,
    studyRegularity: 0.90,
    preferredLearningTopic: 'Arrays & Hashing',
    preferredRevisionTopic: 'Arrays & Hashing'
  },

  // 2. Fast Learner: rapidly improves across difficulties, high independent success
  fast_learner: {
    id: 'fast_learner',
    name: 'Fast Learner',
    description: 'Accelerated progression: high independent success, minimal hint reliance, fast pace',
    seed: 202,
    dailyMinutes: 120,
    weeklyStudyDays: 6,
    baseSkill: 0.85,
    difficultySuccess: { Easy: 0.98, Medium: 0.88, Hard: 0.65 },
    hintUsageRate: 0.05,
    averageSolveTimeMultiplier: 0.75,
    studyRegularity: 0.95,
    preferredLearningTopic: 'Dynamic Programming',
    preferredRevisionTopic: 'Binary Trees & BST'
  },

  // 3. Inconsistent Learner: irregular study days, gaps between sessions
  inconsistent: {
    id: 'inconsistent',
    name: 'Inconsistent Learner',
    description: 'Sporadic attendance: skips multiple days between sessions, accumulating SRS recall gaps',
    seed: 303,
    dailyMinutes: 90,
    weeklyStudyDays: 2,
    baseSkill: 0.55,
    difficultySuccess: { Easy: 0.85, Medium: 0.55, Hard: 0.20 },
    hintUsageRate: 0.20,
    averageSolveTimeMultiplier: 1.1,
    studyRegularity: 0.50, // 50% chance of missing planned day
    preferredLearningTopic: 'Sliding Window & Two Pointers',
    preferredRevisionTopic: 'Stack & Queue'
  },

  // 4. Struggling Learner: repeated failures in specific patterns
  struggling: {
    id: 'struggling',
    name: 'Struggling Learner',
    description: 'Persistent bottlenecks: struggles specifically with complex patterns and recursive algorithms',
    seed: 404,
    dailyMinutes: 60,
    weeklyStudyDays: 4,
    baseSkill: 0.30,
    difficultySuccess: { Easy: 0.65, Medium: 0.25, Hard: 0.05 },
    hintUsageRate: 0.45,
    averageSolveTimeMultiplier: 1.4,
    studyRegularity: 0.85,
    preferredLearningTopic: 'Dynamic Programming',
    preferredRevisionTopic: 'Binary Trees & BST'
  },

  // 5. Returning Learner: long inactivity gap with accumulated due reviews
  returning: {
    id: 'returning',
    name: 'Returning Learner',
    description: 'Re-entry after hiatus: 30-day simulated break creating a large overdue recall backlog',
    seed: 505,
    dailyMinutes: 90,
    weeklyStudyDays: 5,
    baseSkill: 0.60,
    difficultySuccess: { Easy: 0.85, Medium: 0.60, Hard: 0.25 },
    hintUsageRate: 0.20,
    averageSolveTimeMultiplier: 1.0,
    studyRegularity: 0.90,
    preferredLearningTopic: 'Binary Search',
    preferredRevisionTopic: 'Linked List',
    initialHiatusDays: 28
  },

  // 6. Revision-Heavy Learner: large problem catalog solved, high daily SRS burden
  revision_heavy: {
    id: 'revision_heavy',
    name: 'Revision-Heavy Learner',
    description: 'High maintenance: many previously solved problems requiring frequent spaced retrieval',
    seed: 606,
    dailyMinutes: 120,
    weeklyStudyDays: 5,
    baseSkill: 0.70,
    difficultySuccess: { Easy: 0.92, Medium: 0.75, Hard: 0.40 },
    hintUsageRate: 0.12,
    averageSolveTimeMultiplier: 0.95,
    studyRegularity: 0.95,
    preferredLearningTopic: 'Graphs',
    preferredRevisionTopic: 'all_due',
    prepopulateSolvedCount: 40
  },

  // 7. Interview-Focused Learner: uneven topic mastery (mastered few topics, zero in others)
  interview_focused: {
    id: 'interview_focused',
    name: 'Interview-Focused Learner',
    description: 'Asymmetric preparation: heavy concentration on Arrays & Strings; zero coverage in Graphs & DP',
    seed: 707,
    dailyMinutes: 120,
    weeklyStudyDays: 5,
    baseSkill: 0.65,
    difficultySuccess: { Easy: 0.90, Medium: 0.70, Hard: 0.35 },
    hintUsageRate: 0.15,
    averageSolveTimeMultiplier: 1.0,
    studyRegularity: 0.90,
    preferredLearningTopic: 'Arrays & Hashing',
    preferredRevisionTopic: 'Strings'
  },

  // 8. Hint-Dependent Learner: frequent assistance, low independent solving
  hint_dependent: {
    id: 'hint_dependent',
    name: 'Hint-Dependent Learner',
    description: 'Editorial reliance: achieves high apparent solve rate but relies heavily on hints',
    seed: 808,
    dailyMinutes: 60,
    weeklyStudyDays: 4,
    baseSkill: 0.50,
    difficultySuccess: { Easy: 0.90, Medium: 0.75, Hard: 0.45 },
    hintUsageRate: 0.75, // 75% hint reliance
    averageSolveTimeMultiplier: 1.1,
    studyRegularity: 0.90,
    preferredLearningTopic: 'Sliding Window & Two Pointers',
    preferredRevisionTopic: 'Sliding Window & Two Pointers'
  },

  // 9. Strong Learner: independently solves Hard questions, low times, high retention
  strong: {
    id: 'strong',
    name: 'Strong Learner',
    description: 'Senior candidate: independent solving of Hard problems with minimal hints and fast velocity',
    seed: 909,
    dailyMinutes: 120,
    weeklyStudyDays: 6,
    baseSkill: 0.95,
    difficultySuccess: { Easy: 0.99, Medium: 0.95, Hard: 0.85 },
    hintUsageRate: 0.02,
    averageSolveTimeMultiplier: 0.65,
    studyRegularity: 0.98,
    preferredLearningTopic: 'Graphs',
    preferredRevisionTopic: 'Dynamic Programming'
  },

  // 10. Mixed Learner: realistic human variation across skill, consistency and difficulty
  mixed: {
    id: 'mixed',
    name: 'Mixed / Realistic Learner',
    description: 'Representative benchmark: balanced human behavior with normal skill spread and occasional slips',
    seed: 1010,
    dailyMinutes: 90,
    weeklyStudyDays: 5,
    baseSkill: 0.60,
    difficultySuccess: { Easy: 0.88, Medium: 0.62, Hard: 0.28 },
    hintUsageRate: 0.18,
    averageSolveTimeMultiplier: 1.0,
    studyRegularity: 0.85,
    preferredLearningTopic: 'Binary Trees & BST',
    preferredRevisionTopic: 'Sliding Window & Two Pointers'
  }
};

class LearnerSimulationHarness {
  constructor(options = {}) {
    this.catalog = Array.isArray(options.catalog) ? options.catalog : DEFAULT_DSA_SHEETS;
    this.epoch = options.startEpoch ? new Date(options.startEpoch).getTime() : Date.parse('2026-10-01T09:00:00.000Z');
  }

  /**
   * Run multi-day simulation for a specific learner profile
   */
  simulateLearnerTrajectory(profile, daysCount = 21, overrideOptions = {}) {
    const rng = createPRNG(profile.seed);
    const userStates = {};
    const dailyLogs = [];
    let currentVirtualTime = this.epoch;

    // Pre-populate history if profile specifies
    if (profile.prepopulateSolvedCount && profile.prepopulateSolvedCount > 0) {
      const candidates = this.catalog.slice(0, profile.prepopulateSolvedCount);
      candidates.forEach((p, idx) => {
        const solveDaysAgo = Math.floor(rng() * 20) + 10;
        const solveTime = new Date(currentVirtualTime - solveDaysAgo * 86400000).toISOString();
        const stage = Math.floor(rng() * 3) + 1;
        const interval = stage === 1 ? 1 : stage === 2 ? 3 : 7;
        const nextReview = new Date(new Date(solveTime).getTime() + interval * 86400000).toISOString();

        userStates[p.id] = {
          stage: stage,
          interval: interval,
          intervalDays: interval,
          lastReviewed: solveTime,
          nextReviewDate: nextReview,
          confidence: Math.floor(rng() * 2) + 3,
          hintsUsed: false,
          totalTimeSpent: 25,
          reviewCount: 1,
          history: [{
            date: solveTime,
            rating: 'simple',
            confidence: 4,
            hintsUsed: false,
            timeSpentMinutes: 25
          }]
        };
      });
    }

    if (profile.initialHiatusDays && profile.initialHiatusDays > 0) {
      const initialProblems = this.catalog.slice(0, 15);
      initialProblems.forEach(p => {
        const solvedDate = new Date(currentVirtualTime - (profile.initialHiatusDays + 5) * 86400000).toISOString();
        const nextReviewDate = new Date(currentVirtualTime - (profile.initialHiatusDays - 3) * 86400000).toISOString();
        userStates[p.id] = {
          stage: 2,
          interval: 3,
          intervalDays: 3,
          lastReviewed: solvedDate,
          nextReviewDate: nextReviewDate,
          confidence: 3,
          hintsUsed: false,
          totalTimeSpent: 30,
          reviewCount: 1,
          history: [{
            date: solvedDate,
            rating: 'medium',
            confidence: 3,
            hintsUsed: false,
            timeSpentMinutes: 30
          }]
        };
      });
    }

    let learningTopic = profile.preferredLearningTopic;
    let revisionTopic = profile.preferredRevisionTopic;
    const dailyMinutes = overrideOptions.dailyMinutes || profile.dailyMinutes;
    const weeklyStudyDays = overrideOptions.weeklyStudyDays || profile.weeklyStudyDays;

    for (let day = 1; day <= daysCount; day++) {
      const virtualDate = new Date(currentVirtualTime);
      const isRestDay = (day % 7) > weeklyStudyDays || (rng() > profile.studyRegularity);

      if (isRestDay) {
        dailyLogs.push({
          day,
          virtualDate: virtualDate.toISOString(),
          isRestDay: true,
          plan: null,
          attempts: []
        });
        currentVirtualTime += 86400000;
        continue;
      }

      const planOptions = {
        asOfDate: virtualDate,
        learningTopic: learningTopic,
        revisionTopic: revisionTopic,
        allocationPolicy: overrideOptions.allocationPolicy || 'A'
      };

      const plan = RoadmapEngine.getDailyDSAPlan(
        null,
        dailyMinutes,
        this.catalog,
        userStates,
        planOptions
      );

      const dayAttempts = [];

      // 1. Spaced Revision attempts
      const spacedTasks = plan.spacedRevision?.problems || [];
      spacedTasks.forEach(p => {
        const attempt = this._simulateProblemAttempt(p, profile, rng, true, false, virtualDate);
        this._recordAttemptInState(userStates, p, attempt, virtualDate);
        dayAttempts.push(attempt);
      });

      // 2. Today's Learning attempts
      const learnTasks = plan.learn?.problems || [];
      learnTasks.forEach(p => {
        const attempt = this._simulateProblemAttempt(p, profile, rng, false, false, virtualDate);
        this._recordAttemptInState(userStates, p, attempt, virtualDate);
        dayAttempts.push(attempt);
      });

      // 3. Topic Revision attempts
      const topicRevTasks = plan.topicRevision?.problems || [];
      topicRevTasks.forEach(p => {
        const attempt = this._simulateProblemAttempt(p, profile, rng, false, true, virtualDate);
        this._recordAttemptInState(userStates, p, attempt, virtualDate);
        dayAttempts.push(attempt);
      });

      const readinessSnapshot = ReadinessEngine.calculateReadiness(this.catalog, userStates, []);
      const dynamicHorizonSnapshot = RoadmapEngine.calculateDynamicRoadmap(this.catalog, userStates, {
        dailyMinutes,
        weeklyStudyDays,
        asOfDate: virtualDate,
        learningTopic,
        revisionTopic
      });

      dailyLogs.push({
        day,
        virtualDate: virtualDate.toISOString(),
        isRestDay: false,
        learningTopic,
        revisionTopic,
        plan: {
          learnProblems: learnTasks.map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty })),
          topicRevProblems: topicRevTasks.map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty })),
          spacedRevProblems: spacedTasks.map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty, isOverdue: p.isOverdue })),
          totalPlanned: learnTasks.length + topicRevTasks.length + spacedTasks.length,
          timeAllocation: plan.timeAllocation,
          dueTotal: plan.spacedRevision?.dueTotal || 0,
          backlogCount: plan.spacedRevision?.backlogCount || 0
        },
        attempts: dayAttempts,
        readiness: {
          score: readinessSnapshot.score,
          isProvisional: readinessSnapshot.isProvisional,
          delayedRecallScore: readinessSnapshot.breakdown?.delayedRecall?.score
        },
        horizon: {
          weeksRemaining: dynamicHorizonSnapshot.weeksRemaining,
          weeksRange: dynamicHorizonSnapshot.weeksRange,
          remainingWorkload: dynamicHorizonSnapshot.metrics?.remainingWorkload
        }
      });

      currentVirtualTime += 86400000;
    }

    return {
      profile,
      daysCount,
      dailyLogs,
      finalUserStates: userStates,
      finalReadiness: ReadinessEngine.calculateReadiness(this.catalog, userStates, []),
      finalHorizon: RoadmapEngine.calculateDynamicRoadmap(this.catalog, userStates, {
        dailyMinutes,
        weeklyStudyDays,
        asOfDate: new Date(currentVirtualTime),
        learningTopic,
        revisionTopic
      })
    };
  }

  _simulateProblemAttempt(problem, profile, rng, isSpaced, isTopicPractice, virtualDate) {
    const diffProb = profile.difficultySuccess[problem.difficulty] || 0.50;
    const roll = rng();

    let outcome = 'independent';
    let hintsUsed = false;
    let rating = 'simple';
    let confidence = 4;

    if (roll > diffProb) {
      if (rng() < profile.hintUsageRate) {
        outcome = 'hints';
        hintsUsed = true;
        rating = 'medium';
        confidence = 3;
      } else {
        outcome = 'failed';
        hintsUsed = false;
        rating = 'failed';
        confidence = 1;
      }
    } else {
      if (rng() < profile.hintUsageRate * 0.3) {
        outcome = 'hints';
        hintsUsed = true;
        rating = 'medium';
        confidence = 3;
      } else {
        outcome = 'independent';
        hintsUsed = false;
        rating = rng() > 0.3 ? 'simple' : 'medium';
        confidence = rating === 'simple' ? 5 : 4;
      }
    }

    const baseMin = problem.difficulty === 'Easy' ? 15 : problem.difficulty === 'Medium' ? 30 : 45;
    const timeSpent = Math.max(5, Math.round(baseMin * profile.averageSolveTimeMultiplier * (0.8 + rng() * 0.4)));

    return {
      problemId: problem.id,
      problemTitle: problem.title,
      topic: problem.topic,
      difficulty: problem.difficulty,
      isSpaced,
      isTopicPractice,
      outcome,
      rating,
      confidence,
      hintsUsed,
      timeSpentMinutes: timeSpent,
      timestamp: virtualDate.toISOString()
    };
  }

  _recordAttemptInState(userStates, problem, attempt, virtualDate) {
    const currState = userStates[problem.id] || {};
    userStates[problem.id] = SRSEngine.processReview(
      currState,
      attempt.rating,
      attempt.timeSpentMinutes,
      `Simulated: ${attempt.outcome}`,
      attempt.confidence,
      {
        hintsUsed: attempt.hintsUsed,
        isTopicPractice: attempt.isTopicPractice,
        today: virtualDate
      }
    );
  }

  evaluateRecommendationQuality(trajectories) {
    let totalLearnCards = 0;
    let matchingLearnCards = 0;
    let totalTopicRevCards = 0;
    let matchingTopicRevCards = 0;
    let crossSectionDuplicates = 0;

    const diffCounts = { Easy: 0, Medium: 0, Hard: 0 };

    trajectories.forEach(t => {
      t.dailyLogs.forEach(day => {
        if (!day.plan) return;
        const learnIds = day.plan.learnProblems.map(p => p.id);
        const topicRevIds = day.plan.topicRevProblems.map(p => p.id);
        const spacedIds = day.plan.spacedRevProblems.map(p => p.id);

        const allIds = [...learnIds, ...topicRevIds, ...spacedIds];
        const uniqueIds = new Set(allIds);
        if (allIds.length !== uniqueIds.size) {
          crossSectionDuplicates += (allIds.length - uniqueIds.size);
        }

        const targetLearnTopic = day.learningTopic ? day.learningTopic.toLowerCase() : '';
        day.plan.learnProblems.forEach(p => {
          totalLearnCards++;
          diffCounts[p.difficulty] = (diffCounts[p.difficulty] || 0) + 1;
          const fullProblem = this.catalog.find(item => item.id === p.id);
          const canon = SRSEngine.canonicalizeTopic(fullProblem?.topic || '').toLowerCase();
          if (canon === targetLearnTopic || targetLearnTopic === 'mixed') {
            matchingLearnCards++;
          }
        });

        const targetRevTopic = day.revisionTopic ? day.revisionTopic.toLowerCase() : '';
        day.plan.topicRevProblems.forEach(p => {
          totalTopicRevCards++;
          const fullProblem = this.catalog.find(item => item.id === p.id);
          const canon = SRSEngine.canonicalizeTopic(fullProblem?.topic || '').toLowerCase();
          if (canon === targetRevTopic || targetRevTopic === 'all_due') {
            matchingTopicRevCards++;
          }
        });
      });
    });

    const learnTopicMatchRate = totalLearnCards > 0 ? (matchingLearnCards / totalLearnCards) * 100 : 100;
    const topicRevMatchRate = totalTopicRevCards > 0 ? (matchingTopicRevCards / totalTopicRevCards) * 100 : 100;

    return {
      totalEvaluatedPlans: trajectories.reduce((sum, t) => sum + t.dailyLogs.filter(d => d.plan).length, 0),
      totalLearnCards,
      learnTopicMatchRate: Number(learnTopicMatchRate.toFixed(2)),
      totalTopicRevCards,
      topicRevMatchRate: Number(topicRevMatchRate.toFixed(2)),
      crossSectionDuplicates,
      difficultyDistribution: diffCounts
    };
  }

  evaluateSRSScheduling(options = {}) {
    const controlledNow = new Date('2026-10-15T10:00:00.000Z');
    const results = [];

    // Test 1: Review before due date
    const cardPreDue = {
      stage: 2,
      interval: 3,
      intervalDays: 3,
      lastReviewed: new Date('2026-10-14T08:00:00.000Z').toISOString(),
      nextReviewDate: '2026-10-17',
      history: [{ date: '2026-10-14T08:00:00.000Z', rating: 'simple' }]
    };
    const resPreDue = SRSEngine.processReview(cardPreDue, 'simple', 15, 'Early Practice', 5, { isTopicPractice: true, today: controlledNow });
    results.push({
      test: 'Review before due date preserves stage without leap',
      passed: resPreDue.stage === 2 && resPreDue.intervalDays === 3
    });

    // Test 2: Review on/after due date
    const cardDue = {
      stage: 2,
      interval: 3,
      intervalDays: 3,
      lastReviewed: new Date('2026-10-10T08:00:00.000Z').toISOString(),
      nextReviewDate: '2026-10-13',
      history: [{ date: '2026-10-10T08:00:00.000Z', rating: 'simple' }]
    };
    const resDue = SRSEngine.processReview(cardDue, 'simple', 15, 'Genuine Due Recall', 5, { today: controlledNow });
    results.push({
      test: 'Review on/after due date advances Leitner stage',
      passed: resDue.stage === 3 && resDue.intervalDays > 3
    });

    // Test 3: Failure reset
    const cardHighStage = {
      stage: 4,
      interval: 14,
      intervalDays: 14,
      lastReviewed: new Date('2026-09-20T08:00:00.000Z').toISOString(),
      nextReviewDate: '2026-10-04',
      history: [{ date: '2026-09-20T08:00:00.000Z', rating: 'simple' }]
    };
    const resFail = SRSEngine.processReview(cardHighStage, 'failed', 30, 'Lapsed Recall', 1, { today: controlledNow });
    results.push({
      test: 'Failure resets Leitner stage to 1 and interval to 1',
      passed: resFail.stage === 1 && resFail.intervalDays === 1 && resFail.lastRating === 'failed'
    });

    // Test 4: Topic Revision non-due practice preserves future nextReviewDate
    const cardTopicRev = {
      stage: 2,
      interval: 5,
      intervalDays: 5,
      lastReviewed: new Date('2026-10-14T08:00:00.000Z').toISOString(),
      nextReviewDate: '2026-10-19',
      history: [{ date: '2026-10-14T08:00:00.000Z', rating: 'simple' }]
    };
    const resTopicRev = SRSEngine.processReview(cardTopicRev, 'simple', 20, 'Topic Practice', 5, {
      isTopicPractice: true,
      today: controlledNow
    });
    results.push({
      test: 'Topic Revision practice does not alter future nextReviewDate or stage',
      passed: resTopicRev.stage === 2 && resTopicRev.nextReviewDate === '2026-10-19'
    });

    return {
      allPassed: results.every(r => r.passed),
      results
    };
  }

  evaluateReadinessCalibration() {
    const results = [];

    // 1. Fresh learner (0 attempts)
    const fresh = ReadinessEngine.calculateReadiness(this.catalog, {}, []);
    results.push({
      scenario: 'Fresh Learner (0 attempts)',
      score: fresh.score,
      isProvisional: fresh.isProvisional,
      delayedRecall: fresh.breakdown.delayedRecall.score,
      passed: fresh.isProvisional === true && fresh.score <= 35 && fresh.breakdown.delayedRecall.score === 0
    });

    // 2. Small sample (5 attempts, 0 spaced reviews)
    const smallStates = {};
    for (let i = 0; i < 5; i++) {
      const p = this.catalog[i];
      smallStates[p.id] = {
        lastReviewed: new Date().toISOString(),
        confidence: 5,
        hintsUsed: false,
        lastRating: 'simple',
        totalTimeSpent: 15,
        reviewCount: 1,
        history: [{ date: new Date().toISOString(), rating: 'simple', confidence: 5 }]
      };
    }
    const smallSample = ReadinessEngine.calculateReadiness(this.catalog, smallStates, []);
    results.push({
      scenario: 'Small Sample (5 attempts, 0 spaced)',
      score: smallSample.score,
      isProvisional: smallSample.isProvisional,
      passed: smallSample.isProvisional === true && smallSample.breakdown.delayedRecall.score === 0
    });

    // 3. High attempt count (20 attempts) but 0 delayed recall
    const highAttemptStates = {};
    for (let i = 0; i < 20; i++) {
      const p = this.catalog[i];
      highAttemptStates[p.id] = {
        lastReviewed: new Date().toISOString(),
        confidence: 4,
        hintsUsed: false,
        lastRating: 'simple',
        totalTimeSpent: 20,
        reviewCount: 1,
        history: [{ date: new Date().toISOString(), rating: 'simple', confidence: 4 }]
      };
    }
    const highAttempt = ReadinessEngine.calculateReadiness(this.catalog, highAttemptStates, []);
    results.push({
      scenario: 'High Attempts with 0 Spaced Reviews',
      score: highAttempt.score,
      isProvisional: highAttempt.isProvisional,
      delayedScore: highAttempt.breakdown.delayedRecall.score,
      passed: highAttempt.isProvisional === true && highAttempt.breakdown.delayedRecall.score === 0
    });

    // 4. Sufficient evidence (15 attempts, 6 genuine delayed reviews)
    const sufficientStates = { ...highAttemptStates };
    for (let i = 0; i < 6; i++) {
      const p = this.catalog[i];
      sufficientStates[p.id].history.push({
        date: new Date(Date.now() + 2 * 86400000).toISOString(),
        rating: 'simple',
        confidence: 5,
        hintsUsed: false
      });
    }
    const sufficient = ReadinessEngine.calculateReadiness(this.catalog, sufficientStates, []);
    results.push({
      scenario: 'Sufficient Evidence (15 attempts, 6 delayed reviews)',
      score: sufficient.score,
      isProvisional: sufficient.isProvisional,
      delayedScore: sufficient.breakdown.delayedRecall.score,
      passed: sufficient.isProvisional === false && sufficient.breakdown.delayedRecall.score === 100
    });

    return {
      allPassed: results.every(r => r.passed),
      results
    };
  }

  evaluateRoadmapHorizonAccuracy(trajectories) {
    const horizonAudits = [];

    trajectories.forEach(t => {
      const firstActiveDay = t.dailyLogs.find(d => d.plan && d.horizon);
      const initialEstimate = firstActiveDay?.horizon?.weeksRemaining || t.finalHorizon?.weeksRemaining || 0;
      const finalEstimate = t.finalHorizon?.weeksRemaining || 0;
      const initialWorkload = firstActiveDay?.horizon?.remainingWorkload || 0;
      const finalWorkload = t.finalHorizon?.metrics?.remainingWorkload || 0;
      const workloadReduced = Math.max(0, initialWorkload - finalWorkload);

      horizonAudits.push({
        learnerId: t.profile.id,
        learnerName: t.profile.name,
        initialWeeksRemaining: initialEstimate,
        finalWeeksRemaining: finalEstimate,
        workloadReduced,
        passed: finalEstimate <= initialEstimate || workloadReduced > 0
      });
    });

    return {
      allPassed: horizonAudits.every(a => a.passed),
      horizonAudits
    };
  }

  runAllocationPolicyComparison() {
    const baseReturningProfile = LEARNER_PROFILES.returning;
    const policies = ['A', 'B', 'C'];
    const comparisonResults = {};

    policies.forEach(pol => {
      const trajectory = this.simulateLearnerTrajectory(baseReturningProfile, 14, {
        allocationPolicy: pol
      });

      let totalDuePresented = 0;
      let totalDueCompleted = 0;
      let totalLearnCompleted = 0;
      let totalTopicRevCompleted = 0;
      let peakBacklog = 0;
      let maxReviewDelay = 0;
      let dailyCompletions = [];

      trajectory.dailyLogs.forEach(d => {
        if (!d.plan) return;
        const backlog = d.plan.backlogCount || 0;
        if (backlog > peakBacklog) peakBacklog = backlog;
        totalDuePresented += (d.plan.spacedRevProblems?.length || 0);
        d.plan.spacedRevProblems?.forEach(p => {
          if (p.overdueDays > maxReviewDelay) maxReviewDelay = p.overdueDays;
        });

        let completedInDay = 0;
        d.attempts.forEach(a => {
          if (a.isSpaced && a.outcome !== 'failed') totalDueCompleted++;
          else if (!a.isSpaced && !a.isTopicPractice && a.outcome !== 'failed') totalLearnCompleted++;
          else if (a.isTopicPractice && a.outcome !== 'failed') totalTopicRevCompleted++;
          if (a.outcome !== 'failed') completedInDay++;
        });

        if (d.plan.totalPlanned > 0) {
          dailyCompletions.push(completedInDay / d.plan.totalPlanned);
        }
      });

      const avgSessionCompletion = dailyCompletions.length > 0 
        ? (dailyCompletions.reduce((a, b) => a + b, 0) / dailyCompletions.length) * 100 
        : 100;
      const finalBacklog = trajectory.finalHorizon?.metrics?.totalDueReviews || 0;
      const sustainabilityRatio = totalLearnCompleted / Math.max(1, totalDueCompleted);

      comparisonResults[pol] = {
        policy: pol,
        totalDuePresented,
        totalDueCompleted,
        peakBacklog,
        finalBacklog,
        maxReviewDelay,
        totalLearnCompleted,
        totalTopicRevCompleted,
        avgSessionCompletion: Number(avgSessionCompletion.toFixed(1)),
        sustainabilityRatio: Number(sustainabilityRatio.toFixed(2))
      };
    });

    return comparisonResults;
  }
}

module.exports = {
  createPRNG,
  LEARNER_PROFILES,
  LearnerSimulationHarness
};
