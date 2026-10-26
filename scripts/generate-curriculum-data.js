/**
 * Script to generate js/data/roadmap-120-curriculum.js
 * Contains the EXACT 120-day specifications for Stream A and Stream B,
 * organized in pure, unmixed topic order with ZERO duplicate problems across days:
 *
 * Stream A:
 *   Days 1–30:   Full Graphs (30 Days) -> 35 unique catalog problems
 *   Days 31–55:  Full Binary Trees & BST (25 Days) -> 49 unique catalog problems
 *   Days 56–85:  Full Dynamic Programming (30 Days) -> 60 unique catalog problems
 *   Days 86–95:  Full Recursion & Backtracking (10 Days) -> 22 unique catalog problems
 *   Days 96–105: Full Greedy & Intervals (10 Days) -> 21 unique catalog problems
 *   Days 106–113: Full Heap / Priority Queue (8 Days) -> 21 unique catalog problems
 *   Days 114–120: Full Tries & Advanced Assessment (7 Days) -> 17 unique catalog problems
 *
 * Stream B (Foundations Revision):
 *   Days 1–10:   Basics & Math (10 Days)
 *   Days 11–24:  Arrays & Hashing (14 Days)
 *   Days 25–34:  Strings (10 Days)
 *   Days 35–44:  Sliding Window & Two Pointers (10 Days)
 *   Days 45–50:  Sorting (6 Days)
 *   Days 51–60:  Binary Search (10 Days)
 *   Days 61–70:  Linked List (10 Days)
 *   Days 71–80:  Stack & Queue (10 Days)
 *   Days 81–86:  Bit Manipulation (6 Days)
 *   Days 87–94:  Recursion & Backtracking (8 Days)
 *   Days 95–104: Binary Trees & BST (10 Days)
 *   Days 105–109: Heap / Priority Queue (5 Days)
 *   Days 110–114: Graphs (5 Days)
 *   Days 115–118: Dynamic Programming (4 Days)
 *   Days 119–120: Greedy & Intervals / Foundation Mastery Audit (2 Days)
 */
const fs = require('fs');
const path = require('path');

const allProblems = require(path.join(__dirname, '..', 'js', 'data', 'default-sheets'));

// Map problems by topic
const topicProblemsMap = {};
allProblems.forEach(p => {
  if (!topicProblemsMap[p.topic]) topicProblemsMap[p.topic] = [];
  topicProblemsMap[p.topic].push(p);
});

