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

    test('processReview advances stage and clamps intervals when hints used', () => {
      const state = { stage: 1, stability: 3, history: [] };
      const resNoHints = SRSEngine.processReview(state, 'simple', 15, 'Clear solution', 4, { hintsUsed: false });
      assert.strictEqual(resNoHints.stage, 2);
      assert.strictEqual(resNoHints.intervalDays, 21); // INTERVAL_MATRIX.simple[1]

      const resWithHints = SRSEngine.processReview(state, 'simple', 15, 'Needed help', 3, { hintsUsed: true });
      assert.strictEqual(resWithHints.stage, 2);
      assert.ok(resWithHints.intervalDays <= 11, 'Hints used must clamp interval progression');
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
      assert.strictEqual(res.grade, 'Foundations Needed');
    });

    test('calculateReadiness balances all 6 dimensions with empirical weights', () => {
      const probs = [];
      const states = {};
      const topics = ['Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Trees', 'Graphs'];

      // Generate 12 independent, well-timed solves
      for (let i = 0; i < 12; i++) {
        const id = `prob-${i}`;
        probs.push({ id, difficulty: 'Medium', topic: topics[i % topics.length], pattern: 'Pattern' });
        states[id] = {
          lastReviewed: new Date().toISOString(),
          confidence: 4,
          hintsUsed: false,
          totalTimeSpent: 25,
          reviewCount: 1,
          stage: 2,
          history: [
            { stage: 2, rating: 'medium', confidence: 4, failureReasons: [] }
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
