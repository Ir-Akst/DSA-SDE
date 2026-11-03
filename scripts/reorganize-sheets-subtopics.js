const fs = require('fs');
const path = require('path');

const sheetsPath = path.join(__dirname, '../js/data/default-sheets.js');
const allProblems = require(sheetsPath);

console.log(`Starting reorganization for ${allProblems.length} problems...`);

// Canonical Topic Order (16 topics)
const TOPIC_ORDER = [
  'Basics & Math',
  'Sorting',
  'Arrays & Hashing',
  'Sliding Window & Two Pointers',
  'Binary Search',
  'Strings',
  'Linked List',
  'Stack & Queue',
  'Binary Trees & BST',
  'Graphs',
  'Dynamic Programming',
  'Recursion & Backtracking',
  'Heap / Priority Queue',
  'Greedy & Intervals',
  'Bit Manipulation',
  'Tries'
];

// Subtopic definitions with relative order within each topic
const SUBTOPIC_ORDER = {
  'Basics & Math': [
    'Language Basics & Syntax',
    'Basic Math & Number Theory',
    'Basic Recursion',
    'Basic Hashing',
    'Pattern Printing'
  ],
  'Sorting': [
    'Elementary Sorts',
    'Advanced Sorts',
    'Non-Comparison & Special Sorts'
  ],
  'Arrays & Hashing': [
    'Easy Array Operations',
    'Medium Array & Subarrays',
    'Hard Array Problems'
  ],
  'Sliding Window & Two Pointers': [
    'Two Pointers',
    'Variable Window (Distinct & Counting)',
    'Hard Sliding Window'
  ],
  'Binary Search': [
    'BS on 1D Arrays',
    'BS on Answers',
    'BS on 2D Matrices'
  ],
  'Strings': [
    'Basic Strings',
    'Medium Strings',
    'Advanced Strings & Pattern Matching'
  ],
  'Linked List': [
    'Singly Linked List Basics',
    'Doubly Linked List Basics',
    'Medium Linked List',
    'Hard Linked List & DLL'
  ],
  'Stack & Queue': [
    'Basics & Implementations',
    'Infix, Prefix & Postfix',
    'Monotonic Stack & Queue',
    'Implementation Problems'
  ],
  'Binary Trees & BST': [
    'Tree Traversals & Structure',
    'Medium Tree Problems',
    'Hard Tree Problems',
    'Binary Search Tree (BST) Basics',
    'Medium & Hard BST'
  ],
  'Graphs': [
    'Graph Basics & Traversals',
    'Grid Problems (BFS/DFS)',
    'Cycles & Bipartite',
    'Topological Sort',
    'Shortest Paths',
    'Minimum Spanning Tree & Disjoint Set',
    'Other Graph Algorithms'
  ],
  'Dynamic Programming': [
    'Introduction & 1D DP',
    '2D/3D Grid DP',
    'DP on Subsequences / Knapsack',
    'DP on Strings',
    'DP on Stocks',
    'DP on LIS (Longest Increasing Subsequence)',
    'Partition DP / MCM',
    'DP on Squares & Advanced'
  ],
  'Recursion & Backtracking': [
    'Subsequences & Subsets',
    'Permutations & Combinations',
    'Hard Backtracking'
  ],
  'Heap / Priority Queue': [
    'Heap Fundamentals & Implementation',
    'Medium Heap Problems',
    'Hard Heap Problems'
  ],
  'Greedy & Intervals': [
    'Easy Greedy',
    'Medium Greedy',
    'Intervals'
  ],
  'Bit Manipulation': [
    'Bit Manipulation Basics',
    'XOR & Number Problems',
    'Advanced Bit Manipulation'
  ],
  'Tries': [
    'Trie Construction & Search',
    'Advanced Trie Problems',
    'Bitwise Trie'
  ]
};