// 1. Raw text for Stream A (Mastery Track, 120 Days) - STRICT UNMIXED TOPIC ORDER
const STREAM_A_RAW = [
  // Block 1: Full Graphs (Days 1–30)
  "Day 1: Graph representation, adjacency list, adjacency matrix and graph storage.",
  "Day 2: BFS traversal, queues, visited array and connected components.",
  "Day 3: DFS traversal, recursive and iterative traversal patterns.",
  "Day 4: Grid BFS/DFS, Number of Islands and matrix flood fill.",
  "Day 5: Undirected cycle detection using BFS and DFS.",
  "Day 6: Directed cycle detection, recursion stack and state coloring.",
  "Day 7: Topological sorting using Kahn's algorithm (BFS in-degree).",
  "Day 8: Topological sorting using DFS and course ordering.",
  "Day 9: Bipartite graph checking using BFS and DFS (Two-coloring).",
  "Day 10: Multisource BFS, 0-1 Matrix and rotting oranges.",
  "Day 11: Shortest paths in unweighted graphs using BFS.",
  "Day 12: Dijkstra's algorithm, priority queues and shortest path trees.",
  "Day 13: Dijkstra practice, shortest path in binary matrix and variations.",
  "Day 14: Bellman-Ford algorithm and negative cycle detection.",
  "Day 15: Floyd-Warshall algorithm and all-pairs shortest paths.",
  "Day 16: 0-1 BFS and minimum effort path variants.",
  "Day 17: Disjoint Set Union (DSU) by rank/size with path compression.",
  "Day 18: Kruskal's Minimum Spanning Tree algorithm using DSU.",
  "Day 19: Prim's Minimum Spanning Tree algorithm using priority queues.",
  "Day 20: Bridges in graph and Tarjan's critical connections algorithm.",
  "Day 21: Strongly Connected Components using Kosaraju's algorithm.",
  "Day 22: Articulation points and Tarjan's low-link discovery.",
  "Day 23: DAG shortest paths, longest paths and graph DP patterns.",
  "Day 24: Word Ladder, shortest transformation sequences and graph modeling.",
  "Day 25: Graph connectivity, redundant connections and network components.",
  "Day 26: Shortest path optimization, cheapest flights and network delay time.",
  "Day 27: Advanced DSU, stones removal and accounts merge.",
  "Day 28: Word Ladder II, all shortest paths and backtracking with BFS.",
  "Day 29: Graph error diagnosis, weak-pattern repair and failed problems.",
  "Day 30: Comprehensive graph assessment, timed practice and mastery audit.",

  // Block 2: Full Binary Trees & BST (Days 31–55)
  "Day 31: Binary tree node structure, pointer properties and DFS traversals introduction.",
  "Day 32: Inorder traversal (Recursive & Iterative) with call stack analysis.",
  "Day 33: Preorder and Postorder traversals (Recursive & Iterative with stack).",
  "Day 34: Level order traversal, BFS using queue and level-by-level processing.",
  "Day 35: Zigzag spiral level order traversal and vertical tree order.",
  "Day 36: Tree height, maximum depth and balanced binary tree verification.",
  "Day 37: Tree diameter, O(N) optimized postorder diameter calculation.",
  "Day 38: Maximum path sum in binary tree (any node to any node).",
  "Day 39: Check identical binary trees and symmetric mirror tree validation.",
  "Day 40: Boundary traversal of binary tree (Left boundary, leaf nodes, right boundary).",
  "Day 41: Tree views: Top view and Bottom view using vertical coordinate hashing.",
  "Day 42: Tree views: Left view and Right view using level-order and recursive DFS.",
  "Day 43: Root-to-leaf paths, path sum I & II with target sum verification.",
  "Day 44: Lowest Common Ancestor (LCA) in binary tree and paths between two nodes.",
  "Day 45: Maximum width of binary tree using index-based level order.",
  "Day 46: Children sum property and check for children sum parent invariants.",
  "Day 47: All nodes distance K in binary tree using parent pointer mapping.",
  "Day 48: Minimum time taken to burn the binary tree from a given node.",
  "Day 49: Construct binary tree from preorder and inorder traversal arrays.",
  "Day 50: Construct binary tree from postorder and inorder traversal arrays.",
  "Day 51: Serialize and deserialize binary tree (Level order and DFS string encoding).",
  "Day 52: Flatten binary tree to linked list (Morris traversal and reverse postorder).",
  "Day 53: Introduction to Binary Search Trees: BST properties, search and min/max.",
  "Day 54: BST operations: Insert node, delete node and BST validation invariants.",
  "Day 55: BST advanced: Kth smallest/largest, LCA in BST, two sum in BST and recover BST.",

  // Block 3: Full Dynamic Programming (Days 56–85)
  "Day 56: DP fundamentals, overlapping subproblems and optimal substructure.",
  "Day 57: Memoization (Top-down) vs Tabulation (Bottom-up) and state definition.",
  "Day 58: 1D DP: Fibonacci, Climbing Stairs and Frog Jump with K distance.",
  "Day 59: 1D DP: House Robber I & II and maximum non-adjacent sum.",
  "Day 60: 1D DP: Ninja's Training and multi-activity daily transitions.",
  "Day 61: 2D Grid DP: Unique Paths I & II with obstacles and boundary conditions.",
  "Day 62: 2D Grid DP: Minimum Path Sum and Triangle minimum path total.",
  "Day 63: 2D Grid DP: Maximum falling path sum and variable start/end points.",
  "Day 64: 3D Grid DP: Chocolate Pickup (Alice and Bob 3D state transitions).",
  "Day 65: Subsequence DP: Subset Sum equals target K (Decision space analysis).",
  "Day 66: Subsequence DP: Partition Equal Subset Sum and Boolean DP table.",
  "Day 67: Subsequence DP: Minimum sum partition difference into two subsets.",
  "Day 68: Subsequence DP: Count subsets with sum K and partitions with given difference.",
  "Day 69: Subsequence DP: Target Sum problem (transformation to subset difference).",
  "Day 70: Knapsack DP: 0/1 Knapsack problem (Weight vs Value recurrence).",
  "Day 71: Knapsack DP: Unbounded Knapsack problem and Rod Cutting optimization.",
  "Day 72: Knapsack DP: Coin Change I (Minimum coins to make target amount).",
  "Day 73: Knapsack DP: Coin Change II (Total distinct combinations/ways).",
  "Day 74: LIS DP: Longest Increasing Subsequence O(N²) state definition.",
  "Day 75: LIS DP: Printing the Longest Increasing Subsequence (Backtracking hash).",
  "Day 76: LIS DP: Longest Increasing Subsequence O(N log N) using binary search.",
  "Day 77: LIS DP: Largest Divisible Subset and Longest String Chain.",
  "Day 78: LIS DP: Longest Bitonic Subsequence and Number of Longest Increasing Subsequences.",
  "Day 79: String DP: Longest Common Subsequence (LCS) and printing LCS string.",
  "Day 80: String DP: Longest Common Substring and Shortest Common Supersequence.",
  "Day 81: String DP: Minimum insertions/deletions to convert string A to string B.",
  "Day 82: String DP: Longest Palindromic Subsequence and minimum insertions for palindrome.",
  "Day 83: String DP: Distinct Subsequences (Count occurrences of string S2 in S1).",
  "Day 84: String DP: Edit Distance (Levenshtein distance: Insert, Delete, Replace).",
  "Day 85: Advanced DP: Wildcard Matching, Regular Expression Matching and Matrix Chain Multiplication.",

  // Block 4: Full Recursion & Backtracking (Days 86–95)
  "Day 86: Recursion fundamentals, recursion tree visualization and base case discipline.",
  "Day 87: Subsets and Power Set using include/exclude recursion.",
  "Day 88: Subsets II: Handling duplicates with sorting and branch skipping.",
  "Day 89: Combination Sum I: Target reduction with element reuse.",
  "Day 90: Combination Sum II: Target reduction with single-use and duplicate pruning.",
  "Day 91: Combination Sum III and Letter Combinations of a Phone Number.",
  "Day 92: Permutations I & II: State tracking, visited arrays and swapping.",
  "Day 93: N-Queens problem: Chessboard constraints, column/diagonal bitmasking.",
  "Day 94: Sudoku Solver: 9x9 grid constraints, subgrid hashing and recursive backtracking.",
  "Day 95: Word Search & Palindrome Partitioning: 2D grid backtracking and pruning.",

  // Block 5: Full Greedy & Intervals (Days 96–105)
  "Day 96: Greedy choice property, optimal substructure and exchange argument.",
  "Day 97: Assign Cookies and Lemonade Change (Single-pass greedy decisions).",
  "Day 98: Fractional Knapsack problem using value-to-weight ratio sorting.",
  "Day 99: Minimum number of coins / greedy coin change property.",
  "Day 100: Interval scheduling: Activity Selection and N meetings in one room.",
  "Day 101: Interval scheduling: Minimum platforms required for trains at station.",
  "Day 102: Job Sequencing problem with deadlines and profit maximization.",
  "Day 103: Interval operations: Insert Interval into sorted non-overlapping list.",
  "Day 104: Interval operations: Merge Overlapping Intervals and Non-overlapping intervals.",
  "Day 105: Jump Game I & Jump Game II: Reachability and minimum jumps greedy.",

  // Block 6: Full Heap / Priority Queue (Days 106–113)
  "Day 106: Binary Heap representation: Array layout, parent/child indices and heapify.",
  "Day 107: Priority Queue operations: Push, pop, sift-up, sift-down and custom comparators.",
  "Day 108: Top-K elements: Kth largest element in an array using min-heap.",
  "Day 109: Kth smallest element in an array and Top K Frequent Elements.",
  "Day 110: K Closest Points to Origin and Sort Characters By Frequency.",
  "Day 111: Merge K Sorted Lists and Merge K Sorted Arrays using min-heap.",
  "Day 112: Task Scheduler: CPU scheduling with cooldown and frequency heap.",
  "Day 113: Find Median from Data Stream using dual heaps (Max-heap + Min-heap).",

  // Block 7: Full Tries & Advanced Assessment (Days 114–120)
  "Day 114: Trie node structure, Trie class, insert word, search word and startsWith prefix.",
  "Day 115: Implement Trie II (Prefix tree with countWordsEqualTo and countWordsStartingWith).",
  "Day 116: Complete String: Longest string with all prefixes present in array.",
  "Day 117: Count Distinct Substrings in a string using Trie.",
  "Day 118: Bitwise Trie: Maximum XOR of two numbers in an array.",
  "Day 119: Bitwise Trie: Maximum XOR with an element from array (Offline queries).",
  "Day 120: Word Search II: Advanced Trie integration with 2D grid backtracking and final assessment."
];

