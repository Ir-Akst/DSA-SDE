/**
 * AlgoRecall - Roadmap & Day-wise Study Planner Engine
 * Manages structured topic-wise roadmaps, daily target problem assignments,
 * integrated daily spaced revisions, and weekend super revision assessments.
 */

(function () {
  'use strict';

  const STORAGE_KEY_ROADMAP = 'algorecall_roadmap_progress_v1';

  window.RoadmapEngine = {
    progress: null,

    // Initialize or load roadmap progress from localStorage
    initProgress() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ROADMAP);
        this.progress = stored ? JSON.parse(stored) : this.getDefaultProgress();
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
        customDayWorkouts: {} // key `${trackId}_w${w}_d${d}` -> { topics: [...], problemIds: [...] }
      };
    },

    saveProgress() {
      try {
        localStorage.setItem(STORAGE_KEY_ROADMAP, JSON.stringify(this.progress));
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
    }
  };

  // Auto-init on load
  window.RoadmapEngine.initProgress();
})();
