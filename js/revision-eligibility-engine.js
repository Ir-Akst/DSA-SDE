/**
 * AlgoRecall Ã¢â‚¬â€ RevisionEligibilityEngine
 * js/revision-eligibility-engine.js
 *
 * PURPOSE
 * -------
 * Determines which topics are genuinely eligible for Stream B (Planned Topic Revision)
 * based on the learner's actual attempt history and curriculum position.
 *
 * CORE RULES
 * ----------
 * 1. A topic is eligible for Stream B revision only if the learner has at least one
 *    recorded attempt (userStates[id].lastReviewed) for a problem in that topic.
 * 2. Beginners with zero history receive empty Stream B slots with explanation.
 * 3. Problems currently due in SRS are excluded from Stream B assignments that day
 *    (prevents double-assignment without cancelling SRS obligations).
 * 4. Completing Stream B does NOT advance SRS state Ã¢â‚¬â€ only LearningOrchestrator.recordAttempt() does.
 * 5. Topic revision completion does NOT advance Stream A curriculum position.
 *
 * INTEGRATION
 * -----------
 * Called by Roadmap120Engine.generateBaselineTemplate() and by getTodayAuthoritativePlan()
 * to supply live-computed Stream B problem lists.
 *
 * Schema v8 Ã¢â‚¬â€ Dual-Stream Connected Mode
 */