// 2. Raw text for Stream B (Foundation Revision Track, 120 Days) - STRICT UNMIXED ORDER
const STREAM_B_RAW = [
  // Block 1: Basics & Math (Days 1–10)
  "Day 1: Maths fundamentals, complexity basics, divisibility, GCD/LCM and Euclidean algorithm.",
  "Day 2: Count digits, reverse number and palindrome number check.",
  "Day 3: Prime numbers, Sieve of Eratosthenes and prime factorisation.",
  "Day 4: Modulo arithmetic rules and fast exponentiation (Binary Exponentiation).",
  "Day 5: Divisors, perfect numbers and Armstrong numbers.",
  "Day 6: Factorials, trailing zeroes in factorial and combination mathematics.",
  "Day 7: Bitwise math basics, odd/even checks and power of two.",
  "Day 8: Euclidean GCD algorithms and basic number theory.",
  "Day 9: Maths complexity analysis, recurrence relations and big-O notation.",
  "Day 10: Maths and foundation problem-solving review.",

  // Block 2: Arrays & Hashing (Days 11–24)
  "Day 11: Array traversal, insertion, deletion and linear search.",
  "Day 12: Find largest, second largest element and check if array is sorted.",
  "Day 13: Remove duplicates from sorted array and left rotate array by one/D places.",
  "Day 14: Move zeroes to end and linear search in array.",
  "Day 15: Find union and intersection of two sorted arrays.",
  "Day 16: Find missing number in an array and count maximum consecutive ones.",
  "Day 17: Find single number that appears once while other numbers appear twice.",
  "Day 18: Longest subarray with given sum K (Positives and Negatives using HashMap).",
  "Day 19: Two Sum problem: Brute force, HashMap and Two Pointers.",
  "Day 20: Sort array of 0s, 1s and 2s (Dutch National Flag Algorithm).",
  "Day 21: Majority Element (More than N/2 times using Boyer-Moore Voting Algorithm).",
  "Day 22: Kadane's Algorithm for Maximum Subarray Sum.",
  "Day 23: Rearrange array elements by sign and find next permutation.",
  "Day 24: Leaders in an array, longest consecutive sequence and set matrix zeroes.",

  // Block 3: Strings (Days 25–34)
  "Day 25: String basics: Immutability, char arrays and ASCII manipulation.",
  "Day 26: Remove outermost parentheses and reverse words in a string.",
  "Day 27: Largest odd number in string and longest common prefix.",
  "Day 28: Isomorphic strings and check whether one string is a rotation of another.",
  "Day 29: Valid Anagram check using character frequency count.",
  "Day 30: Sort characters by frequency and maximum nesting depth of parentheses.",
  "Day 31: Roman number to integer and integer to Roman number conversion.",
  "Day 32: String to integer (atoi) implementation and edge case handling.",
  "Day 33: Count and say sequence and repeated substring pattern.",
  "Day 34: Strings foundation review and rapid pattern recall.",

  // Block 4: Sliding Window & Two Pointers (Days 35–44)
  "Day 35: Introduction to Two Pointers: Opposite-direction pointers on sorted arrays.",
  "Day 36: Container with most water and 3Sum problem (Opposite-ends approach).",
  "Day 37: 4Sum problem: Four pointers with duplicate skipping.",
  "Day 38: Trapping Rain Water using two-pointer space-optimized approach.",
  "Day 39: Introduction to Sliding Window: Fixed window vs Variable window.",
  "Day 40: Maximum sum subarray of size K (Fixed window template).",
  "Day 41: Longest substring without repeating characters (Variable window with Set/Map).",
  "Day 42: Max consecutive ones III (At most K flips) and fruit into baskets.",
  "Day 43: Longest repeating character replacement (Frequency map with window size).",
  "Day 44: Minimum window substring (Character counts deficit tracking).",

  // Block 5: Sorting (Days 45–50)
  "Day 45: Selection Sort: Minimum element selection and stability analysis.",
  "Day 46: Bubble Sort: Adjacent element swaps and early break optimization.",
  "Day 47: Insertion Sort: Shift-based insertion into sorted prefix.",
  "Day 48: Merge Sort: Divide, conquer and two-way merge subroutine.",
  "Day 49: Quick Sort: Lomuto vs Hoare partition schemes and pivot selection.",
  "Day 50: Custom comparators and sorting stability in interview problems.",

  // Block 6: Binary Search (Days 51–60)
  "Day 51: Binary search fundamentals: Search space, loop invariant and mid overflow.",
  "Day 52: Lower Bound and Upper Bound implementations.",
  "Day 53: Search insert position, floor and ceil in a sorted array.",
  "Day 54: First and last occurrence of an element and count occurrences.",
  "Day 55: Search in rotated sorted array I (Unique elements).",
  "Day 56: Search in rotated sorted array II (Duplicates present).",
  "Day 57: Find minimum in rotated sorted array and single element in sorted array.",
  "Day 58: Find peak element in array using binary search.",
  "Day 59: Binary search on answer space: Square root and Koko eating bananas.",
  "Day 60: Binary search on answer space: Minimum days to make M bouquets and book allocation.",

  // Block 7: Linked List (Days 61–70)
  "Day 61: Singly Linked List: Node definition, insertion at head/tail and deletion.",
  "Day 62: Doubly Linked List: Bidirectional pointers, insertion and deletion.",
  "Day 63: Reverse a singly linked list (Iterative with 3 pointers and Recursive).",
  "Day 64: Middle of the linked list (Tortoise and Hare fast/slow pointer).",
  "Day 65: Detect loop/cycle in linked list (Floyd's Cycle-Finding Algorithm).",
  "Day 66: Find starting point of loop in linked list and calculate length of loop.",
  "Day 67: Check if a linked list is a palindrome (Find mid, reverse second half).",
  "Day 68: Segregate odd and even indexed nodes and remove Nth node from end of list.",
  "Day 69: Delete middle node of linked list and intersection point of two lists.",
  "Day 70: Merge two sorted linked lists and add two numbers represented as lists.",

  // Block 8: Stack & Queue (Days 71–80)
  "Day 71: Stack implementation using array and linked list (LIFO principle).",
  "Day 72: Queue implementation using array and linked list (FIFO principle).",
  "Day 73: Implement stack using queues and implement queue using stacks.",
  "Day 74: Check for balanced parentheses using stack.",
  "Day 75: Next Greater Element (NGE) using Monotonic Stack.",
  "Day 76: Next Smaller Element and Previous Greater Element patterns.",
  "Day 77: Trapping Rain Water using monotonic stack.",
  "Day 78: Largest Rectangle in Histogram using monotonic increasing stack.",
  "Day 79: Sliding Window Maximum using monotonic deque.",
  "Day 80: Min Stack implementation (O(1) time and auxiliary space).",

  // Block 9: Bit Manipulation (Days 81–86)
  "Day 81: Bitwise operators: AND, OR, XOR, NOT, Left Shift, Right Shift.",
  "Day 82: Check if Kth bit is set, set Kth bit, clear Kth bit and toggle Kth bit.",
  "Day 83: Check if number is odd/even, power of two and count set bits (Brian Kernighan).",
  "Day 84: Single number I (Every element appears twice except one using XOR).",
  "Day 85: Single number II (Elements appear 3 times) and Single number III (Two unique elements).",
  "Day 86: Power Set using bitmasking (Generate all 2^N subsets).",

  // Block 10: Recursion & Backtracking (Days 87–94)
  "Day 87: Recursion basics: Base cases, call stack and Fibonacci sequence.",
  "Day 88: Print 1 to N, N to 1 and sum of first N natural numbers recursively.",
  "Day 89: Reverse an array recursively and check if string is palindrome recursively.",
  "Day 90: Subsequences of a string / array (Include/Exclude recursion tree).",
  "Day 91: Combination Sum I (Pick / Not Pick with repetition).",
  "Day 92: Combination Sum II (Unique combinations without element reuse).",
  "Day 93: Subset Sum I & II (Handling duplicates in subsets).",
  "Day 94: Permutations of an array/string (Swap vs Visited array).",

  // Block 11: Binary Trees & BST (Days 95–104)
  "Day 95: Binary tree representation, DFS traversals (Inorder, Preorder, Postorder).",
  "Day 96: Level order traversal (BFS) using queue.",
  "Day 97: Maximum depth / height of binary tree and balanced tree check.",
  "Day 98: Diameter of binary tree and check identical binary trees.",
  "Day 99: Zigzag traversal and boundary traversal of binary tree.",
  "Day 100: Top view, bottom view, left view and right view of binary tree.",
  "Day 101: Lowest Common Ancestor (LCA) in binary tree.",
  "Day 102: Introduction to BST: Search in BST and find Min/Max in BST.",
  "Day 103: Floor and Ceil in BST and Insert node in BST.",
  "Day 104: Delete node in BST and validate binary search tree.",

  // Block 12: Heap / Priority Queue (Days 105–109)
  "Day 105: Binary heap array representation, heapify algorithm and heap sort.",
  "Day 106: Kth largest element in an array and Kth smallest element.",
  "Day 107: Top K frequent elements using min-heap.",
  "Day 108: Merge K sorted arrays using priority queue.",
  "Day 109: Find median from running data stream using max-heap and min-heap.",

  // Block 13: Graphs (Days 110–114)
  "Day 110: Graph representation: Adjacency matrix vs Adjacency list.",
  "Day 111: BFS and DFS traversals of graph with connected components.",
  "Day 112: Detect cycle in undirected graph (BFS & DFS) and directed graph (DFS).",
  "Day 113: Topological sort using Kahn's algorithm (BFS in-degree) and DFS.",
  "Day 114: Dijkstra's Algorithm for single-source shortest path with priority queue.",

  // Block 14: Dynamic Programming (Days 115–118)
  "Day 115: Introduction to DP: Memoization vs Tabulation, Climbing Stairs and Frog Jump.",
  "Day 116: 2D Grid DP: Unique Paths and Minimum Path Sum.",
  "Day 117: Subsequence DP: Subset Sum equals target and 0/1 Knapsack.",
  "Day 118: LIS (Longest Increasing Subsequence) and LCS (Longest Common Subsequence).",

  // Block 15: Greedy & Intervals / Foundation Mastery Audit (Days 119–120)
  "Day 119: Greedy fundamentals: Activity selection, non-overlapping intervals and meeting rooms.",
  "Day 120: Foundation mastery audit and Greedy interval scheduling."
];

