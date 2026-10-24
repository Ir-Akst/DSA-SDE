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
  function toLocalDateStr(dateInput) {
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
  }

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

  /**
   * Resolve active learner state bundle safely from repository or options
   * @param {Object} [options={}]
   * @returns {{ ctx: Object, userStates: Object, trainerEvents: Object, drafts: Array, catalog: Array, gamification: Object }}
   */
  function resolveDataBundle(options = {}) {
    const Repo = getRepo();
    const Gamification = getGamification();

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : { type: 'guest', id: 'guest', isGuest: true });

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

    return { ctx, userStates, trainerEvents, drafts, catalog, gamification };
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
      const hasReviewed = Boolean(state.lastReviewed) || (Array.isArray(state.history) && state.history.length > 0);

      if (hasReviewed) {
        tObj.attemptedCount++;
        if (state.stage >= 1 && state.lastRating !== 'failed') {
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

      return {
        topic: t.topic,
        totalInCatalog: t.totalInCatalog,
        attemptedCount: t.attemptedCount,
        solvedCount: t.solvedCount,
        masteredCount: t.masteredCount,
        dueCount: t.dueCount,
        overdueCount: t.overdueCount,
        masteryScore,
        health,
        avgConfidence
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

    const report = {
      generatedAt: Date.now(),
      timeWindow: windowKey,
      context: {
        userId: ctx.id,
        isGuest: ctx.isGuest
      },
      activity,
      effectiveness,
      topicAnalytics,
      adherence,
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
    toLocalDateStr,
    getTimeCutoff,
    invalidateCache,
    computeLearningActivity,
    computeLearningEffectiveness,
    computeTopicAnalytics,
    computeRevisionAdherence,
    computeComprehensiveAnalytics
  };
});
