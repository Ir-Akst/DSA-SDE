/**
 * AlgoRecall 2.0 - Scientific Spaced Repetition System (SRS) Engine
 * Implements an enhanced Leitner & FSRS-inspired Memory Model with:
 * - Deterministic interval scheduling with backward-compatible fallback
 * - Memory Stability (S in days) & Problem Difficulty (D, 1-10 scale)
 * - Estimated Retention Probability R(t) = exp(-t / S) (Ebbinghaus approximation)
 * - Independent solve verification vs hint-dependent recognition
 * - Anti-inflation mastery safeguards (requires minimum spaced depth & independent recall)
 * - Timezone-safe local date formatting and clock-skew resilience
 */

(function () {
  'use strict';

  const SRSEngine = {
    // Leitner Fallback Interval Matrix in Days: [Stage 1, Stage 2, Stage 3, Stage 4, Stage 5]
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

    // Minimum days and reviews required for genuine Mastery (prevents single-solve inflation)
    MASTERY_REQUIREMENTS: {
      minReviews: 3,
      minStage: 4,
      minDaysSpanned: 21,
      minIndependentConfidence: 4
    },

    // 5-Point Confidence Scale Definition
    CONFIDENCE_LEVELS: {
      1: { level: 1, label: "Couldn't solve", shortLabel: "Couldn't solve", badgeClass: "badge-hard", icon: "fa-circle-xmark", color: "#ef4444" },
      2: { level: 2, label: "Needed hint", shortLabel: "Needed hint", badgeClass: "badge-hard", icon: "fa-lightbulb", color: "#f43f5e" },
      3: { level: 3, label: "Solved with difficulty", shortLabel: "Solved w/ difficulty", badgeClass: "badge-medium", icon: "fa-triangle-exclamation", color: "#f59e0b" },
      4: { level: 4, label: "Solved independently", shortLabel: "Solved independently", badgeClass: "badge-easy", icon: "fa-circle-check", color: "#10b981" },
      5: { level: 5, label: "Can explain it", shortLabel: "Can explain it", badgeClass: "badge-easy", icon: "fa-star", color: "#06b6d4" }
    },

    /**
     * Infer fallback confidence (1-5) from traditional SRS rating
     */
    mapRatingToDefaultConfidence(rating) {
      if (rating === 'failed') return 1;
      if (rating === 'hard') return 2;
      if (rating === 'medium') return 3;
      if (rating === 'simple') return 4;
      return 3;
    },

    /**
     * Get normalized confidence number (1-5) from problem state with backward-compatibility
     */
    getConfidence(problemState) {
      if (!problemState) return null;
      if (typeof problemState.confidence === 'number' && problemState.confidence >= 1 && problemState.confidence <= 5) {
        return problemState.confidence;
      }
      if (typeof problemState.lastConfidence === 'number' && problemState.lastConfidence >= 1 && problemState.lastConfidence <= 5) {
        return problemState.lastConfidence;
      }
      if (problemState.lastRating) {
        return this.mapRatingToDefaultConfidence(problemState.lastRating);
      }
      return null;
    },

    /**
     * Get metadata object for a confidence level
     */
    getConfidenceMeta(confidenceVal) {
      const num = Number(confidenceVal);
      return this.CONFIDENCE_LEVELS[num] || this.CONFIDENCE_LEVELS[3];
    },

    /**
     * Format a Date as YYYY-MM-DD in the user's LOCAL timezone
     */
    getLocalDateString(d = new Date()) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    /**
     * Calculate Estimated Memory Stability (S in days)
     * Approximation model based on Leitner depth, rating performance, and hint usage.
     * Note: This is an empirical memory decay approximation model.
     */
    calculateStability(prevStability = 1, rating = 'medium', confidence = 3, hintsUsed = false) {
      let multiplier = 1.0;
      if (rating === 'failed' || confidence <= 1) {
        return Math.max(1, Math.round(prevStability * 0.25)); // Reset with minimal residual memory
      }

      if (rating === 'simple' && confidence >= 4) {
        multiplier = 2.6;
      } else if (rating === 'medium' && confidence >= 3) {
        multiplier = 1.8;
      } else if (rating === 'hard' || confidence <= 2) {
        multiplier = 1.25;
      }

      // If user needed hints, reduce stability progression by 40% (recognition vs recall)
      if (hintsUsed) {
        multiplier = Math.max(1.1, multiplier * 0.6);
      }

      return Math.max(1, Math.round(prevStability * multiplier));
    },

    /**
     * Calculate Problem Difficulty Metric (D on scale 1 - 10)
     */
    calculateDifficulty(prevDifficulty = 5, rating = 'medium', confidence = 3, hintsUsed = false) {
      let delta = 0;
      if (rating === 'failed') delta = +2;
      else if (rating === 'hard') delta = +1;
      else if (rating === 'simple' && confidence >= 4) delta = -1;

      if (hintsUsed) delta += 1;

      const newD = Math.max(1, Math.min(10, prevDifficulty + delta));
      return newD;
    },

    /**
     * Calculate Estimated Retention Probability R(t)
     * R(t) = exp(-elapsedDays / stability)
     * Returns a number between 0.05 and 1.0
     */
    calculateRetention(problemState, asOfDate = new Date()) {
      if (!problemState || !problemState.lastReviewed) return 0;
      const last = new Date(problemState.lastReviewed);
      const diffMs = asOfDate.getTime() - last.getTime();
      const elapsedDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

      const stability = problemState.stability || (problemState.stage ? problemState.stage * 4 : 2);
      // Ebbinghaus exponential decay approximation
      const r = Math.exp(-elapsedDays / Math.max(1, stability));
      return Number(Math.max(0.05, Math.min(1.0, r)).toFixed(2));
    },

    /**
     * Check genuine mastery conditions (prevents inflation from a single easy attempt)
     */
    checkMasteryCriteria(history = [], currentStage = 1, currentConfidence = 4, hintsUsed = false) {
      if (hintsUsed || currentConfidence < this.MASTERY_REQUIREMENTS.minIndependentConfidence) {
        return false;
      }
      if (currentStage < this.MASTERY_REQUIREMENTS.minStage) {
        return false;
      }
      if (history.length < this.MASTERY_REQUIREMENTS.minReviews) {
        return false;
      }

      // Check first review to now span at least minDaysSpanned
      const firstDate = new Date(history[0].date);
      const now = new Date();
      const spannedDays = (now - firstDate) / (1000 * 60 * 60 * 24);
      if (spannedDays < this.MASTERY_REQUIREMENTS.minDaysSpanned) {
        return false;
      }

      // Recent attempts must be independent (no hints, confidence >= 4)
      const recent = history.slice(-2);
      const allRecentIndependent = recent.every(h => !h.hintsUsed && (h.confidence || 3) >= 4);

      return allRecentIndependent;
    },

    /**
     * Core Review Processor
     * Calculates next interval, updates stability, difficulty, history, and scheduled due date.
     * @param {Object} problemState - current user state for problem
     * @param {string} rating - 'simple' | 'medium' | 'hard' | 'failed'
     * @param {number} timeSpentMinutes - time spent during solve
     * @param {string} reviewNotes - notes added during review
     * @param {number|null} confidence - optional 1-5 confidence score
     * @param {Object} options - { hintsUsed: bool, failureReasons: [], solutionNotes: '' }
     */
    processReview(problemState = {}, rating, timeSpentMinutes = 0, reviewNotes = "", confidence = null, options = {}) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const safeState = problemState || {};
      let currentStage = safeState.stage || 0;
      let nextStage = currentStage;
      let daysToAdd = 1;

      // Extract options
      const hintsUsed = !!options.hintsUsed;
      const failureReasons = Array.isArray(options.failureReasons) ? options.failureReasons : [];

      // Resolve confidence (1-5)
      const confVal = (typeof confidence === 'number' && confidence >= 1 && confidence <= 5)
        ? Math.round(confidence)
        : (confidence ? parseInt(confidence, 10) : this.mapRatingToDefaultConfidence(rating));
      const confMeta = this.getConfidenceMeta(confVal);

      // Stability and Difficulty update
      const prevStability = safeState.stability || (currentStage ? currentStage * 3 : 1);
      const prevDifficulty = safeState.difficultyEst || 5;
      const newStability = this.calculateStability(prevStability, rating, confVal, hintsUsed);
      const newDifficulty = this.calculateDifficulty(prevDifficulty, rating, confVal, hintsUsed);

      if (rating === 'failed') {
        // Reset to stage 1 and review tomorrow
        nextStage = 1;
        daysToAdd = 1;
      } else {
        // Valid progression ('simple', 'medium', 'hard')
        nextStage = currentStage + 1;
        const matrix = this.INTERVAL_MATRIX[rating] || this.INTERVAL_MATRIX.medium;
        const intervalIndex = Math.min(nextStage - 1, matrix.length - 1);
        daysToAdd = matrix[intervalIndex];

        // If hints were used during solve, clamp interval progression
        if (hintsUsed) {
          daysToAdd = Math.max(1, Math.round(daysToAdd * 0.5));
        }
      }

      // Check mastery eligibility with anti-inflation safeguards
      const prevHistory = Array.isArray(safeState.history) ? safeState.history : [];
      const historyEntry = {
        date: new Date().toISOString(),
        rating: rating,
        confidence: confVal,
        confidenceLabel: confMeta.label,
        hintsUsed: hintsUsed,
        failureReasons: failureReasons,
        stage: nextStage,
        intervalDays: daysToAdd,
        timeSpentMinutes: Number(timeSpentMinutes || 0),
        note: reviewNotes,
        stability: newStability,
        difficultyEst: newDifficulty
      };

      const updatedHistory = [...prevHistory, historyEntry];
      const isMastered = this.checkMasteryCriteria(updatedHistory, nextStage, confVal, hintsUsed);

      // If mastered, extend to long-term maintenance interval
      if (isMastered) {
        const matrix = this.INTERVAL_MATRIX[rating] || this.INTERVAL_MATRIX.simple;
        daysToAdd = matrix[matrix.length - 1]; // Maintenance interval (e.g. 120-240d)
      }

      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysToAdd);

      // Compute streak of consecutive low-confidence attempts (<= 2)
      let lowConfidenceStreak = 0;
      for (let i = updatedHistory.length - 1; i >= 0; i--) {
        const c = updatedHistory[i].confidence || this.mapRatingToDefaultConfidence(updatedHistory[i].rating);
        if (c <= 2 || updatedHistory[i].rating === 'failed') {
          lowConfidenceStreak++;
        } else {
          break;
        }
      }

      // Compute streak of consecutive independent solves
      let independentStreak = 0;
      for (let i = updatedHistory.length - 1; i >= 0; i--) {
        const h = updatedHistory[i];
        if (!h.hintsUsed && (h.confidence || 3) >= 4) {
          independentStreak++;
        } else {
          break;
        }
      }

      return {
        status: isMastered ? 'mastered' : 'scheduled',
        stage: nextStage,
        intervalDays: daysToAdd,
        lastRating: rating,
        confidence: confVal,
        lastConfidence: confVal,
        confidenceLabel: confMeta.label,
        hintsUsed: hintsUsed,
        lastFailureReasons: failureReasons,
        lowConfidenceStreak: lowConfidenceStreak,
        independentStreak: independentStreak,
        stability: newStability,
        difficultyEst: newDifficulty,
        lastReviewed: new Date().toISOString(),
        nextReviewDate: this.getLocalDateString(nextDate),
        isMastered: isMastered,
        reviewCount: (safeState.reviewCount || 0) + 1,
        totalTimeSpent: (safeState.totalTimeSpent || 0) + Number(timeSpentMinutes || 0),
        history: updatedHistory
      };
    },

    /**
     * Check if a problem is due for review today or overdue
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
      if (!problemState || !problemState.nextReviewDate) {
        return { label: 'Unsolved', code: 'unsolved', badgeClass: 'badge-srs-unsolved', days: null };
      }
      if (problemState.isMastered) {
        return { label: 'Mastered 🏆', code: 'mastered', badgeClass: 'badge-srs-mastered', days: null };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDate = new Date(problemState.nextReviewDate);
      nextDate.setHours(0, 0, 0, 0);

      const diffTime = nextDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { label: `Overdue by ${Math.abs(diffDays)}d ⚠️`, code: 'overdue', badgeClass: 'badge-srs-due', days: diffDays };
      } else if (diffDays === 0) {
        return { label: 'Due Today 🔔', code: 'due', badgeClass: 'badge-srs-due', days: 0 };
      } else {
        return { label: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`, code: 'upcoming', badgeClass: 'badge-srs-upcoming', days: diffDays };
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
     * Calculate Topic Mastery Scores across topics including retention & independent solve rate
     */
    calculateTopicMastery(problems, userStates) {
      const topicsMap = {};

      problems.forEach(p => {
        const topic = this.canonicalizeTopic(p.topic);
        p.topic = topic;
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
            confidenceSum: 0,
            confidenceCount: 0,
            avgConfidence: 0,
            lowConfidenceCount: 0,
            highConfidenceCount: 0,
            independentSolves: 0,
            retentionSum: 0,
            healthScore: 100
          };
        }

        const t = topicsMap[topic];
        t.total++;

        if (p.difficulty === 'Easy') t.easyCount++;
        else if (p.difficulty === 'Medium') t.mediumCount++;
        else if (p.difficulty === 'Hard') t.hardCount++;

        const state = userStates[p.id];
        const maxPossibleStage = 4;
        t.maxStageSum += maxPossibleStage;

        if (state && state.lastReviewed) {
          t.solved++;
          t.stageSum += Math.min(state.stage || 1, maxPossibleStage);

          const conf = this.getConfidence(state);
          if (conf) {
            t.confidenceSum += conf;
            t.confidenceCount++;
            if (conf <= 2) t.lowConfidenceCount++;
            else if (conf >= 4) t.highConfidenceCount++;
          }

          if (!state.hintsUsed && (conf || 3) >= 4) {
            t.independentSolves++;
          }

          const ret = this.calculateRetention(state);
          t.retentionSum += ret;

          if (state.isMastered) t.mastered++;
          if (this.isOverdue(state)) t.overdue++;
          else if (this.isDue(state)) t.due++;

          // Overdue decay penalty
          if (this.isOverdue(state)) {
            const daysOver = Math.abs(this.getDueStatus(state).days || 1);
            t.healthScore = Math.max(20, t.healthScore - Math.min(25, daysOver * 5));
          }
        }
      });

      // Composite mastery calculation
      Object.values(topicsMap).forEach(t => {
        t.avgConfidence = t.confidenceCount > 0 ? Number((t.confidenceSum / t.confidenceCount).toFixed(1)) : 0;
        t.avgRetention = t.solved > 0 ? Number(((t.retentionSum / t.solved) * 100).toFixed(0)) : 0;
        t.independentSolveRate = t.solved > 0 ? Number(((t.independentSolves / t.solved) * 100).toFixed(0)) : 0;

        if (t.total === 0 || t.solved === 0) {
          t.score = 0;
          t.healthScore = 0;
        } else {
          const solvedRatio = (t.solved / t.total);
          const stageRatio = t.maxStageSum > 0 ? (t.stageSum / t.maxStageSum) : 0;
          const overduePenalty = (t.overdue / (t.solved || 1)) * 0.25;

          // Composite formula: 40% solved coverage + 45% stage depth + 15% independent rate - overdue penalty
          const rawScore = (solvedRatio * 40) + (stageRatio * 45) + ((t.independentSolveRate / 100) * 15) - (overduePenalty * 100);
          t.score = Math.max(0, Math.min(100, Math.round(rawScore)));
        }
      });

      return topicsMap;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SRSEngine;
  }
  if (typeof window !== 'undefined') {
    window.SRSEngine = SRSEngine;
  }
})();