// Helper to determine unmixed topic and phase for Stream A
function getStreamATopicAndPhase(dayNum) {
  // Days 1–30: FULL GRAPHS
  if (dayNum <= 30) {
    return { topic: 'Graphs', phase: 'Phase 1: Graphs' };
  }
  // Days 31–55: FULL BINARY TREES & BST
  if (dayNum <= 55) {
    return { topic: 'Binary Trees & BST', phase: 'Phase 2: Binary Trees & BST' };
  }
  // Days 56–85: FULL DYNAMIC PROGRAMMING
  if (dayNum <= 85) {
    return { topic: 'Dynamic Programming', phase: 'Phase 3: Dynamic Programming' };
  }
  // Days 86–95: FULL RECURSION & BACKTRACKING
  if (dayNum <= 95) {
    return { topic: 'Recursion & Backtracking', phase: 'Phase 4: Recursion & Backtracking' };
  }
  // Days 96–105: FULL GREEDY & INTERVALS
  if (dayNum <= 105) {
    return { topic: 'Greedy & Intervals', phase: 'Phase 4: Greedy & Intervals' };
  }
  // Days 106–113: FULL HEAP
  if (dayNum <= 113) {
    return { topic: 'Heap / Priority Queue', phase: 'Phase 4: Heap / Priority Queue' };
  }
  // Days 114–120: FULL TRIES & ADVANCED INTERVIEW PREPARATION
  return { topic: 'Tries', phase: 'Phase 4: Interview Preparation' };
}

