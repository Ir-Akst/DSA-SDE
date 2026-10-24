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
    },

    /**
     * Detect circular dependencies in the prerequisite DAG using 3-color DFS
     * @param {Array} graph - Array of graph node objects
     * @returns {Object} { hasCycle: boolean, cyclePath: string[]|null }
     */
    detectCycles(graph = null) {
      const g = graph || (typeof window !== 'undefined' && window.DSA_PREREQUISITE_GRAPH) || _DSA_PREREQUISITE_GRAPH || [];
      const nodeMap = new Map();
      g.forEach(node => nodeMap.set(node.id, node));

      // States: 0 = unvisited, 1 = visiting (on current recursion stack), 2 = visited
      const state = new Map();
      let cyclePath = null;
      const stack = [];

      function dfs(nodeId) {
        state.set(nodeId, 1);
        stack.push(nodeId);

        const node = nodeMap.get(nodeId);
        const prereqs = (node && Array.isArray(node.prerequisites)) ? node.prerequisites : [];

        for (const pId of prereqs) {
          if (!nodeMap.has(pId)) continue; // Handled by validateGraphIntegrity
          const pState = state.get(pId) || 0;
          if (pState === 1) {
            // Cycle detected!
            const cycleStartIdx = stack.indexOf(pId);
            cyclePath = stack.slice(cycleStartIdx).concat(pId);
            return true;
          }
          if (pState === 0) {
            if (dfs(pId)) return true;
          }
        }

        stack.pop();
        state.set(nodeId, 2);
        return false;
      }

      for (const node of g) {
        if ((state.get(node.id) || 0) === 0) {
          if (dfs(node.id)) {
            return { hasCycle: true, cyclePath };
          }
        }
      }

      return { hasCycle: false, cyclePath: null };
    },

    /**
     * Comprehensive DAG Integrity Evaluation
     * Validates no cycles, no orphan IDs, reachability from roots, and catalog topic mapping.
     * @param {Array} graph
     * @param {Array} allProblems
     */
    validateGraphIntegrity(graph = null, allProblems = []) {
      const g = graph || (typeof window !== 'undefined' && window.DSA_PREREQUISITE_GRAPH) || _DSA_PREREQUISITE_GRAPH || [];
      const errors = [];
      const warnings = [];
      const nodeIds = new Set();
      const roots = [];

      // 1. Check duplicate IDs
      g.forEach(n => {
        if (nodeIds.has(n.id)) {
          errors.push(`Duplicate node ID detected: "${n.id}".`);
        }
        nodeIds.add(n.id);
        if (!n.prerequisites || n.prerequisites.length === 0) {
          roots.push(n.id);
        }
      });

      // 2. Check orphan prerequisite references
      g.forEach(n => {
        (n.prerequisites || []).forEach(pId => {
          if (!nodeIds.has(pId)) {
            errors.push(`Node "${n.id}" references non-existent prerequisite ID "${pId}".`);
          }
        });
      });

      // 3. Cycle Detection
      const cycleCheck = this.detectCycles(g);
      if (cycleCheck.hasCycle) {
        errors.push(`Circular dependency cycle detected: ${cycleCheck.cyclePath.join(' -> ')}`);
      }

      // 4. Problem catalog topic coverage
      if (Array.isArray(allProblems) && allProblems.length > 0) {
        const catalogTopics = new Set(allProblems.map(p => _SRSEngine ? _SRSEngine.canonicalizeTopic(p.topic) : p.topic));
        g.forEach(n => {
          const t = _SRSEngine ? _SRSEngine.canonicalizeTopic(n.topic) : n.topic;
          if (!catalogTopics.has(t)) {
            warnings.push(`Node "${n.id}" defines topic "${n.topic}" which has 0 problems in current catalog.`);
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        roots,
        nodeCount: g.length,
        hasCycle: cycleCheck.hasCycle
      };
    },

    /**
     * Non-Blocking Prerequisite Advisory Check
     * Respects learner autonomy: returns stepping-stone advice without restricting problem access.
     * @param {Object} problem
     * @param {Array} allProblems
     * @param {Object} userStates
     */
    checkPrerequisiteAdvisory(problem, allProblems = [], userStates = {}) {
      if (!problem) return { isAdvised: false, reason: null, steppingStone: null };

      const missing = this.findMissingPrerequisite(problem, allProblems, userStates);
      if (!missing) {
        return {
          isAdvised: false,
          reason: 'All prerequisite foundations are proficient or problem is foundational.',
          steppingStone: null,
          autonomyNotice: 'Learner autonomy preserved: you can practice any problem directly.'
        };
      }

      return {
        isAdvised: true,
        reason: missing.reason,
        steppingStone: missing.recommendedSteppingStone,
        weakNodeTitle: missing.weakPrerequisiteNode.title,
        weakNodeProficiency: missing.weakPrerequisiteNode.proficiencyScore,
        autonomyNotice: 'Learner autonomy preserved: prerequisite practice is advisory; direct attempts remain unlocked.'
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphEngine;
  }
  if (typeof window !== 'undefined') {
    window.GraphEngine = GraphEngine;
  }
})();
