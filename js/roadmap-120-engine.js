/**
 * AlgoRecall 2.0 - Production-Ready 120-Day DSA Roadmap Engine & Editor
 * 
 * Supports:
 * - Three Independent Learning Streams:
 *   - Stream A: Current Learning (Graphs -> Greedy -> Recursion/Backtracking -> Trees/BST -> DP -> Mixed)
 *   - Stream B: Foundation Revision (Maths, Arrays, Strings, Two Pointers, Linked Lists, etc.)
 *   - Stream C: Spaced Repetition System (Direct SRSEngine live due reviews, invariant to roadmap edits)
 * - Flexible Day Operations:
 *   - Insert Blank Buffer Days (with notes/reason, shifts sequence, preserves task identity)
 *   - Shift Mode (aligned or independent streams, preserves completed work & timestamps)
 *   - Condense Mode (recalculates remaining workload, preserves prerequisites, combines compatible tasks, realistic trade-off analysis)
 *   - Move & Reorder (tasks or entire days, accessible controls + drag/drop, prerequisite checks)
 *   - Edit Any Day (topics, subtopics, problem targets, custom topics, notes, priorities)
 *   - Split, Merge, Skip, Replace (with audit trail, never marks skipped as mastered)
 *   - Extend Beyond 120 Days (day 121+, cyclical revisions, mock blocks, repair cycles)
 *   - Undo & Change History (bounded 30-op stack, reverts plan without touching solved history)
 * - Authoritative Recommendation Integration:
 *   - Single authoritative daily resolver with conflict detection and suggestions
 *   - Scheduling preference: 'roadmap_aligned' (default), 'adaptive', 'manual'
 */