// Helper to determine unmixed topic and phase for Stream B
function getStreamBTopicAndPhase(dayNum) {
  if (dayNum <= 10) return { topic: 'Basics & Math', phase: 'Days 1–30: Foundations' };
  if (dayNum <= 24) return { topic: 'Arrays & Hashing', phase: 'Days 1–30: Foundations' };
  if (dayNum <= 34) return { topic: 'Strings', phase: 'Days 31–60: Foundations & Pointers' };
  if (dayNum <= 44) return { topic: 'Sliding Window & Two Pointers', phase: 'Days 31–60: Foundations & Pointers' };
  if (dayNum <= 50) return { topic: 'Sorting', phase: 'Days 31–60: Foundations & Pointers' };
  if (dayNum <= 60) return { topic: 'Binary Search', phase: 'Days 31–60: Foundations & Pointers' };
  if (dayNum <= 70) return { topic: 'Linked List', phase: 'Days 61–90: Linear Data Structures' };
  if (dayNum <= 80) return { topic: 'Stack & Queue', phase: 'Days 61–90: Linear Data Structures' };
  if (dayNum <= 86) return { topic: 'Bit Manipulation', phase: 'Days 61–90: Linear Data Structures' };
  if (dayNum <= 94) return { topic: 'Recursion & Backtracking', phase: 'Days 91–120: Hierarchical & Advanced' };
  if (dayNum <= 104) return { topic: 'Binary Trees & BST', phase: 'Days 91–120: Hierarchical & Advanced' };
  if (dayNum <= 109) return { topic: 'Heap / Priority Queue', phase: 'Days 91–120: Hierarchical & Advanced' };
  if (dayNum <= 114) return { topic: 'Graphs', phase: 'Days 91–120: Hierarchical & Advanced' };
  if (dayNum <= 118) return { topic: 'Dynamic Programming', phase: 'Days 91–120: Hierarchical & Advanced' };
  return { topic: 'Greedy & Intervals', phase: 'Days 91–120: Hierarchical & Advanced' };
}

// Unique problem assignment without any duplicates across days
function assignUniqueProblemsToDays(daysList, topicName) {
  const problems = topicProblemsMap[topicName] || [];
  const D = daysList.length;
  const N = problems.length;
  if (D === 0 || N === 0) return;

  const baseCount = Math.floor(N / D);
  const extraCount = N % D;
  const targets = [];
  for (let i = 0; i < D; i++) {
    targets.push(Math.max(1, baseCount + (i < extraCount ? 1 : 0)));
  }

  // Pre-calculate score for every (day, problem)
  const matrix = daysList.map(d => {
    return problems.map(p => {
      let score = 0;
      const pText = (p.title + ' ' + (p.pattern || '') + ' ' + (p.notes || '')).toLowerCase();
      (d.keywords || []).forEach(kw => {
        if (pText.includes(kw.toLowerCase())) score += 10;
      });
      return { p, score };
    }).sort((a, b) => b.score - a.score);
  });

  const used = new Set();
  const assigned = daysList.map(() => []);

  // Pass 1: Give each day its highest scoring matching unassigned problem
  const maxTarget = Math.max(...targets);
  for (let round = 0; round < maxTarget; round++) {
    for (let i = 0; i < D; i++) {
      if (assigned[i].length < targets[i]) {
        const bestMatch = matrix[i].find(item => !used.has(item.p.id) && item.score > 0);
        if (bestMatch) {
          assigned[i].push(bestMatch.p.id);
          used.add(bestMatch.p.id);
        }
      }
    }
  }

  // Pass 2: Fill remaining target slots from unassigned problems
  for (let i = 0; i < D; i++) {
    while (assigned[i].length < targets[i]) {
      const remaining = matrix[i].find(item => !used.has(item.p.id));
      if (!remaining) break;
      assigned[i].push(remaining.p.id);
      used.add(remaining.p.id);
    }
  }

  // Pass 3: If any problem remains unassigned, distribute to days with smallest count
  problems.forEach(p => {
    if (!used.has(p.id)) {
      let minIdx = 0;
      for (let i = 1; i < D; i++) {
        if (assigned[i].length < assigned[minIdx].length) minIdx = i;
      }
      assigned[minIdx].push(p.id);
      used.add(p.id);
    }
  });

  daysList.forEach((d, idx) => {
    d.suggestedProblemIds = assigned[idx];
    d.targetCount = Math.min(4, Math.max(1, assigned[idx].length));
  });
}

// Build preliminary Stream A days
const streamAItems = STREAM_A_RAW.map((raw, idx) => {
  const dayNum = idx + 1;
  const colonIdx = raw.indexOf(':');
  const subtopic = raw.slice(colonIdx + 1).trim().replace(/\.$/, '');
  const { topic, phase } = getStreamATopicAndPhase(dayNum);

  const keywords = subtopic.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !['using', 'with', 'and', 'from', 'practice', 'patterns', 'basics', 'fundamentals'].includes(w));

  return {
    dayNumber: dayNum,
    phase,
    topic,
    subtopic,
    objectives: `Master ${subtopic} with pattern identification, complexity tradeoffs, and edge case coverage.`,
    keywords,
    suggestedProblemIds: [],
    targetCount: 2,
    estimatedMinutes: 60
  };
});

// Group Stream A by topic block and assign unique problems with zero duplicates
const streamATopicBlocks = [
  { topic: 'Graphs', start: 1, end: 30 },
  { topic: 'Binary Trees & BST', start: 31, end: 55 },
  { topic: 'Dynamic Programming', start: 56, end: 85 },
  { topic: 'Recursion & Backtracking', start: 86, end: 95 },
  { topic: 'Greedy & Intervals', start: 96, end: 105 },
  { topic: 'Heap / Priority Queue', start: 106, end: 113 },
  { topic: 'Tries', start: 114, end: 120 }
];

streamATopicBlocks.forEach(b => {
  const blockDays = streamAItems.slice(b.start - 1, b.end);
  assignUniqueProblemsToDays(blockDays, b.topic);
});

// Build preliminary Stream B days
const streamBItems = STREAM_B_RAW.map((raw, idx) => {
  const dayNum = idx + 1;
  const colonIdx = raw.indexOf(':');
  const subtopic = raw.slice(colonIdx + 1).trim().replace(/\.$/, '');
  const { topic, phase } = getStreamBTopicAndPhase(dayNum);

  const keywords = subtopic.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !['using', 'with', 'and', 'from', 'practice', 'patterns', 'basics', 'fundamentals'].includes(w));

  return {
    dayNumber: dayNum,
    phase,
    topic,
    subtopic,
    objectives: `Rapid foundation recall: ${subtopic}. Reinforce syntax, optimal approaches, and memory invariants.`,
    keywords,
    suggestedProblemIds: [],
    targetCount: 2,
    estimatedMinutes: 35
  };
});

