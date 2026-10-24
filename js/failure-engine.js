/**
 * AlgoRecall 2.0 - Failure Intelligence Engine
 * Classifies failure modes, aggregates topic/pattern weakness profiles,
 * and prescribes targeted learning actions with explicit user-facing rationales.
 */

(function () {
  'use strict';

  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);

  const FAILURE_CATEGORIES = {
    pattern_recognition: {
      id: 'pattern_recognition',
      label: 'Pattern Recognition',
      description: 'Could not identify the canonical pattern or technique required',
      icon: 'fa-eye-slash',
      color: '#f43f5e',
      prescribedAction: 'Drill trigger-recognition exercises and inspect the Patterns Handbook templates before writing code.',
      recommendationTag: 'Trigger Drill'
    },
    algorithm_derivation: {
      id: 'algorithm_derivation',
      label: 'Algorithm Derivation',
      description: 'Identified the general category but could not derive the mathematical or algorithmic invariant',
      icon: 'fa-brain',
      color: '#fb7185',
      prescribedAction: 'Study the mathematical proofs and invariant properties for this pattern.',
      recommendationTag: 'Invariant Study'
    },
    implementation: {
      id: 'implementation',
      label: 'Implementation & Syntax',
      description: 'Understood the optimal approach conceptually but struggled to code the data structures or pointers correctly',
      icon: 'fa-code',
      color: '#fbbf24',
      prescribedAction: 'Practice clean boilerplate implementations on simpler foundational stepping-stone problems.',
      recommendationTag: 'Foundational Drill'
    },
    test_cases: {
      id: 'test_cases',
      label: 'Failed Test Cases',
      description: 'Code produced wrong answers on hidden test inputs or unexpected inputs',
      icon: 'fa-bug',
      color: '#f97316',
      prescribedAction: 'Perform systematic manual dry-runs with small sample inputs before running submissions.',
      recommendationTag: 'Dry-Run Practice'
    },
    edge_cases: {
      id: 'edge_cases',
      label: 'Missed Edge Cases',
      description: 'Overlooked empty arrays, single elements, negative numbers, duplicates, or integer overflow',
      icon: 'fa-triangle-exclamation',
      color: '#eab308',
      prescribedAction: 'Consult the 5-point boundary checklist: empty, 1-element, duplicates, extremes, and negatives.',
      recommendationTag: 'Edge-Case Checklist'
    },
    complexity: {
      id: 'complexity',
      label: 'Complexity Mismatch',
      description: 'Produced a brute-force or quadratic solution exceeding interview time/space constraints',
      icon: 'fa-gauge-high',
      color: '#a855f7',
      prescribedAction: 'Compare brute-force tradeoffs with optimal space-time complexities in the catalog.',
      recommendationTag: 'Tradeoff Analysis'
    },
    time_management: {
      id: 'time_management',
      label: 'Time Management',
      description: 'Took significantly longer than typical interview limits (Easy >15m, Med >30m, Hard >45m)',
      icon: 'fa-stopwatch',
      color: '#ec4899',
      prescribedAction: 'Run 10-minute flashcard intuition quizzes and timed mock interview rounds to build speed.',
      recommendationTag: 'Speed Drill'
    },
    hint_dependency: {
      id: 'hint_dependency',
      label: 'Hint Dependency',
      description: 'Needed external hints or peeked at the editorial to get unstuck',
      icon: 'fa-lightbulb',
      color: '#06b6d4',
      prescribedAction: 'Reattempt this problem independently in 48 hours without opening hints.',
      recommendationTag: 'Independent Reattempt'
    },
    retention_decay: {
      id: 'retention_decay',
      label: 'Retention Decay',
      description: 'Previously solved this problem but completely forgot the core trick or approach',
      icon: 'fa-clock-rotate-left',
      color: '#8b5cf6',
      prescribedAction: 'Fast-track through flashcards and reset Spaced Repetition interval to solidify recall.',
      recommendationTag: 'Retention Reset'
    }
  };

  const FailureEngine = {
    CATEGORIES: FAILURE_CATEGORIES,

    /**
     * Get all category definitions as an array
     */
    getAllCategories() {
      return Object.values(FAILURE_CATEGORIES);
    },

    /**
     * Analyze user states and compile a structured weakness profile
     * @param {Array} allProblems - Problem catalog
     * @param {Object} userStates - User states map
     */
    computeWeaknessProfile(allProblems = [], userStates = {}) {
      const categoryCounts = {};
      const topicFailures = {};
      const patternFailures = {};
      let totalFailureInstances = 0;

      // Initialize category counters
      Object.keys(FAILURE_CATEGORIES).forEach(k => {
        categoryCounts[k] = 0;
      });

      const problemMap = new Map();
      allProblems.forEach(p => problemMap.set(p.id, p));

      Object.keys(userStates).forEach(probId => {
        const state = userStates[probId];
        if (!state) return;

        const problem = problemMap.get(probId);
        const topic = problem ? (_SRSEngine ? _SRSEngine.canonicalizeTopic(problem.topic) : problem.topic) : 'Basics & Math';
        const pattern = (problem && problem.pattern) ? problem.pattern.trim() : 'General Pattern';

        // Check recent failure reasons in history
        const history = Array.isArray(state.history) ? state.history : [];
        history.forEach(h => {
          const reasons = Array.isArray(h.failureReasons) ? h.failureReasons : [];
          if (reasons.length > 0) {
            reasons.forEach(r => {
              if (categoryCounts[r] !== undefined) {
                categoryCounts[r]++;
                totalFailureInstances++;

                // Topic breakdown
                if (!topicFailures[topic]) topicFailures[topic] = {};
                topicFailures[topic][r] = (topicFailures[topic][r] || 0) + 1;

                // Pattern breakdown
                if (!patternFailures[pattern]) patternFailures[pattern] = {};
                patternFailures[pattern][r] = (patternFailures[pattern][r] || 0) + 1;
              }
            });
          } else if (h.rating === 'failed' || (h.confidence && h.confidence <= 2)) {
            // Inferred fallback failure if not explicitly tagged
            const fallbackKey = h.hintsUsed ? 'hint_dependency' : 'algorithm_derivation';
            categoryCounts[fallbackKey]++;
            totalFailureInstances++;

            if (!topicFailures[topic]) topicFailures[topic] = {};
            topicFailures[topic][fallbackKey] = (topicFailures[topic][fallbackKey] || 0) + 1;
          }
        });
      });

      // Sort categories by frequency
      const rankedCategories = Object.keys(categoryCounts)
        .map(k => ({
          ...FAILURE_CATEGORIES[k],
          count: categoryCounts[k],
          percentage: totalFailureInstances > 0 ? Math.round((categoryCounts[k] / totalFailureInstances) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Identify top failure patterns and topics
      const topWeakTopics = Object.keys(topicFailures).map(top => {
        const total = Object.values(topicFailures[top]).reduce((acc, v) => acc + v, 0);
        return { topic: top, totalFailures: total, breakdown: topicFailures[top] };
      }).sort((a, b) => b.totalFailures - a.totalFailures);

      const topWeakPatterns = Object.keys(patternFailures).map(pat => {
        const total = Object.values(patternFailures[pat]).reduce((acc, v) => acc + v, 0);
        return { pattern: pat, totalFailures: total, breakdown: patternFailures[pat] };
      }).sort((a, b) => b.totalFailures - a.totalFailures);

      return {
        totalFailures: totalFailureInstances,
        rankedCategories: rankedCategories,
        topFailure: rankedCategories[0] || null,
        topWeakTopics: topWeakTopics.slice(0, 5),
        topWeakPatterns: topWeakPatterns.slice(0, 5),
        topicFailures: topicFailures,
        patternFailures: patternFailures
      };
    },

    /**
     * Prescribe a targeted recommendation for a problem with explicit reason
     * @param {Object} problem - Problem object
     * @param {Array} failureReasons - List of failure reason IDs
     */
    getPrescription(problem, failureReasons = []) {
      if (!failureReasons || failureReasons.length === 0) {
        return {
          tag: 'Standard Practice',
          reason: 'Solidify algorithmic intuition through consistent spaced repetition.',
          actionText: 'Review and solve without checking hints.'
        };
      }

      const primaryReason = failureReasons[0];
      const cat = FAILURE_CATEGORIES[primaryReason] || FAILURE_CATEGORIES.algorithm_derivation;

      return {
        tag: cat.recommendationTag,
        primaryFailure: cat.label,
        reason: `Prescribed due to previous struggle with ${cat.label.toLowerCase()} on this topic.`,
        actionText: cat.prescribedAction,
        icon: cat.icon,
        color: cat.color
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FailureEngine;
  }
  if (typeof window !== 'undefined') {
    window.FailureEngine = FailureEngine;
  }
})();
