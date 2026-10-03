/**
 * Complete Striver's A2Z DSA Sheet + NeetCode 150 + Striver SDE + Blind 75 Master Dataset
 * Total Problems: 479
 * 100% Comprehensive & Balanced Coverage across all DSA Topics
 */

window.DEFAULT_DSA_SHEETS = [
  {
    "id": "prob-1-count-digits",
    "title": "Count Digits",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Division / Logarithm",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/count-digits5716/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Count number of digits in integer N using N % 10 or log10(N) + 1.",
    "timeComplexity": "O(log10 N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-2-reverse-a-number",
    "title": "Reverse a Number",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Modulo Arithmetic",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/reverse-integer/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "rev = rev * 10 + n % 10 with 32-bit integer overflow checks.",
    "timeComplexity": "O(log10 N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-3-check-palindrome-number",
    "title": "Check Palindrome Number",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Reverse Comparison",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/palindrome-number/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Reverse number and compare with original. Negative numbers are false.",
    "timeComplexity": "O(log10 N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-4-gcd-or-hcf-euclidean-algorithm",
    "title": "GCD Or HCF (Euclidean Algorithm)",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Euclidean Algorithm",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/lcm-and-gcd4516/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "gcd(a, b) = gcd(b, a % b) until b == 0.",
    "timeComplexity": "O(log(min(a,b)))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-5-armstrong-numbers",
    "title": "Armstrong Numbers",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Digit Powers Sum",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/armstrong-numbers2727/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Sum of digits raised to the power of number of digits equals N.",
    "timeComplexity": "O(log10 N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-6-print-all-divisors-of-a-given-number",
    "title": "Print all Divisors of a given Number",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Square Root Trial Division",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/all-divisors-of-a-number/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Iterate i from 1 to sqrt(n). If n % i == 0, divisors are i and n//i.",
    "timeComplexity": "O(sqrt(N))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-7-check-for-prime",
    "title": "Check for Prime",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Square Root Primality",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/prime-number2314/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Check if any number from 2 to sqrt(n) divides n evenly.",
    "timeComplexity": "O(sqrt(N))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-8-print-1-to-n-without-loop-recursion",
    "title": "Print 1 To N Without Loop (Recursion)",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/print-1-to-n-without-using-loops-1587115620/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Base condition i > N. Recursive call print(i+1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-9-sum-of-first-n-numbers",
    "title": "Sum of first N numbers",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Mathematical Formula / Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/sum-of-first-n-terms5843/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Formula: N * (N + 1) // 2.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-10-factorial-of-n-numbers",
    "title": "Factorial of N numbers",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/find-all-factorial-numbers-less-than-or-equal-to-n3548/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "fact(n) = n * fact(n-1). Base case fact(0) = 1.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-11-reverse-an-array",
    "title": "Reverse an Array",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Two Pointers / Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/reverse-an-array/0",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Swap l and r pointers while l < r.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-12-check-if-a-string-is-palindrome",
    "title": "Check if a String is Palindrome",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Two Pointers",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150",
      "Blind 75"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/valid-palindrome/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Compare s[i] and s[n-1-i] moving inward.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-13-fibonacci-number",
    "title": "Fibonacci Number",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Recursion / DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/fibonacci-number/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "fib(n) = fib(n-1) + fib(n-2).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-14-count-frequency-of-array-elements",
    "title": "Count Frequency of Array Elements",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Hash Map / Frequency Array",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/frequency-of-array-elements-1587115620/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Use frequency hash map or direct array indexing.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-15-find-highest-and-lowest-frequency-elements",
    "title": "Find Highest and Lowest Frequency Elements",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Hash Map Traversal",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/top-k-frequent-elements/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Map frequencies and track min_element and max_element.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-16-selection-sort",
    "title": "Selection Sort",
    "difficulty": "Easy",
    "topic": "Sorting",
    "pattern": "Minimum Element Swap",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/selection-sort/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Find minimum in remaining unsorted portion and swap with start.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-17-bubble-sort",
    "title": "Bubble Sort",
    "difficulty": "Easy",
    "topic": "Sorting",
    "pattern": "Adjacent Element Swap",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/bubble-sort/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Repeatedly swap adjacent elements if out of order with early stop flag.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-18-insertion-sort",
    "title": "Insertion Sort",
    "difficulty": "Easy",
    "topic": "Sorting",
    "pattern": "Shift to Sorted Subarray",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/insertion-sort/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Insert current element into correct position in sorted left subarray.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-19-merge-sort",
    "title": "Merge Sort",
    "difficulty": "Medium",
    "topic": "Sorting",
    "pattern": "Divide and Conquer",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/merge-sort/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Divide array in half, recursively sort, and merge two sorted halves.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-20-quick-sort",
    "title": "Quick Sort",
    "difficulty": "Medium",
    "topic": "Sorting",
    "pattern": "Partition Around Pivot",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/quick-sort/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pick pivot, partition elements smaller to left and larger to right, recurse.",
    "timeComplexity": "O(N log N) avg",
    "spaceComplexity": "O(log N)"
  },
  {
    "id": "prob-21-largest-element-in-an-array",
    "title": "Largest Element in an Array",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Single Pass Linear Scan",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/largest-element-in-array2855/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Keep max_elem initialized to nums[0], update on every iteration.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-22-second-largest-and-second-smallest",
    "title": "Second Largest and Second Smallest",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Two Variable Single Pass",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/second-largest3735/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Track largest and second_largest in single O(N) pass.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-23-check-if-array-is-sorted-and-rotated",
    "title": "Check if Array Is Sorted and Rotated",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Inflection Count",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/check-if-array-is-sorted-and-rotated/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Count pairs nums[i] > nums[(i+1)%n]. If count <= 1 -> true.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-24-remove-duplicates-from-sorted-array",
    "title": "Remove Duplicates from Sorted Array",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Two Pointers In-Place",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Slow pointer i tracks unique elements, fast pointer j scans.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-25-rotate-array-by-k-elements-left-right",
    "title": "Rotate Array by K Elements (Left / Right)",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "3-Step Array Reversal",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/rotate-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Reverse whole array, reverse 0..k-1, reverse k..n-1.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-26-move-zeroes-to-end",
    "title": "Move Zeroes to End",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Two Pointers In-Place",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/move-zeroes/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Non-zero pointer advances and swaps with next non-zero.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-27-linear-search",
    "title": "Linear Search",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Sequential Scan",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/who-will-win-1587115621/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Iterate from 0 to n-1 to find index of target element.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-28-union-of-two-sorted-arrays",
    "title": "Union of Two Sorted Arrays",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Two Pointers Merge",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/union-of-two-sorted-arrays-1587115621/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Traverse both arrays together skipping duplicates.",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(N + M)"
  },
  {
    "id": "prob-29-find-missing-number",
    "title": "Find Missing Number",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "XOR / Sum Formula",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150",
      "Blind 75"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/missing-number/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "XOR 0..N with all array elements.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-30-max-consecutive-ones",
    "title": "Max Consecutive Ones",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Running Counter",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/max-consecutive-ones/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Increment count on '1', reset to 0 on '0', track max.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-31-single-number-find-element-appearing-once",
    "title": "Single Number (Find Element Appearing Once)",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "XOR Cancellation",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150",
      "Blind 75"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/single-number/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "XOR all elements. All duplicate pairs cancel to 0.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-32-longest-subarray-with-sum-k-positives",
    "title": "Longest Subarray with Sum K (Positives)",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Sliding Window / Two Pointers",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Expand right, shrink left while sum > k.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-33-longest-subarray-with-sum-k-positives-negatives",
    "title": "Longest Subarray with Sum K (Positives + Negatives)",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Prefix Sum + Hash Map",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Store first occurrence of prefix_sum in map. Check prefix_sum - k.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-34-two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Hash Map / Complement",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/two-sum/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Map val -> index. Check target - num in O(1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-35-sort-colors-0s-1s-2s",
    "title": "Sort Colors (0s, 1s, 2s)",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Dutch National Flag (3 Pointers)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/sort-colors/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pointers low, mid, high. Swap 0 to low, 2 to high.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-36-majority-element-n-2",
    "title": "Majority Element (> N/2)",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Boyer-Moore Voting",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/majority-element/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Increment count on same candidate, decrement on different.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-37-maximum-subarray-kadane-s-algorithm",
    "title": "Maximum Subarray (Kadane's Algorithm)",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Kadane's Algorithm",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/maximum-subarray/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "running_sum += num. Reset to 0 if negative. Track max.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-38-print-maximum-subarray-sum-subarray",
    "title": "Print Maximum Subarray Sum Subarray",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Kadane with Index Tracking",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-subarray/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track start and end index whenever max_sum updates.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-39-best-time-to-buy-and-sell-stock",
    "title": "Best Time to Buy and Sell Stock",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Dynamic Min Tracking",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Track min_price seen so far and max_profit = price - min_price.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-40-rearrange-array-elements-by-sign",
    "title": "Rearrange Array Elements by Sign",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Two Pointers (Pos/Neg Index)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/rearrange-array-elements-by-sign/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Place positives at even indices (0,2,4) and negatives at odd indices (1,3,5).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-41-next-permutation",
    "title": "Next Permutation",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Lexicographical Breakpoint",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/next-permutation/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "1. Find break point from right. 2. Swap with next greater. 3. Reverse right portion.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-42-leaders-in-an-array",
    "title": "Leaders in an Array",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Right-to-Left Max Scan",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/leaders-in-an-array-1587115620/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Scan from right. Element is leader if greater than current max_from_right.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-43-longest-consecutive-sequence",
    "title": "Longest Consecutive Sequence",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Hash Set Sequence Start",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/longest-consecutive-sequence/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Only start counting if num - 1 is NOT in set to guarantee linear time.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-44-set-matrix-zeroes",
    "title": "Set Matrix Zeroes",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "In-Place Matrix Markers",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/set-matrix-zeroes/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Use row 0 and col 0 as marker flags for O(1) space.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-45-rotate-image-matrix-by-90-degrees",
    "title": "Rotate Image / Matrix by 90 Degrees",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Transpose & Reverse Rows",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/rotate-image/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Step 1: Transpose matrix in-place. Step 2: Reverse each row.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-46-spiral-matrix",
    "title": "Spiral Matrix",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "4-Boundary Traversal",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/spiral-matrix/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Traverse top, right, bottom, left while updating bounds.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-47-count-subarray-sum-equals-k",
    "title": "Count Subarray Sum Equals K",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Prefix Sum + Hash Map",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/subarray-sum-equals-k/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Store prefix_sum frequencies. Check if prefix_sum - k exists in map.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-48-pascal-s-triangle",
    "title": "Pascal's Triangle",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Row Generation",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/pascals-triangle/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Element r = prev_row[c-1] + prev_row[c].",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1) aux"
  },
  {
    "id": "prob-49-majority-element-ii-n-3",
    "title": "Majority Element II (> N/3)",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Extended Boyer-Moore (2 Candidates)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/majority-element-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track at most 2 candidates and 2 counters, then verify in second pass.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-50-3sum",
    "title": "3Sum",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Sort + Two Pointers",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/3sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort array. Loop i, skip dups, run two pointers for remaining sum.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-51-4sum",
    "title": "4Sum",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Double Loop + Two Pointers",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/4sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort array. 2 nested loops for first two elements, two pointers for last two.",
    "timeComplexity": "O(N^3)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-52-largest-subarray-with-0-sum",
    "title": "Largest Subarray with 0 Sum",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Prefix Sum Hash Map",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Store first index of each prefix sum. If same sum seen again, subarray sum is 0.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-53-count-subarrays-with-given-xor-k",
    "title": "Count Subarrays with Given XOR K",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Prefix XOR + Hash Map",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.interviewbit.com/problems/subarray-with-given-xor/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "XR ^ K property. Store prefix XOR frequency in hash map.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-54-merge-overlapping-intervals",
    "title": "Merge Overlapping Intervals",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Sorting + Interval Overlap",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/merge-intervals/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort by start time. Merge overlapping intervals (last.end = max(last.end, curr.end)).",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-55-merge-two-sorted-arrays-in-o-1-space",
    "title": "Merge Two Sorted Arrays in O(1) Space",
    "difficulty": "Hard",
    "topic": "Arrays & Hashing",
    "pattern": "Gap Method (Shell Sort) / Pointers",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/merge-sorted-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Gap = ceil((n+m)/2). Compare elements at distance gap and swap if needed.",
    "timeComplexity": "O((N+M) log(N+M))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-56-find-the-missing-and-repeating-number",
    "title": "Find the Missing and Repeating Number",
    "difficulty": "Hard",
    "topic": "Arrays & Hashing",
    "pattern": "Math Equation / XOR Bucketing",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/find-missing-and-repeating2512/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Use sum of N and sum of squares of N or XOR bit partition.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-57-count-inversions-in-an-array",
    "title": "Count Inversions in an Array",
    "difficulty": "Hard",
    "topic": "Arrays & Hashing",
    "pattern": "Modified Merge Sort",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/inversion-of-array-1587115620/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Count inversions during merge step: count += mid - i + 1.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-58-reverse-pairs",
    "title": "Reverse Pairs",
    "difficulty": "Hard",
    "topic": "Arrays & Hashing",
    "pattern": "Modified Merge Sort",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/reverse-pairs/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Count pairs nums[i] > 2*nums[j] during merge sort step before merging.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-59-maximum-product-subarray",
    "title": "Maximum Product Subarray",
    "difficulty": "Medium",
    "topic": "Arrays & Hashing",
    "pattern": "Min/Max Dynamic Prefix Tracking",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/maximum-product-subarray/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track both current_max and current_min because negative * negative = positive.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-60-binary-search-search-in-sorted-array",
    "title": "Binary Search (Search in Sorted Array)",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "Classic Binary Search",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/binary-search/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "mid = left + (right - left) // 2. Adjust bounds.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-61-implement-lower-bound",
    "title": "Implement Lower Bound",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "First Element >= Target",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/floor-in-a-sorted-array-1587115620/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Smallest index where arr[idx] >= target.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-62-implement-upper-bound",
    "title": "Implement Upper Bound",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "First Element > Target",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/ceil-the-floor2824/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Smallest index where arr[idx] > target.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-63-search-insert-position",
    "title": "Search Insert Position",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "Lower Bound",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/search-insert-position/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Returns lower bound index.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-64-first-and-last-position-of-element-in-sorted-array",
    "title": "First and Last Position of Element in Sorted Array",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Lower & Upper Bound",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Run BS twice for left and right boundaries.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-65-count-occurrences-in-sorted-array",
    "title": "Count Occurrences in Sorted Array",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "Upper Bound - Lower Bound",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/number-of-occurrence2259/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Count = last_occurrence - first_occurrence + 1.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-66-search-in-rotated-sorted-array",
    "title": "Search in Rotated Sorted Array",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Sorted Half Detection",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Identify which half is strictly sorted; check target in range.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-67-search-in-rotated-sorted-array-ii-with-duplicates",
    "title": "Search in Rotated Sorted Array II (With Duplicates)",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Trim Duplicate Bounds",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/search-in-rotated-sorted-array-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If low == mid == high, shrink low++ and high--.",
    "timeComplexity": "O(log N) avg",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-68-find-minimum-in-rotated-sorted-array",
    "title": "Find Minimum in Rotated Sorted Array",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Inflection Point BS",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If nums[mid] > nums[right], search right half. Else right = mid.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-69-single-element-in-a-sorted-array",
    "title": "Single Element in a Sorted Array",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Even/Odd Index Pair Property",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/single-element-in-a-sorted-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Before unique: (even, odd) pairs. After unique: (odd, even) pairs.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-70-find-peak-element",
    "title": "Find Peak Element",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Binary Search on Slope",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/find-peak-element/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If nums[mid] < nums[mid+1], upward slope so peak is right.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-71-square-root-of-an-integer",
    "title": "Square Root of an Integer",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "BS on Answer [1..N]",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/square-root/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "mid * mid <= n. Binary search integer square root.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-72-find-nth-root-of-integer-m",
    "title": "Find Nth Root of Integer M",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "BS on Answer [1..M]",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/find-nth-root-of-m5843/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "mid^n == m. Check with overflow protection.",
    "timeComplexity": "O(log M)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-73-koko-eating-bananas",
    "title": "Koko Eating Bananas",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "BS on Answer [1..MaxPiles]",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/koko-eating-bananas/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "BS speed range. Check total hours needed <= h.",
    "timeComplexity": "O(N log(Max Piles))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-74-minimum-days-to-make-m-bouquets",
    "title": "Minimum Days to Make M Bouquets",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "BS on Answer Days",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "BS range [min(bloomDay), max(bloomDay)]. Count consecutive bloomed flowers.",
    "timeComplexity": "O(N log(Max Day))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-75-find-the-smallest-divisor-given-a-threshold",
    "title": "Find the Smallest Divisor Given a Threshold",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "BS on Divisor [1..Max]",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "BS divisor range. Sum of ceil(num / divisor) <= threshold.",
    "timeComplexity": "O(N log(Max))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-76-capacity-to-ship-packages-within-d-days",
    "title": "Capacity To Ship Packages Within D Days",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "BS on Capacity [max(W), sum(W)]",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "BS capacity range. Check days required <= D.",
    "timeComplexity": "O(N log(Sum W))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-77-aggressive-cows",
    "title": "Aggressive Cows",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "BS on Minimum Distance",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/aggressive-cows/0",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort stalls. BS distance range [1, max-min]. Greedily place cows.",
    "timeComplexity": "O(N log N + N log D)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-78-book-allocation-problem",
    "title": "Book Allocation Problem",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "BS on Max Pages [max(P), sum(P)]",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "BS max pages per student. Check if allocated students <= k.",
    "timeComplexity": "O(N log(Sum Pages))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-79-split-array-largest-sum",
    "title": "Split Array Largest Sum",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "BS on Partition Max Sum",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/split-array-largest-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Identical to Book Allocation. Minimize maximum subarray sum.",
    "timeComplexity": "O(N log(Sum Nums))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-80-painter-s-partition-problem",
    "title": "Painter's Partition Problem",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "BS on Max Time",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/the-painters-partition-problem1535/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Identical to Book Allocation. BS max length painted by single painter.",
    "timeComplexity": "O(N log(Sum Boards))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-81-median-of-two-sorted-arrays",
    "title": "Median of Two Sorted Arrays",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "BS Partition Cut",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Partition smaller array so max_left <= min_right on both arrays.",
    "timeComplexity": "O(log(min(N, M)))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-82-k-th-element-of-two-sorted-arrays",
    "title": "K-th Element of Two Sorted Arrays",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "BS Partition Cut on K",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/k-th-element-of-two-sorted-array1317/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Binary search on partition size with bounds [max(0, k-m), min(k, n)].",
    "timeComplexity": "O(log(min(N, M)))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-83-search-a-2d-matrix",
    "title": "Search a 2D Matrix",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Virtual Flattened 1D Array",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/search-a-2d-matrix/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Treat as 1D array of size m*n. row = mid // n, col = mid % n.",
    "timeComplexity": "O(log(M * N))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-84-search-a-2d-matrix-ii",
    "title": "Search a 2D Matrix II",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "Top-Right Corner Pointer",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/search-a-2d-matrix-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Start at top-right (row 0, col n-1). Move col-- or row++.",
    "timeComplexity": "O(M + N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-85-find-a-peak-element-ii-2d-peak",
    "title": "Find a Peak Element II (2D Peak)",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "pattern": "BS on Column Maxima",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-a-peak-element-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Find max element in mid column. Compare with left and right neighbors.",
    "timeComplexity": "O(M log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-86-matrix-median-row-wise-sorted-matrix",
    "title": "Matrix Median (Row-wise Sorted Matrix)",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "BS on Value Range + Upper Bound",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix1527/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "BS on value range [min, max]. Count elements <= mid using upper bound.",
    "timeComplexity": "O(32 * M log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-87-remove-outermost-parentheses",
    "title": "Remove Outermost Parentheses",
    "difficulty": "Easy",
    "topic": "Strings",
    "pattern": "Balance Counter",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/remove-outermost-parentheses/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Track balance count. Append chars where balance > 1 for '(', balance > 0 for ')'.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-88-reverse-words-in-a-string",
    "title": "Reverse Words in a String",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "Split & Reverse / Two Pointers",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/reverse-words-in-a-string/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Split words skipping spaces, reverse list of words and join.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-89-largest-odd-number-in-string",
    "title": "Largest Odd Number in String",
    "difficulty": "Easy",
    "topic": "Strings",
    "pattern": "Right-to-Left Scan",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/largest-odd-number-in-string/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Find rightmost odd digit; substring 0 to that index is answer.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-90-longest-common-prefix",
    "title": "Longest Common Prefix",
    "difficulty": "Easy",
    "topic": "Strings",
    "pattern": "Character Matching / Sorting",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/longest-common-prefix/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Compare first and last string in sorted array or horizontal scan.",
    "timeComplexity": "O(N * M)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-91-isomorphic-strings",
    "title": "Isomorphic Strings",
    "difficulty": "Easy",
    "topic": "Strings",
    "pattern": "Two-Way Character Mapping",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/isomorphic-strings/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Map s[i] -> t[i] and t[i] -> s[i] simultaneously.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(256)"
  },
  {
    "id": "prob-92-rotate-string-check-if-a-is-rotation-of-b",
    "title": "Rotate String (Check if A is rotation of B)",
    "difficulty": "Easy",
    "topic": "Strings",
    "pattern": "Concatenation Check",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/rotate-string/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Return len(s) == len(goal) and goal in (s + s).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-93-sort-characters-by-frequency",
    "title": "Sort Characters By Frequency",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "Bucket Sort / Max-Heap",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/sort-characters-by-frequency/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Count frequencies, place in bucket array by frequency, build string.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-94-maximum-nesting-depth-of-the-parentheses",
    "title": "Maximum Nesting Depth of the Parentheses",
    "difficulty": "Easy",
    "topic": "Strings",
    "pattern": "Running Balance Counter",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-nesting-depth-of-the-parentheses/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "curr_depth++ on '(', curr_depth-- on ')', track max_depth.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-95-roman-to-integer",
    "title": "Roman to Integer",
    "difficulty": "Easy",
    "topic": "Strings",
    "pattern": "Subtractive Roman Rule",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/roman-to-integer/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "If val[i] < val[i+1], subtract val[i]. Otherwise add.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-96-integer-to-roman",
    "title": "Integer to Roman",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "Greedy Value Table Lookup",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/integer-to-roman/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Greedily subtract largest roman value from number.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-97-string-to-integer-atoi",
    "title": "String to Integer (atoi)",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "State Machine / Parsing Simulation",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/string-to-integer-atoi/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Skip leading whitespace, handle sign, parse digits with INT_MAX/MIN clamp.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-98-longest-palindromic-substring",
    "title": "Longest Palindromic Substring",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "Expand Around Center / 2D DP",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/longest-palindromic-substring/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Expand around each odd center (i) and even center (i, i+1).",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-99-count-number-of-substrings-with-k-distinct-chars",
    "title": "Count Number of Substrings with K distinct chars",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "AtMost(K) - AtMost(K - 1)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/count-number-of-substrings4528/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Count exact k distinct = atMost(k) - atMost(k-1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(26)"
  },
  {
    "id": "prob-100-minimum-add-to-make-parentheses-valid",
    "title": "Minimum Add to Make Parentheses Valid",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "Stack / Balance Tracking",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track unmatched '(' and unmatched ')'. Total = open + close.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-101-middle-of-the-linked-list",
    "title": "Middle of the Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Fast & Slow Pointers (Tortoise & Hare)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/middle-of-the-linked-list/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Slow moves 1 step, fast moves 2 steps. When fast hits end, slow is middle.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-102-reverse-linked-list",
    "title": "Reverse Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "3-Pointer Iteration (prev, curr, next)",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/reverse-linked-list/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "curr.next = prev; advance prev = curr, curr = next.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-103-linked-list-cycle-detection",
    "title": "Linked List Cycle Detection",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Floyd's Fast & Slow Pointers",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/linked-list-cycle/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "If fast and slow pointers collide, cycle exists.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-104-linked-list-cycle-ii-find-start-of-cycle",
    "title": "Linked List Cycle II (Find Start of Cycle)",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Floyd's Cycle Entry Point",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/linked-list-cycle-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Reset slow to head upon collision. Move both 1 step; meeting point is loop entry.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-105-find-length-of-loop-in-linked-list",
    "title": "Find Length of Loop in Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Fast & Slow Pointer Cycle Count",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/find-length-of-loop/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Upon meeting, keep slow fixed and count steps fast takes to return to slow.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-106-palindrome-linked-list",
    "title": "Palindrome Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Find Mid + Reverse Half",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/palindrome-linked-list/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Find middle, reverse second half, compare values from head and middle.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-107-segregate-odd-and-even-nodes-in-ll",
    "title": "Segregate Odd and Even Nodes in LL",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Two List Pointers (odd & even)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/odd-even-linked-list/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain odd and even pointers, connect odd tail to even head.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-108-remove-nth-node-from-end-of-list",
    "title": "Remove Nth Node From End of List",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Fast Pointer N Steps Ahead",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Fast pointer n steps ahead. Advance both until fast reaches end.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-109-delete-middle-node-of-linked-list",
    "title": "Delete Middle Node of Linked List",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Fast & Slow with Prev",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain prev of slow. When fast reaches end, prev.next = slow.next.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-110-sort-linked-list-merge-sort-on-ll",
    "title": "Sort Linked List (Merge Sort on LL)",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Divide and Conquer (Merge Sort)",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/sort-list/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Find middle with fast/slow, split into two lists, recursively sort and merge.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(log N)"
  },
  {
    "id": "prob-111-sort-a-ll-of-0-s-1-s-and-2-s",
    "title": "Sort a LL of 0's 1's and 2's",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "3 Dummy Heads (zero, one, two)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/given-a-linked-list-of-0s-1s-and-2s-sort-it/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Maintain zero, one, and two dummy chains, connect them together.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-112-intersection-point-of-two-linked-lists",
    "title": "Intersection Point of Two Linked Lists",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Two Pointers Pointer Swap",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/intersection-of-two-linked-lists/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "When pointer A hits end, switch to head B. Meeting node is intersection.",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-113-add-two-numbers-represented-by-ll",
    "title": "Add Two Numbers Represented by LL",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Elementary Addition with Carry",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/add-two-numbers/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sum = l1.val + l2.val + carry. Create nodes with sum % 10.",
    "timeComplexity": "O(max(N, M))",
    "spaceComplexity": "O(1) aux"
  },
  {
    "id": "prob-114-reverse-nodes-in-k-group",
    "title": "Reverse Nodes in k-Group",
    "difficulty": "Hard",
    "topic": "Linked List",
    "pattern": "K-Group Reversal Recursion",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/reverse-nodes-in-k-group/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Check if >= k nodes remain. Reverse k nodes, connect to recursive call.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-115-rotate-list",
    "title": "Rotate List",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Make Ring & Break at N-K",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/rotate-list/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Connect tail to head to form circle. Advance len - (k % len) and break connection.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-116-flattening-of-a-linked-list",
    "title": "Flattening of a Linked List",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Merge Two Sorted LL Recursion",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/flattening-a-linked-list/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Recursively flatten(head.next) and merge with head using bottom pointers.",
    "timeComplexity": "O(N * M)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-117-copy-list-with-random-pointer",
    "title": "Copy List with Random Pointer",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Interweaved Nodes / Hash Map",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/copy-list-with-random-pointer/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "1. Insert copy after original. 2. Set random pointers. 3. Separate copy list.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-118-lru-cache",
    "title": "LRU Cache",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Hash Map + Doubly Linked List",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/lru-cache/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Hash Map for O(1) key->node lookup + DLL with dummy head/tail for O(1) eviction.",
    "timeComplexity": "O(1) all ops",
    "spaceComplexity": "O(Capacity)"
  },
  {
    "id": "prob-119-lfu-cache",
    "title": "LFU Cache",
    "difficulty": "Hard",
    "topic": "Linked List",
    "pattern": "Frequency Map + DLL per Frequency",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/lfu-cache/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track min_freq, map key->node, map freq->DLL for O(1) eviction.",
    "timeComplexity": "O(1) all ops",
    "spaceComplexity": "O(Capacity)"
  },
  {
    "id": "prob-120-generate-parentheses",
    "title": "Generate Parentheses",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Backtracking with Open/Close Counts",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/generate-parentheses/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Add '(' if open < n, add ')' if close < open.",
    "timeComplexity": "O(4^N / sqrt(N))",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-121-subsets",
    "title": "Subsets",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Include / Exclude Choice Tree",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/subsets/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Branch 1: include nums[i], recurse. Branch 2: exclude nums[i], recurse.",
    "timeComplexity": "O(N * 2^N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-122-subsets-ii-with-duplicates",
    "title": "Subsets II (With Duplicates)",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Sort + Skip Adjacent Duplicates",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/subsets-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort array. Skip duplicate candidates when i > start_index.",
    "timeComplexity": "O(N * 2^N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-123-combination-sum",
    "title": "Combination Sum",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Backtracking with Element Reuse",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/combination-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Can reuse same candidate. Recurse with same index until remaining target < 0.",
    "timeComplexity": "O(2^Target)",
    "spaceComplexity": "O(Target)"
  },
  {
    "id": "prob-124-combination-sum-ii-no-duplicates-1-use",
    "title": "Combination Sum II (No Duplicates / 1 Use)",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Sort + Single Element Use",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/combination-sum-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Each number used once; skip duplicate candidates in the loop.",
    "timeComplexity": "O(2^N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-125-combination-sum-iii",
    "title": "Combination Sum III",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "K Numbers Summing to N",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/combination-sum-iii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Backtrack choosing k distinct numbers from digits 1 to 9.",
    "timeComplexity": "O(9! / (9-k)!)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-126-letter-combinations-of-a-phone-number",
    "title": "Letter Combinations of a Phone Number",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Digit to Letters Tree",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Map digits 2-9 to characters, branch on each character recursively.",
    "timeComplexity": "O(4^N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-127-palindrome-partitioning",
    "title": "Palindrome Partitioning",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Sub-String Palindrome Split",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/palindrome-partitioning/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If substring s[start:i+1] is palindrome, add to path and recurse on i+1.",
    "timeComplexity": "O(N * 2^N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-128-word-search-in-2d-grid",
    "title": "Word Search in 2D Grid",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "2D Grid DFS Backtracking",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/word-search/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "DFS 4 directions. Mark cell '#' temporarily, restore on return.",
    "timeComplexity": "O(N * M * 4^L)",
    "spaceComplexity": "O(L)"
  },
  {
    "id": "prob-129-n-queens",
    "title": "N-Queens",
    "difficulty": "Hard",
    "topic": "Recursion & Backtracking",
    "pattern": "Row Placement with Diagonal Sets",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/n-queens/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track columns, pos_diag (r+c), and neg_diag (r-c) in sets.",
    "timeComplexity": "O(N!)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-130-sudoku-solver",
    "title": "Sudoku Solver",
    "difficulty": "Hard",
    "topic": "Recursion & Backtracking",
    "pattern": "Grid Constraint Backtracking",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/sudoku-solver/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Try digits 1-9 in empty cell. Validate row, col, and 3x3 box.",
    "timeComplexity": "O(9^(empty cells))",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-131-m-coloring-problem",
    "title": "M-Coloring Problem",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Graph Vertex Coloring",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/m-coloring-problem-1587115620/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Color vertex with colors 1..M if no adjacent vertex shares color.",
    "timeComplexity": "O(M^V)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-132-rat-in-a-maze-problem",
    "title": "Rat in a Maze Problem",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Grid Matrix 4-Directional DFS",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/rat-in-a-maze-problem/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Explore D, L, R, U directions. Mark visited and restore on backtrack.",
    "timeComplexity": "O(4^(N^2))",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-133-word-break-ii-print-all-sentences",
    "title": "Word Break II (Print All Sentences)",
    "difficulty": "Hard",
    "topic": "Recursion & Backtracking",
    "pattern": "Recursion with Memoization / Trie",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/word-break-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If prefix in dict, append and recurse on suffix with memoization.",
    "timeComplexity": "O(2^N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-134-check-if-the-i-th-bit-is-set-or-not",
    "title": "Check if the i-th bit is set or not",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "Bit Shift & Bitwise AND",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/check-whether-k-th-bit-is-set-or-not-1587115620/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Check (n & (1 << i)) != 0.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-135-check-if-a-number-is-odd-or-not",
    "title": "Check if a number is Odd or not",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "n & 1",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/odd-or-even3618/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "If (n & 1) == 1, number is odd.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-136-check-if-a-number-is-power-of-2",
    "title": "Check if a number is power of 2",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "n & (n - 1)",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/power-of-two/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Power of 2 has exactly 1 set bit: n > 0 and (n & (n - 1)) == 0.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-137-count-number-of-set-bits-number-of-1-bits",
    "title": "Count number of set bits (Number of 1 Bits)",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "Brian Kernighan's Algorithm",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/number-of-1-bits/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "n = n & (n - 1) clears lowest set bit in O(count of 1s).",
    "timeComplexity": "O(1s)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-138-counting-bits-0-to-n",
    "title": "Counting Bits (0 to N)",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "dp[i] = dp[i >> 1] + (i & 1)",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/counting-bits/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Bit shift right removes last bit; add 1 if odd.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-139-divide-two-integers-without-or",
    "title": "Divide Two Integers without * or /",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Exponential Bit Shifting",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/divide-two-integers/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Subtract divisor * 2^k repeatedly using bit shifts.",
    "timeComplexity": "O(log^2 N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-140-minimum-bit-flips-to-convert-number",
    "title": "Minimum Bit Flips to Convert Number",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "XOR + Count Set Bits",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-bit-flips-to-convert-number/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Count set bits in (start ^ goal).",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-141-single-number-ii-every-element-appears-3-times",
    "title": "Single Number II (Every element appears 3 times)",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Bitwise State Counters (ones, twos)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/single-number-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "ones = (ones ^ num) & ~twos; twos = (twos ^ num) & ~ones.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-142-single-number-iii-two-numbers-appearing-once",
    "title": "Single Number III (Two Numbers Appearing Once)",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Rightmost Set Bit Partition",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/single-number-iii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "XOR all elements. Find rightmost set bit diff = xor & (-xor). Split elements.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-143-find-xor-of-numbers-from-l-to-r",
    "title": "Find XOR of numbers from L to R",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "Periodic XOR Pattern (Mod 4)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/find-xor-of-numbers-from-l-to-r/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "XOR(0..N) follows pattern based on N % 4. Ans = XOR(0..R) ^ XOR(0..L-1).",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-144-power-set-using-bit-manipulation",
    "title": "Power Set using Bit Manipulation",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Bitmask from 0 to 2^N - 1",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/subsets/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "For i from 0 to (1 << n) - 1, if j-th bit is set, include nums[j].",
    "timeComplexity": "O(N * 2^N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-145-valid-parentheses",
    "title": "Valid Parentheses",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Matching Bracket Stack",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/valid-parentheses/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Push open brackets; check and pop on matching closing bracket.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-146-min-stack",
    "title": "Min Stack",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Auxiliary Min Tracker",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/min-stack/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Store pairs (val, current_min) in stack for O(1) getMin.",
    "timeComplexity": "O(1) all ops",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-147-implement-queue-using-stacks",
    "title": "Implement Queue using Stacks",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Two Stacks (in_stack & out_stack)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/implement-queue-using-stacks/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Push to in_stack. Pop from out_stack, transfer when empty.",
    "timeComplexity": "O(1) amortized",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-148-implement-stack-using-queues",
    "title": "Implement Stack using Queues",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Single Queue Rotation",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/implement-stack-using-queues/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Push element and rotate queue len-1 times to keep top at front.",
    "timeComplexity": "O(N) push, O(1) pop",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-149-next-greater-element-i",
    "title": "Next Greater Element I",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Decreasing Stack",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/next-greater-element-i/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Traverse with monotonic stack; store next greater in hash map.",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-150-next-greater-element-ii-circular",
    "title": "Next Greater Element II (Circular)",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "2*N Monotonic Stack Loop",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/next-greater-element-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Loop 2*N - 1 down to 0 using index i % n to simulate circular array.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-151-next-smaller-element",
    "title": "Next Smaller Element",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Stack",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.interviewbit.com/problems/nearest-smaller-element/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Traverse left to right, pop elements >= current, stack top is smaller.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-152-trapping-rain-water",
    "title": "Trapping Rain Water",
    "difficulty": "Hard",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Two Pointers Max Boundaries",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/trapping-rain-water/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain left_max and right_max, advance pointer with smaller max boundary.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-153-asteroid-collision",
    "title": "Asteroid Collision",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Stack Simulation",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/asteroid-collision/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Push right-moving. For left-moving, collide with top of stack if top > 0.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-154-sum-of-subarray-minimums",
    "title": "Sum of Subarray Minimums",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Stack (PSEE & NSE)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/sum-of-subarray-minimums/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Find Previous Smaller Equal and Next Smaller Element: left_count * right_count * val.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-155-sum-of-subarray-ranges",
    "title": "Sum of Subarray Ranges",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Sum(Subarray Max) - Sum(Subarray Min)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/sum-of-subarray-ranges/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Compute sum of subarray maximums and sum of subarray minimums using monotonic stacks.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-156-remove-k-digits",
    "title": "Remove K Digits",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Increasing Stack",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/remove-k-digits/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pop stack when curr_digit < stack.top() and k > 0 to build smallest number.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-157-largest-rectangle-in-histogram",
    "title": "Largest Rectangle in Histogram",
    "difficulty": "Hard",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Increasing Stack",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pop when smaller height encountered, width = i - stack.top() - 1.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-158-maximal-rectangle-in-binary-matrix",
    "title": "Maximal Rectangle in Binary Matrix",
    "difficulty": "Hard",
    "topic": "Stack & Queue",
    "pattern": "Row-by-Row Largest Rectangle Histogram",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximal-rectangle/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Accumulate column heights row by row, call Largest Rectangle in Histogram.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-159-sliding-window-maximum",
    "title": "Sliding Window Maximum",
    "difficulty": "Hard",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Decreasing Deque",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/sliding-window-maximum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Deque stores indices with values in decreasing order. Front is max.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-160-online-stock-span",
    "title": "Online Stock Span",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Stack (price, span)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/online-stock-span/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pop while price >= stack.top().price, accumulate spans.",
    "timeComplexity": "O(1) amortized",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-161-the-celebrity-problem",
    "title": "The Celebrity Problem",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Two Pointers / Elimination Stack",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/the-celebrity-problem/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If knows(A, B) -> A is not celebrity. Eliminate to 1 candidate, verify.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-162-longest-substring-without-repeating-characters",
    "title": "Longest Substring Without Repeating Characters",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Variable Window / Hash Map Index",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Expand right. If duplicate found, jump left pointer past last occurrence.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(min(N, M))"
  },
  {
    "id": "prob-163-max-consecutive-ones-iii",
    "title": "Max Consecutive Ones III",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Sliding Window / Zero Count",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/max-consecutive-ones-iii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Allow at most k zeroes in window. Shrink left when zeroes > k.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-164-fruit-into-baskets",
    "title": "Fruit Into Baskets",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "At Most 2 Distinct Characters",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/fruit-into-baskets-1663137462/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain frequency map. Shrink left pointer when map.size > 2.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-165-longest-repeating-character-replacement",
    "title": "Longest Repeating Character Replacement",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Window Length - Max Frequency <= K",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/longest-repeating-character-replacement/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If window_len - max_count > k, shrink left pointer.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(26)"
  },
  {
    "id": "prob-166-binary-subarrays-with-sum",
    "title": "Binary Subarrays With Sum",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Exact(Goal) = AtMost(Goal) - AtMost(Goal - 1)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/binary-subarrays-with-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Helper function countAtMost(goal). Ans = atMost(goal) - atMost(goal - 1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-167-count-number-of-nice-subarrays",
    "title": "Count Number of Nice Subarrays",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "AtMost(K) - AtMost(K - 1) on Odds",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/count-number-of-nice-subarrays/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Transform evens to 0, odds to 1. Identical to Binary Subarrays With Sum.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-168-number-of-substrings-containing-all-three-characters",
    "title": "Number of Substrings Containing All Three Characters",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Min of Last Seen Indices of a, b, c",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/number-of-substrings-containing-all-three-characters/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "For each index, valid substrings ending at i = 1 + min(last_a, last_b, last_c).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-169-maximum-points-you-can-obtain-from-cards",
    "title": "Maximum Points You Can Obtain from Cards",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Fixed Window of Size N - K",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Total sum minus minimum subarray sum of length n - k.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-170-subarrays-with-k-different-integers",
    "title": "Subarrays with K Different Integers",
    "difficulty": "Hard",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "AtMost(K) - AtMost(K - 1)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/subarrays-with-k-different-integers/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Count subarrays with exactly k distinct using atMost(k) - atMost(k-1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-171-minimum-window-substring",
    "title": "Minimum Window Substring",
    "difficulty": "Hard",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Match Counter Variable Window",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/minimum-window-substring/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Expand right until all required chars matched, shrink left to minimize window.",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-172-kth-largest-element-in-an-array",
    "title": "Kth Largest Element in an Array",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Min-Heap of Size K / QuickSelect",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Min-Heap of size k in O(N log K) or QuickSelect for O(N) average.",
    "timeComplexity": "O(N) avg",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-173-kth-smallest-element-in-an-array",
    "title": "Kth Smallest Element in an Array",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Max-Heap of Size K",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/kth-smallest-element5635/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Max-Heap of size k storing smallest elements.",
    "timeComplexity": "O(N log K)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-174-sort-k-sorted-nearly-sorted-array",
    "title": "Sort K-Sorted (Nearly Sorted) Array",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Min-Heap of Size K + 1",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/nearly-sorted-1587115620/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Push k+1 elements to Min-Heap. Pop smallest into array sequentially.",
    "timeComplexity": "O(N log K)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-175-k-closest-points-to-origin",
    "title": "K Closest Points to Origin",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Max-Heap of Size K",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/k-closest-points-to-origin/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain Max-Heap of size k storing (dist, x, y). Pop largest when size > k.",
    "timeComplexity": "O(N log K)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-176-top-k-frequent-elements",
    "title": "Top K Frequent Elements",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Bucket Sort / Min-Heap",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/top-k-frequent-elements/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Count frequencies -> Bucket Sort array where index = count.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-177-task-scheduler",
    "title": "Task Scheduler",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Max Frequency Idle Slot Math / Max-Heap",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/task-scheduler/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Formula: max(len(tasks), (max_freq - 1) * (n + 1) + max_freq_count).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(26)"
  },
  {
    "id": "prob-178-hands-of-straights",
    "title": "Hands of Straights",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Min-Heap + Frequency Map",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/hand-of-straights/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pop smallest available card and verify group_size consecutive cards exist.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-179-design-twitter",
    "title": "Design Twitter",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Merge K Sorted Recent Feeds (Max-Heap)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/design-twitter/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "User follow map + Max-Heap merging 10 most recent tweets across followed users.",
    "timeComplexity": "O(K log U)",
    "spaceComplexity": "O(Users + Tweets)"
  },
  {
    "id": "prob-180-merge-k-sorted-lists",
    "title": "Merge k Sorted Lists",
    "difficulty": "Hard",
    "topic": "Heap / Priority Queue",
    "pattern": "Min-Heap of Head Nodes",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/merge-k-sorted-lists/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Push heads of k lists to Min-Heap. Pop smallest, append to result, push next.",
    "timeComplexity": "O(N log K)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-181-find-median-from-data-stream",
    "title": "Find Median from Data Stream",
    "difficulty": "Hard",
    "topic": "Heap / Priority Queue",
    "pattern": "Two Heaps (Max-Heap Small, Min-Heap Large)",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/find-median-from-data-stream/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Balance size diff <= 1. Median is top of larger heap or average of both tops.",
    "timeComplexity": "O(log N) insert, O(1) findMedian",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-182-assign-cookies",
    "title": "Assign Cookies",
    "difficulty": "Easy",
    "topic": "Greedy & Intervals",
    "pattern": "Two Pointers Greedily Satisfy Children",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/assign-cookies/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Sort greed factors and cookie sizes. Give smallest viable cookie.",
    "timeComplexity": "O(N log N + M log M)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-183-fractional-knapsack-problem",
    "title": "Fractional Knapsack Problem",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Sort by Value/Weight Ratio",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort items by value/weight descending. Take full items, then fraction of last.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-184-find-minimum-number-of-coins",
    "title": "Find Minimum Number of Coins",
    "difficulty": "Easy",
    "topic": "Greedy & Intervals",
    "pattern": "Greedy Coin Selection",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/min-coin5549/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Iterate from largest denomination down, take maximum possible of each.",
    "timeComplexity": "O(V)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-185-lemonade-change",
    "title": "Lemonade Change",
    "difficulty": "Easy",
    "topic": "Greedy & Intervals",
    "pattern": "Count $5 and $10 Bills",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/lemonade-change/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "For $20 change, greedily give $10 + $5 over 3 $5s.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-186-valid-parenthesis-string-with-wildcard",
    "title": "Valid Parenthesis String with Wildcard (*)",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Min/Max Open Balance Range",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/valid-parenthesis-string/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track min_open and max_open possible balances. If max_open < 0 -> false.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-187-n-meetings-in-one-room",
    "title": "N Meetings in One Room",
    "difficulty": "Easy",
    "topic": "Greedy & Intervals",
    "pattern": "Sort by End Time",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/n-meetings-in-one-room-1587115620/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Sort meetings by end time. Pick meeting if start_time > last_end_time.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-188-minimum-platforms-required-for-railway",
    "title": "Minimum Platforms Required for Railway",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Sort Arrivals and Departures Separately",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort arr and dep. If arr[i] <= dep[j], plat++, i++; else plat--, j++.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-189-job-sequencing-problem-with-deadlines",
    "title": "Job Sequencing Problem with Deadlines",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Sort by Profit + Disjoint Slots",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/job-sequencing-problem-1587115620/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort by profit descending. Place job in latest available slot <= deadline.",
    "timeComplexity": "O(N log N + N * MaxDead)",
    "spaceComplexity": "O(MaxDead)"
  },
  {
    "id": "prob-190-candy-distribute-minimum-candies",
    "title": "Candy (Distribute Minimum Candies)",
    "difficulty": "Hard",
    "topic": "Greedy & Intervals",
    "pattern": "Left-to-Right & Right-to-Left Passes",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/candy/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pass 1: if ratings[i] > ratings[i-1] -> c[i] = c[i-1] + 1. Pass 2 from right.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-191-jump-game",
    "title": "Jump Game",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Greedy Goal Shift / Max Reach",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/jump-game/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Iterate backwards: if i + nums[i] >= goal, goal = i. Check goal == 0.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-192-jump-game-ii-minimum-jumps",
    "title": "Jump Game II (Minimum Jumps)",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "BFS Level Interval Greedy",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/jump-game-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Compute farthest reachable in current jump interval (l, r), advance window.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-193-gas-station-circular-tour",
    "title": "Gas Station (Circular Tour)",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Running Tank Reset",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Blind 75"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/gas-station/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If sum(gas) < sum(cost) return -1. If current_tank < 0, start = i + 1, reset tank = 0.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-194-non-overlapping-intervals",
    "title": "Non-overlapping Intervals",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Greedy Earliest Finish Time",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/non-overlapping-intervals/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort by end time. Always retain interval finishing earliest.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-195-insert-interval",
    "title": "Insert Interval",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Linear Interval Merge",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/insert-interval/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Add left non-overlapping. Merge all overlapping with newInterval. Append remainder.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-196-invert-binary-tree",
    "title": "Invert Binary Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "DFS Tree Inversion",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/invert-binary-tree/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Swap root.left and root.right; recurse left and right.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-197-maximum-depth-of-binary-tree",
    "title": "Maximum Depth of Binary Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "Postorder DFS / BFS Level Order",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "1 + max(maxDepth(left), maxDepth(right)).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-198-diameter-of-binary-tree",
    "title": "Diameter of Binary Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "Postorder DFS / Height Sum",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/diameter-of-binary-tree/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "diameter = left_height + right_height. Return 1 + max(lh, rh).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-199-balanced-binary-tree",
    "title": "Balanced Binary Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "Bottom-Up Height DFS",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/balanced-binary-tree/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Return -1 if subtree is unbalanced (|left_h - right_h| > 1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-200-same-tree",
    "title": "Same Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "Simultaneous DFS",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/same-tree/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "If both null -> true. If vals differ or one null -> false. Recurse left & right.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-201-symmetric-tree",
    "title": "Symmetric Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "Mirror DFS (t1.left == t2.right)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/symmetric-tree/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Check isMirror(t1.left, t2.right) and isMirror(t1.right, t2.left).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-202-binary-tree-level-order-traversal",
    "title": "Binary Tree Level Order Traversal",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BFS Level Queue",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Process queue level-by-level with inner loop of size queue.length.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-203-binary-tree-zigzag-level-order-traversal",
    "title": "Binary Tree Zigzag Level Order Traversal",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BFS with Left-to-Right Flag Toggle",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Alternate row insertion direction (normal vs reversed) per level.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-204-boundary-traversal-of-binary-tree",
    "title": "Boundary Traversal of Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Left Boundary + Leaves + Right Boundary",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/boundary-traversal-of-binary-tree/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Traverse left boundary (no leaves), all leaf nodes via DFS, right boundary upwards.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-205-vertical-order-traversal-of-a-binary-tree",
    "title": "Vertical Order Traversal of a Binary Tree",
    "difficulty": "Hard",
    "topic": "Binary Trees & BST",
    "pattern": "Coordinate BFS (x, y, val)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Map col -> row -> multiset of values. Traverse by column left to right.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-206-top-view-of-binary-tree",
    "title": "Top View of Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BFS Column Map (First Node Seen)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/top-view-of-binary-tree/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Queue stores (node, line). Store first node at each line coordinate.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-207-bottom-view-of-binary-tree",
    "title": "Bottom View of Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BFS Column Map (Last Node Overwrite)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/bottom-view-of-binary-tree/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Queue stores (node, line). Overwrite map with latest node at each line.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-208-binary-tree-right-side-view",
    "title": "Binary Tree Right Side View",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Reverse Preorder (Root -> Right -> Left)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/binary-tree-right-side-view/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "First node visited at each depth level in Root->Right->Left DFS is added to result.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-209-lowest-common-ancestor-of-a-binary-tree",
    "title": "Lowest Common Ancestor of a Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Postorder DFS",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If node == p or q or null return node. If both left and right return non-null, root is LCA.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-210-binary-tree-maximum-path-sum",
    "title": "Binary Tree Maximum Path Sum",
    "difficulty": "Hard",
    "topic": "Binary Trees & BST",
    "pattern": "Postorder DFS with Global Max",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Global max = max(global, left_gain + right_gain + val). Return val + max(left, right).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-211-construct-tree-from-preorder-and-inorder",
    "title": "Construct Tree from Preorder and Inorder",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Preorder Root + Inorder Partition",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Preorder root partitions inorder array into left and right subtrees.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-212-construct-tree-from-postorder-and-inorder",
    "title": "Construct Tree from Postorder and Inorder",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Postorder Root + Inorder Partition",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Postorder root partitions inorder array. Build right child first, then left.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-213-serialize-and-deserialize-binary-tree",
    "title": "Serialize and Deserialize Binary Tree",
    "difficulty": "Hard",
    "topic": "Binary Trees & BST",
    "pattern": "Preorder Token Iterator",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Preorder string with '#' for nulls. Deserialize using iterator.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-214-flatten-binary-tree-to-linked-list",
    "title": "Flatten Binary Tree to Linked List",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Reverse Postorder / Morris Traversal",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "curr.right = prev, curr.left = null; prev = curr in right->left->root DFS.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1) aux"
  },
  {
    "id": "prob-215-search-in-a-binary-search-tree",
    "title": "Search in a Binary Search Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "BST Binary Search",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/search-in-a-binary-search-tree/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "If target < root.val go left; if target > root.val go right.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-216-ceil-floor-in-a-bst",
    "title": "Ceil / Floor in a BST",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BST Range Traversal",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/implementing-ceil-in-bst/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track ceil/floor candidate and branch left or right accordingly.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-217-insert-a-given-node-in-bst",
    "title": "Insert a given Node in BST",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BST Leaf Insertion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/insert-into-a-binary-search-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Traverse BST until null position found and attach new TreeNode.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-218-delete-a-node-in-bst",
    "title": "Delete a Node in BST",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BST Node Re-linking / Inorder Successor",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/delete-node-in-a-bst/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Replace deleted node with right child, attach deleted node's left to right child's leftmost node.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-219-kth-smallest-element-in-a-bst",
    "title": "Kth Smallest Element in a BST",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Inorder Traversal Counter",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "BST inorder traversal produces sorted values. Stop when k elements visited.",
    "timeComplexity": "O(H + K)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-220-validate-binary-search-tree",
    "title": "Validate Binary Search Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Range Validation (min_val, max_val)",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/validate-binary-search-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pass valid range down recursion: min_val < node.val < max_val.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-221-lowest-common-ancestor-of-a-bst",
    "title": "Lowest Common Ancestor of a BST",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BST Split Property",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If p, q < root go left; if p, q > root go right; otherwise root is split LCA.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-222-construct-bst-from-preorder-traversal",
    "title": "Construct BST from Preorder Traversal",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Upper Bound Bound DFS",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Pass upper bound down recursive calls. If pre[i] < bound, create node.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-223-binary-search-tree-iterator",
    "title": "Binary Search Tree Iterator",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Stack Inorder Traversal",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/binary-search-tree-iterator/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Push all left children to stack for O(1) amortized next() and O(H) space.",
    "timeComplexity": "O(1) avg",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-224-two-sum-iv-input-is-a-bst",
    "title": "Two Sum IV - Input is a BST",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "Two BST Iterators (Next & Before)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/two-sum-iv-input-is-a-bst/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Two BST Iterators acting as left and right pointers in O(H) space.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-225-recover-binary-search-tree",
    "title": "Recover Binary Search Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Inorder Swapped Nodes Detection",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/recover-binary-search-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track first, middle, and last anomaly in inorder traversal and swap values.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-226-number-of-provinces",
    "title": "Number of Provinces",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Connected Components (DFS / DSU)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/number-of-provinces/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Count connected components in undirected adjacency matrix using DFS or Disjoint Set.",
    "timeComplexity": "O(V^2)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-227-number-of-islands",
    "title": "Number of Islands",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Grid BFS / DFS / Flood Fill",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/number-of-islands/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sink connected '1's to '0' using BFS/DFS when land found.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-228-flood-fill",
    "title": "Flood Fill",
    "difficulty": "Easy",
    "topic": "Graphs",
    "pattern": "Grid DFS / BFS Color Fill",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/flood-fill/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Change color of starting pixel and recursively flood adjacent matching pixels.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-229-rotting-oranges",
    "title": "Rotting Oranges",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Multi-Source BFS Level Order",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/rotting-oranges/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Push all initial rotten oranges to queue. Run multi-source BFS minute by minute.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-230-0-1-matrix-distance-to-nearest-0",
    "title": "0/1 Matrix (Distance to Nearest 0)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Multi-Source BFS from Zeroes",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/01-matrix/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Push all 0s into queue with distance 0. Run multi-source BFS.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-231-surrounded-regions-capture-o-s",
    "title": "Surrounded Regions (Capture 'O's)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Boundary DFS Unflippable 'O's",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/surrounded-regions/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "DFS from boundary 'O's marking them safe. Flip remaining unvisited 'O's to 'X'.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-232-number-of-enclaves",
    "title": "Number of Enclaves",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Boundary Flood Fill",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/number-of-enclaves/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Flood fill from grid borders. Count remaining unvisited land cells.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-233-word-ladder",
    "title": "Word Ladder",
    "difficulty": "Hard",
    "topic": "Graphs",
    "pattern": "BFS Shortest Transformation Path",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/word-ladder/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Queue BFS: for current word, change each character a-z, check if in wordSet.",
    "timeComplexity": "O(N * L * 26)",
    "spaceComplexity": "O(N * L)"
  },
  {
    "id": "prob-234-is-graph-bipartite",
    "title": "Is Graph Bipartite?",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "2-Coloring BFS/DFS",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/is-graph-bipartite/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Color nodes 0 and 1. If adjacent node has same color, graph is NOT bipartite.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-235-course-schedule-cycle-detection-in-directed-graph",
    "title": "Course Schedule (Cycle Detection in Directed Graph)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Topological Sort / Kahn's In-Degree BFS",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/course-schedule/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Kahn's BFS: if number of processed nodes with in-degree 0 == V -> No cycle.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-236-course-schedule-ii-task-order",
    "title": "Course Schedule II (Task Order)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Kahn's Topological Ordering",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/course-schedule-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Push 0 in-degree nodes into order list. If size < V, return empty list.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-237-find-eventual-safe-states",
    "title": "Find Eventual Safe States",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Reverse Graph Topological Sort",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-eventual-safe-states/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Reverse edges and run Kahn's algorithm starting from out-degree 0 nodes.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-238-alien-dictionary",
    "title": "Alien Dictionary",
    "difficulty": "Hard",
    "topic": "Graphs",
    "pattern": "Topological Sort on Character Graph",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/alien-dictionary/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Compare adjacent words for first differing char to build directed graph. Run Kahn's BFS.",
    "timeComplexity": "O(Total Chars)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-239-shortest-path-in-directed-acyclic-graph-dag",
    "title": "Shortest Path in Directed Acyclic Graph (DAG)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Topological Sort + Relaxation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/shortest-path-in-undirected-graph/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Find topological sort. Relax edges in topological order in linear time.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-240-dijkstra-s-algorithm-shortest-path",
    "title": "Dijkstra's Algorithm (Shortest Path)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Priority Queue (Min-Heap)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/implementing-dijkstra-set-1-adjacency-matrix/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Min-Heap stores (dist, node). Greedily pop shortest distance and relax neighbors.",
    "timeComplexity": "O(E log V)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-241-shortest-path-in-binary-matrix",
    "title": "Shortest Path in Binary Matrix",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "8-Directional BFS",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/shortest-path-in-binary-matrix/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Queue BFS from (0,0) to (n-1, n-1) with unit weight.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-242-path-with-minimum-effort",
    "title": "Path With Minimum Effort",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Dijkstra on 2D Matrix Max Height Diff",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/path-with-minimum-effort/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Dijkstra where edge weight is max(current_effort, abs(h1 - h2)).",
    "timeComplexity": "O(M * N log(M * N))",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-243-cheapest-flights-within-k-stops",
    "title": "Cheapest Flights Within K Stops",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Bellman-Ford / Modified BFS",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Run Bellman-Ford k+1 times using copy of previous distance array.",
    "timeComplexity": "O(K * E)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-244-network-delay-time",
    "title": "Network Delay Time",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Dijkstra's Shortest Path (Min-Heap)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/network-delay-time/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Standard Dijkstra using Min-Heap. Max of all shortest distances is network delay.",
    "timeComplexity": "O(E log V)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-245-minimum-spanning-tree-prim-s-algorithm",
    "title": "Minimum Spanning Tree (Prim's Algorithm)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Prim's Algorithm (Min-Heap)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-spanning-tree/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Min-Heap stores (weight, node, parent). Greedily pick smallest non-visited edge.",
    "timeComplexity": "O(E log E)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-246-kruskal-s-algorithm-mst-using-dsu",
    "title": "Kruskal's Algorithm (MST using DSU)",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Sort Edges + Disjoint Set",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-spanning-tree/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort edges by weight. Add edge to MST if findRoot(u) != findRoot(v).",
    "timeComplexity": "O(E log E)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-247-redundant-connection",
    "title": "Redundant Connection",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Disjoint Set Union (DSU)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/redundant-connection/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Union-Find. If two nodes have same parent before union, that edge forms a cycle.",
    "timeComplexity": "O(E * alpha(V))",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-248-number-of-operations-to-make-network-connected",
    "title": "Number of Operations to Make Network Connected",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Disjoint Set / Component Count",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/number-of-operations-to-make-network-connected/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If edges < n - 1 -> -1. Result is (connected_components - 1).",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-249-most-stones-removed-with-same-row-or-column",
    "title": "Most Stones Removed with Same Row or Column",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Disjoint Set on Coordinates",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Union row and col+offset for each stone. Stones removed = Total - Unique Sets.",
    "timeComplexity": "O(N * alpha(N))",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-250-accounts-merge",
    "title": "Accounts Merge",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Disjoint Set Union on Emails",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/accounts-merge/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Map each email to account id, union ids sharing emails, group and sort.",
    "timeComplexity": "O(N * M log(N * M))",
    "spaceComplexity": "O(N * M)"
  },
  {
    "id": "prob-251-making-a-large-island",
    "title": "Making a Large Island",
    "difficulty": "Hard",
    "topic": "Graphs",
    "pattern": "DSU Island Sizes + 4-Way Flip Check",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/making-a-large-island/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Color each island and record area. For each '0', sum areas of distinct neighboring islands + 1.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-252-bridges-in-graph-tarjan-s-algorithm",
    "title": "Bridges in Graph (Tarjan's Algorithm)",
    "difficulty": "Hard",
    "topic": "Graphs",
    "pattern": "Tarjan's DFS with Time of Insertion & Low",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/critical-connections-in-a-network/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If low[neighbor] > tin[node], edge (node, neighbor) is a bridge.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-253-strongly-connected-components-kosaraju-s-algorithm",
    "title": "Strongly Connected Components (Kosaraju's Algorithm)",
    "difficulty": "Hard",
    "topic": "Graphs",
    "pattern": "Kosaraju's 3-Step Algorithm",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/strongly-connected-components-kosarajus-algo/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "1. Sort by finish time (DFS stack). 2. Transpose graph. 3. DFS in stack order.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V + E)"
  },
  {
    "id": "prob-254-climbing-stairs",
    "title": "Climbing Stairs",
    "difficulty": "Easy",
    "topic": "Dynamic Programming",
    "pattern": "Fibonacci DP (dp[i] = dp[i-1] + dp[i-2])",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/climbing-stairs/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "dp[i] = dp[i-1] + dp[i-2]. 2-variable space optimization.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-255-frog-jump-geek-jump",
    "title": "Frog Jump (Geek Jump)",
    "difficulty": "Easy",
    "topic": "Dynamic Programming",
    "pattern": "1D DP with 1 & 2 Step Choices",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/geek-jump/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "dp[i] = min(dp[i-1] + abs(h[i]-h[i-1]), dp[i-2] + abs(h[i]-h[i-2])).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-256-house-robber",
    "title": "House Robber",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Include / Exclude DP",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/house-robber/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "rob = max(rob1 + num, rob2). Slide 2 variables forward.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-257-house-robber-ii-circular",
    "title": "House Robber II (Circular)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Circular Partition DP",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/house-robber-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Max of House Robber on nums[0...n-2] and nums[1...n-1].",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-258-ninja-s-training-2d-activity-dp",
    "title": "Ninja's Training (2D Activity DP)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D DP with Prev Activity Constraint",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/geeks-training/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[day][last] = max(points[day][task] + dp[day-1][task]) for task != last.",
    "timeComplexity": "O(N * 4 * 3)",
    "spaceComplexity": "O(4)"
  },
  {
    "id": "prob-259-unique-paths-in-grid",
    "title": "Unique Paths in Grid",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D Grid DP Transitions",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/unique-paths/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[r][c] = dp[r+1][c] + dp[r][c+1]. Reduce to 1D row array of size n.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-260-unique-paths-ii-with-obstacles",
    "title": "Unique Paths II (With Obstacles)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D Grid DP with 0 on Obstacle",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/unique-paths-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If grid[r][c] == 1 -> dp[c] = 0. Else dp[c] += dp[c-1].",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-261-minimum-path-sum-in-grid",
    "title": "Minimum Path Sum in Grid",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D Grid Min Cost DP",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-path-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-262-triangle-minimum-path-sum",
    "title": "Triangle Minimum Path Sum",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Bottom-Up Triangle DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/triangle/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Start from bottom row: dp[j] = triangle[i][j] + min(dp[j], dp[j+1]).",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-263-minimum-falling-path-sum",
    "title": "Minimum Falling Path Sum",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D Grid Falling Path DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-falling-path-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[i][j] = matrix[i][j] + min(dp[i-1][j-1], dp[i-1][j], dp[i-1][j+1]).",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-264-cherry-pickup-ii-3d-dp",
    "title": "Cherry Pickup II (3D DP)",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "3D DP (row, c1, c2)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/cherry-pickup-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp(r, c1, c2) where both robots move down simultaneously across 3 directions.",
    "timeComplexity": "O(R * C * C * 9)",
    "spaceComplexity": "O(C * C)"
  },
  {
    "id": "prob-265-subset-sum-problem",
    "title": "Subset Sum Problem",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "0/1 Knapsack Boolean DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/subset-sum-problem-1611555638/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[target] = dp[target] or dp[target - num]. Space optimize to 1D array.",
    "timeComplexity": "O(N * Target)",
    "spaceComplexity": "O(Target)"
  },
  {
    "id": "prob-266-partition-equal-subset-sum",
    "title": "Partition Equal Subset Sum",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "0/1 Knapsack (Target = Sum / 2)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/partition-equal-subset-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If sum is odd -> false. Target = sum // 2. Boolean 0/1 knapsack.",
    "timeComplexity": "O(N * Target)",
    "spaceComplexity": "O(Target)"
  },
  {
    "id": "prob-267-partition-array-into-two-arrays-to-minimize-sum-difference",
    "title": "Partition Array Into Two Arrays to Minimize Sum Difference",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Meet in the Middle / DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/partition-array-into-two-arrays-to-minimize-sum-difference/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Generate subset sums of first and second halves, binary search complement.",
    "timeComplexity": "O(2^(N/2) * N)",
    "spaceComplexity": "O(2^(N/2))"
  },
  {
    "id": "prob-268-count-subsets-with-sum-k",
    "title": "Count Subsets with Sum K",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "0/1 Knapsack Sum Ways Counter",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/perfect-sum-problem5633/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[target] += dp[target - num]. Handles zeros correctly.",
    "timeComplexity": "O(N * Target)",
    "spaceComplexity": "O(Target)"
  },
  {
    "id": "prob-269-0-1-knapsack-problem",
    "title": "0/1 Knapsack Problem",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "0/1 Knapsack Classic",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[w] = max(dp[w], val + dp[w - wt]) iterating w backwards from W to wt.",
    "timeComplexity": "O(N * W)",
    "spaceComplexity": "O(W)"
  },
  {
    "id": "prob-270-target-sum",
    "title": "Target Sum",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Convert to Subset Sum S1 = (Total + Target) / 2",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/target-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Subset partition formula S1 = (total_sum + target) // 2.",
    "timeComplexity": "O(N * S1)",
    "spaceComplexity": "O(S1)"
  },
  {
    "id": "prob-271-coin-change-minimum-coins",
    "title": "Coin Change (Minimum Coins)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Unbounded Knapsack / Min Cost",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/coin-change/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[a] = min(dp[a], 1 + dp[a - coin]) for all coin <= a.",
    "timeComplexity": "O(Amount * N)",
    "spaceComplexity": "O(Amount)"
  },
  {
    "id": "prob-272-coin-change-ii-number-of-ways",
    "title": "Coin Change II (Number of Ways)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Unbounded Knapsack / Combinations",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/coin-change-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[a] += dp[a - coin]. Outer loop over coins prevents duplicate permutations.",
    "timeComplexity": "O(Amount * N)",
    "spaceComplexity": "O(Amount)"
  },
  {
    "id": "prob-273-unbounded-knapsack-rod-cutting",
    "title": "Unbounded Knapsack (Rod Cutting)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Unbounded Knapsack Max Value",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/rod-cutting0840/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[len] = max(dp[len], price[i] + dp[len - (i+1)]).",
    "timeComplexity": "O(N * N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-274-longest-common-subsequence-lcs",
    "title": "Longest Common Subsequence (LCS)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D String Grid Matching",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/longest-common-subsequence/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If s1[i] == s2[j] -> 1 + dp[i+1][j+1]. Else max(dp[i+1][j], dp[i][j+1]).",
    "timeComplexity": "O(N * M)",
    "spaceComplexity": "O(N * M)"
  },
  {
    "id": "prob-275-print-longest-common-subsequence",
    "title": "Print Longest Common Subsequence",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Backtrack from DP Table",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/print-all-lcs-sequences3413/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Follow DP table pointers: if chars match, prepend char and move diagonally.",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(N * M)"
  },
  {
    "id": "prob-276-longest-palindromic-subsequence",
    "title": "Longest Palindromic Subsequence",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "LCS(s, reverse(s))",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/longest-palindromic-subsequence/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "LPS is simply Longest Common Subsequence between string and its reverse.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-277-minimum-insertions-to-make-string-palindrome",
    "title": "Minimum Insertions to Make String Palindrome",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "N - LPS(s)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Answer = len(s) - LongestPalindromicSubsequence(s).",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-278-shortest-common-supersequence",
    "title": "Shortest Common Supersequence",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "LCS Table Backtracking",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/shortest-common-supersequence/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Construct LCS DP table, include non-matching chars from both strings and matching once.",
    "timeComplexity": "O(N * M)",
    "spaceComplexity": "O(N * M)"
  },
  {
    "id": "prob-279-distinct-subsequences",
    "title": "Distinct Subsequences",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "2D String Subsequence Matching",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/distinct-subsequences/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If s[i] == t[j] -> dp[j] += dp[j-1].",
    "timeComplexity": "O(N * M)",
    "spaceComplexity": "O(M)"
  },
  {
    "id": "prob-280-edit-distance",
    "title": "Edit Distance",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "String Alignment (Insert/Delete/Replace)",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/edit-distance/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If chars match -> dp[i-1][j-1]. Else 1 + min(insert, delete, replace).",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)"
  },
  {
    "id": "prob-281-wildcard-matching",
    "title": "Wildcard Matching",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "2D Pattern DP with '*' and '?'",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/wildcard-matching/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If p[j]=='*' -> dp[i][j] = dp[i-1][j] (match 1+) or dp[i][j-1] (match 0).",
    "timeComplexity": "O(N * M)",
    "spaceComplexity": "O(M)"
  },
  {
    "id": "prob-282-best-time-to-buy-and-sell-stock-ii-infinite-transactions",
    "title": "Best Time to Buy and Sell Stock II (Infinite Transactions)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Greedy Sum of Positive Spreads / DP",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Accumulate profit += max(0, prices[i] - prices[i-1]).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-283-best-time-to-buy-and-sell-stock-iii-at-most-2-transactions",
    "title": "Best Time to Buy and Sell Stock III (At most 2 transactions)",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "DP with State (buy1, sell1, buy2, sell2)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain max profit after first buy, first sell, second buy, second sell.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-284-best-time-to-buy-and-sell-stock-iv-at-most-k-transactions",
    "title": "Best Time to Buy and Sell Stock IV (At most K transactions)",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "3D DP (day, tx_count, holding)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[k][holding] tracking transitions across k buys and sells.",
    "timeComplexity": "O(N * K)",
    "spaceComplexity": "O(K)"
  },
  {
    "id": "prob-285-best-time-to-buy-and-sell-stock-with-cooldown",
    "title": "Best Time to Buy and Sell Stock with Cooldown",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "State Machine (buying, selling, cooldown)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Must wait 1 day after selling before buying again.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-286-longest-increasing-subsequence-lis",
    "title": "Longest Increasing Subsequence (LIS)",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Patience Sorting (Binary Search)",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/longest-increasing-subsequence/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain tails array with binary search (bisect_left) in O(N log N).",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-287-print-longest-increasing-subsequence",
    "title": "Print Longest Increasing Subsequence",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "DP Parent Hash Backtracking",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/printing-longest-increasing-subsequence/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain hash array storing parent index of each element in LIS, trace back.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-288-largest-divisible-subset",
    "title": "Largest Divisible Subset",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Sort + LIS Divisibility Condition",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/largest-divisible-subset/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort array. dp[i] = max(dp[j] + 1) where nums[i] % nums[j] == 0.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-289-longest-string-chain",
    "title": "Longest String Chain",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Sort by Length + Word Predecessor DP",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/longest-string-chain/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort words by length. For each word, delete 1 char and check predecessor in map.",
    "timeComplexity": "O(N log N + N * L^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-290-longest-bitonic-subsequence",
    "title": "Longest Bitonic Subsequence",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "LIS from Left + LIS from Right",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/longest-bitonic-subsequence0824/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Ans = max(lis_left[i] + lis_right[i] - 1) for all peak candidates i.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-291-number-of-longest-increasing-subsequences",
    "title": "Number of Longest Increasing Subsequences",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "LIS with Count Array",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/number-of-longest-increasing-subsequence/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Maintain length[i] and count[i] arrays, sum counts of max length.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-292-matrix-chain-multiplication-mcm",
    "title": "Matrix Chain Multiplication (MCM)",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Partition DP (i to k, k+1 to j)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[i][j] = min(dp[i][k] + dp[k+1][j] + arr[i-1]*arr[k]*arr[j]) for k from i to j-1.",
    "timeComplexity": "O(N^3)",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-293-cost-to-cut-a-stick",
    "title": "Cost to Cut a Stick",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Partition DP on Sorted Cuts",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-cost-to-cut-a-stick/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort cuts, add 0 and n. cost = (cuts[j]-cuts[i]) + dp(i,k) + dp(k,j).",
    "timeComplexity": "O(C^3)",
    "spaceComplexity": "O(C^2)"
  },
  {
    "id": "prob-294-burst-balloons",
    "title": "Burst Balloons",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Matrix Chain Multiplication / Reverse Last Balloon",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/burst-balloons/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Choose balloon k burst LAST: coins = nums[i-1]*nums[k]*nums[j+1] + dp(i, k-1) + dp(k+1, j).",
    "timeComplexity": "O(N^3)",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-295-evaluate-boolean-expression-to-true",
    "title": "Evaluate Boolean Expression to True",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Partition DP on Boolean Operators (&, |, ^)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/boolean-parenthesization5610/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Track waysTrue and waysFalse for left and right sub-expressions.",
    "timeComplexity": "O(N^3)",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-296-palindrome-partitioning-ii-min-cuts",
    "title": "Palindrome Partitioning II (Min Cuts)",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "1D Front Partition DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/palindrome-partitioning-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[i] = 1 + min(dp[j+1]) for all j where s[i..j] is a palindrome.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-297-partition-array-for-maximum-sum",
    "title": "Partition Array for Maximum Sum",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "1D Front Partition DP of Size <= K",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/partition-array-for-maximum-sum/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[i] = max(max_val * len + dp[i + len]) for len from 1 to k.",
    "timeComplexity": "O(N * K)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-298-implement-trie-prefix-tree",
    "title": "Implement Trie (Prefix Tree)",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie Node Children Map",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/implement-trie-prefix-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Node with children = {} and isEnd = false. Insert, search, startsWith.",
    "timeComplexity": "O(L) per op",
    "spaceComplexity": "O(Total Chars * 26)"
  },
  {
    "id": "prob-299-implement-trie-ii-prefix-with-counts",
    "title": "Implement Trie II (Prefix with Counts)",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Prefix Count & Word Count",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.codingninjas.com/studio/problems/implement-trie_1387095",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Each node maintains countWordsEqualTo and countWordsStartingWith.",
    "timeComplexity": "O(L) per op",
    "spaceComplexity": "O(Total Chars * 26)"
  },
  {
    "id": "prob-300-complete-string-longest-string-with-all-prefixes",
    "title": "Complete String (Longest String with All Prefixes)",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie Prefix Validation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.codingninjas.com/studio/problems/complete-string_2687860",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Insert all words in Trie. Find longest word where every prefix node has isEnd == true.",
    "timeComplexity": "O(Total Chars)",
    "spaceComplexity": "O(Total Chars)"
  },
  {
    "id": "prob-301-count-distinct-substrings",
    "title": "Count Distinct Substrings",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie Node Insertion Count",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/count-of-distinct-substrings/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Insert all suffixes into Trie. Number of distinct substrings = total distinct Trie nodes created.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-302-design-add-and-search-words",
    "title": "Design Add and Search Words",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie with DFS Backtracking on '.'",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Standard Trie for add. For search, if char is '.', branch across all non-null children.",
    "timeComplexity": "O(L) or O(26^L) worst",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-303-word-search-ii-boggle-with-trie",
    "title": "Word Search II (Boggle with Trie)",
    "difficulty": "Hard",
    "topic": "Tries",
    "pattern": "2D Grid DFS + Trie Pruning",
    "sheets": [
      "Blind 75",
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "Blind 75",
    "url": "https://leetcode.com/problems/word-search-ii/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Insert all words into Trie. DFS grid traversing only matching branches.",
    "timeComplexity": "O(M * N * 4^L)",
    "spaceComplexity": "O(Total Chars)"
  },
  {
    "id": "prob-304-maximum-xor-of-two-numbers-in-array",
    "title": "Maximum XOR of Two Numbers in Array",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Bitwise Prefix Trie (32 Bits)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Insert 32-bit representations. For each number, greedily follow opposite bit branch to maximize XOR.",
    "timeComplexity": "O(32 * N)",
    "spaceComplexity": "O(32 * N)"
  },
  {
    "id": "prob-305-maximum-xor-with-an-element-from-array",
    "title": "Maximum XOR With an Element From Array",
    "difficulty": "Hard",
    "topic": "Tries",
    "pattern": "Offline Queries Sorting + Bitwise Trie",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-xor-with-an-element-from-array/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort array and queries by limit m. Insert elements <= m into Trie, query max XOR.",
    "timeComplexity": "O((N + Q) * 32)",
    "spaceComplexity": "O(N * 32)"
  },
  {
    "id": "prob-306-pattern-1-rectangular-star-pattern",
    "title": "Pattern 1: Rectangular Star Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Nested Loops",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/square-pattern/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print N x N square grid of stars.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-307-pattern-2-right-angled-triangle-pattern",
    "title": "Pattern 2: Right-Angled Triangle Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Nested Loops",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/right-triangle/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print right angled triangle with row stars.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-308-pattern-3-right-angled-number-pyramid",
    "title": "Pattern 3: Right-Angled Number Pyramid",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Nested Loops",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-number/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print numbers 1 to row index.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-309-pattern-4-right-angled-number-pyramid-ii",
    "title": "Pattern 4: Right-Angled Number Pyramid II",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Nested Loops",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-number-1661489840/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print row index repeated row times.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-310-pattern-5-inverted-right-pyramid",
    "title": "Pattern 5: Inverted Right Pyramid",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Nested Loops",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print inverted right angled triangle of stars.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-311-pattern-6-inverted-numbered-right-pyramid",
    "title": "Pattern 6: Inverted Numbered Right Pyramid",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Nested Loops",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-number-1661492942/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print numbers 1 to N-row+1.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-312-pattern-7-star-pyramid",
    "title": "Pattern 7: Star Pyramid",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Spaces & Stars Math",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661492263/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print centered triangle with (2*i + 1) stars and (N-i-1) spaces.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-313-pattern-8-inverted-star-pyramid",
    "title": "Pattern 8: Inverted Star Pyramid",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Spaces & Stars Math",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661493231/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print inverted centered pyramid with (2*(N-i)-1) stars.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-314-pattern-9-diamond-star-pattern",
    "title": "Pattern 9: Diamond Star Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Pyramid + Inverted Pyramid",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/pattern/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Combine Star Pyramid and Inverted Star Pyramid.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-315-pattern-10-half-diamond-star-pattern",
    "title": "Pattern 10: Half Diamond Star Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Symmetric Row Math",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661718013/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print increasing stars up to N, then decreasing.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-316-pattern-11-binary-number-triangle-pattern",
    "title": "Pattern 11: Binary Number Triangle Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Alternating Bit 1 and 0",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661718455/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Start row with 1 if row is odd, 0 if even, alternate bits.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-317-pattern-12-number-crown-pattern",
    "title": "Pattern 12: Number Crown Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Mirror Numbers with Spaces",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662285196/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print 1..i, 2*(N-i) spaces, then i..1.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-318-pattern-13-increasing-number-triangle",
    "title": "Pattern 13: Increasing Number Triangle",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Continuous Counter",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661718712/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print running incrementing integer counter.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-319-pattern-14-increasing-letter-triangle",
    "title": "Pattern 14: Increasing Letter Triangle",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Character ASCII Math",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662284916/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print 'A' + j for j in 0..i.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-320-pattern-15-reverse-letter-triangle",
    "title": "Pattern 15: Reverse Letter Triangle",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Inverted Character ASCII",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662285334/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print 'A' + j for j in 0..N-i.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-321-pattern-16-alpha-ramp-pattern",
    "title": "Pattern 16: Alpha-Ramp Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Row Letter Repeated",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662285911/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print ('A' + i) repeated (i + 1) times.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-322-pattern-17-alpha-pyramid-pattern",
    "title": "Pattern 17: Alpha-Pyramid Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Centering with Character Mirror",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662286302/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print characters increasing to midpoint, then decreasing.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-323-pattern-18-alpha-triangle-pattern",
    "title": "Pattern 18: Alpha-Triangle Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Decreasing Letter Starts",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662286234/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print ('A' + N - 1 - j) backwards.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-324-pattern-19-symmetric-void-pattern",
    "title": "Pattern 19: Symmetric Void Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Outer Stars + Inner Spaces",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/double-triangle-pattern-1662287416/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Top half inverted pyramid with void, bottom half opening.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-325-pattern-20-symmetric-butterfly-pattern",
    "title": "Pattern 20: Symmetric Butterfly Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Symmetric Wings + Spaces",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/double-triangle-pattern-1662287739/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Stars on left and right borders closing inward.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-326-pattern-21-hollow-rectangle-pattern",
    "title": "Pattern 21: Hollow Rectangle Pattern",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Border Star Check",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/square-pattern-1662287955/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Print stars on boundaries i==0, i==N-1, j==0, j==N-1.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-327-pattern-22-the-number-pattern-matrix",
    "title": "Pattern 22: The Number Pattern Matrix",
    "difficulty": "Medium",
    "topic": "Basics & Math",
    "pattern": "Distance to Matrix Borders",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/square-pattern-1662288011/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Cell value = N - min(top, bottom, left, right).",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-328-recursive-bubble-sort",
    "title": "Recursive Bubble Sort",
    "difficulty": "Easy",
    "topic": "Sorting",
    "pattern": "Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/bubble-sort/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Bubble max to end, recurse on N-1.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-329-recursive-insertion-sort",
    "title": "Recursive Insertion Sort",
    "difficulty": "Easy",
    "topic": "Sorting",
    "pattern": "Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/insertion-sort/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Recursively sort N-1 elements, insert N-th element into place.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-330-introduction-to-doubly-linked-list",
    "title": "Introduction to Doubly Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "DLL Node Construction",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/introduction-to-doubly-linked-list/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Construct DLL with prev and next pointer links.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-331-insert-a-node-in-doubly-linked-list",
    "title": "Insert a Node in Doubly Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Pointer Manipulation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/insert-a-node-in-doubly-linked-list/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Re-link prev and next pointers at position k.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-332-delete-a-node-in-doubly-linked-list",
    "title": "Delete a Node in Doubly Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Pointer Manipulation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/delete-node-in-doubly-linked-list/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Bypass node: node.prev.next = node.next; node.next.prev = node.prev.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-333-reverse-a-doubly-linked-list",
    "title": "Reverse a Doubly Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Swap Next and Prev Pointers",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/reverse-a-doubly-linked-list/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "For each node, swap node.prev and node.next.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-334-delete-all-occurrences-of-a-key-in-dll",
    "title": "Delete all occurrences of a Key in DLL",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "DLL Traversal & Unlink",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/delete-all-occurrences-of-a-given-key-in-a-doubly-linked-list/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Traverse DLL and unlink matching nodes.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-335-find-pairs-with-given-sum-in-sorted-dll",
    "title": "Find pairs with given sum in sorted DLL",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Two Pointers on DLL (head & tail)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/find-pairs-with-given-sum-in-doubly-linked-list/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Left pointer at head, right pointer at tail, move inward.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-336-remove-duplicates-from-sorted-dll",
    "title": "Remove duplicates from sorted DLL",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Adjacent Duplicate Unlinking",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/remove-duplicates-from-a-sorted-doubly-linked-list/1",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Skip matching next nodes and update prev pointers.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-337-infix-to-postfix-conversion-using-stack",
    "title": "Infix to Postfix Conversion using Stack",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Operator Precedence Stack",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/infix-to-postfix-1587115620/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Shunting-yard algorithm: pop higher/equal precedence operators to output.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-338-prefix-to-infix-conversion",
    "title": "Prefix to Infix Conversion",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Stack String Concatenation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/prefix-to-infix-conversion/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Scan right to left. On operator, pop two operands, form '(' + op1 + op + op2 + ')'.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-339-prefix-to-postfix-conversion",
    "title": "Prefix to Postfix Conversion",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Stack Expression Rearrangement",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/prefix-to-postfix-conversion/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Scan right to left. On operator, form op1 + op2 + operator.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-340-postfix-to-prefix-conversion",
    "title": "Postfix to Prefix Conversion",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Stack Expression Rearrangement",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/postfix-to-prefix-conversion/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Scan left to right. On operator, form operator + op1 + op2.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-341-postfix-to-infix-conversion",
    "title": "Postfix to Infix Conversion",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Stack String Concatenation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/postfix-to-infix-conversion/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Scan left to right. On operator, form '(' + op1 + op + op2 + ')'.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-342-morris-inorder-traversal-of-binary-tree",
    "title": "Morris Inorder Traversal of Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Threaded Binary Tree",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Make temporary thread from rightmost node of left subtree to current.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-343-morris-preorder-traversal-of-binary-tree",
    "title": "Morris Preorder Traversal of Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Threaded Binary Tree",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/binary-tree-preorder-traversal/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Print value before creating temporary right thread.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-344-maximum-width-of-binary-tree",
    "title": "Maximum Width of Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BFS Level Indexing (2*i + 1, 2*i + 2)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-width-of-binary-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Assign zero-based indices at each level to prevent integer overflow. Width = last_idx - first_idx + 1.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-345-children-sum-property-in-binary-tree",
    "title": "Children Sum Property in Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Tree Value Reassignment DFS",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/children-sum-parent/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Ensure root.val == root.left.val + root.right.val at all nodes.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-346-all-nodes-distance-k-in-binary-tree",
    "title": "All Nodes Distance K in Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Parent Pointers Map + BFS",
    "sheets": [
      "Striver A2Z",
      "Striver SDE",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Build parent map via DFS. Run BFS from target up, left, and right up to distance K.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-347-minimum-time-taken-to-burn-binary-tree-from-a-node",
    "title": "Minimum time taken to BURN Binary Tree from a Node",
    "difficulty": "Hard",
    "topic": "Binary Trees & BST",
    "pattern": "Parent Map + Infection BFS",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/burning-tree/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Map parents. Multi-directional BFS from target node measuring max radial depth.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-348-count-total-nodes-in-a-complete-binary-tree",
    "title": "Count total Nodes in a Complete Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Left and Right Height Comparison",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/count-complete-tree-nodes/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "If left_h == right_h, subtree has (2^h - 1) nodes in O(log^2 N) time.",
    "timeComplexity": "O(log^2 N)",
    "spaceComplexity": "O(log N)"
  },
  {
    "id": "prob-349-inorder-successor-and-predecessor-in-bst",
    "title": "Inorder Successor and Predecessor in BST",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BST Property Search",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/predecessor-and-successor/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Successor is smallest value > key; predecessor is largest value < key.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-350-largest-bst-in-binary-tree",
    "title": "Largest BST in Binary Tree",
    "difficulty": "Hard",
    "topic": "Binary Trees & BST",
    "pattern": "Postorder BST Validation (min, max, size)",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/largest-bst/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Return (is_bst, size, min_val, max_val) from bottom-up DFS in O(N).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)"
  },
  {
    "id": "prob-351-minimum-multiplications-to-reach-end",
    "title": "Minimum Multiplications to Reach End",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "BFS Shortest Path Modulo 100000",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-multiplications-to-reach-end/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Queue BFS with visited array of size 100000.",
    "timeComplexity": "O(100000 * N)",
    "spaceComplexity": "O(100000)"
  },
  {
    "id": "prob-352-number-of-ways-to-arrive-at-destination",
    "title": "Number of Ways to Arrive at Destination",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Dijkstra with Ways Count Array",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/number-of-ways-to-arrive-at-destination/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Dijkstra: if new_dist < dist[v], dist[v] = new_dist, ways[v] = ways[u]. If equal, ways[v] += ways[u].",
    "timeComplexity": "O(E log V)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-353-find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold",
    "title": "Find the City With the Smallest Number of Neighbors at a Threshold",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "Floyd-Warshall All-Pairs Shortest Path",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Run Floyd-Warshall, count reachable cities within threshold distance for each city.",
    "timeComplexity": "O(V^3)",
    "spaceComplexity": "O(V^2)"
  },
  {
    "id": "prob-354-swim-in-rising-water",
    "title": "Swim in Rising Water",
    "difficulty": "Hard",
    "topic": "Graphs",
    "pattern": "Dijkstra (Min-Heap on Max Elevation)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/swim-in-rising-water/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Min-Heap stores (max_elevation_so_far, r, c). Dijkstra 4 directions.",
    "timeComplexity": "O(N^2 log N)",
    "spaceComplexity": "O(N^2)"
  },
  {
    "id": "prob-355-articulation-point-in-graph",
    "title": "Articulation Point in Graph",
    "difficulty": "Hard",
    "topic": "Graphs",
    "pattern": "Tarjan's Low and Tin DFS (low[v] >= tin[u])",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/articulation-point-1/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Vertex u is articulation point if low[v] >= tin[u] (non-root) or root has >1 children.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V)"
  },
  {
    "id": "prob-356-frog-jump-with-k-distance",
    "title": "Frog Jump with K Distance",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "1D DP over K Jumps",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimal-cost/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "dp[i] = min(dp[i-j] + abs(h[i]-h[i-j])) for j in 1..k.",
    "timeComplexity": "O(N * K)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-357-count-subsets-with-given-difference",
    "title": "Count Subsets with Given Difference",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Subset Sum S1 = (Total + Diff) / 2",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/partitions-with-given-difference/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Target sum = (total_sum + diff) // 2. Run subset sum ways DP.",
    "timeComplexity": "O(N * Target)",
    "spaceComplexity": "O(Target)"
  },
  {
    "id": "prob-358-maximum-profit-in-job-scheduling",
    "title": "Maximum Profit in Job Scheduling",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Weighted Interval Scheduling (DP + Binary Search)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/maximum-profit-in-job-scheduling/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Sort jobs by end time. dp[i] = max(dp[i-1], profit + dp[latest_non_overlapping]).",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-359-shortest-palindrome-kmp-prefix-table",
    "title": "Shortest Palindrome (KMP Prefix Table)",
    "difficulty": "Hard",
    "topic": "Strings",
    "pattern": "KMP Table on s + '#' + rev(s)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/shortest-palindrome/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Compute LPS array of s + '#' + rev(s). Prepend unmatched suffix to front.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  },
  {
    "id": "prob-360-rabin-karp-string-matching-algorithm",
    "title": "Rabin-Karp String Matching Algorithm",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "Rolling Hash Matching",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Rolling hash with polynomial modulo arithmetic to find pattern in O(N + M).",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(1)"
  },
  {
    "id": "prob-361-kmp-algorithm-for-pattern-searching",
    "title": "KMP Algorithm for Pattern Searching",
    "difficulty": "Hard",
    "topic": "Strings",
    "pattern": "Longest Prefix Suffix (LPS) Array",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Build LPS array in O(M), search text in O(N) without backtracking text pointer.",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(M)"
  },
  {
    "id": "prob-362-z-algorithm-for-pattern-searching",
    "title": "Z-Algorithm for Pattern Searching",
    "difficulty": "Hard",
    "topic": "Strings",
    "pattern": "Z-Array Prefix Match Window",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/longest-prefix-suffix2527/1",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "notes": "Compute Z-box window [L, R] on pattern + '$' + text in linear time.",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(N + M)"
  },
  {
    "title": "User Input / Output & Data Types",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Language Basics",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/data-type-1662983042/1",
    "companies": [
      "TCS",
      "Infosys"
    ],
    "notes": "Fundamental data types (int, long, float, double, char) and byte size representations.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-363-user-input-output-data-types"
  },
  {
    "title": "If Else Statements",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Conditional Logic",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/java-if-else-decision-making0924/1",
    "companies": [
      "Wipro",
      "Accenture"
    ],
    "notes": "Basic conditional branching and nested condition evaluations.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-364-if-else-statements"
  },
  {
    "title": "Switch Case Statements",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Conditional Logic",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/java-switch-case-statement3529/1",
    "companies": [
      "Cognizant"
    ],
    "notes": "Multi-way branching using switch-case statements.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-365-switch-case-statements"
  },
  {
    "title": "Pass by Reference and Pass by Value",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Memory & Pointers",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/pass-by-reference-and-value/1",
    "companies": [
      "TCS",
      "Capgemini"
    ],
    "notes": "Understand stack vs heap memory, passing pointers/references vs copying values.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-366-pass-by-reference-and-pass-by-value"
  },
  {
    "title": "While Loops & For Loops Syntax",
    "difficulty": "Easy",
    "topic": "Basics & Math",
    "pattern": "Iteration Basics",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/for-loop-primecheck-java/1",
    "companies": [
      "Infosys"
    ],
    "notes": "Loop iteration constructs, termination conditions, and increment patterns.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-367-while-loops-for-loops-syntax"
  },
  {
    "title": "Count Frequency of Elements in Array",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Hash Map / Frequency Array",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/frequency-of-array-elements-1587115620/1",
    "companies": [
      "Paytm",
      "Amazon"
    ],
    "notes": "Use Hash Map or in-place modulo counting.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-368-count-frequency-of-elements-in-array"
  },
  {
    "title": "Find Highest / Lowest Frequency Element",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "Frequency Map",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/top-k-frequent-elements/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Map frequency and track min/max frequency keys.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-369-find-highest-lowest-frequency-element"
  },
  {
    "title": "Left Rotate an Array by One",
    "difficulty": "Easy",
    "topic": "Arrays & Hashing",
    "pattern": "In-place Shift",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/quick-left-rotation3806/1",
    "companies": [
      "Amazon",
      "TCS"
    ],
    "notes": "Store first element in temp, shift arr[1..N-1] left, put temp at arr[N-1].",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-370-left-rotate-an-array-by-one"
  },
  {
    "title": "Floor and Ceil in Sorted Array",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "pattern": "Binary Search Bound",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/floor-in-a-sorted-array-1587115620/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Floor = largest element <= X, Ceil = smallest element >= X.",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "id": "prob-371-floor-and-ceil-in-sorted-array"
  },
  {
    "title": "Minimize Max Distance to Gas Stations",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "BS on Floating Answer Space",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimize-max-distance-to-gas-station/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Binary search on distance D in [0, max_gap] with 1e-6 precision.",
    "timeComplexity": "O(N * log(range / 1e-6))",
    "spaceComplexity": "O(1)",
    "id": "prob-372-minimize-max-distance-to-gas-stations"
  },
  {
    "title": "Matrix Median in Row-Wise Sorted Matrix",
    "difficulty": "Hard",
    "topic": "Binary Search",
    "pattern": "Binary Search in 2D",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix1527/1",
    "companies": [
      "Amazon",
      "Goldman Sachs"
    ],
    "notes": "BS on range [min_val, max_val]. Count elements <= mid across all rows using upper_bound.",
    "timeComplexity": "O(R * log(C) * log(1e9))",
    "spaceComplexity": "O(1)",
    "id": "prob-373-matrix-median-in-row-wise-sorted-matrix"
  },
  {
    "title": "Count Number of Substrings With At Most K Distinct Characters",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Sliding Window Exactly K = AtMost(K) - AtMost(K-1)",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/count-number-of-substrings4528/1",
    "companies": [
      "Amazon"
    ],
    "notes": "Count substrings with at most K distinct chars: each valid window adds (right - left + 1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(K)",
    "id": "prob-374-count-number-of-substrings-with-at-most-k-distinct-characters"
  },
  {
    "title": "Sum of Beauty of All Substrings",
    "difficulty": "Medium",
    "topic": "Strings",
    "pattern": "Nested Frequency Counting",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/sum-of-beauty-of-all-substrings/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "For all substrings s[i..j], compute max_freq - min_freq (non-zero) and accumulate.",
    "timeComplexity": "O(N^2 * 26)",
    "spaceComplexity": "O(26)",
    "id": "prob-375-sum-of-beauty-of-all-substrings"
  },
  {
    "title": "Introduction to Linked List & Traversal",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Node Traversal",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/count-nodes-of-linked-list/1",
    "companies": [
      "TCS",
      "Cognizant"
    ],
    "notes": "Traverse linked list with pointer curr = curr->next and count nodes / search value.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-376-introduction-to-linked-list-traversal"
  },
  {
    "title": "Insert Node at Beginning & End of Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Pointer Manipulation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/linked-list-insertion-1587115620/1",
    "companies": [
      "Wipro",
      "Infosys"
    ],
    "notes": "Create new node, point to head for insert-at-beginning, or traverse to tail for insert-at-end.",
    "timeComplexity": "O(1) / O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-377-insert-node-at-beginning-end-of-linked-list"
  },
  {
    "title": "Segregate Odd and Even Nodes in Linked List",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Two Pointers Re-wiring",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/odd-even-linked-list/",
    "companies": [
      "Amazon",
      "Bloomberg",
      "Google"
    ],
    "notes": "Maintain odd and even pointer chains, connect odd tail to even head.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-378-segregate-odd-and-even-nodes-in-linked-list"
  },
  {
    "title": "Sort a Linked List of 0s, 1s and 2s",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Dummy Node Partitioning",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/given-a-linked-list-of-0s-1s-and-2s-sort-it/1",
    "companies": [
      "Amazon",
      "Microsoft",
      "Paytm"
    ],
    "notes": "Maintain 3 dummy heads for 0, 1, 2. Attach matching nodes and concatenate chains.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-379-sort-a-linked-list-of-0s-1s-and-2s"
  },
  {
    "title": "Add 1 to a Number Represented as Linked List",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Backtracking / Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/add-1-to-a-number-represented-as-linked-list/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Recurse to end of list, add carry 1 from right to left.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N) recursion stack",
    "id": "prob-380-add-1-to-a-number-represented-as-linked-list"
  },
  {
    "title": "Delete All Occurrences of a Key in Doubly Linked List",
    "difficulty": "Medium",
    "topic": "Linked List",
    "pattern": "Doubly Linked List",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/delete-all-occurrences-of-a-given-key-in-a-doubly-linked-list/1",
    "companies": [
      "Amazon"
    ],
    "notes": "Unlink matching node by setting prev->next = next and next->prev = prev.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-381-delete-all-occurrences-of-a-key-in-doubly-linked-list"
  },
  {
    "title": "Find Pairs with Given Sum in Doubly Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Two Pointers DLL",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/find-pairs-with-given-sum-in-doubly-linked-list/1",
    "companies": [
      "Amazon"
    ],
    "notes": "Two pointers from head (left) and tail (right). Move towards each other based on sum.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-382-find-pairs-with-given-sum-in-doubly-linked-list"
  },
  {
    "title": "Remove Duplicates from Sorted Doubly Linked List",
    "difficulty": "Easy",
    "topic": "Linked List",
    "pattern": "Doubly Linked List",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/remove-duplicates-from-a-sorted-doubly-linked-list/1",
    "companies": [
      "Amazon"
    ],
    "notes": "While curr->next has same val, adjust next pointers to skip duplicates.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-383-remove-duplicates-from-sorted-doubly-linked-list"
  },
  {
    "title": "Generate All Binary Strings Without Consecutive 1s",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Backtracking",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/generate-all-binary-strings/1",
    "companies": [
      "Amazon",
      "Paytm"
    ],
    "notes": "At each index: append '0' and recurse; if previous was not '1', append '1' and recurse.",
    "timeComplexity": "O(2^N)",
    "spaceComplexity": "O(N)",
    "id": "prob-384-generate-all-binary-strings-without-consecutive-1s"
  },
  {
    "title": "Count Subsequences with Sum K",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Include / Exclude Recursion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/perfect-sum-problem5633/1",
    "companies": [
      "Amazon",
      "Paytm"
    ],
    "notes": "return solve(idx+1, sum + arr[idx]) + solve(idx+1, sum).",
    "timeComplexity": "O(2^N)",
    "spaceComplexity": "O(N)",
    "id": "prob-385-count-subsequences-with-sum-k"
  },
  {
    "title": "Expression Add Operators",
    "difficulty": "Hard",
    "topic": "Recursion & Backtracking",
    "pattern": "Backtracking with Precedence",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/expression-add-operators/",
    "companies": [
      "Google",
      "Facebook",
      "Amazon"
    ],
    "notes": "Backtrack across operators (+, -, *). Keep track of evaluated value and previous operand for multiplication precedence.",
    "timeComplexity": "O(4^N)",
    "spaceComplexity": "O(N)",
    "id": "prob-386-expression-add-operators"
  },
  {
    "title": "Introduction to Bit Manipulation (Get, Set, Clear bit)",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "Bitwise Operations",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/bit-manipulation-1666686020/1",
    "companies": [
      "Cisco",
      "Qualcomm"
    ],
    "notes": "Get: (N & (1 << i)) != 0; Set: N | (1 << i); Clear: N & ~(1 << i).",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-387-introduction-to-bit-manipulation-get-set-clear-bit"
  },
  {
    "title": "Two Numbers with Odd Occurrences",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "XOR Partitioning",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/two-numbers-with-odd-occurrences5846/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "XOR all elements to get (x ^ y). Find rightmost set bit diff_bit = (xor & -xor). Partition array into two buckets based on diff_bit.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-388-two-numbers-with-odd-occurrences"
  },
  {
    "title": "Implement Stack using Array",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Array Implementation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/implement-stack-using-array/1",
    "companies": [
      "Amazon",
      "TCS"
    ],
    "notes": "Maintain top index, push increments top, pop decrements top.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(N)",
    "id": "prob-389-implement-stack-using-array"
  },
  {
    "title": "Implement Queue using Array",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Circular Array",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/implement-queue-using-array/1",
    "companies": [
      "Amazon",
      "Infosys"
    ],
    "notes": "Maintain front and rear pointers with modulo arithmetic.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(N)",
    "id": "prob-390-implement-queue-using-array"
  },
  {
    "title": "Implement Stack using Linked List",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Linked List Stack",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/implement-stack-using-linked-list/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Push adds node to head; pop removes node from head.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(N)",
    "id": "prob-391-implement-stack-using-linked-list"
  },
  {
    "title": "Implement Queue using Linked List",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "pattern": "Linked List Queue",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/implement-queue-using-linked-list/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Maintain head and tail pointers. Enqueue at tail, dequeue at head.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(N)",
    "id": "prob-392-implement-queue-using-linked-list"
  },
  {
    "title": "Infix to Prefix Conversion",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Stack Expression Parsing",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/infix-to-prefix-conversion/1",
    "companies": [
      "Amazon",
      "Samsung"
    ],
    "notes": "Reverse string, swap '(' with ')', apply infix to postfix, reverse result.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-393-infix-to-prefix-conversion"
  },
  {
    "title": "Number of NGEs to the Right",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "pattern": "Monotonic Stack / Fenwick Tree",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/number-of-nges-to-the-right/1",
    "companies": [
      "Amazon",
      "Directi"
    ],
    "notes": "For given queries, count how many elements to the right are strictly greater.",
    "timeComplexity": "O(Q * N)",
    "spaceComplexity": "O(1)",
    "id": "prob-394-number-of-nges-to-the-right"
  },
  {
    "title": "Minimum Window Subsequence",
    "difficulty": "Hard",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Two Pointers Forward & Backward",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-window-subsequence/",
    "companies": [
      "Google",
      "Amazon",
      "Uber"
    ],
    "notes": "Find match of T in S moving forward, then backtrack pointers from right to left to optimize window start.",
    "timeComplexity": "O(S * T)",
    "spaceComplexity": "O(1)",
    "id": "prob-395-minimum-window-subsequence"
  },
  {
    "title": "Check if an Array Represents a Min-Heap",
    "difficulty": "Easy",
    "topic": "Heap / Priority Queue",
    "pattern": "Heap Property Verification",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/does-array-represent-heap4345/1",
    "companies": [
      "Amazon",
      "Adobe"
    ],
    "notes": "For every node i (0 <= i < n/2), check arr[i] <= arr[2*i+1] and arr[i] <= arr[2*i+2].",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-396-check-if-an-array-represents-a-min-heap"
  },
  {
    "title": "Convert Min Heap to Max Heap",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Max-Heapify Down",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/convert-min-heap-to-max-heap/1",
    "companies": [
      "Amazon"
    ],
    "notes": "Run max-heapify starting from index (n-2)/2 down to 0.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-397-convert-min-heap-to-max-heap"
  },
  {
    "title": "Sort a K Sorted Array (Nearly Sorted Array)",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Min Heap Window",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/nearly-sorted-1587115620/1",
    "companies": [
      "Amazon",
      "Flipkart"
    ],
    "notes": "Maintain min-heap of size K+1. Pop min element into result array.",
    "timeComplexity": "O(N log K)",
    "spaceComplexity": "O(K)",
    "id": "prob-398-sort-a-k-sorted-array-nearly-sorted-array"
  },
  {
    "title": "Replace Each Array Element by Its Corresponding Rank",
    "difficulty": "Easy",
    "topic": "Heap / Priority Queue",
    "pattern": "Sorting / Hash Map",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/rank-transform-of-an-array/",
    "companies": [
      "Amazon",
      "Bloomberg"
    ],
    "notes": "Sort unique elements, map each to rank (1, 2, 3..), replace original elements.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "id": "prob-399-replace-each-array-element-by-its-corresponding-rank"
  },
  {
    "title": "Find Minimum Number of Coins (Greedy)",
    "difficulty": "Easy",
    "topic": "Greedy & Intervals",
    "pattern": "Standard Currency Denominations",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/min-coin5549/1",
    "companies": [
      "Amazon",
      "Morgan Stanley"
    ],
    "notes": "Iterate Indian currency denominations (2000, 500, 200, 100, ...) in descending order and greedily pick maximum coins.",
    "timeComplexity": "O(V)",
    "spaceComplexity": "O(1)",
    "id": "prob-400-find-minimum-number-of-coins-greedy"
  },
  {
    "title": "Iterative Preorder Traversal",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Explicit Stack",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/binary-tree-preorder-traversal/",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Push root to stack. While stack not empty: pop node, process it, push right child, push left child.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-401-iterative-preorder-traversal"
  },
  {
    "title": "Iterative Inorder Traversal",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Explicit Stack",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    "companies": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "notes": "Traverse left chain pushing to stack until null, pop, visit, then move to right child.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-402-iterative-inorder-traversal"
  },
  {
    "title": "Iterative Postorder Traversal (Using 1 Stack)",
    "difficulty": "Hard",
    "topic": "Binary Trees & BST",
    "pattern": "Single Stack State Tracking",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/binary-tree-postorder-traversal/",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Traverse left chain, peek right child; if right is null or already visited, pop and process.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-403-iterative-postorder-traversal-using-1-stack"
  },
  {
    "title": "Preorder, Inorder, and Postorder in One Traversal",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "State Stack Traversal",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/tree-traversals/1",
    "companies": [
      "Amazon",
      "Samsung"
    ],
    "notes": "Stack stores pair (node, state). State 1 = Preorder (push left, state++), State 2 = Inorder (push right, state++), State 3 = Postorder (pop).",
    "timeComplexity": "O(3N)",
    "spaceComplexity": "O(N)",
    "id": "prob-404-preorder-inorder-and-postorder-in-one-traversal"
  },
  {
    "title": "Root to Node Path in Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "DFS Backtracking",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/root-to-leaf-paths/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Push node->val to path. If node is target, return true. If not in left or right subtree, pop node->val.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)",
    "id": "prob-405-root-to-node-path-in-binary-tree"
  },
  {
    "title": "Check for Children Sum Property in Binary Tree",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Tree Modification / Top-Down",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/children-sum-parent/1",
    "companies": [
      "Amazon",
      "Flipkart"
    ],
    "notes": "Before recursing down: if children sum < parent val, increase child to parent val. After returning: set parent val = left + right.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(H)",
    "id": "prob-406-check-for-children-sum-property-in-binary-tree"
  },
  {
    "title": "Construct Binary Tree from Inorder and Postorder",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "Divide and Conquer",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Root is last element of postorder. Locate root in inorder map to determine left/right subtree sizes.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-407-construct-binary-tree-from-inorder-and-postorder"
  },
  {
    "title": "Introduction to Binary Search Trees",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "BST Property",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/binary-search-trees/1",
    "companies": [
      "Amazon"
    ],
    "notes": "All nodes in left subtree < node < all nodes in right subtree.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-408-introduction-to-binary-search-trees"
  },
  {
    "title": "Find Min/Max in BST",
    "difficulty": "Easy",
    "topic": "Binary Trees & BST",
    "pattern": "BST Traversal",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-element-in-bst/1",
    "companies": [
      "Amazon"
    ],
    "notes": "Min is leftmost node (keep traversing node->left). Max is rightmost node.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(1)",
    "id": "prob-409-find-min-max-in-bst"
  },
  {
    "title": "Inorder Predecessor and Successor in BST",
    "difficulty": "Medium",
    "topic": "Binary Trees & BST",
    "pattern": "BST Search",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/predecessor-and-successor/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Successor: smallest node > key. Predecessor: largest node < key.",
    "timeComplexity": "O(H)",
    "spaceComplexity": "O(1)",
    "id": "prob-410-inorder-predecessor-and-successor-in-bst"
  },
  {
    "title": "Introduction to Graph & Representation (Adjacency Matrix & List)",
    "difficulty": "Easy",
    "topic": "Graphs",
    "pattern": "Graph Representation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/print-adjacency-list-1587115620/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Adjacency matrix (V x V) vs Adjacency list (array of vectors / maps) for directed & undirected graphs.",
    "timeComplexity": "O(V + E)",
    "spaceComplexity": "O(V + E)",
    "id": "prob-411-introduction-to-graph-representation-adjacency-matrix-list"
  },
  {
    "title": "Minimum Steps to Reach End by Multiplication",
    "difficulty": "Medium",
    "topic": "Graphs",
    "pattern": "BFS Shortest Path Modulo",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-multiplications-to-reach-end/1",
    "companies": [
      "Amazon",
      "Ola"
    ],
    "notes": "BFS over state space 0..99999 where each transition multiplies by arr[i] % 100000.",
    "timeComplexity": "O(100000 * N)",
    "spaceComplexity": "O(100000)",
    "id": "prob-412-minimum-steps-to-reach-end-by-multiplication"
  },
  {
    "title": "Frog Jump with K Distances",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "1D DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimal-cost/1",
    "companies": [
      "Amazon",
      "Atlassian"
    ],
    "notes": "dp[i] = min(dp[i-j] + abs(height[i] - height[i-j])) for j in [1..K].",
    "timeComplexity": "O(N * K)",
    "spaceComplexity": "O(N)",
    "id": "prob-413-frog-jump-with-k-distances"
  },
  {
    "title": "Ninja's Training",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D Grid State DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/geeks-training/1",
    "companies": [
      "Amazon",
      "Morgan Stanley"
    ],
    "notes": "dp[day][last_task] = max(points[day][task] + dp[day-1][task]) where task != last_task.",
    "timeComplexity": "O(N * 4 * 3)",
    "spaceComplexity": "O(4)",
    "id": "prob-414-ninja-s-training"
  },
  {
    "title": "Partition Set Into 2 Subsets With Min Absolute Sum Difference",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Subset Sum Boolean DP",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-sum-partition3317/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Compute subset sum boolean array for sum/2. Find max s1 such that dp[N][s1] is true; answer = total_sum - 2*s1.",
    "timeComplexity": "O(N * total_sum)",
    "spaceComplexity": "O(total_sum)",
    "id": "prob-415-partition-set-into-2-subsets-with-min-absolute-sum-difference"
  },
  {
    "title": "Count Partitions with Given Difference",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Target Subset Sum",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/partitions-with-given-difference/1",
    "companies": [
      "Amazon",
      "Accolite"
    ],
    "notes": "s1 - s2 = d and s1 + s2 = total => s1 = (total + d) / 2. Count subsets with sum s1.",
    "timeComplexity": "O(N * target)",
    "spaceComplexity": "O(target)",
    "id": "prob-416-count-partitions-with-given-difference"
  },
  {
    "title": "Unbounded Knapsack",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Unbounded Knapsack",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/knapsack-with-duplicate-items4201/1",
    "companies": [
      "Amazon",
      "Paytm"
    ],
    "notes": "Items can be used unlimited times: dp[w] = max(dp[w], val[i] + dp[w - wt[i]]).",
    "timeComplexity": "O(N * W)",
    "spaceComplexity": "O(W)",
    "id": "prob-417-unbounded-knapsack"
  },
  {
    "title": "Rod Cutting Problem",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "Unbounded Knapsack",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/rod-cutting0840/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Cut rod of length N to maximize price. dp[i] = max(price[j-1] + dp[i-j]) for j in 1..i.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)",
    "id": "prob-418-rod-cutting-problem"
  },
  {
    "title": "Longest Common Substring",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D Substring DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/longest-common-substring1452/1",
    "companies": [
      "Amazon",
      "Morgan Stanley"
    ],
    "notes": "If s1[i-1] == s2[j-1], dp[i][j] = 1 + dp[i-1][j-1]; else dp[i][j] = 0.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)",
    "id": "prob-419-longest-common-substring"
  },
  {
    "title": "Minimum Insertions / Deletions to Convert String A to B",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "LCS Transform",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/delete-operation-for-two-strings/",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Deletions = len(A) - LCS(A, B), Insertions = len(B) - LCS(A, B). Total ops = len(A) + len(B) - 2*LCS.",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(M * N)",
    "id": "prob-420-minimum-insertions-deletions-to-convert-string-a-to-b"
  },
  {
    "title": "Best Time to Buy and Sell Stock with Transaction Fee",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "State Machine DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/",
    "companies": [
      "Amazon",
      "Facebook"
    ],
    "notes": "buy = max(buy, prev_sell - price - fee), sell = max(sell, prev_buy + price).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-421-best-time-to-buy-and-sell-stock-with-transaction-fee"
  },
  {
    "title": "Minimum Cost to Cut a Stick",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Partition DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-cost-to-cut-a-stick/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Sort cuts and pad with 0 and N. dp[i][j] = min(cuts[j] - cuts[i] + dp[i][k] + dp[k][j]) for k in i+1..j-1.",
    "timeComplexity": "O(C^3)",
    "spaceComplexity": "O(C^2)",
    "id": "prob-422-minimum-cost-to-cut-a-stick"
  },
  {
    "title": "Palindrome Partitioning II (Minimum Cuts)",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Front Partition DP",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/palindrome-partitioning-ii/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "dp[i] = min(1 + dp[j+1]) for all j >= i where s[i..j] is a palindrome.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N^2)",
    "id": "prob-423-palindrome-partitioning-ii-minimum-cuts"
  },
  {
    "title": "Maximum Rectangle Area with All 1s in Binary Matrix",
    "difficulty": "Hard",
    "topic": "Dynamic Programming",
    "pattern": "Histogram DP Stack",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximal-rectangle/",
    "companies": [
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "notes": "Maintain running height histogram for each row, run Largest Rectangle in Histogram O(C).",
    "timeComplexity": "O(R * C)",
    "spaceComplexity": "O(C)",
    "id": "prob-424-maximum-rectangle-area-with-all-1s-in-binary-matrix"
  },
  {
    "title": "Count Square Submatrices with All Ones",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "pattern": "2D Matrix DP",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/count-square-submatrices-with-all-ones/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]). Accumulate all dp cells.",
    "timeComplexity": "O(R * C)",
    "spaceComplexity": "O(R * C)",
    "id": "prob-425-count-square-submatrices-with-all-ones"
  },
  {
    "title": "Implement Trie II (Prefix Tree with Count)",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie Prefix Tree",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.naukri.com/code360/problems/implement-trie_1387095",
    "companies": [
      "Microsoft",
      "Google"
    ],
    "notes": "Trie Node maintains countWordsEqualTo and countWordsStartingWith integers on each node.",
    "timeComplexity": "O(L)",
    "spaceComplexity": "O(26 * N * L)",
    "id": "prob-426-implement-trie-ii-prefix-tree-with-count"
  },
  {
    "title": "Longest Word With All Prefixes (Complete String)",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie Traversal",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.naukri.com/code360/problems/complete-string_2687860",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Insert all words in Trie. For each word, check if every prefix node has isEnd == true.",
    "timeComplexity": "O(N * L)",
    "spaceComplexity": "O(N * L)",
    "id": "prob-427-longest-word-with-all-prefixes-complete-string"
  },
  {
    "title": "Number of Distinct Substrings in a String",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie Node Counting",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/count-of-distinct-substrings/1",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Insert all suffixes into Trie. Total distinct substrings = count of distinct nodes created in Trie.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N^2 * 26)",
    "id": "prob-428-number-of-distinct-substrings-in-a-string"
  },
  {
    "title": "Maximum XOR With an Element From Array (Offline Queries)",
    "difficulty": "Hard",
    "topic": "Tries",
    "pattern": "Bitwise Trie + Offline Sorting",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-xor-with-an-element-from-array/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Sort array and queries by threshold mi. Greedily insert elements <= mi into bitwise Trie and query max XOR.",
    "timeComplexity": "O((N + Q) * 32)",
    "spaceComplexity": "O(N * 32)",
    "id": "prob-429-maximum-xor-with-an-element-from-array-offline-queries"
  },
  {
    "title": "Shortest Palindrome (KMP LPS)",
    "difficulty": "Hard",
    "topic": "Strings",
    "pattern": "KMP LPS Optimization",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/shortest-palindrome/",
    "companies": [
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "notes": "Construct string s + '#' + rev(s), compute LPS array. The last LPS value gives length of longest palindromic prefix.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-430-shortest-palindrome-kmp-lps"
  },
  {
    "title": "Longest Happy Prefix",
    "difficulty": "Hard",
    "topic": "Strings",
    "pattern": "KMP LPS Array",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/longest-happy-prefix/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Return prefix of length equal to LPS[n-1].",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-431-longest-happy-prefix"
  },
  {
    "title": "Rabin-Karp Algorithm for Pattern Searching",
    "difficulty": "Hard",
    "topic": "Strings",
    "pattern": "Rolling Hash",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
    "companies": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "notes": "Maintain rolling polynomial hash of window size M. Compare hash values in O(1) and verify matches.",
    "timeComplexity": "O(N + M) average",
    "spaceComplexity": "O(1)",
    "id": "prob-432-rabin-karp-algorithm-for-pattern-searching"
  },
  {
    "title": "Minimum Characters to Add at Front for Palindrome",
    "difficulty": "Hard",
    "topic": "Strings",
    "pattern": "KMP LPS",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-characters-to-be-added-at-front-to-make-string-palindrome/1",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Compute LPS of s + '$' + reverse(s). Answer = len(s) - LPS[end].",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-433-minimum-characters-to-add-at-front-for-palindrome"
  },
  {
    "title": "Counting Sort",
    "difficulty": "Easy",
    "topic": "Sorting",
    "pattern": "Non-Comparison Sorting",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/counting-sort/1",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Count frequencies of distinct keys in range [0, K], compute prefix sums to place elements in stable order.",
    "timeComplexity": "O(N + K)",
    "spaceComplexity": "O(K)",
    "id": "prob-434-counting-sort"
  },
  {
    "title": "Radix Sort",
    "difficulty": "Medium",
    "topic": "Sorting",
    "pattern": "Digit-by-Digit Stable Sort",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/radix-sort/1",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Perform stable counting sort on each digit from least significant to most significant digit.",
    "timeComplexity": "O(D * (N + B))",
    "spaceComplexity": "O(N + B)",
    "id": "prob-435-radix-sort"
  },
  {
    "title": "Bucket Sort",
    "difficulty": "Medium",
    "topic": "Sorting",
    "pattern": "Uniform Distribution Partitioning",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/bucket-sort/1",
    "companies": [
      "Amazon"
    ],
    "notes": "Distribute elements into uniform buckets, sort individual buckets, concatenate.",
    "timeComplexity": "O(N + K) average",
    "spaceComplexity": "O(N)",
    "id": "prob-436-bucket-sort"
  },
  {
    "title": "Wiggle Sort II",
    "difficulty": "Medium",
    "topic": "Sorting",
    "pattern": "Virtual Indexing / Quickselect",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/wiggle-sort-ii/",
    "companies": [
      "Google",
      "Facebook"
    ],
    "notes": "Find median using Quickselect, partition around median and place into odd/even indexed slots.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-437-wiggle-sort-ii"
  },
  {
    "title": "Minimum Swaps to Sort an Array",
    "difficulty": "Medium",
    "topic": "Sorting",
    "pattern": "Cycle Decomposition",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://www.geeksforgeeks.org/problems/minimum-swaps/1",
    "companies": [
      "Amazon",
      "Goldman Sachs"
    ],
    "notes": "Graph cycles on sorted indices: total swaps = sum(cycle_size - 1) for all disjoint permutation cycles.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "id": "prob-438-minimum-swaps-to-sort-an-array"
  },
  {
    "title": "Sort Array by Parity II",
    "difficulty": "Easy",
    "topic": "Sorting",
    "pattern": "Two Pointers In-Place",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/sort-array-by-parity-ii/",
    "companies": [
      "Amazon"
    ],
    "notes": "Two pointers (even at 0, odd at 1). Swap when arr[even] is odd and arr[odd] is even.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-439-sort-array-by-parity-ii"
  },
  {
    "title": "Container With Most Water",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Two Pointers Converging",
    "sheets": [
      "NeetCode 150",
      "Blind 75",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/container-with-most-water/",
    "companies": [
      "Amazon",
      "Google",
      "Facebook",
      "Apple"
    ],
    "notes": "Pointers at left and right extremes. Area = min(h[l], h[r]) * (r - l). Move the shorter pointer inward.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-440-container-with-most-water"
  },
  {
    "title": "3Sum Closest",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Sort + Two Pointers",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/3sum-closest/",
    "companies": [
      "Amazon",
      "Bloomberg"
    ],
    "notes": "Sort array, fix first element i, run two pointers (left, right) to track closest sum to target.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "id": "prob-441-3sum-closest"
  },
  {
    "title": "4Sum II",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Hash Map Meet-in-the-Middle",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/4sum-ii/",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "Store pair sums of nums1 and nums2 in Hash Map, count matches against -(nums3 + nums4).",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N^2)",
    "id": "prob-442-4sum-ii"
  },
  {
    "title": "Valid Palindrome II (At Most 1 Deletion)",
    "difficulty": "Easy",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Two Pointers Greedy Branching",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/valid-palindrome-ii/",
    "companies": [
      "Facebook",
      "Amazon"
    ],
    "notes": "When s[l] != s[r], check if isPalindrome(l+1, r) or isPalindrome(l, r-1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-443-valid-palindrome-ii-at-most-1-deletion"
  },
  {
    "title": "Minimum Size Subarray Sum",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Sliding Window Dynamic Size",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/minimum-size-subarray-sum/",
    "companies": [
      "Google",
      "Facebook"
    ],
    "notes": "Expand window sum >= target, shrink from left while maintaining sum >= target to minimize window length.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-444-minimum-size-subarray-sum"
  },
  {
    "title": "Permutation in String",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Fixed Sliding Window Frequency Match",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/permutation-in-string/",
    "companies": [
      "Microsoft",
      "Amazon"
    ],
    "notes": "Maintain fixed window of length len(s1) and count frequency matches with s1.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(26)",
    "id": "prob-445-permutation-in-string"
  },
  {
    "title": "Find All Anagrams in a String",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Fixed Window Sliding Match",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/find-all-anagrams-in-a-string/",
    "companies": [
      "Amazon",
      "Facebook"
    ],
    "notes": "Slide window of size len(p) over s, compare frequency arrays or character count delta.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(26)",
    "id": "prob-446-find-all-anagrams-in-a-string"
  },
  {
    "title": "Subarray Product Less Than K",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Sliding Window Product",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/subarray-product-less-than-k/",
    "companies": [
      "Amazon",
      "Bloomberg"
    ],
    "notes": "Running product *= nums[r]. Shrink from left while product >= K. Count += (r - l + 1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "id": "prob-447-subarray-product-less-than-k"
  },
  {
    "title": "Maximum Erasure Value",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Unique Elements Window Sum",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-erasure-value/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Sliding window with hash set tracking seen numbers, maximize running window sum.",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-448-maximum-erasure-value"
  },
  {
    "title": "Frequency of the Most Frequent Element",
    "difficulty": "Medium",
    "topic": "Sliding Window & Two Pointers",
    "pattern": "Sort + Sliding Window Window Sum",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/frequency-of-the-most-frequent-element/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Sort array. Window condition: nums[r] * (r - l + 1) - window_sum <= k. Maximize window length.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(1)",
    "id": "prob-449-frequency-of-the-most-frequent-element"
  },
  {
    "title": "Reverse Bits",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "Bit Extraction & Insertion",
    "sheets": [
      "NeetCode 150",
      "Blind 75",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/reverse-bits/",
    "companies": [
      "Apple",
      "Amazon",
      "Google"
    ],
    "notes": "Loop 32 times: res = (res << 1) | (n & 1); n >>= 1.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-450-reverse-bits"
  },
  {
    "title": "Counting Bits",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "pattern": "Bitwise DP",
    "sheets": [
      "NeetCode 150",
      "Blind 75",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/counting-bits/",
    "companies": [
      "Google",
      "Amazon",
      "Facebook"
    ],
    "notes": "dp[i] = dp[i >> 1] + (i & 1).",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "id": "prob-451-counting-bits"
  },
  {
    "title": "Sum of Two Integers Without Plus / Minus",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Half Adder Bitwise Simulation",
    "sheets": [
      "NeetCode 150",
      "Blind 75",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/sum-of-two-integers/",
    "companies": [
      "Google",
      "Facebook",
      "Amazon"
    ],
    "notes": "while (b != 0): carry = (a & b) << 1; a = a ^ b; b = carry.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-452-sum-of-two-integers-without-plus-minus"
  },
  {
    "title": "Bitwise AND of Numbers Range",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Common Prefix Shifting",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/bitwise-and-of-numbers-range/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Shift both left and right until left == right, then shift back to append zeroes.",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "id": "prob-453-bitwise-and-of-numbers-range"
  },
  {
    "title": "Total Hamming Distance",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Column-wise Bit Counting",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/total-hamming-distance/",
    "companies": [
      "Facebook",
      "Google"
    ],
    "notes": "For each bit position 0..31, count numbers with bit set (k) and unset (N - k). Distance = sum(k * (N - k)).",
    "timeComplexity": "O(32 * N)",
    "spaceComplexity": "O(1)",
    "id": "prob-454-total-hamming-distance"
  },
  {
    "title": "Maximum Product of Word Lengths",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Bitmask Encoding",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-product-of-word-lengths/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Encode each word's char set into 26-bit integer bitmask. If (mask[i] & mask[j]) == 0, words share no letters.",
    "timeComplexity": "O(N^2 + total_chars)",
    "spaceComplexity": "O(N)",
    "id": "prob-455-maximum-product-of-word-lengths"
  },
  {
    "title": "Gray Code",
    "difficulty": "Medium",
    "topic": "Bit Manipulation",
    "pattern": "Bitwise Reflection",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/gray-code/",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "G(i) = i ^ (i >> 1) for i in 0..(2^n - 1).",
    "timeComplexity": "O(2^N)",
    "spaceComplexity": "O(2^N)",
    "id": "prob-456-gray-code"
  },
  {
    "title": "Kth Largest Element in a Stream",
    "difficulty": "Easy",
    "topic": "Heap / Priority Queue",
    "pattern": "Min-Heap Fixed Size K",
    "sheets": [
      "NeetCode 150",
      "Blind 75",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/kth-largest-element-in-a-stream/",
    "companies": [
      "Amazon",
      "Google",
      "Facebook"
    ],
    "notes": "Maintain min-heap of size K. Top element is always Kth largest.",
    "timeComplexity": "O(log K) per add",
    "spaceComplexity": "O(K)",
    "id": "prob-457-kth-largest-element-in-a-stream"
  },
  {
    "title": "Last Stone Weight",
    "difficulty": "Easy",
    "topic": "Heap / Priority Queue",
    "pattern": "Max-Heap Simulation",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/last-stone-weight/",
    "companies": [
      "Amazon",
      "Apple"
    ],
    "notes": "Push all stones into max-heap. Pop top two, if unequal push difference back.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "id": "prob-458-last-stone-weight"
  },
  {
    "title": "Reorganize String",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Greedy Max-Heap + Cooldown",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/reorganize-string/",
    "companies": [
      "Google",
      "Amazon",
      "Facebook"
    ],
    "notes": "Max-heap of char counts. Greedily place most frequent char, hold previous char until next step.",
    "timeComplexity": "O(N log 26)",
    "spaceComplexity": "O(26)",
    "id": "prob-459-reorganize-string"
  },
  {
    "title": "Find K Pairs with Smallest Sums",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Min-Heap Frontier Expansion",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/find-k-pairs-with-smallest-sums/",
    "companies": [
      "Google",
      "Amazon",
      "Uber"
    ],
    "notes": "Push (nums1[i] + nums2[0], i, 0) into min-heap. When popped, push next pair (i, j+1).",
    "timeComplexity": "O(K log K)",
    "spaceComplexity": "O(K)",
    "id": "prob-460-find-k-pairs-with-smallest-sums"
  },
  {
    "title": "IPO (Maximize Capital)",
    "difficulty": "Hard",
    "topic": "Heap / Priority Queue",
    "pattern": "Dual Heap (Min-Capital & Max-Profit)",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/ipo/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Sort projects by capital requirement. Push affordable projects into max-profit heap, pick greedily K times.",
    "timeComplexity": "O(N log N + K log N)",
    "spaceComplexity": "O(N)",
    "id": "prob-461-ipo-maximize-capital"
  },
  {
    "title": "Seat Reservation Manager",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "pattern": "Min-Heap Allocation",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/seat-reservation-manager/",
    "companies": [
      "Amazon",
      "Bloomberg"
    ],
    "notes": "Min-heap tracks lowest available unreserved seat numbers.",
    "timeComplexity": "O(log N) per reserve / unreserve",
    "spaceComplexity": "O(N)",
    "id": "prob-462-seat-reservation-manager"
  },
  {
    "title": "Minimum Number of Refueling Stops",
    "difficulty": "Hard",
    "topic": "Heap / Priority Queue",
    "pattern": "Greedy Max-Heap Fuel Replenishment",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-number-of-refueling-stops/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Drive as far as current fuel allows. Whenever stuck, greedily refuel with largest fuel station passed so far.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "id": "prob-463-minimum-number-of-refueling-stops"
  },
  {
    "title": "Minimum Number of Arrows to Burst Balloons",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Intervals Sorting by End Time",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/",
    "companies": [
      "Amazon",
      "Facebook"
    ],
    "notes": "Sort balloons by end coordinate. If next start > prev_end, fire new arrow.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(1)",
    "id": "prob-464-minimum-number-of-arrows-to-burst-balloons"
  },
  {
    "title": "Video Stitching",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Greedy Jump Intervals",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/video-stitching/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Track maximum reachable endpoint using available clips, increment clip count on boundary transition.",
    "timeComplexity": "O(N + Time)",
    "spaceComplexity": "O(Time)",
    "id": "prob-465-video-stitching"
  },
  {
    "title": "Minimum Deletions to Make Character Frequencies Unique",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Greedy Frequency Decrement",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/minimum-deletions-to-make-character-frequencies-unique/",
    "companies": [
      "Microsoft",
      "Amazon"
    ],
    "notes": "Track seen frequencies in Hash Set. While freq > 0 and already seen, decrement freq and increment deletions count.",
    "timeComplexity": "O(N + 26 log 26)",
    "spaceComplexity": "O(26)",
    "id": "prob-466-minimum-deletions-to-make-character-frequencies-unique"
  },
  {
    "title": "Maximum Length of Pair Chain",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Interval Scheduling Greedy",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/maximum-length-of-pair-chain/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Sort pairs by end value. Greedily pick pair if start > current_end.",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(1)",
    "id": "prob-467-maximum-length-of-pair-chain"
  },
  {
    "title": "Queue Reconstruction by Height",
    "difficulty": "Medium",
    "topic": "Greedy & Intervals",
    "pattern": "Sort & In-Place Insert",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/queue-reconstruction-by-height/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Sort by height desc, k asc. Insert each person into result list at index k.",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)",
    "id": "prob-468-queue-reconstruction-by-height"
  },
  {
    "title": "Patching Array",
    "difficulty": "Hard",
    "topic": "Greedy & Intervals",
    "pattern": "Greedy Range Expansion",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/patching-array/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Maintain miss = smallest uncovered sum in [1, miss). If nums[i] <= miss, miss += nums[i]; else patch miss and miss += miss.",
    "timeComplexity": "O(N + log n)",
    "spaceComplexity": "O(1)",
    "id": "prob-469-patching-array"
  },
  {
    "title": "Letter Case Permutation",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Branching Recursion",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/letter-case-permutation/",
    "companies": [
      "Amazon",
      "Microsoft"
    ],
    "notes": "At each char: if letter, branch both lowercase and uppercase; else recurse next index.",
    "timeComplexity": "O(2^N * N)",
    "spaceComplexity": "O(N)",
    "id": "prob-470-letter-case-permutation"
  },
  {
    "title": "Restore IP Addresses",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Segment Partition Backtracking",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/restore-ip-addresses/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Partition string into 4 segments of length 1..3 with valid integer value 0..255 and no leading zeroes.",
    "timeComplexity": "O(3^4)",
    "spaceComplexity": "O(1)",
    "id": "prob-471-restore-ip-addresses"
  },
  {
    "title": "Word Break II (All Sentences)",
    "difficulty": "Hard",
    "topic": "Recursion & Backtracking",
    "pattern": "DFS + Memoization",
    "sheets": [
      "Striver A2Z",
      "Striver SDE"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/word-break-ii/",
    "companies": [
      "Amazon",
      "Google",
      "Bloomberg"
    ],
    "notes": "DFS with memoization returning list of valid sentences for suffix s[i..].",
    "timeComplexity": "O(N^2 + 2^N)",
    "spaceComplexity": "O(2^N)",
    "id": "prob-472-word-break-ii-all-sentences"
  },
  {
    "title": "Matchsticks to Square",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Partition into 4 Equal Sides",
    "sheets": [
      "NeetCode 150",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/matchsticks-to-square/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Sort descending, backtrack placing matchsticks into 4 sides of length total_sum / 4.",
    "timeComplexity": "O(4^N)",
    "spaceComplexity": "O(N)",
    "id": "prob-473-matchsticks-to-square"
  },
  {
    "title": "Partition to K Equal Sum Subsets",
    "difficulty": "Medium",
    "topic": "Recursion & Backtracking",
    "pattern": "Backtracking with Bitmask State",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/partition-to-k-equal-sum-subsets/",
    "companies": [
      "Amazon",
      "Google",
      "LinkedIn"
    ],
    "notes": "Backtrack across K buckets of target sum sum/K, prune with sorting and bucket deduplication.",
    "timeComplexity": "O(K * 2^N)",
    "spaceComplexity": "O(2^N)",
    "id": "prob-474-partition-to-k-equal-sum-subsets"
  },
  {
    "title": "Design Add and Search Words Data Structure",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Trie with Wildcard Search",
    "sheets": [
      "NeetCode 150",
      "Blind 75",
      "Striver A2Z"
    ],
    "sheet": "NeetCode 150",
    "url": "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
    "companies": [
      "Facebook",
      "Amazon",
      "Google"
    ],
    "notes": "Trie Node with children. For '.' wildcard, recursively search all 26 non-null children.",
    "timeComplexity": "O(M) for word, O(26^M) worst case for wildcards",
    "spaceComplexity": "O(N * M)",
    "id": "prob-475-design-add-and-search-words-data-structure"
  },
  {
    "title": "Replace Words (Prefix Root Replacement)",
    "difficulty": "Medium",
    "topic": "Tries",
    "pattern": "Shortest Prefix Matching",
    "sheets": [
      "Striver A2Z",
      "NeetCode 150"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/replace-words/",
    "companies": [
      "Amazon",
      "Uber"
    ],
    "notes": "Insert dictionary roots into Trie. For each sentence word, find shortest matching root prefix in Trie.",
    "timeComplexity": "O(Words * L)",
    "spaceComplexity": "O(Dict * L)",
    "id": "prob-476-replace-words-prefix-root-replacement"
  },
  {
    "title": "Concatenated Words",
    "difficulty": "Hard",
    "topic": "Tries",
    "pattern": "Trie / Word Break DFS",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/concatenated-words/",
    "companies": [
      "Amazon",
      "Google"
    ],
    "notes": "Sort words by length. For each word, verify if it can be formed by concatenating previously inserted words in Trie.",
    "timeComplexity": "O(N * L^2)",
    "spaceComplexity": "O(N * L)",
    "id": "prob-477-concatenated-words"
  },
  {
    "title": "Stream of Characters",
    "difficulty": "Hard",
    "topic": "Tries",
    "pattern": "Reverse Word Trie + Suffix Query",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/stream-of-characters/",
    "companies": [
      "Google",
      "Amazon"
    ],
    "notes": "Insert reversed words into Trie. For query(char), push to stream buffer and search suffix backwards in Trie.",
    "timeComplexity": "O(L) per query",
    "spaceComplexity": "O(Dict * L)",
    "id": "prob-478-stream-of-characters"
  },
  {
    "title": "Prefix and Suffix Search",
    "difficulty": "Hard",
    "topic": "Tries",
    "pattern": "Combined Suffix#Prefix Trie",
    "sheets": [
      "Striver A2Z"
    ],
    "sheet": "Striver A2Z",
    "url": "https://leetcode.com/problems/prefix-and-suffix-search/",
    "companies": [
      "Facebook",
      "Google"
    ],
    "notes": "Insert all suffix + '{' + word combinations into Trie. Query prefix as suffix + '{' + prefix.",
    "timeComplexity": "O(N * L^2) build, O(P + S) query",
    "spaceComplexity": "O(N * L^2)",
    "id": "prob-479-prefix-and-suffix-search"
  }
];
