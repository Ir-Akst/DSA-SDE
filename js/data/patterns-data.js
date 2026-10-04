/**
 * AlgoRecall - Patterns Handbook & Algorithm Visual Cheat Sheets
 * Comprehensive reference guide of 20+ canonical algorithmic patterns,
 * time/space tradeoffs, boilerplate templates, and triggers.
 */

(function () {
  'use strict';

  window.DSA_PATTERNS = [
    {
      id: 'two-pointers',
      title: 'Two Pointers (Opposite Ends)',
      category: 'Pointers & Sliding Window',
      icon: 'fa-arrows-left-right',
      color: '#38bdf8',
      summary: 'Two pointers starting at opposite ends moving inward based on comparison with target.',
      whenToUse: [
        'Array is sorted (or sorting is allowed without breaking index requirements)',
        'Searching for pairs/triplets satisfying a target sum or condition',
        'Reversing, palindrome verification, or partition schemes (e.g. QuickSelect)'
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      templateCode: `function twoPointersOpposite(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right]; // Found target pair
    } else if (sum < target) {
      left++; // Need larger sum -> move left pointer forward
    } else {
      right--; // Need smaller sum -> move right pointer inward
    }
  }
  return [-1, -1];
}`,
      edgeCases: [
        'Duplicate elements (skip duplicates using while loops when counting unique pairs)',
        'Integer overflow when computing sum in language runtimes',
        'Empty array or array of length < 2'
      ],
      canonicalProblems: ['Two Sum II', '3Sum', 'Container With Most Water', 'Valid Palindrome', 'Trapping Rain Water']
    },
    {
      id: 'sliding-window-dynamic',
      title: 'Sliding Window (Dynamic / Variable Size)',
      category: 'Pointers & Sliding Window',
      icon: 'fa-sliders',
      color: '#34d399',
      summary: 'Expand right pointer to satisfy condition, then shrink left pointer to find optimal (min/max) contiguous window.',
      whenToUse: [
        'Problem asks for longest/shortest contiguous subarray or substring matching a condition',
        'Window size varies dynamically based on frequency map or running sum',
        'Monotonic condition: expanding right increases constraint violation; shrinking left restores validity'
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(K) where K is unique keys in frequency map',
      templateCode: `function slidingWindowVariable(s) {
  let left = 0;
  let maxLen = 0;
  const windowMap = new Map();

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    windowMap.set(char, (windowMap.get(char) || 0) + 1);

    // Shrink window from left until constraint is valid again
    while (/* window condition invalid */ false) {
      const leftChar = s[left];
      windowMap.set(leftChar, windowMap.get(leftChar) - 1);
      if (windowMap.get(leftChar) === 0) windowMap.delete(leftChar);
      left++;
    }

    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      edgeCases: [
        'All elements satisfy condition (window expands to entire array)',
        'No valid subarray found (return 0 or empty string as required)',
        'Negative numbers (breaks monotonic sum property — use Prefix Sum + Hash Map instead)'
      ],
      canonicalProblems: ['Longest Substring Without Repeating Characters', 'Minimum Window Substring', 'Longest Repeating Character Replacement', 'Max Consecutive Ones III']
    },
    {
      id: 'fast-slow-pointers',
      title: 'Fast & Slow Pointers (Floyd’s Tortoise & Hare)',
      category: 'Pointers & Sliding Window',
      icon: 'fa-person-running',
      color: '#fbbf24',
      summary: 'Two pointers moving at different speeds (1x and 2x) to detect cycles or find middle points in O(1) space.',
      whenToUse: [
        'Detecting cycles in Linked Lists or Array sequences',
        'Finding middle node of a Linked List in single pass',
        'Finding the start node of a cycle or finding duplicate number in 1..N array'
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      templateCode: `function detectCycle(head) {
  let slow = head;
  let fast = head;

  // Phase 1: Detect cycle meeting point
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      // Phase 2: Find cycle entry point
      let entry = head;
      while (entry !== slow) {
        entry = entry.next;
        slow = slow.next;
      }
      return entry; // Cycle entry node
    }
  }
  return null; // No cycle
}`,
      edgeCases: [
        'Single node without cycle (fast.next is null)',
        'Even vs. Odd length linked lists for middle node determination'
      ],
      canonicalProblems: ['Linked List Cycle', 'Linked List Cycle II', 'Middle of the Linked List', 'Find the Duplicate Number', 'Happy Number']
    },
    {
      id: 'monotonic-stack',
      title: 'Monotonic Stack (Next Greater / Smaller Element)',
      category: 'Stacks & Heaps',
      icon: 'fa-layer-group',
      color: '#f43f5e',
      summary: 'Maintains elements in strictly increasing or decreasing order to find the nearest greater/smaller neighbor in O(N).',
      whenToUse: [
        'Next Greater Element (NGE) or Previous Greater Element',
        'Daily Temperatures / stock span queries',
        'Largest rectangle in histogram or trapping rain water bounds'
      ],
      timeComplexity: 'O(N) — each element is pushed and popped at most once',
      spaceComplexity: 'O(N)',
      templateCode: `function nextGreaterElement(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // Stores indices

  for (let i = 0; i < n; i++) {
    // Monotonically decreasing stack: pop smaller elements
    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {
      const idx = stack.pop();
      result[idx] = nums[i]; // Found next greater element
    }
    stack.push(i);
  }
  return result;
}`,
      edgeCases: [
        'Strictly descending or ascending input array',
        'Circular arrays (loop from 0 to 2*N - 1 with modulo index: i % n)'
      ],
      canonicalProblems: ['Daily Temperatures', 'Next Greater Element I', 'Online Stock Span', 'Largest Rectangle in Histogram', 'Car Fleet']
    },
    {
      id: 'binary-search-answer',
      title: 'Binary Search on Answer Space',
      category: 'Arrays & Strings',
      icon: 'fa-magnifying-glass-chart',
      color: '#a855f7',
      summary: 'Binary search over possible output values [minAnswer, maxAnswer] using a monotonic feasibility check function.',
      whenToUse: [
        'Problem asks to find the Minimum possible Maximum (or Maximum possible Minimum)',
        'Decision function check(mid) returns boolean and is monotonic (FF...FTT or TT...TFF)',
        'Keywords: "koko eating bananas", "ship packages within D days", "allocate minimum pages"'
      ],
      timeComplexity: 'O(N * log(maxVal - minVal))',
      spaceComplexity: 'O(1)',
      templateCode: `function binarySearchOnAnswer(weights, days) {
  let low = Math.max(...weights); // Minimum possible capacity
  let high = weights.reduce((a, b) => a + b, 0); // Maximum possible capacity
  let ans = high;

  function canShipWithCapacity(cap) {
    let dayCount = 1, currentLoad = 0;
    for (const w of weights) {
      if (currentLoad + w > cap) {
        dayCount++;
        currentLoad = 0;
      }
      currentLoad += w;
    }
    return dayCount <= days;
  }

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (canShipWithCapacity(mid)) {
      ans = mid;
      high = mid - 1; // Try smaller capacity
    } else {
      low = mid + 1; // Must increase capacity
    }
  }
  return ans;
}`,
      edgeCases: [
        'Boundary calculation: integer overflow when low + high in 32-bit systems',
        'Feasibility function logic when single item exceeds mid capacity'
      ],
      canonicalProblems: ['Koko Eating Bananas', 'Capacity To Ship Packages Within D Days', 'Split Array Largest Sum', 'Aggressive Cows', 'Median of Two Sorted Arrays']
    },
    {
      id: 'bfs-level-order',
      title: 'Breadth-First Search (Level Order / Shortest Path)',
      category: 'Trees & Graphs',
      icon: 'fa-network-wired',
      color: '#06b6d4',
      summary: 'Queue-based traversal exploring neighbor nodes level-by-level. Guarantees unweighted shortest path.',
      whenToUse: [
        'Level-by-level traversal of Trees or Multi-source BFS on 2D grids (e.g. Rotting Oranges)',
        'Shortest path in unweighted graphs or word ladder transformations',
        'Top-view, bottom-view, or zigzag tree traversals'
      ],
      timeComplexity: 'O(V + E) or O(Rows * Cols)',
      spaceComplexity: 'O(V) for queue and visited set',
      templateCode: `function bfsLevelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length; // Capture exact count of current level
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }
  return result;
}`,
      edgeCases: [
        'Cyclic graphs require a visited Set to avoid infinite loops',
        'Disconnected graphs require outer loop across all unvisited vertices',
        'Multi-source BFS: enqueue all starting source nodes before starting BFS loop'
      ],
      canonicalProblems: ['Binary Tree Level Order Traversal', 'Rotting Oranges', 'Word Ladder', '01 Matrix', 'Shortest Path in Binary Matrix']
    },
    {
      id: 'dfs-backtracking',
      title: 'DFS & Backtracking (Subsets, Permutations & Paths)',
      category: 'Trees & Graphs',
      icon: 'fa-tree',
      color: '#10b981',
      summary: 'Recursive depth exploration building candidate solutions and backtracking state upon failure.',
      whenToUse: [
        'Generate all combinations, permutations, subsets, or path partitions',
        'Grid island counting and connected component exploration',
        'Constraint satisfaction: Sudoku solver, N-Queens, Word Search'
      ],
      timeComplexity: 'O(2^N) for subsets / O(N!) for permutations',
      spaceComplexity: 'O(N) recursive call stack',
      templateCode: `function subsets(nums) {
  const result = [];

  function backtrack(startIndex, currentSubset) {
    result.push([...currentSubset]); // Add snapshot of current state

    for (let i = startIndex; i < nums.length; i++) {
      currentSubset.push(nums[i]); // Choose
      backtrack(i + 1, currentSubset); // Explore
      currentSubset.pop(); // Un-choose (Backtrack!)
    }
  }

  backtrack(0, []);
  return result;
}`,
      edgeCases: [
        'Handling duplicates: sort array upfront, skip if nums[i] === nums[i-1] && i > startIndex',
        'Deep copying state when pushing to results array (e.g. [...path])'
      ],
      canonicalProblems: ['Subsets', 'Permutations', 'Combination Sum', 'Word Search', 'N-Queens', 'Number of Islands']
    },
    {
      id: 'topological-sort',
      title: 'Topological Sort (Kahn’s Algorithm & Cycle Detection)',
      category: 'Trees & Graphs',
      icon: 'fa-diagram-project',
      color: '#ec4899',
      summary: 'Linear ordering of vertices in a Directed Acyclic Graph (DAG) using in-degrees and zero-indegree queue.',
      whenToUse: [
        'Course prerequisites, task dependency scheduling, compilation order',
        'Detecting cycles in a directed graph (if processed count < V -> cycle exists)',
        'Alien dictionary character ordering'
      ],
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V + E)',
      templateCode: `function canFinishCourses(numCourses, prerequisites) {
  const inDegree = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);

  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
    inDegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  let processedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift();
    processedCount++;

    for (const neighbor of adj[curr]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  return processedCount === numCourses; // True if no cycle
}`,
      edgeCases: [
        'Disjoint DAG components',
        'Self-loops or mutual dependency cycles (e.g. [1,0] and [0,1])'
      ],
      canonicalProblems: ['Course Schedule', 'Course Schedule II', 'Alien Dictionary', 'Minimum Height Trees']
    },
    {
      id: 'union-find',
      title: 'Disjoint Set Union (Union-Find with Path Compression)',
      category: 'Trees & Graphs',
      icon: 'fa-circle-nodes',
      color: '#f97316',
      summary: 'Near O(1) dynamic connectivity structure tracking disjoint partition sets with path compression and rank.',
      whenToUse: [
        'Dynamic connectivity queries in undirected graphs',
        'Kruskal’s Minimum Spanning Tree (MST)',
        'Finding redundant connections / cycle detection in undirected graphs',
        'Number of connected components changing dynamically'
      ],
      timeComplexity: 'O(α(N)) ≈ O(1) per operation (Inverse Ackermann)',
      spaceComplexity: 'O(N)',
      templateCode: `class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(1);
    this.count = size; // Total components
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression!
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false; // Already connected

    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
    this.count--;
    return true;
  }
}`,
      edgeCases: [
        '1-indexed vs 0-indexed node IDs',
        'Detecting whether adding an edge creates a cycle (union returns false)'
      ],
      canonicalProblems: ['Redundant Connection', 'Number of Connected Components in an Undirected Graph', 'Graph Valid Tree', 'Accounts Merge']
    },
    {
      id: 'two-heaps-median',
      title: 'Two Heaps (Running Median & Stream Partitioning)',
      category: 'Stacks & Heaps',
      icon: 'fa-scale-balanced',
      color: '#eab308',
      summary: 'Max-Heap for smaller half and Min-Heap for larger half to maintain median in O(log N) insertion and O(1) lookup.',
      whenToUse: [
        'Finding running median from a continuous data stream',
        'Finding sliding window median',
        'Maximizing capital / IPO problem (available projects min-heap + profit max-heap)'
      ],
      timeComplexity: 'O(log N) insert, O(1) findMedian',
      spaceComplexity: 'O(N)',
      templateCode: `class MedianFinder {
  constructor() {
    this.small = []; // Max-heap (smaller half)
    this.large = []; // Min-heap (larger half)
  }

  addNum(num) {
    // 1. Add to max-heap, then balance to min-heap
    this.small.push(num);
    this.small.sort((a, b) => b - a); // (Using priority queue in real heap)
    this.large.push(this.small.shift());
    this.large.sort((a, b) => a - b);

    // 2. Maintain size invariant: small size >= large size
    if (this.large.length > this.small.length) {
      this.small.unshift(this.large.shift());
    }
  }

  findMedian() {
    if (this.small.length > this.large.length) {
      return this.small[0];
    }
    return (this.small[0] + this.large[0]) / 2.0;
  }
}`,
      edgeCases: [
        'Equal size heaps (median is average of tops) vs Odd size (median is top of larger heap)',
        'Float precision during division'
      ],
      canonicalProblems: ['Find Median from Data Stream', 'Sliding Window Median', 'IPO']
    },
    {
      id: 'dp-1d-memoization',
      title: 'Dynamic Programming 1D (Prefix State Transitions)',
      category: 'Dynamic Programming',
      icon: 'fa-stairs',
      color: '#8b5cf6',
      summary: 'State dp[i] depends on preceding subproblems dp[i-1], dp[i-2], or dp[i-k]. Space optimizable to O(1).',
      whenToUse: [
        'Finding minimum cost, number of ways, or max profit with sequential choices',
        'Climbing stairs, House Robber, Coin Change, Word Break, Longest Increasing Subsequence'
      ],
      timeComplexity: 'O(N) or O(N * Target)',
      spaceComplexity: 'O(N) optimizable to O(1) if looking back fixed k steps',
      templateCode: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // Base case: 0 coins needed for 0 amount

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0 && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      edgeCases: [
        'Unreachable targets (initialize with Infinity, check for sentinel at end)',
        'Base cases at index 0 and index 1'
      ],
      canonicalProblems: ['Climbing Stairs', 'House Robber', 'Coin Change', 'Longest Increasing Subsequence', 'Word Break', 'Decode Ways']
    },
    {
      id: 'dp-2d-grid-knapsack',
      title: '2D DP & 0/1 Knapsack (Grid & String Matching)',
      category: 'Dynamic Programming',
      icon: 'fa-table-cells',
      color: '#6366f1',
      summary: '2D table dp[i][j] representing states between two strings, grid positions, or item choices under weight capacity.',
      whenToUse: [
        'Longest Common Subsequence (LCS), Edit Distance, Distinct Subsequences',
        '0/1 Knapsack (include vs exclude item with weight limit)',
        'Grid paths with obstacles / minimum path sum'
      ],
      timeComplexity: 'O(M * N)',
      spaceComplexity: 'O(M * N) or O(N) using rolling 1D array',
      templateCode: `function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1; // Characters match
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // Take max from subproblems
      }
    }
  }

  return dp[m][n];
}`,
      edgeCases: [
        '1-based indexing for DP table to easily accommodate base cases at row 0 / col 0',
        '0/1 Knapsack 1D optimization must iterate weight in REVERSE to prevent reusing same item multiple times'
      ],
      canonicalProblems: ['Longest Common Subsequence', 'Edit Distance', 'Unique Paths', 'Minimum Path Sum', 'Partition Equal Subset Sum', 'Target Sum']
    },
    {
      id: 'trie-prefix-tree',
      title: 'Trie (Prefix Tree)',
      category: 'Advanced Data Structures',
      icon: 'fa-code-branch',
      color: '#14b8a6',
      summary: 'N-ary tree structure where nodes represent characters for O(L) prefix queries, autocompletion, and word search.',
      whenToUse: [
        'Autocomplete, spell checker, prefix matching ("starts with")',
        'Word Search II on 2D grid',
        'Bitwise Maximum XOR queries (Binary Trie)'
      ],
      timeComplexity: 'O(L) where L is string length',
      spaceComplexity: 'O(Total characters * Alphabet size)',
      templateCode: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let curr = this.root;
    for (const char of word) {
      if (!curr.children[char]) curr.children[char] = new TrieNode();
      curr = curr.children[char];
    }
    curr.isEndOfWord = true;
  }

  startsWith(prefix) {
    let curr = this.root;
    for (const char of prefix) {
      if (!curr.children[char]) return false;
      curr = curr.children[char];
    }
    return true;
  }
}`,
      edgeCases: [
        'Case sensitivity (lowercase vs uppercase vs unicode)',
        'Deleting words from Trie without corrupting overlapping prefixes'
      ],
      canonicalProblems: ['Implement Trie (Prefix Tree)', 'Design Add and Search Words Data Structure', 'Word Search II', 'Maximum XOR of Two Numbers in an Array']
    },
    {
      id: 'intervals-greedy',
      title: 'Interval Scheduling & Merging (Greedy Sort)',
      category: 'Arrays & Strings',
      icon: 'fa-timeline',
      color: '#f43f5e',
      summary: 'Sort intervals by start or end time, then greedily merge overlapping bounds or allocate conference rooms.',
      whenToUse: [
        'Merge overlapping intervals, insert new interval',
        'Non-overlapping intervals (minimum removals)',
        'Meeting Rooms II (minimum rooms needed using min-heap of end times)'
      ],
      timeComplexity: 'O(N log N) sorting + O(N) linear pass',
      spaceComplexity: 'O(N)',
      templateCode: `function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  // Sort by start time
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    if (current[0] <= lastMerged[1]) {
      // Overlap detected: extend end bound
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      // Disjoint interval: push to result
      merged.push(current);
    }
  }

  return merged;
}`,
      edgeCases: [
        'Touching boundaries: [1, 4] and [4, 5] count as overlapping',
        'Interval entirely contained within another: [1, 10] and [2, 5]'
      ],
      canonicalProblems: ['Merge Intervals', 'Insert Interval', 'Non-overlapping Intervals', 'Meeting Rooms II', 'Minimum Number of Arrows to Burst Balloons']
    },
    {
      id: 'kadanes-algorithm',
      title: 'Kadane’s Algorithm (Maximum Subarray Sum)',
      category: 'Arrays & Strings',
      icon: 'fa-chart-line',
      color: '#10b981',
      summary: 'Dynamic linear scan tracking max ending at current index: either extend existing sum or start fresh subarray.',
      whenToUse: [
        'Maximum contiguous subarray sum in O(N)',
        'Maximum product subarray (track both max and min product)',
        'Circular subarray maximum sum'
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      templateCode: `function maxSubArray(nums) {
  let currentMax = nums[0];
  let globalMax = nums[0];

  for (let i = 1; i < nums.length; i++) {
    // Either extend the previous sum or restart at current element
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    globalMax = Math.max(globalMax, currentMax);
  }

  return globalMax;
}`,
      edgeCases: [
        'All negative numbers: globalMax must return largest single negative number, not 0',
        'Single element array'
      ],
      canonicalProblems: ['Maximum Subarray', 'Maximum Product Subarray', 'Maximum Sum Circular Subarray']
    },
    {
      id: 'bit-manipulation-tricks',
      title: 'Bit Manipulation & XOR Invariants',
      category: 'Advanced Data Structures',
      icon: 'fa-microchip',
      color: '#06b6d4',
      summary: 'Low-level bitwise operations (XOR cancellation, bit masking, n & (n - 1) bit removal) for O(1) space tricks.',
      whenToUse: [
        'Single Number (every element appears twice except one) -> x ^ x = 0',
        'Count set bits (Brian Kernighan’s: n = n & (n - 1))',
        'Power of two check: (n > 0 && (n & (n - 1)) === 0)',
        'Bitmasking state for subset representations (DP with bitmask)'
      ],
      timeComplexity: 'O(1) to O(N)',
      spaceComplexity: 'O(1)',
      templateCode: `function singleNumber(nums) {
  let unique = 0;
  for (const num of nums) {
    unique ^= num; // a ^ a = 0; a ^ 0 = a
  }
  return unique;
}

function countSetBits(n) {
  let count = 0;
  while (n > 0) {
    n = n & (n - 1); // Clears the lowest set bit!
    count++;
  }
  return count;
}`,
      edgeCases: [
        'Negative numbers in 32-bit signed bitwise operations in JavaScript (use unsigned right shift >>>)',
        'Bit shifts >= 32'
      ],
      canonicalProblems: ['Single Number', 'Number of 1 Bits', 'Counting Bits', 'Reverse Bits', 'Missing Number', 'Subsets (Bitmask)']
    }
  ];
})();
