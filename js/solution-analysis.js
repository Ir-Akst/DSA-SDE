/**
 * AlgoRecall 2.0 - Solution Analysis & Explainability Engine
 * Evaluates self-reported approach, time/space complexity accuracy,
 * and edge-case coverage against canonical references.
 */

(function () {
  'use strict';

  // Order of common time complexities for comparative ranking
  const COMPLEXITY_RANKS = {
    'O(1)': 1,
    'O(log N)': 2,
    'O(sqrt(N))': 3,
    'O(N)': 4,
    'O(N log N)': 5,
    'O(N^2)': 6,
    'O(N^3)': 7,
    'O(2^N)': 8,
    'O(N!)': 9
  };

  const SolutionAnalysisEngine = {
    COMPLEXITY_RANKS,

    /**
     * Analyze user solution submission against canonical benchmarks
     * @param {Object} problem - Problem object
     * @param {Object} submission - { approach, timeComplexity, spaceComplexity, edgeCases: [], explanation: '' }
     */
    analyzeSubmission(problem, submission = {}) {
      if (!problem) return { valid: false, error: 'Problem definition required' };

      const canonicalTime = (problem.timeComplexity || 'O(N)').trim();
      const canonicalSpace = (problem.spaceComplexity || 'O(1)').trim();
      const claimedTime = (submission.timeComplexity || '').trim();
      const claimedSpace = (submission.spaceComplexity || '').trim();

      const timeRankCanonical = COMPLEXITY_RANKS[canonicalTime] || 4;
      const timeRankClaimed = COMPLEXITY_RANKS[claimedTime] || 4;

      const spaceRankCanonical = COMPLEXITY_RANKS[canonicalSpace] || 1;
      const spaceRankClaimed = COMPLEXITY_RANKS[claimedSpace] || 1;

      // 1. Time Complexity Verification
      let timeEvaluation = { status: 'correct', message: 'Accurately identified time complexity.' };
      if (!claimedTime) {
        timeEvaluation = { status: 'missing', message: 'No time complexity specified.' };
      } else if (claimedTime === canonicalTime) {
        timeEvaluation = { status: 'correct', message: `Optimal time complexity matches canonical ${canonicalTime}.` };
      } else if (timeRankClaimed > timeRankCanonical) {
        timeEvaluation = {
          status: 'suboptimal',
          message: `Claimed ${claimedTime} is slower than optimal ${canonicalTime}. Can you optimize using a hash map or two pointers?`
        };
      } else if (timeRankClaimed < timeRankCanonical) {
        timeEvaluation = {
          status: 'overoptimistic',
          message: `Claimed ${claimedTime} appears over-optimistic for this problem class. Optimal standard is ${canonicalTime}. Double-check hidden loops or nested lookups.`
        };
      }

      // 2. Space Complexity Verification
      let spaceEvaluation = { status: 'correct', message: 'Accurately identified space complexity.' };
      if (!claimedSpace) {
        spaceEvaluation = { status: 'missing', message: 'No space complexity specified.' };
      } else if (claimedSpace === canonicalSpace) {
        spaceEvaluation = { status: 'correct', message: `Optimal auxiliary space matches canonical ${canonicalSpace}.` };
      } else if (spaceRankClaimed > spaceRankCanonical) {
        spaceEvaluation = {
          status: 'suboptimal',
          message: `Claimed ${claimedSpace} uses more auxiliary memory than canonical ${canonicalSpace}. Consider in-place pointer manipulation.`
        };
      }

      // 3. Edge-Case Coverage Score
      const checkedCases = Array.isArray(submission.edgeCases) ? submission.edgeCases : [];
      const edgeScore = Math.min(100, Math.round((checkedCases.length / 4) * 100));

      // 4. Follow-up conceptual question to test depth
      const followUpQuestions = [
        `What happens to your solution if the input length is $10^5$? Does it exceed memory or call-stack depth?`,
        `How would your algorithm behave if all elements in the input are identical?`,
        `Could this problem be solved with $O(1)$ auxiliary memory without modifying the input array?`
      ];

      return {
        valid: true,
        canonical: {
          time: canonicalTime,
          space: canonicalSpace,
          pattern: problem.pattern || 'General'
        },
        evaluation: {
          time: timeEvaluation,
          space: spaceEvaluation,
          edgeCaseCoverage: edgeScore,
          checkedEdgeCasesCount: checkedCases.length
        },
        followUpQuestion: followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)],
        isOptimal: timeEvaluation.status === 'correct' && spaceEvaluation.status === 'correct'
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SolutionAnalysisEngine;
  }
  if (typeof window !== 'undefined') {
    window.SolutionAnalysisEngine = SolutionAnalysisEngine;
  }
})();
