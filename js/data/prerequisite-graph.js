/**
 * AlgoRecall 2.0 - Prerequisite Learning Graph Definition
 * Defines foundational topic nodes, pattern nodes, and directed dependencies.
 */

(function () {
  'use strict';

  const DSA_PREREQUISITE_GRAPH = [
    {
      id: 'node-basics-math',
      title: 'Basics, Math & Bitwise',
      topic: 'Basics & Math',
      patterns: ['Bit Manipulation', 'Math & Number Theory'],
      level: 1,
      prerequisites: [],
      summary: 'Number theory, bitwise operations, gcd, primes, and space-time complexity analysis fundamentals.',
      canonicalProblemIds: ['p-math-1', 'p-bit-1', 'p-bit-2'],
      recommendedNextSteps: 'Master bit manipulation tricks and mathematical modulo operations.'
    },
    {
      id: 'node-arrays-hashing',
      title: 'Arrays & Hash Maps',
      topic: 'Arrays & Hashing',
      patterns: ['Prefix Sum', 'Frequency Map', 'Two Sum Pattern'],
      level: 1,
      prerequisites: ['node-basics-math'],
      summary: 'Constant-time dictionary lookup, prefix sums, running totals, and array indexing.',
      canonicalProblemIds: ['two-sum', 'valid-anagram', 'group-anagrams', 'subarray-sum-equals-k'],
      recommendedNextSteps: 'Advance to two pointers and sliding window on arrays.'
    },
    {
      id: 'node-two-pointers',
      title: 'Two Pointers (Opposite & Fast/Slow)',
      topic: 'Sliding Window & Two Pointers',
      patterns: ['Two Pointers', 'Fast & Slow Pointers'],
      level: 2,
      prerequisites: ['node-arrays-hashing'],
      summary: 'Converging pointers on sorted arrays, partition schemes, and in-place manipulations.',
      canonicalProblemIds: ['two-sum-ii', '3sum', 'container-with-most-water', 'trapping-rain-water'],
      recommendedNextSteps: 'Learn variable-sized and fixed-sized sliding window.'
    },
    {
      id: 'node-sliding-window',
      title: 'Sliding Window (Fixed & Variable)',
      topic: 'Sliding Window & Two Pointers',
      patterns: ['Sliding Window (Dynamic)', 'Sliding Window (Fixed)'],
      level: 3,
      prerequisites: ['node-two-pointers'],
      summary: 'Subarray and substring optimization with expanding right pointer and contracting left pointer.',
      canonicalProblemIds: ['longest-substring-without-repeating-characters', 'minimum-window-substring', 'longest-repeating-character-replacement'],
      recommendedNextSteps: 'Use hash maps inside sliding windows to solve hard string problems.'
    },
    {
      id: 'node-binary-search',
      title: 'Binary Search & Monotonic Space',
      topic: 'Binary Search',
      patterns: ['Binary Search', 'Binary Search on Answer'],
      level: 2,
      prerequisites: ['node-arrays-hashing'],
      summary: 'Logarithmic search on sorted arrays, rotated arrays, and monotonic predicate functions.',
      canonicalProblemIds: ['binary-search', 'search-in-rotated-sorted-array', 'koko-eating-bananas', 'split-array-largest-sum'],
      recommendedNextSteps: 'Practice binary search on monotonic answer spaces.'
    },
    {
      id: 'node-linked-list',
      title: 'Linked List Traversal & Pointers',
      topic: 'Linked List',
      patterns: ['Fast & Slow Pointers', 'In-place Reversal', 'Dummy Head Technique'],
      level: 2,
      prerequisites: ['node-two-pointers'],
      summary: 'Pointer manipulation, reversal, cycle detection with Floyd’s tortoise and hare, and merge lists.',
      canonicalProblemIds: ['reverse-linked-list', 'merge-two-sorted-lists', 'linked-list-cycle', 'reorder-list', 'lru-cache'],
      recommendedNextSteps: 'Build LRU Cache combining doubly linked lists and hash maps.'
    },
    {
      id: 'node-stack-queue',
      title: 'Stack & Monotonic Stack',
      topic: 'Stack & Queue',
      patterns: ['Monotonic Stack', 'Parentheses Validation', 'Min Stack'],
      level: 2,
      prerequisites: ['node-arrays-hashing'],
      summary: 'LIFO evaluation, Next Greater Element, histogram maximum area, and sliding window maximum.',
      canonicalProblemIds: ['valid-parentheses', 'min-stack', 'daily-temperatures', 'largest-rectangle-in-histogram'],
      recommendedNextSteps: 'Apply monotonic stacks to hard 2D geometric and histogram problems.'
    },
    {
      id: 'node-recursion',
      title: 'Recursion Fundamentals & Divide and Conquer',
      topic: 'Recursion & Backtracking',
      patterns: ['Divide and Conquer', 'Call Stack & Base Cases'],
      level: 2,
      prerequisites: ['node-basics-math'],
      summary: 'Recursive formulation, recurrence relations, tree recursion, and merge/quick sort schemes.',
      canonicalProblemIds: ['powx-n', 'subsets', 'combination-sum'],
      recommendedNextSteps: 'Advance to Tree traversals and state-space backtracking search.'
    },
    {
      id: 'node-trees-bst',
      title: 'Binary Trees & Binary Search Trees',
      topic: 'Binary Trees & BST',
      patterns: ['DFS Tree Traversal', 'BFS Level Order', 'BST Properties'],
      level: 3,
      prerequisites: ['node-recursion', 'node-stack-queue'],
      summary: 'Pre/in/post-order traversals, lowest common ancestor, diameter, and tree path sums.',
      canonicalProblemIds: ['maximum-depth-of-binary-tree', 'invert-binary-tree', 'binary-tree-level-order-traversal', 'lowest-common-ancestor-of-a-binary-search-tree', 'binary-tree-maximum-path-sum'],
      recommendedNextSteps: 'Extend DFS and BFS intuition to general directed and undirected graphs.'
    },
    {
      id: 'node-backtracking',
      title: 'Backtracking & State Exploration',
      topic: 'Recursion & Backtracking',
      patterns: ['State Space Tree', 'Pruning', 'Permutations & Subsets'],
      level: 3,
      prerequisites: ['node-recursion'],
      summary: 'Generate subsets, permutations, N-Queens, Sudoku solver, and word search backtracking.',
      canonicalProblemIds: ['subsets', 'permutations', 'word-search', 'n-queens'],
      recommendedNextSteps: 'Transition from exhaustive backtracking to Dynamic Programming memoization.'
    },
    {
      id: 'node-heap-pq',
      title: 'Heap / Priority Queue & Two Heaps',
      topic: 'Heap / Priority Queue',
      patterns: ['Top K Elements', 'Two Heaps Median', 'K-Way Merge'],
      level: 3,
      prerequisites: ['node-trees-bst'],
      summary: 'Binary min/max heaps, maintaining running median, and merging K sorted streams.',
      canonicalProblemIds: ['kth-largest-element-in-an-array', 'find-median-from-data-stream', 'merge-k-sorted-lists'],
      recommendedNextSteps: 'Combine priority queues with Dijkstra algorithm on weighted graphs.'
    },
    {
      id: 'node-graphs',
      title: 'Graphs: BFS, DFS & Cycles',
      topic: 'Graphs',
      patterns: ['Graph BFS / DFS', 'Connected Components', 'Cycle Detection'],
      level: 3,
      prerequisites: ['node-trees-bst'],
      summary: 'Adjacency list representations, island counting, shortest path in unweighted graphs, and bipartite check.',
      canonicalProblemIds: ['number-of-islands', 'clone-graph', 'pacific-atlantic-water-flow', 'course-schedule'],
      recommendedNextSteps: 'Learn Topological Sorting and Disjoint Set Union (Union-Find).'
    },
    {
      id: 'node-topological-unionfind',
      title: 'Topological Sort & Union-Find (DSU)',
      topic: 'Graphs',
      patterns: ['Kahn Algorithm', 'Topological Sort', 'Disjoint Set Union'],
      level: 4,
      prerequisites: ['node-graphs'],
      summary: 'Dependency resolution, DAG orderings, Kruskal minimum spanning tree, and redundant connections.',
      canonicalProblemIds: ['course-schedule-ii', 'redundant-connection', 'number-of-connected-components-in-an-undirected-graph'],
      recommendedNextSteps: 'Tackle shortest path algorithms (Dijkstra, Bellman-Ford).'
    },
    {
      id: 'node-dp-1d',
      title: 'Dynamic Programming: 1D & Memoization',
      topic: 'Dynamic Programming',
      patterns: ['1D DP State', 'Fibonacci Sequence', 'Pick / Don’t Pick', 'House Robber'],
      level: 4,
      prerequisites: ['node-backtracking', 'node-recursion'],
      summary: 'Optimal substructure, overlapping subproblems, memoization vs bottom-up space-optimized tabulation.',
      canonicalProblemIds: ['climbing-stairs', 'house-robber', 'house-robber-ii', 'coin-change', 'longest-increasing-subsequence'],
      recommendedNextSteps: 'Master 2D grid DP and Knapsack variants.'
    },
    {
      id: 'node-dp-2d',
      title: 'Dynamic Programming: 2D Grids, Knapsack & Subsequences',
      topic: 'Dynamic Programming',
      patterns: ['2D Grid DP', '0/1 Knapsack', 'LCS & Edit Distance', 'Interval DP'],
      level: 5,
      prerequisites: ['node-dp-1d'],
      summary: 'Unique paths, Longest Common Subsequence, target sum, partition subset sum, and matrix chain multiplication.',
      canonicalProblemIds: ['unique-paths', 'longest-common-subsequence', 'edit-distance', 'coin-change-ii', 'burst-balloons'],
      recommendedNextSteps: 'Apply bitmask DP and digit DP on advanced problems.'
    },
    {
      id: 'node-tries',
      title: 'Tries (Prefix Trees)',
      topic: 'Tries',
      patterns: ['Prefix Tree', 'Bitwise XOR Trie'],
      level: 4,
      prerequisites: ['node-trees-bst'],
      summary: 'Prefix string insertion, search, auto-complete, wildcard search, and maximum XOR pair.',
      canonicalProblemIds: ['implement-trie-prefix-tree', 'design-add-and-search-words-data-structure', 'word-search-ii', 'maximum-xor-of-two-numbers-in-an-array'],
      recommendedNextSteps: 'Combine Trie with backtracking for 2D boggle word search.'
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DSA_PREREQUISITE_GRAPH;
  }
  if (typeof window !== 'undefined') {
    window.DSA_PREREQUISITE_GRAPH = DSA_PREREQUISITE_GRAPH;
  }
})();