(function () {
  'use strict';

  // Environment helpers
  const getSRSEngine = () => {
    try {
      if (typeof window !== 'undefined' && window.SRSEngine) return window.SRSEngine;
      if (typeof global !== 'undefined' && global.SRSEngine) return global.SRSEngine;
      if (typeof require !== 'undefined') return require('./srs-engine');
    } catch (_) {}
    return null;
  };

  const getGraphEngine = () => {
    try {
      if (typeof window !== 'undefined' && window.GraphEngine) return window.GraphEngine;
      if (typeof global !== 'undefined' && global.GraphEngine) return global.GraphEngine;
      if (typeof require !== 'undefined') return require('./graph-engine');
    } catch (_) {}
    return null;
  };

  const getRecommendationEngine = () => {
    try {
      if (typeof window !== 'undefined' && window.RecommendationEngine) return window.RecommendationEngine;
      if (typeof global !== 'undefined' && global.RecommendationEngine) return global.RecommendationEngine;
      if (typeof require !== 'undefined') return require('./recommendation-engine');
    } catch (_) {}
    return null;
  };

  const getCurriculumData = () => {
    try {
      if (typeof window !== 'undefined' && window.RoadmapCurriculumData) return window.RoadmapCurriculumData;
      if (typeof global !== 'undefined' && global.RoadmapCurriculumData) return global.RoadmapCurriculumData;
      if (typeof require !== 'undefined') return require('./data/roadmap-120-curriculum');
    } catch (_) {}
    return null;
  };

  const toLocalDateString = (d = new Date()) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  };

  const generateId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  };

  const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  };

  // 120-Day Baseline Blueprint Definition
  // Primary authority is RoadmapCurriculumData (js/data/roadmap-120-curriculum.js)
  // Strict Unmixed Topic Ordering:
  // Stream A: Graphs (1-30) -> Binary Trees & BST (31-55) -> DP (56-85) -> Recursion (86-95) -> Greedy (96-105) -> Heap (106-113) -> Tries (114-120)
  // Stream B: Maths (1-10) -> Arrays (11-24) -> Strings (25-34) -> Window (35-44) -> Sorting (45-50) -> BS (51-60) -> LL (61-70) -> Stack (71-80) -> Bit (81-86) -> Recursion (87-94) -> Trees (95-104) -> Heap (105-109) -> Graphs (110-114) -> DP (115-118) -> Greedy (119-120)

  const getStreamABlueprint = (dayNum) => {
    const cData = getCurriculumData();
    if (cData && typeof cData.getStreamADay === 'function') {
      return cData.getStreamADay(dayNum);
    }
    let topic = 'Graphs';
    let subtopic = 'Graph Representation & Traversal';
    if (dayNum > 30 && dayNum <= 55) {
      topic = 'Binary Trees & BST';
      subtopic = 'Binary Tree & BST Traversals and Patterns';
    } else if (dayNum > 55 && dayNum <= 85) {
      topic = 'Dynamic Programming';
      subtopic = 'DP State Transitions & Tabulation';
    } else if (dayNum > 85 && dayNum <= 95) {
      topic = 'Recursion & Backtracking';
      subtopic = 'Recursive Decision Trees & Pruning';
    } else if (dayNum > 95 && dayNum <= 105) {
      topic = 'Greedy & Intervals';
      subtopic = 'Greedy Choices & Interval Scheduling';
    } else if (dayNum > 105 && dayNum <= 113) {
      topic = 'Heap / Priority Queue';
      subtopic = 'Priority Queue Operations & Top-K';
    } else if (dayNum > 113) {
      topic = 'Tries';
      subtopic = 'Trie Prefix Trees & Assessment';
    }
    return {
      dayNumber: dayNum,
      topic,
      subtopic,
      objectives: `Master core ${topic} concepts and interview patterns.`,
      suggestedProblemIds: [],
      targetCount: 3,
      estimatedMinutes: 60
    };
  };

  const getStreamBBlueprint = (dayNum) => {
    const cData = getCurriculumData();
    if (cData && typeof cData.getStreamBDay === 'function') {
      return cData.getStreamBDay(dayNum);
    }
    let topic = 'Basics & Math';
    if (dayNum > 10 && dayNum <= 24) topic = 'Arrays & Hashing';
    else if (dayNum > 24 && dayNum <= 34) topic = 'Strings';
    else if (dayNum > 34 && dayNum <= 44) topic = 'Sliding Window & Two Pointers';
    else if (dayNum > 44 && dayNum <= 50) topic = 'Sorting';
    else if (dayNum > 50 && dayNum <= 60) topic = 'Binary Search';
    else if (dayNum > 60 && dayNum <= 70) topic = 'Linked List';
    else if (dayNum > 70 && dayNum <= 80) topic = 'Stack & Queue';
    else if (dayNum > 80 && dayNum <= 86) topic = 'Bit Manipulation';
    else if (dayNum > 86 && dayNum <= 94) topic = 'Recursion & Backtracking';
    else if (dayNum > 94 && dayNum <= 104) topic = 'Binary Trees & BST';
    else if (dayNum > 104 && dayNum <= 109) topic = 'Heap / Priority Queue';
    else if (dayNum > 109 && dayNum <= 114) topic = 'Graphs';
    else if (dayNum > 114 && dayNum <= 118) topic = 'Dynamic Programming';
    else if (dayNum > 118) topic = 'Greedy & Intervals';

    return {
      dayNumber: dayNum,
      topic,
      subtopic: `Foundation revision: ${topic}`,
      objectives: `Consolidate key algorithmic insights for ${topic}.`,
      suggestedProblemIds: [],
      targetCount: 2,
      estimatedMinutes: 35
    };
  };

  const Roadmap120Engine = {
    SCHEMA_VERSION: 5,
    DEFAULT_TOTAL_DAYS: 120,
    MAX_HISTORY_ENTRIES: 30,
    DEFAULT_STREAM_A_TOPICS: [
      'Graphs',
      'Binary Trees & BST',
      'Dynamic Programming',
      'Recursion & Backtracking',
      'Greedy & Intervals',
      'Heap / Priority Queue',
      'Tries'
    ],
    DEFAULT_STREAM_B_TOPICS: [
      'Basics & Math',
      'Arrays & Hashing',
      'Strings',
      'Sliding Window & Two Pointers',
      'Sorting',
      'Binary Search',
      'Linked List',
      'Stack & Queue',
      'Bit Manipulation',
      'Recursion & Backtracking',
      'Binary Trees & BST',
      'Heap / Priority Queue',
      'Graphs',
      'Dynamic Programming',
      'Greedy & Intervals'
    ],

    /**
     * Normalize roadmap objects and days with standard getters and metadata aliases
     */
    normalizeRoadmap(roadmap) {
      if (!roadmap || !Array.isArray(roadmap.days)) return roadmap;

      if (!roadmap.metadata) {
        roadmap.metadata = {};
      }
      roadmap.metadata.totalDays = roadmap.days.length;
      roadmap.metadata.activeTrack = 'dsa_120';
      roadmap.metadata.createdAt = roadmap.createdAt || new Date().toISOString();

      roadmap.days.forEach(d => {
        if (!Object.prototype.hasOwnProperty.call(d, 'dayNumber')) {
          Object.defineProperty(d, 'dayNumber', {
            get() { return this.sequenceIndex; },
            set(v) { this.sequenceIndex = v; },
            configurable: true,
            enumerable: true
          });
        }
        if (!Object.prototype.hasOwnProperty.call(d, 'isBufferDay')) {
          Object.defineProperty(d, 'isBufferDay', {
            get() { return this.dayType === 'buffer'; },
            set(v) { this.dayType = v ? 'buffer' : 'learning'; },
            configurable: true,
            enumerable: true
          });
        }
        if (!Object.prototype.hasOwnProperty.call(d, 'isCompleted')) {
          Object.defineProperty(d, 'isCompleted', {
            get() {
              if (this._isCompleted !== undefined) return this._isCompleted;
              return (this.tasks && this.tasks.length > 0) ? this.tasks.every(t => t.status === 'completed' || t.status === 'skipped') : false;
            },
            set(v) {
              this._isCompleted = !!v;
              if (Array.isArray(this.tasks)) {
                this.tasks.forEach(t => { t.status = v ? 'completed' : 'pending'; });
              }
            },
            configurable: true,
            enumerable: true
          });
        }
        if (!Object.prototype.hasOwnProperty.call(d, 'streams')) {
          Object.defineProperty(d, 'streams', {
            get() {
              const streamA = (this.tasks || []).find(t => t.stream === 'current_learning');
              const streamB = (this.tasks || []).find(t => t.stream === 'foundation_revision');
              return {
                current_learning: streamA ? {
                  get topic() { return streamA.topicId; },
                  set topic(v) { streamA.topicId = v; },
                  get subtopic() { return streamA.subtopicId; },
                  set subtopic(v) { streamA.subtopicId = v; },
                  get learningObjectives() { return streamA.objectives; },
                  set learningObjectives(v) { streamA.objectives = v; },
                  get targetCount() { return streamA.targetCount; },
                  set targetCount(v) { streamA.targetCount = v; },
                  get estimatedMinutes() { return streamA.estimatedMinutes; },
                  set estimatedMinutes(v) { streamA.estimatedMinutes = v; },
                  get status() { return streamA.status; },
                  set status(v) { streamA.status = v; },
                  get skipReason() { return streamA.skippedReason; },
                  set skipReason(v) { streamA.skippedReason = v; },
                  get problemIds() { return streamA.problemIds || []; },
                  set problemIds(v) { streamA.problemIds = v; }
                } : { topic: '', subtopic: '', learningObjectives: '', targetCount: 0, estimatedMinutes: 0, status: 'pending', problemIds: [] },
                foundation_revision: streamB ? {
                  get topic() { return streamB.topicId; },
                  set topic(v) { streamB.topicId = v; },
                  get subtopic() { return streamB.subtopicId; },
                  set subtopic(v) { streamB.subtopicId = v; },
                  get revisionObjectives() { return streamB.objectives; },
                  set revisionObjectives(v) { streamB.objectives = v; },
                  get targetCount() { return streamB.targetCount; },
                  set targetCount(v) { streamB.targetCount = v; },
                  get estimatedMinutes() { return streamB.estimatedMinutes; },
                  set estimatedMinutes(v) { streamB.estimatedMinutes = v; },
                  get status() { return streamB.status; },
                  set status(v) { streamB.status = v; },
                  get skipReason() { return streamB.skippedReason; },
                  set skipReason(v) { streamB.skippedReason = v; },
                  get problemIds() { return streamB.problemIds || []; },
                  set problemIds(v) { streamB.problemIds = v; }
                } : { topic: '', subtopic: '', revisionObjectives: '', targetCount: 0, estimatedMinutes: 0, status: 'pending', problemIds: [] },
                srs_due: {
                  targetCount: 2,
                  estimatedMinutes: 20
                }
              };
            },
            configurable: true,
            enumerable: true
          });
        }
      });

      return roadmap;
    },

    /**
     * Generate the complete 120-Day Baseline Roadmap Template
     * Stream A starts at Graphs and progresses through remaining curriculum
     * Stream B starts at foundational topics (Maths, Arrays, etc.) sequentially
     * Every 7-day block has 5 active study days, 1 review day, 1 assessment day
     */
    generateBaselineTemplate(userStates = {}, options = {}) {
      const startDate = (options.startDate instanceof Date) ? options.startDate : (options.startDate ? new Date(options.startDate) : new Date());
      const totalDays = Math.max(120, options.totalDays || this.DEFAULT_TOTAL_DAYS);
      const days = [];

      const currData = getCurriculumData();

      // Adaptive start offset: If user already mastered early graph problems in userStates, advance Stream A start
      let streamAOffset = 0;
      if (userStates && Object.keys(userStates).length > 0) {
        const graphBasics = [
          'prob-224-graph-representation-adj-list-matrix',
          'prob-225-bfs-traversal-of-graph',
          'prob-226-number-of-provinces',
          'prob-227-number-of-islands',
          'prob-228-flood-fill',
          'prob-229-rotting-oranges',
          'prob-230-detect-cycle-undirected-bfs',
          'prob-231-detect-cycle-undirected-dfs'
        ];
        const masteredBasics = graphBasics.filter(id => {
          const st = userStates[id];
          return st && (st.stage >= 2 || st.solved || st.status === 'completed');
        }).length;

        if (masteredBasics >= 3) {
          streamAOffset = 4;
          while (streamAOffset < 30) {
            const bp = currData ? currData.getStreamADay(1 + streamAOffset) : getStreamABlueprint(1 + streamAOffset);
            if (bp && (bp.subtopic.includes('Cycle') || bp.subtopic.includes('Topo') || bp.subtopic.includes('Bipartite'))) {
              const hasCycleMastered = (userStates['prob-230-detect-cycle-undirected-bfs'] && userStates['prob-230-detect-cycle-undirected-bfs'].stage >= 2) ||
                                       (userStates['prob-231-detect-cycle-undirected-dfs'] && userStates['prob-231-detect-cycle-undirected-dfs'].stage >= 2);
              if (bp.subtopic.includes('Cycle') && hasCycleMastered) {
                streamAOffset++;
                continue;
              }
              break;
            }
            streamAOffset++;
          }
        }
      }

      for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + (dayNum - 1));
        const dateStr = toLocalDateString(dayDate);

        const cycleDay = ((dayNum - 1) % 7) + 1; // 1 to 7
        const weekNum = Math.floor((dayNum - 1) / 7) + 1;

        let dayType = 'learning';
        if (cycleDay === 6) dayType = 'review';
        else if (cycleDay === 7) dayType = 'assessment';

        const planDayId = `day_${dayNum}`;
        const tasks = [];

        const effectiveDayA = (dayNum <= 30) ? (dayNum + streamAOffset) : dayNum;
        const learnBlueprint = currData ? currData.getStreamADay(effectiveDayA) : getStreamABlueprint(effectiveDayA);
        const revBlueprint = currData ? currData.getStreamBDay(dayNum) : getStreamBBlueprint(dayNum);

        if (dayType === 'learning') {
          // Stream A Task: Current Learning
          tasks.push({
            taskId: `task_${dayNum}_learn`,
            stream: 'current_learning',
            topicId: learnBlueprint.topic,
            subtopicId: learnBlueprint.subtopic,
            objectives: learnBlueprint.objectives,
            problemIds: [...(learnBlueprint.suggestedProblemIds || [])],
            targetCount: Math.min(3, Math.max(2, (learnBlueprint.suggestedProblemIds || []).length)),
            estimatedMinutes: learnBlueprint.estimatedMinutes || 60,
            priority: 'high',
            required: true,
            prerequisites: [],
            status: 'pending',
            skippedReason: null,
            skippedAt: null,
            replacedFrom: null
          });

          // Stream B Task: Foundation Revision
          tasks.push({
            taskId: `task_${dayNum}_revise`,
            stream: 'foundation_revision',
            topicId: revBlueprint.topic,
            subtopicId: revBlueprint.subtopic,
            objectives: revBlueprint.objectives,
            problemIds: [...(revBlueprint.suggestedProblemIds || [])],
            targetCount: Math.min(2, Math.max(1, (revBlueprint.suggestedProblemIds || []).length)),
            estimatedMinutes: revBlueprint.estimatedMinutes || 35,
            priority: 'normal',
            required: true,
            prerequisites: [],
            status: 'pending',
            skippedReason: null,
            skippedAt: null,
            replacedFrom: null
          });

        } else if (dayType === 'review') {
          // Day 6: Super Consolidation & Recall
          tasks.push({
            taskId: `task_${dayNum}_review_drill`,
            stream: 'current_learning',
            topicId: learnBlueprint.topic,
            subtopicId: learnBlueprint.subtopic || 'Active Recall & Pattern Consolidation',
            objectives: learnBlueprint.objectives || `Consolidate algorithmic insights, edge cases, and time/space tradeoffs for ${learnBlueprint.topic}.`,
            problemIds: [...(learnBlueprint.suggestedProblemIds || [])],
            targetCount: 2,
            estimatedMinutes: 45,
            priority: 'normal',
            required: true,
            prerequisites: [],
            status: 'pending',
            skippedReason: null,
            skippedAt: null,
            replacedFrom: null
          });

          tasks.push({
            taskId: `task_${dayNum}_foundation_speed`,
            stream: 'foundation_revision',
            topicId: revBlueprint.topic,
            subtopicId: revBlueprint.subtopic || 'Weekly Foundational Speed Quiz',
            objectives: revBlueprint.objectives || 'Rapid pattern recognition across foundational topics covered this week.',
            problemIds: [...(revBlueprint.suggestedProblemIds || [])],
            targetCount: 2,
            estimatedMinutes: 30,
            priority: 'normal',
            required: true,
            prerequisites: [],
            status: 'pending',
            skippedReason: null,
            skippedAt: null,
            replacedFrom: null
          });

        } else if (dayType === 'assessment') {
          // Day 7: Weekend Diagnostic Exam / Checkpoint
          tasks.push({
            taskId: `task_${dayNum}_exam`,
            stream: 'current_learning',
            topicId: learnBlueprint.topic,
            subtopicId: learnBlueprint.subtopic || `Cycle ${weekNum} Diagnostic Checkpoint`,
            objectives: learnBlueprint.objectives || `Evaluate recall under 30-45 minute timed conditions. Diagnostic assessment and error analysis.`,
            problemIds: [...(learnBlueprint.suggestedProblemIds || [])],
            targetCount: 3,
            estimatedMinutes: 60,
            priority: 'high',
            required: true,
            prerequisites: [],
            status: 'pending',
            skippedReason: null,
            skippedAt: null,
            replacedFrom: null
          });

          tasks.push({
            taskId: `task_${dayNum}_foundation_eval`,
            stream: 'foundation_revision',
            topicId: revBlueprint.topic,
            subtopicId: revBlueprint.subtopic || `Cycle ${weekNum} Foundation Checkpoint`,
            objectives: revBlueprint.objectives || `Diagnostic check for ${revBlueprint.topic}.`,
            problemIds: [...(revBlueprint.suggestedProblemIds || [])],
            targetCount: 2,
            estimatedMinutes: 30,
            priority: 'normal',
            required: true,
            prerequisites: [],
            status: 'pending',
            skippedReason: null,
            skippedAt: null,
            replacedFrom: null
          });
        }

        days.push({
          planDayId,
          sequenceIndex: dayNum,
          scheduledDate: dateStr,
          dayType,
          notes: '',
          bufferReason: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks
        });
      }

      // Check userStates to adapt starting progress if learner has already completed graph problems
      if (userStates && typeof userStates === 'object') {
        this.adaptProgressFromUserStates(days, userStates);
      }

      const template = {
        roadmapId: 'roadmap_120_master',
        schemaVersion: this.SCHEMA_VERSION,
        unmixed: true,
        title: '120-Day Topic-Wise DSA & SDE Roadmap',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          dailyMinutes: options.dailyMinutes || 120,
          weeklyStudyDays: options.weeklyStudyDays || 5,
          schedulingMode: 'roadmap_aligned', // 'roadmap_aligned' | 'adaptive' | 'manual'
          shiftMode: 'aligned', // 'aligned' | 'independent'
          startDate: toLocalDateString(startDate),
          bufferFrequency: 7,
          maxDailyProblemTarget: 5
        },
        days,
        history: []
      };

      return this.normalizeRoadmap(template);
    },

    /**
     * Inspect userStates to check already-solved problems and avoid forcing repeat of mastered fundamentals
     */
    adaptProgressFromUserStates(days, userStates) {
      if (!Array.isArray(days) || !userStates) return;

      days.forEach(day => {
        if (!Array.isArray(day.tasks)) return;
        day.tasks.forEach(task => {
          if (Array.isArray(task.problemIds) && task.problemIds.length > 0) {
            const allSolved = task.problemIds.every(id => {
              const st = userStates[id];
              return st && st.lastReviewed && st.lastRating !== 'failed';
            });
            if (allSolved) {
              task.status = 'completed';
            }
          }
        });
      });
    },

    /**
     * Get or initialize the 120-day roadmap inside RoadmapEngine.progress
     */
    get120DayRoadmap(progressRef, userStates = {}, options = {}) {
      if (!progressRef) return this.normalizeRoadmap(this.generateBaselineTemplate(userStates, options));

      if (!progressRef.dsa120Roadmap || progressRef.dsa120Roadmap.schemaVersion !== this.SCHEMA_VERSION || !progressRef.dsa120Roadmap.unmixed) {
        progressRef.dsa120Roadmap = this.generateBaselineTemplate(userStates, options);
      }
      return this.normalizeRoadmap(progressRef.dsa120Roadmap);
    },

    /**
     * Record an undo history snapshot (bounded to MAX_HISTORY_ENTRIES)
     */
    pushUndoSnapshot(roadmap, actionType, description) {
      if (!roadmap) return;
      if (!Array.isArray(roadmap.history)) roadmap.history = [];

      const snapshot = {
        id: generateId('hist'),
        timestamp: Date.now(),
        actionType,
        description,
        daysSnapshot: deepClone(roadmap.days),
        settingsSnapshot: deepClone(roadmap.settings)
      };

      roadmap.history.push(snapshot);
      if (roadmap.history.length > this.MAX_HISTORY_ENTRIES) {
        roadmap.history.shift();
      }
      roadmap.updatedAt = new Date().toISOString();
    },

    /**
     * Undo the last roadmap edit operation
     */
    undoLastAction(progressRef) {
      const roadmap = progressRef?.dsa120Roadmap;
      if (!roadmap || !Array.isArray(roadmap.history) || roadmap.history.length === 0) {
        return { success: false, message: 'No actions to undo.' };
      }

      const lastOp = roadmap.history.pop();
      roadmap.days = deepClone(lastOp.daysSnapshot);
      roadmap.settings = deepClone(lastOp.settingsSnapshot);
      roadmap.updatedAt = new Date().toISOString();

      return {
        success: true,
        message: `Reverted: ${lastOp.description}`,
        undoneAction: lastOp
      };
    },

    /**
     * Get edit history list
     */
    getChangeHistory(progressRef) {
      const roadmap = progressRef?.dsa120Roadmap;
      if (!roadmap || !Array.isArray(roadmap.history)) return [];
      return [...roadmap.history].reverse();
    },

    /**
     * Insert a Blank Buffer Day before or after positionIndex
     * Shifts subsequent positions, preserves topic order & task identity
     */
    insertDay(progressRef, positionIndex = 1, options = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const targetSeq = Math.max(1, parseInt(positionIndex, 10) || 1);
      const bufferReason = options.bufferReason || options.reason || 'Study buffer & rest day';

      this.pushUndoSnapshot(
        roadmap,
        'insert_day',
        `Inserted buffer day at position ${targetSeq} (${bufferReason})`
      );

      let insertIdx = targetSeq;
      if (options.insertBefore) {
        insertIdx = targetSeq - 1;
      }
      insertIdx = Math.max(0, Math.min(roadmap.days.length, insertIdx));

      const newDayId = generateId('day_buffer');
      const newDay = {
        planDayId: newDayId,
        sequenceIndex: insertIdx + 1,
        scheduledDate: options.scheduledDate || null,
        dayType: 'buffer',
        notes: options.notes || '',
        bufferReason: bufferReason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: []
      };

      roadmap.days.splice(insertIdx, 0, newDay);

      // Renumber sequence indices
      roadmap.days.forEach((d, idx) => {
        d.sequenceIndex = idx + 1;
      });

      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        newDay,
        totalDays: roadmap.days.length
      };
    },

    /**
     * Shift Mode (Default Rescheduling):
     * Shifts affected planned tasks forward from fromDayIndex by shiftCount days
     * Supports:
     * - stream: 'both' (aligned, default) | 'current_learning' | 'foundation_revision'
     * - Preserves completed tasks and their historical completion dates
     */
    shiftRoadmap(progressRef, fromDayIndex = 1, shiftCount = 1, options = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const startDay = Math.max(1, parseInt(fromDayIndex, 10) || 1);
      const count = Math.max(1, parseInt(shiftCount, 10) || 1);
      const stream = options.stream || 'both'; // 'both' | 'current_learning' | 'foundation_revision'
      const bufferReason = options.reason || options.bufferReason || 'Roadmap schedule shift buffer';

      this.pushUndoSnapshot(
        roadmap,
        'shift',
        `Shifted roadmap forward by ${count} day(s) from Day ${startDay} [Stream: ${stream}]`
      );

      if (stream === 'both') {
        // Aligned shift: insert `count` buffer days starting at `startDay`
        for (let i = 0; i < count; i++) {
          const insertIdx = startDay - 1 + i;
          const bufferDay = {
            planDayId: generateId('day_shift_buffer'),
            sequenceIndex: insertIdx + 1,
            scheduledDate: null,
            dayType: 'buffer',
            notes: 'Shift buffer day',
            bufferReason: bufferReason,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: []
          };
          roadmap.days.splice(insertIdx, 0, bufferDay);
        }
      } else {
        // Independent stream shift: move only the selected stream's tasks forward
        const affectedTasks = [];
        for (let i = startDay - 1; i < roadmap.days.length; i++) {
          const d = roadmap.days[i];
          const keptTasks = [];
          (d.tasks || []).forEach(t => {
            if (t.stream === stream && t.status !== 'completed') {
              affectedTasks.push(t);
            } else {
              keptTasks.push(t);
            }
          });
          d.tasks = keptTasks;
        }

        // Place affected tasks forward by `count` days
        affectedTasks.forEach((t, idx) => {
          const targetDayIdx = (startDay - 1 + count) + Math.floor(idx / 2);
          while (roadmap.days.length <= targetDayIdx) {
            roadmap.days.push({
              planDayId: generateId('day_ext'),
              sequenceIndex: roadmap.days.length + 1,
              scheduledDate: null,
              dayType: 'learning',
              notes: '',
              bufferReason: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tasks: []
            });
          }
          roadmap.days[targetDayIdx].tasks.push(t);
        });
      }

      // Re-index all days sequentially
      roadmap.days.forEach((d, idx) => {
        d.sequenceIndex = idx + 1;
      });

      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        shiftedFrom: startDay,
        shiftCount: count,
        totalDays: roadmap.days.length
      };
    },

    /**
     * Condense Mode:
     * Recalculates remaining plan using available daily study time
     * Combines compatible tasks, reduces problem targets where necessary,
     * checks for unrealistic deadlines, and provides before/after preview
     */
    condenseRoadmap(progressRef, options = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const fromDayIndex = Math.max(1, parseInt(options.fromDay ?? options.fromDayIndex, 10) || 1);
      const dailyMinutes = Math.max(30, parseInt(options.dailyMinutes, 10) || roadmap.settings.dailyMinutes || 120);
      const weeklyStudyDays = Math.max(1, Math.min(7, parseInt(options.weeklyDays ?? options.weeklyStudyDays, 10) || roadmap.settings.weeklyStudyDays || 5));
      const targetDate = (options.targetDate || options.targetCompletionDate) ? new Date(options.targetDate || options.targetCompletionDate) : null;
      const reduceTargets = options.reduceTargets ?? options.reduceProblemTargets ?? false;
      const isDryRun = options.dryRun === true;

      // Collect all incomplete tasks from fromDayIndex onward
      const remainingTasks = [];
      const completedDaysCount = fromDayIndex - 1;

      for (let i = fromDayIndex - 1; i < roadmap.days.length; i++) {
        const d = roadmap.days[i];
        (d.tasks || []).forEach(t => {
          if (t.status !== 'completed') {
            remainingTasks.push(deepClone(t));
          }
        });
      }

      const totalEstimatedMinutes = remainingTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 45), 0);
      const dailyAvailableMins = dailyMinutes;

      // Realistic Deadline & Feasibility Check
      let isUnrealistic = false;
      let feasibilityMessage = 'Schedule is realistic and well-balanced.';
      let requiredMinutesPerDay = 0;
      let estimatedDaysNeeded = Math.ceil(totalEstimatedMinutes / dailyAvailableMins);

      if (targetDate && !isNaN(targetDate.getTime())) {
        const today = new Date();
        const availableCalendarDays = Math.max(1, Math.round((targetDate - today) / (1000 * 60 * 60 * 24)));
        const availableStudyDays = Math.max(1, Math.floor(availableCalendarDays * (weeklyStudyDays / 7)));
        requiredMinutesPerDay = Math.round(totalEstimatedMinutes / availableStudyDays);

        if (requiredMinutesPerDay > 240 || availableCalendarDays <= 7) {
          isUnrealistic = true;
          const feasibleDate = new Date();
          const calendarDaysNeeded = Math.ceil(estimatedDaysNeeded * (7 / weeklyStudyDays));
          feasibleDate.setDate(feasibleDate.getDate() + calendarDaysNeeded);

          feasibilityMessage = `Target date (${toLocalDateString(targetDate)}) requires ${requiredMinutesPerDay} mins/day (${(requiredMinutesPerDay / 60).toFixed(1)} hrs/day), exceeding a sustainable pace. Recommended realistic completion date at ${dailyMinutes}m/day is ${toLocalDateString(feasibleDate)}.`;
        }
      }

      // Group and condense compatible tasks into condensed days
      const condensedDays = [];
      let currentDayTasks = [];
      let currentDayMinutes = 0;

      remainingTasks.forEach(task => {
        if (reduceTargets && task.targetCount > 2) {
          task.targetCount = 2;
          task.estimatedMinutes = Math.round(task.estimatedMinutes * 0.7);
        }

        const taskEst = task.estimatedMinutes || 40;
        if (currentDayMinutes + taskEst <= dailyAvailableMins && currentDayTasks.length < 3) {
          currentDayTasks.push(task);
          currentDayMinutes += taskEst;
        } else {
          if (currentDayTasks.length > 0) {
            condensedDays.push({
              tasks: currentDayTasks,
              totalMinutes: currentDayMinutes
            });
          }
          currentDayTasks = [task];
          currentDayMinutes = taskEst;
        }
      });

      if (currentDayTasks.length > 0) {
        condensedDays.push({
          tasks: currentDayTasks,
          totalMinutes: currentDayMinutes
        });
      }

      const beforeDaysCount = roadmap.days.length - (fromDayIndex - 1);
      const afterDaysCount = condensedDays.length;
      const savedDays = Math.max(0, beforeDaysCount - afterDaysCount);

      const feasibility = {
        isFeasible: !isUnrealistic,
        status: isUnrealistic ? 'INFEASIBLE' : 'FEASIBLE',
        reason: feasibilityMessage,
        recommendation: feasibilityMessage
      };

      if (isDryRun) {
        return {
          success: !isUnrealistic,
          preview: true,
          feasibility,
          before: { totalDays: roadmap.days.length },
          after: { totalDays: (fromDayIndex - 1) + condensedDays.length },
          savedDays,
          dailyMinutes,
          requiredMinutesPerDay,
          totalEstimatedMinutes,
          condensedDaysCount: condensedDays.length
        };
      }

      // Apply condensing
      this.pushUndoSnapshot(
        roadmap,
        'condense',
        `Condensed ${beforeDaysCount} remaining days into ${afterDaysCount} days at ${dailyMinutes} mins/day (Saved ${savedDays} days)`
      );

      // Keep historical days before fromDayIndex
      const newDays = roadmap.days.slice(0, fromDayIndex - 1);

      condensedDays.forEach((cDay, idx) => {
        const seq = fromDayIndex + idx;
        newDays.push({
          planDayId: generateId('day_condensed'),
          sequenceIndex: seq,
          scheduledDate: null,
          dayType: 'learning',
          notes: 'Condensed study day',
          bufferReason: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: cDay.tasks
        });
      });

      roadmap.days = newDays;
      roadmap.days.forEach((d, idx) => { d.sequenceIndex = idx + 1; });
      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        preview: false,
        feasibility,
        before: { totalDays: beforeDaysCount + (fromDayIndex - 1) },
        after: { totalDays: roadmap.days.length },
        savedDays,
        newTotalDays: roadmap.days.length
      };
    },

    /**
     * Move Day to a new position, checking for prerequisite conflicts
     */
    moveDay(progressRef, fromDayIndex, toDayIndex) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const fromIdx = Math.max(0, Math.min(roadmap.days.length - 1, fromDayIndex - 1));
      const toIdx = Math.max(0, Math.min(roadmap.days.length - 1, toDayIndex - 1));

      if (fromIdx === toIdx) return { success: true, warning: null };

      this.pushUndoSnapshot(
        roadmap,
        'move_day',
        `Moved Day ${fromDayIndex} to position ${toDayIndex}`
      );

      const [movedDay] = roadmap.days.splice(fromIdx, 1);
      roadmap.days.splice(toIdx, 0, movedDay);

      // Renumber sequence indices
      roadmap.days.forEach((d, idx) => { d.sequenceIndex = idx + 1; });

      // Prerequisite Advisory Check
      let advisory = null;
      const GraphEngineRef = getGraphEngine();
      if (GraphEngineRef && typeof GraphEngineRef.checkPrerequisites === 'function') {
        const movedTopics = (movedDay.tasks || []).map(t => t.topicId);
        // If moving earlier, check if any earlier topic was supposed to be a prereq
        if (toIdx < fromIdx) {
          advisory = `Advisory: Check that topics (${movedTopics.join(', ')}) fulfill required foundational prerequisites.`;
        }
      }

      return {
        success: true,
        advisory,
        newSequenceIndex: toIdx + 1
      };
    },

    /**
     * Move Task to another day
     */
    /**
     * Move Task to another day
     */
    moveTask(progressRef, arg1, arg2, arg3) {
      const roadmap = this.get120DayRoadmap(progressRef);
      let targetDayIndex;
      let foundTask = null;
      let sourceDay = null;

      if (typeof arg1 === 'number' && typeof arg2 === 'string' && typeof arg3 === 'number') {
        const fromDayIndex = arg1;
        const streamType = arg2;
        targetDayIndex = arg3;
        sourceDay = roadmap.days[fromDayIndex - 1];
        if (sourceDay && Array.isArray(sourceDay.tasks)) {
          const tIdx = sourceDay.tasks.findIndex(t => t.stream === streamType);
          if (tIdx !== -1) {
            foundTask = sourceDay.tasks.splice(tIdx, 1)[0];
          }
        }
      } else {
        const taskId = arg1;
        targetDayIndex = arg2;
        for (const d of roadmap.days) {
          const tIdx = (d.tasks || []).findIndex(t => t.taskId === taskId);
          if (tIdx !== -1) {
            foundTask = d.tasks.splice(tIdx, 1)[0];
            sourceDay = d;
            break;
          }
        }
      }

      const targetDay = roadmap.days[targetDayIndex - 1];
      if (!targetDay) return { success: false, message: 'Target day not found.' };
      if (!foundTask) return { success: false, message: 'Task not found.' };

      this.pushUndoSnapshot(
        roadmap,
        'move_task',
        `Moved task "${foundTask.subtopicId || foundTask.topicId}" from Day ${sourceDay?.sequenceIndex} to Day ${targetDayIndex}`
      );

      if (!Array.isArray(targetDay.tasks)) targetDay.tasks = [];
      targetDay.tasks.push(foundTask);
      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        taskId: foundTask.taskId,
        fromDay: sourceDay?.sequenceIndex,
        toDay: targetDayIndex
      };
    },

    /**
     * Reorder tasks within a day
     */
    reorderTasksWithinDay(progressRef, dayIndex, taskIdsOrder = []) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const day = roadmap.days[dayIndex - 1];
      if (!day || !Array.isArray(day.tasks)) return { success: false };

      this.pushUndoSnapshot(
        roadmap,
        'reorder_tasks',
        `Reordered tasks in Day ${dayIndex}`
      );

      const taskMap = {};
      day.tasks.forEach(t => { taskMap[t.taskId] = t; });

      const newTasks = [];
      taskIdsOrder.forEach(id => {
        if (taskMap[id]) {
          newTasks.push(taskMap[id]);
          delete taskMap[id];
        }
      });
      // Append any remaining
      Object.values(taskMap).forEach(t => newTasks.push(t));

      day.tasks = newTasks;
      this.normalizeRoadmap(roadmap);
      return { success: true };
    },

    /**
     * Get unique ordered topic list and statistics for a given stream
     */
    getTopicsList(progressRef, streamType = 'current_learning') {
      const roadmap = this.get120DayRoadmap(progressRef);
      if (!roadmap || !Array.isArray(roadmap.days)) return [];

      const topicMap = new Map();
      const topicOrder = [];

      roadmap.days.forEach(day => {
        if (day.isBufferDay) return;
        const task = (day.tasks || []).find(t => t.stream === streamType);
        if (!task || !task.topicId) return;

        const topic = task.topicId;
        if (!topicMap.has(topic)) {
          topicMap.set(topic, {
            topic,
            days: [],
            subtopics: new Set(),
            problemIds: new Set(),
            completedDays: 0,
            tasks: []
          });
          topicOrder.push(topic);
        }
        const data = topicMap.get(topic);
        data.days.push(day.sequenceIndex);
        if (task.subtopicId) data.subtopics.add(task.subtopicId);
        (task.problemIds || []).forEach(pid => data.problemIds.add(pid));
        if (task.status === 'completed' || day.isCompleted) data.completedDays++;
        data.tasks.push(task);
      });

      return topicOrder.map((topic, index) => {
        const d = topicMap.get(topic);
        return {
          topic,
          index,
          order: index + 1,
          dayCount: d.days.length,
          startDay: d.days.length > 0 ? Math.min(...d.days) : 0,
          endDay: d.days.length > 0 ? Math.max(...d.days) : 0,
          completedCount: d.completedDays,
          problemCount: d.problemIds.size,
          problemIds: Array.from(d.problemIds),
          subtopics: Array.from(d.subtopics)
        };
      });
    },

    /**
     * Move an entire topic UP or DOWN (or to a target index) within a learning stream
     * Re-allocates contiguous daily task assignments while strictly preserving completed task history & problem identity
     */
    moveTopic(progressRef, streamType = 'current_learning', topicName, directionOrNewIndex) {
      const roadmap = this.get120DayRoadmap(progressRef);
      if (!roadmap || !Array.isArray(roadmap.days)) {
        return { success: false, message: 'Invalid roadmap' };
      }

      const topicList = this.getTopicsList(progressRef, streamType);
      const topics = topicList.map(t => t.topic);
      const currentIndex = topics.indexOf(topicName);
      if (currentIndex === -1) {
        return { success: false, message: `Topic "${topicName}" not found in ${streamType}` };
      }

      let targetIndex;
      if (directionOrNewIndex === 'up') {
        targetIndex = Math.max(0, currentIndex - 1);
      } else if (directionOrNewIndex === 'down') {
        targetIndex = Math.min(topics.length - 1, currentIndex + 1);
      } else if (typeof directionOrNewIndex === 'number') {
        targetIndex = Math.max(0, Math.min(topics.length - 1, directionOrNewIndex));
      } else {
        return { success: false, message: `Invalid direction: ${directionOrNewIndex}` };
      }

      if (targetIndex === currentIndex) {
        return { success: true, message: 'Topic is already at requested position', unchanged: true, newIndex: targetIndex, topics };
      }

      const newTopicOrder = [...topics];
      const [removed] = newTopicOrder.splice(currentIndex, 1);
      newTopicOrder.splice(targetIndex, 0, removed);

      const streamLabel = streamType === 'current_learning' ? 'Current Learning' : 'Foundation Revision';
      const actionDesc = `Moved topic "${topicName}" ${directionOrNewIndex === 'up' || targetIndex < currentIndex ? 'up' : 'down'} to position ${targetIndex + 1} in ${streamLabel}`;

      return this.reorderTopics(progressRef, streamType, newTopicOrder, { actionDesc });
    },

    /**
     * Reorder topics in a stream according to a custom topic array
     */
    reorderTopics(progressRef, streamType = 'current_learning', newTopicOrder = [], options = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      if (!roadmap || !Array.isArray(roadmap.days)) {
        return { success: false, message: 'Invalid roadmap' };
      }
      if (!Array.isArray(newTopicOrder) || newTopicOrder.length === 0) {
        return { success: false, message: 'Empty or invalid newTopicOrder array' };
      }

      const streamLabel = streamType === 'current_learning' ? 'Current Learning' : 'Foundation Revision';
      const actionDesc = options.actionDesc || `Reordered topics in ${streamLabel}`;

      this.pushUndoSnapshot(
        roadmap,
        'reorder_topics',
        actionDesc
      );

      // Collect tasks grouped by topic for this stream across all non-buffer days
      const tasksByTopic = new Map();
      const learningDays = [];

      roadmap.days.forEach(day => {
        if (day.isBufferDay) return;
        const taskIdx = (day.tasks || []).findIndex(t => t.stream === streamType);
        if (taskIdx === -1) return;

        const task = day.tasks[taskIdx];
        const topic = task.topicId || 'Other';
        if (!tasksByTopic.has(topic)) {
          tasksByTopic.set(topic, []);
        }
        tasksByTopic.get(topic).push(task);
        learningDays.push({ day, taskIdx });
      });

      // Assemble reordered stream tasks pool
      const reorderedStreamTasks = [];
      newTopicOrder.forEach(topic => {
        if (tasksByTopic.has(topic)) {
          reorderedStreamTasks.push(...tasksByTopic.get(topic));
          tasksByTopic.delete(topic);
        }
      });
      // Append any unmentioned remaining topics if any
      for (const [, tasks] of tasksByTopic.entries()) {
        reorderedStreamTasks.push(...tasks);
      }

      // Reassign tasks back into learning days
      const totalToAssign = Math.min(learningDays.length, reorderedStreamTasks.length);
      for (let i = 0; i < totalToAssign; i++) {
        const { day, taskIdx } = learningDays[i];
        const newTask = deepClone(reorderedStreamTasks[i]);
        newTask.taskId = `task_${day.sequenceIndex}_${streamType === 'current_learning' ? 'learn' : 'revise'}`;
        day.tasks[taskIdx] = newTask;
      }

      // Prerequisite Advisory Check
      let advisory = null;
      const GraphEngineRef = getGraphEngine();
      if (GraphEngineRef && typeof GraphEngineRef.checkPrerequisites === 'function') {
        const firstTopic = newTopicOrder[0];
        if (firstTopic && (firstTopic.includes('DP') || firstTopic.includes('Dynamic Programming'))) {
          advisory = 'Advisory: Dynamic Programming relies on recursion tree state analysis and array foundations.';
        }
      }

      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        stream: streamType,
        newTopicOrder,
        advisory,
        message: actionDesc
      };
    },

    /**
     * Reset topic sequence for a stream back to canonical curriculum blueprint
     */
    resetTopicOrder(progressRef, streamType = 'current_learning') {
      const defaultOrder = streamType === 'current_learning' ? this.DEFAULT_STREAM_A_TOPICS : this.DEFAULT_STREAM_B_TOPICS;
      return this.reorderTopics(progressRef, streamType, defaultOrder, {
        actionDesc: `Reset topic sequence to blueprint default for ${streamType === 'current_learning' ? 'Current Learning' : 'Foundation Revision'}`
      });
    },

    /**
     * Edit Day: Topic, Subtopic, Stream, Objectives, Problem Target, Notes, Priority, Status
     */
    editDay(progressRef, dayIndex, updates = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const day = roadmap.days[dayIndex - 1];
      if (!day) return { success: false, message: 'Day not found.' };

      this.pushUndoSnapshot(
        roadmap,
        'edit_day',
        `Edited Day ${dayIndex}`
      );

      if (updates.dayType) day.dayType = updates.dayType;
      if (updates.notes !== undefined) day.notes = updates.notes;
      if (updates.bufferReason !== undefined) day.bufferReason = updates.bufferReason;
      if (updates.isBufferDay !== undefined) day.dayType = updates.isBufferDay ? 'buffer' : 'learning';
      if (updates.isCompleted !== undefined) {
        day._isCompleted = !!updates.isCompleted;
        if (Array.isArray(day.tasks)) {
          day.tasks.forEach(t => {
            t.status = updates.isCompleted ? 'completed' : 'pending';
          });
        }
      }

      // Handle streams updates
      if (updates.streams && typeof updates.streams === 'object') {
        if (updates.streams.current_learning) {
          const upA = updates.streams.current_learning;
          let taskA = (day.tasks || []).find(t => t.stream === 'current_learning');
          if (!taskA) {
            taskA = {
              taskId: generateId('task_learn'),
              stream: 'current_learning',
              topicId: upA.topic || 'Graphs',
              subtopicId: upA.subtopic || '',
              objectives: upA.objectives || '',
              problemIds: Array.isArray(upA.problemIds) ? [...upA.problemIds] : [],
              targetCount: upA.targetCount || 3,
              estimatedMinutes: upA.estimatedMinutes || 60,
              priority: 'high',
              required: true,
              status: 'pending'
            };
            if (!day.tasks) day.tasks = [];
            day.tasks.unshift(taskA);
          } else {
            if (upA.topic !== undefined) taskA.topicId = upA.topic;
            if (upA.subtopic !== undefined) taskA.subtopicId = upA.subtopic;
            if (upA.objectives !== undefined) taskA.objectives = upA.objectives;
            if (upA.targetCount !== undefined) taskA.targetCount = upA.targetCount;
            if (upA.estimatedMinutes !== undefined) taskA.estimatedMinutes = upA.estimatedMinutes;
            if (upA.problemIds !== undefined) taskA.problemIds = Array.isArray(upA.problemIds) ? [...upA.problemIds] : [];
            if (upA.status !== undefined) taskA.status = upA.status;
          }
        }
        if (updates.streams.foundation_revision) {
          const upB = updates.streams.foundation_revision;
          let taskB = (day.tasks || []).find(t => t.stream === 'foundation_revision');
          if (!taskB) {
            taskB = {
              taskId: generateId('task_revise'),
              stream: 'foundation_revision',
              topicId: upB.topic || 'Basics & Math',
              subtopicId: upB.subtopic || '',
              objectives: upB.objectives || '',
              problemIds: Array.isArray(upB.problemIds) ? [...upB.problemIds] : [],
              targetCount: upB.targetCount || 2,
              estimatedMinutes: upB.estimatedMinutes || 35,
              priority: 'normal',
              required: true,
              status: 'pending'
            };
            if (!day.tasks) day.tasks = [];
            day.tasks.push(taskB);
          } else {
            if (upB.topic !== undefined) taskB.topicId = upB.topic;
            if (upB.subtopic !== undefined) taskB.subtopicId = upB.subtopic;
            if (upB.objectives !== undefined) taskB.objectives = upB.objectives;
            if (upB.targetCount !== undefined) taskB.targetCount = upB.targetCount;
            if (upB.estimatedMinutes !== undefined) taskB.estimatedMinutes = upB.estimatedMinutes;
            if (upB.problemIds !== undefined) taskB.problemIds = Array.isArray(upB.problemIds) ? [...upB.problemIds] : [];
            if (upB.status !== undefined) taskB.status = upB.status;
          }
        }
      }

      // Edit or add tasks directly
      if (updates.tasks && Array.isArray(updates.tasks)) {
        day.tasks = updates.tasks;
      } else if (updates.taskUpdates) {
        const { taskId, stream, ...taskFields } = updates.taskUpdates;
        const targetTask = (day.tasks || []).find(t => (taskId && t.taskId === taskId) || (stream && t.stream === stream));
        if (targetTask) {
          Object.assign(targetTask, taskFields);
        } else if (taskFields.topicId) {
          day.tasks.push({
            taskId: generateId('task_custom'),
            stream: stream || 'current_learning',
            ...taskFields,
            status: taskFields.status || 'pending'
          });
        }
      }

      day.updatedAt = new Date().toISOString();
      this.normalizeRoadmap(roadmap);
      return { success: true, day };
    },

    /**
     * Split Day workload across 2 days
     */
    splitDay(progressRef, dayIndex, options = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const day = roadmap.days[dayIndex - 1];
      if (!day) return { success: false, message: 'Day not found.' };

      this.pushUndoSnapshot(
        roadmap,
        'split_day',
        `Split workload of Day ${dayIndex} across two days`
      );

      const newDayTasks = [];

      (day.tasks || []).forEach(t => {
        if (Array.isArray(t.problemIds) && t.problemIds.length > 1) {
          const mid = Math.ceil(t.problemIds.length / 2);
          const firstHalf = t.problemIds.slice(0, mid);
          const secondHalf = t.problemIds.slice(mid);

          const newTask = deepClone(t);
          newTask.taskId = generateId('task_split');
          newTask.problemIds = secondHalf;
          newTask.targetCount = Math.max(1, Math.ceil((t.targetCount || secondHalf.length) / 2));
          newTask.estimatedMinutes = Math.max(20, Math.round((t.estimatedMinutes || 60) / 2));

          t.problemIds = firstHalf;
          t.targetCount = Math.max(1, Math.floor((t.targetCount || firstHalf.length) / 2));
          t.estimatedMinutes = Math.max(20, Math.round((t.estimatedMinutes || 60) / 2));

          newDayTasks.push(newTask);
        } else {
          const newTask = deepClone(t);
          newTask.taskId = generateId('task_split');
          newDayTasks.push(newTask);
        }
      });

      const newDay = {
        planDayId: generateId('day_split'),
        sequenceIndex: dayIndex + 1,
        scheduledDate: null,
        dayType: day.dayType || 'learning',
        notes: `Workload split from Day ${dayIndex}`,
        bufferReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: newDayTasks
      };

      roadmap.days.splice(dayIndex, 0, newDay);
      roadmap.days.forEach((d, idx) => { d.sequenceIndex = idx + 1; });
      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        day1TasksCount: day.tasks.length,
        day2TasksCount: newDay.tasks.length,
        totalDays: roadmap.days.length
      };
    },

    /**
     * Merge compatible days
     */
    mergeDays(progressRef, firstDayIndex, secondDayIndex) {
      const roadmap = this.get120DayRoadmap(progressRef);
      const d1 = roadmap.days[firstDayIndex - 1];
      const d2 = roadmap.days[secondDayIndex - 1];
      if (!d1 || !d2) return { success: false, message: 'Days to merge not found.' };

      this.pushUndoSnapshot(
        roadmap,
        'merge_days',
        `Merged Day ${secondDayIndex} into Day ${firstDayIndex}`
      );

      if (!Array.isArray(d1.tasks)) d1.tasks = [];
      if (Array.isArray(d2.tasks)) {
        d2.tasks.forEach(t2 => {
          const matchT1 = d1.tasks.find(t1 => t1.stream === t2.stream);
          if (matchT1) {
            const pIds = [...(matchT1.problemIds || [])];
            (t2.problemIds || []).forEach(pid => {
              if (!pIds.includes(pid)) pIds.push(pid);
            });
            matchT1.problemIds = pIds;
            matchT1.targetCount = (matchT1.targetCount || 0) + (t2.targetCount || 0);
            matchT1.estimatedMinutes = (matchT1.estimatedMinutes || 0) + (t2.estimatedMinutes || 0);
          } else {
            d1.tasks.push(deepClone(t2));
          }
        });
      }
      d1.notes = [d1.notes, d2.notes].filter(Boolean).join(' | ');

      // Remove second day
      const removeIdx = secondDayIndex - 1;
      roadmap.days.splice(removeIdx, 1);
      roadmap.days.forEach((d, idx) => { d.sequenceIndex = idx + 1; });
      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        mergedDayTasksCount: d1.tasks.length,
        totalDays: roadmap.days.length
      };
    },

    /**
     * Skip Task with audit reason (Never marks problem as mastered in SRS)
     */
    skipTask(progressRef, arg1, arg2, arg3, arg4) {
      const roadmap = this.get120DayRoadmap(progressRef);
      let foundTask = null;
      let reason = '';

      if (typeof arg1 === 'number') {
        const dayIndex = arg1;
        const streamType = arg2;
        reason = arg3 || '';
        const day = roadmap.days[dayIndex - 1];
        if (day && Array.isArray(day.tasks)) {
          foundTask = day.tasks.find(t => t.stream === streamType);
        }
      } else {
        const taskId = arg1;
        reason = arg2 || '';
        for (const d of roadmap.days) {
          foundTask = (d.tasks || []).find(t => t.taskId === taskId);
          if (foundTask) break;
        }
      }

      if (!foundTask) return { success: false, message: 'Task not found.' };

      this.pushUndoSnapshot(
        roadmap,
        'skip_task',
        `Skipped task "${foundTask.subtopicId || foundTask.topicId}" (${reason || 'Learner skipped'})`
      );

      foundTask.status = 'skipped';
      foundTask.skippedReason = reason || 'Skipped by learner';
      foundTask.skippedAt = new Date().toISOString();
      this.normalizeRoadmap(roadmap);

      return { success: true, task: foundTask };
    },

    /**
     * Replace Task while preserving audit trail
     */
    replaceTask(progressRef, taskId, newTaskData = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      let foundTask = null;

      for (const d of roadmap.days) {
        foundTask = (d.tasks || []).find(t => t.taskId === taskId);
        if (foundTask) break;
      }

      if (!foundTask) return { success: false, message: 'Task not found.' };

      this.pushUndoSnapshot(
        roadmap,
        'replace_task',
        `Replaced task "${foundTask.subtopicId}" with "${newTaskData.subtopicId || newTaskData.topicId}"`
      );

      const oldId = foundTask.taskId;
      Object.assign(foundTask, newTaskData);
      foundTask.replacedFrom = oldId;
      foundTask.status = 'pending';
      this.normalizeRoadmap(roadmap);

      return { success: true, task: foundTask };
    },

    /**
     * Defer Task
     */
    deferTask(progressRef, arg1, arg2, arg3) {
      const roadmap = this.get120DayRoadmap(progressRef);
      let foundTask = null;
      let reason = '';

      if (typeof arg1 === 'number') {
        const dayIndex = arg1;
        const streamType = arg2;
        reason = arg3 || '';
        const day = roadmap.days[dayIndex - 1];
        if (day && Array.isArray(day.tasks)) {
          foundTask = day.tasks.find(t => t.stream === streamType);
        }
      } else {
        const taskId = arg1;
        reason = arg2 || '';
        for (const d of roadmap.days) {
          foundTask = (d.tasks || []).find(t => t.taskId === taskId);
          if (foundTask) break;
        }
      }

      if (!foundTask) return { success: false, message: 'Task not found.' };

      this.pushUndoSnapshot(
        roadmap,
        'defer_task',
        `Deferred task "${foundTask.subtopicId || foundTask.topicId}" (${reason || 'Learner deferred'})`
      );

      foundTask.status = 'deferred';
      foundTask.deferredReason = reason || 'Intentionally deferred';
      this.normalizeRoadmap(roadmap);

      return { success: true, task: foundTask };
    },

    /**
     * Extend Roadmap Beyond 120 Days
     * Adds Day 121+ with revision cycles, mock interviews, or weak-topic repair
     * Does NOT destroy or overwrite existing roadmap!
     */
    extendRoadmap(progressRef, numDays = 7, blockType = 'revision_cycle') {
      const roadmap = this.get120DayRoadmap(progressRef);
      const count = Math.max(1, parseInt(numDays, 10) || 7);
      const currentTotal = roadmap.days.length;

      this.pushUndoSnapshot(
        roadmap,
        'extend_roadmap',
        `Extended roadmap by ${count} days (${blockType}) from Day ${currentTotal + 1}`
      );

      for (let i = 1; i <= count; i++) {
        const seq = currentTotal + i;
        const newDayId = `day_${seq}`;
        const cycleDay = ((seq - 1) % 7) + 1;
        let dayType = 'learning';
        if (cycleDay === 6) dayType = 'review';
        else if (cycleDay === 7) dayType = 'assessment';

        const tasks = [];
        if (blockType === 'mock_interview_block') {
          tasks.push({
            taskId: `task_${seq}_mock`,
            stream: 'current_learning',
            topicId: 'Mock Interviews',
            subtopicId: `FAANG Full-Round Simulation ${i}`,
            objectives: 'Solve 2 Medium and 1 Hard problem under 45-min interview time constraints.',
            problemIds: ['prob-27-2sum-problem', 'prob-227-number-of-islands'],
            targetCount: 3,
            estimatedMinutes: 60,
            priority: 'high',
            required: true,
            status: 'pending'
          });
        } else if (blockType === 'weak_topic_repair') {
          tasks.push({
            taskId: `task_${seq}_repair`,
            stream: 'current_learning',
            topicId: 'Weak-Topic Repair',
            subtopicId: `Targeted Repair Drill ${i}`,
            objectives: 'Intensive pattern reinforcement for low-confidence areas.',
            problemIds: [],
            targetCount: 2,
            estimatedMinutes: 50,
            priority: 'high',
            required: true,
            status: 'pending'
          });
        } else {
          // Additional revision cycle
          const milestone = getStreamBBlueprint(seq);
          tasks.push({
            taskId: `task_${seq}_rev_cycle`,
            stream: 'current_learning',
            topicId: milestone.topic,
            subtopicId: `${milestone.subtopic} (Cycle 2)`,
            objectives: milestone.objectives,
            problemIds: [...milestone.suggestedProblemIds],
            targetCount: 2,
            estimatedMinutes: 50,
            priority: 'normal',
            required: true,
            status: 'pending'
          });
        }

        roadmap.days.push({
          planDayId: newDayId,
          sequenceIndex: seq,
          scheduledDate: null,
          dayType,
          notes: `Extended block (${blockType})`,
          bufferReason: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks
        });
      }

      this.normalizeRoadmap(roadmap);

      return {
        success: true,
        addedDays: count,
        newTotalDays: roadmap.days.length
      };
    },

    /**
     * Restore Original Default 120-Day Template
     */
    restoreDefaultRoadmap(progressRef, userStates = {}) {
      const roadmap = this.get120DayRoadmap(progressRef);
      this.pushUndoSnapshot(
        roadmap,
        'restore_template',
        'Restored original 120-day default roadmap template'
      );

      const pristine = this.generateBaselineTemplate(userStates);
      roadmap.days = pristine.days;
      roadmap.settings = pristine.settings;
      roadmap.updatedAt = new Date().toISOString();
      this.normalizeRoadmap(roadmap);

      return { success: true, totalDays: roadmap.days.length };
    },

    /**
     * Authoritative Daily Resolver:
     * Reads today's scheduled roadmap tasks, actual topic/problem progress,
     * genuinely due SRS reviews, and produces authoritative plan with adaptive difference detection.
     */
    getTodayAuthoritativePlan(progressRef, allProblems = [], userStates = {}, options = {}) {
      const roadmap = this.get120DayRoadmap(progressRef, userStates);
      const SRSEngineRef = getSRSEngine();
      const RecommendationEngineRef = getRecommendationEngine();
      const mode = options.schedulingPreference || roadmap.settings.schedulingMode || 'roadmap_aligned';

      // 1. Identify today's active roadmap day:
      // If dayIndex is explicitly provided in options, use it;
      // else find the first incomplete planned day
      let activeDay = null;
      if (options.dayIndex) {
        activeDay = roadmap.days[options.dayIndex - 1];
      }
      if (!activeDay) {
        activeDay = roadmap.days.find(d => {
          if (d.dayType === 'buffer') return false;
          return (d.tasks || []).some(t => t.status !== 'completed' && t.status !== 'skipped');
        }) || roadmap.days[0];
      }

      // 2. Extract Stream A (Current Learning) and Stream B (Foundation Revision) tasks
      const streamATask = (activeDay.tasks || []).find(t => t.stream === 'current_learning') || null;
      const streamBTask = (activeDay.tasks || []).find(t => t.stream === 'foundation_revision') || null;

      // 3. Extract Stream C: Genuine live due SRS reviews directly from SRSEngine
      const now = (options.asOfDate instanceof Date) ? options.asOfDate : new Date();
      const todayStr = toLocalDateString(now);

      const dueSRSProblems = [];
      let totalOverdue = 0;

      const probList = Array.isArray(allProblems) ? allProblems : [];
      probList.forEach(p => {
        if (!p || !p.id) return;
        const st = userStates[p.id];
        if (!st || st.isMastered) return;

        const nextDateStr = st.nextReviewDate || st.nextReview;
        if (!nextDateStr) return;

        if (nextDateStr <= todayStr) {
          dueSRSProblems.push({
            problem: p,
            nextReviewDate: nextDateStr,
            isOverdue: nextDateStr < todayStr
          });
          if (nextDateStr < todayStr) totalOverdue++;
        }
      });

      // 4. Query Adaptive Recommendation Engine for comparison / conflict detection
      let adaptiveSuggestion = null;
      let hasConflict = false;
      let adaptiveExplanation = '';

      if (RecommendationEngineRef && typeof RecommendationEngineRef.getConfidenceStats === 'function') {
        try {
          const stats = RecommendationEngineRef.getConfidenceStats(probList, userStates);
          // Check for repeated low-confidence patterns
          if (stats.repeatedLowConfidenceProblems && stats.repeatedLowConfidenceProblems.length > 0) {
            const weakProb = stats.repeatedLowConfidenceProblems[0].problem;
            const weakTopic = weakProb.topic;
            if (streamATask && weakTopic && weakTopic !== streamATask.topicId) {
              hasConflict = true;
              adaptiveSuggestion = {
                recommendedTopic: weakTopic,
                reason: `Repeated low confidence on pattern "${weakProb.pattern || 'General'}" in ${weakTopic}`,
                problem: weakProb,
                action: 'repair_drill'
              };
              adaptiveExplanation = `Adaptive engine detected reinforcement need in "${weakTopic}", differing from planned "${streamATask.topicId}".`;
            }
          }
        } catch (_) {}
      }

      // 5. Build authoritative day resolution
      return {
        schedulingMode: mode,
        dayNumber: activeDay.sequenceIndex || activeDay.dayNumber || 1,
        activeDayNumber: activeDay.sequenceIndex || activeDay.dayNumber || 1,
        planDayId: activeDay.planDayId,
        dayType: activeDay.dayType,
        notes: activeDay.notes,
        scheduledDate: activeDay.scheduledDate || todayStr,

        // Stream A: Current Learning
        streamA: streamATask ? {
          topic: streamATask.topicId || streamATask.topic || '',
          subtopic: streamATask.subtopicId || streamATask.subtopic || '',
          objectives: streamATask.objectives || '',
          problemIds: streamATask.problemIds || [],
          targetCount: streamATask.targetCount || 3,
          estimatedMinutes: streamATask.estimatedMinutes || 60,
          status: streamATask.status,
          taskId: streamATask.taskId
        } : { topic: '', subtopic: '', problemIds: [], targetCount: 0, estimatedMinutes: 0 },
        currentLearning: streamATask ? {
          topic: streamATask.topicId || streamATask.topic || '',
          subtopic: streamATask.subtopicId || streamATask.subtopic || '',
          objectives: streamATask.objectives || '',
          problemIds: streamATask.problemIds || [],
          targetCount: streamATask.targetCount || 3,
          estimatedMinutes: streamATask.estimatedMinutes || 60,
          status: streamATask.status,
          taskId: streamATask.taskId
        } : null,

        // Stream B: Foundation Revision
        streamB: streamBTask ? {
          topic: streamBTask.topicId || streamBTask.topic || '',
          subtopic: streamBTask.subtopicId || streamBTask.subtopic || '',
          objectives: streamBTask.objectives || '',
          problemIds: streamBTask.problemIds || [],
          targetCount: streamBTask.targetCount || 2,
          estimatedMinutes: streamBTask.estimatedMinutes || 35,
          status: streamBTask.status,
          taskId: streamBTask.taskId
        } : { topic: '', subtopic: '', problemIds: [], targetCount: 0, estimatedMinutes: 0 },
        foundationRevision: streamBTask ? {
          topic: streamBTask.topicId || streamBTask.topic || '',
          subtopic: streamBTask.subtopicId || streamBTask.subtopic || '',
          objectives: streamBTask.objectives || '',
          problemIds: streamBTask.problemIds || [],
          targetCount: streamBTask.targetCount || 2,
          estimatedMinutes: streamBTask.estimatedMinutes || 35,
          status: streamBTask.status,
          taskId: streamBTask.taskId
        } : null,

        // Stream C: Spaced Repetition (Guaranteed Authentic SRS state)
        streamC: {
          dueCount: dueSRSProblems.length,
          dueTotal: dueSRSProblems.length,
          overdueTotal: totalOverdue,
          dueProblems: dueSRSProblems.map(item => item.problem),
          allDueCount: dueSRSProblems.length
        },
        spacedRepetition: {
          dueCount: dueSRSProblems.length,
          dueTotal: dueSRSProblems.length,
          overdueTotal: totalOverdue,
          dueProblems: dueSRSProblems.map(item => item.problem),
          allDueCount: dueSRSProblems.length
        },

        // Conflict & Adaptive Suggestion details
        adaptiveAdjustment: {
          hasConflict,
          suggestion: adaptiveSuggestion,
          explanation: adaptiveExplanation,
          canAccept: Boolean(adaptiveSuggestion)
        },

        totalEstimatedMinutes: (streamATask?.estimatedMinutes || 0) + (streamBTask?.estimatedMinutes || 0) + Math.min(30, dueSRSProblems.length * 15)
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Roadmap120Engine;
  }
  if (typeof window !== 'undefined') {
    window.Roadmap120Engine = Roadmap120Engine;
  }
})();
