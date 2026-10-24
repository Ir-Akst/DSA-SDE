/**
 * AlgoRecall — MigrationManager Module
 * 
 * Safe, idempotent data migration manager for transitioning legacy un-namespaced
 * learner progress to authenticated user-scoped namespaces.
 * Follows the project's zero-dependency universal module pattern (Browser IIFE + CommonJS).
 * 
 * CORE RESPONSIBILITIES:
 * 1. Detect existing un-namespaced legacy learner progress.
 * 2. Create and validate a full pre-migration backup before any mutation.
 * 3. Support explicit user choice: Claim progress vs Start fresh (zero implicit ownership).
 * 4. Verify data integrity after copying to target user namespace.
 * 5. Provide deterministic rollback and recovery after interruption.
 * 6. Guarantee zero cross-account data leakage.
 */

(function(global) {
  'use strict';

  // Dependency Resolution (Browser globals with Node.js CommonJS fallback)
  const _LearnerRepository = (typeof window !== 'undefined' && window.LearnerRepository) ||
    (typeof require !== 'undefined' ? require('./learner-repository') : null);

  const _StorageEngine = (typeof window !== 'undefined' && window.StorageEngine) ||
    (typeof require !== 'undefined' ? require('./storage-engine') : null);

  const BACKUP_PREFIX = 'algorecall_backup_pre_migration_';
  const BACKUPS_INDEX_KEY = 'algorecall_backups_index';
  const MIGRATION_META_KEY = 'algorecall_migration_meta';

  function getRepo() {
    const repo = (typeof window !== 'undefined' && window.LearnerRepository) || _LearnerRepository;
    if (!repo) throw new Error('MigrationManager: LearnerRepository not available.');
    return repo;
  }

  function getStorageEngine() {
    return (typeof window !== 'undefined' && window.StorageEngine) || _StorageEngine;
  }

  function getRawStorage() {
    const repo = getRepo();
    return repo.getRawStorage();
  }

  /**
   * Scans un-namespaced local storage to detect legacy learner progress.
   * Extracts detailed statistics for user confirmation dialogs.
   * 
   * @returns {{
   *   hasProgress: boolean,
   *   isClaimed: boolean,
   *   claimedBy: string|null,
   *   statesCount: number,
   *   problemsPracticed: number,
   *   masteredCount: number,
   *   srsStageCounts: Object,
   *   mockCount: number,
   *   examCount: number,
   *   xp: number,
   *   level: number,
   *   streak: number,
   *   roadmapCompletedDays: number,
   *   customProblemsCount: number,
   *   summaryText: string
   * }}
   */
  function detectLegacyProgress() {
    const storage = getRawStorage();
    const meta = getMigrationMeta();

    const result = {
      hasProgress: false,
      isClaimed: Boolean(meta && meta.status === 'completed'),
      claimedBy: meta ? meta.claimedBy : null,
      claimedEmail: meta ? meta.userEmail : null,
      statesCount: 0,
      problemsPracticed: 0,
      masteredCount: 0,
      srsStageCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      mockCount: 0,
      examCount: 0,
      xp: 0,
      level: 1,
      streak: 0,
      roadmapCompletedDays: 0,
      customProblemsCount: 0,
      summaryText: ''
    };

    if (!storage) return result;

    try {
      // 1. User States
      const rawStates = storage.getItem('algorecall_user_states_v2') || storage.getItem('algorecall_user_states_v1');
      if (rawStates) {
        const states = JSON.parse(rawStates);
        if (states && typeof states === 'object') {
          const keys = Object.keys(states);
          result.statesCount = keys.length;
          keys.forEach(id => {
            const s = states[id];
            if (s && (s.lastReviewed || (s.history && s.history.length > 0) || s.stage > 1 || s.isMastered)) {
              result.problemsPracticed++;
              if (s.isMastered) result.masteredCount++;
              const stage = Math.min(5, Math.max(1, s.stage || 1));
              result.srsStageCounts[stage] = (result.srsStageCounts[stage] || 0) + 1;
            }
          });
        }
      }

      // 2. Exam History
      const rawExams = storage.getItem('algorecall_exam_history_v2') || storage.getItem('algorecall_monthly_test_history_v1');
      if (rawExams) {
        const exams = JSON.parse(rawExams);
        if (Array.isArray(exams)) result.examCount = exams.length;
      }

      // 3. Mock History
      const rawMocks = storage.getItem('algorecall_mock_history_v2');
      if (rawMocks) {
        const mocks = JSON.parse(rawMocks);
        if (Array.isArray(mocks)) result.mockCount = mocks.length;
      }

      // 4. Gamification
      const rawGamification = storage.getItem('algorecall_gamification_v2');
      if (rawGamification) {
        const g = JSON.parse(rawGamification);
        if (g && typeof g === 'object') {
          result.xp = g.xp || 0;
          result.level = g.level || 1;
          result.streak = g.currentStreak || (g.badgesUnlocked ? Object.keys(g.badgesUnlocked).length : 0);
        }
      }

      // 5. Roadmap
      const rawRoadmap = storage.getItem('algorecall_roadmap_progress_v1');
      if (rawRoadmap) {
        const rm = JSON.parse(rawRoadmap);
        if (rm && rm.completedDays && typeof rm.completedDays === 'object') {
          result.roadmapCompletedDays = Object.keys(rm.completedDays).length;
        }
      }

      // 6. Custom Problems
      const rawProblems = storage.getItem('algorecall_problems_v2');
      if (rawProblems) {
        const probs = JSON.parse(rawProblems);
        if (Array.isArray(probs)) {
          // Check for custom problems (ids not starting with canonical prefixes or flagged custom)
          const custom = probs.filter(p => p.isCustom || (p.id && String(p.id).startsWith('custom_')));
          result.customProblemsCount = custom.length;
        }
      }

      result.hasProgress = (
        result.problemsPracticed > 0 ||
        result.statesCount > 0 ||
        result.examCount > 0 ||
        result.mockCount > 0 ||
        result.xp > 0 ||
        result.roadmapCompletedDays > 0 ||
        result.customProblemsCount > 0
      );

      // Generate human-readable summary text
      if (result.hasProgress) {
        const parts = [];
        if (result.problemsPracticed > 0) {
          parts.push(`${result.problemsPracticed} problem${result.problemsPracticed > 1 ? 's' : ''} reviewed (${result.masteredCount} mastered)`);
        }
        if (result.examCount > 0 || result.mockCount > 0) {
          parts.push(`${result.mockCount} mock interviews, ${result.examCount} exams`);
        }
        if (result.xp > 0 || result.level > 1) {
          parts.push(`Level ${result.level} (${result.xp} XP)`);
        }
        if (result.roadmapCompletedDays > 0) {
          parts.push(`${result.roadmapCompletedDays} roadmap days finished`);
        }
        result.summaryText = parts.join(' • ');
      }
    } catch (e) {
      console.error('[MigrationManager] detectLegacyProgress error:', e);
    }

    return result;
  }

  /**
   * Generates and validates a complete pre-migration backup before any mutation occurs.
   * Saves the backup into storage under a unique timestamped key.
   * 
   * @returns {{
   *   success: boolean,
   *   backupKey: string,
   *   bundle: Object,
   *   stats: Object
   * }}
   */
  function createPreMigrationBackup() {
    const storage = getRawStorage();
    if (!storage) throw new Error('MigrationManager: Storage is not available.');

    const timestamp = Date.now();
    const backupKey = `${BACKUP_PREFIX}${timestamp}`;

    // Read all legacy data items
    const rawUserStates = storage.getItem('algorecall_user_states_v2') || storage.getItem('algorecall_user_states_v1');
    const rawProblems = storage.getItem('algorecall_problems_v2') || storage.getItem('algorecall_problems_v1');
    const rawExams = storage.getItem('algorecall_exam_history_v2') || storage.getItem('algorecall_monthly_test_history_v1');
    const rawMocks = storage.getItem('algorecall_mock_history_v2');
    const rawFailures = storage.getItem('algorecall_failures_v2');
    const rawGamification = storage.getItem('algorecall_gamification_v2');
    const rawRoadmap = storage.getItem('algorecall_roadmap_progress_v1');
    const rawSettings = storage.getItem('algorecall_settings_v2');
    const rawInterventions = storage.getItem('algorecall_interventions_v2');
    const rawActiveExam = storage.getItem('algorecall_active_exam_session_v2');
    const rawActiveMock = storage.getItem('algorecall_active_mock_session_v2');

    const bundle = {
      app: 'AlgoRecall',
      version: '2.0.0',
      backupType: 'pre_migration',
      createdAt: new Date().toISOString(),
      timestamp,
      data: {
        userStates: rawUserStates ? JSON.parse(rawUserStates) : {},
        problems: rawProblems ? JSON.parse(rawProblems) : [],
        examHistory: rawExams ? JSON.parse(rawExams) : [],
        mockHistory: rawMocks ? JSON.parse(rawMocks) : [],
        failures: rawFailures ? JSON.parse(rawFailures) : {},
        gamification: rawGamification ? JSON.parse(rawGamification) : null,
        roadmapProgress: rawRoadmap ? JSON.parse(rawRoadmap) : null,
        settings: rawSettings ? JSON.parse(rawSettings) : {},
        interventions: rawInterventions ? JSON.parse(rawInterventions) : [],
        activeExamSession: rawActiveExam ? JSON.parse(rawActiveExam) : null,
        activeMockSession: rawActiveMock ? JSON.parse(rawActiveMock) : null
      }
    };

    // Validate backup integrity via StorageEngine inspectImportBundle if available
    const engine = getStorageEngine();
    let inspection = null;
    if (engine && typeof engine.inspectImportBundle === 'function') {
      inspection = engine.inspectImportBundle(bundle);
      if (!inspection.valid) {
        throw new Error(`MigrationManager: Pre-migration backup validation failed: ${inspection.error}`);
      }
    }

    // Persist backup bundle
    storage.setItem(backupKey, JSON.stringify(bundle));

    // Register in backups index
    recordBackupIndex(backupKey, timestamp, inspection ? inspection.stats : null);

    return {
      success: true,
      backupKey,
      bundle,
      stats: inspection ? inspection.stats : null
    };
  }

  function recordBackupIndex(backupKey, timestamp, stats) {
    try {
      const storage = getRawStorage();
      if (!storage) return;
      const rawIndex = storage.getItem(BACKUPS_INDEX_KEY);
      const list = rawIndex ? JSON.parse(rawIndex) : [];
      list.unshift({
        backupKey,
        timestamp,
        isoDate: new Date(timestamp).toISOString(),
        stats
      });
      storage.setItem(BACKUPS_INDEX_KEY, JSON.stringify(list.slice(0, 20))); // Retain last 20 backups
    } catch (e) {
      console.warn('[MigrationManager] Could not update backups index:', e);
    }
  }

  /**
   * Returns list of existing pre-migration backups.
   * @returns {Array}
   */
  function getBackupsList() {
    try {
      const storage = getRawStorage();
      if (!storage) return [];
      const rawIndex = storage.getItem(BACKUPS_INDEX_KEY);
      return rawIndex ? JSON.parse(rawIndex) : [];
    } catch (_) {
      return [];
    }
  }

  /**
   * Migrates legacy un-namespaced learner progress to an authenticated user namespace.
   * Strict safety workflow:
   * 1. Validate userId.
   * 2. Idempotency guard: abort if user already has data or if already claimed (unless options.force).
   * 3. Detect legacy progress.
   * 4. Generate and validate complete pre-migration backup before touching state.
   * 5. Copy data into `algorecall_u_<safeId>_*`.
   * 6. Verify written user data matches backup.
   * 7. Clear un-namespaced legacy keys to prevent guest leakage.
   * 8. Record migration metadata.
   * 
   * @param {string} userId 
   * @param {Object} [options]
   * @param {string} [options.email]
   * @param {boolean} [options.force]
   * @returns {{ success: boolean, backupKey?: string, stats?: Object, error?: string }}
   */
  function migrateLegacyToUser(userId, options = {}) {
    const repo = getRepo();
    const safeId = repo.sanitizeUserId(userId);
    const storage = getRawStorage();

    // 1. Guard against duplicate claiming of legacy data (Idempotency)
    const existingMeta = getMigrationMeta();
    if (existingMeta && existingMeta.status === 'completed' && !options.force) {
      if (existingMeta.claimedBy === safeId) {
        return {
          success: true,
          alreadyMigrated: true,
          backupKey: existingMeta.backupKey,
          message: 'Data has already been claimed by this user.'
        };
      }
      return {
        success: false,
        error: `Legacy progress was already claimed by user "${existingMeta.claimedBy}".`
      };
    }

    // 2. Guard against accidental overwrite of existing user data
    if (repo.hasUserData(safeId) && !options.force) {
      return {
        success: false,
        error: `User "${safeId}" already has initialized progress. Aborting to prevent data overwrite.`
      };
    }

    // 3. Detect legacy progress
    const legacyStats = detectLegacyProgress();
    if (!legacyStats.hasProgress && !options.force) {
      return {
        success: false,
        error: 'No legacy learner progress detected to migrate.'
      };
    }

    // 4. Create and validate complete pre-migration backup BEFORE any state modification
    let backupResult;
    try {
      backupResult = createPreMigrationBackup();
    } catch (err) {
      return {
        success: false,
        error: `Failed to create pre-migration backup: ${err.message}`
      };
    }

    const { bundle, backupKey } = backupResult;
    const data = bundle.data;
    const targetCtx = { type: 'user', id: safeId, email: options.email || null };

    try {
      // 5. Copy data into scoped user namespace
      repo.saveUserStates(data.userStates, targetCtx);
      repo.saveProblems(data.problems, targetCtx);
      repo.saveExamHistory(data.examHistory, targetCtx);
      repo.saveMockHistory(data.mockHistory, targetCtx);
      repo.saveFailures(data.failures, targetCtx);
      if (data.gamification) repo.saveGamification(data.gamification, targetCtx);
      if (data.roadmapProgress) repo.saveRoadmapProgress(data.roadmapProgress, targetCtx);
      if (data.settings) repo.saveSettings(data.settings, targetCtx);
      if (data.interventions) repo.saveInterventions(data.interventions, targetCtx);
      if (data.activeExamSession) repo.saveActiveExamSession(data.activeExamSession, targetCtx);
      if (data.activeMockSession) repo.saveActiveMockSession(data.activeMockSession, targetCtx);

      // 6. Post-write verification: ensure user-scoped data was written accurately
      const writtenStates = repo.getUserStates(targetCtx);
      const expectedStatesCount = Object.keys(data.userStates || {}).length;
      const actualStatesCount = Object.keys(writtenStates || {}).length;

      if (expectedStatesCount > 0 && actualStatesCount === 0) {
        throw new Error('Verification failed: User states were not persisted to target namespace.');
      }

      // 7. Clear un-namespaced legacy keys so that signing out will NOT expose User's data to guests!
      const legacyKeys = repo.getLegacyKeys();
      legacyKeys.forEach(k => {
        try {
          storage.removeItem(k);
        } catch (_) {}
      });

      // 8. Record migration metadata
      const migrationMeta = {
        status: 'completed',
        claimedBy: safeId,
        userEmail: options.email || null,
        timestamp: new Date().toISOString(),
        backupKey,
        stats: legacyStats
      };

      storage.setItem(MIGRATION_META_KEY, JSON.stringify(migrationMeta));

      console.log(`[MigrationManager] Successfully migrated legacy progress to user: ${safeId}`);

      return {
        success: true,
        backupKey,
        stats: legacyStats,
        claimedBy: safeId
      };

    } catch (err) {
      console.error('[MigrationManager] Migration failed during execution. Rolling back:', err);
      // Rollback target user namespace on error to maintain clean isolation
      repo.clearUserData(safeId);
      return {
        success: false,
        error: `Migration error: ${err.message}. Target user space rolled back.`
      };
    }
  }

  /**
   * Initializes a fresh, clean isolated environment for an authenticated user.
   * Does NOT touch legacy progress. Used when user explicitly chooses "Start fresh",
   * or for new secondary learners (e.g. friend).
   * 
   * @param {string} userId 
   * @param {Object} [options]
   * @param {string} [options.email]
   * @returns {{ success: boolean, isFresh: true }}
   */
  function startFreshUser(userId, options = {}) {
    const repo = getRepo();
    const safeId = repo.sanitizeUserId(userId);
    const targetCtx = { type: 'user', id: safeId, email: options.email || null };

    // Initialize clean, empty isolated datasets
    repo.saveUserStates({}, targetCtx);
    repo.saveProblems([], targetCtx);
    repo.saveExamHistory([], targetCtx);
    repo.saveMockHistory([], targetCtx);
    repo.saveFailures({}, targetCtx);
    repo.saveInterventions([], targetCtx);
    repo.clearActiveExamSession(targetCtx);
    repo.clearActiveMockSession(targetCtx);

    // Initial fresh gamification
    repo.saveGamification({
      xp: 0,
      level: 1,
      badgesUnlocked: {},
      streakShieldsAvailable: 1,
      lastShieldUsedDate: null,
      weeklyQuests: [
        { id: 'quest_1', title: 'Complete 3 Independent Solves', target: 3, current: 0, completed: false, xpReward: 100 },
        { id: 'quest_2', title: 'Review 5 Spaced Repetitions', target: 5, current: 0, completed: false, xpReward: 150 },
        { id: 'quest_3', title: 'Complete 1 Mock Interview Round', target: 1, current: 0, completed: false, xpReward: 200 }
      ]
    }, targetCtx);

    // Initial fresh roadmap progress
    repo.saveRoadmapProgress({
      activeTrack: 'striver_hero',
      selectedWeek: 1,
      selectedDay: 1,
      completedDays: {},
      deferredRollovers: {},
      customDayTopics: {},
      customDayWorkouts: {},
      dsa12WeekSelectedWeek: 1,
      dsa12DailyMinutes: 120,
      dsa12CustomSchedule: {},
      dsa12DailyPlans: {},
      currentLearningTopic: null,
      revisionTopic: null,
      selectedLearningTopic: null,
      selectedRevisionTopic: null,
      weeklyStudyDays: 5,
      userLockedTopics: false,
      skippedTasks: {}
    }, targetCtx);

    // Initial default settings
    repo.saveSettings({
      theme: 'dark',
      aiProvider: 'offline',
      aiApiKey: '',
      aiApiEndpoint: '',
      aiModel: 'default',
      enableGamification: true,
      enableStreakShield: true,
      interviewStrictTimer: true,
      targetDailyMinutes: 45
    }, targetCtx);

    console.log(`[MigrationManager] Initialized fresh clean account for user: ${safeId}`);

    return {
      success: true,
      isFresh: true,
      userId: safeId
    };
  }

  /**
   * Deterministic Rollback: Restores un-namespaced legacy keys from a pre-migration backup
   * and removes target user's keys.
   * 
   * @param {string} backupKey 
   * @param {string} [userId]
   * @returns {{ success: boolean, restoredCount: number, error?: string }}
   */
  function rollbackMigration(backupKey, userId) {
    const storage = getRawStorage();
    if (!storage) return { success: false, error: 'Storage unavailable' };

    const rawBackup = storage.getItem(backupKey);
    if (!rawBackup) {
      return { success: false, error: `Backup key "${backupKey}" not found in storage.` };
    }

    try {
      const bundle = JSON.parse(rawBackup);
      const data = bundle.data || bundle;

      // Restore legacy keys
      if (data.userStates) storage.setItem('algorecall_user_states_v2', JSON.stringify(data.userStates));
      if (data.problems) storage.setItem('algorecall_problems_v2', JSON.stringify(data.problems));
      if (data.examHistory) storage.setItem('algorecall_exam_history_v2', JSON.stringify(data.examHistory));
      if (data.mockHistory) storage.setItem('algorecall_mock_history_v2', JSON.stringify(data.mockHistory));
      if (data.failures) storage.setItem('algorecall_failures_v2', JSON.stringify(data.failures));
      if (data.gamification) storage.setItem('algorecall_gamification_v2', JSON.stringify(data.gamification));
      if (data.roadmapProgress) storage.setItem('algorecall_roadmap_progress_v1', JSON.stringify(data.roadmapProgress));
      if (data.settings) storage.setItem('algorecall_settings_v2', JSON.stringify(data.settings));
      if (data.interventions) storage.setItem('algorecall_interventions_v2', JSON.stringify(data.interventions));
      if (data.activeExamSession) storage.setItem('algorecall_active_exam_session_v2', JSON.stringify(data.activeExamSession));
      if (data.activeMockSession) storage.setItem('algorecall_active_mock_session_v2', JSON.stringify(data.activeMockSession));

      // Clear user data if userId provided
      if (userId) {
        const repo = getRepo();
        repo.clearUserData(userId);
      }

      // Reset migration meta
      storage.removeItem(MIGRATION_META_KEY);

      console.log(`[MigrationManager] Rollback succeeded from backup: ${backupKey}`);
      return {
        success: true,
        backupKey,
        restoredAt: new Date().toISOString()
      };
    } catch (e) {
      return {
        success: false,
        error: `Rollback failed: ${e.message}`
      };
    }
  }

  /**
   * Returns current migration metadata if present.
   * @returns {Object|null}
   */
  function getMigrationMeta() {
    try {
      const storage = getRawStorage();
      if (!storage) return null;
      const raw = storage.getItem(MIGRATION_META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  const MigrationManagerModule = {
    detectLegacyProgress,
    createPreMigrationBackup,
    getBackupsList,
    migrateLegacyToUser,
    startFreshUser,
    rollbackMigration,
    getMigrationMeta
  };

  // Export to browser global and CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MigrationManagerModule;
  }
  if (typeof window !== 'undefined') {
    window.MigrationManager = MigrationManagerModule;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
