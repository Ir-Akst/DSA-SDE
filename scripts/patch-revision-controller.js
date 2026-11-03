const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '..', 'js', 'revision-session-controller.js');
let code = fs.readFileSync(controllerPath, 'utf8');

// 1. Update startSession and getActiveSession
const startMarker = '    startSession(problemIds = [], options = {}) {';
const endMarker = '    submitRecallRating(problemId, ratingKey, timeSpentMinutes = 10, notes = \'\', options = {}) {';

const sIdx = code.indexOf(startMarker);
const eIdx = code.indexOf(endMarker);

if (sIdx === -1 || eIdx === -1) {
  console.error('Markers for startSession / getActiveSession not found!');
  process.exit(1);
}

const newSessionBlock = `    startSession(problemIds = [], options = {}) {
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

      const session = {
        sessionId: 'rev_session_' + Date.now(),
        userId: userId,
        problemIds: validProblemIds,
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
          if (st && st.lastReviewed) {
            const revTime = new Date(st.lastReviewed).getTime();
            if (revTime >= sessionStartTime) {
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

`;

code = code.slice(0, sIdx) + newSessionBlock + code.slice(eIdx);

// 2. Update submitRecallRating with Idempotency enforcement
const submitStart = '    submitRecallRating(problemId, ratingKey, timeSpentMinutes = 10, notes = \'\', options = {}) {';
const submitEnd = '    getScaffoldingHint(problem, level = 1) {';

const subSIdx = code.indexOf(submitStart);
const subEIdx = code.indexOf(submitEnd);

if (subSIdx === -1 || subEIdx === -1) {
  console.error('Markers for submitRecallRating not found!');
  process.exit(1);
}

const newSubmitBlock = `    submitRecallRating(problemId, ratingKey, timeSpentMinutes = 10, notes = '', options = {}) {
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

`;

code = code.slice(0, subSIdx) + newSubmitBlock + code.slice(subEIdx);

// 3. Update getScaffoldingHint and getSolutionGuidance with grounding
const hintStart = '    getScaffoldingHint(problem, level = 1) {';
const hintEnd = '  return RevisionSessionController;';

const hSIdx = code.indexOf(hintStart);
const hEIdx = code.indexOf(hintEnd);

if (hSIdx === -1 || hEIdx === -1) {
  console.error('Markers for getScaffoldingHint not found!');
  process.exit(1);
}

const newHintBlock = `    getScaffoldingHint(problem, level = 1) {
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

`;

code = code.slice(0, hSIdx) + newHintBlock + code.slice(hEIdx);

// 4. Update getRevisionMetrics to return selfReportedRetentionPct alongside recallAccuracyPct
code = code.replace(
  'const successfulReviews = ratingDistribution.good + ratingDistribution.easy;\n      const recallAccuracyPct = completedReviewsToday > 0\n        ? Math.round((successfulReviews / completedReviewsToday) * 100)\n        : null;',
  `const successfulReviews = ratingDistribution.good + ratingDistribution.easy;
      const selfReportedRetentionPct = completedReviewsToday > 0
        ? Math.round((successfulReviews / completedReviewsToday) * 100)
        : null;
      const recallAccuracyPct = selfReportedRetentionPct;`
);

code = code.replace(
  'ratingDistribution,\n        recallAccuracyPct',
  'ratingDistribution,\n        selfReportedRetentionPct,\n        recallAccuracyPct'
);

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('Successfully hardened js/revision-session-controller.js!');