// Group Stream B by topic block and assign unique problems with zero duplicates
const streamBTopicBlocks = [
  { topic: 'Basics & Math', start: 1, end: 10 },
  { topic: 'Arrays & Hashing', start: 11, end: 24 },
  { topic: 'Strings', start: 25, end: 34 },
  { topic: 'Sliding Window & Two Pointers', start: 35, end: 44 },
  { topic: 'Sorting', start: 45, end: 50 },
  { topic: 'Binary Search', start: 51, end: 60 },
  { topic: 'Linked List', start: 61, end: 70 },
  { topic: 'Stack & Queue', start: 71, end: 80 },
  { topic: 'Bit Manipulation', start: 81, end: 86 },
  { topic: 'Recursion & Backtracking', start: 87, end: 94 },
  { topic: 'Binary Trees & BST', start: 95, end: 104 },
  { topic: 'Heap / Priority Queue', start: 105, end: 109 },
  { topic: 'Graphs', start: 110, end: 114 },
  { topic: 'Dynamic Programming', start: 115, end: 118 },
  { topic: 'Greedy & Intervals', start: 119, end: 120 }
];

streamBTopicBlocks.forEach(b => {
  const blockDays = streamBItems.slice(b.start - 1, b.end);
  assignUniqueProblemsToDays(blockDays, b.topic);
});

