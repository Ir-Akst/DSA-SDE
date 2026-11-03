/**
 * AlgoRecall — 120-Day Dual-Stream Curriculum Builder
 * Generates js/data/roadmap-120-curriculum.js
 *
 * Preserves PEDAGOGICAL_120 and TAXONOMY_AUDIT for pedagogical_120 track.
 * Builds STREAM_A (Trees -> Graphs -> DP -> Greedy -> Remaining -> Final) with buffer days.
 * Builds STREAM_B (Arrays -> BS -> LL -> Stack -> Heap -> Recursion -> Backtracking -> Mixed) with buffer days.
 * Buffer days: calendar positions 8,16,24,32,40,48,56,64,72,80,88 (days 1-90).
 * Final phase: days 91-120.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. Load catalog and backup for legacy pedagogical & taxonomy data
// ---------------------------------------------------------------------------
const sheets = require('../js/data/default-sheets.js');
const CATALOG = Object.values(sheets);

const backupFile = fs.readdirSync(path.join(__dirname, '..', 'js', 'data'))
  .filter(f => f.includes('roadmap-120-curriculum.js.bak-'))
  .sort()
  .pop();

if (!backupFile) {
  console.error('Backup file not found!');
  process.exit(1);
}

const backupPath = path.join(__dirname, '..', 'js', 'data', backupFile);
const backupData = require(backupPath);
const PEDAGOGICAL_120 = backupData.PEDAGOGICAL_120;
const TAXONOMY_AUDIT = backupData.TAXONOMY_AUDIT;

console.log(`Loaded from backup: ${backupFile}`);
console.log(`PEDAGOGICAL_120 length: ${PEDAGOGICAL_120 ? PEDAGOGICAL_120.length : 0}`);
console.log(`TAXONOMY_AUDIT length: ${TAXONOMY_AUDIT ? TAXONOMY_AUDIT.length : 0}`);

// Build a lookup by topic -> ordered IDs
function getTopicIds(topicName) {
  return CATALOG.filter(p => p.topic === topicName).map(p => p.id);
}

// ---------------------------------------------------------------------------
// 2. Problem pools (in curriculum order)
// ---------------------------------------------------------------------------
const POOL = {
  BST:       getTopicIds('Binary Trees & BST'),          // 49
  Graphs:    getTopicIds('Graphs'),                      // 35
  DP:        getTopicIds('Dynamic Programming'),          // 60
  Greedy:    getTopicIds('Greedy & Intervals'),           // 21
  RecBack:   getTopicIds('Recursion & Backtracking'),     // 22
  Heap:      getTopicIds('Heap / Priority Queue'),        // 21
  Tries:     getTopicIds('Tries'),                        // 17
  // Revision pools
  Arrays:    getTopicIds('Arrays & Hashing'),             // 40
  BinSearch: getTopicIds('Binary Search'),                // 30
  LinkedL:   getTopicIds('Linked List'),                  // 34
  StackQ:    getTopicIds('Stack & Queue'),                // 27
  HeapRev:   getTopicIds('Heap / Priority Queue'),        // 21
  RecRev:    getTopicIds('Recursion & Backtracking'),     // 22
  Sorting:   getTopicIds('Sorting'),                      // 13
  Strings:   getTopicIds('Strings'),                      // 23
  BitManip:  getTopicIds('Bit Manipulation'),             // 20
  Basics:    getTopicIds('Basics & Math'),                // 42
  SlidWin:   getTopicIds('Sliding Window & Two Pointers'),// 25
};

// ---------------------------------------------------------------------------
// 3. Calendar structure
// ---------------------------------------------------------------------------
const BUFFER_DAYS = new Set([8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88]);

function buildCalendarMap() {
  const map = [];
  let learningDay = 0;
  for (let d = 1; d <= 90; d++) {
    const isBuffer = BUFFER_DAYS.has(d);
    if (!isBuffer) learningDay++;
    map[d] = { calDay: d, isBuffer, learningDay: isBuffer ? null : learningDay };
  }
  return map;
}

const CAL_MAP = buildCalendarMap(); // 79 learning days total

// ---------------------------------------------------------------------------
// 4. Stream A assignment: learning day → topic slice
// ---------------------------------------------------------------------------
function sliceIntoChunks(ids, dayCount) {
  const chunks = [];
  const base = Math.floor(ids.length / dayCount);
  const extra = ids.length % dayCount;
  let idx = 0;
  for (let i = 0; i < dayCount; i++) {
    const size = i < extra ? base + 1 : base;
    chunks.push(ids.slice(idx, idx + size));
    idx += size;
  }
  return chunks;
}

// Stream A ranges (79 learning days)
const TREE_SUBTOPICS = [
  "Binary tree node structure & DFS traversals",
  "Level-order traversal & Views (Left/Right/Top/Bottom)",
  "Height, depth and diameter of binary tree",
  "Balanced binary tree, same tree and symmetric tree",
  "Path Sum, Max Path Sum & Tree paths",
  "Lowest Common Ancestor (LCA) of binary tree",
  "Tree construction from inorder & preorder/postorder",
  "Binary Search Tree (BST) fundamentals, search and insert",
  "Delete node in BST & BST validation",
  "Lowest Common Ancestor (LCA) in BST",
  "K-th smallest / largest element in BST",
  "BST from sorted array and preorder traversal",
  "Flatten binary tree to linked list",
  "Serialize and deserialize binary tree",
  "Morris traversal (Inorder & Preorder)",
  "Burning tree & Maximum width of binary tree"
];

const STREAM_A_RANGES = [
  { topic: 'Binary Trees & BST',      phase: 'Phase 1: Binary Trees & BST',                  pool: POOL.BST,     ldStart: 1,  ldEnd: 16 },
  { topic: 'Graphs',                   phase: 'Phase 2: Graphs',                              pool: POOL.Graphs,  ldStart: 17, ldEnd: 30 },
  { topic: 'Dynamic Programming',      phase: 'Phase 3: Dynamic Programming',                 pool: POOL.DP,      ldStart: 31, ldEnd: 45 },
  { topic: 'Greedy & Intervals',       phase: 'Phase 4: Greedy & Intervals',                  pool: POOL.Greedy,  ldStart: 46, ldEnd: 56 },
  { topic: 'Recursion & Backtracking', phase: 'Phase 5: Remaining Patterns — Recursion',      pool: POOL.RecBack, ldStart: 57, ldEnd: 67 },
  { topic: 'Heap / Priority Queue',    phase: 'Phase 5: Remaining Patterns — Heaps',          pool: POOL.Heap,    ldStart: 68, ldEnd: 73 },
  { topic: 'Tries',                    phase: 'Phase 5: Remaining Patterns — Tries',          pool: POOL.Tries,   ldStart: 74, ldEnd: 79 },
];

const STREAM_A_LD = {};
for (const range of STREAM_A_RANGES) {
  const dayCount = range.ldEnd - range.ldStart + 1;
  const chunks = sliceIntoChunks(range.pool, dayCount);
  for (let i = 0; i < dayCount; i++) {
    const ld = range.ldStart + i;
    STREAM_A_LD[ld] = {
      topic: range.topic,
      phase: range.phase,
      problems: chunks[i],
      dayInTopic: i + 1,
      customSubtopic: range.topic === 'Binary Trees & BST' ? TREE_SUBTOPICS[i] : null,
      totalDaysInTopic: dayCount,
    };
  }
}

// ---------------------------------------------------------------------------
// 5. Stream B assignment: calendar window → topic slice
// ---------------------------------------------------------------------------
function countLDInWindow(calStart, calEnd) {
  let count = 0;
  for (let d = calStart; d <= calEnd; d++) {
    if (!BUFFER_DAYS.has(d)) count++;
  }
  return count;
}

const MIXED_POOL = [
  ...POOL.Sorting,
  ...POOL.Strings,
  ...POOL.BitManip,
];
const MIXED_SELECTED = MIXED_POOL.slice(0, 16);
const BACKTRACKING_HARDER = POOL.RecBack.slice(11);

const STREAM_B_WINDOWS = [
  { calStart:  1, calEnd: 14, topic: 'Arrays & Hashing',         phase: 'Phase B1: Arrays & Hashing Revision',         pool: POOL.Arrays },
  { calStart: 15, calEnd: 24, topic: 'Binary Search',             phase: 'Phase B2: Binary Search Revision',            pool: POOL.BinSearch },
  { calStart: 25, calEnd: 34, topic: 'Linked List',               phase: 'Phase B3: Linked List Revision',              pool: POOL.LinkedL },
  { calStart: 35, calEnd: 44, topic: 'Stack & Queue',             phase: 'Phase B4: Stack & Queue Revision',            pool: POOL.StackQ },
  { calStart: 45, calEnd: 54, topic: 'Heap / Priority Queue',     phase: 'Phase B5: Heap Revision',                     pool: POOL.HeapRev },
  { calStart: 55, calEnd: 66, topic: 'Recursion & Backtracking',  phase: 'Phase B6: Recursion Revision',                pool: POOL.RecRev },
  { calStart: 67, calEnd: 80, topic: 'Recursion & Backtracking',  phase: 'Phase B7: Hard Backtracking Revision',        pool: BACKTRACKING_HARDER },
  { calStart: 81, calEnd: 90, topic: 'Mixed Weak Topics',         phase: 'Phase B8: Mixed Weak Topics Revision',        pool: MIXED_SELECTED },
];

const STREAM_B_CAL = {};
for (const win of STREAM_B_WINDOWS) {
  const ldInWindow = countLDInWindow(win.calStart, win.calEnd);
  const maxProbs = ldInWindow * 2;
  const selected = win.pool.slice(0, maxProbs);
  const chunks = sliceIntoChunks(selected, ldInWindow);
  let chunkIdx = 0;
  for (let d = win.calStart; d <= win.calEnd; d++) {
    if (BUFFER_DAYS.has(d)) continue;
    STREAM_B_CAL[d] = {
      topic: win.topic,
      phase: win.phase,
      problems: chunks[chunkIdx] || [],
    };
    chunkIdx++;
  }
}

// ---------------------------------------------------------------------------
// 6. Final phase (days 91-120)
// ---------------------------------------------------------------------------
const FINAL_PHASE = [
  { day: 91, topic: 'Binary Trees & BST', subPhase: 'Traversals & Fundamentals Review', problems: POOL.BST.slice(0, 3), objective: 'Re-solidify tree traversals, height, diameter patterns', effort: 'medium' },
  { day: 92, topic: 'Binary Trees & BST', subPhase: 'Tree Construction & Views', problems: POOL.BST.slice(3, 6), objective: 'Tree construction from traversals, views (left/right/top/bottom)', effort: 'medium' },
  { day: 93, topic: 'Binary Trees & BST', subPhase: 'BST Operations & Paths', problems: POOL.BST.slice(6, 9), objective: 'BST search/insert/delete, LCA, path sum patterns', effort: 'medium' },
  { day: 94, topic: 'Binary Trees & BST', subPhase: 'Hard Tree Patterns', problems: POOL.BST.slice(9, 12), objective: 'Serialize/deserialize, Morris traversal, advanced BST', effort: 'hard' },

  { day: 95, topic: 'Graphs', subPhase: 'BFS/DFS & Connected Components', problems: POOL.Graphs.slice(0, 3), objective: 'Graph traversal patterns, island problems, component counting', effort: 'medium' },
  { day: 96, topic: 'Graphs', subPhase: 'Cycle Detection & Topological Sort', problems: POOL.Graphs.slice(3, 6), objective: 'Directed/undirected cycle detection, topo-sort applications', effort: 'medium' },
  { day: 97, topic: 'Graphs', subPhase: 'Shortest Paths & Weighted Graphs', problems: POOL.Graphs.slice(6, 9), objective: 'Dijkstra, Bellman-Ford, Floyd-Warshall patterns', effort: 'hard' },
  { day: 98, topic: 'Graphs', subPhase: 'DSU & Advanced Graph Patterns', problems: POOL.Graphs.slice(9, 12), objective: 'Union-Find, MST (Kruskal/Prim), SCC (Kosaraju)', effort: 'hard' },

  { day: 99, topic: 'Dynamic Programming', subPhase: '1D DP & Classic Problems', problems: POOL.DP.slice(0, 3), objective: 'Fibonacci variants, house robber, climbing stairs state design', effort: 'easy' },
  { day: 100, topic: 'Dynamic Programming', subPhase: 'Grid DP & Subsequences', problems: POOL.DP.slice(3, 6), objective: 'Unique paths, min path sum, LCS, LIS patterns', effort: 'medium' },
  { day: 101, topic: 'Dynamic Programming', subPhase: 'Knapsack Variants', problems: POOL.DP.slice(6, 9), objective: '0/1 knapsack, unbounded knapsack, partition equal subset sum', effort: 'medium' },
  { day: 102, topic: 'Dynamic Programming', subPhase: 'String DP', problems: POOL.DP.slice(9, 12), objective: 'Edit distance, regex matching, palindrome DP', effort: 'hard' },
  { day: 103, topic: 'Dynamic Programming', subPhase: 'Partition DP & Advanced', problems: POOL.DP.slice(12, 15), objective: 'Matrix chain, burst balloons, DP on trees', effort: 'hard' },

  { day: 104, topic: 'Greedy & Intervals', subPhase: 'Interval Greedy Review', problems: POOL.Greedy.slice(0, 3), objective: 'Activity selection, interval scheduling, jump game patterns', effort: 'medium' },
  { day: 105, topic: 'Binary Search', subPhase: 'Binary Search on Answer', problems: POOL.BinSearch.slice(0, 3), objective: 'Search space reduction, capacity problems, peak finding', effort: 'medium' },
  { day: 106, topic: 'Greedy & Intervals', subPhase: 'Hard Greedy Patterns', problems: POOL.Greedy.slice(3, 6), objective: 'Candy problem, gas station, task scheduler patterns', effort: 'hard' },

  { day: 107, topic: 'Arrays & Hashing', subPhase: 'Two Pointers & Prefix Sum', problems: POOL.Arrays.slice(0, 3), objective: 'Kadane, prefix-sum, two-pointer review', effort: 'medium' },
  { day: 108, topic: 'Arrays & Hashing', subPhase: 'Hashing Patterns', problems: POOL.Arrays.slice(3, 6), objective: 'HashMap/HashSet tricks, count frequencies, subarrays', effort: 'medium' },
  { day: 109, topic: 'Sliding Window & Two Pointers', subPhase: 'Variable Window Patterns', problems: POOL.SlidWin.slice(0, 3), objective: 'Longest subarray, minimum window substring, at most K patterns', effort: 'hard' },

  { day: 110, topic: 'Linked List', subPhase: 'Classic LL Patterns', problems: POOL.LinkedL.slice(0, 3), objective: 'Reverse LL, cycle detection, merge sorted lists', effort: 'medium' },
  { day: 111, topic: 'Stack & Queue', subPhase: 'Monotonic Stack Patterns', problems: POOL.StackQ.slice(0, 3), objective: 'NGE, largest rectangle in histogram, stock span', effort: 'medium' },
  { day: 112, topic: 'Linked List', subPhase: 'Hard LL Patterns', problems: POOL.LinkedL.slice(3, 5), objective: 'LRU cache, copy list with random pointer, flatten', effort: 'hard' },

  { day: 113, topic: 'Heap / Priority Queue', subPhase: 'Heap Patterns Review', problems: POOL.Heap.slice(0, 3), objective: 'K-th largest, merge K lists, sliding window max', effort: 'medium' },
  { day: 114, topic: 'Recursion & Backtracking', subPhase: 'Recursion Patterns', problems: POOL.RecBack.slice(0, 3), objective: 'Subsets, permutations, combination sum', effort: 'medium' },
  { day: 115, topic: 'Recursion & Backtracking', subPhase: 'Hard Backtracking', problems: POOL.RecBack.slice(3, 5), objective: 'N-Queens, Sudoku solver, word search', effort: 'hard' },

  { day: 116, topic: 'Mixed Mock', subPhase: 'Mock Interview Session 1', problems: [POOL.Arrays[10], POOL.DP[20], POOL.Graphs[15]].filter(Boolean), objective: 'Timed 3-problem mock: Array + DP + Graph cross-topic', effort: 'hard', isMock: true },
  { day: 117, topic: 'Mixed Mock', subPhase: 'Mock Interview Session 2', problems: [POOL.BST[20], POOL.Greedy[10], POOL.BinSearch[15]].filter(Boolean), objective: 'Timed 3-problem mock: Tree + Greedy + Binary Search cross-topic', effort: 'hard', isMock: true },

  { day: 118, topic: 'Weakness Correction', subPhase: 'Targeted Reattempts — Day 1', problems: [], objective: 'Reattempt the 3-5 hardest unsolved/failed problems from the whole roadmap', effort: 'hard', isDynamic: true, dynamicNote: 'Problems selected from your SRS queue (Hard + Failed problems)' },
  { day: 119, topic: 'Weakness Correction', subPhase: 'Targeted Reattempts — Day 2', problems: [], objective: 'Pattern consolidation: review all weak topic patterns, reattempt 2-3 more', effort: 'hard', isDynamic: true, dynamicNote: 'Problems selected from your SRS queue (Hard + Failed problems)' },

  { day: 120, topic: 'Final Assessment', subPhase: 'Readiness Assessment', problems: [], objective: 'Self-assessment: score your confidence per topic, set interview-readiness goal', effort: 'assessment', isAssessment: true, assessmentChecklist: [
      'Can you explain BFS/DFS trade-offs?',
      'Can you code a DP solution with memoization + tabulation?',
      'Can you handle sliding window variable-size problems?',
      'Can you implement BST operations (insert/delete/search) from scratch?',
      'Can you write Dijkstra\'s algorithm?',
      'Can you identify when to use greedy vs DP?',
      'Can you handle backtracking with pruning?',
      'Are you ready to apply for FAANG-tier interviews?',
    ] },
];

// Helper to make keywords from text
function makeKeywords(topic, subtopic) {
  const text = `${topic || ''} ${subtopic || ''}`.toLowerCase();
  const words = text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  return Array.from(new Set(words));
}

function buildStreamAObjective(aContent) {
  if (!aContent) return 'Catch up on pending problems';
  const { topic, dayInTopic, totalDaysInTopic } = aContent;
  const topicObjectives = {
    'Binary Trees & BST': 'Master tree traversal, recursion patterns, BST operations and path problems',
    'Graphs': 'Build graph intuition: BFS/DFS, cycle detection, topological sort, shortest paths',
    'Dynamic Programming': 'Develop DP problem-solving: state design, memoization, tabulation patterns',
    'Greedy & Intervals': 'Apply greedy thinking: sorting-based decisions, interval problems',
    'Recursion & Backtracking': 'Strengthen recursion: subset/permutation generation, constraint-based backtracking',
    'Heap / Priority Queue': 'Use heaps for K-th element, streaming, and priority-based problems',
    'Tries': 'Build and query tries for prefix/string problems and XOR optimization',
  };
  return `${topicObjectives[topic] || topic} (Day ${dayInTopic}/${totalDaysInTopic})`;
}

function buildStreamBObjective(bContent, day) {
  if (!bContent) return 'Open revision: pick any weak topic from your SRS queue';
  const objectives = {
    'Arrays & Hashing': 'Recall array manipulation patterns: two-pointer, prefix sum, HashMap tricks',
    'Binary Search': 'Recall binary search templates: standard, lower/upper bound, search on answer',
    'Linked List': 'Recall LL patterns: fast/slow pointer, reversal, cycle detection, merge',
    'Stack & Queue': 'Recall stack/queue patterns: monotonic stack, sliding window max, expression evaluation',
    'Heap / Priority Queue': 'Recall heap patterns: K-th element, merge K, streaming median',
    'Recursion & Backtracking': 'Recall recursion tree thinking, backtracking templates with pruning',
    'Mixed Weak Topics': 'Review weak areas: Sorting, Strings, Bit Manipulation — focus on unsure patterns',
  };
  return objectives[bContent.topic] || `Revise: ${bContent.topic}`;
}

// ---------------------------------------------------------------------------
// 7. Build the 120-day STREAM_A array
// ---------------------------------------------------------------------------
const STREAM_A = [];

for (let d = 1; d <= 120; d++) {
  if (d <= 90) {
    const calInfo = CAL_MAP[d];
    if (calInfo.isBuffer) {
      STREAM_A.push({
        dayNumber: d,
        day: d,
        dayType: 'buffer',
        isBuffer: true,
        isBufferDay: true,
        topic: 'Buffer Day',
        subtopic: 'Weekly Consolidation & Backlog Recovery',
        objectives: 'Buffer day: consolidate, recover backlog, review weak areas, rest.',
        objective: 'Buffer day: consolidate, recover backlog, review weak areas, rest.',
        keywords: ['buffer', 'consolidation', 'backlog', 'review'],
        suggestedProblemIds: [],
        problems: [],
        targetCount: 0,
        estimatedMinutes: 0,
        priority: 'low',
        required: false,
        bufferReason: 'Weekly consolidation & backlog recovery',
        bufferTasks: [
          'Review any incomplete problems from the past week',
          'Reattempt problems marked as "Again" or "Hard" in SRS',
          'Read editorials for problems you struggled with',
          'Light revision: skim notes on current topic concepts',
          'Optional: attempt 1-2 easy problems from a weak area',
        ],
        phase: 'Learning Phase: Buffer Day',
      });
    } else {
      const ld = calInfo.learningDay;
      const aContent = STREAM_A_LD[ld];
      const probs = aContent ? aContent.problems : [];
      const estimatedMinutes = probs.length * 25 + 20;
      const topic = aContent ? aContent.topic : 'Review';
      const subtopic = aContent ? (aContent.customSubtopic || `${aContent.topic} — Day ${aContent.dayInTopic} of ${aContent.totalDaysInTopic}`) : 'Catch-up';
      const obj = buildStreamAObjective(aContent);

      STREAM_A.push({
        dayNumber: d,
        day: d,
        dayType: 'learning',
        isBuffer: false,
        isBufferDay: false,
        topic,
        subtopic,
        objectives: obj,
        objective: obj,
        keywords: makeKeywords(topic, subtopic),
        learningDay: ld,
        suggestedProblemIds: probs,
        problems: probs,
        targetCount: probs.length,
        estimatedMinutes,
        priority: 'high',
        required: true,
        phase: aContent ? aContent.phase : 'Learning Phase',
      });
    }
  } else {
    // Final phase (91-120)
    const finalDay = FINAL_PHASE.find(f => f.day === d);
    if (finalDay) {
      const probs = finalDay.problems || [];
      const mins = finalDay.isAssessment ? 60 :
                   finalDay.isDynamic ? 90 :
                   finalDay.isMock ? 120 :
                   probs.length * 30 + 15;
      const dayType = finalDay.isAssessment ? 'assessment' : finalDay.isMock ? 'mock' : 'final_revision';

      STREAM_A.push({
        dayNumber: d,
        day: d,
        dayType,
        isBuffer: false,
        isBufferDay: false,
        topic: finalDay.topic,
        subtopic: finalDay.subPhase,
        objectives: finalDay.objective,
        objective: finalDay.objective,
        keywords: makeKeywords(finalDay.topic, finalDay.subPhase),
        suggestedProblemIds: probs,
        problems: probs,
        targetCount: probs.length,
        estimatedMinutes: mins,
        effort: finalDay.effort,
        priority: 'high',
        required: true,
        phase: 'Phase 6: Final Revision & Mock Phase',
        ...(finalDay.isMock ? { isMock: true } : {}),
        ...(finalDay.isDynamic ? { isDynamic: true, dynamicNote: finalDay.dynamicNote } : {}),
        ...(finalDay.isAssessment ? { isAssessment: true, assessmentChecklist: finalDay.assessmentChecklist } : {}),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Build the 120-day STREAM_B array
// ---------------------------------------------------------------------------
const STREAM_B = [];

for (let d = 1; d <= 120; d++) {
  if (d <= 90) {
    const calInfo = CAL_MAP[d];
    if (calInfo.isBuffer) {
      STREAM_B.push({
        dayNumber: d,
        day: d,
        dayType: 'buffer',
        isBuffer: true,
        isBufferDay: true,
        topic: 'Buffer Day',
        subtopic: 'Buffer Day — No Scheduled Revision',
        objectives: 'Buffer day: no new revision assigned. Catch up or rest.',
        objective: 'Buffer day: no new revision assigned. Catch up or rest.',
        keywords: ['buffer'],
        suggestedProblemIds: [],
        problems: [],
        targetCount: 0,
        estimatedMinutes: 0,
        priority: 'low',
        required: false,
        phase: 'Learning Phase: Buffer Day',
      });
    } else {
      const bContent = STREAM_B_CAL[d];
      const probs = bContent ? bContent.problems : [];
      const topic = bContent ? bContent.topic : 'Open Revision';
      const subtopic = bContent ? `Revision: ${bContent.topic}` : 'Free revision';
      const obj = buildStreamBObjective(bContent, d);

      STREAM_B.push({
        dayNumber: d,
        day: d,
        dayType: 'revision',
        isBuffer: false,
        isBufferDay: false,
        topic,
        subtopic,
        objectives: obj,
        objective: obj,
        keywords: makeKeywords(topic, subtopic),
        suggestedProblemIds: probs,
        problems: probs,
        targetCount: probs.length,
        estimatedMinutes: probs.length * 20 + 10,
        priority: 'normal',
        required: false,
        phase: bContent ? bContent.phase : 'Revision Phase',
        revisionNote: 'Lighter revision pass — focus on pattern recall, not deep re-learning',
      });
    }
  } else {
    // Final phase: Stream B not assigned, Stream A covers review
    STREAM_B.push({
      dayNumber: d,
      day: d,
      dayType: 'final_revision',
      isBuffer: false,
      isBufferDay: false,
      topic: 'Final Phase',
      subtopic: 'See Stream A for today\'s tasks',
      objectives: 'Final phase: Stream B not assigned; Stream A covers all review.',
      objective: 'Final phase: Stream B not assigned; Stream A covers all review.',
      keywords: ['final', 'revision'],
      suggestedProblemIds: [],
      problems: [],
      targetCount: 0,
      estimatedMinutes: 0,
      priority: 'low',
      required: false,
      phase: 'Phase 6: Final Revision & Mock Phase',
    });
  }
}

// ---------------------------------------------------------------------------
// 9. Verify integrity
// ---------------------------------------------------------------------------
function verify() {
  const errors = [];

  if (STREAM_A.length !== 120) errors.push(`STREAM_A length = ${STREAM_A.length}, expected 120`);
  if (STREAM_B.length !== 120) errors.push(`STREAM_B length = ${STREAM_B.length}, expected 120`);
  if (!PEDAGOGICAL_120 || PEDAGOGICAL_120.length !== 120) errors.push(`PEDAGOGICAL_120 length invalid`);

  for (const bd of BUFFER_DAYS) {
    const entryA = STREAM_A[bd - 1];
    const entryB = STREAM_B[bd - 1];
    if (!entryA.isBuffer) errors.push(`Day ${bd} in Stream A should be buffer`);
    if (!entryB.isBuffer) errors.push(`Day ${bd} in Stream B should be buffer`);
  }

  // Check no duplicate problem IDs within Stream A days 1-90 learning days
  const seen = new Set();
  const dups = [];
  for (const day of STREAM_A) {
    if (day.isBuffer || day.dayType !== 'learning') continue;
    for (const pid of (day.suggestedProblemIds || [])) {
      if (seen.has(pid)) dups.push(pid);
      seen.add(pid);
    }
  }
  if (dups.length > 0) errors.push(`Duplicate Stream A problem IDs: ${dups.join(', ')}`);

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`STREAM_A: ${STREAM_A.length} days`);
  console.log(`STREAM_B: ${STREAM_B.length} days`);
  console.log(`PEDAGOGICAL_120: ${PEDAGOGICAL_120.length} days`);
  console.log(`TAXONOMY_AUDIT: ${TAXONOMY_AUDIT.length} categories`);
  console.log(`Unique problems in Stream A (learning): ${seen.size}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    errors.forEach(e => console.error('  - ' + e));
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 10. Serialize module
// ---------------------------------------------------------------------------
function serialize() {
  const pedStr = JSON.stringify(PEDAGOGICAL_120, null, 2);
  const taxStr = JSON.stringify(TAXONOMY_AUDIT, null, 2);
  const streamAStr = JSON.stringify(STREAM_A, null, 2);
  const streamBStr = JSON.stringify(STREAM_B, null, 2);

  return `/**
 * AlgoRecall — 120-Day Dual-Stream Curriculum Data
 * AUTO-GENERATED by scripts/build-new-curriculum.js — DO NOT EDIT MANUALLY
 *
 * Contains:
 *   1. PEDAGOGICAL_120 (120 Days Sequential Pedagogical Track for track: 'pedagogical_120')
 *   2. STREAM_A (120 Days Deep Learning Track for dual-stream mode)
 *   3. STREAM_B (120 Days Foundation Revision Track for dual-stream mode)
 *   4. TAXONOMY_AUDIT (Curriculum Taxonomy)
 *
 * Buffer days: calendar positions 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88.
 * Final phase: days 91-120.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.RoadmapCurriculumData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BUFFER_CALENDAR_DAYS = new Set([8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88]);

  const EXACT_PEDAGOGICAL_120 = ${pedStr};
  const CURRICULUM_TAXONOMY_AUDIT = ${taxStr};
  const EXACT_STREAM_A_120 = ${streamAStr};
  const EXACT_STREAM_B_120 = ${streamBStr};

  const RoadmapCurriculumData = {
    PEDAGOGICAL_120: EXACT_PEDAGOGICAL_120,
    TAXONOMY_AUDIT: CURRICULUM_TAXONOMY_AUDIT,
    STREAM_A: EXACT_STREAM_A_120,
    STREAM_B: EXACT_STREAM_B_120,
    BUFFER_CALENDAR_DAYS,

    getPedagogicalDay(dayNumber) {
      if (dayNumber < 1) return EXACT_PEDAGOGICAL_120[0];
      if (dayNumber > EXACT_PEDAGOGICAL_120.length) {
        return {
          dayNumber,
          topic: 'Consolidation & Interview Sprints',
          subtopic: 'Extended Mock Interviews & Retention Maintenance',
          suggestedProblemIds: [],
          problems: [],
          targetCount: 3,
          estimatedMinutes: 60,
          phase: 'Days 121+: Extended Advanced Practice & Interview Sprints'
        };
      }
      return EXACT_PEDAGOGICAL_120[dayNumber - 1];
    },

    getStreamADay(dayNumber) {
      if (dayNumber < 1) return EXACT_STREAM_A_120[0];
      if (dayNumber > 120) {
        const base = EXACT_STREAM_A_120[(dayNumber - 1) % 120];
        return {
          ...base,
          dayNumber: dayNumber,
          day: dayNumber,
          phase: 'Phase 5: Extended Mastery & Repair Cycles'
        };
      }
      return EXACT_STREAM_A_120[dayNumber - 1];
    },

    getStreamBDay(dayNumber) {
      if (dayNumber < 1) return EXACT_STREAM_B_120[0];
      if (dayNumber > 120) {
        const base = EXACT_STREAM_B_120[(dayNumber - 1) % 120];
        return {
          ...base,
          dayNumber: dayNumber,
          day: dayNumber,
          phase: 'Days 121+: Extended Foundations & Maintenance'
        };
      }
      return EXACT_STREAM_B_120[dayNumber - 1];
    },

    isBufferDay(dayNum) {
      return dayNum >= 1 && dayNum <= 90 && BUFFER_CALENDAR_DAYS.has(dayNum);
    },

    isFinalPhaseDay(dayNum) {
      return dayNum >= 91 && dayNum <= 120;
    },

    getLearningDayIndex(calDay) {
      if (calDay < 1 || calDay > 90) return null;
      if (BUFFER_CALENDAR_DAYS.has(calDay)) return null;
      let ld = 0;
      for (let d = 1; d <= calDay; d++) {
        if (!BUFFER_CALENDAR_DAYS.has(d)) ld++;
      }
      return ld;
    },

    getTopicSummary() {
      const topics = {};
      EXACT_STREAM_A_120.forEach(day => {
        if (!day.isBuffer && day.topic) {
          if (!topics[day.topic]) topics[day.topic] = { days: 0, problems: 0 };
          topics[day.topic].days++;
          topics[day.topic].problems += (day.suggestedProblemIds || []).length;
        }
      });
      return topics;
    },

    getStreamBTopicSummary() {
      const topics = {};
      EXACT_STREAM_B_120.forEach(day => {
        if (!day.isBuffer && day.topic && day.topic !== 'Final Phase' && day.topic !== 'Open Revision') {
          if (!topics[day.topic]) topics[day.topic] = { days: 0, problems: 0 };
          topics[day.topic].days++;
          topics[day.topic].problems += (day.suggestedProblemIds || []).length;
        }
      });
      return topics;
    },

    getTaxonomyCoverageSummary() {
      let totalPatterns = 0;
      let coveredPatterns = 0;
      let coreTotal = 0;
      let coreCovered = 0;

      CURRICULUM_TAXONOMY_AUDIT.forEach(area => {
        area.patterns.forEach(pat => {
          totalPatterns++;
          if (pat.coveredIn120Roadmap) coveredPatterns++;
          if (pat.tier === 'Core') {
            coreTotal++;
            if (pat.coveredIn120Roadmap) coreCovered++;
          }
        });
      });

      return {
        totalPatterns,
        coveredPatterns,
        coveragePct: totalPatterns > 0 ? Math.round((coveredPatterns / totalPatterns) * 100) : 100,
        coreTotal,
        coreCovered,
        coreCoveragePct: coreTotal > 0 ? Math.round((coreCovered / coreTotal) * 100) : 100,
        catalogSize: 479
      };
    }
  };

  return RoadmapCurriculumData;
}));
`;
}

// ---------------------------------------------------------------------------
// 11. Main
// ---------------------------------------------------------------------------
if (verify()) {
  const output = serialize();
  const outPath = path.join(__dirname, '..', 'js', 'data', 'roadmap-120-curriculum.js');
  fs.writeFileSync(outPath, output, 'utf8');
  const stats = fs.statSync(outPath);
  console.log(`Generated: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} else {
  console.error('Curriculum verification failed!');
  process.exit(1);
}
