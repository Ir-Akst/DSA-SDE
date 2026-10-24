/**
 * AlgoRecall 2.0 — Solution Discovery Controller (Stage 3 & 4)
 * Coordinates in-progress session drafts, stepper navigation, progressive hints,
 * exactly-once event pipeline, SRS committal, and Obsidian Dark UI lifecycle.
 *
 * Supported environments: Browser and Node.js CommonJS.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SolutionDiscoveryController = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Dependency Resolution
  function getEngine() {
    return (typeof window !== 'undefined' && window.SolutionDiscoveryEngine) ||
      (typeof require !== 'undefined' ? require('./solution-discovery-engine') : null);
  }

  function getRepo() {
    return (typeof window !== 'undefined' && window.LearnerRepository) ||
      (typeof require !== 'undefined' ? require('./learner-repository') : null);
  }

  function getSRS() {
    return (typeof window !== 'undefined' && window.SRSEngine) ||
      (typeof require !== 'undefined' ? require('./srs-engine') : null);
  }

  function getGamification() {
    return (typeof window !== 'undefined' && window.GamificationEngine) ||
      (typeof require !== 'undefined' ? require('./gamification-engine') : null);
  }

  // Active Controller State
  let activeSession = null;
  let activeProblem = null;
  let isModalOpen = false;
  const _inFlightEventIds = new Set();
  let _lastPersistenceError = null;

  function getLastPersistenceError() {
    return _lastPersistenceError ? { ..._lastPersistenceError } : null;
  }

  function clearLastPersistenceError() {
    _lastPersistenceError = null;
    clearPersistenceErrorUI();
  }

  function surfacePersistenceError(err) {
    if (typeof document === 'undefined') return;
    const meta = document.getElementById('trainer-modal-problem-meta');
    if (meta) {
      let banner = document.getElementById('trainer-storage-warning');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'trainer-storage-warning';
        banner.style.cssText = 'color:#f59e0b;font-size:12px;margin-top:4px;display:flex;align-items:center;gap:6px;';
        meta.appendChild(banner);
      }
      banner.textContent = (err && err.code === 'QUOTA_EXCEEDED')
        ? '⚠️ Storage quota exceeded: progress may not persist across reloads.'
        : '⚠️ Auto-save failed: changes may not be saved locally.';
    }
  }

  function clearPersistenceErrorUI() {
    if (typeof document === 'undefined') return;
    const banner = document.getElementById('trainer-storage-warning');
    if (banner && banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  }

  function persistDraft(problemId, session, ctx) {
    const Repo = getRepo();
    if (!Repo || !problemId || !session) return true;
    const ok = Repo.saveTrainerDraft(problemId, session, ctx);
    if (!ok) {
      const storageErr = (typeof Repo.getLastStorageError === 'function') ? Repo.getLastStorageError() : null;
      _lastPersistenceError = storageErr || {
        code: 'SAVE_FAILED',
        problemId,
        message: 'Could not persist trainer draft to local storage',
        timestamp: Date.now()
      };
      surfacePersistenceError(_lastPersistenceError);
      return false;
    } else {
      _lastPersistenceError = null;
      clearPersistenceErrorUI();
      return true;
    }
  }

  /**
   * Initialize a Discovery Trainer session for a problem.
   * Restores existing draft if present in active context, or creates a fresh session.
   *
   * @param {string|number|Object} problem - Problem ID or Problem definition object
   * @param {Object} [options={}] - { forceFresh: boolean, ctx: Object }
   * @returns {Object} { session, isRestoredDraft: boolean }
   */
  function startSession(problem, options = {}) {
    const Engine = getEngine();
    const Repo = getRepo();
    if (!Engine) throw new Error('SolutionDiscoveryEngine not found');

    const problemId = typeof problem === 'object' ? problem.id : String(problem);
    const meta = typeof problem === 'object' ? {
      title: problem.title || '',
      topic: problem.topic || '',
      difficulty: problem.difficulty || 'Medium',
      pattern: problem.pattern || '',
      url: problem.url || ''
    } : {};

    activeProblem = typeof problem === 'object' ? { ...problem, ...meta } : { id: problemId, ...meta };

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : { type: 'guest', id: 'guest', isGuest: true });
    let session = null;
    let isRestoredDraft = false;

    // Check for existing draft in the target context
    if (!options.forceFresh && Repo) {
      const existingDraft = Repo.getTrainerDraft(problemId, ctx);
      if (existingDraft && Engine.isValidSession(existingDraft) && existingDraft.status !== 'completed' && existingDraft.status !== 'abandoned') {
        session = existingDraft;
        isRestoredDraft = true;
        // If it was paused, resume it
        if (session.status === 'paused') {
          session = Engine.resumeSession(session);
        }
      }
    }

    if (!session) {
      session = Engine.createSession(problemId, meta);
    }

    activeSession = session;

    // Save initial/resumed draft safely
    persistDraft(problemId, session, ctx);

    return { session: activeSession, isRestoredDraft };
  }

  /**
   * Get the current active session
   * @returns {Object|null}
   */
  function getActiveSession() {
    return activeSession ? { ...activeSession } : null;
  }

  /**
   * Save field updates for the specified step and auto-persist draft
   * @param {string} stepId
   * @param {Object} fields
   * @param {Object} [options={}]
   * @returns {Object} Updated session
   */
  function updateStep(stepId, fields = {}, options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    activeSession = Engine.updateStep(activeSession, stepId, fields);

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (activeSession.problemId) {
      persistDraft(activeSession.problemId, activeSession, ctx);
    }

    return activeSession;
  }

  /**
   * Advance to next step
   * @param {Object} [options={}]
   * @returns {Object} Updated session
   */
  function nextStep(options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    if (!Engine.canAdvance(activeSession)) {
      throw new Error(`Cannot advance: Current step "${activeSession.currentStep}" requirements not met`);
    }

    activeSession = Engine.nextStep(activeSession);

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (activeSession.problemId) {
      persistDraft(activeSession.problemId, activeSession, ctx);
    }

    return activeSession;
  }

  /**
   * Go back to previous step
   * @param {Object} [options={}]
   * @returns {Object} Updated session
   */
  function prevStep(options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    activeSession = Engine.prevStep(activeSession);

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (activeSession.problemId) {
      persistDraft(activeSession.problemId, activeSession, ctx);
    }

    return activeSession;
  }

  /**
   * Jump to target step
   * @param {string} stepId
   * @param {Object} [options={}]
   * @returns {Object} Updated session
   */
  function jumpToStep(stepId, options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    activeSession = Engine.jumpToStep(activeSession, stepId);

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (activeSession.problemId) {
      persistDraft(activeSession.problemId, activeSession, ctx);
    }

    return activeSession;
  }

  /**
   * Skip an optional step (e.g. reflection)
   * @param {string} stepId
   * @param {Object} [options={}]
   * @returns {Object} Updated session
   */
  function skipStep(stepId, options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    activeSession = Engine.skipStep(activeSession, stepId);

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (activeSession.problemId) {
      persistDraft(activeSession.problemId, activeSession, ctx);
    }

    return activeSession;
  }

  /**
   * Reveal progressive hint level (1..5)
   * @param {number} level
   * @param {Object} [options={}]
   * @returns {Object} Hint reveal result { session, newlyRevealed, level, levelTitle }
   */
  function revealHint(level, options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    const res = Engine.revealHint(activeSession, level);
    activeSession = res.session;

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (activeSession.problemId) {
      persistDraft(activeSession.problemId, activeSession, ctx);
    }

    return res;
  }

  /**
   * Pause active session: sets status 'paused', saves draft to local namespace.
   * STRICTLY DOES NOT EMIT SRS OR XP.
   * @param {Object} [options={}]
   * @returns {Object} Paused session
   */
  function pauseSession(options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    activeSession = Engine.pauseSession(activeSession);

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (activeSession.problemId) {
      persistDraft(activeSession.problemId, activeSession, ctx);
    }

    return activeSession;
  }

  /**
   * Abandon active session: marks status 'abandoned', removes draft from local namespace.
   * STRICTLY DOES NOT EMIT SRS OR XP.
   * @param {Object} [options={}]
   * @returns {Object} Abandoned session
   */
  function abandonSession(options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();

    activeSession = Engine.abandonSession(activeSession);

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : null);
    if (Repo && activeSession.problemId) {
      Repo.clearTrainerDraft(activeSession.problemId, ctx);
    }

    const discardedSession = activeSession;
    activeSession = null;
    return discardedSession;
  }

  /**
   * Complete the session with terminal outcome and execute the Exactly-Once Event Pipeline.
   * Enforces idempotency: duplicate executions return previous record without double side-effects.
   *
   * @param {Object} submission - { solved: boolean, explicitFailure: boolean, notes: string, rating: string, confidence: number, timeSpentMinutes: number }
   * @param {Object} [options={}] - { ctx: Object, userStates: Object }
   * @returns {Object} {
   *   session: Object,
   *   durableEvent: Object,
   *   srsResult: Object|null,
   *   xpAwarded: number,
   *   isDuplicateEvent: boolean
   * }
   */
  function completeSession(submission = {}, options = {}) {
    if (!activeSession) throw new Error('No active Discovery Trainer session');
    const Engine = getEngine();
    const Repo = getRepo();
    const SRS = getSRS();
    const Gamification = getGamification();

    const ctx = options.ctx || (Repo ? Repo.getActiveContext() : { type: 'guest', id: 'guest', isGuest: true });
    const userId = ctx.id || 'guest';

    // 1. Complete session in engine
    activeSession = Engine.completeSession(activeSession, submission);

    // 2. Build durable event
    const durableEvent = Engine.createDurableEvent(activeSession, userId, submission);
    const eventId = durableEvent.eventId;

    // 3. Exactly-Once Idempotency & In-Flight Concurrency Gate
    if (_inFlightEventIds.has(eventId)) {
      return {
        session: activeSession,
        durableEvent,
        srsResult: null,
        xpAwarded: 0,
        isDuplicateEvent: true,
        inFlight: true
      };
    }

    let userStatesPre = options.userStates;
    if (!userStatesPre && Repo) {
      userStatesPre = Repo.getUserStates(ctx) || {};
    } else if (!userStatesPre && typeof window !== 'undefined' && window.userStates) {
      userStatesPre = window.userStates;
    } else if (!userStatesPre) {
      userStatesPre = {};
    }

    const preProblemId = activeSession.problemId;
    const preCurrentState = userStatesPre[preProblemId] || {};
    const priorEventId = preCurrentState.lastTrainerEventId;

    if (Repo && (Repo.isTrainerEventProcessed(eventId, ctx) || (priorEventId && Repo.isTrainerEventProcessed(priorEventId, ctx) && !activeSession.steps?.implementation?.code))) {
      return {
        session: activeSession,
        durableEvent,
        srsResult: null,
        xpAwarded: 0,
        isDuplicateEvent: true
      };
    }

    // Cross-tab storage-backed lock
    if (Repo && typeof Repo.acquireEventLock === 'function') {
      if (!Repo.acquireEventLock(eventId, ctx)) {
        return {
          session: activeSession,
          durableEvent,
          srsResult: null,
          xpAwarded: 0,
          isDuplicateEvent: true,
          inFlight: true
        };
      }
    }

    _inFlightEventIds.add(eventId);

    try {
      // 4. Apply SRS Review & Gamification
      let srsResult = null;
      let xpAwarded = 0;
      const srsMapping = durableEvent.srsMapping;

      let userStates = options.userStates;
      if (!userStates && Repo) {
        userStates = Repo.getUserStates(ctx) || {};
      } else if (!userStates && typeof window !== 'undefined' && window.userStates) {
        userStates = window.userStates;
      } else if (!userStates) {
        userStates = {};
      }

      const problemId = activeSession.problemId;
      const currentState = userStates[problemId] || {};
      const isAlreadyCommitted = currentState.lastTrainerEventId === eventId;

      if (srsMapping.shouldApplySRS && SRS && typeof SRS.processReview === 'function') {
        if (!isAlreadyCommitted) {
          srsResult = SRS.processReview(
            currentState,
            srsMapping.rating,
            srsMapping.timeSpentMinutes,
            srsMapping.notes,
            srsMapping.confidence,
            {
              hintsUsed: srsMapping.hintsUsed,
              failureReasons: submission.failureReasons || []
            }
          );

          // Attach provenance and event ID
          srsResult.lastTrainerProvenance = srsMapping.provenance;
          srsResult.lastTrainerEventId = eventId;
        } else {
          srsResult = currentState;
          xpAwarded = 0;
        }
      }

      // 5. Award Gamification XP if applicable (only if not already committed)
      if (!isAlreadyCommitted && Gamification && typeof Gamification.awardXP === 'function' && srsMapping.xpEvent) {
        const xpRes = Gamification.awardXP(srsMapping.xpEvent);
        xpAwarded = xpRes ? xpRes.earned : 0;
        if (srsResult) {
          srsResult.lastTrainerXpAwarded = xpAwarded;
        }
      }

      // Persist userStates with both eventId and xpAwarded
      if (!isAlreadyCommitted && srsResult && Repo) {
        userStates[problemId] = srsResult;
        Repo.saveUserStates(userStates, ctx);
      }

      // 6. Record event in registry AFTER state changes succeed
      if (Repo) {
        Repo.recordTrainerEvent({
          ...durableEvent,
          xpAwarded
        }, ctx);
      }

      // 7. Clear the ephemeral draft upon successful completion
      if (Repo && activeSession.problemId) {
        Repo.clearTrainerDraft(activeSession.problemId, ctx);
      }

      return {
        session: activeSession,
        durableEvent,
        srsResult,
        xpAwarded,
        isDuplicateEvent: false
      };
    } finally {
      _inFlightEventIds.delete(eventId);
      if (Repo && typeof Repo.releaseEventLock === 'function') {
        Repo.releaseEventLock(eventId, ctx);
      }
    }
  }

  /**
   * Reset controller in-memory state (useful between tests or account switching)
   */
  function reset() {
    activeSession = null;
    activeProblem = null;
    isModalOpen = false;
    _inFlightEventIds.clear();
    _lastPersistenceError = null;
    clearPersistenceErrorUI();
  }

  // Account switching context listener
  function registerContextListener() {
    const Repo = getRepo();
    if (Repo && typeof Repo.onContextChange === 'function') {
      Repo.onContextChange((newCtx, prevCtx) => {
        // If a trainer session was active, flush it to prior context before resetting
        if (activeSession) {
          if (prevCtx && activeSession.problemId) {
            try {
              persistDraft(activeSession.problemId, activeSession, prevCtx);
            } catch (_) { }
          }
          activeSession = null;
          activeProblem = null;
          if (typeof document !== 'undefined' && isModalOpen) {
            closeModal();
          }
        }
      });
    }
  }

  registerContextListener();

  // =========================================================================
  // DOM / UI Lifecycle Methods (Browser only)
  // =========================================================================

  function openModal(problemId) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('solution-discovery-modal');
    if (!modal) return;

    // Resolve problem metadata from global list if available
    let pObj = null;
    if (typeof window !== 'undefined' && Array.isArray(window.allProblems)) {
      pObj = window.allProblems.find(item => item.id === problemId);
    }

    const { session, isRestoredDraft } = startSession(pObj || problemId);
    isModalOpen = true;

    renderModalContent(session, isRestoredDraft);
    modal.classList.add('open');
  }

  function closeModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('solution-discovery-modal');
    if (modal) {
      modal.classList.remove('open');
    }
    isModalOpen = false;
  }

  function renderModalContent(session, isRestoredDraft = false) {
    if (typeof document === 'undefined' || !session) return;
    const Engine = getEngine();
    if (!Engine) return;

    const titleEl = document.getElementById('trainer-modal-problem-title');
    if (titleEl) {
      titleEl.textContent = session.metadata.title || session.problemId;
    }

    const metaEl = document.getElementById('trainer-modal-problem-meta');
    if (metaEl) {
      metaEl.textContent = `${session.metadata.topic} • ${session.metadata.difficulty}${session.metadata.pattern ? ` • ${session.metadata.pattern}` : ''}`;
    }

    // Update Header External Practice Link
    const headerExtLink = document.getElementById('trainer-header-external-link');
    if (headerExtLink) {
      const url = activeProblem?.url || session.metadata?.url;
      if (url) {
        headerExtLink.href = url;
        headerExtLink.style.display = 'inline-flex';
      } else {
        headerExtLink.style.display = 'none';
      }
    }

    // Render Stepper Navigation
    renderStepper(session);

    // Render Current Step Inputs
    renderCurrentStep(session);

    // Render Progressive Hints
    renderHints(session);

    // Update Action Buttons
    updateActionButtons(session);
  }

  function renderStepper(session) {
    const stepperContainer = document.getElementById('trainer-stepper-container');
    if (!stepperContainer) return;

    const Engine = getEngine();
    stepperContainer.innerHTML = '';

    Engine.WORKFLOW_STEPS.forEach((step, idx) => {
      const stepData = session.steps[step.id] || {};
      const isCurrent = session.currentStep === step.id;
      const isCompleted = Boolean(stepData.completed);
      const isSkipped = Boolean(stepData.skipped);

      const item = document.createElement('div');
      item.className = `trainer-step-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isSkipped ? 'skipped' : ''}`;
      item.dataset.stepId = step.id;

      item.innerHTML = `
        <div class="trainer-step-number">
          ${isCompleted ? '<i class="fa-solid fa-check"></i>' : (isSkipped ? '<i class="fa-solid fa-forward"></i>' : idx + 1)}
        </div>
        <div class="trainer-step-title">${escapeHtml(step.title)}</div>
        ${step.required ? '<span class="trainer-step-req">*</span>' : ''}
      `;

      item.addEventListener('click', () => {
        try {
          jumpToStep(step.id);
          renderModalContent(activeSession);
        } catch (e) {
          console.error(e);
        }
      });

      stepperContainer.appendChild(item);
    });
  }

  function renderCurrentStep(session) {
    const container = document.getElementById('trainer-step-content-area');
    if (!container) return;

    const stepId = session.currentStep;
    const stepData = session.steps[stepId] || {};
    const stepMeta = getEngine().getStepMeta(stepId);

    let html = `
      <div class="trainer-step-header">
        <h4 class="trainer-step-heading">${escapeHtml(stepMeta.title)}</h4>
        <span class="trainer-step-badge ${stepMeta.required ? 'badge-required' : 'badge-optional'}">
          ${stepMeta.required ? 'Required Step' : 'Optional Step'}
        </span>
      </div>
    `;

    switch (stepId) {
      case 'understanding':
        html += `
          <div class="trainer-field-group">
            <label class="trainer-field-label">Problem Restatement & Core Objective *</label>
            <textarea class="trainer-textarea" id="trainer-input-notes" placeholder="Restate the problem in your own words. What are the inputs, outputs, and constraints?">${escapeHtml(stepData.notes || '')}</textarea>
          </div>
          <div class="trainer-field-grid">
            <div class="trainer-field-group">
              <label class="trainer-field-label">Input / Output Traps</label>
              <input type="text" class="trainer-input" id="trainer-input-io" placeholder="e.g. Empty list, negative numbers, single element" value="${escapeHtml(stepData.inputsOutputs || '')}">
            </div>
            <div class="trainer-field-group">
              <label class="trainer-field-label">Key Constraints</label>
              <input type="text" class="trainer-input" id="trainer-input-constraints" placeholder="e.g. N <= 10^5, values within [-10^9, 10^9]" value="${escapeHtml(stepData.constraints || '')}">
            </div>
          </div>
        `;
        break;

      case 'brute_force':
        html += `
          <div class="trainer-field-group">
            <label class="trainer-field-label">Brute-Force Solution Intuition</label>
            <textarea class="trainer-textarea" id="trainer-input-notes" placeholder="Describe the most direct, naïve approach to solve this problem...">${escapeHtml(stepData.notes || '')}</textarea>
          </div>
          <div class="trainer-field-grid">
            <div class="trainer-field-group">
              <label class="trainer-field-label">Estimated Time Complexity</label>
              <input type="text" class="trainer-input" id="trainer-input-time" placeholder="e.g. O(N^2), O(2^N)" value="${escapeHtml(stepData.estimatedTime || '')}">
            </div>
            <div class="trainer-field-group">
              <label class="trainer-field-label">Estimated Space Complexity</label>
              <input type="text" class="trainer-input" id="trainer-input-space" placeholder="e.g. O(1), O(N)" value="${escapeHtml(stepData.estimatedSpace || '')}">
            </div>
          </div>
        `;
        break;

      case 'bottleneck':
        html += `
          <div class="trainer-field-group">
            <label class="trainer-field-label">What is the Bottleneck / Inefficiency?</label>
            <textarea class="trainer-textarea" id="trainer-input-notes" placeholder="Why is the brute-force slow? What redundant operations are being performed repeatedly?">${escapeHtml(stepData.notes || '')}</textarea>
          </div>
          <div class="trainer-field-group">
            <label class="trainer-field-label">Root Cause of Bottleneck</label>
            <input type="text" class="trainer-input" id="trainer-input-why" placeholder="e.g. Nested loop searching for complement takes O(N) each iteration" value="${escapeHtml(stepData.whyBottleneck || '')}">
          </div>
        `;
        break;

      case 'pattern':
        html += `
          <div class="trainer-field-group">
            <label class="trainer-field-label">Algorithmic Pattern Candidate</label>
            <input type="text" class="trainer-input" id="trainer-input-pattern" placeholder="e.g. Hash Map Lookup, Two Pointers, Sliding Window, Monotonic Stack" value="${escapeHtml(stepData.predictedPattern || '')}">
          </div>
          <div class="trainer-field-group">
            <label class="trainer-field-label">Why Does this Pattern Fit?</label>
            <textarea class="trainer-textarea" id="trainer-input-rationale" placeholder="Explain what problem structural property triggers this pattern...">${escapeHtml(stepData.rationale || '')}</textarea>
          </div>
        `;
        break;

      case 'optimization':
        html += `
          <div class="trainer-field-group">
            <label class="trainer-field-label">Optimization Strategy & Loop Invariant</label>
            <textarea class="trainer-textarea" id="trainer-input-approach" placeholder="Describe how the chosen pattern resolves the bottleneck...">${escapeHtml(stepData.approach || '')}</textarea>
          </div>
          <div class="trainer-field-group">
            <label class="trainer-field-label">Maintained Invariant</label>
            <input type="text" class="trainer-input" id="trainer-input-invariant" placeholder="e.g. Seen elements stored with indices, sliding window maintains at most K distinct" value="${escapeHtml(stepData.invariant || '')}">
          </div>
        `;
        break;

      case 'complexity':
        html += `
          <div class="trainer-field-grid">
            <div class="trainer-field-group">
              <label class="trainer-field-label">Target Time Complexity</label>
              <input type="text" class="trainer-input" id="trainer-input-time" placeholder="e.g. O(N), O(N log N)" value="${escapeHtml(stepData.targetTime || '')}">
            </div>
            <div class="trainer-field-group">
              <label class="trainer-field-label">Target Space Complexity</label>
              <input type="text" class="trainer-input" id="trainer-input-space" placeholder="e.g. O(1), O(N)" value="${escapeHtml(stepData.targetSpace || '')}">
            </div>
          </div>
          <div class="trainer-field-group">
            <label class="trainer-field-label">Complexity Justification</label>
            <textarea class="trainer-textarea" id="trainer-input-justification" placeholder="Why is this optimal? Can we theoretically do better?">${escapeHtml(stepData.justification || '')}</textarea>
          </div>
        `;
        break;

      case 'implementation': {
        const url = activeProblem?.url || session.metadata?.url;
        html += `
          <div class="trainer-external-practice-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div>
                <div style="font-weight:700; font-size:13px; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-code" style="color:#38bdf8;"></i> External Coding Destination
                </div>
                <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">
                  ${url ? 'Practice on platform compiler/test suite. Your trainer draft is automatically preserved.' : 'No direct external URL cataloged. Practice in the scratchpad below and verify manually.'}
                </div>
              </div>
              ${url ? `
                <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm btn-trainer-external-launch" id="btn-trainer-external-launch">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Problem Platform
                </a>
              ` : `
                <span class="trainer-tag-live" style="background:rgba(255,255,255,0.05); color:var(--text-muted); border:1px solid var(--border-color);">
                  Scratchpad Mode
                </span>
              `}
            </div>
            <div style="margin-top:8px; font-size:11.5px; color:#94a3b8; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-shield-halved" style="color:var(--secondary, #42D6C5);"></i>
              <span>Manual verification model: AlgoRecall does not run LeetCode/external code execution sandboxes. Outcome is candidate self-reported.</span>
            </div>
          </div>

          <div class="trainer-field-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <label class="trainer-field-label" style="margin-bottom:0;">Implementation Scratchpad / Code Draft *</label>
              <span class="trainer-provenance-notice">
                <i class="fa-solid fa-user-pen"></i> Self-Reported Provenance
              </span>
            </div>
            <textarea class="trainer-code-editor" id="trainer-input-code" placeholder="// Write or paste your pseudocode / solution implementation here...">${escapeHtml(stepData.code || '')}</textarea>
          </div>

          <!-- Pre-flight verification checklist -->
          <div class="trainer-field-group">
            <label class="trainer-field-label">Attempt Verification Checklist</label>
            <div class="trainer-checklist-group">
              <label class="trainer-check-item">
                <input type="checkbox" id="trainer-check-implemented" ${stepData.implemented ? 'checked' : ''}>
                <span>Implementation completed (in scratchpad above or external editor)</span>
              </label>
              <label class="trainer-check-item">
                <input type="checkbox" id="trainer-check-sample-tests" ${stepData.sampleTestsVerified ? 'checked' : ''}>
                <span>Sample test cases manually traced or passed on platform</span>
              </label>
              <label class="trainer-check-item">
                <input type="checkbox" id="trainer-check-edge-cases" ${stepData.edgeCasesVerified ? 'checked' : ''}>
                <span>Edge cases analyzed (empty inputs, bounds, duplicates, single elements)</span>
              </label>
              <label class="trainer-check-item">
                <input type="checkbox" id="trainer-check-complexity" ${stepData.complexityVerified ? 'checked' : ''}>
                <span>Complexity within target constraints</span>
              </label>
            </div>
          </div>

          <div class="trainer-field-group">
            <label class="trainer-field-label">Edge Cases & Testing Notes</label>
            <input type="text" class="trainer-input" id="trainer-input-testcases" placeholder="e.g. Empty input, duplicates, large array" value="${escapeHtml(stepData.testCasesPassed || '')}">
          </div>
        `;
        break;
      }

      case 'reflection':
        html += `
          <div class="trainer-field-group">
            <label class="trainer-field-label">Mistakes, Missed Clues & Key Takeaways</label>
            <textarea class="trainer-textarea" id="trainer-input-mistakes" placeholder="What clues in the problem description did you miss initially? What should you remember next time?">${escapeHtml(stepData.mistakes || '')}</textarea>
          </div>
          <div class="trainer-field-group">
            <label class="trainer-field-label">Core Lesson Learned</label>
            <input type="text" class="trainer-input" id="trainer-input-lessons" placeholder="e.g. Always check if a hash map eliminates inner search loop" value="${escapeHtml(stepData.lessonsLearned || '')}">
          </div>
        `;
        break;
    }

    container.innerHTML = html;

    // Attach real-time input event listeners for auto-save
    container.querySelectorAll('input, textarea').forEach(inputEl => {
      inputEl.addEventListener('input', () => {
        saveCurrentStepFieldsFromDOM();
      });
      inputEl.addEventListener('blur', () => {
        saveCurrentStepFieldsFromDOM();
      });
    });
  }

  function saveCurrentStepFieldsFromDOM() {
    if (!activeSession) return;
    const stepId = activeSession.currentStep;
    const fields = {};

    const notesEl = document.getElementById('trainer-input-notes');
    if (notesEl) fields.notes = notesEl.value;

    const ioEl = document.getElementById('trainer-input-io');
    if (ioEl) fields.inputsOutputs = ioEl.value;

    const constrEl = document.getElementById('trainer-input-constraints');
    if (constrEl) fields.constraints = constrEl.value;

    const timeEl = document.getElementById('trainer-input-time');
    if (timeEl) {
      if (stepId === 'brute_force') fields.estimatedTime = timeEl.value;
      if (stepId === 'complexity') fields.targetTime = timeEl.value;
    }

    const spaceEl = document.getElementById('trainer-input-space');
    if (spaceEl) {
      if (stepId === 'brute_force') fields.estimatedSpace = spaceEl.value;
      if (stepId === 'complexity') fields.targetSpace = spaceEl.value;
    }

    const whyEl = document.getElementById('trainer-input-why');
    if (whyEl) fields.whyBottleneck = whyEl.value;

    const patEl = document.getElementById('trainer-input-pattern');
    if (patEl) fields.predictedPattern = patEl.value;

    const ratEl = document.getElementById('trainer-input-rationale');
    if (ratEl) fields.rationale = ratEl.value;

    const appEl = document.getElementById('trainer-input-approach');
    if (appEl) fields.approach = appEl.value;

    const invEl = document.getElementById('trainer-input-invariant');
    if (invEl) fields.invariant = invEl.value;

    const justEl = document.getElementById('trainer-input-justification');
    if (justEl) fields.justification = justEl.value;

    const codeEl = document.getElementById('trainer-input-code');
    if (codeEl) fields.code = codeEl.value;

    const tcEl = document.getElementById('trainer-input-testcases');
    if (tcEl) fields.testCasesPassed = tcEl.value;

    const implEl = document.getElementById('trainer-check-implemented');
    if (implEl) fields.implemented = implEl.checked;

    const sampleEl = document.getElementById('trainer-check-sample-tests');
    if (sampleEl) fields.sampleTestsVerified = sampleEl.checked;

    const edgeEl = document.getElementById('trainer-check-edge-cases');
    if (edgeEl) fields.edgeCasesVerified = edgeEl.checked;

    const compEl = document.getElementById('trainer-check-complexity');
    if (compEl) fields.complexityVerified = compEl.checked;

    const misEl = document.getElementById('trainer-input-mistakes');
    if (misEl) fields.mistakes = misEl.value;

    const lesEl = document.getElementById('trainer-input-lessons');
    if (lesEl) fields.lessonsLearned = lesEl.value;

    updateStep(stepId, fields);
    updateActionButtons(activeSession);
  }

  function renderHints(session) {
    const container = document.getElementById('trainer-hints-container');
    if (!container) return;

    const Engine = getEngine();
    container.innerHTML = '';

    Engine.HINT_LEVELS.forEach(hint => {
      const isRevealed = session.hints.revealedLevels.includes(hint.level);
      const isLevel5 = hint.level === 5;

      const item = document.createElement('div');
      item.className = `trainer-hint-card ${isRevealed ? 'revealed' : 'locked'} ${isLevel5 ? 'solution-reveal-card' : ''}`;

      let contentHtml = '';
      if (isRevealed) {
        contentHtml = `
          <div class="trainer-hint-body">
            <span class="trainer-hint-badge badge-revealed"><i class="fa-solid fa-lock-open"></i> Unlocked</span>
            <div class="trainer-hint-text">${getSampleHintContent(hint.level, session.problemId)}</div>
          </div>
        `;
      } else {
        contentHtml = `
          <div class="trainer-hint-locked-row">
            <span class="trainer-hint-title"><i class="fa-solid fa-lock"></i> ${escapeHtml(hint.title)}</span>
            <button type="button" class="btn ${isLevel5 ? 'btn-danger' : 'btn-secondary'} btn-xs btn-reveal-hint" data-level="${hint.level}">
              ${isLevel5 ? 'Reveal Solution' : 'Reveal Hint'}
            </button>
          </div>
        `;
      }

      item.innerHTML = contentHtml;

      const revealBtn = item.querySelector('.btn-reveal-hint');
      if (revealBtn) {
        revealBtn.addEventListener('click', () => {
          if (isLevel5) {
            const confirmed = confirm(
              '⚠️ WARNING: Complete Solution Reveal\n\nRevealing the full solution will record this session as a Solution Reveal (recognition review). It will strictly block independent mastery credit and cap review confidence at 2.\n\nAre you sure you want to reveal the solution?'
            );
            if (!confirmed) return;
          }
          revealHint(hint.level);
          renderModalContent(activeSession);
        });
      }

      container.appendChild(item);
    });
  }

  function getSampleHintContent(level, problemId) {
    switch (level) {
      case 1:
        return 'Observation: Look at what elements you need to inspect. Can you avoid re-evaluating elements you already saw?';
      case 2:
        return 'Pattern Clue: Consider using a Hash Map or Two Pointers to trade extra memory for instant O(1) lookups.';
      case 3:
        return 'Approach: Iterate through the sequence once while maintaining a running state of seen candidates and complements.';
      case 4:
        return 'Implementation: For each element x at index i, compute target - x. Check if map contains complement; if not, store map[x] = i.';
      case 5:
        return 'Complete Solution: Canonical optimal algorithm runs in O(N) time and O(N) space using a single-pass hash map.';
      default:
        return 'Progressive scaffolding observation.';
    }
  }

  function updateActionButtons(session) {
    const Engine = getEngine();
    if (!Engine) return;

    const prevBtn = document.getElementById('btn-trainer-prev');
    const nextBtn = document.getElementById('btn-trainer-next');
    const skipBtn = document.getElementById('btn-trainer-skip');
    const completeBtn = document.getElementById('btn-trainer-complete');

    const meta = Engine.getStepMeta(session.currentStep);
    const isFirst = meta.index === 0;
    const isLast = meta.index === Engine.WORKFLOW_STEPS.length - 1;
    const canAdvance = Engine.canAdvance(session);

    if (prevBtn) prevBtn.disabled = isFirst;
    if (nextBtn) {
      nextBtn.style.display = isLast ? 'none' : 'inline-flex';
      nextBtn.disabled = !canAdvance;
    }
    if (skipBtn) {
      skipBtn.style.display = (!isLast && !meta.required) ? 'inline-flex' : 'none';
    }
    if (completeBtn) {
      completeBtn.style.display = isLast ? 'inline-flex' : 'none';
    }
  }

  function setupDOMListeners() {
    if (typeof document === 'undefined') return;

    // Close buttons
    document.getElementById('btn-close-trainer-modal')?.addEventListener('click', () => {
      saveCurrentStepFieldsFromDOM();
      closeModal();
    });

    // Pause button
    document.getElementById('btn-trainer-pause')?.addEventListener('click', () => {
      saveCurrentStepFieldsFromDOM();
      pauseSession();
      closeModal();
      if (typeof window !== 'undefined' && window.showPlanConfirmation) {
        window.showPlanConfirmation('✓ Discovery Trainer session paused and draft safely preserved.');
      }
    });

    // Abandon button
    document.getElementById('btn-trainer-abandon')?.addEventListener('click', () => {
      const confirmed = (typeof window !== 'undefined' && typeof window.confirm === 'function')
        ? window.confirm('Are you sure you want to discard this in-progress discovery session? Your draft will be cleared.')
        : true;
      if (!confirmed) return;
      abandonSession();
      closeModal();
      if (typeof window !== 'undefined' && window.showPlanConfirmation) {
        window.showPlanConfirmation('✓ Discovery Trainer session discarded.');
      }
    });

    // Auto-save draft whenever external platform link is clicked
    document.querySelectorAll('.btn-trainer-external-launch, #trainer-header-external-link').forEach(btn => {
      btn.addEventListener('click', () => {
        saveCurrentStepFieldsFromDOM();
      });
    });

    // Navigation buttons
    document.getElementById('btn-trainer-next')?.addEventListener('click', () => {
      saveCurrentStepFieldsFromDOM();
      try {
        nextStep();
        renderModalContent(activeSession);
      } catch (err) {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(err.message);
        } else {
          console.warn(err.message);
        }
      }
    });

    document.getElementById('btn-trainer-prev')?.addEventListener('click', () => {
      saveCurrentStepFieldsFromDOM();
      prevStep();
      renderModalContent(activeSession);
    });

    document.getElementById('btn-trainer-skip')?.addEventListener('click', () => {
      if (!activeSession) return;
      skipStep(activeSession.currentStep);
      try {
        nextStep();
      } catch (_) { }
      renderModalContent(activeSession);
    });

    // Complete button
    document.getElementById('btn-trainer-complete')?.addEventListener('click', () => {
      saveCurrentStepFieldsFromDOM();
      showCompletionModal();
    });
  }

  function showCompletionModal() {
    if (!activeSession) return;
    const hintsCount = (activeSession.hints.revealedLevels || []).filter(l => l < 5).length;
    const solRevealed = Boolean(activeSession.hints.solutionRevealed || activeSession.hints.revealedLevels.includes(5));

    let outcomeDesc = '';
    if (solRevealed) {
      outcomeDesc = 'Solution Reveal (Recognition Review · Stage Capped)';
    } else if (hintsCount === 0) {
      outcomeDesc = 'Independent Solve (Full Recall Credit · Mastery Eligible)';
    } else {
      outcomeDesc = `Assisted Solve (${hintsCount} hint${hintsCount > 1 ? 's' : ''} used · Mastery Gated)`;
    }

    const area = document.getElementById('trainer-step-content-area');
    const actionsRow = document.getElementById('trainer-actions-row');
    if (!area) return;

    if (actionsRow) actionsRow.style.display = 'none';

    area.innerHTML = `
      <div class="trainer-outcome-dialog">
        <div class="trainer-tag-live" style="margin-bottom:12px;">
          <i class="fa-solid fa-flag-checkered"></i> Attempt Verification
        </div>
        <h3 style="margin:0 0 8px 0; font-size:18px; font-weight:700;">Record Coding Attempt Outcome</h3>
        <p style="color:var(--text-muted); font-size:13px; max-width:540px; margin:0 auto 16px auto; line-height:1.5;">
          Based on your progressive scaffolding usage, this attempt is classified as:<br>
          <strong style="color:var(--primary); font-size:14px;">${escapeHtml(outcomeDesc)}</strong>
        </p>

        <div class="trainer-provenance-notice" style="margin-bottom:18px;">
          <i class="fa-solid fa-user-check"></i> Provenance Model: Self-Reported Manual Verification (No external judge integration)
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:14px; max-width:520px; margin:0 auto; text-align:left;">
          <div style="font-size:12px; font-weight:600; color:var(--text-main); margin-bottom:8px;">
            Did your implementation successfully solve the problem and pass test cases?
          </div>
          <div style="font-size:11.5px; color:var(--text-dim); line-height:1.4;">
            &bull; <strong>Solved</strong>: You verified your solution on LeetCode/external platform or manually traced test cases without errors.<br>
            &bull; <strong>Failed Attempt</strong>: You could not solve it or could not pass edge cases. Triggers a Priority 1 review reset to reinforce recall.<br>
            &bull; <strong>Return</strong>: Return to the attempt workspace to continue coding.
          </div>
        </div>

        <div class="trainer-outcome-options-row">
          <button type="button" class="btn btn-success" id="btn-outcome-solved" style="background:#10b981; border-color:#10b981; color:#fff; min-height:40px; font-weight:600;">
            <i class="fa-solid fa-check"></i> Solved (Self-Reported Success)
          </button>
          <button type="button" class="btn btn-danger" id="btn-outcome-failed" style="background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.4); color:#f87171; min-height:40px;">
            <i class="fa-solid fa-xmark"></i> Could Not Solve (Failed Attempt)
          </button>
          <button type="button" class="btn btn-secondary" id="btn-outcome-cancel" style="min-height:40px;">
            Return to Attempt
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-outcome-solved')?.addEventListener('click', () => {
      const res = completeSession({
        solved: true,
        explicitFailure: false,
        notes: activeSession.steps?.reflection?.lessonsLearned || ''
      });
      renderCompletionSummary(res);
    });

    document.getElementById('btn-outcome-failed')?.addEventListener('click', () => {
      const res = completeSession({
        solved: false,
        explicitFailure: true,
        notes: activeSession.steps?.reflection?.lessonsLearned || ''
      });
      renderCompletionSummary(res);
    });

    document.getElementById('btn-outcome-cancel')?.addEventListener('click', () => {
      if (actionsRow) actionsRow.style.display = 'flex';
      renderCurrentStep(activeSession);
      updateActionButtons(activeSession);
    });
  }

  function renderCompletionSummary(result) {
    const area = document.getElementById('trainer-step-content-area');
    const actionsRow = document.getElementById('trainer-actions-row');
    if (!area) return;

    if (actionsRow) actionsRow.style.display = 'none';

    const evt = result.durableEvent;
    const srs = evt.srsMapping;

    area.innerHTML = `
      <div class="trainer-completion-card">
        <div class="trainer-completion-badge ${srs.outcome}">
          <i class="fa-solid ${srs.isIndependent ? 'fa-crown' : (srs.outcome === 'failed_attempt' ? 'fa-xmark' : 'fa-lightbulb')}"></i>
          ${escapeHtml(srs.outcome.replace('_', ' ').toUpperCase())}
        </div>
        <h3 style="margin:12px 0 6px 0; font-size:18px;">Discovery Session Complete!</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">
          Your attempt outcome has been durably recorded with verified self-reported provenance.
        </p>

        <div class="trainer-summary-grid">
          <div class="trainer-stat-box">
            <span class="trainer-stat-label">Recall Independence</span>
            <span class="trainer-stat-value">${srs.isIndependent ? '100% Independent' : (srs.outcome === 'solution_reveal' ? 'Solution Revealed' : 'Assisted')}</span>
          </div>
          <div class="trainer-stat-box">
            <span class="trainer-stat-label">Hints Used</span>
            <span class="trainer-stat-value">${evt.classification.hintCount} / 4</span>
          </div>
          <div class="trainer-stat-box">
            <span class="trainer-stat-label">Verification Provenance</span>
            <span class="trainer-stat-value" style="font-size:12px; color:#38bdf8;">Self-Reported (Manual)</span>
          </div>
          <div class="trainer-stat-box">
            <span class="trainer-stat-label">External Automated Judge</span>
            <span class="trainer-stat-value" style="font-size:12px; color:var(--text-dim);">${evt.provenance.isExternallyVerified ? 'Verified' : 'Not Evaluated'}</span>
          </div>
          <div class="trainer-stat-box">
            <span class="trainer-stat-label">Gamification XP</span>
            <span class="trainer-stat-value" style="color:#34d399;">+${result.xpAwarded} XP</span>
          </div>
          <div class="trainer-stat-box">
            <span class="trainer-stat-label">Mastery Eligible</span>
            <span class="trainer-stat-value">${srs.allowMastery ? 'Yes' : 'No (Gated)'}</span>
          </div>
        </div>

        <button type="button" class="btn btn-primary" id="btn-trainer-finish" style="margin-top:20px; width:100%; min-height:42px;">
          <i class="fa-solid fa-check"></i> Finish & Return to Dashboard
        </button>
      </div>
    `;

    document.getElementById('btn-trainer-finish')?.addEventListener('click', () => {
      closeModal();
      if (typeof window !== 'undefined' && typeof window.renderAll === 'function') {
        window.renderAll();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    startSession,
    getActiveSession,
    updateStep,
    nextStep,
    prevStep,
    jumpToStep,
    skipStep,
    revealHint,
    pauseSession,
    abandonSession,
    completeSession,
    openModal,
    closeModal,
    setupDOMListeners,
    registerContextListener,
    getLastPersistenceError,
    clearLastPersistenceError,
    reset
  };
});