// Complete Curriculum Taxonomy Audit as specified in Section 6
const TAXONOMY_AREAS = [
  {
    code: 'A',
    area: 'Arrays & Hashing',
    patterns: [
      { name: 'Frequency counting & Hash Maps', tier: 'Core', keywords: ['frequency', 'hash', 'map', 'count'] },
      { name: 'Prefix / Suffix arrays & Range Sum', tier: 'Core', keywords: ['prefix sum', 'range sum', 'product except self'] },
      { name: 'Difference arrays', tier: 'Important', keywords: ['difference array', 'corporate flight'] },
      { name: 'Subarray sums (Equals K, Longest)', tier: 'Core', keywords: ['subarray sum', 'longest subarray'] },
      { name: 'Kadane & Subarray Maximum variants', tier: 'Core', keywords: ['kadane', 'maximum subarray'] },
      { name: 'In-place transformations & Inversions', tier: 'Important', keywords: ['in-place', 'rotate', 'next permutation'] },
      { name: 'Dutch National Flag (0s, 1s, 2s)', tier: 'Core', keywords: ['sort 0s 1s 2s', 'dutch national flag'] },
      { name: 'Cyclic sort / Missing number', tier: 'Important', keywords: ['missing number', 'find duplicate', 'first missing positive'] },
      { name: 'Boyer-Moore Majority Vote', tier: 'Core', keywords: ['majority element'] },
      { name: 'Quickselect (Kth largest/smallest)', tier: 'Important', keywords: ['quickselect', 'kth largest'] },
      { name: '3Sum / 4Sum opposite-ends pointers', tier: 'Core', keywords: ['3sum', '4sum', 'three sum'] },
      { name: 'Longest Consecutive Sequence', tier: 'Core', keywords: ['longest consecutive sequence'] }
    ]
  },
  {
    code: 'B',
    area: 'Strings',
    patterns: [
      { name: 'Character frequency & Anagrams', tier: 'Core', keywords: ['anagram', 'frequency', 'isomorphic'] },
      { name: 'Palindromes & Two Pointers', tier: 'Core', keywords: ['palindrome', 'valid palindrome'] },
      { name: 'Sliding window substring patterns', tier: 'Core', keywords: ['longest substring', 'character replacement'] },
      { name: 'Minimum window substring', tier: 'Important', keywords: ['minimum window substring'] },
      { name: 'KMP Algorithm (Prefix function)', tier: 'Important', keywords: ['kmp', 'lps', 'longest prefix suffix'] },
      { name: 'Z-Algorithm / Rabin-Karp Rolling Hash', tier: 'Advanced', keywords: ['rabin-karp', 'rolling hash', 'z-algorithm'] },
      { name: 'Manacher Algorithm (Longest Palindromic Substring)', tier: 'Optional', keywords: ['manacher'] },
      { name: 'String DP (Edit Distance, LCS)', tier: 'Core', keywords: ['edit distance', 'longest common subsequence'] },
      { name: 'Trie string search & prefixes', tier: 'Core', keywords: ['trie', 'prefix'] }
    ]
  },
  {
    code: 'C',
    area: 'Sorting & Searching',
    patterns: [
      { name: 'Merge Sort & Quick Sort', tier: 'Core', keywords: ['merge sort', 'quick sort'] },
      { name: 'Counting / Radix Sort awareness', tier: 'Important', keywords: ['counting sort', 'radix'] },
      { name: 'Custom Comparator patterns', tier: 'Core', keywords: ['comparator', 'custom sort', 'largest number'] },
      { name: 'Binary search lower / upper bounds', tier: 'Core', keywords: ['lower bound', 'upper bound', 'binary search'] },
      { name: 'Rotated sorted arrays & Peak finding', tier: 'Core', keywords: ['rotated sorted', 'peak element'] },
      { name: '2D Matrix binary search', tier: 'Important', keywords: ['search a 2d matrix'] },
      { name: 'Binary search on answers / capacity', tier: 'Core', keywords: ['koko', 'capacity to ship', 'aggressive cows', 'book allocation'] },
      { name: 'Parametric / median search', tier: 'Important', keywords: ['median of two sorted arrays'] }
    ]
  },
  {
    code: 'D',
    area: 'Linked Lists',
    patterns: [
      { name: 'Reversal & Fast/Slow Pointers', tier: 'Core', keywords: ['reverse linked list', 'middle of linked list'] },
      { name: 'Cycle detection & Starting node', tier: 'Core', keywords: ['detect loop', 'cycle in linked list'] },
      { name: 'Merging two / K sorted lists', tier: 'Core', keywords: ['merge two sorted lists', 'merge k sorted lists'] },
      { name: 'Reverse in K-group', tier: 'Important', keywords: ['reverse nodes in k-group'] },
      { name: 'Copy list with random pointer', tier: 'Important', keywords: ['clone linked list with random pointer'] },
      { name: 'Flattening multi-level lists', tier: 'Important', keywords: ['flattening a linked list'] },
      { name: 'Intersection of two linked lists', tier: 'Core', keywords: ['intersection point of two linked lists'] }
    ]
  },
  {
    code: 'E',
    area: 'Stacks & Queues',
    patterns: [
      { name: 'Monotonic stack (NGE / NSE)', tier: 'Core', keywords: ['next greater element', 'next smaller element'] },
      { name: 'Monotonic deque & Sliding window max', tier: 'Core', keywords: ['sliding window maximum'] },
      { name: 'Largest Rectangle in Histogram', tier: 'Important', keywords: ['largest rectangle in histogram'] },
      { name: 'Trapping Rainwater (Stack & Pointers)', tier: 'Core', keywords: ['trapping rainwater'] },
      { name: 'Expression evaluation & Parentheses', tier: 'Core', keywords: ['valid parentheses', 'evaluate reverse polish'] }
    ]
  },
  {
    code: 'F',
    area: 'Binary Trees & BST',
    patterns: [
      { name: 'DFS & BFS Traversals (Recursive/Iterative)', tier: 'Core', keywords: ['inorder', 'preorder', 'level order'] },
      { name: 'Views & Boundary traversal', tier: 'Core', keywords: ['boundary traversal', 'vertical order'] },
      { name: 'Height, Diameter & Balanced checks', tier: 'Core', keywords: ['diameter of binary tree', 'maximum depth'] },
      { name: 'LCA in Binary Trees & BST', tier: 'Core', keywords: ['lowest common ancestor'] },
      { name: 'Tree Construction from Traversals', tier: 'Core', keywords: ['construct binary tree'] },
      { name: 'BST Search, Insert, Delete, Validate', tier: 'Core', keywords: ['validate binary search tree', 'search in a binary search tree'] },
      { name: 'Tree DP & Subtree Aggregation', tier: 'Important', keywords: ['binary tree maximum path sum'] },
      { name: 'Serialization / Deserialization', tier: 'Important', keywords: ['serialize and deserialize'] },
      { name: 'Morris Traversal (O(1) auxiliary space)', tier: 'Optional', keywords: ['morris traversal'] }
    ]
  },
  {
    code: 'G',
    area: 'Heaps & Priority Queues',
    patterns: [
      { name: 'Heap construction & Top-K elements', tier: 'Core', keywords: ['kth largest', 'top k frequent'] },
      { name: 'K-way merge patterns', tier: 'Core', keywords: ['merge k sorted'] },
      { name: 'Two Heaps (Running Median)', tier: 'Core', keywords: ['find median from data stream'] },
      { name: 'Task scheduler / Greedy with heap', tier: 'Important', keywords: ['task scheduler', 'reorganize string'] }
    ]
  },
  {
    code: 'H',
    area: 'Recursion & Backtracking',
    patterns: [
      { name: 'Subsets & Combinations (Include/Exclude)', tier: 'Core', keywords: ['subsets', 'combination sum'] },
      { name: 'Permutations & Duplicate pruning', tier: 'Core', keywords: ['permutations'] },
      { name: 'Grid backtracking (Word Search, N-Queens)', tier: 'Core', keywords: ['n-queens', 'word search', 'sudoku'] },
      { name: 'Palindrome partitioning', tier: 'Important', keywords: ['palindrome partitioning'] },
      { name: 'Branch-and-bound pruning', tier: 'Important', keywords: ['rat in a maze'] }
    ]
  },
  {
    code: 'I',
    area: 'Graphs',
    patterns: [
      { name: 'Graph representation & BFS/DFS', tier: 'Core', keywords: ['bfs', 'dfs', 'number of provinces', 'number of islands'] },
      { name: 'Cycle detection (Undirected & Directed)', tier: 'Core', keywords: ['cycle', 'course schedule'] },
      { name: 'Topological Sort (Kahn & DFS)', tier: 'Core', keywords: ['topological sort', 'alien dictionary'] },
      { name: 'Bipartite checking (2-coloring)', tier: 'Core', keywords: ['is graph bipartite'] },
      { name: 'Dijkstra shortest path', tier: 'Core', keywords: ['dijkstra', 'shortest path'] },
      { name: 'Bellman-Ford & Negative cycles', tier: 'Core', keywords: ['bellman ford'] },
      { name: 'Floyd-Warshall all-pairs shortest path', tier: 'Core', keywords: ['floyd warshall'] },
      { name: '0-1 BFS', tier: 'Important', keywords: ['0-1 bfs', 'minimum effort'] },
      { name: 'DSU (Disjoint Set Union)', tier: 'Core', keywords: ['disjoint set', 'redundant connection'] },
      { name: 'Kruskal & Prim MST', tier: 'Core', keywords: ['minimum spanning tree', 'kruskal', 'prim'] },
      { name: 'Tarjan & Kosaraju SCC', tier: 'Important', keywords: ['strongly connected components', 'kosaraju', 'tarjan'] },
      { name: 'Bridges & Articulation points', tier: 'Important', keywords: ['critical connections', 'articulation point'] },
      { name: 'Eulerian path / Hierholzer', tier: 'Advanced', keywords: ['eulerian path', 'reconstruct itinerary'] }
    ]
  },
  {
    code: 'J',
    area: 'Dynamic Programming',
    patterns: [
      { name: '1D DP (Fibonacci, Climbing Stairs, Robber)', tier: 'Core', keywords: ['climbing stairs', 'house robber', 'frog jump'] },
      { name: '2D Grid DP (Unique Paths, Min Path Sum)', tier: 'Core', keywords: ['unique paths', 'minimum path sum'] },
      { name: 'Subsequence / Knapsack (0/1, Unbounded)', tier: 'Core', keywords: ['knapsack', 'subset sum', 'coin change', 'target sum'] },
      { name: 'Longest Increasing Subsequence (LIS)', tier: 'Core', keywords: ['longest increasing subsequence'] },
      { name: 'String DP (LCS, Edit Distance, Palindromes)', tier: 'Core', keywords: ['longest common subsequence', 'edit distance', 'palindromic substring'] },
      { name: 'Stock Trading DP (I through IV, Fee, Cooldown)', tier: 'Core', keywords: ['best time to buy and sell stock'] },
      { name: 'Partition DP (MCM, Burst Balloons)', tier: 'Important', keywords: ['matrix chain multiplication', 'burst balloons'] },
      { name: 'Tree DP & Subtree optimal states', tier: 'Important', keywords: ['tree dp'] },
      { name: 'Bitmask DP', tier: 'Important', keywords: ['bitmask dp', 'travelling salesman'] },
      { name: 'Digit DP', tier: 'Advanced', keywords: ['digit dp'] },
      { name: 'Convex Hull Trick / Divide & Conquer DP', tier: 'Optional', keywords: ['convex hull trick'] }
    ]
  },
  {
    code: 'K',
    area: 'Greedy & Intervals',
    patterns: [
      { name: 'Activity Selection & Meeting Rooms', tier: 'Core', keywords: ['meeting rooms', 'non-overlapping intervals'] },
      { name: 'Interval merging & insertion', tier: 'Core', keywords: ['merge intervals', 'insert interval'] },
      { name: 'Fractional Knapsack / Ratio greedy', tier: 'Core', keywords: ['fractional knapsack', 'job sequencing'] },
      { name: 'Jump Game reachability & steps', tier: 'Core', keywords: ['jump game'] },
      { name: 'Gas Station circular tour greedy', tier: 'Core', keywords: ['gas station'] }
    ]
  },
  {
    code: 'L',
    area: 'Bit Manipulation & Mathematics',
    patterns: [
      { name: 'Bitwise basic properties & power of two', tier: 'Core', keywords: ['power of two', 'number of 1 bits'] },
      { name: 'XOR properties (Single number I/II/III)', tier: 'Core', keywords: ['single number'] },
      { name: 'Bitmask subset generation', tier: 'Core', keywords: ['subsets bitmask'] },
      { name: 'Euclidean GCD & Modular Arithmetic', tier: 'Core', keywords: ['gcd', 'modular arithmetic'] },
      { name: 'Sieve of Eratosthenes & Prime Factorization', tier: 'Core', keywords: ['sieve', 'count primes'] }
    ]
  },
  {
    code: 'M',
    area: 'Tries & Advanced Data Structures',
    patterns: [
      { name: 'Trie Prefix tree insertion & lookup', tier: 'Core', keywords: ['implement trie', 'starts with'] },
      { name: 'Word Search II (Trie + Backtracking)', tier: 'Important', keywords: ['word search ii'] },
      { name: 'Maximum XOR with Trie', tier: 'Important', keywords: ['maximum xor of two numbers'] },
      { name: 'Segment Tree (Point & Range queries)', tier: 'Advanced', keywords: ['segment tree', 'range sum query'] },
      { name: 'Binary Indexed Tree / Fenwick Tree', tier: 'Advanced', keywords: ['fenwick tree', 'binary indexed tree'] }
    ]
  },
  {
    code: 'N',
    area: 'Interview Execution & Problem-Solving Strategies',
    patterns: [
      { name: 'Two-pointer opposite & same direction', tier: 'Core', keywords: ['two pointers', 'opposite direction'] },
      { name: 'Sliding window fixed & variable size', tier: 'Core', keywords: ['sliding window'] },
      { name: 'Monotonic stack & queue templates', tier: 'Core', keywords: ['monotonic stack', 'monotonic queue'] },
      { name: 'Fast & Slow pointers (Tortoise/Hare)', tier: 'Core', keywords: ['fast and slow pointers', 'tortoise and hare'] },
      { name: 'In-place state marking & sign inversion', tier: 'Core', keywords: ['first missing positive', 'set matrix zeroes'] },
      { name: 'Space-time tradeoff analysis', tier: 'Core', keywords: ['time complexity', 'space complexity'] },
      { name: 'Edge cases & Constraint boundaries', tier: 'Core', keywords: ['corner cases', 'empty input', 'overflow'] }
    ]
  }
];

