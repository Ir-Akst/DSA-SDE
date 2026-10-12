/**
 * AlgoRecall 2.0 - Unified Storage & Data Portability Engine
 * Provides versioned schema management (v2), migration from v1,
 * integrity validation, conflict previews, multi-tab sync, and recovery.
 */

(function () {
  'use strict';

  const SCHEMA_VERSION = '2.0.0';

  const STORAGE_KEYS = {
    SCHEMA: 'algorecall_schema_version',
    PROBLEMS: 'algorecall_problems_v2',
    USER_STATES: 'algorecall_user_states_v2',
    EXAM_HISTORY: 'algorecall_exam_history_v2',
    MOCK_HISTORY: 'algorecall_mock_history_v2',
    FAILURES: 'algorecall_failures_v2',
    GAMIFICATION: 'algorecall_gamification_v2',
    SETTINGS: 'algorecall_settings_v2',
    ACTIVE_EXAM: 'algorecall_active_exam_session_v2',
    ACTIVE_MOCK: 'algorecall_active_mock_session_v2',
    ROADMAP: 'algorecall_roadmap_progress_v1' // Preserved backward compatibility
  };

  const LEGACY_KEYS_V1 = {
    PROBLEMS: 'algorecall_problems_v1',
    USER_STATES: 'algorecall_user_states_v1',
    EXAM_HISTORY: 'algorecall_monthly_test_history_v1',
    ACTIVE_EXAM: 'algorecall_active_exam_state_v1'
  };

  const DEFAULT_SETTINGS = {
    theme: 'dark', // 'dark' | 'light'
    aiProvider: 'offline', // 'offline' | 'openai' | 'gemini' | 'custom'
    aiApiKey: '',
    aiApiEndpoint: '',
    aiModel: 'default',
    enableGamification: true,
    enableStreakShield: true,
    interviewStrictTimer: true,
    targetDailyMinutes: 45
  };

  const _memoryStore = new Map();
  const getLocalStorage = () => {
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
  };

  const StorageEngine = {
    SCHEMA_VERSION,
    KEYS: STORAGE_KEYS,

    /**
     * Initialize storage and perform seamless migration if legacy data is found
     */
    init() {
      try {
        const storage = getLocalStorage();
        if (!storage) return;
        const currentVersion = storage.getItem(STORAGE_KEYS.SCHEMA);
        if (!currentVersion || currentVersion !== SCHEMA_VERSION) {
          this.migrateFromLegacy();
          storage.setItem(STORAGE_KEYS.SCHEMA, SCHEMA_VERSION);
        }
      } catch (e) {
        console.warn('StorageEngine init warning:', e);
      }
    },

    /**
     * Migrate from v1 to v2 schema without data loss
     */
    migrateFromLegacy() {
      console.log('AlgoRecall: Checking and executing schema migration to v2.0.0...');
      const storage = getLocalStorage();
      if (!storage) return;

      // 1. Migrate Problems
      if (!storage.getItem(STORAGE_KEYS.PROBLEMS) && storage.getItem(LEGACY_KEYS_V1.PROBLEMS)) {
        try {
          const v1Probs = storage.getItem(LEGACY_KEYS_V1.PROBLEMS);
          if (v1Probs) storage.setItem(STORAGE_KEYS.PROBLEMS, v1Probs);
        } catch (e) {
          console.error('Problems migration error:', e);
        }
      }

      // 2. Migrate User States
      if (!storage.getItem(STORAGE_KEYS.USER_STATES) && storage.getItem(LEGACY_KEYS_V1.USER_STATES)) {
        try {
          const v1StatesRaw = storage.getItem(LEGACY_KEYS_V1.USER_STATES);
          if (v1StatesRaw) {
            const v1States = JSON.parse(v1StatesRaw);
            const upgradedStates = {};

            Object.keys(v1States).forEach(id => {
              const s = v1States[id] || {};
              // Upgrade each state into clean v2 structure with backward-compatibility
              upgradedStates[id] = {
                ...s,
                schemaVersion: SCHEMA_VERSION,
                hintsUsed: s.hintsUsed || false,
                lastConfidence: s.confidence || s.lastConfidence || 3,
                stability: s.stability || (s.stage ? s.stage * 4 : 1),
                difficultyEst: s.difficultyEst || 5,
                retentionEst: s.isMastered ? 0.95 : (s.stage >= 3 ? 0.85 : 0.7)
              };
            });

            storage.setItem(STORAGE_KEYS.USER_STATES, JSON.stringify(upgradedStates));
          }
        } catch (e) {
          console.error('User states migration error:', e);
        }
      }

      // 3. Migrate Exam History
      if (!storage.getItem(STORAGE_KEYS.EXAM_HISTORY) && storage.getItem(LEGACY_KEYS_V1.EXAM_HISTORY)) {
        try {
          const v1Exams = storage.getItem(LEGACY_KEYS_V1.EXAM_HISTORY);
          if (v1Exams) storage.setItem(STORAGE_KEYS.EXAM_HISTORY, v1Exams);
        } catch (e) {
          console.error('Exam history migration error:', e);
        }
      }

      // 4. Migrate Active Exam if pending
      if (!storage.getItem(STORAGE_KEYS.ACTIVE_EXAM) && storage.getItem(LEGACY_KEYS_V1.ACTIVE_EXAM)) {
        try {
          const v1Active = storage.getItem(LEGACY_KEYS_V1.ACTIVE_EXAM);
          if (v1Active) storage.setItem(STORAGE_KEYS.ACTIVE_EXAM, v1Active);
        } catch (e) {
          console.error('Active exam migration error:', e);
        }
      }
    },

    /**
     * Get Settings
     */
    getSettings() {
      try {
        const storage = getLocalStorage();
        const raw = storage ? storage.getItem(STORAGE_KEYS.SETTINGS) : null;
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
      } catch (e) {
        return { ...DEFAULT_SETTINGS };
      }
    },

    /**
     * Save Settings
     */
    saveSettings(newSettings) {
      try {
        const storage = getLocalStorage();
        const current = this.getSettings();
        const merged = { ...current, ...newSettings };
        if (storage) storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        return merged;
      } catch (e) {
        console.error('Error saving settings:', e);
        return null;
      }
    },

    /**
     * Load User States
     */
    getUserStates() {
      try {
        const storage = getLocalStorage();
        const raw = storage ? storage.getItem(STORAGE_KEYS.USER_STATES) : null;
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.error('Error loading user states:', e);
        return {};
      }
    },

    /**
     * Save User States
     */
    saveUserStates(states) {
      try {
        const storage = getLocalStorage();
        if (storage) storage.setItem(STORAGE_KEYS.USER_STATES, JSON.stringify(states || {}));
        return true;
      } catch (e) {
        console.error('Error saving user states:', e);
        return false;
      }
    },

    /**
     * Generate Comprehensive Export Bundle
     */
    createExportBundle(options = {}) {
      const storage = getLocalStorage() || { getItem: () => null };
      const problems = storage.getItem(STORAGE_KEYS.PROBLEMS);
      const userStates = storage.getItem(STORAGE_KEYS.USER_STATES);
      const examHistory = storage.getItem(STORAGE_KEYS.EXAM_HISTORY);
      const mockHistory = storage.getItem(STORAGE_KEYS.MOCK_HISTORY);
      const failures = storage.getItem(STORAGE_KEYS.FAILURES);
      const gamification = storage.getItem(STORAGE_KEYS.GAMIFICATION);
      const roadmap = storage.getItem(STORAGE_KEYS.ROADMAP);
      const settings = this.getSettings();

      // Don't export raw API keys in backup for security!
      const sanitizedSettings = { ...settings, aiApiKey: '' };

      const bundle = {
        app: 'AlgoRecall',
        version: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
          problems: problems ? JSON.parse(problems) : [],
          userStates: userStates ? JSON.parse(userStates) : {},
          examHistory: examHistory ? JSON.parse(examHistory) : [],
          mockHistory: mockHistory ? JSON.parse(mockHistory) : [],
          failures: failures ? JSON.parse(failures) : {},
          gamification: gamification ? JSON.parse(gamification) : null,
          roadmapProgress: roadmap ? JSON.parse(roadmap) : null,
          settings: sanitizedSettings
        }
      };

      return bundle;
    },

    /**
     * Validate an imported JSON bundle and return inspection statistics
     */
    inspectImportBundle(jsonObj) {
      if (!jsonObj || typeof jsonObj !== 'object') {
        return { valid: false, error: 'File is not a valid JSON object.' };
      }

      if (jsonObj.app !== 'AlgoRecall' && !jsonObj.userStates && !jsonObj.problems) {
        return { valid: false, error: 'Unrecognized file format. Not an AlgoRecall backup.' };
      }

      const data = jsonObj.data || jsonObj;
      const problemsCount = Array.isArray(data.problems) ? data.problems.length : 0;
      const statesCount = data.userStates && typeof data.userStates === 'object' ? Object.keys(data.userStates).length : 0;
      const examsCount = Array.isArray(data.examHistory || data.monthlyTestHistory) ? (data.examHistory || data.monthlyTestHistory).length : 0;
      const mocksCount = Array.isArray(data.mockHistory) ? data.mockHistory.length : 0;

      return {
        valid: true,
        version: jsonObj.version || '1.0.0',
        exportedAt: jsonObj.exportedAt || null,
        stats: {
          problemsCount,
          statesCount,
          examsCount,
          mocksCount,
          hasGamification: !!data.gamification,
          hasRoadmap: !!(data.roadmapProgress || data.roadmap)
        },
        payload: data
      };
    },

    /**
     * Apply validated import bundle with conflict preservation
     */
    applyImportBundle(bundleData, mergeMode = 'merge') {
      try {
        const storage = getLocalStorage();
        if (!storage) return { success: false, error: 'Storage unavailable' };
        const payload = bundleData.payload || bundleData;

        // 1. User States
        if (payload.userStates) {
          if (mergeMode === 'replace') {
            storage.setItem(STORAGE_KEYS.USER_STATES, JSON.stringify(payload.userStates));
          } else {
            const existing = this.getUserStates();
            const merged = { ...existing };
            Object.keys(payload.userStates).forEach(id => {
              const incoming = payload.userStates[id];
              const cur = merged[id];
              if (!cur) {
                merged[id] = incoming;
              } else {
                // Merge review history deduplicating by timestamp
                const histA = Array.isArray(cur.history) ? cur.history : [];
                const histB = Array.isArray(incoming.history) ? incoming.history : [];
                const seenTimestamps = new Set(histA.map(h => h.date));
                const uniqueB = histB.filter(h => !seenTimestamps.has(h.date));
                const combinedHist = [...histA, ...uniqueB].sort((a, b) => new Date(a.date) - new Date(b.date));

                merged[id] = {
                  ...cur,
                  ...incoming,
                  history: combinedHist,
                  reviewCount: Math.max(cur.reviewCount || 0, incoming.reviewCount || 0, combinedHist.length)
                };
              }
            });
            storage.setItem(STORAGE_KEYS.USER_STATES, JSON.stringify(merged));
          }
        }

        // 2. Exam History
        if (payload.examHistory || payload.monthlyTestHistory) {
          const incomingExams = payload.examHistory || payload.monthlyTestHistory;
          if (mergeMode === 'replace') {
            storage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(incomingExams));
          } else {
            const rawCur = storage.getItem(STORAGE_KEYS.EXAM_HISTORY);
            const curExams = rawCur ? JSON.parse(rawCur) : [];
            const seenIds = new Set(curExams.map(e => e.testId || e.id));
            const mergedExams = [...curExams];
            incomingExams.forEach(e => {
              const eId = e.testId || e.id;
              if (!seenIds.has(eId)) {
                mergedExams.push(e);
                seenIds.add(eId);
              }
            });
            storage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(mergedExams));
          }
        }

        // 3. Mock History
        if (payload.mockHistory) {
          const incomingMocks = payload.mockHistory;
          if (mergeMode === 'replace') {
            storage.setItem(STORAGE_KEYS.MOCK_HISTORY, JSON.stringify(incomingMocks));
          } else {
            const rawCur = storage.getItem(STORAGE_KEYS.MOCK_HISTORY);
            const curMocks = rawCur ? JSON.parse(rawCur) : [];
            const seenIds = new Set(curMocks.map(m => m.id || m.sessionId));
            const mergedMocks = [...curMocks];
            incomingMocks.forEach(m => {
              const mId = m.id || m.sessionId;
              if (!seenIds.has(mId)) {
                mergedMocks.push(m);
                seenIds.add(mId);
              }
            });
            storage.setItem(STORAGE_KEYS.MOCK_HISTORY, JSON.stringify(mergedMocks));
          }
        }

        // 4. Failures
        if (payload.failures) {
          storage.setItem(STORAGE_KEYS.FAILURES, JSON.stringify(payload.failures));
        }

        // 5. Gamification
        if (payload.gamification) {
          storage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(payload.gamification));
        }

        // 6. Roadmap
        if (payload.roadmapProgress || payload.roadmap) {
          const rm = payload.roadmapProgress || payload.roadmap;
          storage.setItem(STORAGE_KEYS.ROADMAP, JSON.stringify(rm));
        }

        return { success: true };
      } catch (e) {
        console.error('Error applying import bundle:', e);
        return { success: false, error: e.message };
      }
    },

    /**
     * Build Safe URL Hash for sync with warning metadata
     */
    generateSafeSyncHash() {
      const userStates = this.getUserStates();
      // Only serialize critical state: id -> { stage, lastRating, confidence, nextReviewDate, isMastered }
      const compressed = {};
      Object.keys(userStates).forEach(id => {
        const s = userStates[id];
        if (s && s.lastReviewed) {
          compressed[id] = [
            s.stage || 1,
            s.lastRating || 'medium',
            s.confidence || 3,
            s.nextReviewDate || '',
            s.isMastered ? 1 : 0
          ];
        }
      });

      const payload = {
        v: 2,
        t: Date.now(),
        s: compressed
      };

      const _safeBtoa = (str) => {
        if (typeof btoa !== 'undefined') return btoa(str);
        if (typeof Buffer !== 'undefined') return Buffer.from(str, 'binary').toString('base64');
        return '';
      };
      const jsonStr = JSON.stringify(payload);
      return _safeBtoa(encodeURIComponent(jsonStr));
    },

    /**
     * Decode and restore Safe URL Hash
     */
    parseSafeSyncHash(hashStr) {
      try {
        const _safeAtob = (b64) => {
          if (typeof atob !== 'undefined') return atob(b64);
          if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('binary');
          return '';
        };
        const clean = hashStr.replace(/^#sync=/, '').trim();
        const decoded = decodeURIComponent(_safeAtob(clean));
        const payload = JSON.parse(decoded);

        if (!payload || !payload.s) {
          return { valid: false, error: 'Invalid sync hash data' };
        }

        const restoredStates = {};
        Object.keys(payload.s).forEach(id => {
          const arr = payload.s[id];
          restoredStates[id] = {
            stage: arr[0],
            lastRating: arr[1],
            confidence: arr[2],
            nextReviewDate: arr[3],
            isMastered: arr[4] === 1,
            lastReviewed: new Date(payload.t).toISOString(),
            reviewCount: 1,
            history: [{
              date: new Date(payload.t).toISOString(),
              rating: arr[1],
              confidence: arr[2],
              stage: arr[0]
            }]
          };
        });

        return { valid: true, timestamp: payload.t, count: Object.keys(restoredStates).length, states: restoredStates };
      } catch (e) {
        return { valid: false, error: 'Failed to decode sync code: ' + e.message };
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.StorageEngine = StorageEngine;
    StorageEngine.init();
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageEngine;
  }
})();
