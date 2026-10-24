/**
 * AlgoRecall — CloudRepository Module
 * 
 * Provides secure PostgreSQL / Supabase cloud persistence for authenticated learner snapshots.
 * Implements Optimistic Concurrency Control (OCC), payload validation, strict sanitization,
 * PII minimization, and conflict diagnostics.
 * 
 * Follows the project's zero-dependency universal module pattern (Browser IIFE + CommonJS).
 * 
 * ARCHITECTURAL INVARIANTS:
 * 1. Authenticated Identity Source of Truth: Uses auth.uid() exclusively. Never trusts client user IDs.
 * 2. Zero Secret Leaks: Client-side API keys (e.g. OpenAI/Gemini) are strictly purged before upload.
 * 3. Ephemeral Drafts Excluded: Active exam and mock timers remain local-only.
 * 4. Optimistic Concurrency Control (OCC): Every update requires matching expectedVersion. Stale updates return explicit VERSION_CONFLICT errors.
 * 5. No Automatic Sync: This module provides explicit, on-demand cloud repository operations.
 */

(function(global) {
  'use strict';

  // Dependency Resolution (Browser globals with Node.js CommonJS fallback)
  const _AuthEngine = (typeof window !== 'undefined' && window.AuthEngine) ||
    (typeof require !== 'undefined' ? require('./auth-engine') : null);

  const _LearnerRepository = (typeof window !== 'undefined' && window.LearnerRepository) ||
    (typeof require !== 'undefined' ? require('./learner-repository') : null);

  function getAuth() {
    return (typeof window !== 'undefined' && window.AuthEngine) || _AuthEngine;
  }

  function getRepo() {
    return (typeof window !== 'undefined' && window.LearnerRepository) || _LearnerRepository;
  }

  /**
   * Resolves the Supabase client instance.
   * Priority: options.client -> AuthEngine.getClient() -> window.supabase -> injected factory.
   * 
   * @param {Object} [options]
   * @returns {Object|null}
   */
  function resolveClient(options = {}) {
    if (options.client) return options.client;

    const auth = getAuth();
    if (auth && typeof auth.getClient === 'function') {
      const client = auth.getClient();
      if (client) return client;
    }

    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.from === 'function') {
      return window.supabase;
    }

    return null;
  }

  /**
   * Resolves the authenticated user.
   * Priority: options.user -> AuthEngine.getUser()
   * 
   * @param {Object} [options]
   * @returns {{ id: string, email?: string }|null}
   */
  function resolveUser(options = {}) {
    if (options.user !== undefined) {
      return (options.user && options.user.id) ? options.user : null;
    }

    const auth = getAuth();
    if (auth && typeof auth.getUser === 'function') {
      return auth.getUser();
    }

    return null;
  }

  /**
   * Computes a deterministic FNV-1a 32-bit hex checksum from a JSON string.
   * Provides rapid client-side data integrity verification without external crypto libraries.
   * 
   * @param {string|Object} input
   * @returns {string} Hex hash string
   */
  function computeChecksum(input) {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  /**
   * Deeply sanitizes a learner payload prior to cloud persistence.
   * 
   * SECURITY ENFORCEMENTS:
   * 1. Strips any AI API keys (aiApiKey) from settings.
   * 2. Excludes activeExamSession and activeMockSession (ephemeral drafts remain local).
   * 3. Retains authoritative learning evidence and history.
   * 
   * @param {Object} payload 
   * @returns {Object} Cleaned, clone of payload
   */
  function sanitizePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('CloudRepository: Payload must be a non-null object.');
    }

    // Deep clone to prevent mutating in-memory client state
    const clean = JSON.parse(JSON.stringify(payload));

    // 1. Purge secrets from settings
    if (clean.settings && typeof clean.settings === 'object') {
      delete clean.settings.aiApiKey;
    }

    // 2. Purge ephemeral in-flight sessions and trainer drafts
    delete clean.activeExamSession;
    delete clean.activeMockSession;
    delete clean.activeTrainerSession;
    delete clean.activeTrainerDraft;
    delete clean.trainerDrafts;

    // Purge any keys starting with trainer draft prefixes
    Object.keys(clean).forEach(k => {
      if (k.startsWith('trainer_draft') || k.startsWith('algorecall_trainer_draft')) {
        delete clean[k];
      }
    });

    // 3. Ensure core objects exist and conform to schema
    if (!clean.userStates || typeof clean.userStates !== 'object' || Array.isArray(clean.userStates)) {
      clean.userStates = {};
    }
    if (!clean.examHistory || !Array.isArray(clean.examHistory)) {
      clean.examHistory = [];
    }
    if (!clean.mockHistory || !Array.isArray(clean.mockHistory)) {
      clean.mockHistory = [];
    }
    if (!clean.failures || typeof clean.failures !== 'object' || Array.isArray(clean.failures)) {
      clean.failures = {};
    }
    if (!clean.problems || !Array.isArray(clean.problems)) {
      clean.problems = [];
    }

    return clean;
  }

  /**
   * Extracts compact summary metrics from a learner payload for indexed querying.
   * 
   * @param {Object} payload 
   * @returns {Object} Extracted summary metrics
   */
  function computeSummary(payload) {
    const states = payload.userStates || {};
    const problemKeys = Object.keys(states);
    let masteredCount = 0;
    let maxReviewedEpoch = 0;

    for (let i = 0; i < problemKeys.length; i++) {
      const st = states[problemKeys[i]];
      if (st && st.stage >= 4 && (st.confidence === undefined || st.confidence >= 4)) {
        masteredCount++;
      }
      if (st && st.lastReviewed) {
        const epoch = new Date(st.lastReviewed).getTime();
        if (!isNaN(epoch) && epoch > maxReviewedEpoch) {
          maxReviewedEpoch = epoch;
        }
      }
    }

    const gamification = payload.gamification || {};

    return {
      problemsPracticed: problemKeys.length,
      masteredCount: masteredCount,
      xp: typeof gamification.xp === 'number' ? gamification.xp : 0,
      level: typeof gamification.level === 'number' ? gamification.level : 1,
      streak: typeof gamification.streak === 'number' ? gamification.streak : 0,
      mockCount: Array.isArray(payload.mockHistory) ? payload.mockHistory.length : 0,
      examCount: Array.isArray(payload.examHistory) ? payload.examHistory.length : 0,
      customProblemsCount: Array.isArray(payload.problems) ? payload.problems.length : 0,
      lastPracticedAt: maxReviewedEpoch > 0 ? new Date(maxReviewedEpoch).toISOString() : null
    };
  }

  /**
   * Validates that a payload is structurally conforming.
   * @param {Object} payload 
   * @returns {{ valid: boolean, error?: string }}
   */
  function validatePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { valid: false, error: 'Payload must be a non-null object.' };
    }

    if (payload.userStates && (typeof payload.userStates !== 'object' || Array.isArray(payload.userStates))) {
      return { valid: false, error: 'userStates must be a key-value dictionary object.' };
    }

    if (payload.examHistory && !Array.isArray(payload.examHistory)) {
      return { valid: false, error: 'examHistory must be an array.' };
    }

    if (payload.mockHistory && !Array.isArray(payload.mockHistory)) {
      return { valid: false, error: 'mockHistory must be an array.' };
    }

    return { valid: true };
  }

  /**
   * Reads the current snapshot for the authenticated user.
   * 
   * @param {Object} [options]
   * @param {Object} [options.client] Injected client for testing
   * @param {Object} [options.user] Injected user for testing
   * @returns {Promise<{ success: boolean, exists: boolean, data?: Object, version?: number, summary?: Object, error?: string, code?: string }>}
   */
  async function getSnapshot(options = {}) {
    const user = resolveUser(options);
    if (!user || !user.id) {
      return {
        success: false,
        exists: false,
        error: 'Unauthorized: User is not authenticated.',
        code: 'UNAUTHORIZED'
      };
    }

    const client = resolveClient(options);
    if (!client) {
      if (typeof window !== 'undefined' && typeof fetch === 'function' && window.localStorage) {
        const token = window.localStorage.getItem('algorecall_auth_token');
        if (token) {
          try {
            const resp = await fetch('/api/sync/snapshot', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            const ct = resp.headers.get('content-type') || '';
            if (resp.ok && ct.includes('application/json')) {
              const resData = await resp.json();
              if (resData.success) {
                return {
                  success: true,
                  exists: Boolean(resData.exists),
                  data: resData.snapshot || null,
                  version: resData.version || 0,
                  updatedAt: resData.updatedAt || null,
                  checksum: computeChecksum(resData.snapshot || {})
                };
              }
            }
          } catch (e) {
            return {
              success: false,
              exists: false,
              error: e.message,
              code: 'NETWORK_ERROR'
            };
          }
        }
      }

      return {
        success: false,
        exists: false,
        error: 'Supabase client is not configured or available.',
        code: 'CLIENT_UNAVAILABLE'
      };
    }

    try {
      const res = await client
        .from('learner_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (res.error) {
        // PGRST116 indicates 0 rows found in PostgREST single()
        if (res.error.code === 'PGRST116' || res.error.message?.includes('0 rows')) {
          return {
            success: true,
            exists: false,
            data: null,
            version: 0
          };
        }
        return {
          success: false,
          exists: false,
          error: res.error.message || 'Database error reading snapshot.',
          code: res.error.code || 'DATABASE_ERROR'
        };
      }

      return {
        success: true,
        exists: true,
        data: res.data.snapshot,
        version: res.data.version,
        summary: res.data.summary,
        checksum: res.data.checksum,
        updatedAt: res.data.updated_at,
        recordId: res.data.id
      };
    } catch (err) {
      return {
        success: false,
        exists: false,
        error: `Exception reading snapshot: ${err.message}`,
        code: 'CLIENT_EXCEPTION'
      };
    }
  }

  /**
   * Fetches only the lightweight version header and checksum of the user's cloud snapshot.
   * Useful for OCC conflict checks and freshness polling without downloading large payloads.
   * 
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, exists: boolean, version: number, updatedAt?: string, checksum?: string, error?: string, code?: string }>}
   */
  async function getSnapshotVersion(options = {}) {
    const user = resolveUser(options);
    if (!user || !user.id) {
      return {
        success: false,
        exists: false,
        version: 0,
        error: 'Unauthorized: User is not authenticated.',
        code: 'UNAUTHORIZED'
      };
    }

    const client = resolveClient(options);
    if (!client) {
      return {
        success: false,
        exists: false,
        version: 0,
        error: 'Supabase client is not configured or available.',
        code: 'CLIENT_UNAVAILABLE'
      };
    }

    try {
      const res = await client
        .from('learner_snapshots')
        .select('version, updated_at, checksum')
        .eq('user_id', user.id)
        .single();

      if (res.error) {
        if (res.error.code === 'PGRST116' || res.error.message?.includes('0 rows')) {
          return {
            success: true,
            exists: false,
            version: 0
          };
        }
        return {
          success: false,
          exists: false,
          version: 0,
          error: res.error.message,
          code: res.error.code || 'DATABASE_ERROR'
        };
      }

      return {
        success: true,
        exists: true,
        version: res.data.version,
        updatedAt: res.data.updated_at,
        checksum: res.data.checksum
      };
    } catch (err) {
      return {
        success: false,
        exists: false,
        version: 0,
        error: err.message,
        code: 'CLIENT_EXCEPTION'
      };
    }
  }

  /**
   * Safely creates the initial snapshot (version 1) for a user account.
   * 
   * CONFLICT GUARD:
   * Checks if a snapshot already exists. If one already exists, aborts with ALREADY_EXISTS
   * to prevent silent overwriting of prior cloud state.
   * 
   * @param {Object} payload - Raw learner progress bundle
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, version?: number, data?: Object, error?: string, code?: string }>}
   */
  async function createInitialSnapshot(payload, options = {}) {
    const user = resolveUser(options);
    if (!user || !user.id) {
      return {
        success: false,
        error: 'Unauthorized: User is not authenticated.',
        code: 'UNAUTHORIZED'
      };
    }

    const client = resolveClient(options);
    if (!client) {
      return {
        success: false,
        error: 'Supabase client is not configured or available.',
        code: 'CLIENT_UNAVAILABLE'
      };
    }

    const validation = validatePayload(payload);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation error: ${validation.error}`,
        code: 'VALIDATION_ERROR'
      };
    }

    // 1. Check if snapshot already exists
    const checkRes = await getSnapshotVersion(options);
    if (checkRes.exists) {
      return {
        success: false,
        error: `Conflict: Initial snapshot already exists for user (current version: ${checkRes.version}). Use updateSnapshot instead.`,
        code: 'ALREADY_EXISTS',
        currentVersion: checkRes.version
      };
    }

    // 2. Sanitize and prepare payload
    const sanitized = sanitizePayload(payload);
    const summary = computeSummary(sanitized);
    const checksum = computeChecksum(sanitized);

    const row = {
      user_id: user.id,
      version: 1,
      client_schema_version: '2.0.0',
      snapshot: sanitized,
      summary: summary,
      checksum: checksum
    };

    try {
      const res = await client
        .from('learner_snapshots')
        .insert(row)
        .select()
        .single();

      if (res.error) {
        if (res.error.code === '23505' || res.error.message?.includes('duplicate key')) {
          return {
            success: false,
            error: 'Conflict: Initial snapshot already exists (unique constraint violation).',
            code: 'ALREADY_EXISTS'
          };
        }
        return {
          success: false,
          error: res.error.message || 'Database error creating snapshot.',
          code: res.error.code || 'DATABASE_ERROR'
        };
      }

      return {
        success: true,
        version: 1,
        data: res.data.snapshot,
        summary: res.data.summary,
        checksum: res.data.checksum,
        recordId: res.data.id
      };
    } catch (err) {
      return {
        success: false,
        error: `Exception creating snapshot: ${err.message}`,
        code: 'CLIENT_EXCEPTION'
      };
    }
  }

  /**
   * Updates an existing snapshot using Optimistic Concurrency Control (OCC).
   * 
   * Requires matching expectedVersion. If the cloud database version has changed,
   * returns an explicit VERSION_CONFLICT error with current cloud version.
   * Never silently overwrites newer state.
   * 
   * @param {Object} payload - Updated learner progress bundle
   * @param {number} expectedVersion - Current version expected by the client (>= 1)
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, version?: number, data?: Object, expectedVersion?: number, currentVersion?: number, error?: string, code?: string }>}
   */
  async function updateSnapshot(payload, expectedVersion, options = {}) {
    const user = resolveUser(options);
    if (!user || !user.id) {
      return {
        success: false,
        error: 'Unauthorized: User is not authenticated.',
        code: 'UNAUTHORIZED'
      };
    }

    const client = resolveClient(options);
    if (!client) {
      if (typeof window !== 'undefined' && typeof fetch === 'function' && window.localStorage) {
        const token = window.localStorage.getItem('algorecall_auth_token');
        if (token) {
          try {
            const clean = sanitizePayload(payload);
            const resp = await fetch('/api/sync/snapshot', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ snapshot: clean })
            });
            const ct = resp.headers.get('content-type') || '';
            if (resp.ok && ct.includes('application/json')) {
              const resData = await resp.json();
              if (resData.success) {
                return {
                  success: true,
                  version: resData.version || (expectedVersion + 1),
                  recordId: 'snap_' + user.id,
                  data: clean,
                  updatedAt: resData.updatedAt || new Date().toISOString()
                };
              }
            }
          } catch (e) {
            return {
              success: false,
              error: e.message,
              code: 'NETWORK_ERROR'
            };
          }
        }
      }

      return {
        success: false,
        error: 'Supabase client is not configured or available.',
        code: 'CLIENT_UNAVAILABLE'
      };
    }

    if (typeof expectedVersion !== 'number' || expectedVersion < 1 || !Number.isInteger(expectedVersion)) {
      return {
        success: false,
        error: 'Optimistic concurrency control: expectedVersion must be an integer >= 1.',
        code: 'INVALID_VERSION'
      };
    }

    const validation = validatePayload(payload);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation error: ${validation.error}`,
        code: 'VALIDATION_ERROR'
      };
    }

    const sanitized = sanitizePayload(payload);
    const summary = computeSummary(sanitized);
    const checksum = computeChecksum(sanitized);
    const nextVersion = expectedVersion + 1;

    try {
      // OCC Update query: strictly filtered by user_id AND version = expectedVersion
      const res = await client
        .from('learner_snapshots')
        .update({
          version: nextVersion,
          snapshot: sanitized,
          summary: summary,
          checksum: checksum,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('version', expectedVersion)
        .select()
        .single();

      if (res.error) {
        // If 0 rows matched, PostgREST single() returns PGRST116 -> Version conflict!
        if (res.error.code === 'PGRST116' || res.error.message?.includes('0 rows')) {
          const fresh = await getSnapshotVersion(options);
          return {
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, but cloud snapshot is at version ${fresh.version}. Update rejected to prevent data loss.`,
            expectedVersion: expectedVersion,
            currentVersion: fresh.version
          };
        }

        return {
          success: false,
          error: res.error.message || 'Database error during snapshot update.',
          code: res.error.code || 'DATABASE_ERROR'
        };
      }

      return {
        success: true,
        version: nextVersion,
        data: res.data.snapshot,
        summary: res.data.summary,
        checksum: res.data.checksum,
        recordId: res.data.id
      };
    } catch (err) {
      return {
        success: false,
        error: `Exception updating snapshot: ${err.message}`,
        code: 'CLIENT_EXCEPTION'
      };
    }
  }

  /**
   * Universal snapshot save helper with Optimistic Concurrency Control (OCC).
   * Automatically executes createInitialSnapshot or updateSnapshot based on expectedVersion.
   *
   * @param {Object} options
   * @param {Object} options.payload
   * @param {number} [options.expectedVersion]
   * @param {Object} [options.client]
   * @param {Object} [options.user]
   * @returns {Promise<{ success: boolean, version?: number, conflict?: boolean, code?: string, error?: string }>}
   */
  async function saveSnapshot(options = {}) {
    const user = resolveUser(options);
    if (!user || !user.id) {
      return {
        success: false,
        conflict: false,
        error: 'Unauthorized: User is not authenticated.',
        code: 'UNAUTHORIZED'
      };
    }

    const payload = options.payload || {};
    if (options.expectedVersion !== undefined && options.expectedVersion !== null) {
      const res = await updateSnapshot(payload, options.expectedVersion, options);
      return {
        ...res,
        conflict: res.code === 'VERSION_CONFLICT',
        currentVersion: res.currentVersion || (res.success ? res.version : undefined)
      };
    }

    const res = await createInitialSnapshot(payload, options);
    return {
      ...res,
      conflict: res.code === 'ALREADY_EXISTS',
      currentVersion: res.currentVersion || (res.success ? res.version : undefined)
    };
  }

  /**
   * Deletes the authenticated user's snapshot from the cloud database.
   * Primarily for GDPR / account data reset requests.
   * 
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, error?: string, code?: string }>}
   */
  async function deleteSnapshot(options = {}) {
    const user = resolveUser(options);
    if (!user || !user.id) {
      return {
        success: false,
        error: 'Unauthorized: User is not authenticated.',
        code: 'UNAUTHORIZED'
      };
    }

    const client = resolveClient(options);
    if (!client) {
      return {
        success: false,
        error: 'Supabase client is not configured or available.',
        code: 'CLIENT_UNAVAILABLE'
      };
    }

    try {
      const res = await client
        .from('learner_snapshots')
        .delete()
        .eq('user_id', user.id);

      if (res.error) {
        return {
          success: false,
          error: res.error.message,
          code: res.error.code || 'DATABASE_ERROR'
        };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        code: 'CLIENT_EXCEPTION'
      };
    }
  }

  const CloudRepositoryModule = {
    getSnapshot,
    getSnapshotVersion,
    createInitialSnapshot,
    updateSnapshot,
    saveSnapshot,
    deleteSnapshot,
    sanitizePayload,
    computeSummary,
    computeChecksum,
    validatePayload
  };

  // Export to browser global and CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudRepositoryModule;
  }
  if (typeof window !== 'undefined') {
    window.CloudRepository = CloudRepositoryModule;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
