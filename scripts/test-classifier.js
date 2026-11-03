const fs = require('fs');
const path = require('path');

const sheetsPath = path.join(__dirname, '../js/data/default-sheets.js');
const allProblems = require(sheetsPath);

console.log(`Loaded ${allProblems.length} problems.`);

// Function to classify any problem into its exact topic and subtopic
function getProblemSubtopic(p) {
  const topic = p.topic;
  const id = p.id;
  const title = p.title.toLowerCase();
  const pattern = (p.pattern || '').toLowerCase();

  // 1. Basics & Math
  if (topic === 'Basics & Math') {
    if (id.startsWith('prob-30') || id.startsWith('prob-31') || id.startsWith('prob-32') || title.includes('pattern')) {
      if (['prob-306', 'prob-307', 'prob-308', 'prob-309', 'prob-310', 'prob-311', 'prob-312', 'prob-313', 'prob-314', 'prob-315', 'prob-316', 'prob-317', 'prob-318', 'prob-319', 'prob-320', 'prob-321', 'prob-322', 'prob-323', 'prob-324', 'prob-325', 'prob-326', 'prob-327'].some(prefix => id.startsWith(prefix))) {
        return 'Pattern Printing';
      }
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

// Test every single problem in allProblems
const subtopicCounts = {};
allProblems.forEach(p => {
  const sub = getProblemSubtopic(p);
  const key = `${p.topic} -> ${sub}`;
  subtopicCounts[key] = (subtopicCounts[key] || 0) + 1;
});

console.log('\n--- CLASSIFICATION RESULTS ---');
Object.keys(subtopicCounts).sort().forEach(k => {
  console.log(`${k}: ${subtopicCounts[k]} problems`);
});

const totalClassified = Object.values(subtopicCounts).reduce((a, b) => a + b, 0);
console.log(`\nTotal classified: ${totalClassified} / ${allProblems.length}`);