// Function to classify any problem into its exact topic and subtopic
function getProblemSubtopic(p) {
  const topic = p.topic;
  const id = p.id;
  const title = p.title.toLowerCase();
  const pattern = (p.pattern || '').toLowerCase();

  // 1. Basics & Math
  if (topic === 'Basics & Math') {
    if (['prob-306', 'prob-307', 'prob-308', 'prob-309', 'prob-310', 'prob-311', 'prob-312', 'prob-313', 'prob-314', 'prob-315', 'prob-316', 'prob-317', 'prob-318', 'prob-319', 'prob-320', 'prob-321', 'prob-322', 'prob-323', 'prob-324', 'prob-325', 'prob-326', 'prob-327'].some(prefix => id.startsWith(prefix)) || title.includes('pattern')) {
      return 'Pattern Printing';
    }
    if (['prob-363', 'prob-364', 'prob-365', 'prob-366', 'prob-367'].some(prefix => id.startsWith(prefix)) || title.includes('syntax') || title.includes('data types') || title.includes('pass by')) {
      return 'Language Basics & Syntax';
    }
    if (['prob-8-', 'prob-9-', 'prob-10-', 'prob-11-', 'prob-12-', 'prob-13-'].some(prefix => id.startsWith(prefix)) || pattern.includes('recursion')) {
      return 'Basic Recursion';
    }
    if (['prob-14-', 'prob-15-'].some(prefix => id.startsWith(prefix)) || title.includes('frequency')) {
      return 'Basic Hashing';
    }
    return 'Basic Math & Number Theory';
  }

  // 2. Sorting
  if (topic === 'Sorting') {
    if (['prob-16-', 'prob-17-', 'prob-18-', 'prob-328-', 'prob-329-'].some(prefix => id.startsWith(prefix)) || title.includes('selection sort') || title.includes('bubble sort') || title.includes('insertion sort')) {
      return 'Elementary Sorts';
    }
    if (['prob-19-', 'prob-20-'].some(prefix => id.startsWith(prefix)) || title.includes('merge sort') || title.includes('quick sort')) {
      return 'Advanced Sorts';
    }
    return 'Non-Comparison & Special Sorts';
  }

  // 3. Arrays & Hashing
  if (topic === 'Arrays & Hashing') {
    const hardIds = ['prob-48-', 'prob-49-', 'prob-52-', 'prob-53-', 'prob-54-', 'prob-55-', 'prob-56-', 'prob-57-', 'prob-58-', 'prob-59-'];
    if (hardIds.some(prefix => id.startsWith(prefix)) || title.includes('pascal') || title.includes('inversion') || title.includes('reverse pairs') || title.includes('xor k') || title.includes('missing and repeating') || title.includes('maximum product subarray')) {
      return 'Hard Array Problems';
    }
    const easyIds = ['prob-21-', 'prob-22-', 'prob-23-', 'prob-24-', 'prob-25-', 'prob-26-', 'prob-27-', 'prob-28-', 'prob-29-', 'prob-30-', 'prob-31-', 'prob-368-', 'prob-369-', 'prob-370-'];
    if (easyIds.some(prefix => id.startsWith(prefix)) || title.includes('largest element') || title.includes('second largest') || title.includes('remove duplicates') || title.includes('move zeroes') || title.includes('linear search') || title.includes('missing number') || title.includes('consecutive ones') || title.includes('single number') || title.includes('rotate array by one')) {
      return 'Easy Array Operations';
    }
    return 'Medium Array & Subarrays';
  }

  // 4. Sliding Window & Two Pointers
  if (topic === 'Sliding Window & Two Pointers') {
    if (['prob-50-', 'prob-51-', 'prob-440-', 'prob-441-', 'prob-152-', 'prob-442-', 'prob-443-'].some(prefix => id.startsWith(prefix)) || title.includes('3sum') || title.includes('4sum') || title.includes('container with most water') || title.includes('trapping rain water') || title.includes('valid palindrome ii') || title.includes('boats')) {
      return 'Two Pointers';
    }
    if (['prob-165-', 'prob-166-', 'prob-167-', 'prob-168-', 'prob-169-', 'prob-170-', 'prob-171-', 'prob-395-'].some(prefix => id.startsWith(prefix)) || title.includes('minimum window') || title.includes('k different') || title.includes('repeating character replacement')) {
      return 'Hard Sliding Window';
    }
    return 'Variable Window (Distinct & Counting)';
  }

  // 5. Binary Search
  if (topic === 'Binary Search') {
    if (['prob-84-', 'prob-85-', 'prob-86-', 'prob-373-', 'prob-430-'].some(prefix => id.startsWith(prefix)) || title.includes('matrix') || title.includes('2d') || title.includes('row with max')) {
      return 'BS on 2D Matrices';
    }
    if (['prob-71-', 'prob-72-', 'prob-73-', 'prob-74-', 'prob-75-', 'prob-76-', 'prob-77-', 'prob-78-', 'prob-79-', 'prob-80-', 'prob-81-', 'prob-82-', 'prob-83-', 'prob-372-'].some(prefix => id.startsWith(prefix)) || title.includes('koko') || title.includes('aggressive cows') || title.includes('book allocation') || title.includes('painter') || title.includes('capacity to ship') || title.includes('smallest divisor') || title.includes('bouquets') || title.includes('gas stations') || title.includes('median of two sorted')) {
      return 'BS on Answers';
    }
    return 'BS on 1D Arrays';
  }

  // 6. Strings
  if (topic === 'Strings') {
    if (['prob-359-', 'prob-360-', 'prob-361-', 'prob-362-', 'prob-429-', 'prob-430-', 'prob-431-', 'prob-432-', 'prob-433-'].some(prefix => id.startsWith(prefix)) || title.includes('rabin') || title.includes('kmp') || title.includes('z-algorithm') || title.includes('shortest palindrome') || title.includes('longest happy prefix')) {
      return 'Advanced Strings & Pattern Matching';
    }
    if (['prob-87-', 'prob-88-', 'prob-89-', 'prob-90-', 'prob-91-', 'prob-92-', 'prob-93-'].some(prefix => id.startsWith(prefix)) || title.includes('outermost') || title.includes('reverse words') || title.includes('largest odd') || title.includes('common prefix') || title.includes('isomorphic') || title.includes('anagram')) {
      return 'Basic Strings';
    }
    return 'Medium Strings';
  }

  // 7. Linked List
  if (topic === 'Linked List') {
    if (['prob-376-', 'prob-377-', 'prob-378-', 'prob-379-', 'prob-380-'].some(prefix => id.startsWith(prefix)) || title.includes('introduction to linked list') || title.includes('insert a node in linked list') || title.includes('count nodes') || title.includes('search an element')) {
      return 'Singly Linked List Basics';
    }
    if (['prob-330-', 'prob-331-', 'prob-332-', 'prob-333-'].some(prefix => id.startsWith(prefix)) || (title.includes('doubly') && (title.includes('introduction') || title.includes('insert') || title.includes('delete a node in doubly') || title.includes('reverse a doubly')))) {
      return 'Doubly Linked List Basics';
    }
    if (['prob-116-', 'prob-117-', 'prob-118-', 'prob-119-', 'prob-334-', 'prob-335-', 'prob-336-', 'prob-381-', 'prob-382-', 'prob-383-'].some(prefix => id.startsWith(prefix)) || title.includes('flattening') || title.includes('clone a linked list') || title.includes('rotate a linked list') || title.includes('delete all occurrences') || title.includes('find pairs with given sum') || title.includes('remove duplicates from sorted dll') || title.includes('remove duplicates from sorted doubly')) {
      return 'Hard Linked List & DLL';
    }
    return 'Medium Linked List';
  }

  // 8. Stack & Queue
  if (topic === 'Stack & Queue') {
    if (['prob-389-', 'prob-390-', 'prob-147-', 'prob-148-', 'prob-391-', 'prob-392-', 'prob-146-'].some(prefix => id.startsWith(prefix)) || title.includes('implement stack') || title.includes('implement queue') || title.includes('min stack')) {
      return 'Basics & Implementations';
    }
    if (['prob-337-', 'prob-338-', 'prob-339-', 'prob-340-', 'prob-341-', 'prob-393-'].some(prefix => id.startsWith(prefix)) || title.includes('postfix') || title.includes('prefix to') || title.includes('infix to')) {
      return 'Infix, Prefix & Postfix';
    }
    if (['prob-160-', 'prob-161-'].some(prefix => id.startsWith(prefix)) || title.includes('celebrity') || title.includes('stock span')) {
      return 'Implementation Problems';
    }
    return 'Monotonic Stack & Queue';
  }

  // 9. Binary Trees & BST
  if (topic === 'Binary Trees & BST') {
    if (['prob-408-', 'prob-215-', 'prob-409-', 'prob-216-', 'prob-217-', 'prob-218-'].some(prefix => id.startsWith(prefix)) || (title.includes('binary search tree') && (title.includes('introduction') || title.includes('search in') || title.includes('min/max') || title.includes('ceil') || title.includes('insert') || title.includes('delete')))) {
      return 'Binary Search Tree (BST) Basics';
    }
    if (['prob-219-', 'prob-220-', 'prob-221-', 'prob-222-', 'prob-223-', 'prob-224-', 'prob-225-', 'prob-349-', 'prob-350-', 'prob-410-'].some(prefix => id.startsWith(prefix)) || title.includes('bst') || title.includes('binary search tree')) {
      return 'Medium & Hard BST';
    }
    if (['prob-404-', 'prob-401-', 'prob-402-', 'prob-403-', 'prob-202-', 'prob-342-', 'prob-343-', 'prob-203-', 'prob-205-'].some(prefix => id.startsWith(prefix)) || title.includes('traversal') || title.includes('level order')) {
      return 'Tree Traversals & Structure';
    }
    if (['prob-346-', 'prob-347-', 'prob-348-', 'prob-211-', 'prob-212-', 'prob-213-', 'prob-214-', 'prob-407-'].some(prefix => id.startsWith(prefix)) || title.includes('distance k') || title.includes('burn') || title.includes('serialize') || title.includes('construct') || title.includes('flatten')) {
      return 'Hard Tree Problems';
    }
    return 'Medium Tree Problems';
  }

  // 10. Graphs
  if (topic === 'Graphs') {
    if (['prob-411-', 'prob-226-'].some(prefix => id.startsWith(prefix)) || title.includes('representation') || title.includes('number of provinces') || title.includes('connected components')) {
      return 'Graph Basics & Traversals';
    }
    if (['prob-227-', 'prob-228-', 'prob-229-', 'prob-230-', 'prob-231-', 'prob-232-', 'prob-251-'].some(prefix => id.startsWith(prefix)) || title.includes('islands') || title.includes('flood fill') || title.includes('rotting oranges') || title.includes('0/1 matrix') || title.includes('surrounded regions') || title.includes('enclaves')) {
      return 'Grid Problems (BFS/DFS)';
    }
    if (['prob-234-', 'prob-235-'].some(prefix => id.startsWith(prefix)) || title.includes('bipartite') || title.includes('cycle detection in directed')) {
      return 'Cycles & Bipartite';
    }
    if (['prob-236-', 'prob-237-', 'prob-238-', 'prob-239-'].some(prefix => id.startsWith(prefix)) || title.includes('course schedule ii') || title.includes('safe states') || title.includes('alien dictionary') || title.includes('dag')) {
      return 'Topological Sort';
    }
    if (['prob-245-', 'prob-246-', 'prob-247-', 'prob-248-', 'prob-249-', 'prob-250-'].some(prefix => id.startsWith(prefix)) || title.includes('spanning tree') || title.includes('kruskal') || title.includes('prim') || title.includes('redundant connection') || title.includes('accounts merge') || title.includes('stones removed') || title.includes('network connected')) {
      return 'Minimum Spanning Tree & Disjoint Set';
    }
    if (['prob-252-', 'prob-253-', 'prob-355-', 'prob-233-'].some(prefix => id.startsWith(prefix)) || title.includes('bridges') || title.includes('kosaraju') || title.includes('articulation') || title.includes('word ladder')) {
      return 'Other Graph Algorithms';
    }
    return 'Shortest Paths';
  }

  // 11. Dynamic Programming
  if (topic === 'Dynamic Programming') {
    if (['prob-254-', 'prob-255-', 'prob-256-', 'prob-257-', 'prob-258-', 'prob-356-', 'prob-413-', 'prob-414-'].some(prefix => id.startsWith(prefix)) || title.includes('climbing stairs') || title.includes('frog jump') || title.includes('house robber') || title.includes('ninja')) {
      return 'Introduction & 1D DP';
    }
    if (['prob-259-', 'prob-260-', 'prob-261-', 'prob-262-', 'prob-263-', 'prob-264-'].some(prefix => id.startsWith(prefix)) || title.includes('unique paths') || title.includes('path sum in grid') || title.includes('triangle') || title.includes('falling path') || title.includes('cherry pickup')) {
      return '2D/3D Grid DP';
    }
    if (['prob-284-', 'prob-285-', 'prob-415-', 'prob-416-', 'prob-417-', 'prob-421-'].some(prefix => id.startsWith(prefix)) && title.includes('stock')) {
      return 'DP on Stocks';
    }
    if (['prob-286-', 'prob-287-', 'prob-288-', 'prob-289-', 'prob-290-', 'prob-291-'].some(prefix => id.startsWith(prefix)) || title.includes('increasing subsequence') || title.includes('divisible subset') || title.includes('string chain') || title.includes('bitonic')) {
      return 'DP on LIS (Longest Increasing Subsequence)';
    }
    if (['prob-292-', 'prob-293-', 'prob-294-', 'prob-295-', 'prob-296-', 'prob-297-', 'prob-422-', 'prob-423-'].some(prefix => id.startsWith(prefix)) || title.includes('matrix chain') || title.includes('cut a stick') || title.includes('burst balloons') || title.includes('boolean expression') || title.includes('palindrome partitioning ii') || title.includes('partition array for maximum sum')) {
      return 'Partition DP / MCM';
    }
    if (['prob-424-', 'prob-425-'].some(prefix => id.startsWith(prefix)) || title.includes('maximal rectangle') || title.includes('square submatrices')) {
      return 'DP on Squares & Advanced';
    }
    if (['prob-274-', 'prob-275-', 'prob-276-', 'prob-277-', 'prob-278-', 'prob-279-', 'prob-280-', 'prob-281-', 'prob-282-', 'prob-283-', 'prob-419-', 'prob-420-'].some(prefix => id.startsWith(prefix)) || title.includes('subsequence') || title.includes('common substring') || title.includes('supersequence') || title.includes('edit distance') || title.includes('wildcard') || title.includes('insertions')) {
      return 'DP on Strings';
    }
    return 'DP on Subsequences / Knapsack';
  }

  // 12. Recursion & Backtracking
  if (topic === 'Recursion & Backtracking') {
    if (['prob-385-', 'prob-386-', 'prob-470-', 'prob-471-', 'prob-472-'].some(prefix => id.startsWith(prefix)) || title.includes('permutation') || title.includes('expression add') || title.includes('restore ip')) {
      return 'Permutations & Combinations';
    }
    if (['prob-127-', 'prob-128-', 'prob-129-', 'prob-130-', 'prob-131-', 'prob-132-', 'prob-133-', 'prob-473-', 'prob-474-'].some(prefix => id.startsWith(prefix)) || title.includes('n-queens') || title.includes('sudoku') || title.includes('m-coloring') || title.includes('rat in a maze') || title.includes('word break') || title.includes('matchsticks') || title.includes('partition to k equal')) {
      return 'Hard Backtracking';
    }
    return 'Subsequences & Subsets';
  }

  // 13. Heap / Priority Queue
  if (topic === 'Heap / Priority Queue') {
    if (['prob-396-', 'prob-397-', 'prob-398-', 'prob-399-'].some(prefix => id.startsWith(prefix)) || title.includes('check if an array represents a min-heap') || title.includes('convert min heap') || title.includes('rank')) {
      return 'Heap Fundamentals & Implementation';
    }
    if (['prob-180-', 'prob-181-', 'prob-458-', 'prob-459-', 'prob-460-', 'prob-461-', 'prob-462-', 'prob-463-'].some(prefix => id.startsWith(prefix)) || title.includes('merge k sorted lists') || title.includes('find median') || title.includes('last stone weight') || title.includes('reorganize string') || title.includes('smallest sums') || title.includes('ipo') || title.includes('seat reservation') || title.includes('refueling stops')) {
      return 'Hard Heap Problems';
    }
    return 'Medium Heap Problems';
  }

  // 14. Greedy & Intervals
  if (topic === 'Greedy & Intervals') {
    if (['prob-194-', 'prob-195-', 'prob-464-', 'prob-465-', 'prob-466-', 'prob-467-', 'prob-468-', 'prob-469-'].some(prefix => id.startsWith(prefix)) || title.includes('interval') || title.includes('arrows') || title.includes('meeting rooms') || title.includes('video stitching') || title.includes('queue reconstruction') || title.includes('patching')) {
      return 'Intervals';
    }
    if (['prob-182-', 'prob-184-', 'prob-185-', 'prob-400-'].some(prefix => id.startsWith(prefix)) || title.includes('assign cookies') || title.includes('lemonade') || title.includes('minimum number of coins')) {
      return 'Easy Greedy';
    }
    return 'Medium Greedy';
  }

  // 15. Bit Manipulation
  if (topic === 'Bit Manipulation') {
    if (['prob-144-', 'prob-453-', 'prob-454-', 'prob-455-', 'prob-456-'].some(prefix => id.startsWith(prefix)) || title.includes('power set') || title.includes('bitwise and of numbers') || title.includes('hamming distance') || title.includes('product of word lengths') || title.includes('gray code')) {
      return 'Advanced Bit Manipulation';
    }
    if (['prob-387-', 'prob-134-', 'prob-135-', 'prob-136-', 'prob-137-', 'prob-138-', 'prob-140-', 'prob-451-'].some(prefix => id.startsWith(prefix)) || title.includes('introduction to bit') || title.includes('set or not') || title.includes('odd or not') || title.includes('power of 2') || title.includes('count number of set') || title.includes('counting bits') || title.includes('bit flips')) {
      return 'Bit Manipulation Basics';
    }
    return 'XOR & Number Problems';
  }

  // 16. Tries
  if (topic === 'Tries') {
    if (['prob-304-', 'prob-305-', 'prob-428-', 'prob-429-'].some(prefix => id.startsWith(prefix)) || title.includes('maximum xor')) {
      return 'Bitwise Trie';
    }
    if (['prob-298-', 'prob-299-', 'prob-300-', 'prob-301-', 'prob-426-', 'prob-427-'].some(prefix => id.startsWith(prefix)) || title.includes('implement trie') || title.includes('complete string') || title.includes('count distinct substrings')) {
      return 'Trie Construction & Search';
    }
    return 'Advanced Trie Problems';
  }

  return 'General';
}

