const fs = require('fs');
const path = require('path');

// Load current default sheets
const sheetsPath = path.join(__dirname, '../js/data/default-sheets.js');
const rawFile = fs.readFileSync(sheetsPath, 'utf8');

// Parse problems from file
let allProblems;
try {
  allProblems = require(sheetsPath);
} catch (e) {
  console.error('Failed to require sheets:', e);
  process.exit(1);
}

console.log(`Loaded ${allProblems.length} problems.`);

// Create a lookup by ID
const problemMap = new Map();
allProblems.forEach(p => {
  if (problemMap.has(p.id)) {
    console.error('Duplicate ID detected in source:', p.id);
  }
  problemMap.set(p.id, p);
});

// Taxonomy & Ordered Subtopics Definition
const TAXONOMY_DEFINITIONS = [
  {
    topic: 'Basics & Math',
    subtopics: [
      {
        name: 'Language Basics & Syntax',
        problemIds: [
          'prob-363-user-input-output-data-types',
          'prob-364-if-else-decision-making',
          'prob-365-switch-case-statements',
          'prob-366-pass-by-reference-and-pass-by-value',
          'prob-367-while-loops-for-loops-syntax',
          'prob-1-count-digits'
        ]
      },
      {
        name: 'Basic Math & Number Theory',
        problemIds: [
          'prob-2-reverse-a-number',
          'prob-3-check-palindrome-number',
          'prob-4-gcd-or-hcf-euclidean-algorithm',
          'prob-5-armstrong-numbers',
          'prob-6-print-all-divisors-of-a-given-number',
          'prob-7-check-for-prime'
        ]
      },
      {
        name: 'Basic Recursion',
        problemIds: [
          'prob-8-print-1-to-n-without-loop-recursion',
          'prob-9-sum-of-first-n-numbers',
          'prob-10-factorial-of-n-numbers',
          'prob-11-reverse-an-array',
          'prob-12-check-if-a-string-is-palindrome',
          'prob-13-fibonacci-number'
        ]
      },
      {
        name: 'Basic Hashing',
        problemIds: [
          'prob-14-count-frequency-of-array-elements',
          'prob-15-find-highest-and-lowest-frequency-elements'
        ]
      },
      {
        name: 'Pattern Printing',
        problemIds: [
          'prob-306-pattern-1-rectangular-star-pattern',
          'prob-307-pattern-2-right-angled-triangle-pattern',
          'prob-308-pattern-3-right-angled-number-pyramid',
          'prob-309-pattern-4-right-angled-number-pyramid-ii',
          'prob-310-pattern-5-inverted-right-pyramid',
          'prob-311-pattern-6-inverted-numbered-right-pyramid',
          'prob-312-pattern-7-star-pyramid',
          'prob-313-pattern-8-inverted-star-pyramid',
          'prob-314-pattern-9-diamond-star-pattern',
          'prob-315-pattern-10-half-diamond-star-pattern',
          'prob-316-pattern-11-binary-number-triangle-pattern',
          'prob-317-pattern-12-number-crown-pattern',
          'prob-318-pattern-13-increasing-number-triangle-pattern',
          'prob-319-pattern-14-increasing-letter-triangle-pattern',
          'prob-320-pattern-15-reverse-letter-triangle-pattern',
          'prob-321-pattern-16-alpha-ramp-pattern',
          'prob-322-pattern-17-alpha-hill-pattern',
          'prob-323-pattern-18-alpha-triangle-pattern',
          'prob-324-pattern-19-symmetric-void-pattern',
          'prob-325-pattern-20-symmetric-butterfly-pattern',
          'prob-326-pattern-21-hollow-rectangle-pattern',
          'prob-327-pattern-22-the-number-pattern'
        ]
      }
    ]
  },
  {
    topic: 'Sorting',
    subtopics: [
      {
        name: 'Elementary Sorts',
        problemIds: [
          'prob-16-selection-sort',
          'prob-17-bubble-sort',
          'prob-18-insertion-sort',
          'prob-328-recursive-bubble-sort',
          'prob-329-recursive-insertion-sort'
        ]
      },
      {
        name: 'Advanced Sorts',
        problemIds: [
          'prob-19-merge-sort',
          'prob-20-quick-sort'
        ]
      },
      {
        name: 'Non-Comparison & Special Sorts',
        problemIds: [
          'prob-434-counting-sort',
          'prob-435-radix-sort',
          'prob-436-bucket-sort',
          'prob-437-wiggle-sort-ii',
          'prob-438-minimum-swaps-to-sort-an-array',
          'prob-439-sort-array-by-parity-ii'
        ]
      }
    ]
  },
  {
    topic: 'Arrays & Hashing',
    subtopics: [
      {
        name: 'Easy Array Operations',
        problemIds: [
          'prob-21-largest-element-in-an-array',
          'prob-22-second-largest-and-second-smallest',
          'prob-23-check-if-array-is-sorted-and-rotated',
          'prob-24-remove-duplicates-from-sorted-array',
          'prob-25-rotate-array-by-k-elements-left-right',
          'prob-370-left-rotate-an-array-by-one',
          'prob-26-move-zeroes-to-end',
          'prob-27-linear-search',
          'prob-28-union-of-two-sorted-arrays',
          'prob-29-find-missing-number',
          'prob-30-max-consecutive-ones',
          'prob-31-single-number',
          'prob-368-count-frequency-of-elements-in-array',
          'prob-369-find-highest-lowest-frequency-element'
        ]
      },
      {
        name: 'Medium Array & Subarrays',
        problemIds: [
          'prob-34-two-sum',
          'prob-35-sort-colors-0s-1s-2s',
          'prob-36-majority-element-n-2',
          'prob-37-maximum-subarray-kadane-s-algorithm',
          'prob-38-print-maximum-subarray-sum-subarray',
          'prob-39-best-time-to-buy-and-sell-stock',
          'prob-40-rearrange-array-elements-by-sign',
          'prob-41-next-permutation',
          'prob-42-leaders-in-an-array',
          'prob-43-longest-consecutive-sequence',
          'prob-44-set-matrix-zeroes',
          'prob-45-rotate-image-by-90-degrees',
          'prob-46-spiral-matrix',
          'prob-47-count-subarray-sum-equals-k',
          'prob-32-longest-subarray-with-sum-k-positives',
          'prob-33-longest-subarray-with-sum-k-positives-negatives'
        ]
      },
      {
        name: 'Hard Array Problems',
        problemIds: [
          'prob-48-pascal-s-triangle',
          'prob-49-majority-element-ii-n-3',
          'prob-52-largest-subarray-with-0-sum',
          'prob-53-count-subarrays-with-given-xor-k',
          'prob-54-merge-overlapping-subintervals',
          'prob-55-merge-two-sorted-arrays-without-extra-space',
          'prob-56-find-the-repeating-and-missing-number',
          'prob-57-count-inversions-in-an-array',
          'prob-58-reverse-pairs',
          'prob-59-maximum-product-subarray'
        ]
      }
    ]
  },
  {
    topic: 'Sliding Window & Two Pointers',
    subtopics: [
      {
        name: 'Two Pointers',
        problemIds: [
          'prob-50-3sum',
          'prob-51-4sum',
          'prob-440-container-with-most-water',
          'prob-441-3sum-closest',
          'prob-152-trapping-rain-water',
          'prob-442-boats-to-save-people',
          'prob-443-4sum-ii',
          'prob-444-valid-triangle-number'
        ]
      },
      {
        name: 'Variable Window (Distinct & Counting)',
        problemIds: [
          'prob-162-longest-substring-without-repeating-characters',
          'prob-163-max-consecutive-ones-iii',
          'prob-164-fruit-into-baskets',
          'prob-374-count-number-of-substrings-with-at-most-k-distinct-characters',
          'prob-445-longest-substring-with-at-most-k-distinct-characters',
          'prob-446-minimum-size-subarray-sum',
          'prob-447-subarray-product-less-than-k',
          'prob-448-maximum-erasure-value',
          'prob-449-frequency-of-the-most-frequent-element'
        ]
      },
      {
        name: 'Hard Sliding Window',
        problemIds: [
          'prob-165-longest-repeating-character-replacement',
          'prob-166-binary-subarrays-with-sum',
          'prob-167-count-number-of-nice-subarrays',
          'prob-168-number-of-substrings-containing-all-three-characters',
          'prob-169-maximum-points-you-can-obtain-from-cards',
          'prob-170-subarrays-with-k-different-integers',
          'prob-171-minimum-window-substring',
          'prob-395-minimum-window-subsequence'
        ]
      }
    ]
  },
  {
    topic: 'Binary Search',
    subtopics: [
      {
        name: 'BS on 1D Arrays',
        problemIds: [
          'prob-60-binary-search-search-in-sorted-array',
          'prob-61-implement-lower-bound',
          'prob-62-implement-upper-bound',
          'prob-63-search-insert-position',
          'prob-371-floor-and-ceil-in-sorted-array',
          'prob-64-find-first-and-last-position-of-element',
          'prob-65-count-occurrences-of-a-number-in-a-sorted-array',
          'prob-66-search-in-rotated-sorted-array-i',
          'prob-67-search-in-rotated-sorted-array-ii',
          'prob-68-find-minimum-in-rotated-sorted-array',
          'prob-69-single-element-in-a-sorted-array',
          'prob-70-find-peak-element'
        ]
      },
      {
        name: 'BS on Answers',
        problemIds: [
          'prob-71-square-root-of-a-number',
          'prob-72-find-nth-root-of-m',
          'prob-73-koko-eating-bananas',
          'prob-74-minimum-days-to-make-m-bouquets',
          'prob-75-find-the-smallest-divisor-given-a-threshold',
          'prob-76-capacity-to-ship-packages-within-d-days',
          'prob-77-kth-missing-positive-number',
          'prob-78-aggressive-cows',
          'prob-80-book-allocation-problem',
          'prob-79-split-array-largest-sum',
          'prob-81-painter-s-partition-problem',
          'prob-372-minimize-max-distance-to-gas-stations',
          'prob-82-median-of-two-sorted-arrays',
          'prob-83-k-th-element-of-two-sorted-arrays'
        ]
      },
      {
        name: 'BS on 2D Matrices',
        problemIds: [
          'prob-84-find-row-with-maximum-number-of-1-s',
          'prob-85-search-a-2d-matrix',
          'prob-86-search-in-a-row-and-column-wise-sorted-matrix',
          'prob-373-matrix-median-in-row-wise-sorted-matrix',
          'prob-430-find-peak-element-ii'
        ]
      }
    ]
  },
  {
    topic: 'Strings',
    subtopics: [
      {
        name: 'Basic Strings',
        problemIds: [
          'prob-87-remove-outermost-parentheses',
          'prob-88-reverse-words-in-a-string',
          'prob-89-largest-odd-number-in-string',
          'prob-90-longest-common-prefix',
          'prob-91-isomorphic-strings',
          'prob-92-check-if-one-string-is-a-rotation-of-another',
          'prob-93-valid-anagram'
        ]
      },
      {
        name: 'Medium Strings',
        problemIds: [
          'prob-94-sort-characters-by-frequency',
          'prob-95-maximum-nesting-depth-of-the-parentheses',
          'prob-96-roman-to-integer',
          'prob-97-integer-to-roman',
          'prob-98-string-to-integer-atoi',
          'prob-99-count-number-of-substrings-with-k-distinct-characters',
          'prob-100-longest-palindromic-substring',
          'prob-375-sum-of-beauty-of-all-substrings'
        ]
      },
      {
        name: 'Advanced Strings & Pattern Matching',
        problemIds: [
          'prob-359-shortest-palindrome-kmp-prefix-table',
          'prob-360-kmp-algorithm-for-pattern-searching',
          'prob-361-z-algorithm-for-pattern-searching',
          'prob-362-minimum-characters-to-add-at-front-for-palindrome',
          'prob-429-repeated-string-match-rabin-karp',
          'prob-431-longest-happy-prefix',
          'prob-432-rabin-karp-algorithm-for-pattern-searching',
          'prob-433-minimum-characters-to-add-at-front-for-palindrome'
        ]
      }
    ]
  },
  {
    topic: 'Linked List',
    subtopics: [
      {
        name: 'Singly Linked List Basics',
        problemIds: [
          'prob-376-introduction-to-linked-list-traversal',
          'prob-377-insert-a-node-in-linked-list',
          'prob-378-delete-a-node-in-linked-list',
          'prob-379-count-nodes-of-linked-list',
          'prob-380-search-an-element-in-the-ll',
          'prob-101-middle-of-the-linked-list'
        ]
      },
      {
        name: 'Doubly Linked List Basics',
        problemIds: [
          'prob-330-introduction-to-doubly-linked-list',
          'prob-331-insert-a-node-in-doubly-linked-list',
          'prob-332-delete-a-node-in-doubly-linked-list',
          'prob-333-reverse-a-doubly-linked-list'
        ]
      },
      {
        name: 'Medium Linked List',
        problemIds: [
          'prob-102-reverse-linked-list',
          'prob-103-linked-list-cycle-detection',
          'prob-104-find-the-starting-point-of-the-loop-in-linked-list',
          'prob-105-length-of-loop-in-linked-list',
          'prob-106-check-if-linked-list-is-palindrome',
          'prob-107-segregate-even-and-odd-nodes-in-linked-list',
          'prob-108-remove-nth-node-from-end-of-list',
          'prob-109-delete-the-middle-node-of-linked-list',
          'prob-110-sort-linked-list',
          'prob-111-sort-a-linked-list-of-0s-1s-and-2s',
          'prob-112-find-the-intersection-point-of-y-linked-list',
          'prob-113-add-1-to-a-number-represented-by-linked-list',
          'prob-114-add-two-numbers-represented-as-linked-list',
          'prob-115-reverse-linked-list-in-groups-of-given-size-k'
        ]
      },
      {
        name: 'Hard Linked List & DLL',
        problemIds: [
          'prob-116-rotate-a-linked-list',
          'prob-117-flattening-of-a-linked-list',
          'prob-118-clone-a-linked-list-with-random-and-next-pointer',
          'prob-119-merge-k-sorted-linked-lists',
          'prob-334-delete-all-occurrences-of-a-key-in-dll',
          'prob-335-find-pairs-with-given-sum-in-dll',
          'prob-336-remove-duplicates-from-sorted-dll',
          'prob-381-delete-all-occurrences-of-a-key-in-doubly-linked-list',
          'prob-382-find-pairs-with-given-sum-in-doubly-linked-list',
          'prob-383-remove-duplicates-from-sorted-doubly-linked-list'
        ]
      }
    ]
  },
  {
    topic: 'Stack & Queue',
    subtopics: [
      {
        name: 'Basics & Implementations',
        problemIds: [
          'prob-389-implement-stack-using-array',
          'prob-390-implement-queue-using-array',
          'prob-147-implement-queue-using-stacks',
          'prob-148-implement-stack-using-queues',
          'prob-391-implement-stack-using-linked-list',
          'prob-392-implement-queue-using-linked-list',
          'prob-146-min-stack'
        ]
      },
      {
        name: 'Infix, Prefix & Postfix',
        problemIds: [
          'prob-337-infix-to-postfix-conversion-using-stack',
          'prob-338-prefix-to-infix-conversion',
          'prob-339-prefix-to-postfix-conversion',
          'prob-340-postfix-to-prefix-conversion',
          'prob-341-postfix-to-infix-conversion',
          'prob-393-infix-to-prefix-conversion'
        ]
      },
      {
        name: 'Monotonic Stack & Queue',
        problemIds: [
          'prob-145-valid-parentheses',
          'prob-149-next-greater-element-i',
          'prob-150-next-greater-element-ii',
          'prob-394-number-of-nges-to-the-right',
          'prob-151-next-smaller-element',
          'prob-153-asteroid-collision',
          'prob-154-sum-of-subarray-minimums',
          'prob-155-sum-of-subarray-ranges',
          'prob-156-remove-k-digits',
          'prob-157-largest-rectangle-in-histogram',
          'prob-158-maximal-rectangle',
          'prob-159-sliding-window-maximum'
        ]
      },
      {
        name: 'Implementation Problems',
        problemIds: [
          'prob-160-the-celebrity-problem',
          'prob-161-online-stock-span'
        ]
      }
    ]
  },
  {
    topic: 'Binary Trees & BST',
    subtopics: [
      {
        name: 'Tree Traversals & Structure',
        problemIds: [
          'prob-404-preorder-inorder-and-postorder-in-one-traversal',
          'prob-401-iterative-preorder-traversal',
          'prob-402-iterative-inorder-traversal',
          'prob-403-iterative-postorder-traversal-using-1-stack',
          'prob-202-binary-tree-level-order-traversal',
          'prob-342-morris-inorder-traversal-of-binary-tree',
          'prob-343-morris-preorder-traversal-of-binary-tree',
          'prob-203-binary-tree-zigzag-level-order-traversal',
          'prob-205-vertical-order-traversal-of-a-binary-tree'
        ]
      },
      {
        name: 'Medium Tree Problems',
        problemIds: [
          'prob-197-maximum-depth-of-binary-tree',
          'prob-199-balanced-binary-tree',
          'prob-198-diameter-of-binary-tree',
          'prob-210-binary-tree-maximum-path-sum',
          'prob-200-same-tree',
          'prob-201-symmetric-tree',
          'prob-196-invert-binary-tree',
          'prob-204-boundary-traversal-of-binary-tree',
          'prob-206-top-view-of-binary-tree',
          'prob-207-bottom-view-of-binary-tree',
          'prob-208-binary-tree-right-side-view',
          'prob-405-root-to-node-path-in-binary-tree',
          'prob-209-lowest-common-ancestor-of-a-binary-tree',
          'prob-344-maximum-width-of-binary-tree',
          'prob-345-children-sum-property-in-binary-tree',
          'prob-406-check-for-children-sum-property-in-binary-tree'
        ]
      },
      {
        name: 'Hard Tree Problems',
        problemIds: [
          'prob-346-all-nodes-distance-k-in-binary-tree',
          'prob-347-minimum-time-taken-to-burn-binary-tree-from-a-node',
          'prob-348-count-total-nodes-in-a-complete-binary-tree',
          'prob-211-construct-tree-from-preorder-and-inorder',
          'prob-212-construct-tree-from-postorder-and-inorder',
          'prob-407-construct-binary-tree-from-inorder-and-postorder',
          'prob-213-serialize-and-deserialize-binary-tree',
          'prob-214-flatten-binary-tree-to-linked-list'
        ]
      },
      {
        name: 'Binary Search Tree (BST) Basics',
        problemIds: [
          'prob-408-introduction-to-binary-search-trees',
          'prob-215-search-in-a-binary-search-tree',
          'prob-409-find-min-max-in-bst',
          'prob-216-ceil-floor-in-a-bst',
          'prob-217-insert-a-given-node-in-bst',
          'prob-218-delete-a-node-in-bst'
        ]
      },
      {
        name: 'Medium & Hard BST',
        problemIds: [
          'prob-219-kth-smallest-element-in-a-bst',
          'prob-220-validate-binary-search-tree',
          'prob-221-lowest-common-ancestor-of-a-bst',
          'prob-222-construct-bst-from-preorder-traversal',
          'prob-349-inorder-successor-and-predecessor-in-bst',
          'prob-410-inorder-predecessor-and-successor-in-bst',
          'prob-223-binary-search-tree-iterator',
          'prob-224-two-sum-iv-input-is-a-bst',
          'prob-225-recover-binary-search-tree',
          'prob-350-largest-bst-in-binary-tree'
        ]
      }
    ]
  },
  {
    topic: 'Graphs',
    subtopics: [
      {
        name: 'Graph Basics & Traversals',
        problemIds: [
          'prob-411-introduction-to-graph-representation-adjacency-matrix-list',
          'prob-226-number-of-provinces'
        ]
      },
      {
        name: 'Grid Problems (BFS/DFS)',
        problemIds: [
          'prob-227-number-of-islands',
          'prob-228-flood-fill',
          'prob-229-rotting-oranges',
          'prob-230-0-1-matrix-distance-to-nearest-0',
          'prob-231-surrounded-regions-capture-o-s',
          'prob-232-number-of-enclaves',
          'prob-251-making-a-large-island'
        ]
      },
      {
        name: 'Cycles & Bipartite',
        problemIds: [
          'prob-234-is-graph-bipartite',
          'prob-235-course-schedule-cycle-detection-in-directed-graph'
        ]
      },
      {
        name: 'Topological Sort',
        problemIds: [
          'prob-236-course-schedule-ii-task-order',
          'prob-237-find-eventual-safe-states',
          'prob-238-alien-dictionary',
          'prob-239-shortest-path-in-directed-acyclic-graph-dag'
        ]
      },
      {
        name: 'Shortest Paths',
        problemIds: [
          'prob-240-dijkstra-s-algorithm-shortest-path',
          'prob-241-shortest-path-in-binary-matrix',
          'prob-242-path-with-minimum-effort',
          'prob-243-cheapest-flights-within-k-stops',
          'prob-244-network-delay-time',
          'prob-351-minimum-multiplications-to-reach-end',
          'prob-412-minimum-steps-to-reach-end-by-multiplication',
          'prob-352-number-of-ways-to-arrive-at-destination',
          'prob-353-find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold',
          'prob-354-swim-in-rising-water'
        ]
      },
      {
        name: 'Minimum Spanning Tree & Disjoint Set',
        problemIds: [
          'prob-245-minimum-spanning-tree-prim-s-algorithm',
          'prob-246-kruskal-s-algorithm-mst-using-dsu',
          'prob-247-redundant-connection',
          'prob-248-number-of-operations-to-make-network-connected',
          'prob-249-most-stones-removed-with-same-row-or-column',
          'prob-250-accounts-merge'
        ]
      },
      {
        name: 'Other Graph Algorithms',
        problemIds: [
          'prob-252-bridges-in-graph-tarjan-s-algorithm',
          'prob-253-strongly-connected-components-kosaraju-s-algorithm',
          'prob-355-articulation-point-in-graph',
          'prob-233-word-ladder'
        ]
      }
    ]
  },
  {
    topic: 'Dynamic Programming',
    subtopics: [
      {
        name: 'Introduction & 1D DP',
        problemIds: [
          'prob-254-climbing-stairs',
          'prob-255-frog-jump-geek-jump',
          'prob-356-frog-jump-with-k-distance',
          'prob-413-frog-jump-with-k-distances',
          'prob-256-house-robber',
          'prob-257-house-robber-ii',
          'prob-258-ninja-s-training'
        ]
      },
      {
        name: '2D/3D Grid DP',
        problemIds: [
          'prob-259-unique-paths-in-grid',
          'prob-260-unique-paths-ii-with-obstacles',
          'prob-261-minimum-path-sum-in-grid',
          'prob-262-triangle-minimum-path-sum',
          'prob-263-minimum-falling-path-sum',
          'prob-264-cherry-pickup-ii'
        ]
      },
      {
        name: 'DP on Subsequences / Knapsack',
        problemIds: [
          'prob-265-subset-sum-problem',
          'prob-266-partition-equal-subset-sum',
          'prob-267-partition-set-into-2-subsets-with-min-absolute-sum-diff',
          'prob-268-count-subsets-with-sum-k',
          'prob-269-0-1-knapsack-problem',
          'prob-270-minimum-coins-greedy-fails',
          'prob-271-target-sum',
          'prob-272-coin-change-ii-number-of-ways',
          'prob-273-unbounded-knapsack-problem',
          'prob-357-rod-cutting-problem',
          'prob-414-rod-cutting-problem'
        ]
      },
      {
        name: 'DP on Strings',
        problemIds: [
          'prob-274-longest-common-subsequence-lcs',
          'prob-275-print-longest-common-subsequence',
          'prob-276-longest-common-substring',
          'prob-277-longest-palindromic-subsequence',
          'prob-278-minimum-insertions-to-make-string-palindrome',
          'prob-279-minimum-insertions-deletions-to-convert-string',
          'prob-280-shortest-common-supersequence',
          'prob-281-distinct-subsequences',
          'prob-282-edit-distance',
          'prob-283-wildcard-matching'
        ]
      },
      {
        name: 'DP on Stocks',
        problemIds: [
          'prob-284-best-time-to-buy-and-sell-stock-ii',
          'prob-285-best-time-to-buy-and-sell-stock-iii',
          'prob-415-best-time-to-buy-and-sell-stock-iv',
          'prob-416-best-time-to-buy-and-sell-stock-with-cooldown',
          'prob-417-best-time-to-buy-and-sell-stock-with-transaction-fee'
        ]
      },
      {
        name: 'DP on LIS (Longest Increasing Subsequence)',
        problemIds: [
          'prob-286-longest-increasing-subsequence-lis',
          'prob-287-printing-longest-increasing-subsequence',
          'prob-288-largest-divisible-subset',
          'prob-289-longest-string-chain',
          'prob-290-longest-bitonic-subsequence',
          'prob-291-number-of-longest-increasing-subsequences'
        ]
      },
      {
        name: 'Partition DP / MCM',
        problemIds: [
          'prob-292-matrix-chain-multiplication-mcm',
          'prob-293-minimum-cost-to-cut-a-stick',
          'prob-294-burst-balloons',
          'prob-295-evaluate-boolean-expression-to-true',
          'prob-296-palindrome-partitioning-ii-minimum-cuts',
          'prob-423-palindrome-partitioning-ii-minimum-cuts',
          'prob-297-partition-array-for-maximum-sum'
        ]
      },
      {
        name: 'DP on Squares & Advanced',
        problemIds: [
          'prob-418-maximum-sum-increasing-subsequence',
          'prob-419-count-subsets-with-given-difference',
          'prob-420-target-sum-dp',
          'prob-421-coin-change-minimum-coins',
          'prob-422-russian-doll-envelopes',
          'prob-424-maximum-rectangle-area-with-all-1s-in-binary-matrix',
          'prob-425-count-square-submatrices-with-all-ones'
        ]
      }
    ]
  },
  {
    topic: 'Recursion & Backtracking',
    subtopics: [
      {
        name: 'Subsequences & Subsets',
        problemIds: [
          'prob-384-generate-all-binary-strings-without-consecutive-1s',
          'prob-120-generate-parentheses',
          'prob-121-subsets',
          'prob-122-subsets-ii-with-duplicates',
          'prob-123-combination-sum',
          'prob-124-combination-sum-ii-no-duplicates-1-use',
          'prob-125-combination-sum-iii',
          'prob-126-letter-combinations-of-a-phone-number'
        ]
      },
      {
        name: 'Permutations & Combinations',
        problemIds: [
          'prob-385-print-all-permutations-of-a-string-array',
          'prob-386-print-all-permutations-approach-2',
          'prob-470-letter-case-permutation',
          'prob-471-permutations-ii-with-duplicates',
          'prob-472-word-break-ii-all-sentences'
        ]
      },
      {
        name: 'Hard Backtracking',
        problemIds: [
          'prob-127-palindrome-partitioning',
          'prob-128-word-search-in-2d-grid',
          'prob-129-n-queens',
          'prob-130-sudoku-solver',
          'prob-131-m-coloring-problem',
          'prob-132-rat-in-a-maze-problem',
          'prob-133-word-break-print-all-ways',
          'prob-473-matchsticks-to-square',
          'prob-474-partition-to-k-equal-sum-subsets'
        ]
      }
    ]
  },
  {
    topic: 'Heap / Priority Queue',
    subtopics: [
      {
        name: 'Heap Fundamentals & Implementation',
        problemIds: [
          'prob-396-check-if-an-array-represents-a-min-heap',
          'prob-397-convert-min-heap-to-max-heap',
          'prob-398-kth-largest-element-in-an-array-min-heap',
          'prob-399-kth-smallest-element-in-an-array-max-heap'
        ]
      },
      {
        name: 'Medium Heap Problems',
        problemIds: [
          'prob-172-kth-largest-element-in-an-array',
          'prob-173-kth-smallest-element-in-an-array',
          'prob-174-sort-k-sorted-nearly-sorted-array',
          'prob-175-replace-each-element-by-its-rank-in-the-array',
          'prob-176-top-k-frequent-elements',
          'prob-177-task-scheduler',
          'prob-178-hands-of-straights',
          'prob-179-design-twitter',
          'prob-457-kth-largest-element-in-a-stream'
        ]
      },
      {
        name: 'Hard Heap Problems',
        problemIds: [
          'prob-180-merge-k-sorted-lists',
          'prob-181-find-median-from-data-stream',
          'prob-458-minimum-cost-to-connect-sticks',
          'prob-459-furthest-building-you-can-reach',
          'prob-460-reorganize-string',
          'prob-461-ipo-maximize-capital',
          'prob-462-seat-reservation-manager',
          'prob-463-minimum-number-of-refueling-stops'
        ]
      }
    ]
  },
  {
    topic: 'Greedy & Intervals',
    subtopics: [
      {
        name: 'Easy Greedy',
        problemIds: [
          'prob-182-assign-cookies',
          'prob-184-find-minimum-number-of-coins',
          'prob-400-find-minimum-number-of-coins-greedy',
          'prob-185-lemonade-change'
        ]
      },
      {
        name: 'Medium Greedy',
        problemIds: [
          'prob-183-fractional-knapsack-problem',
          'prob-186-valid-parenthesis-string',
          'prob-187-n-meetings-in-one-room',
          'prob-188-minimum-platforms-required-for-railway-station',
          'prob-189-job-sequencing-problem',
          'prob-190-candy',
          'prob-191-jump-game-i',
          'prob-192-jump-game-ii',
          'prob-193-gas-station-circular-tour'
        ]
      },
      {
        name: 'Intervals',
        problemIds: [
          'prob-194-non-overlapping-intervals',
          'prob-195-insert-interval',
          'prob-464-minimum-number-of-arrows-to-burst-balloons',
          'prob-465-meeting-rooms-can-attend-all-meetings',
          'prob-466-meeting-rooms-ii-minimum-conference-rooms',
          'prob-467-maximum-length-of-pair-chain',
          'prob-468-queue-reconstruction-by-height',
          'prob-469-patching-array'
        ]
      }
    ]
  },
  {
    topic: 'Bit Manipulation',
    subtopics: [
      {
        name: 'Bit Manipulation Basics',
        problemIds: [
          'prob-387-introduction-to-bit-manipulation-get-set-clear-bit',
          'prob-134-check-if-the-i-th-bit-is-set-or-not',
          'prob-135-check-if-a-number-is-odd-or-not',
          'prob-136-check-if-a-number-is-power-of-2',
          'prob-137-count-number-of-set-bits-number-of-1-bits',
          'prob-138-counting-bits-0-to-n',
          'prob-451-counting-bits',
          'prob-140-minimum-bit-flips-to-convert-number'
        ]
      },
      {
        name: 'XOR & Number Problems',
        problemIds: [
          'prob-139-divide-two-integers-without-or',
          'prob-141-single-number-ii-every-element-appears-3-times',
          'prob-142-single-number-iii-two-numbers-appearing-once',
          'prob-388-two-numbers-with-odd-occurrences',
          'prob-143-find-xor-of-numbers-from-l-to-r',
          'prob-450-reverse-bits',
          'prob-452-sum-of-two-integers-without-plus-minus'
        ]
      },
      {
        name: 'Advanced Bit Manipulation',
        problemIds: [
          'prob-144-power-set-using-bit-manipulation',
          'prob-453-bitwise-and-of-numbers-range',
          'prob-454-total-hamming-distance',
          'prob-455-maximum-product-of-word-lengths',
          'prob-456-gray-code'
        ]
      }
    ]
  },
  {
    topic: 'Tries',
    subtopics: [
      {
        name: 'Trie Construction & Search',
        problemIds: [
          'prob-298-implement-trie-prefix-tree',
          'prob-299-implement-trie-ii-prefix-with-counts',
          'prob-426-implement-trie-ii-prefix-tree-with-count',
          'prob-300-complete-string-longest-string-with-all-prefixes',
          'prob-301-count-distinct-substrings-using-trie',
          'prob-427-count-distinct-substrings'
        ]
      },
      {
        name: 'Advanced Trie Problems',
        problemIds: [
          'prob-302-design-add-and-search-words-data-structure',
          'prob-303-word-break-using-trie',
          'prob-475-design-add-and-search-words-data-structure',
          'prob-476-word-search-ii-boggle-solver',
          'prob-477-concatenated-words',
          'prob-478-stream-of-characters',
          'prob-479-prefix-and-suffix-search'
        ]
      },
      {
        name: 'Bitwise Trie',
        problemIds: [
          'prob-304-maximum-xor-of-two-numbers-in-an-array',
          'prob-305-maximum-xor-with-an-element-from-array-queries',
          'prob-428-maximum-xor-with-an-element-from-array'
        ]
      }
    ]
  }
];

// Check problem coverage
const assignedIds = new Set();
let totalAssigned = 0;

TAXONOMY_DEFINITIONS.forEach(tDef => {
  tDef.subtopics.forEach(sub => {
    sub.problemIds.forEach(id => {
      if (!problemMap.has(id)) {
        console.error(`ID ${id} in taxonomy not found in catalog!`);
      }
      if (assignedIds.has(id)) {
        console.error(`Duplicate ID assignment in taxonomy: ${id}`);
      }
      assignedIds.add(id);
      totalAssigned++;
    });
  });
});

console.log(`Total assigned: ${totalAssigned} of ${allProblems.length}`);

// Check for unassigned problems
const unassigned = [];
allProblems.forEach(p => {
  if (!assignedIds.has(p.id)) {
    unassigned.push(p);
  }
});

if (unassigned.length > 0) {
  console.log(`Unassigned problems (${unassigned.length}):`);
  unassigned.forEach(p => {
    console.log(`  ${p.id} | ${p.topic} | ${p.pattern} | ${p.title}`);
  });
} else {
  console.log('ALL 479 PROBLEMS PERFECTLY ASSIGNED!');
}
