/**
 * AlgoRecall - Confidence-Aware Adaptive Recommendation Engine
 * Extends the existing recommendation logic with multi-signal confidence adjustments,
 * anti-loop safety mechanisms, and structured similar-problem progressions.
 */

(function () {
  'use strict';

  window.RecommendationEngine = {
    /**
     * Compute comprehensive confidence statistics across all attempts, patterns, and topics
     * @param {Array} allProblems
     * @param {Object} userStates
     */
    getConfidenceStats(allProblems = [], userStates = {}) {
      let totalConfidenceSum = 0;
      let totalConfidenceCount = 0;
      let lowCount = 0;
      let highCount = 0;

      const patternMap = {};
      const topicMap = {};
      const weakProblems = [];
      const repeatedLowConfidenceProblems = [];

      allProblems.forEach(p => {
        const state = userStates[p.id];
        const topic = SRSEngine.canonicalizeTopic(p.topic);
        const pattern = (p.pattern || 'General Pattern').trim();
        const patternKey = `${topic}:::${pattern.toLowerCase()}`;

        if (!patternMap[patternKey]) {
          patternMap[patternKey] = {
            topic: topic,
            pattern: pattern,
            patternKey: patternKey,
            confidenceSum: 0,
            confidenceCount: 0,
            avgConfidence: 0,
            lowConfidenceCount: 0,
            highConfidenceCount: 0,
            recentConfidences: [],
            problemIds: []
          };
        }
        patternMap[patternKey].problemIds.push(p.id);

        if (!topicMap[topic]) {
          topicMap[topic] = {
            topic: topic,
            confidenceSum: 0,
            confidenceCount: 0,
            avgConfidence: 0,
            lowConfidenceCount: 0,
            problemIds: []
          };
        }
        topicMap[topic].problemIds.push(p.id);

        if (state && state.lastReviewed) {
          const conf = SRSEngine.getConfidence(state);
          if (typeof conf === 'number') {
            totalConfidenceSum += conf;
            totalConfidenceCount++;

            // Topic aggregation
            topicMap[topic].confidenceSum += conf;
            topicMap[topic].confidenceCount++;

            // Pattern aggregation
            const pat = patternMap[patternKey];
            pat.confidenceSum += conf;
            pat.confidenceCount++;
            pat.recentConfidences.push(conf);

            if (conf <= 2) {
              lowCount++;
              topicMap[topic].lowConfidenceCount++;
              pat.lowConfidenceCount++;
              weakProblems.push({ problem: p, state: state, confidence: conf });

              if ((state.lowConfidenceStreak || 1) >= 2) {
                repeatedLowConfidenceProblems.push({ problem: p, state: state, confidence: conf, streak: state.lowConfidenceStreak });
              }
            } else if (conf >= 4) {
              highCount++;
              pat.highConfidenceCount++;
            }
          }
        }
      });

      // Calculate averages
      Object.values(patternMap).forEach(pat => {
        pat.avgConfidence = pat.confidenceCount > 0 ? Number((pat.confidenceSum / pat.confidenceCount).toFixed(2)) : 0;
      });

      Object.values(topicMap).forEach(top => {
        top.avgConfidence = top.confidenceCount > 0 ? Number((top.confidenceSum / top.confidenceCount).toFixed(2)) : 0;
      });

      const overallAvg = totalConfidenceCount > 0 ? Number((totalConfidenceSum / totalConfidenceCount).toFixed(2)) : 0;

      return {
        overallAvgConfidence: overallAvg,
        totalConfidenceCount: totalConfidenceCount,
        lowConfidenceCount: lowCount,
        highConfidenceCount: highCount,
        patternStats: patternMap,
        topicStats: topicMap,
        weakProblems: weakProblems,
        repeatedLowConfidenceProblems: repeatedLowConfidenceProblems
      };
    },

    /**
     * Find related problems matching the same pattern/topic for similar-problem progression
     * @param {Object} targetProblem 
     * @param {Array} allProblems 
     * @param {Object} userStates 
     * @param {Object} options - { excludeIds: [], difficultyPreference: 'easier'|'similar'|'harder'|'all' }
     */
    findSimilarProblems(targetProblem, allProblems = [], userStates = {}, options = {}) {
      if (!targetProblem) return [];
      const excludeIds = new Set(options.excludeIds || []);
      excludeIds.add(targetProblem.id);

      const targetTopic = SRSEngine.canonicalizeTopic(targetProblem.topic);
      const targetPattern = (targetProblem.pattern || '').trim().toLowerCase();
      const targetDiff = targetProblem.difficulty;

      // 1. Exact pattern & topic matches
      let patternMatches = [];
      // 2. Keyword/Semantic pattern matches in topic
      let keywordMatches = [];
      // 3. Topic fallback matches
      let topicMatches = [];

      const targetWords = targetProblem.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);

      allProblems.forEach(p => {
        if (excludeIds.has(p.id)) return;
        const pTopic = SRSEngine.canonicalizeTopic(p.topic);
        if (pTopic !== targetTopic) return;

        const pPattern = (p.pattern || '').trim().toLowerCase();
        if (targetPattern && pPattern && (pPattern === targetPattern || pPattern.includes(targetPattern) || targetPattern.includes(pPattern))) {
          patternMatches.push(p);
        } else {
          // Check word overlap
          const pTitleLower = p.title.toLowerCase();
          const hasWordOverlap = targetWords.some(w => pTitleLower.includes(w));
          if (hasWordOverlap) {
            keywordMatches.push(p);
          } else {
            topicMatches.push(p);
          }
        }
      });

      const candidatePool = [...patternMatches, ...keywordMatches, ...topicMatches];

      // Sorting strategy based on difficulty progression:
      // Priority: Unsolved or high-priority first, ordered by difficulty stepping
      const diffRank = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

      const sorted = candidatePool.sort((a, b) => {
        const aIsPattern = patternMatches.includes(a) ? 1 : 0;
        const bIsPattern = patternMatches.includes(b) ? 1 : 0;
        if (aIsPattern !== bIsPattern) return bIsPattern - aIsPattern;

        const aState = userStates[a.id];
        const bState = userStates[b.id];
        const aSolved = aState && aState.lastReviewed ? 1 : 0;
        const bSolved = bState && bState.lastReviewed ? 1 : 0;

        // Prefer unsolved questions for fresh practice
        if (aSolved !== bSolved) return aSolved - bSolved;

        // Difficulty ordering relative to target
        const aDiffVal = diffRank[a.difficulty] || 2;
        const bDiffVal = diffRank[b.difficulty] || 2;
        const targetDiffVal = diffRank[targetDiff] || 2;

        if (options.difficultyPreference === 'easier') {
          return aDiffVal - bDiffVal;
        } else if (options.difficultyPreference === 'harder') {
          return bDiffVal - aDiffVal;
        }

        // Default: prefer easier or equal difficulty first
        const aDist = Math.abs(aDiffVal - (targetDiffVal - 0.5));
        const bDist = Math.abs(bDiffVal - (targetDiffVal - 0.5));
        return aDist - bDist;
      });

      return sorted;
    },

    /**
     * Generate the complete Similar-Problem Progression sequence:
     * Low-confidence problem -> similar problem (same pattern/topic, equal/easier) -> next step -> reattempt original
     * Example: Sliding Window Medium -> Sliding Window Easy -> Sliding Window Medium -> Reattempt
     * @param {Object} problem 
     * @param {Array} allProblems 
     * @param {Object} userStates 
     */
    getSimilarProblemProgression(problem, allProblems = [], userStates = {}) {
      if (!problem) return null;
      const state = userStates[problem.id];
      const conf = SRSEngine.getConfidence(state) || 3;
      const confMeta = SRSEngine.getConfidenceMeta(conf);

      const similarCandidates = this.findSimilarProblems(problem, allProblems, userStates, {
        excludeIds: [problem.id],
        difficultyPreference: conf <= 2 ? 'easier' : 'similar'
      });

      const steps = [];
      const diff = problem.difficulty;

      if (diff === 'Hard') {
        // Progression for Hard: 1. Easy/Medium pattern foundation -> 2. Similar Hard -> 3. Reattempt
        const step1 = similarCandidates.find(p => p.difficulty === 'Easy') || similarCandidates.find(p => p.difficulty === 'Medium') || similarCandidates[0];
        if (step1) steps.push({ stepNumber: 1, problem: step1, type: 'foundation', label: '1. Foundational Stepping Stone (Easy/Med)' });

        const step2 = similarCandidates.find(p => p.difficulty === 'Hard' && p.id !== step1?.id) || similarCandidates.find(p => p.id !== step1?.id) || similarCandidates[1];
        if (step2) steps.push({ stepNumber: 2, problem: step2, type: 'peer', label: '2. Pattern Consolidation (Hard Challenge)' });
      } else if (diff === 'Medium') {
        // Progression for Medium: 1. Easy warm-up on same pattern -> 2. Peer Medium -> 3. Reattempt
        const step1 = similarCandidates.find(p => p.difficulty === 'Easy') || similarCandidates[0];
        if (step1) steps.push({ stepNumber: 1, problem: step1, type: 'foundation', label: '1. Pattern Primer (Easy Warmup)' });

        const step2 = similarCandidates.find(p => p.difficulty === 'Medium' && p.id !== step1?.id) || similarCandidates.find(p => p.id !== step1?.id);
        if (step2) steps.push({ stepNumber: 2, problem: step2, type: 'peer', label: '2. Peer Practice (Medium Core)' });
      } else {
        // Progression for Easy: Sibling Easy problems
        const step1 = similarCandidates.find(p => p.difficulty === 'Easy') || similarCandidates[0];
        if (step1) steps.push({ stepNumber: 1, problem: step1, type: 'peer', label: '1. Parallel Pattern Drill (Easy)' });
      }

      // Final Step: Reattempt the original problem
      steps.push({
        stepNumber: steps.length + 1,
        problem: problem,
        isReattempt: true,
        type: 'reattempt',
        label: `${steps.length + 1}. Final Reattempt & Mastery Check`
      });

      return {
        targetProblem: problem,
        currentConfidence: conf,
        confidenceMeta: confMeta,
        needsIntervention: conf <= 2,
        pattern: problem.pattern || 'General',
        topic: SRSEngine.canonicalizeTopic(problem.topic),
        steps: steps
      };
    },

    /**
     * Core Multi-Signal Recommendation Scoring Algorithm:
     * Recommendation Score = Existing Recommendation Score * Confidence Adjustment
     * 
     * Incorporates:
     * - Topic relevance & selection
     * - Target difficulty pacing
     * - Previous completion status
     * - Weak vs strong topic mastery
     * - SRS revision due requirements
     * - Confidence score (1-5)
     * - Recent confidence history across pattern/topic
     * - Repeated low-confidence streak handling
     * - Anti-loop safety multiplier (prevents immediate repetition of same failed problem)
     * 
     * @param {Object} problem 
     * @param {Object} userStates 
     * @param {Object} stats - output from getConfidenceStats
     * @param {Object} context - { activeTopic, targetDifficulty, recentlyAttemptedIds: [] }
     */
    scoreProblem(problem, userStates = {}, stats = null, context = {}) {
      if (!stats) {
        stats = this.getConfidenceStats([problem], userStates);
      }

      const state = userStates[problem.id];
      const topic = SRSEngine.canonicalizeTopic(problem.topic);
      const pattern = (problem.pattern || 'General Pattern').trim();
      const patternKey = `${topic}:::${pattern.toLowerCase()}`;
      const patStats = stats.patternStats?.[patternKey];
      const topicStats = stats.topicStats?.[topic];

      // 1. BASE SCORE (Existing factors)
      let baseScore = 50; // Starting baseline

      // Topic Match
      if (context.activeTopic) {
        const cTopic = SRSEngine.canonicalizeTopic(context.activeTopic);
        if (topic === cTopic) baseScore += 40;
        else if (Array.isArray(context.activeTopic) && context.activeTopic.some(t => SRSEngine.canonicalizeTopic(t) === topic)) {
          baseScore += 35;
        }
      }

      // Difficulty match
      if (context.targetDifficulty) {
        if (problem.difficulty === context.targetDifficulty) baseScore += 25;
      }

      // Revision Due Boost (Existing SRS rules)
      const isDue = SRSEngine.isDue(state);
      const isOverdue = SRSEngine.isOverdue(state);
      if (isOverdue) baseScore += 60;
      else if (isDue) baseScore += 40;

      // Unattempted fresh problem bonus
      const isSolved = state && state.lastReviewed;
      if (!isSolved) baseScore += 20;

      // High-Frequency Sheet verification bonus (Striver / NeetCode / Blind)
      const sheets = problem.sheets || (problem.sheet ? [problem.sheet] : []);
      if (sheets.some(s => s.includes('A2Z') || s.includes('150') || s.includes('Blind') || s.includes('SDE'))) {
        baseScore += 10;
      }

      // 2. CONFIDENCE ADJUSTMENT MULTIPLIER
      let confidenceMultiplier = 1.0;
      let reason = 'Standard progression';
      let tag = 'Normal';

      const probConfidence = SRSEngine.getConfidence(state);
      const patAvgConf = patStats && patStats.confidenceCount > 0 ? patStats.avgConfidence : null;
      const recentAttempts = context.recentlyAttemptedIds || [];
      const isJustAttempted = recentAttempts.includes(problem.id) || (state && state.lastReviewed && (Date.now() - new Date(state.lastReviewed).getTime() < 3600000));

      if (isSolved) {
        // Problem has been solved/attempted before:
        if (probConfidence <= 2) {
          // LOW CONFIDENCE (1–2) on this problem
          if (isJustAttempted) {
            // ANTI-LOOP SAFETY RULE:
            // Do NOT immediately keep recommending the exact same problem!
            // Apply a heavy dampening multiplier so similar stepping stone problems take priority first.
            confidenceMultiplier = 0.15;
            reason = 'Anti-loop: stepped down to allow similar pattern practice before reattempt';
            tag = 'Cooldown';
          } else if (isDue || isOverdue) {
            // After stepping through similar practice / cooling off, high priority to reattempt!
            confidenceMultiplier = 2.0;
            reason = 'High priority reattempt: reinforce previous weak attempt (Confidence ' + probConfidence + '/5)';
            tag = 'Weak Reattempt';
          } else {
            confidenceMultiplier = 1.4;
            reason = 'Previous weak recall scheduled for revision';
            tag = 'Reinforce';
          }
        } else if (probConfidence === 3) {
          // MODERATE CONFIDENCE (3)
          confidenceMultiplier = 1.2;
          reason = 'Moderate confidence: monitor and schedule balanced revision';
          tag = 'Moderate';
        } else if (probConfidence === 4) {
          // REASONABLY STRONG (4)
          confidenceMultiplier = 1.0;
          reason = 'Strong concept: standard revision intervals';
          tag = 'Strong';
        } else if (probConfidence >= 5) {
          // MASTERED / VERY STRONG (5)
          if (problem.difficulty === 'Easy') {
            confidenceMultiplier = 0.35; // Reduce frequency for easy mastered problems
            reason = 'Mastered easy problem: reduced recommendation frequency';
            tag = 'Mastered';
          } else {
            confidenceMultiplier = 0.8;
            reason = 'Mastered concept: maintenance revision';
            tag = 'Mastered';
          }
        }
      } else {
        // Problem is UNATTEMPTED:
        // Check pattern and topic confidence history to intelligently guide progression!
        if (patAvgConf !== null && patAvgConf <= 2.5) {
          // User struggled on this pattern previously!
          if (problem.difficulty === 'Easy') {
            confidenceMultiplier = 2.4; // High boost for foundational problem in weak pattern!
            reason = 'Weak pattern detected (' + pattern + ' avg ' + patAvgConf + '/5): Recommended Easy stepping stone';
            tag = 'Pattern Primer';
          } else if (problem.difficulty === 'Medium') {
            confidenceMultiplier = 1.8; // Medium peer practice
            reason = 'Weak pattern practice (' + pattern + '): Core challenge to solidify intuition';
            tag = 'Pattern Core';
          } else if (problem.difficulty === 'Hard') {
            confidenceMultiplier = 0.6; // De-prioritize Hard until foundational confidence is built
            reason = 'Postponed Hard challenge until pattern fundamentals are strengthened';
            tag = 'Paced';
          }
        } else if (patAvgConf !== null && patAvgConf >= 4.0) {
          // User is strong/mastered on this pattern!
          if (problem.difficulty === 'Easy') {
            confidenceMultiplier = 0.45; // Reduce easy drill repetition
            reason = 'Strong pattern: skipping redundant easy questions';
            tag = 'Accelerate';
          } else if (problem.difficulty === 'Medium' || problem.difficulty === 'Hard') {
            confidenceMultiplier = 1.5; // Accelerate toward harder challenges!
            reason = 'Strong pattern mastery (' + pattern + ' avg ' + patAvgConf + '/5): Advancing to harder challenge';
            tag = 'Challenge';
          }
        } else if (topicStats && topicStats.avgConfidence > 0 && topicStats.avgConfidence <= 2.5) {
          // Topic-level weak confidence
          if (problem.difficulty === 'Easy') {
            confidenceMultiplier = 1.9;
            reason = 'Weak topic reinforcement (' + topic + ' avg ' + topicStats.avgConfidence + '/5)';
            tag = 'Topic Primer';
          }
        }
      }

      // Repeated low confidence penalty / alert
      if (state && (state.lowConfidenceStreak || 0) >= 2 && !isJustAttempted) {
        confidenceMultiplier *= 1.3; // Boost priority for comprehensive review after cooling off
      }

      const finalScore = Number((baseScore * confidenceMultiplier).toFixed(1));

      return {
        problem: problem,
        baseScore: baseScore,
        confidenceMultiplier: confidenceMultiplier,
        finalScore: finalScore,
        reason: reason,
        tag: tag,
        confidence: probConfidence,
        patternAvgConfidence: patAvgConf
      };
    },

    /**
     * Get ranked recommendations incorporating all signals
     * @param {Array} allProblems 
     * @param {Object} userStates 
     * @param {Object} options - { limit: 6, topic: null, difficulty: null, excludeIds: [] }
     */
    getRecommendations(allProblems = [], userStates = {}, options = {}) {
      const stats = this.getConfidenceStats(allProblems, userStates);
      const excludeIds = new Set(options.excludeIds || []);
      const limit = options.limit || 6;

      const scored = [];

      allProblems.forEach(p => {
        if (excludeIds.has(p.id)) return;
        if (options.topic && options.topic !== 'all') {
          const cTopic = SRSEngine.canonicalizeTopic(options.topic);
          const pTopic = SRSEngine.canonicalizeTopic(p.topic);
          if (pTopic !== cTopic) return;
        }

        const scoreObj = this.scoreProblem(p, userStates, stats, {
          activeTopic: options.topic,
          targetDifficulty: options.difficulty,
          recentlyAttemptedIds: options.recentlyAttemptedIds || []
        });

        scored.push(scoreObj);
      });

      scored.sort((a, b) => b.finalScore - a.finalScore);

      return {
        stats: stats,
        recommendations: scored.slice(0, limit),
        allScored: scored
      };
    },

    /**
     * Confidence-aware problem finder for daily targets and study roadmap
     * Ensures low-confidence patterns get foundational reinforcement while respecting workload limits
     * @param {Array} allProblems 
     * @param {Array} keywords 
     * @param {string} topic 
     * @param {number|null} explicitLimit 
     * @param {Object} userStates 
     */
    findAdaptiveProblems(allProblems = [], keywords = [], topic = '', explicitLimit = null, userStates = {}) {
      const stats = this.getConfidenceStats(allProblems, userStates);
      const matched = [];
      const seen = new Set();

      keywords.forEach(kw => {
        const kwLower = kw.toLowerCase();
        allProblems.forEach(p => {
          if (!seen.has(p.id)) {
            const titleMatch = p.title.toLowerCase().includes(kwLower);
            const patternMatch = (p.pattern || '').toLowerCase().includes(kwLower);
            const topicMatch = !topic || p.topic.toLowerCase().includes(topic.toLowerCase());
            if ((titleMatch || patternMatch) && topicMatch) {
              matched.push(p);
              seen.add(p.id);
            }
          }
        });
      });

      if (topic) {
        const topicPool = allProblems.filter(p => p.topic.toLowerCase().includes(topic.toLowerCase()) && !seen.has(p.id));
        matched.push(...topicPool);
      }

      // Score and re-rank matched problems using confidence signals
      const scoredList = matched.map(p => {
        return this.scoreProblem(p, userStates, stats, { activeTopic: topic });
      });

      scoredList.sort((a, b) => b.finalScore - a.finalScore);
      const candidateProblems = scoredList.map(s => s.problem);

      // Dynamic difficulty quota calculation (respecting existing workload rules)
      let limit = explicitLimit;
      if (!limit) {
        const sample = candidateProblems.slice(0, 5);
        let hardCount = 0, medCount = 0;
        sample.forEach(p => {
          if (p.difficulty === 'Hard') hardCount++;
          else if (p.difficulty === 'Medium') medCount++;
        });

        if (hardCount >= 1 && (sample[0]?.difficulty === 'Hard' || sample[1]?.difficulty === 'Hard')) {
          limit = 2; // 1-2 Hard problems max
        } else if (medCount >= 2 || (sample[0]?.difficulty === 'Medium')) {
          limit = (medCount >= 3) ? 3 : 2; // 2-3 Medium problems
        } else {
          limit = 4; // 4 Easy problems
        }
      }

      return candidateProblems.slice(0, limit);
    }
  };
})();
