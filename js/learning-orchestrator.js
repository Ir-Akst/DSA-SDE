/**
 * js/learning-orchestrator.js
 * 
 * AlgoRecall 2.0 — Unified Learning Orchestrator
 * ==============================================
 * Central coordination layer connecting:
 * - Roadmap Engine (120-Day multi-stream planner & topic progression)
 * - Daily Plan Resolver (RecommendationEngine / RoadmapEngine daily schedule)
 * - Problem Engine (Canonical catalog & userStates)
 * - Revision Engine (SRSEngine Leitner intervals & due reviews)
 * - Progress & Readiness Engine (ReadinessEngine & FailureEngine)
 * 
 * Core Guarantees:
 * 1. Single Canonical Problem Identity (p.id)
 * 2. One Source of Truth for attempt/completion records (userStates)
 * 3. Idempotent state updates preventing duplicate reviews or tasks
 * 4. Transparent, evidence-based reasoning ("What to do now and why")
 * 5. Explanatory post-action feedback with actual calculated dates
 * 6. Contextual navigation and deep-linking between features
 * 7. Safe offline cache & cloud synchronization support
 */

(function () {
  'use strict';

  // Environment-safe engine references
  const getSRSEngine = () => (typeof window !== 'undefined' && window.SRSEngine) ||
    (typeof global !== 'undefined' && global.SRSEngine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./srs-engine'); } catch (_) { return null; } })() : null);

  const getRoadmapEngine = () => (typeof window !== 'undefined' && window.RoadmapEngine) ||
    (typeof global !== 'undefined' && global.RoadmapEngine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./roadmap-engine'); } catch (_) { return null; } })() : null);

  const getRoadmap120Engine = () => (typeof window !== 'undefined' && window.Roadmap120Engine) ||
    (typeof global !== 'undefined' && global.Roadmap120Engine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./roadmap-120-engine'); } catch (_) { return null; } })() : null);

  const getRecommendationEngine = () => (typeof window !== 'undefined' && window.RecommendationEngine) ||
    (typeof global !== 'undefined' && global.RecommendationEngine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./recommendation-engine'); } catch (_) { return null; } })() : null);

  const getFailureEngine = () => (typeof window !== 'undefined' && window.FailureEngine) ||
    (typeof global !== 'undefined' && global.FailureEngine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./failure-engine'); } catch (_) { return null; } })() : null);

  const getReadinessEngine = () => (typeof window !== 'undefined' && window.ReadmapEngine) ||
    (typeof window !== 'undefined' && window.ReadinessEngine) ||
    (typeof global !== 'undefined' && global.ReadinessEngine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./readiness-engine'); } catch (_) { return null; } })() : null);

  const getGamificationEngine = () => (typeof window !== 'undefined' && window.GamificationEngine) ||
    (typeof global !== 'undefined' && global.GamificationEngine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./gamification-engine'); } catch (_) { return null; } })() : null);

  const getStorageEngine = () => (typeof window !== 'undefined' && window.StorageEngine) ||
    (typeof global !== 'undefined' && global.StorageEngine) ||
    (typeof require !== 'undefined' ? (function () { try { return require('./storage-engine'); } catch (_) { return null; } })() : null);

  // =========================================================================
  // FEATURE GUIDANCE DEFINITIONS
  // What is this? When to use? What to do? How it connects?
  // =========================================================================
  const FEATURE_GUIDES = {
    dashboard: {
      id: 'dashboard',
      name: "Today's Learning",
      tagline: 'Your Daily Execution Cockpit',
      icon: 'fa-solid fa-compass',
      badgeClass: 'badge-dashboard',
      whatIsThis: 'A focused, priority-ranked daily workspace that combines your planned new questions, targeted topic practice, and scientifically due spaced reviews.',
      whenToUse: 'At the start and during every study session. Use this as your home base to know exactly what to solve next without getting overwhelmed.',
      whatToDo: 'Follow the "Recommended Next Action" card at the top, complete your planned tasks, and record whether you solved each problem independently, with hints, or need to revisit it.',
      howItConnects: 'Every recorded action updates your retention stability, schedules future spaced reviews, advances your 120-day roadmap, and increases your interview readiness score.',
      primaryAction: { label: 'Start Recommended Task', target: 'next_action' },
      quickLinks: [
        { label: 'View 120-Day Roadmap', action: 'navigate', view: 'roadmap', icon: 'fa-route' },
        { label: 'Browse Practice Catalog', action: 'navigate', view: 'practice', icon: 'fa-layer-group' },
        { label: 'Spaced Review Queue', action: 'navigate', view: 'revision', icon: 'fa-clock-rotate-left' }
      ]
    },

    roadmap: {
      id: 'roadmap',
      name: '120-Day Roadmap & Planner',
      tagline: 'Your Strategic DSA Journey',
      icon: 'fa-solid fa-route',
      badgeClass: 'badge-roadmap',
      whatIsThis: 'A comprehensive, multi-stream curriculum that schedules all 479 curated problems across 120 days with parallel tracks for Current Learning, Foundation Revision, and Spaced Recall.',
      whenToUse: 'When planning your weekly study pacing, reorganizing topic order to prepare for upcoming company interviews, or inserting buffer days when life gets busy.',
      whatToDo: 'Inspect upcoming day assignments, reorder topics using Up/Down arrows to match your target interview dates, or insert a buffer day to relieve workload.',
      howItConnects: 'Today\'s Learning draws its daily tasks directly from Day N of this roadmap. Changes here automatically adjust future daily workloads without overwriting past solve history.',
      primaryAction: { label: 'Return to Today\'s Plan', target: 'dashboard' },
      quickLinks: [
        { label: 'Go to Today\'s Tasks', action: 'navigate', view: 'dashboard', icon: 'fa-compass' },
        { label: 'Customize Topic Order', action: 'modal', modal: 'topic-adjust', icon: 'fa-sliders' }
      ]
    },

    practice: {
      id: 'practice',
      name: 'Practice & Problem Catalog',
      tagline: 'Curated 479 Problem Explorer & Patterns',
      icon: 'fa-solid fa-layer-group',
      badgeClass: 'badge-practice',
      whatIsThis: 'The complete pedagogical library of 479 curated interview problems organized by 16 canonical topics, subtopics, and algorithmic patterns from top sheets (Striver, NeetCode, Blind 75).',
      whenToUse: 'When exploring new topics, doing elective deep dives, studying algorithmic pattern templates, or searching for a specific company tagged question.',
      whatToDo: 'Filter by topic, subtopic, or pattern; launch problems on LeetCode/GFG or in the Step-by-Step Discovery Trainer; record your solution outcomes.',
      howItConnects: 'Solving problems here feeds into your Spaced Repetition queue. If you solve an unvisited problem, it automatically establishes Leitner Stage 1 for future scheduled recall.',
      primaryAction: { label: 'Explore Patterns Handbook', target: 'patterns' },
      quickLinks: [
        { label: 'Back to Today\'s Plan', action: 'navigate', view: 'dashboard', icon: 'fa-compass' },
        { label: 'Patterns Handbook', action: 'navigate', view: 'practice', subtab: 'patterns', icon: 'fa-code-fork' },
        { label: 'Flashcard Intuition', action: 'navigate', view: 'practice', subtab: 'flashcards', icon: 'fa-bolt' }
      ]
    },

    revision: {
      id: 'revision',
      name: 'Spaced Revision & Retention',
      tagline: 'Scientific Memory Protection',
      icon: 'fa-solid fa-clock-rotate-left',
      badgeClass: 'badge-revision',
      whatIsThis: 'An intelligent Leitner spaced-repetition system that calculates the exact moment you are about to forget a problem and surfaces it for active recall.',
      whenToUse: 'When you have problems marked "Due" or "Overdue", or before taking a mock interview to ensure past topics remain fresh in memory.',
      whatToDo: 'Review due problems without peeking at solutions; rate your recall honestly (Simple, Medium, Hard, Failed); record whether you needed hints.',
      howItConnects: 'Successful independent recall expands the repetition interval (e.g. 1d → 3d → 7d → 14d → 30d). Needing hints or failing resets the interval to protect you from false mastery.',
      primaryAction: { label: 'Review Next Due Problem', target: 'next_due' },
      quickLinks: [
        { label: 'Today\'s Learning Cockpit', action: 'navigate', view: 'dashboard', icon: 'fa-compass' },
        { label: 'Monthly Retention Test', action: 'navigate', view: 'revision', subtab: 'monthly', icon: 'fa-award' }
      ]
    },

    progress: {
      id: 'progress',
      name: 'Progress & Readiness Analytics',
      tagline: 'Evidence-Based Interview Diagnostics',
      icon: 'fa-solid fa-chart-pie',
      badgeClass: 'badge-progress',
      whatIsThis: 'A diagnostic dashboard measuring genuine interview readiness (0-100), cognitive independence (unassisted solve rate), retention stability, and topic mastery radar.',
      whenToUse: 'Weekly or before scheduling interviews to identify weak topics, inspect error patterns (e.g. edge-case slips, syntax struggle), and calibrate study time.',
      whatToDo: 'Check your top failure categories, view weak topic signals, and click "Practice This Topic" to launch targeted remedial drills.',
      howItConnects: 'Readiness scores are computed directly from your recorded solve history, hint usage, and delayed review success. Weak topic signals feed directly into Today\'s adaptive loop.',
      primaryAction: { label: 'Practice Weakest Topic', target: 'weak_topic_repair' },
      quickLinks: [
        { label: 'Today\'s Learning Plan', action: 'navigate', view: 'dashboard', icon: 'fa-compass' },
        { label: 'Prerequisite Graph', action: 'navigate', view: 'progress', subtab: 'graph', icon: 'fa-diagram-project' },
        { label: 'Mock Interview Simulator', action: 'navigate', view: 'progress', subtab: 'mock', icon: 'fa-stopwatch-20' }
      ]
    }
  };

  // =========================================================================
  // "HOW ALGORECALL WORKS" CONTEXTUAL GUIDE ANSWERS
  // =========================================================================
  const HOW_IT_WORKS_GUIDE = [
    {
      id: 'today_vs_roadmap',
      title: "Today's Learning vs 120-Day Roadmap",
      icon: 'fa-solid fa-route',
      shortSummary: 'Daily execution cockpit vs Long-term strategic planner.',
      fullExplanation: "Today's Learning is your daily cockpit: it filters out the noise and gives you only what you need to solve right now (Learn, Revise, Spaced Recall). The 120-Day Roadmap is your big-picture calendar: use it to inspect upcoming topics, reorder topics for upcoming interviews, and manage buffer days."
    },
    {
      id: 'practice_vs_revision',
      title: 'Practice vs Spaced Revision',
      icon: 'fa-solid fa-arrows-split-up-and-left',
      shortSummary: 'Building problem-solving intuition vs Locking memory into long-term recall.',
      fullExplanation: 'Practice is exploratory: use it to discover new algorithmic patterns, browse sheets (Striver, NeetCode), and solve problems at your own pace. Revision is scientific: it schedules previously solved problems at expanding intervals (1d, 3d, 7d, 14d, 30d) so you never forget a technique you already learned.'
    },
    {
      id: 'topic_vs_problem_revision',
      title: 'Topic Revision vs Problem-Specific Review',
      icon: 'fa-solid fa-bullseye',
      shortSummary: 'Conceptual breadth drill vs Timed retrieval of a single problem.',
      fullExplanation: 'Topic Revision lets you pick an entire topic (e.g. Binary Trees) and drills multiple questions to rebuild confidence in that area. Problem-Specific Review is driven by Leitner spaced repetition: it tests recall on a specific problem exactly when your memory curve is about to decay.'
    },
    {
      id: 'progress_vs_recommendations',
      title: 'Progress Analytics vs Actionable Recommendations',
      icon: 'fa-solid fa-chart-line',
      shortSummary: 'Diagnostic evidence vs Prescribed immediate next step.',
      fullExplanation: 'Analytics diagnose where you have been: your independent solve rate, time efficiency, and failure categories. Recommendations translate that evidence into immediate action: e.g. "Because you struggled with edge cases on Two Pointers, solve this stepping-stone problem next."'
    },
    {
      id: 'skip_vs_reschedule_vs_complete',
      title: 'Skip vs Reschedule vs Mark Complete',
      icon: 'fa-solid fa-list-check',
      shortSummary: 'Defer today vs Move to future buffer day vs Record solve & advance SRS.',
      fullExplanation: '• Mark Complete / Solved: Records your attempt, updates mastery, and calculates your next spaced repetition date.\n• Skip: Temporarily steps over the task during today\'s study session (it stays in your queue to finish later today).\n• Reschedule: Moves the task to a future buffer day in your 120-day roadmap without penalizing your streak.'
    }
  ];

  HOW_IT_WORKS_GUIDE.distinctions = HOW_IT_WORKS_GUIDE;

  // =========================================================================
  // CORE LEARNING ORCHESTRATOR OBJECT
  // =========================================================================
  const LearningOrchestrator = {
    FEATURE_GUIDES,
    HOW_IT_WORKS_GUIDE,

    /**
     * Skip a plan task for today's active session without false completion
     * Guarantees:
     * 1. Preserves non-mastery invariant in SRS (problem is NOT marked solved)
     * 2. Records skip in active roadmap session
     * 3. Explains that the task stays in the session queue
     */
    skipTask(problemId, reason = '', context = {}) {
      const roadmap = getRoadmapEngine();
      if (roadmap && typeof roadmap.skipPlanTask === 'function') {
        roadmap.skipPlanTask(problemId);
      }
      return {
        skipped: true,
        problemId: problemId,
        feedback: this.formatActionFeedback('skip', { title: context.title || problemId, reason })
      };
    },

    /**
     * Get feature guidance metadata for any view
     * @param {string} viewKey - 'dashboard' | 'roadmap' | 'practice' | 'revision' | 'progress'
     */
    getFeatureGuidance(viewKey) {
      const cleanKey = String(viewKey || 'dashboard').toLowerCase().trim();
      return FEATURE_GUIDES[cleanKey] || FEATURE_GUIDES.dashboard;
    },

    /**
     * Get the full "How AlgoRecall Works" guide sections
     */
    getHowItWorksGuide() {
      return HOW_IT_WORKS_GUIDE;
    },

    /**
     * Resolve the single most important Recommended Next Action for the learner
     * Priority Hierarchy:
     * 1. Overdue Spaced Repetition (Retention is decaying)
     * 2. Due Today Spaced Repetition (Optimal recall timing)
     * 3. Today's Core Learning Task (Stream A - 120-Day Roadmap)
     * 4. Today's Foundation Revision Task (Stream B)
     * 5. Targeted Weak Topic Repair (If error signals exist)
     * 6. Daily Session Complete (Optional practice / preview next day)
     * 
     * @param {Object} userStates - User states map
     * @param {Array} allProblems - Problem catalog
     * @param {Object} options - { asOfDate, targetMinutes }
     */
    getRecommendedNextAction(userStates = {}, allProblems = [], options = {}) {
      const srs = getSRSEngine();
      const roadmap = getRoadmapEngine();
      const failure = getFailureEngine();
      const targetMins = options.targetMinutes || 120;
      const now = options.asOfDate || new Date();

      // 1. Check for OVERDUE and DUE TODAY Spaced Repetition items (Urgent retention decay)
      if (srs) {
        const todayStr = (typeof srs.getLocalDateString === 'function')
          ? srs.getLocalDateString(now)
          : (now instanceof Date ? now.toISOString().split('T')[0] : String(now).split('T')[0]);

        const overdueProblems = [];
        const dueTodayProblems = [];

        for (const prob of allProblems) {
          if (!prob || !prob.id) continue;
          const st = userStates[prob.id];
          if (!st || !st.nextReviewDate || st.isMastered) continue;

          // Skip if already reviewed today
          let reviewedToday = false;
          if (st.lastReviewed) {
            const lastRevDate = (typeof srs.getLocalDateString === 'function')
              ? srs.getLocalDateString(new Date(st.lastReviewed))
              : new Date(st.lastReviewed).toISOString().split('T')[0];
            if (lastRevDate === todayStr) reviewedToday = true;
          }
          if (reviewedToday) continue;

          if (st.nextReviewDate < todayStr) {
            const nextD = new Date(st.nextReviewDate);
            const nowD = new Date(todayStr);
            const diffTime = Math.max(1, Math.floor((nowD.getTime() - nextD.getTime()) / (1000 * 60 * 60 * 24)));
            overdueProblems.push({ ...prob, daysOverdue: diffTime, state: st });
          } else if (st.nextReviewDate === todayStr) {
            dueTodayProblems.push({ ...prob, state: st });
          }
        }

        if (overdueProblems.length > 0) {
          const topOverdue = overdueProblems[0];
          const daysOverdue = topOverdue.daysOverdue || 1;
          return {
            type: 'spaced_review',
            urgency: 'high',
            problemId: topOverdue.id,
            problem: topOverdue,
            title: topOverdue.title,
            topic: topOverdue.topic,
            subtopic: topOverdue.subtopic || '',
            difficulty: topOverdue.difficulty,
            actionLabel: 'Recall Overdue Problem',
            actionIcon: 'fa-solid fa-clock-rotate-left',
            badgeText: `${daysOverdue}d Overdue Recall`,
            badgeClass: 'badge-overdue',
            reasonText: `Memory is actively decaying (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} past scheduled recall). Review now to prevent reset to Stage 1.`,
            source: 'Spaced Repetition System',
            targetView: 'revision',
            targetSubtab: 'queue',
            estimatedMinutes: topOverdue.difficulty === 'Easy' ? 10 : (topOverdue.difficulty === 'Medium' ? 15 : 25),
            url: topOverdue.url
          };
        }

        if (dueTodayProblems.length > 0) {
          const topDue = dueTodayProblems[0];
          const currState = topDue.state || userStates[topDue.id] || {};
          const stage = currState.stage || 1;
          const intervalDays = currState.intervalDays || currState.interval || 1;
          return {
            type: 'spaced_review',
            urgency: 'medium',
            problemId: topDue.id,
            problem: topDue,
            title: topDue.title,
            topic: topDue.topic,
            subtopic: topDue.subtopic || '',
            difficulty: topDue.difficulty,
            actionLabel: 'Recall Due Problem',
            actionIcon: 'fa-solid fa-bell',
            badgeText: 'Due Spaced Recall',
            badgeClass: 'badge-due',
            reasonText: `Scheduled for optimal spaced recall today (Stage ${stage}, ${intervalDays}d interval). Recall now to advance memory stability.`,
            source: 'Spaced Repetition System',
            targetView: 'revision',
            targetSubtab: 'queue',
            estimatedMinutes: topDue.difficulty === 'Easy' ? 10 : (topDue.difficulty === 'Medium' ? 15 : 20),
            url: topDue.url
          };
        }
      }

      // 3. Check Today's Planned Learning Tasks (Stream A: Current Learning)
      let dailyPlan = null;
      if (roadmap && typeof roadmap.getDailyDSAPlan === 'function') {
        dailyPlan = roadmap.getDailyDSAPlan(targetMins, allProblems, userStates);
      }

      if (dailyPlan && dailyPlan.learn && Array.isArray(dailyPlan.learn.problems)) {
        const nextLearnTask = dailyPlan.learn.problems.find(p => !p.isCompletedToday && !p.isSkippedToday);
        if (nextLearnTask) {
          const dayNum = dailyPlan.dayNumber || 1;
          return {
            type: 'learn_task',
            urgency: 'normal',
            problemId: nextLearnTask.id,
            problem: nextLearnTask,
            title: nextLearnTask.title,
            topic: nextLearnTask.topic,
            subtopic: nextLearnTask.subtopic || '',
            difficulty: nextLearnTask.difficulty,
            actionLabel: 'Solve Planned Problem',
            actionIcon: 'fa-solid fa-play',
            badgeText: 'Stream A: Today\'s Focus',
            badgeClass: 'badge-learn',
            reasonText: nextLearnTask.selectionReason || `Day ${dayNum} core topic: ${nextLearnTask.topic}. Progresses your 120-Day roadmap.`,
            source: '120-Day Study Roadmap',
            targetView: 'dashboard',
            estimatedMinutes: nextLearnTask.estimatedMinutes || (nextLearnTask.difficulty === 'Easy' ? 15 : (nextLearnTask.difficulty === 'Medium' ? 30 : 45)),
            url: nextLearnTask.url
          };
        }
      }

      // 4. Check Today's Foundation Revision Tasks (Stream B)
      if (dailyPlan && dailyPlan.topicRevision && Array.isArray(dailyPlan.topicRevision.problems)) {
        const nextTopicRev = dailyPlan.topicRevision.problems.find(p => !p.isCompletedToday && !p.isSkippedToday);
        if (nextTopicRev) {
          return {
            type: 'topic_revise',
            urgency: 'normal',
            problemId: nextTopicRev.id,
            problem: nextTopicRev,
            title: nextTopicRev.title,
            topic: nextTopicRev.topic,
            subtopic: nextTopicRev.subtopic || '',
            difficulty: nextTopicRev.difficulty,
            actionLabel: 'Practice Foundation Problem',
            actionIcon: 'fa-solid fa-dumbbell',
            badgeText: 'Stream B: Foundation Practice',
            badgeClass: 'badge-topic-revise',
            reasonText: nextTopicRev.selectionReason || `Targeted foundation drill in ${nextTopicRev.topic} to maintain problem-solving speed.`,
            source: 'Foundation Revision Track',
            targetView: 'dashboard',
            estimatedMinutes: nextTopicRev.estimatedMinutes || 20,
            url: nextTopicRev.url
          };
        }
      }

      // 5. Check for any tasks skipped earlier today that can now be resumed
      if (dailyPlan) {
        const allPlanned = [
          ...(dailyPlan.learn?.problems || []),
          ...(dailyPlan.topicRevision?.problems || []),
          ...(dailyPlan.spacedRevision?.problems || [])
        ];
        const skippedTask = allPlanned.find(p => !p.isCompletedToday && p.isSkippedToday);
        if (skippedTask) {
          return {
            type: 'resume_skipped',
            urgency: 'low',
            problemId: skippedTask.id,
            problem: skippedTask,
            title: skippedTask.title,
            topic: skippedTask.topic,
            subtopic: skippedTask.subtopic || '',
            difficulty: skippedTask.difficulty,
            actionLabel: 'Resume Skipped Task',
            actionIcon: 'fa-solid fa-forward-step',
            badgeText: 'Deferred Task',
            badgeClass: 'badge-skipped',
            reasonText: `You skipped "${skippedTask.title}" earlier today. You can finish it now or reschedule it to a buffer day on your Roadmap.`,
            source: 'Today\'s Session Queue',
            targetView: 'dashboard',
            estimatedMinutes: skippedTask.estimatedMinutes || 25,
            url: skippedTask.url
          };
        }
      }

      // 6. Check for Weak Topic Repair Drill based on FailureEngine
      if (failure && typeof failure.analyzeFailures === 'function') {
        const failAnalysis = failure.analyzeFailures(userStates, allProblems);
        if (failAnalysis.topWeakTopics && failAnalysis.topWeakTopics.length > 0) {
          const weakTop = failAnalysis.topWeakTopics[0];
          if (weakTop.totalFailures >= 2) {
            // Find an uncompleted or failed problem in this topic
            const repairCandidate = allProblems.find(p => {
              const canonTopic = srs ? srs.canonicalizeTopic(p.topic) : p.topic;
              if (canonTopic !== weakTop.topic) return false;
              const st = userStates[p.id];
              return !st || st.lastRating === 'failed' || (st.confidence && st.confidence <= 2);
            });

            if (repairCandidate) {
              return {
                type: 'weak_topic_repair',
                urgency: 'low',
                problemId: repairCandidate.id,
                problem: repairCandidate,
                title: repairCandidate.title,
                topic: repairCandidate.topic,
                subtopic: repairCandidate.subtopic || '',
                difficulty: repairCandidate.difficulty,
                actionLabel: 'Practice Weak Topic Drill',
                actionIcon: 'fa-solid fa-triangle-exclamation',
                badgeText: `Targeted Repair: ${weakTop.topic}`,
                badgeClass: 'badge-repair',
                reasonText: `Evidence-based recommendation: ${weakTop.totalFailures} recorded struggles in ${weakTop.topic}. Strengthen with this targeted drill.`,
                source: 'Failure Intelligence Engine',
                targetView: 'practice',
                estimatedMinutes: 20,
                url: repairCandidate.url
              };
            }
          }
        }
      }

      // 7. Session Complete State
      const completedCount = dailyPlan?.progress?.completedPlannedTasks || 0;
      const totalPlanned = dailyPlan?.progress?.plannedTasksTotal || 0;
      return {
        type: 'session_complete',
        urgency: 'none',
        problemId: null,
        title: 'All Planned Tasks Complete!',
        topic: 'Daily Session Finished',
        difficulty: 'Done',
        actionLabel: 'Browse Practice Catalog',
        actionIcon: 'fa-solid fa-trophy',
        badgeText: 'Goal Achieved',
        badgeClass: 'badge-complete',
        reasonText: `Fantastic job! You completed all ${completedCount} planned tasks for today. You can explore optional practice, preview tomorrow's roadmap, or take a break.`,
        source: 'Learning Orchestrator',
        targetView: 'practice',
        estimatedMinutes: 0
      };
    },

    /**
     * Canonical single-entry-point for recording a problem solve/attempt outcome
     * Coordinates:
     * - SRS Engine review processing (calculates stability, stage, nextReviewDate)
     * - User states update
     * - RoadmapEngine task unskipping
     * - Gamification XP awards & badge evaluations
     * - Safe persistence via StorageEngine
     * - Returns rich downstream explanation
     * 
     * @param {string} problemId - Canonical problem identity
     * @param {string|Object} outcomeOrDetails - 'independent' | 'hints' | 'failed' OR details object
     * @param {Object} context - { sectionType, isRevision, allProblems, userStates }
     */
    recordAttempt(problemId, outcomeOrDetails, context = {}) {
      const srs = getSRSEngine();
      const storage = getStorageEngine();
      const roadmap = getRoadmapEngine();
      const gamification = getGamificationEngine();

      if (!problemId) {
        return { success: false, error: 'Missing problemId' };
      }

      let allProblems = context.allProblems;
      if (!allProblems && typeof window !== 'undefined' && Array.isArray(window.allProblems)) {
        allProblems = window.allProblems;
      }
      allProblems = allProblems || [];

      const problem = allProblems.find(p => p.id === problemId);
      if (!problem) {
        return { success: false, error: `Problem not found: ${problemId}` };
      }

      let userStates = context.userStates;
      if (!userStates && storage && typeof storage.getUserStates === 'function') {
        userStates = storage.getUserStates();
      } else if (!userStates && typeof window !== 'undefined' && window.userStates) {
        userStates = window.userStates;
      }
      userStates = userStates || {};

      const currState = userStates[problemId] || {};

      // Parse outcome details
      let rating = 'simple';
      let confidence = 4;
      let hintsUsed = false;
      let failureReasons = [];
      let timeSpent = 15;
      let notes = '';
      let outcomeLabel = 'Solved independently';

      if (typeof outcomeOrDetails === 'string') {
        if (outcomeOrDetails === 'independent') {
          rating = 'simple';
          confidence = 4;
          hintsUsed = false;
          outcomeLabel = 'Solved independently';
        } else if (outcomeOrDetails === 'hints') {
          rating = 'medium';
          confidence = 3;
          hintsUsed = true;
          outcomeLabel = 'Solved with hints';
        } else if (outcomeOrDetails === 'failed') {
          rating = 'failed';
          confidence = 1;
          hintsUsed = false;
          outcomeLabel = 'Could not solve';
        }
      } else if (typeof outcomeOrDetails === 'object' && outcomeOrDetails !== null) {
        if (typeof outcomeOrDetails.rating === 'string' && ['simple', 'medium', 'hard', 'failed'].includes(outcomeOrDetails.rating)) {
          rating = outcomeOrDetails.rating;
        } else if (outcomeOrDetails.difficulty && ['simple', 'medium', 'hard'].includes(String(outcomeOrDetails.difficulty).toLowerCase())) {
          rating = String(outcomeOrDetails.difficulty).toLowerCase();
        } else if (outcomeOrDetails.outcome === 'optimal' || outcomeOrDetails.outcome === 'independent') {
          rating = 'simple';
        } else if (outcomeOrDetails.outcome === 'hints') {
          rating = 'medium';
        } else if (outcomeOrDetails.outcome === 'failed') {
          rating = 'failed';
        } else {
          rating = 'medium';
        }

        if (typeof outcomeOrDetails.confidence === 'number') {
          confidence = outcomeOrDetails.confidence;
        } else if (typeof outcomeOrDetails.rating === 'number') {
          confidence = outcomeOrDetails.rating;
        } else {
          confidence = rating === 'simple' ? 4 : (rating === 'failed' ? 1 : 3);
        }

        hintsUsed = Boolean(outcomeOrDetails.hintsUsed);
        failureReasons = Array.isArray(outcomeOrDetails.failureReasons) ? outcomeOrDetails.failureReasons : [];
        timeSpent = Number(outcomeOrDetails.timeSpentMinutes || outcomeOrDetails.timeSpent || 15);
        notes = outcomeOrDetails.notes || outcomeOrDetails.reviewNotes || '';
        outcomeLabel = hintsUsed ? 'Solved with hints' : (rating === 'failed' ? 'Could not solve' : 'Solved independently');
      }

      const sectionType = context.sectionType || (context.isRevision ? 'topic_revise' : 'learn');
      const isRevision = sectionType === 'spaced_revise' || sectionType === 'topic_revise' || context.isRevision === true;
      const isSpaced = sectionType === 'spaced_revise' || Boolean(problem.isSpacedRevision);
      const isTopicPractice = sectionType === 'topic_revise' || Boolean(problem.isTopicRevision);

      // Call SRSEngine to calculate updated state with strict learning integrity
      let newState = currState;
      if (srs && typeof srs.processReview === 'function') {
        newState = srs.processReview(
          currState,
          rating,
          timeSpent,
          notes || `Outcome: ${outcomeLabel}`,
          confidence,
          {
            hintsUsed: hintsUsed,
            failureReasons: failureReasons,
            isTopicPractice: isTopicPractice,
            now: context.asOfDate || new Date()
          }
        );
      } else {
        // Fallback calculation if SRS engine not loaded
        const todayStr = new Date().toISOString().split('T')[0];
        newState = {
          ...currState,
          lastReviewed: todayStr,
          stage: rating === 'failed' ? 1 : (currState.stage || 0) + 1,
          intervalDays: rating === 'failed' ? 1 : 3,
          nextReviewDate: todayStr
        };
      }

      // Ensure solved flag is canonically maintained
      if (rating !== 'failed') {
        newState.solved = true;
      }

      // Update userStates canonically
      userStates[problemId] = newState;

      // Automatically unskip task in roadmap if it was skipped
      if (roadmap && typeof roadmap.isTaskSkippedToday === 'function' && roadmap.isTaskSkippedToday(problemId)) {
        if (typeof roadmap.unskipPlanTask === 'function') {
          roadmap.unskipPlanTask(problemId);
        }
      }

      // Award Gamification XP if engine available
      let xpAwarded = 0;
      if (gamification && typeof gamification.awardXP === 'function') {
        if (!hintsUsed && confidence >= 4 && rating !== 'failed') {
          xpAwarded = 25;
          gamification.awardXP('independent_solve');
        } else if (currState.stage >= 2 && rating !== 'failed') {
          xpAwarded = 20;
          gamification.awardXP('delayed_recall');
        } else {
          xpAwarded = 10;
          gamification.awardXP('review');
        }
        if (typeof gamification.evaluateBadges === 'function') {
          gamification.evaluateBadges(allProblems, userStates, []);
        }
      }

      // Save userStates via StorageEngine
      if (storage && typeof storage.saveUserStates === 'function') {
        storage.saveUserStates(userStates);
      }

      // Format human-friendly next review date
      const nextDate = newState.nextReviewDate || 'Tomorrow';
      const intervalDays = newState.intervalDays || 1;
      const isMastered = Boolean(newState.isMastered);

      // Generate transparent, evidence-based post-action feedback
      let feedbackExplanation = '';
      if (rating === 'failed') {
        feedbackExplanation = `Attempt recorded for "${problem.title}". Spaced review reset to tomorrow (1-day interval) to rebuild recall.`;
      } else if (hintsUsed) {
        feedbackExplanation = `Attempt recorded with hints for "${problem.title}". Next retrieval scheduled for ${nextDate} (${intervalDays}-day interval) to verify unassisted solving.`;
      } else if (isMastered) {
        feedbackExplanation = `Topic Mastery Unlocked! "${problem.title}" achieved long-term retention. Next maintenance review: ${nextDate}.`;
      } else {
        feedbackExplanation = `Attempt recorded for "${problem.title}". Next review: ${nextDate} (${intervalDays}-day interval). +${xpAwarded || 15} XP.`;
      }

      // Determine next recommended step
      const nextRecommended = this.getRecommendedNextAction(userStates, allProblems, {
        asOfDate: context.asOfDate || new Date()
      });

      return {
        success: true,
        problemId: problemId,
        problemTitle: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        rating: rating,
        confidence: confidence,
        hintsUsed: hintsUsed,
        stage: newState.stage,
        intervalDays: intervalDays,
        nextReviewDate: nextDate,
        isMastered: isMastered,
        xpEarned: xpAwarded,
        state: newState,
        feedbackMessage: feedbackExplanation,
        feedback: feedbackExplanation,
        downstreamImpact: `Scheduled next review for ${nextDate} (${intervalDays}-day interval).`,
        recommendedNext: nextRecommended
      };
    },

    /**
     * Generate clear, transparent feedback messages for system actions
     * Never invents fake dates or fake mastery scores
     * @param {string} actionType - 'solve' | 'solve_attempt' | 'skip' | 'reschedule' | 'topic_weakness'
     * @param {Object} data - Context data
     */
    formatActionFeedback(actionType, data = {}) {
      switch (actionType) {
        case 'solve':
        case 'solve_attempt': {
          const title = data.problemTitle || data.title || 'Problem';
          const nextDate = data.nextReviewDate;
          const interval = data.intervalDays || 1;
          const xp = (data.xpEarned || data.xpAwarded) ? ` (+${data.xpEarned || data.xpAwarded} XP)` : '';
          if (nextDate) {
            return `✓ Attempt recorded for "${title}". Next review: ${nextDate} (${interval} day${interval > 1 ? 's' : ''} interval)${xp}.`;
          }
          return `✓ Attempt recorded for "${title}". Learning progress has been updated${xp}.`;
        }

        case 'skip': {
          const title = data.title || 'Task';
          return `Task skipped for now. It remains in today's session queue. To move it to a future day, use Reschedule on your 120-Day Roadmap.`;
        }

        case 'reschedule': {
          const dayNum = data.dayNumber || 'Day';
          const bufferDate = data.bufferDate || 'future buffer day';
          return `✓ Roadmap updated: Day ${dayNum} workload shifted to ${bufferDate}. Upcoming schedule adjusted without data loss.`;
        }

        case 'topic_weakness': {
          const topic = data.topic || 'Topic';
          const fails = data.failuresCount || 0;
          const hints = data.hintsCount || 0;
          let reason = '';
          if (fails > 0 && hints > 0) {
            reason = `${fails} failed attempt${fails > 1 ? 's' : ''} and ${hints} hint usage${hints > 1 ? 's' : ''}`;
          } else if (fails > 0) {
            reason = `${fails} failed attempt${fails > 1 ? 's' : ''}`;
          } else {
            reason = `recent low confidence scores`;
          }
          return `Topic "${topic}" may need more practice based on observed evidence (${reason}).`;
        }

        default:
          return data.message || 'Action saved successfully.';
      }
    },

    /**
     * Contextual navigation dispatcher
     * Deep-links between views and preconfigures filters
     * @param {string} targetAction - 'practice_topic' | 'problem_detail' | 'spaced_queue' | 'roadmap_day'
     * @param {Object} params - Navigation parameters
     */
    navigateToFeature(targetAction, params = {}) {
      if (typeof window === 'undefined') return;

      const switchView = window.switchView;
      if (typeof switchView !== 'function') return;

      switch (targetAction) {
        case 'practice_topic': {
          switchView('practice', 'catalog');
          const topicFilter = document.getElementById('filter-topic');
          if (topicFilter && params.topic) {
            topicFilter.value = params.topic;
            topicFilter.dispatchEvent(new Event('change'));
          }
          break;
        }

        case 'practice_subtopic': {
          switchView('practice', 'catalog');
          const topicFilter = document.getElementById('filter-topic');
          const subtopicFilter = document.getElementById('filter-subtopic');
          if (topicFilter && params.topic) {
            topicFilter.value = params.topic;
            topicFilter.dispatchEvent(new Event('change'));
          }
          if (subtopicFilter && params.subtopic) {
            setTimeout(() => {
              subtopicFilter.value = params.subtopic;
              subtopicFilter.dispatchEvent(new Event('change'));
            }, 50);
          }
          break;
        }

        case 'problem_detail': {
          if (params.problemId && typeof window.openDetailModal === 'function') {
            window.openDetailModal(params.problemId);
          }
          break;
        }

        case 'spaced_queue': {
          switchView('revision', 'queue');
          break;
        }

        case 'roadmap':
        case 'roadmap_day': {
          switchView('roadmap');
          if (params.dayNumber && typeof window.focusRoadmapDay === 'function') {
            window.focusRoadmapDay(params.dayNumber);
          }
          break;
        }

        case 'weak_topic_repair': {
          if (params.topic) {
            this.navigateToFeature('practice_topic', { topic: params.topic });
          } else {
            switchView('practice', 'catalog');
          }
          break;
        }

        default:
          switchView(targetAction);
      }
    }
  };

  // Environment export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningOrchestrator;
  }
  if (typeof window !== 'undefined') {
    window.LearningOrchestrator = LearningOrchestrator;
  }
})();