(function () {
  'use strict';

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Topic Order for Stream B Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // This is the CANONICAL revision order. Actual assignments are gated by eligibility.
  const STREAM_B_TOPIC_ORDER = [
    'Arrays & Hashing',
    'Binary Search',
    'Linked List',
    'Stack & Queue',
    'Heap / Priority Queue',
    'Recursion & Backtracking',
    'Mixed Weak Topics',
    'Basics & Math',
    'Sorting',
    'Strings',
    'Sliding Window & Two Pointers',
    'Bit Manipulation',
    'Binary Trees & BST',
    'Graphs',
    'Dynamic Programming',
    'Greedy & Intervals',
    'Tries'
  ];

  // Canonical difficulty weight for problem selection
  const DIFFICULTY_WEIGHT = { Easy: 1, Medium: 2, Hard: 3 };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  function canonicalizeTopic(topic) {
    if (!topic) return 'Basics & Math';
    const t = topic.trim().toLowerCase();
    if (t.includes('backtrack') || t.includes('recursion')) return 'Recursion & Backtracking';
    if (t.includes('heap') || t.includes('priority')) return 'Heap / Priority Queue';
    if (t === 'stack' || t === 'queue' || t.includes('stack') || t.includes('queue')) return 'Stack & Queue';
    if (t.includes('sliding') || t.includes('two pointer') || t.includes('pointer')) return 'Sliding Window & Two Pointers';
    if (t.includes('tree') || t.includes('bst')) return 'Binary Trees & BST';
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
  }

  // Returns true if the problem state contains any evidence of a prior attempt
  // (lastReviewed, SRS stage >= 1, or lastConfidence set)
  function hasEvidence(st) {
    if (!st) return false;
    // Genuine attempt evidence: explicit lastReviewed timestamp or user confidence score
    if (st.lastReviewed) return true;
    if (typeof st.lastConfidence === 'number' || typeof st.confidence === 'number') return true;
    // stage >= 1 alone without review timestamp/rating could be default initialization
    if (st.stage && st.stage >= 1 && (st.lastReviewed || st.lastRating || st.solved || st.status === 'completed')) return true;
    return false;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Core API Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const RevisionEligibilityEngine = {

    STREAM_B_TOPIC_ORDER,

    /**
     * Determine which topics are eligible for revision based on learner history.
     *
     * A topic is eligible if the learner has at least one recorded attempt
     * (userStates[id].lastReviewed is set) for any problem in that topic.
     *
     * @param {Object} userStates - Map of problemId Ã¢â€ â€™ state
     * @param {Array}  allProblems - Full catalog
     * @returns {Object} topicEligibility map: topicName Ã¢â€ â€™ { eligible, attemptCount, solvedCount, problemIds }
     */
    getEligibleTopics(userStates = {}, allProblems = []) {
      const eligibility = {};

      // Initialize all topics as ineligible
      STREAM_B_TOPIC_ORDER.forEach(topic => {
        eligibility[topic] = {
          topic,
          eligible: false,
          attemptCount: 0,
          solvedCount: 0,
          masteredCount: 0,
          problemIds: [],
          attemptedProblemIds: [],
          overdueProblemIds: [],
          avgStage: 0,
          avgConfidence: 0
        };
      });

      // Scan learner history
      allProblems.forEach(p => {
        if (!p || !p.id) return;
        const topic = canonicalizeTopic(p.topic);
        if (!eligibility[topic]) {
          eligibility[topic] = {
            topic, eligible: false, attemptCount: 0, solvedCount: 0,
            masteredCount: 0, problemIds: [], attemptedProblemIds: [],
            overdueProblemIds: [], avgStage: 0, avgConfidence: 0
          };
        }

        const bucket = eligibility[topic];
        bucket.problemIds.push(p.id);

        const st = userStates[p.id];
        if (hasEvidence(st)) {
          bucket.eligible = true;
          bucket.attemptCount++;
          if (st.solved || (st.stage && st.stage >= 2)) bucket.solvedCount++;
          if (st.isMastered) bucket.masteredCount++;

          bucket.attemptedProblemIds.push(p.id);

          // Check overdue
          if (st.nextReviewDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nrd = new Date(st.nextReviewDate);
            if (nrd < today && !st.isMastered) {
              bucket.overdueProblemIds.push(p.id);
            }
          }
        }
      });

      // Compute averages for each eligible topic
      Object.values(eligibility).forEach(bucket => {
        if (bucket.attemptedProblemIds.length === 0) return;
        let stageSum = 0, confSum = 0, confCount = 0;
        bucket.attemptedProblemIds.forEach(id => {
          const st = userStates[id];
          if (!st) return;
          stageSum += (st.stage || 1);
          if (typeof st.confidence === 'number') {
            confSum += st.confidence;
            confCount++;
          } else if (st.lastRating) {
            const r = st.lastRating;
            confSum += (r === 'simple' ? 4 : r === 'medium' ? 3 : r === 'hard' ? 2 : 1);
            confCount++;
          }
        });
        bucket.avgStage = stageSum / bucket.attemptedProblemIds.length;
        bucket.avgConfidence = confCount > 0 ? confSum / confCount : 3;
      });

      return eligibility;
    },

    /**
     * Select the best revision problems for a given topic and day.
     *
     * Priority:
     *  1. Previously attempted problems that are NOT due in SRS today
     *  2. Low-confidence attempted problems (confidence Ã¢â€°Â¤ 2) Ã¢â‚¬â€ instability signals
     *  3. Medium-difficulty representative unreviewed problems (introduce if count < 2)
     *
     * Never assigns a problem that is in dueSRSIds (those belong to SRS stream exclusively that day).
     *
     * @param {string} topic
     * @param {Object} userStates
     * @param {Array}  allProblems
     * @param {Set}    dueSRSIds - problem IDs already due in SRS today (excluded from Stream B)
     * @param {number} targetCount - how many problems to select (default 2)
     * @returns {Array} selected problem objects with selectionReason
     */
    selectRevisionProblems(topic, userStates = {}, allProblems = [], dueSRSIds = new Set(), targetCount = 2) {
      const canonTopic = canonicalizeTopic(topic);
      const topicProblems = allProblems.filter(p => canonicalizeTopic(p.topic) === canonTopic);

      if (topicProblems.length === 0) return [];

      const selected = [];
      const selectedIds = new Set();

      const addIfRoom = (p, reason) => {
        if (selected.length >= targetCount) return false;
        if (selectedIds.has(p.id)) return false;
        if (dueSRSIds.has(p.id)) return false; // SRS conflict guard
        selected.push({ ...p, selectionReason: reason });
        selectedIds.add(p.id);
        return true;
      };

      // Pass 1: Low-confidence attempted problems (instability Ã¢â€ â€™ highest revision priority)
      const unstable = topicProblems
        .filter(p => {
          const st = userStates[p.id];
          if (!hasEvidence(st)) return false;
          if (dueSRSIds.has(p.id)) return false;
          const conf = typeof st.confidence === 'number' ? st.confidence :
            (st.lastRating === 'failed' ? 1 : st.lastRating === 'hard' ? 2 : 3);
          return conf <= 2 || st.lastRating === 'failed';
        })
        .sort((a, b) => {
          const confA = (userStates[a.id]?.confidence || 2);
          const confB = (userStates[b.id]?.confidence || 2);
          return confA - confB; // lowest confidence first
        });

      unstable.forEach(p => addIfRoom(p, `Low confidence (${userStates[p.id]?.lastRating || 'failed'}) Ã¢â‚¬â€ needs reinforcement`));

      // Pass 2: Previously attempted but SRS interval expired (overdue but not in today's SRS queue)
      if (selected.length < targetCount) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdue = topicProblems
          .filter(p => {
            if (dueSRSIds.has(p.id) || selectedIds.has(p.id)) return false;
            const st = userStates[p.id];
            if (!st || !st.lastReviewed || !st.nextReviewDate) return false;
            const nrd = new Date(st.nextReviewDate);
            return nrd < today && !st.isMastered;
          })
          .sort((a, b) => new Date(userStates[a.id].nextReviewDate) - new Date(userStates[b.id].nextReviewDate));

        overdue.forEach(p => addIfRoom(p, `Overdue SRS Ã¢â‚¬â€ topic revision reinforcement`));
      }

      // Pass 3: Attempted problems with low stage depth (not yet solidified)
      if (selected.length < targetCount) {
        const lowStage = topicProblems
          .filter(p => {
            if (dueSRSIds.has(p.id) || selectedIds.has(p.id)) return false;
            const st = userStates[p.id];
            return hasEvidence(st) && (st.stage || 0) <= 2;
          })
          .sort((a, b) => (userStates[a.id]?.stage || 0) - (userStates[b.id]?.stage || 0));

        lowStage.forEach(p => addIfRoom(p, `Early stage retention (Stage ${userStates[p.id]?.stage || 1}) Ã¢â‚¬â€ pattern solidification`));
      }

      // Pass 4: Representative unsolved medium-difficulty problems (only if topic has some history)
      // Guard: never assign problems from a topic with zero learner history (beginner guard)
      const hasAnyHistory = topicProblems.some(p => hasEvidence(userStates[p.id]));
      if (selected.length < targetCount && hasAnyHistory) {
        const representative = topicProblems
          .filter(p => {
            if (dueSRSIds.has(p.id) || selectedIds.has(p.id)) return false;
            const st = userStates[p.id];
            return !hasEvidence(st); // never attempted
          })
          .sort((a, b) => {
            // Prefer Medium > Easy > Hard for representative practice
            const wa = a.difficulty === 'Medium' ? 0 : a.difficulty === 'Easy' ? 1 : 2;
            const wb = b.difficulty === 'Medium' ? 0 : b.difficulty === 'Easy' ? 1 : 2;
            return wa - wb;
          });

        representative.forEach(p => addIfRoom(p, `Representative problem Ã¢â‚¬â€ topic breadth expansion`));
      }

      return selected.slice(0, targetCount);
    },

    /**
     * Compute the Stream B assignment for a specific day given learner state.
     * Returns a full Stream B task object ready to be embedded in a roadmap day.
     *
     * @param {number} dayNumber - 1..120
     * @param {Object} userStates
     * @param {Array}  allProblems
     * @param {Set}    dueSRSIds - SRS-due problem IDs for this day (excluded from B)
     * @param {Object} plannedBlueprint - base blueprint from EXACT_STREAM_B_120[dayNumber-1]
     * @returns {Object} Stream B task object
     */
    computeStreamBTask(dayNumber, userStates = {}, allProblems = [], dueSRSIds = new Set(), plannedBlueprint = null) {
      const eligibility = this.getEligibleTopics(userStates, allProblems);
      const eligibleTopics = Object.values(eligibility).filter(e => e.eligible);

      // Determine the planned topic for this day from blueprint
      const blueprint = plannedBlueprint || { topic: 'Basics & Math', subtopic: 'Foundation Review', estimatedMinutes: 30 };
      const plannedTopic = canonicalizeTopic(blueprint.topic);

      // Check if the planned topic is eligible
      const plannedEligible = eligibility[plannedTopic]?.eligible === true;

      // If planned topic is eligible, use it; otherwise find best eligible alternative
      let selectedTopic = null;
      let selectionReason = '';

      if (plannedEligible) {
        selectedTopic = plannedTopic;
        selectionReason = `Scheduled topic for Day ${dayNumber}`;
      } else if (eligibleTopics.length > 0) {
        // Find the best eligible topic using retention heuristics:
        // Prefer topics with low avgConfidence or high overdue count
        const scored = eligibleTopics.map(e => {
          const urgencyScore = e.overdueProblemIds.length * 3 +
            (e.avgConfidence <= 2 ? 5 : 0) +
            (e.avgStage <= 1.5 ? 3 : 0);
          return { ...e, urgencyScore };
        }).sort((a, b) => b.urgencyScore - a.urgencyScore);

        selectedTopic = scored[0].topic;
        selectionReason = scored[0].urgencyScore > 0
          ? `Substituted: "${plannedTopic}" not yet learned Ã¢â‚¬â€ revising "${selectedTopic}" (retention urgency)`
          : `Substituted: "${plannedTopic}" not yet learned Ã¢â‚¬â€ revising "${selectedTopic}" from prior learning`;
      }

      // If no eligible topic at all Ã¢â€ â€™ empty Stream B slot
      if (!selectedTopic) {
        return {
          taskId: `task_${dayNumber}_revise`,
          stream: 'foundation_revision',
          topicId: '',
          subtopicId: '',
          objectives: '',
          problemIds: [],
          targetCount: 0,
          estimatedMinutes: 0,
          priority: 'optional',
          required: false,
          empty: true,
          emptyReason: dayNumber <= 3
            ? 'Stream B starts empty for new learners Ã¢â‚¬â€ no topics learned yet. Complete Stream A first.'
            : `No eligible revision topics yet. Complete more Stream A topics to unlock revision.`,
          consolidationSuggestion: 'Use this time to re-read today\'s Stream A problem solution, understand patterns, or preview tomorrow\'s topic.',
          prerequisites: [],
          status: 'optional',
          skippedReason: null,
          skippedAt: null,
          replacedFrom: null,
          eligibilityBased: true,
          revisionReason: null
        };
      }

      // Select revision problems for this topic
      const problems = this.selectRevisionProblems(
        selectedTopic,
        userStates,
        allProblems,
        dueSRSIds,
        blueprint.targetCount || 2
      );

      const topicData = eligibility[selectedTopic] || {};

      return {
        taskId: `task_${dayNumber}_revise`,
        stream: 'foundation_revision',
        topicId: selectedTopic,
        subtopicId: blueprint.subtopic || `${selectedTopic} Ã¢â‚¬â€ Pattern Recall`,
        objectives: blueprint.objectives ||
          `Rapid recall and pattern reinforcement for ${selectedTopic}. ` +
          `Focus on approach clarity and complexity tradeoffs.`,
        problemIds: problems.map(p => p.id),
        problemDetails: problems,
        targetCount: Math.max(1, problems.length),
        estimatedMinutes: Math.max(20, problems.length * 15),
        priority: 'normal',
        required: false,
        empty: false,
        emptyReason: null,
        prerequisites: [],
        status: 'pending',
        skippedReason: null,
        skippedAt: null,
        replacedFrom: null,
        eligibilityBased: true,
        revisionReason: selectionReason,
        topicStats: {
          attemptCount: topicData.attemptCount || 0,
          solvedCount: topicData.solvedCount || 0,
          overdueProblemIds: topicData.overdueProblemIds || [],
          avgStage: topicData.avgStage || 0,
          avgConfidence: topicData.avgConfidence || 0
        }
      };
    },

    /**
     * Get due SRS problem IDs for today.
     * Used to exclude them from Stream B assignments.
     *
     * @param {Object} userStates
     * @param {Array}  allProblems
     * @returns {Set<string>} Set of problem IDs due in SRS today
     */
    getDueSRSIds(userStates = {}, allProblems = []) {
      // Use local timezone for date comparison (same as SRSEngine.getLocalDateString)
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yr}-${mo}-${dy}`;
      const dueIds = new Set();

      allProblems.forEach(p => {
        if (!p || !p.id) return;
        const st = userStates[p.id];
        if (!st || !st.nextReviewDate || st.isMastered) return;
        if (st.nextReviewDate <= todayStr) {
          dueIds.add(p.id);
        }
      });

      return dueIds;
    },

    /**
     * Generate first 14 days of both streams for a given learner profile.
     * Returns a human-readable schedule for display or testing.
     *
     * @param {Object} userStates
     * @param {Array}  allProblems
     * @param {Object} curriculumData - RoadmapCurriculumData instance
     * @param {'beginner'|'experienced'} profile
     * @returns {Array} 14-day schedule objects
     */
    generateFirst14Days(userStates = {}, allProblems = [], curriculumData = null, profile = 'beginner') {
      const dueSRSIds = this.getDueSRSIds(userStates, allProblems);
      const schedule = [];

      for (let day = 1; day <= 14; day++) {
        const streamA = curriculumData
          ? curriculumData.getStreamADay(day)
          : { topic: 'Binary Trees & BST', subtopic: `Day ${day}`, suggestedProblemIds: [], estimatedMinutes: 60 };

        const streamBBlueprint = curriculumData
          ? curriculumData.getStreamBDay(day)
          : { topic: 'Basics & Math', subtopic: `Day ${day}`, estimatedMinutes: 30 };

        const streamBTask = this.computeStreamBTask(day, userStates, allProblems, dueSRSIds, streamBBlueprint);

        const dueSRSCount = dueSRSIds.size;

        schedule.push({
          day,
          profile,
          streamA: {
            topic: streamA.topic,
            subtopic: streamA.subtopic,
            problemIds: streamA.suggestedProblemIds || [],
            estimatedMinutes: streamA.estimatedMinutes || 60,
            phase: streamA.phase || 'Phase 1'
          },
          streamB: streamBTask.empty ? {
            empty: true,
            reason: streamBTask.emptyReason,
            consolidation: streamBTask.consolidationSuggestion,
            estimatedMinutes: 0
          } : {
            topic: streamBTask.topicId,
            subtopic: streamBTask.subtopicId,
            problemIds: streamBTask.problemIds,
            revisionReason: streamBTask.revisionReason,
            estimatedMinutes: streamBTask.estimatedMinutes,
            empty: false
          },
          srs: {
            dueCount: dueSRSCount,
            estimatedMinutes: Math.min(60, dueSRSCount * 12)
          },
          totalEstimatedMinutes:
            (streamA.estimatedMinutes || 60) +
            (streamBTask.estimatedMinutes || 0) +
            Math.min(60, dueSRSCount * 12)
        });
      }

      return schedule;
    },

    /**
     * Validate the dual-stream invariants for a given day plan.
     * Used by tests and migration verification.
     *
     * @param {Object} dayPlan - from getTodayAuthoritativePlan()
     * @param {Object} userStates
     * @param {Array}  allProblems
     * @returns {Object} { valid, violations[] }
     */
    validateDualStreamDay(dayPlan, userStates = {}, allProblems = []) {
      const violations = [];

      // 1. Both streams exist
      if (!dayPlan.streamA && !dayPlan.currentLearning) {
        violations.push('MISSING_STREAM_A: Day plan has no Stream A task');
      }
      if (dayPlan.streamB === undefined && dayPlan.foundationRevision === undefined) {
        violations.push('MISSING_STREAM_B: Day plan has no Stream B slot (should at least have empty marker)');
      }

      // 2. No SRS/Stream B duplication
      const streamBIds = new Set(dayPlan.streamB?.problemIds || dayPlan.foundationRevision?.problemIds || []);
      const srsIds = new Set((dayPlan.streamC?.dueProblems || dayPlan.spacedRepetition?.dueProblems || []).map(p => p.id));
      const duplicates = [...streamBIds].filter(id => srsIds.has(id));
      if (duplicates.length > 0) {
        violations.push(`SRS_STREAM_B_CONFLICT: Problems appear in both SRS and Stream B: ${duplicates.join(', ')}`);
      }

      // 3. Stream B problems are from eligible topics
      const eligibility = this.getEligibleTopics(userStates, allProblems);
      const streamBTopic = dayPlan.streamB?.topic || dayPlan.foundationRevision?.topic;
      if (streamBTopic && streamBIds.size > 0) {
        const canonTopic = canonicalizeTopic(streamBTopic);
        if (!eligibility[canonTopic]?.eligible) {
          violations.push(`INELIGIBLE_TOPIC: Stream B topic "${streamBTopic}" has no learner history Ã¢â‚¬â€ should not assign problems`);
        }
      }

      // 4. Completing Stream B does not advance Stream A
      // (structural check Ã¢â‚¬â€ cannot verify at runtime, documented in code)

      return {
        valid: violations.length === 0,
        violations
      };
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Exports Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RevisionEligibilityEngine;
  }
  if (typeof window !== 'undefined') {
    window.RevisionEligibilityEngine = RevisionEligibilityEngine;
  }
  if (typeof global !== 'undefined') {
    global.RevisionEligibilityEngine = RevisionEligibilityEngine;
  }
})();
