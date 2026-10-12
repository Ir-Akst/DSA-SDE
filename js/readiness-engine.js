/**
 * AlgoRecall 2.0 - Interview Readiness Engine
 * Computes an explainable, multi-dimensional Interview Readiness Score (0-100)
 * grounded strictly in recorded empirical evidence.
 */

(function () {
  'use strict';

  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);

  // Dimension weights (sum = 1.0)
  const DIMENSION_WEIGHTS = {
    independentSolving: 0.25,
    delayedRecall: 0.20,
    patternCoverage: 0.15,
    timeEfficiency: 0.15,
    edgeCaseRobustness: 0.15,
    mockPerformance: 0.10
  };

  const MINIMUM_EVIDENCE_THRESHOLD = {
    minProblemAttempts: 10,
    minSpacedReviews: 5
  };

  const ReadinessEngine = {
    WEIGHTS: DIMENSION_WEIGHTS,
    MIN_THRESHOLD: MINIMUM_EVIDENCE_THRESHOLD,

    /**
     * Compute comprehensive Interview Readiness Score
     * @param {Array} allProblems - Problem catalog
     * @param {Object} userStates - User states map
     * @param {Array} mockHistory - Mock interview sessions
     */
    calculateReadiness(allProblems = [], userStates = {}, mockHistory = []) {
      const allStates = Object.values(userStates).filter(s => s && s.lastReviewed);
      const totalAttempts = allStates.length;

      // Extract all review history entries
      const allReviews = [];
      allStates.forEach(s => {
        if (Array.isArray(s.history)) {
          allReviews.push(...s.history);
        }
      });

      // 1. Dimension: Independent Solving Ability (0-100)
      // Ratio of attempts solved without hints and with confidence >= 4 on their latest attempt
      let independentSolves = 0;
      allStates.forEach(s => {
        const conf = (_SRSEngine ? _SRSEngine.getConfidence(s) : (s.confidence || s.lastConfidence)) || 3;
        const hints = Boolean(s.hintsUsed === true || s.hintsUsedCount > 0);
        if (!hints && conf >= 4 && s.lastRating !== 'failed') {
          independentSolves++;
        }
      });
      const independentScore = totalAttempts > 0
        ? Math.min(100, Math.round((independentSolves / totalAttempts) * 100))
        : 0;

      // 2. Dimension: Delayed Recall Retention (0-100)
      // A review qualifies as delayed-recall evidence only when:
      // - It has a previous attempt on the same problem
      // - At least 1 calendar day has changed AND >= 18 hours elapsed
      // - It is not massed practice within the same sitting
      const eligibleDelayedReviews = [];
      let totalDelayedCredit = 0;

      allStates.forEach(s => {
        const history = Array.isArray(s.history) ? s.history : [];
        if (history.length <= 1) return;

        let lastAttemptDate = null;
        history.forEach((h, idx) => {
          if (!h) return;
          const hDate = new Date(h.date || h.reviewedAt);
          if (isNaN(hDate.getTime())) return;

          if (idx === 0) {
            lastAttemptDate = hDate;
            return;
          }

          const elapsedMs = hDate.getTime() - lastAttemptDate.getTime();
          const elapsedHours = elapsedMs / (1000 * 60 * 60);

          const toLocalDateKey = (d) => {
            const yr = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${yr}-${mo}-${day}`;
          };

          const calendarDayChanged = toLocalDateKey(hDate) !== toLocalDateKey(lastAttemptDate);
          const isMassed = Boolean(h.isMassedPractice || !calendarDayChanged || elapsedHours < 18);

          if (!isMassed) {
            eligibleDelayedReviews.push(h);

            const hints = Boolean(h.hintsUsed === true || h.hintsUsedCount > 0);
            const conf = Number(h.confidence || 3);
            const isFailed = h.rating === 'failed' || conf <= 1;

            if (isFailed || hints) {
              // 0 credit for failed or hint-assisted recall
            } else if (conf >= 4) {
              // Full credit for independent recall with confidence 4-5
              totalDelayedCredit += 1.0;
            } else if (conf === 3) {
              // Partial credit (0.5) for independent recall with minor difficulty (conf 3)
              totalDelayedCredit += 0.5;
            }

            lastAttemptDate = hDate;
          }
        });
      });

      const spacedReviewCount = eligibleDelayedReviews.length;
      let delayedRecallScore = 0;
      let delayedRecallEvidence = '';
      const isDelayedUnproven = spacedReviewCount === 0;

      if (!isDelayedUnproven) {
        delayedRecallScore = Math.min(100, Math.round((totalDelayedCredit / spacedReviewCount) * 100));
        delayedRecallEvidence = `${Math.round(totalDelayedCredit * 10) / 10}/${spacedReviewCount} retained independently`;
      } else {
        delayedRecallScore = 0;
        delayedRecallEvidence = 'Unproven — 0 eligible reviews';
      }

      // 3. Dimension: Pattern Recognition & Coverage (0-100)
      // Coverage of the 16 canonical patterns with at least 1 verified solve
      const canonicalTopics = new Set();
      const coveredTopics = new Set();
      allProblems.forEach(p => {
        const t = _SRSEngine ? _SRSEngine.canonicalizeTopic(p.topic) : p.topic;
        canonicalTopics.add(t);
        const s = userStates[p.id];
        if (s && s.lastReviewed && (!s.hintsUsed && (s.confidence || 3) >= 3)) {
          coveredTopics.add(t);
        }
      });
      const topicRatio = canonicalTopics.size > 0 ? (coveredTopics.size / canonicalTopics.size) : 0;
      const patternScore = Math.min(100, Math.round(topicRatio * 100));

      // 4. Dimension: Time Efficiency (0-100)
      // Compares recorded time with target interview budgets (Easy: 15m, Med: 30m, Hard: 45m)
      let timePassCount = 0;
      let timedProblemsCount = 0;
      allProblems.forEach(p => {
        const s = userStates[p.id];
        if (s && s.totalTimeSpent && s.totalTimeSpent > 0) {
          timedProblemsCount++;
          const avgTime = s.totalTimeSpent / Math.max(1, s.reviewCount || 1);
          let target = 30;
          if (p.difficulty === 'Easy') target = 15;
          else if (p.difficulty === 'Hard') target = 45;

          if (avgTime <= target) {
            timePassCount++;
          } else if (avgTime <= target * 1.3) {
            timePassCount += 0.5; // Partial credit
          }
        }
      });
      const timeScore = timedProblemsCount > 0
        ? Math.min(100, Math.round((timePassCount / timedProblemsCount) * 100))
        : (totalAttempts > 0 ? 60 : 0);

      // 5. Dimension: Edge Case & Correctness Robustness (0-100)
      // Penalizes failure instances logged as edge_cases or test_cases
      let edgeFailures = 0;
      allReviews.forEach(r => {
        const reasons = r.failureReasons || [];
        if (reasons.includes('edge_cases') || reasons.includes('test_cases')) {
          edgeFailures++;
        }
      });
      const edgeScore = totalAttempts > 0
        ? Math.max(20, Math.min(100, Math.round(100 - (edgeFailures / Math.max(1, totalAttempts)) * 50)))
        : 50;

      // 6. Dimension: Mock Interview Performance (0-100)
      let mockScore = 50; // Neutral baseline if unattempted
      if (Array.isArray(mockHistory) && mockHistory.length > 0) {
        const recentMocks = mockHistory.slice(-5);
        const avgMockScore = recentMocks.reduce((sum, m) => sum + (m.scorePercentage || m.percentage || 0), 0) / recentMocks.length;
        mockScore = Math.round(avgMockScore);
      }

      // Check evidence completeness (Two-Factor Threshold)
      // Requires >= 10 problem attempts AND >= 5 eligible spaced reviews
      const isProvisional = totalAttempts < MINIMUM_EVIDENCE_THRESHOLD.minProblemAttempts ||
                            spacedReviewCount < MINIMUM_EVIDENCE_THRESHOLD.minSpacedReviews;

      const attemptsProgress = Math.min(1, totalAttempts / MINIMUM_EVIDENCE_THRESHOLD.minProblemAttempts);
      const spacedProgress = Math.min(1, spacedReviewCount / MINIMUM_EVIDENCE_THRESHOLD.minSpacedReviews);
      const evidenceProgress = Math.min(100, Math.round(((attemptsProgress + spacedProgress) / 2) * 100));

      // Weighted Composite Calculation
      const rawComposite =
        (independentScore * DIMENSION_WEIGHTS.independentSolving) +
        (delayedRecallScore * DIMENSION_WEIGHTS.delayedRecall) +
        (patternScore * DIMENSION_WEIGHTS.patternCoverage) +
        (timeScore * DIMENSION_WEIGHTS.timeEfficiency) +
        (edgeScore * DIMENSION_WEIGHTS.edgeCaseRobustness) +
        (mockScore * DIMENSION_WEIGHTS.mockPerformance);

      const overallScore = Math.max(0, Math.min(100, Math.round(rawComposite)));

      // Letter grade & readiness label
      let baseGrade = 'Not Ready';
      let statusColor = '#ef4444';
      if (overallScore >= 85) {
        baseGrade = 'Interview Ready (L4/L5 Strong)';
        statusColor = '#10b981';
      } else if (overallScore >= 70) {
        baseGrade = 'Promising Candidate (L4 Borderline)';
        statusColor = '#38bdf8';
      } else if (overallScore >= 55) {
        baseGrade = 'Developing Competence';
        statusColor = '#f59e0b';
      } else {
        baseGrade = 'Foundations Needed';
        statusColor = '#f43f5e';
      }

      const grade = isProvisional ? `${baseGrade} (Provisional)` : baseGrade;

      // Identify strengths and weaknesses
      const dimensions = [
        { key: 'independentSolving', label: 'Independent Solving', score: independentScore, weight: DIMENSION_WEIGHTS.independentSolving, evidence: `${independentSolves}/${totalAttempts} solves independent` },
        { key: 'delayedRecall', label: 'Delayed Recall Retention', score: delayedRecallScore, weight: DIMENSION_WEIGHTS.delayedRecall, evidence: delayedRecallEvidence, isUnproven: isDelayedUnproven },
        { key: 'patternCoverage', label: 'Pattern Breadth', score: patternScore, weight: DIMENSION_WEIGHTS.patternCoverage, evidence: `${coveredTopics.size}/${canonicalTopics.size} core topics covered` },
        { key: 'timeEfficiency', label: 'Time Efficiency', score: timeScore, weight: DIMENSION_WEIGHTS.timeEfficiency, evidence: `${Math.round(timePassCount)}/${timedProblemsCount} within target pace` },
        { key: 'edgeCaseRobustness', label: 'Edge-Case Robustness', score: edgeScore, weight: DIMENSION_WEIGHTS.edgeCaseRobustness, evidence: `${edgeFailures} edge-case failures recorded` },
        { key: 'mockPerformance', label: 'Mock Assessment Rigor', score: mockScore, weight: DIMENSION_WEIGHTS.mockPerformance, evidence: `${mockHistory.length} mock rounds logged` }
      ];

      const strongAreas = dimensions.filter(d => d.score >= 70 && !d.isUnproven).sort((a, b) => b.score - a.score);
      const weakAreas = dimensions.filter(d => d.score < 60 || d.isUnproven).sort((a, b) => a.score - b.score);

      // Recommendations
      const recommendedActions = [];
      if (independentScore < 65) {
        recommendedActions.push('Reduce hint reliance: Solve Medium problems with a strict 20-minute no-hint rule.');
      }
      if (isDelayedUnproven) {
        recommendedActions.push('Complete overdue spaced reviews: Delayed recall is unproven until problems are reviewed after retention intervals.');
      } else if (delayedRecallScore < 60) {
        recommendedActions.push('Clear overdue revision queue: Consistent spaced repetitions cement fading patterns.');
      }
      if (edgeScore < 65) {
        recommendedActions.push('Adopt the 5-point boundary checklist before coding any submission.');
      }
      if (mockHistory.length === 0) {
        recommendedActions.push('Complete at least one timed 45-minute mock interview round to calibrate under pressure.');
      }
      if (recommendedActions.length === 0) {
        recommendedActions.push('Maintain rhythm: Complete today’s revision queue and attempt 1 Hard challenge.');
      }

      return {
        overallScore: overallScore,
        grade: grade,
        statusColor: statusColor,
        isProvisional: isProvisional,
        evidenceProgress: evidenceProgress,
        totalAttempts: totalAttempts,
        spacedReviewCount: spacedReviewCount,
        dimensions: dimensions,
        strongAreas: strongAreas,
        weakAreas: weakAreas,
        recommendedActions: recommendedActions,
        calculatedAt: new Date().toISOString()
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReadinessEngine;
  }
  if (typeof window !== 'undefined') {
    window.ReadinessEngine = ReadinessEngine;
  }
})();
