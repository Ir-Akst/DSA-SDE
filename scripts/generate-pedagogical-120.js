const fs = require('fs');
const path = require('path');
const allProblems = require('../js/data/default-sheets');
const srs = require('../js/srs-engine');

const topicPlan = [
  { topic: 'Basics & Math', days: 10, startDay: 1 },
  { topic: 'Sorting', days: 3, startDay: 11 },
  { topic: 'Arrays & Hashing', days: 10, startDay: 14 },
  { topic: 'Sliding Window & Two Pointers', days: 6, startDay: 24 },
  { topic: 'Binary Search', days: 7, startDay: 30 },
  { topic: 'Strings', days: 6, startDay: 37 },
  { topic: 'Linked List', days: 8, startDay: 43 },
  { topic: 'Stack & Queue', days: 7, startDay: 51 },
  { topic: 'Recursion & Backtracking', days: 6, startDay: 58 },
  { topic: 'Binary Trees & BST', days: 12, startDay: 64 },
  { topic: 'Heap / Priority Queue', days: 5, startDay: 76 },
  { topic: 'Greedy & Intervals', days: 5, startDay: 81 },
  { topic: 'Graphs', days: 9, startDay: 86 },
  { topic: 'Dynamic Programming', days: 15, startDay: 95 },
  { topic: 'Bit Manipulation', days: 5, startDay: 110 },
  { topic: 'Tries', days: 4, startDay: 115 }
];

const generatedDays = [];
const assignedProblemIds = new Set();

topicPlan.forEach(({ topic, days, startDay }) => {
  const problems = allProblems.filter(p => srs.canonicalizeTopic(p.topic) === topic);
  const total = problems.length;
  
  // Distribute problems evenly across 'days'
  // e.g. for 42 problems across 10 days: 8 days of 4, 2 days of 5
  const baseCount = Math.floor(total / days);
  const remainder = total % days;
  
  let pIdx = 0;
  for (let d = 0; d < days; d++) {
    const dayNum = startDay + d;
    const countThisDay = baseCount + (d < remainder ? 1 : 0);
    const dayProblems = problems.slice(pIdx, pIdx + countThisDay);
    pIdx += countThisDay;

    dayProblems.forEach(p => assignedProblemIds.add(p.id));

    // Determine subtopic name from the first problem or unique subtopics
    const subtopics = Array.from(new Set(dayProblems.map(p => p.subtopic || 'General')));
    const subtopicLabel = subtopics.join(' & ');

    // Estimate minutes: Easy = 15m, Medium = 25m, Hard = 40m
    const estMinutes = dayProblems.reduce((sum, p) => {
      const m = p.difficulty === 'Easy' ? 15 : (p.difficulty === 'Medium' ? 25 : 40);
      return sum + m;
    }, 0);

    generatedDays.push({
      dayNumber: dayNum,
      phase: dayNum <= 36 ? 'Phase 1: Foundations, Math, Sorting & Search' :
             dayNum <= 57 ? 'Phase 2: Linear Data Structures, Strings, LL, Stacks' :
             dayNum <= 85 ? 'Phase 3: Hierarchical Structures, Recursion, Trees & Greedy' :
             'Phase 4: Advanced Algorithms, Graphs, DP, Tries & Capstone',
      topic: topic,
      subtopic: subtopicLabel,
      objectives: `Master ${topic}: ${subtopicLabel} through focused hands-on problem solving, complexity analysis, and edge case coverage.`,
      suggestedProblemIds: dayProblems.map(p => p.id),
      targetCount: dayProblems.length,
      estimatedMinutes: Math.max(45, estMinutes)
    });
  }
});

// Days 119-120: Final FAANG Mock Readiness & Capstone
generatedDays.push({
  dayNumber: 119,
  phase: 'Phase 4: Advanced Algorithms, Graphs, DP, Tries & Capstone',
  topic: 'Consolidation & Mock Interview',
  subtopic: 'Timed 3-Problem Mixed SDE Assessment',
  objectives: 'Evaluate full-spectrum DSA problem-solving under timed interview conditions with multi-topic synthesis.',
  suggestedProblemIds: [
    'prob-203-diameter-of-binary-tree',
    'prob-242-number-of-islands',
    'prob-318-longest-common-subsequence'
  ],
  targetCount: 3,
  estimatedMinutes: 90
});

generatedDays.push({
  dayNumber: 120,
  phase: 'Phase 4: Advanced Algorithms, Graphs, DP, Tries & Capstone',
  topic: 'Final Capstone & Readiness Audit',
  subtopic: '120-Day DSA Mastery Certification & Retention Audit',
  objectives: 'Review retention stability across all 16 topics, perform spaced repetition audit, and achieve SDE interview readiness certification.',
  suggestedProblemIds: [
    'prob-214-lowest-common-ancestor-of-a-binary-tree',
    'prob-254-dijkstras-algorithm',
    'prob-336-edit-distance'
  ],
  targetCount: 3,
  estimatedMinutes: 90
});

console.log('Total days generated:', generatedDays.length);
console.log('Total unique problems assigned in core curriculum:', assignedProblemIds.size);
console.log('All 479 accounted for:', assignedProblemIds.size === 479);

// Print First 14 Days
console.log('\n=== FIRST 14 DAYS OF ACTUAL ASSIGNED PROBLEMS ===');
for (let i = 0; i < 14; i++) {
  const d = generatedDays[i];
  console.log(`\nDay ${d.dayNumber} [${d.topic}] - ${d.subtopic} (${d.suggestedProblemIds.length} problems, ~${d.estimatedMinutes}m):`);
  d.suggestedProblemIds.forEach((pid, idx) => {
    const prob = allProblems.find(p => p.id === pid);
    console.log(`  ${idx + 1}. [${prob.difficulty}] ${prob.title} (${prob.id})`);
  });
}
