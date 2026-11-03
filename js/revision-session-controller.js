/**
 * AlgoRecall 2.0 — RevisionSessionController
 * js/revision-session-controller.js
 *
 * Dedicated controller for the Revision Center:
 * - Authoritative queue filtering, deterministic sorting & tie-breaking
 * - Accurate metric aggregation (Overdue, Due Today, Upcoming 7d, Weak, Completed Today)
 * - Focused Active Recall Session management with crash-resilient persistence
 * - Recall-first scaffolding (Progressive Hints, Solution Approach)
 * - Strict SRSEngine rating mapping and atomic state persistence
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.RevisionSessionController = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Dependency Resolvers
  function getSRS() {
    return (typeof window !== 'undefined' && window.SRSEngine) ||
      (typeof global !== 'undefined' && global.SRSEngine) ||
      (typeof require !== 'undefined' ? require('./srs-engine') : null);
  }

  function getRepo() {
    return (typeof window !== 'undefined' && window.LearnerRepository) ||
      (typeof global !== 'undefined' && global.LearnerRepository) ||
      (typeof require !== 'undefined' ? require('./learner-repository') : null);
  }

  function getAI() {
    return (typeof window !== 'undefined' && window.AIEngine) ||
      (typeof global !== 'undefined' && global.AIEngine) ||
      (typeof require !== 'undefined' ? require('./ai-engine') : null);
  }

  function getGamification() {
    return (typeof window !== 'undefined' && window.GamificationEngine) ||
      (typeof global !== 'undefined' && global.GamificationEngine) ||
      (typeof require !== 'undefined' ? require('./gamification-engine') : null);
  }

  // Recall Rating Scale Mapping
  // Maps human-friendly active recall prompts directly to SRSEngine's native rating scale
  const RATING_MAP = {
    again: { rating: 'failed', confidence: 1, label: 'Again', desc: 'Could not recall / needed full solution' },
    hard:  { rating: 'hard',   confidence: 2, label: 'Hard',  desc: 'Partial recall; substantial help needed' },
    good:  { rating: 'medium', confidence: 3, label: 'Good',  desc: 'Correct approach recalled with some effort' },
    easy:  { rating: 'simple', confidence: 4, label: 'Easy',  desc: 'Complete, confident recall' },
    // Direct passthroughs for existing code compatibility
    failed: { rating: 'failed', confidence: 1, label: 'Again', desc: 'Could not recall' },
    medium: { rating: 'medium', confidence: 3, label: 'Good',  desc: 'Correct approach' },
    simple: { rating: 'simple', confidence: 4, label: 'Easy',  desc: 'Complete recall' }
  };

  /**
   * Helper: Get local date string YYYY-MM-DD
   */
  function toDateStr(d = new Date()) {
    const srs = getSRS();
    if (srs && typeof srs.getLocalDateString === 'function') {
      return srs.getLocalDateString(d);
    }
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  }

  /**
   * Check if a problem state qualifies as "Weak"
   * Definition:
   * - Low confidence (<= 2)
   * - Last rating was 'failed' or 'hard'
   * - Low stability (<= 2 days)
   * - Ebbinghaus retention decay below 60%
   */
  function isProblemWeak(state, srs, asOfDate = new Date()) {
    if (!state || state.isMastered) return false;
    const srsRef = srs || getSRS();
    const conf = srsRef ? srsRef.getConfidence(state) : (state.confidence || state.lastConfidence);
    if (typeof conf === 'number' && conf <= 2) return true;
    if (state.lastRating === 'failed') return true;
    if (typeof state.stability === 'number' && state.stability <= 2) return true;
    if (srsRef && typeof srsRef.calculateRetention === 'function' && state.lastReviewed) {
      const ret = srsRef.calculateRetention(state, asOfDate);
      if (ret < 0.6) return true;
    }
    return false;
  }

  // Active submission lock to prevent double-click / rapid submission race conditions
  let _isSubmitting = false;

  const RevisionSessionController = {
    RATING_MAP,

    isWeak(state) {
      return isProblemWeak(state, getSRS());
    },

    /**
     * Compute authoritative Revision Center overview statistics
     *
     * @param {Array} allProblems - complete problem catalog
     * @param {Object} userStates - user state dictionary
     * @param {Date} [asOfDate] - optional date context
     * @returns {Object} Metric counts with consistent semantics
     */
    getRevisionMetrics(allProblems = [], userStates = {}, asOfDate = new Date()) {
      const srs = getSRS();
      const todayStr = toDateStr(asOfDate);
      const in7Days = new Date(asOfDate);
      in7Days.setDate(in7Days.getDate() + 7);
      const in7DaysStr = toDateStr(in7Days);

      let overdueCount = 0;
      let dueTodayCount = 0;
      let upcomingCount = 0;
      let weakCount = 0;
      let totalMastered = 0;
      let bookmarkedCount = 0;

      const weakTopicCounts = {};

      allProblems.forEach(p => {
        const state = userStates[p.id];
        if (!state) return;

        if (state.isBookmarked) {
          bookmarkedCount++;
        }

        if (state.isMastered) {
          totalMastered++;
          return;
        }

        const nextDate = state.nextReviewDate;
        if (!nextDate && !state.lastReviewed) return;

        if (nextDate) {
          if (nextDate < todayStr) {
            overdueCount++;
          } else if (nextDate === todayStr) {
            dueTodayCount++;
          } else if (nextDate > todayStr && nextDate <= in7DaysStr) {
            upcomingCount++;
          }
        }

        if (isProblemWeak(state, srs, asOfDate)) {
          weakCount++;
          const topic = srs ? srs.canonicalizeTopic(p.topic) : (p.topic || 'General');
          weakTopicCounts[topic] = (weakTopicCounts[topic] || 0) + 1;
        }
      });

      // Compute completed reviews today from review history
      let completedReviewsToday = 0;
      const uniqueCompletedProblemsToday = new Set();
      const ratingDistribution = { again: 0, hard: 0, good: 0, easy: 0 };

      Object.entries(userStates).forEach(([probId, state]) => {
        if (!state || !Array.isArray(state.history)) return;
        state.history.forEach(h => {
          if (!h.date) return;
          const hDateStr = toDateStr(new Date(h.date));
          if (hDateStr === todayStr) {
            completedReviewsToday++;
            uniqueCompletedProblemsToday.add(probId);

            const r = String(h.rating || '').toLowerCase();
            if (r === 'failed') ratingDistribution.again++;
            else if (r === 'hard') ratingDistribution.hard++;
            else if (r === 'medium' || r === 'good') ratingDistribution.good++;
            else if (r === 'simple' || r === 'easy') ratingDistribution.easy++;
          }
        });
      });

      // Find top weak topic
      let topWeakTopic = null;
      let maxWeakCount = 0;
      Object.entries(weakTopicCounts).forEach(([topic, count]) => {
        if (count > maxWeakCount) {
          maxWeakCount = count;
          topWeakTopic = topic;
        }
      });

      // Retention accuracy today: (good + easy) / completed
      const successfulReviews = ratingDistribution.good + ratingDistribution.easy;
      const selfReportedRetentionPct = completedReviewsToday > 0
        ? Math.round((successfulReviews / completedReviewsToday) * 100)
        : null;
      const recallAccuracyPct = selfReportedRetentionPct;

      // Due Now count strictly equals overdueCount + dueTodayCount (SRSEngine.isDue)
      const dueNowCount = overdueCount + dueTodayCount;

      return {
        todayStr,
        overdueCount,
        dueTodayCount,
        dueNowCount,
        upcomingCount,
        weakCount,
        topWeakTopic: topWeakTopic || 'None',
        topWeakTopicCount: maxWeakCount,
        completedReviewsToday,
        uniqueProblemsCompletedToday: uniqueCompletedProblemsToday.size,
        totalMastered,
        bookmarkedCount,
        ratingDistribution,
        selfReportedRetentionPct,
        recallAccuracyPct
      };
    },

    /**
     * Get filtered and deterministically sorted problems for the Revision Queue
     *
     * @param {Array} allProblems - complete problem list
     * @param {Object} userStates - user state map
     * @param {Object} options - filters, search, sort, and date context
     * @returns {Array} Filtered and sorted problems
     */
    getFilteredQueue(allProblems = [], userStates = {}, options = {}) {
      const srs = getSRS();
      const asOfDate = options.asOfDate || new Date();
      const todayStr = toDateStr(asOfDate);
      const in7Days = new Date(asOfDate);
      in7Days.setDate(in7Days.getDate() + 7);
      const in7DaysStr = toDateStr(in7Days);

      const filter = options.filter || 'due'; // 'due' | 'overdue' | 'weak' | 'bookmarked' | 'all' | 'upcoming'
      const search = (options.search || '').trim().toLowerCase();
      const topicFilter = options.topic && options.topic !== 'all' ? options.topic : null;
      const diffFilter = options.difficulty && options.difficulty !== 'all' ? options.difficulty.toLowerCase() : null;
      const sortBy = options.sort || 'urgency';

      let list = allProblems.filter(p => {
        const state = userStates[p.id];
        if (!state) return false;

        const hasHistory = Boolean(state.nextReviewDate || state.lastReviewed);
        if (!hasHistory && !state.isBookmarked) return false;

        const isMastered = Boolean(state.isMastered);
        const nextDate = state.nextReviewDate;
        const isOverdue = Boolean(nextDate && nextDate < todayStr && !isMastered);
        const isDueToday = Boolean(nextDate && nextDate === todayStr && !isMastered);
        const isDueNow = isOverdue || isDueToday;
        const isWeak = isProblemWeak(state, srs, asOfDate);

        // Filter tab matching
        if (filter === 'due') {
          if (!isDueNow) return false;
        } else if (filter === 'overdue') {
          if (!isOverdue) return false;
        } else if (filter === 'weak') {
          if (!isWeak) return false;
        } else if (filter === 'bookmarked') {
          if (!state.isBookmarked) return false;
        } else if (filter === 'upcoming') {
          const isUpcoming = Boolean(nextDate && nextDate > todayStr && nextDate <= in7DaysStr && !isMastered);
          if (!isUpcoming) return false;
        } else if (filter === 'all') {
          if (!hasHistory && !state.isBookmarked) return false;
        }

        // Search filter: title, ID, or pattern
        if (search) {
          const matchTitle = (p.title || '').toLowerCase().includes(search);
          const matchId = (p.id || '').toLowerCase().includes(search);
          const matchPattern = (p.pattern || '').toLowerCase().includes(search);
          if (!matchTitle && !matchId && !matchPattern) return false;
        }

        // Topic filter
        if (topicFilter) {
          const canonP = srs ? srs.canonicalizeTopic(p.topic) : p.topic;
          const canonFilter = srs ? srs.canonicalizeTopic(topicFilter) : topicFilter;
          if (canonP !== canonFilter) return false;
        }

        // Difficulty filter
        if (diffFilter) {
          if ((p.difficulty || '').toLowerCase() !== diffFilter) return false;
        }

        return true;
      });

      // Deterministic Sorting & Tie-breaking
      list.sort((a, b) => {
        const stateA = userStates[a.id] || {};
        const stateB = userStates[b.id] || {};

        const isOverdueA = stateA.nextReviewDate && stateA.nextReviewDate < todayStr && !stateA.isMastered;
        const isOverdueB = stateB.nextReviewDate && stateB.nextReviewDate < todayStr && !stateB.isMastered;
        const isDueTodayA = stateA.nextReviewDate && stateA.nextReviewDate === todayStr && !stateA.isMastered;
        const isDueTodayB = stateB.nextReviewDate && stateB.nextReviewDate === todayStr && !stateB.isMastered;

        const confA = srs ? (srs.getConfidence(stateA) || 3) : (stateA.confidence || 3);
        const confB = srs ? (srs.getConfidence(stateB) || 3) : (stateB.confidence || 3);

        const dateA = stateA.nextReviewDate || '9999-99-99';
        const dateB = stateB.nextReviewDate || '9999-99-99';

        if (sortBy === 'urgency') {
          // 1. Overdue first
          if (isOverdueA && !isOverdueB) return -1;
          if (!isOverdueA && isOverdueB) return 1;

          // 2. Due today second
          if (isDueTodayA && !isDueTodayB) return -1;
          if (!isDueTodayA && isDueTodayB) return 1;

          // 3. Earliest due date
          if (dateA !== dateB) return dateA.localeCompare(dateB);

          // 4. Lowest confidence (most fragile memory first)
          if (confA !== confB) return confA - confB;

          // 5. Stable ID tie-breaker
          return a.id.localeCompare(b.id);

        } else if (sortBy === 'due_date') {
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return a.id.localeCompare(b.id);

        } else if (sortBy === 'weakness') {
          if (confA !== confB) return confA - confB;
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return a.id.localeCompare(b.id);

        } else if (sortBy === 'difficulty_desc') {
          const diffMap = { 'hard': 3, 'medium': 2, 'easy': 1 };
          const dA = diffMap[(a.difficulty || '').toLowerCase()] || 2;
          const dB = diffMap[(b.difficulty || '').toLowerCase()] || 2;
          if (dB !== dA) return dB - dA;
          return a.id.localeCompare(b.id);

        } else if (sortBy === 'difficulty_asc') {
          const diffMap = { 'hard': 3, 'medium': 2, 'easy': 1 };
          const dA = diffMap[(a.difficulty || '').toLowerCase()] || 2;
          const dB = diffMap[(b.difficulty || '').toLowerCase()] || 2;
          if (dA !== dB) return dA - dB;
          return a.id.localeCompare(b.id);

        } else if (sortBy === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }

        return a.id.localeCompare(b.id);
      });

      return list;
    },

    // =========================================================================
    // Active Recall Session Management
    // =========================================================================

    /**
     * Start a new active recall session
     *
     * @param {Array<string>} problemIds - ordered list of problem IDs to review
     * @param {Object} [options] - additional session options
     * @returns {Object} Newly initialized session descriptor
     */
    startSession(problemIds = [], options = {}) {
      const repo = getRepo();
      const validProblemIds = [];
      const seen = new Set();

      problemIds.forEach(id => {
        if (!id || typeof id !== 'string' || seen.has(id)) return;
        seen.add(id);
        validProblemIds.push(id);
      });

      const activeCtx = repo && typeof repo.getActiveContext === 'function' ? repo.getActiveContext() : null;
      const userId = activeCtx ? activeCtx.id : 'guest';
      const userStates = (repo && typeof repo.getUserStates === 'function') ? (repo.getUserStates() || {}) : {};
      const initialTimestamps = {};
      validProblemIds.forEach(id => {
        initialTimestamps[id] = (userStates[id] && userStates[id].lastReviewed) ? userStates[id].lastReviewed : null;
      });

      const session = {
        sessionId: 'rev_session_' + Date.now(),
        userId: userId,
        problemIds: validProblemIds,
        initialTimestamps: initialTimestamps,
        currentIndex: 0,
        completedReviews: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: validProblemIds.length > 0 ? 'in_progress' : 'completed',
        hintsRevealed: 0,
        solutionRevealed: false,
        scratchpadNotes: '',
        filterSource: options.filterSource || 'due'
      };

      if (repo && typeof repo.saveActiveRevisionSession === 'function') {
        repo.saveActiveRevisionSession(session);
      }

      return session;
    },

    /**
     * Get currently active unfinished session if one exists
     * Includes account isolation and stale problem reconciliation
     *
     * @returns {Object|null}
     */
    getActiveSession() {
      const repo = getRepo();
      if (!repo || typeof repo.getActiveRevisionSession !== 'function') return null;

      try {
        const session = repo.getActiveRevisionSession();
        if (!session) return null;
        if (session.status !== 'in_progress') return null;
        if (!Array.isArray(session.problemIds) || session.problemIds.length === 0) return null;

        // Account isolation check: never expose another user's session
        const activeCtx = repo && typeof repo.getActiveContext === 'function' ? repo.getActiveContext() : null;
        const currentUserId = activeCtx ? activeCtx.id : 'guest';
        if (session.userId && session.userId !== currentUserId) {
          return null;
        }

        // Verify session is within a reasonable TTL (48 hours)
        if (session.updatedAt) {
          const elapsed = Date.now() - new Date(session.updatedAt).getTime();
          if (isNaN(elapsed) || elapsed > 48 * 60 * 60 * 1000) {
            this.discardActiveSession();
            return null;
          }
        }

        // Reconcile session state against authoritative review records
        const userStates = (repo && typeof repo.getUserStates === 'function') ? (repo.getUserStates() || {}) : {};
        const sessionStartTime = session.startedAt ? new Date(session.startedAt).getTime() : 0;
        let reconciledAny = false;

        while (session.currentIndex < session.problemIds.length) {
          const curProbId = session.problemIds[session.currentIndex];
          const st = userStates[curProbId];
          const alreadyInCompleted = Array.isArray(session.completedReviews) && session.completedReviews.some(r => r.problemId === curProbId);

          if (alreadyInCompleted) {
            session.currentIndex++;
            reconciledAny = true;
            continue;
          }

          // If the problem was reviewed elsewhere (e.g. library or another tab) after session started
          const initTs = session.initialTimestamps ? session.initialTimestamps[curProbId] : undefined;
          if (st && st.lastReviewed && initTs !== undefined && st.lastReviewed !== initTs) {
              session.completedReviews.push({
                problemId: curProbId,
                rating: st.lastRating || 'medium',
                nativeRating: st.lastRating || 'medium',
                confidence: st.confidence || 3,
                reconciled: true,
                reviewedAt: st.lastReviewed
              });
              session.currentIndex++;
              reconciledAny = true;
              continue;
            }
          break;
        }

        if (session.currentIndex >= session.problemIds.length) {
          session.status = 'completed';
          this.discardActiveSession();
          return null;
        }

        if (reconciledAny && repo && typeof repo.saveActiveRevisionSession === 'function') {
          session.updatedAt = new Date().toISOString();
          repo.saveActiveRevisionSession(session);
        }

        return session;
      } catch (err) {
        console.warn('[RevisionSessionController] Error retrieving active session:', err);
        return null;
      }
    },

    /**
     * Discard active session and clear from storage
     */
    discardActiveSession() {
      const repo = getRepo();
      if (repo && typeof repo.clearActiveRevisionSession === 'function') {
        repo.clearActiveRevisionSession();
      }
    },

    submitRecallRating(problemId, ratingKey, timeSpentMinutes = 10, notes = '', options = {}) {
      if (_isSubmitting) {
        return { success: false, error: 'SUBMISSION_IN_PROGRESS', message: 'A rating submission is currently processing.' };
      }

      _isSubmitting = true;
      try {
        const srs = getSRS();
        const repo = getRepo();
        if (!srs) {
          throw new Error('SRSEngine is not available.');
        }

        const ratingMeta = RATING_MAP[ratingKey] || RATING_MAP.good;
        const nativeRating = ratingMeta.rating;
        const confidenceVal = ratingMeta.confidence;

        // Resolve current state
        let userStates = options.userStatesRef;
        if (!userStates) {
          userStates = (repo && typeof repo.getUserStates === 'function') ? (repo.getUserStates() || {}) : {};
        }

        const currentState = userStates[problemId] || { id: problemId };
        const hintsUsed = Boolean(options.hintsUsed || options.hintsRevealed > 0 || options.solutionRevealed);

        // Fetch active session early to bind deterministic eventId if in session
        const session = this.getActiveSession();

        // 1. Resolve stable event ID / Idempotency Key
        const eventId = options.eventId || options.idempotencyKey ||
          (session ? (session.sessionId + '_' + problemId + '_step' + session.currentIndex) : ('rev_' + problemId + '_' + Date.now()));

        // 2. Idempotency Check on currentState history
        const existingHistory = Array.isArray(currentState.history) ? currentState.history : [];
        const existingEvent = existingHistory.find(h => h && h.eventId === eventId);

        if (existingEvent) {
          // Idempotent hit: return existing state without re-advancing schedule or re-awarding XP
          return {
            success: true,
            idempotent: true,
            eventId: eventId,
            problemId,
            ratingKey,
            nativeRating,
            confidence: confidenceVal,
            updatedState: currentState,
            xpEarned: 0,
            session,
            isSessionComplete: session ? session.currentIndex >= session.problemIds.length : false,
            nextIndex: session ? session.currentIndex : 0,
            nextReviewDate: currentState.nextReviewDate,
            intervalDays: currentState.intervalDays || currentState.interval
          };
        }

        // Core SRS state update
        const updatedState = srs.processReview(
          currentState,
          nativeRating,
          timeSpentMinutes,
          notes,
          confidenceVal,
          {
            hintsUsed,
            failureReasons: options.failureReasons || [],
            now: options.asOfDate || new Date(),
            eventId: eventId
          }
        );

        // If srs returned idempotent, respect it
        if (updatedState.idempotent) {
          return {
            success: true,
            idempotent: true,
            eventId: eventId,
            problemId,
            ratingKey,
            nativeRating,
            confidence: confidenceVal,
            updatedState,
            xpEarned: 0,
            session,
            isSessionComplete: session ? session.currentIndex >= session.problemIds.length : false,
            nextIndex: session ? session.currentIndex : 0,
            nextReviewDate: updatedState.nextReviewDate,
            intervalDays: updatedState.intervalDays
          };
        }

        // Preserve bookmark state if present
        if (currentState.isBookmarked) {
          updatedState.isBookmarked = true;
        }

        // Commit state atomically
        userStates[problemId] = updatedState;
        if (repo && typeof repo.saveUserStates === 'function') {
          repo.saveUserStates(userStates);
        }

        // Gamification XP
        const gamification = getGamification();
        let xpAwarded = 0;
        if (gamification && typeof gamification.awardXP === 'function') {
          try {
            if (!hintsUsed && confidenceVal >= 4) {
              gamification.awardXP('independent_solve');
              xpAwarded = 25;
            } else if (currentState.stage >= 2 && nativeRating !== 'failed') {
              gamification.awardXP('delayed_recall');
              xpAwarded = 20;
            } else {
              gamification.awardXP('review');
              xpAwarded = 10;
            }
          } catch (_) {}
        }

        // Update active session state if session is running
        let isSessionComplete = false;
        let nextIndex = 0;

        if (session) {
          const alreadyLogged = Array.isArray(session.completedReviews) && session.completedReviews.some(r => r.eventId === eventId);
          if (!alreadyLogged) {
            session.completedReviews.push({
              eventId: eventId,
              problemId,
              rating: ratingKey,
              nativeRating,
              confidence: confidenceVal,
              timeSpentMinutes,
              hintsUsed,
              nextReviewDate: updatedState.nextReviewDate,
              intervalDays: updatedState.intervalDays,
              isMastered: updatedState.isMastered,
              xpEarned: xpAwarded,
              reviewedAt: new Date().toISOString()
            });

            session.currentIndex++;
          }

          nextIndex = session.currentIndex;
          session.hintsRevealed = 0;
          session.solutionRevealed = false;
          session.scratchpadNotes = '';
          session.updatedAt = new Date().toISOString();

          if (session.currentIndex >= session.problemIds.length) {
            session.status = 'completed';
            isSessionComplete = true;
            this.discardActiveSession();
          } else {
            if (repo && typeof repo.saveActiveRevisionSession === 'function') {
              repo.saveActiveRevisionSession(session);
            }
          }
        }

        return {
          success: true,
          idempotent: false,
          eventId: eventId,
          problemId,
          ratingKey,
          nativeRating,
          confidence: confidenceVal,
          updatedState,
          xpEarned: xpAwarded,
          session,
          isSessionComplete,
          nextIndex,
          nextReviewDate: updatedState.nextReviewDate,
          intervalDays: updatedState.intervalDays
        };

      } catch (err) {
        console.error('[RevisionSessionController] submitRecallRating failed:', err);
        return {
          success: false,
          error: 'PERSISTENCE_FAILED',
          message: err.message || 'Failed to record review.'
        };
      } finally {
        _isSubmitting = false;
      }
    },

    getScaffoldingHint(problem, level = 1) {
      if (!problem || !problem.title) {
        return {
          level,
          title: 'Guidance Unavailable',
          text: 'Detailed hints are currently unavailable for this problem.',
          unavailable: true,
          isAi: false
        };
      }

      const ai = getAI();
      const safeLevel = Math.max(1, Math.min(5, level));

      if (ai && typeof ai.generateHeuristicHint === 'function') {
        const hintObj = ai.generateHeuristicHint(problem, safeLevel);
        if (hintObj && hintObj.text) {
          return {
            level: safeLevel,
            title: hintObj.title || ('Level ' + safeLevel + ' Scaffolding Hint'),
            text: hintObj.text,
            isAi: false,
            unavailable: false
          };
        }
      }

      // Grounded tiered fallback scaffolding based on actual catalog metadata
      const pattern = problem.pattern || problem.subtopic || 'algorithmic logic';
      const topic = problem.topic || 'Data Structures';
      const timeC = problem.timeComplexity || problem.optimalTime || 'optimal target';
      const spaceC = problem.spaceComplexity || problem.optimalSpace || 'optimal target';

      const hintsByLevel = {
        1: { title: 'Conceptual Direction', text: 'Analyze the problem properties for ' + problem.title + '. Consider which core algorithm pattern in ' + topic + ' best fits the constraints.' },
        2: { title: 'Data Structure Invariant', text: 'Leverage ' + pattern + ' to maintain necessary state without redundant recomputation.' },
        3: { title: 'Algorithmic Transition', text: 'Formulate the step-by-step state transition or search space reduction. Pay close attention to ordering and boundary checks.' },
        4: { title: 'Edge Cases & Invariants', text: 'Identify boundary conditions: empty inputs, single element, negative values, duplicates, and integer boundaries.' },
        5: { title: 'Verified Complexity Target', text: 'Expected optimal complexity: Time ' + timeC + ', Space ' + spaceC + '. Verify all branches terminate within bounds.' }
      };

      return {
        level: safeLevel,
        title: hintsByLevel[safeLevel].title,
        text: hintsByLevel[safeLevel].text,
        isAi: false,
        unavailable: false
      };
    },

    /**
     * Get verified solution approach guidance grounded in catalog data
     */
    getSolutionGuidance(problem) {
      if (!problem || !problem.title) {
        return {
          approach: 'Solution guidance is currently unavailable for this problem.',
          unavailable: true,
          pattern: 'Unknown',
          topic: 'General',
          optimalTime: 'Not specified',
          optimalSpace: 'Not specified',
          timeComplexity: 'Not specified',
          spaceComplexity: 'Not specified',
          guidance: 'No verified solution approach notes available.'
        };
      }

      const pattern = problem.pattern || problem.subtopic || 'Fundamental Algorithmic Technique';
      const topic = problem.topic || 'General';
      const optTime = problem.timeComplexity || problem.optimalTime || 'Not specified';
      const optSpace = problem.spaceComplexity || problem.optimalSpace || 'Not specified';
      const notes = (problem.notes && problem.notes.trim()) ? problem.notes.trim() : '';

      let approach = notes;
      if (!approach) {
        approach = 'Key Insight: Identify the subproblem recurrence or state invariant. Leverage ' + pattern + ' to solve "' + problem.title + '" with target runtime (' + optTime + ') and space (' + optSpace + ').';
      }

      return {
        approach,
        pattern,
        topic,
        optimalTime: optTime,
        optimalSpace: optSpace,
        timeComplexity: optTime,
        spaceComplexity: optSpace,
        guidance: approach,
        unavailable: false
      };
    }
  };

  return RevisionSessionController;
});
