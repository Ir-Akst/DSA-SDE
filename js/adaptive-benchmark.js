/**
 * AlgoRecall 2.2 - Adaptive Policy Benchmark & Ablation Engine
 * Evaluates adaptive learning decisions against simple baselines and ablations
 * using identical synthetic learner trajectories and controlled deterministic seeds.
 * 
 * NOTE: Synthetic benchmark performance evaluates algorithmic decision consistency;
 * it is NOT proof of real-world human learning improvement.
 */

(function () {
  'use strict';

  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);
  const _AdaptiveLearningEngine = (typeof window !== 'undefined' && window.AdaptiveLearningEngine) || (typeof require !== 'undefined' ? require('./adaptive-learning-engine') : null);
  const _TimeTravelSimulator = (typeof window !== 'undefined' && window.TimeTravelSimulator) || (typeof require !== 'undefined' ? require('./time-travel-simulator') : null);

  const AdaptiveBenchmark = {
    /**
     * POLICY IMPLEMENTATIONS
     */

    /**
     * Policy A: Full Adaptive Policy
     */
    policyAdaptive(catalog = [], userStates = {}, context = {}) {
      if (!_AdaptiveLearningEngine) return null;
      return _AdaptiveLearningEngine.selectNextAction(catalog, userStates, context);
    },

    /**
     * Policy B: Simple Baseline Policy
     * 1. Prioritize due/overdue revisions.
     * 2. Practice weakest topic (lowest avg confidence).
     * 3. Advance to new problems.
     */
    policySimpleBaseline(catalog = [], userStates = {}, context = {}) {
      if (!Array.isArray(catalog) || catalog.length === 0) return null;
      const recentIds = context.recentlyAttemptedIds || [];

      // 1. Due / Overdue spaced reviews
      const due = catalog.filter(p => {
        const s = userStates[p.id];
        if (!s || !s.lastReviewed) return false;
        return _SRSEngine ? (_SRSEngine.isDue(s) || _SRSEngine.isOverdue(s)) : false;
      });

      if (due.length > 0) {
        const chosen = due.find(p => !recentIds.includes(p.id)) || due[0];
        return {
          policy: 'baseline-simple',
          action: 'spaced_revision',
          problemId: chosen.id,
          problemTitle: chosen.title,
          topic: chosen.topic,
          reasonCode: 'BASELINE_DUE_REVIEW',
          explanation: `Spaced revision due for "${chosen.title}".`
        };
      }

      // 2. Weakest topic (lowest average confidence)
      const topicScores = {};
      const topicCounts = {};
      catalog.forEach(p => {
        const s = userStates[p.id];
        if (s && s.lastReviewed) {
          const t = p.topic;
          const conf = typeof s.confidence === 'number' ? s.confidence : 3;
          topicScores[t] = (topicScores[t] || 0) + conf;
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        }
      });

      let weakestTopic = null;
      let lowestAvg = Infinity;
      Object.keys(topicScores).forEach(t => {
        const avg = topicScores[t] / topicCounts[t];
        if (avg < lowestAvg) {
          lowestAvg = avg;
          weakestTopic = t;
        }
      });

      if (weakestTopic && lowestAvg <= 2.5) {
        const weakProblem = catalog.find(p => p.topic === weakestTopic && (!userStates[p.id] || userStates[p.id].confidence <= 2) && !recentIds.includes(p.id)) ||
                            catalog.find(p => p.topic === weakestTopic);
        if (weakProblem) {
          return {
            policy: 'baseline-simple',
            action: 'weak_topic_practice',
            problemId: weakProblem.id,
            problemTitle: weakProblem.title,
            topic: weakProblem.topic,
            reasonCode: 'BASELINE_WEAK_TOPIC',
            explanation: `Practicing weakest topic: "${weakestTopic}".`
          };
        }
      }

      // 3. Fresh unattempted problem
      const fresh = catalog.filter(p => !userStates[p.id] || !userStates[p.id].lastReviewed);
      const chosenFresh = fresh.find(p => !recentIds.includes(p.id)) || fresh[0] || catalog[0];

      return {
        policy: 'baseline-simple',
        action: 'fresh_attempt',
        problemId: chosenFresh.id,
        problemTitle: chosenFresh.title,
        topic: chosenFresh.topic,
        reasonCode: 'BASELINE_FRESH_PROBLEM',
        explanation: `Advance to fresh problem: "${chosenFresh.title}".`
      };
    },

    /**
     * Policy C.1 Ablation: No Hint Dependency
     * Ignores hint assistance, treating assisted solves as normal masteries.
     */
    policyAblationNoHint(catalog = [], userStates = {}, context = {}) {
      // Clone userStates and strip hintsUsed
      const scrubbed = {};
      Object.keys(userStates).forEach(id => {
        const orig = userStates[id];
        if (orig) {
          scrubbed[id] = { ...orig, hintsUsed: false };
          if (Array.isArray(orig.history)) {
            scrubbed[id].history = orig.history.map(h => ({ ...h, hintsUsed: false }));
          }
        }
      });
      return this.policyAdaptive(catalog, scrubbed, context);
    },

    /**
     * Policy C.2 Ablation: No Prerequisite Gaps
     * Disables GraphEngine prerequisite inspection.
     */
    policyAblationNoPrereq(catalog = [], userStates = {}, context = {}) {
      if (!_AdaptiveLearningEngine) return null;
      // Evaluate without prerequisite engine signal
      const struggling = catalog.filter(p => {
        const s = userStates[p.id];
        return s && s.lastReviewed && (s.lastRating === 'failed' || s.confidence <= 2);
      });

      if (struggling.length > 0) {
        const chosen = struggling[0];
        return {
          policy: 'ablation-no-prereq',
          action: 'independent_retry',
          problemId: chosen.id,
          problemTitle: chosen.title,
          topic: chosen.topic,
          reasonCode: 'ABLATION_NO_PREREQ_RETRY',
          explanation: `Direct retry on failing problem "${chosen.title}" without prerequisite drill.`
        };
      }

      return this.policyAdaptive(catalog, userStates, context);
    },

    /**
     * Policy C.3 Ablation: No Retention Decay Fast-Track
     * Treats drops on high-stage problems as standard initial failures.
     */
    policyAblationNoDecay(catalog = [], userStates = {}, context = {}) {
      // Downgrade stage in evidence to ignore retention decay
      const scrubbed = {};
      Object.keys(userStates).forEach(id => {
        const orig = userStates[id];
        if (orig) {
          scrubbed[id] = { ...orig, stage: 1, isMastered: false };
        }
      });
      return this.policyAdaptive(catalog, scrubbed, context);
    },

    /**
     * RUN BENCHMARK SUITE
     * Executes identical test scenarios across Policy A, Baseline B, and Ablations C.
     * @param {Array} catalog - Problem catalog
     * @param {Object} options - Benchmark options { rounds: 20, seed: 42 }
     */
    runBenchmark(catalogOrOptions = [], options = {}) {
      let catalog = catalogOrOptions;
      let opts = options;
      if (!Array.isArray(catalogOrOptions) && typeof catalogOrOptions === 'object' && catalogOrOptions !== null) {
        catalog = catalogOrOptions.catalog || [];
        opts = catalogOrOptions;
      }

      if (!Array.isArray(catalog) || catalog.length === 0) {
        throw new Error('runBenchmark requires a valid problem catalog');
      }

      const policies = [
        { id: 'adaptive', name: 'AlgoRecall Adaptive Policy (Full Loop)', fn: this.policyAdaptive.bind(this) },
        { id: 'baseline', name: 'Simple Baseline (Due -> Weak -> Fresh)', fn: this.policySimpleBaseline.bind(this) },
        { id: 'ablation-no-hint', name: 'Ablation: Without Hint-Dependency Gating', fn: this.policyAblationNoHint.bind(this) },
        { id: 'ablation-no-prereq', name: 'Ablation: Without Prerequisite Foundation Remediation', fn: this.policyAblationNoPrereq.bind(this) },
        { id: 'ablation-no-decay', name: 'Ablation: Without Retention Decay Fast-Tracking', fn: this.policyAblationNoDecay.bind(this) }
      ];

      // Define standard synthetic evaluation scenarios
      const scenarios = [
        {
          name: 'Fresh Learner Cold-Start',
          states: {},
          context: {}
        },
        {
          name: 'Overdue Reviews Present',
          states: {
            [catalog[0].id]: {
              stage: 2,
              confidence: 3,
              lastReviewed: new Date(Date.now() - 30 * 86400000).toISOString(),
              nextReviewDate: '2026-09-01',
              lastRating: 'medium'
            }
          },
          context: {}
        },
        {
          name: 'Memory Decay on Mastered Problem',
          states: {
            [catalog[0].id]: {
              stage: 4,
              isMastered: true,
              confidence: 2,
              lastRating: 'failed',
              lastReviewed: new Date().toISOString(),
              history: [
                { date: '2026-08-01T10:00:00.000Z', rating: 'simple', confidence: 5 },
                { date: '2026-08-10T10:00:00.000Z', rating: 'simple', confidence: 5 },
                { date: '2026-08-30T10:00:00.000Z', rating: 'simple', confidence: 5 },
                { date: new Date().toISOString(), rating: 'failed', confidence: 2 }
              ]
            }
          },
          context: {}
        },
        {
          name: 'Hint-Assisted Solves (Recognition vs Recall)',
          states: {
            [catalog[0].id]: {
              stage: 1,
              confidence: 4,
              hintsUsed: true,
              lastRating: 'simple',
              lastReviewed: new Date().toISOString(),
              history: [{ date: new Date().toISOString(), rating: 'simple', confidence: 4, hintsUsed: true }]
            }
          },
          context: {}
        },
        {
          name: 'Repeated Problem Loop Resistance',
          states: {
            [catalog[0].id]: {
              stage: 1,
              confidence: 1,
              lastRating: 'failed',
              lastReviewed: new Date().toISOString(),
              failureReasons: ['pattern_misidentification']
            }
          },
          context: {
            recentlyAttemptedIds: [catalog[0].id]
          }
        }
      ];

      const results = {};

      policies.forEach(p => {
        let repeatCount = 0;
        let dueNeglectCount = 0;
        let stabilityViolations = 0;
        let recommendationsLogged = [];

        scenarios.forEach((sc, scIdx) => {
          // Stability test: Run 3 times on identical state
          const r1 = p.fn(catalog, sc.states, sc.context);
          const r2 = p.fn(catalog, sc.states, sc.context);
          const r3 = p.fn(catalog, sc.states, sc.context);

          if (!r1 || !r2 || !r3 || r1.problemId !== r2.problemId || r2.problemId !== r3.problemId) {
            stabilityViolations++;
          }

          if (r1) {
            recommendationsLogged.push(r1);

            // Repeat check against recentIds
            if ((sc.context.recentlyAttemptedIds || []).includes(r1.problemId)) {
              repeatCount++;
            }

            // Due neglect check: if overdue items exist, did policy neglect them for fresh problems?
            const hasOverdue = Object.values(sc.states).some(s => s && s.nextReviewDate && s.nextReviewDate < new Date().toISOString().split('T')[0]);
            if (hasOverdue && r1.action === 'fresh_attempt') {
              dueNeglectCount++;
            }
          }
        });

        const totalRuns = scenarios.length;
        const repeatRate = Math.round((repeatCount / totalRuns) * 100);
        const dueNeglectRate = Math.round((dueNeglectCount / totalRuns) * 100);
        const stabilityScore = Math.round(((totalRuns - stabilityViolations) / totalRuns) * 100);

        results[p.id] = {
          id: p.id,
          name: p.name,
          repeatRatePercent: repeatRate,
          dueNeglectRatePercent: dueNeglectRate,
          stabilityPercent: stabilityScore,
          totalScenariosEvaluated: totalRuns,
          recommendationsCount: recommendationsLogged.length,
          sampleActions: recommendationsLogged.map(r => r.action)
        };
      });

      return {
        timestamp: new Date().toISOString(),
        totalScenarios: scenarios.length,
        policiesEvaluated: policies.length,
        results,
        disclaimer: 'Synthetic benchmark results evaluate deterministic policy invariants. They do not constitute empirical evidence of human learning efficacy.'
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveBenchmark;
  }
  if (typeof window !== 'undefined') {
    window.AdaptiveBenchmark = AdaptiveBenchmark;
  }
})();
