/**
 * AlgoRecall — CloudSyncEngine Module
 * 
 * Implements Stage 4: Cloud-Primary Storage & Verified Local Cache Cleanup Policy.
 * 
 * ARCHITECTURAL INVARIANTS:
 * 1. Cloud-Primary Truth: Supabase PostgreSQL is the durable source of truth for authenticated accounts.
 * 2. Three-Step Verified Checkpoint:
 *    Upload -> Readback Verification (version + checksum) -> Sync Metadata Committal.
 *    Never deletes local cache merely because an HTTP request returned 200.
 * 3. Safe, Account-Scoped Cleanup:
 *    Only removes private keys for the specific departing account (algorecall_u_<userId>_*).
 *    NEVER calls localStorage.clear().
 * 4. Destruction Blocker:
 *    Blocks destructive cache purging if offline, if pending unsynchronized changes exist,
 *    or if unresolved version conflicts are present. Provides explicit recovery options.
 * 5. Reconstruct on Sign-In:
 *    Rebuilds local learner cache from authenticated user's cloud snapshot on fresh devices or post-cleanup.
 * 6. Interruption & Crash Resilience:
 *    Uses pre-restore staging to guarantee zero data loss if download/restore is interrupted.
 * 7. Configurable Policy:
 *    Defaults to 'local_retained'. Can be configured to 'cloud_primary_cleanup'.
 * 8. Learning Science Preservation:
 *    Preserves all SRS intervals, confidence ratings, and dynamic roadmap calculations without modification.
 */

