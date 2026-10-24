/**
 * AlgoRecall 2.0 — Solution Discovery Trainer Engine (Stage 1 Domain Model)
 * Pure domain logic, state machine, progressive hint tracker, and attempt outcome classifier.
 *
 * Supported environments: Browser (window.SolutionDiscoveryEngine) and Node.js (CommonJS).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SolutionDiscoveryEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // 8-step structured workflow sequence
  const WORKFLOW_STEPS = [
    { id: 'understanding', index: 0, title: 'Problem Understanding', required: true },
    { id: 'brute_force', index: 1, title: 'Brute-Force Thinking', required: false },
    { id: 'bottleneck', index: 2, title: 'Bottleneck Identification', required: false },
    { id: 'pattern', index: 3, title: 'Pattern Discovery', required: false },
    { id: 'optimization', index: 4, title: 'Optimization Strategy', required: false },
    { id: 'complexity', index: 5, title: 'Complexity Analysis', required: false },
    { id: 'implementation', index: 6, title: 'Implementation Attempt', required: true },
    { id: 'reflection', index: 7, title: 'Lessons & Reflection', required: false }
  ];

  // 5 progressive hint levels
  const HINT_LEVELS = [
    { level: 1, title: 'Conceptual Hint', category: 'conceptual' },
    { level: 2, title: 'Pattern Hint', category: 'pattern' },
    { level: 3, title: 'Approach Hint', category: 'approach' },
    { level: 4, title: 'Implementation Guidance', category: 'implementation' },
    { level: 5, title: 'Complete Solution Reveal', category: 'solution_reveal' }
  ];

  // Classified attempt outcomes
  const OUTCOMES = {
    INDEPENDENT_SOLVE: 'independent_solve',
    ASSISTED_SOLVE: 'assisted_solve',
    SOLUTION_REVEAL: 'solution_reveal',
    FAILED_ATTEMPT: 'failed_attempt',
    PAUSED: 'paused',
    ABANDONED: 'abandoned'
  };

  /**
   * Analytics governance and score weight metadata (Stage 2 contract)
   * Prohibited from use as SRS interval multipliers or mastery calculation factors.
   */
  const ANALYTICS_CONFIG = {
    SCORE_WEIGHTS: {
      [OUTCOMES.INDEPENDENT_SOLVE]: 1.0,
      [OUTCOMES.ASSISTED_SOLVE]: 0.7,
      [OUTCOMES.SOLUTION_REVEAL]: 0.25,
      [OUTCOMES.FAILED_ATTEMPT]: 0.0,
      [OUTCOMES.PAUSED]: null,
      [OUTCOMES.ABANDONED]: null
    },
    DENOMINATOR_DEFINITION: 'Total terminal completed attempts (N_completed). Paused and abandoned sessions are excluded.',
    INTERPRETATION: 'Cognitive independence heuristic index (0.0 to 1.0). Provisional analytics metadata only; not an SRS multiplier.',
    IS_SRS_MULTIPLIER: false,
    IS_MASTERY_FACTOR: false
  };

  /**
   * Create a new, isolated Solution Discovery session draft for a problem
   * @param {string|number} problemId - Problem identifier from catalog
   * @param {Object} [metadata={}] - Optional metadata (title, topic, difficulty, etc.)
   * @returns {Object} Fresh session state
   */
  function createSession(problemId, metadata = {}) {
    if (!problemId) {
      throw new Error('SolutionDiscoveryEngine: problemId is required to create a session');
    }

    const now = Date.now();
    return {
      schemaVersion: '2.0.0',
      draftVersion: 1,
      sessionId: 'sds_' + String(problemId) + '_' + now + '_' + Math.random().toString(36).substr(2, 6),
      problemId: String(problemId),
      metadata: {
        title: metadata.title || '',
        topic: metadata.topic || '',
        difficulty: metadata.difficulty || 'Medium',
        pattern: metadata.pattern || '',
        url: metadata.url || ''
      },
      currentStep: 'understanding',
      status: 'in_progress', // 'in_progress', 'paused', 'completed', 'abandoned'
      createdAt: now,
      updatedAt: now,
      pausedAt: null,
      abandonedAt: null,
      completedAt: null,
      steps: {
        understanding: { notes: '', constraints: '', inputsOutputs: '', completed: false, updatedAt: null },
        brute_force: { notes: '', estimatedTime: '', estimatedSpace: '', completed: false, updatedAt: null },
        bottleneck: { notes: '', whyBottleneck: '', completed: false, updatedAt: null },
        pattern: { predictedPattern: '', rationale: '', completed: false, updatedAt: null },
        optimization: { approach: '', invariant: '', completed: false, updatedAt: null },
        complexity: { targetTime: '', targetSpace: '', justification: '', completed: false, updatedAt: null },
        implementation: { code: '', testCasesPassed: null, completed: false, updatedAt: null },
        reflection: { mistakes: '', missedClues: '', lessonsLearned: '', skipped: false, completed: false, updatedAt: null }
      },
      hints: {
        revealedLevels: [], // Array of revealed hint levels (1..5)
        history: [], // [{ level, revealedAt }]
        solutionRevealed: false,
        solutionRevealedAt: null
      },
      classification: null // Set when session reaches terminal outcome
    };
  }

  /**
   * Validate if a session object has valid structure
   * @param {Object} session
   * @returns {boolean}
   */
  function isValidSession(session) {
    if (!session || typeof session !== 'object') return false;
    if (!session.sessionId || !session.problemId || !session.steps || !session.hints) return false;
    if (!Array.isArray(session.hints.revealedLevels)) return false;
    if (session.schemaVersion && typeof session.schemaVersion === 'string') {
      const major = parseInt(session.schemaVersion.split('.')[0], 10);
      if (!isNaN(major) && major > 2) return false;
    }
    return true;
  }

  /**
   * Get metadata for a workflow step
   * @param {string} stepId
   * @returns {Object|null}
   */
  function getStepMeta(stepId) {
    return WORKFLOW_STEPS.find(s => s.id === stepId) || null;
  }

  /**
   * Check if session can advance from currentStep to nextStep
   * @param {Object} session
   * @returns {boolean}
   */
  function canAdvance(session) {
    if (!isValidSession(session) || session.status !== 'in_progress') return false;

    const currentMeta = getStepMeta(session.currentStep);
    if (!currentMeta) return false;

    // Last step cannot advance forward
    if (currentMeta.index >= WORKFLOW_STEPS.length - 1) return false;

    const stepData = session.steps[session.currentStep];
    if (currentMeta.required) {
      if (currentMeta.id === 'understanding') {
        // Understanding requires at least one field populated
        const hasNotes = Boolean(stepData.notes && stepData.notes.trim());
        const hasConstraints = Boolean(stepData.constraints && stepData.constraints.trim());
        const hasIO = Boolean(stepData.inputsOutputs && stepData.inputsOutputs.trim());
        return hasNotes || hasConstraints || hasIO;
      }
      if (currentMeta.id === 'implementation') {
        // Implementation requires code draft, marked completed, or verified checklist/tests
        const hasCode = Boolean(stepData.code && stepData.code.trim());
        const hasChecklist = Boolean(stepData.implemented || stepData.sampleTestsVerified || (stepData.testCasesPassed && String(stepData.testCasesPassed).trim()));
        return hasCode || hasChecklist || Boolean(stepData.completed);
      }
    }

    return true;
  }

  /**
   * Advance session to the next sequential step
   * @param {Object} session
   * @returns {Object} Updated session
   */
  function nextStep(session) {
    if (!isValidSession(session)) throw new Error('Invalid session state');

    const currentMeta = getStepMeta(session.currentStep);
    if (!currentMeta) throw new Error('Unknown step: ' + session.currentStep);

    if (currentMeta.index < WORKFLOW_STEPS.length - 1) {
      session.steps[session.currentStep].completed = true;
      session.steps[session.currentStep].updatedAt = Date.now();
      session.currentStep = WORKFLOW_STEPS[currentMeta.index + 1].id;
      session.updatedAt = Date.now();
    }

    return session;
  }

  /**
   * Return session to the previous sequential step
   * @param {Object} session
   * @returns {Object} Updated session
   */
  function prevStep(session) {
    if (!isValidSession(session)) throw new Error('Invalid session state');

    const currentMeta = getStepMeta(session.currentStep);
    if (!currentMeta) throw new Error('Unknown step: ' + session.currentStep);

    if (currentMeta.index > 0) {
      session.currentStep = WORKFLOW_STEPS[currentMeta.index - 1].id;
      session.updatedAt = Date.now();
    }

    return session;
  }

  /**
   * Navigate directly to a specific step if unlocked
   * @param {Object} session
   * @param {string} targetStepId
   * @returns {Object} Updated session
   */
  function jumpToStep(session, targetStepId) {
    if (!isValidSession(session)) throw new Error('Invalid session state');

    const targetMeta = getStepMeta(targetStepId);
    if (!targetMeta) throw new Error('Invalid target step: ' + targetStepId);

    session.currentStep = targetMeta.id;
    session.updatedAt = Date.now();
    return session;
  }

  /**
   * Update fields for a given step in the session
   * @param {Object} session
   * @param {string} stepId
   * @param {Object} fields
   * @returns {Object} Updated session
   */
  function updateStep(session, stepId, fields = {}) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    if (!session.steps[stepId]) throw new Error('Step not found: ' + stepId);

    const now = Date.now();
    Object.assign(session.steps[stepId], fields, { updatedAt: now });
    session.updatedAt = now;
    return session;
  }

  /**
   * Explicitly skip an optional step (e.g. reflection)
   * @param {Object} session
   * @param {string} stepId
   * @returns {Object} Updated session
   */
  function skipStep(session, stepId) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    const meta = getStepMeta(stepId);
    if (!meta || meta.required) {
      throw new Error('Cannot skip required step: ' + stepId);
    }

    const now = Date.now();
    session.steps[stepId].skipped = true;
    session.steps[stepId].completed = true;
    session.steps[stepId].updatedAt = now;
    session.updatedAt = now;
    return session;
  }

  /**
   * Reveal a progressive hint level (1 to 5) with strict idempotency
   * @param {Object} session
   * @param {number} level - 1 to 5
   * @returns {Object} { session, newlyRevealed: boolean, levelTitle: string }
   */
  function revealHint(session, level) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    const parsedLevel = parseInt(level, 10);
    if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 5) {
      throw new Error('Hint level must be an integer between 1 and 5');
    }

    const hintMeta = HINT_LEVELS[parsedLevel - 1];
    const now = Date.now();
    let newlyRevealed = false;

    // Idempotency: only add if not already revealed
    if (!session.hints.revealedLevels.includes(parsedLevel)) {
      session.hints.revealedLevels.push(parsedLevel);
      session.hints.revealedLevels.sort((a, b) => a - b);
      session.hints.history.push({
        level: parsedLevel,
        title: hintMeta.title,
        revealedAt: now
      });
      newlyRevealed = true;

      if (parsedLevel === 5) {
        session.hints.solutionRevealed = true;
        session.hints.solutionRevealedAt = now;
      }

      session.updatedAt = now;
    }

    return {
      session,
      newlyRevealed,
      level: parsedLevel,
      levelTitle: hintMeta.title,
      category: hintMeta.category
    };
  }

  /**
   * Explicitly reveal the full solution (Level 5)
   * @param {Object} session
   * @returns {Object}
   */
  function revealCompleteSolution(session) {
    return revealHint(session, 5);
  }

  /**
   * Determine the classified outcome of an attempt
   * Precise semantics:
   * 1. If explicit solution reveal (Level 5) occurred -> SOLUTION_REVEAL
   * 2. If explicitly submitted as failed / unable to solve -> FAILED_ATTEMPT
   * 3. If solved with 0 hints revealed and 0 solution reveals -> INDEPENDENT_SOLVE
   * 4. If solved with >= 1 hints (levels 1-4) and 0 solution reveals -> ASSISTED_SOLVE
   *
   * @param {Object} session
   * @param {Object} [submission={}] - { solved: boolean, explicitFailure: boolean }
   * @returns {Object} { outcome, isIndependent, isAssisted, isSolutionReveal, isFailure, hintCount, scoreWeight }
   */
  function classifyOutcome(session, submission = {}) {
    if (!isValidSession(session)) throw new Error('Invalid session state');

    const hintsRevealed = session.hints.revealedLevels || [];
    const solutionRevealed = session.hints.solutionRevealed || hintsRevealed.includes(5);
    const hintCount = hintsRevealed.filter(lvl => lvl < 5).length;
    const isExplicitFailure = Boolean(submission.explicitFailure || submission.solved === false);
    const isSolved = Boolean(submission.solved === true);

    let outcome = null;
    let scoreWeight = 0;

    if (solutionRevealed) {
      outcome = OUTCOMES.SOLUTION_REVEAL;
      scoreWeight = 0.25; // Explanatory review only, zero independent mastery credit
    } else if (isExplicitFailure) {
      outcome = OUTCOMES.FAILED_ATTEMPT;
      scoreWeight = 0.0;
    } else if (isSolved) {
      if (hintCount === 0) {
        outcome = OUTCOMES.INDEPENDENT_SOLVE;
        scoreWeight = 1.0;
      } else {
        outcome = OUTCOMES.ASSISTED_SOLVE;
        // Assisted solve weight scales down mildly with higher hint levels (e.g. 0.85 for 1 hint, 0.65 for 4 hints)
        scoreWeight = Math.max(0.5, 1.0 - (hintCount * 0.1));
      }
    } else {
      // Default fallback if not explicitly marked solved
      outcome = hintCount > 0 ? OUTCOMES.ASSISTED_SOLVE : OUTCOMES.INDEPENDENT_SOLVE;
      scoreWeight = hintCount > 0 ? 0.7 : 1.0;
    }

    return {
      outcome,
      isIndependent: outcome === OUTCOMES.INDEPENDENT_SOLVE,
      isAssisted: outcome === OUTCOMES.ASSISTED_SOLVE,
      isSolutionReveal: outcome === OUTCOMES.SOLUTION_REVEAL,
      isFailure: outcome === OUTCOMES.FAILED_ATTEMPT,
      hintCount,
      revealedLevels: [...hintsRevealed],
      solutionRevealed,
      scoreWeight
    };
  }

  /**
   * Complete the session with a terminal classified outcome
   * @param {Object} session
   * @param {Object} submission - { solved: boolean, explicitFailure: boolean, notes: string }
   * @returns {Object} Completed session with classification
   */
  function completeSession(session, submission = {}) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    if (session.status === 'completed') return session;

    const now = Date.now();
    const classification = classifyOutcome(session, submission);

    session.status = 'completed';
    session.completedAt = now;
    session.updatedAt = now;
    session.classification = classification;

    return session;
  }

  /**
   * Abandon an in-progress session without penalizing the learner
   * @param {Object} session
   * @returns {Object}
   */
  function abandonSession(session) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    const now = Date.now();
    session.status = 'abandoned';
    session.abandonedAt = now;
    session.updatedAt = now;
    return session;
  }

  /**
   * Pause an in-progress session to safely resume later
   * @param {Object} session
   * @returns {Object}
   */
  function pauseSession(session) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    if (session.status === 'completed') throw new Error('Cannot pause a completed session');
    const now = Date.now();
    session.status = 'paused';
    session.pausedAt = now;
    session.updatedAt = now;
    return session;
  }

  /**
   * Resume a paused session
   * @param {Object} session
   * @returns {Object}
   */
  function resumeSession(session) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    if (session.status !== 'paused') return session;
    const now = Date.now();
    session.status = 'in_progress';
    session.updatedAt = now;
    return session;
  }

  /**
   * Generate a stable, deterministic event ID for completed outcomes
   * @param {Object} session
   * @returns {string}
   */
  function generateEventId(session) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    const sid = session.sessionId || 'session';
    const pid = session.problemId || 'problem';
    const outcome = session.classification?.outcome || session.status || 'unknown';
    const ts = session.completedAt || session.updatedAt || Date.now();
    return `evt_sde_${pid}_${sid}_${outcome}_${ts}`;
  }

  /**
   * Deterministically map a classified session outcome to SRS review parameters.
   * Enforces strict learning science invariants:
   * 1. Paused and abandoned sessions NEVER trigger SRS events (shouldApplySRS: false).
   * 2. Assisted solves and solution reveals NEVER award independent mastery (allowMastery: false, isIndependent: false).
   * 3. Independent solves are eligible for mastery evaluation only if confidence >= 4 and 0 hints used.
   * 4. Solution reveal forces recognition-only review (confidence capped at 2, hintsUsed: true).
   * 5. Failed attempt enforces Priority 1 failure reset (rating: 'failed', confidence: 1).
   * 6. Self-reported verification provenance is explicitly flagged as 'trainer_guided_self_reported', never 'externally_verified'.
   *
   * @param {Object} session
   * @param {Object} [userRatingInput={}] - Optional user feedback { rating, confidence, notes, timeSpentMinutes }
   * @returns {Object}
   */
  function mapOutcomeToSRS(session, userRatingInput = {}) {
    if (!isValidSession(session)) throw new Error('Invalid session state');

    const status = session.status;

    // Mandatory Invariant: Paused and Abandoned sessions NEVER produce SRS events
    if (status === 'paused' || status === 'abandoned') {
      return {
        shouldApplySRS: false,
        outcome: status === 'paused' ? OUTCOMES.PAUSED : OUTCOMES.ABANDONED,
        reason: 'Session was paused or abandoned before completion',
        rating: null,
        confidence: null,
        hintsUsed: false,
        isIndependent: false,
        allowMastery: false,
        xpEvent: null,
        provenance: 'none',
        isExternallyVerified: false
      };
    }

    const classification = session.classification || classifyOutcome(session, userRatingInput);
    const outcome = classification.outcome;

    if (outcome === OUTCOMES.PAUSED || outcome === OUTCOMES.ABANDONED) {
      return {
        shouldApplySRS: false,
        outcome,
        reason: 'Session was paused or abandoned before completion',
        rating: null,
        confidence: null,
        hintsUsed: false,
        isIndependent: false,
        allowMastery: false,
        xpEvent: null,
        provenance: 'none',
        isExternallyVerified: false
      };
    }

    const timeSpent = typeof userRatingInput.timeSpentMinutes === 'number'
      ? userRatingInput.timeSpentMinutes
      : Math.max(1, Math.round(((session.completedAt || Date.now()) - session.createdAt) / (1000 * 60)));

    const notes = (userRatingInput.notes || session.steps?.reflection?.lessonsLearned || '').trim();

    let rating = userRatingInput.rating || 'medium';
    let confidence = userRatingInput.confidence !== undefined && userRatingInput.confidence !== null
      ? Number(userRatingInput.confidence)
      : null;
    let hintsUsed = false;
    let isIndependent = false;
    let allowMastery = false;
    let xpEvent = 'review';

    switch (outcome) {
      case OUTCOMES.INDEPENDENT_SOLVE:
        hintsUsed = false;
        confidence = (confidence !== null && confidence >= 1 && confidence <= 5) ? confidence : 4;
        rating = userRatingInput.rating || (confidence >= 4 ? 'simple' : 'medium');
        isIndependent = confidence >= 4;
        allowMastery = isIndependent;
        xpEvent = 'independent_solve';
        break;

      case OUTCOMES.ASSISTED_SOLVE:
        hintsUsed = true;
        confidence = (confidence !== null && confidence >= 1 && confidence <= 5) ? confidence : 3;
        rating = userRatingInput.rating || 'medium';
        isIndependent = false;
        allowMastery = false;
        xpEvent = 'review';
        break;

      case OUTCOMES.SOLUTION_REVEAL:
        hintsUsed = true;
        confidence = Math.min(2, (confidence !== null ? confidence : 2));
        rating = userRatingInput.rating === 'failed' ? 'failed' : 'hard';
        isIndependent = false;
        allowMastery = false;
        xpEvent = 'review';
        break;

      case OUTCOMES.FAILED_ATTEMPT:
        hintsUsed = Boolean(session.hints?.revealedLevels?.length > 0);
        confidence = 1;
        rating = 'failed';
        isIndependent = false;
        allowMastery = false;
        xpEvent = null;
        break;

      default:
        throw new Error(`Unknown outcome: ${outcome}`);
    }

    const hasExternalEvidence = Boolean(
      userRatingInput.verificationEvidence &&
      userRatingInput.verificationEvidence.verifiedByJudge &&
      userRatingInput.verificationEvidence.submissionId
    );
    const provenance = hasExternalEvidence ? 'externally_verified' : 'trainer_guided_self_reported';
    const isExternallyVerified = hasExternalEvidence;

    return {
      shouldApplySRS: true,
      outcome,
      rating,
      confidence,
      hintsUsed,
      isIndependent,
      allowMastery,
      xpEvent,
      timeSpentMinutes: timeSpent,
      notes,
      scoreWeight: classification.scoreWeight,
      provenance,
      isExternallyVerified
    };
  }

  /**
   * Create an immutable, durable event object for exactly-once processing
   * @param {Object} session
   * @param {string} [userId='guest']
   * @param {Object} [userRatingInput={}]
   * @returns {Object}
   */
  function createDurableEvent(session, userId = 'guest', userRatingInput = {}) {
    if (!isValidSession(session)) throw new Error('Invalid session state');

    const eventId = generateEventId(session);
    const srsMapping = mapOutcomeToSRS(session, userRatingInput);
    const classification = session.classification || classifyOutcome(session);

    return {
      eventId,
      schemaVersion: '2.0.0',
      sessionId: session.sessionId,
      problemId: session.problemId,
      userId: String(userId || 'guest'),
      outcome: classification.outcome,
      classification,
      srsMapping,
      analytics: {
        scoreWeight: classification.scoreWeight,
        metricDenominator: 1,
        interpretation: ANALYTICS_CONFIG.INTERPRETATION
      },
      provenance: {
        type: srsMapping.provenance,
        isExternallyVerified: srsMapping.isExternallyVerified,
        evidence: userRatingInput.verificationEvidence || null,
        completedAt: session.completedAt || Date.now()
      },
      createdAt: Date.now()
    };
  }

  /**
   * Serialize session to clean, safe JSON
   * @param {Object} session
   * @returns {string}
   */
  function serializeSession(session) {
    if (!isValidSession(session)) throw new Error('Invalid session state');
    return JSON.stringify(session);
  }

  /**
   * Deserialize session from JSON with integrity verification
   * @param {string} jsonString
   * @returns {Object|null}
   */
  function deserializeSession(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') return null;
    try {
      const parsed = JSON.parse(jsonString);
      if (isValidSession(parsed)) {
        return parsed;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  return {
    WORKFLOW_STEPS,
    HINT_LEVELS,
    OUTCOMES,
    ANALYTICS_CONFIG,
    createSession,
    isValidSession,
    getStepMeta,
    canAdvance,
    nextStep,
    prevStep,
    jumpToStep,
    updateStep,
    skipStep,
    revealHint,
    revealCompleteSolution,
    classifyOutcome,
    completeSession,
    abandonSession,
    pauseSession,
    resumeSession,
    generateEventId,
    mapOutcomeToSRS,
    createDurableEvent,
    serializeSession,
    deserializeSession
  };
});
