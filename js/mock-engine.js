/**
 * AlgoRecall 2.0 - Realistic Mock Interview Engine
 * Manages full interview workflows with:
 * - Configurable tracks, durations (30, 45, 60, 90, custom), difficulties & canonical topics
 * - Absolute timestamp-based countdown persistence (resilient to reload & tab suspension)
 * - Multi-criteria rubric grading & grounded feedback reports
 * - Distinct evaluation provenance (self-reported vs verified)
 * - Complete separation invariant: NO automatic modification of roadmap or SRS userStates
 * - Account-isolated session persistence & history analytics
 */

(function () {
  'use strict';

  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);
  const _SolutionAnalysisEngine = (typeof window !== 'undefined' && window.SolutionAnalysisEngine) || (typeof require !== 'undefined' ? require('./solution-analysis') : null);

  const getLocalStorage = () => {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
      if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    } catch (_) {}
    return null;
  };

  const getRepo = () => {
    try {
      if (typeof window !== 'undefined' && window.LearnerRepository) return window.LearnerRepository;
      if (typeof require !== 'undefined') return require('./learner-repository');
    } catch (_) {}
    return null;
  };

  const STORAGE_KEY_ACTIVE_MOCK = 'algorecall_active_mock_session_v2';
  const STORAGE_KEY_MOCK_HISTORY = 'algorecall_mock_history_v2';

  const MOCK_TRACKS = {
    faang_standard: {
      id: 'faang_standard',
      title: '💼 FAANG Standard Round',
      description: '45-60 minute round with 1 Medium and 1 Hard high-frequency problem.',
      defaultDuration: 45,
      questionsCount: 2,
      difficultyMix: ['Medium', 'Hard']
    },
    blind_sprint: {
      id: 'blind_sprint',
      title: '⚡ Blind 75 Sprint',
      description: '45-minute round focusing on core algorithmic patterns.',
      defaultDuration: 45,
      questionsCount: 2,
      difficultyMix: ['Easy', 'Medium']
    },
    full_interview: {
      id: 'full_interview',
      title: '🏆 Senior SDE Comprehensive',
      description: '60-90 minute 3-problem interview simulating an on-site loop.',
      defaultDuration: 60,
      questionsCount: 3,
      difficultyMix: ['Easy', 'Medium', 'Hard']
    },
    custom: {
      id: 'custom',
      title: '⚙️ Custom Interview',
      description: 'Fully customized interview session tailored to your targeted practice.',
      defaultDuration: 45,
      questionsCount: 2,
      difficultyMix: ['Easy', 'Medium']
    }
  };

  const VALID_DURATIONS = [30, 45, 60, 90];
  const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed'];

  const CANONICAL_TOPICS = [
    'Arrays & Hashing',
    'Two Pointers',
    'Sliding Window',
    'Binary Search',
    'Linked Lists',
    'Stack & Queue',
    'Trees & BST',
    'Heaps',
    'Graphs',
    'Greedy & Intervals',
    'Backtracking',
    'Dynamic Programming'
  ];

  const MockEngine = {
    TRACKS: MOCK_TRACKS,
    VALID_DURATIONS: VALID_DURATIONS,
    VALID_DIFFICULTIES: VALID_DIFFICULTIES,
    CANONICAL_TOPICS: CANONICAL_TOPICS,

    /**
     * Generate new Mock Interview Session
     * @param {Array} allProblems - Entire problem catalog
     * @param {Object} userStates - Problem states map
     * @param {Object} config - { trackId, durationMinutes, hintPolicy, topicFilter, topics, difficulty, questionsCount, customProblemIds, selectionMode }
     * @param {Object} ctx - User account context
     */
    createSession(allProblems = [], userStates = {}, config = {}, ctx = null) {
      const track = MOCK_TRACKS[config.trackId] || MOCK_TRACKS.faang_standard;
      
      // Parse & clamp duration (between 5 and 240 mins)
      let durationMinutes = Number(config.durationMinutes || track.defaultDuration);
      if (isNaN(durationMinutes) || durationMinutes < 5) durationMinutes = 45;
      if (durationMinutes > 240) durationMinutes = 240;

      // Question count between 1 and 5
      let questionsCount = Number(config.questionsCount || track.questionsCount || 2);
      if (isNaN(questionsCount) || questionsCount < 1) questionsCount = 1;
      if (questionsCount > 5) questionsCount = 5;

      const hintPolicy = config.hintPolicy || 'practice'; // 'strict' | 'practice' | 'penalty'
      const selectionMode = config.selectionMode || (config.customProblemIds ? 'custom' : (config.topicFilter && config.topicFilter !== 'all' ? 'topic_focused' : 'preset'));
      const difficultyMode = config.difficulty || (track.difficultyMix ? 'Mixed' : 'Mixed');

      const selectedProblems = [];
      const usedIds = new Set();

      // Mode 1: Custom problem selection
      if (Array.isArray(config.customProblemIds) && config.customProblemIds.length > 0) {
        config.customProblemIds.forEach(id => {
          if (!usedIds.has(id)) {
            const match = allProblems.find(p => p.id === id);
            if (match) {
              selectedProblems.push(match);
              usedIds.add(id);
            }
          }
        });
      }

      // Mode 2: Catalog selection if not satisfied
      if (selectedProblems.length < questionsCount && allProblems.length > 0) {
        // Topic filtering
        let candidatePool = allProblems;
        const requestedTopics = Array.isArray(config.topics) && config.topics.length > 0 
          ? config.topics 
          : (config.topicFilter && config.topicFilter !== 'all' ? [config.topicFilter] : []);

        if (requestedTopics.length > 0) {
          const canonicalList = requestedTopics.map(t => _SRSEngine ? _SRSEngine.canonicalizeTopic(t) : t);
          candidatePool = allProblems.filter(p => {
            const pTopic = _SRSEngine ? _SRSEngine.canonicalizeTopic(p.topic) : p.topic;
            return canonicalList.includes(pTopic);
          });
          // Fallback to full pool if candidate pool is smaller than required questions
          if (candidatePool.length < questionsCount) {
            candidatePool = allProblems;
          }
        }

        // Determine difficulty targets
        let diffTargets = track.difficultyMix || ['Easy', 'Medium'];
        if (difficultyMode && difficultyMode !== 'Mixed') {
          diffTargets = [difficultyMode];
        }

        // Partition candidate pool into solved vs unseen
        const solved = [];
        const unseen = [];
        candidatePool.forEach(p => {
          const s = userStates[p.id];
          if (s && (s.lastReviewed || s.solved)) solved.push(p);
          else unseen.push(p);
        });

        const needed = questionsCount - selectedProblems.length;
        for (let i = 0; i < needed; i++) {
          const targetDiff = diffTargets[i % diffTargets.length];
          const source = (i % 2 === 0 && unseen.length > 0) ? unseen : (solved.length > 0 ? solved : candidatePool);

          let match = source.find(p => p.difficulty === targetDiff && !usedIds.has(p.id));
          if (!match) match = candidatePool.find(p => p.difficulty === targetDiff && !usedIds.has(p.id));
          if (!match) match = candidatePool.find(p => !usedIds.has(p.id));
          if (!match && allProblems.length > 0) match = allProblems.find(p => !usedIds.has(p.id));

          if (match) {
            selectedProblems.push(match);
            usedIds.add(match.id);
          }
        }
      }

      const startTime = Date.now();
      const targetEndTime = startTime + (durationMinutes * 60 * 1000);

      const session = {
        sessionId: 'mock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        trackId: track.id,
        trackTitle: track.title,
        durationMinutes: durationMinutes,
        startTime: startTime,
        targetEndTime: targetEndTime,
        hintPolicy: hintPolicy,
        selectionMode: selectionMode,
        difficulty: difficultyMode,
        topics: Array.isArray(config.topics) ? config.topics : (config.topicFilter ? [config.topicFilter] : ['all']),
        problems: selectedProblems,
        answers: {},
        questionStatuses: {},
        markedForReview: {},
        activeQuestionIndex: 0,
        status: 'in_progress'
      };

      // Initialize question answer slots and statuses
      selectedProblems.forEach(p => {
        session.questionStatuses[p.id] = 'not_started';
        session.markedForReview[p.id] = false;
        session.answers[p.id] = {
          code: '',
          approach: '',
          timeComplexity: '',
          spaceComplexity: '',
          edgeCases: [],
          hintsUsedCount: 0,
          rating: 'medium',
          selfReportedStatus: 'not_assessed', // 'solved' | 'attempted' | 'unsolved' | 'not_assessed'
          provenance: 'self_reported',
          mistakeNotes: '',
          keyTakeaway: '',
          timeSpentSeconds: 0
        };
      });

      this.saveActiveSession(session, ctx);
      return session;
    },

    /**
     * Save active session to LearnerRepository or localStorage
     */
    saveActiveSession(session, ctx = null) {
      try {
        const repo = getRepo();
        if (repo) {
          if (!session) {
            repo.clearActiveMockSession(ctx);
          } else {
            repo.saveActiveMockSession(session, ctx);
          }
          return;
        }
        const storage = getLocalStorage();
        if (!storage) return;
        if (!session) {
          storage.removeItem(STORAGE_KEY_ACTIVE_MOCK);
        } else {
          storage.setItem(STORAGE_KEY_ACTIVE_MOCK, JSON.stringify(session));
        }
      } catch (e) {
        console.error('Error saving active mock session:', e);
      }
    },

    /**
     * Restore active session recalculating remaining time strictly from targetEndTime timestamp
     */
    getActiveSession(ctx = null) {
      try {
        const repo = getRepo();
        let session = null;
        if (repo) {
          session = repo.getActiveMockSession(ctx);
        } else {
          const storage = getLocalStorage();
          if (!storage) return null;
          const raw = storage.getItem(STORAGE_KEY_ACTIVE_MOCK);
          if (!raw) return null;
          session = JSON.parse(raw);
        }
        if (!session) return null;
        if (session.status !== 'in_progress') return null;

        const now = Date.now();
        const remainingSeconds = Math.max(0, Math.floor((session.targetEndTime - now) / 1000));
        session.remainingSeconds = remainingSeconds;
        session.isExpired = remainingSeconds <= 0;

        return session;
      } catch (e) {
        console.error('Error loading active mock session:', e);
        return null;
      }
    },

    /**
     * Clear active session
     */
    clearActiveSession(ctx = null) {
      const repo = getRepo();
      if (repo) {
        repo.clearActiveMockSession(ctx);
        return;
      }
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(STORAGE_KEY_ACTIVE_MOCK);
      }
    },

    /**
     * Abandon an active Mock Interview Session cleanly
     * Records an abandoned history record, clears active session, returns report
     */
    abandonSession(session = null, ctx = null) {
      const targetSession = session || this.getActiveSession(ctx);
      if (!targetSession) return null;

      const now = Date.now();
      const elapsedMinutes = Math.min(
        targetSession.durationMinutes,
        Math.max(1, Math.round((now - targetSession.startTime) / (60 * 1000)))
      );

      const questionResults = (targetSession.problems || []).map(p => {
        const ans = (targetSession.answers && targetSession.answers[p.id]) || {};
        return {
          problemId: p.id,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic,
          score: 0,
          rating: ans.rating || 'failed',
          selfReportedStatus: 'unsolved',
          provenance: 'self_reported',
          hintsUsedCount: ans.hintsUsedCount || 0,
          code: ans.code || '',
          approach: ans.approach || '',
          timeComplexity: ans.timeComplexity || '',
          spaceComplexity: ans.spaceComplexity || '',
          edgeCases: ans.edgeCases || [],
          mistakeNotes: ans.mistakeNotes || 'Session abandoned before completion.',
          analysis: null
        };
      });

      const report = {
        sessionId: targetSession.sessionId,
        completedAt: new Date().toISOString(),
        trackTitle: targetSession.trackTitle,
        durationMinutes: targetSession.durationMinutes,
        actualMinutes: elapsedMinutes,
        overallPercentage: 0,
        grade: 'Abandoned',
        status: 'abandoned',
        problemsCount: (targetSession.problems || []).length,
        attemptedCount: 0,
        completedCount: 0,
        verifiedAcceptedCount: 0,
        selfReportedSolvedCount: 0,
        reviewRequiredCount: (targetSession.problems || []).length,
        questionResults: questionResults
      };

      this._persistHistoryRecord(report, ctx);
      this.clearActiveSession(ctx);
      return report;
    },

    /**
     * Evaluate & grade completed Mock Interview Session
     * Rubric: Correctness (40%), Complexity (20%), Edge Cases (15%), Time Efficiency (15%), Hint Penalty (10%)
     * SEPARATION INVARIANT: This function NEVER mutates userStates, roadmap completion, or SRS schedules.
     */
    evaluateSession(session, userStates = {}, ctx = null) {
      if (!session) return null;

      // Idempotency: prevent double evaluation if session already recorded
      const existingHistory = this.getMockHistory(ctx);
      const duplicate = existingHistory.find(h => h.sessionId === session.sessionId);
      if (duplicate) {
        this.clearActiveSession(ctx);
        return duplicate;
      }

      const results = [];
      let totalWeightedScore = 0;
      const now = Date.now();
      const totalElapsedMinutes = Math.min(
        session.durationMinutes,
        Math.max(1, Math.round((now - session.startTime) / (60 * 1000)))
      );

      let selfReportedSolvedCount = 0;
      let attemptedCount = 0;
      let reviewRequiredCount = 0;

      const problems = session.problems || [];
      const numProblems = problems.length || 1;

      problems.forEach(p => {
        const ans = (session.answers && session.answers[p.id]) || {};
        const isMarked = !!(session.markedForReview && session.markedForReview[p.id]);

        const hasAttempt = !!(ans.code || ans.approach || ans.timeComplexity || (ans.edgeCases && ans.edgeCases.length > 0) || ans.rating !== 'medium');
        if (hasAttempt) attemptedCount++;

        // 1. Correctness / Solution Quality (0-40)
        let correctnessScore = 30; // Baseline
        if (ans.rating === 'simple') {
          correctnessScore = 40;
          selfReportedSolvedCount++;
        } else if (ans.rating === 'medium') {
          correctnessScore = 30;
          selfReportedSolvedCount++;
        } else if (ans.rating === 'hard') {
          correctnessScore = 18;
          reviewRequiredCount++;
        } else if (ans.rating === 'failed') {
          correctnessScore = 0;
          reviewRequiredCount++;
        }
        if (isMarked) reviewRequiredCount++;

        // 2. Complexity Accuracy (0-20)
        let complexityScore = 10;
        const analyzer = (typeof window !== 'undefined' && window.SolutionAnalysisEngine) || _SolutionAnalysisEngine;
        const analysis = analyzer ? analyzer.analyzeSubmission(p, ans) : null;
        if (analysis && analysis.isOptimal) {
          complexityScore = 20;
        } else if (ans.timeComplexity && ans.timeComplexity.trim().length > 0) {
          complexityScore = 14;
        }

        // 3. Edge-Case Coverage (0-15)
        const edgeCasesCount = Array.isArray(ans.edgeCases) ? ans.edgeCases.length : 0;
        const edgeCaseScore = Math.min(15, edgeCasesCount * 4);

        // 4. Time Efficiency (0-15)
        const expectedTimePerQ = session.durationMinutes / numProblems;
        const qMinutes = (ans.timeSpentSeconds || 0) / 60;
        let timeScore = 15;
        if (qMinutes > expectedTimePerQ * 1.5) timeScore = 8;
        else if (qMinutes > expectedTimePerQ * 1.2) timeScore = 12;

        // 5. Hint Penalty (Deduct up to 15 points)
        let hintPenalty = 0;
        if (session.hintPolicy !== 'practice') {
          hintPenalty = Math.min(15, (ans.hintsUsedCount || 0) * 5);
        }

        const qScore = Math.max(0, Math.min(100, correctnessScore + complexityScore + edgeCaseScore + timeScore - hintPenalty));
        totalWeightedScore += qScore;

        results.push({
          problemId: p.id,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic,
          url: p.url || '',
          score: qScore,
          rating: ans.rating || 'medium',
          selfReportedStatus: (ans.rating === 'simple' || ans.rating === 'medium') ? 'solved' : (ans.rating === 'hard' ? 'attempted' : 'unsolved'),
          provenance: 'self_reported', // Grounded provenance label
          hintsUsedCount: ans.hintsUsedCount || 0,
          code: ans.code || '',
          approach: ans.approach || '',
          timeComplexity: ans.timeComplexity || '',
          spaceComplexity: ans.spaceComplexity || '',
          edgeCases: ans.edgeCases || [],
          markedForReview: isMarked,
          mistakeNotes: ans.mistakeNotes || '',
          keyTakeaway: ans.keyTakeaway || '',
          analysis: analysis
        });
      });

      const overallPercentage = Math.round(totalWeightedScore / numProblems);

      let grade = 'Needs Practice';
      if (overallPercentage >= 85) grade = 'Outstanding (A+) - Strong Hire';
      else if (overallPercentage >= 75) grade = 'Solid Hire (A) - L4 Standard';
      else if (overallPercentage >= 60) grade = 'Borderline (B) - Needs Speed';
      else grade = 'Not Ready (C) - Reinforce Fundamentals';

      const report = {
        sessionId: session.sessionId,
        completedAt: new Date().toISOString(),
        trackTitle: session.trackTitle,
        trackId: session.trackId,
        durationMinutes: session.durationMinutes,
        actualMinutes: totalElapsedMinutes,
        overallPercentage: overallPercentage,
        grade: grade,
        status: 'completed',
        problemsCount: numProblems,
        attemptedCount: attemptedCount,
        completedCount: selfReportedSolvedCount,
        verifiedAcceptedCount: 0, // In browser sandbox without remote judging, verified accepted is strictly 0
        selfReportedSolvedCount: selfReportedSolvedCount,
        reviewRequiredCount: reviewRequiredCount,
        questionResults: results
      };

      this._persistHistoryRecord(report, ctx);
      this.clearActiveSession(ctx);
      return report;
    },

    /**
     * Internal helper to persist history with deduplication and user scoping
     */
    _persistHistoryRecord(report, ctx = null) {
      try {
        const repo = getRepo();
        if (repo) {
          const historyList = repo.getMockHistory(ctx) || [];
          const existingIdx = historyList.findIndex(h => h.sessionId === report.sessionId);
          if (existingIdx >= 0) {
            historyList[existingIdx] = report;
          } else {
            historyList.push(report);
          }
          repo.saveMockHistory(historyList, ctx);
          return;
        }

        const storage = getLocalStorage();
        if (storage) {
          const rawHistory = storage.getItem(STORAGE_KEY_MOCK_HISTORY);
          const historyList = rawHistory ? JSON.parse(rawHistory) : [];
          const existingIdx = historyList.findIndex(h => h.sessionId === report.sessionId);
          if (existingIdx >= 0) {
            historyList[existingIdx] = report;
          } else {
            historyList.push(report);
          }
          storage.setItem(STORAGE_KEY_MOCK_HISTORY, JSON.stringify(historyList));
        }
      } catch (e) {
        console.error('Error persisting mock history:', e);
      }
    },

    /**
     * Get mock history records
     */
    getMockHistory(ctx = null) {
      try {
        const repo = getRepo();
        if (repo) return repo.getMockHistory(ctx) || [];
        const storage = getLocalStorage();
        if (!storage) return [];
        const raw = storage.getItem(STORAGE_KEY_MOCK_HISTORY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Error loading mock history:', e);
        return [];
      }
    },

    /**
     * Get aggregate analytics summary for Mock Interviews
     */
    getMockStats(ctx = null) {
      const history = this.getMockHistory(ctx);
      const totalSessions = history.length;
      const completedSessions = history.filter(h => h.status !== 'abandoned');
      const abandonedCount = history.filter(h => h.status === 'abandoned').length;
      const completedCount = completedSessions.length;

      let averageScore = 0;
      let bestScore = 0;
      if (completedCount > 0) {
        const sum = completedSessions.reduce((acc, h) => acc + (h.overallPercentage || 0), 0);
        averageScore = Math.round(sum / completedCount);
        bestScore = Math.max(...completedSessions.map(h => h.overallPercentage || 0));
      }

      return {
        totalSessions,
        completedCount,
        abandonedCount,
        averageScore,
        bestScore,
        recentSessions: history.slice(-5).reverse()
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockEngine;
  }
  if (typeof window !== 'undefined') {
    window.MockEngine = MockEngine;
  }
})();