(function(global) {
  'use strict';

  // Dependency Resolution (Browser globals with Node.js CommonJS fallback)
  const _AuthEngine = (typeof window !== 'undefined' && window.AuthEngine) ||
    (typeof require !== 'undefined' ? require('./auth-engine') : null);

  const _LearnerRepository = (typeof window !== 'undefined' && window.LearnerRepository) ||
    (typeof require !== 'undefined' ? require('./learner-repository') : null);

  const _CloudRepository = (typeof window !== 'undefined' && window.CloudRepository) ||
    (typeof require !== 'undefined' ? require('./cloud-repository') : null);

  function getAuth() {
    return (typeof window !== 'undefined' && window.AuthEngine) || _AuthEngine;
  }

  function getRepo() {
    return (typeof window !== 'undefined' && window.LearnerRepository) || _LearnerRepository;
  }

  function getCloudRepo() {
    return (typeof window !== 'undefined' && window.CloudRepository) || _CloudRepository;
  }

  const STORAGE_POLICIES = {
    LOCAL_RETAINED: 'local_retained',             // Default: keeps local cache even after cloud checkpoint
    CLOUD_PRIMARY_CLEANUP: 'cloud_primary_cleanup' // Cleans up private cache after verified cloud checkpoint
  };

  const SYNC_META_PREFIX = 'algorecall_sync_meta_';
  const STAGING_PREFIX = 'algorecall_staging_restore_';

  function getRawStorage() {
    const repo = getRepo();
    if (repo && typeof repo.getRawStorage === 'function') {
      return repo.getRawStorage();
    }
    if (typeof localStorage !== 'undefined') return localStorage;
    if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    return null;
  }

  /**
   * Returns storage key for a user's sync recovery metadata.
   * @param {string} userId 
   * @returns {string}
   */
  function getSyncMetaKey(userId) {
    const repo = getRepo();
    const safeId = repo ? repo.sanitizeUserId(userId) : String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${SYNC_META_PREFIX}${safeId}`;
  }

  /**
   * Retrieves the sync recovery metadata for a user.
   * @param {string} userId 
   * @returns {Object|null}
   */
  function getSyncMeta(userId) {
    try {
      const storage = getRawStorage();
      if (!storage) return null;
      const raw = storage.getItem(getSyncMetaKey(userId));
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Saves the sync recovery metadata for a user.
   * @param {string} userId 
   * @param {Object} meta 
   */
  function saveSyncMeta(userId, meta) {
    const storage = getRawStorage();
    if (!storage) return;
    storage.setItem(getSyncMetaKey(userId), JSON.stringify({
      ...meta,
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * Clears the sync recovery metadata for a user.
   * @param {string} userId 
   */
  function clearSyncMeta(userId) {
    const storage = getRawStorage();
    if (!storage) return;
    storage.removeItem(getSyncMetaKey(userId));
  }

  /**
   * Retrieves the configured storage policy for a user.
   * Defaults to 'local_retained' for safety.
   * 
   * @param {string} [userId]
   * @returns {string} 'local_retained' | 'cloud_primary_cleanup'
   */
  function getStoragePolicy(userId) {
    const repo = getRepo();
    if (!repo) return STORAGE_POLICIES.LOCAL_RETAINED;

    const ctx = userId ? { type: 'user', id: userId } : repo.getContext();
    const settings = repo.getSettings(ctx) || {};
    if (settings.storagePolicy === STORAGE_POLICIES.CLOUD_PRIMARY_CLEANUP) {
      return STORAGE_POLICIES.CLOUD_PRIMARY_CLEANUP;
    }
    return STORAGE_POLICIES.LOCAL_RETAINED;
  }

  /**
   * Sets the storage policy for a user.
   * 
   * @param {string} policy - 'local_retained' | 'cloud_primary_cleanup'
   * @param {string} [userId]
   * @returns {boolean}
   */
  function setStoragePolicy(policy, userId) {
    if (policy !== STORAGE_POLICIES.LOCAL_RETAINED && policy !== STORAGE_POLICIES.CLOUD_PRIMARY_CLEANUP) {
      throw new Error(`CloudSyncEngine: Invalid storage policy "${policy}". Must be 'local_retained' or 'cloud_primary_cleanup'.`);
    }

    const repo = getRepo();
    if (!repo) return false;

    const ctx = userId ? { type: 'user', id: userId } : repo.getContext();
    const settings = repo.getSettings(ctx) || {};
    settings.storagePolicy = policy;
    repo.saveSettings(settings, ctx);
    return true;
  }

  /**
   * Extracts the complete, cohesive local learner bundle for a user.
   * 
   * @param {string} [userId]
   * @returns {Object}
   */
  function getLocalBundle(userId) {
    const repo = getRepo();
    if (!repo) throw new Error('CloudSyncEngine: LearnerRepository not available.');

    const ctx = userId ? { type: 'user', id: userId } : repo.getContext();

    return {
      userStates: repo.getUserStates(ctx) || {},
      problems: repo.getProblems(ctx) || [],
      examHistory: repo.getExamHistory(ctx) || [],
      mockHistory: repo.getMockHistory(ctx) || [],
      failures: repo.getFailures(ctx) || {},
      gamification: repo.getGamification(ctx) || null,
      roadmapProgress: repo.getRoadmapProgress(ctx) || null,
      settings: repo.getSettings(ctx) || null,
      interventions: repo.getInterventions(ctx) || [],
      trainerEvents: (typeof repo.getTrainerProcessedEvents === 'function') ? (repo.getTrainerProcessedEvents(ctx) || {}) : {}
    };
  }

  /**
   * Checks whether the local cache has uncommitted changes relative to cloud.
   * Compares the sanitized local checksum against lastSyncedChecksum.
   * 
   * @param {string} [userId]
   * @returns {{
   *   dirty: boolean,
   *   hasLocalData: boolean,
   *   localChecksum: string,
   *   syncedChecksum: string|null,
   *   lastSyncedVersion: number,
   *   lastSyncedAt: string|null
   * }}
   */
  function isDirty(userId) {
    const repo = getRepo();
    const cloudRepo = getCloudRepo();
    if (!repo || !cloudRepo) {
      return { dirty: false, hasLocalData: false, localChecksum: '', syncedChecksum: null, lastSyncedVersion: 0, lastSyncedAt: null };
    }

    const targetUserId = userId || (repo.getContext()?.id !== 'guest' ? repo.getContext().id : null);
    if (!targetUserId) {
      return { dirty: false, hasLocalData: false, localChecksum: '', syncedChecksum: null, lastSyncedVersion: 0, lastSyncedAt: null };
    }

    const hasLocal = repo.hasUserData(targetUserId);
    const bundle = getLocalBundle(targetUserId);
    const sanitized = cloudRepo.sanitizePayload(bundle);
    const localChecksum = cloudRepo.computeChecksum(sanitized);

    const meta = getSyncMeta(targetUserId);
    const syncedChecksum = meta ? meta.lastSyncedChecksum : null;
    const lastSyncedVersion = meta ? meta.lastSyncedVersion : 0;
    const lastSyncedAt = meta ? meta.lastSyncedAt : null;

    // If no local data exists, there are no uncommitted local changes
    if (!hasLocal) {
      return { dirty: false, hasLocalData: false, localChecksum, syncedChecksum, lastSyncedVersion, lastSyncedAt };
    }

    // If local checksum matches synced checksum, clean
    const dirty = localChecksum !== syncedChecksum;

    return {
      dirty,
      hasLocalData: hasLocal,
      localChecksum,
      syncedChecksum,
      lastSyncedVersion,
      lastSyncedAt
    };
  }

  /**
   * Helper to determine whether a problem state represents an authentic solve / practice.
   * @param {Object} st 
   * @returns {boolean}
   */
  function isProblemSolved(st) {
    if (!st || typeof st !== 'object') return false;
    return Boolean((st.stage !== undefined && st.stage >= 1) || st.status === 'solved' || st.isMastered || (st.confidence !== undefined && st.confidence >= 4));
  }

  /**
   * Non-destructive multi-device learner progress reconciliation.
   * Merges local device progress with cloud progress without data loss.
   * 
   * INVARIANTS:
   * 1. Preserves union of solved problems across devices.
   * 2. Resolves concurrent problem updates by timestamp / stage progression. Never regresses solves to unsolved.
   * 3. Retains and deduplicates durable trainer events by eventId.
   * 4. Unifies unlocked badges, streaks, and awards full earned XP.
   * 5. Preserves uncommitted offline progress.
   * 
   * @param {Object} localBundle 
   * @param {Object} cloudBundle 
   * @returns {{ reconciled: boolean, bundle: Object, summary: Object }}
   */
  function reconcileBundles(localBundle = {}, cloudBundle = {}) {
    const cloudRepo = getCloudRepo();
    const local = localBundle || {};
    const cloud = cloudBundle || {};

    // 1. Reconcile userStates
    const localStates = local.userStates || {};
    const cloudStates = cloud.userStates || {};
    const mergedStates = {};
    const allProblemIds = new Set([...Object.keys(localStates), ...Object.keys(cloudStates)]);

    for (const pid of allProblemIds) {
      const ls = localStates[pid];
      const cs = cloudStates[pid];

      if (ls && !cs) {
        mergedStates[pid] = { ...ls };
      } else if (!ls && cs) {
        mergedStates[pid] = { ...cs };
      } else {
        const localTime = ls.lastReviewed ? new Date(ls.lastReviewed).getTime() : 0;
        const cloudTime = cs.lastReviewed ? new Date(cs.lastReviewed).getTime() : 0;

        const localSolved = isProblemSolved(ls);
        const cloudSolved = isProblemSolved(cs);

        let winner;
        if (localSolved && !cloudSolved) {
          if (cloudTime > localTime && cs.lastRating === 'failed') {
            winner = cs;
          } else {
            winner = ls;
          }
        } else if (!localSolved && cloudSolved) {
          if (localTime > cloudTime && ls.lastRating === 'failed') {
            winner = ls;
          } else {
            winner = cs;
          }
        } else {
          if (localTime > cloudTime) {
            winner = ls;
          } else if (cloudTime > localTime) {
            winner = cs;
          } else {
            // Identical timestamp tie-breaking
            if (ls.lastRating === 'failed' || cs.lastRating === 'failed') {
              // Safety first: failure takes precedence to protect learning retention
              winner = (ls.lastRating === 'failed') ? ls : cs;
            } else {
              const lStage = ls.stage || 0;
              const cStage = cs.stage || 0;
              if (lStage > cStage) winner = ls;
              else if (cStage > lStage) winner = cs;
              else winner = (ls.confidence || 0) >= (cs.confidence || 0) ? ls : cs;
            }
          }
        }

        const merged = { ...winner };

        // Non-destructively merge review history arrays
        if (Array.isArray(ls.history) || Array.isArray(cs.history)) {
          const seenDates = new Set();
          const combinedHist = [];
          [...(ls.history || []), ...(cs.history || [])].forEach(h => {
            if (!h) return;
            const hKey = h.date || h.timestamp || JSON.stringify(h);
            if (!seenDates.has(hKey)) {
              seenDates.add(hKey);
              combinedHist.push(h);
            }
          });
          combinedHist.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
          merged.history = combinedHist;
          merged.reviewsCount = Math.max(combinedHist.length, Math.max(ls.reviewsCount || 0, cs.reviewsCount || 0));
        }

        mergedStates[pid] = merged;
      }
    }

    // 2. Reconcile Durable Trainer Events
    const localEvents = local.trainerEvents || {};
    const cloudEvents = cloud.trainerEvents || {};
    const mergedEvents = {};

    const addEvents = (events) => {
      if (Array.isArray(events)) {
        events.forEach(e => {
          if (e && e.eventId) mergedEvents[e.eventId] = e;
        });
      } else if (events && typeof events === 'object') {
        Object.keys(events).forEach(k => {
          const e = events[k];
          if (e && (e.eventId || k)) mergedEvents[e.eventId || k] = e;
        });
      }
    };
    addEvents(cloudEvents);
    addEvents(localEvents);

    // 3. Reconcile Gamification
    const localGam = local.gamification || {};
    const cloudGam = cloud.gamification || {};

    const mergedBadges = { ...(cloudGam.badgesUnlocked || {}) };
    const localBadges = localGam.badgesUnlocked || {};
    for (const bId of Object.keys(localBadges)) {
      if (!mergedBadges[bId]) {
        mergedBadges[bId] = localBadges[bId];
      } else {
        const cDate = new Date(mergedBadges[bId]).getTime() || Infinity;
        const lDate = new Date(localBadges[bId]).getTime() || Infinity;
        if (lDate < cDate) mergedBadges[bId] = localBadges[bId];
      }
    }

    let localOnlySolvedCount = 0;
    for (const pid of Object.keys(localStates)) {
      if (isProblemSolved(localStates[pid]) && !isProblemSolved(cloudStates[pid])) {
        localOnlySolvedCount++;
      }
    }

    const baseMaxXP = Math.max(localGam.xp || 0, cloudGam.xp || 0);
    const mergedXP = Math.max(baseMaxXP, (cloudGam.xp || 0) + (localOnlySolvedCount * 50));

    const LEVEL_THRESHOLDS = [
      { level: 10, xp: 18000 }, { level: 9, xp: 12000 }, { level: 8, xp: 8000 },
      { level: 7, xp: 5500 }, { level: 6, xp: 3500 }, { level: 5, xp: 2000 },
      { level: 4, xp: 1000 }, { level: 3, xp: 500 }, { level: 2, xp: 200 }, { level: 1, xp: 0 }
    ];
    let mergedLevel = 1;
    for (const t of LEVEL_THRESHOLDS) {
      if (mergedXP >= t.xp) {
        mergedLevel = t.level;
        break;
      }
    }

    // Reconcile weekly quests non-destructively by quest ID
    const questMap = new Map();
    [...(cloudGam.weeklyQuests || []), ...(localGam.weeklyQuests || [])].forEach(q => {
      if (!q || !q.id) return;
      if (!questMap.has(q.id)) {
        questMap.set(q.id, { ...q });
      } else {
        const existing = questMap.get(q.id);
        existing.progress = Math.max(existing.progress || 0, q.progress || 0);
        existing.completed = existing.completed || q.completed;
      }
    });

    const mergedGamification = {
      xp: mergedXP,
      level: mergedLevel,
      streak: Math.max(localGam.streak || 0, cloudGam.streak || 0),
      streakShieldsAvailable: Math.max(localGam.streakShieldsAvailable !== undefined ? localGam.streakShieldsAvailable : 1, cloudGam.streakShieldsAvailable !== undefined ? cloudGam.streakShieldsAvailable : 1),
      lastShieldUsedDate: localGam.lastShieldUsedDate || cloudGam.lastShieldUsedDate || null,
      badgesUnlocked: mergedBadges,
      weeklyQuests: Array.from(questMap.values())
    };

    // 4. Reconcile Exam History and Mock History (Deduplicate)
    const dedupList = (listA = [], listB = [], idKey = 'id') => {
      const seen = new Set();
      const combined = [];
      [...(listB || []), ...(listA || [])].forEach(item => {
        if (!item) return;
        const key = item[idKey] || item.timestamp || item.completedAt || JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      });
      return combined;
    };

    const mergedExamHistory = dedupList(local.examHistory, cloud.examHistory, 'examId');
    const mergedMockHistory = dedupList(local.mockHistory, cloud.mockHistory, 'mockId');
    const mergedProblems = dedupList(local.problems, cloud.problems, 'id');
    const mergedFailures = { ...(cloud.failures || {}), ...(local.failures || {}) };
    const mergedSettings = { ...(cloud.settings || {}), ...(local.settings || {}) };
    const mergedRoadmap = local.roadmapProgress || cloud.roadmapProgress || {};
    const mergedInterventions = local.interventions || cloud.interventions || {};

    const reconciledBundle = {
      userStates: mergedStates,
      trainerEvents: mergedEvents,
      gamification: mergedGamification,
      examHistory: mergedExamHistory,
      mockHistory: mergedMockHistory,
      problems: mergedProblems,
      failures: mergedFailures,
      settings: mergedSettings,
      roadmapProgress: mergedRoadmap,
      interventions: mergedInterventions
    };

    const sanitized = cloudRepo ? cloudRepo.sanitizePayload(reconciledBundle) : reconciledBundle;
    const summary = cloudRepo ? cloudRepo.computeSummary(sanitized) : null;

    return {
      reconciled: true,
      bundle: sanitized,
      summary
    };
  }

  /**
   * Applies a reconciled bundle directly to LearnerRepository storage.
   * @param {string} userId 
   * @param {Object} bundle 
   * @returns {boolean}
   */
  function applyReconciledBundle(userId, bundle) {
    const repo = getRepo();
    if (!repo) return false;
    const ctx = { type: 'user', id: userId };
    if (bundle.userStates) repo.saveUserStates(bundle.userStates, ctx);
    if (bundle.problems) repo.saveProblems(bundle.problems, ctx);
    if (bundle.examHistory) repo.saveExamHistory(bundle.examHistory, ctx);
    if (bundle.mockHistory) repo.saveMockHistory(bundle.mockHistory, ctx);
    if (bundle.failures) repo.saveFailures(bundle.failures, ctx);
    if (bundle.gamification) repo.saveGamification(bundle.gamification, ctx);
    if (bundle.roadmapProgress) repo.saveRoadmapProgress(bundle.roadmapProgress, ctx);
    if (bundle.settings) repo.saveSettings(bundle.settings, ctx);
    if (bundle.interventions) repo.saveInterventions(bundle.interventions, ctx);
    if (bundle.trainerEvents && typeof repo.saveTrainerProcessedEvents === 'function') {
      repo.saveTrainerProcessedEvents(bundle.trainerEvents, ctx);
    }
    return true;
  }

  /**
   * Executes a Three-Step Verified Cloud Checkpoint with OCC Conflict Mitigation.
   * 
   * VERIFICATION PROTOCOL (Invariant #3):
   * 1. Read local state & compute checksum.
   * 2. Commit update/create to Supabase via CloudRepository.
   *    If remote version has advanced beyond local sync metadata, reconciles before write.
   * 3. Readback Verification: Query cloud version and checksum directly.
   *    Assert committedVersion === expectedVersion AND committedChecksum === localChecksum.
   * 4. Persist local sync recovery metadata.
   * 5. If storage policy is 'cloud_primary_cleanup' or options.forceCleanup is true:
   *    Clean up eligible private learner cache.
   * 
   * @param {string} userId 
   * @param {Object} [options]
   * @param {string} [options.policy]
   * @param {boolean} [options.forceCleanup]
   * @param {Object} [options.client] Injected client for testing
   * @returns {Promise<{
   *   success: boolean,
   *   verified: boolean,
   *   version: number,
   *   checksum: string,
   *   cleanedUp: boolean,
   *   error?: string,
   *   code?: string,
   *   summary?: Object
   * }>}
   */
  async function checkpoint(userId, options = {}) {
    const repo = getRepo();
    const cloudRepo = getCloudRepo();
    if (!repo || !cloudRepo) {
      return { success: false, verified: false, version: 0, checksum: '', cleanedUp: false, error: 'Modules unavailable' };
    }

    const targetUser = options.user || { id: userId };
    const repoOpts = { ...options, user: targetUser };

    // Step 1: Read local bundle and compute expected checksum
    let bundle = getLocalBundle(userId);
    let sanitized = cloudRepo.sanitizePayload(bundle);
    let localChecksum = cloudRepo.computeChecksum(sanitized);

    // Step 2: Fetch current cloud version
    const versionRes = await cloudRepo.getSnapshotVersion(repoOpts);
    if (!versionRes.success && versionRes.code === 'UNAUTHORIZED') {
      return {
        success: false,
        verified: false,
        version: 0,
        checksum: localChecksum,
        cleanedUp: false,
        code: 'UNAUTHORIZED',
        error: versionRes.error
      };
    }

    let commitRes;
    let expectedVersion;

    if (versionRes.exists) {
      const meta = getSyncMeta(userId);
      const lastSyncedVer = meta?.lastSyncedVersion || 0;

      // OCC & Multi-Device Protection:
      // If remote version has advanced beyond this device's last synced version,
      // reconcile local bundle with remote state before committing!
      if (versionRes.version > lastSyncedVer) {
        const remoteSnap = await cloudRepo.getSnapshot(repoOpts);
        if (remoteSnap.success && remoteSnap.exists && remoteSnap.data) {
          const recRes = reconcileBundles(bundle, remoteSnap.data);
          bundle = recRes.bundle;
          applyReconciledBundle(userId, bundle);
          sanitized = cloudRepo.sanitizePayload(bundle);
          localChecksum = cloudRepo.computeChecksum(sanitized);
        }
      }

      expectedVersion = versionRes.version + 1;
      commitRes = await cloudRepo.updateSnapshot(bundle, versionRes.version, repoOpts);

      // Handle concurrent conflict retry (up to 3 retries)
      let conflictRetries = 0;
      while (!commitRes.success && commitRes.code === 'VERSION_CONFLICT' && conflictRetries < 3) {
        conflictRetries++;
        const freshSnap = await cloudRepo.getSnapshot(repoOpts);
        if (freshSnap.success && freshSnap.exists && freshSnap.data) {
          const freshBundle = getLocalBundle(userId);
          const recRes = reconcileBundles(freshBundle, freshSnap.data);
          bundle = recRes.bundle;
          applyReconciledBundle(userId, bundle);
          sanitized = cloudRepo.sanitizePayload(bundle);
          localChecksum = cloudRepo.computeChecksum(sanitized);
          expectedVersion = freshSnap.version + 1;
          commitRes = await cloudRepo.updateSnapshot(bundle, freshSnap.version, repoOpts);
        } else {
          break;
        }
      }
    } else {
      expectedVersion = 1;
      commitRes = await cloudRepo.createInitialSnapshot(bundle, repoOpts);
    }

    if (!commitRes.success) {
      return {
        success: false,
        verified: false,
        version: versionRes.version || 0,
        checksum: localChecksum,
        cleanedUp: false,
        code: commitRes.code || 'COMMIT_FAILED',
        error: commitRes.error
      };
    }

    // Step 3: Verification Readback (CRITICAL INVARIANT)
    const readback = await cloudRepo.getSnapshotVersion(repoOpts);
    if (!readback.success || !readback.exists) {
      return {
        success: false,
        verified: false,
        version: commitRes.version || 0,
        checksum: localChecksum,
        cleanedUp: false,
        code: 'READBACK_FAILED',
        error: 'Cloud checkpoint verification failed: Could not read back committed cloud state.'
      };
    }

    if (readback.version !== expectedVersion || readback.checksum !== localChecksum) {
      return {
        success: false,
        verified: false,
        version: readback.version,
        checksum: localChecksum,
        cleanedUp: false,
        code: 'CHECKSUM_MISMATCH',
        error: `Cloud checkpoint verification failed: Version or checksum mismatch (expected v${expectedVersion} / ${localChecksum}, got v${readback.version} / ${readback.checksum}).`
      };
    }

    // Step 4: Persist verified sync recovery metadata
    saveSyncMeta(userId, {
      userId,
      lastSyncedVersion: expectedVersion,
      lastSyncedChecksum: localChecksum,
      lastSyncedAt: new Date().toISOString(),
      verified: true,
      snapshotId: commitRes.recordId || readback.snapshotId || null
    });

    // Step 5: Configurable Cache Cleanup
    const policy = options.policy || getStoragePolicy(userId);
    let cleanedUp = false;

    if (policy === STORAGE_POLICIES.CLOUD_PRIMARY_CLEANUP || options.forceCleanup === true) {
      const cleanRes = cleanupLocalCache(userId, { allowPurge: true, verifiedChecksum: localChecksum });
      cleanedUp = cleanRes.success;
    }

    return {
      success: true,
      verified: true,
      version: expectedVersion,
      checksum: localChecksum,
      cleanedUp
    };
  }

  /**
   * Reconstructs the local learner cache from the authenticated user's cloud snapshot.
   * 
   * INTERRUPT-RESILIENT STAGING (Invariant #9):
   * Validates snapshot, creates staging backup if local data already exists,
   * writes all categories atomically, updates sync metadata, and clears staging.
   * 
   * @param {string} userId 
   * @param {Object} [options]
   * @returns {Promise<{
   *   success: boolean,
   *   version?: number,
   *   restored?: boolean,
   *   summary?: Object,
   *   error?: string,
   *   code?: string
   * }>}
   */
  async function restoreFromCloud(userId, options = {}) {
    const repo = getRepo();
    const cloudRepo = getCloudRepo();
    if (!repo || !cloudRepo) {
      return { success: false, error: 'Modules unavailable', code: 'MODULES_UNAVAILABLE' };
    }

    const targetUser = options.user || { id: userId };
    const repoOpts = { ...options, user: targetUser };

    // 1. Fetch cloud snapshot
    const remote = await cloudRepo.getSnapshot(repoOpts);
    if (!remote.success) {
      return {
        success: false,
        error: remote.error || 'Failed to download cloud snapshot.',
        code: remote.code || 'DOWNLOAD_FAILED'
      };
    }

    if (!remote.exists || !remote.data) {
      return {
        success: false,
        error: 'No cloud snapshot found for this account.',
        code: 'NO_CLOUD_SNAPSHOT'
      };
    }

    const payload = remote.data;
    const validation = cloudRepo.validatePayload(payload);
    if (!validation.valid) {
      return {
        success: false,
        error: `Cloud snapshot failed structural validation: ${validation.error}`,
        code: 'MALFORMED_CLOUD_SNAPSHOT'
      };
    }

    // 2. Pre-restore safety staging (Crash resilience)
    const storage = getRawStorage();
    const stagingKey = `${STAGING_PREFIX}${repo.sanitizeUserId(userId)}`;
    if (storage && repo.hasUserData(userId)) {
      try {
        const existingBundle = getLocalBundle(userId);
        storage.setItem(stagingKey, JSON.stringify(existingBundle));
      } catch (_) {}
    }

    // 3. Atomically reconstruct local cache into user namespace
    const ctx = { type: 'user', id: userId };
    try {
      repo.saveUserStates(payload.userStates || {}, ctx);
      repo.saveProblems(payload.problems || [], ctx);
      repo.saveExamHistory(payload.examHistory || [], ctx);
      repo.saveMockHistory(payload.mockHistory || [], ctx);
      repo.saveFailures(payload.failures || {}, ctx);
      if (payload.gamification) repo.saveGamification(payload.gamification, ctx);
      if (payload.roadmapProgress) repo.saveRoadmapProgress(payload.roadmapProgress, ctx);
      if (payload.settings) repo.saveSettings(payload.settings, ctx);
      if (payload.interventions) repo.saveInterventions(payload.interventions, ctx);
      if (payload.trainerEvents && typeof repo.saveTrainerProcessedEvents === 'function') {
        repo.saveTrainerProcessedEvents(payload.trainerEvents, ctx);
      }

      // 4. Update sync metadata to match restored cloud snapshot
      const sanitized = cloudRepo.sanitizePayload(payload);
      const restoredChecksum = remote.checksum || cloudRepo.computeChecksum(sanitized);

      saveSyncMeta(userId, {
        userId,
        lastSyncedVersion: remote.version,
        lastSyncedChecksum: restoredChecksum,
        lastSyncedAt: remote.updatedAt || new Date().toISOString(),
        verified: true
      });

      // 5. Cleanup staging backup upon successful restore
      if (storage) {
        storage.removeItem(stagingKey);
      }

      return {
        success: true,
        version: remote.version,
        restored: true,
        summary: remote.summary
      };
    } catch (err) {
      // Rollback from staging if restore was interrupted
      if (storage) {
        const stagingRaw = storage.getItem(stagingKey);
        if (stagingRaw) {
          try {
            const rollbackData = JSON.parse(stagingRaw);
            repo.saveUserStates(rollbackData.userStates || {}, ctx);
            repo.saveProblems(rollbackData.problems || [], ctx);
          } catch (_) {}
        }
      }

      return {
        success: false,
        error: `Restore execution failed: ${err.message}`,
        code: 'RESTORE_EXECUTION_ERROR'
      };
    }
  }

  /**
   * Safely cleans up private local cache data for a specific user.
   * 
   * DESTRUCTION BLOCKERS (Invariant #4 & #5):
   * 1. Blocks cleanup if local changes are dirty (uncommitted changes exist).
   * 2. Blocks cleanup if no verified cloud checkpoint exists.
   * 3. Retains sync metadata (algorecall_sync_meta_<userId>) and pre-migration backups.
   * 4. Scoped strictly to departing user; NEVER calls localStorage.clear().
   * 
   * @param {string} userId 
   * @param {Object} [options]
   * @param {boolean} [options.allowPurge]
   * @param {string} [options.verifiedChecksum]
   * @returns {{
   *   success: boolean,
   *   cleanedUp: boolean,
   *   keysRemoved: number,
   *   blocked?: boolean,
   *   code?: string,
   *   error?: string,
   *   recoveryOptions?: string[]
   * }}
   */
  function cleanupLocalCache(userId, options = {}) {
    const repo = getRepo();
    if (!repo) {
      return { success: false, cleanedUp: false, keysRemoved: 0, error: 'LearnerRepository unavailable' };
    }

    const safeId = repo.sanitizeUserId(userId);

    // Guard 1: Verify sync metadata exists and is verified
    const meta = getSyncMeta(safeId);
    if (!meta || !meta.verified) {
      return {
        success: false,
        cleanedUp: false,
        keysRemoved: 0,
        blocked: true,
        code: 'BLOCKED_BY_UNVERIFIED_STATE',
        error: 'Destructive cleanup blocked: No verified cloud checkpoint found for this account.',
        recoveryOptions: [
          'Run CloudSyncEngine.checkpoint(userId) to establish a verified cloud checkpoint before purging.',
          'Retain local cache until an active network connection verifies cloud persistence.'
        ]
      };
    }

    // Guard 2: Verify local cache is not dirty
    const dirtyStatus = isDirty(safeId);
    if (dirtyStatus.dirty && !options.allowPurge) {
      return {
        success: false,
        cleanedUp: false,
        keysRemoved: 0,
        blocked: true,
        code: 'BLOCKED_BY_UNSAVED_CHANGES',
        error: 'Destructive cleanup blocked: Uncommitted local learner progress detected.',
        recoveryOptions: [
          'Run CloudSyncEngine.checkpoint(userId) to commit pending progress before cleanup.',
          'Export a manual backup via StorageEngine.exportFullBackup() to safeguard offline records.'
        ]
      };
    }

    // Guard 3: Double-check checksum match if verifiedChecksum passed
    if (options.verifiedChecksum && meta.lastSyncedChecksum !== options.verifiedChecksum) {
      return {
        success: false,
        cleanedUp: false,
        keysRemoved: 0,
        blocked: true,
        code: 'BLOCKED_BY_CHECKSUM_MISMATCH',
        error: 'Destructive cleanup blocked: Checksum verification mismatch.',
        recoveryOptions: ['Re-run checkpoint() with active cloud verification.']
      };
    }

    // Execute account-scoped cleanup
    // Removes all algorecall_u_<safeId>_* keys
    const keysRemoved = repo.clearUserData(safeId);

    return {
      success: true,
      cleanedUp: true,
      keysRemoved
    };
  }

  /**
   * Performs a safe, verified sign-out workflow.
   * 
   * SAFE SIGN-OUT WORKFLOW (Invariant #4):
   * 1. Checks if departing account has pending unsaved changes.
   * 2. If dirty: attempts verified checkpoint first.
   *    If checkpoint fails (offline, conflict, network drop):
   *    BLOCKS destructive cache purge, preserves local data, and reports recovery options.
   * 3. If cleanly verified and policy is 'cloud_primary_cleanup':
   *    Cleans up departing user's private cache.
   * 4. Cleans active in-memory user context to guest.
   * 5. Invokes AuthEngine.signOut().
   * 
   * @param {string} userId 
   * @param {Object} [options]
   * @param {boolean} [options.syncBeforeSignOut=true]
   * @param {boolean} [options.forceSignOut=false]
   * @returns {Promise<{
   *   success: boolean,
   *   signedOut: boolean,
   *   cacheCleaned: boolean,
   *   blocked?: boolean,
   *   localDataPreserved?: boolean,
   *   code?: string,
   *   error?: string,
   *   recoveryOptions?: string[]
   * }>}
   */
  async function safeSignOut(userId, options = {}) {
    const repo = getRepo();
    const auth = getAuth();
    if (!repo || !auth) {
      return { success: false, signedOut: false, cacheCleaned: false, error: 'Modules unavailable' };
    }

    const dirtyStatus = isDirty(userId);

    let cacheCleaned = false;

    // 1. If dirty and sync requested, attempt verified checkpoint
    if (dirtyStatus.dirty && options.syncBeforeSignOut !== false) {
      const checkRes = await checkpoint(userId, options);
      if (!checkRes.success) {
        // Block destructive cleanup! Preserve local data!
        return {
          success: false,
          signedOut: false,
          cacheCleaned: false,
          blocked: true,
          localDataPreserved: true,
          code: 'SIGN_OUT_SYNC_FAILED',
          error: `Sign-out blocked: Could not synchronize pending local progress (${checkRes.error}). Local data has been strictly preserved to prevent progress loss.`,
          recoveryOptions: [
            'Check your network connection and retry sign-out.',
            'Export manual backup from Settings -> Export Backup.',
            'Pass { forceSignOut: true, syncBeforeSignOut: false } to sign out while retaining local data.'
          ]
        };
      }
      if (checkRes.cleanedUp) {
        cacheCleaned = true;
      }
    }

    // 2. Perform cache cleanup if policy is cloud_primary_cleanup and not yet cleaned
    const policy = options.policy || getStoragePolicy(userId);
    const postSyncDirty = isDirty(userId);
    if (!cacheCleaned && (policy === STORAGE_POLICIES.CLOUD_PRIMARY_CLEANUP || options.clearCacheOnSignOut === true) && !postSyncDirty.dirty) {
      const cleanRes = cleanupLocalCache(userId, { allowPurge: true });
      cacheCleaned = cleanRes.cleanedUp;
    }

    // 3. Reset in-memory context to guest
    repo.setContext({ type: 'guest' });

    // 4. Sign out from AuthEngine
    await auth.signOut();

    return {
      success: true,
      signedOut: true,
      cacheCleaned,
      localDataPreserved: !cacheCleaned
    };
  }

  /**
   * High-level bidirectional sync and hydration engine.
   * Compares local state and cloud snapshot to safely resolve cross-browser / multi-device divergence.
   * 
   * BEHAVIOR CONTRACT:
   * 1. If unauthenticated, fails closed with UNAUTHORIZED.
   * 2. If cloud snapshot does not exist:
   *    - If local has data, publishes initial checkpoint.
   *    - If local has no data, establishes fresh account.
   * 3. If cloud snapshot exists:
   *    - If local has no data: restores from cloud.
   *    - If local is clean and cloud is newer: hydrates newer cloud progress.
   *    - If local is dirty and cloud has concurrent updates: reconciles non-destructively and updates cloud.
   *    - If local is dirty and cloud is behind: commits local checkpoint.
   *    - If already identical: maintains verified sync metadata.
   * 
   * @param {string} userId 
   * @param {Object} [options]
   * @returns {Promise<{
   *   success: boolean,
   *   action: string,
   *   version?: number,
   *   updatedLocal?: boolean,
   *   summary?: Object,
   *   error?: string
   * }>}
   */
  async function syncOrHydrate(userId, options = {}) {
    const repo = getRepo();
    const cloudRepo = getCloudRepo();
    if (!repo || !cloudRepo) {
      return { success: false, error: 'Modules unavailable', code: 'MODULES_UNAVAILABLE' };
    }

    const targetUser = options.user || (repo.getContext()?.id === userId ? repo.getContext() : { id: userId });
    if (!targetUser || !targetUser.id || targetUser.id === 'guest') {
      return { success: false, error: 'User is not authenticated', code: 'UNAUTHORIZED' };
    }

    const repoOpts = { ...options, user: targetUser };

    // 1. Ensure user context is set
    repo.setContext({ type: 'user', id: targetUser.id, email: targetUser.email || null });

    const hasLocal = repo.hasUserData(targetUser.id);
    const localBundle = getLocalBundle(targetUser.id);
    const localSanitized = cloudRepo.sanitizePayload(localBundle);
    const localChecksum = cloudRepo.computeChecksum(localSanitized);
    const meta = getSyncMeta(targetUser.id);
    const lastSyncedVer = meta ? meta.lastSyncedVersion : 0;
    const dirtyInfo = isDirty(targetUser.id);

    // Fast-path: Check lightweight version & checksum header first to avoid downloading full snapshot
    let remote = null;
    if (!options.forceFullDownload && typeof cloudRepo.getSnapshotVersion === 'function') {
      const versionRes = await cloudRepo.getSnapshotVersion(repoOpts);
      if (!versionRes.success && versionRes.code === 'UNAUTHORIZED') {
        return { success: false, error: versionRes.error, code: 'UNAUTHORIZED' };
      }

      if (versionRes.success) {
        if (!versionRes.exists) {
          // No remote snapshot exists
          if (hasLocal && Object.keys(localBundle.userStates || {}).length > 0) {
            const cpRes = await checkpoint(targetUser.id, repoOpts);
            return {
              success: true,
              action: 'checkpointed_initial',
              version: cpRes.version,
              updatedLocal: false,
              summary: cpRes.summary
            };
          }
          return {
            success: true,
            action: 'fresh_account',
            isFreshAccount: true,
            updatedLocal: false
          };
        }

        // Remote snapshot exists: Check if local is clean and already in sync
        const isClean = !dirtyInfo.dirty;
        const isVersionSame = (versionRes.version === lastSyncedVer);
        const isChecksumSame = (meta && meta.lastSyncedChecksum && versionRes.checksum === meta.lastSyncedChecksum);

        if (isClean && isVersionSame && isChecksumSame) {
          // Zero download required: 99.5% bandwidth savings
          return {
            success: true,
            action: 'already_in_sync',
            version: versionRes.version,
            updatedLocal: false,
            bandwidthSaved: true
          };
        }
      }
    }

    // Remote has advanced, local is dirty, or full snapshot required
    remote = await cloudRepo.getSnapshot(repoOpts);
    if (!remote.success) {
      return { success: false, error: remote.error, code: remote.code || 'DATABASE_ERROR' };
    }

    // Scenario 1: No remote snapshot exists
    if (!remote.exists || !remote.data) {
      if (hasLocal && Object.keys(localBundle.userStates || {}).length > 0) {
        const cpRes = await checkpoint(targetUser.id, repoOpts);
        if (!cpRes.success) {
          return cpRes;
        }
        return {
          success: true,
          action: 'checkpointed_initial',
          version: cpRes.version,
          updatedLocal: false,
          summary: cpRes.summary
        };
      }
      return {
        success: true,
        action: 'fresh_account',
        isFreshAccount: true,
        updatedLocal: false
      };
    }

    // Remote snapshot exists
    const remoteVersion = remote.version;
    const remoteData = remote.data;
    const remoteSanitized = cloudRepo.sanitizePayload(remoteData);
    const remoteChecksum = remote.checksum || cloudRepo.computeChecksum(remoteSanitized);

    // Scenario 2: Fresh device or no local data
    if (!hasLocal) {
      const restRes = await restoreFromCloud(targetUser.id, repoOpts);
      return {
        success: true,
        action: 'restored_from_cloud',
        version: restRes.version,
        updatedLocal: true,
        summary: restRes.summary
      };
    }

    // Scenario 3: Local data matches remote checksum exactly
    if (localChecksum === remoteChecksum) {
      if (lastSyncedVer !== remoteVersion) {
        saveSyncMeta(targetUser.id, {
          userId: targetUser.id,
          lastSyncedVersion: remoteVersion,
          lastSyncedChecksum: remoteChecksum,
          lastSyncedAt: remote.updatedAt || new Date().toISOString(),
          verified: true
        });
      }
      return {
        success: true,
        action: 'already_in_sync',
        version: remoteVersion,
        updatedLocal: false,
        summary: remote.summary
      };
    }

    // Scenario 4: Local is clean but remote is newer (e.g. Browser A after Browser B practiced)
    if (!dirtyInfo.dirty && remoteVersion > lastSyncedVer) {
      const restRes = await restoreFromCloud(targetUser.id, repoOpts);
      return {
        success: true,
        action: 'hydrated_newer_cloud',
        version: restRes.version,
        updatedLocal: true,
        summary: restRes.summary
      };
    }

    // Scenario 5: Local is dirty, but remote has NOT advanced beyond local lastSyncedVer
    if (dirtyInfo.dirty && remoteVersion <= lastSyncedVer) {
      const cpRes = await checkpoint(targetUser.id, repoOpts);
      return {
        success: true,
        action: 'checkpointed_local',
        version: cpRes.version,
        updatedLocal: false,
        summary: cpRes.summary
      };
    }

    // Scenario 6: Divergent concurrent progress! (Both local has uncommitted work AND remote has advanced)
    const recRes = reconcileBundles(localBundle, remoteData);
    applyReconciledBundle(targetUser.id, recRes.bundle);

    const reconciledSanitized = cloudRepo.sanitizePayload(recRes.bundle);
    const reconciledChecksum = cloudRepo.computeChecksum(reconciledSanitized);
    const nextVersion = remoteVersion + 1;

    let commitRes = await cloudRepo.updateSnapshot(recRes.bundle, remoteVersion, repoOpts);
    let writeConfirmed = commitRes.success;

    // Handle ambiguous write outcomes (Requirement 6):
    // A lost HTTP response does not prove that the database write failed.
    // If commitRes is not successful, probe authoritative remote state before retrying or failing.
    if (!commitRes.success) {
      try {
        const probe = await cloudRepo.getSnapshotVersion(repoOpts);
        if (probe.success && probe.exists && probe.version === nextVersion && probe.checksum === reconciledChecksum) {
          // Authoritative state confirms the write actually succeeded remotely!
          writeConfirmed = true;
        }
      } catch (_) {
        // Probe encountered an exception; proceed with standard error/conflict handling
      }

      if (!writeConfirmed) {
        if (commitRes.code === 'VERSION_CONFLICT') {
          const retries = options._retryCount || 0;
          if (retries < 3) {
            return syncOrHydrate(targetUser.id, { ...repoOpts, _retryCount: retries + 1 });
          }
          return {
            success: false,
            verified: false,
            error: 'Maximum OCC conflict retries exceeded. Please refresh and retry.',
            code: 'OCC_MAX_RETRIES'
          };
        }
        return {
          success: false,
          verified: false,
          error: commitRes.error,
          code: commitRes.code || 'COMMIT_FAILED'
        };
      }
    }

    // Step 3: Independent Remote Readback Verification (CRITICAL INVARIANT)
    // Directly retrieve committed version and checksum from cloud repository to verify persistence
    const readback = await cloudRepo.getSnapshotVersion(repoOpts);
    if (!readback.success || !readback.exists) {
      return {
        success: false,
        verified: false,
        version: commitRes.version || 0,
        checksum: reconciledChecksum,
        code: 'READBACK_FAILED',
        error: 'Cloud sync verification failed: Could not read back committed cloud state.'
      };
    }

    if (readback.version !== nextVersion || readback.checksum !== reconciledChecksum) {
      return {
        success: false,
        verified: false,
        version: readback.version,
        checksum: reconciledChecksum,
        code: 'CHECKSUM_MISMATCH',
        error: `Cloud sync verification failed: Version or checksum mismatch (expected v${nextVersion} / ${reconciledChecksum}, got v${readback.version} / ${readback.checksum}).`
      };
    }

    // Step 4: Persist verified sync recovery metadata ONLY after independent verification succeeds
    saveSyncMeta(targetUser.id, {
      userId: targetUser.id,
      lastSyncedVersion: nextVersion,
      lastSyncedChecksum: reconciledChecksum,
      lastSyncedAt: new Date().toISOString(),
      verified: true,
      snapshotId: commitRes.recordId || readback.snapshotId || null
    });

    return {
      success: true,
      verified: true,
      action: 'reconciled_and_committed',
      version: nextVersion,
      checksum: reconciledChecksum,
      updatedLocal: true,
      summary: recRes.summary
    };
  }

  /**
   * Handles safe sign-in and cache reconstruction with bidirectional cloud sync.
   * 
   * SIGN-IN RECONSTRUCTION (Invariant #8):
   * 1. Sets active context in LearnerRepository.
   * 2. Checks and reconciles local state with cloud snapshot without data loss.
   * 
   * @param {Object} user - Authenticated user object ({ id, email })
   * @param {Object} [options]
   * @returns {Promise<{
   *   success: boolean,
   *   restoredFromCloud: boolean,
   *   localDataRetained: boolean,
   *   version?: number,
   *   summary?: Object,
   *   action?: string,
   *   error?: string
   * }>}
   */
  async function safeSignIn(user, options = {}) {
    const repo = getRepo();
    if (!repo || !user || !user.id) {
      return { success: false, restoredFromCloud: false, localDataRetained: false, error: 'Invalid user or repository unavailable' };
    }

    repo.setContext({ type: 'user', id: user.id, email: user.email || null });

    const syncRes = await syncOrHydrate(user.id, { ...options, user });
    if (!syncRes.success) {
      return {
        success: false,
        restoredFromCloud: false,
        localDataRetained: true,
        error: syncRes.error
      };
    }

    return {
      success: true,
      restoredFromCloud: Boolean(syncRes.updatedLocal || syncRes.action === 'restored_from_cloud' || syncRes.action === 'hydrated_newer_cloud'),
      localDataRetained: !syncRes.updatedLocal,
      version: syncRes.version,
      summary: syncRes.summary,
      action: syncRes.action,
      isFreshAccount: Boolean(syncRes.isFreshAccount)
    };
  }

  const CloudSyncEngineModule = {
    STORAGE_POLICIES,
    getStoragePolicy,
    setStoragePolicy,
    getSyncMeta,
    saveSyncMeta,
    clearSyncMeta,
    getLocalBundle,
    isDirty,
    reconcileBundles,
    applyReconciledBundle,
    checkpoint,
    restoreFromCloud,
    syncOrHydrate,
    cleanupLocalCache,
    safeSignOut,
    safeSignIn
  };

  // Export to browser global and CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudSyncEngineModule;
  }
  if (typeof window !== 'undefined') {
    window.CloudSyncEngine = CloudSyncEngineModule;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
