/**
 * Monthly Revision & Assessment Engine
 * Generates curated monthly mock tests from covered topics to evaluate retention
 */

window.MonthlyAssessmentEngine = {
  /**
   * Determine active / covered topics based on user problem history
   */
  getCoveredTopics(problems, userStates) {
    const coveredTopicMap = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    problems.forEach(p => {
      const state = userStates[p.id];
      if (state && state.lastReviewed) {
        const revDate = new Date(state.lastReviewed);
        if (!coveredTopicMap[p.topic]) {
          coveredTopicMap[p.topic] = {
            topic: p.topic,
            solvedCount: 0,
            recentCount: 0,
            problemIds: []
          };
        }
        coveredTopicMap[p.topic].solvedCount++;
        coveredTopicMap[p.topic].problemIds.push(p.id);
        if (revDate >= thirtyDaysAgo) {
          coveredTopicMap[p.topic].recentCount++;
        }
      }
    });

    return Object.values(coveredTopicMap);
  },

  /**
   * Generate a Monthly Assessment test problem set
   * @param {Array} allProblems - Array of problem objects
   * @param {Object} userStates - Problem state map
   * @param {Object} options - { count: 4, durationMinutes: 60, includeUnseenInCovered: true }
   */
  generateTest(allProblems, userStates, options = {}) {
    const count = options.count || 4;
    const durationMinutes = options.durationMinutes || 60;
    const coveredTopics = this.getCoveredTopics(allProblems, userStates);

    if (coveredTopics.length === 0) {
      // If no topics are marked solved yet, pick from foundational topics
      const fallbackTopics = ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack"];
      const candidateProblems = allProblems.filter(p => fallbackTopics.includes(p.topic));
      const shuffled = [...candidateProblems].sort(() => 0.5 - Math.random());
      return {
        id: 'test-' + Date.now(),
        date: new Date().toISOString(),
        durationMinutes: durationMinutes,
        topics: fallbackTopics,
        problems: shuffled.slice(0, count),
        isFoundationalSample: true
      };
    }

    const coveredTopicNames = coveredTopics.map(t => t.topic);
    
    // Group candidate problems into buckets:
    // 1. Solved problems that need retention verification (higher priority to overdue or long interval)
    // 2. Fresh unsolved challenges from the same covered topics to test generalization
    const solvedCandidates = [];
    const unseenCandidates = [];

    allProblems.forEach(p => {
      if (coveredTopicNames.includes(p.topic)) {
        const state = userStates[p.id];
        if (state && state.lastReviewed) {
          solvedCandidates.push(p);
        } else {
          unseenCandidates.push(p);
        }
      }
    });

    // Strategy: 60% retention check on solved questions + 40% generalization on unseen questions in covered topics
    const selected = [];
    const selectedIds = new Set();

    // Pick 1 Easy, balanced Mediums, and 1 Hard if available
    const pickByDifficulty = (pool, diff) => {
      const filtered = pool.filter(p => p.difficulty === diff && !selectedIds.has(p.id));
      if (filtered.length > 0) {
        const pick = filtered[Math.floor(Math.random() * filtered.length)];
        selected.push(pick);
        selectedIds.add(pick.id);
        return true;
      }
      return false;
    };

    // 1. Ensure 1 Easy
    pickByDifficulty(solvedCandidates.length > 0 ? solvedCandidates : unseenCandidates, 'Easy');

    // 2. Ensure Mediums
    const targetMediums = Math.max(1, Math.floor(count / 2));
    for (let i = 0; i < targetMediums && selected.length < count; i++) {
      const source = (i % 2 === 0 && unseenCandidates.length > 0) ? unseenCandidates : solvedCandidates;
      pickByDifficulty(source.length > 0 ? source : allProblems, 'Medium');
    }

    // 3. Ensure 1 Hard (or Medium if hard not available)
    if (selected.length < count) {
      if (!pickByDifficulty(solvedCandidates.length > 0 ? solvedCandidates : unseenCandidates, 'Hard')) {
        pickByDifficulty(solvedCandidates.length > 0 ? solvedCandidates : unseenCandidates, 'Medium');
      }
    }

    // Fill any remainder
    const remainingPool = [...solvedCandidates, ...unseenCandidates].filter(p => !selectedIds.has(p.id));
    while (selected.length < count && remainingPool.length > 0) {
      const randIdx = Math.floor(Math.random() * remainingPool.length);
      const pick = remainingPool.splice(randIdx, 1)[0];
      selected.push(pick);
      selectedIds.add(pick.id);
    }

    return {
      id: 'test-' + Date.now(),
      date: new Date().toISOString(),
      durationMinutes: durationMinutes,
      topics: coveredTopicNames,
      problems: selected,
      isFoundationalSample: false
    };
  },

  /**
   * Grade the assessment session and calculate updated performance metrics
   * @param {Object} testSession 
   * @param {Array} results - array of { problemId, rating: 'simple'|'medium'|'hard'|'failed', timeSpentMinutes, code, notes }
   */
  evaluateTest(testSession, results) {
    let totalScore = 0;
    const maxScore = results.length * 100;
    const breakdown = [];

    results.forEach(res => {
      let score = 0;
      if (res.rating === 'simple') score = 100;
      else if (res.rating === 'medium') score = 75;
      else if (res.rating === 'hard') score = 45;
      else if (res.rating === 'failed') score = 0;

      totalScore += score;
      breakdown.push({
        problemId: res.problemId,
        score: score,
        rating: res.rating,
        timeSpentMinutes: res.timeSpentMinutes || 0
      });
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    let grade = 'Needs Practice';
    let summaryText = 'Keep reviewing your weak areas and re-test next week!';

    if (percentage >= 90) {
      grade = 'Outstanding 🌟 (A+)';
      summaryText = 'Mastery level is exceptionally high! Retention is on point.';
    } else if (percentage >= 75) {
      grade = 'Solid Retention 👍 (A)';
      summaryText = 'Great problem-solving consistency across covered topics.';
    } else if (percentage >= 60) {
      grade = 'Good Effort ⚡ (B)';
      summaryText = 'Decent understanding, but revise medium/hard patterns to improve speed.';
    } else if (percentage >= 40) {
      grade = 'Developing ⚠️ (C)';
      summaryText = 'Retention decay observed in a few topics. Focus on failed questions.';
    }

    return {
      testId: testSession.id,
      date: new Date().toISOString(),
      totalScore: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      grade: grade,
      summary: summaryText,
      coveredTopics: testSession.topics,
      breakdown: breakdown
    };
  }
};
