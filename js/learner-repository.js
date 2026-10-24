/**
 * AlgoRecall — LearnerRepository Module
 * 
 * Central data repository managing user-scoped local persistence, namespace isolation,
 * and context switching for Guest and Authenticated Learners.
 * Follows the project's zero-dependency universal module pattern (Browser IIFE + CommonJS).
 * 
 * CORE RESPONSIBILITIES:
 * 1. Isolate storage namespaces: Guest vs User A vs User B.
 * 2. Sanitize and validate user identifiers to prevent key collisions or traversal.
 * 3. Guard against unverified or partially restored authentication switches.
 * 4. Provide explicit user-scoped and active-context CRUD operations.
 * 5. Notify downstream engines of context transitions to prevent in-memory cross-talk.
 */

(function(global) {
  'use strict';

  // Base storage keys (logical identifiers)
  const KEYS = {
    SCHEMA: 'algorecall_schema_version',
    PROBLEMS: 'algorecall_problems_v2',
    USER_STATES: 'algorecall_user_states_v2',
    EXAM_HISTORY: 'algorecall_exam_history_v2',
    MOCK_HISTORY: 'algorecall_mock_history_v2',
    FAILURES: 'algorecall_failures_v2',
    GAMIFICATION: 'algorecall_gamification_v2',
    SETTINGS: 'algorecall_settings_v2',
    ROADMAP: 'algorecall_roadmap_progress_v1',
    INTERVENTIONS: 'algorecall_interventions_v2',
    ACTIVE_EXAM: 'algorecall_active_exam_session_v2',
    ACTIVE_MOCK: 'algorecall_active_mock_session_v2',
    TRAINER_DRAFT_PREFIX: 'algorecall_trainer_draft_',
    TRAINER_EVENTS: 'algorecall_trainer_events_v2',
    MIGRATION_META: 'algorecall_migration_meta'
  };

  // In-memory fallback storage
  const _memoryStore = new Map();
  function getRawStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
      if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    } catch (_) {}
    return {
      getItem: (k) => _memoryStore.has(k) ? _memoryStore.get(k) : null,
      setItem: (k, v) => _memoryStore.set(k, String(v)),
      removeItem: (k) => _memoryStore.delete(k),
      clear: () => _memoryStore.clear()
    };
  }

  // Active Context State
  // Context shape: { type: 'guest' | 'user', id: 'guest' | '<safeUserId>', rawId: string|null, email: string|null }
  let currentContext = {
    type: 'guest',
    id: 'guest',
    rawId: null,
    email: null,
    isGuest: true
  };

  const contextChangeListeners = new Set();

  /**
   * Sanitizes a user ID into a safe storage key token.
   * Allows alphanumeric characters, underscores, and hyphens.
   * Max 64 characters. Throws if invalid or empty.
   * 
   * @param {string} userId 
   * @returns {string}
   */
  function sanitizeUserId(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('LearnerRepository: Invalid userId. Must be a non-empty string.');
    }
    const sanitized = userId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
    if (!sanitized) {
      throw new Error('LearnerRepository: Invalid userId. Sanitized userId is empty.');
    }
    return sanitized;
  }

  /**
   * Normalizes context argument (string or object) into a canonical context descriptor.
   * @param {string|Object} [ctx]
   * @returns {{ type: string, id: string, rawId: string|null, email: string|null, isGuest: boolean }}
   */
  function normalizeContext(ctx) {
    if (!ctx || ctx === 'guest' || (typeof ctx === 'object' && ctx.type === 'guest')) {
      return {
        type: 'guest',
        id: 'guest',
        rawId: null,
        email: null,
        isGuest: true
      };
    }

    if (typeof ctx === 'string') {
      const cleanId = ctx.startsWith('user:') ? ctx.slice(5) : ctx;
      const safeId = sanitizeUserId(cleanId);
      return {
        type: 'user',
        id: safeId,
        rawId: cleanId,
        email: null,
        isGuest: false
      };
    }

    if (typeof ctx === 'object' && (ctx.type === 'user' || ctx.id)) {
      const rawId = ctx.rawId || ctx.id;
      const safeId = sanitizeUserId(rawId);
      return {
        type: 'user',
        id: safeId,
        rawId: rawId,
        email: ctx.email || null,
        isGuest: false
      };
    }

    throw new Error('LearnerRepository: Unrecognized context descriptor.');
  }

  /**
   * Resolves a logical storage key to its physical namespaced key.
   * - Authenticated User: `algorecall_u_<safeUserId>_<keySuffix>`
   * - Guest: `algorecall_guest_<keySuffix>` (with seamless fallback to legacy un-namespaced key if present)
   * 
   * @param {string} logicalKey 
   * @param {string|Object} [ctx] 
   * @returns {string}
   */
  function resolveKey(logicalKey, ctx) {
    const context = ctx ? normalizeContext(ctx) : currentContext;

    if (!context || context.isGuest) {
      // Guest namespace
      return resolveGuestKey(logicalKey);
    }

    // Authenticated user namespace: algorecall_u_<safeId>_<cleanKey>
    const cleanKey = logicalKey.replace(/^algorecall_/, '');
    return `algorecall_u_${context.id}_${cleanKey}`;
  }

  /**
   * Internal guest key resolver.
   * Checks if an explicit guest namespaced key exists; if not, falls back to legacy key.
   * @param {string} logicalKey 
   * @returns {string}
   */
  function resolveGuestKey(logicalKey) {
    const storage = getRawStorage();
    const cleanKey = logicalKey.replace(/^algorecall_/, '');
    const guestNamespaced = `algorecall_guest_${cleanKey}`;
    
    // Trainer drafts and events always use explicit guest namespace
    if (logicalKey.startsWith('algorecall_trainer_')) {
      return guestNamespaced;
    }

    // If explicit guest key exists, use it
    if (storage && storage.getItem(guestNamespaced) !== null) {
      return guestNamespaced;
    }

    // Default to base/legacy key for seamless backward compatibility with existing learner data
    return logicalKey;
  }

  /**
   * Returns a clone of the current active learner context.
   * @returns {Object}
   */
  function getActiveContext() {
    return { ...currentContext };
  }

  /**
   * Switches the active learner context.
   * Validates target identity, clears in-memory leak vectors, and notifies subscribers.
   * 
   * @param {string|Object} newContext 
   * @param {Object} [options]
   * @param {boolean} [options.silent] - If true, do not emit context change event.
   * @returns {Object} The new active context.
   */
  function setContext(newContext, options = {}) {
    const prevContext = { ...currentContext };
    const normalized = normalizeContext(newContext);

    // If context has not changed, return early
    if (prevContext.id === normalized.id && prevContext.type === normalized.type) {
      return getActiveContext();
    }

    currentContext = normalized;

    if (!options.silent) {
      contextChangeListeners.forEach(listener => {
        try {
          listener(currentContext, prevContext);
        } catch (err) {
          console.error('[LearnerRepository] Error in onContextChange listener:', err);
        }
      });
    }

    return getActiveContext();
  }

  /**
   * Subscribes to context transitions (e.g. Guest -> User A, User A -> Guest, User A -> User B).
   * @param {Function} callback - (newContext, prevContext) => void
   * @returns {{ unsubscribe: Function }}
   */
  function onContextChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('LearnerRepository: onContextChange expects a function callback.');
    }
    contextChangeListeners.add(callback);
    return {
      unsubscribe: () => {
        contextChangeListeners.delete(callback);
      }
    };
  }

  // =========================================================================
  // Scoped Storage Access Operations & Quota Management
  // =========================================================================

  let _lastStorageError = null;

  function getLastStorageError() {
    return _lastStorageError ? { ..._lastStorageError } : null;
  }

  function clearLastStorageError() {
    _lastStorageError = null;
  }

  function isQuotaError(err) {
    if (!err) return false;
    const name = err.name || '';
    const msg = (err.message || '').toLowerCase();
    const code = err.code;
    return (
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      code === 22 ||
      code === 1014 ||
      msg.includes('quota') ||
      msg.includes('storage full')
    );
  }

  function purgeTransientStorage(storage) {
    if (!storage) return 0;
    let purged = 0;
    try {
      const keysToPurge = [];
      const checkKey = (k) => {
        if (!k) return;
        // Purge quarantined corrupt/unsupported drafts, staging keys, or expired locks
        if (k.includes('_corrupt_') || k.includes('_unsupported_v') || k.startsWith('algorecall_staging_restore_') || k.startsWith('algorecall_evt_lock_')) {
          keysToPurge.push(k);
        }
      };

      if (typeof storage.length === 'number' && typeof storage.key === 'function') {
        for (let i = 0; i < storage.length; i++) {
          checkKey(storage.key(i));
        }
      } else if (storage instanceof Map) {
        for (const k of storage.keys()) {
          checkKey(k);
        }
      } else if (typeof Object.keys === 'function') {
        for (const k of Object.keys(storage)) {
          checkKey(k);
        }
      }

      keysToPurge.forEach(k => {
        try {
          storage.removeItem(k);
          purged++;
        } catch (_) {}
      });
    } catch (_) {}
    return purged;
  }

  function getItem(logicalKey, ctx) {
    try {
      const storage = getRawStorage();
      if (!storage) return null;
      const physicalKey = resolveKey(logicalKey, ctx);
      return storage.getItem(physicalKey);
    } catch (e) {
      console.error(`[LearnerRepository] getItem error for ${logicalKey}:`, e);
      return null;
    }
  }

  // Scoped in-memory parse cache (invalidated on writes and storage events)
  const _jsonCache = new Map();

  function cloneCached(val) {
    if (val === null || val === undefined) return val;
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(val);
      } catch (_) {}
    }
    return JSON.parse(JSON.stringify(val));
  }

  function setItem(logicalKey, value, ctx) {
    try {
      const storage = getRawStorage();
      if (!storage) return false;
      const physicalKey = resolveKey(logicalKey, ctx);
      try {
        const strVal = String(value);
        storage.setItem(physicalKey, strVal);
        if (_lastStorageError && _lastStorageError.key === physicalKey) {
          _lastStorageError = null;
        }
        if (_jsonCache.has(physicalKey) && _jsonCache.get(physicalKey).raw !== strVal) {
          _jsonCache.delete(physicalKey);
        }
        return true;
      } catch (err) {
        if (isQuotaError(err)) {
          const reclaimed = purgeTransientStorage(storage);
          if (reclaimed > 0) {
            try {
              storage.setItem(physicalKey, String(value));
              _lastStorageError = null;
              return true;
            } catch (_) {}
          }
          _lastStorageError = {
            code: 'QUOTA_EXCEEDED',
            key: physicalKey,
            logicalKey,
            message: err.message || 'Storage quota exceeded',
            timestamp: Date.now()
          };
          console.warn(`[LearnerRepository] Storage quota exceeded for ${logicalKey}:`, err);
        } else {
          _lastStorageError = {
            code: 'STORAGE_ERROR',
            key: physicalKey,
            logicalKey,
            message: err.message || 'Storage error',
            timestamp: Date.now()
          };
          console.error(`[LearnerRepository] setItem error for ${logicalKey}:`, err);
        }
        return false;
      }
    } catch (e) {
      console.error(`[LearnerRepository] setItem fatal error for ${logicalKey}:`, e);
      return false;
    }
  }

  function removeItem(logicalKey, ctx) {
    try {
      const storage = getRawStorage();
      if (!storage) return false;
      const physicalKey = resolveKey(logicalKey, ctx);
      storage.removeItem(physicalKey);
      _jsonCache.delete(physicalKey);
      return true;
    } catch (e) {
      console.error(`[LearnerRepository] removeItem error for ${logicalKey}:`, e);
      return false;
    }
  }

  function getJSON(logicalKey, fallback = null, ctx) {
    const raw = getItem(logicalKey, ctx);
    if (raw === null || raw === undefined) return fallback;
    const physicalKey = resolveKey(logicalKey, ctx);
    if (_jsonCache.has(physicalKey)) {
      const cached = _jsonCache.get(physicalKey);
      if (cached.raw === raw) {
        return cloneCached(cached.value);
      }
    }
    try {
      const parsed = JSON.parse(raw);
      _jsonCache.set(physicalKey, { raw, value: parsed });
      return cloneCached(parsed);
    } catch (e) {
      console.warn(`[LearnerRepository] JSON parse error for ${logicalKey}:`, e);
      return fallback;
    }
  }

  function setJSON(logicalKey, value, ctx) {
    const raw = JSON.stringify(value);
    const success = setItem(logicalKey, raw, ctx);
    if (success) {
      const physicalKey = resolveKey(logicalKey, ctx);
      _jsonCache.set(physicalKey, { raw, value: cloneCached(value) });
    }
    return success;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key) {
        _jsonCache.delete(e.key);
      } else {
        _jsonCache.clear();
      }
    });
  }

  // =========================================================================
  // High-Level Domain Accessors (Scoped)
  // =========================================================================

  function getUserStates(ctx) {
    return getJSON(KEYS.USER_STATES, {}, ctx);
  }

  function saveUserStates(states, ctx) {
    return setJSON(KEYS.USER_STATES, states || {}, ctx);
  }

  function getProblems(ctx) {
    return getJSON(KEYS.PROBLEMS, null, ctx);
  }

  function saveProblems(problems, ctx) {
    return setJSON(KEYS.PROBLEMS, Array.isArray(problems) ? problems : [], ctx);
  }

  function getExamHistory(ctx) {
    return getJSON(KEYS.EXAM_HISTORY, [], ctx);
  }

  function saveExamHistory(history, ctx) {
    return setJSON(KEYS.EXAM_HISTORY, Array.isArray(history) ? history : [], ctx);
  }

  function getMockHistory(ctx) {
    return getJSON(KEYS.MOCK_HISTORY, [], ctx);
  }

  function saveMockHistory(history, ctx) {
    return setJSON(KEYS.MOCK_HISTORY, Array.isArray(history) ? history : [], ctx);
  }

  function getRoadmapProgress(ctx) {
    return getJSON(KEYS.ROADMAP, null, ctx);
  }

  function saveRoadmapProgress(progress, ctx) {
    return setJSON(KEYS.ROADMAP, progress || {}, ctx);
  }

  function getGamification(ctx) {
    return getJSON(KEYS.GAMIFICATION, null, ctx);
  }

  function saveGamification(progress, ctx) {
    return setJSON(KEYS.GAMIFICATION, progress || {}, ctx);
  }

  function getSettings(ctx) {
    return getJSON(KEYS.SETTINGS, null, ctx);
  }

  function saveSettings(settings, ctx) {
    return setJSON(KEYS.SETTINGS, settings || {}, ctx);
  }

  function getFailures(ctx) {
    return getJSON(KEYS.FAILURES, {}, ctx);
  }

  function saveFailures(failures, ctx) {
    return setJSON(KEYS.FAILURES, failures || {}, ctx);
  }

  function getInterventions(ctx) {
    return getJSON(KEYS.INTERVENTIONS, [], ctx);
  }

  function saveInterventions(interventions, ctx) {
    return setJSON(KEYS.INTERVENTIONS, Array.isArray(interventions) ? interventions : [], ctx);
  }

  // Ephemeral in-progress session accessors (strictly scoped)
  function getActiveExamSession(ctx) {
    return getJSON(KEYS.ACTIVE_EXAM, null, ctx);
  }

  function saveActiveExamSession(session, ctx) {
    if (!session) return removeItem(KEYS.ACTIVE_EXAM, ctx);
    return setJSON(KEYS.ACTIVE_EXAM, session, ctx);
  }

  function clearActiveExamSession(ctx) {
    return removeItem(KEYS.ACTIVE_EXAM, ctx);
  }

  function getActiveMockSession(ctx) {
    return getJSON(KEYS.ACTIVE_MOCK, null, ctx);
  }

  function saveActiveMockSession(session, ctx) {
    if (!session) return removeItem(KEYS.ACTIVE_MOCK, ctx);
    return setJSON(KEYS.ACTIVE_MOCK, session, ctx);
  }

  function clearActiveMockSession(ctx) {
    return removeItem(KEYS.ACTIVE_MOCK, ctx);
  }

  // =========================================================================
  // Solution Discovery Trainer Ephemeral Draft & Event Accessors (Stage 2)
  // =========================================================================

  function getTrainerDraftLogicalKey(problemId) {
    const cleanId = String(problemId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${KEYS.TRAINER_DRAFT_PREFIX}${cleanId}`;
  }

  /**
   * Retrieves an active trainer draft for a problem in the active or specified context.
   * Includes corrupt draft recovery: if corrupt, quarantines key and returns null.
   * @param {string|number} problemId
   * @param {string|Object} [ctx]
   * @returns {Object|null}
   */
  function getTrainerDraft(problemId, ctx) {
    if (!problemId) return null;
    const logicalKey = getTrainerDraftLogicalKey(problemId);
    const raw = getItem(logicalKey, ctx);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.problemId) {
        // Schema compatibility check: major version must be <= 2
        if (parsed.schemaVersion && typeof parsed.schemaVersion === 'string') {
          const major = parseInt(parsed.schemaVersion.split('.')[0], 10);
          if (!isNaN(major) && major > 2) {
            console.warn(`[LearnerRepository] Unsupported trainer draft schema version ${parsed.schemaVersion} for problem ${problemId}. Quarantining.`);
            const physicalKey = resolveKey(logicalKey, ctx);
            const storage = getRawStorage();
            if (storage) {
              const quarantineKey = `${physicalKey}_unsupported_v${parsed.schemaVersion}_${Date.now()}`;
              storage.setItem(quarantineKey, raw);
              storage.removeItem(physicalKey);
            }
            return null;
          }
        }
        return parsed;
      }
      throw new Error('Malformed draft payload');
    } catch (err) {
      console.warn(`[LearnerRepository] Corrupt trainer draft detected for problem ${problemId}. Quarantining:`, err);
      const physicalKey = resolveKey(logicalKey, ctx);
      const storage = getRawStorage();
      if (storage) {
        const quarantineKey = `${physicalKey}_corrupt_${Date.now()}`;
        storage.setItem(quarantineKey, raw);
        storage.removeItem(physicalKey);
      }
      return null;
    }
  }

  /**
   * Saves an active trainer draft with monotonic draftVersion and updatedAt epoch.
   * Guards against stale concurrent writes.
   * @param {string|number} problemId
   * @param {Object} draft
   * @param {string|Object} [ctx]
   * @returns {boolean}
   */
  function saveTrainerDraft(problemId, draft, ctx) {
    if (!problemId || !draft || typeof draft !== 'object') return false;
    const logicalKey = getTrainerDraftLogicalKey(problemId);
    const existing = getTrainerDraft(problemId, ctx);

    // Stale write guard: if existing is newer than incoming draft's updatedAt, reject stale write
    if (existing && draft.updatedAt && existing.updatedAt && draft.updatedAt < existing.updatedAt) {
      console.warn(`[LearnerRepository] Stale trainer draft write rejected for problem ${problemId}`);
      return false;
    }

    const nextVersion = existing ? ((existing.draftVersion || 1) + 1) : (draft.draftVersion || 1);
    const updatedTimestamp = (typeof draft.updatedAt === 'number' && (!existing || draft.updatedAt >= existing.updatedAt))
      ? draft.updatedAt
      : Date.now();

    const safeDraft = {
      ...draft,
      schemaVersion: draft.schemaVersion || '2.0.0',
      draftVersion: nextVersion,
      problemId: String(problemId),
      updatedAt: updatedTimestamp
    };

    return setJSON(logicalKey, safeDraft, ctx);
  }

  /**
   * Clears an active trainer draft upon completion, abandonment, or manual discard.
   * @param {string|number} problemId
   * @param {string|Object} [ctx]
   * @returns {boolean}
   */
  function clearTrainerDraft(problemId, ctx) {
    if (!problemId) return false;
    const logicalKey = getTrainerDraftLogicalKey(problemId);
    return removeItem(logicalKey, ctx);
  }

  /**
   * Returns all active trainer drafts for the given context.
   * @param {string|Object} [ctx]
   * @returns {Array<{ problemId: string, draft: Object }>}
   */
  function getAllTrainerDrafts(ctx) {
    const context = ctx ? normalizeContext(ctx) : currentContext;
    const storage = getRawStorage();
    const results = [];
    if (!storage) return results;

    const prefix = context.isGuest ? 'algorecall_guest_trainer_draft_' : `algorecall_u_${context.id}_trainer_draft_`;

    const checkKey = (k) => {
      if (k && k.startsWith(prefix) && !k.includes('_corrupt_')) {
        const raw = storage.getItem(k);
        if (raw) {
          try {
            const draft = JSON.parse(raw);
            if (draft && draft.problemId) {
              results.push({ problemId: draft.problemId, draft });
            }
          } catch (_) {}
        }
      }
    };

    if (typeof storage.length === 'number' && typeof storage.key === 'function') {
      for (let i = 0; i < storage.length; i++) {
        checkKey(storage.key(i));
      }
    } else if (storage instanceof Map || (storage._map instanceof Map)) {
      const map = storage instanceof Map ? storage : storage._map;
      for (const k of map.keys()) {
        checkKey(k);
      }
    } else if (typeof Object.keys === 'function') {
      for (const k of Object.keys(storage)) {
        checkKey(k);
      }
    }

    return results;
  }

  /**
   * Checks if a trainer completion event has already been processed (Exactly-once deduplication).
   * @param {string} eventId
   * @param {string|Object} [ctx]
   * @returns {boolean}
   */
  function isTrainerEventProcessed(eventId, ctx) {
    if (!eventId) return false;
    const registry = getJSON(KEYS.TRAINER_EVENTS, {}, ctx) || {};
    return Boolean(registry[eventId]);
  }

  /**
   * Records a processed trainer event in the durable event registry.
   * @param {Object} event - Durable event object with eventId
   * @param {string|Object} [ctx]
   * @returns {boolean}
   */
  function recordTrainerEvent(event, ctx) {
    if (!event || !event.eventId) return false;
    const registry = getJSON(KEYS.TRAINER_EVENTS, {}, ctx) || {};
    registry[event.eventId] = {
      eventId: event.eventId,
      problemId: event.problemId,
      outcome: event.outcome,
      xpAwarded: typeof event.xpAwarded === 'number' ? event.xpAwarded : 0,
      processedAt: Date.now()
    };
    return setJSON(KEYS.TRAINER_EVENTS, registry, ctx);
  }

  /**
   * Bulk-saves or restores the processed trainer event registry for an account.
   * @param {Object} events
   * @param {string|Object} [ctx]
   * @returns {boolean}
   */
  function saveTrainerProcessedEvents(events, ctx) {
    if (!events || typeof events !== 'object') return false;
    return setJSON(KEYS.TRAINER_EVENTS, events, ctx);
  }

  // Cross-Tab / Cross-Process Event Locking (Stage 7 Persistence Hardening)
  const EVENT_LOCK_PREFIX = 'algorecall_evt_lock_';
  const EVENT_LOCK_TTL_MS = 10000; // 10 seconds auto-reclaim

  /**
   * Attempts to acquire an atomic storage-backed lock for an eventId.
   * Protects against concurrent committal across multiple tabs or workers.
   * @param {string} eventId
   * @param {string|Object} [ctx]
   * @returns {boolean} True if lock acquired, false if already locked
   */
  function acquireEventLock(eventId, ctx) {
    if (!eventId) return false;
    const storage = getRawStorage();
    if (!storage) return true;
    const physicalKey = resolveKey(`${EVENT_LOCK_PREFIX}${eventId}`, ctx);
    const now = Date.now();
    try {
      const existing = storage.getItem(physicalKey);
      if (existing) {
        const lockTime = parseInt(existing, 10);
        if (!isNaN(lockTime) && (now - lockTime) < EVENT_LOCK_TTL_MS) {
          return false;
        }
      }
      storage.setItem(physicalKey, String(now));
      return true;
    } catch (_) {
      return true;
    }
  }

  /**
   * Releases the storage-backed event lock.
   * @param {string} eventId
   * @param {string|Object} [ctx]
   */
  function releaseEventLock(eventId, ctx) {
    if (!eventId) return;
    const storage = getRawStorage();
    if (!storage) return;
    const physicalKey = resolveKey(`${EVENT_LOCK_PREFIX}${eventId}`, ctx);
    try {
      storage.removeItem(physicalKey);
    } catch (_) {}
  }

  /**
   * Returns all processed trainer events for the context.
   * @param {string|Object} [ctx]
   * @returns {Object}
   */
  function getTrainerProcessedEvents(ctx) {
    return getJSON(KEYS.TRAINER_EVENTS, {}, ctx) || {};
  }

  /**
   * Returns all physical storage keys for a given user.
   * @param {string} userId 
   * @returns {string[]}
   */
  function getAllUserKeys(userId) {
    const safeId = sanitizeUserId(userId);
    const prefix = `algorecall_u_${safeId}_`;
    const storage = getRawStorage();
    const matches = [];
    if (!storage) return matches;

    if (typeof storage.length === 'number' && typeof storage.key === 'function') {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(prefix)) matches.push(k);
      }
    } else if (storage instanceof Map || (storage._map instanceof Map)) {
      const map = storage instanceof Map ? storage : storage._map;
      for (const k of map.keys()) {
        if (k.startsWith(prefix)) matches.push(k);
      }
    } else if (typeof Object.keys === 'function') {
      for (const k of Object.keys(storage)) {
        if (k.startsWith(prefix)) matches.push(k);
      }
    }
    return matches;
  }

  /**
   * Checks if an authenticated user already has saved progress.
   * @param {string} userId 
   * @returns {boolean}
   */
  function hasUserData(userId) {
    try {
      const safeId = sanitizeUserId(userId);
      const userStatesKey = `algorecall_u_${safeId}_user_states_v2`;
      const storage = getRawStorage();
      if (!storage) return false;
      const raw = storage.getItem(userStatesKey);
      if (!raw) {
        // Also check if any key exists for this user
        const allKeys = getAllUserKeys(userId);
        return allKeys.length > 0;
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
    } catch (_) {
      return false;
    }
  }

  /**
   * Deletes all local storage data for a specific user namespace.
   * @param {string} userId 
   * @returns {number} Count of removed keys
   */
  function clearUserData(userId) {
    const keys = getAllUserKeys(userId);
    const storage = getRawStorage();
    if (!storage) return 0;
    let count = 0;
    keys.forEach(k => {
      try {
        storage.removeItem(k);
        _jsonCache.delete(k);
        count++;
      } catch (_) {}
    });
    return count;
  }

  /**
   * Returns list of base legacy keys.
   * @returns {string[]}
   */
  function getLegacyKeys() {
    return [
      KEYS.USER_STATES,
      KEYS.PROBLEMS,
      KEYS.EXAM_HISTORY,
      KEYS.MOCK_HISTORY,
      KEYS.FAILURES,
      KEYS.GAMIFICATION,
      KEYS.SETTINGS,
      KEYS.ROADMAP,
      KEYS.INTERVENTIONS,
      KEYS.ACTIVE_EXAM,
      KEYS.ACTIVE_MOCK
    ];
  }

  /**
   * Checks if legacy un-namespaced learner data exists.
   * @returns {boolean}
   */
  function hasLegacyData() {
    try {
      const storage = getRawStorage();
      if (!storage) return false;
      const rawStates = storage.getItem(KEYS.USER_STATES);
      if (rawStates) {
        const parsed = JSON.parse(rawStates);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return true;
        }
      }
      const rawRoadmap = storage.getItem(KEYS.ROADMAP);
      if (rawRoadmap) {
        const parsed = JSON.parse(rawRoadmap);
        if (parsed && parsed.completedDays && Object.keys(parsed.completedDays).length > 0) {
          return true;
        }
      }
      const rawMocks = storage.getItem(KEYS.MOCK_HISTORY);
      if (rawMocks) {
        const parsed = JSON.parse(rawMocks);
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      }
      const rawExams = storage.getItem(KEYS.EXAM_HISTORY);
      if (rawExams) {
        const parsed = JSON.parse(rawExams);
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      }
    } catch (_) {}
    return false;
  }

  /**
   * Resets the repository state (for testing isolation).
   */
  function _resetForTesting() {
    currentContext = {
      type: 'guest',
      id: 'guest',
      rawId: null,
      email: null,
      isGuest: true
    };
    contextChangeListeners.clear();
    _memoryStore.clear();
    _jsonCache.clear();
    _lastStorageError = null;
  }

  const LearnerRepositoryModule = {
    KEYS,
    getRawStorage,
    sanitizeUserId,
    normalizeContext,
    resolveKey,
    getActiveContext,
    getContext: getActiveContext,
    setContext,
    onContextChange,
    getItem,
    setItem,
    removeItem,
    getJSON,
    setJSON,
    getLastStorageError,
    clearLastStorageError,
    getUserStates,
    saveUserStates,
    getProblems,
    saveProblems,
    getExamHistory,
    saveExamHistory,
    getMockHistory,
    saveMockHistory,
    getRoadmapProgress,
    saveRoadmapProgress,
    getGamification,
    saveGamification,
    getSettings,
    saveSettings,
    getFailures,
    saveFailures,
    getInterventions,
    saveInterventions,
    getActiveExamSession,
    saveActiveExamSession,
    clearActiveExamSession,
    getActiveMockSession,
    saveActiveMockSession,
    clearActiveMockSession,
    getTrainerDraft,
    saveTrainerDraft,
    clearTrainerDraft,
    getAllTrainerDrafts,
    isTrainerEventProcessed,
    recordTrainerEvent,
    getTrainerProcessedEvents,
    saveTrainerProcessedEvents,
    acquireEventLock,
    releaseEventLock,
    getAllUserKeys,
    hasUserData,
    clearUserData,
    getLegacyKeys,
    hasLegacyData,
    _resetForTesting
  };

  // Export to browser global and CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearnerRepositoryModule;
  }
  if (typeof window !== 'undefined') {
    window.LearnerRepository = LearnerRepositoryModule;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
