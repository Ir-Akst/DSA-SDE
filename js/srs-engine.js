/**
 * Spaced Repetition System (SRS) Engine for DSA Mastery
 * Scientific Leitner / Modified SM-2 interval calculator
 */

window.SRSEngine = {
  // Interval Matrix in Days: [Stage 1, Stage 2, Stage 3, Stage 4, Stage 5]
  INTERVAL_MATRIX: {
    simple: [7, 21, 60, 120, 240],
    medium: [3, 7, 21, 45, 90],
    hard:   [1, 3, 7, 18, 40],
    failed: [1, 1, 1, 1, 1] // Reset trigger
  },

  // Maximum stages before graduation to Mastered status
  MAX_STAGES: {
    simple: 4,
    medium: 4,
    hard: 5
  },

  /**
   * Helper to format a Date as YYYY-MM-DD in the user's LOCAL timezone
   * @param {Date} d 
   * @returns {string} YYYY-MM-DD
   */
  getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Calculate next review parameters based on user rating and current problem state
   * @param {Object} problemState - current user state for problem
   * @param {string} rating - 'simple' | 'medium' | 'hard' | 'failed'
   * @param {number} timeSpentMinutes - optional time spent
   * @param {string} reviewNotes - optional notes added during review
   */
  processReview(problemState = {}, rating, timeSpentMinutes = 0, reviewNotes = "") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStage = problemState.stage || 0;
    let nextStage = currentStage;
    let daysToAdd = 1;
    let isMastered = false;

    if (rating === 'failed') {
      // Reset to stage 1 and review tomorrow
      nextStage = 1;
      daysToAdd = 1;
      isMastered = false;
    } else {
      // Valid rating ('simple', 'medium', 'hard')
      nextStage = currentStage + 1;
      const matrix = this.INTERVAL_MATRIX[rating] || this.INTERVAL_MATRIX.medium;
      const maxStage = this.MAX_STAGES[rating] || 4;

      if (nextStage >= maxStage) {
        isMastered = true;
        daysToAdd = matrix[matrix.length - 1]; // Long-term maintenance interval
      } else {
        const intervalIndex = Math.min(nextStage - 1, matrix.length - 1);
        daysToAdd = matrix[intervalIndex];
      }
    }

    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + daysToAdd);

    const historyEntry = {
      date: new Date().toISOString(),
      rating: rating,
      stage: nextStage,
      intervalDays: daysToAdd,
      timeSpentMinutes: timeSpentMinutes,
      note: reviewNotes
    };

    const history = Array.isArray(problemState.history) ? [...problemState.history, historyEntry] : [historyEntry];

    return {
      status: isMastered ? 'mastered' : 'scheduled',
      stage: nextStage,
      lastRating: rating,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: this.getLocalDateString(nextDate),
      isMastered: isMastered,
      reviewCount: (problemState.reviewCount || 0) + 1,
      totalTimeSpent: (problemState.totalTimeSpent || 0) + Number(timeSpentMinutes || 0),
      history: history
    };
  },

  /**
   * Check if a problem is due for review today or overdue
   * @param {Object} problemState 
   */
  isDue(problemState) {
    if (!problemState || !problemState.nextReviewDate) return false;
    const todayStr = this.getLocalDateString(new Date());
    return problemState.nextReviewDate <= todayStr && !problemState.isMastered;
  },

  /**
   * Check if problem is overdue (due before today)
   */
  isOverdue(problemState) {
    if (!problemState || !problemState.nextReviewDate) return false;
    const todayStr = this.getLocalDateString(new Date());
    return problemState.nextReviewDate < todayStr && !problemState.isMastered;
  },

  /**
   * Get formatted days remaining until next review
   */
  getDueStatus(problemState) {
    if (!problemState || !problemState.nextReviewDate) return { label: 'Unsolved', code: 'unsolved', days: null };
    if (problemState.isMastered) return { label: 'Mastered 🏆', code: 'mastered', days: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(problemState.nextReviewDate);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)}d ⚠️`, code: 'overdue', days: diffDays };
    } else if (diffDays === 0) {
      return { label: 'Due Today 🔔', code: 'due', days: 0 };
    } else {
      return { label: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`, code: 'upcoming', days: diffDays };
    }
  },

  /**
   * Canonicalize and normalize topic names to guarantee exactly 16 clean categories
   */
  canonicalizeTopic(topic) {
    if (!topic) return 'Basics & Math';
    const t = topic.trim().toLowerCase();
    if (t === 'backtracking' || t.includes('recursion') || t.includes('backtrack')) return 'Recursion & Backtracking';
    if (t === 'stack' || t === 'queue' || t.includes('stack') || t.includes('queue')) return 'Stack & Queue';
    if (t === 'two pointers' || t === 'sliding window' || t.includes('sliding') || t.includes('pointer')) return 'Sliding Window & Two Pointers';
    if (t.includes('tree') || t.includes('bst')) return 'Binary Trees & BST';
    if (t.includes('heap') || t.includes('priority')) return 'Heap / Priority Queue';
    if (t.includes('bit')) return 'Bit Manipulation';
    if (t.includes('greedy') || t.includes('interval')) return 'Greedy & Intervals';
    if (t.includes('graph')) return 'Graphs';
    if (t.includes('dp') || t.includes('dynamic')) return 'Dynamic Programming';
    if (t.includes('trie')) return 'Tries';
    if (t.includes('binary search')) return 'Binary Search';
    if (t.includes('linked list')) return 'Linked List';
    if (t.includes('string')) return 'Strings';
    if (t.includes('sort')) return 'Sorting';
    if (t.includes('array') || t.includes('hash')) return 'Arrays & Hashing';
    if (t.includes('math') || t.includes('basic')) return 'Basics & Math';
    return topic.trim();
  },

  /**
   * Calculate Topic Mastery Scores across topics
   * @param {Array} problems - All problem definitions
   * @param {Object} userStates - Map of problemId -> userState
   */
  calculateTopicMastery(problems, userStates) {
    const topicsMap = {};

    problems.forEach(p => {
      const topic = this.canonicalizeTopic(p.topic);
      p.topic = topic; // Clean in-memory reference
      if (!topicsMap[topic]) {
        topicsMap[topic] = {
          topic: topic,
          total: 0,
          solved: 0,
          mastered: 0,
          due: 0,
          overdue: 0,
          easyCount: 0,
          mediumCount: 0,
          hardCount: 0,
          stageSum: 0,
          maxStageSum: 0,
          score: 0,
          recentReviewCount: 0,
          healthScore: 100 // 0-100 retention decay
        };
      }

      const t = topicsMap[topic];
      t.total++;

      // Difficulty counters
      if (p.difficulty === 'Easy') t.easyCount++;
      else if (p.difficulty === 'Medium') t.mediumCount++;
      else if (p.difficulty === 'Hard') t.hardCount++;

      const state = userStates[p.id];
      const maxPossibleStage = 4;
      t.maxStageSum += maxPossibleStage;

      if (state && state.lastReviewed) {
        t.solved++;
        t.stageSum += Math.min(state.stage || 1, maxPossibleStage);

        if (state.isMastered) t.mastered++;
        if (this.isOverdue(state)) t.overdue++;
        else if (this.isDue(state)) t.due++;

        // Retention health penalty for overdue questions
        if (this.isOverdue(state)) {
          const daysOver = Math.abs(this.getDueStatus(state).days || 1);
          t.healthScore = Math.max(20, t.healthScore - Math.min(25, daysOver * 5));
        }
      }
    });

    // Compute composite mastery percentage for each topic
    Object.values(topicsMap).forEach(t => {
      if (t.total === 0 || t.solved === 0) {
        t.score = 0;
        t.healthScore = 0;
      } else {
        const solvedRatio = (t.solved / t.total);
        const stageRatio = t.maxStageSum > 0 ? (t.stageSum / t.maxStageSum) : 0;
        const overduePenalty = (t.overdue / (t.solved || 1)) * 0.25;

        // Composite formula: 40% solved coverage + 50% stage depth + 10% health - penalty
        const rawScore = (solvedRatio * 40) + (stageRatio * 50) + ((t.healthScore / 100) * 10) - (overduePenalty * 100);
        t.score = Math.max(0, Math.min(100, Math.round(rawScore)));
      }
    });

    return topicsMap;
  }
};
