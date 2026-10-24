/**
 * AlgoRecall 2.0 - Mastery-Based Gamification Engine
 * Rewards authentic independent learning, delayed recall, and pattern consistency.
 * Includes Streak Shield protection for planned rest days.
 */

(function () {
  'use strict';

  const STORAGE_KEY_GAMIFICATION = 'algorecall_gamification_v2';

  const LEVELS = [
    { level: 1, title: 'Novice Coder', xpRequired: 0, icon: 'fa-seedling' },
    { level: 2, title: 'Algorithm Apprentice', xpRequired: 200, icon: 'fa-book-open' },
    { level: 3, title: 'Pattern Seeker', xpRequired: 500, icon: 'fa-magnifying-glass' },
    { level: 4, title: 'Problem Solver', xpRequired: 1000, icon: 'fa-code-branch' },
    { level: 5, title: 'Complexity Master', xpRequired: 2000, icon: 'fa-gauge-high' },
    { level: 6, title: 'Recursion Wizard', xpRequired: 3500, icon: 'fa-wand-magic-sparkles' },
    { level: 7, title: 'Graph Navigator', xpRequired: 5500, icon: 'fa-diagram-project' },
    { level: 8, title: 'Dynamic Thinker', xpRequired: 8000, icon: 'fa-cube' },
    { level: 9, title: 'Interview Contender', xpRequired: 12000, icon: 'fa-shield-halved' },
    { level: 10, title: 'SDE Ready 🚀', xpRequired: 18000, icon: 'fa-crown' }
  ];

  const BADGES = [
    { id: 'first_independent', title: 'First Independent Solve', description: 'Solved a problem with confidence 4+ and zero hints.', icon: 'fa-circle-check', color: '#10b981' },
    { id: 'first_delayed_recall', title: 'Memory Champion', description: 'Successfully retained a problem on Spaced Repetition Stage 2+.', icon: 'fa-brain', color: '#8b5cf6' },
    { id: 'streak_3', title: 'Consistency Triad', description: 'Logged practice sessions 3 days in a row.', icon: 'fa-fire', color: '#f59e0b' },
    { id: 'streak_7', title: 'Weekly Warrior', description: 'Logged practice sessions 7 days in a row.', icon: 'fa-bolt', color: '#ef4444' },
    { id: 'pattern_pioneer', title: 'Pattern Pioneer', description: 'Mastered 3 distinct canonical algorithmic patterns.', icon: 'fa-code-fork', color: '#38bdf8' },
    { id: 'mock_victor', title: 'Mock Interview Victor', description: 'Completed a full timed mock interview with Grade A or higher.', icon: 'fa-award', color: '#ec4899' },
    { id: 'zero_hint_streak', title: 'Pure Recall Streak', description: 'Completed 5 consecutive problem reviews without hints.', icon: 'fa-lightbulb', color: '#10b981' },
    { id: 'ten_mastered', title: 'Double Digit Mastery', description: 'Graduated 10 problems to permanent Mastered status.', icon: 'fa-trophy', color: '#fbbf24' }
  ];

  const getLocalStorage = () => {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
      if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    } catch (_) {}
    return null;
  };

  const getRepo = () => {
    try {
      if (typeof window !== 'undefined' && window.LearnerRepository) return window.LearnerRepository;
      if (typeof require !== 'undefined') return require('./learner-repository');
    } catch (_) {}
    return null;
  };

  const GamificationEngine = {
    LEVELS,
    BADGES,

    /**
     * Get or initialize gamification progress
     */
    getProgress(ctx) {
      try {
        const repo = getRepo();
        if (repo) {
          const stored = repo.getGamification(ctx);
          if (stored) return stored;
        } else {
          const storage = getLocalStorage();
          const raw = storage ? storage.getItem(STORAGE_KEY_GAMIFICATION) : null;
          if (raw) return JSON.parse(raw);
        }
      } catch (e) {
        console.error('Error loading gamification progress:', e);
      }

      return {
        xp: 0,
        level: 1,
        badgesUnlocked: {},
        streakShieldsAvailable: 1, // 1 shield default
        lastShieldUsedDate: null,
        weeklyQuests: [
          { id: 'quest_1', title: 'Complete 3 Independent Solves', target: 3, current: 0, completed: false, xpReward: 100 },
          { id: 'quest_2', title: 'Review 5 Spaced Repetitions', target: 5, current: 0, completed: false, xpReward: 150 },
          { id: 'quest_3', title: 'Complete 1 Mock Interview Round', target: 1, current: 0, completed: false, xpReward: 200 }
        ]
      };
    },

    /**
     * Save progress
     */
    saveProgress(progress, ctx) {
      try {
        const repo = getRepo();
        if (repo) {
          repo.saveGamification(progress, ctx);
          return;
        }
        const storage = getLocalStorage();
        if (storage) {
          storage.setItem(STORAGE_KEY_GAMIFICATION, JSON.stringify(progress));
        }
      } catch (e) {
        console.error('Error saving gamification progress:', e);
      }
    },

    /**
     * Award XP for authentic learning event
     * @param {string} eventType - 'independent_solve' | 'delayed_recall' | 'mock_interview' | 'pattern_mastery'
     * @param {number} customXP 
     */
    awardXP(eventType, customXP = null) {
      const progress = this.getProgress();
      let earned = customXP || 0;

      if (!customXP) {
        if (eventType === 'independent_solve') earned = 50;
        else if (eventType === 'delayed_recall') earned = 75;
        else if (eventType === 'mock_interview') earned = 150;
        else if (eventType === 'pattern_mastery') earned = 200;
        else earned = 25;
      }

      progress.xp += earned;

      // Calculate current level
      let currentLevel = 1;
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (progress.xp >= LEVELS[i].xpRequired) {
          currentLevel = LEVELS[i].level;
          break;
        }
      }
      progress.level = currentLevel;

      this.saveProgress(progress);
      return { earned, totalXP: progress.xp, level: currentLevel };
    },

    /**
     * Evaluate and unlock achievement badges based on user state
     */
    evaluateBadges(allProblems = [], userStates = {}, mockHistory = []) {
      const progress = this.getProgress();
      const newlyUnlocked = [];

      let independentCount = 0;
      let delayedRecallCount = 0;
      let masteredCount = 0;

      Object.values(userStates).forEach(s => {
        if (!s || !s.lastReviewed) return;
        if (!s.hintsUsed && (s.confidence || 3) >= 4) independentCount++;
        if (s.isMastered) masteredCount++;
        if (s.stage >= 2 && s.lastRating !== 'failed') delayedRecallCount++;
      });

      // 1. First Independent
      if (independentCount >= 1 && !progress.badgesUnlocked['first_independent']) {
        progress.badgesUnlocked['first_independent'] = new Date().toISOString();
        newlyUnlocked.push('first_independent');
      }

      // 2. Memory Champion
      if (delayedRecallCount >= 1 && !progress.badgesUnlocked['first_delayed_recall']) {
        progress.badgesUnlocked['first_delayed_recall'] = new Date().toISOString();
        newlyUnlocked.push('first_delayed_recall');
      }

      // 3. Double Digit Mastery
      if (masteredCount >= 10 && !progress.badgesUnlocked['ten_mastered']) {
        progress.badgesUnlocked['ten_mastered'] = new Date().toISOString();
        newlyUnlocked.push('ten_mastered');
      }

      // 4. Mock Interview Victor
      const hasGoodMock = mockHistory.some(m => (m.overallPercentage || m.scorePercentage || 0) >= 75);
      if (hasGoodMock && !progress.badgesUnlocked['mock_victor']) {
        progress.badgesUnlocked['mock_victor'] = new Date().toISOString();
        newlyUnlocked.push('mock_victor');
      }

      if (newlyUnlocked.length > 0) {
        this.saveProgress(progress);
      }

      return {
        progress,
        newlyUnlocked
      };
    },

    /**
     * Calculate Level Progress Percentage to next tier
     */
    getLevelProgress(xp) {
      let currentTier = LEVELS[0];
      let nextTier = LEVELS[1];

      for (let i = 0; i < LEVELS.length; i++) {
        if (xp >= LEVELS[i].xpRequired) {
          currentTier = LEVELS[i];
          nextTier = LEVELS[i + 1] || null;
        } else {
          break;
        }
      }

      if (!nextTier) {
        return { currentLevel: currentTier.level, title: currentTier.title, percent: 100, xpToNext: 0 };
      }

      const range = nextTier.xpRequired - currentTier.xpRequired;
      const progressInRange = xp - currentTier.xpRequired;
      const percent = Math.min(100, Math.round((progressInRange / range) * 100));

      return {
        currentLevel: currentTier.level,
        title: currentTier.title,
        icon: currentTier.icon,
        percent: percent,
        xpCurrent: xp,
        xpToNext: nextTier.xpRequired - xp,
        nextTitle: nextTier.title
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamificationEngine;
  }
  if (typeof window !== 'undefined') {
    window.GamificationEngine = GamificationEngine;
  }
})();
