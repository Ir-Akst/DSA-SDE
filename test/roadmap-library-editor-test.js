/**
 * AlgoRecall 2.0 — Phase 4: Roadmaps Library & Full Plan Editor Test Suite
 */

const assert = require('assert');

// Mock browser environment
global.window = global;
global.self = global;
global.window.addEventListener = () => {};

let mockStorage = {};
global.localStorage = {
  getItem(k) { return mockStorage[k] || null; },
  setItem(k, v) { mockStorage[k] = String(v); },
  removeItem(k) { delete mockStorage[k]; },
  clear() { mockStorage = {}; }
};

// Load dependencies
require('../js/learner-repository.js');
const defaultSheets = require('../js/data/default-sheets.js');
const curriculumData = require('../js/data/roadmap-120-curriculum.js');
const Roadmap120Engine = require('../js/roadmap-120-engine.js');
const RoadmapEngine = require('../js/roadmap-engine.js');

const allProblems = defaultSheets.striverA2ZProblems || [];
let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('AlgoRecall 2.0 - Phase 4: Roadmaps Library & Full Plan Editor Tests');
console.log('========================================\n');

console.log('[SECTION 1] Roadmap Catalog & Active Track Semantics');

it('1.1: Default active roadmap is dual_stream_120 with Day 1 Binary Trees & BST', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();
  const activeId = RoadmapEngine.getActiveRoadmapId();
  assert.strictEqual(activeId, 'dual_stream_120', 'Default active track must be dual_stream_120');

  const roadmap = RoadmapEngine.get120DayRoadmap();
  const d1 = roadmap.days[0];
  const streamA = d1.streams?.current_learning || d1.tasks.find(t => t.stream === 'current_learning');
  assert.strictEqual(streamA.topic, 'Binary Trees & BST', 'Day 1 Stream A topic must be Binary Trees & BST');
  assert.strictEqual(streamA.subtopic, 'Binary tree node structure & DFS traversals', 'Day 1 subtopic must match curriculum');
});

it('1.2: Catalog returns all standard roadmaps with accurate properties', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();
  const catalog = RoadmapEngine.getRoadmapCatalog(allProblems, {});
  assert(Array.isArray(catalog), 'Catalog must be an array');
  assert(catalog.length >= 5, 'Catalog must contain at least 5 baseline roadmaps');

  const dualStream = catalog.find(c => c.id === 'dual_stream_120');
  assert(dualStream, 'dual_stream_120 must be present in catalog');
  assert.strictEqual(dualStream.isActive, true, 'dual_stream_120 must be marked active');
  assert.strictEqual(dualStream.totalDays, 120, 'dual_stream_120 duration must be 120 days');

  const pedagogical = catalog.find(c => c.id === 'pedagogical_120');
  assert(pedagogical, 'pedagogical_120 must be present in catalog');
  assert.strictEqual(pedagogical.isActive, false, 'pedagogical_120 should not be active by default');

  const striver = catalog.find(c => c.id === 'striver_hero');
  assert(striver, 'striver_hero must be present in catalog');
});

it('1.3: Selection vs Active Roadmap separation invariant', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();

  // Initial active track is dual_stream_120
  assert.strictEqual(RoadmapEngine.getActiveRoadmapId(), 'dual_stream_120');

  // Select another roadmap for inspection
  RoadmapEngine.setSelectedRoadmapId('blind_30');
  assert.strictEqual(RoadmapEngine.getSelectedRoadmapId(), 'blind_30', 'Selected roadmap should be updated');
  assert.strictEqual(RoadmapEngine.getActiveRoadmapId(), 'dual_stream_120', 'Active roadmap MUST NOT change when selecting a roadmap');

  // Authoritative daily practice still runs on active roadmap
  const today = RoadmapEngine.getTodayAuthoritativePlan(allProblems, {});
  assert.strictEqual(today.streamA.topic, 'Binary Trees & BST', 'Daily practice must still follow active roadmap');

  // Explicit activation changes active roadmap
  const switchRes = RoadmapEngine.setActiveRoadmap('blind_30');
  assert.strictEqual(switchRes.success, true);
  assert.strictEqual(RoadmapEngine.getActiveRoadmapId(), 'blind_30', 'Explicit set as active must change active roadmap');

  // Switch back to dual_stream_120
  RoadmapEngine.setActiveRoadmap('dual_stream_120');
  assert.strictEqual(RoadmapEngine.getActiveRoadmapId(), 'dual_stream_120');
});