// Internal difficulty weight for sorting within subtopic
const DIFF_WEIGHT = {
  'Easy': 1,
  'Medium': 2,
  'Hard': 3
};

// Process all problems: assign subtopic and sort
const processedProblems = allProblems.map(p => {
  const subtopic = getProblemSubtopic(p);
  return {
    ...p,
    subtopic
  };
});

// Group by topic, then subtopic
const grouped = {};
TOPIC_ORDER.forEach(t => {
  grouped[t] = {};
  const subs = SUBTOPIC_ORDER[t] || [];
  subs.forEach(s => {
    grouped[t][s] = [];
  });
});

processedProblems.forEach(p => {
  if (!grouped[p.topic]) {
    console.warn(`Unknown topic for problem ${p.id}: ${p.topic}`);
    grouped[p.topic] = {};
  }
  if (!grouped[p.topic][p.subtopic]) {
    console.warn(`Unknown subtopic for problem ${p.id}: ${p.topic} -> ${p.subtopic}`);
    grouped[p.topic][p.subtopic] = [];
  }
  grouped[p.topic][p.subtopic].push(p);
});

// Sort within each subtopic:
// - Foundational problems first (intro, basics, lower problem IDs if similar)
// - Then by Difficulty (Easy -> Medium -> Hard)
// - Preserve original relative order when same difficulty to keep curated pedagogical sequence
Object.keys(grouped).forEach(topic => {
  Object.keys(grouped[topic]).forEach(subtopic => {
    const list = grouped[topic][subtopic];
    list.sort((a, b) => {
      // Intro problems always first
      const aIsIntro = a.title.toLowerCase().includes('introduction') || a.title.toLowerCase().includes('representation') || a.id.includes('404-preorder-inorder') || a.id.includes('387-introduction') || a.id.includes('411-introduction') || a.id.includes('376-introduction') || a.id.includes('330-introduction') || a.id.includes('389-implement') || a.id.includes('396-check') || a.id.includes('298-implement');
      const bIsIntro = b.title.toLowerCase().includes('introduction') || b.title.toLowerCase().includes('representation') || b.id.includes('404-preorder-inorder') || b.id.includes('387-introduction') || b.id.includes('411-introduction') || b.id.includes('376-introduction') || b.id.includes('330-introduction') || b.id.includes('389-implement') || b.id.includes('396-check') || b.id.includes('298-implement');
      if (aIsIntro && !bIsIntro) return -1;
      if (!aIsIntro && bIsIntro) return 1;

      const diffDiff = (DIFF_WEIGHT[a.difficulty] || 2) - (DIFF_WEIGHT[b.difficulty] || 2);
      if (diffDiff !== 0) return diffDiff;

      return 0; // maintain curated relative stability
    });
  });
});

