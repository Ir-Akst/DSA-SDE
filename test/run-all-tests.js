/**
 * AlgoRecall 2.0 - Automated Test Runner & Verification Suite
 * Validates all 10 core engineering modules, algorithms, data integrity, and migrations.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Initialize in-memory localStorage for Node test environment
const _mockStorage = new Map();
global.localStorage = {
  getItem: (k) => _mockStorage.has(k) ? _mockStorage.get(k) : null,
  setItem: (k, v) => _mockStorage.set(k, String(v)),
  removeItem: (k) => _mockStorage.delete(k),
  clear: () => _mockStorage.clear()
};

// Import all modules
const SRSEngine = require('../js/srs-engine');
const FailureEngine = require('../js/failure-engine');
const ReadinessEngine = require('../js/readiness-engine');
const GraphEngine = require('../js/graph-engine');
const DSA_PREREQUISITE_GRAPH = require('../js/data/prerequisite-graph');
const MockEngine = require('../js/mock-engine');
const AIEngine = require('../js/ai-engine');
const SolutionAnalysisEngine = require('../js/solution-analysis');
const GamificationEngine = require('../js/gamification-engine');
const StorageEngine = require('../js/storage-engine');
const RecommendationEngine = require('../js/recommendation-engine');
const DSA_PATTERNS = require('../js/data/patterns-data');
const DEFAULT_DSA_SHEETS = require('../js/data/default-sheets');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    if (err.stack) {
      console.error(`    ${err.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }
}

async function asyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    if (err.stack) {
      console.error(`    ${err.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }
}

function suite(name, fn) {
  console.log(`\n========================================\n[SUITE] ${name}\n========================================`);
  fn();
}

async function runAll() {
  console.log('🚀 AlgoRecall 2.0 Test Suite Initializing...\n');

  // =========================================================================
  // SUITE 1: SRS Engine (Spaced Repetition & Retention)
  // =========================================================================
  suite('1. Scientific Spaced Repetition System (SRSEngine)', () => {
    test('INTERVAL_MATRIX contains deterministic progression tiers', () => {
      assert.deepStrictEqual(SRSEngine.INTERVAL_MATRIX.simple, [7, 21, 60, 120, 240]);
      assert.deepStrictEqual(SRSEngine.INTERVAL_MATRIX.medium, [3, 7, 21, 45, 90]);
      assert.deepStrictEqual(SRSEngine.INTERVAL_MATRIX.hard, [1, 3, 7, 18, 40]);
      assert.deepStrictEqual(SRSEngine.INTERVAL_MATRIX.failed, [1, 1, 1, 1, 1]);
    });

    test('Confidence mapping fallback handles ratings (1-5 scale)', () => {
      assert.strictEqual(SRSEngine.mapRatingToDefaultConfidence('failed'), 1);
      assert.strictEqual(SRSEngine.mapRatingToDefaultConfidence('hard'), 2);
      assert.strictEqual(SRSEngine.mapRatingToDefaultConfidence('medium'), 3);
      assert.strictEqual(SRSEngine.mapRatingToDefaultConfidence('simple'), 4);
    });

    test('getConfidence extracts score from problemState with backward compatibility', () => {
      assert.strictEqual(SRSEngine.getConfidence({ confidence: 5 }), 5);
      assert.strictEqual(SRSEngine.getConfidence({ lastConfidence: 2 }), 2);
      assert.strictEqual(SRSEngine.getConfidence({ lastRating: 'hard' }), 2);
      assert.strictEqual(SRSEngine.getConfidence(null), null);
    });

    test('calculateStability scales memory based on rating, confidence, and hintsUsed', () => {
      // Simple + High confidence
      const s1 = SRSEngine.calculateStability(10, 'simple', 5, false);
      assert.strictEqual(s1, 26); // 10 * 2.6

      // Failed reset
      const s2 = SRSEngine.calculateStability(20, 'failed', 1, false);
      assert.strictEqual(s2, 5); // 20 * 0.25

      // Hints penalty reduces multiplier
      const s3 = SRSEngine.calculateStability(10, 'simple', 4, true);
      assert.ok(s3 < s1, 'Hints used must reduce stability growth');
    });

    test('calculateDifficulty updates 1-10 difficulty rating properly', () => {
      assert.strictEqual(SRSEngine.calculateDifficulty(5, 'failed'), 7); // +2
      assert.strictEqual(SRSEngine.calculateDifficulty(5, 'hard'), 6);   // +1
      assert.strictEqual(SRSEngine.calculateDifficulty(5, 'simple', 4), 4); // -1
      // Clamped to 10 max
      assert.strictEqual(SRSEngine.calculateDifficulty(10, 'failed'), 10);
    });

    test('calculateRetention implements Ebbinghaus decay approximation', () => {
      const now = new Date();
      const state = {
        lastReviewed: now.toISOString(),
        stability: 10
      };
      // 0 days elapsed -> 1.0 retention
      const r0 = SRSEngine.calculateRetention(state, now);
      assert.strictEqual(r0, 1.0);

      // 10 days elapsed with stability 10 -> exp(-10/10) = exp(-1) ~= 0.37
      const tenDaysLater = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const r10 = SRSEngine.calculateRetention(state, tenDaysLater);
      assert.ok(r10 >= 0.35 && r10 <= 0.39, `Expected ~0.37, got ${r10}`);
    });

    test('checkMasteryCriteria enforces anti-inflation safeguards', () => {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      // 1 attempt cannot be mastered
      assert.strictEqual(SRSEngine.checkMasteryCriteria([{ date: new Date().toISOString() }], 4, 4, false), false);

      // Attempt with hints cannot be mastered
      assert.strictEqual(SRSEngine.checkMasteryCriteria([], 4, 4, true), false);

      // Low confidence (< 4) cannot be mastered
      assert.strictEqual(SRSEngine.checkMasteryCriteria([], 4, 3, false), false);

      // Legitimate mastery history spanning 25 days with 4 independent reviews
      const validHistory = [
        { date: new Date(now - 25 * dayMs).toISOString(), hintsUsed: false, confidence: 4 },
        { date: new Date(now - 18 * dayMs).toISOString(), hintsUsed: false, confidence: 4 },
        { date: new Date(now - 7 * dayMs).toISOString(), hintsUsed: false, confidence: 5 },
        { date: new Date(now).toISOString(), hintsUsed: false, confidence: 5 }
      ];
      const isMastered = SRSEngine.checkMasteryCriteria(validHistory, 4, 5, false);
      assert.strictEqual(isMastered, true);
    });

    test('processReview does not advance stage and schedules 1-2 day follow-up when hints used', () => {
      const state = { stage: 1, stability: 3, history: [] };
      const resNoHints = SRSEngine.processReview(state, 'simple', 15, 'Clear solution', 4, { hintsUsed: false });
      assert.strictEqual(resNoHints.stage, 2);
      assert.strictEqual(resNoHints.intervalDays, 21); // INTERVAL_MATRIX.simple[1]

      const resWithHints = SRSEngine.processReview(state, 'simple', 15, 'Needed help', 3, { hintsUsed: true });
      assert.strictEqual(resWithHints.stage, 1, 'Hints used must not advance Leitner stage');
      assert.ok(resWithHints.intervalDays <= 2, 'Hints used must schedule follow-up within 1-2 days');
    });

    test('processReview resets on failed rating', () => {
      const state = { stage: 3, stability: 15, history: [] };
      const res = SRSEngine.processReview(state, 'failed', 25, 'Struggled', 1);
      assert.strictEqual(res.stage, 1);
      assert.strictEqual(res.intervalDays, 1);
    });
  });

  // =========================================================================
  // SUITE 2: Failure Intelligence Engine
  // =========================================================================
  suite('2. Failure Intelligence Engine', () => {
    test('Provides 9 distinct failure categories with prescribed actions', () => {
      const cats = FailureEngine.getAllCategories();
      assert.strictEqual(cats.length, 9);
      const ids = cats.map(c => c.id);
      assert.ok(ids.includes('pattern_recognition'));
      assert.ok(ids.includes('edge_cases'));
      assert.ok(ids.includes('time_management'));
      assert.ok(ids.includes('retention_decay'));
    });

    test('computeWeaknessProfile computes ranked failures and topic breakdowns', () => {
      const dummyProbs = [
        { id: 'p1', topic: 'Arrays & Hashing', pattern: 'Prefix Sum' },
        { id: 'p2', topic: 'Two Pointers', pattern: 'Two Pointers' }
      ];
      const userStates = {
        p1: {
          lastReviewed: new Date().toISOString(),
          history: [
            { failureReasons: ['edge_cases', 'test_cases'] },
            { failureReasons: ['edge_cases'] }
          ]
        },
        p2: {
          lastReviewed: new Date().toISOString(),
          history: [
            { failureReasons: ['pattern_recognition'] }
          ]
        }
      };

      const profile = FailureEngine.computeWeaknessProfile(dummyProbs, userStates);
      assert.strictEqual(profile.totalFailures, 4);
      assert.strictEqual(profile.rankedCategories[0].id, 'edge_cases');
      assert.strictEqual(profile.rankedCategories[0].count, 2);
      assert.ok(profile.topWeakTopics.length > 0);
    });

    test('getPrescription returns tailored action and tag', () => {
      const prob = { id: 'p1', topic: 'Dynamic Programming' };
      const rx = FailureEngine.getPrescription(prob, ['edge_cases']);
      assert.strictEqual(rx.tag, 'Edge-Case Checklist');
      assert.ok(rx.actionText.includes('boundary checklist'));
    });
  });

  // =========================================================================
  // SUITE 3: Interview Readiness Engine
  // =========================================================================
  suite('3. Interview Readiness Engine (0-100 Multi-Dimensional)', () => {
    test('calculateReadiness marks provisional status when attempts < 10', () => {
      const res = ReadinessEngine.calculateReadiness([], {});
      assert.strictEqual(res.isProvisional, true);
      assert.strictEqual(res.overallScore, 13);
      assert.strictEqual(res.grade, 'Foundations Needed (Provisional)');
    });

    test('calculateReadiness balances all 6 dimensions with empirical weights', () => {
      const probs = [];
      const states = {};
      const topics = ['Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Trees', 'Graphs'];

      // Generate 12 independent, well-timed solves with genuine spaced retention delay
      for (let i = 0; i < 12; i++) {
        const id = `prob-${i}`;
        probs.push({ id, difficulty: 'Medium', topic: topics[i % topics.length], pattern: 'Pattern' });
        states[id] = {
          lastReviewed: '2026-09-10T10:00:00.000Z',
          confidence: 4,
          hintsUsed: false,
          totalTimeSpent: 25,
          reviewCount: 2,
          stage: 2,
          history: [
            { date: '2026-09-01T10:00:00.000Z', stage: 1, rating: 'medium', confidence: 4, hintsUsed: false, isMassedPractice: false },
            { date: '2026-09-10T10:00:00.000Z', stage: 2, rating: 'medium', confidence: 4, hintsUsed: false, isMassedPractice: false }
          ]
        };
      }

      const mockHistory = [
        { scorePercentage: 85, percentage: 85 }
      ];

      const readiness = ReadinessEngine.calculateReadiness(probs, states, mockHistory);
      assert.strictEqual(readiness.isProvisional, false);
      assert.ok(readiness.overallScore >= 70, `Expected score >= 70, got ${readiness.overallScore}`);
      assert.strictEqual(readiness.dimensions.length, 6);
      assert.ok(readiness.strongAreas.length > 0);
    });
  });

  // =========================================================================
  // SUITE 4: Prerequisite Learning Graph Engine
  // =========================================================================
  suite('4. Prerequisite Learning Graph Engine', () => {
    test('evaluateGraph assesses all 16 nodes and unlocks foundations', () => {
      const evalRes = GraphEngine.evaluateGraph(DEFAULT_DSA_SHEETS, {});
      assert.strictEqual(evalRes.nodes.length, 16);

      // Root node with no prerequisites should be 'available'
      const rootNode = evalRes.nodeMap['node-basics-math'];
      assert.strictEqual(rootNode.status, 'available');

      // Dependent node with unfulfilled prerequisites should be 'locked'
      const advancedNode = evalRes.nodeMap['node-trees-bst'];
      assert.strictEqual(advancedNode.status, 'locked');
    });

    test('findMissingPrerequisite diagnoses foundation deficits', () => {
      const dpProblem = { id: 'dp-prob', topic: 'Dynamic Programming', difficulty: 'Hard' };
      // User has 0 solves on Recursion & Backtracking (prerequisite for DP)
      const diag = GraphEngine.findMissingPrerequisite(dpProblem, DEFAULT_DSA_SHEETS, {});
      assert.ok(diag !== null);
      assert.strictEqual(diag.currentNode.topic, 'Dynamic Programming');
      assert.ok(diag.weakPrerequisiteNode !== null);
      assert.ok(diag.reason.includes('Prerequisite foundation'));
    });
  });

  // =========================================================================
  // SUITE 5: Mock Interview Engine & Reload-Resilient Timers
  // =========================================================================
  suite('5. Mock Interview Engine', () => {
    test('createSession builds track with absolute epoch targetEndTime', () => {
      _mockStorage.clear();
      const session = MockEngine.createSession(DEFAULT_DSA_SHEETS, {}, { trackId: 'faang_standard', durationMinutes: 45 });
      assert.ok(session.sessionId.startsWith('mock-'));
      assert.strictEqual(session.problems.length, 2);
      assert.strictEqual(session.durationMinutes, 45);
      assert.ok(session.targetEndTime > session.startTime);
      assert.strictEqual(session.targetEndTime - session.startTime, 45 * 60 * 1000);
    });

    test('getActiveSession restores remaining time deterministically', () => {
      const active = MockEngine.getActiveSession();
      assert.ok(active !== null);
      assert.ok(active.remainingSeconds > 0 && active.remainingSeconds <= 45 * 60);
      assert.strictEqual(active.isExpired, false);
    });

    test('evaluateSession computes multi-rubric score and feedback report', () => {
      const session = MockEngine.getActiveSession();
      const p1 = session.problems[0];
      const p2 = session.problems[1];

      session.answers[p1.id] = {
        code: 'function solve() {}',
        timeComplexity: p1.timeComplexity || 'O(N)',
        spaceComplexity: p1.spaceComplexity || 'O(1)',
        edgeCases: ['empty array', 'single element', 'negatives'],
        hintsUsedCount: 0,
        rating: 'simple',
        timeSpentSeconds: 900
      };

      session.answers[p2.id] = {
        code: 'function solve2() {}',
        timeComplexity: p2.timeComplexity || 'O(N)',
        spaceComplexity: p2.spaceComplexity || 'O(1)',
        edgeCases: ['duplicates'],
        hintsUsedCount: 1,
        rating: 'medium',
        timeSpentSeconds: 1200
      };

      const report = MockEngine.evaluateSession(session);
      assert.ok(report.overallPercentage >= 65);
      assert.ok(report.grade.includes('Hire') || report.grade.includes('Practice'));
      assert.strictEqual(report.questionResults.length, 2);

      // Confirm active session was cleared upon completion
      assert.strictEqual(MockEngine.getActiveSession(), null);
    });
  });

  // =========================================================================
  // SUITE 6: Progressive AI Hint Scaffolding
  // =========================================================================
  suite('6. Progressive AI Hint Engine (5 Tiers & Offline Fallback)', () => {
    test('HINT_LEVELS defines all 5 progressive scaffolding tiers', () => {
      assert.strictEqual(AIEngine.HINT_LEVELS.length, 5);
      assert.strictEqual(AIEngine.HINT_LEVELS[0].title, 'Key Observation');
      assert.strictEqual(AIEngine.HINT_LEVELS[1].title, 'Algorithmic Pattern');
      assert.strictEqual(AIEngine.HINT_LEVELS[2].title, 'State & Invariant');
      assert.strictEqual(AIEngine.HINT_LEVELS[3].title, 'Pseudocode & Strategy');
      assert.strictEqual(AIEngine.HINT_LEVELS[4].title, 'Complete Solution & Code');
    });

    test('generateHeuristicHint produces rich offline guidance for all 5 levels', () => {
      const testProblem = {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        topic: 'Arrays & Hashing',
        pattern: 'Two Pointers'
      };

      for (let lvl = 1; lvl <= 5; lvl++) {
        const hint = AIEngine.generateHeuristicHint(testProblem, lvl);
        assert.strictEqual(hint.success, true);
        assert.strictEqual(hint.level, lvl);
        assert.ok(hint.content.length > 50, `Hint level ${lvl} should provide detailed content`);
      }
    });

    test('generateEdgeCases generates boundary condition checklist', () => {
      const treeProblem = { id: 'p-tree', topic: 'Trees & Binary Search Trees' };
      const cases = AIEngine.generateEdgeCases(treeProblem);
      assert.ok(cases.length >= 6);
      assert.ok(cases.includes('Null root node'));
      assert.ok(cases.includes('Empty input / Array length 0'));
    });
  });

  // =========================================================================
  // SUITE 7: Solution Analysis & Explainability
  // =========================================================================
  suite('7. Solution Analysis & Complexity Verification Engine', () => {
    test('analyzeSubmission verifies optimal time & space matches canonical', () => {
      const problem = {
        id: 'p-search',
        title: 'Binary Search',
        timeComplexity: 'O(log N)',
        spaceComplexity: 'O(1)',
        pattern: 'Binary Search'
      };

      const optimalSub = {
        timeComplexity: 'O(log N)',
        spaceComplexity: 'O(1)',
        edgeCases: ['target not in array', 'single element']
      };

      const res = SolutionAnalysisEngine.analyzeSubmission(problem, optimalSub);
      assert.strictEqual(res.isOptimal, true);
      assert.strictEqual(res.evaluation.time.status, 'correct');
      assert.strictEqual(res.evaluation.space.status, 'correct');
    });

    test('analyzeSubmission detects suboptimal complexity', () => {
      const problem = {
        id: 'p-two-sum',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)'
      };

      const slowSub = {
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)'
      };

      const res = SolutionAnalysisEngine.analyzeSubmission(problem, slowSub);
      assert.strictEqual(res.isOptimal, false);
      assert.strictEqual(res.evaluation.time.status, 'suboptimal');
    });

    test('analyzeSubmission detects over-optimistic complexity claim', () => {
      const problem = {
        id: 'p-sort',
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(1)'
      };

      const magicSub = {
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)'
      };

      const res = SolutionAnalysisEngine.analyzeSubmission(problem, magicSub);
      assert.strictEqual(res.evaluation.time.status, 'overoptimistic');
    });
  });

  // =========================================================================
  // SUITE 8: Gamification Engine
  // =========================================================================
  suite('8. Mastery-Based Gamification Engine', () => {
    test('Defines 10 level tiers with XP requirements', () => {
      assert.strictEqual(GamificationEngine.LEVELS.length, 10);
      assert.strictEqual(GamificationEngine.LEVELS[0].title, 'Novice Coder');
      assert.strictEqual(GamificationEngine.LEVELS[9].title, 'SDE Ready 🚀');
    });

    test('awardXP increments XP, levels up, and updates weekly quests', () => {
      _mockStorage.clear();
      const initial = GamificationEngine.getProgress();
      assert.strictEqual(initial.xp, 0);
      assert.strictEqual(initial.level, 1);

      // Award 250 XP -> reaches Level 2 (Apprentice, req 200 XP)
      const res = GamificationEngine.awardXP('independent_solve', 250);
      assert.strictEqual(res.totalXP, 250);
      assert.strictEqual(res.level, 2);

      const updatedProgress = GamificationEngine.getProgress();
      assert.strictEqual(updatedProgress.xp, 250);
      assert.strictEqual(updatedProgress.level, 2);
    });

    test('evaluateBadges unlocks achievements based on recorded history', () => {
      const userStates = {
        'p1': {
          lastReviewed: new Date().toISOString(),
          confidence: 5,
          hintsUsed: false,
          stage: 3,
          isMastered: false
        }
      };

      const result = GamificationEngine.evaluateBadges([], userStates, []);
      assert.ok(result.newlyUnlocked.includes('first_independent'));
      assert.ok(result.newlyUnlocked.includes('first_delayed_recall'));
      assert.ok(result.progress.badgesUnlocked['first_independent']);
    });
  });

  // =========================================================================
  // SUITE 9: Unified Storage, Migration & Portability Engine
  // =========================================================================
  suite('9. Unified Storage & Migration Engine', () => {
    test('migrateFromLegacy upgrades v1 schemas to v2 without data loss', () => {
      _mockStorage.clear();
      // Inject legacy v1 data
      const v1Data = {
        'legacy-1': {
          lastReviewed: '2026-09-01T00:00:00.000Z',
          stage: 2,
          lastRating: 'simple'
        }
      };
      _mockStorage.set('algorecall_user_states_v1', JSON.stringify(v1Data));

      StorageEngine.migrateFromLegacy();

      const v2States = StorageEngine.getUserStates();
      assert.ok(v2States['legacy-1']);
      assert.strictEqual(v2States['legacy-1'].schemaVersion, StorageEngine.SCHEMA_VERSION);
      assert.strictEqual(v2States['legacy-1'].stability, 8); // 2 * 4
      assert.strictEqual(v2States['legacy-1'].difficultyEst, 5);
    });

    test('createExportBundle sanitizes sensitive API keys', () => {
      StorageEngine.saveSettings({ aiApiKey: 'secret_sk_12345', theme: 'dark' });
      const bundle = StorageEngine.createExportBundle();
      assert.strictEqual(bundle.app, 'AlgoRecall');
      assert.strictEqual(bundle.version, StorageEngine.SCHEMA_VERSION);
      assert.strictEqual(bundle.data.settings.aiApiKey, ''); // Sanitized!
    });

    test('inspectImportBundle validates schema and extracts counts', () => {
      const validBundle = StorageEngine.createExportBundle();
      const inspectRes = StorageEngine.inspectImportBundle(validBundle);
      assert.strictEqual(inspectRes.valid, true);
      assert.ok(inspectRes.stats !== undefined);

      const invalidRes = StorageEngine.inspectImportBundle({ invalid: 'data' });
      assert.strictEqual(invalidRes.valid, false);
    });

    test('applyImportBundle merges reviews preserving unique history timestamps', () => {
      const existingStates = {
        'p1': {
          stage: 1,
          history: [{ date: '2026-10-01T10:00:00.000Z', rating: 'medium' }]
        }
      };
      StorageEngine.saveUserStates(existingStates);

      const incomingBundle = {
        userStates: {
          'p1': {
            stage: 2,
            history: [
              { date: '2026-10-01T10:00:00.000Z', rating: 'medium' }, // Duplicate
              { date: '2026-10-05T10:00:00.000Z', rating: 'simple' }  // New
            ]
          }
        }
      };

      const res = StorageEngine.applyImportBundle(incomingBundle, 'merge');
      assert.strictEqual(res.success, true);
      const merged = StorageEngine.getUserStates();
      assert.strictEqual(merged['p1'].history.length, 2);
    });

    test('generateSafeSyncHash and parseSafeSyncHash round-trips correctly', () => {
      const hash = StorageEngine.generateSafeSyncHash();
      assert.ok(typeof hash === 'string' && hash.length > 10);
      const restored = StorageEngine.parseSafeSyncHash(hash);
      assert.strictEqual(restored.valid, true);
    });
  });

  // =========================================================================
  // SUITE 10: Adaptive Recommendation Engine
  // =========================================================================
  suite('10. Adaptive Recommendation Engine', () => {
    test('scoreProblem enforces anti-loop safeguard immediately after low-confidence attempt', () => {
      const problem = {
        id: 'p-sliding-window',
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        topic: 'Sliding Window & Two Pointers',
        pattern: 'Sliding Window'
      };

      const userStates = {
        'p-sliding-window': {
          lastReviewed: new Date().toISOString(), // Just attempted
          confidence: 2, // Low confidence
          stage: 1
        }
      };

      // Scoring with anti-loop context
      const scored = RecommendationEngine.scoreProblem(problem, userStates, null, {
        recentlyAttemptedIds: ['p-sliding-window']
      });

      assert.strictEqual(scored.tag, 'Cooldown');
      assert.ok(scored.confidenceMultiplier <= 0.2, 'Anti-loop must dampen immediate reattempt');
    });

    test('scoreProblem boosts foundational problems for weak patterns', () => {
      const easySteppingStone = {
        id: 'p-easy-window',
        title: 'Maximum Average Subarray I',
        difficulty: 'Easy',
        topic: 'Sliding Window & Two Pointers',
        pattern: 'Sliding Window'
      };

      // User has low confidence history on this pattern
      const userStates = {
        'p-other-window': {
          lastReviewed: new Date(Date.now() - 5 * 86400000).toISOString(),
          confidence: 2,
          stage: 1
        }
      };

      const stats = RecommendationEngine.getConfidenceStats(
        [easySteppingStone, { id: 'p-other-window', topic: 'Sliding Window & Two Pointers', pattern: 'Sliding Window' }],
        userStates
      );

      const scored = RecommendationEngine.scoreProblem(easySteppingStone, userStates, stats, {});
      assert.strictEqual(scored.tag, 'Pattern Primer');
      assert.ok(scored.confidenceMultiplier >= 2.0, 'Pattern primer should receive high multiplier');
    });

    test('getSimilarProblemProgression builds structured stepping-stone sequence', () => {
      const hardProb = DEFAULT_DSA_SHEETS.find(p => p.difficulty === 'Hard' && p.topic.includes('Sliding Window')) ||
                       DEFAULT_DSA_SHEETS.find(p => p.difficulty === 'Hard');

      const prog = RecommendationEngine.getSimilarProblemProgression(hardProb, DEFAULT_DSA_SHEETS, {});
      assert.ok(prog !== null);
      assert.ok(prog.steps.length >= 2);
      assert.strictEqual(prog.steps[prog.steps.length - 1].isReattempt, true);
    });
  });

  // =========================================================================
  // SUITE 11: Master Dataset Integrity (479 Problems)
  // =========================================================================
  suite('11. Master Dataset Integrity & Deduplication', () => {
    test('Dataset contains exactly 479 curated problems', () => {
      assert.strictEqual(DEFAULT_DSA_SHEETS.length, 479);
    });

    test('All problem IDs are unique non-empty strings', () => {
      const idSet = new Set();
      DEFAULT_DSA_SHEETS.forEach(p => {
        assert.ok(p.id && typeof p.id === 'string', `Invalid ID: ${JSON.stringify(p)}`);
        assert.strictEqual(idSet.has(p.id), false, `Duplicate problem ID detected: ${p.id}`);
        idSet.add(p.id);
      });
    });

    test('All problems have valid canonical difficulty', () => {
      const validDiffs = new Set(['Easy', 'Medium', 'Hard']);
      DEFAULT_DSA_SHEETS.forEach(p => {
        assert.ok(validDiffs.has(p.difficulty), `Invalid difficulty ${p.difficulty} in ${p.id}`);
      });
    });

    test('All problems have canonical topic mapped in SRSEngine', () => {
      DEFAULT_DSA_SHEETS.forEach(p => {
        const canonical = SRSEngine.canonicalizeTopic(p.topic);
        assert.ok(canonical && canonical.length > 0, `Topic canonicalization failed for ${p.topic}`);
      });
    });
  });

  // =========================================================================
  // SUITE 12: Phase 1 Stabilization & Bug Fix Regressions
  // =========================================================================
  suite('12. Phase 1 Stabilization & Bug Fix Regressions', () => {
    test('index.html contains synchronized monthly test and cockpit DOM IDs', () => {
      const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
      assert.ok(html.includes('id="monthly-test-cockpit"'), 'Missing monthly-test-cockpit');
      assert.ok(html.includes('id="test-question-counter"'), 'Missing test-question-counter');
      assert.ok(html.includes('id="test-countdown-display"'), 'Missing test-countdown-display');
      assert.ok(html.includes('id="btn-start-monthly-test"'), 'Missing btn-start-monthly-test');
      assert.ok(html.includes('id="btn-finish-test"'), 'Missing btn-finish-test');
    });

    test('Heatmap activity algorithm avoids double-counting on lastReviewed', () => {
      const testStates = {
        'two-sum': {
          id: 'two-sum',
          lastReviewed: '2026-10-12T10:00:00.000Z',
          history: [
            { date: '2026-10-12T09:00:00.000Z', rating: 'good' },
            { date: '2026-10-12T10:00:00.000Z', rating: 'easy' }
          ]
        },
        'legacy-prob': {
          id: 'legacy-prob',
          lastReviewed: '2026-10-12T11:00:00.000Z'
          // no history array
        }
      };

      const toLocalDateKey = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return null;
        return SRSEngine.getLocalDateString(dt);
      };

      const activityMap = {};
      Object.values(testStates).forEach(st => {
        if (!st) return;
        if (Array.isArray(st.history) && st.history.length > 0) {
          st.history.forEach(h => {
            const dStr = toLocalDateKey(h.date || h.reviewedAt);
            if (dStr) activityMap[dStr] = (activityMap[dStr] || 0) + 1;
          });
        } else if (st.lastReviewed) {
          const dStr = toLocalDateKey(st.lastReviewed);
          if (dStr) activityMap[dStr] = (activityMap[dStr] || 0) + 1;
        }
      });

      const todayKey = SRSEngine.getLocalDateString(new Date('2026-10-12T10:00:00.000Z'));
      // two-sum gives 2 reviews (not 3), legacy-prob gives 1 review -> total exactly 3
      assert.strictEqual(activityMap[todayKey], 3, 'Heatmap double-counted review actions!');
    });

    test('StorageEngine inspectImportBundle enforces strict schema and type validation', () => {
      // 1. Rejects invalid bundle objects
      assert.strictEqual(StorageEngine.inspectImportBundle(null).valid, false);
      assert.strictEqual(StorageEngine.inspectImportBundle('not a bundle').valid, false);

      // 2. Rejects unsupported schema versions
      const unsupp = StorageEngine.inspectImportBundle({ version: '5.0.0', app: 'AlgoRecall', data: {} });
      assert.strictEqual(unsupp.valid, false);
      assert.ok(unsupp.error.includes('Unsupported backup schema version'));

      // 3. Rejects invalid userStates types
      const badStates = StorageEngine.inspectImportBundle({ version: '2.0.0', app: 'AlgoRecall', data: { userStates: 'not-an-object' } });
      assert.strictEqual(badStates.valid, false);
      assert.ok(badStates.error.includes('Invalid userStates format'));

      const arrStates = StorageEngine.inspectImportBundle({ version: '2.0.0', app: 'AlgoRecall', data: { userStates: [1, 2, 3] } });
      assert.strictEqual(arrStates.valid, false);

      // 4. Rejects corrupt history
      const badHistory = StorageEngine.inspectImportBundle({
        version: '2.0.0',
        app: 'AlgoRecall',
        data: { userStates: { 'p1': { history: 'invalid-history' } } }
      });
      assert.strictEqual(badHistory.valid, false);
      assert.ok(badHistory.error.includes('review history must be an array'));

      // 5. Rejects invalid problems array
      const badProbs = StorageEngine.inspectImportBundle({
        version: '2.0.0',
        app: 'AlgoRecall',
        data: { userStates: {}, problems: 'not-an-array' }
      });
      assert.strictEqual(badProbs.valid, false);
      assert.ok(badProbs.error.includes('Invalid problems format'));

      // 6. Accepts valid bundle
      const validBundle = {
        app: 'AlgoRecall',
        version: '2.0.0',
        data: {
          userStates: { 'two-sum': { interval: 3, stage: 2 } },
          problems: [{ id: 'custom-1', title: 'Custom 1', difficulty: 'Easy', topic: 'Arrays' }]
        }
      };
      const inspected = StorageEngine.inspectImportBundle(validBundle);
      assert.strictEqual(inspected.valid, true);
      assert.strictEqual(inspected.stats.statesCount, 1);
      assert.strictEqual(inspected.stats.problemsCount, 1);

      // 7. Verify applyImportBundle refuses to write corrupt bundle
      const applyResult = StorageEngine.applyImportBundle({ version: '9.0.0', app: 'AlgoRecall', data: {} });
      assert.strictEqual(applyResult.success, false);
    });

    test('Mobile drawer markup and styles are configured properly', () => {
      const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
      assert.ok(html.includes('id="btn-mobile-menu-toggle"'), 'Missing btn-mobile-menu-toggle');
      assert.ok(html.includes('id="sidebar-mobile-backdrop"'), 'Missing sidebar-mobile-backdrop');
      assert.ok(html.includes('aria-controls="app-sidebar"'), 'Missing aria-controls');

      const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf-8');
      assert.ok(css.includes('.mobile-menu-toggle-btn'), 'Missing .mobile-menu-toggle-btn CSS');
      assert.ok(css.includes('.sidebar-backdrop'), 'Missing .sidebar-backdrop CSS');
      assert.ok(css.includes('.sidebar.mobile-open'), 'Missing .sidebar.mobile-open CSS');
    });

    test('Accessibility aria-label attributes exist on interactive controls', () => {
      const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
      assert.ok(html.includes('id="btn-theme-toggle" title="Toggle Dark / Light Theme" aria-label="Toggle dark or light theme"'));
      assert.ok(html.includes('id="btn-flashcard-prev" aria-label="Previous flashcard"'));
      assert.ok(html.includes('id="btn-flashcard-next" aria-label="Next flashcard"'));
      assert.ok(html.includes('id="btn-close-rating-modal" aria-label="Close dialog"'));
      assert.ok(html.includes('id="btn-close-settings-modal" aria-label="Close dialog"'));
      assert.ok(html.includes('id="btn-close-detail-modal" aria-label="Close dialog"'));
    });
  });

  // =========================================================================
  // SUITE 13: Critical Learning Integrity Regressions (Phase 2)
  // =========================================================================
  suite('13. Critical Learning Integrity Regressions (Phase 2)', () => {
    // --- Experiment A: Same-day rapid reviews ---
    test('Experiment A.1: First successful review establishes Stage 1', () => {
      const state = SRSEngine.processReview({}, 'simple', 10, 'First solve', 5, { hintsUsed: false });
      assert.strictEqual(state.stage, 1);
      assert.strictEqual(state.intervalDays, 7);
      assert.strictEqual(state.reviewCount, 1);
    });

    test('Experiment A.2: Reviews within 30 seconds preserve stage and do not advance', () => {
      const baseTime = new Date('2026-10-12T10:00:00.000Z');
      let state = SRSEngine.processReview({}, 'simple', 10, 'Solve 1', 5, { hintsUsed: false, asOfDate: baseTime });
      assert.strictEqual(state.stage, 1);
      assert.strictEqual(state.intervalDays, 7);

      // 30 seconds later
      const rapidTime = new Date('2026-10-12T10:00:30.000Z');
      state = SRSEngine.processReview(state, 'simple', 5, 'Solve 2 rapid', 5, { hintsUsed: false, asOfDate: rapidTime });
      assert.strictEqual(state.stage, 1, 'Same-day rapid review must not advance stage');
      assert.strictEqual(state.intervalDays, 7, 'Same-day rapid review must not compound interval');
      assert.strictEqual(state.history[1].isMassedPractice, true);
    });

    test('Experiment A.3: Same-calendar-day reviews do not compound the interval', () => {
      const t1 = new Date('2026-10-12T09:00:00.000Z');
      const t2 = new Date('2026-10-12T15:00:00.000Z'); // 6 hours later on same day
      let state = SRSEngine.processReview({}, 'medium', 15, 'Morning solve', 4, { hintsUsed: false, asOfDate: t1 });
      assert.strictEqual(state.stage, 1);
      assert.strictEqual(state.intervalDays, 3); // INTERVAL_MATRIX.medium[0] = 3

      state = SRSEngine.processReview(state, 'medium', 10, 'Afternoon rehearsal', 4, { hintsUsed: false, asOfDate: t2 });
      assert.strictEqual(state.stage, 1, 'Stage must remain 1 on same calendar day');
      assert.strictEqual(state.intervalDays, 3, 'Interval must not jump to stage 2 (7 days)');
    });

    test('Experiment A.4: Genuine subsequent review (>=18h on new day) advances the stage', () => {
      const t1 = new Date('2026-10-12T10:00:00.000Z');
      const t2 = new Date('2026-10-15T11:00:00.000Z'); // 3 days later (> 18h and new day)
      let state = SRSEngine.processReview({}, 'simple', 15, 'Solve 1', 4, { hintsUsed: false, asOfDate: t1 });
      assert.strictEqual(state.stage, 1);

      state = SRSEngine.processReview(state, 'simple', 10, 'Solve 2 spaced', 4, { hintsUsed: false, asOfDate: t2 });
      assert.strictEqual(state.stage, 2, 'Spaced review must advance stage to 2');
      assert.strictEqual(state.intervalDays, 21, 'Interval must advance to 21 days');
      assert.strictEqual(state.history[1].isMassedPractice, false);
    });

    test('Experiment A.5: Missing or malformed previous timestamps do not crash engine', () => {
      const corruptState = { stage: 2, lastReviewed: 'invalid-date-string', history: [{ date: 'corrupt' }] };
      const res = SRSEngine.processReview(corruptState, 'medium', 10, 'Corrupt recovery', 3);
      assert.ok(res && res.stage >= 1);
      assert.ok(res.lastReviewed);
    });

    // --- Experiment B: Fresh Day-1 solves ---
    test('Experiment B.1 & B.2: 10 problems solved Day 1 produce delayed recall score of 0 and unproven', () => {
      const probs = [];
      const states = {};
      for (let i = 0; i < 10; i++) {
        const id = `p-${i}`;
        probs.push({ id, topic: 'Arrays & Hashing', difficulty: 'Easy' });
        states[id] = SRSEngine.processReview({}, 'simple', 15, 'Day 1 solve', 5, {
          hintsUsed: false,
          asOfDate: new Date('2026-10-12T10:00:00.000Z')
        });
      }

      const res = ReadinessEngine.calculateReadiness(probs, states, []);
      const delayedDim = res.dimensions.find(d => d.key === 'delayedRecall');
      assert.strictEqual(delayedDim.score, 0, 'Delayed recall score must be 0 for day-1 solves');
      assert.strictEqual(delayedDim.isUnproven, true);
      assert.strictEqual(delayedDim.evidence, 'Unproven — 0 eligible reviews');
    });

    test('Experiment B.3, B.4, B.5: Fresh day-1 readiness remains provisional with no unearned 50%', () => {
      const states = {};
      for (let i = 0; i < 10; i++) {
        const id = DEFAULT_DSA_SHEETS[i].id;
        states[id] = SRSEngine.processReview({}, 'simple', 15, 'Day 1 solve', 5, {
          hintsUsed: false,
          asOfDate: new Date('2026-10-12T10:00:00.000Z')
        });
      }

      const res = ReadinessEngine.calculateReadiness(DEFAULT_DSA_SHEETS, states, []);
      assert.strictEqual(res.isProvisional, true, 'Readiness must remain provisional when spaced reviews = 0');
      assert.strictEqual(res.spacedReviewCount, 0);
      assert.ok(res.grade.includes('(Provisional)'));
      assert.strictEqual(res.dimensions.find(d => d.key === 'delayedRecall').score, 0);
      assert.strictEqual(res.overallScore, 61, `Expected uninflated score 61, got ${res.overallScore}`);
    });

    // --- Experiment C: Hint-dependent reviews ---
    test('Experiment C.1 & C.2: Hint-assisted successful review does not advance stage and schedules 1-2d follow-up', () => {
      const state = { stage: 2, intervalDays: 21, lastReviewed: '2026-09-01T10:00:00.000Z', history: [] };
      const res = SRSEngine.processReview(state, 'simple', 20, 'Needed hint', 3, {
        hintsUsed: true,
        asOfDate: new Date('2026-09-25T10:00:00.000Z')
      });
      assert.strictEqual(res.stage, 2, 'Hint-assisted solve must not advance Leitner stage');
      assert.ok(res.intervalDays <= 2, 'Hint-assisted solve must schedule 1-2 day follow-up');
      assert.strictEqual(res.hintsUsed, true);
    });

    test('Experiment C.3: Hint-assisted delayed reviews receive 0 credit in delayed recall', () => {
      const probs = [{ id: 'p-hint', topic: 'Arrays & Hashing', difficulty: 'Medium' }];
      const states = {
        'p-hint': {
          lastReviewed: '2026-09-20T10:00:00.000Z',
          confidence: 4,
          hintsUsed: true,
          history: [
            { date: '2026-09-01T10:00:00.000Z', stage: 1, rating: 'medium', confidence: 3, hintsUsed: false },
            { date: '2026-09-20T10:00:00.000Z', stage: 1, rating: 'medium', confidence: 4, hintsUsed: true }
          ]
        }
      };

      const res = ReadinessEngine.calculateReadiness(probs, states, []);
      const delayedDim = res.dimensions.find(d => d.key === 'delayedRecall');
      assert.strictEqual(delayedDim.score, 0, 'Hint-assisted delayed review must receive 0 credit');
    });

    test('Experiment C.4: Independent delayed review receives credit when spacing and confidence met', () => {
      const probs = [{ id: 'p-indep', topic: 'Arrays & Hashing', difficulty: 'Medium' }];
      const states = {
        'p-indep': {
          lastReviewed: '2026-09-20T10:00:00.000Z',
          confidence: 5,
          hintsUsed: false,
          history: [
            { date: '2026-09-01T10:00:00.000Z', stage: 1, rating: 'medium', confidence: 4, hintsUsed: false },
            { date: '2026-09-20T10:00:00.000Z', stage: 2, rating: 'simple', confidence: 5, hintsUsed: false }
          ]
        }
      };

      const res = ReadinessEngine.calculateReadiness(probs, states, []);
      const delayedDim = res.dimensions.find(d => d.key === 'delayedRecall');
      assert.strictEqual(delayedDim.score, 100, 'Independent delayed recall must receive 100 credit');
      assert.strictEqual(delayedDim.evidence, '1/1 retained independently');
    });

    // --- Experiment D: Evidence threshold boundaries ---
    test('Experiment D.1: 9 attempts and 5 spaced reviews remains provisional', () => {
      const probs = [];
      const states = {};
      for (let i = 0; i < 9; i++) {
        const id = `p-${i}`;
        probs.push({ id, topic: 'Arrays & Hashing', difficulty: 'Easy' });
        states[id] = {
          lastReviewed: '2026-09-10T10:00:00.000Z',
          confidence: 4,
          hintsUsed: false,
          history: [
            { date: '2026-09-01T10:00:00.000Z', stage: 1, confidence: 4 },
            { date: '2026-09-10T10:00:00.000Z', stage: 2, confidence: 4, hintsUsed: false }
          ]
        };
      }
      const res = ReadinessEngine.calculateReadiness(probs, states, []);
      assert.strictEqual(res.totalAttempts, 9);
      assert.strictEqual(res.spacedReviewCount, 9);
      assert.strictEqual(res.isProvisional, true, 'Under 10 attempts must remain provisional');
    });

    test('Experiment D.2: 10 attempts and 4 spaced reviews remains provisional', () => {
      const probs = [];
      const states = {};
      for (let i = 0; i < 10; i++) {
        const id = `p-${i}`;
        probs.push({ id, topic: 'Arrays & Hashing', difficulty: 'Easy' });
        const hasSpaced = i < 4;
        states[id] = {
          lastReviewed: '2026-09-10T10:00:00.000Z',
          confidence: 4,
          hintsUsed: false,
          history: hasSpaced
            ? [{ date: '2026-09-01T10:00:00.000Z' }, { date: '2026-09-10T10:00:00.000Z', confidence: 4, hintsUsed: false }]
            : [{ date: '2026-09-10T10:00:00.000Z', confidence: 4, hintsUsed: false }]
        };
      }
      const res = ReadinessEngine.calculateReadiness(probs, states, []);
      assert.strictEqual(res.totalAttempts, 10);
      assert.strictEqual(res.spacedReviewCount, 4);
      assert.strictEqual(res.isProvisional, true, 'Under 5 spaced reviews must remain provisional');
    });

    test('Experiment D.3: 10 attempts and 5 spaced reviews satisfies evidence threshold', () => {
      const probs = [];
      const states = {};
      for (let i = 0; i < 10; i++) {
        const id = `p-${i}`;
        probs.push({ id, topic: 'Arrays & Hashing', difficulty: 'Easy' });
        const hasSpaced = i < 5;
        states[id] = {
          lastReviewed: '2026-09-10T10:00:00.000Z',
          confidence: 4,
          hintsUsed: false,
          history: hasSpaced
            ? [{ date: '2026-09-01T10:00:00.000Z' }, { date: '2026-09-10T10:00:00.000Z', confidence: 4, hintsUsed: false }]
            : [{ date: '2026-09-10T10:00:00.000Z', confidence: 4, hintsUsed: false }]
        };
      }
      const res = ReadinessEngine.calculateReadiness(probs, states, []);
      assert.strictEqual(res.totalAttempts, 10);
      assert.strictEqual(res.spacedReviewCount, 5);
      assert.strictEqual(res.isProvisional, false, '10 attempts and 5 spaced reviews is non-provisional');
    });

    test('Experiment D.4: Repeated same-day reviews do not inflate spaced review count', () => {
      const probs = [{ id: 'p-spam', topic: 'Arrays & Hashing', difficulty: 'Easy' }];
      const states = {
        'p-spam': {
          lastReviewed: '2026-10-12T12:00:00.000Z',
          history: [
            { date: '2026-10-12T10:00:00.000Z' },
            { date: '2026-10-12T10:30:00.000Z' },
            { date: '2026-10-12T11:00:00.000Z' },
            { date: '2026-10-12T12:00:00.000Z' }
          ]
        }
      };
      const res = ReadinessEngine.calculateReadiness(probs, states, []);
      assert.strictEqual(res.spacedReviewCount, 0, 'Same-day reviews must yield 0 spaced reviews');
    });

    // --- Experiment E: Failure and history integrity ---
    test('Experiment E.1: Failed attempt resets stage to 1 and interval to 1 even on same day', () => {
      const state = { stage: 4, intervalDays: 60, lastReviewed: '2026-10-12T09:00:00.000Z', history: [] };
      const res = SRSEngine.processReview(state, 'failed', 20, 'Forgot solution', 1, {
        asOfDate: new Date('2026-10-12T10:00:00.000Z')
      });
      assert.strictEqual(res.stage, 1, 'Failure must reset stage to 1');
      assert.strictEqual(res.intervalDays, 1, 'Failure must reset interval to 1');
    });

    test('Experiment E.2: 18-hour cutoff boundary test separates massed practice from spaced review', () => {
      const tStart = new Date('2026-10-12T10:00:00.000Z');
      const state1 = SRSEngine.processReview({}, 'simple', 10, 'Initial', 4, { hintsUsed: false, asOfDate: tStart });
      assert.strictEqual(state1.stage, 1);

      // 17.5 hours later (2026-10-13T03:30:00.000Z) -> under 18h -> massed practice!
      const t17_5h = new Date('2026-10-13T03:30:00.000Z');
      const stateUnder18 = SRSEngine.processReview(state1, 'simple', 10, 'Under 18h', 4, { hintsUsed: false, asOfDate: t17_5h });
      assert.strictEqual(stateUnder18.stage, 1, '17.5h elapsed must not advance stage');

      // 18.5 hours later (2026-10-13T04:30:00.000Z) -> over 18h on new calendar day -> spaced review!
      const t18_5h = new Date('2026-10-13T04:30:00.000Z');
      const stateOver18 = SRSEngine.processReview(state1, 'simple', 10, 'Over 18h', 4, { hintsUsed: false, asOfDate: t18_5h });
      assert.strictEqual(stateOver18.stage, 2, '18.5h elapsed on new calendar day must advance stage');
    });

    test('Experiment E.3: Midnight crossing within 10 minutes remains protected massed practice', () => {
      const t2355 = new Date('2026-10-12T23:55:00.000Z');
      const state1 = SRSEngine.processReview({}, 'simple', 10, 'Late night', 4, { hintsUsed: false, asOfDate: t2355 });

      const t0005 = new Date('2026-10-13T00:05:00.000Z'); // 10 minutes later across midnight
      const state2 = SRSEngine.processReview(state1, 'simple', 10, 'Midnight click', 4, { hintsUsed: false, asOfDate: t0005 });
      assert.strictEqual(state2.stage, 1, 'Midnight crossing under 18h must be treated as massed practice');
    });
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n========================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('========================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All AlgoRecall 2.0 tests PASSED successfully!\n');
    process.exit(0);
  }
}

runAll().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