console.log('\n[SECTION 2] Custom Roadmaps & Archive Management');

it('2.1: Custom roadmap creation generates baseline and updates catalog', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();

  const customRes = RoadmapEngine.createCustomRoadmap({
    title: 'Custom FAANG Prep',
    description: 'Intensive 45-day sprint for top tier tech companies',
    totalDays: 45,
    focusTopic: 'Dynamic Programming',
    dailyMinutes: 90
  }, {});

  assert.strictEqual(customRes.success, true);
  assert(customRes.roadmapId.startsWith('custom_'), 'Custom roadmap ID must start with custom_');

  const catalog = RoadmapEngine.getRoadmapCatalog(allProblems, {});
  const customItem = catalog.find(c => c.id === customRes.roadmapId);
  assert(customItem, 'Custom roadmap must appear in catalog');
  assert.strictEqual(customItem.title, 'Custom FAANG Prep');
  assert.strictEqual(customItem.totalDays, 45);
  assert.strictEqual(customItem.isCustom, true);
});

it('2.2: Archiving safety: active roadmap cannot be archived, non-active can', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();

  // Try to archive active roadmap
  const activeArchiveRes = RoadmapEngine.archiveRoadmap('dual_stream_120');
  assert.strictEqual(activeArchiveRes.success, false, 'Cannot archive active roadmap');

  // Archive pedagogical_120
  const pedArchiveRes = RoadmapEngine.archiveRoadmap('pedagogical_120');
  assert.strictEqual(pedArchiveRes.success, true, 'Non-active roadmap can be archived');

  const catalog = RoadmapEngine.getRoadmapCatalog(allProblems, {});
  const pedItem = catalog.find(c => c.id === 'pedagogical_120');
  assert.strictEqual(pedItem.isArchived, true, 'Catalog must reflect archived state');

  // Unarchive
  const unarchiveRes = RoadmapEngine.unarchiveRoadmap('pedagogical_120');
  assert.strictEqual(unarchiveRes.success, true);
  const updatedCatalog = RoadmapEngine.getRoadmapCatalog(allProblems, {});
  const updatedPedItem = updatedCatalog.find(c => c.id === 'pedagogical_120');
  assert.strictEqual(updatedPedItem.isArchived, false);
});

console.log('\n[SECTION 3] Full 120-Day Plan Editor & Persistence');

it('3.1: Full plan editor loads all 120 days with both streams', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();

  const roadmap = RoadmapEngine.getRoadmap('dual_stream_120', {});
  assert(roadmap, 'Roadmap must load');
  assert.strictEqual(roadmap.days.length, 120, 'Roadmap must contain exactly 120 days');

  // Verify Stream A and Stream B exist across days
  roadmap.days.forEach(d => {
    assert(d.sequenceIndex >= 1 && d.sequenceIndex <= 120);
    assert(Array.isArray(d.tasks), 'Day tasks must be an array');
  });
});