// Flatten in strict topic & subtopic sequence
const finalOrderedProblems = [];
let orderCounter = 1;

TOPIC_ORDER.forEach(topic => {
  const subs = SUBTOPIC_ORDER[topic] || Object.keys(grouped[topic]);
  subs.forEach(subtopic => {
    const probs = grouped[topic][subtopic] || [];
    probs.forEach(p => {
      p.orderIndex = orderCounter++;
      finalOrderedProblems.push(p);
    });
  });
});

console.log(`Reordered total: ${finalOrderedProblems.length} problems.`);

// Sanity checks
if (finalOrderedProblems.length !== allProblems.length) {
  console.error(`ERROR: Length mismatch! Expected ${allProblems.length}, got ${finalOrderedProblems.length}`);
  process.exit(1);
}

const seenFinalIds = new Set();
finalOrderedProblems.forEach((p, idx) => {
  if (seenFinalIds.has(p.id)) {
    console.error(`ERROR: Duplicate ID in final list: ${p.id}`);
    process.exit(1);
  }
  seenFinalIds.add(p.id);
  if (!p.subtopic) {
    console.error(`ERROR: Problem ${p.id} missing subtopic!`);
    process.exit(1);
  }
});

console.log('Sanity checks passed! Writing updated default-sheets.js...');

// Generate formatted output file
const code = `/**
 * Complete Striver's A2Z DSA Sheet + NeetCode 150 + Striver SDE + Blind 75 Master Dataset
 * Total Problems: ${finalOrderedProblems.length}
 * 100% Comprehensive, Ordered Subtopic-Wise in Exact Pedagogical Learning Sequence
 * Zero duplicate problems, fully categorized across all 16 DSA Topics & Subtopics
 */

const DEFAULT_DSA_SHEETS = ${JSON.stringify(finalOrderedProblems, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_DSA_SHEETS;
}
if (typeof window !== 'undefined') {
  window.DEFAULT_DSA_SHEETS = DEFAULT_DSA_SHEETS;
}
`;

fs.writeFileSync(sheetsPath, code, 'utf8');
console.log('Successfully wrote updated default-sheets.js!');
