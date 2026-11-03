/**
 * Script to generate js/data/roadmap-120-curriculum.js
 * Contains the EXACT 120-day specifications for Stream A and Stream B,
 * organized in pure, unmixed topic order with ZERO duplicate problems across days:
 *
 * Stream A:
 *   Days 1–25:   Full Binary Trees & BST (25 Days) -> 49 unique catalog problems
 *   Days 26–55:  Full Graphs (30 Days) -> 35 unique catalog problems
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
  // Block 1: Full Binary Trees & BST (Days 1–25)
  "Day 1: Binary tree node structure, pointer properties and DFS traversals introduction.",
  "Day 2: Inorder traversal (Recursive & Iterative) with call stack analysis.",
  "Day 3: Preorder and Postorder traversals (Recursive & Iterative with stack).",
  "Day 4: Level order traversal, BFS using queue and level-by-level processing.",
  "Day 5: Zigzag spiral level order traversal and vertical tree order.",
  "Day 6: Tree height, maximum depth and balanced binary tree verification.",
  "Day 7: Tree diameter, O(N) optimized postorder diameter calculation.",
  "Day 8: Maximum path sum in binary tree (any node to any node).",
  "Day 9: Check identical binary trees and symmetric mirror tree validation.",
  "Day 10: Boundary traversal of binary tree (Left boundary, leaf nodes, right boundary).",
  "Day 11: Tree views: Top view and Bottom view using vertical coordinate hashing.",
  "Day 12: Tree views: Left view and Right view using level-order and recursive DFS.",
  "Day 13: Root-to-leaf paths, path sum I & II with target sum verification.",
  "Day 14: Lowest Common Ancestor (LCA) in binary tree and paths between two nodes.",
  "Day 15: Maximum width of binary tree using index-based level order.",
  "Day 16: Children sum property and check for children sum parent invariants.",
  "Day 17: All nodes distance K in binary tree using parent pointer mapping.",
  "Day 18: Minimum time taken to burn the binary tree from a given node.",
  "Day 19: Construct binary tree from preorder and inorder traversal arrays.",
  "Day 20: Construct binary tree from postorder and inorder traversal arrays.",
  "Day 21: Serialize and deserialize binary tree (Level order and DFS string encoding).",
  "Day 22: Flatten binary tree to linked list (Morris traversal and reverse postorder).",
  "Day 23: Introduction to Binary Search Trees: BST properties, search and min/max.",
  "Day 24: BST operations: Insert node, delete node and BST validation invariants.",
  "Day 25: BST advanced: Kth smallest/largest, LCA in BST, two sum in BST and recover BST.",

  // Block 2: Full Graphs (Days 26–55)
  "Day 26: Graph representation, adjacency list, adjacency matrix and graph storage.",
  "Day 27: BFS traversal, queues, visited array and connected components.",
  "Day 28: DFS traversal, recursive and iterative traversal patterns.",
  "Day 29: Grid BFS/DFS, Number of Islands and matrix flood fill.",
  "Day 30: Undirected cycle detection using BFS and DFS.",
  "Day 31: Directed cycle detection, recursion stack and state coloring.",
  "Day 32: Topological sorting using Kahn's algorithm (BFS in-degree).",
  "Day 33: Topological sorting using DFS and course ordering.",
  "Day 34: Bipartite graph checking using BFS and DFS (Two-coloring).",
  "Day 35: Multisource BFS, 0-1 Matrix and rotting oranges.",
  "Day 36: Shortest paths in unweighted graphs using BFS.",
  "Day 37: Dijkstra's algorithm, priority queues and shortest path trees.",
  "Day 38: Dijkstra practice, shortest path in binary matrix and variations.",
  "Day 39: Bellman-Ford algorithm and negative cycle detection.",
  "Day 40: Floyd-Warshall algorithm and all-pairs shortest paths.",
  "Day 41: 0-1 BFS and minimum effort path variants.",
  "Day 42: Disjoint Set Union (DSU) by rank/size with path compression.",
  "Day 43: Kruskal's Minimum Spanning Tree algorithm using DSU.",
  "Day 44: Prim's Minimum Spanning Tree algorithm using priority queues.",
  "Day 45: Bridges in graph and Tarjan's critical connections algorithm.",
  "Day 46: Strongly Connected Components using Kosaraju's algorithm.",
  "Day 47: Articulation points and Tarjan's low-link discovery.",
  "Day 48: DAG shortest paths, longest paths and graph DP patterns.",
  "Day 49: Word Ladder, shortest transformation sequences and graph modeling.",
  "Day 50: Graph connectivity, redundant connections and network components.",
  "Day 51: Shortest path optimization, cheapest flights and network delay time.",
  "Day 52: Advanced DSU, stones removal and accounts merge.",
  "Day 53: Word Ladder II, all shortest paths and backtracking with BFS.",
  "Day 54: Graph error diagnosis, weak-pattern repair and failed problems.",
  "Day 55: Comprehensive graph assessment, timed practice and mastery audit.",

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
  // Days 1–25: FULL BINARY TREES & BST
  if (dayNum <= 25) {
    return { topic: 'Binary Trees & BST', phase: 'Phase 1: Binary Trees & BST' };
  }
  // Days 26–55: FULL GRAPHS
  if (dayNum <= 55) {
    return { topic: 'Graphs', phase: 'Phase 2: Graphs' };
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

// Stream A exact 120-day subtopic problem mappings
const STREAM_A_PIDS = [
  // Block 1: Binary Trees & BST (Days 1–25)
  ['prob-404-preorder-inorder-and-postorder-in-one-traversal'],
  ['prob-402-iterative-inorder-traversal'],
  ['prob-401-iterative-preorder-traversal', 'prob-403-iterative-postorder-traversal-using-1-stack'],
  ['prob-202-binary-tree-level-order-traversal'],
  ['prob-203-binary-tree-zigzag-level-order-traversal', 'prob-205-vertical-order-traversal-of-a-binary-tree'],
  ['prob-197-maximum-depth-of-binary-tree', 'prob-199-balanced-binary-tree'],
  ['prob-198-diameter-of-binary-tree'],
  ['prob-210-binary-tree-maximum-path-sum'],
  ['prob-200-same-tree', 'prob-201-symmetric-tree', 'prob-196-invert-binary-tree'],
  ['prob-204-boundary-traversal-of-binary-tree'],
  ['prob-206-top-view-of-binary-tree', 'prob-207-bottom-view-of-binary-tree'],
  ['prob-208-binary-tree-right-side-view'],
  ['prob-405-root-to-node-path-in-binary-tree'],
  ['prob-209-lowest-common-ancestor-of-a-binary-tree'],
  ['prob-344-maximum-width-of-binary-tree', 'prob-348-count-total-nodes-in-a-complete-binary-tree'],
  ['prob-345-children-sum-property-in-binary-tree', 'prob-406-check-for-children-sum-property-in-binary-tree'],
  ['prob-346-all-nodes-distance-k-in-binary-tree'],
  ['prob-347-minimum-time-taken-to-burn-binary-tree-from-a-node'],
  ['prob-211-construct-tree-from-preorder-and-inorder'],
  ['prob-212-construct-tree-from-postorder-and-inorder', 'prob-407-construct-binary-tree-from-inorder-and-postorder'],
  ['prob-213-serialize-and-deserialize-binary-tree'],
  ['prob-214-flatten-binary-tree-to-linked-list', 'prob-342-morris-inorder-traversal-of-binary-tree', 'prob-343-morris-preorder-traversal-of-binary-tree'],
  ['prob-408-introduction-to-binary-search-trees', 'prob-215-search-in-a-binary-search-tree', 'prob-409-find-min-max-in-bst', 'prob-216-ceil-floor-in-a-bst'],
  ['prob-217-insert-a-given-node-in-bst', 'prob-218-delete-a-node-in-bst', 'prob-220-validate-binary-search-tree'],
  ['prob-219-kth-smallest-element-in-a-bst', 'prob-221-lowest-common-ancestor-of-a-bst', 'prob-222-construct-bst-from-preorder-traversal', 'prob-223-binary-search-tree-iterator', 'prob-224-two-sum-iv-input-is-a-bst', 'prob-225-recover-binary-search-tree', 'prob-349-inorder-successor-and-predecessor-in-bst', 'prob-410-inorder-predecessor-and-successor-in-bst', 'prob-350-largest-bst-in-binary-tree'],

  // Block 2: Graphs (Days 26–55)
  ['prob-411-introduction-to-graph-representation-adjacency-matrix-list'],
  ['prob-226-number-of-provinces'],
  ['prob-228-flood-fill'],
  ['prob-227-number-of-islands'],
  ['prob-231-surrounded-regions-capture-o-s', 'prob-232-number-of-enclaves'],
  ['prob-235-course-schedule-cycle-detection-in-directed-graph'],
  ['prob-236-course-schedule-ii-task-order'],
  ['prob-237-find-eventual-safe-states'],
  ['prob-234-is-graph-bipartite'],
  ['prob-229-rotting-oranges', 'prob-230-0-1-matrix-distance-to-nearest-0'],
  ['prob-241-shortest-path-in-binary-matrix'],
  ['prob-240-dijkstra-s-algorithm-shortest-path'],
  ['prob-242-path-with-minimum-effort'],
  ['prob-243-cheapest-flights-within-k-stops'],
  ['prob-353-find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold'],
  ['prob-354-swim-in-rising-water'],
  ['prob-247-redundant-connection'],
  ['prob-246-kruskal-s-algorithm-mst-using-dsu'],
  ['prob-245-minimum-spanning-tree-prim-s-algorithm'],
  ['prob-252-bridges-in-graph-tarjan-s-algorithm'],
  ['prob-253-strongly-connected-components-kosaraju-s-algorithm'],
  ['prob-355-articulation-point-in-graph'],
  ['prob-239-shortest-path-in-directed-acyclic-graph-dag', 'prob-352-number-of-ways-to-arrive-at-destination'],
  ['prob-233-word-ladder'],
  ['prob-248-number-of-operations-to-make-network-connected'],
  ['prob-244-network-delay-time'],
  ['prob-249-most-stones-removed-with-same-row-or-column', 'prob-250-accounts-merge'],
  ['prob-251-making-a-large-island'],
  ['prob-351-minimum-multiplications-to-reach-end', 'prob-412-minimum-steps-to-reach-end-by-multiplication'],
  ['prob-238-alien-dictionary'],

  // Block 3: Dynamic Programming (Days 56–85)
  ['prob-254-climbing-stairs', 'prob-255-frog-jump-geek-jump'],
  ['prob-356-frog-jump-with-k-distance', 'prob-413-frog-jump-with-k-distances'],
  ['prob-256-house-robber', 'prob-257-house-robber-ii-circular'],
  ['prob-258-ninja-s-training-2d-activity-dp', 'prob-414-ninja-s-training'],
  ['prob-259-unique-paths-in-grid', 'prob-260-unique-paths-ii-with-obstacles'],
  ['prob-261-minimum-path-sum-in-grid', 'prob-262-triangle-minimum-path-sum'],
  ['prob-263-minimum-falling-path-sum', 'prob-264-cherry-pickup-ii-3d-dp'],
  ['prob-265-subset-sum-problem', 'prob-266-partition-equal-subset-sum'],
  ['prob-267-partition-array-into-two-arrays-to-minimize-sum-difference', 'prob-415-partition-set-into-2-subsets-with-min-absolute-sum-difference'],
  ['prob-268-count-subsets-with-sum-k', 'prob-357-count-subsets-with-given-difference', 'prob-416-count-partitions-with-given-difference'],
  ['prob-269-0-1-knapsack-problem', 'prob-270-target-sum'],
  ['prob-271-coin-change-minimum-coins', 'prob-272-coin-change-ii-number-of-ways'],
  ['prob-273-unbounded-knapsack-rod-cutting', 'prob-417-unbounded-knapsack', 'prob-418-rod-cutting-problem'],
  ['prob-274-longest-common-subsequence-lcs', 'prob-275-print-longest-common-subsequence'],
  ['prob-419-longest-common-substring', 'prob-276-longest-palindromic-subsequence'],
  ['prob-277-minimum-insertions-to-make-string-palindrome', 'prob-420-minimum-insertions-deletions-to-convert-string-a-to-b'],
  ['prob-278-shortest-common-supersequence', 'prob-279-distinct-subsequences'],
  ['prob-280-edit-distance', 'prob-281-wildcard-matching'],
  ['prob-282-best-time-to-buy-and-sell-stock-ii-infinite-transactions', 'prob-421-best-time-to-buy-and-sell-stock-with-transaction-fee'],
  ['prob-285-best-time-to-buy-and-sell-stock-with-cooldown'],
  ['prob-283-best-time-to-buy-and-sell-stock-iii-at-most-2-transactions', 'prob-284-best-time-to-buy-and-sell-stock-iv-at-most-k-transactions'],
  ['prob-286-longest-increasing-subsequence-lis', 'prob-287-print-longest-increasing-subsequence'],
  ['prob-288-largest-divisible-subset', 'prob-289-longest-string-chain'],
  ['prob-290-longest-bitonic-subsequence', 'prob-291-number-of-longest-increasing-subsequences'],
  ['prob-292-matrix-chain-multiplication-mcm', 'prob-293-cost-to-cut-a-stick', 'prob-422-minimum-cost-to-cut-a-stick'],
  ['prob-294-burst-balloons'],
  ['prob-295-evaluate-boolean-expression-to-true'],
  ['prob-296-palindrome-partitioning-ii-min-cuts', 'prob-423-palindrome-partitioning-ii-minimum-cuts'],
  ['prob-297-partition-array-for-maximum-sum', 'prob-424-maximum-rectangle-area-with-all-1s-in-binary-matrix'],
  ['prob-425-count-square-submatrices-with-all-ones', 'prob-358-maximum-profit-in-job-scheduling'],

  // Block 4: Recursion & Backtracking (Days 86–95)
  ['prob-120-generate-parentheses', 'prob-121-subsets', 'prob-122-subsets-ii-with-duplicates'],
  ['prob-123-combination-sum', 'prob-124-combination-sum-ii-no-duplicates-1-use'],
  ['prob-125-combination-sum-iii', 'prob-126-letter-combinations-of-a-phone-number'],
  ['prob-384-generate-all-binary-strings-without-consecutive-1s', 'prob-470-letter-case-permutation'],
  ['prob-385-count-subsequences-with-sum-k', 'prob-471-restore-ip-addresses'],
  ['prob-127-palindrome-partitioning', 'prob-128-word-search-in-2d-grid'],
  ['prob-129-n-queens', 'prob-130-sudoku-solver'],
  ['prob-131-m-coloring-problem', 'prob-132-rat-in-a-maze-problem'],
  ['prob-133-word-break-ii-print-all-sentences', 'prob-472-word-break-ii-all-sentences', 'prob-386-expression-add-operators'],
  ['prob-473-matchsticks-to-square', 'prob-474-partition-to-k-equal-sum-subsets'],

  // Block 5: Greedy & Intervals (Days 96–105)
  ['prob-182-assign-cookies', 'prob-185-lemonade-change'],
  ['prob-183-fractional-knapsack-problem', 'prob-184-find-minimum-number-of-coins', 'prob-400-find-minimum-number-of-coins-greedy'],
  ['prob-186-valid-parenthesis-string-with-wildcard'],
  ['prob-187-n-meetings-in-one-room', 'prob-188-minimum-platforms-required-for-railway'],
  ['prob-189-job-sequencing-problem-with-deadlines', 'prob-190-candy-distribute-minimum-candies'],
  ['prob-191-jump-game', 'prob-192-jump-game-ii-minimum-jumps'],
  ['prob-193-gas-station-circular-tour', 'prob-194-non-overlapping-intervals'],
  ['prob-195-insert-interval', 'prob-464-minimum-number-of-arrows-to-burst-balloons'],
  ['prob-465-video-stitching', 'prob-466-minimum-deletions-to-make-character-frequencies-unique'],
  ['prob-467-maximum-length-of-pair-chain', 'prob-468-queue-reconstruction-by-height', 'prob-469-patching-array'],

  // Block 6: Heap / Priority Queue (Days 106–113)
  ['prob-396-check-if-an-array-represents-a-min-heap', 'prob-397-convert-min-heap-to-max-heap', 'prob-399-replace-each-array-element-by-its-corresponding-rank'],
  ['prob-172-kth-largest-element-in-an-array', 'prob-173-kth-smallest-element-in-an-array'],
  ['prob-174-sort-k-sorted-nearly-sorted-array', 'prob-398-sort-a-k-sorted-array-nearly-sorted-array', 'prob-175-k-closest-points-to-origin'],
  ['prob-176-top-k-frequent-elements', 'prob-457-kth-largest-element-in-a-stream', 'prob-458-last-stone-weight'],
  ['prob-177-task-scheduler', 'prob-178-hands-of-straights'],
  ['prob-179-design-twitter', 'prob-180-merge-k-sorted-lists'],
  ['prob-459-reorganize-string', 'prob-460-find-k-pairs-with-smallest-sums'],
  ['prob-181-find-median-from-data-stream', 'prob-462-seat-reservation-manager', 'prob-461-ipo-maximize-capital', 'prob-463-minimum-number-of-refueling-stops'],

  // Block 7: Tries & Advanced (Days 114–120)
  ['prob-298-implement-trie-prefix-tree', 'prob-299-implement-trie-ii-prefix-with-counts', 'prob-426-implement-trie-ii-prefix-tree-with-count'],
  ['prob-300-complete-string-longest-string-with-all-prefixes', 'prob-427-longest-word-with-all-prefixes-complete-string', 'prob-301-count-distinct-substrings', 'prob-428-number-of-distinct-substrings-in-a-string'],
  ['prob-302-design-add-and-search-words', 'prob-475-design-add-and-search-words-data-structure', 'prob-476-replace-words-prefix-root-replacement'],
  ['prob-303-word-search-ii-boggle-with-trie'],
  ['prob-304-maximum-xor-of-two-numbers-in-array'],
  ['prob-305-maximum-xor-with-an-element-from-array', 'prob-429-maximum-xor-with-an-element-from-array-offline-queries'],
  ['prob-477-concatenated-words', 'prob-478-stream-of-characters', 'prob-479-prefix-and-suffix-search']
];

// Stream B exact 120-day subtopic problem mappings
const STREAM_B_PIDS = [
  // Block 1: Basics & Math (Days 1–10)
  ['prob-363-user-input-output-data-types', 'prob-364-if-else-statements', 'prob-365-switch-case-statements', 'prob-366-pass-by-reference-and-pass-by-value', 'prob-367-while-loops-for-loops-syntax'],
  ['prob-306-pattern-1-rectangular-star-pattern', 'prob-307-pattern-2-right-angled-triangle-pattern', 'prob-308-pattern-3-right-angled-number-pyramid', 'prob-309-pattern-4-right-angled-number-pyramid-ii', 'prob-310-pattern-5-inverted-right-pyramid'],
  ['prob-311-pattern-6-inverted-numbered-right-pyramid', 'prob-312-pattern-7-star-pyramid', 'prob-313-pattern-8-inverted-star-pyramid', 'prob-314-pattern-9-diamond-star-pattern', 'prob-315-pattern-10-half-diamond-star-pattern'],
  ['prob-316-pattern-11-binary-number-triangle-pattern', 'prob-317-pattern-12-number-crown-pattern', 'prob-318-pattern-13-increasing-number-triangle', 'prob-319-pattern-14-increasing-letter-triangle', 'prob-320-pattern-15-reverse-letter-triangle', 'prob-321-pattern-16-alpha-ramp-pattern'],
  ['prob-322-pattern-17-alpha-pyramid-pattern', 'prob-323-pattern-18-alpha-triangle-pattern', 'prob-324-pattern-19-symmetric-void-pattern', 'prob-325-pattern-20-symmetric-butterfly-pattern', 'prob-326-pattern-21-hollow-rectangle-pattern', 'prob-327-pattern-22-the-number-pattern-matrix'],
  ['prob-1-count-digits', 'prob-2-reverse-a-number', 'prob-3-check-palindrome-number', 'prob-5-armstrong-numbers'],
  ['prob-4-gcd-or-hcf-euclidean-algorithm', 'prob-6-print-all-divisors-of-a-given-number', 'prob-7-check-for-prime'],
  ['prob-8-print-1-to-n-without-loop-recursion', 'prob-9-sum-of-first-n-numbers', 'prob-10-factorial-of-n-numbers'],
  ['prob-11-reverse-an-array', 'prob-12-check-if-a-string-is-palindrome', 'prob-13-fibonacci-number'],
  ['prob-14-count-frequency-of-array-elements', 'prob-15-find-highest-and-lowest-frequency-elements'],

  // Block 2: Arrays & Hashing (Days 11–24)
  ['prob-21-largest-element-in-an-array', 'prob-22-second-largest-and-second-smallest'],
  ['prob-23-check-if-array-is-sorted-and-rotated', 'prob-24-remove-duplicates-from-sorted-array'],
  ['prob-25-rotate-array-by-k-elements-left-right', 'prob-370-left-rotate-an-array-by-one'],
  ['prob-26-move-zeroes-to-end', 'prob-27-linear-search'],
  ['prob-28-union-of-two-sorted-arrays'],
  ['prob-29-find-missing-number', 'prob-30-max-consecutive-ones'],
  ['prob-31-single-number-find-element-appearing-once', 'prob-368-count-frequency-of-elements-in-array', 'prob-369-find-highest-lowest-frequency-element'],
  ['prob-32-longest-subarray-with-sum-k-positives', 'prob-33-longest-subarray-with-sum-k-positives-negatives'],
  ['prob-34-two-sum', 'prob-35-sort-colors-0s-1s-2s'],
  ['prob-36-majority-element-n-2', 'prob-49-majority-element-ii-n-3'],
  ['prob-37-maximum-subarray-kadane-s-algorithm', 'prob-38-print-maximum-subarray-sum-subarray', 'prob-59-maximum-product-subarray'],
  ['prob-39-best-time-to-buy-and-sell-stock', 'prob-40-rearrange-array-elements-by-sign', 'prob-41-next-permutation'],
  ['prob-42-leaders-in-an-array', 'prob-43-longest-consecutive-sequence', 'prob-48-pascal-s-triangle'],
  ['prob-44-set-matrix-zeroes', 'prob-45-rotate-image-matrix-by-90-degrees', 'prob-46-spiral-matrix', 'prob-47-count-subarray-sum-equals-k', 'prob-52-largest-subarray-with-0-sum', 'prob-53-count-subarrays-with-given-xor-k', 'prob-54-merge-overlapping-intervals', 'prob-55-merge-two-sorted-arrays-in-o-1-space', 'prob-56-find-the-missing-and-repeating-number', 'prob-57-count-inversions-in-an-array', 'prob-58-reverse-pairs'],

  // Block 3: Strings (Days 25–34)
  ['prob-87-remove-outermost-parentheses', 'prob-88-reverse-words-in-a-string'],
  ['prob-89-largest-odd-number-in-string', 'prob-90-longest-common-prefix'],
  ['prob-91-isomorphic-strings', 'prob-92-rotate-string-check-if-a-is-rotation-of-b'],
  ['prob-93-sort-characters-by-frequency', 'prob-94-maximum-nesting-depth-of-the-parentheses'],
  ['prob-95-roman-to-integer', 'prob-96-integer-to-roman'],
  ['prob-97-string-to-integer-atoi', 'prob-100-minimum-add-to-make-parentheses-valid'],
  ['prob-98-longest-palindromic-substring', 'prob-99-count-number-of-substrings-with-k-distinct-chars', 'prob-375-sum-of-beauty-of-all-substrings'],
  ['prob-360-rabin-karp-string-matching-algorithm', 'prob-432-rabin-karp-algorithm-for-pattern-searching'],
  ['prob-361-kmp-algorithm-for-pattern-searching', 'prob-362-z-algorithm-for-pattern-searching'],
  ['prob-359-shortest-palindrome-kmp-prefix-table', 'prob-430-shortest-palindrome-kmp-lps', 'prob-431-longest-happy-prefix', 'prob-433-minimum-characters-to-add-at-front-for-palindrome'],

  // Block 4: Sliding Window & Two Pointers (Days 35–44)
  ['prob-440-container-with-most-water', 'prob-443-valid-palindrome-ii-at-most-1-deletion'],
  ['prob-50-3sum', 'prob-441-3sum-closest'],
  ['prob-51-4sum', 'prob-442-4sum-ii'],
  ['prob-152-trapping-rain-water'],
  ['prob-169-maximum-points-you-can-obtain-from-cards', 'prob-444-minimum-size-subarray-sum'],
  ['prob-445-permutation-in-string', 'prob-446-find-all-anagrams-in-a-string'],
  ['prob-162-longest-substring-without-repeating-characters', 'prob-448-maximum-erasure-value'],
  ['prob-163-max-consecutive-ones-iii', 'prob-164-fruit-into-baskets', 'prob-374-count-number-of-substrings-with-at-most-k-distinct-characters'],
  ['prob-165-longest-repeating-character-replacement', 'prob-166-binary-subarrays-with-sum', 'prob-167-count-number-of-nice-subarrays', 'prob-168-number-of-substrings-containing-all-three-characters'],
  ['prob-170-subarrays-with-k-different-integers', 'prob-171-minimum-window-substring', 'prob-395-minimum-window-subsequence', 'prob-447-subarray-product-less-than-k', 'prob-449-frequency-of-the-most-frequent-element'],

  // Block 5: Sorting (Days 45–50)
  ['prob-16-selection-sort', 'prob-17-bubble-sort', 'prob-328-recursive-bubble-sort'],
  ['prob-18-insertion-sort', 'prob-329-recursive-insertion-sort', 'prob-434-counting-sort'],
  ['prob-19-merge-sort', 'prob-20-quick-sort'],
  ['prob-435-radix-sort', 'prob-436-bucket-sort'],
  ['prob-437-wiggle-sort-ii', 'prob-438-minimum-swaps-to-sort-an-array'],
  ['prob-439-sort-array-by-parity-ii'],

  // Block 6: Binary Search (Days 51–60)
  ['prob-60-binary-search-search-in-sorted-array', 'prob-61-implement-lower-bound', 'prob-62-implement-upper-bound'],
  ['prob-63-search-insert-position', 'prob-371-floor-and-ceil-in-sorted-array'],
  ['prob-64-first-and-last-position-of-element-in-sorted-array', 'prob-65-count-occurrences-in-sorted-array'],
  ['prob-66-search-in-rotated-sorted-array', 'prob-67-search-in-rotated-sorted-array-ii-with-duplicates'],
  ['prob-68-find-minimum-in-rotated-sorted-array', 'prob-69-single-element-in-a-sorted-array'],
  ['prob-70-find-peak-element', 'prob-71-square-root-of-an-integer', 'prob-72-find-nth-root-of-integer-m'],
  ['prob-73-koko-eating-bananas', 'prob-74-minimum-days-to-make-m-bouquets', 'prob-75-find-the-smallest-divisor-given-a-threshold'],
  ['prob-76-capacity-to-ship-packages-within-d-days', 'prob-77-aggressive-cows', 'prob-78-book-allocation-problem'],
  ['prob-79-split-array-largest-sum', 'prob-80-painter-s-partition-problem', 'prob-372-minimize-max-distance-to-gas-stations'],
  ['prob-81-median-of-two-sorted-arrays', 'prob-82-k-th-element-of-two-sorted-arrays', 'prob-83-search-a-2d-matrix', 'prob-84-search-a-2d-matrix-ii', 'prob-85-find-a-peak-element-ii-2d-peak', 'prob-86-matrix-median-row-wise-sorted-matrix', 'prob-373-matrix-median-in-row-wise-sorted-matrix'],

  // Block 7: Linked List (Days 61–70)
  ['prob-376-introduction-to-linked-list-traversal', 'prob-377-insert-node-at-beginning-end-of-linked-list'],
  ['prob-330-introduction-to-doubly-linked-list', 'prob-331-insert-a-node-in-doubly-linked-list', 'prob-332-delete-a-node-in-doubly-linked-list', 'prob-333-reverse-a-doubly-linked-list'],
  ['prob-101-middle-of-the-linked-list', 'prob-102-reverse-linked-list', 'prob-109-delete-middle-node-of-linked-list'],
  ['prob-103-linked-list-cycle-detection', 'prob-104-linked-list-cycle-ii-find-start-of-cycle', 'prob-105-find-length-of-loop-in-linked-list'],
  ['prob-106-palindrome-linked-list', 'prob-107-segregate-odd-and-even-nodes-in-ll', 'prob-378-segregate-odd-and-even-nodes-in-linked-list'],
  ['prob-108-remove-nth-node-from-end-of-list', 'prob-111-sort-a-ll-of-0-s-1-s-and-2-s', 'prob-379-sort-a-linked-list-of-0s-1s-and-2s'],
  ['prob-110-sort-linked-list-merge-sort-on-ll', 'prob-112-intersection-point-of-two-linked-lists', 'prob-113-add-two-numbers-represented-by-ll', 'prob-380-add-1-to-a-number-represented-as-linked-list'],
  ['prob-114-reverse-nodes-in-k-group', 'prob-115-rotate-list'],
  ['prob-116-flattening-of-a-linked-list', 'prob-117-copy-list-with-random-pointer'],
  ['prob-118-lru-cache', 'prob-119-lfu-cache', 'prob-334-delete-all-occurrences-of-a-key-in-dll', 'prob-335-find-pairs-with-given-sum-in-sorted-dll', 'prob-336-remove-duplicates-from-sorted-dll', 'prob-381-delete-all-occurrences-of-a-key-in-doubly-linked-list', 'prob-382-find-pairs-with-given-sum-in-doubly-linked-list', 'prob-383-remove-duplicates-from-sorted-doubly-linked-list'],

  // Block 8: Stack & Queue (Days 71–80)
  ['prob-389-implement-stack-using-array', 'prob-390-implement-queue-using-array', 'prob-391-implement-stack-using-linked-list', 'prob-392-implement-queue-using-linked-list'],
  ['prob-147-implement-queue-using-stacks', 'prob-148-implement-stack-using-queues'],
  ['prob-145-valid-parentheses', 'prob-146-min-stack'],
  ['prob-337-infix-to-postfix-conversion-using-stack', 'prob-338-prefix-to-infix-conversion', 'prob-339-prefix-to-postfix-conversion', 'prob-340-postfix-to-prefix-conversion', 'prob-341-postfix-to-infix-conversion', 'prob-393-infix-to-prefix-conversion'],
  ['prob-149-next-greater-element-i', 'prob-150-next-greater-element-ii-circular', 'prob-151-next-smaller-element', 'prob-394-number-of-nges-to-the-right'],
  ['prob-153-asteroid-collision', 'prob-160-online-stock-span'],
  ['prob-154-sum-of-subarray-minimums', 'prob-155-sum-of-subarray-ranges'],
  ['prob-156-remove-k-digits'],
  ['prob-157-largest-rectangle-in-histogram', 'prob-158-maximal-rectangle-in-binary-matrix'],
  ['prob-159-sliding-window-maximum', 'prob-161-the-celebrity-problem'],

  // Block 9: Bit Manipulation (Days 81–86)
  ['prob-387-introduction-to-bit-manipulation-get-set-clear-bit', 'prob-134-check-if-the-i-th-bit-is-set-or-not', 'prob-135-check-if-a-number-is-odd-or-not'],
  ['prob-136-check-if-a-number-is-power-of-2', 'prob-137-count-number-of-set-bits-number-of-1-bits', 'prob-138-counting-bits-0-to-n', 'prob-451-counting-bits'],
  ['prob-139-divide-two-integers-without-or', 'prob-140-minimum-bit-flips-to-convert-number', 'prob-450-reverse-bits', 'prob-452-sum-of-two-integers-without-plus-minus'],
  ['prob-141-single-number-ii-every-element-appears-3-times', 'prob-142-single-number-iii-two-numbers-appearing-once', 'prob-388-two-numbers-with-odd-occurrences'],
  ['prob-143-find-xor-of-numbers-from-l-to-r', 'prob-144-power-set-using-bit-manipulation', 'prob-453-bitwise-and-of-numbers-range'],
  ['prob-454-total-hamming-distance', 'prob-455-maximum-product-of-word-lengths', 'prob-456-gray-code'],

  // Block 10: Recursion & Backtracking Revision (Days 87–94)
  ['prob-8-print-1-to-n-without-loop-recursion', 'prob-13-fibonacci-number'],
  ['prob-9-sum-of-first-n-numbers', 'prob-10-factorial-of-n-numbers'],
  ['prob-11-reverse-an-array', 'prob-12-check-if-a-string-is-palindrome'],
  ['prob-121-subsets', 'prob-122-subsets-ii-with-duplicates'],
  ['prob-123-combination-sum'],
  ['prob-124-combination-sum-ii-no-duplicates-1-use'],
  ['prob-125-combination-sum-iii', 'prob-126-letter-combinations-of-a-phone-number'],
  ['prob-127-palindrome-partitioning', 'prob-128-word-search-in-2d-grid'],

  // Block 11: Binary Trees & BST Revision (Days 95–104)
  ['prob-404-preorder-inorder-and-postorder-in-one-traversal', 'prob-402-iterative-inorder-traversal'],
  ['prob-202-binary-tree-level-order-traversal'],
  ['prob-197-maximum-depth-of-binary-tree', 'prob-199-balanced-binary-tree'],
  ['prob-198-diameter-of-binary-tree', 'prob-200-same-tree'],
  ['prob-203-binary-tree-zigzag-level-order-traversal', 'prob-204-boundary-traversal-of-binary-tree'],
  ['prob-206-top-view-of-binary-tree', 'prob-207-bottom-view-of-binary-tree'],
  ['prob-209-lowest-common-ancestor-of-a-binary-tree'],
  ['prob-408-introduction-to-binary-search-trees', 'prob-215-search-in-a-binary-search-tree'],
  ['prob-216-ceil-floor-in-a-bst', 'prob-217-insert-a-given-node-in-bst'],
  ['prob-218-delete-a-node-in-bst', 'prob-220-validate-binary-search-tree'],

  // Block 12: Heap / Priority Queue Revision (Days 105–109)
  ['prob-396-check-if-an-array-represents-a-min-heap', 'prob-397-convert-min-heap-to-max-heap'],
  ['prob-172-kth-largest-element-in-an-array', 'prob-173-kth-smallest-element-in-an-array'],
  ['prob-176-top-k-frequent-elements', 'prob-457-kth-largest-element-in-a-stream'],
  ['prob-180-merge-k-sorted-lists'],
  ['prob-181-find-median-from-data-stream'],

  // Block 13: Graphs Revision (Days 110–114)
  ['prob-411-introduction-to-graph-representation-adjacency-matrix-list'],
  ['prob-226-number-of-provinces', 'prob-227-number-of-islands'],
  ['prob-235-course-schedule-cycle-detection-in-directed-graph'],
  ['prob-236-course-schedule-ii-task-order'],
  ['prob-240-dijkstra-s-algorithm-shortest-path'],

  // Block 14: Dynamic Programming Revision (Days 115–118)
  ['prob-254-climbing-stairs', 'prob-255-frog-jump-geek-jump'],
  ['prob-259-unique-paths-in-grid', 'prob-261-minimum-path-sum-in-grid'],
  ['prob-265-subset-sum-problem', 'prob-269-0-1-knapsack-problem'],
  ['prob-286-longest-increasing-subsequence-lis', 'prob-274-longest-common-subsequence-lcs'],

  // Block 15: Greedy & Intervals Revision (Days 119–120)
  ['prob-182-assign-cookies', 'prob-187-n-meetings-in-one-room'],
  ['prob-194-non-overlapping-intervals', 'prob-195-insert-interval']
];

// Build preliminary Stream A days
const streamAItems = STREAM_A_RAW.map((raw, idx) => {
  const dayNum = idx + 1;
  const colonIdx = raw.indexOf(':');
  const subtopic = raw.slice(colonIdx + 1).trim().replace(/\.$/, '');
  const { topic, phase } = getStreamATopicAndPhase(dayNum);

  const keywords = subtopic.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !['using', 'with', 'and', 'from', 'practice', 'patterns', 'basics', 'fundamentals'].includes(w));
  const suggestedProblemIds = STREAM_A_PIDS[idx] || [];

  return {
    dayNumber: dayNum,
    phase,
    topic,
    subtopic,
    objectives: `Master ${subtopic} with pattern identification, complexity tradeoffs, and edge case coverage.`,
    keywords,
    suggestedProblemIds,
    targetCount: Math.min(4, Math.max(1, suggestedProblemIds.length)),
    estimatedMinutes: 60
  };
});

// Build preliminary Stream B days
const streamBItems = STREAM_B_RAW.map((raw, idx) => {
  const dayNum = idx + 1;
  const colonIdx = raw.indexOf(':');
  const subtopic = raw.slice(colonIdx + 1).trim().replace(/\.$/, '');
  const { topic, phase } = getStreamBTopicAndPhase(dayNum);

  const keywords = subtopic.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !['using', 'with', 'and', 'from', 'practice', 'patterns', 'basics', 'fundamentals'].includes(w));
  const suggestedProblemIds = STREAM_B_PIDS[idx] || [];

  return {
    dayNumber: dayNum,
    phase,
    topic,
    subtopic,
    objectives: `Rapid foundation recall: ${subtopic}. Reinforce syntax, optimal approaches, and memory invariants.`,
    keywords,
    suggestedProblemIds,
    targetCount: Math.min(4, Math.max(1, suggestedProblemIds.length)),
    estimatedMinutes: 35
  };
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
 * Strictly unmixed topic order: Full Trees -> Full Graphs -> Full DP -> Full Recursion -> Full Greedy -> Full Heap -> Full Tries
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
