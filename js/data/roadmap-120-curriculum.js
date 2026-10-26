/**
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

  const EXACT_STREAM_A_120 = [
  {
    "dayNumber": 1,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Graph representation, adjacency list, adjacency matrix and graph storage",
    "objectives": "Master Graph representation, adjacency list, adjacency matrix and graph storage with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "graph",
      "representation",
      "adjacency",
      "list",
      "adjacency",
      "matrix",
      "graph",
      "storage"
    ],
    "suggestedProblemIds": [
      "prob-411-introduction-to-graph-representation-adjacency-matrix-list",
      "prob-230-0-1-matrix-distance-to-nearest-0"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 2,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "BFS traversal, queues, visited array and connected components",
    "objectives": "Master BFS traversal, queues, visited array and connected components with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "traversal",
      "queues",
      "visited",
      "array",
      "connected",
      "components"
    ],
    "suggestedProblemIds": [
      "prob-226-number-of-provinces",
      "prob-231-surrounded-regions-capture-o-s"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 3,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "DFS traversal, recursive and iterative traversal patterns",
    "objectives": "Master DFS traversal, recursive and iterative traversal patterns with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "traversal",
      "recursive",
      "iterative",
      "traversal"
    ],
    "suggestedProblemIds": [
      "prob-228-flood-fill",
      "prob-249-most-stones-removed-with-same-row-or-column"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 4,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Grid BFS/DFS, Number of Islands and matrix flood fill",
    "objectives": "Master Grid BFS/DFS, Number of Islands and matrix flood fill with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "grid",
      "number",
      "islands",
      "matrix",
      "flood",
      "fill"
    ],
    "suggestedProblemIds": [
      "prob-227-number-of-islands",
      "prob-232-number-of-enclaves"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 5,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Undirected cycle detection using BFS and DFS",
    "objectives": "Master Undirected cycle detection using BFS and DFS with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "undirected",
      "cycle",
      "detection"
    ],
    "suggestedProblemIds": [
      "prob-235-course-schedule-cycle-detection-in-directed-graph",
      "prob-251-making-a-large-island"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 6,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Directed cycle detection, recursion stack and state coloring",
    "objectives": "Master Directed cycle detection, recursion stack and state coloring with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "directed",
      "cycle",
      "detection",
      "recursion",
      "stack",
      "state",
      "coloring"
    ],
    "suggestedProblemIds": [
      "prob-234-is-graph-bipartite"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 7,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Topological sorting using Kahn's algorithm (BFS in-degree)",
    "objectives": "Master Topological sorting using Kahn's algorithm (BFS in-degree) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "topological",
      "sorting",
      "kahn",
      "algorithm",
      "degree"
    ],
    "suggestedProblemIds": [
      "prob-237-find-eventual-safe-states"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 8,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Topological sorting using DFS and course ordering",
    "objectives": "Master Topological sorting using DFS and course ordering with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "topological",
      "sorting",
      "course",
      "ordering"
    ],
    "suggestedProblemIds": [
      "prob-236-course-schedule-ii-task-order"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 9,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Bipartite graph checking using BFS and DFS (Two-coloring)",
    "objectives": "Master Bipartite graph checking using BFS and DFS (Two-coloring) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "bipartite",
      "graph",
      "checking",
      "coloring"
    ],
    "suggestedProblemIds": [
      "prob-238-alien-dictionary"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 10,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Multisource BFS, 0-1 Matrix and rotting oranges",
    "objectives": "Master Multisource BFS, 0-1 Matrix and rotting oranges with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "multisource",
      "matrix",
      "rotting",
      "oranges"
    ],
    "suggestedProblemIds": [
      "prob-229-rotting-oranges"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 11,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Shortest paths in unweighted graphs using BFS",
    "objectives": "Master Shortest paths in unweighted graphs using BFS with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "shortest",
      "paths",
      "unweighted",
      "graphs"
    ],
    "suggestedProblemIds": [
      "prob-233-word-ladder"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 12,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Dijkstra's algorithm, priority queues and shortest path trees",
    "objectives": "Master Dijkstra's algorithm, priority queues and shortest path trees with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "dijkstra",
      "algorithm",
      "priority",
      "queues",
      "shortest",
      "path",
      "trees"
    ],
    "suggestedProblemIds": [
      "prob-240-dijkstra-s-algorithm-shortest-path"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 13,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Dijkstra practice, shortest path in binary matrix and variations",
    "objectives": "Master Dijkstra practice, shortest path in binary matrix and variations with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "dijkstra",
      "shortest",
      "path",
      "binary",
      "matrix",
      "variations"
    ],
    "suggestedProblemIds": [
      "prob-241-shortest-path-in-binary-matrix"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 14,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Bellman-Ford algorithm and negative cycle detection",
    "objectives": "Master Bellman-Ford algorithm and negative cycle detection with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "bellman",
      "ford",
      "algorithm",
      "negative",
      "cycle",
      "detection"
    ],
    "suggestedProblemIds": [
      "prob-243-cheapest-flights-within-k-stops"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 15,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Floyd-Warshall algorithm and all-pairs shortest paths",
    "objectives": "Master Floyd-Warshall algorithm and all-pairs shortest paths with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "floyd",
      "warshall",
      "algorithm",
      "pairs",
      "shortest",
      "paths"
    ],
    "suggestedProblemIds": [
      "prob-353-find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 16,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "0-1 BFS and minimum effort path variants",
    "objectives": "Master 0-1 BFS and minimum effort path variants with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "minimum",
      "effort",
      "path",
      "variants"
    ],
    "suggestedProblemIds": [
      "prob-242-path-with-minimum-effort"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 17,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Disjoint Set Union (DSU) by rank/size with path compression",
    "objectives": "Master Disjoint Set Union (DSU) by rank/size with path compression with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "disjoint",
      "union",
      "rank",
      "size",
      "path",
      "compression"
    ],
    "suggestedProblemIds": [
      "prob-247-redundant-connection"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 18,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Kruskal's Minimum Spanning Tree algorithm using DSU",
    "objectives": "Master Kruskal's Minimum Spanning Tree algorithm using DSU with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "kruskal",
      "minimum",
      "spanning",
      "tree",
      "algorithm"
    ],
    "suggestedProblemIds": [
      "prob-245-minimum-spanning-tree-prim-s-algorithm"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 19,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Prim's Minimum Spanning Tree algorithm using priority queues",
    "objectives": "Master Prim's Minimum Spanning Tree algorithm using priority queues with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "prim",
      "minimum",
      "spanning",
      "tree",
      "algorithm",
      "priority",
      "queues"
    ],
    "suggestedProblemIds": [
      "prob-246-kruskal-s-algorithm-mst-using-dsu"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 20,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Bridges in graph and Tarjan's critical connections algorithm",
    "objectives": "Master Bridges in graph and Tarjan's critical connections algorithm with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "bridges",
      "graph",
      "tarjan",
      "critical",
      "connections",
      "algorithm"
    ],
    "suggestedProblemIds": [
      "prob-252-bridges-in-graph-tarjan-s-algorithm"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 21,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Strongly Connected Components using Kosaraju's algorithm",
    "objectives": "Master Strongly Connected Components using Kosaraju's algorithm with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "strongly",
      "connected",
      "components",
      "kosaraju",
      "algorithm"
    ],
    "suggestedProblemIds": [
      "prob-253-strongly-connected-components-kosaraju-s-algorithm"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 22,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Articulation points and Tarjan's low-link discovery",
    "objectives": "Master Articulation points and Tarjan's low-link discovery with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "articulation",
      "points",
      "tarjan",
      "link",
      "discovery"
    ],
    "suggestedProblemIds": [
      "prob-355-articulation-point-in-graph"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 23,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "DAG shortest paths, longest paths and graph DP patterns",
    "objectives": "Master DAG shortest paths, longest paths and graph DP patterns with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "shortest",
      "paths",
      "longest",
      "paths",
      "graph"
    ],
    "suggestedProblemIds": [
      "prob-239-shortest-path-in-directed-acyclic-graph-dag"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 24,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Word Ladder, shortest transformation sequences and graph modeling",
    "objectives": "Master Word Ladder, shortest transformation sequences and graph modeling with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "word",
      "ladder",
      "shortest",
      "transformation",
      "sequences",
      "graph",
      "modeling"
    ],
    "suggestedProblemIds": [
      "prob-244-network-delay-time"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 25,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Graph connectivity, redundant connections and network components",
    "objectives": "Master Graph connectivity, redundant connections and network components with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "graph",
      "connectivity",
      "redundant",
      "connections",
      "network",
      "components"
    ],
    "suggestedProblemIds": [
      "prob-248-number-of-operations-to-make-network-connected"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 26,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Shortest path optimization, cheapest flights and network delay time",
    "objectives": "Master Shortest path optimization, cheapest flights and network delay time with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "shortest",
      "path",
      "optimization",
      "cheapest",
      "flights",
      "network",
      "delay",
      "time"
    ],
    "suggestedProblemIds": [
      "prob-351-minimum-multiplications-to-reach-end"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 27,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Advanced DSU, stones removal and accounts merge",
    "objectives": "Master Advanced DSU, stones removal and accounts merge with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "advanced",
      "stones",
      "removal",
      "accounts",
      "merge"
    ],
    "suggestedProblemIds": [
      "prob-250-accounts-merge"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 28,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Word Ladder II, all shortest paths and backtracking with BFS",
    "objectives": "Master Word Ladder II, all shortest paths and backtracking with BFS with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "word",
      "ladder",
      "shortest",
      "paths",
      "backtracking"
    ],
    "suggestedProblemIds": [
      "prob-412-minimum-steps-to-reach-end-by-multiplication"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 29,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Graph error diagnosis, weak-pattern repair and failed problems",
    "objectives": "Master Graph error diagnosis, weak-pattern repair and failed problems with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "graph",
      "error",
      "diagnosis",
      "weak",
      "pattern",
      "repair",
      "failed",
      "problems"
    ],
    "suggestedProblemIds": [
      "prob-352-number-of-ways-to-arrive-at-destination"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 30,
    "phase": "Phase 1: Graphs",
    "topic": "Graphs",
    "subtopic": "Comprehensive graph assessment, timed practice and mastery audit",
    "objectives": "Master Comprehensive graph assessment, timed practice and mastery audit with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "comprehensive",
      "graph",
      "assessment",
      "timed",
      "mastery",
      "audit"
    ],
    "suggestedProblemIds": [
      "prob-354-swim-in-rising-water"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 31,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Binary tree node structure, pointer properties and DFS traversals introduction",
    "objectives": "Master Binary tree node structure, pointer properties and DFS traversals introduction with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "binary",
      "tree",
      "node",
      "structure",
      "pointer",
      "properties",
      "traversals",
      "introduction"
    ],
    "suggestedProblemIds": [
      "prob-346-all-nodes-distance-k-in-binary-tree",
      "prob-207-bottom-view-of-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 32,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Inorder traversal (Recursive & Iterative) with call stack analysis",
    "objectives": "Master Inorder traversal (Recursive & Iterative) with call stack analysis with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "inorder",
      "traversal",
      "recursive",
      "iterative",
      "call",
      "stack",
      "analysis"
    ],
    "suggestedProblemIds": [
      "prob-402-iterative-inorder-traversal",
      "prob-222-construct-bst-from-preorder-traversal"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 33,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Preorder and Postorder traversals (Recursive & Iterative with stack)",
    "objectives": "Master Preorder and Postorder traversals (Recursive & Iterative with stack) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "preorder",
      "postorder",
      "traversals",
      "recursive",
      "iterative",
      "stack"
    ],
    "suggestedProblemIds": [
      "prob-401-iterative-preorder-traversal",
      "prob-403-iterative-postorder-traversal-using-1-stack"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 34,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Level order traversal, BFS using queue and level-by-level processing",
    "objectives": "Master Level order traversal, BFS using queue and level-by-level processing with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "level",
      "order",
      "traversal",
      "queue",
      "level",
      "level",
      "processing"
    ],
    "suggestedProblemIds": [
      "prob-202-binary-tree-level-order-traversal",
      "prob-205-vertical-order-traversal-of-a-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 35,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Zigzag spiral level order traversal and vertical tree order",
    "objectives": "Master Zigzag spiral level order traversal and vertical tree order with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "zigzag",
      "spiral",
      "level",
      "order",
      "traversal",
      "vertical",
      "tree",
      "order"
    ],
    "suggestedProblemIds": [
      "prob-203-binary-tree-zigzag-level-order-traversal",
      "prob-223-binary-search-tree-iterator"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 36,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Tree height, maximum depth and balanced binary tree verification",
    "objectives": "Master Tree height, maximum depth and balanced binary tree verification with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "tree",
      "height",
      "maximum",
      "depth",
      "balanced",
      "binary",
      "tree",
      "verification"
    ],
    "suggestedProblemIds": [
      "prob-197-maximum-depth-of-binary-tree",
      "prob-199-balanced-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 37,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Tree diameter, O(N) optimized postorder diameter calculation",
    "objectives": "Master Tree diameter, O(N) optimized postorder diameter calculation with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "tree",
      "diameter",
      "optimized",
      "postorder",
      "diameter",
      "calculation"
    ],
    "suggestedProblemIds": [
      "prob-198-diameter-of-binary-tree",
      "prob-210-binary-tree-maximum-path-sum"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 38,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Maximum path sum in binary tree (any node to any node)",
    "objectives": "Master Maximum path sum in binary tree (any node to any node) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "maximum",
      "path",
      "binary",
      "tree",
      "node",
      "node"
    ],
    "suggestedProblemIds": [
      "prob-405-root-to-node-path-in-binary-tree",
      "prob-220-validate-binary-search-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 39,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Check identical binary trees and symmetric mirror tree validation",
    "objectives": "Master Check identical binary trees and symmetric mirror tree validation with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "check",
      "identical",
      "binary",
      "trees",
      "symmetric",
      "mirror",
      "tree",
      "validation"
    ],
    "suggestedProblemIds": [
      "prob-201-symmetric-tree",
      "prob-350-largest-bst-in-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 40,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Boundary traversal of binary tree (Left boundary, leaf nodes, right boundary)",
    "objectives": "Master Boundary traversal of binary tree (Left boundary, leaf nodes, right boundary) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "boundary",
      "traversal",
      "binary",
      "tree",
      "left",
      "boundary",
      "leaf",
      "nodes",
      "right",
      "boundary"
    ],
    "suggestedProblemIds": [
      "prob-204-boundary-traversal-of-binary-tree",
      "prob-342-morris-inorder-traversal-of-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 41,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Tree views: Top view and Bottom view using vertical coordinate hashing",
    "objectives": "Master Tree views: Top view and Bottom view using vertical coordinate hashing with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "tree",
      "views",
      "view",
      "bottom",
      "view",
      "vertical",
      "coordinate",
      "hashing"
    ],
    "suggestedProblemIds": [
      "prob-206-top-view-of-binary-tree",
      "prob-196-invert-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 42,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Tree views: Left view and Right view using level-order and recursive DFS",
    "objectives": "Master Tree views: Left view and Right view using level-order and recursive DFS with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "tree",
      "views",
      "left",
      "view",
      "right",
      "view",
      "level",
      "order",
      "recursive"
    ],
    "suggestedProblemIds": [
      "prob-208-binary-tree-right-side-view",
      "prob-212-construct-tree-from-postorder-and-inorder"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 43,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Root-to-leaf paths, path sum I & II with target sum verification",
    "objectives": "Master Root-to-leaf paths, path sum I & II with target sum verification with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "root",
      "leaf",
      "paths",
      "path",
      "target",
      "verification"
    ],
    "suggestedProblemIds": [
      "prob-215-search-in-a-binary-search-tree",
      "prob-221-lowest-common-ancestor-of-a-bst"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 44,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Lowest Common Ancestor (LCA) in binary tree and paths between two nodes",
    "objectives": "Master Lowest Common Ancestor (LCA) in binary tree and paths between two nodes with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "lowest",
      "common",
      "ancestor",
      "binary",
      "tree",
      "paths",
      "between",
      "nodes"
    ],
    "suggestedProblemIds": [
      "prob-209-lowest-common-ancestor-of-a-binary-tree",
      "prob-345-children-sum-property-in-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 45,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Maximum width of binary tree using index-based level order",
    "objectives": "Master Maximum width of binary tree using index-based level order with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "maximum",
      "width",
      "binary",
      "tree",
      "index",
      "based",
      "level",
      "order"
    ],
    "suggestedProblemIds": [
      "prob-344-maximum-width-of-binary-tree",
      "prob-343-morris-preorder-traversal-of-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 46,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Children sum property and check for children sum parent invariants",
    "objectives": "Master Children sum property and check for children sum parent invariants with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "children",
      "property",
      "check",
      "children",
      "parent",
      "invariants"
    ],
    "suggestedProblemIds": [
      "prob-406-check-for-children-sum-property-in-binary-tree",
      "prob-224-two-sum-iv-input-is-a-bst"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 47,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "All nodes distance K in binary tree using parent pointer mapping",
    "objectives": "Master All nodes distance K in binary tree using parent pointer mapping with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "nodes",
      "distance",
      "binary",
      "tree",
      "parent",
      "pointer",
      "mapping"
    ],
    "suggestedProblemIds": [
      "prob-225-recover-binary-search-tree",
      "prob-348-count-total-nodes-in-a-complete-binary-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 48,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Minimum time taken to burn the binary tree from a given node",
    "objectives": "Master Minimum time taken to burn the binary tree from a given node with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "minimum",
      "time",
      "taken",
      "burn",
      "binary",
      "tree",
      "given",
      "node"
    ],
    "suggestedProblemIds": [
      "prob-347-minimum-time-taken-to-burn-binary-tree-from-a-node",
      "prob-200-same-tree"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 49,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Construct binary tree from preorder and inorder traversal arrays",
    "objectives": "Master Construct binary tree from preorder and inorder traversal arrays with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "construct",
      "binary",
      "tree",
      "preorder",
      "inorder",
      "traversal",
      "arrays"
    ],
    "suggestedProblemIds": [
      "prob-211-construct-tree-from-preorder-and-inorder",
      "prob-404-preorder-inorder-and-postorder-in-one-traversal"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 50,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Construct binary tree from postorder and inorder traversal arrays",
    "objectives": "Master Construct binary tree from postorder and inorder traversal arrays with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "construct",
      "binary",
      "tree",
      "postorder",
      "inorder",
      "traversal",
      "arrays"
    ],
    "suggestedProblemIds": [
      "prob-407-construct-binary-tree-from-inorder-and-postorder",
      "prob-219-kth-smallest-element-in-a-bst"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 51,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Serialize and deserialize binary tree (Level order and DFS string encoding)",
    "objectives": "Master Serialize and deserialize binary tree (Level order and DFS string encoding) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "serialize",
      "deserialize",
      "binary",
      "tree",
      "level",
      "order",
      "string",
      "encoding"
    ],
    "suggestedProblemIds": [
      "prob-213-serialize-and-deserialize-binary-tree",
      "prob-218-delete-a-node-in-bst"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 52,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Flatten binary tree to linked list (Morris traversal and reverse postorder)",
    "objectives": "Master Flatten binary tree to linked list (Morris traversal and reverse postorder) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "flatten",
      "binary",
      "tree",
      "linked",
      "list",
      "morris",
      "traversal",
      "reverse",
      "postorder"
    ],
    "suggestedProblemIds": [
      "prob-214-flatten-binary-tree-to-linked-list",
      "prob-216-ceil-floor-in-a-bst"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 53,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "Introduction to Binary Search Trees: BST properties, search and min/max",
    "objectives": "Master Introduction to Binary Search Trees: BST properties, search and min/max with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "introduction",
      "binary",
      "search",
      "trees",
      "properties",
      "search"
    ],
    "suggestedProblemIds": [
      "prob-408-introduction-to-binary-search-trees",
      "prob-410-inorder-predecessor-and-successor-in-bst"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 54,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "BST operations: Insert node, delete node and BST validation invariants",
    "objectives": "Master BST operations: Insert node, delete node and BST validation invariants with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "operations",
      "insert",
      "node",
      "delete",
      "node",
      "validation",
      "invariants"
    ],
    "suggestedProblemIds": [
      "prob-217-insert-a-given-node-in-bst",
      "prob-409-find-min-max-in-bst"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 55,
    "phase": "Phase 2: Binary Trees & BST",
    "topic": "Binary Trees & BST",
    "subtopic": "BST advanced: Kth smallest/largest, LCA in BST, two sum in BST and recover BST",
    "objectives": "Master BST advanced: Kth smallest/largest, LCA in BST, two sum in BST and recover BST with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "advanced",
      "smallest",
      "largest",
      "recover"
    ],
    "suggestedProblemIds": [
      "prob-349-inorder-successor-and-predecessor-in-bst"
    ],
    "targetCount": 1,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 56,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "DP fundamentals, overlapping subproblems and optimal substructure",
    "objectives": "Master DP fundamentals, overlapping subproblems and optimal substructure with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "overlapping",
      "subproblems",
      "optimal",
      "substructure"
    ],
    "suggestedProblemIds": [
      "prob-358-maximum-profit-in-job-scheduling",
      "prob-255-frog-jump-geek-jump"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 57,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Memoization (Top-down) vs Tabulation (Bottom-up) and state definition",
    "objectives": "Master Memoization (Top-down) vs Tabulation (Bottom-up) and state definition with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "memoization",
      "down",
      "tabulation",
      "bottom",
      "state",
      "definition"
    ],
    "suggestedProblemIds": [
      "prob-285-best-time-to-buy-and-sell-stock-with-cooldown",
      "prob-262-triangle-minimum-path-sum"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 58,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "1D DP: Fibonacci, Climbing Stairs and Frog Jump with K distance",
    "objectives": "Master 1D DP: Fibonacci, Climbing Stairs and Frog Jump with K distance with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "fibonacci",
      "climbing",
      "stairs",
      "frog",
      "jump",
      "distance"
    ],
    "suggestedProblemIds": [
      "prob-254-climbing-stairs",
      "prob-356-frog-jump-with-k-distance"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 59,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "1D DP: House Robber I & II and maximum non-adjacent sum",
    "objectives": "Master 1D DP: House Robber I & II and maximum non-adjacent sum with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "house",
      "robber",
      "maximum",
      "adjacent"
    ],
    "suggestedProblemIds": [
      "prob-256-house-robber",
      "prob-257-house-robber-ii-circular"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 60,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "1D DP: Ninja's Training and multi-activity daily transitions",
    "objectives": "Master 1D DP: Ninja's Training and multi-activity daily transitions with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "ninja",
      "training",
      "multi",
      "activity",
      "daily",
      "transitions"
    ],
    "suggestedProblemIds": [
      "prob-258-ninja-s-training-2d-activity-dp",
      "prob-414-ninja-s-training"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 61,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "2D Grid DP: Unique Paths I & II with obstacles and boundary conditions",
    "objectives": "Master 2D Grid DP: Unique Paths I & II with obstacles and boundary conditions with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "grid",
      "unique",
      "paths",
      "obstacles",
      "boundary",
      "conditions"
    ],
    "suggestedProblemIds": [
      "prob-260-unique-paths-ii-with-obstacles",
      "prob-282-best-time-to-buy-and-sell-stock-ii-infinite-transactions"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 62,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "2D Grid DP: Minimum Path Sum and Triangle minimum path total",
    "objectives": "Master 2D Grid DP: Minimum Path Sum and Triangle minimum path total with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "grid",
      "minimum",
      "path",
      "triangle",
      "minimum",
      "path",
      "total"
    ],
    "suggestedProblemIds": [
      "prob-261-minimum-path-sum-in-grid",
      "prob-422-minimum-cost-to-cut-a-stick"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 63,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "2D Grid DP: Maximum falling path sum and variable start/end points",
    "objectives": "Master 2D Grid DP: Maximum falling path sum and variable start/end points with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "grid",
      "maximum",
      "falling",
      "path",
      "variable",
      "start",
      "points"
    ],
    "suggestedProblemIds": [
      "prob-263-minimum-falling-path-sum",
      "prob-297-partition-array-for-maximum-sum"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 64,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "3D Grid DP: Chocolate Pickup (Alice and Bob 3D state transitions)",
    "objectives": "Master 3D Grid DP: Chocolate Pickup (Alice and Bob 3D state transitions) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "grid",
      "chocolate",
      "pickup",
      "alice",
      "state",
      "transitions"
    ],
    "suggestedProblemIds": [
      "prob-259-unique-paths-in-grid",
      "prob-264-cherry-pickup-ii-3d-dp"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 65,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Subsequence DP: Subset Sum equals target K (Decision space analysis)",
    "objectives": "Master Subsequence DP: Subset Sum equals target K (Decision space analysis) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "subsequence",
      "subset",
      "equals",
      "target",
      "decision",
      "space",
      "analysis"
    ],
    "suggestedProblemIds": [
      "prob-265-subset-sum-problem",
      "prob-268-count-subsets-with-sum-k"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 66,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Subsequence DP: Partition Equal Subset Sum and Boolean DP table",
    "objectives": "Master Subsequence DP: Partition Equal Subset Sum and Boolean DP table with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "subsequence",
      "partition",
      "equal",
      "subset",
      "boolean",
      "table"
    ],
    "suggestedProblemIds": [
      "prob-266-partition-equal-subset-sum",
      "prob-267-partition-array-into-two-arrays-to-minimize-sum-difference"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 67,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Subsequence DP: Minimum sum partition difference into two subsets",
    "objectives": "Master Subsequence DP: Minimum sum partition difference into two subsets with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "subsequence",
      "minimum",
      "partition",
      "difference",
      "into",
      "subsets"
    ],
    "suggestedProblemIds": [
      "prob-415-partition-set-into-2-subsets-with-min-absolute-sum-difference",
      "prob-423-palindrome-partitioning-ii-minimum-cuts"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 68,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Subsequence DP: Count subsets with sum K and partitions with given difference",
    "objectives": "Master Subsequence DP: Count subsets with sum K and partitions with given difference with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "subsequence",
      "count",
      "subsets",
      "partitions",
      "given",
      "difference"
    ],
    "suggestedProblemIds": [
      "prob-416-count-partitions-with-given-difference",
      "prob-275-print-longest-common-subsequence"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 69,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Subsequence DP: Target Sum problem (transformation to subset difference)",
    "objectives": "Master Subsequence DP: Target Sum problem (transformation to subset difference) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "subsequence",
      "target",
      "problem",
      "transformation",
      "subset",
      "difference"
    ],
    "suggestedProblemIds": [
      "prob-357-count-subsets-with-given-difference",
      "prob-270-target-sum"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 70,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Knapsack DP: 0/1 Knapsack problem (Weight vs Value recurrence)",
    "objectives": "Master Knapsack DP: 0/1 Knapsack problem (Weight vs Value recurrence) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "knapsack",
      "knapsack",
      "problem",
      "weight",
      "value",
      "recurrence"
    ],
    "suggestedProblemIds": [
      "prob-269-0-1-knapsack-problem",
      "prob-273-unbounded-knapsack-rod-cutting"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 71,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Knapsack DP: Unbounded Knapsack problem and Rod Cutting optimization",
    "objectives": "Master Knapsack DP: Unbounded Knapsack problem and Rod Cutting optimization with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "knapsack",
      "unbounded",
      "knapsack",
      "problem",
      "cutting",
      "optimization"
    ],
    "suggestedProblemIds": [
      "prob-418-rod-cutting-problem",
      "prob-417-unbounded-knapsack"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 72,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Knapsack DP: Coin Change I (Minimum coins to make target amount)",
    "objectives": "Master Knapsack DP: Coin Change I (Minimum coins to make target amount) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "knapsack",
      "coin",
      "change",
      "minimum",
      "coins",
      "make",
      "target",
      "amount"
    ],
    "suggestedProblemIds": [
      "prob-271-coin-change-minimum-coins",
      "prob-294-burst-balloons"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 73,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Knapsack DP: Coin Change II (Total distinct combinations/ways)",
    "objectives": "Master Knapsack DP: Coin Change II (Total distinct combinations/ways) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "knapsack",
      "coin",
      "change",
      "total",
      "distinct",
      "combinations",
      "ways"
    ],
    "suggestedProblemIds": [
      "prob-272-coin-change-ii-number-of-ways",
      "prob-295-evaluate-boolean-expression-to-true"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 74,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "LIS DP: Longest Increasing Subsequence O(N²) state definition",
    "objectives": "Master LIS DP: Longest Increasing Subsequence O(N²) state definition with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "longest",
      "increasing",
      "subsequence",
      "state",
      "definition"
    ],
    "suggestedProblemIds": [
      "prob-286-longest-increasing-subsequence-lis",
      "prob-276-longest-palindromic-subsequence"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 75,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "LIS DP: Printing the Longest Increasing Subsequence (Backtracking hash)",
    "objectives": "Master LIS DP: Printing the Longest Increasing Subsequence (Backtracking hash) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "printing",
      "longest",
      "increasing",
      "subsequence",
      "backtracking",
      "hash"
    ],
    "suggestedProblemIds": [
      "prob-287-print-longest-increasing-subsequence",
      "prob-289-longest-string-chain"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 76,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "LIS DP: Longest Increasing Subsequence O(N log N) using binary search",
    "objectives": "Master LIS DP: Longest Increasing Subsequence O(N log N) using binary search with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "longest",
      "increasing",
      "subsequence",
      "binary",
      "search"
    ],
    "suggestedProblemIds": [
      "prob-291-number-of-longest-increasing-subsequences",
      "prob-419-longest-common-substring"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 77,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "LIS DP: Largest Divisible Subset and Longest String Chain",
    "objectives": "Master LIS DP: Largest Divisible Subset and Longest String Chain with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "largest",
      "divisible",
      "subset",
      "longest",
      "string",
      "chain"
    ],
    "suggestedProblemIds": [
      "prob-288-largest-divisible-subset",
      "prob-292-matrix-chain-multiplication-mcm"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 78,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "LIS DP: Longest Bitonic Subsequence and Number of Longest Increasing Subsequences",
    "objectives": "Master LIS DP: Longest Bitonic Subsequence and Number of Longest Increasing Subsequences with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "longest",
      "bitonic",
      "subsequence",
      "number",
      "longest",
      "increasing",
      "subsequences"
    ],
    "suggestedProblemIds": [
      "prob-290-longest-bitonic-subsequence",
      "prob-283-best-time-to-buy-and-sell-stock-iii-at-most-2-transactions"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 79,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "String DP: Longest Common Subsequence (LCS) and printing LCS string",
    "objectives": "Master String DP: Longest Common Subsequence (LCS) and printing LCS string with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "string",
      "longest",
      "common",
      "subsequence",
      "printing",
      "string"
    ],
    "suggestedProblemIds": [
      "prob-274-longest-common-subsequence-lcs",
      "prob-293-cost-to-cut-a-stick"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 80,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "String DP: Longest Common Substring and Shortest Common Supersequence",
    "objectives": "Master String DP: Longest Common Substring and Shortest Common Supersequence with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "string",
      "longest",
      "common",
      "substring",
      "shortest",
      "common",
      "supersequence"
    ],
    "suggestedProblemIds": [
      "prob-278-shortest-common-supersequence",
      "prob-421-best-time-to-buy-and-sell-stock-with-transaction-fee"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 81,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "String DP: Minimum insertions/deletions to convert string A to string B",
    "objectives": "Master String DP: Minimum insertions/deletions to convert string A to string B with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "string",
      "minimum",
      "insertions",
      "deletions",
      "convert",
      "string",
      "string"
    ],
    "suggestedProblemIds": [
      "prob-420-minimum-insertions-deletions-to-convert-string-a-to-b",
      "prob-425-count-square-submatrices-with-all-ones"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 82,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "String DP: Longest Palindromic Subsequence and minimum insertions for palindrome",
    "objectives": "Master String DP: Longest Palindromic Subsequence and minimum insertions for palindrome with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "string",
      "longest",
      "palindromic",
      "subsequence",
      "minimum",
      "insertions",
      "palindrome"
    ],
    "suggestedProblemIds": [
      "prob-277-minimum-insertions-to-make-string-palindrome",
      "prob-296-palindrome-partitioning-ii-min-cuts"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 83,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "String DP: Distinct Subsequences (Count occurrences of string S2 in S1)",
    "objectives": "Master String DP: Distinct Subsequences (Count occurrences of string S2 in S1) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "string",
      "distinct",
      "subsequences",
      "count",
      "occurrences",
      "string"
    ],
    "suggestedProblemIds": [
      "prob-279-distinct-subsequences",
      "prob-284-best-time-to-buy-and-sell-stock-iv-at-most-k-transactions"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 84,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "String DP: Edit Distance (Levenshtein distance: Insert, Delete, Replace)",
    "objectives": "Master String DP: Edit Distance (Levenshtein distance: Insert, Delete, Replace) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "string",
      "edit",
      "distance",
      "levenshtein",
      "distance",
      "insert",
      "delete",
      "replace"
    ],
    "suggestedProblemIds": [
      "prob-280-edit-distance",
      "prob-413-frog-jump-with-k-distances"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 85,
    "phase": "Phase 3: Dynamic Programming",
    "topic": "Dynamic Programming",
    "subtopic": "Advanced DP: Wildcard Matching, Regular Expression Matching and Matrix Chain Multiplication",
    "objectives": "Master Advanced DP: Wildcard Matching, Regular Expression Matching and Matrix Chain Multiplication with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "advanced",
      "wildcard",
      "matching",
      "regular",
      "expression",
      "matching",
      "matrix",
      "chain",
      "multiplication"
    ],
    "suggestedProblemIds": [
      "prob-281-wildcard-matching",
      "prob-424-maximum-rectangle-area-with-all-1s-in-binary-matrix"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 86,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Recursion fundamentals, recursion tree visualization and base case discipline",
    "objectives": "Master Recursion fundamentals, recursion tree visualization and base case discipline with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "recursion",
      "recursion",
      "tree",
      "visualization",
      "base",
      "case",
      "discipline"
    ],
    "suggestedProblemIds": [
      "prob-470-letter-case-permutation",
      "prob-133-word-break-ii-print-all-sentences",
      "prob-384-generate-all-binary-strings-without-consecutive-1s"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 87,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Subsets and Power Set using include/exclude recursion",
    "objectives": "Master Subsets and Power Set using include/exclude recursion with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "subsets",
      "power",
      "include",
      "exclude",
      "recursion"
    ],
    "suggestedProblemIds": [
      "prob-121-subsets",
      "prob-385-count-subsequences-with-sum-k",
      "prob-386-expression-add-operators"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 88,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Subsets II: Handling duplicates with sorting and branch skipping",
    "objectives": "Master Subsets II: Handling duplicates with sorting and branch skipping with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "subsets",
      "handling",
      "duplicates",
      "sorting",
      "branch",
      "skipping"
    ],
    "suggestedProblemIds": [
      "prob-122-subsets-ii-with-duplicates",
      "prob-471-restore-ip-addresses"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 89,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Combination Sum I: Target reduction with element reuse",
    "objectives": "Master Combination Sum I: Target reduction with element reuse with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "combination",
      "target",
      "reduction",
      "element",
      "reuse"
    ],
    "suggestedProblemIds": [
      "prob-123-combination-sum",
      "prob-125-combination-sum-iii"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 90,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Combination Sum II: Target reduction with single-use and duplicate pruning",
    "objectives": "Master Combination Sum II: Target reduction with single-use and duplicate pruning with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "combination",
      "target",
      "reduction",
      "single",
      "duplicate",
      "pruning"
    ],
    "suggestedProblemIds": [
      "prob-124-combination-sum-ii-no-duplicates-1-use",
      "prob-472-word-break-ii-all-sentences"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 91,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Combination Sum III and Letter Combinations of a Phone Number",
    "objectives": "Master Combination Sum III and Letter Combinations of a Phone Number with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "combination",
      "letter",
      "combinations",
      "phone",
      "number"
    ],
    "suggestedProblemIds": [
      "prob-126-letter-combinations-of-a-phone-number",
      "prob-473-matchsticks-to-square"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 92,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Permutations I & II: State tracking, visited arrays and swapping",
    "objectives": "Master Permutations I & II: State tracking, visited arrays and swapping with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "permutations",
      "state",
      "tracking",
      "visited",
      "arrays",
      "swapping"
    ],
    "suggestedProblemIds": [
      "prob-474-partition-to-k-equal-sum-subsets",
      "prob-120-generate-parentheses"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 93,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "N-Queens problem: Chessboard constraints, column/diagonal bitmasking",
    "objectives": "Master N-Queens problem: Chessboard constraints, column/diagonal bitmasking with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "queens",
      "problem",
      "chessboard",
      "constraints",
      "column",
      "diagonal",
      "bitmasking"
    ],
    "suggestedProblemIds": [
      "prob-129-n-queens",
      "prob-131-m-coloring-problem"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 94,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Sudoku Solver: 9x9 grid constraints, subgrid hashing and recursive backtracking",
    "objectives": "Master Sudoku Solver: 9x9 grid constraints, subgrid hashing and recursive backtracking with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "sudoku",
      "solver",
      "grid",
      "constraints",
      "subgrid",
      "hashing",
      "recursive",
      "backtracking"
    ],
    "suggestedProblemIds": [
      "prob-130-sudoku-solver",
      "prob-132-rat-in-a-maze-problem"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 95,
    "phase": "Phase 4: Recursion & Backtracking",
    "topic": "Recursion & Backtracking",
    "subtopic": "Word Search & Palindrome Partitioning: 2D grid backtracking and pruning",
    "objectives": "Master Word Search & Palindrome Partitioning: 2D grid backtracking and pruning with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "word",
      "search",
      "palindrome",
      "partitioning",
      "grid",
      "backtracking",
      "pruning"
    ],
    "suggestedProblemIds": [
      "prob-128-word-search-in-2d-grid",
      "prob-127-palindrome-partitioning"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 96,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Greedy choice property, optimal substructure and exchange argument",
    "objectives": "Master Greedy choice property, optimal substructure and exchange argument with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "greedy",
      "choice",
      "property",
      "optimal",
      "substructure",
      "exchange",
      "argument"
    ],
    "suggestedProblemIds": [
      "prob-184-find-minimum-number-of-coins",
      "prob-191-jump-game",
      "prob-186-valid-parenthesis-string-with-wildcard"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 97,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Assign Cookies and Lemonade Change (Single-pass greedy decisions)",
    "objectives": "Master Assign Cookies and Lemonade Change (Single-pass greedy decisions) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "assign",
      "cookies",
      "lemonade",
      "change",
      "single",
      "pass",
      "greedy",
      "decisions"
    ],
    "suggestedProblemIds": [
      "prob-182-assign-cookies",
      "prob-185-lemonade-change"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 98,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Fractional Knapsack problem using value-to-weight ratio sorting",
    "objectives": "Master Fractional Knapsack problem using value-to-weight ratio sorting with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "fractional",
      "knapsack",
      "problem",
      "value",
      "weight",
      "ratio",
      "sorting"
    ],
    "suggestedProblemIds": [
      "prob-183-fractional-knapsack-problem",
      "prob-464-minimum-number-of-arrows-to-burst-balloons"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 99,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Minimum number of coins / greedy coin change property",
    "objectives": "Master Minimum number of coins / greedy coin change property with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "minimum",
      "number",
      "coins",
      "greedy",
      "coin",
      "change",
      "property"
    ],
    "suggestedProblemIds": [
      "prob-400-find-minimum-number-of-coins-greedy",
      "prob-466-minimum-deletions-to-make-character-frequencies-unique"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 100,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Interval scheduling: Activity Selection and N meetings in one room",
    "objectives": "Master Interval scheduling: Activity Selection and N meetings in one room with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "interval",
      "scheduling",
      "activity",
      "selection",
      "meetings",
      "room"
    ],
    "suggestedProblemIds": [
      "prob-187-n-meetings-in-one-room",
      "prob-467-maximum-length-of-pair-chain"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 101,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Interval scheduling: Minimum platforms required for trains at station",
    "objectives": "Master Interval scheduling: Minimum platforms required for trains at station with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "interval",
      "scheduling",
      "minimum",
      "platforms",
      "required",
      "trains",
      "station"
    ],
    "suggestedProblemIds": [
      "prob-188-minimum-platforms-required-for-railway",
      "prob-190-candy-distribute-minimum-candies"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 102,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Job Sequencing problem with deadlines and profit maximization",
    "objectives": "Master Job Sequencing problem with deadlines and profit maximization with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "sequencing",
      "problem",
      "deadlines",
      "profit",
      "maximization"
    ],
    "suggestedProblemIds": [
      "prob-189-job-sequencing-problem-with-deadlines",
      "prob-193-gas-station-circular-tour"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 103,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Interval operations: Insert Interval into sorted non-overlapping list",
    "objectives": "Master Interval operations: Insert Interval into sorted non-overlapping list with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "interval",
      "operations",
      "insert",
      "interval",
      "into",
      "sorted",
      "overlapping",
      "list"
    ],
    "suggestedProblemIds": [
      "prob-195-insert-interval",
      "prob-468-queue-reconstruction-by-height"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 104,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Interval operations: Merge Overlapping Intervals and Non-overlapping intervals",
    "objectives": "Master Interval operations: Merge Overlapping Intervals and Non-overlapping intervals with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "interval",
      "operations",
      "merge",
      "overlapping",
      "intervals",
      "overlapping",
      "intervals"
    ],
    "suggestedProblemIds": [
      "prob-194-non-overlapping-intervals",
      "prob-465-video-stitching"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 105,
    "phase": "Phase 4: Greedy & Intervals",
    "topic": "Greedy & Intervals",
    "subtopic": "Jump Game I & Jump Game II: Reachability and minimum jumps greedy",
    "objectives": "Master Jump Game I & Jump Game II: Reachability and minimum jumps greedy with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "jump",
      "game",
      "jump",
      "game",
      "reachability",
      "minimum",
      "jumps",
      "greedy"
    ],
    "suggestedProblemIds": [
      "prob-192-jump-game-ii-minimum-jumps",
      "prob-469-patching-array"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 106,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "Binary Heap representation: Array layout, parent/child indices and heapify",
    "objectives": "Master Binary Heap representation: Array layout, parent/child indices and heapify with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "binary",
      "heap",
      "representation",
      "array",
      "layout",
      "parent",
      "child",
      "indices",
      "heapify"
    ],
    "suggestedProblemIds": [
      "prob-172-kth-largest-element-in-an-array",
      "prob-396-check-if-an-array-represents-a-min-heap",
      "prob-458-last-stone-weight"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 107,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "Priority Queue operations: Push, pop, sift-up, sift-down and custom comparators",
    "objectives": "Master Priority Queue operations: Push, pop, sift-up, sift-down and custom comparators with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "priority",
      "queue",
      "operations",
      "push",
      "sift",
      "sift",
      "down",
      "custom",
      "comparators"
    ],
    "suggestedProblemIds": [
      "prob-174-sort-k-sorted-nearly-sorted-array",
      "prob-397-convert-min-heap-to-max-heap",
      "prob-460-find-k-pairs-with-smallest-sums"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 108,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "Top-K elements: Kth largest element in an array using min-heap",
    "objectives": "Master Top-K elements: Kth largest element in an array using min-heap with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "elements",
      "largest",
      "element",
      "array",
      "heap"
    ],
    "suggestedProblemIds": [
      "prob-173-kth-smallest-element-in-an-array",
      "prob-398-sort-a-k-sorted-array-nearly-sorted-array",
      "prob-463-minimum-number-of-refueling-stops"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 109,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "Kth smallest element in an array and Top K Frequent Elements",
    "objectives": "Master Kth smallest element in an array and Top K Frequent Elements with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "smallest",
      "element",
      "array",
      "frequent",
      "elements"
    ],
    "suggestedProblemIds": [
      "prob-176-top-k-frequent-elements",
      "prob-399-replace-each-array-element-by-its-corresponding-rank",
      "prob-462-seat-reservation-manager"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 110,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "K Closest Points to Origin and Sort Characters By Frequency",
    "objectives": "Master K Closest Points to Origin and Sort Characters By Frequency with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "closest",
      "points",
      "origin",
      "sort",
      "characters",
      "frequency"
    ],
    "suggestedProblemIds": [
      "prob-175-k-closest-points-to-origin",
      "prob-178-hands-of-straights",
      "prob-461-ipo-maximize-capital"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 111,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "Merge K Sorted Lists and Merge K Sorted Arrays using min-heap",
    "objectives": "Master Merge K Sorted Lists and Merge K Sorted Arrays using min-heap with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "merge",
      "sorted",
      "lists",
      "merge",
      "sorted",
      "arrays",
      "heap"
    ],
    "suggestedProblemIds": [
      "prob-180-merge-k-sorted-lists",
      "prob-179-design-twitter"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 112,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "Task Scheduler: CPU scheduling with cooldown and frequency heap",
    "objectives": "Master Task Scheduler: CPU scheduling with cooldown and frequency heap with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "task",
      "scheduler",
      "scheduling",
      "cooldown",
      "frequency",
      "heap"
    ],
    "suggestedProblemIds": [
      "prob-177-task-scheduler",
      "prob-459-reorganize-string"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 113,
    "phase": "Phase 4: Heap / Priority Queue",
    "topic": "Heap / Priority Queue",
    "subtopic": "Find Median from Data Stream using dual heaps (Max-heap + Min-heap)",
    "objectives": "Master Find Median from Data Stream using dual heaps (Max-heap + Min-heap) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "find",
      "median",
      "data",
      "stream",
      "dual",
      "heaps",
      "heap",
      "heap"
    ],
    "suggestedProblemIds": [
      "prob-181-find-median-from-data-stream",
      "prob-457-kth-largest-element-in-a-stream"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 114,
    "phase": "Phase 4: Interview Preparation",
    "topic": "Tries",
    "subtopic": "Trie node structure, Trie class, insert word, search word and startsWith prefix",
    "objectives": "Master Trie node structure, Trie class, insert word, search word and startsWith prefix with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "trie",
      "node",
      "structure",
      "trie",
      "class",
      "insert",
      "word",
      "search",
      "word",
      "startswith",
      "prefix"
    ],
    "suggestedProblemIds": [
      "prob-298-implement-trie-prefix-tree",
      "prob-427-longest-word-with-all-prefixes-complete-string",
      "prob-479-prefix-and-suffix-search"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 115,
    "phase": "Phase 4: Interview Preparation",
    "topic": "Tries",
    "subtopic": "Implement Trie II (Prefix tree with countWordsEqualTo and countWordsStartingWith)",
    "objectives": "Master Implement Trie II (Prefix tree with countWordsEqualTo and countWordsStartingWith) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "implement",
      "trie",
      "prefix",
      "tree",
      "countwordsequalto",
      "countwordsstartingwith"
    ],
    "suggestedProblemIds": [
      "prob-426-implement-trie-ii-prefix-tree-with-count",
      "prob-299-implement-trie-ii-prefix-with-counts",
      "prob-476-replace-words-prefix-root-replacement"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 116,
    "phase": "Phase 4: Interview Preparation",
    "topic": "Tries",
    "subtopic": "Complete String: Longest string with all prefixes present in array",
    "objectives": "Master Complete String: Longest string with all prefixes present in array with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "complete",
      "string",
      "longest",
      "string",
      "prefixes",
      "present",
      "array"
    ],
    "suggestedProblemIds": [
      "prob-300-complete-string-longest-string-with-all-prefixes",
      "prob-428-number-of-distinct-substrings-in-a-string",
      "prob-477-concatenated-words"
    ],
    "targetCount": 3,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 117,
    "phase": "Phase 4: Interview Preparation",
    "topic": "Tries",
    "subtopic": "Count Distinct Substrings in a string using Trie",
    "objectives": "Master Count Distinct Substrings in a string using Trie with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "count",
      "distinct",
      "substrings",
      "string",
      "trie"
    ],
    "suggestedProblemIds": [
      "prob-301-count-distinct-substrings",
      "prob-303-word-search-ii-boggle-with-trie"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 118,
    "phase": "Phase 4: Interview Preparation",
    "topic": "Tries",
    "subtopic": "Bitwise Trie: Maximum XOR of two numbers in an array",
    "objectives": "Master Bitwise Trie: Maximum XOR of two numbers in an array with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "bitwise",
      "trie",
      "maximum",
      "numbers",
      "array"
    ],
    "suggestedProblemIds": [
      "prob-304-maximum-xor-of-two-numbers-in-array",
      "prob-429-maximum-xor-with-an-element-from-array-offline-queries"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 119,
    "phase": "Phase 4: Interview Preparation",
    "topic": "Tries",
    "subtopic": "Bitwise Trie: Maximum XOR with an element from array (Offline queries)",
    "objectives": "Master Bitwise Trie: Maximum XOR with an element from array (Offline queries) with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "bitwise",
      "trie",
      "maximum",
      "element",
      "array",
      "offline",
      "queries"
    ],
    "suggestedProblemIds": [
      "prob-305-maximum-xor-with-an-element-from-array",
      "prob-475-design-add-and-search-words-data-structure"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  },
  {
    "dayNumber": 120,
    "phase": "Phase 4: Interview Preparation",
    "topic": "Tries",
    "subtopic": "Word Search II: Advanced Trie integration with 2D grid backtracking and final assessment",
    "objectives": "Master Word Search II: Advanced Trie integration with 2D grid backtracking and final assessment with pattern identification, complexity tradeoffs, and edge case coverage.",
    "keywords": [
      "word",
      "search",
      "advanced",
      "trie",
      "integration",
      "grid",
      "backtracking",
      "final",
      "assessment"
    ],
    "suggestedProblemIds": [
      "prob-302-design-add-and-search-words",
      "prob-478-stream-of-characters"
    ],
    "targetCount": 2,
    "estimatedMinutes": 60
  }
];

  const EXACT_STREAM_B_120 = [
  {
    "dayNumber": 1,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Maths fundamentals, complexity basics, divisibility, GCD/LCM and Euclidean algorithm",
    "objectives": "Rapid foundation recall: Maths fundamentals, complexity basics, divisibility, GCD/LCM and Euclidean algorithm. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "maths",
      "complexity",
      "divisibility",
      "euclidean",
      "algorithm"
    ],
    "suggestedProblemIds": [
      "prob-4-gcd-or-hcf-euclidean-algorithm",
      "prob-8-print-1-to-n-without-loop-recursion",
      "prob-14-count-frequency-of-array-elements",
      "prob-15-find-highest-and-lowest-frequency-elements",
      "prob-306-pattern-1-rectangular-star-pattern"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 2,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Count digits, reverse number and palindrome number check",
    "objectives": "Rapid foundation recall: Count digits, reverse number and palindrome number check. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "count",
      "digits",
      "reverse",
      "number",
      "palindrome",
      "number",
      "check"
    ],
    "suggestedProblemIds": [
      "prob-3-check-palindrome-number",
      "prob-318-pattern-13-increasing-number-triangle",
      "prob-12-check-if-a-string-is-palindrome",
      "prob-309-pattern-4-right-angled-number-pyramid-ii",
      "prob-11-reverse-an-array"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 3,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Prime numbers, Sieve of Eratosthenes and prime factorisation",
    "objectives": "Rapid foundation recall: Prime numbers, Sieve of Eratosthenes and prime factorisation. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "prime",
      "numbers",
      "sieve",
      "eratosthenes",
      "prime",
      "factorisation"
    ],
    "suggestedProblemIds": [
      "prob-7-check-for-prime",
      "prob-308-pattern-3-right-angled-number-pyramid",
      "prob-317-pattern-12-number-crown-pattern",
      "prob-307-pattern-2-right-angled-triangle-pattern"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 4,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Modulo arithmetic rules and fast exponentiation (Binary Exponentiation)",
    "objectives": "Rapid foundation recall: Modulo arithmetic rules and fast exponentiation (Binary Exponentiation). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "modulo",
      "arithmetic",
      "rules",
      "fast",
      "exponentiation",
      "binary",
      "exponentiation"
    ],
    "suggestedProblemIds": [
      "prob-2-reverse-a-number",
      "prob-316-pattern-11-binary-number-triangle-pattern",
      "prob-310-pattern-5-inverted-right-pyramid",
      "prob-314-pattern-9-diamond-star-pattern"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 5,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Divisors, perfect numbers and Armstrong numbers",
    "objectives": "Rapid foundation recall: Divisors, perfect numbers and Armstrong numbers. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "divisors",
      "perfect",
      "numbers",
      "armstrong",
      "numbers"
    ],
    "suggestedProblemIds": [
      "prob-5-armstrong-numbers",
      "prob-311-pattern-6-inverted-numbered-right-pyramid",
      "prob-319-pattern-14-increasing-letter-triangle",
      "prob-320-pattern-15-reverse-letter-triangle"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 6,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Factorials, trailing zeroes in factorial and combination mathematics",
    "objectives": "Rapid foundation recall: Factorials, trailing zeroes in factorial and combination mathematics. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "factorials",
      "trailing",
      "zeroes",
      "factorial",
      "combination",
      "mathematics"
    ],
    "suggestedProblemIds": [
      "prob-10-factorial-of-n-numbers",
      "prob-321-pattern-16-alpha-ramp-pattern",
      "prob-322-pattern-17-alpha-pyramid-pattern",
      "prob-323-pattern-18-alpha-triangle-pattern"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 7,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Bitwise math basics, odd/even checks and power of two",
    "objectives": "Rapid foundation recall: Bitwise math basics, odd/even checks and power of two. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "bitwise",
      "math",
      "even",
      "checks",
      "power"
    ],
    "suggestedProblemIds": [
      "prob-9-sum-of-first-n-numbers",
      "prob-312-pattern-7-star-pyramid",
      "prob-313-pattern-8-inverted-star-pyramid",
      "prob-315-pattern-10-half-diamond-star-pattern"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 8,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Euclidean GCD algorithms and basic number theory",
    "objectives": "Rapid foundation recall: Euclidean GCD algorithms and basic number theory. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "euclidean",
      "algorithms",
      "basic",
      "number",
      "theory"
    ],
    "suggestedProblemIds": [
      "prob-1-count-digits",
      "prob-6-print-all-divisors-of-a-given-number",
      "prob-13-fibonacci-number",
      "prob-327-pattern-22-the-number-pattern-matrix"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 9,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Maths complexity analysis, recurrence relations and big-O notation",
    "objectives": "Rapid foundation recall: Maths complexity analysis, recurrence relations and big-O notation. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "maths",
      "complexity",
      "analysis",
      "recurrence",
      "relations",
      "notation"
    ],
    "suggestedProblemIds": [
      "prob-324-pattern-19-symmetric-void-pattern",
      "prob-325-pattern-20-symmetric-butterfly-pattern",
      "prob-326-pattern-21-hollow-rectangle-pattern",
      "prob-363-user-input-output-data-types"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 10,
    "phase": "Days 1–30: Foundations",
    "topic": "Basics & Math",
    "subtopic": "Maths and foundation problem-solving review",
    "objectives": "Rapid foundation recall: Maths and foundation problem-solving review. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "maths",
      "foundation",
      "problem",
      "solving",
      "review"
    ],
    "suggestedProblemIds": [
      "prob-364-if-else-statements",
      "prob-365-switch-case-statements",
      "prob-366-pass-by-reference-and-pass-by-value",
      "prob-367-while-loops-for-loops-syntax"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 11,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Array traversal, insertion, deletion and linear search",
    "objectives": "Rapid foundation recall: Array traversal, insertion, deletion and linear search. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "array",
      "traversal",
      "insertion",
      "deletion",
      "linear",
      "search"
    ],
    "suggestedProblemIds": [
      "prob-21-largest-element-in-an-array",
      "prob-27-linear-search",
      "prob-46-spiral-matrix"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 12,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Find largest, second largest element and check if array is sorted",
    "objectives": "Rapid foundation recall: Find largest, second largest element and check if array is sorted. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "largest",
      "second",
      "largest",
      "element",
      "check",
      "array",
      "sorted"
    ],
    "suggestedProblemIds": [
      "prob-22-second-largest-and-second-smallest",
      "prob-23-check-if-array-is-sorted-and-rotated",
      "prob-52-largest-subarray-with-0-sum"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 13,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Remove duplicates from sorted array and left rotate array by one/D places",
    "objectives": "Rapid foundation recall: Remove duplicates from sorted array and left rotate array by one/D places. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "remove",
      "duplicates",
      "sorted",
      "array",
      "left",
      "rotate",
      "array",
      "places"
    ],
    "suggestedProblemIds": [
      "prob-24-remove-duplicates-from-sorted-array",
      "prob-25-rotate-array-by-k-elements-left-right",
      "prob-370-left-rotate-an-array-by-one"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 14,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Move zeroes to end and linear search in array",
    "objectives": "Rapid foundation recall: Move zeroes to end and linear search in array. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "move",
      "zeroes",
      "linear",
      "search",
      "array"
    ],
    "suggestedProblemIds": [
      "prob-26-move-zeroes-to-end",
      "prob-38-print-maximum-subarray-sum-subarray",
      "prob-44-set-matrix-zeroes"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 15,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Find union and intersection of two sorted arrays",
    "objectives": "Rapid foundation recall: Find union and intersection of two sorted arrays. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "union",
      "intersection",
      "sorted",
      "arrays"
    ],
    "suggestedProblemIds": [
      "prob-28-union-of-two-sorted-arrays",
      "prob-55-merge-two-sorted-arrays-in-o-1-space",
      "prob-369-find-highest-lowest-frequency-element"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 16,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Find missing number in an array and count maximum consecutive ones",
    "objectives": "Rapid foundation recall: Find missing number in an array and count maximum consecutive ones. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "missing",
      "number",
      "array",
      "count",
      "maximum",
      "consecutive",
      "ones"
    ],
    "suggestedProblemIds": [
      "prob-29-find-missing-number",
      "prob-30-max-consecutive-ones",
      "prob-47-count-subarray-sum-equals-k"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 17,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Find single number that appears once while other numbers appear twice",
    "objectives": "Rapid foundation recall: Find single number that appears once while other numbers appear twice. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "single",
      "number",
      "that",
      "appears",
      "once",
      "while",
      "other",
      "numbers",
      "appear",
      "twice"
    ],
    "suggestedProblemIds": [
      "prob-31-single-number-find-element-appearing-once",
      "prob-56-find-the-missing-and-repeating-number",
      "prob-34-two-sum"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 18,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Longest subarray with given sum K (Positives and Negatives using HashMap)",
    "objectives": "Rapid foundation recall: Longest subarray with given sum K (Positives and Negatives using HashMap). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "longest",
      "subarray",
      "given",
      "positives",
      "negatives",
      "hashmap"
    ],
    "suggestedProblemIds": [
      "prob-33-longest-subarray-with-sum-k-positives-negatives",
      "prob-53-count-subarrays-with-given-xor-k",
      "prob-39-best-time-to-buy-and-sell-stock"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 19,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Two Sum problem: Brute force, HashMap and Two Pointers",
    "objectives": "Rapid foundation recall: Two Sum problem: Brute force, HashMap and Two Pointers. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "problem",
      "brute",
      "force",
      "hashmap",
      "pointers"
    ],
    "suggestedProblemIds": [
      "prob-32-longest-subarray-with-sum-k-positives",
      "prob-45-rotate-image-matrix-by-90-degrees",
      "prob-58-reverse-pairs"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 20,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Sort array of 0s, 1s and 2s (Dutch National Flag Algorithm)",
    "objectives": "Rapid foundation recall: Sort array of 0s, 1s and 2s (Dutch National Flag Algorithm). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "sort",
      "array",
      "dutch",
      "national",
      "flag",
      "algorithm"
    ],
    "suggestedProblemIds": [
      "prob-35-sort-colors-0s-1s-2s",
      "prob-57-count-inversions-in-an-array",
      "prob-54-merge-overlapping-intervals"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 21,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Majority Element (More than N/2 times using Boyer-Moore Voting Algorithm)",
    "objectives": "Rapid foundation recall: Majority Element (More than N/2 times using Boyer-Moore Voting Algorithm). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "majority",
      "element",
      "more",
      "than",
      "times",
      "boyer",
      "moore",
      "voting",
      "algorithm"
    ],
    "suggestedProblemIds": [
      "prob-36-majority-element-n-2",
      "prob-49-majority-element-ii-n-3",
      "prob-48-pascal-s-triangle"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 22,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Kadane's Algorithm for Maximum Subarray Sum",
    "objectives": "Rapid foundation recall: Kadane's Algorithm for Maximum Subarray Sum. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "kadane",
      "algorithm",
      "maximum",
      "subarray"
    ],
    "suggestedProblemIds": [
      "prob-37-maximum-subarray-kadane-s-algorithm",
      "prob-59-maximum-product-subarray",
      "prob-368-count-frequency-of-elements-in-array"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 23,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Rearrange array elements by sign and find next permutation",
    "objectives": "Rapid foundation recall: Rearrange array elements by sign and find next permutation. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "rearrange",
      "array",
      "elements",
      "sign",
      "find",
      "next",
      "permutation"
    ],
    "suggestedProblemIds": [
      "prob-40-rearrange-array-elements-by-sign",
      "prob-41-next-permutation"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 24,
    "phase": "Days 1–30: Foundations",
    "topic": "Arrays & Hashing",
    "subtopic": "Leaders in an array, longest consecutive sequence and set matrix zeroes",
    "objectives": "Rapid foundation recall: Leaders in an array, longest consecutive sequence and set matrix zeroes. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "leaders",
      "array",
      "longest",
      "consecutive",
      "sequence",
      "matrix",
      "zeroes"
    ],
    "suggestedProblemIds": [
      "prob-43-longest-consecutive-sequence",
      "prob-42-leaders-in-an-array"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 25,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "String basics: Immutability, char arrays and ASCII manipulation",
    "objectives": "Rapid foundation recall: String basics: Immutability, char arrays and ASCII manipulation. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "string",
      "immutability",
      "char",
      "arrays",
      "ascii",
      "manipulation"
    ],
    "suggestedProblemIds": [
      "prob-90-longest-common-prefix",
      "prob-88-reverse-words-in-a-string",
      "prob-359-shortest-palindrome-kmp-prefix-table"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 26,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Remove outermost parentheses and reverse words in a string",
    "objectives": "Rapid foundation recall: Remove outermost parentheses and reverse words in a string. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "remove",
      "outermost",
      "parentheses",
      "reverse",
      "words",
      "string"
    ],
    "suggestedProblemIds": [
      "prob-87-remove-outermost-parentheses",
      "prob-92-rotate-string-check-if-a-is-rotation-of-b",
      "prob-432-rabin-karp-algorithm-for-pattern-searching"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 27,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Largest odd number in string and longest common prefix",
    "objectives": "Rapid foundation recall: Largest odd number in string and longest common prefix. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "largest",
      "number",
      "string",
      "longest",
      "common",
      "prefix"
    ],
    "suggestedProblemIds": [
      "prob-89-largest-odd-number-in-string",
      "prob-430-shortest-palindrome-kmp-lps",
      "prob-431-longest-happy-prefix"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 28,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Isomorphic strings and check whether one string is a rotation of another",
    "objectives": "Rapid foundation recall: Isomorphic strings and check whether one string is a rotation of another. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "isomorphic",
      "strings",
      "check",
      "whether",
      "string",
      "rotation",
      "another"
    ],
    "suggestedProblemIds": [
      "prob-91-isomorphic-strings",
      "prob-375-sum-of-beauty-of-all-substrings"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 29,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Valid Anagram check using character frequency count",
    "objectives": "Rapid foundation recall: Valid Anagram check using character frequency count. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "valid",
      "anagram",
      "check",
      "character",
      "frequency",
      "count"
    ],
    "suggestedProblemIds": [
      "prob-93-sort-characters-by-frequency",
      "prob-100-minimum-add-to-make-parentheses-valid"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 30,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Sort characters by frequency and maximum nesting depth of parentheses",
    "objectives": "Rapid foundation recall: Sort characters by frequency and maximum nesting depth of parentheses. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "sort",
      "characters",
      "frequency",
      "maximum",
      "nesting",
      "depth",
      "parentheses"
    ],
    "suggestedProblemIds": [
      "prob-94-maximum-nesting-depth-of-the-parentheses",
      "prob-433-minimum-characters-to-add-at-front-for-palindrome"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 31,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Roman number to integer and integer to Roman number conversion",
    "objectives": "Rapid foundation recall: Roman number to integer and integer to Roman number conversion. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "roman",
      "number",
      "integer",
      "integer",
      "roman",
      "number",
      "conversion"
    ],
    "suggestedProblemIds": [
      "prob-96-integer-to-roman",
      "prob-95-roman-to-integer"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 32,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "String to integer (atoi) implementation and edge case handling",
    "objectives": "Rapid foundation recall: String to integer (atoi) implementation and edge case handling. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "string",
      "integer",
      "atoi",
      "implementation",
      "edge",
      "case",
      "handling"
    ],
    "suggestedProblemIds": [
      "prob-97-string-to-integer-atoi",
      "prob-98-longest-palindromic-substring"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 33,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Count and say sequence and repeated substring pattern",
    "objectives": "Rapid foundation recall: Count and say sequence and repeated substring pattern. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "count",
      "sequence",
      "repeated",
      "substring",
      "pattern"
    ],
    "suggestedProblemIds": [
      "prob-99-count-number-of-substrings-with-k-distinct-chars",
      "prob-361-kmp-algorithm-for-pattern-searching"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 34,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Strings",
    "subtopic": "Strings foundation review and rapid pattern recall",
    "objectives": "Rapid foundation recall: Strings foundation review and rapid pattern recall. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "strings",
      "foundation",
      "review",
      "rapid",
      "pattern",
      "recall"
    ],
    "suggestedProblemIds": [
      "prob-360-rabin-karp-string-matching-algorithm",
      "prob-362-z-algorithm-for-pattern-searching"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 35,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Introduction to Two Pointers: Opposite-direction pointers on sorted arrays",
    "objectives": "Rapid foundation recall: Introduction to Two Pointers: Opposite-direction pointers on sorted arrays. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "introduction",
      "pointers",
      "opposite",
      "direction",
      "pointers",
      "sorted",
      "arrays"
    ],
    "suggestedProblemIds": [
      "prob-50-3sum",
      "prob-395-minimum-window-subsequence",
      "prob-167-count-number-of-nice-subarrays"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 36,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Container with most water and 3Sum problem (Opposite-ends approach)",
    "objectives": "Rapid foundation recall: Container with most water and 3Sum problem (Opposite-ends approach). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "container",
      "most",
      "water",
      "3sum",
      "problem",
      "opposite",
      "ends",
      "approach"
    ],
    "suggestedProblemIds": [
      "prob-440-container-with-most-water",
      "prob-163-max-consecutive-ones-iii",
      "prob-170-subarrays-with-k-different-integers"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 37,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "4Sum problem: Four pointers with duplicate skipping",
    "objectives": "Rapid foundation recall: 4Sum problem: Four pointers with duplicate skipping. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "4sum",
      "problem",
      "four",
      "pointers",
      "duplicate",
      "skipping"
    ],
    "suggestedProblemIds": [
      "prob-51-4sum",
      "prob-441-3sum-closest",
      "prob-442-4sum-ii"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 38,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Trapping Rain Water using two-pointer space-optimized approach",
    "objectives": "Rapid foundation recall: Trapping Rain Water using two-pointer space-optimized approach. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "trapping",
      "rain",
      "water",
      "pointer",
      "space",
      "optimized",
      "approach"
    ],
    "suggestedProblemIds": [
      "prob-152-trapping-rain-water",
      "prob-443-valid-palindrome-ii-at-most-1-deletion",
      "prob-448-maximum-erasure-value"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 39,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Introduction to Sliding Window: Fixed window vs Variable window",
    "objectives": "Rapid foundation recall: Introduction to Sliding Window: Fixed window vs Variable window. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "introduction",
      "sliding",
      "window",
      "fixed",
      "window",
      "variable",
      "window"
    ],
    "suggestedProblemIds": [
      "prob-445-permutation-in-string",
      "prob-446-find-all-anagrams-in-a-string",
      "prob-447-subarray-product-less-than-k"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 40,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Maximum sum subarray of size K (Fixed window template)",
    "objectives": "Rapid foundation recall: Maximum sum subarray of size K (Fixed window template). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "maximum",
      "subarray",
      "size",
      "fixed",
      "window",
      "template"
    ],
    "suggestedProblemIds": [
      "prob-169-maximum-points-you-can-obtain-from-cards",
      "prob-444-minimum-size-subarray-sum"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 41,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Longest substring without repeating characters (Variable window with Set/Map)",
    "objectives": "Rapid foundation recall: Longest substring without repeating characters (Variable window with Set/Map). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "longest",
      "substring",
      "without",
      "repeating",
      "characters",
      "variable",
      "window"
    ],
    "suggestedProblemIds": [
      "prob-162-longest-substring-without-repeating-characters",
      "prob-374-count-number-of-substrings-with-at-most-k-distinct-characters"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 42,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Max consecutive ones III (At most K flips) and fruit into baskets",
    "objectives": "Rapid foundation recall: Max consecutive ones III (At most K flips) and fruit into baskets. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "consecutive",
      "ones",
      "most",
      "flips",
      "fruit",
      "into",
      "baskets"
    ],
    "suggestedProblemIds": [
      "prob-164-fruit-into-baskets",
      "prob-166-binary-subarrays-with-sum"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 43,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Longest repeating character replacement (Frequency map with window size)",
    "objectives": "Rapid foundation recall: Longest repeating character replacement (Frequency map with window size). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "longest",
      "repeating",
      "character",
      "replacement",
      "frequency",
      "window",
      "size"
    ],
    "suggestedProblemIds": [
      "prob-165-longest-repeating-character-replacement",
      "prob-449-frequency-of-the-most-frequent-element"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 44,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sliding Window & Two Pointers",
    "subtopic": "Minimum window substring (Character counts deficit tracking)",
    "objectives": "Rapid foundation recall: Minimum window substring (Character counts deficit tracking). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "minimum",
      "window",
      "substring",
      "character",
      "counts",
      "deficit",
      "tracking"
    ],
    "suggestedProblemIds": [
      "prob-171-minimum-window-substring",
      "prob-168-number-of-substrings-containing-all-three-characters"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 45,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sorting",
    "subtopic": "Selection Sort: Minimum element selection and stability analysis",
    "objectives": "Rapid foundation recall: Selection Sort: Minimum element selection and stability analysis. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "selection",
      "sort",
      "minimum",
      "element",
      "selection",
      "stability",
      "analysis"
    ],
    "suggestedProblemIds": [
      "prob-16-selection-sort",
      "prob-329-recursive-insertion-sort",
      "prob-438-minimum-swaps-to-sort-an-array"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 46,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sorting",
    "subtopic": "Bubble Sort: Adjacent element swaps and early break optimization",
    "objectives": "Rapid foundation recall: Bubble Sort: Adjacent element swaps and early break optimization. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "bubble",
      "sort",
      "adjacent",
      "element",
      "swaps",
      "early",
      "break",
      "optimization"
    ],
    "suggestedProblemIds": [
      "prob-17-bubble-sort",
      "prob-328-recursive-bubble-sort"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 47,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sorting",
    "subtopic": "Insertion Sort: Shift-based insertion into sorted prefix",
    "objectives": "Rapid foundation recall: Insertion Sort: Shift-based insertion into sorted prefix. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "insertion",
      "sort",
      "shift",
      "based",
      "insertion",
      "into",
      "sorted",
      "prefix"
    ],
    "suggestedProblemIds": [
      "prob-18-insertion-sort",
      "prob-436-bucket-sort"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 48,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sorting",
    "subtopic": "Merge Sort: Divide, conquer and two-way merge subroutine",
    "objectives": "Rapid foundation recall: Merge Sort: Divide, conquer and two-way merge subroutine. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "merge",
      "sort",
      "divide",
      "conquer",
      "merge",
      "subroutine"
    ],
    "suggestedProblemIds": [
      "prob-19-merge-sort",
      "prob-435-radix-sort"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 49,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sorting",
    "subtopic": "Quick Sort: Lomuto vs Hoare partition schemes and pivot selection",
    "objectives": "Rapid foundation recall: Quick Sort: Lomuto vs Hoare partition schemes and pivot selection. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "quick",
      "sort",
      "lomuto",
      "hoare",
      "partition",
      "schemes",
      "pivot",
      "selection"
    ],
    "suggestedProblemIds": [
      "prob-20-quick-sort",
      "prob-437-wiggle-sort-ii"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 50,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Sorting",
    "subtopic": "Custom comparators and sorting stability in interview problems",
    "objectives": "Rapid foundation recall: Custom comparators and sorting stability in interview problems. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "custom",
      "comparators",
      "sorting",
      "stability",
      "interview",
      "problems"
    ],
    "suggestedProblemIds": [
      "prob-434-counting-sort",
      "prob-439-sort-array-by-parity-ii"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 51,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Binary search fundamentals: Search space, loop invariant and mid overflow",
    "objectives": "Rapid foundation recall: Binary search fundamentals: Search space, loop invariant and mid overflow. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "binary",
      "search",
      "search",
      "space",
      "loop",
      "invariant",
      "overflow"
    ],
    "suggestedProblemIds": [
      "prob-372-minimize-max-distance-to-gas-stations",
      "prob-60-binary-search-search-in-sorted-array",
      "prob-373-matrix-median-in-row-wise-sorted-matrix"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 52,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Lower Bound and Upper Bound implementations",
    "objectives": "Rapid foundation recall: Lower Bound and Upper Bound implementations. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "lower",
      "bound",
      "upper",
      "bound",
      "implementations"
    ],
    "suggestedProblemIds": [
      "prob-64-first-and-last-position-of-element-in-sorted-array",
      "prob-61-implement-lower-bound",
      "prob-86-matrix-median-row-wise-sorted-matrix"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 53,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Search insert position, floor and ceil in a sorted array",
    "objectives": "Rapid foundation recall: Search insert position, floor and ceil in a sorted array. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "search",
      "insert",
      "position",
      "floor",
      "ceil",
      "sorted",
      "array"
    ],
    "suggestedProblemIds": [
      "prob-371-floor-and-ceil-in-sorted-array",
      "prob-63-search-insert-position",
      "prob-83-search-a-2d-matrix"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 54,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "First and last occurrence of an element and count occurrences",
    "objectives": "Rapid foundation recall: First and last occurrence of an element and count occurrences. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "first",
      "last",
      "occurrence",
      "element",
      "count",
      "occurrences"
    ],
    "suggestedProblemIds": [
      "prob-65-count-occurrences-in-sorted-array",
      "prob-62-implement-upper-bound",
      "prob-76-capacity-to-ship-packages-within-d-days"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 55,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Search in rotated sorted array I (Unique elements)",
    "objectives": "Rapid foundation recall: Search in rotated sorted array I (Unique elements). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "search",
      "rotated",
      "sorted",
      "array",
      "unique",
      "elements"
    ],
    "suggestedProblemIds": [
      "prob-66-search-in-rotated-sorted-array",
      "prob-69-single-element-in-a-sorted-array",
      "prob-79-split-array-largest-sum"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 56,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Search in rotated sorted array II (Duplicates present)",
    "objectives": "Rapid foundation recall: Search in rotated sorted array II (Duplicates present). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "search",
      "rotated",
      "sorted",
      "array",
      "duplicates",
      "present"
    ],
    "suggestedProblemIds": [
      "prob-67-search-in-rotated-sorted-array-ii-with-duplicates",
      "prob-82-k-th-element-of-two-sorted-arrays",
      "prob-84-search-a-2d-matrix-ii"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 57,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Find minimum in rotated sorted array and single element in sorted array",
    "objectives": "Rapid foundation recall: Find minimum in rotated sorted array and single element in sorted array. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "minimum",
      "rotated",
      "sorted",
      "array",
      "single",
      "element",
      "sorted",
      "array"
    ],
    "suggestedProblemIds": [
      "prob-68-find-minimum-in-rotated-sorted-array",
      "prob-81-median-of-two-sorted-arrays",
      "prob-72-find-nth-root-of-integer-m"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 58,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Find peak element in array using binary search",
    "objectives": "Rapid foundation recall: Find peak element in array using binary search. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "peak",
      "element",
      "array",
      "binary",
      "search"
    ],
    "suggestedProblemIds": [
      "prob-70-find-peak-element",
      "prob-85-find-a-peak-element-ii-2d-peak",
      "prob-75-find-the-smallest-divisor-given-a-threshold"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 59,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Binary search on answer space: Square root and Koko eating bananas",
    "objectives": "Rapid foundation recall: Binary search on answer space: Square root and Koko eating bananas. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "binary",
      "search",
      "answer",
      "space",
      "square",
      "root",
      "koko",
      "eating",
      "bananas"
    ],
    "suggestedProblemIds": [
      "prob-71-square-root-of-an-integer",
      "prob-73-koko-eating-bananas",
      "prob-77-aggressive-cows"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 60,
    "phase": "Days 31–60: Foundations & Pointers",
    "topic": "Binary Search",
    "subtopic": "Binary search on answer space: Minimum days to make M bouquets and book allocation",
    "objectives": "Rapid foundation recall: Binary search on answer space: Minimum days to make M bouquets and book allocation. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "binary",
      "search",
      "answer",
      "space",
      "minimum",
      "days",
      "make",
      "bouquets",
      "book",
      "allocation"
    ],
    "suggestedProblemIds": [
      "prob-74-minimum-days-to-make-m-bouquets",
      "prob-78-book-allocation-problem",
      "prob-80-painter-s-partition-problem"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 61,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Singly Linked List: Node definition, insertion at head/tail and deletion",
    "objectives": "Rapid foundation recall: Singly Linked List: Node definition, insertion at head/tail and deletion. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "singly",
      "linked",
      "list",
      "node",
      "definition",
      "insertion",
      "head",
      "tail",
      "deletion"
    ],
    "suggestedProblemIds": [
      "prob-118-lru-cache",
      "prob-377-insert-node-at-beginning-end-of-linked-list",
      "prob-379-sort-a-linked-list-of-0s-1s-and-2s",
      "prob-115-rotate-list"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 62,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Doubly Linked List: Bidirectional pointers, insertion and deletion",
    "objectives": "Rapid foundation recall: Doubly Linked List: Bidirectional pointers, insertion and deletion. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "doubly",
      "linked",
      "list",
      "bidirectional",
      "pointers",
      "insertion",
      "deletion"
    ],
    "suggestedProblemIds": [
      "prob-331-insert-a-node-in-doubly-linked-list",
      "prob-333-reverse-a-doubly-linked-list",
      "prob-383-remove-duplicates-from-sorted-doubly-linked-list",
      "prob-111-sort-a-ll-of-0-s-1-s-and-2-s"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 63,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Reverse a singly linked list (Iterative with 3 pointers and Recursive)",
    "objectives": "Rapid foundation recall: Reverse a singly linked list (Iterative with 3 pointers and Recursive). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "reverse",
      "singly",
      "linked",
      "list",
      "iterative",
      "pointers",
      "recursive"
    ],
    "suggestedProblemIds": [
      "prob-116-flattening-of-a-linked-list",
      "prob-102-reverse-linked-list",
      "prob-117-copy-list-with-random-pointer",
      "prob-119-lfu-cache"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 64,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Middle of the linked list (Tortoise and Hare fast/slow pointer)",
    "objectives": "Rapid foundation recall: Middle of the linked list (Tortoise and Hare fast/slow pointer). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "middle",
      "linked",
      "list",
      "tortoise",
      "hare",
      "fast",
      "slow",
      "pointer"
    ],
    "suggestedProblemIds": [
      "prob-101-middle-of-the-linked-list",
      "prob-109-delete-middle-node-of-linked-list",
      "prob-108-remove-nth-node-from-end-of-list",
      "prob-334-delete-all-occurrences-of-a-key-in-dll"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 65,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Detect loop/cycle in linked list (Floyd's Cycle-Finding Algorithm)",
    "objectives": "Rapid foundation recall: Detect loop/cycle in linked list (Floyd's Cycle-Finding Algorithm). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "detect",
      "loop",
      "cycle",
      "linked",
      "list",
      "floyd",
      "cycle",
      "finding",
      "algorithm"
    ],
    "suggestedProblemIds": [
      "prob-103-linked-list-cycle-detection",
      "prob-104-linked-list-cycle-ii-find-start-of-cycle",
      "prob-330-introduction-to-doubly-linked-list"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 66,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Find starting point of loop in linked list and calculate length of loop",
    "objectives": "Rapid foundation recall: Find starting point of loop in linked list and calculate length of loop. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "starting",
      "point",
      "loop",
      "linked",
      "list",
      "calculate",
      "length",
      "loop"
    ],
    "suggestedProblemIds": [
      "prob-105-find-length-of-loop-in-linked-list",
      "prob-382-find-pairs-with-given-sum-in-doubly-linked-list",
      "prob-376-introduction-to-linked-list-traversal"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 67,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Check if a linked list is a palindrome (Find mid, reverse second half)",
    "objectives": "Rapid foundation recall: Check if a linked list is a palindrome (Find mid, reverse second half). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "check",
      "linked",
      "list",
      "palindrome",
      "find",
      "reverse",
      "second",
      "half"
    ],
    "suggestedProblemIds": [
      "prob-106-palindrome-linked-list",
      "prob-114-reverse-nodes-in-k-group",
      "prob-380-add-1-to-a-number-represented-as-linked-list"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 68,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Segregate odd and even indexed nodes and remove Nth node from end of list",
    "objectives": "Rapid foundation recall: Segregate odd and even indexed nodes and remove Nth node from end of list. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "segregate",
      "even",
      "indexed",
      "nodes",
      "remove",
      "node",
      "list"
    ],
    "suggestedProblemIds": [
      "prob-107-segregate-odd-and-even-nodes-in-ll",
      "prob-378-segregate-odd-and-even-nodes-in-linked-list",
      "prob-336-remove-duplicates-from-sorted-dll"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 69,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Delete middle node of linked list and intersection point of two lists",
    "objectives": "Rapid foundation recall: Delete middle node of linked list and intersection point of two lists. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "delete",
      "middle",
      "node",
      "linked",
      "list",
      "intersection",
      "point",
      "lists"
    ],
    "suggestedProblemIds": [
      "prob-112-intersection-point-of-two-linked-lists",
      "prob-332-delete-a-node-in-doubly-linked-list",
      "prob-381-delete-all-occurrences-of-a-key-in-doubly-linked-list"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 70,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Linked List",
    "subtopic": "Merge two sorted linked lists and add two numbers represented as lists",
    "objectives": "Rapid foundation recall: Merge two sorted linked lists and add two numbers represented as lists. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "merge",
      "sorted",
      "linked",
      "lists",
      "numbers",
      "represented",
      "lists"
    ],
    "suggestedProblemIds": [
      "prob-110-sort-linked-list-merge-sort-on-ll",
      "prob-113-add-two-numbers-represented-by-ll",
      "prob-335-find-pairs-with-given-sum-in-sorted-dll"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 71,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Stack implementation using array and linked list (LIFO principle)",
    "objectives": "Rapid foundation recall: Stack implementation using array and linked list (LIFO principle). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "stack",
      "implementation",
      "array",
      "linked",
      "list",
      "lifo",
      "principle"
    ],
    "suggestedProblemIds": [
      "prob-389-implement-stack-using-array",
      "prob-391-implement-stack-using-linked-list",
      "prob-161-the-celebrity-problem"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 72,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Queue implementation using array and linked list (FIFO principle)",
    "objectives": "Rapid foundation recall: Queue implementation using array and linked list (FIFO principle). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "queue",
      "implementation",
      "array",
      "linked",
      "list",
      "fifo",
      "principle"
    ],
    "suggestedProblemIds": [
      "prob-392-implement-queue-using-linked-list",
      "prob-390-implement-queue-using-array",
      "prob-158-maximal-rectangle-in-binary-matrix"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 73,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Implement stack using queues and implement queue using stacks",
    "objectives": "Rapid foundation recall: Implement stack using queues and implement queue using stacks. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "implement",
      "stack",
      "queues",
      "implement",
      "queue",
      "stacks"
    ],
    "suggestedProblemIds": [
      "prob-147-implement-queue-using-stacks",
      "prob-148-implement-stack-using-queues",
      "prob-337-infix-to-postfix-conversion-using-stack"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 74,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Check for balanced parentheses using stack",
    "objectives": "Rapid foundation recall: Check for balanced parentheses using stack. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "check",
      "balanced",
      "parentheses",
      "stack"
    ],
    "suggestedProblemIds": [
      "prob-145-valid-parentheses",
      "prob-151-next-smaller-element",
      "prob-338-prefix-to-infix-conversion"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 75,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Next Greater Element (NGE) using Monotonic Stack",
    "objectives": "Rapid foundation recall: Next Greater Element (NGE) using Monotonic Stack. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "next",
      "greater",
      "element",
      "monotonic",
      "stack"
    ],
    "suggestedProblemIds": [
      "prob-149-next-greater-element-i",
      "prob-394-number-of-nges-to-the-right",
      "prob-339-prefix-to-postfix-conversion"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 76,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Next Smaller Element and Previous Greater Element patterns",
    "objectives": "Rapid foundation recall: Next Smaller Element and Previous Greater Element patterns. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "next",
      "smaller",
      "element",
      "previous",
      "greater",
      "element"
    ],
    "suggestedProblemIds": [
      "prob-154-sum-of-subarray-minimums",
      "prob-341-postfix-to-infix-conversion",
      "prob-393-infix-to-prefix-conversion"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 77,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Trapping Rain Water using monotonic stack",
    "objectives": "Rapid foundation recall: Trapping Rain Water using monotonic stack. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "trapping",
      "rain",
      "water",
      "monotonic",
      "stack"
    ],
    "suggestedProblemIds": [
      "prob-150-next-greater-element-ii-circular",
      "prob-155-sum-of-subarray-ranges",
      "prob-340-postfix-to-prefix-conversion"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 78,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Largest Rectangle in Histogram using monotonic increasing stack",
    "objectives": "Rapid foundation recall: Largest Rectangle in Histogram using monotonic increasing stack. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "largest",
      "rectangle",
      "histogram",
      "monotonic",
      "increasing",
      "stack"
    ],
    "suggestedProblemIds": [
      "prob-157-largest-rectangle-in-histogram",
      "prob-156-remove-k-digits"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 79,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Sliding Window Maximum using monotonic deque",
    "objectives": "Rapid foundation recall: Sliding Window Maximum using monotonic deque. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "sliding",
      "window",
      "maximum",
      "monotonic",
      "deque"
    ],
    "suggestedProblemIds": [
      "prob-159-sliding-window-maximum",
      "prob-160-online-stock-span"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 80,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Stack & Queue",
    "subtopic": "Min Stack implementation (O(1) time and auxiliary space)",
    "objectives": "Rapid foundation recall: Min Stack implementation (O(1) time and auxiliary space). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "stack",
      "implementation",
      "time",
      "auxiliary",
      "space"
    ],
    "suggestedProblemIds": [
      "prob-146-min-stack",
      "prob-153-asteroid-collision"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 81,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Bit Manipulation",
    "subtopic": "Bitwise operators: AND, OR, XOR, NOT, Left Shift, Right Shift",
    "objectives": "Rapid foundation recall: Bitwise operators: AND, OR, XOR, NOT, Left Shift, Right Shift. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "bitwise",
      "operators",
      "left",
      "shift",
      "right",
      "shift"
    ],
    "suggestedProblemIds": [
      "prob-453-bitwise-and-of-numbers-range",
      "prob-138-counting-bits-0-to-n",
      "prob-139-divide-two-integers-without-or",
      "prob-452-sum-of-two-integers-without-plus-minus"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 82,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Bit Manipulation",
    "subtopic": "Check if Kth bit is set, set Kth bit, clear Kth bit and toggle Kth bit",
    "objectives": "Rapid foundation recall: Check if Kth bit is set, set Kth bit, clear Kth bit and toggle Kth bit. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "check",
      "clear",
      "toggle"
    ],
    "suggestedProblemIds": [
      "prob-134-check-if-the-i-th-bit-is-set-or-not",
      "prob-135-check-if-a-number-is-odd-or-not",
      "prob-387-introduction-to-bit-manipulation-get-set-clear-bit",
      "prob-455-maximum-product-of-word-lengths"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 83,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Bit Manipulation",
    "subtopic": "Check if number is odd/even, power of two and count set bits (Brian Kernighan)",
    "objectives": "Rapid foundation recall: Check if number is odd/even, power of two and count set bits (Brian Kernighan). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "check",
      "number",
      "even",
      "power",
      "count",
      "bits",
      "brian",
      "kernighan"
    ],
    "suggestedProblemIds": [
      "prob-137-count-number-of-set-bits-number-of-1-bits",
      "prob-140-minimum-bit-flips-to-convert-number",
      "prob-451-counting-bits"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 84,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Bit Manipulation",
    "subtopic": "Single number I (Every element appears twice except one using XOR)",
    "objectives": "Rapid foundation recall: Single number I (Every element appears twice except one using XOR). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "single",
      "number",
      "every",
      "element",
      "appears",
      "twice",
      "except"
    ],
    "suggestedProblemIds": [
      "prob-141-single-number-ii-every-element-appears-3-times",
      "prob-388-two-numbers-with-odd-occurrences",
      "prob-454-total-hamming-distance"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 85,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Bit Manipulation",
    "subtopic": "Single number II (Elements appear 3 times) and Single number III (Two unique elements)",
    "objectives": "Rapid foundation recall: Single number II (Elements appear 3 times) and Single number III (Two unique elements). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "single",
      "number",
      "elements",
      "appear",
      "times",
      "single",
      "number",
      "unique",
      "elements"
    ],
    "suggestedProblemIds": [
      "prob-142-single-number-iii-two-numbers-appearing-once",
      "prob-143-find-xor-of-numbers-from-l-to-r",
      "prob-450-reverse-bits"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 86,
    "phase": "Days 61–90: Linear Data Structures",
    "topic": "Bit Manipulation",
    "subtopic": "Power Set using bitmasking (Generate all 2^N subsets)",
    "objectives": "Rapid foundation recall: Power Set using bitmasking (Generate all 2^N subsets). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "power",
      "bitmasking",
      "generate",
      "subsets"
    ],
    "suggestedProblemIds": [
      "prob-136-check-if-a-number-is-power-of-2",
      "prob-144-power-set-using-bit-manipulation",
      "prob-456-gray-code"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 87,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Recursion basics: Base cases, call stack and Fibonacci sequence",
    "objectives": "Rapid foundation recall: Recursion basics: Base cases, call stack and Fibonacci sequence. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "recursion",
      "base",
      "cases",
      "call",
      "stack",
      "fibonacci",
      "sequence"
    ],
    "suggestedProblemIds": [
      "prob-385-count-subsequences-with-sum-k",
      "prob-133-word-break-ii-print-all-sentences",
      "prob-120-generate-parentheses"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 88,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Print 1 to N, N to 1 and sum of first N natural numbers recursively",
    "objectives": "Rapid foundation recall: Print 1 to N, N to 1 and sum of first N natural numbers recursively. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "print",
      "first",
      "natural",
      "numbers",
      "recursively"
    ],
    "suggestedProblemIds": [
      "prob-125-combination-sum-iii",
      "prob-128-word-search-in-2d-grid",
      "prob-129-n-queens"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 89,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Reverse an array recursively and check if string is palindrome recursively",
    "objectives": "Rapid foundation recall: Reverse an array recursively and check if string is palindrome recursively. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "reverse",
      "array",
      "recursively",
      "check",
      "string",
      "palindrome",
      "recursively"
    ],
    "suggestedProblemIds": [
      "prob-126-letter-combinations-of-a-phone-number",
      "prob-384-generate-all-binary-strings-without-consecutive-1s",
      "prob-471-restore-ip-addresses"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 90,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Subsequences of a string / array (Include/Exclude recursion tree)",
    "objectives": "Rapid foundation recall: Subsequences of a string / array (Include/Exclude recursion tree). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "subsequences",
      "string",
      "array",
      "include",
      "exclude",
      "recursion",
      "tree"
    ],
    "suggestedProblemIds": [
      "prob-121-subsets",
      "prob-470-letter-case-permutation",
      "prob-130-sudoku-solver"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 91,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Combination Sum I (Pick / Not Pick with repetition)",
    "objectives": "Rapid foundation recall: Combination Sum I (Pick / Not Pick with repetition). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "combination",
      "pick",
      "pick",
      "repetition"
    ],
    "suggestedProblemIds": [
      "prob-123-combination-sum",
      "prob-131-m-coloring-problem",
      "prob-386-expression-add-operators"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 92,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Combination Sum II (Unique combinations without element reuse)",
    "objectives": "Rapid foundation recall: Combination Sum II (Unique combinations without element reuse). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "combination",
      "unique",
      "combinations",
      "without",
      "element",
      "reuse"
    ],
    "suggestedProblemIds": [
      "prob-124-combination-sum-ii-no-duplicates-1-use",
      "prob-472-word-break-ii-all-sentences",
      "prob-473-matchsticks-to-square"
    ],
    "targetCount": 3,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 93,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Subset Sum I & II (Handling duplicates in subsets)",
    "objectives": "Rapid foundation recall: Subset Sum I & II (Handling duplicates in subsets). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "subset",
      "handling",
      "duplicates",
      "subsets"
    ],
    "suggestedProblemIds": [
      "prob-122-subsets-ii-with-duplicates",
      "prob-474-partition-to-k-equal-sum-subsets"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 94,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Recursion & Backtracking",
    "subtopic": "Permutations of an array/string (Swap vs Visited array)",
    "objectives": "Rapid foundation recall: Permutations of an array/string (Swap vs Visited array). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "permutations",
      "array",
      "string",
      "swap",
      "visited",
      "array"
    ],
    "suggestedProblemIds": [
      "prob-127-palindrome-partitioning",
      "prob-132-rat-in-a-maze-problem"
    ],
    "targetCount": 2,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 95,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Binary tree representation, DFS traversals (Inorder, Preorder, Postorder)",
    "objectives": "Rapid foundation recall: Binary tree representation, DFS traversals (Inorder, Preorder, Postorder). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "binary",
      "tree",
      "representation",
      "traversals",
      "inorder",
      "preorder",
      "postorder"
    ],
    "suggestedProblemIds": [
      "prob-407-construct-binary-tree-from-inorder-and-postorder",
      "prob-210-binary-tree-maximum-path-sum",
      "prob-211-construct-tree-from-preorder-and-inorder",
      "prob-212-construct-tree-from-postorder-and-inorder",
      "prob-350-largest-bst-in-binary-tree"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 96,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Level order traversal (BFS) using queue",
    "objectives": "Rapid foundation recall: Level order traversal (BFS) using queue. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "level",
      "order",
      "traversal",
      "queue"
    ],
    "suggestedProblemIds": [
      "prob-202-binary-tree-level-order-traversal",
      "prob-205-vertical-order-traversal-of-a-binary-tree",
      "prob-214-flatten-binary-tree-to-linked-list",
      "prob-219-kth-smallest-element-in-a-bst",
      "prob-401-iterative-preorder-traversal"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 97,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Maximum depth / height of binary tree and balanced tree check",
    "objectives": "Rapid foundation recall: Maximum depth / height of binary tree and balanced tree check. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "maximum",
      "depth",
      "height",
      "binary",
      "tree",
      "balanced",
      "tree",
      "check"
    ],
    "suggestedProblemIds": [
      "prob-197-maximum-depth-of-binary-tree",
      "prob-199-balanced-binary-tree",
      "prob-344-maximum-width-of-binary-tree",
      "prob-347-minimum-time-taken-to-burn-binary-tree-from-a-node",
      "prob-201-symmetric-tree"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 98,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Diameter of binary tree and check identical binary trees",
    "objectives": "Rapid foundation recall: Diameter of binary tree and check identical binary trees. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "diameter",
      "binary",
      "tree",
      "check",
      "identical",
      "binary",
      "trees"
    ],
    "suggestedProblemIds": [
      "prob-198-diameter-of-binary-tree",
      "prob-406-check-for-children-sum-property-in-binary-tree",
      "prob-196-invert-binary-tree",
      "prob-343-morris-preorder-traversal-of-binary-tree",
      "prob-200-same-tree"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 99,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Zigzag traversal and boundary traversal of binary tree",
    "objectives": "Rapid foundation recall: Zigzag traversal and boundary traversal of binary tree. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "zigzag",
      "traversal",
      "boundary",
      "traversal",
      "binary",
      "tree"
    ],
    "suggestedProblemIds": [
      "prob-203-binary-tree-zigzag-level-order-traversal",
      "prob-204-boundary-traversal-of-binary-tree",
      "prob-223-binary-search-tree-iterator",
      "prob-222-construct-bst-from-preorder-traversal",
      "prob-402-iterative-inorder-traversal"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 100,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Top view, bottom view, left view and right view of binary tree",
    "objectives": "Rapid foundation recall: Top view, bottom view, left view and right view of binary tree. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "view",
      "bottom",
      "view",
      "left",
      "view",
      "right",
      "view",
      "binary",
      "tree"
    ],
    "suggestedProblemIds": [
      "prob-208-binary-tree-right-side-view",
      "prob-207-bottom-view-of-binary-tree",
      "prob-206-top-view-of-binary-tree",
      "prob-345-children-sum-property-in-binary-tree",
      "prob-224-two-sum-iv-input-is-a-bst"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 101,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Lowest Common Ancestor (LCA) in binary tree",
    "objectives": "Rapid foundation recall: Lowest Common Ancestor (LCA) in binary tree. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "lowest",
      "common",
      "ancestor",
      "binary",
      "tree"
    ],
    "suggestedProblemIds": [
      "prob-209-lowest-common-ancestor-of-a-binary-tree",
      "prob-221-lowest-common-ancestor-of-a-bst",
      "prob-213-serialize-and-deserialize-binary-tree",
      "prob-346-all-nodes-distance-k-in-binary-tree",
      "prob-403-iterative-postorder-traversal-using-1-stack"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 102,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Introduction to BST: Search in BST and find Min/Max in BST",
    "objectives": "Rapid foundation recall: Introduction to BST: Search in BST and find Min/Max in BST. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "introduction",
      "search",
      "find"
    ],
    "suggestedProblemIds": [
      "prob-408-introduction-to-binary-search-trees",
      "prob-215-search-in-a-binary-search-tree",
      "prob-349-inorder-successor-and-predecessor-in-bst",
      "prob-409-find-min-max-in-bst",
      "prob-410-inorder-predecessor-and-successor-in-bst"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 103,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Floor and Ceil in BST and Insert node in BST",
    "objectives": "Rapid foundation recall: Floor and Ceil in BST and Insert node in BST. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "floor",
      "ceil",
      "insert",
      "node"
    ],
    "suggestedProblemIds": [
      "prob-216-ceil-floor-in-a-bst",
      "prob-217-insert-a-given-node-in-bst",
      "prob-218-delete-a-node-in-bst",
      "prob-348-count-total-nodes-in-a-complete-binary-tree",
      "prob-404-preorder-inorder-and-postorder-in-one-traversal"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 104,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Binary Trees & BST",
    "subtopic": "Delete node in BST and validate binary search tree",
    "objectives": "Rapid foundation recall: Delete node in BST and validate binary search tree. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "delete",
      "node",
      "validate",
      "binary",
      "search",
      "tree"
    ],
    "suggestedProblemIds": [
      "prob-220-validate-binary-search-tree",
      "prob-225-recover-binary-search-tree",
      "prob-342-morris-inorder-traversal-of-binary-tree",
      "prob-405-root-to-node-path-in-binary-tree"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 105,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Heap / Priority Queue",
    "subtopic": "Binary heap array representation, heapify algorithm and heap sort",
    "objectives": "Rapid foundation recall: Binary heap array representation, heapify algorithm and heap sort. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "binary",
      "heap",
      "array",
      "representation",
      "heapify",
      "algorithm",
      "heap",
      "sort"
    ],
    "suggestedProblemIds": [
      "prob-174-sort-k-sorted-nearly-sorted-array",
      "prob-398-sort-a-k-sorted-array-nearly-sorted-array",
      "prob-396-check-if-an-array-represents-a-min-heap",
      "prob-397-convert-min-heap-to-max-heap",
      "prob-461-ipo-maximize-capital"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 106,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Heap / Priority Queue",
    "subtopic": "Kth largest element in an array and Kth smallest element",
    "objectives": "Rapid foundation recall: Kth largest element in an array and Kth smallest element. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "largest",
      "element",
      "array",
      "smallest",
      "element"
    ],
    "suggestedProblemIds": [
      "prob-172-kth-largest-element-in-an-array",
      "prob-173-kth-smallest-element-in-an-array",
      "prob-399-replace-each-array-element-by-its-corresponding-rank",
      "prob-178-hands-of-straights"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 107,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Heap / Priority Queue",
    "subtopic": "Top K frequent elements using min-heap",
    "objectives": "Rapid foundation recall: Top K frequent elements using min-heap. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "frequent",
      "elements",
      "heap"
    ],
    "suggestedProblemIds": [
      "prob-176-top-k-frequent-elements",
      "prob-459-reorganize-string",
      "prob-175-k-closest-points-to-origin",
      "prob-177-task-scheduler"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 108,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Heap / Priority Queue",
    "subtopic": "Merge K sorted arrays using priority queue",
    "objectives": "Rapid foundation recall: Merge K sorted arrays using priority queue. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "merge",
      "sorted",
      "arrays",
      "priority",
      "queue"
    ],
    "suggestedProblemIds": [
      "prob-179-design-twitter",
      "prob-180-merge-k-sorted-lists",
      "prob-462-seat-reservation-manager",
      "prob-463-minimum-number-of-refueling-stops"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 109,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Heap / Priority Queue",
    "subtopic": "Find median from running data stream using max-heap and min-heap",
    "objectives": "Rapid foundation recall: Find median from running data stream using max-heap and min-heap. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "find",
      "median",
      "running",
      "data",
      "stream",
      "heap",
      "heap"
    ],
    "suggestedProblemIds": [
      "prob-181-find-median-from-data-stream",
      "prob-457-kth-largest-element-in-a-stream",
      "prob-460-find-k-pairs-with-smallest-sums",
      "prob-458-last-stone-weight"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 110,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Graphs",
    "subtopic": "Graph representation: Adjacency matrix vs Adjacency list",
    "objectives": "Rapid foundation recall: Graph representation: Adjacency matrix vs Adjacency list. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "graph",
      "representation",
      "adjacency",
      "matrix",
      "adjacency",
      "list"
    ],
    "suggestedProblemIds": [
      "prob-411-introduction-to-graph-representation-adjacency-matrix-list",
      "prob-226-number-of-provinces",
      "prob-230-0-1-matrix-distance-to-nearest-0",
      "prob-234-is-graph-bipartite",
      "prob-242-path-with-minimum-effort",
      "prob-228-flood-fill",
      "prob-231-surrounded-regions-capture-o-s"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 111,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Graphs",
    "subtopic": "BFS and DFS traversals of graph with connected components",
    "objectives": "Rapid foundation recall: BFS and DFS traversals of graph with connected components. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "traversals",
      "graph",
      "connected",
      "components"
    ],
    "suggestedProblemIds": [
      "prob-253-strongly-connected-components-kosaraju-s-algorithm",
      "prob-248-number-of-operations-to-make-network-connected",
      "prob-227-number-of-islands",
      "prob-252-bridges-in-graph-tarjan-s-algorithm",
      "prob-232-number-of-enclaves",
      "prob-243-cheapest-flights-within-k-stops",
      "prob-249-most-stones-removed-with-same-row-or-column"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 112,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Graphs",
    "subtopic": "Detect cycle in undirected graph (BFS & DFS) and directed graph (DFS)",
    "objectives": "Rapid foundation recall: Detect cycle in undirected graph (BFS & DFS) and directed graph (DFS). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "detect",
      "cycle",
      "undirected",
      "graph",
      "directed",
      "graph"
    ],
    "suggestedProblemIds": [
      "prob-235-course-schedule-cycle-detection-in-directed-graph",
      "prob-238-alien-dictionary",
      "prob-239-shortest-path-in-directed-acyclic-graph-dag",
      "prob-355-articulation-point-in-graph",
      "prob-247-redundant-connection",
      "prob-251-making-a-large-island",
      "prob-352-number-of-ways-to-arrive-at-destination"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 113,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Graphs",
    "subtopic": "Topological sort using Kahn's algorithm (BFS in-degree) and DFS",
    "objectives": "Rapid foundation recall: Topological sort using Kahn's algorithm (BFS in-degree) and DFS. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "topological",
      "sort",
      "kahn",
      "algorithm",
      "degree"
    ],
    "suggestedProblemIds": [
      "prob-237-find-eventual-safe-states",
      "prob-236-course-schedule-ii-task-order",
      "prob-246-kruskal-s-algorithm-mst-using-dsu",
      "prob-245-minimum-spanning-tree-prim-s-algorithm",
      "prob-250-accounts-merge",
      "prob-354-swim-in-rising-water",
      "prob-412-minimum-steps-to-reach-end-by-multiplication"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 114,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Graphs",
    "subtopic": "Dijkstra's Algorithm for single-source shortest path with priority queue",
    "objectives": "Rapid foundation recall: Dijkstra's Algorithm for single-source shortest path with priority queue. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "dijkstra",
      "algorithm",
      "single",
      "source",
      "shortest",
      "path",
      "priority",
      "queue"
    ],
    "suggestedProblemIds": [
      "prob-240-dijkstra-s-algorithm-shortest-path",
      "prob-233-word-ladder",
      "prob-241-shortest-path-in-binary-matrix",
      "prob-244-network-delay-time",
      "prob-351-minimum-multiplications-to-reach-end",
      "prob-229-rotting-oranges",
      "prob-353-find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 115,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Dynamic Programming",
    "subtopic": "Introduction to DP: Memoization vs Tabulation, Climbing Stairs and Frog Jump",
    "objectives": "Rapid foundation recall: Introduction to DP: Memoization vs Tabulation, Climbing Stairs and Frog Jump. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "introduction",
      "memoization",
      "tabulation",
      "climbing",
      "stairs",
      "frog",
      "jump"
    ],
    "suggestedProblemIds": [
      "prob-254-climbing-stairs",
      "prob-255-frog-jump-geek-jump",
      "prob-356-frog-jump-with-k-distance",
      "prob-413-frog-jump-with-k-distances",
      "prob-256-house-robber",
      "prob-257-house-robber-ii-circular",
      "prob-258-ninja-s-training-2d-activity-dp",
      "prob-264-cherry-pickup-ii-3d-dp",
      "prob-280-edit-distance",
      "prob-281-wildcard-matching",
      "prob-282-best-time-to-buy-and-sell-stock-ii-infinite-transactions",
      "prob-283-best-time-to-buy-and-sell-stock-iii-at-most-2-transactions",
      "prob-284-best-time-to-buy-and-sell-stock-iv-at-most-k-transactions",
      "prob-285-best-time-to-buy-and-sell-stock-with-cooldown",
      "prob-292-matrix-chain-multiplication-mcm"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 116,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Dynamic Programming",
    "subtopic": "2D Grid DP: Unique Paths and Minimum Path Sum",
    "objectives": "Rapid foundation recall: 2D Grid DP: Unique Paths and Minimum Path Sum. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "grid",
      "unique",
      "paths",
      "minimum",
      "path"
    ],
    "suggestedProblemIds": [
      "prob-259-unique-paths-in-grid",
      "prob-260-unique-paths-ii-with-obstacles",
      "prob-261-minimum-path-sum-in-grid",
      "prob-263-minimum-falling-path-sum",
      "prob-262-triangle-minimum-path-sum",
      "prob-271-coin-change-minimum-coins",
      "prob-277-minimum-insertions-to-make-string-palindrome",
      "prob-414-ninja-s-training",
      "prob-420-minimum-insertions-deletions-to-convert-string-a-to-b",
      "prob-422-minimum-cost-to-cut-a-stick",
      "prob-423-palindrome-partitioning-ii-minimum-cuts",
      "prob-293-cost-to-cut-a-stick",
      "prob-294-burst-balloons",
      "prob-295-evaluate-boolean-expression-to-true",
      "prob-296-palindrome-partitioning-ii-min-cuts"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 117,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Dynamic Programming",
    "subtopic": "Subsequence DP: Subset Sum equals target and 0/1 Knapsack",
    "objectives": "Rapid foundation recall: Subsequence DP: Subset Sum equals target and 0/1 Knapsack. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "subsequence",
      "subset",
      "equals",
      "target",
      "knapsack"
    ],
    "suggestedProblemIds": [
      "prob-265-subset-sum-problem",
      "prob-266-partition-equal-subset-sum",
      "prob-268-count-subsets-with-sum-k",
      "prob-270-target-sum",
      "prob-357-count-subsets-with-given-difference",
      "prob-416-count-partitions-with-given-difference",
      "prob-267-partition-array-into-two-arrays-to-minimize-sum-difference",
      "prob-269-0-1-knapsack-problem",
      "prob-272-coin-change-ii-number-of-ways",
      "prob-273-unbounded-knapsack-rod-cutting",
      "prob-288-largest-divisible-subset",
      "prob-415-partition-set-into-2-subsets-with-min-absolute-sum-difference",
      "prob-417-unbounded-knapsack",
      "prob-418-rod-cutting-problem",
      "prob-297-partition-array-for-maximum-sum"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 118,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Dynamic Programming",
    "subtopic": "LIS (Longest Increasing Subsequence) and LCS (Longest Common Subsequence)",
    "objectives": "Rapid foundation recall: LIS (Longest Increasing Subsequence) and LCS (Longest Common Subsequence). Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "longest",
      "increasing",
      "subsequence",
      "longest",
      "common",
      "subsequence"
    ],
    "suggestedProblemIds": [
      "prob-274-longest-common-subsequence-lcs",
      "prob-275-print-longest-common-subsequence",
      "prob-276-longest-palindromic-subsequence",
      "prob-286-longest-increasing-subsequence-lis",
      "prob-287-print-longest-increasing-subsequence",
      "prob-291-number-of-longest-increasing-subsequences",
      "prob-290-longest-bitonic-subsequence",
      "prob-419-longest-common-substring",
      "prob-279-distinct-subsequences",
      "prob-289-longest-string-chain",
      "prob-278-shortest-common-supersequence",
      "prob-358-maximum-profit-in-job-scheduling",
      "prob-421-best-time-to-buy-and-sell-stock-with-transaction-fee",
      "prob-424-maximum-rectangle-area-with-all-1s-in-binary-matrix",
      "prob-425-count-square-submatrices-with-all-ones"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 119,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Greedy & Intervals",
    "subtopic": "Greedy fundamentals: Activity selection, non-overlapping intervals and meeting rooms",
    "objectives": "Rapid foundation recall: Greedy fundamentals: Activity selection, non-overlapping intervals and meeting rooms. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "greedy",
      "activity",
      "selection",
      "overlapping",
      "intervals",
      "meeting",
      "rooms"
    ],
    "suggestedProblemIds": [
      "prob-194-non-overlapping-intervals",
      "prob-184-find-minimum-number-of-coins",
      "prob-465-video-stitching",
      "prob-187-n-meetings-in-one-room",
      "prob-400-find-minimum-number-of-coins-greedy",
      "prob-466-minimum-deletions-to-make-character-frequencies-unique",
      "prob-182-assign-cookies",
      "prob-183-fractional-knapsack-problem",
      "prob-185-lemonade-change",
      "prob-186-valid-parenthesis-string-with-wildcard",
      "prob-188-minimum-platforms-required-for-railway"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  },
  {
    "dayNumber": 120,
    "phase": "Days 91–120: Hierarchical & Advanced",
    "topic": "Greedy & Intervals",
    "subtopic": "Foundation mastery audit and Greedy interval scheduling",
    "objectives": "Rapid foundation recall: Foundation mastery audit and Greedy interval scheduling. Reinforce syntax, optimal approaches, and memory invariants.",
    "keywords": [
      "foundation",
      "mastery",
      "audit",
      "greedy",
      "interval",
      "scheduling"
    ],
    "suggestedProblemIds": [
      "prob-467-maximum-length-of-pair-chain",
      "prob-192-jump-game-ii-minimum-jumps",
      "prob-191-jump-game",
      "prob-195-insert-interval",
      "prob-464-minimum-number-of-arrows-to-burst-balloons",
      "prob-469-patching-array",
      "prob-189-job-sequencing-problem-with-deadlines",
      "prob-190-candy-distribute-minimum-candies",
      "prob-193-gas-station-circular-tour",
      "prob-468-queue-reconstruction-by-height"
    ],
    "targetCount": 4,
    "estimatedMinutes": 35
  }
];

  const CURRICULUM_TAXONOMY_AUDIT = [
  {
    "code": "A",
    "area": "Arrays & Hashing",
    "patterns": [
      {
        "name": "Frequency counting & Hash Maps",
        "tier": "Core",
        "keywords": [
          "frequency",
          "hash",
          "map",
          "count"
        ],
        "catalogCount": 128,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-1-count-digits",
          "prob-14-count-frequency-of-array-elements",
          "prob-15-find-highest-and-lowest-frequency-elements"
        ]
      },
      {
        "name": "Prefix / Suffix arrays & Range Sum",
        "tier": "Core",
        "keywords": [
          "prefix sum",
          "range sum",
          "product except self"
        ],
        "catalogCount": 4,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-33-longest-subarray-with-sum-k-positives-negatives",
          "prob-47-count-subarray-sum-equals-k",
          "prob-52-largest-subarray-with-0-sum"
        ]
      },
      {
        "name": "Difference arrays",
        "tier": "Important",
        "keywords": [
          "difference array",
          "corporate flight"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Subarray sums (Equals K, Longest)",
        "tier": "Core",
        "keywords": [
          "subarray sum",
          "longest subarray"
        ],
        "catalogCount": 8,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-32-longest-subarray-with-sum-k-positives",
          "prob-33-longest-subarray-with-sum-k-positives-negatives",
          "prob-38-print-maximum-subarray-sum-subarray"
        ]
      },
      {
        "name": "Kadane & Subarray Maximum variants",
        "tier": "Core",
        "keywords": [
          "kadane",
          "maximum subarray"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-37-maximum-subarray-kadane-s-algorithm",
          "prob-38-print-maximum-subarray-sum-subarray",
          "prob-79-split-array-largest-sum"
        ]
      },
      {
        "name": "In-place transformations & Inversions",
        "tier": "Important",
        "keywords": [
          "in-place",
          "rotate",
          "next permutation"
        ],
        "catalogCount": 17,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-23-check-if-array-is-sorted-and-rotated",
          "prob-24-remove-duplicates-from-sorted-array",
          "prob-25-rotate-array-by-k-elements-left-right"
        ]
      },
      {
        "name": "Dutch National Flag (0s, 1s, 2s)",
        "tier": "Core",
        "keywords": [
          "sort 0s 1s 2s",
          "dutch national flag"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-35-sort-colors-0s-1s-2s"
        ]
      },
      {
        "name": "Cyclic sort / Missing number",
        "tier": "Important",
        "keywords": [
          "missing number",
          "find duplicate",
          "first missing positive"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-29-find-missing-number"
        ]
      },
      {
        "name": "Boyer-Moore Majority Vote",
        "tier": "Core",
        "keywords": [
          "majority element"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-36-majority-element-n-2",
          "prob-49-majority-element-ii-n-3"
        ]
      },
      {
        "name": "Quickselect (Kth largest/smallest)",
        "tier": "Important",
        "keywords": [
          "quickselect",
          "kth largest"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-172-kth-largest-element-in-an-array",
          "prob-437-wiggle-sort-ii",
          "prob-457-kth-largest-element-in-a-stream"
        ]
      },
      {
        "name": "3Sum / 4Sum opposite-ends pointers",
        "tier": "Core",
        "keywords": [
          "3sum",
          "4sum",
          "three sum"
        ],
        "catalogCount": 4,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-50-3sum",
          "prob-51-4sum",
          "prob-441-3sum-closest"
        ]
      },
      {
        "name": "Longest Consecutive Sequence",
        "tier": "Core",
        "keywords": [
          "longest consecutive sequence"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-43-longest-consecutive-sequence"
        ]
      }
    ]
  },
  {
    "code": "B",
    "area": "Strings",
    "patterns": [
      {
        "name": "Character frequency & Anagrams",
        "tier": "Core",
        "keywords": [
          "anagram",
          "frequency",
          "isomorphic"
        ],
        "catalogCount": 17,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-14-count-frequency-of-array-elements",
          "prob-15-find-highest-and-lowest-frequency-elements",
          "prob-53-count-subarrays-with-given-xor-k"
        ]
      },
      {
        "name": "Palindromes & Two Pointers",
        "tier": "Core",
        "keywords": [
          "palindrome",
          "valid palindrome"
        ],
        "catalogCount": 11,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-3-check-palindrome-number",
          "prob-12-check-if-a-string-is-palindrome",
          "prob-106-palindrome-linked-list"
        ]
      },
      {
        "name": "Sliding window substring patterns",
        "tier": "Core",
        "keywords": [
          "longest substring",
          "character replacement"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-162-longest-substring-without-repeating-characters",
          "prob-165-longest-repeating-character-replacement"
        ]
      },
      {
        "name": "Minimum window substring",
        "tier": "Important",
        "keywords": [
          "minimum window substring"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-171-minimum-window-substring"
        ]
      },
      {
        "name": "KMP Algorithm (Prefix function)",
        "tier": "Important",
        "keywords": [
          "kmp",
          "lps",
          "longest prefix suffix"
        ],
        "catalogCount": 7,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-276-longest-palindromic-subsequence",
          "prob-277-minimum-insertions-to-make-string-palindrome",
          "prob-359-shortest-palindrome-kmp-prefix-table"
        ]
      },
      {
        "name": "Z-Algorithm / Rabin-Karp Rolling Hash",
        "tier": "Advanced",
        "keywords": [
          "rabin-karp",
          "rolling hash",
          "z-algorithm"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-360-rabin-karp-string-matching-algorithm",
          "prob-362-z-algorithm-for-pattern-searching",
          "prob-432-rabin-karp-algorithm-for-pattern-searching"
        ]
      },
      {
        "name": "Manacher Algorithm (Longest Palindromic Substring)",
        "tier": "Optional",
        "keywords": [
          "manacher"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "String DP (Edit Distance, LCS)",
        "tier": "Core",
        "keywords": [
          "edit distance",
          "longest common subsequence"
        ],
        "catalogCount": 4,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-274-longest-common-subsequence-lcs",
          "prob-275-print-longest-common-subsequence",
          "prob-276-longest-palindromic-subsequence"
        ]
      },
      {
        "name": "Trie string search & prefixes",
        "tier": "Core",
        "keywords": [
          "trie",
          "prefix"
        ],
        "catalogCount": 35,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-33-longest-subarray-with-sum-k-positives-negatives",
          "prob-47-count-subarray-sum-equals-k",
          "prob-52-largest-subarray-with-0-sum"
        ]
      }
    ]
  },
  {
    "code": "C",
    "area": "Sorting & Searching",
    "patterns": [
      {
        "name": "Merge Sort & Quick Sort",
        "tier": "Core",
        "keywords": [
          "merge sort",
          "quick sort"
        ],
        "catalogCount": 5,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-19-merge-sort",
          "prob-20-quick-sort",
          "prob-57-count-inversions-in-an-array"
        ]
      },
      {
        "name": "Counting / Radix Sort awareness",
        "tier": "Important",
        "keywords": [
          "counting sort",
          "radix"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-434-counting-sort",
          "prob-435-radix-sort"
        ]
      },
      {
        "name": "Custom Comparator patterns",
        "tier": "Core",
        "keywords": [
          "comparator",
          "custom sort",
          "largest number"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Binary search lower / upper bounds",
        "tier": "Core",
        "keywords": [
          "lower bound",
          "upper bound",
          "binary search"
        ],
        "catalogCount": 39,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-60-binary-search-search-in-sorted-array",
          "prob-61-implement-lower-bound",
          "prob-62-implement-upper-bound"
        ]
      },
      {
        "name": "Rotated sorted arrays & Peak finding",
        "tier": "Core",
        "keywords": [
          "rotated sorted",
          "peak element"
        ],
        "catalogCount": 5,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-66-search-in-rotated-sorted-array",
          "prob-67-search-in-rotated-sorted-array-ii-with-duplicates",
          "prob-68-find-minimum-in-rotated-sorted-array"
        ]
      },
      {
        "name": "2D Matrix binary search",
        "tier": "Important",
        "keywords": [
          "search a 2d matrix"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-83-search-a-2d-matrix",
          "prob-84-search-a-2d-matrix-ii"
        ]
      },
      {
        "name": "Binary search on answers / capacity",
        "tier": "Core",
        "keywords": [
          "koko",
          "capacity to ship",
          "aggressive cows",
          "book allocation"
        ],
        "catalogCount": 6,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-73-koko-eating-bananas",
          "prob-76-capacity-to-ship-packages-within-d-days",
          "prob-77-aggressive-cows"
        ]
      },
      {
        "name": "Parametric / median search",
        "tier": "Important",
        "keywords": [
          "median of two sorted arrays"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-81-median-of-two-sorted-arrays"
        ]
      }
    ]
  },
  {
    "code": "D",
    "area": "Linked Lists",
    "patterns": [
      {
        "name": "Reversal & Fast/Slow Pointers",
        "tier": "Core",
        "keywords": [
          "reverse linked list",
          "middle of linked list"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-102-reverse-linked-list"
        ]
      },
      {
        "name": "Cycle detection & Starting node",
        "tier": "Core",
        "keywords": [
          "detect loop",
          "cycle in linked list"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Merging two / K sorted lists",
        "tier": "Core",
        "keywords": [
          "merge two sorted lists",
          "merge k sorted lists"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-180-merge-k-sorted-lists"
        ]
      },
      {
        "name": "Reverse in K-group",
        "tier": "Important",
        "keywords": [
          "reverse nodes in k-group"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-114-reverse-nodes-in-k-group"
        ]
      },
      {
        "name": "Copy list with random pointer",
        "tier": "Important",
        "keywords": [
          "clone linked list with random pointer"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Flattening multi-level lists",
        "tier": "Important",
        "keywords": [
          "flattening a linked list"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Intersection of two linked lists",
        "tier": "Core",
        "keywords": [
          "intersection point of two linked lists"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-112-intersection-point-of-two-linked-lists"
        ]
      }
    ]
  },
  {
    "code": "E",
    "area": "Stacks & Queues",
    "patterns": [
      {
        "name": "Monotonic stack (NGE / NSE)",
        "tier": "Core",
        "keywords": [
          "next greater element",
          "next smaller element"
        ],
        "catalogCount": 4,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-149-next-greater-element-i",
          "prob-150-next-greater-element-ii-circular",
          "prob-151-next-smaller-element"
        ]
      },
      {
        "name": "Monotonic deque & Sliding window max",
        "tier": "Core",
        "keywords": [
          "sliding window maximum"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-159-sliding-window-maximum"
        ]
      },
      {
        "name": "Largest Rectangle in Histogram",
        "tier": "Important",
        "keywords": [
          "largest rectangle in histogram"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-157-largest-rectangle-in-histogram",
          "prob-158-maximal-rectangle-in-binary-matrix",
          "prob-424-maximum-rectangle-area-with-all-1s-in-binary-matrix"
        ]
      },
      {
        "name": "Trapping Rainwater (Stack & Pointers)",
        "tier": "Core",
        "keywords": [
          "trapping rainwater"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Expression evaluation & Parentheses",
        "tier": "Core",
        "keywords": [
          "valid parentheses",
          "evaluate reverse polish"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-145-valid-parentheses"
        ]
      }
    ]
  },
  {
    "code": "F",
    "area": "Binary Trees & BST",
    "patterns": [
      {
        "name": "DFS & BFS Traversals (Recursive/Iterative)",
        "tier": "Core",
        "keywords": [
          "inorder",
          "preorder",
          "level order"
        ],
        "catalogCount": 21,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-197-maximum-depth-of-binary-tree",
          "prob-202-binary-tree-level-order-traversal",
          "prob-203-binary-tree-zigzag-level-order-traversal"
        ]
      },
      {
        "name": "Views & Boundary traversal",
        "tier": "Core",
        "keywords": [
          "boundary traversal",
          "vertical order"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-46-spiral-matrix",
          "prob-204-boundary-traversal-of-binary-tree",
          "prob-205-vertical-order-traversal-of-a-binary-tree"
        ]
      },
      {
        "name": "Height, Diameter & Balanced checks",
        "tier": "Core",
        "keywords": [
          "diameter of binary tree",
          "maximum depth"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-197-maximum-depth-of-binary-tree",
          "prob-198-diameter-of-binary-tree"
        ]
      },
      {
        "name": "LCA in Binary Trees & BST",
        "tier": "Core",
        "keywords": [
          "lowest common ancestor"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-209-lowest-common-ancestor-of-a-binary-tree",
          "prob-221-lowest-common-ancestor-of-a-bst"
        ]
      },
      {
        "name": "Tree Construction from Traversals",
        "tier": "Core",
        "keywords": [
          "construct binary tree"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-407-construct-binary-tree-from-inorder-and-postorder"
        ]
      },
      {
        "name": "BST Search, Insert, Delete, Validate",
        "tier": "Core",
        "keywords": [
          "validate binary search tree",
          "search in a binary search tree"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-215-search-in-a-binary-search-tree",
          "prob-220-validate-binary-search-tree"
        ]
      },
      {
        "name": "Tree DP & Subtree Aggregation",
        "tier": "Important",
        "keywords": [
          "binary tree maximum path sum"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-210-binary-tree-maximum-path-sum"
        ]
      },
      {
        "name": "Serialization / Deserialization",
        "tier": "Important",
        "keywords": [
          "serialize and deserialize"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-213-serialize-and-deserialize-binary-tree"
        ]
      },
      {
        "name": "Morris Traversal (O(1) auxiliary space)",
        "tier": "Optional",
        "keywords": [
          "morris traversal"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-214-flatten-binary-tree-to-linked-list"
        ]
      }
    ]
  },
  {
    "code": "G",
    "area": "Heaps & Priority Queues",
    "patterns": [
      {
        "name": "Heap construction & Top-K elements",
        "tier": "Core",
        "keywords": [
          "kth largest",
          "top k frequent"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-172-kth-largest-element-in-an-array",
          "prob-176-top-k-frequent-elements",
          "prob-457-kth-largest-element-in-a-stream"
        ]
      },
      {
        "name": "K-way merge patterns",
        "tier": "Core",
        "keywords": [
          "merge k sorted"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-179-design-twitter",
          "prob-180-merge-k-sorted-lists"
        ]
      },
      {
        "name": "Two Heaps (Running Median)",
        "tier": "Core",
        "keywords": [
          "find median from data stream"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-181-find-median-from-data-stream"
        ]
      },
      {
        "name": "Task scheduler / Greedy with heap",
        "tier": "Important",
        "keywords": [
          "task scheduler",
          "reorganize string"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-177-task-scheduler",
          "prob-459-reorganize-string"
        ]
      }
    ]
  },
  {
    "code": "H",
    "area": "Recursion & Backtracking",
    "patterns": [
      {
        "name": "Subsets & Combinations (Include/Exclude)",
        "tier": "Core",
        "keywords": [
          "subsets",
          "combination sum"
        ],
        "catalogCount": 10,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-121-subsets",
          "prob-122-subsets-ii-with-duplicates",
          "prob-123-combination-sum"
        ]
      },
      {
        "name": "Permutations & Duplicate pruning",
        "tier": "Core",
        "keywords": [
          "permutations"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-272-coin-change-ii-number-of-ways"
        ]
      },
      {
        "name": "Grid backtracking (Word Search, N-Queens)",
        "tier": "Core",
        "keywords": [
          "n-queens",
          "word search",
          "sudoku"
        ],
        "catalogCount": 4,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-128-word-search-in-2d-grid",
          "prob-129-n-queens",
          "prob-130-sudoku-solver"
        ]
      },
      {
        "name": "Palindrome partitioning",
        "tier": "Important",
        "keywords": [
          "palindrome partitioning"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-127-palindrome-partitioning",
          "prob-296-palindrome-partitioning-ii-min-cuts",
          "prob-423-palindrome-partitioning-ii-minimum-cuts"
        ]
      },
      {
        "name": "Branch-and-bound pruning",
        "tier": "Important",
        "keywords": [
          "rat in a maze"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-132-rat-in-a-maze-problem"
        ]
      }
    ]
  },
  {
    "code": "I",
    "area": "Graphs",
    "patterns": [
      {
        "name": "Graph representation & BFS/DFS",
        "tier": "Core",
        "keywords": [
          "bfs",
          "dfs",
          "number of provinces",
          "number of islands"
        ],
        "catalogCount": 47,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-128-word-search-in-2d-grid",
          "prob-132-rat-in-a-maze-problem",
          "prob-192-jump-game-ii-minimum-jumps"
        ]
      },
      {
        "name": "Cycle detection (Undirected & Directed)",
        "tier": "Core",
        "keywords": [
          "cycle",
          "course schedule"
        ],
        "catalogCount": 7,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-103-linked-list-cycle-detection",
          "prob-104-linked-list-cycle-ii-find-start-of-cycle",
          "prob-105-find-length-of-loop-in-linked-list"
        ]
      },
      {
        "name": "Topological Sort (Kahn & DFS)",
        "tier": "Core",
        "keywords": [
          "topological sort",
          "alien dictionary"
        ],
        "catalogCount": 4,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-235-course-schedule-cycle-detection-in-directed-graph",
          "prob-237-find-eventual-safe-states",
          "prob-238-alien-dictionary"
        ]
      },
      {
        "name": "Bipartite checking (2-coloring)",
        "tier": "Core",
        "keywords": [
          "is graph bipartite"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-234-is-graph-bipartite"
        ]
      },
      {
        "name": "Dijkstra shortest path",
        "tier": "Core",
        "keywords": [
          "dijkstra",
          "shortest path"
        ],
        "catalogCount": 10,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-239-shortest-path-in-directed-acyclic-graph-dag",
          "prob-240-dijkstra-s-algorithm-shortest-path",
          "prob-241-shortest-path-in-binary-matrix"
        ]
      },
      {
        "name": "Bellman-Ford & Negative cycles",
        "tier": "Core",
        "keywords": [
          "bellman ford"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Floyd-Warshall all-pairs shortest path",
        "tier": "Core",
        "keywords": [
          "floyd warshall"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "0-1 BFS",
        "tier": "Important",
        "keywords": [
          "0-1 bfs",
          "minimum effort"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-242-path-with-minimum-effort"
        ]
      },
      {
        "name": "DSU (Disjoint Set Union)",
        "tier": "Core",
        "keywords": [
          "disjoint set",
          "redundant connection"
        ],
        "catalogCount": 6,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-226-number-of-provinces",
          "prob-246-kruskal-s-algorithm-mst-using-dsu",
          "prob-247-redundant-connection"
        ]
      },
      {
        "name": "Kruskal & Prim MST",
        "tier": "Core",
        "keywords": [
          "minimum spanning tree",
          "kruskal",
          "prim"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-7-check-for-prime",
          "prob-245-minimum-spanning-tree-prim-s-algorithm",
          "prob-246-kruskal-s-algorithm-mst-using-dsu"
        ]
      },
      {
        "name": "Tarjan & Kosaraju SCC",
        "tier": "Important",
        "keywords": [
          "strongly connected components",
          "kosaraju",
          "tarjan"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-252-bridges-in-graph-tarjan-s-algorithm",
          "prob-253-strongly-connected-components-kosaraju-s-algorithm",
          "prob-355-articulation-point-in-graph"
        ]
      },
      {
        "name": "Bridges & Articulation points",
        "tier": "Important",
        "keywords": [
          "critical connections",
          "articulation point"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-355-articulation-point-in-graph"
        ]
      },
      {
        "name": "Eulerian path / Hierholzer",
        "tier": "Advanced",
        "keywords": [
          "eulerian path",
          "reconstruct itinerary"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      }
    ]
  },
  {
    "code": "J",
    "area": "Dynamic Programming",
    "patterns": [
      {
        "name": "1D DP (Fibonacci, Climbing Stairs, Robber)",
        "tier": "Core",
        "keywords": [
          "climbing stairs",
          "house robber",
          "frog jump"
        ],
        "catalogCount": 6,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-254-climbing-stairs",
          "prob-255-frog-jump-geek-jump",
          "prob-256-house-robber"
        ]
      },
      {
        "name": "2D Grid DP (Unique Paths, Min Path Sum)",
        "tier": "Core",
        "keywords": [
          "unique paths",
          "minimum path sum"
        ],
        "catalogCount": 4,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-259-unique-paths-in-grid",
          "prob-260-unique-paths-ii-with-obstacles",
          "prob-261-minimum-path-sum-in-grid"
        ]
      },
      {
        "name": "Subsequence / Knapsack (0/1, Unbounded)",
        "tier": "Core",
        "keywords": [
          "knapsack",
          "subset sum",
          "coin change",
          "target sum"
        ],
        "catalogCount": 16,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-183-fractional-knapsack-problem",
          "prob-265-subset-sum-problem",
          "prob-266-partition-equal-subset-sum"
        ]
      },
      {
        "name": "Longest Increasing Subsequence (LIS)",
        "tier": "Core",
        "keywords": [
          "longest increasing subsequence"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-286-longest-increasing-subsequence-lis",
          "prob-287-print-longest-increasing-subsequence",
          "prob-291-number-of-longest-increasing-subsequences"
        ]
      },
      {
        "name": "String DP (LCS, Edit Distance, Palindromes)",
        "tier": "Core",
        "keywords": [
          "longest common subsequence",
          "edit distance",
          "palindromic substring"
        ],
        "catalogCount": 5,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-98-longest-palindromic-substring",
          "prob-274-longest-common-subsequence-lcs",
          "prob-275-print-longest-common-subsequence"
        ]
      },
      {
        "name": "Stock Trading DP (I through IV, Fee, Cooldown)",
        "tier": "Core",
        "keywords": [
          "best time to buy and sell stock"
        ],
        "catalogCount": 6,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-39-best-time-to-buy-and-sell-stock",
          "prob-282-best-time-to-buy-and-sell-stock-ii-infinite-transactions",
          "prob-283-best-time-to-buy-and-sell-stock-iii-at-most-2-transactions"
        ]
      },
      {
        "name": "Partition DP (MCM, Burst Balloons)",
        "tier": "Important",
        "keywords": [
          "matrix chain multiplication",
          "burst balloons"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-292-matrix-chain-multiplication-mcm",
          "prob-294-burst-balloons",
          "prob-464-minimum-number-of-arrows-to-burst-balloons"
        ]
      },
      {
        "name": "Tree DP & Subtree optimal states",
        "tier": "Important",
        "keywords": [
          "tree dp"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Bitmask DP",
        "tier": "Important",
        "keywords": [
          "bitmask dp",
          "travelling salesman"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Digit DP",
        "tier": "Advanced",
        "keywords": [
          "digit dp"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Convex Hull Trick / Divide & Conquer DP",
        "tier": "Optional",
        "keywords": [
          "convex hull trick"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      }
    ]
  },
  {
    "code": "K",
    "area": "Greedy & Intervals",
    "patterns": [
      {
        "name": "Activity Selection & Meeting Rooms",
        "tier": "Core",
        "keywords": [
          "meeting rooms",
          "non-overlapping intervals"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-194-non-overlapping-intervals"
        ]
      },
      {
        "name": "Interval merging & insertion",
        "tier": "Core",
        "keywords": [
          "merge intervals",
          "insert interval"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-195-insert-interval"
        ]
      },
      {
        "name": "Fractional Knapsack / Ratio greedy",
        "tier": "Core",
        "keywords": [
          "fractional knapsack",
          "job sequencing"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-183-fractional-knapsack-problem",
          "prob-189-job-sequencing-problem-with-deadlines"
        ]
      },
      {
        "name": "Jump Game reachability & steps",
        "tier": "Core",
        "keywords": [
          "jump game"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-191-jump-game",
          "prob-192-jump-game-ii-minimum-jumps"
        ]
      },
      {
        "name": "Gas Station circular tour greedy",
        "tier": "Core",
        "keywords": [
          "gas station"
        ],
        "catalogCount": 2,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-193-gas-station-circular-tour",
          "prob-372-minimize-max-distance-to-gas-stations"
        ]
      }
    ]
  },
  {
    "code": "L",
    "area": "Bit Manipulation & Mathematics",
    "patterns": [
      {
        "name": "Bitwise basic properties & power of two",
        "tier": "Core",
        "keywords": [
          "power of two",
          "number of 1 bits"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-137-count-number-of-set-bits-number-of-1-bits"
        ]
      },
      {
        "name": "XOR properties (Single number I/II/III)",
        "tier": "Core",
        "keywords": [
          "single number"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-31-single-number-find-element-appearing-once",
          "prob-141-single-number-ii-every-element-appears-3-times",
          "prob-142-single-number-iii-two-numbers-appearing-once"
        ]
      },
      {
        "name": "Bitmask subset generation",
        "tier": "Core",
        "keywords": [
          "subsets bitmask"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Euclidean GCD & Modular Arithmetic",
        "tier": "Core",
        "keywords": [
          "gcd",
          "modular arithmetic"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-4-gcd-or-hcf-euclidean-algorithm"
        ]
      },
      {
        "name": "Sieve of Eratosthenes & Prime Factorization",
        "tier": "Core",
        "keywords": [
          "sieve",
          "count primes"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      }
    ]
  },
  {
    "code": "M",
    "area": "Tries & Advanced Data Structures",
    "patterns": [
      {
        "name": "Trie Prefix tree insertion & lookup",
        "tier": "Core",
        "keywords": [
          "implement trie",
          "starts with"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-298-implement-trie-prefix-tree",
          "prob-299-implement-trie-ii-prefix-with-counts",
          "prob-426-implement-trie-ii-prefix-tree-with-count"
        ]
      },
      {
        "name": "Word Search II (Trie + Backtracking)",
        "tier": "Important",
        "keywords": [
          "word search ii"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-303-word-search-ii-boggle-with-trie"
        ]
      },
      {
        "name": "Maximum XOR with Trie",
        "tier": "Important",
        "keywords": [
          "maximum xor of two numbers"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-304-maximum-xor-of-two-numbers-in-array"
        ]
      },
      {
        "name": "Segment Tree (Point & Range queries)",
        "tier": "Advanced",
        "keywords": [
          "segment tree",
          "range sum query"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Binary Indexed Tree / Fenwick Tree",
        "tier": "Advanced",
        "keywords": [
          "fenwick tree",
          "binary indexed tree"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-394-number-of-nges-to-the-right"
        ]
      }
    ]
  },
  {
    "code": "N",
    "area": "Interview Execution & Problem-Solving Strategies",
    "patterns": [
      {
        "name": "Two-pointer opposite & same direction",
        "tier": "Core",
        "keywords": [
          "two pointers",
          "opposite direction"
        ],
        "catalogCount": 40,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-11-reverse-an-array",
          "prob-12-check-if-a-string-is-palindrome",
          "prob-24-remove-duplicates-from-sorted-array"
        ]
      },
      {
        "name": "Sliding window fixed & variable size",
        "tier": "Core",
        "keywords": [
          "sliding window"
        ],
        "catalogCount": 27,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-32-longest-subarray-with-sum-k-positives",
          "prob-50-3sum",
          "prob-51-4sum"
        ]
      },
      {
        "name": "Monotonic stack & queue templates",
        "tier": "Core",
        "keywords": [
          "monotonic stack",
          "monotonic queue"
        ],
        "catalogCount": 7,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-149-next-greater-element-i",
          "prob-150-next-greater-element-ii-circular",
          "prob-151-next-smaller-element"
        ]
      },
      {
        "name": "Fast & Slow pointers (Tortoise/Hare)",
        "tier": "Core",
        "keywords": [
          "fast and slow pointers",
          "tortoise and hare"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-103-linked-list-cycle-detection"
        ]
      },
      {
        "name": "In-place state marking & sign inversion",
        "tier": "Core",
        "keywords": [
          "first missing positive",
          "set matrix zeroes"
        ],
        "catalogCount": 1,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-44-set-matrix-zeroes"
        ]
      },
      {
        "name": "Space-time tradeoff analysis",
        "tier": "Core",
        "keywords": [
          "time complexity",
          "space complexity"
        ],
        "catalogCount": 0,
        "coveredIn120Roadmap": false,
        "sampleProblemIds": []
      },
      {
        "name": "Edge cases & Constraint boundaries",
        "tier": "Core",
        "keywords": [
          "corner cases",
          "empty input",
          "overflow"
        ],
        "catalogCount": 3,
        "coveredIn120Roadmap": true,
        "sampleProblemIds": [
          "prob-2-reverse-a-number",
          "prob-72-find-nth-root-of-integer-m",
          "prob-344-maximum-width-of-binary-tree"
        ]
      }
    ]
  }
];

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
        catalogSize: 479
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
