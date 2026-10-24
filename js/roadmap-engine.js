/**
 * AlgoRecall - Roadmap & Day-wise Study Planner Engine
 * Manages structured topic-wise roadmaps, daily target problem assignments,
 * integrated daily spaced revisions, and weekend super revision assessments.
 */

(function () {
  'use strict';

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

  const STORAGE_KEY_ROADMAP = 'algorecall_roadmap_progress_v1';

  const RoadmapEngine = {
    progress: null,

    // Initialize or load roadmap progress from localStorage or LearnerRepository
    initProgress(ctx) {
      try {
        const repo = getRepo();
        let stored = null;
        if (repo) {
          stored = repo.getRoadmapProgress(ctx);
        } else {
          const storage = getLocalStorage();
          const raw = storage ? storage.getItem(STORAGE_KEY_ROADMAP) : null;
          stored = raw ? JSON.parse(raw) : null;
        }
        this.progress = stored ? stored : this.getDefaultProgress();
        if (this.progress) {
          if (!this.progress.dsa12WeekSelectedWeek) this.progress.dsa12WeekSelectedWeek = 1;
          if (!this.progress.dsa12DailyMinutes) this.progress.dsa12DailyMinutes = 120;
          if (!this.progress.dsa12CustomSchedule) this.progress.dsa12CustomSchedule = {};
          if (!this.progress.dsa12DailyPlans) this.progress.dsa12DailyPlans = {};
          if (this.progress.weeklyStudyDays === undefined) this.progress.weeklyStudyDays = 5;
          if (this.progress.currentLearningTopic === undefined) {
            this.progress.currentLearningTopic = this.progress.selectedLearningTopic || null;
          }
          if (this.progress.revisionTopic === undefined) {
            this.progress.revisionTopic = this.progress.selectedRevisionTopic || null;
          }
          // Backward compatibility sync
          this.progress.selectedLearningTopic = this.progress.currentLearningTopic;
          this.progress.selectedRevisionTopic = this.progress.revisionTopic;
          if (this.progress.userLockedTopics === undefined) this.progress.userLockedTopics = false;
        }
      } catch (e) {
        console.error('Error loading roadmap progress:', e);
        this.progress = this.getDefaultProgress();
      }
    },

    getDefaultProgress() {
      return {
        activeTrack: 'striver_hero',
        selectedWeek: 1,
        selectedDay: 1,
        completedDays: {}, // e.g. { 'striver_hero_w1_d1': true }
        deferredRollovers: {},
        customDayTopics: {}, // key `${trackId}_w${w}_d${d}` -> string (single topic) or array of strings (mixed topics)
        customDayWorkouts: {}, // key `${trackId}_w${w}_d${d}` -> { topics: [...], problemIds: [...] }
        dsa12WeekSelectedWeek: 1,
        dsa12DailyMinutes: 120,
        dsa12CustomSchedule: {},
        dsa12DailyPlans: {},
        currentLearningTopic: null,
        revisionTopic: null,
        selectedLearningTopic: null,
        selectedRevisionTopic: null,
        weeklyStudyDays: 5,
        userLockedTopics: false,
        skippedTasks: {}
      };
    },

    saveProgress(ctx) {
      try {
        const repo = getRepo();
        if (repo) {
          repo.saveRoadmapProgress(this.progress, ctx);
          return;
        }
        const storage = getLocalStorage();
        if (storage) {
          storage.setItem(STORAGE_KEY_ROADMAP, JSON.stringify(this.progress));
        }
      } catch (e) {
        console.error('Error saving roadmap progress:', e);
      }
    },

    toggleDayCompleted(trackId, weekNum, dayNum) {
      const key = `${trackId}_w${weekNum}_d${dayNum}`;
      if (this.progress.completedDays[key]) {
        delete this.progress.completedDays[key];
      } else {
        this.progress.completedDays[key] = true;
      }
      this.saveProgress();
    },

    isDayCompleted(trackId, weekNum, dayNum) {
      const key = `${trackId}_w${weekNum}_d${dayNum}`;
      return !!this.progress.completedDays[key];
    },

    setDayCustomTopic(trackId, weekNum, dayNum, topicOrTopics) {
      if (!this.progress) this.initProgress();
      if (!this.progress.customDayTopics) this.progress.customDayTopics = {};
      const key = `${trackId}_w${weekNum}_d${dayNum}`;
      this.progress.customDayTopics[key] = topicOrTopics;
      if (this.progress.customDayWorkouts) delete this.progress.customDayWorkouts[key];
      this.saveProgress();
    },

    getDayCustomTopic(trackId, weekNum, dayNum) {
      if (!this.progress || !this.progress.customDayTopics) return null;
      const key = `${trackId}_w${weekNum}_d${dayNum}`;
      return this.progress.customDayTopics[key] || null;
    },

    resetDayTopic(trackId, weekNum, dayNum) {
      if (!this.progress) this.initProgress();
      const key = `${trackId}_w${weekNum}_d${dayNum}`;
      if (this.progress.customDayTopics) delete this.progress.customDayTopics[key];
      if (this.progress.customDayWorkouts) delete this.progress.customDayWorkouts[key];
      this.saveProgress();
    },

    saveCustomDayMixedWorkout(trackId, weekNum, dayNum, problemIds, selectedTopics = []) {
      if (!this.progress) this.initProgress();
      if (!this.progress.customDayWorkouts) this.progress.customDayWorkouts = {};
      if (!this.progress.customDayTopics) this.progress.customDayTopics = {};
      const key = `${trackId}_w${weekNum}_d${dayNum}`;
      this.progress.customDayTopics[key] = selectedTopics;
      this.progress.customDayWorkouts[key] = {
        topics: selectedTopics,
        problemIds: problemIds,
        timestamp: Date.now()
      };
      this.saveProgress();
    },

    // Available Study Tracks
    TRACKS: {
      striver_hero: {
        id: 'striver_hero',
        title: '🚀 12-Week Zero-to-Hero Mastery',
        subtitle: 'Complete 479 Striver A2Z roadmap from foundations to advanced algorithms with daily revisions',
        durationWeeks: 12,
        totalDays: 84
      },
      faang_60: {
        id: 'faang_60',
        title: '💼 8-Week FAANG & SDE Sprint',
        subtitle: 'High-frequency interview problems from NeetCode 150 & Striver SDE top asked patterns',
        durationWeeks: 8,
        totalDays: 56
      },
      blind_30: {
        id: 'blind_30',
        title: '⚡ 4-Week Blind 75 Crash Course',
        subtitle: 'Essential 75 patterns for urgent upcoming technical interview rounds',
        durationWeeks: 4,
        totalDays: 28
      }
    },

    /**
     * Get roadmap schedule for the active track
     */
    getSchedule(trackId = 'striver_hero', allProblems = []) {
      if (trackId === 'blind_30') {
        return this.generateBlind30Schedule(allProblems);
      } else if (trackId === 'faang_60') {
        return this.generateFAANG60Schedule(allProblems);
      }
      return this.generateStriverHeroSchedule(allProblems);
    },

    /**
     * Helper to find problems by keywords or titles with difficulty-adapted limits & confidence scoring
     * Easy-heavy focus: 3-4 problems
     * Medium-heavy focus: 2-3 problems
     * Hard-heavy focus: 1-2 problems
     */
    findProblems(allProblems, keywords = [], topic = '', explicitLimit = null, userStates = null) {
      // If RecommendationEngine and userStates are available, use adaptive confidence-aware scoring
      if (window.RecommendationEngine && userStates) {
        return window.RecommendationEngine.findAdaptiveProblems(allProblems, keywords, topic, explicitLimit, userStates);
      }

      let matched = [];
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

      // Dynamic difficulty quota calculation
      let limit = explicitLimit;
      if (!limit) {
        const sample = matched.slice(0, 5);
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

      return matched.slice(0, limit);
    },

    /**
     * Generate mixed problem set across multiple selected topics with confidence pacing
     */
    generateMultiTopicMixedProblems(allProblems, selectedTopics = [], options = {}, userStates = null) {
      if (!selectedTopics || selectedTopics.length === 0) return [];
      const diffPref = options.difficulty || 'balanced';
      const targetCount = options.count && options.count !== 'auto' 
        ? parseInt(options.count, 10) 
        : (selectedTopics.length <= 2 ? 3 : Math.min(4, selectedTopics.length));

      const selected = [];
      const selectedIds = new Set();

      const topicBuckets = {};
      selectedTopics.forEach(t => {
        topicBuckets[t] = allProblems.filter(p => p.topic.toLowerCase().includes(t.toLowerCase()) || (p.pattern || '').toLowerCase().includes(t.toLowerCase()));
      });

      let topicIdx = 0;
      let iterations = 0;
      while (selected.length < targetCount && iterations < 30) {
        iterations++;
        const currentTopic = selectedTopics[topicIdx % selectedTopics.length];
        const pool = topicBuckets[currentTopic] || [];

        let candidates = pool.filter(p => !selectedIds.has(p.id));
        if (diffPref === 'Easy') {
          candidates = candidates.filter(p => p.difficulty === 'Easy');
        } else if (diffPref === 'Medium') {
          candidates = candidates.filter(p => p.difficulty === 'Medium');
        } else if (diffPref === 'Hard') {
          candidates = candidates.filter(p => p.difficulty === 'Hard');
        } else if (diffPref === 'balanced') {
          const desiredDiff = selected.length === 0 ? 'Easy' : (selected.length === targetCount - 1 && targetCount >= 3 ? 'Hard' : 'Medium');
          const matchedDiff = candidates.filter(p => p.difficulty === desiredDiff);
          if (matchedDiff.length > 0) candidates = matchedDiff;
        }

        if (candidates.length > 0) {
          // If RecommendationEngine is available, rank candidate picks by confidence score
          if (window.RecommendationEngine && userStates) {
            candidates.sort((a, b) => {
              const scoreA = window.RecommendationEngine.scoreProblem(a, userStates).finalScore;
              const scoreB = window.RecommendationEngine.scoreProblem(b, userStates).finalScore;
              return scoreB - scoreA;
            });
          }
          const pick = candidates[0];
          selected.push({ ...pick, _sourceTopic: currentTopic });
          selectedIds.add(pick.id);
        } else {
          const anyRem = pool.filter(p => !selectedIds.has(p.id));
          if (anyRem.length > 0) {
            const pick = anyRem[0];
            selected.push({ ...pick, _sourceTopic: currentTopic });
            selectedIds.add(pick.id);
          }
        }

        topicIdx++;
      }

      return selected;
    },

    /**
     * Resolves the actual problems for a given day (considering custom topic override or custom mixed workouts)
     */
    getDayProblems(trackId, weekNum, dayNum, defaultDayObj, allProblems, userStates = null) {
      if (!this.progress) this.initProgress();
      const key = `${trackId}_w${weekNum}_d${dayNum}`;

      // 1. Check if user has an active saved custom mixed workout
      const savedWorkout = this.progress?.customDayWorkouts?.[key];
      if (savedWorkout && Array.isArray(savedWorkout.problemIds) && savedWorkout.problemIds.length > 0) {
        const idMap = new Map(allProblems.map(p => [p.id, p]));
        const probs = savedWorkout.problemIds.map(id => idMap.get(id)).filter(Boolean);
        if (probs.length > 0) return probs;
      }

      // 2. Check if user switched to a single custom topic or array of topics
      const customTopic = this.progress?.customDayTopics?.[key];
      if (customTopic) {
        if (Array.isArray(customTopic)) {
          return this.generateMultiTopicMixedProblems(allProblems, customTopic, { difficulty: 'balanced' }, userStates);
        } else if (typeof customTopic === 'string') {
          return this.findProblems(allProblems, [], customTopic, null, userStates);
        }
      }

      // 3. Fallback to default roadmap curriculum for this day
      return this.findProblems(allProblems, defaultDayObj.problemKeywords || [], defaultDayObj.topic, null, userStates);
    },

    /**
     * Get unified, combined daily problem schedule for today (strictly capped at 2, 3, or 4 problems total)
     * Combines due spaced revisions, carried-over uncompleted problems, and new target topics together in one list.
     * @param {string} trackId
     * @param {number} weekNum
     * @param {number} dayNum
     * @param {Object} defaultDayObj
     * @param {Array} allProblems
     * @param {Object} userStates
     * @param {number|null} maxDailyCap - optional explicit cap (2, 3, or 4). Defaults to 3.
     */
    getUnifiedDailyProblems(trackId, weekNum, dayNum, defaultDayObj, allProblems = [], userStates = {}, maxDailyCap = null) {
      if (!this.progress) this.initProgress();
      const key = `${trackId}_w${weekNum}_d${dayNum}`;

      // 1. Check if user configured an explicit custom mixed workout
      const savedWorkout = this.progress?.customDayWorkouts?.[key];
      if (savedWorkout && Array.isArray(savedWorkout.problemIds) && savedWorkout.problemIds.length > 0) {
        const idMap = new Map(allProblems.map(p => [p.id, p]));
        const probs = savedWorkout.problemIds.map(id => idMap.get(id)).filter(Boolean);
        if (probs.length > 0) {
          return probs.map(p => ({
            ...p,
            scheduleRole: 'target',
            roleLabel: 'Mixed Target',
            badgeClass: 'badge-target',
            roleIcon: 'fa-crosshairs'
          }));
        }
      }

      // 2. Determine Daily Quota (strictly 2, 3, or 4 problems total)
      let targetDailyCount = maxDailyCap;
      if (!targetDailyCount || targetDailyCount < 2 || targetDailyCount > 4) {
        targetDailyCount = 3; // Default 3 problems (~50-65 mins balanced)
      }

      const unifiedList = [];
      const seenIds = new Set();

      // SOURCE 1: Due Spaced Repetition Revisions (Priority 1: max 1-2 slots)
      const topicLower = (defaultDayObj.topic || '').toLowerCase();
      const allDue = allProblems.filter(p => {
        const state = userStates[p.id];
        return SRSEngine.isDue(state);
      });

      // Sort due revisions: lowest confidence first, then matching today's topic
      allDue.sort((a, b) => {
        const stateA = userStates[a.id];
        const stateB = userStates[b.id];
        const confA = SRSEngine.getConfidence(stateA) || 3;
        const confB = SRSEngine.getConfidence(stateB) || 3;
        if (confA !== confB) return confA - confB;
        const matchA = a.topic.toLowerCase().includes(topicLower) ? 1 : 0;
        const matchB = b.topic.toLowerCase().includes(topicLower) ? 1 : 0;
        return matchB - matchA;
      });

      const maxRevisionSlots = Math.min(2, allDue.length, Math.floor(targetDailyCount / 2));
      for (let i = 0; i < allDue.length && unifiedList.length < maxRevisionSlots; i++) {
        const p = allDue[i];
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          unifiedList.push({
            ...p,
            scheduleRole: 'revision',
            roleLabel: 'Due Revision',
            badgeClass: 'badge-revision',
            roleIcon: 'fa-rotate'
          });
        }
      }

      // SOURCE 2: Carried-over Unsolved Problems from previous days (Priority 2: max 1 slot)
      if (!defaultDayObj.isWeekend && unifiedList.length < targetDailyCount) {
        const rollovers = this.getRolloverProblems(trackId, weekNum, dayNum, allProblems, userStates);
        for (let i = 0; i < rollovers.length && unifiedList.length < (targetDailyCount - 1); i++) {
          const p = rollovers[i];
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            unifiedList.push({
              ...p,
              scheduleRole: 'rollover',
              roleLabel: `Carried Over (Day ${p.fromDay})`,
              badgeClass: 'badge-rollover',
              roleIcon: 'fa-clock-rotate-left'
            });
            break; // Max 1 rollover slot to preserve quota for new topics
          }
        }
      }

      // SOURCE 3: Today's New Target Problems (Fill all remaining slots up to targetDailyCount)
      const remainingSlots = targetDailyCount - unifiedList.length;
      if (remainingSlots > 0) {
        const rawTargets = this.getDayProblems(trackId, weekNum, dayNum, defaultDayObj, allProblems, userStates);
        for (const p of rawTargets) {
          if (unifiedList.length >= targetDailyCount) break;
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            unifiedList.push({
              ...p,
              scheduleRole: 'target',
              roleLabel: 'New Target',
              badgeClass: 'badge-target',
              roleIcon: 'fa-crosshairs'
            });
          }
        }

        // If raw targets had overlap with seenIds and we still need slots, fetch adaptive candidate
        if (unifiedList.length < targetDailyCount && window.RecommendationEngine) {
          const adaptive = RecommendationEngine.findAdaptiveProblems(
            allProblems.filter(p => !seenIds.has(p.id)),
            defaultDayObj.problemKeywords || [],
            defaultDayObj.topic || '',
            targetDailyCount - unifiedList.length,
            userStates
          );
          for (const p of adaptive) {
            if (unifiedList.length >= targetDailyCount) break;
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              unifiedList.push({
                ...p,
                scheduleRole: 'target',
                roleLabel: 'New Target',
                badgeClass: 'badge-target',
                roleIcon: 'fa-crosshairs'
              });
            }
          }
        }
      }

      return unifiedList;
    },

    /**
     * Calculate Workload Metrics (difficulty split, total estimated time, label)
     */
    calculateWorkload(problems = []) {
      let easy = 0, med = 0, hard = 0;
      problems.forEach(p => {
        if (p.difficulty === 'Hard') hard++;
        else if (p.difficulty === 'Medium') med++;
        else easy++;
      });

      const totalMins = (easy * 12) + (med * 28) + (hard * 50);

      let label = '';
      let typeClass = 'medium';

      if (hard > 0 && med > 0) {
        label = `${hard} Hard + ${med} Med • ~${totalMins}m`;
        typeClass = 'hard';
      } else if (hard > 0) {
        label = `${hard} Hard • ~${totalMins}m`;
        typeClass = 'hard';
      } else if (med > 0 && easy > 0) {
        label = `${med} Med + ${easy} Easy • ~${totalMins}m`;
        typeClass = 'mixed';
      } else if (med > 0) {
        label = `${med} Medium${med > 1 ? 's' : ''} • ~${totalMins}m`;
        typeClass = 'medium';
      } else if (easy > 0) {
        label = `${easy} Easy • ~${totalMins}m`;
        typeClass = 'easy';
      } else {
        label = 'Standard Practice';
        typeClass = 'medium';
      }

      return {
        easy,
        med,
        hard,
        totalCount: problems.length,
        estimatedMinutes: totalMins,
        label,
        typeClass
      };
    },

    /**
     * Get carried-over (rollover) unsolved target problems from all previous days in the track
     */
    getRolloverProblems(trackId, currentWeekNum, currentDayNum, allProblems, userStates) {
      const schedule = this.getSchedule(trackId, allProblems);
      const rolloverList = [];
      const seenIds = new Set();

      const deferredMap = (this.progress && this.progress.deferredRollovers) || {};

      for (const week of schedule) {
        if (week.weekNumber > currentWeekNum) break;

        for (const day of week.days) {
          if (week.weekNumber === currentWeekNum && day.dayNumber >= currentDayNum) {
            break;
          }

          if (day.isWeekend) continue;

          // Target problems assigned to this prior day (using getDayProblems)
          const targetProbs = this.getDayProblems(trackId, week.weekNumber, day.dayNumber, day, allProblems);

          targetProbs.forEach(p => {
            const state = userStates[p.id];
            const isSolved = state && state.lastReviewed;

            if (!isSolved && !seenIds.has(p.id) && !deferredMap[p.id]) {
              seenIds.add(p.id);
              rolloverList.push({
                ...p,
                fromWeek: week.weekNumber,
                fromDay: day.dayNumber,
                fromDayTitle: day.title
              });
            }
          });
        }
      }

      return rolloverList;
    },

    /**
     * Defer or dismiss a rollover problem to keep schedule clean
     */
    deferRolloverProblem(problemId) {
      if (!this.progress) this.initProgress();
      if (!this.progress.deferredRollovers) {
        this.progress.deferredRollovers = {};
      }
      this.progress.deferredRollovers[problemId] = true;
      this.saveProgress();
    },

    /**
     * Undefer all rollover problems if user wants them back
     */
    undeferAllRollovers() {
      if (!this.progress) this.initProgress();
      this.progress.deferredRollovers = {};
      this.saveProgress();
    },

    /**
     * Generate 12-Week Comprehensive Roadmap Schedule
     */
    generateStriverHeroSchedule(allProblems) {
      return [
        {
          weekNumber: 1,
          title: 'Foundations, Basic Math & Sorting',
          topic: 'Basics & Math',
          description: 'Master time/space complexity, number theory, basic recursion, and divide & conquer sorting.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Number Theory & Basic Math',
              focus: 'Digit extraction, logarithmic arithmetic, and Euclidean algorithm',
              problemKeywords: ['Count Digits', 'Reverse a Number', 'Check Palindrome', 'GCD Or HCF', 'Armstrong'],
              topic: 'Basics & Math',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Divisors, Primes & Sieve',
              focus: 'Divisor enumeration in O(sqrt N) and prime factorization',
              problemKeywords: ['All Divisors', 'Prime Number', 'Factorial', 'Fibonacci'],
              topic: 'Basics & Math',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Elementary Sorting Algorithms',
              focus: 'Quadratic sorting mechanics, in-place swaps, and edge cases',
              problemKeywords: ['Selection Sort', 'Bubble Sort', 'Insertion Sort'],
              topic: 'Sorting',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Divide & Conquer Sorting',
              focus: 'O(N log N) divide & conquer, recursive tree partitioning, and stability',
              problemKeywords: ['Merge Sort', 'Quick Sort'],
              topic: 'Sorting',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Frequency Maps & Basic Hashing',
              focus: 'Hash map lookups, counting elements, and character frequency arrays',
              problemKeywords: ['Frequency', 'Highest / Lowest Frequency', 'Hashing'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Consolidate all Math & Sorting techniques with Flashcard Recall speed drill',
              topic: 'Basics & Math',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min retention checkpoint on Week 1 fundamentals',
              topic: 'Basics & Math',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 2,
          title: 'Arrays & Hashing Masterclass',
          topic: 'Arrays & Hashing',
          description: 'Prefix sums, Kadane algorithm, subarray tracking, and in-place matrix manipulations.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Array Fundamentals & Kadane Algorithm',
              focus: 'Largest element, second largest, check sorted, and maximum subarray sum',
              problemKeywords: ['Largest Element', 'Second Largest', 'Check if Array is Sorted', 'Maximum Subarray Sum'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Hashing & Two Sum Patterns',
              focus: 'Complement lookup with Hash Maps, Majority Element Moore Voting',
              problemKeywords: ['Two Sum', 'Majority Element', 'Sort an array of 0s, 1s and 2s'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Stock Buy/Sell & Rearranging',
              focus: 'Single-pass min tracking, alternating positive/negative ordering',
              problemKeywords: ['Best Time to Buy and Sell Stock', 'Rearrange Array Elements by Sign', 'Next Permutation'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Prefix Sum & Subarray Sums',
              focus: 'Prefix sum hash maps, Longest Consecutive Sequence tracking',
              problemKeywords: ['Longest Subarray with Sum K', 'Longest Consecutive Sequence', 'Leaders in an Array'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: 2D Matrix Algorithms',
              focus: 'Matrix row/column zeroing, in-place 90 deg rotation, and spiral traversal',
              problemKeywords: ['Set Matrix Zeroes', 'Rotate Image', 'Spiral Matrix'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Review Kadane, Prefix Sum, and Matrix transformations',
              topic: 'Arrays & Hashing',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min retention checkpoint on Arrays & Matrix problems',
              topic: 'Arrays & Hashing',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 3,
          title: 'Advanced Arrays, Two Pointers & Sliding Window',
          topic: 'Sliding Window & Two Pointers',
          description: 'Converging pointers, expanding/contracting sliding windows, and n-Sum generalizations.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Advanced Arrays & Interval Merging',
              focus: 'Pascal triangle generation, 3Sum, 4Sum, and merging overlapping intervals',
              problemKeywords: ['Pascal Triangle', '3 Sum', '4 Sum', 'Merge Overlapping Subintervals'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Missing Numbers & Inversion Counting',
              focus: 'Find missing & repeating numbers, merge sorted arrays without extra space',
              problemKeywords: ['Find the repeating and missing number', 'Merge two sorted arrays without extra space', 'Count Inversions'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Sliding Window Fundamentals',
              focus: 'Fixed & dynamic sliding windows with character frequency tables',
              problemKeywords: ['Longest Substring Without Repeating Characters', 'Max Consecutive Ones III', 'Fruit Into Baskets'],
              topic: 'Sliding Window & Two Pointers',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Window Contraction & Distinct Substrings',
              focus: 'Exact K conditions using At Most K logic, binary subarrays with sum',
              problemKeywords: ['Longest Repeating Character Replacement', 'Binary Subarrays with Sum', 'Count Number of Nice Subarrays'],
              topic: 'Sliding Window & Two Pointers',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Two Pointers Water & Palindromes',
              focus: 'Two pointer height trapping, container bounding, and longest palindromic substring',
              problemKeywords: ['Container With Most Water', 'Trapping Rain Water', 'Longest Palindromic Substring'],
              topic: 'Sliding Window & Two Pointers',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Two Pointers & Sliding Window templates review',
              topic: 'Sliding Window & Two Pointers',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min test on Sliding Window & n-Sum problems',
              topic: 'Sliding Window & Two Pointers',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 4,
          title: 'Binary Search & Search Space Reduction',
          topic: 'Binary Search',
          description: '1D binary search, rotated sorted arrays, search space reduction (BS on Answer), and bitwise tricks.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: 1D Binary Search & Bounds',
              focus: 'Lower bound, upper bound, search insert position, floor & ceil',
              problemKeywords: ['Binary Search', 'Lower Bound', 'Upper Bound', 'Search Insert Position', 'Floor and Ceil'],
              topic: 'Binary Search',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Rotated Sorted Arrays & Peak Finding',
              focus: 'Pivot elimination in rotated arrays and finding local peaks',
              problemKeywords: ['Search in Rotated Sorted Array', 'Find Minimum in Rotated Sorted Array', 'Find Peak Element', 'Single Element in a Sorted Array'],
              topic: 'Binary Search',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Binary Search on Answer Space (Min/Max)',
              focus: 'Monotonic feasibility checking, Koko bananas, and capacity allocation',
              problemKeywords: ['Find Square Root', 'Koko Eating Bananas', 'Minimum Days to Make M Bouquets', 'Capacity to Ship Packages'],
              topic: 'Binary Search',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Hard BS on Answers (Allocation & Cows)',
              focus: 'Book allocation, aggressive cows, and split array largest sum',
              problemKeywords: ['Aggressive Cows', 'Book Allocation Problem', 'Split Array Largest Sum', 'Painter Partition'],
              topic: 'Binary Search',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: 2D Matrix Binary Search & Bit Manipulation',
              focus: 'Search in row/column sorted matrix, single number XOR, and set bit counting',
              problemKeywords: ['Search in a 2D Matrix', 'Search in a row and column wise sorted matrix', 'Single Number', 'Count Set Bits'],
              topic: 'Binary Search',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Binary Search predicate functions & bounds review',
              topic: 'Binary Search',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on Binary Search on Answers',
              topic: 'Binary Search',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 5,
          title: 'Linked Lists & Fast-Slow Pointers',
          topic: 'Linked List',
          description: 'Singly, doubly, cycle detection, k-group reversal, and complex deep copies.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Linked List Traversal & Modification',
              focus: 'Node insertion, deletion, length calculation, and search',
              problemKeywords: ['Introduction to Linked List', 'Insert Node', 'Delete Node in a Linked List', 'Search in a Linked List'],
              topic: 'Linked List',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Reversing & Fast-Slow Pointers',
              focus: 'In-place iterative reversal, finding middle node, cycle detection (Floyd)',
              problemKeywords: ['Reverse Linked List', 'Middle of the Linked List', 'Detect a loop in LL', 'Find the starting point in LL'],
              topic: 'Linked List',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Palindrome, Remove Nth, and Deletions',
              focus: 'Half reversal for palindrome verification, two-pointer nth node removal',
              problemKeywords: ['Check if LL is palindrome', 'Remove Nth Node From End of List', 'Delete the Middle Node'],
              topic: 'Linked List',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Multi-List Operations & Intersections',
              focus: 'Intersection point of two LLs, Add 1 to number, Add two numbers in LL',
              problemKeywords: ['Find the intersection point of Y LL', 'Add 1 to a number represented by LL', 'Add two numbers represented by LL'],
              topic: 'Linked List',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Hard LL Operations (K-Group & Deep Copy)',
              focus: 'Reverse nodes in k-Group, clone LL with random pointer, flattening LL',
              problemKeywords: ['Reverse Nodes in k-Group', 'Clone a Linked List with random and next pointer', 'Flattening a Linked List', 'Rotate a LL'],
              topic: 'Linked List',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Linked List pointer manipulation templates review',
              topic: 'Linked List',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on Linked List reversals & cycle algorithms',
              topic: 'Linked List',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 6,
          title: 'Stacks, Queues & Monotonic Patterns',
          topic: 'Stack & Queue',
          description: 'LIFO/FIFO fundamentals, monotonic stacks, largest rectangle in histogram, and LRU cache.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Stack & Queue Foundations',
              focus: 'Array implementations, Queue using Stacks, and Valid Parentheses',
              problemKeywords: ['Implement Stack using Arrays', 'Implement Queue using Arrays', 'Implement Queue using Stack', 'Valid Parentheses', 'Min Stack'],
              topic: 'Stack & Queue',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Monotonic Stack Essentials',
              focus: 'Next Greater Element, Next Smaller Element, circular arrays',
              problemKeywords: ['Next Greater Element', 'Next Greater Element 2', 'Nearest Smaller Element', 'Number of NGEs to the right'],
              topic: 'Stack & Queue',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Subarray Ranges & Water Trapping',
              focus: 'Trapping Rain Water with monotonic stack, Asteroid Collision, Sum of Subarray Minimums',
              problemKeywords: ['Trapping Rainwater', 'Asteroid Collision', 'Sum of Subarray Minimums', 'Sum of Subarray Ranges'],
              topic: 'Stack & Queue',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Histogram & Maximal Rectangle',
              focus: 'Largest Rectangle in Histogram with single pass stack, 2D Maximal Rectangle',
              problemKeywords: ['Largest Rectangle in Histogram', 'Maximal Rectangle', 'Remove K Digits'],
              topic: 'Stack & Queue',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Sliding Window Maximum & LRU Cache',
              focus: 'Monotonic Deque sliding window, O(1) LRU & LFU Cache data structures',
              problemKeywords: ['Sliding Window Maximum', 'LRU Cache', 'LFU Cache', 'Online Stock Span'],
              topic: 'Stack & Queue',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Monotonic stack templates & cache designs review',
              topic: 'Stack & Queue',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on Monotonic Stack & LRU Cache',
              topic: 'Stack & Queue',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 7,
          title: 'Recursion, Backtracking & Combinatorics',
          topic: 'Recursion & Backtracking',
          description: 'Subsets, permutations, combinations, grid exploration, and constraint satisfaction.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Subsequences & Subset Generation',
              focus: 'Pick/Non-pick recursion, generating all subsets, Subset Sums',
              problemKeywords: ['Print all Subsequences', 'Subset Sum', 'Subsets I', 'Subsets II'],
              topic: 'Recursion & Backtracking',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Combination Sums',
              focus: 'Unbounded coin pick vs single pick with duplicates handling',
              problemKeywords: ['Combination Sum', 'Combination Sum II', 'Combination Sum III'],
              topic: 'Recursion & Backtracking',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Permutations & Phone Number Combos',
              focus: 'In-place swapping recursion, letter combinations, palindrome partitioning',
              problemKeywords: ['Permutations', 'Permutations II', 'Letter Combinations of a Phone Number', 'Palindrome Partitioning'],
              topic: 'Recursion & Backtracking',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Grid Backtracking & Word Search',
              focus: 'Matrix boundary checks, visited state backtracking, and Rat in a Maze',
              problemKeywords: ['Word Search', 'Rat in a Maze', 'Generate Parentheses'],
              topic: 'Recursion & Backtracking',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Hard Constraint Backtracking',
              focus: 'Diagonal and row/col safety hashing: N-Queens, Sudoku Solver, M-Coloring',
              problemKeywords: ['N Queens', 'Sudoku Solver', 'M Coloring Problem'],
              topic: 'Recursion & Backtracking',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Backtracking tree pruning & state restoration review',
              topic: 'Recursion & Backtracking',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on N-Queens and Subsets',
              topic: 'Recursion & Backtracking',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 8,
          title: 'Binary Trees & Binary Search Trees',
          topic: 'Binary Trees & BST',
          description: 'Traversals, views, ancestor queries, LCA, diameter, and BST search properties.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Tree Traversals (Iterative & BFS)',
              focus: 'Preorder, Inorder, Postorder with stack and Level-Order BFS',
              problemKeywords: ['Binary Tree Inorder Traversal', 'Binary Tree Preorder Traversal', 'Binary Tree Postorder Traversal', 'Level Order Traversal'],
              topic: 'Binary Trees & BST',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Height, Balance & Diameter',
              focus: 'Maximum depth, checking balance in O(N), Diameter of Binary Tree',
              problemKeywords: ['Height of a Binary Tree', 'Check for Balanced Binary Tree', 'Diameter of Binary Tree', 'Maximum Path Sum'],
              topic: 'Binary Trees & BST',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Tree Views & Boundary Traversal',
              focus: 'Top view, bottom view, right/left view using coordinate hashing',
              problemKeywords: ['Zig Zag Traversal', 'Boundary Traversal', 'Vertical Order Traversal', 'Top View of Binary Tree', 'Bottom View of Binary Tree'],
              topic: 'Binary Trees & BST',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Ancestors, LCA & Distance K',
              focus: 'Lowest Common Ancestor in Binary Tree, Nodes at Distance K, Construct Tree from Traversals',
              problemKeywords: ['Lowest Common Ancestor', 'All Nodes Distance K in Binary Tree', 'Construct Binary Tree from Preorder and Inorder', 'Symmetric Tree'],
              topic: 'Binary Trees & BST',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Binary Search Trees (BST)',
              focus: 'BST search property, Validate BST, LCA in BST, Kth Smallest Element in BST',
              problemKeywords: ['Search in a Binary Search Tree', 'Ceil in a BST', 'Floor in a BST', 'Validate Binary Search Tree', 'LCA in BST', 'Kth Smallest Element in BST'],
              topic: 'Binary Trees & BST',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Tree recursions & coordinate view templates review',
              topic: 'Binary Trees & BST',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on LCA & Tree Diameter',
              topic: 'Binary Trees & BST',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 9,
          title: 'Dynamic Programming I (1D, 2D Grid & Subsequences)',
          topic: 'Dynamic Programming',
          description: 'Memoization to tabulation, space optimization, 2D paths, and 0/1 knapsack variants.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: 1D DP & Transition Optimizations',
              focus: 'Climbing stairs, Frog Jump, House Robber I & II with O(1) space',
              problemKeywords: ['Climbing Stars', 'Frog Jump', 'House Robber', 'House Robber II', 'Maximum Sum of Non-Adjacent Elements'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: 2D Grid Dynamic Programming',
              focus: 'Unique Paths I & II, Minimum Path Sum, Triangle, 3D Cherry Pickup',
              problemKeywords: ['Grid Unique Paths', 'Grid Unique Paths 2', 'Minimum Path Sum In a Grid', 'Triangle', 'Chocalate Pickup'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: DP on Subsequences & Subsets',
              focus: 'Subset Sum Equals Target, Partition Equal Subset Sum, Count Subsets with Sum K',
              problemKeywords: ['Subset Sum Equals to Target', 'Partition Equal Subset Sum', 'Count Subsets with Sum K', 'Count Partitions with Given Difference'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Knapsack & Coin Change Variants',
              focus: '0/1 Knapsack, Unbounded Knapsack, Minimum Coins, Coin Change II',
              problemKeywords: ['0/1 Knapsack', 'Unbounded Knapsack', 'Minimum Coins', 'Coin Change 2', 'Target Sum'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Longest Common Subsequence (LCS)',
              focus: 'String LCS table, printing LCS, Longest Common Substring, Shortest Common Supersequence',
              problemKeywords: ['Longest Common Subsequence', 'Print Longest Common Subsequence', 'Longest Common Substring', 'Shortest Common Supersequence'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: '1D, 2D Grid, and Knapsack DP state transitions review',
              topic: 'Dynamic Programming',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on Knapsack and LCS DP problems',
              topic: 'Dynamic Programming',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 10,
          title: 'Dynamic Programming II (Strings, LIS, Stock & Partition DP)',
          topic: 'Dynamic Programming',
          description: 'Edit distance, Longest Increasing Subsequence with Binary Search, Stock transitions, and MCM.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Advanced String DP & Matching',
              focus: 'Minimum insertions to make palindrome, Edit Distance, Distinct Subsequences, Wildcard Matching',
              problemKeywords: ['Minimum Insertions to Make String Palindrome', 'Edit Distance', 'Distinct Subsequences', 'Wildcard Matching'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Stock Buy & Sell State Machines',
              focus: 'Stock I through IV, cooldown conditions, transaction fees',
              problemKeywords: ['Buy and Sell Stock', 'Buy and Sell Stock II', 'Buy and Sell Stock III', 'Buy and Sell Stocks 4', 'Buy and Sell Stock With Cooldown', 'Buy and Sell Stock with Transaction Fee'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Longest Increasing Subsequence (LIS)',
              focus: 'LIS DP table, Printing LIS, O(N log N) Binary Search patience sorting, Longest String Chain',
              problemKeywords: ['Longest Increasing Subsequence', 'Printing Longest Increasing Subsequence', 'Longest String Chain', 'Longest Bitonic Subsequence'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Matrix Chain Multiplication & Partition DP',
              focus: 'Partition DP boundaries, Matrix Chain Multiplication, Minimum Cost to Cut a Stick',
              problemKeywords: ['Matrix Chain Multiplication', 'Minimum Cost to Cut the Stick', 'Burst Balloons'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Boolean Evaluation & Rectangle DP',
              focus: 'Evaluate Boolean Expression to True, Palindrome Partitioning II, Maximum Rectangle of 1s',
              problemKeywords: ['Evaluate Boolean Expression to True', 'Palindrome Partitioning II', 'Maximum Rectangle Area with all 1'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'LIS Binary Search & Partition DP state transitions review',
              topic: 'Dynamic Programming',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on LIS & Edit Distance',
              topic: 'Dynamic Programming',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 11,
          title: 'Graphs (BFS/DFS, Topological Sort & Shortest Paths)',
          topic: 'Graphs',
          description: 'Graph representations, connectivity, topological ordering, Dijkstra, Bellman-Ford, and DSU.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Graph Representation, BFS & DFS',
              focus: 'Adjacency lists, Connected components, Number of Provinces, Number of Islands, Rotting Oranges',
              problemKeywords: ['BFS', 'DFS', 'Number of Provinces', 'Number of Islands', 'Rotting Oranges', 'Flood Fill'],
              topic: 'Graphs',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Cycle Detection & Bipartite Graphs',
              focus: 'Undirected BFS/DFS cycle check, Directed DFS path visited check, Bipartite coloring',
              problemKeywords: ['Detect Cycle in an Undirected Graph', 'Directed Graph Cycle', 'Is Graph Bipartite', 'Surrounded Regions'],
              topic: 'Graphs',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Topological Sort & DAG Dependency',
              focus: 'DFS topological sort, Kahn algorithm (BFS in-degree), Course Schedule I & II, Alien Dictionary',
              problemKeywords: ['Topological Sort', 'Course Schedule', 'Course Schedule II', 'Alien Dictionary', 'Find Eventual Safe States'],
              topic: 'Graphs',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: Shortest Path Algorithms',
              focus: 'Shortest path in unweighted graph, Dijkstra using Priority Queue, Bellman Ford, Floyd Warshall',
              problemKeywords: ['Shortest Path in DAG', 'Dijkstra', 'Shortest Path in Weighted undirected graph', 'Bellman Ford', 'Floyd Warshall', 'Network Delay Time'],
              topic: 'Graphs',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Minimum Spanning Trees & Disjoint Set Union (DSU)',
              focus: 'Disjoint Set by Rank & Size, Kruskal MST, Prim MST, Number of Operations to Make Network Connected, Accounts Merge',
              problemKeywords: ['Disjoint Set', 'Kruskals Algorithm', 'Prims Algorithm', 'Number of Operations to Make Network Connected', 'Accounts Merge', 'Making a Large Island'],
              topic: 'Graphs',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Weekly Super Revision 🔄',
              focus: 'Dijkstra, Topological Sort & DSU patterns review',
              topic: 'Graphs',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Weekend Diagnostic Assessment 🏆',
              focus: 'Timed 30-min exam on Dijkstra and Topological Sort',
              topic: 'Graphs',
              isWeekend: true,
              isExamDay: true
            }
          ]
        },
        {
          weekNumber: 12,
          title: 'Tries, Greedy & Final Interview Readiness Sprint',
          topic: 'Tries',
          description: 'Prefix trees, Bitwise XOR Tries, Greedy interval scheduling, and full mock preparation.',
          days: [
            {
              dayNumber: 1,
              title: 'Day 1: Trie (Prefix Tree) Implementations',
              focus: 'Implement Trie I (insert, search, startsWith), Implement Trie II (countWordsEqualTo, countWordsStartingWith)',
              problemKeywords: ['Implement Trie', 'Implement Trie 2', 'Complete String', 'Number of Distinct Substrings in a String'],
              topic: 'Tries',
              isWeekend: false
            },
            {
              dayNumber: 2,
              title: 'Day 2: Bitwise XOR Tries',
              focus: 'Maximum XOR of Two Numbers in an Array, Maximum XOR With an Element From Array',
              problemKeywords: ['Maximum XOR of Two Numbers in an Array', 'Maximum XOR With an Element From Array'],
              topic: 'Tries',
              isWeekend: false
            },
            {
              dayNumber: 3,
              title: 'Day 3: Greedy Classical Scheduling',
              focus: 'N meetings in one room, Non-overlapping intervals, Minimum platforms, Jump Game I & II',
              problemKeywords: ['N meetings in one room', 'Minimum number of platforms', 'Non-overlapping Intervals', 'Jump Game', 'Jump Game II'],
              topic: 'Greedy & Intervals',
              isWeekend: false
            },
            {
              dayNumber: 4,
              title: 'Day 4: High-Yield FAANG SDE Essentials',
              focus: 'Top cross-topic interview questions combining Heaps, Trees, and DP',
              problemKeywords: ['Kth Largest Element', 'Top K Frequent Elements', 'Merge k Sorted Lists', 'Median of Two Sorted Arrays'],
              topic: 'Arrays & Hashing',
              isWeekend: false
            },
            {
              dayNumber: 5,
              title: 'Day 5: Final Graduation Readiness Review',
              focus: 'Review edge cases, recursion base conditions, and amortized complexity bounds',
              problemKeywords: ['Two Sum', 'LRU Cache', 'Trapping Rain Water', 'Edit Distance'],
              topic: 'Dynamic Programming',
              isWeekend: false
            },
            {
              dayNumber: 6,
              title: 'Day 6: Grand Mastery Flashcard Speed Run 🔄',
              focus: 'Flashcard speed drill testing all 15 algorithmic patterns',
              topic: 'All Curated Topics',
              isWeekend: true,
              isReviewDay: true
            },
            {
              dayNumber: 7,
              title: 'Day 7: Final Comprehensive Mock Assessment 🏆',
              focus: 'Final 60-min multi-topic SDE interview simulation exam',
              topic: 'All Curated Topics',
              isWeekend: true,
              isExamDay: true
            }
          ]
        }
      ];
    },

    /**
     * Generate 8-Week FAANG & SDE Track Schedule (NeetCode 150 & Striver SDE)
     */
    generateFAANG60Schedule(allProblems) {
      const fullSchedule = this.generateStriverHeroSchedule(allProblems);
      return fullSchedule.slice(1, 9).map((w, idx) => ({
        ...w,
        weekNumber: idx + 1
      }));
    },

    /**
     * Generate 4-Week Blind 75 Crash Course Schedule
     */
    generateBlind30Schedule(allProblems) {
      const fullSchedule = this.generateStriverHeroSchedule(allProblems);
      const selectedWeeks = [1, 2, 7, 8];
      return selectedWeeks.map((wIdx, newIdx) => {
        const orig = fullSchedule[wIdx];
        return {
          ...orig,
          weekNumber: newIdx + 1
        };
      });
    },

    // =========================================================================
    // Simplified 12-Week DSA Roadmap & Daily Problem Selection
    // =========================================================================

    DEFAULT_12_WEEK_ROADMAP: [
      {
        week: 1,
        title: 'Week 1',
        mainTopic: 'Graphs',
        subtopic: 'BFS and DFS',
        keywords: ['bfs', 'dfs', 'flood fill', 'provinces', 'rotten oranges', 'connected components', 'clone graph'],
        revisionTopic: ['Arrays & Hashing'],
        revisionTopicDisplay: 'Arrays'
      },
      {
        week: 2,
        title: 'Week 2',
        mainTopic: 'Graphs',
        subtopic: 'Cycles and Connected Components',
        keywords: ['cycle', 'bipartite', 'surrounded', 'enclaves', 'islands', 'components', 'detect cycle'],
        revisionTopic: ['Arrays & Hashing', 'Sliding Window & Two Pointers'],
        revisionTopicDisplay: 'Arrays and Two Pointers'
      },
      {
        week: 3,
        title: 'Week 3',
        mainTopic: 'Graphs',
        subtopic: 'Topological Sort and Shortest Paths',
        keywords: ['topological', 'kahn', 'course schedule', 'shortest path', 'dijkstra', 'alien dictionary', 'bellman', 'floyd'],
        revisionTopic: ['Stack & Queue'],
        revisionTopicDisplay: 'Stack and Queue'
      },
      {
        week: 4,
        title: 'Week 4',
        mainTopic: 'Binary Search',
        subtopic: 'Binary Search Fundamentals',
        keywords: ['lower bound', 'upper bound', 'search insert', 'first and last', 'peak', 'rotated', 'minimum in rotated', 'binary search'],
        revisionTopic: ['Linked List'],
        revisionTopicDisplay: 'Linked Lists'
      },
      {
        week: 5,
        title: 'Week 5',
        mainTopic: 'Binary Search',
        subtopic: 'Binary Search on Answers',
        keywords: ['square root', 'koko', 'ship', 'bouquets', 'divisor', 'capacity', 'allocation', 'cows', 'painter', 'split array', 'answers'],
        revisionTopic: ['Stack & Queue'],
        revisionTopicDisplay: 'Stack and Queue'
      },
      {
        week: 6,
        title: 'Week 6',
        mainTopic: 'Greedy & Intervals',
        subtopic: 'Greedy Algorithms',
        keywords: ['assign cookies', 'lemonade', 'fractional knapsack', 'coin', 'jump game', 'valid parenthesis', 'greedy'],
        revisionTopic: ['Arrays & Hashing', 'Binary Search'],
        revisionTopicDisplay: 'Arrays and Binary Search'
      },
      {
        week: 7,
        title: 'Week 7',
        mainTopic: 'Greedy & Intervals',
        subtopic: 'Greedy Patterns and Applications',
        keywords: ['meetings', 'intervals', 'platforms', 'job sequencing', 'insert interval', 'merge intervals', 'non-overlapping', 'candy'],
        revisionTopic: ['Linked List', 'Heap / Priority Queue'],
        revisionTopicDisplay: 'Linked Lists and Heaps'
      },
      {
        week: 8,
        title: 'Week 8',
        mainTopic: 'Dynamic Programming',
        subtopic: '1D DP',
        keywords: ['climbing stairs', 'frog jump', 'house robber', 'ninja', '1d', 'maximum sum', 'fibonacci'],
        revisionTopic: ['Graphs'],
        revisionTopicDisplay: 'Graphs'
      },
      {
        week: 9,
        title: 'Week 9',
        mainTopic: 'Dynamic Programming',
        subtopic: '2D DP',
        keywords: ['grid', 'unique paths', 'minimum path', 'triangle', 'falling path', 'cherry pickup', '2d', 'matrix'],
        revisionTopic: ['Binary Search'],
        revisionTopicDisplay: 'Binary Search'
      },
      {
        week: 10,
        title: 'Week 10',
        mainTopic: 'Dynamic Programming',
        subtopic: 'Subsequences and Knapsack',
        keywords: ['subset sum', 'partition', 'knapsack', 'target sum', 'coin change', 'subsequence', 'longest common', 'unbounded', 'rod cutting', 'distinct subsequences', 'edit distance'],
        revisionTopic: ['Greedy & Intervals'],
        revisionTopicDisplay: 'Greedy'
      },
      {
        week: 11,
        title: 'Week 11',
        mainTopic: 'Binary Trees & BST',
        subtopic: 'Trees and Tree Patterns',
        keywords: ['traversal', 'depth', 'diameter', 'balanced', 'symmetric', 'same tree', 'zigzag', 'lca', 'bst', 'validate', 'tree', 'boundary', 'vertical', 'kth smallest'],
        revisionTopic: ['Dynamic Programming'],
        revisionTopicDisplay: 'Dynamic Programming'
      },
      {
        week: 12,
        title: 'Week 12',
        mainTopic: 'Mixed',
        subtopic: 'Mixed Practice and Weak-Topic Repair',
        keywords: [],
        revisionTopic: ['Graphs', 'Binary Search', 'Dynamic Programming'],
        revisionTopicDisplay: 'Graphs, Binary Search and DP'
      }
    ],

    /**
     * Get 12-week schedule configuration for a specific week
     */
    get12WeekConfig(weekNum = 1) {
      const w = Math.min(12, Math.max(1, parseInt(weekNum, 10) || 1));
      const base = this.DEFAULT_12_WEEK_ROADMAP[w - 1] || this.DEFAULT_12_WEEK_ROADMAP[0];
      if (this.progress && this.progress.dsa12CustomSchedule && this.progress.dsa12CustomSchedule[w]) {
        return { ...base, ...this.progress.dsa12CustomSchedule[w] };
      }
      return { ...base };
    },

    /**
     * Set active week (1-12) without resetting progress
     */
    set12WeekCurrent(weekNum = 1) {
      if (!this.progress) this.initProgress();
      const w = Math.min(12, Math.max(1, parseInt(weekNum, 10) || 1));
      this.progress.dsa12WeekSelectedWeek = w;
      this.saveProgress();
      return w;
    },

    /**
     * Get active week
     */
    get12WeekCurrent() {
      if (!this.progress) this.initProgress();
      return this.progress.dsa12WeekSelectedWeek || 1;
    },

    /**
     * Set target daily study minutes (default 120)
     */
    set12WeekTargetMinutes(minutes = 120) {
      if (!this.progress) this.initProgress();
      const m = Math.max(30, parseInt(minutes, 10) || 120);
      this.progress.dsa12DailyMinutes = m;
      this.saveProgress();
      return m;
    },

    /**
     * Get target daily study minutes
     */
    get12WeekTargetMinutes() {
      if (!this.progress) this.initProgress();
      return this.progress.dsa12DailyMinutes || 120;
    },

    /**
     * Update schedule for a specific week (custom topic adjustments)
     */
    update12WeekSchedule(weekNum, overrides = {}) {
      if (!this.progress) this.initProgress();
      const w = Math.min(12, Math.max(1, parseInt(weekNum, 10) || 1));
      if (!this.progress.dsa12CustomSchedule) this.progress.dsa12CustomSchedule = {};
      this.progress.dsa12CustomSchedule[w] = { ...overrides };
      this.saveProgress();
      return this.get12WeekConfig(w);
    },

    /**
     * Reset 12-week schedule adjustments back to defaults
     */
    reset12WeekSchedule() {
      if (!this.progress) this.initProgress();
      this.progress.dsa12CustomSchedule = {};
      this.saveProgress();
    },

    /**
    /**
     * Calculate study time allocation across three independent streams + active recall:
     * 1. Spaced Revision (due SRS recall)
     * 2. Today's Learning (new questions)
     * 3. Topic Revision (topic practice)
     * 4. Active Recall Buffer (~10m)
     */
    calculateTimeAllocation(totalMinutes = 120, dueProblemsCount = 0, isLegacyTwoStream = false, options = {}) {
      const rawTotal = (totalMinutes === 0 || totalMinutes === '0') ? 0 : (parseInt(totalMinutes, 10) || 120);
      const total = Math.max(0, rawTotal);

      if (total <= 0) {
        return {
          totalMinutes: 0,
          recallBufferMinutes: 0,
          learnTargetMinutes: 0,
          topicRevisionTargetMinutes: 0,
          spacedRevisionTargetMinutes: 0,
          revisionTargetMinutes: 0,
          revisionMinutes: 0,
          learnMinutes: 0,
          topicRevisionMinutes: 0,
          spacedRevisionMinutes: 0,
          allocationPolicy: 'A'
        };
      }

      // Active Recall buffer (~10m) is included only when budget permits (e.g. >= 45m)
      const recallBuffer = (total >= 60) ? 10 : (total >= 45 ? 5 : 0);
      const studyBudget = Math.max(0, total - recallBuffer);

      if (isLegacyTwoStream) {
        const rev = (studyBudget >= 30) ? 30 : Math.min(studyBudget, 15);
        const lrn = Math.max(0, studyBudget - rev);
        const spacedTarget = dueProblemsCount > 0 ? rev : 0;
        const topicTarget = dueProblemsCount > 0 ? 0 : rev;
        return {
          totalMinutes: total,
          recallBufferMinutes: recallBuffer,
          learnTargetMinutes: lrn,
          topicRevisionTargetMinutes: topicTarget,
          spacedRevisionTargetMinutes: spacedTarget,
          revisionTargetMinutes: rev,
          revisionMinutes: rev,
          learnMinutes: lrn,
          topicRevisionMinutes: topicTarget,
          spacedRevisionMinutes: spacedTarget,
          allocationPolicy: 'A'
        };
      }

      const policy = (typeof options === 'string') ? options : (options?.policy || options?.allocationPolicy || 'A');
      const overdueCount = (typeof options === 'object' && typeof options.overdueCount === 'number') ? options.overdueCount : 0;

      let spacedRevisionTarget = 0;
      if (dueProblemsCount > 0 && studyBudget > 0) {
        if (policy === 'B') {
          // Policy B: Due-workload-responsive (up to 45% based on demand)
          spacedRevisionTarget = Math.min(dueProblemsCount * 15, Math.round(studyBudget * 0.45));
          spacedRevisionTarget = Math.min(studyBudget, Math.max(Math.min(studyBudget, 15), spacedRevisionTarget));
        } else if (policy === 'C') {
          // Policy C: Overdue-backlog-sensitive (flexes up to 50% if overdue cards exist, otherwise 35%)
          const maxRatio = (overdueCount > 0 || dueProblemsCount >= 5) ? 0.50 : 0.35;
          spacedRevisionTarget = Math.min(dueProblemsCount * 15, Math.round(studyBudget * maxRatio));
          spacedRevisionTarget = Math.min(studyBudget, Math.max(Math.min(studyBudget, 15), spacedRevisionTarget));
        } else {
          // Policy A (Default Balanced Baseline): Reserve up to 35% of study budget for due spaced recall
          spacedRevisionTarget = Math.min(dueProblemsCount * 15, Math.round(studyBudget * 0.35));
          spacedRevisionTarget = Math.min(studyBudget, Math.max(Math.min(studyBudget, 15), spacedRevisionTarget));
        }
      }

      const remainingBudget = Math.max(0, studyBudget - spacedRevisionTarget);
      const learnTarget = Math.round(remainingBudget * 0.60);
      const topicRevisionTarget = Math.max(0, remainingBudget - learnTarget);

      return {
        totalMinutes: total,
        recallBufferMinutes: recallBuffer,
        learnTargetMinutes: learnTarget,
        topicRevisionTargetMinutes: topicRevisionTarget,
        spacedRevisionTargetMinutes: spacedRevisionTarget,
        // Backward-compatible alias
        revisionTargetMinutes: topicRevisionTarget + spacedRevisionTarget,
        revisionMinutes: topicRevisionTarget + spacedRevisionTarget,
        learnMinutes: learnTarget,
        topicRevisionMinutes: topicRevisionTarget,
        spacedRevisionMinutes: spacedRevisionTarget,
        allocationPolicy: policy
      };
    },

    CANONICAL_TOPICS: [
      'Basics & Math',
      'Arrays & Hashing',
      'Sliding Window & Two Pointers',
      'Sorting',
      'Binary Search',
      'Strings',
      'Linked List',
      'Recursion & Backtracking',
      'Binary Trees & BST',
      'Stack & Queue',
      'Heap / Priority Queue',
      'Greedy & Intervals',
      'Dynamic Programming',
      'Graphs',
      'Tries',
      'Bit Manipulation'
    ],

    /**
     * Get weekly study days (default 5, clamped 1-7)
     */
    getWeeklyStudyDays() {
      if (!this.progress) this.initProgress();
      return (this.progress && this.progress.weeklyStudyDays) || 5;
    },

    /**
     * Set weekly study days (1-7)
     */
    setWeeklyStudyDays(days) {
      if (!this.progress) this.initProgress();
      const d = Math.max(1, Math.min(7, parseInt(days, 10) || 5));
      this.progress.weeklyStudyDays = d;
      this.saveProgress();
      return d;
    },

    /**
     * Validate whether a string is a valid canonical topic or valid revision mode
     */
    validateTopic(topic, isRevision = false) {
      if (!topic || typeof topic !== 'string') return null;
      const trimmed = topic.trim();
      if (isRevision) {
        const lower = trimmed.toLowerCase();
        if (lower === 'all_due' || lower === 'all' || lower === 'all due topics' || lower === 'alldue') {
          return 'all_due';
        }
      }
      const SRSEngineRef = (typeof window !== 'undefined' && window.SRSEngine) ||
                           (typeof global !== 'undefined' && global.SRSEngine) ||
                           (typeof require !== 'undefined' ? (function () { try { return require('./srs-engine'); } catch (_) { return null; } })() : null);
      const canon = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(trimmed) : trimmed;
      if (this.CANONICAL_TOPICS.includes(canon)) {
        return canon;
      }
      return null;
    },

    /**
     * Invalidate cached daily plans upon state changes, topic updates, or imports
     */
    invalidatePlanCache(reason = null) {
      if (!this.progress) this.initProgress();
      this.progress.dsa12DailyPlans = {};
      this.saveProgress();
    },

    clearPlanCache(reason = null) {
      this.invalidatePlanCache(reason);
    },

    /**
     * Skip a plan task for today's active session without false completion
     */
    skipPlanTask(problemId) {
      if (!this.progress) this.initProgress();
      if (!this.progress.skippedTasks) this.progress.skippedTasks = {};
      this.progress.skippedTasks[problemId] = true;
      this.saveProgress();
      return true;
    },

    /**
     * Unskip/resume a previously skipped plan task
     */
    unskipPlanTask(problemId) {
      if (!this.progress) this.initProgress();
      if (this.progress.skippedTasks && this.progress.skippedTasks[problemId]) {
        delete this.progress.skippedTasks[problemId];
        this.saveProgress();
      }
      return true;
    },

    /**
     * Check if a task was skipped in today's active session
     */
    isTaskSkippedToday(problemId) {
      if (!this.progress || !this.progress.skippedTasks) return false;
      return Boolean(this.progress.skippedTasks[problemId]);
    },

    /**
     * Get the next eligible question for a given stream without artificial 24h delay
     */
    getNextEligibleQuestion(streamName = 'learn', allProblems = [], userStates = {}, options = {}) {
      if (!Array.isArray(allProblems) || allProblems.length === 0) return null;
      userStates = userStates || {};
      options = options || {};
      const now = (options.asOfDate instanceof Date && !isNaN(options.asOfDate.getTime())) ? options.asOfDate : new Date();
      const excludeIds = new Set(options.excludeIds || []);

      const isReviewedToday = (state) => {
        if (!state || typeof state !== 'object' || !state.lastReviewed) return false;
        const d = new Date(state.lastReviewed);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
      };

      const SRSEngineRef = (typeof window !== 'undefined' && window.SRSEngine) ||
                           (typeof global !== 'undefined' && global.SRSEngine) ||
                           (typeof require !== 'undefined' ? (function () { try { return require('./srs-engine'); } catch (_) { return null; } })() : null);

      if (streamName === 'learn') {
        const learningTopic = options.learningTopic || this.getCurrentLearningTopic(allProblems, userStates);
        const topicNorm = learningTopic ? learningTopic.toLowerCase() : '';
        const topicProblems = allProblems.filter(p => {
          if (!p || !p.id) return false;
          if (learningTopic === 'Mixed') return true;
          const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
          return canonP.toLowerCase() === topicNorm || (p.topic || '').toLowerCase().includes(topicNorm);
        });

        // Exclude completed learning items and same-session completed items
        const unattemptedPool = topicProblems.filter(p => {
          if (excludeIds.has(p.id)) return false;
          const st = userStates[p.id];
          if (st && (st.isMastered || (st.stage >= 2 && !st.hintsUsed && st.lastRating !== 'failed'))) {
            return false;
          }
          if (isReviewedToday(st)) return false; // Prevent same-session repetition
          return !st || !st.lastReviewed || st.lastRating === 'failed' || st.hintsUsed;
        });

        if (unattemptedPool.length === 0) return null;

        // Difficulty progression guided by learner evidence
        let solvedInTopic = 0;
        let lastAttempt = null;
        topicProblems.forEach(p => {
          const st = userStates[p.id];
          if (st && st.lastReviewed) {
            if (st.lastRating !== 'failed') solvedInTopic++;
            if (!lastAttempt || new Date(st.lastReviewed).getTime() > new Date(lastAttempt.lastReviewed).getTime()) {
              lastAttempt = st;
            }
          }
        });

        let preferredDiff = solvedInTopic >= 5 ? 3 : (solvedInTopic >= 2 ? 2 : 1);
        if (lastAttempt && lastAttempt.lastRating === 'failed' && preferredDiff > 1) {
          preferredDiff = preferredDiff - 1; // Step down difficulty after recent failure to rebuild confidence
        }

        const diffRank = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const scored = unattemptedPool.map(p => {
          const st = userStates[p.id];
          let score = 0;
          let candidateType = 'unseen';
          let reason = `Recommended new question for ${learningTopic}`;

          if (st && st.lastRating === 'failed') {
            candidateType = 'failed';
            score += 35;
            reason = `Failed previously in ${learningTopic} · Reinforcement drill`;
          } else if (st && st.hintsUsed) {
            candidateType = 'hints_used';
            score += 25;
            reason = `Solved with hints in ${learningTopic} · Needs independent solve`;
          } else {
            candidateType = 'unseen';
            score += 20;
            reason = `Unseen foundation question for ${learningTopic}`;
          }

          const pDiffRank = diffRank[p.difficulty] || 2;
          if (pDiffRank === preferredDiff) score += 15;
          else if (pDiffRank < preferredDiff) score += 5;

          return {
            problem: p,
            candidateType,
            score,
            reason,
            diffScore: pDiffRank
          };
        });

        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.diffScore !== b.diffScore) return a.diffScore - b.diffScore;
          return a.problem.id.localeCompare(b.problem.id);
        });

        const top = scored[0];
        const est = this.getProblemEstimatedMinutes(top.problem.difficulty, false);
        return {
          ...top.problem,
          estimatedMinutes: est,
          candidateType: top.candidateType,
          isRevision: false,
          isSpacedRevision: false,
          isTopicRevision: false,
          selectionReason: top.reason,
          isCompletedToday: false
        };
      } else if (streamName === 'topicRevision') {
        const revisionTopic = options.revisionTopic || this.getRevisionTopic(allProblems, userStates);
        const canonRev = (revisionTopic && revisionTopic !== 'all_due' && SRSEngineRef)
          ? SRSEngineRef.canonicalizeTopic(revisionTopic)
          : revisionTopic;
        const revTopicNorm = (canonRev || '').toLowerCase();
        const isAllDueMode = revisionTopic === 'all_due';

        const candidates = allProblems.filter(p => {
          if (!p || !p.id) return false;
          if (excludeIds.has(p.id)) return false;
          const st = userStates[p.id];
          if (isReviewedToday(st)) return false; // Avoid same-session repeat
          if (isAllDueMode) return true;
          const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
          const pNorm = (canonP || '').toLowerCase();
          return pNorm === revTopicNorm || pNorm.includes(revTopicNorm) || revTopicNorm.includes(pNorm);
        });

        if (candidates.length === 0) return null;

        const diffRank = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const scored = candidates.map(p => {
          const st = userStates[p.id];
          let priorityScore = 10;
          let candidateType = 'pattern_maintenance';
          let reason = `Practice in ${revisionTopic}`;

          if (st && st.lastRating === 'failed') {
            priorityScore += 40;
            candidateType = 'weak_pattern_failed';
            reason = 'Failed previously (needs repair drill)';
          } else if (st && st.hintsUsed) {
            priorityScore += 30;
            candidateType = 'weak_pattern_hints';
            reason = 'Solved with hints (needs independent practice)';
          } else if (st && typeof st.confidence === 'number' && st.confidence <= 2) {
            priorityScore += 25;
            candidateType = 'low_confidence';
            reason = 'Low confidence on this pattern';
          } else if (st && st.stage && st.stage < 3) {
            priorityScore += 20;
            candidateType = 'developing_skill';
            reason = 'Reinforce developing skill';
          } else if (!st || !st.lastReviewed) {
            priorityScore += 15;
            candidateType = 'targeted_practice';
            reason = `Targeted practice in ${revisionTopic}`;
          }

          return {
            problem: p,
            candidateType,
            priorityScore,
            reason,
            diffScore: diffRank[p.difficulty] || 2
          };
        });

        scored.sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
          if (a.diffScore !== b.diffScore) return a.diffScore - b.diffScore;
          return a.problem.id.localeCompare(b.problem.id);
        });

        const top = scored[0];
        const est = this.getProblemEstimatedMinutes(top.problem.difficulty, true);
        return {
          ...top.problem,
          estimatedMinutes: est,
          candidateType: top.candidateType,
          isRevision: true,
          isTopicRevision: true,
          isSpacedRevision: false,
          selectionReason: top.reason,
          isCompletedToday: false
        };
      } else if (streamName === 'spacedRevision') {
        const due = [];
        allProblems.forEach(p => {
          if (!p || !p.id || excludeIds.has(p.id)) return;
          const st = userStates[p.id];
          if (!st || !st.lastReviewed || st.isMastered) return;
          if (isReviewedToday(st)) return;

          const nr = st.nextReviewDate || st.nextReview;
          if (!nr) return;
          const targetDate = new Date(nr);
          if (isNaN(targetDate.getTime()) || targetDate.getTime() > now.getTime()) return; // EXCLUDE FUTURE DUE!

          const isOverdue = targetDate.getTime() < now.getTime();
          const overdueDays = isOverdue
            ? Math.max(1, Math.round((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

          let score = overdueDays > 0 ? (50 + Math.min(30, overdueDays * 5)) : 40;
          let reason = overdueDays > 0 ? `Overdue by ${overdueDays}d (SRS recall)` : 'Due for scheduled spaced recall';
          if (st.lastRating === 'failed') score += 35;
          if (st.hintsUsed) score += 25;

          due.push({
            problem: p,
            score,
            reason,
            isOverdue,
            overdueDays
          });
        });

        if (due.length === 0) return null;

        due.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.problem.id.localeCompare(b.problem.id);
        });

        const top = due[0];
        const est = this.getProblemEstimatedMinutes(top.problem.difficulty, true);
        return {
          ...top.problem,
          estimatedMinutes: est,
          isRevision: true,
          isSpacedRevision: true,
          isTopicRevision: false,
          selectionReason: top.reason,
          isOverdue: top.isOverdue,
          overdueDays: top.overdueDays,
          isCompletedToday: false
        };
      }
      return null;
    },

    /**
     * Replenish the daily plan for an active stream with the next eligible question
     */
    replenishDailyPlan(streamName = 'learn', totalMinutes = 120, allProblems = [], userStates = {}, options = {}) {
      if (!this.progress) this.initProgress();
      const now = (options.asOfDate instanceof Date && !isNaN(options.asOfDate.getTime())) ? options.asOfDate : new Date();
      const todayKey = this.toLocalDateKey(now);
      const targetMins = Math.max(0, totalMinutes || (this.progress.dsa12DailyMinutes || 120));
      const weeklyStudyDays = this.getWeeklyStudyDays();
      const learningTopic = options.learningTopic || this.getCurrentLearningTopic(allProblems, userStates);
      const revisionTopic = options.revisionTopic || this.getRevisionTopic(allProblems, userStates);

      const planKey = `${todayKey}_m${targetMins}_d${weeklyStudyDays}_l${learningTopic}_r${revisionTopic}_cnt${allProblems.length}`;
      let cached = this.progress.dsa12DailyPlans && this.progress.dsa12DailyPlans[planKey];

      // If no cached plan yet, initialize it by calling getDailyDSAPlan
      if (!cached) {
        this.getDailyDSAPlan(null, targetMins, allProblems, userStates, options);
        cached = this.progress.dsa12DailyPlans && this.progress.dsa12DailyPlans[planKey];
      }
      if (!cached) return { replenished: false, error: 'Could not initialize daily plan' };

      const allActiveIds = new Set([
        ...(cached.learnIds || []),
        ...(cached.topicReviseIds || []),
        ...(cached.spacedReviseIds || [])
      ]);

      const nextQ = this.getNextEligibleQuestion(streamName, allProblems, userStates, {
        learningTopic,
        revisionTopic,
        excludeIds: Array.from(allActiveIds),
        asOfDate: now
      });

      if (!nextQ) {
        return {
          replenished: false,
          reason: streamName === 'spacedRevision' ? 'no_more_due_reviews' : 'pool_exhausted',
          message: streamName === 'spacedRevision' ? 'All due reviews completed' : 'No further eligible questions found in catalog for this topic'
        };
      }

      // Append to the respective stream array in the cache
      if (streamName === 'learn') {
        if (!cached.learnIds) cached.learnIds = [];
        if (!cached.learnReasons) cached.learnReasons = {};
        cached.learnIds.push(nextQ.id);
        cached.learnReasons[nextQ.id] = nextQ.selectionReason;
      } else if (streamName === 'topicRevision') {
        if (!cached.topicReviseIds) cached.topicReviseIds = [];
        if (!cached.topicReasons) cached.topicReasons = {};
        cached.topicReviseIds.push(nextQ.id);
        cached.topicReasons[nextQ.id] = nextQ.selectionReason;
        cached.reviseIds = [...(cached.topicReviseIds || []), ...(cached.spacedReviseIds || [])];
      } else if (streamName === 'spacedRevision') {
        if (!cached.spacedReviseIds) cached.spacedReviseIds = [];
        if (!cached.reasons) cached.reasons = {};
        cached.spacedReviseIds.push(nextQ.id);
        cached.reasons[nextQ.id] = nextQ.selectionReason;
        cached.reviseIds = [...(cached.topicReviseIds || []), ...(cached.spacedReviseIds || [])];
      }

      this.saveProgress();

      // Return refreshed plan
      const updatedPlan = this.getDailyDSAPlan(null, targetMins, allProblems, userStates, options);
      return {
        replenished: true,
        problem: nextQ,
        plan: updatedPlan
      };
    },

    /**
     * Get read-only preview for refreshing today's questions in a specific stream
     */
    getRefreshPreview(streamName = 'learn', totalMinutes = 120, allProblems = [], userStates = {}, options = {}) {
      if (!this.progress) this.initProgress();
      userStates = userStates || {};
      options = options || {};
      const now = (options.asOfDate instanceof Date && !isNaN(options.asOfDate.getTime())) ? options.asOfDate : new Date();
      const todayKey = this.toLocalDateKey(now);
      const targetMins = Math.max(0, totalMinutes || (this.progress.dsa12DailyMinutes || 120));
      const weeklyStudyDays = this.getWeeklyStudyDays();
      const learningTopic = options.learningTopic || this.getCurrentLearningTopic(allProblems, userStates);
      const revisionTopic = options.revisionTopic || this.getRevisionTopic(allProblems, userStates);

      const planKey = `${todayKey}_m${targetMins}_d${weeklyStudyDays}_l${learningTopic}_r${revisionTopic}_cnt${allProblems.length}`;
      let cached = this.progress.dsa12DailyPlans && this.progress.dsa12DailyPlans[planKey];

      // If not yet cached, generate plan to initialize cache
      if (!cached) {
        this.getDailyDSAPlan(null, targetMins, allProblems, userStates, options);
        cached = this.progress.dsa12DailyPlans && this.progress.dsa12DailyPlans[planKey];
      }
      if (!cached) {
        return {
          success: false,
          error: 'Daily plan is not initialized',
          streamName,
          targetTopic: streamName === 'learn' ? learningTopic : (streamName === 'topicRevision' ? revisionTopic : 'All Eligible Topics')
        };
      }

      // Canonical stream name normalization
      const normStream = (streamName === 'topicRevise' || streamName === 'topicRevision') ? 'topicRevision'
                       : (streamName === 'spacedRevise' || streamName === 'spacedRevision') ? 'spacedRevision'
                       : 'learn';

      let streamIds = [];
      let streamTopic = '';
      if (normStream === 'learn') {
        streamIds = (cached.learnIds || []).slice();
        streamTopic = learningTopic;
      } else if (normStream === 'topicRevision') {
        streamIds = (cached.topicReviseIds || []).slice();
        streamTopic = revisionTopic;
      } else if (normStream === 'spacedRevision') {
        streamIds = (cached.spacedReviseIds || []).slice();
        streamTopic = 'All Eligible Topics';
      }

      const isReviewedToday = (state) => {
        if (!state || typeof state !== 'object' || !state.lastReviewed) return false;
        const d = new Date(state.lastReviewed);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
      };

      const SRSEngineRef = (typeof window !== 'undefined' && window.SRSEngine) ||
                           (typeof global !== 'undefined' && global.SRSEngine) ||
                           (typeof require !== 'undefined' ? (function () { try { return require('./srs-engine'); } catch (_) { return null; } })() : null);

      // Identify marked vs unmarked in target stream
      const markedIds = [];
      const preservedIds = [];
      streamIds.forEach(id => {
        const isDone = isReviewedToday(userStates[id]);
        const isSkipped = this.isTaskSkippedToday(id);
        if (isDone || isSkipped) {
          markedIds.push(id);
        } else {
          preservedIds.push(id);
        }
      });

      // Active IDs in OTHER streams (to avoid duplicate selection)
      const otherStreamActiveIds = new Set([
        ...(normStream !== 'learn' ? (cached.learnIds || []) : []),
        ...(normStream !== 'topicRevision' ? (cached.topicReviseIds || []) : []),
        ...(normStream !== 'spacedRevision' ? (cached.spacedReviseIds || []) : [])
      ]);
      // Also exclude preserved items in the same stream
      preservedIds.forEach(id => otherStreamActiveIds.add(id));
      // Also exclude marked items in current session to prevent immediate re-selection
      markedIds.forEach(id => otherStreamActiveIds.add(id));

      // Find available eligible candidates
      const candidateList = [];
      if (normStream === 'learn') {
        const topicNorm = (learningTopic || '').toLowerCase();
        const topicProblems = allProblems.filter(p => {
          if (!p || !p.id || otherStreamActiveIds.has(p.id)) return false;
          if (learningTopic !== 'Mixed') {
            const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
            if (canonP.toLowerCase() !== topicNorm && !(p.topic || '').toLowerCase().includes(topicNorm)) {
              return false;
            }
          }
          const st = userStates[p.id];
          if (st && (st.isMastered || (st.stage >= 2 && !st.hintsUsed && st.lastRating !== 'failed'))) return false;
          if (isReviewedToday(st)) return false;
          return true;
        });

        // Difficulty progression guided by learner evidence
        let solvedInTopic = 0;
        let lastAttempt = null;
        allProblems.forEach(p => {
          if (!p || !p.id) return;
          const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
          if (canonP.toLowerCase() === topicNorm || (p.topic || '').toLowerCase().includes(topicNorm)) {
            const st = userStates[p.id];
            if (st && st.lastReviewed) {
              if (st.lastRating !== 'failed') solvedInTopic++;
              if (!lastAttempt || new Date(st.lastReviewed).getTime() > new Date(lastAttempt.lastReviewed).getTime()) {
                lastAttempt = st;
              }
            }
          }
        });
        let preferredDiff = solvedInTopic >= 5 ? 3 : (solvedInTopic >= 2 ? 2 : 1);
        if (lastAttempt && lastAttempt.lastRating === 'failed' && preferredDiff > 1) {
          preferredDiff = preferredDiff - 1;
        }

        const diffRank = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const scored = topicProblems.map(p => {
          const st = userStates[p.id];
          let score = 0;
          let reason = `Refreshed recommendation for ${learningTopic}`;
          if (st && st.lastRating === 'failed') {
            score += 35;
            reason = `Failed previously in ${learningTopic} · Reinforcement drill`;
          } else if (st && st.hintsUsed) {
            score += 25;
            reason = `Solved with hints in ${learningTopic} · Needs independent solve`;
          } else {
            score += 20;
            reason = `Unseen foundation question for ${learningTopic}`;
          }
          const pDiff = diffRank[p.difficulty] || 2;
          const diffDist = Math.abs(pDiff - preferredDiff);
          return { problem: p, score, diffDist, reason };
        });

        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.diffDist !== b.diffDist) return a.diffDist - b.diffDist;
          return a.problem.id.localeCompare(b.problem.id);
        });

        candidateList.push(...scored.map(s => s.problem));
      } else if (normStream === 'topicRevision') {
        const canonRev = (revisionTopic && revisionTopic !== 'all_due' && SRSEngineRef)
          ? SRSEngineRef.canonicalizeTopic(revisionTopic)
          : revisionTopic;
        const revTopicNorm = (canonRev || '').toLowerCase();
        const isAllDueMode = revisionTopic === 'all_due';

        const candidates = allProblems.filter(p => {
          if (!p || !p.id || otherStreamActiveIds.has(p.id)) return false;
          const st = userStates[p.id];
          if (st && st.isMastered) return false;
          if (isReviewedToday(st)) return false;
          if (isAllDueMode) return true;
          const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
          const pNorm = (canonP || '').toLowerCase();
          return pNorm === revTopicNorm || pNorm.includes(revTopicNorm) || revTopicNorm.includes(pNorm);
        });

        const scored = candidates.map(p => {
          const st = userStates[p.id];
          let priorityScore = 10;
          let reason = `Practice in ${revisionTopic}`;
          if (st && st.lastRating === 'failed') {
            priorityScore += 40;
            reason = 'Failed previously (needs repair drill)';
          } else if (st && st.hintsUsed) {
            priorityScore += 30;
            reason = 'Solved with hints (needs independent practice)';
          } else if (st && typeof st.confidence === 'number' && st.confidence <= 2) {
            priorityScore += 25;
            reason = 'Low confidence on this pattern';
          } else if (st && st.stage && st.stage < 3) {
            priorityScore += 20;
            reason = 'Reinforce developing skill';
          }
          return { problem: p, priorityScore, reason };
        });

        scored.sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
          return a.problem.id.localeCompare(b.problem.id);
        });

        candidateList.push(...scored.map(s => s.problem));
      } else if (normStream === 'spacedRevision') {
        // Authoritative SRS DUE queue scan
        const dueList = [];
        allProblems.forEach(p => {
          if (!p || !p.id || otherStreamActiveIds.has(p.id)) return;
          const st = userStates[p.id];
          if (!st || typeof st !== 'object' || !st.lastReviewed || st.isMastered) return;
          if (isReviewedToday(st)) return;

          const nr = st.nextReviewDate || st.nextReview;
          if (!nr) return;
          const nextDate = new Date(nr);
          if (isNaN(nextDate.getTime())) return;
          if (nextDate.getTime() > now.getTime()) return; // EXCLUDE FUTURE-DUE ITEMS

          const isOverdue = nextDate.getTime() < now.getTime();
          const overdueDays = isOverdue
            ? Math.max(1, Math.round((now.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

          let priorityScore = 0;
          let reason = 'Due for scheduled spaced recall';
          if (overdueDays > 0) {
            priorityScore += 50 + Math.min(30, overdueDays * 5);
            reason = `Overdue by ${overdueDays}d (SRS recall)`;
          } else {
            priorityScore += 40;
          }
          if (st.lastRating === 'failed') {
            priorityScore += 35;
            reason = 'Failed in last attempt (reinforcement)';
          }
          if (st.hintsUsed) {
            priorityScore += 25;
          }
          const confVal = typeof st.confidence === 'number' ? st.confidence : 3;
          if (confVal <= 2) {
            priorityScore += 20;
          }

          dueList.push({ problem: p, priorityScore, reason });
        });

        dueList.sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
          return a.problem.id.localeCompare(b.problem.id);
        });

        candidateList.push(...dueList.map(d => d.problem));
      }

      const availableCount = candidateList.length;
      const markedCount = markedIds.length;
      const preservedCount = preservedIds.length;
      const expectedReplacements = Math.min(markedCount, availableCount);
      const resultingCount = preservedCount + expectedReplacements;
      const shortfall = (markedCount > availableCount) ? (markedCount - availableCount) : 0;

      let warning = null;
      if (markedCount === 0) {
        warning = 'No completed or skipped questions to refresh in this stream.';
      } else if (availableCount === 0) {
        warning = normStream === 'spacedRevision'
          ? 'No further due SRS reviews available in queue today.'
          : 'No additional eligible replacement questions available in the catalog for this topic.';
      } else if (shortfall > 0) {
        warning = `Only ${availableCount} replacement question${availableCount === 1 ? '' : 's'} available (${shortfall} question shortfall).`;
      }

      return {
        success: true,
        streamName: normStream,
        targetTopic: streamTopic,
        planKey,
        currentCount: streamIds.length,
        markedCount,
        preservedCount,
        availableCount,
        expectedReplacements,
        resultingCount,
        shortfall,
        warning,
        markedIds,
        preservedIds,
        candidateIds: candidateList.map(p => p.id),
        revision: cached._rev || 1
      };
    },

    /**
     * Atomically refresh a stream by removing marked questions and replenishing with eligible unmarked questions
     */
    refreshStreamQuestions(streamName = 'learn', totalMinutes = 120, allProblems = [], userStates = {}, options = {}) {
      if (!this.progress) this.initProgress();
      userStates = userStates || {};
      options = options || {};

      // 1. Compute read-only preview
      const preview = this.getRefreshPreview(streamName, totalMinutes, allProblems, userStates, options);
      if (!preview.success) {
        return { success: false, error: preview.error || 'Failed to compute refresh preview' };
      }

      const cached = this.progress.dsa12DailyPlans && this.progress.dsa12DailyPlans[preview.planKey];
      if (!cached) {
        return { success: false, error: 'Target daily plan not found' };
      }

      // Concurrency / Stale Preview Guard
      if (options.expectedRev !== undefined && (cached._rev || 1) !== options.expectedRev) {
        return {
          success: false,
          stalePreview: true,
          error: 'Daily plan was updated in another action. Please review the updated preview.'
        };
      }

      // 2. Validate marked count
      if (preview.markedCount === 0) {
        return {
          success: false,
          noMarked: true,
          message: 'No completed or skipped questions to refresh. Pending questions are preserved.'
        };
      }

      // 3. If zero candidates exist, avoid destructive modification without replacements
      if (preview.availableCount === 0) {
        return {
          success: false,
          noCandidates: true,
          message: preview.streamName === 'spacedRevision'
            ? 'Due queue clear — no further due reviews available today.'
            : 'No additional eligible replacement questions available for this topic.'
        };
      }

      // 4. Select replacements up to markedCount
      const toTake = Math.min(preview.markedCount, preview.candidateIds.length);
      const replacementIds = preview.candidateIds.slice(0, toTake);
      const replacementProblems = replacementIds.map(id => allProblems.find(p => p && p.id === id)).filter(Boolean);

      // 5. Build new stream ID array: preserved items + replacement items
      const newStreamIds = [...preview.preservedIds, ...replacementIds];

      // 6. Generate selection reasons for new replacements
      if (preview.streamName === 'learn') {
        cached.learnIds = newStreamIds;
        if (!cached.learnReasons) cached.learnReasons = {};
        preview.markedIds.forEach(id => { delete cached.learnReasons[id]; });
        replacementProblems.forEach(p => {
          cached.learnReasons[p.id] = `Refreshed recommendation for ${preview.targetTopic}`;
        });
      } else if (preview.streamName === 'topicRevision') {
        cached.topicReviseIds = newStreamIds;
        if (!cached.topicReasons) cached.topicReasons = {};
        preview.markedIds.forEach(id => { delete cached.topicReasons[id]; });
        replacementProblems.forEach(p => {
          cached.topicReasons[p.id] = `Refreshed drill in ${preview.targetTopic}`;
        });
        cached.reviseIds = [...(cached.topicReviseIds || []), ...(cached.spacedReviseIds || [])];
      } else if (preview.streamName === 'spacedRevision') {
        cached.spacedReviseIds = newStreamIds;
        if (!cached.reasons) cached.reasons = {};
        preview.markedIds.forEach(id => { delete cached.reasons[id]; });
        replacementProblems.forEach(p => {
          cached.reasons[p.id] = 'Scheduled spaced recall (refreshed due queue)';
        });
        cached.reviseIds = [...(cached.topicReviseIds || []), ...(cached.spacedReviseIds || [])];
      }

      // 7. Clean up skippedTasks ONLY for the removed marked IDs (assignment-scoped cleanup)
      if (this.progress.skippedTasks) {
        preview.markedIds.forEach(id => {
          if (this.progress.skippedTasks[id]) {
            delete this.progress.skippedTasks[id];
          }
        });
      }

      // Increment logical revision for OCC / stale-state protection
      cached._rev = (cached._rev || 1) + 1;

      // 8. Commit to persistence
      this.saveProgress();

      // 9. Recompute updated daily plan
      const updatedPlan = this.getDailyDSAPlan(null, totalMinutes, allProblems, userStates, options);

      return {
        success: true,
        streamName: preview.streamName,
        targetTopic: preview.targetTopic,
        removedIds: preview.markedIds,
        addedIds: replacementIds,
        replacedCount: replacementIds.length,
        shortfall: preview.shortfall,
        resultingCount: newStreamIds.length,
        updatedPlan
      };
    },

    /**
     * Get learner-selected current learning topic with intelligent initial fallback
     */
    getCurrentLearningTopic(allProblems = [], userStates = {}) {
      if (!this.progress) this.initProgress();
      const raw = this.progress?.currentLearningTopic || this.progress?.selectedLearningTopic;
      const valid = this.validateTopic(raw, false);
      if (valid) return valid;

      if (Array.isArray(allProblems) && allProblems.length > 0) {
        const stats = this.getTopicCatalogStats(allProblems, userStates);
        const firstUncompleted = stats.find(s => s.remainingLearningWorkload > 0 || s.unattempted > 0);
        if (firstUncompleted) return firstUncompleted.topic;
      }
      return 'Arrays & Hashing';
    },

    getSelectedLearningTopic(allProblems = [], userStates = {}) {
      return this.getCurrentLearningTopic(allProblems, userStates);
    },

    /**
     * Explicitly set current learning topic (learner control)
     * Changing learning topic MUST NOT alter revision topic.
     */
    setCurrentLearningTopic(topic) {
      if (!this.progress) this.initProgress();
      const valid = this.validateTopic(topic, false);
      if (!valid) return null;
      this.progress.currentLearningTopic = valid;
      this.progress.selectedLearningTopic = valid;
      this.progress.userLockedTopics = true;
      this.invalidatePlanCache('learning_topic_change');
      this.saveProgress();
      return valid;
    },

    setSelectedLearningTopic(topic) {
      return this.setCurrentLearningTopic(topic);
    },

    /**
     * Get learner-selected revision topic with intelligent default ('all_due')
     */
    getRevisionTopic(allProblems = [], userStates = {}) {
      if (!this.progress) this.initProgress();
      const raw = this.progress?.revisionTopic || this.progress?.selectedRevisionTopic;
      const valid = this.validateTopic(raw, true);
      if (valid) return valid;
      return 'all_due';
    },

    getSelectedRevisionTopic(allProblems = [], userStates = {}) {
      return this.getRevisionTopic(allProblems, userStates);
    },

    /**
     * Explicitly set revision topic (learner control, independent of learning topic)
     * Changing revision topic MUST NOT alter learning topic.
     */
    setRevisionTopic(topic) {
      if (!this.progress) this.initProgress();
      const valid = this.validateTopic(topic, true);
      if (!valid) return null;
      this.progress.revisionTopic = valid;
      this.progress.selectedRevisionTopic = valid;
      this.progress.userLockedTopics = true;
      this.invalidatePlanCache('revision_topic_change');
      this.saveProgress();
      return valid;
    },

    setSelectedRevisionTopic(topic) {
      return this.setRevisionTopic(topic);
    },

    /**
     * Estimated time requirements based on problem difficulty
     * Learn (new): Easy 20m, Medium 30m, Hard 45m
     * Revision: Easy 10m, Medium 15m, Hard 20m
     */
    getProblemEstimatedMinutes(difficulty, isRevision = false) {
      if (isRevision) {
        if (difficulty === 'Easy') return 10;
        if (difficulty === 'Medium') return 15;
        return 20; // Hard
      } else {
        if (difficulty === 'Easy') return 20;
        if (difficulty === 'Medium') return 30;
        return 45; // Hard
      }
    },

    /**
     * Format a Date as YYYY-MM-DD
     */
    toLocalDateKey(d = new Date()) {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${day}`;
    },

    /**
     * Compute comprehensive catalog & retention statistics across all 16 canonical topics
     */
    /**
     * Compute comprehensive catalog & retention statistics across all 16 canonical topics
     * Derives: total, attempted, independentlySolved, retained, mastered, remainingLearningWorkload,
     * estimatedTime, prerequisiteContext, and progress.
     */
    getTopicCatalogStats(allProblems = [], userStates = {}, options = {}) {
      const now = (options.asOfDate instanceof Date) ? options.asOfDate : new Date();
      const todayStr = this.toLocalDateKey(now);
      const SRSEngineRef = (typeof window !== 'undefined' && window.SRSEngine) ||
                           (typeof global !== 'undefined' && global.SRSEngine) ||
                           (typeof require !== 'undefined' ? (function () { try { return require('./srs-engine'); } catch (_) { return null; } })() : null);
      const GraphEngineRef = (typeof window !== 'undefined' && window.GraphEngine) ||
                             (typeof global !== 'undefined' && global.GraphEngine) ||
                             (typeof require !== 'undefined' ? (function () { try { return require('./graph-engine'); } catch (_) { return null; } })() : null);

      const isDueHelper = (st) => {
        if (!st || typeof st !== 'object' || !st.lastReviewed) return false;
        if (st.isMastered) return false;
        const nr = st.nextReviewDate || st.nextReview;
        if (!nr) return false;
        const targetDate = new Date(nr);
        if (isNaN(targetDate.getTime())) return false;
        return targetDate.getTime() <= now.getTime();
      };

      const isOverdueHelper = (st) => {
        if (!st || typeof st !== 'object' || !st.lastReviewed) return false;
        if (st.isMastered) return false;
        const nr = st.nextReviewDate || st.nextReview;
        if (!nr) return false;
        const targetDate = new Date(nr);
        if (isNaN(targetDate.getTime())) return false;
        return targetDate.getTime() < now.getTime();
      };

      // Evaluate prerequisite DAG state for context
      let graphNodes = {};
      if (GraphEngineRef && typeof GraphEngineRef.evaluateGraph === 'function') {
        try {
          graphNodes = GraphEngineRef.evaluateGraph(allProblems, userStates) || {};
        } catch (_) {}
      }

      const statsMap = {};
      this.CANONICAL_TOPICS.forEach(topicName => {
        statsMap[topicName] = {
          topic: topicName,
          total: 0,
          completed: 0,
          attempted: 0,
          independentlySolved: 0,
          unattempted: 0,
          retained: 0,
          mastered: 0,
          due: 0,
          overdue: 0,
          weak: 0,
          remainingLearningWorkload: 0,
          percentComplete: 0,
          progressPercent: 0,
          estimatedLearningMinutes: 0,
          estimatedRevisionMinutes: 0,
          totalEstimatedMinutes: 0,
          totalEstimatedHours: 0,
          prerequisiteContext: {
            hasPrerequisites: false,
            prerequisites: [],
            status: 'ready',
            isReady: true,
            advisoryMessage: 'Foundational topic ready for study.'
          }
        };
      });

      let totalDueAll = 0;
      let totalOverdueAll = 0;

      allProblems.forEach(p => {
        if (!p || !p.id) return;
        const topicName = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : p.topic;
        if (!statsMap[topicName]) {
          statsMap[topicName] = {
            topic: topicName,
            total: 0, completed: 0, attempted: 0, independentlySolved: 0, unattempted: 0,
            retained: 0, mastered: 0, due: 0, overdue: 0, weak: 0,
            remainingLearningWorkload: 0, percentComplete: 0, progressPercent: 0,
            estimatedLearningMinutes: 0, estimatedRevisionMinutes: 0,
            totalEstimatedMinutes: 0, totalEstimatedHours: 0,
            prerequisiteContext: { hasPrerequisites: false, prerequisites: [], status: 'ready', isReady: true, advisoryMessage: '' }
          };
        }
        const s = statsMap[topicName];
        s.total++;

        const st = userStates[p.id];
        const hasReviewed = !!(st && st.lastReviewed);

        const estLearn = this.getProblemEstimatedMinutes(p.difficulty, false);
        const estRev = this.getProblemEstimatedMinutes(p.difficulty, true);

        if (hasReviewed) {
          s.attempted++;
          if (st.lastRating !== 'failed') {
            s.completed++;
          }

          // Independently solved without hints
          const isIndependent = Boolean(
            !st.hintsUsed &&
            st.lastRating !== 'failed' &&
            ((st.confidence || 3) >= 3 || (st.stage || 0) >= 1)
          );
          if (isIndependent) {
            s.independentlySolved++;
          }

          // Mastered (strict Leitner stage >= 4 + delayed recall or explicit flag)
          if (st.isMastered || (st.stage && st.stage >= 4 && isIndependent && !isDueHelper(st))) {
            s.mastered++;
          } else if (st.stage && st.stage >= 2 && (st.confidence || 3) >= 3 && !isDueHelper(st) && st.lastRating !== 'failed') {
            s.retained++;
          }

          if (isDueHelper(st)) {
            s.due++;
            totalDueAll++;
          }
          if (isOverdueHelper(st)) {
            s.overdue++;
            totalOverdueAll++;
          }
          if (st.lastRating === 'failed' || st.hintsUsed || (st.confidence && st.confidence <= 2)) {
            s.weak++;
          }

          // Spaced review overhead for remaining stages to mastery
          const remainingStages = Math.max(0, 4 - (st.stage || 1));
          s.estimatedRevisionMinutes += remainingStages * estRev;
        } else {
          s.unattempted++;
          s.estimatedLearningMinutes += estLearn;
          // Unattempted problem requires ~2.5 spaced repetitions
          s.estimatedRevisionMinutes += Math.round(2.5 * estRev);
        }
      });

      const list = this.CANONICAL_TOPICS.map(topicName => {
        const s = statsMap[topicName];
        s.remainingLearningWorkload = Math.max(0, s.total - s.completed);
        s.percentComplete = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        s.progressPercent = s.percentComplete;
        s.totalEstimatedMinutes = s.estimatedLearningMinutes + s.estimatedRevisionMinutes;
        s.totalEstimatedHours = Number((s.totalEstimatedMinutes / 60).toFixed(1));

        // Resolve prerequisite context from GraphEngine nodes
        const node = Object.values(graphNodes).find(n => n.topic === topicName);
        if (node && Array.isArray(node.prerequisites) && node.prerequisites.length > 0) {
          const prereqTopics = node.prerequisites.map(pId => graphNodes[pId]?.topic || pId);
          const missing = node.missingPrerequisites || [];
          const isReady = missing.length === 0;
          s.prerequisiteContext = {
            hasPrerequisites: true,
            prerequisites: prereqTopics,
            missingPrerequisites: missing,
            status: isReady ? 'ready' : (missing.length > 1 ? 'foundation_needed' : 'advisory'),
            isReady: isReady,
            advisoryMessage: isReady
              ? `Prerequisites fulfilled (${prereqTopics.join(', ')})`
              : `Recommended foundation: review ${missing.join(', ')} before advanced drills.`
          };
        }
        return s;
      });

      list.totalDue = totalDueAll;
      list.totalOverdue = totalOverdueAll;
      return list;
    },

    /**
     * Generate dynamic problem-driven roadmap timeline and workload estimation
     * Replaces fixed 12-month schedule with an estimated horizon based on remaining workload,
     * learner pace, available study minutes per day, study days per week, and Leitner retention overhead.
     */
    calculateDynamicRoadmap(allProblems = [], userStates = {}, options = {}) {
      if (!this.progress) this.initProgress();
      const rawDailyMins = options.dailyMinutes !== undefined ? options.dailyMinutes : this.get12WeekTargetMinutes();
      const rawWeeklyDays = options.weeklyStudyDays !== undefined ? options.weeklyStudyDays : this.getWeeklyStudyDays();
      const now = (options.asOfDate instanceof Date) ? options.asOfDate : new Date();

      const currentLearningTopic = (options.learningTopic) || this.getCurrentLearningTopic(allProblems, userStates);
      const currentRevisionTopic = (options.revisionTopic) || this.getRevisionTopic(allProblems, userStates);
      const topicStats = this.getTopicCatalogStats(allProblems, userStates, { asOfDate: now });

      const totalProblems = allProblems.length || 479;
      let totalCompleted = 0;
      let totalAttempted = 0;
      let totalIndependentlySolved = 0;
      let totalRetained = 0;
      let totalMastered = 0;
      let totalUnattempted = 0;
      const totalDue = topicStats.totalDue || 0;
      const totalOverdue = topicStats.totalOverdue || 0;
      let totalLearningMinutesRemaining = 0;
      let totalRevisionMinutesRemaining = 0;

      // Historical solve speed calibration
      let historyCount = 0;
      let totalLoggedMinutes = 0;
      Object.keys(userStates).forEach(id => {
        const st = userStates[id];
        if (st && Array.isArray(st.history)) {
          st.history.forEach(h => {
            if (h && typeof h.timeSpentMinutes === 'number' && h.timeSpentMinutes > 0) {
              historyCount++;
              totalLoggedMinutes += h.timeSpentMinutes;
            }
          });
        }
      });
      const userAvgMinutesPerSolve = historyCount >= 5 ? Math.round(totalLoggedMinutes / historyCount) : null;

      const topics = topicStats.map(s => {
        totalCompleted += s.completed;
        totalAttempted += s.attempted;
        totalIndependentlySolved += s.independentlySolved;
        totalRetained += s.retained;
        totalMastered += s.mastered;
        totalUnattempted += s.unattempted;
        totalLearningMinutesRemaining += s.estimatedLearningMinutes;
        totalRevisionMinutesRemaining += s.estimatedRevisionMinutes;

        const isCurrentLearning = s.topic === currentLearningTopic;
        const isCurrentRevision = (currentRevisionTopic === 'all_due') ? (s.due > 0) : (s.topic === currentRevisionTopic);

        let topicStatus = 'unstarted';
        if (s.completed >= s.total && s.total > 0) {
          topicStatus = s.mastered >= Math.round(s.total * 0.7) ? 'mastered' : 'completed';
        } else if (s.completed > 0) {
          topicStatus = 'in_progress';
        }

        return {
          topic: s.topic,
          total: s.total,
          completed: s.completed,
          attempted: s.attempted,
          independentlySolved: s.independentlySolved,
          unattempted: s.unattempted,
          retained: s.retained,
          mastered: s.mastered,
          due: s.due,
          overdue: s.overdue,
          weak: s.weak,
          remainingLearningWorkload: s.remainingLearningWorkload,
          percentComplete: s.percentComplete,
          progressPercent: s.percentComplete,
          estimatedLearningMinutes: s.estimatedLearningMinutes,
          estimatedRevisionMinutes: s.estimatedRevisionMinutes,
          totalEstimatedMinutes: s.totalEstimatedMinutes,
          totalEstimatedHours: s.totalEstimatedHours,
          prerequisiteContext: s.prerequisiteContext,
          status: topicStatus,
          isCurrentLearning,
          isCurrentRevision
        };
      });

      const totalWorkloadMinutes = totalLearningMinutesRemaining + totalRevisionMinutesRemaining;
      const totalWorkloadHours = Number((totalWorkloadMinutes / 60).toFixed(1));
      const overallPercent = totalProblems > 0 ? Math.round((totalCompleted / totalProblems) * 100) : 0;

      // Selected topic focus stats
      const selectedTopicStat = topics.find(t => t.topic === currentLearningTopic) || topics[0] || {};
      const topicWorkloadMinutes = selectedTopicStat.totalEstimatedMinutes || 0;
      const topicWorkloadHours = Number((topicWorkloadMinutes / 60).toFixed(1));

      // 1. Check for impossible or insufficient study allocations (Section 5 & 9 scenario 20)
      const numDailyMinutes = parseInt(rawDailyMins, 10);
      const numWeeklyDays = parseInt(rawWeeklyDays, 10);
      if (isNaN(numDailyMinutes) || numDailyMinutes <= 0 || isNaN(numWeeklyDays) || numWeeklyDays <= 0) {
        return {
          dailyMinutes: Math.max(0, numDailyMinutes || 0),
          weeklyStudyDays: Math.max(0, numWeeklyDays || 0),
          weeklyCapacityMinutes: 0,
          weeklyCapacityHours: 0,
          totalProblems,
          totalCompleted,
          totalAttempted,
          totalIndependentlySolved,
          totalRetained,
          totalMastered,
          totalUnattempted,
          totalDue,
          totalOverdue,
          totalWorkloadMinutes,
          totalWorkloadHours,
          totalLearningMinutesRemaining,
          totalRevisionMinutesRemaining,
          sessionsRemaining: Infinity,
          weeksRemaining: Infinity,
          weeksRange: null,
          estimatedCompletionDate: 'Indefinite (Insufficient study allocation)',
          overallPercent,
          currentLearningTopic,
          currentRevisionTopic,
          userAvgMinutesPerSolve,
          isEstimate: true,
          isImpossibleAllocation: true,
          status: 'insufficient_allocation',
          disclaimer: 'Study allocation is 0 minutes or 0 days/week. Set an active session duration to compute a timeline.',
          topics,
          topicHorizon: {
            topic: currentLearningTopic,
            workloadMinutes: topicWorkloadMinutes,
            workloadHours: topicWorkloadHours,
            sessionsRemaining: Infinity,
            weeksRemaining: Infinity,
            estimatedCompletionDate: 'Indefinite'
          }
        };
      }

      // 2. Check for zero remaining work (All-completed roadmap, Section 5 & 9 scenario 18)
      if (totalWorkloadMinutes === 0 || (totalUnattempted === 0 && totalDue === 0)) {
        return {
          dailyMinutes: numDailyMinutes,
          weeklyStudyDays: numWeeklyDays,
          weeklyCapacityMinutes: numDailyMinutes * numWeeklyDays,
          weeklyCapacityHours: Number(((numDailyMinutes * numWeeklyDays) / 60).toFixed(1)),
          totalProblems,
          totalCompleted,
          totalAttempted,
          totalIndependentlySolved,
          totalRetained,
          totalMastered,
          totalUnattempted: 0,
          totalDue: 0,
          totalOverdue: 0,
          totalWorkloadMinutes: 0,
          totalWorkloadHours: 0,
          totalLearningMinutesRemaining: 0,
          totalRevisionMinutesRemaining: 0,
          sessionsRemaining: 0,
          weeksRemaining: 0,
          weeksRange: [0, 0],
          estimatedCompletionDate: 'Roadmap Completed!',
          overallPercent: 100,
          currentLearningTopic,
          currentRevisionTopic,
          userAvgMinutesPerSolve,
          isEstimate: true,
          isAllCompleted: true,
          status: 'completed',
          disclaimer: 'All 479 curated problems have been completed and retention schedule is up to date.',
          topics,
          topicHorizon: {
            topic: currentLearningTopic,
            workloadMinutes: 0,
            workloadHours: 0,
            sessionsRemaining: 0,
            weeksRemaining: 0,
            estimatedCompletionDate: 'Topic Completed!'
          }
        };
      }

      // 3. Constrained Workload Modeling (Section 5)
      const dailyMinutes = numDailyMinutes;
      const weeklyStudyDays = Math.min(7, numWeeklyDays);
      const weeklyCapacityMinutes = dailyMinutes * weeklyStudyDays;
      const weeklyCapacityHours = Number((weeklyCapacityMinutes / 60).toFixed(1));

      const sessionsRemaining = Math.ceil(totalWorkloadMinutes / dailyMinutes);
      const weeksRemaining = Math.ceil(sessionsRemaining / weeklyStudyDays);

      const minWeeks = Math.max(1, Math.round(weeksRemaining * 0.85));
      const maxWeeks = Math.round(weeksRemaining * 1.25);

      const projDate = new Date(now);
      projDate.setDate(projDate.getDate() + (weeksRemaining * 7));
      const completionDateEst = projDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Selected topic focus horizon
      const topicSessions = topicWorkloadMinutes > 0 ? Math.ceil(topicWorkloadMinutes / (dailyMinutes * 0.73)) : 0;
      const topicWeeks = topicSessions > 0 ? Math.ceil(topicSessions / weeklyStudyDays) : 0;
      const topicProjDate = new Date(now);
      topicProjDate.setDate(topicProjDate.getDate() + (topicWeeks * 7));
      const topicCompletionEst = topicWeeks > 0 ? topicProjDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Complete';

      return {
        dailyMinutes,
        weeklyStudyDays,
        weeklyCapacityMinutes,
        weeklyCapacityHours,
        totalProblems,
        totalCompleted,
        totalAttempted,
        totalIndependentlySolved,
        totalRetained,
        totalMastered,
        totalUnattempted,
        totalDue,
        totalOverdue,
        totalWorkloadMinutes,
        totalWorkloadHours,
        totalLearningMinutesRemaining,
        totalRevisionMinutesRemaining,
        sessionsRemaining,
        weeksRemaining,
        weeksRange: [minWeeks, maxWeeks],
        estimatedCompletionDate: completionDateEst,
        overallPercent,
        currentLearningTopic,
        currentRevisionTopic,
        userAvgMinutesPerSolve,
        isEstimate: true,
        status: 'in_progress',
        disclaimer: `Dynamic projection based on ${dailyMinutes}m/day, ${weeklyStudyDays}d/week with Leitner spaced retention overhead. Adjusts automatically as your pace and retention evolve.`,
        topics,
        topicHorizon: {
          topic: currentLearningTopic,
          workloadMinutes: topicWorkloadMinutes,
          workloadHours: topicWorkloadHours,
          sessionsRemaining: topicSessions,
          weeksRemaining: topicWeeks,
          estimatedCompletionDate: topicCompletionEst
        }
      };
    },

    /**
     * Generate Today's DSA Plan with Three Independent Streams:
     * 1. Today's Learning (New questions · Selected learn topic · Adaptive difficulty)
     * 2. Topic Revision (Topic-focused practice · Selected revision topic · Adaptive difficulty · Non-due allowed)
     * 3. Spaced Revision (Due reviews · SRS scheduled · All eligible topics)
     *
     * Principles:
     * - The learner chooses WHAT topic to study (current learning topic) and WHAT topic to practice (revision topic).
     * - AlgoRecall automatically selects WHICH problems to recommend based on difficulty progression,
     *   prerequisites, adaptive learning diagnosis, and authoritative Leitner SRS scheduling.
     * - Zero duplicate problem IDs across all three sections.
     * - Completely decoupled from legacy fixed week curriculum.
     */
    getDailyDSAPlan(param1 = null, param2 = null, param3 = null, param4 = null, param5 = null) {
      if (!this.progress) this.initProgress();

      let targetMins = 120;
      let allProblems = [];
      let userStates = {};
      let options = {};

      const isLegacyWeekCall = (typeof param1 === 'number' && param1 <= 12 && Array.isArray(param3));
      if (param1 === null || isLegacyWeekCall) {
        // Called as (weekNumberOrNull, totalMinutes, allProblems, userStates, options)
        const weekNum = (typeof param1 === 'number' && param1 >= 1 && param1 <= 12) ? param1 : null;
        targetMins = (typeof param2 === 'number') ? param2 : (this.progress?.dsa12DailyMinutes || 120);
        allProblems = Array.isArray(param3) ? param3 : [];
        userStates = (param4 && typeof param4 === 'object' && !Array.isArray(param4)) ? param4 : {};
        options = (param5 && typeof param5 === 'object') ? param5 : {};
        if (weekNum) {
          const weekCfg = this.get12WeekConfig(weekNum);
          if (weekCfg && weekCfg.mainTopic && !options.learningTopic) {
            options.learningTopic = weekCfg.mainTopic;
          }
          if (weekCfg && weekCfg.revisionTopic && !options.revisionTopic) {
            options.revisionTopic = Array.isArray(weekCfg.revisionTopic) ? weekCfg.revisionTopic[0] : weekCfg.revisionTopic;
          }
        }
      } else if (typeof param1 === 'number') {
        // Modern call signature: getDailyDSAPlan(totalMinutes, allProblems, userStates, options)
        targetMins = (param1 !== undefined && param1 !== null) ? Math.max(0, param1) : (this.progress?.dsa12DailyMinutes || 120);
        allProblems = Array.isArray(param2) ? param2 : [];
        userStates = (param3 && typeof param3 === 'object' && !Array.isArray(param3)) ? param3 : {};
        options = (param4 && typeof param4 === 'object') ? param4 : {};
      } else if (Array.isArray(param1)) {
        allProblems = param1;
        userStates = (param2 && typeof param2 === 'object' && !Array.isArray(param2)) ? param2 : {};
        options = (param3 && typeof param3 === 'object') ? param3 : {};
        targetMins = (options.totalMinutes !== undefined && options.totalMinutes !== null) ? Math.max(0, options.totalMinutes) : (this.progress?.dsa12DailyMinutes || 120);
      } else if (param1 && typeof param1 === 'object') {
        options = param1;
        targetMins = (options.totalMinutes !== undefined && options.totalMinutes !== null) ? Math.max(0, options.totalMinutes) : (this.progress?.dsa12DailyMinutes || 120);
        allProblems = Array.isArray(options.allProblems) ? options.allProblems : [];
        userStates = options.userStates || {};
      } else {
        targetMins = this.progress?.dsa12DailyMinutes || 120;
      }

      if (options && options.replenishStream) {
        return this.replenishDailyPlan(options.replenishStream, targetMins, allProblems, userStates, options);
      }

      const now = (options.asOfDate instanceof Date && !isNaN(options.asOfDate.getTime())) ? options.asOfDate : new Date();

      const SRSEngineRef = (typeof window !== 'undefined' && window.SRSEngine) ||
                           (typeof global !== 'undefined' && global.SRSEngine) ||
                           (typeof require !== 'undefined' ? (function () { try { return require('./srs-engine'); } catch (_) { return null; } })() : null);

      const GraphEngineRef = (typeof window !== 'undefined' && window.GraphEngine) ||
                             (typeof global !== 'undefined' && global.GraphEngine) ||
                             (typeof require !== 'undefined' ? (function () { try { return require('./graph-engine'); } catch (_) { return null; } })() : null);

      const AdaptiveLearningEngineRef = (typeof window !== 'undefined' && window.AdaptiveLearningEngine) ||
                                       (typeof global !== 'undefined' && global.AdaptiveLearningEngine) ||
                                       (typeof require !== 'undefined' ? (function () { try { return require('./adaptive-learning-engine'); } catch (_) { return null; } })() : null);

      // 1. Resolve Independent Current Learning Topic (Learner Control)
      let learningTopic = null;
      if (options.learningTopic) {
        learningTopic = this.validateTopic(options.learningTopic, false) || this.getCurrentLearningTopic(allProblems, userStates);
        if (this.progress && !isLegacyWeekCall && !options.noPersistTopic) {
          this.progress.currentLearningTopic = learningTopic;
          this.progress.selectedLearningTopic = learningTopic;
        }
      } else if (this.progress && (this.progress.currentLearningTopic || this.progress.selectedLearningTopic)) {
        learningTopic = this.validateTopic(this.progress.currentLearningTopic || this.progress.selectedLearningTopic, false) || this.getCurrentLearningTopic(allProblems, userStates);
      } else {
        learningTopic = this.getCurrentLearningTopic(allProblems, userStates);
      }

      // 2. Resolve Independent Revision Topic (Learner Control)
      let revisionTopic = null;
      if (options.revisionTopic) {
        revisionTopic = this.validateTopic(options.revisionTopic, true) || this.getRevisionTopic(allProblems, userStates);
        if (this.progress && !isLegacyWeekCall && !options.noPersistTopic) {
          this.progress.revisionTopic = revisionTopic;
          this.progress.selectedRevisionTopic = revisionTopic;
        }
      } else if (this.progress && (this.progress.revisionTopic || this.progress.selectedRevisionTopic)) {
        revisionTopic = this.validateTopic(this.progress.revisionTopic || this.progress.selectedRevisionTopic, true) || this.getRevisionTopic(allProblems, userStates);
      } else {
        revisionTopic = this.getRevisionTopic(allProblems, userStates);
      }

      const isDueHelper = (state) => {
        if (!state || typeof state !== 'object' || !state.lastReviewed) return false;
        if (state.isMastered) return false;
        const nr = state.nextReviewDate || state.nextReview;
        if (!nr) return false;
        const targetDate = new Date(nr);
        if (isNaN(targetDate.getTime())) return false;
        return targetDate.getTime() <= now.getTime();
      };

      const isReviewedToday = (state) => {
        if (!state || typeof state !== 'object' || !state.lastReviewed) return false;
        const d = new Date(state.lastReviewed);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
      };

      const todayKey = this.toLocalDateKey(now);
      const weeklyStudyDays = this.getWeeklyStudyDays();

      // State fingerprint guarantees cache invalidation on any problem outcome or review
      let stateFingerprint = 0;
      if (userStates) {
        Object.keys(userStates).forEach(k => {
          const st = userStates[k];
          if (st && st.lastReviewed) {
            stateFingerprint = (stateFingerprint + new Date(st.lastReviewed).getTime() % 100000) % 1000000;
          }
        });
      }

      // -----------------------------------------------------------------------
      // PRE-SCAN: AUTHORITATIVE SRS STATE ACROSS ALL TOPICS FOR DUE REVIEWS
      // -----------------------------------------------------------------------
      const dueCandidates = [];
      allProblems.forEach(p => {
        if (!p || !p.id) return;
        const st = userStates[p.id];
        if (!st || typeof st !== 'object' || !st.lastReviewed || st.isMastered) return;
        if (isReviewedToday(st)) return; // Massed practice guard: don't review again today

        const nr = st.nextReviewDate || st.nextReview;
        if (!nr) return;
        const nextDate = new Date(nr);
        if (isNaN(nextDate.getTime())) return;
        if (nextDate.getTime() > now.getTime()) return; // EXCLUDE FUTURE-DUE ITEMS!

        const isOverdue = nextDate.getTime() < now.getTime();
        const overdueDays = isOverdue
          ? Math.max(1, Math.round((now.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        let priorityScore = 0;
        let reasons = [];
        if (overdueDays > 0) {
          priorityScore += 50 + Math.min(30, overdueDays * 5);
          reasons.push(`Overdue by ${overdueDays}d (SRS recall)`);
        } else {
          priorityScore += 40;
          reasons.push('Due for scheduled spaced recall');
        }
        if (st.lastRating === 'failed') {
          priorityScore += 35;
          reasons.push('Failed in last attempt (reinforcement)');
        }
        if (st.hintsUsed) {
          priorityScore += 25;
          reasons.push('Solved with hints (needs independent attempt)');
        }
        const confVal = typeof st.confidence === 'number' ? st.confidence : 3;
        if (confVal <= 2) {
          priorityScore += 20;
          reasons.push('Weak recall confidence (rating ≤ 2)');
        }

        dueCandidates.push({
          problem: p,
          priorityScore,
          primaryReason: reasons[0] || 'Scheduled spaced recall',
          allReasons: reasons,
          overdueDays,
          isOverdue
        });
      });

      // Deterministic urgency sorting: highest priority score -> deterministic ID
      dueCandidates.sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        return a.problem.id.localeCompare(b.problem.id);
      });

      const totalDueSRS = dueCandidates.length;

      // Calculate time allocation across all 3 streams + active recall
      const overdueSRSCount = dueCandidates.filter(c => c.isOverdue).length;
      const allocation = this.calculateTimeAllocation(targetMins, totalDueSRS, isLegacyWeekCall, {
        policy: options.allocationPolicy || options.policy || 'A',
        overdueCount: overdueSRSCount
      });

      const planKey = `${todayKey}_m${targetMins}_d${weeklyStudyDays}_l${learningTopic}_r${revisionTopic}_cnt${allProblems.length}`;
      const shouldReadCache = !options.forceFresh && !options.noCache && Boolean(this.progress && this.progress.dsa12DailyPlans && this.progress.dsa12DailyPlans[planKey]);

      let selectedLearn = [];
      let selectedTopicRevision = [];
      let selectedSpacedRevision = [];
      const selectedIds = new Set();
      let learnTimeAccum = 0;
      let topicRevTimeAccum = 0;
      let spacedRevTimeAccum = 0;

      if (shouldReadCache) {
        const cached = this.progress.dsa12DailyPlans[planKey];

        // Restore Spaced Revision
        selectedSpacedRevision = (cached.spacedReviseIds || []).map(id => {
          const p = allProblems.find(item => item.id === id);
          if (!p) return null;
          const est = this.getProblemEstimatedMinutes(p.difficulty, true);
          spacedRevTimeAccum += est;
          selectedIds.add(p.id);
          return {
            ...p,
            estimatedMinutes: est,
            isRevision: true,
            isSpacedRevision: true,
            isTopicRevision: false,
            selectionReason: (cached.reasons && cached.reasons[id]) || 'Scheduled spaced recall',
            isSkippedToday: this.isTaskSkippedToday(p.id),
            isCompletedToday: isReviewedToday(userStates[p.id])
          };
        }).filter(Boolean);

        // Restore Learn
        selectedLearn = (cached.learnIds || []).map(id => {
          const p = allProblems.find(item => item.id === id);
          if (!p) return null;
          const est = this.getProblemEstimatedMinutes(p.difficulty, false);
          learnTimeAccum += est;
          selectedIds.add(p.id);
          return {
            ...p,
            estimatedMinutes: est,
            isRevision: false,
            isSpacedRevision: false,
            isTopicRevision: false,
            selectionReason: (cached.learnReasons && cached.learnReasons[id]) || `Recommended for ${learningTopic}`,
            isSkippedToday: this.isTaskSkippedToday(p.id),
            isCompletedToday: isReviewedToday(userStates[p.id])
          };
        }).filter(Boolean);

        // Restore Topic Revision
        selectedTopicRevision = (cached.topicReviseIds || []).map(id => {
          const p = allProblems.find(item => item.id === id);
          if (!p) return null;
          const est = this.getProblemEstimatedMinutes(p.difficulty, true);
          topicRevTimeAccum += est;
          selectedIds.add(p.id);
          return {
            ...p,
            estimatedMinutes: est,
            isRevision: true,
            isTopicRevision: true,
            isSpacedRevision: false,
            selectionReason: (cached.topicReasons && cached.topicReasons[id]) || `Practice in ${revisionTopic}`,
            isSkippedToday: this.isTaskSkippedToday(p.id),
            isCompletedToday: isReviewedToday(userStates[p.id])
          };
        }).filter(Boolean);

      } else {
        // -----------------------------------------------------------------------
        // STREAM 3: SPACED REVISION (Time-Based SRS Recall across ALL topics)
        // -----------------------------------------------------------------------
        if (allocation.spacedRevisionTargetMinutes > 0 && targetMins > 0) {
          for (const item of dueCandidates) {
            const p = item.problem;
            if (selectedIds.has(p.id)) continue;
            const est = this.getProblemEstimatedMinutes(p.difficulty, true);

            if (spacedRevTimeAccum + est <= targetMins && (selectedSpacedRevision.length === 0 || (spacedRevTimeAccum + est <= allocation.spacedRevisionTargetMinutes + 10))) {
              selectedSpacedRevision.push({
                ...p,
                estimatedMinutes: est,
                isRevision: true,
                isSpacedRevision: true,
                isTopicRevision: false,
                selectionReason: item.primaryReason,
                selectionReasons: item.allReasons,
                isOverdue: item.isOverdue,
                overdueDays: item.overdueDays,
                isSkippedToday: this.isTaskSkippedToday(p.id),
                isCompletedToday: false
              });
              selectedIds.add(p.id);
              spacedRevTimeAccum += est;
              if (spacedRevTimeAccum >= allocation.spacedRevisionTargetMinutes) break;
            }
          }
        }

        // -----------------------------------------------------------------------
        // STREAM 1: TODAY'S LEARNING (New Questions in Selected Learning Topic)
        // -----------------------------------------------------------------------
        const topicNorm = learningTopic ? learningTopic.toLowerCase() : '';
        const topicProblems = allProblems.filter(p => {
          if (!p || !p.id) return false;
          if (learningTopic === 'Mixed') return true;
          const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
          return canonP.toLowerCase() === topicNorm || (p.topic || '').toLowerCase().includes(topicNorm);
        });

        // Filter uncompleted problems for new learning (must not be in selectedIds)
        const unattemptedPool = topicProblems.filter(p => {
          if (selectedIds.has(p.id)) return false;
          const st = userStates[p.id];
          // Exclude completed learning items
          if (st && (st.isMastered || (st.stage >= 2 && !st.hintsUsed && st.lastRating !== 'failed'))) {
            return false;
          }
          if (isReviewedToday(st)) return false; // Avoid same-session repetition
          return !st || !st.lastReviewed || st.lastRating === 'failed' || st.hintsUsed;
        });

        const diffRank = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const scoredLearnCandidates = [];

        // Count learner success & failure in topic for difficulty staircasing
        let solvedInTopic = 0;
        let failedInTopic = 0;
        let lastAttemptInTopic = null;
        topicProblems.forEach(p => {
          const st = userStates[p.id];
          if (st && st.lastReviewed) {
            if (st.lastRating === 'failed') failedInTopic++;
            else solvedInTopic++;
            if (!lastAttemptInTopic || new Date(st.lastReviewed).getTime() > new Date(lastAttemptInTopic.lastReviewed).getTime()) {
              lastAttemptInTopic = st;
            }
          }
        });

        let preferredDiff = solvedInTopic >= 5 ? 3 : (solvedInTopic >= 2 ? 2 : 1);
        if (lastAttemptInTopic && lastAttemptInTopic.lastRating === 'failed' && preferredDiff > 1) {
          preferredDiff = preferredDiff - 1; // Step down difficulty after recent failure to rebuild confidence
        }

        unattemptedPool.forEach(p => {
          const st = userStates[p.id];
          let score = 0;
          let candidateType = 'unseen';
          let reason = `Recommended new question for ${learningTopic}`;

          if (st && st.lastRating === 'failed') {
            candidateType = 'failed';
            score += 35;
            reason = `Failed previously in ${learningTopic} · Reinforcement drill`;
          } else if (st && st.hintsUsed) {
            candidateType = 'hints_used';
            score += 25;
            reason = `Solved with hints in ${learningTopic} · Needs independent solve`;
          } else {
            candidateType = 'unseen';
            score += 20;
            reason = `Unseen foundation question for ${learningTopic}`;
          }

          // Prerequisite guidance (GraphEngine)
          if (GraphEngineRef && typeof GraphEngineRef.checkPrerequisiteAdvisory === 'function') {
            try {
              const adv = GraphEngineRef.checkPrerequisiteAdvisory(p, allProblems, userStates);
              if (!adv || !adv.isAdvised) {
                score += 20; // Foundations solid
              } else if (adv.isAdvised && adv.steppingStone) {
                if (adv.steppingStone.id === p.id) {
                  score += 35;
                  reason = `Recommended stepping-stone question for ${learningTopic}`;
                }
              }
            } catch (_) {}
          }

          // Adaptive diagnosis priority (AdaptiveLearningEngine)
          if (AdaptiveLearningEngineRef && typeof AdaptiveLearningEngineRef.observeEvidence === 'function') {
            try {
              const rec = AdaptiveLearningEngineRef.selectNextAction(allProblems, userStates);
              if (rec && (rec.problemId === p.id || rec.targetProblemId === p.id)) {
                score += 40;
                reason = rec.explanation || `Adaptive diagnosis priority`;
              }
            } catch (_) {}
          }

          const pDiffRank = diffRank[p.difficulty] || 2;
          if (pDiffRank === preferredDiff) score += 15;
          else if (pDiffRank < preferredDiff) score += 5;

          scoredLearnCandidates.push({
            problem: p,
            candidateType,
            score,
            reason,
            diffScore: pDiffRank
          });
        });

        // Sort: diffScore ascending (Easy -> Medium -> Hard) -> score descending -> ID
        scoredLearnCandidates.sort((a, b) => {
          if (a.diffScore !== b.diffScore) return a.diffScore - b.diffScore;
          if (b.score !== a.score) return b.score - a.score;
          return a.problem.id.localeCompare(b.problem.id);
        });

        if (allocation.learnTargetMinutes > 0 && targetMins > spacedRevTimeAccum) {
          for (const item of scoredLearnCandidates) {
            const p = item.problem;
            if (selectedIds.has(p.id)) continue;
            const est = this.getProblemEstimatedMinutes(p.difficulty, false);

            if (spacedRevTimeAccum + learnTimeAccum + est <= targetMins && (selectedLearn.length === 0 || (learnTimeAccum + est <= allocation.learnTargetMinutes + 10))) {
              selectedLearn.push({
                ...p,
                estimatedMinutes: est,
                candidateType: item.candidateType,
                isRevision: false,
                isSpacedRevision: false,
                isTopicRevision: false,
                selectionReason: item.reason,
                isSkippedToday: this.isTaskSkippedToday(p.id),
                isCompletedToday: isReviewedToday(userStates[p.id])
              });
              selectedIds.add(p.id);
              learnTimeAccum += est;
              if (learnTimeAccum >= allocation.learnTargetMinutes) break;
            }
          }
        }

        // -----------------------------------------------------------------------
        // STREAM 2: TOPIC REVISION (Topic-Focused Practice in Selected Revise Topic)
        // -----------------------------------------------------------------------
        const canonRev = (revisionTopic && revisionTopic !== 'all_due' && SRSEngineRef)
          ? SRSEngineRef.canonicalizeTopic(revisionTopic)
          : revisionTopic;
        const revTopicNorm = (canonRev || '').toLowerCase();
        const isAllDueMode = revisionTopic === 'all_due';

        // Filter topic revision pool: MUST NOT OVERLAP with Spaced Revision or Learn!
        const topicRevCandidates = allProblems.filter(p => {
          if (!p || !p.id) return false;
          if (selectedIds.has(p.id)) return false; // Deduplication: zero overlap
          if (isAllDueMode) return true;
          const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
          const pNorm = canonP.toLowerCase();
          return pNorm === revTopicNorm || pNorm.includes(revTopicNorm) || revTopicNorm.includes(pNorm);
        });

        const scoredTopicRevCandidates = [];
        topicRevCandidates.forEach(p => {
          const st = userStates[p.id];
          if (isReviewedToday(st)) return; // Avoid repeating recently practiced questions

          let priorityScore = 10;
          let reasons = [];

          if (st && st.lastRating === 'failed') {
            priorityScore += 40;
            reasons.push('Failed previously (needs repair drill)');
          } else if (st && st.hintsUsed) {
            priorityScore += 30;
            reasons.push('Solved with hints (needs independent practice)');
          } else if (st && typeof st.confidence === 'number' && st.confidence <= 2) {
            priorityScore += 25;
            reasons.push('Low confidence on this pattern');
          } else if (st && st.stage && st.stage < 3) {
            priorityScore += 20;
            reasons.push('Reinforce developing skill');
          } else if (!st || !st.lastReviewed) {
            priorityScore += 15;
            reasons.push(`Targeted practice in ${revisionTopic}`);
          } else {
            priorityScore += 10;
            reasons.push(`Pattern maintenance in ${revisionTopic}`);
          }

          scoredTopicRevCandidates.push({
            problem: p,
            priorityScore,
            primaryReason: reasons[0] || `Practice in ${revisionTopic}`,
            allReasons: reasons,
            diffScore: diffRank[p.difficulty] || 2
          });
        });

        scoredTopicRevCandidates.sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
          if (a.diffScore !== b.diffScore) return a.diffScore - b.diffScore;
          return a.problem.id.localeCompare(b.problem.id);
        });

        const effectiveTopicRevTarget = allocation.topicRevisionTargetMinutes + (selectedLearn.length === 0 ? allocation.learnTargetMinutes : 0);
        if (effectiveTopicRevTarget > 0 && targetMins > (spacedRevTimeAccum + learnTimeAccum)) {
          for (const item of scoredTopicRevCandidates) {
            const p = item.problem;
            if (selectedIds.has(p.id)) continue;
            const est = this.getProblemEstimatedMinutes(p.difficulty, true);

            if (spacedRevTimeAccum + learnTimeAccum + topicRevTimeAccum + est <= targetMins && (selectedTopicRevision.length === 0 || (topicRevTimeAccum + est <= effectiveTopicRevTarget + 10))) {
              selectedTopicRevision.push({
                ...p,
                estimatedMinutes: est,
                isRevision: true,
                isTopicRevision: true,
                isSpacedRevision: false,
                selectionReason: item.primaryReason,
                selectionReasons: item.allReasons,
                isSkippedToday: this.isTaskSkippedToday(p.id),
                isCompletedToday: false
              });
              selectedIds.add(p.id);
              topicRevTimeAccum += est;
              if (topicRevTimeAccum >= effectiveTopicRevTarget) break;
            }
          }
        }

        // Cache plan IDs for today's active session
        if (!options.noCache && this.progress) {
          if (!this.progress.dsa12DailyPlans) this.progress.dsa12DailyPlans = {};
          const reasonsMap = {};
          const learnReasonsMap = {};
          const topicReasonsMap = {};
          selectedSpacedRevision.forEach(r => { reasonsMap[r.id] = r.selectionReason; });
          selectedTopicRevision.forEach(r => { topicReasonsMap[r.id] = r.selectionReason; });
          selectedLearn.forEach(l => { learnReasonsMap[l.id] = l.selectionReason; });

          this.progress.dsa12DailyPlans[planKey] = {
            learnIds: selectedLearn.map(p => p.id),
            topicReviseIds: selectedTopicRevision.map(p => p.id),
            spacedReviseIds: selectedSpacedRevision.map(p => p.id),
            reviseIds: [...selectedTopicRevision.map(p => p.id), ...selectedSpacedRevision.map(p => p.id)],
            reasons: reasonsMap,
            learnReasons: learnReasonsMap,
            topicReasons: topicReasonsMap
          };
          this.saveProgress();
        }
      }

      // -----------------------------------------------------------------------
      // SECTION C: DAILY PROGRESS & COMPLETION TRACKING
      // -----------------------------------------------------------------------
      const completedTodayAll = allProblems.filter(p => {
        if (!p || !p.id) return false;
        return isReviewedToday(userStates[p.id]);
      });

      let todayMinutesLogged = 0;
      let independentSolvesToday = 0;
      let hintAssistedToday = 0;
      let failedAttemptsToday = 0;

      completedTodayAll.forEach(p => {
        const st = userStates[p.id];
        if (Array.isArray(st.history)) {
          st.history.forEach(h => {
            if (h && (h.date || h.reviewedAt)) {
              const hd = new Date(h.date || h.reviewedAt);
              if (hd.getFullYear() === now.getFullYear() &&
                  hd.getMonth() === now.getMonth() &&
                  hd.getDate() === now.getDate()) {
                todayMinutesLogged += (parseInt(h.timeSpentMinutes, 10) || 15);
                if (h.rating === 'failed') failedAttemptsToday++;
                else if (h.hintsUsed) hintAssistedToday++;
                else independentSolvesToday++;
              }
            }
          });
        } else {
          todayMinutesLogged += 15;
          if (st.lastRating === 'failed') failedAttemptsToday++;
          else if (st.hintsUsed) hintAssistedToday++;
          else independentSolvesToday++;
        }
      });

      selectedLearn.forEach(p => {
        p.isCompletedToday = isReviewedToday(userStates[p.id]);
      });
      selectedTopicRevision.forEach(p => {
        p.isCompletedToday = isReviewedToday(userStates[p.id]);
      });
      selectedSpacedRevision.forEach(p => {
        p.isCompletedToday = isReviewedToday(userStates[p.id]);
      });

      const totalPlannedTasks = selectedLearn.length + selectedTopicRevision.length + selectedSpacedRevision.length;
      const completedPlannedTasks = selectedLearn.filter(p => p.isCompletedToday).length +
                                    selectedTopicRevision.filter(p => p.isCompletedToday).length +
                                    selectedSpacedRevision.filter(p => p.isCompletedToday).length;
      const remainingPlannedTasks = Math.max(0, totalPlannedTasks - completedPlannedTasks);
      const completionPercent = totalPlannedTasks > 0
        ? Math.round((completedPlannedTasks / totalPlannedTasks) * 100)
        : (completedTodayAll.length > 0 ? 100 : 0);

      const totalOverdueRemaining = allProblems.filter(p => {
        if (!p || !p.id) return false;
        const st = userStates[p.id];
        if (!st || typeof st !== 'object' || !st.lastReviewed || isReviewedToday(st)) return false;
        return isDueHelper(st);
      }).length;

      const backlogDueCount = Math.max(0, totalDueSRS - selectedSpacedRevision.length);

      const dynamicRoadmap = this.calculateDynamicRoadmap(allProblems, userStates, {
        dailyMinutes: targetMins,
        weeklyStudyDays: weeklyStudyDays,
        asOfDate: now,
        learningTopic,
        revisionTopic
      });

      const revTopicDisplay = revisionTopic === 'all_due'
        ? 'All Due Topics'
        : revisionTopic;

      // Combined revision list for backward-compatibility with older tests and components
      const combinedRevisionList = [...selectedSpacedRevision, ...selectedTopicRevision];

      const legacyRevFiltered = isLegacyWeekCall
        ? combinedRevisionList
        : (revisionTopic === 'all_due'
            ? selectedSpacedRevision
            : selectedSpacedRevision.filter(p => {
                const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : p.topic;
                const revNorm = (revisionTopic || '').toLowerCase();
                return (canonP || '').toLowerCase() === revNorm || (p.topic || '').toLowerCase().includes(revNorm);
              }));

      // Query next eligible candidates in catalog (no artificial 24-hour delay)
      const nextEligibleLearn = this.getNextEligibleQuestion('learn', allProblems, userStates, {
        learningTopic,
        excludeIds: Array.from(selectedIds),
        asOfDate: now
      });

      const nextEligibleTopicRev = this.getNextEligibleQuestion('topicRevision', allProblems, userStates, {
        revisionTopic,
        excludeIds: Array.from(selectedIds),
        asOfDate: now
      });

      const topicNormForReason = learningTopic ? learningTopic.toLowerCase() : '';
      const topicProblemsForReason = allProblems.filter(p => {
        if (!p || !p.id) return false;
        if (learningTopic === 'Mixed') return true;
        const canonP = SRSEngineRef ? SRSEngineRef.canonicalizeTopic(p.topic) : (p.topic || '');
        return canonP.toLowerCase() === topicNormForReason || (p.topic || '').toLowerCase().includes(topicNormForReason);
      });

      let learnEmptyReason = 'none';
      let learnEmptyExplanation = '';
      if (selectedLearn.length === 0) {
        if (topicProblemsForReason.length === 0) {
          learnEmptyReason = 'no_questions';
          learnEmptyExplanation = `No problems available in catalog for topic "${learningTopic}".`;
        } else {
          const allMastered = topicProblemsForReason.every(p => {
            const st = userStates[p.id];
            return st && (st.isMastered || (st.stage >= 2 && !st.hintsUsed && st.lastRating !== 'failed'));
          });
          if (allMastered) {
            learnEmptyReason = 'all_mastered';
            learnEmptyExplanation = `All questions in topic "${learningTopic}" are mastered.`;
          } else {
            const allPracticedToday = topicProblemsForReason.every(p => {
              const st = userStates[p.id];
              return isReviewedToday(st) || (st && (st.isMastered || (st.stage >= 2 && !st.hintsUsed && st.lastRating !== 'failed')));
            });
            if (allPracticedToday) {
              learnEmptyReason = 'topic_exhausted';
              learnEmptyExplanation = `All available questions in "${learningTopic}" were completed in today's session.`;
            } else {
              learnEmptyReason = 'all_allocated';
              learnEmptyExplanation = `All eligible questions in "${learningTopic}" have been allocated.`;
            }
          }
        }
      }

      return {
        timeAllocation: {
          totalMinutes: allocation.totalMinutes,
          learnMinutes: allocation.learnTargetMinutes,
          topicRevisionMinutes: allocation.topicRevisionTargetMinutes,
          spacedRevisionMinutes: allocation.spacedRevisionTargetMinutes,
          revisionMinutes: allocation.topicRevisionTargetMinutes + allocation.spacedRevisionTargetMinutes,
          recallBufferMinutes: allocation.recallBufferMinutes
        },
        learn: {
          topic: learningTopic,
          canonicalTopic: learningTopic,
          plannedMinutes: learnTimeAccum,
          allTopicProblemsCompleted: selectedLearn.length === 0,
          emptyReason: learnEmptyReason,
          emptyExplanation: learnEmptyExplanation,
          hasNextEligibleQuestion: Boolean(nextEligibleLearn),
          nextEligibleQuestion: nextEligibleLearn,
          problems: selectedLearn
        },
        topicRevision: {
          topic: revisionTopic,
          canonicalTopic: revisionTopic,
          topicDisplay: revTopicDisplay,
          plannedMinutes: topicRevTimeAccum,
          noProblemsAvailable: selectedTopicRevision.length === 0,
          hasNextEligibleQuestion: Boolean(nextEligibleTopicRev),
          nextEligibleQuestion: nextEligibleTopicRev,
          problems: selectedTopicRevision
        },
        spacedRevision: {
          topicScope: 'all_due',
          plannedMinutes: spacedRevTimeAccum,
          dueTotal: totalDueSRS,
          backlogCount: backlogDueCount,
          hasBacklog: backlogDueCount > 0,
          hasBacklogDue: backlogDueCount > 0,
          noReviewsDue: selectedSpacedRevision.length === 0,
          problems: selectedSpacedRevision
        },
        // Backward-compatibility alias
        revise: {
          topic: revisionTopic,
          topicDisplay: revTopicDisplay,
          isAllDueMode: revisionTopic === 'all_due',
          noReviewsDue: legacyRevFiltered.length === 0,
          plannedMinutes: topicRevTimeAccum + spacedRevTimeAccum,
          problems: legacyRevFiltered
        },
        dynamicRoadmap: dynamicRoadmap,
        progress: {
          completedTodayTotal: completedTodayAll.length,
          plannedTasksTotal: totalPlannedTasks,
          totalPlannedTasks: totalPlannedTasks,
          completedPlannedTasks: completedPlannedTasks,
          remainingTasks: remainingPlannedTasks,
          todayMinutesLogged: todayMinutesLogged,
          completionPercent: completionPercent,
          independentSolvesToday,
          hintAssistedToday,
          failedAttemptsToday,
          overdueRemaining: totalOverdueRemaining,
          dueBacklogRemaining: backlogDueCount,
          isAllCompleted: totalPlannedTasks > 0 && remainingPlannedTasks === 0
        }
      };
    }
  };

  if (typeof window !== 'undefined') {
    window.RoadmapEngine = RoadmapEngine;
    RoadmapEngine.initProgress();
    if (window.LearnerRepository && typeof window.LearnerRepository.onContextChange === 'function') {
      window.LearnerRepository.onContextChange(() => {
        RoadmapEngine.initProgress();
      });
    }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoadmapEngine;
  }
})();
