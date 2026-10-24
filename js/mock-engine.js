/**
 * AlgoRecall 2.0 - Realistic Mock Interview Engine
 * Manages full interview workflows with:
 * - Configurable tracks, difficulty balances, and hint policies
 * - Absolute timestamp-based countdown persistence (resilient to reload)
 * - Multi-criteria rubric grading & feedback reports
 * - Automatic SRS and Readiness sync
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
      description: '60-90 minute 3-problem interview simulating on-site loop.',
      defaultDuration: 60,
      questionsCount: 3,
      difficultyMix: ['Easy', 'Medium', 'Hard']
    }
  };

  const MockEngine = {
    TRACKS: MOCK_TRACKS,

    /**
     * Generate new Mock Interview Session
     * @param {Array} allProblems - Entire problem catalog
     * @param {Object} userStates - Problem states map
     * @param {Object} config - { trackId, durationMinutes, hintPolicy, topicFilter }
     */
    createSession(allProblems = [], userStates = {}, config = {}) {
      const track = MOCK_TRACKS[config.trackId] || MOCK_TRACKS.faang_standard;
      const durationMinutes = Number(config.durationMinutes || track.defaultDuration);
      const questionsCount = Number(config.questionsCount || track.questionsCount);
      const hintPolicy = config.hintPolicy || 'practice'; // 'strict' | 'practice' | 'penalty'

      // Filter candidates by topic if specified
      let candidatePool = allProblems;
      if (config.topicFilter && config.topicFilter !== 'all') {
        const canonical = _SRSEngine ? _SRSEngine.canonicalizeTopic(config.topicFilter) : config.topicFilter;
        candidatePool = allProblems.filter(p => (_SRSEngine ? _SRSEngine.canonicalizeTopic(p.topic) : p.topic) === canonical);
        if (candidatePool.length < questionsCount) candidatePool = allProblems;
      }

      // Partition into solved (retention check) vs unseen
      const solved = [];
      const unseen = [];
      candidatePool.forEach(p => {
        const s = userStates[p.id];
        if (s && s.lastReviewed) solved.push(p);
        else unseen.push(p);
      });

      // Select problems matching difficultyMix
      const selectedProblems = [];
      const usedIds = new Set();
      const diffTargets = track.difficultyMix || ['Easy', 'Medium'];

      for (let i = 0; i < questionsCount; i++) {
        const targetDiff = diffTargets[i % diffTargets.length];
        // 50% chance from unseen, 50% from retention check if available
        const source = (i % 2 === 0 && unseen.length > 0) ? unseen : (solved.length > 0 ? solved : candidatePool);

        let match = source.find(p => p.difficulty === targetDiff && !usedIds.has(p.id));
        if (!match) match = candidatePool.find(p => p.difficulty === targetDiff && !usedIds.has(p.id));
        if (!match) match = candidatePool.find(p => !usedIds.has(p.id));

        if (match) {
          selectedProblems.push(match);
          usedIds.add(match.id);
        }
      }

      const startTime = Date.now();
      const targetEndTime = startTime + (durationMinutes * 60 * 1000);

      const session = {
        sessionId: 'mock-' + Date.now(),
        trackId: track.id,
        trackTitle: track.title,
        durationMinutes: durationMinutes,
        startTime: startTime,
        targetEndTime: targetEndTime,
        hintPolicy: hintPolicy,
        problems: selectedProblems,
        answers: {}, // probId -> { code, approach, timeComplexity, spaceComplexity, edgeCases: [], hintsUsedCount: 0, rating: '' }
        activeQuestionIndex: 0,
        status: 'in_progress'
      };

      // Initialize empty answer slots
      selectedProblems.forEach(p => {
        session.answers[p.id] = {
          code: '',
          approach: '',
          timeComplexity: '',
          spaceComplexity: '',
          edgeCases: [],
          hintsUsedCount: 0,
          rating: 'medium',
          selfReportedConfidence: 3,
          timeSpentSeconds: 0
        };
      });

      this.saveActiveSession(session);
      return session;
    },

    /**
     * Save active session to localStorage or LearnerRepository
     */
    saveActiveSession(session, ctx) {
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
    getActiveSession(ctx) {
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
    clearActiveSession(ctx) {
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
     * Evaluate & grade completed Mock Interview Session
     * Rubric: Correctness (40%), Complexity (20%), Edge Cases (15%), Time Efficiency (15%), Hint Penalty (10%)
     */
    evaluateSession(session, userStates = {}) {
      if (!session) return null;

      const results = [];
      let totalWeightedScore = 0;
      const now = Date.now();
      const totalElapsedMinutes = Math.min(
        session.durationMinutes,
        Math.max(1, Math.round((now - session.startTime) / (60 * 1000)))
      );

      session.problems.forEach(p => {
        const ans = session.answers[p.id] || {};
        let qScore = 0;

        // 1. Correctness / Solution Quality (0-40)
        let correctnessScore = 30; // Baseline
        if (ans.rating === 'simple') correctnessScore = 40;
        else if (ans.rating === 'medium') correctnessScore = 30;
        else if (ans.rating === 'hard') correctnessScore = 18;
        else if (ans.rating === 'failed') correctnessScore = 0;

        // 2. Complexity Accuracy (0-20)
        let complexityScore = 10;
        const analyzer = (typeof window !== 'undefined' && window.SolutionAnalysisEngine) || _SolutionAnalysisEngine;
        const analysis = analyzer ? analyzer.analyzeSubmission(p, ans) : null;
        if (analysis && analysis.isOptimal) {
          complexityScore = 20;
        } else if (ans.timeComplexity) {
          complexityScore = 14;
        }

        // 3. Edge-Case Coverage (0-15)
        const edgeCasesCount = Array.isArray(ans.edgeCases) ? ans.edgeCases.length : 0;
        const edgeCaseScore = Math.min(15, edgeCasesCount * 4);

        // 4. Time Efficiency (0-15)
        const expectedTimePerQ = session.durationMinutes / session.problems.length;
        const qMinutes = (ans.timeSpentSeconds || 0) / 60;
        let timeScore = 15;
        if (qMinutes > expectedTimePerQ * 1.5) timeScore = 8;
        else if (qMinutes > expectedTimePerQ * 1.2) timeScore = 12;

        // 5. Hint Penalty (Deduct up to 15 points)
        let hintPenalty = 0;
        if (session.hintPolicy !== 'practice') {
          hintPenalty = Math.min(15, (ans.hintsUsedCount || 0) * 5);
        }

        qScore = Math.max(0, Math.min(100, correctnessScore + complexityScore + edgeCaseScore + timeScore - hintPenalty));
        totalWeightedScore += qScore;

        results.push({
          problemId: p.id,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic,
          score: qScore,
          rating: ans.rating,
          hintsUsedCount: ans.hintsUsedCount || 0,
          analysis: analysis
        });
      });

      const overallPercentage = Math.round(totalWeightedScore / session.problems.length);

      let grade = 'Needs Practice';
      if (overallPercentage >= 85) grade = 'Outstanding (A+) - Strong Hire';
      else if (overallPercentage >= 75) grade = 'Solid Hire (A) - L4 Standard';
      else if (overallPercentage >= 60) grade = 'Borderline (B) - Needs Speed';
      else grade = 'Not Ready (C) - Reinforce Fundamentals';

      const report = {
        sessionId: session.sessionId,
        completedAt: new Date().toISOString(),
        trackTitle: session.trackTitle,
        durationMinutes: session.durationMinutes,
        actualMinutes: totalElapsedMinutes,
        overallPercentage: overallPercentage,
        grade: grade,
        problemsCount: session.problems.length,
        questionResults: results
      };

      // Save to mock history
      try {
        const repo = getRepo();
        if (repo) {
          const historyList = repo.getMockHistory() || [];
          historyList.push(report);
          repo.saveMockHistory(historyList);
        } else {
          const storage = getLocalStorage();
          if (storage) {
            const rawHistory = storage.getItem(STORAGE_KEY_MOCK_HISTORY);
            const historyList = rawHistory ? JSON.parse(rawHistory) : [];
            historyList.push(report);
            storage.setItem(STORAGE_KEY_MOCK_HISTORY, JSON.stringify(historyList));
          }
        }
      } catch (e) {
        console.error('Error saving mock history:', e);
      }

      this.clearActiveSession();
      return report;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockEngine;
  }
  if (typeof window !== 'undefined') {
    window.MockEngine = MockEngine;
  }
})();