// Audit patterns against catalog
const auditedTaxonomy = TAXONOMY_AREAS.map(area => {
  const auditedPatterns = area.patterns.map(pat => {
    const hits = allProblems.filter(p => {
      const pText = (p.title + ' ' + (p.pattern || '') + ' ' + (p.notes || '') + ' ' + p.topic).toLowerCase();
      return pat.keywords.some(kw => pText.includes(kw.toLowerCase()));
    });

    return {
      name: pat.name,
      tier: pat.tier,
      keywords: pat.keywords,
      catalogCount: hits.length,
      coveredIn120Roadmap: hits.length > 0,
      sampleProblemIds: hits.slice(0, 3).map(p => p.id)
    };
  });

  return {
    code: area.code,
    area: area.area,
    patterns: auditedPatterns
  };
});

// Output code generation
const outputCode = `/**
 * AlgoRecall 120-Day DSA Mastery & Foundation Revision Curriculum Data Module
 * Strictly unmixed topic order: Full Graphs -> Full Trees -> Full DP -> Full Recursion -> Full Greedy -> Full Heap -> Full Tries
 * ZERO duplicate problem assignments across days within either stream.
 * Contains:
 * 1. EXACT_STREAM_A_120 (120 Days Sequential Mastery Track)
 * 2. EXACT_STREAM_B_120 (120 Days Sequential Foundation Revision Track)
 * 3. CURRICULUM_TAXONOMY_AUDIT (14 Topic Areas A-N with 100+ classified patterns)
 * 4. RoadmapCurriculumData API for UI rendering, audit analysis, and engine generation
 */
(function() {
  'use strict';

  const EXACT_STREAM_A_120 = ${JSON.stringify(streamAItems, null, 2)};

  const EXACT_STREAM_B_120 = ${JSON.stringify(streamBItems, null, 2)};

  const CURRICULUM_TAXONOMY_AUDIT = ${JSON.stringify(auditedTaxonomy, null, 2)};

  const RoadmapCurriculumData = {
    STREAM_A: EXACT_STREAM_A_120,
    STREAM_B: EXACT_STREAM_B_120,
    TAXONOMY_AUDIT: CURRICULUM_TAXONOMY_AUDIT,

    getStreamADay(dayNumber) {
      if (dayNumber < 1) return EXACT_STREAM_A_120[0];
      if (dayNumber > 120) {
        const base = EXACT_STREAM_A_120[(dayNumber - 1) % 120];
        return {
          ...base,
          dayNumber: dayNumber,
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
          phase: 'Days 121+: Extended Foundations & Maintenance'
        };
      }
      return EXACT_STREAM_B_120[dayNumber - 1];
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
        catalogSize: ${allProblems.length}
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoadmapCurriculumData;
  }
  if (typeof window !== 'undefined') {
    window.RoadmapCurriculumData = RoadmapCurriculumData;
  }
  if (typeof global !== 'undefined') {
    global.RoadmapCurriculumData = RoadmapCurriculumData;
  }
})();
`;

const targetFile = path.join(__dirname, '..', 'js', 'data', 'roadmap-120-curriculum.js');
fs.writeFileSync(targetFile, outputCode, 'utf8');
console.log('Successfully generated pure unmixed curriculum with ZERO duplicate problems in:', targetFile);
