/**
 * AlgoRecall 2.2 - Deterministic Time-Travel Replay Simulator
 * Sandboxed, in-memory replay engine with injectable clock for deterministic QA,
 * scenario verification, and learning loop research.
 * Completely isolated from LocalStorage and production learner progress.
 */

(function () {
  'use strict';

  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);
  const _AdaptiveLearningEngine = (typeof window !== 'undefined' && window.AdaptiveLearningEngine) || (typeof require !== 'undefined' ? require('./adaptive-learning-engine') : null);
  const _GraphEngine = (typeof window !== 'undefined' && window.GraphEngine) || (typeof require !== 'undefined' ? require('./graph-engine') : null);

  class TimeTravelSimulator {
    constructor(options = {}) {
      this.initialEpoch = options.initialTime
        ? new Date(options.initialTime).getTime()
        : Date.parse('2026-10-01T09:00:00.000Z');

      this.currentTime = this.initialEpoch;
      this.catalog = Array.isArray(options.catalog) ? options.catalog : [];
      this.userStates = {};
      this.interventions = [];
      this.trajectory = [];
      this.violations = [];
      this.lastEventTime = null;
    }

    /**
     * Virtual Clock Methods
     */
    now() {
      return this.currentTime;
    }

    getISO() {
      return new Date(this.currentTime).toISOString();
    }

    advanceHours(hours = 1) {
      if (typeof hours !== 'number' || isNaN(hours) || hours <= 0) {
        throw new Error(`advanceHours requires a positive number, received: ${hours}`);
      }
      this.currentTime += hours * 3600000;
      this.trajectory.push({
        type: 'CLOCK_ADVANCE',
        elapsedHours: hours,
        virtualTimestamp: this.currentTime,
        virtualDate: this.getISO()
      });
      return this.currentTime;
    }

    advanceDays(days = 1) {
      return this.advanceHours(days * 24);
    }

    setDate(dateInput) {
      const parsed = new Date(dateInput).getTime();
      if (isNaN(parsed)) {
        throw new Error(`Invalid date input for setDate: ${dateInput}`);
      }
      if (parsed < this.currentTime) {
        this.violations.push({
          type: 'BACKWARD_CLOCK_LEAP',
          from: this.getISO(),
          to: new Date(parsed).toISOString(),
          message: 'Clock was set backward in time.'
        });
      }
      this.currentTime = parsed;
      return this.currentTime;
    }

    /**
     * Resets simulator to clean initial state
     */
    reset(initialTime = null) {
      if (initialTime) {
        this.initialEpoch = new Date(initialTime).getTime();
      }
      this.currentTime = this.initialEpoch;
      this.userStates = {};
      this.interventions = [];
      this.trajectory = [];
      this.violations = [];
      this.lastEventTime = null;
      return this;
    }

    /**
     * Event validation: detects chronological violations and duplicate events
     */
    validateEvent(event) {
      const eventTime = event.timestamp ? new Date(event.timestamp).getTime() : this.currentTime;

      // Chronological order check
      if (this.lastEventTime !== null && eventTime < this.lastEventTime) {
        this.violations.push({
          type: 'INVALID_EVENT_ORDERING',
          event,
          previousTimestamp: this.lastEventTime,
          eventTimestamp: eventTime,
          message: `Event for "${event.problemId || 'unknown'}" occurred at ${new Date(eventTime).toISOString()} before previous event at ${new Date(this.lastEventTime).toISOString()}.`
        });
        return false;
      }

      // Duplicate event check (same problem, same rating, within 5 seconds)
      const isDuplicate = this.trajectory.some(t => {
        if (t.type !== 'ATTEMPT' || !t.event) return false;
        return t.event.problemId === event.problemId &&
               t.event.rating === event.rating &&
               Math.abs(t.virtualTimestamp - eventTime) < 5000;
      });

      if (isDuplicate) {
        this.violations.push({
          type: 'DUPLICATE_EVENT',
          event,
          message: `Duplicate attempt event detected on "${event.problemId}" within 5 seconds.`
        });
        return false;
      }

      return true;
    }

    /**
     * Processes an attempt event
     */
    applyAttempt(event) {
      if (!event || !event.problemId) {
        this.violations.push({ type: 'CORRUPTED_EVENT_DATA', event, message: 'Attempt event missing problemId.' });
        return null;
      }

      if (event.timestamp) {
        this.currentTime = new Date(event.timestamp).getTime();
      }

      this.validateEvent(event);
      this.lastEventTime = this.currentTime;

      const problem = this.catalog.find(p => p.id === event.problemId) || {
        id: event.problemId,
        title: event.problemTitle || event.problemId,
        topic: event.topic || 'General',
        difficulty: event.difficulty || 'Medium',
        pattern: event.pattern || 'General'
      };

      const prevState = this.userStates[event.problemId] || {};
      const prevStage = prevState.stage || 0;

      let nextState;
      if (_SRSEngine && typeof _SRSEngine.processReview === 'function') {
        nextState = _SRSEngine.processReview(
          prevState,
          event.rating || 'medium',
          event.timeSpentMinutes || 15,
          event.notes || '',
          event.confidence || null,
          {
            asOfDate: new Date(this.currentTime),
            hintsUsed: Boolean(event.hintsUsed),
            failureReasons: Array.isArray(event.failureReasons) ? event.failureReasons : []
          }
        );
      } else {
        nextState = {
          ...prevState,
          stage: prevStage + 1,
          lastReviewed: this.getISO(),
          confidence: event.confidence || 3
        };
      }

      this.userStates[event.problemId] = nextState;

      // Observe diagnosis changes if engine available
      let diagnosis = null;
      let nextAction = null;
      if (_AdaptiveLearningEngine) {
        const evidence = _AdaptiveLearningEngine.observeEvidence(problem, nextState, this.catalog, this.userStates);
        diagnosis = _AdaptiveLearningEngine.diagnose(evidence, problem);
        nextAction = _AdaptiveLearningEngine.selectNextAction(this.catalog, this.userStates);
      }

      const snapshot = {
        stepIndex: this.trajectory.length + 1,
        type: 'ATTEMPT',
        virtualTimestamp: this.currentTime,
        virtualDate: this.getISO(),
        event: { ...event },
        problem: { id: problem.id, title: problem.title, topic: problem.topic },
        stateTransitions: {
          prevStage,
          nextStage: nextState.stage,
          intervalDays: nextState.intervalDays,
          nextReviewDate: nextState.nextReviewDate,
          confidence: nextState.confidence,
          isMastered: Boolean(nextState.isMastered)
        },
        diagnosis: diagnosis ? {
          primaryIssue: diagnosis.primaryIssue,
          severity: diagnosis.severity,
          recommendedActionType: diagnosis.recommendedActionType
        } : null,
        nextRecommendedAction: nextAction ? {
          action: nextAction.action,
          problemId: nextAction.problemId,
          reasonCode: nextAction.reasonCode
        } : null
      };

      this.trajectory.push(snapshot);
      return snapshot;
    }

    /**
     * Executes a single simulator step
     */
    step(stepDef) {
      if (!stepDef || !stepDef.type) {
        throw new Error('stepDef must specify an event type');
      }

      switch (stepDef.type) {
        case 'ATTEMPT':
          return this.applyAttempt(stepDef);

        case 'ADVANCE_HOURS':
          return this.advanceHours(stepDef.hours || 1);

        case 'ADVANCE_DAYS':
          return this.advanceDays(stepDef.days || 1);

        case 'SET_DATE':
          return this.setDate(stepDef.date);

        case 'RECOMMEND': {
          if (!_AdaptiveLearningEngine) return null;
          const rec = _AdaptiveLearningEngine.selectNextAction(this.catalog, this.userStates, stepDef.context || {});
          if (rec) {
            rec.timestamp = this.currentTime;
            this.interventions.push(rec);
            this.trajectory.push({
              stepIndex: this.trajectory.length + 1,
              type: 'INTERVENTION_RECOMMENDED',
              virtualTimestamp: this.currentTime,
              virtualDate: this.getISO(),
              recommendation: rec
            });
          }
          return rec;
        }

        case 'DISMISS_RECOMMENDATION': {
          if (!_AdaptiveLearningEngine) return null;
          const targetId = stepDef.interventionId || (this.interventions.slice(-1)[0] || {}).interventionId;
          const dismissed = _AdaptiveLearningEngine.dismissIntervention(targetId, this.userStates, stepDef.reason || 'user_dismissed');
          this.trajectory.push({
            stepIndex: this.trajectory.length + 1,
            type: 'INTERVENTION_DISMISSED',
            virtualTimestamp: this.currentTime,
            virtualDate: this.getISO(),
            interventionId: targetId,
            status: 'dismissed'
          });
          return dismissed;
        }

        case 'VERIFY_INTERVENTIONS': {
          if (!_AdaptiveLearningEngine) return [];
          const results = this.interventions.map(i => {
            return {
              interventionId: i.interventionId,
              targetProblemId: i.targetProblemId,
              result: _AdaptiveLearningEngine.verifyIntervention(i, this.userStates, this.catalog)
            };
          });
          this.trajectory.push({
            stepIndex: this.trajectory.length + 1,
            type: 'VERIFICATION_CHECK',
            virtualTimestamp: this.currentTime,
            virtualDate: this.getISO(),
            verifications: results
          });
          return results;
        }

        default:
          throw new Error(`Unknown step type: ${stepDef.type}`);
      }
    }

    /**
     * Replays a sequence of events end-to-end
     */
    replay(events = []) {
      if (!Array.isArray(events)) {
        throw new Error('replay expects an array of events');
      }

      events.forEach(e => this.step(e));

      let masteryCalibration = null;
      let effectiveness = null;
      if (_AdaptiveLearningEngine) {
        masteryCalibration = _AdaptiveLearningEngine.evaluateMasteryCalibration(this.catalog, this.userStates);
        effectiveness = _AdaptiveLearningEngine.getInterventionEffectiveness(this.userStates, this.catalog);
      }

      return {
        totalSteps: this.trajectory.length,
        violations: this.violations,
        hasViolations: this.violations.length > 0,
        finalVirtualDate: this.getISO(),
        finalStatesCount: Object.keys(this.userStates).length,
        trajectory: this.trajectory,
        masteryCalibration,
        effectiveness
      };
    }

    /**
     * Standard Synthetic Learner Scenario Fixtures
     */
    static getScenarioFixture(name) {
      const baseEpoch = '2026-10-01T09:00:00.000Z';

      switch (name) {
        case 'new-learner':
          return [
            { type: 'RECOMMEND' }
          ];

        case 'inconsistent-learner':
          return [
            { type: 'ATTEMPT', problemId: 'two-sum', rating: 'medium', confidence: 3, timestamp: '2026-08-01T09:00:00.000Z' },
            { type: 'ADVANCE_DAYS', days: 50 },
            { type: 'RECOMMEND' }
          ];

        case 'strong-learner':
          return [
            { type: 'ATTEMPT', problemId: 'two-sum', rating: 'simple', confidence: 5, timestamp: '2026-09-01T09:00:00.000Z' },
            { type: 'ADVANCE_DAYS', days: 4 },
            { type: 'ATTEMPT', problemId: 'two-sum', rating: 'simple', confidence: 5 },
            { type: 'ADVANCE_DAYS', days: 10 },
            { type: 'ATTEMPT', problemId: 'two-sum', rating: 'simple', confidence: 5 },
            { type: 'ADVANCE_DAYS', days: 15 },
            { type: 'ATTEMPT', problemId: 'two-sum', rating: 'simple', confidence: 5 },
            { type: 'RECOMMEND' }
          ];

        case 'retention-decay':
          return [
            { type: 'ATTEMPT', problemId: 'valid-anagram', rating: 'simple', confidence: 5, timestamp: '2026-08-01T09:00:00.000Z' },
            { type: 'ADVANCE_DAYS', days: 4 },
            { type: 'ATTEMPT', problemId: 'valid-anagram', rating: 'simple', confidence: 5 },
            { type: 'ADVANCE_DAYS', days: 10 },
            { type: 'ATTEMPT', problemId: 'valid-anagram', rating: 'simple', confidence: 5 },
            { type: 'ADVANCE_DAYS', days: 20 },
            { type: 'ATTEMPT', problemId: 'valid-anagram', rating: 'failed', confidence: 1 },
            { type: 'RECOMMEND' }
          ];

        case 'hint-dependent':
          return [
            { type: 'ATTEMPT', problemId: 'reverse-linked-list', rating: 'simple', confidence: 4, hintsUsed: true },
            { type: 'RECOMMEND' }
          ];

        case 'recovery-learner':
          return [
            { type: 'ATTEMPT', problemId: 'merge-intervals', rating: 'failed', confidence: 1, failureReasons: ['missed_boundary_case'] },
            { type: 'RECOMMEND' },
            { type: 'ADVANCE_HOURS', hours: 26 },
            { type: 'ATTEMPT', problemId: 'merge-intervals', rating: 'simple', confidence: 5, hintsUsed: false },
            { type: 'VERIFY_INTERVENTIONS' }
          ];

        case 'conflicting-evidence':
          return [
            { type: 'ATTEMPT', problemId: 'course-schedule', rating: 'failed', confidence: 5, failureReasons: ['syntax_error'] },
            { type: 'RECOMMEND' }
          ];

        case 'missing-corrupted-evidence':
          return [
            { type: 'ATTEMPT', problemId: 'missing-history-prob', rating: 'simple', confidence: 4, timestamp: '2026-10-01T09:00:00.000Z' },
            { type: 'ATTEMPT', problemId: 'invalid-order-prob', rating: 'failed', timestamp: '2026-09-20T09:00:00.000Z' } // Chronological violation
          ];

        default:
          throw new Error(`Unknown scenario fixture: ${name}`);
      }
    }

    /**
     * Executes one of the standard scenario fixtures
     */
    runScenario(name) {
      const fixture = TimeTravelSimulator.getScenarioFixture(name);
      this.reset();
      return this.replay(fixture);
    }
  }

  // Environment export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeTravelSimulator;
  }
  if (typeof window !== 'undefined') {
    window.TimeTravelSimulator = TimeTravelSimulator;
  }
})();
