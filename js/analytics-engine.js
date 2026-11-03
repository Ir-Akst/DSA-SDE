/**
 * AlgoRecall 2.0 — Analytics, Insights & Reporting Engine (Stage 9)
 *
 * Provides a local-first, privacy-preserving, multi-account isolated analytics layer
 * analyzing learning activity, cognitive independence, hint dependency, topic health,
 * revision adherence, and spaced repetition consistency.
 *
 * Supported environments: Universal Module (Browser IIFE + Node.js CommonJS).
 * Zero external runtime dependencies.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnalyticsEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Dependency Resolution
  function getRepo() {
    return (typeof window !== 'undefined' && window.LearnerRepository) ||
      (typeof require !== 'undefined' ? require('./learner-repository') : null);
  }

  function getSRS() {
    return (typeof window !== 'undefined' && window.SRSEngine) ||
      (typeof require !== 'undefined' ? require('./srs-engine') : null);
  }

  function getGamification() {
    return (typeof window !== 'undefined' && window.GamificationEngine) ||
      (typeof require !== 'undefined' ? require('./gamification-engine') : null);
  }

  function getMock() {
    return (typeof window !== 'undefined' && window.MockEngine) ||
      (typeof require !== 'undefined' ? require('./mock-engine') : null);
  }

  function getRoadmap() {
    return (typeof window !== 'undefined' && window.RoadmapEngine) ||
      (typeof require !== 'undefined' ? require('./roadmap-engine') : null);
  }

  function getCatalog() {
    if (typeof window !== 'undefined' && Array.isArray(window.allProblems)) {
      return window.allProblems;
    }
    try {
      if (typeof require !== 'undefined') {
        const sheets = require('./data/default-sheets');
        if (Array.isArray(sheets)) return sheets;
        if (sheets && Array.isArray(sheets.allProblems)) return sheets.allProblems;
      }
    } catch (_) {}
    return [];
  }

  // Internal Aggregation Cache: Map<cacheKey, { timestamp: number, data: Object }>
  const _cache = new Map();
  const CACHE_TTL_MS = 15000; // 15 seconds

  /**
   * Safe date parsing to local date string (YYYY-MM-DD)
   * @param {string|number|Date} dateInput
   * @returns {string}
   */
  const toLocalDateStr = (typeof CoreUtils !== 'undefined' && CoreUtils.toLocalDateStr) ||
    (typeof window !== 'undefined' && window.CoreUtils && window.CoreUtils.toLocalDateStr) ||
    function(dateInput) {
      if (!dateInput) return '';
      try {
        const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (_) {
        return '';
      }
    };

  /**
   * Filter cutoff timestamp for time windows
   * @param {string} windowKey - '7d' | '30d' | '90d' | 'year' | 'all'
   * @returns {number} Epoch timestamp threshold (0 for 'all')
   */
  function getTimeCutoff(windowKey = 'all') {
    const now = Date.now();
    switch (windowKey) {
      case '7d':
        return now - (7 * 24 * 60 * 60 * 1000);
      case '30d':
        return now - (30 * 24 * 60 * 60 * 1000);
      case '90d':
        return now - (90 * 24 * 60 * 60 * 1000);
      case 'year':
        return now - (365 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return 0;
    }
  }

  /**
   * Invalidate internal analytics cache
   */
  function invalidateCache() {
    _cache.clear();
  }

  // Register listener on context changes to auto-invalidate cache across account switches
  (function registerContextInvalidation() {
    const Repo = getRepo();
    if (Repo && typeof Repo.onContextChange === 'function') {
      Repo.onContextChange(() => {
        invalidateCache();
      });
    }
  })();

  const METRIC_REGISTRY = {
    totalCatalogProblems: {
      name: 'Total Catalog Problems',
      definition: 'Count of canonical curated algorithmic problems in default dataset.',
      sourceOfTruth: 'js/data/default-sheets.js',
      denominator: 'None (Absolute Count)',
      inclusionRules: 'All problems in curated 479-problem catalog.',
      exclusionRules: 'Custom unverified problem IDs.',
      nullHandling: 'Defaults to 479 if catalog unloaded.',
      deduplicationPolicy: 'Distinct canonical problem IDs.',
      limitations: 'Fixed to approved AlgoRecall curriculum.'
    },
    uniqueProblemsAttempted: {
      name: 'Unique Problems Attempted',
      definition: 'Distinct problem IDs with at least one recorded attempt, review, or session.',
      sourceOfTruth: 'LearnerRepository.getUserStates() & TrainerEvents & MockHistory',
      denominator: 'totalCatalogProblems',
      inclusionRules: 'Any problem with lastReviewed, history entry, trainer event, or mock answer.',
      exclusionRules: 'Viewed or bookmarked problems without solving attempts.',
      nullHandling: 'Returns 0 if no learner data exists.',
      deduplicationPolicy: 'Set of problem IDs across all learning streams.',
      limitations: 'Does not reflect attempt depth or code completeness.'
    },
    verifiedSolvedProblems: {
      name: 'Verified Solved Problems',
      definition: 'Problems confirmed solved through automated external judging or test runner execution.',
      sourceOfTruth: 'External automated judge verification records.',
      denominator: 'uniqueProblemsAttempted',
      inclusionRules: 'Explicitly verified evaluation events with verified: true.',
      exclusionRules: 'Self-reported checkmarks or manual ratings.',
      nullHandling: 'Returns 0 in offline/client-only environment.',
      deduplicationPolicy: 'Unique canonical problem IDs.',
      limitations: 'Browser client does not run untrusted arbitrary code; verified solves are strictly 0 without external judging.'
    },
    selfReportedSolvedProblems: {
      name: 'Self-Reported Solved Problems',
      definition: 'Distinct problem IDs marked solved by user via UI checkbox, SRS simple/medium, or trainer solve.',
      sourceOfTruth: 'LearnerRepository.getUserStates()[id].solved || stage >= 1',
      denominator: 'totalCatalogProblems',
      inclusionRules: 'userStates[id].solved === true OR stage >= 1 with lastRating !== failed.',
      exclusionRules: 'Unsolved problems, failed reviews, unverified external links.',
      nullHandling: 'Returns 0 if empty.',
      deduplicationPolicy: 'Distinct problem IDs.',
      limitations: 'Relies on learner honesty and self-assessment accuracy.'
    },
    recallSuccessRate: {
      name: 'Recall Success Rate',
      definition: 'Percentage of completed SRS spaced repetition reviews rated simple, medium, or hard (non-failed).',
      sourceOfTruth: 'userStates[id].history[].rating',
      denominator: 'Total completed SRS review events in window',
      inclusionRules: 'Historical reviews with rating in [simple, medium, hard, failed].',
      exclusionRules: 'Mock interview answers, roadmap assignments without review.',
      nullHandling: 'Returns null (insufficient data) if 0 reviews exist.',
      deduplicationPolicy: 'Event-level timestamps.',
      limitations: 'Subjective recall rating.'
    },
    cognitiveIndependenceRate: {
      name: 'Cognitive Independence Rate',
      definition: 'Percentage of terminal problem solves completed independently without progressive hints or solution reveals.',
      sourceOfTruth: 'TrainerEvents & userStates[id].history[].hintsUsed',
      denominator: 'Total terminal solves in window',
      inclusionRules: 'Solves with 0 hints consumed and simple rating.',
      exclusionRules: 'In-progress drafts, paused sessions, failed attempts.',
      nullHandling: 'Returns null if 0 terminal attempts.',
      deduplicationPolicy: 'Deduplicated across trainer events and SRS history by eventId.',
      limitations: 'Heuristic measure of unassisted recall.'
    },
    mockCompletionRate: {
      name: 'Mock Interview Completion Rate',
      definition: 'Percentage of initiated mock interview sessions successfully submitted and graded vs abandoned.',
      sourceOfTruth: 'LearnerRepository.getMockHistory()',
      denominator: 'Total mock interview sessions in history',
      inclusionRules: 'Sessions with status === completed.',
      exclusionRules: 'Currently active mock sessions.',
      nullHandling: 'Returns 0% if no sessions initiated.',
      deduplicationPolicy: 'Unique sessionId.',
      limitations: 'Early tab closures without submission may be logged as abandoned.'
    },
    topicMasteryScore: {
      name: 'Topic Mastery Score',
      definition: 'Weighted composite metric: Mastered problems (1.0x) + Retained/In-progress solves (0.5x) / Catalog topic total.',
      sourceOfTruth: 'SRSEngine & userStates',
      denominator: 'Total problems in canonical topic',
      inclusionRules: 'Solved problems mapped to canonical topic taxonomy.',
      exclusionRules: 'Unattempted problems, failed reviews.',
      nullHandling: 'Returns 0% if unattempted.',
      deduplicationPolicy: 'Canonical topic mapping via SRSEngine.canonicalizeTopic().',
      limitations: 'Requires minimum 3 attempts before classifying health.'
    },
    ebbinghausDecayEstimate: {
      name: 'Ebbinghaus Decay Estimate',
      definition: 'Estimated mathematical retention probability R = e^(-t/S) based on elapsed time and stability.',
      sourceOfTruth: 'Mathematical exponential decay model using Leitner stage intervals.',
      denominator: 'N/A (Probability 0.0 to 1.0)',
      inclusionRules: 'Active SRS records with lastReviewed timestamp.',
      exclusionRules: 'Problems never reviewed in SRS or reset to stage 0.',
      nullHandling: 'Returns null or 100% when no elapsed time since last review.',
      deduplicationPolicy: 'Unique canonical problem IDs.',
      limitations: 'Ebbinghaus retention values are mathematical decay approximations, not measured biological memory.'
    },
    consistencyScore: {
      name: '30-Day Consistency Score',
      definition: 'Percentage of active learning days over the trailing 30-day window.',
      sourceOfTruth: 'Timestamped review and problem attempt events.',
      denominator: '30 rolling calendar days',
      inclusionRules: 'Any calendar day containing at least one recorded practice, revision, or mock event.',
      exclusionRules: 'Passive page opens without problem interaction.',
      nullHandling: 'Returns 0 when no events recorded.',
      deduplicationPolicy: 'Local calendar day keys (YYYY-MM-DD).',
      limitations: 'Measures active days rather than total clock hours spent.'
    },
    mockInterviewReadiness: {
      name: 'Mock Interview Readiness',
      definition: 'Aggregate assessment of time management, multi-rubric score, and question completion.',
      sourceOfTruth: 'MockEngine session records and rubric evaluations.',
      denominator: 'Total completed mock sessions',
      inclusionRules: 'Finalized mock interview sessions with completed: true.',
      exclusionRules: 'Abandoned or prematurely terminated mock sessions.',
      nullHandling: 'Returns null or N/A when 0 mock sessions completed.',
      deduplicationPolicy: 'Unique mock session IDs.',
      limitations: 'Evaluations are based on self-reported outcomes and automated heuristic rubrics without human interviewers.'
    }
  };

  /**
   * Resolve active learner state bundle safely from repository or options
   * @param {Object} [options={}]
   * @returns {{ ctx: Object, userStates: Object, trainerEvents: Object, drafts: Array, catalog: Array, gamification: Object }}
   */
  function resolveDataBundle(options = {}) {
    const Repo = getRepo();
    const Gamification = getGamification();

    const Mock = getMock();
    const Roadmap = getRoadmap();
    const rawCtx = options.ctx || options.context || (Repo ? Repo.getActiveContext() : { type: 'guest', id: 'guest', isGuest: true });
    const ctx = {
      id: rawCtx.id || rawCtx.userId || 'guest',
      userId: rawCtx.userId || rawCtx.id || 'guest',
      type: rawCtx.type || (rawCtx.isGuest ? 'guest' : 'account'),
      isGuest: Boolean(rawCtx.isGuest)
    };

    let userStates = options.userStates;
    if (!userStates && Repo) {
      userStates = Repo.getUserStates(ctx) || {};
    } else if (!userStates && typeof window !== 'undefined' && window.userStates) {
      userStates = window.userStates;
    } else if (!userStates) {
      userStates = {};
    }

    let trainerEvents = options.trainerEvents;
    if (!trainerEvents && Repo && typeof Repo.getTrainerProcessedEvents === 'function') {
      trainerEvents = Repo.getTrainerProcessedEvents(ctx) || {};
    } else if (!trainerEvents) {
      trainerEvents = {};
    }

    let drafts = options.drafts;
    if (!drafts && Repo && typeof Repo.getAllTrainerDrafts === 'function') {
      drafts = Repo.getAllTrainerDrafts(ctx) || [];
    } else if (!drafts) {
      drafts = [];
    }

    const catalog = options.catalog || getCatalog();
    const gamification = options.gamification || (Gamification && typeof Gamification.getProgress === 'function' ? Gamification.getProgress() : null);

    let mockHistory = options.mockHistory;
    if (!mockHistory && Mock && typeof Mock.getMockHistory === 'function') {
      mockHistory = Mock.getMockHistory(ctx) || [];
    } else if (!mockHistory && Repo && typeof Repo.getMockHistory === 'function') {
      mockHistory = Repo.getMockHistory(ctx) || [];
    } else if (!mockHistory) {
      mockHistory = [];
    }

    let roadmapProgress = options.roadmapProgress;
    if (!roadmapProgress && Roadmap && typeof Roadmap.getProgress === 'function') {
      roadmapProgress = Roadmap.getProgress() || {};
    } else if (!roadmapProgress && Repo && typeof Repo.getRoadmapProgress === 'function') {
      roadmapProgress = Repo.getRoadmapProgress(ctx) || {};
    } else if (!roadmapProgress) {
      roadmapProgress = {};
    }

    return { ctx, userStates, trainerEvents, drafts, mockHistory, roadmapProgress, catalog, gamification };
  }

  /**
   * Compute Learning Activity Metrics
   * Distinguishes unique problems, discrete terminal attempts, and in-progress/paused sessions.
   *
   * @param {Object} [options={}]
   * @returns {Object} Activity metrics
   */
  function computeLearningActivity(options = {}) {
    const { ctx, userStates, trainerEvents, drafts, catalog } = resolveDataBundle(options);
    const windowKey = options.timeWindow || 'all';
    const cutoff = getTimeCutoff(windowKey);

    // Track unique problem sets
    const attemptedProblemIds = new Set();
    const solvedProblemIds = new Set();

    let independentSolves = 0;
    let assistedSolves = 0;
    let solutionReveals = 0;
    let failedAttempts = 0;
    let totalReliableTimeMinutes = 0;
    let recordedTimeEventCount = 0;

    const dailyActivityMap = {}; // 'YYYY-MM-DD': count
    const seenEventIds = new Set();

    // 1. Ingest Durable Trainer Events (authoritative evaluated outcomes)
    Object.values(trainerEvents).forEach(evt => {
      if (!evt || !evt.eventId || seenEventIds.has(evt.eventId)) return;
      seenEventIds.add(evt.eventId);

      const timestamp = evt.processedAt || evt.completedAt || 0;
      if (cutoff > 0 && timestamp < cutoff) return;

      if (evt.problemId) {
        attemptedProblemIds.add(evt.problemId);
      }

      // Outcome classifications
      if (evt.outcome === 'independent_solve') {
        independentSolves++;
        if (evt.problemId) solvedProblemIds.add(evt.problemId);
      } else if (evt.outcome === 'assisted_solve') {
        assistedSolves++;
        if (evt.problemId) solvedProblemIds.add(evt.problemId);
      } else if (evt.outcome === 'solution_reveal') {
        solutionReveals++;
        if (evt.problemId) solvedProblemIds.add(evt.problemId);
      } else if (evt.outcome === 'failed_attempt') {
        failedAttempts++;
      }

      // Reliable time tracking
      const time = evt.timeSpentMinutes || (evt.srsMapping && evt.srsMapping.timeSpentMinutes);
      if (typeof time === 'number' && time > 0 && time < 300) {
        totalReliableTimeMinutes += time;
        recordedTimeEventCount++;
      }

      // Daily activity bucket
      const dayStr = toLocalDateStr(timestamp);
      if (dayStr) {
        dailyActivityMap[dayStr] = (dailyActivityMap[dayStr] || 0) + 1;
      }
    });

    // 2. Ingest Traditional SRS Reviews from userStates (for problems without trainer event duplicates)
    Object.keys(userStates).forEach(pId => {
      const state = userStates[pId];
      if (!state) return;

      const hasReviews = Array.isArray(state.history) && state.history.length > 0;
      const hasLastReviewed = Boolean(state.lastReviewed);

      if (hasReviews || hasLastReviewed) {
        attemptedProblemIds.add(pId);
        if (state.stage >= 1 && state.lastRating !== 'failed') {
          solvedProblemIds.add(pId);
        }
      }

      // Ingest history reviews that don't belong to an already counted trainer event
      if (Array.isArray(state.history)) {
        state.history.forEach(rev => {
          if (!rev) return;
          if (rev.trainerEventId && seenEventIds.has(rev.trainerEventId)) {
            return; // Deduplicated
          }
          if (rev.trainerEventId) {
            seenEventIds.add(rev.trainerEventId);
          }

          const revTime = rev.date ? new Date(rev.date).getTime() : 0;
          if (cutoff > 0 && revTime < cutoff) return;

          // Rating mapping to outcome categories
          if (rev.rating === 'failed') {
            failedAttempts++;
          } else if (rev.hintsUsed) {
            assistedSolves++;
          } else if (rev.rating === 'simple' && (rev.confidence === undefined || rev.confidence >= 4)) {
            independentSolves++;
          } else {
            assistedSolves++;
          }

          if (typeof rev.timeSpent === 'number' && rev.timeSpent > 0 && rev.timeSpent < 300) {
            totalReliableTimeMinutes += rev.timeSpent;
            recordedTimeEventCount++;
          }

          const dayStr = toLocalDateStr(revTime || rev.date);
          if (dayStr) {
            dailyActivityMap[dayStr] = (dailyActivityMap[dayStr] || 0) + 1;
          }
        });
      }
    });

    // 3. Draft & Session State Analysis
    let activeDraftsCount = 0;
    let pausedSessionsCount = 0;
    let abandonedSessionsCount = 0;

    drafts.forEach(item => {
      const draft = item.draft || item;
      if (!draft) return;
      if (draft.status === 'paused') {
        pausedSessionsCount++;
      } else if (draft.status === 'in_progress') {
        activeDraftsCount++;
      } else if (draft.status === 'abandoned') {
        abandonedSessionsCount++;
      }
    });

    const totalTerminalAttempts = independentSolves + assistedSolves + solutionReveals + failedAttempts;
    const totalSessionsInitiated = totalTerminalAttempts + activeDraftsCount + pausedSessionsCount + abandonedSessionsCount;

    return {
      timeWindow: windowKey,
      totalCatalogProblems: catalog.length || 0,
      uniqueProblemsAttempted: attemptedProblemIds.size,
      uniqueProblemsSolved: solvedProblemIds.size,
      totalSessionsInitiated,
      totalTerminalAttempts,
      outcomes: {
        independentSolves,
        assistedSolves,
        solutionReveals,
        failedAttempts,
        pausedSessions: pausedSessionsCount,
        abandonedSessions: abandonedSessionsCount,
        activeDrafts: activeDraftsCount
      },
      timeTracking: {
        totalReliableTimeMinutes: Math.round(totalReliableTimeMinutes * 10) / 10,
        recordedTimeEventCount,
        hasReliableTime: recordedTimeEventCount > 0
      },
      dailyActivity: dailyActivityMap
    };
  }

  /**
   * Compute Learning Effectiveness Metrics
   * Evaluates cognitive independence, hint dependency, and failure rates with explicit sample sizes.
   *
   * @param {Object} [options={}]
   * @returns {Object} Effectiveness metrics
   */
  function computeLearningEffectiveness(options = {}) {
    const activity = computeLearningActivity(options);
    const n = activity.totalTerminalAttempts;

    if (n === 0) {
      return {
        sampleSize: 0,
        insufficientData: true,
        independentSolveRate: null,
        assistedSolveRate: null,
        solutionRevealRate: null,
        failureRate: null,
        hintDependencyIndex: null,
        provisionalIndependenceScore: null
      };
    }

    const { independentSolves, assistedSolves, solutionReveals, failedAttempts } = activity.outcomes;

    const independentSolveRate = Math.round((independentSolves / n) * 1000) / 10;
    const assistedSolveRate = Math.round((assistedSolves / n) * 1000) / 10;
    const solutionRevealRate = Math.round((solutionReveals / n) * 1000) / 10;
    const failureRate = Math.round((failedAttempts / n) * 1000) / 10;

    // Hint Dependency: estimated average hint levels consumed per attempt
    // independent = 0 hints, assisted = 1.5 avg hints, solution_reveal = 5 hints, failed = 2 avg hints
    const estimatedTotalHints = (assistedSolves * 1.5) + (solutionReveals * 5) + (failedAttempts * 2);
    const hintDependencyIndex = Math.round((estimatedTotalHints / n) * 10) / 10;

    // Provisional Cognitive Independence Index (Normalized 0.0 - 1.0)
    // independent = 1.0, assisted = 0.75, solution_reveal = 0.25, failed = 0.0
    const totalWeights = (independentSolves * 1.0) + (assistedSolves * 0.75) + (solutionReveals * 0.25) + (failedAttempts * 0.0);
    const provisionalScore = Math.round((totalWeights / n) * 100) / 100;

    return {
      sampleSize: n,
      insufficientData: false,
      independentSolveRate, // Percentage 0-100
      assistedSolveRate,
      solutionRevealRate,
      failureRate,
      hintDependencyIndex, // 0.0 - 5.0
      provisionalIndependenceScore: {
        score: provisionalScore,
        isProvisional: true,
        interpretation: 'Normalized heuristic cognitive independence index (0.0 to 1.0). Not an SRS interval multiplier.'
      }
    };
  }

  /**
   * Compute Topic-Wise Strengths and Weaknesses
   * Aggregates catalog problems, solved states, and retention health across canonical topics.
   *
   * @param {Object} [options={}]
   * @returns {Object} Topic health metrics and top strengths/weaknesses
   */
  function computeTopicAnalytics(options = {}) {
    const { userStates, catalog } = resolveDataBundle(options);
    const SRS = getSRS();

    const topicMap = {};

    // 1. Initialize catalog topics
    catalog.forEach(p => {
      const topic = p.topic || 'General Algorithms';
      if (!topicMap[topic]) {
        topicMap[topic] = {
          topic,
          totalInCatalog: 0,
          attemptedCount: 0,
          solvedCount: 0,
          masteredCount: 0,
          dueCount: 0,
          overdueCount: 0,
          totalConfidence: 0,
          confidenceRatedCount: 0,
          problems: []
        };
      }
      topicMap[topic].totalInCatalog++;
      topicMap[topic].problems.push(p.id);
    });

    const todayStr = toLocalDateStr(Date.now());

    // 2. Evaluate learner states
    Object.keys(userStates).forEach(pId => {
      const state = userStates[pId];
      if (!state) return;

      const prob = catalog.find(p => p.id === pId);
      const topic = prob ? (prob.topic || 'General Algorithms') : 'General Algorithms';

      if (!topicMap[topic]) {
        topicMap[topic] = {
          topic,
          totalInCatalog: 0,
          attemptedCount: 0,
          solvedCount: 0,
          masteredCount: 0,
          dueCount: 0,
          overdueCount: 0,
          totalConfidence: 0,
          confidenceRatedCount: 0,
          problems: []
        };
      }

      const tObj = topicMap[topic];
      const isAttempted = Boolean(state.lastReviewed) || (Array.isArray(state.history) && state.history.length > 0) || Boolean(state.solved) || (typeof state.attempts === 'number' && state.attempts > 0) || Boolean(state.lastRating);
      const isSolved = Boolean(state.solved) || (typeof state.stage === 'number' && state.stage >= 1 && state.lastRating !== 'failed');

      if (isAttempted) {
        tObj.attemptedCount++;
        if (isSolved) {
          tObj.solvedCount++;
        }
      }

      // Mastery: Stage >= 4 with confidence >= 4
      if (state.stage >= 4 && (state.confidence === undefined || state.confidence >= 4)) {
        tObj.masteredCount++;
      }

      // Due and Overdue
      if (SRS && typeof SRS.isDue === 'function' && SRS.isDue(state)) {
        tObj.dueCount++;
        const nextReviewStr = state.nextReviewDate ? toLocalDateStr(state.nextReviewDate) : '';
        if (nextReviewStr && nextReviewStr < todayStr) {
          tObj.overdueCount++;
        }
      }

      if (typeof state.confidence === 'number' && state.confidence > 0) {
        tObj.totalConfidence += state.confidence;
        tObj.confidenceRatedCount++;
      }
    });

    // 3. Compute Scores & Classify Health
    const topicResults = Object.values(topicMap).map(t => {
      const denom = Math.max(1, t.totalInCatalog);
      // Formula: Mastered (100% weight) + Retained/In-progress (50% weight) relative to catalog total
      const rawMastery = ((t.masteredCount * 1.0) + ((t.solvedCount - t.masteredCount) * 0.5)) / denom;
      const masteryScore = Math.min(100, Math.round(rawMastery * 100));

      let health = 'unattempted';
      if (t.attemptedCount > 0) {
        if (masteryScore >= 70) health = 'strong';
        else if (masteryScore >= 40) health = 'moderate';
        else health = 'at_risk';
      }

      const avgConfidence = t.confidenceRatedCount > 0
        ? Math.round((t.totalConfidence / t.confidenceRatedCount) * 10) / 10
        : null;

      const accuracy = t.attemptedCount > 0
        ? Math.round((t.solvedCount / t.attemptedCount) * 100)
        : null;

      let retentionStatus = 'unattempted';
      if (t.attemptedCount > 0) {
        if (t.masteredCount === t.totalInCatalog && t.totalInCatalog > 0) retentionStatus = 'mastered';
        else if (masteryScore >= 70 || (accuracy !== null && accuracy >= 70)) retentionStatus = 'proficient';
        else if ((t.attemptedCount >= 3 && accuracy !== null && accuracy < 50) || health === 'at_risk') retentionStatus = 'at-risk';
        else retentionStatus = 'developing';
      }

      return {
        topic: t.topic,
        total: t.totalInCatalog,
        totalInCatalog: t.totalInCatalog,
        attempted: t.attemptedCount,
        attemptedCount: t.attemptedCount,
        solved: t.solvedCount,
        solvedCount: t.solvedCount,
        selfReportedSolvedCount: t.solvedCount,
        mastered: t.masteredCount,
        masteredCount: t.masteredCount,
        due: t.dueCount,
        dueCount: t.dueCount,
        overdue: t.overdueCount,
        overdueCount: t.overdueCount,
        weakProblemsCount: 0,
        weakProblemCount: 0,
        masteryScore,
        accuracy,
        health,
        retentionStatus,
        isAtRisk: (t.attemptedCount >= 3 && accuracy !== null && accuracy < 50) || retentionStatus === 'at-risk',
        avgConfidence,
        lastPracticeDate: null
      };
    });

    // 4. Extract Top Strengths and Weaknesses
    const attemptedTopics = topicResults.filter(t => t.attemptedCount > 0);

    const topStrengths = [...attemptedTopics]
      .sort((a, b) => b.masteryScore - a.masteryScore || b.solvedCount - a.solvedCount)
      .slice(0, 3);

    const topWeaknesses = [...attemptedTopics]
      .sort((a, b) => a.masteryScore - b.masteryScore || b.overdueCount - a.overdueCount)
      .slice(0, 3);

    return {
      topics: topicResults,
      topStrengths,
      topWeaknesses
    };
  }

  /**
   * Compute Revision Adherence & Practice Consistency
   *
   * @param {Object} [options={}]
   * @returns {Object} Adherence and streak metrics
   */
  function computeRevisionAdherence(options = {}) {
    const { userStates, gamification } = resolveDataBundle(options);
    const SRS = getSRS();

    let totalDue = 0;
    let totalOverdue = 0;
    let onTimeReviews = 0;
    let totalHistoricalReviews = 0;

    const todayStr = toLocalDateStr(Date.now());

    Object.values(userStates).forEach(st => {
      if (!st) return;

      if (SRS && typeof SRS.isDue === 'function' && SRS.isDue(st)) {
        totalDue++;
        const nextReviewStr = st.nextReviewDate ? toLocalDateStr(st.nextReviewDate) : '';
        if (nextReviewStr && nextReviewStr < todayStr) {
          totalOverdue++;
        }
      }

      if (Array.isArray(st.history)) {
        st.history.forEach(rev => {
          if (!rev || !rev.date) return;
          totalHistoricalReviews++;
          // If scheduledDate was present and review happened on or before scheduled date + 1 day
          if (rev.scheduledDate) {
            const schedStr = toLocalDateStr(rev.scheduledDate);
            const revStr = toLocalDateStr(rev.date);
            if (revStr <= schedStr) {
              onTimeReviews++;
            }
          } else {
            // Default: if rating was not failed, count as adherent
            if (rev.rating !== 'failed') onTimeReviews++;
          }
        });
      }
    });

    const adherenceRate = totalHistoricalReviews > 0
      ? Math.round((onTimeReviews / totalHistoricalReviews) * 1000) / 10
      : null;

    // Consistency across last 30 days
    const activity = computeLearningActivity({ ...options, timeWindow: '30d' });
    const activeDaysIn30d = Object.keys(activity.dailyActivity || {}).length;
    const consistencyScore = Math.round((activeDaysIn30d / 30) * 100);

    const currentStreak = gamification ? (gamification.currentStreak || 0) : 0;
    const maxStreak = gamification ? (gamification.maxStreak || currentStreak) : 0;

    return {
      dueReviews: totalDue,
      overdueReviews: totalOverdue,
      adherenceRate, // Percentage on-schedule
      consistencyScore, // 0-100
      activeDaysLast30d: activeDaysIn30d,
      currentStreak,
      maxStreak
    };
  }

  /**
   * Compute Comprehensive Analytics Bundle
   * Main entry point generating all reporting dimensions with optional time filtering.
   *
   * @param {Object} [options={}] - { timeWindow: 'all' | '7d' | '30d' | '90d' | 'year', ctx: Object, useCache: boolean }
   * @returns {Object} Comprehensive analytics report
   */
  /**
   * SECTION 1: Learning Overview Aggregation
   */
  function computeLearningOverview(options = {}) {
    const { userStates, catalog, roadmapProgress, gamification, mockHistory, trainerEvents } = resolveDataBundle(options);
    const SRS = getSRS();

    const totalCatalogProblems = Array.isArray(catalog) && catalog.length > 0 ? catalog.length : 479;

    const attemptedIds = new Set();
    let verifiedSolvedCount = 0;
    let selfReportedSolvedCount = 0;

    Object.entries(userStates).forEach(([pId, st]) => {
      if (!st) return;
      const hasHistory = Array.isArray(st.history) && st.history.length > 0;
      const hasReview = Boolean(st.lastReviewed);
      const isSolved = Boolean(st.solved) || (typeof st.stage === 'number' && st.stage >= 1 && st.lastRating !== 'failed');

      if (hasHistory || hasReview || isSolved) {
        attemptedIds.add(pId);
      }
      if (isSolved) {
        selfReportedSolvedCount++;
      }
      if (st.verified === true) {
        verifiedSolvedCount++;
      }
    });

    if (trainerEvents && typeof trainerEvents === 'object') {
      Object.values(trainerEvents).forEach(evt => {
        if (!evt || !evt.problemId) return;
        attemptedIds.add(evt.problemId);
        if (evt.outcome && (evt.outcome.includes('solve') || evt.outcome === 'solution_reveal')) {
          if (!userStates[evt.problemId] || !userStates[evt.problemId].solved) {
            selfReportedSolvedCount++;
          }
        }
      });
    }

    if (Array.isArray(mockHistory)) {
      mockHistory.forEach(m => {
        if (!m || !Array.isArray(m.answers)) return;
        m.answers.forEach(ans => {
          if (ans && ans.problemId) attemptedIds.add(ans.problemId);
        });
      });
    }

    const uniqueProblemsAttempted = attemptedIds.size;
    const coveragePercent = totalCatalogProblems > 0 ? Math.round((selfReportedSolvedCount / totalCatalogProblems) * 100) : 0;

    const activeRoadmapTitle = (roadmapProgress && roadmapProgress.title) || '120-Day Dual-Stream Roadmap';
    const totalRoadmapAssignments = (roadmapProgress && roadmapProgress.totalTasks) || 0;
    const completedRoadmapAssignments = (roadmapProgress && roadmapProgress.completedTasks) || 0;
    const remainingRoadmapAssignments = Math.max(0, totalRoadmapAssignments - completedRoadmapAssignments);
    const roadmapCompletionPercent = totalRoadmapAssignments > 0 ? Math.round((completedRoadmapAssignments / totalRoadmapAssignments) * 100) : 0;

    const currentStreak = (gamification && typeof gamification.streak === 'number') ? gamification.streak : 0;
    const totalPracticeSessions = uniqueProblemsAttempted;

    return {
      totalCatalogProblems,
      uniqueProblemsAttempted,
      verifiedSolvedProblems: verifiedSolvedCount,
      selfReportedSolvedProblems: selfReportedSolvedCount,
      coveragePercent,
      activeRoadmapTitle,
      totalRoadmapAssignments,
      completedRoadmapAssignments,
      remainingRoadmapAssignments,
      roadmapCompletionPercent,
      currentStreak,
      totalPracticeSessions
    };
  }

  /**
   * SECTION 2: Topic Mastery Aggregator (Canonical 479 Problem Coverage)
   */
  function computeTopicMastery(options = {}) {
    return computeTopicAnalytics(options);
  }

  /**
   * SECTION 3: Retention & Spaced Revision Analytics
   */
  function computeRetentionAnalytics(options = {}) {
    const { userStates } = resolveDataBundle(options);
    const SRS = getSRS();
    const todayStr = toLocalDateStr(new Date());

    let dueReviews = 0;
    let overdueReviews = 0;
    let completedReviews = 0;
    let successCount = 0;

    const difficultyDistribution = { simple: 0, medium: 0, hard: 0, failed: 0 };
    const stageDistribution = { stage0: 0, stage1: 0, stage2: 0, stage3: 0, stage4Plus: 0 };

    Object.values(userStates).forEach(st => {
      if (!st) return;

      const stage = typeof st.stage === 'number' ? st.stage : 0;
      if (stage === 0) stageDistribution.stage0++;
      else if (stage === 1) stageDistribution.stage1++;
      else if (stage === 2) stageDistribution.stage2++;
      else if (stage === 3) stageDistribution.stage3++;
      else stageDistribution.stage4Plus++;

      if (SRS && typeof SRS.isDue === 'function' && SRS.isDue(st)) {
        dueReviews++;
        const nextStr = st.nextReviewDate ? toLocalDateStr(st.nextReviewDate) : '';
        if (nextStr && nextStr < todayStr) {
          overdueReviews++;
        }
      }

      if (Array.isArray(st.history)) {
        st.history.forEach(h => {
          if (!h || !h.rating) return;
          completedReviews++;
          if (h.rating === 'simple') {
            difficultyDistribution.simple++;
            successCount++;
          } else if (h.rating === 'medium') {
            difficultyDistribution.medium++;
            successCount++;
          } else if (h.rating === 'hard') {
            difficultyDistribution.hard++;
            successCount++;
          } else if (h.rating === 'failed') {
            difficultyDistribution.failed++;
          }
        });
      } else if (st.lastReviewed && st.lastRating) {
        completedReviews++;
        if (st.lastRating === 'simple') {
          difficultyDistribution.simple++;
          successCount++;
        } else if (st.lastRating === 'medium') {
          difficultyDistribution.medium++;
          successCount++;
        } else if (st.lastRating === 'hard') {
          difficultyDistribution.hard++;
          successCount++;
        } else if (st.lastRating === 'failed') {
          difficultyDistribution.failed++;
        }
      }
    });

    const recallSuccessRate = completedReviews > 0 ? Math.round((successCount / completedReviews) * 1000) / 10 : null;

    return {
      dueReviews,
      overdueReviews,
      completedReviews,
      recallSuccessRate,
      difficultyDistribution,
      stageDistribution,
      averageEstimatedRetention: null,
      retentionDisclaimer: 'Ebbinghaus retention values are mathematical decay approximations, not measured biological memory.'
    };
  }

  /**
   * SECTION 4: Problem-Solving Performance & Terminal Outcomes
   */
  function computeProblemSolvingPerformance(options = {}) {
    const { userStates, trainerEvents, catalog } = resolveDataBundle(options);
    const windowCutoff = getTimeCutoff(options.timeWindow || 'all');

    const probDiffMap = {};
    if (Array.isArray(catalog)) {
      catalog.forEach(p => {
        if (p && p.id) probDiffMap[p.id] = p.difficulty || 'Medium';
      });
    }

    let totalAttempts = 0;
    let successfulSolves = 0;
    let firstAttemptSolves = 0;
    let repeatAttempts = 0;

    const hintUsage = { zeroHints: 0, assisted: 0, solutionReveals: 0, failed: 0 };
    const difficultyBreakdown = {
      Easy: { attempts: 0, solved: 0 },
      Medium: { attempts: 0, solved: 0 },
      Hard: { attempts: 0, solved: 0 }
    };

    const seenProblems = new Set();

    if (trainerEvents && typeof trainerEvents === 'object') {
      Object.values(trainerEvents).forEach(evt => {
        if (!evt) return;
        const ts = evt.completedAt || evt.timestamp || 0;
        if (windowCutoff > 0 && ts < windowCutoff) return;

        totalAttempts++;
        const pDiff = probDiffMap[evt.problemId] || 'Medium';
        if (difficultyBreakdown[pDiff]) difficultyBreakdown[pDiff].attempts++;

        const outcome = evt.outcome || '';
        if (outcome === 'independent_solve') {
          successfulSolves++;
          hintUsage.zeroHints++;
          if (difficultyBreakdown[pDiff]) difficultyBreakdown[pDiff].solved++;
          if (!seenProblems.has(evt.problemId)) {
            firstAttemptSolves++;
            seenProblems.add(evt.problemId);
          } else {
            repeatAttempts++;
          }
        } else if (outcome === 'assisted_solve') {
          successfulSolves++;
          hintUsage.assisted++;
          if (difficultyBreakdown[pDiff]) difficultyBreakdown[pDiff].solved++;
        } else if (outcome === 'solution_reveal') {
          successfulSolves++;
          hintUsage.solutionReveals++;
          if (difficultyBreakdown[pDiff]) difficultyBreakdown[pDiff].solved++;
        } else {
          hintUsage.failed++;
        }
      });
    }

    Object.entries(userStates).forEach(([pId, st]) => {
      if (!st) return;
      const pDiff = probDiffMap[pId] || 'Medium';

      if (Array.isArray(st.history)) {
        st.history.forEach(h => {
          if (h.trainerEventId) return; // Deduplicated
          const ts = h.date ? new Date(h.date).getTime() : 0;
          if (windowCutoff > 0 && ts < windowCutoff) return;

          totalAttempts++;
          if (difficultyBreakdown[pDiff]) difficultyBreakdown[pDiff].attempts++;

          const hints = typeof h.hintsUsed === 'number' ? h.hintsUsed : 0;
          if (h.rating === 'failed') {
            hintUsage.failed++;
          } else {
            successfulSolves++;
            if (difficultyBreakdown[pDiff]) difficultyBreakdown[pDiff].solved++;
            if (hints === 0) hintUsage.zeroHints++;
            else if (hints >= 4) hintUsage.solutionReveals++;
            else hintUsage.assisted++;
          }
        });
      }
    });

    const solveSuccessRate = totalAttempts > 0 ? Math.round((successfulSolves / totalAttempts) * 1000) / 10 : null;

    return {
      totalAttempts,
      successfulSolves,
      solveSuccessRate,
      firstAttemptSolves,
      repeatAttempts,
      hintUsage,
      difficultyBreakdown
    };
  }

  /**
   * SECTION 5: Mock Interview Analytics
   */
  function computeMockAnalytics(options = {}) {
    const { mockHistory } = resolveDataBundle(options);

    let totalSessions = 0;
    let completedCount = 0;
    let abandonedCount = 0;
    let scoreSum = 0;
    let bestScore = 0;
    let totalQuestionsEvaluated = 0;
    let reviewRequiredCount = 0;
    const topicsSet = new Set();

    const gradeDistribution = {
      strongHire: 0,
      solidHire: 0,
      borderline: 0,
      notReady: 0,
      abandoned: 0
    };

    if (Array.isArray(mockHistory)) {
      mockHistory.forEach(m => {
        if (!m) return;
        totalSessions++;
        if (m.status === 'completed') {
          completedCount++;
          let rawScore = typeof m.totalScore === 'number'
            ? m.totalScore
            : (typeof m.overallPercentage === 'number' ? m.overallPercentage : 0);
          // Reconcile legacy 20-point scale with percentage: if rawScore <= 20 and > 0, scale to 100%
          const score = (rawScore <= 20 && rawScore > 0) ? Math.round(rawScore * 5) : rawScore;
          scoreSum += score;
          if (score > bestScore) bestScore = score;

          if (m.grade === 'Strong Hire') gradeDistribution.strongHire++;
          else if (m.grade === 'Solid Hire') gradeDistribution.solidHire++;
          else if (m.grade === 'Borderline') gradeDistribution.borderline++;
          else gradeDistribution.notReady++;

          if (Array.isArray(m.answers)) {
            m.answers.forEach(ans => {
              totalQuestionsEvaluated++;
              if (ans.rubric && ans.rubric.correctness === 'failed') {
                reviewRequiredCount++;
              }
              if (ans.topic) topicsSet.add(ans.topic);
            });
          }
        } else if (m.status === 'abandoned') {
          abandonedCount++;
          gradeDistribution.abandoned++;
        }
      });
    }

    const completionRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;
    const averageScore = completedCount > 0 ? Math.round((scoreSum / completedCount) * 10) / 10 : 0;

    const scoreOutOf20 = Math.round((averageScore / 5) * 10) / 10;
    const bestScoreOutOf20 = Math.round((bestScore / 5) * 10) / 10;

    return {
      totalSessions,
      completedCount,
      abandonedCount,
      completionRate,
      averageScore,
      bestScore,
      scoreOutOf20,
      bestScoreOutOf20,
      gradeDistribution,
      totalQuestionsEvaluated,
      reviewRequiredCount,
      topicsPracticed: Array.from(topicsSet),
      provenance: 'Self-Reported Outcome & Multi-Rubric Evaluation'
    };
  }

  /**
   * SECTION 6: Activity & Consistency Analytics
   */
  function computeActivityConsistency(options = {}) {
    const { userStates, trainerEvents, mockHistory, gamification } = resolveDataBundle(options);
    const dailyActivityMap = {};

    Object.values(userStates).forEach(st => {
      if (!st) return;
      if (Array.isArray(st.history)) {
        st.history.forEach(h => {
          const dStr = toLocalDateStr(h.date || h.reviewedAt);
          if (dStr) dailyActivityMap[dStr] = (dailyActivityMap[dStr] || 0) + 1;
        });
      } else if (st.lastReviewed) {
        const dStr = toLocalDateStr(st.lastReviewed);
        if (dStr) dailyActivityMap[dStr] = (dailyActivityMap[dStr] || 0) + 1;
      }
    });

    if (trainerEvents && typeof trainerEvents === 'object') {
      Object.values(trainerEvents).forEach(evt => {
        if (!evt || !evt.completedAt) return;
        const dStr = toLocalDateStr(evt.completedAt);
        if (dStr) dailyActivityMap[dStr] = (dailyActivityMap[dStr] || 0) + 1;
      });
    }

    if (Array.isArray(mockHistory)) {
      mockHistory.forEach(m => {
        if (!m || !m.completedAt) return;
        const dStr = toLocalDateStr(m.completedAt);
        if (dStr) dailyActivityMap[dStr] = (dailyActivityMap[dStr] || 0) + 1;
      });
    }

    // Trailing 30 days active count
    const now = new Date();
    let activeDaysLast30d = 0;
    for (let i = 0; i < 30; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dKey = toLocalDateStr(targetDate);
      if (dailyActivityMap[dKey] && dailyActivityMap[dKey] > 0) {
        activeDaysLast30d++;
      }
    }

    const consistencyScore = Math.round((activeDaysLast30d / 30) * 100);
    const currentStreak = (gamification && typeof gamification.streak === 'number') ? gamification.streak : 0;
    const maxStreak = (gamification && typeof gamification.maxStreak === 'number') ? gamification.maxStreak : currentStreak;

    return {
      dailyActivityMap,
      activeDaysLast30d,
      consistencyScore,
      currentStreak,
      maxStreak,
      totalActiveMinutes: 0
    };
  }

  /**
   * SECTION 7: Actionable Learning Intelligence & Recommendations
   */
  function generateRecommendations(options = {}) {
    const overview = options.overview || computeLearningOverview(options);
    const topics = options.topicMastery || options.topics || computeTopicMastery(options);
    const retention = options.retention || computeRetentionAnalytics(options);
    const mocks = options.mock || options.mocks || computeMockAnalytics(options);

    const recommendations = [];

    // Rec 1: Overdue or Due SRS Revisions (Priority 5 = High Priority)
    const due = retention.dueReviews || 0;
    const overdue = retention.overdueReviews || 0;
    if (overdue > 0 || due > 0) {
      recommendations.push({
        id: 'rec_srs_due',
        priority: 5,
        title: overdue > 0 ? `Clear ${overdue} Overdue Revisions` : `Review ${due} Due Problems`,
        reason: 'Retention decay accelerates when reviews pass their scheduled interval.',
        supportingEvidence: `${due} due and ${overdue} overdue problems past their spaced due date.`,
        recommendedAction: 'Open the Spaced Revision Center and clear high-priority cards.',
        destination: '#/revision',
        badge: overdue > 0 ? 'Critical Retention' : 'Spaced Revision',
        actionLabel: 'Go to Revision Center'
      });
    }

    // Rec 2: Weak Topic Recovery (Priority 4 = High Priority, Evidence: >= 3 attempts with accuracy < 50%)
    const topicList = topics.topics || topics.weakestTopics || [];
    const eligibleWeakTopic = topicList.find(t => {
      const attempts = t.attempted !== undefined ? t.attempted : (t.attemptedCount || 0);
      const acc = t.accuracy !== null && t.accuracy !== undefined ? t.accuracy : t.masteryScore;
      return attempts >= 3 && acc !== null && acc < 50;
    });

    if (eligibleWeakTopic) {
      const attempts = eligibleWeakTopic.attempted !== undefined ? eligibleWeakTopic.attempted : eligibleWeakTopic.attemptedCount;
      const acc = eligibleWeakTopic.accuracy !== null && eligibleWeakTopic.accuracy !== undefined ? eligibleWeakTopic.accuracy : eligibleWeakTopic.masteryScore;
      recommendations.push({
        id: `rec_weak_topic_${eligibleWeakTopic.topic.replace(/\s+/g, '_').toLowerCase()}`,
        priority: 4,
        title: `Strengthen ${eligibleWeakTopic.topic}`,
        reason: 'Repeated unsuccessful attempts or high failure rate detected in this core category.',
        supportingEvidence: `${eligibleWeakTopic.weakProblemsCount || eligibleWeakTopic.weakProblemCount || 0} weak problems (${acc}% across ${attempts} attempted).`,
        recommendedAction: `Practice foundational problems in ${eligibleWeakTopic.topic}.`,
        destination: '#/problems',
        badge: 'Targeted Practice',
        actionLabel: `Explore ${eligibleWeakTopic.topic}`
      });
    }

    // Rec 3: Active Roadmap Continuation (Priority 3 = Recommended)
    if (overview.remainingRoadmapAssignments > 0) {
      recommendations.push({
        id: 'rec_continue_roadmap',
        priority: 3,
        title: `Continue ${overview.activeRoadmapTitle}`,
        reason: 'Maintain consistent progression through your planned dual-stream curriculum.',
        supportingEvidence: `${overview.completedRoadmapAssignments} of ${overview.totalRoadmapAssignments} roadmap tasks completed (${overview.roadmapCompletionPercent}%).`,
        recommendedAction: 'Open your active learning dashboard and solve today’s assigned problems.',
        destination: '#/dashboard',
        badge: 'Curriculum',
        actionLabel: 'Continue Learning'
      });
    }

    // Rec 4: Mock Interview Diagnostic (Priority 2 = Optional)
    if (overview.selfReportedSolvedProblems >= 10 && mocks.completedCount === 0) {
      recommendations.push({
        id: 'rec_first_mock',
        priority: 2,
        title: 'Calibrate Speed with a Mock Interview',
        reason: 'You have solved over 10 problems but have not yet timed your execution under interview constraints.',
        supportingEvidence: `${overview.selfReportedSolvedProblems} problems solved with zero recorded mock rounds.`,
        recommendedAction: 'Start a 45-minute FAANG Standard or Blind 75 timed mock interview.',
        destination: '#/mock',
        badge: 'Interview Readiness',
        actionLabel: 'Launch Mock Round'
      });
    }

    // Rec 5: Baseline / Insufficient Evidence State (Priority 1 = Baseline)
    if (overview.uniqueProblemsAttempted < 3) {
      recommendations.push({
        id: 'rec_initial_evidence',
        priority: 1,
        title: 'Establish Learning Baseline',
        reason: 'AlgoRecall requires at least 3 completed problem attempts to generate deep statistical analytics.',
        supportingEvidence: `Currently ${overview.uniqueProblemsAttempted} problems attempted.`,
        recommendedAction: 'Browse the Problems Library or start Day 1 on your active roadmap.',
        destination: '#/problems',
        badge: 'Baseline Setup',
        actionLabel: 'Browse Problem Library'
      });
    }

    // Sort descending by priority (highest priority first)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }


  function computeComprehensiveAnalytics(options = {}) {
    const { ctx } = resolveDataBundle(options);
    const windowKey = options.timeWindow || 'all';
    const cacheKey = `${ctx.id || 'guest'}_${windowKey}`;

    if (options.useCache !== false && _cache.has(cacheKey)) {
      const entry = _cache.get(cacheKey);
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return entry.data;
      }
    }

    const activity = computeLearningActivity(options);
    const effectiveness = computeLearningEffectiveness(options);
    const topicAnalytics = computeTopicAnalytics(options);
    const adherence = computeRevisionAdherence(options);

    // Phase 7 Modules
    const overview = computeLearningOverview(options);
    const topicMastery = computeTopicMastery(options);
    const retention = computeRetentionAnalytics(options);
    const performance = computeProblemSolvingPerformance(options);
    const mock = computeMockAnalytics(options);
    const consistency = computeActivityConsistency(options);
    const recommendations = generateRecommendations(options);

    const report = {
      generatedAt: Date.now(),
      timeWindow: windowKey,
      context: {
        userId: ctx.userId || ctx.id,
        id: ctx.id || ctx.userId,
        isGuest: ctx.isGuest
      },
      // Stage 9 fields
      activity,
      effectiveness,
      topicAnalytics,
      adherence,
      // Phase 7 fields
      overview,
      topicMastery,
      retention,
      performance,
      problemSolving: performance,
      mock,
      consistency,
      activityConsistency: consistency,
      recommendations,
      metricRegistry: METRIC_REGISTRY,
      provenance: {
        type: 'trainer_guided_self_reported',
        isExternallyVerified: false,
        notice: 'Analytics derived from authentic local-first learning events and self-reported evaluations.'
      }
    };

    _cache.set(cacheKey, { timestamp: Date.now(), data: report });
    return report;
  }

  return {
    METRIC_REGISTRY,
    toLocalDateStr,
    getTimeCutoff,
    invalidateCache,
    // Stage 9 Authoritative APIs
    computeLearningActivity,
    computeLearningEffectiveness,
    computeTopicAnalytics,
    computeRevisionAdherence,
    computeComprehensiveAnalytics,
    // Phase 7 Authoritative APIs
    computeLearningOverview,
    computeTopicMastery,
    computeRetentionAnalytics,
    computeProblemSolvingPerformance,
    computeMockAnalytics,
    computeActivityConsistency,
    generateRecommendations
  };
});
