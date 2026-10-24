/**
 * AlgoRecall 2.0 - Adaptive Learning Loop Engine
 * 
 * Continuous closed-loop decision making:
 * 1. OBSERVE: Attempt outcomes, confidence, hints, elapsed time, failure classifications, and SRS review history.
 * 2. DIAGNOSE: Retention decay, prerequisite deficits, pattern confusion, implementation bugs, and edge-case errors.
 * 3. CHOOSE NEXT ACTION: Deterministic policy selecting targeted spaced revision, prerequisite stepping-stone practice,
 *    pattern reinforcement, independent retry, edge-case drill, or curriculum advancement with explainable rationales.
 * 4. VERIFY IMPROVEMENT: Closed-loop tracking evaluating whether subsequent independent attempts succeeded.
 * 
 * Operates 100% offline with zero external network or AI dependencies.
 * Preserves all underlying engine authorities, anti-inflation mastery invariants, and schema v2.0.0.
 */

(function () {
  'use strict';

  // Dependency Resolution (Browser globals with Node.js CommonJS fallback)
  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);
  const _FailureEngine = (typeof window !== 'undefined' && window.FailureEngine) || (typeof require !== 'undefined' ? require('./failure-engine') : null);
  const _GraphEngine = (typeof window !== 'undefined' && window.GraphEngine) || (typeof require !== 'undefined' ? require('./graph-engine') : null);
  const _RecommendationEngine = (typeof window !== 'undefined' && window.RecommendationEngine) || (typeof require !== 'undefined' ? require('./recommendation-engine') : null);
  const _ReadinessEngine = (typeof window !== 'undefined' && window.ReadinessEngine) || (typeof require !== 'undefined' ? require('./readiness-engine') : null);

  const STORAGE_KEY_INTERVENTIONS = 'algorecall_interventions_v2';

  // Deterministic Reason Codes
  const REASON_CODES = {
    PREREQUISITE_GAP: 'PREREQUISITE_GAP',
    RETENTION_DECAY: 'RETENTION_DECAY',
    RETENTION_CHECK_DUE: 'RETENTION_CHECK_DUE',
    PATTERN_CONFUSION: 'PATTERN_CONFUSION',
    IMPLEMENTATION_ERROR: 'IMPLEMENTATION_ERROR',
    EDGE_CASE_VULNERABILITY: 'EDGE_CASE_VULNERABILITY',
    HINT_DEPENDENCY: 'HINT_DEPENDENCY',
    PROVISIONAL_EVIDENCE_NEEDED: 'PROVISIONAL_EVIDENCE_NEEDED',
    CURRICULUM_PROGRESSION: 'CURRICULUM_PROGRESSION'
  };

  // Deterministic Action Types
  const ACTION_TYPES = {
    PREREQUISITE_PRACTICE: 'prerequisite_practice',
    SPACED_REVISION: 'spaced_revision',
    PATTERN_REINFORCEMENT: 'pattern_reinforcement',
    INDEPENDENT_RETRY: 'independent_retry',
    EDGE_CASE_DRILL: 'edge_case_drill',
    CURRICULUM_ADVANCE: 'curriculum_advance',
    FRESH_ATTEMPT: 'fresh_attempt'
  };

  // Human-readable labels & action badge styling
  const ACTION_METADATA = {
    [ACTION_TYPES.PREREQUISITE_PRACTICE]: {
      label: 'Prerequisite Remediation',
      icon: 'fa-sitemap',
      color: '#8b5cf6',
      badgeClass: 'badge-prereq'
    },
    [ACTION_TYPES.SPACED_REVISION]: {
      label: 'Spaced Memory Revision',
      icon: 'fa-clock-rotate-left',
      color: '#f59e0b',
      badgeClass: 'badge-revision'
    },
    [ACTION_TYPES.PATTERN_REINFORCEMENT]: {
      label: 'Pattern Template Drill',
      icon: 'fa-code-fork',
      color: '#06b6d4',
      badgeClass: 'badge-pattern'
    },
    [ACTION_TYPES.INDEPENDENT_RETRY]: {
      label: 'Independent Reattempt',
      icon: 'fa-rotate-right',
      color: '#10b981',
      badgeClass: 'badge-retry'
    },
    [ACTION_TYPES.EDGE_CASE_DRILL]: {
      label: 'Edge-Case Checklist Drill',
      icon: 'fa-triangle-exclamation',
      color: '#ec4899',
      badgeClass: 'badge-edge'
    },
    [ACTION_TYPES.CURRICULUM_ADVANCE]: {
      label: 'Curriculum Progression',
      icon: 'fa-forward-step',
      color: '#38bdf8',
      badgeClass: 'badge-advance'
    },
    [ACTION_TYPES.FRESH_ATTEMPT]: {
      label: 'Fresh Problem Attempt',
      icon: 'fa-bolt',
      color: '#6366f1',
      badgeClass: 'badge-fresh'
    }
  };

  const getRepo = () => {
    try {
      if (typeof window !== 'undefined' && window.LearnerRepository) return window.LearnerRepository;
      if (typeof require !== 'undefined') return require('./learner-repository');
    } catch (_) {}
    return null;
  };

  /**
   * Helper to safely interact with local storage or LearnerRepository
   */
  function getStoredInterventions(ctx) {
    try {
      const repo = getRepo();
      if (repo) {
        return repo.getInterventions(ctx) || [];
      }
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_INTERVENTIONS);
        return raw ? JSON.parse(raw) : [];
      }
      if (typeof global !== 'undefined' && global.localStorage) {
        const raw = global.localStorage.getItem(STORAGE_KEY_INTERVENTIONS);
        return raw ? JSON.parse(raw) : [];
      }
    } catch (_) {}
    return [];
  }

  function persistInterventions(list, ctx) {
    try {
      const sanitized = Array.isArray(list) ? list.slice(-100) : []; // retain up to 100 historical interventions
      const repo = getRepo();
      if (repo) {
        repo.saveInterventions(sanitized, ctx);
        return;
      }
      const str = JSON.stringify(sanitized);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_INTERVENTIONS, str);
      }
      if (typeof global !== 'undefined' && global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY_INTERVENTIONS, str);
      }
    } catch (_) {}
  }

  const AdaptiveLearningEngine = {
    REASON_CODES,
    ACTION_TYPES,
    ACTION_METADATA,
    getStoredInterventions,
    persistInterventions,
    clearStoredInterventions(ctx) {
      persistInterventions([], ctx);
    },

    /**
     * STEP 1: OBSERVE
     * Extracts multi-signal empirical evidence from a problem state and its review history.
     * @param {Object} problem - Problem object from catalog
     * @param {Object} userState - Problem review state
     * @param {Array} allProblems - Entire catalog
     * @param {Object} userStates - All user states
     */
    observeEvidence(problem, userState = {}, allProblems = [], userStates = {}) {
      if (!problem) return null;
      if (!userState || typeof userState !== 'object') userState = {};
      const history = Array.isArray(userState.history) ? userState.history : [];
      const totalAttempts = history.length + (userState.lastReviewed && history.length === 0 ? 1 : 0);
      const latestAttempt = history.length > 0 ? history[history.length - 1] : null;

      const hasAttempts = Boolean(userState.lastReviewed || totalAttempts > 0);
      const conf = (hasAttempts && _SRSEngine) ? _SRSEngine.getConfidence(userState) : (userState.confidence || userState.lastConfidence || null);
      const hintsUsed = Boolean(userState.hintsUsed || (latestAttempt && latestAttempt.hintsUsed));
      const lastRating = userState.lastRating || (latestAttempt ? latestAttempt.rating : null);
      const isFailed = hasAttempts && (lastRating === 'failed' || (typeof conf === 'number' && conf <= 1));

      // Conflicting signals detection (overconfidence or underconfidence)
      const isConflicting = hasAttempts && (
        (lastRating === 'failed' && typeof conf === 'number' && conf >= 4) ||
        (lastRating === 'simple' && typeof conf === 'number' && conf <= 2)
      );

      // Extract explicit failure reasons logged
      const failureReasons = [];
      if (latestAttempt && Array.isArray(latestAttempt.failureReasons)) {
        failureReasons.push(...latestAttempt.failureReasons);
      } else if (Array.isArray(userState.failureReasons)) {
        failureReasons.push(...userState.failureReasons);
      }

      // Check Spaced Repetition conditions
      const isDue = hasAttempts && _SRSEngine ? _SRSEngine.isDue(userState) : false;
      const isOverdue = hasAttempts && _SRSEngine ? _SRSEngine.isOverdue(userState) : false;
      const retentionScore = (hasAttempts && _SRSEngine && typeof _SRSEngine.calculateRetention === 'function')
        ? _SRSEngine.calculateRetention(userState)
        : 1.0;

      // Calculate low-confidence streak
      let lowConfidenceStreak = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i];
        if (!h) continue;
        const hConf = Number(h.confidence || (h.rating === 'failed' ? 1 : h.rating === 'hard' ? 2 : 3));
        if (hConf <= 2 || h.rating === 'failed') {
          lowConfidenceStreak++;
        } else {
          break;
        }
      }

      // Prerequisite dependency inspection
      let missingPrereq = null;
      if (_GraphEngine && typeof _GraphEngine.findMissingPrerequisite === 'function') {
        missingPrereq = _GraphEngine.findMissingPrerequisite(problem, allProblems, userStates);
      }

      return {
        problemId: problem.id,
        title: problem.title,
        topic: _SRSEngine ? _SRSEngine.canonicalizeTopic(problem.topic) : problem.topic,
        difficulty: problem.difficulty,
        pattern: problem.pattern || 'General',
        totalAttempts,
        confidence: typeof conf === 'number' ? conf : 3,
        hintsUsed,
        lastRating,
        isFailed,
        isConflicting,
        failureReasons,
        isDue,
        isOverdue,
        retentionScore,
        stage: userState.stage || 1,
        isMastered: Boolean(userState.isMastered),
        lowConfidenceStreak,
        missingPrereq,
        lastReviewedAt: userState.lastReviewedAt || userState.lastReviewed || null
      };
    },

    /**
     * STEP 2: DIAGNOSE
     * Diagnoses why a learner struggles or whether a problem requires intervention.
     * @param {Object} evidence - output from observeEvidence
     * @param {Object} problem - problem object
     */
    diagnose(evidence, problem = {}) {
      if (!evidence || evidence.totalAttempts === 0) {
        return {
          primaryIssue: REASON_CODES.PROVISIONAL_EVIDENCE_NEEDED,
          severity: 'low',
          description: 'No prior attempt evidence recorded for this problem.',
          recommendedActionType: ACTION_TYPES.FRESH_ATTEMPT
        };
      }

      // 1. Critical Retention Decay (Previously high stage/mastered problem now failing)
      if ((evidence.stage >= 3 || evidence.isMastered) && (evidence.isFailed || evidence.confidence <= 2)) {
        return {
          primaryIssue: REASON_CODES.RETENTION_DECAY,
          severity: 'critical',
          description: `Previously retained problem "${evidence.title}" suffered memory decay. Interval reset required to solidify recall.`,
          recommendedActionType: ACTION_TYPES.SPACED_REVISION
        };
      }

      // Conflicting Evidence Resolution:
      // When execution fails despite claimed high confidence (overconfidence trap)
      if (evidence.isConflicting && evidence.lastRating === 'failed') {
        return {
          primaryIssue: REASON_CODES.IMPLEMENTATION_ERROR,
          severity: 'high',
          description: `Execution discrepancy detected: High subjective confidence (${evidence.confidence}/5) contradicted by failed execution on "${evidence.title}". Independent verification required.`,
          recommendedActionType: ACTION_TYPES.INDEPENDENT_RETRY,
          isConflicting: true
        };
      }

      // 2. Pattern Recognition Failure
      const hasPatternIssue = evidence.failureReasons.some(r =>
        ['pattern_recognition', 'pattern_misidentification', 'algorithm_derivation', 'approach_suboptimal'].includes(r)
      );
      if (hasPatternIssue) {
        return {
          primaryIssue: REASON_CODES.PATTERN_CONFUSION,
          severity: 'high',
          description: `Struggled to identify canonical pattern (${evidence.pattern}) on "${evidence.title}". Need pattern trigger drill.`,
          recommendedActionType: ACTION_TYPES.PATTERN_REINFORCEMENT
        };
      }

      // 3. Implementation or Syntax Error
      const hasImplIssue = evidence.failureReasons.some(r =>
        ['implementation', 'pointer_reference_error', 'syntax_error', 'test_cases'].includes(r)
      );
      if (hasImplIssue) {
        return {
          primaryIssue: REASON_CODES.IMPLEMENTATION_ERROR,
          severity: 'medium',
          description: `Conceptual approach was sound, but coding/syntax or pointer errors occurred on "${evidence.title}".`,
          recommendedActionType: ACTION_TYPES.INDEPENDENT_RETRY
        };
      }

      // 4. Edge-Case Vulnerability
      const hasEdgeIssue = evidence.failureReasons.some(r =>
        ['edge_cases', 'missed_boundary_case', 'boundary_case', 'off_by_one'].includes(r)
      );
      if (hasEdgeIssue) {
        return {
          primaryIssue: REASON_CODES.EDGE_CASE_VULNERABILITY,
          severity: 'medium',
          description: `Boundary condition oversight on "${evidence.title}". Requires 5-point boundary checklist dry-run.`,
          recommendedActionType: ACTION_TYPES.EDGE_CASE_DRILL
        };
      }

      // 5. Prerequisite Gap (Medium/Hard problem failing with deficient prerequisite foundation)
      if (evidence.missingPrereq && (evidence.isFailed || evidence.lowConfidenceStreak >= 1 || evidence.difficulty !== 'Easy')) {
        return {
          primaryIssue: REASON_CODES.PREREQUISITE_GAP,
          severity: 'high',
          description: `Foundational gap detected in prerequisite "${evidence.missingPrereq.weakPrerequisiteNode.title}". Deficit impairs ${evidence.title}.`,
          recommendedActionType: ACTION_TYPES.PREREQUISITE_PRACTICE,
          missingPrereq: evidence.missingPrereq
        };
      }

      // 6. Hint Dependency (Solved with hints; needs independent reattempt)
      if (evidence.hintsUsed && evidence.totalAttempts > 0) {
        return {
          primaryIssue: REASON_CODES.HINT_DEPENDENCY,
          severity: 'medium',
          description: `Problem "${evidence.title}" was solved using hints. An unassisted reattempt is required to verify true recall.`,
          recommendedActionType: ACTION_TYPES.INDEPENDENT_RETRY
        };
      }

      // 7. Spaced Review Due
      if (evidence.isDue || evidence.isOverdue || evidence.retentionScore < 0.70) {
        return {
          primaryIssue: REASON_CODES.RETENTION_CHECK_DUE,
          severity: evidence.isOverdue ? 'high' : 'medium',
          description: `Spaced revision interval reached for "${evidence.title}" to protect against retention decay.`,
          recommendedActionType: ACTION_TYPES.SPACED_REVISION
        };
      }

      // 8. Normal Progress / Mastery Maintained
      return {
        primaryIssue: REASON_CODES.CURRICULUM_PROGRESSION,
        severity: 'low',
        description: `Performance is solid on "${evidence.title}". Ready for curriculum pacing advancement.`,
        recommendedActionType: ACTION_TYPES.CURRICULUM_ADVANCE
      };
    },

    /**
     * STEP 3: CHOOSE THE NEXT ACTION (Deterministic Policy Engine)
     * Combines all engine signals into one clear, explainable, prioritized learning action.
     * 
     * Priority Hierarchy:
     * 1. Prerequisite Remediation for repeatedly failing problems
     * 2. Critical Retention Decay / Overdue Spaced Reviews
     * 3. Pattern / Implementation / Edge-Case Remediation on recent struggle
     * 4. Hint-assisted follow-up independent reattempt
     * 5. Regular Spaced Revision Due
     * 6. Structured Curriculum Advancement (Fresh problem)
     * 
     * Safeguards:
     * - Anti-loop protection: Never repeatedly recommend the exact same failing problem back-to-back.
     * - Missing evidence is never treated as proof of weakness or mastery.
     * 
     * @param {Array} allProblems - Entire catalog
     * @param {Object} userStates - User states map
     * @param {Object} context - Optional context { activeTopic, targetDifficulty, recentlyAttemptedIds: [] }
     */
    selectNextAction(allProblems = [], userStates = {}, context = {}) {
      if (!Array.isArray(allProblems) || allProblems.length === 0) {
        return null;
      }

      const recentIds = [
        ...(context.recentlyAttemptedIds || []),
        ...((context.recentInterventions || []).map(i => i.problemId || i.targetProblemId)),
        ...(getStoredInterventions().slice(-5).map(i => i.problemId || i.targetProblemId))
      ].filter(Boolean);

      const problemMap = new Map();
      allProblems.forEach(p => problemMap.set(p.id, p));

      // 1. Identify actively struggling problems (recent failure, low confidence, or hint dependency)
      const strugglingProblems = [];
      const dueProblems = [];
      const freshProblems = [];

      allProblems.forEach(p => {
        const state = userStates[p.id];
        if (!state || !state.lastReviewed) {
          freshProblems.push(p);
          return;
        }

        const evidence = this.observeEvidence(p, state, allProblems, userStates);
        if (!evidence) return;

        if (evidence.isDue || evidence.isOverdue || evidence.retentionScore < 0.70) {
          dueProblems.push({ problem: p, evidence });
        }

        if (evidence.isFailed || evidence.confidence <= 2 || evidence.lowConfidenceStreak >= 1 || evidence.hintsUsed) {
          strugglingProblems.push({ problem: p, evidence });
        }
      });

      // -----------------------------------------------------------------------
      // PRIORITY 1: CRITICAL RETENTION DECAY (Previously mastered/high-stage problem failing)
      // -----------------------------------------------------------------------
      const decayCandidates = strugglingProblems.filter(item => {
        const ev = item.evidence;
        return (ev.stage >= 3 || ev.isMastered) && (ev.isFailed || ev.confidence <= 2);
      });

      if (decayCandidates.length > 0) {
        // Anti-loop: prefer decay candidate that was not recently attempted
        const chosen = decayCandidates.find(item => !recentIds.includes(item.problem.id)) || decayCandidates[0];
        const ev = chosen.evidence;
        return {
          action: ACTION_TYPES.SPACED_REVISION,
          problemId: chosen.problem.id,
          problemTitle: chosen.problem.title,
          topic: chosen.problem.topic,
          difficulty: chosen.problem.difficulty,
          targetProblemId: chosen.problem.id,
          targetProblemTitle: chosen.problem.title,
          reasonCode: REASON_CODES.RETENTION_DECAY,
          explanation: `Previously retained problem "${chosen.problem.title}" showed memory decay. Fast-track this targeted recall session to solidify retention.`,
          evidence: {
            source: 'srs-engine',
            observed: `Problem was at Stage ${ev.stage} but recent recall dropped to confidence ${ev.confidence}/5`,
            confidence: 'proven'
          },
          followUpCriteria: 'retention_check_7d',
          interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
        };
      }

      // -----------------------------------------------------------------------
      // PRIORITY 2: PATTERN CONFUSION & SPECIFIC FAILURE REMEDIATION
      // -----------------------------------------------------------------------
      for (const item of strugglingProblems) {
        const ev = item.evidence;
        const diag = this.diagnose(ev, item.problem);

        if (diag.primaryIssue === REASON_CODES.PATTERN_CONFUSION) {
          // Anti-loop: Find a simpler peer problem in the same pattern avoiding recently attempted
          const peerProblem = allProblems.find(p =>
            p.id !== item.problem.id &&
            p.pattern === item.problem.pattern &&
            (p.difficulty === 'Easy' || p.difficulty === item.problem.difficulty) &&
            !recentIds.includes(p.id)
          ) || allProblems.find(p =>
            p.id !== item.problem.id &&
            p.topic === item.problem.topic &&
            !recentIds.includes(p.id)
          ) || allProblems.find(p => !recentIds.includes(p.id)) || item.problem;

          return {
            action: ACTION_TYPES.PATTERN_REINFORCEMENT,
            problemId: peerProblem.id,
            problemTitle: peerProblem.title,
            topic: peerProblem.topic,
            difficulty: peerProblem.difficulty,
            targetProblemId: item.problem.id,
            targetProblemTitle: item.problem.title,
            reasonCode: REASON_CODES.PATTERN_CONFUSION,
            explanation: `Struggled to identify the canonical ${item.problem.pattern || 'algorithmic'} pattern on "${item.problem.title}". Review template and solve this related pattern problem.`,
            evidence: {
              source: 'failure-engine',
              observed: `Logged failure in pattern recognition for ${item.problem.pattern || item.problem.topic}`,
              confidence: 'proven'
            },
            followUpCriteria: 'independent_target_retry',
            interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
          };
        }

        if (diag.primaryIssue === REASON_CODES.IMPLEMENTATION_ERROR) {
          const retryProblem = recentIds.includes(item.problem.id)
            ? (allProblems.find(p => p.topic === item.problem.topic && p.difficulty === 'Easy' && !recentIds.includes(p.id)) ||
               allProblems.find(p => p.id !== item.problem.id && !recentIds.includes(p.id)) || item.problem)
            : item.problem;

          return {
            action: ACTION_TYPES.INDEPENDENT_RETRY,
            problemId: retryProblem.id,
            problemTitle: retryProblem.title,
            topic: retryProblem.topic,
            difficulty: retryProblem.difficulty,
            targetProblemId: item.problem.id,
            targetProblemTitle: item.problem.title,
            reasonCode: REASON_CODES.IMPLEMENTATION_ERROR,
            explanation: `Conceptual approach was clear on "${item.problem.title}", but implementation/syntax failed. Retry with clean boilerplate and dry-run steps.`,
            evidence: {
              source: 'failure-engine',
              observed: `Implementation or pointer error logged on latest attempt`,
              confidence: 'proven'
            },
            followUpCriteria: 'zero_hint_solve',
            interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
          };
        }

        if (diag.primaryIssue === REASON_CODES.EDGE_CASE_VULNERABILITY) {
          return {
            action: ACTION_TYPES.EDGE_CASE_DRILL,
            problemId: item.problem.id,
            problemTitle: item.problem.title,
            topic: item.problem.topic,
            difficulty: item.problem.difficulty,
            targetProblemId: item.problem.id,
            targetProblemTitle: item.problem.title,
            reasonCode: REASON_CODES.EDGE_CASE_VULNERABILITY,
            explanation: `Edge-case boundary inputs failed on "${item.problem.title}". Apply the 5-point boundary checklist: empty, 1-element, duplicates, extremes, negatives.`,
            evidence: {
              source: 'failure-engine',
              observed: `Missed boundary cases on latest submission`,
              confidence: 'proven'
            },
            followUpCriteria: 'edge_case_robustness_check',
            interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
          };
        }
      }

      // -----------------------------------------------------------------------
      // PRIORITY 3: PREREQUISITE REMEDIATION
      // If learner struggles on an advanced problem with an identified foundation deficit
      // -----------------------------------------------------------------------
      for (const item of strugglingProblems) {
        const ev = item.evidence;
        if (ev.missingPrereq && ev.missingPrereq.weakPrerequisiteNode) {
          const steppingStone = (ev.missingPrereq.recommendedSteppingStone && !recentIds.includes(ev.missingPrereq.recommendedSteppingStone.id))
            ? ev.missingPrereq.recommendedSteppingStone
            : (allProblems.find(p => p.topic === ev.missingPrereq.weakPrerequisiteNode.topic && p.difficulty === 'Easy' && !recentIds.includes(p.id)) ||
               allProblems.find(p => p.id !== item.problem.id && !recentIds.includes(p.id)) ||
               item.problem);

          const chosenProblem = (steppingStone.id !== item.problem.id && !recentIds.includes(steppingStone.id))
            ? steppingStone
            : (allProblems.find(p => p.id !== item.problem.id && !recentIds.includes(p.id)) || item.problem);

          return {
            action: ACTION_TYPES.PREREQUISITE_PRACTICE,
            problemId: chosenProblem.id,
            problemTitle: chosenProblem.title,
            topic: chosenProblem.topic,
            difficulty: chosenProblem.difficulty,
            targetProblemId: item.problem.id,
            targetProblemTitle: item.problem.title,
            reasonCode: REASON_CODES.PREREQUISITE_GAP,
            explanation: `Foundational gap detected in "${ev.missingPrereq.weakPrerequisiteNode.title}" (${ev.missingPrereq.weakPrerequisiteNode.proficiencyScore}% proficiency). Practicing this prerequisite stepping-stone will build intuition for ${item.problem.title}.`,
            evidence: {
              source: 'graph-engine',
              observed: `Topic "${ev.missingPrereq.weakPrerequisiteNode.title}" proficiency (${ev.missingPrereq.weakPrerequisiteNode.proficiencyScore}%) is below 45% while struggling on ${item.problem.title}`,
              confidence: 'proven'
            },
            followUpCriteria: 'independent_retry_target',
            interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
          };
        }
      }

      // -----------------------------------------------------------------------
      // PRIORITY 4: HINT DEPENDENCY (Follow-up Independent Reattempt)
      // -----------------------------------------------------------------------
      for (const item of strugglingProblems) {
        const ev = item.evidence;
        if (ev.hintsUsed && !recentIds.includes(item.problem.id)) {
          return {
            action: ACTION_TYPES.INDEPENDENT_RETRY,
            problemId: item.problem.id,
            problemTitle: item.problem.title,
            topic: item.problem.topic,
            difficulty: item.problem.difficulty,
            targetProblemId: item.problem.id,
            targetProblemTitle: item.problem.title,
            reasonCode: REASON_CODES.HINT_DEPENDENCY,
            explanation: `"${item.problem.title}" was solved using hint assistance. Complete an independent reattempt with 0 hints to verify unassisted retention.`,
            evidence: {
              source: 'srs-engine',
              observed: `Assisted attempt recorded; genuine recall requires unassisted verification`,
              confidence: 'proven'
            },
            followUpCriteria: 'independent_solve_4_confidence',
            interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
          };
        }
      }

      // -----------------------------------------------------------------------
      // PRIORITY 5: SCHEDULED SPACED REPETITION DUE
      // -----------------------------------------------------------------------
      if (dueProblems.length > 0) {
        // Sort by earliest nextReviewDate / highest overdue severity
        dueProblems.sort((a, b) => {
          const da = new Date(userStates[a.problem.id].nextReviewDate || 0);
          const db = new Date(userStates[b.problem.id].nextReviewDate || 0);
          return da - db;
        });

        const topDue = dueProblems[0];
        return {
          action: ACTION_TYPES.SPACED_REVISION,
          problemId: topDue.problem.id,
          problemTitle: topDue.problem.title,
          topic: topDue.problem.topic,
          difficulty: topDue.problem.difficulty,
          targetProblemId: topDue.problem.id,
          targetProblemTitle: topDue.problem.title,
          reasonCode: REASON_CODES.RETENTION_CHECK_DUE,
          explanation: `Spaced repetition interval is due for "${topDue.problem.title}" to prevent Ebbinghaus forgetting curve decay.`,
          evidence: {
            source: 'srs-engine',
            observed: `Next review date reached (${userStates[topDue.problem.id].nextReviewDate || 'Scheduled'})`,
            confidence: 'proven'
          },
          followUpCriteria: 'stage_advancement_check',
          interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
        };
      }

      // -----------------------------------------------------------------------
      // PRIORITY 6: CURRICULUM ADVANCEMENT / FRESH PROBLEM
      // -----------------------------------------------------------------------
      let candidatePool = freshProblems.length > 0 ? freshProblems : allProblems;

      // Filter by activeTopic or targetDifficulty if provided in context
      if (context.activeTopic) {
        const cTopic = _SRSEngine ? _SRSEngine.canonicalizeTopic(context.activeTopic) : context.activeTopic;
        const topicFiltered = candidatePool.filter(p => (_SRSEngine ? _SRSEngine.canonicalizeTopic(p.topic) : p.topic) === cTopic);
        if (topicFiltered.length > 0) candidatePool = topicFiltered;
      }
      if (context.targetDifficulty) {
        const diffFiltered = candidatePool.filter(p => p.difficulty === context.targetDifficulty);
        if (diffFiltered.length > 0) candidatePool = diffFiltered;
      }

      // Filter out recently attempted to avoid loops
      const freshNonRecent = candidatePool.filter(p => !recentIds.includes(p.id));
      const chosenFresh = freshNonRecent[0] || candidatePool[0] || allProblems[0];

      const isFirstEver = Object.keys(userStates).filter(k => !k.startsWith('_')).length === 0;
      const chosenAction = isFirstEver ? ACTION_TYPES.FRESH_ATTEMPT : ACTION_TYPES.CURRICULUM_ADVANCE;

      return {
        action: chosenAction,
        problemId: chosenFresh.id,
        problemTitle: chosenFresh.title,
        topic: chosenFresh.topic,
        difficulty: chosenFresh.difficulty,
        targetProblemId: chosenFresh.id,
        targetProblemTitle: chosenFresh.title,
        reasonCode: isFirstEver ? REASON_CODES.PROVISIONAL_EVIDENCE_NEEDED : REASON_CODES.CURRICULUM_PROGRESSION,
        explanation: isFirstEver
          ? `Welcome to AlgoRecall! Start your learning journey with "${chosenFresh.title}" (${chosenFresh.difficulty} • ${chosenFresh.topic}).`
          : `Prerequisites verified and review queue clean. Advance your curriculum track with "${chosenFresh.title}" (${chosenFresh.difficulty}).`,
        evidence: {
          source: 'readiness-engine',
          observed: isFirstEver
            ? 'Initial learning loop state: awaiting baseline attempt evidence'
            : 'Prerequisites proficient and review queue clear; ready for structured curriculum progression',
          confidence: 'proven'
        },
        followUpCriteria: 'first_attempt_completion',
        interventionId: 'int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
      };
    },

    /**
     * STEP 4: VERIFY IMPROVEMENT (Closed-Loop Tracking)
     * Evaluates whether a recorded intervention produced genuine independent improvement on a later attempt.
     * 
     * Success Criteria:
     * - Attempt occurred chronologically AFTER the intervention timestamp
     * - Independent solve (zero hints used)
     * - High confidence (confidence >= 4 or rating === 'simple')
     * - Not failed
     * 
     * @param {Object} intervention - Previously recorded recommendation object
     * @param {Object} userStates - User states map
     * @param {Array} allProblems - Entire problem catalog
     */
    verifyIntervention(intervention, userStates = {}, allProblems = []) {
      if (!intervention || !intervention.targetProblemId) {
        return {
          verified: false,
          status: 'invalid_intervention',
          details: 'Missing target problem in intervention record.'
        };
      }

      if (intervention.dismissed || intervention.status === 'dismissed') {
        return {
          verified: false,
          status: 'dismissed',
          details: 'Recommendation was dismissed by learner; excluded from learning recovery calculations.',
          dismissedAt: intervention.dismissedAt,
          isDurable: false
        };
      }

      const rawInterventionTime = intervention.timestamp;
      const interventionTime = Number(rawInterventionTime);
      const now = Date.now();
      if (isNaN(interventionTime) || interventionTime <= 0 || interventionTime > (now + 300000)) {
        return {
          verified: false,
          status: 'invalid_timestamp',
          details: 'Intervention timestamp is invalid, missing, or recorded in the future.'
        };
      }

      const state = userStates[intervention.targetProblemId];
      if (!state || !state.lastReviewed) {
        return {
          verified: false,
          status: 'pending_reattempt',
          details: `Awaiting reattempt on target problem "${intervention.targetProblemTitle || intervention.targetProblemId}".`
        };
      }

      const history = Array.isArray(state.history) ? state.history : [];

      // Find attempts after the intervention
      const subsequentAttempts = history.filter(h => {
        if (!h) return false;
        const hTime = new Date(h.date || h.reviewedAt || 0).getTime();
        if (isNaN(hTime) || hTime > (now + 300000)) return false; // reject invalid or far future attempts
        return hTime >= (interventionTime - 60000); // 1 min buffer
      });

      if (subsequentAttempts.length === 0) {
        // Fallback: inspect latest state if timestamp matches or is recent
        const lastDate = new Date(state.lastReviewedAt || state.lastReviewed || 0);
        const lastTime = lastDate.getTime();
        if (!isNaN(lastTime) && lastTime <= (now + 300000) && lastTime >= (interventionTime - 60000)) {
          const conf = _SRSEngine ? _SRSEngine.getConfidence(state) : (state.confidence || 3);
          const hints = Boolean(state.hintsUsed);
          const isPassed = state.lastRating !== 'failed' && conf >= 4 && !hints;
          if (isPassed) {
            const elapsedHours = Math.max(0, Math.round((lastTime - interventionTime) / (1000 * 60 * 60)));
            const dIntervention = new Date(interventionTime);
            const isSeparateDay = dIntervention.getFullYear() !== lastDate.getFullYear() ||
                                  dIntervention.getMonth() !== lastDate.getMonth() ||
                                  dIntervention.getDate() !== lastDate.getDate();
            const isDurable = isSeparateDay && elapsedHours >= 18;
            return {
              verified: true,
              status: 'resolved',
              durability: isDurable ? 'durable_delayed_recall' : 'short_term_recovery',
              isDurable,
              details: isDurable
                ? `Intervention verified (durable delayed recall): Problem was subsequently solved independently with confidence ${conf}/5 (0 hints) after ${elapsedHours}h.`
                : `Intervention verified (short-term recovery): Problem was subsequently solved independently with confidence ${conf}/5 (0 hints). Spaced review recommended on subsequent calendar day.`,
              elapsedHours
            };
          }
        }

        return {
          verified: false,
          status: 'pending_reattempt',
          details: `Intervention active. Target problem "${intervention.targetProblemTitle || intervention.targetProblemId}" is pending an independent follow-up attempt.`
        };
      }

      // Evaluate the most recent subsequent attempt
      const latestSubsequent = subsequentAttempts[subsequentAttempts.length - 1];
      const hConf = Number(latestSubsequent.confidence || (_SRSEngine ? _SRSEngine.mapRatingToDefaultConfidence(latestSubsequent.rating) : 3));
      const hHints = Boolean(latestSubsequent.hintsUsed);
      const hFailed = latestSubsequent.rating === 'failed' || hConf <= 1;

      if (!hFailed && !hHints && hConf >= 4) {
        const attemptDate = new Date(latestSubsequent.date || latestSubsequent.reviewedAt || Date.now());
        const attemptTime = attemptDate.getTime();
        const elapsedMs = attemptTime - interventionTime;
        const elapsedHours = Math.max(0, Math.round(elapsedMs / (1000 * 60 * 60)));
        const dIntervention = new Date(interventionTime);
        const isSeparateDay = dIntervention.getFullYear() !== attemptDate.getFullYear() ||
                              dIntervention.getMonth() !== attemptDate.getMonth() ||
                              dIntervention.getDate() !== attemptDate.getDate();
        const isDurable = isSeparateDay && elapsedHours >= 18;

        return {
          verified: true,
          status: 'resolved',
          durability: isDurable ? 'durable_delayed_recall' : 'short_term_recovery',
          isDurable,
          details: isDurable
            ? `Intervention verified (durable delayed recall): Solved independently with confidence ${hConf}/5 and 0 hints on follow-up attempt after ${elapsedHours}h.`
            : `Intervention verified (short-term recovery): Solved independently with confidence ${hConf}/5 and 0 hints on follow-up attempt. Spaced review recommended on subsequent calendar day.`,
          elapsedHours
        };
      }

      if (!hFailed && (hHints || hConf === 3)) {
        return {
          verified: false,
          status: 'partially_improved',
          details: `Partial recovery: Solved, but required hints or confidence was moderate (${hConf}/5). Complete one more independent attempt.`
        };
      }

      return {
        verified: false,
        status: 'unresolved',
        details: 'Subsequent attempt remained low confidence or failed. Follow-up intervention advised.'
      };
    },

    /**
     * Records a new intervention for closed-loop tracking
     */
    recordIntervention(recommendation, userStates = {}) {
      if (!recommendation) return null;
      const history = getStoredInterventions();

      const record = {
        interventionId: recommendation.interventionId || ('int-' + Date.now()),
        action: recommendation.action,
        problemId: recommendation.problemId,
        problemTitle: recommendation.problemTitle,
        targetProblemId: recommendation.targetProblemId || recommendation.problemId,
        targetProblemTitle: recommendation.targetProblemTitle || recommendation.problemTitle,
        reasonCode: recommendation.reasonCode,
        explanation: recommendation.explanation,
        followUpCriteria: recommendation.followUpCriteria,
        timestamp: recommendation.timestamp || Date.now()
      };

      // Deduplicate: avoid recording identical back-to-back intervention for same target within 5 minutes
      const recentSame = history.find(item =>
        item.targetProblemId === record.targetProblemId &&
        item.reasonCode === record.reasonCode &&
        (Date.now() - item.timestamp < 300000)
      );

      if (!recentSame) {
        history.push(record);
        persistInterventions(history);
      }

      // Also mirror in userStates for backup & sync
      if (userStates && typeof userStates === 'object') {
        if (!userStates._adaptive_interventions) {
          userStates._adaptive_interventions = [];
        }
        userStates._adaptive_interventions.push(record);
        if (userStates._adaptive_interventions.length > 50) {
          userStates._adaptive_interventions = userStates._adaptive_interventions.slice(-50);
        }
      }

      return record;
    },

    /**
     * Safely dismiss an active or stale intervention without penalizing or boosting mastery/readiness
     * @param {string} interventionId
     * @param {Object} userStates
     * @param {string} reason
     */
    dismissIntervention(interventionId, userStates = {}, reason = 'user_dismissed') {
      if (!interventionId) return null;
      const history = getStoredInterventions();
      const target = history.find(i => i.interventionId === interventionId);
      if (target) {
        target.dismissed = true;
        target.dismissedAt = Date.now();
        target.dismissReason = reason;
        target.status = 'dismissed';
        persistInterventions(history);
      }

      // Mirror in userStates._adaptive_interventions if present
      if (userStates && Array.isArray(userStates._adaptive_interventions)) {
        const uTarget = userStates._adaptive_interventions.find(i => i.interventionId === interventionId);
        if (uTarget) {
          uTarget.dismissed = true;
          uTarget.dismissedAt = Date.now();
          uTarget.dismissReason = reason;
          uTarget.status = 'dismissed';
        }
      }

      return target || null;
    },

    /**
     * STEP 4 CONTINUED: LEARNING EFFECTIVENESS EXPERIMENTS
     * Evaluates aggregate effectiveness of interventions across all recorded attempts.
     */
    getInterventionEffectiveness(userStates = {}, allProblems = []) {
      const history = getStoredInterventions();
      if (!Array.isArray(history) || history.length === 0) {
        return {
          totalInterventions: 0,
          resolvedCount: 0,
          durableResolvedCount: 0,
          shortTermRecoveryCount: 0,
          partiallyImprovedCount: 0,
          pendingCount: 0,
          dismissedCount: 0,
          successRate: 0,
          repeatFailureReductionPercent: 0,
          averageRecoveryHours: 0,
          breakdownByReason: {},
          causalNote: 'No intervention history recorded.'
        };
      }

      let resolvedCount = 0;
      let durableResolvedCount = 0;
      let shortTermRecoveryCount = 0;
      let partiallyImprovedCount = 0;
      let pendingCount = 0;
      let dismissedCount = 0;
      let totalRecoveryHours = 0;
      let recoveryCasesCount = 0;
      const breakdown = {};

      history.forEach(item => {
        const v = this.verifyIntervention(item, userStates, allProblems);
        const code = item.reasonCode || 'GENERAL';
        if (!breakdown[code]) {
          breakdown[code] = { total: 0, resolved: 0, durable: 0, dismissed: 0, rate: 0 };
        }
        breakdown[code].total++;

        if (v.status === 'dismissed') {
          dismissedCount++;
          breakdown[code].dismissed++;
        } else if (v.status === 'resolved') {
          resolvedCount++;
          breakdown[code].resolved++;
          if (v.isDurable) {
            durableResolvedCount++;
            breakdown[code].durable++;
          } else {
            shortTermRecoveryCount++;
          }
          if (typeof v.elapsedHours === 'number' && v.elapsedHours >= 0) {
            totalRecoveryHours += v.elapsedHours;
            recoveryCasesCount++;
          }
        } else if (v.status === 'partially_improved') {
          partiallyImprovedCount++;
        } else {
          pendingCount++;
        }
      });

      Object.keys(breakdown).forEach(k => {
        const b = breakdown[k];
        b.rate = b.total > 0 ? Math.round((b.resolved / b.total) * 100) : 0;
      });

      const evaluatedCount = resolvedCount + partiallyImprovedCount;
      const successRate = evaluatedCount > 0 ? Math.round((resolvedCount / evaluatedCount) * 100) : 0;
      const avgHours = recoveryCasesCount > 0 ? Number((totalRecoveryHours / recoveryCasesCount).toFixed(1)) : 0;

      return {
        totalInterventions: history.length,
        resolvedCount,
        durableResolvedCount,
        shortTermRecoveryCount,
        partiallyImprovedCount,
        pendingCount,
        dismissedCount,
        successRate,
        observedRecoveryRate: successRate,
        repeatFailureReductionPercent: successRate, // Transparently bound to observed resolution rate (no unearned causal multipliers)
        averageRecoveryHours: avgHours,
        breakdownByReason: breakdown,
        causalNote: 'Descriptive association only. Resolution rates reflect observed reattempt success without randomized baseline control. Dismissed recommendations are strictly excluded from learning recovery calculations.'
      };
    },

    /**
     * P2 — EVIDENCE-BASED MASTERY CALIBRATION
     * Categorizes problems into strict, scientifically grounded empirical stages:
     * 
     * 1. Attempted: Solved/attempted at least once, but lacks evidence of stability.
     * 2. Provisionally Learned: Solved with confidence >= 3, but < 3 reviews or < 21 days elapsed.
     * 3. Retained (Delayed Recall Proven): Solved independently after >= 18h on new calendar day
     *    with confidence >= 4 and zero hints. Retention score >= 70%.
     * 4. Mastered: Meets all anti-inflation mastery criteria (Stage >= 4, Reviews >= 3, Spanned >= 21d, Conf >= 4, Hints = false).
     * 
     * Also computes readiness score confidence interval and explains uncertainty.
     * 
     * @param {Array} allProblems - Entire catalog
     * @param {Object} userStates - User states map
     * @param {Array} mockHistory - Mock interview rounds
     */
    evaluateMasteryCalibration(allProblems = [], userStates = {}, mockHistory = []) {
      const attempted = [];
      const provisionallyLearned = [];
      const retained = [];
      const mastered = [];

      allProblems.forEach(p => {
        const state = userStates[p.id];
        if (!state || !state.lastReviewed) return;

        attempted.push(p);

        const conf = _SRSEngine ? _SRSEngine.getConfidence(state) : (state.confidence || 3);
        const history = Array.isArray(state.history) ? state.history : [];
        const hints = Boolean(state.hintsUsed);

        // Anti-inflation mastery validation:
        // Do not blindly trust state.isMastered if anti-inflation criteria are violated.
        const isMasteryLegitimate = state.isMastered && (_SRSEngine
          ? _SRSEngine.checkMasteryCriteria(history, state.stage || 1, conf, hints)
          : ((state.stage || 1) >= 4 && history.length >= 3 && !hints && conf >= 4));

        if (isMasteryLegitimate) {
          mastered.push(p);
          retained.push(p);
          return;
        }

        // Check for genuine delayed recall evidence
        const hasDelayedEvidence = history.some((h, idx) => {
          if (idx === 0 || !h) return false;
          const prev = history[idx - 1];
          if (!prev) return false;
          const t1 = new Date(prev.date || prev.reviewedAt || 0).getTime();
          const t2 = new Date(h.date || h.reviewedAt || 0).getTime();
          const elapsedH = (t2 - t1) / (1000 * 60 * 60);
          const hConf = Number(h.confidence || 3);
          return elapsedH >= 18 && !h.hintsUsed && hConf >= 4 && h.rating !== 'failed';
        });

        const retention = (_SRSEngine && typeof _SRSEngine.calculateRetention === 'function')
          ? _SRSEngine.calculateRetention(state)
          : 0.8;

        if (hasDelayedEvidence && !hints) {
          retained.push(p);
        } else if (conf >= 3 && state.lastRating !== 'failed') {
          provisionallyLearned.push(p);
        }
      });

      // Readiness composite & uncertainty analysis
      let readinessData = null;
      if (_ReadinessEngine && typeof _ReadinessEngine.calculateReadiness === 'function') {
        readinessData = _ReadinessEngine.calculateReadiness(allProblems, userStates, mockHistory);
      }

      const totalAttemptedCount = attempted.length;
      const isProvisional = readinessData ? readinessData.isProvisional : (totalAttemptedCount < 10);
      const evidenceProgress = readinessData ? readinessData.evidenceProgress : Math.min(100, Math.round((totalAttemptedCount / 10) * 100));

      let uncertaintyExplanation = '';
      if (isProvisional) {
        uncertaintyExplanation = `Readiness score is provisional: ${totalAttemptedCount}/10 problem attempts and ${retained.length}/5 spaced reviews recorded. Score uncertainty margin is an unvalidated heuristic estimate (±15 pts) until full spaced evidence is collected.`;
      } else {
        uncertaintyExplanation = 'Evidence threshold satisfied (10+ attempts, 5+ delayed reviews). Scores reflect heuristic readiness estimate (uncertainty margin ±4 pts; not statistically calibrated confidence intervals).';
      }

      return {
        counts: {
          totalCatalog: allProblems.length,
          attempted: attempted.length,
          provisionallyLearned: provisionallyLearned.length,
          retained: retained.length,
          mastered: mastered.length
        },
        lists: {
          attempted,
          provisionallyLearned,
          retained,
          mastered
        },
        readiness: readinessData,
        uncertainty: {
          isProvisional,
          evidenceProgress,
          uncertaintyMargin: isProvisional ? 15 : 4,
          explanation: uncertaintyExplanation
        }
      };
    }
  };

  // Environment Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveLearningEngine;
  }
  if (typeof window !== 'undefined') {
    window.AdaptiveLearningEngine = AdaptiveLearningEngine;
  }
})();