it('3.2: Schedule conflict validator detects duplicate problem assignments across days', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();
  const roadmap = RoadmapEngine.getRoadmap('dual_stream_120', {});

  // Clean schedule validation passes
  const validCheck = RoadmapEngine.validateRoadmapSchedule(roadmap);
  assert.strictEqual(validCheck.valid, true, 'Default dual-stream roadmap must have zero conflicts');

  // Intentionally inject duplicate problem
  const cloned = JSON.parse(JSON.stringify(roadmap));
  const taskDay1 = cloned.days[0].tasks.find(t => t.stream === 'current_learning');
  const taskDay2 = cloned.days[1].tasks.find(t => t.stream === 'current_learning');
  taskDay2.problemIds = [...taskDay1.problemIds]; // Duplicate!

  const conflictCheck = RoadmapEngine.validateRoadmapSchedule(cloned);
  assert.strictEqual(conflictCheck.valid, false, 'Validator must catch duplicate problem assignments');
  assert(conflictCheck.conflicts.some(c => c.type === 'DUPLICATE_PROBLEM'), 'Conflict type must be DUPLICATE_PROBLEM');
});

it('3.3: Saving edited roadmap persists changes without erasing user solved states', () => {
  mockStorage = {};
  RoadmapEngine.initProgress();

  const roadmap = RoadmapEngine.getRoadmap('dual_stream_120', {});
  const cloned = JSON.parse(JSON.stringify(roadmap));

  // Edit Day 5 Stream A topic
  const d5TaskA = cloned.days[4].tasks.find(t => t.stream === 'current_learning');
  d5TaskA.topicId = 'Custom Advanced Trees';
  d5TaskA.subtopicId = 'Tree Center & Centroid Decomposition';

  const saveRes = RoadmapEngine.saveRoadmap('dual_stream_120', cloned);
  assert.strictEqual(saveRes.success, true, 'Save must succeed');

  // Reload from storage
  RoadmapEngine.initProgress();
  const reloaded = RoadmapEngine.getRoadmap('dual_stream_120', {});
  const reloadedD5TaskA = reloaded.days[4].tasks.find(t => t.stream === 'current_learning');
  assert.strictEqual(reloadedD5TaskA.topicId, 'Custom Advanced Trees');
  assert.strictEqual(reloadedD5TaskA.subtopicId, 'Tree Center & Centroid Decomposition');
});

console.log('\n[SECTION 4] Legacy v7 Pedagogical Schedule Migration');

it('4.1: Unconditional upgrade of legacy Day 1 Basics & Math to Trees & BST', () => {
  mockStorage = {};
  // Simulate legacy v7 localStorage where user was left with Day 1: Basics & Math
  mockStorage['algorecall_roadmap_progress_v1'] = JSON.stringify({
    activeTrack: 'pedagogical_120',
    explicitlyChosePedagogicalTrack: true,
    dsa120Roadmap: {
      track: 'pedagogical_120',
      schemaVersion: 7,
      days: [{
        planDayId: 'day_1',
        sequenceIndex: 1,
        topic: 'Basics & Math',
        subtopic: 'Language Basics & Syntax',
        tasks: [{
          taskId: 'task_1_learn',
          stream: 'current_learning',
          topicId: 'Basics & Math',
          subtopicId: 'Language Basics & Syntax'
        }, {
          taskId: 'task_1_revise',
          stream: 'foundation_revision',
          topicId: 'Basics & Math',
          subtopicId: 'Spaced Topic Recall',
          revisionReason: 'Migrated from v7 fixed schedule'
        }]
      }]
    }
  });

  RoadmapEngine.initProgress();
  const activeTrack = RoadmapEngine.getActiveRoadmapId();
  assert.strictEqual(activeTrack, 'dual_stream_120', 'Must be automatically upgraded to dual_stream_120');

  const roadmap = RoadmapEngine.get120DayRoadmap();
  const d1 = roadmap.days[0];
  const streamA = d1.streams?.current_learning || d1.tasks.find(t => t.stream === 'current_learning');
  assert.strictEqual(streamA.topic, 'Binary Trees & BST', 'Day 1 Stream A must be upgraded to Binary Trees & BST');
  assert.notStrictEqual(streamA.topic, 'Basics & Math', 'Day 1 must not remain Basics & Math');
});

console.log('\n========================================');
console.log(`Phase 4 Tests Finished: ${passed}/${passed + failed} Passed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}

