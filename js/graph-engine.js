/**
 * AlgoRecall 2.0 - Prerequisite Learning Graph Engine
 * Evaluates node proficiency, identifies missing foundational prerequisites,
 * and advises learners on optimal structured learning paths.
 */

(function () {
  'use strict';

  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);
  const _DSA_PREREQUISITE_GRAPH = (typeof window !== 'undefined' && window.DSA_PREREQUISITE_GRAPH) || (typeof require !== 'undefined' ? require('./data/prerequisite-graph') : []);

  const GraphEngine = {
    /**
     * Compute status and proficiency for all nodes in the learning graph
     * @param {Array} allProblems - Entire problem catalog
     * @param {Object} userStates - User states map
     */
    evaluateGraph(allProblems = [], userStates = {}) {
      const graph = (typeof window !== 'undefined' && window.DSA_PREREQUISITE_GRAPH) || _DSA_PREREQUISITE_GRAPH || [];
      const nodeStatusMap = {};

      // Build topic-problem index
      const topicProblemMap = {};
      allProblems.forEach(p => {
        const t = _SRSEngine ? _SRSEngine.canonicalizeTopic(p.topic) : p.topic;
        if (!topicProblemMap[t]) topicProblemMap[t] = [];
        topicProblemMap[t].push(p);
      });

      // 1. Compute initial stats for each node
      graph.forEach(node => {
        const topic = _SRSEngine ? _SRSEngine.canonicalizeTopic(node.topic) : node.topic;
        const relatedProblems = topicProblemMap[topic] || [];

        let solvedCount = 0;
        let independentSolvedCount = 0;
        let masteredCount = 0;
        let totalScore = 0;

        relatedProblems.forEach(p => {
          const s = userStates[p.id];
          if (s && s.lastReviewed) {
            solvedCount++;
            if (!s.hintsUsed && (s.confidence || 3) >= 4) {
              independentSolvedCount++;
            }
            if (s.isMastered) masteredCount++;
            totalScore += Math.min(s.stage || 1, 4) * 25; // 0-100 per problem
          }
        });

        const totalProbs = relatedProblems.length || 1;
        const avgScore = solvedCount > 0 ? Math.min(100, Math.round(totalScore / totalProbs)) : 0;
        const independentRate = solvedCount > 0 ? Math.round((independentSolvedCount / solvedCount) * 100) : 0;

        nodeStatusMap[node.id] = {
          ...node,
          totalProblems: relatedProblems.length,
          solvedCount,
          independentSolvedCount,
          masteredCount,
          proficiencyScore: avgScore,
          independentRate,
          relatedProblems: relatedProblems.slice(0, 10),
          status: 'locked' // Will resolve in pass 2
        };
      });

      // 2. Resolve dependency statuses: 'mastered' | 'proficient' | 'learning' | 'available' | 'locked'
      graph.forEach(node => {
        const item = nodeStatusMap[node.id];
        const prereqIds = node.prerequisites || [];
        const prereqsMet = prereqIds.every(pId => {
          const prereqNode = nodeStatusMap[pId];
          return prereqNode && prereqNode.proficiencyScore >= 35; // Minimum proficiency threshold
        });

        if (item.proficiencyScore >= 70 && item.independentRate >= 60) {
          item.status = 'mastered';
        } else if (item.proficiencyScore >= 40) {
          item.status = 'proficient';
        } else if (item.solvedCount > 0) {
          item.status = 'learning';
        } else if (prereqsMet || prereqIds.length === 0) {
          item.status = 'available';
        } else {
          item.status = 'locked';
        }
      });

      return {
        nodes: Object.values(nodeStatusMap),
        nodeMap: nodeStatusMap
      };
    },

    /**
     * Diagnose a struggling problem and find if any prerequisite nodes are deficient
     * @param {Object} problem 
     * @param {Array} allProblems 
     * @param {Object} userStates 
     */
    findMissingPrerequisite(problem, allProblems = [], userStates = {}) {
      if (!problem) return null;
      const evaluation = this.evaluateGraph(allProblems, userStates);
      const graph = (typeof window !== 'undefined' && window.DSA_PREREQUISITE_GRAPH) || _DSA_PREREQUISITE_GRAPH || [];

      const topic = _SRSEngine ? _SRSEngine.canonicalizeTopic(problem.topic) : problem.topic;
      // Find matching graph node
      const currentNode = graph.find(n => (_SRSEngine ? _SRSEngine.canonicalizeTopic(n.topic) : n.topic) === topic);
      if (!currentNode || !currentNode.prerequisites || currentNode.prerequisites.length === 0) {
        return null;
      }

      // Check each prerequisite node for weakness
      for (const prereqId of currentNode.prerequisites) {
        const prereqEvaluated = evaluation.nodeMap[prereqId];
        if (prereqEvaluated && prereqEvaluated.proficiencyScore < 45) {
          // Found a deficient prerequisite!
          const steppingStoneProb = prereqEvaluated.relatedProblems.find(p => p.difficulty === 'Easy') ||
                                    prereqEvaluated.relatedProblems[0];

          return {
            currentNode: currentNode,
            weakPrerequisiteNode: prereqEvaluated,
            reason: `Prerequisite foundation "${prereqEvaluated.title}" has low proficiency (${prereqEvaluated.proficiencyScore}%). Strengthening this prerequisite will unlock intuition for ${currentNode.title}.`,
            recommendedSteppingStone: steppingStoneProb
          };
        }
      }

      return null;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphEngine;
  }
  if (typeof window !== 'undefined') {
    window.GraphEngine = GraphEngine;
  }
})();
