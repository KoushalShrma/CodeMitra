const makeApproaches = (pattern) => [
  {
    id: 'brute-force',
    label: 'Brute Force',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    summary: 'Start with direct enumeration to validate correctness before optimizing.',
    whenToUse: 'Useful for very small inputs or baseline verification.',
  },
  {
    id: 'improved',
    label: 'Improved',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    summary: 'Use sorting, indexing, or caching to reduce repeated computations.',
    whenToUse: 'Good balance between readability and performance.',
  },
  {
    id: 'optimal',
    label: 'Optimal',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    summary: `Apply a focused ${pattern.toLowerCase()} strategy to process data efficiently in one pass when possible.`,
    whenToUse: 'Preferred for large constraints and production use.',
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const coreProblems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Array',
    pattern: 'Hashing',
    description:
      'Given a list of numbers and a target value, return the indices of two different elements whose sum equals the target.',
    example: {
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      explanation: '2 and 7 add to 9, so their indices are returned.',
    },
    constraints: [
      '2 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9',
      'Exactly one valid pair exists',
    ],
    approaches: makeApproaches('Hashing'),
    realWorldExamples: [
      'Finding two transaction amounts that match a flagged total.',
      'Pairing two item prices to reach a promotion threshold.',
      'Selecting two workloads that exactly fill a compute slot.',
    ],
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    pattern: 'Stack Matching',
    description:
      'Given a string containing bracket characters, determine whether every opening bracket is closed in the correct order.',
    example: {
      input: 's = "({[]})"',
      output: 'true',
      explanation: 'Each bracket closes with its matching type in valid sequence.',
    },
    constraints: ['1 <= s.length <= 10^4', 's contains only ()[]{}'],
    approaches: makeApproaches('Stack Matching'),
    realWorldExamples: [
      'Validating balanced tokens in a code editor.',
      'Checking structured markup before rendering.',
      'Ensuring nested workflow blocks are correctly closed.',
    ],
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    topic: 'String',
    pattern: 'Two Pointer',
    description: 'Reverse an array of characters in place without allocating another full array.',
    example: {
      input: "s = ['c','o','d','e']",
      output: "['e','d','o','c']",
      explanation: 'Swap characters from both ends moving inward.',
    },
    constraints: ['1 <= s.length <= 10^5', 'Characters are printable ASCII'],
    approaches: makeApproaches('Two Pointer'),
    realWorldExamples: [
      'Reversing encoded segments in parsing tools.',
      'Processing mirrored string transforms.',
      'Undoing order-sensitive text operations.',
    ],
  },
  {
    id: 'maximum-subarray',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    topic: 'Array',
    pattern: 'Kadane',
    description: 'Find the contiguous segment with the largest possible sum and return that sum.',
    example: {
      input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
      output: '6',
      explanation: 'The best segment is [4,-1,2,1] with total 6.',
    },
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    approaches: makeApproaches('Kadane'),
    realWorldExamples: [
      'Finding the best profit streak in daily returns.',
      'Detecting strongest signal window in telemetry.',
      'Locating peak momentum period in app traffic.',
    ],
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    topic: 'Array',
    pattern: 'Binary Search',
    description:
      'Given a sorted array and a target, return the index of the target or -1 if it does not exist.',
    example: {
      input: 'nums = [-1,0,3,5,9,12], target = 9',
      output: '4',
      explanation: 'The target appears at position 4.',
    },
    constraints: ['1 <= nums.length <= 10^5', 'nums is sorted in ascending order'],
    approaches: makeApproaches('Binary Search'),
    realWorldExamples: [
      'Fast lookup in sorted product catalogs.',
      'Searching timestamped logs by key.',
      'Indexing pages in document retrieval systems.',
    ],
  },
  {
    id: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    topic: 'Dynamic Programming',
    pattern: 'DP 1D',
    description:
      'Count the number of distinct ways to reach step n when each move can be 1 or 2 steps.',
    example: {
      input: 'n = 5',
      output: '8',
      explanation: 'Ways follow a Fibonacci-style recurrence.',
    },
    constraints: ['1 <= n <= 45'],
    approaches: makeApproaches('DP 1D'),
    realWorldExamples: [
      'Counting route combinations with short jumps.',
      'Estimating UI navigation paths with fixed transitions.',
      'Planning incremental task sequences.',
    ],
  },
  {
    id: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'String',
    pattern: 'Sliding Window',
    description: 'Return the length of the longest substring that contains no repeated characters.',
    example: {
      input: 's = "abcabcbb"',
      output: '3',
      explanation: '"abc" is the longest segment with all unique characters.',
    },
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's can contain letters, digits, symbols, and spaces',
    ],
    approaches: makeApproaches('Sliding Window'),
    realWorldExamples: [
      'Detecting longest unique token stretch in logs.',
      'Measuring non-repeating signal bursts.',
      'Validating uniqueness spans in typed streams.',
    ],
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    topic: 'Interval',
    pattern: 'Sort and Merge',
    description:
      'Given a set of intervals, combine all overlapping ranges and return the compacted result.',
    example: {
      input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
      output: '[[1,6],[8,10],[15,18]]',
      explanation: '[1,3] and [2,6] overlap and collapse into [1,6].',
    },
    constraints: ['1 <= intervals.length <= 10^4', '0 <= start <= end <= 10^4'],
    approaches: makeApproaches('Sort and Merge'),
    realWorldExamples: [
      'Combining overlapping calendar bookings.',
      'Merging active machine uptime windows.',
      'Consolidating overlapping shipment slots.',
    ],
  },
  {
    id: 'fibonacci-number',
    title: 'Fibonacci Number',
    difficulty: 'Easy',
    topic: 'Dynamic Programming',
    pattern: 'Recursion + Memoization',
    description: 'Compute the nth Fibonacci number where F(0)=0 and F(1)=1.',
    example: {
      input: 'n = 7',
      output: '13',
      explanation: 'The sequence is 0,1,1,2,3,5,8,13.',
    },
    constraints: ['0 <= n <= 30'],
    approaches: makeApproaches('Recursion + Memoization'),
    realWorldExamples: [
      'Modeling simple branching growth over time.',
      'Teaching recurrence optimization concepts.',
      'Benchmarking memoization vs iteration.',
    ],
  },
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    topic: 'Array',
    pattern: 'Hashing',
    description: 'Check whether any value appears at least twice in the input array.',
    example: {
      input: 'nums = [1,2,3,1]',
      output: 'true',
      explanation: 'Value 1 appears more than once.',
    },
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    approaches: makeApproaches('Hashing'),
    realWorldExamples: [
      'Checking duplicate user IDs in batch imports.',
      'Detecting repeated event identifiers.',
      'Validating uniqueness in transaction lists.',
    ],
  },
  {
    id: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    topic: 'Array',
    pattern: 'Prefix-Suffix',
    description:
      'For each index, compute the product of all other elements without using division.',
    example: {
      input: 'nums = [1,2,3,4]',
      output: '[24,12,8,6]',
      explanation: 'Each position uses product of left and right sides.',
    },
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
    approaches: makeApproaches('Prefix-Suffix'),
    realWorldExamples: [
      'Computing influence score excluding current component.',
      'Building leave-one-out metrics.',
      'Sensitivity analysis in model inputs.',
    ],
  },
  {
    id: 'kth-smallest-in-bst',
    title: 'Kth Smallest in BST',
    difficulty: 'Medium',
    topic: 'Tree',
    pattern: 'Inorder Traversal',
    description: 'Given a binary search tree, return the kth smallest value in sorted order.',
    example: {
      input: 'root = [3,1,4,null,2], k = 1',
      output: '1',
      explanation: 'Inorder traversal visits values in ascending order.',
    },
    constraints: ['1 <= k <= number of nodes', 'Node values are unique'],
    approaches: makeApproaches('Inorder Traversal'),
    realWorldExamples: [
      'Selecting rank-based values in ordered indexes.',
      'Finding percentile checkpoints in structured data.',
      'Retrieving kth item in sorted category hierarchies.',
    ],
  },
];

const topicPatternPool = [
  { topic: 'Array', pattern: 'Two Pointer' },
  { topic: 'Array', pattern: 'Sliding Window' },
  { topic: 'Array', pattern: 'Hashing' },
  { topic: 'String', pattern: 'Sliding Window' },
  { topic: 'String', pattern: 'Two Pointer' },
  { topic: 'Stack', pattern: 'Monotonic Stack' },
  { topic: 'Queue', pattern: 'Deque' },
  { topic: 'Linked List', pattern: 'Fast-Slow Pointer' },
  { topic: 'Linked List', pattern: 'In-place Reversal' },
  { topic: 'Tree', pattern: 'DFS' },
  { topic: 'Tree', pattern: 'BFS' },
  { topic: 'Graph', pattern: 'DFS' },
  { topic: 'Graph', pattern: 'BFS' },
  { topic: 'Graph', pattern: 'Union Find' },
  { topic: 'Binary Search', pattern: 'Binary Search' },
  { topic: 'Dynamic Programming', pattern: 'DP 1D' },
  { topic: 'Dynamic Programming', pattern: 'DP 2D' },
  { topic: 'Greedy', pattern: 'Greedy Choice' },
  { topic: 'Interval', pattern: 'Sort and Merge' },
  { topic: 'Heap', pattern: 'Priority Queue' },
  { topic: 'Backtracking', pattern: 'Recursion' },
  { topic: 'Bit Manipulation', pattern: 'Bitmask' },
  { topic: 'Math', pattern: 'Number Theory' },
  { topic: 'Matrix', pattern: 'Simulation' },
];

const titleFragments = [
  'Smallest Window to Satisfy Condition',
  'Longest Balanced Segment',
  'Minimum Operations to Stabilize Sequence',
  'Count Valid Rearrangements',
  'Best Split for Maximum Gain',
  'Detect First Critical Index',
  'Aggregate Range Impact',
  'Constrained Path Builder',
  'Target Reachability Check',
  'Segment Compression Challenge',
  'Bounded Frequency Optimizer',
  'Pattern-Aligned Traversal',
  'Threshold Crossing Locator',
  'Efficient Pair Aggregator',
  'Range Consistency Validator',
  'Substructure Similarity Scan',
  'Indexed Transition Planner',
  'Resource Allocation Optimizer',
  'Minimal Cover Constructor',
  'Stable Grouping Evaluator',
];

const difficulties = ['Easy', 'Medium', 'Hard'];

export const practiceProblems = [...coreProblems];

export const practiceTestCases = {
  'two-sum': [
    { id: 'tc1', label: 'Case 1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
    { id: 'tc2', label: 'Case 2', input: '[3,2,4], 6', expectedOutput: '[1,2]' },
    { id: 'tc3', label: 'Case 3', input: '[3,3], 6', expectedOutput: '[0,1]' },
  ],
  'valid-parentheses': [
    { id: 'tc1', label: 'Case 1', input: '()[]{}', expectedOutput: 'true' },
    { id: 'tc2', label: 'Case 2', input: '(]', expectedOutput: 'false' },
    { id: 'tc3', label: 'Case 3', input: '([{}])', expectedOutput: 'true' },
  ],
  'reverse-string': [
    {
      id: 'tc1',
      label: 'Case 1',
      input: "['h','e','l','l','o']",
      expectedOutput: "['o','l','l','e','h']",
    },
    { id: 'tc2', label: 'Case 2', input: "['C','M']", expectedOutput: "['M','C']" },
    { id: 'tc3', label: 'Case 3', input: "['a']", expectedOutput: "['a']" },
  ],
  'maximum-subarray': [
    { id: 'tc1', label: 'Case 1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
    { id: 'tc2', label: 'Case 2', input: '[1]', expectedOutput: '1' },
    { id: 'tc3', label: 'Case 3', input: '[5,4,-1,7,8]', expectedOutput: '23' },
  ],
  'binary-search': [
    { id: 'tc1', label: 'Case 1', input: '[-1,0,3,5,9,12], 9', expectedOutput: '4' },
    { id: 'tc2', label: 'Case 2', input: '[-1,0,3,5,9,12], 2', expectedOutput: '-1' },
    { id: 'tc3', label: 'Case 3', input: '[5], 5', expectedOutput: '0' },
  ],
  'climbing-stairs': [
    { id: 'tc1', label: 'Case 1', input: '2', expectedOutput: '2' },
    { id: 'tc2', label: 'Case 2', input: '3', expectedOutput: '3' },
    { id: 'tc3', label: 'Case 3', input: '5', expectedOutput: '8' },
  ],
  'longest-substring-without-repeating-characters': [
    { id: 'tc1', label: 'Case 1', input: 'abcabcbb', expectedOutput: '3' },
    { id: 'tc2', label: 'Case 2', input: 'bbbbb', expectedOutput: '1' },
    { id: 'tc3', label: 'Case 3', input: 'pwwkew', expectedOutput: '3' },
  ],
  'merge-intervals': [
    {
      id: 'tc1',
      label: 'Case 1',
      input: '[[1,3],[2,6],[8,10],[15,18]]',
      expectedOutput: '[[1,6],[8,10],[15,18]]',
    },
    { id: 'tc2', label: 'Case 2', input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
    { id: 'tc3', label: 'Case 3', input: '[[1,2],[3,4]]', expectedOutput: '[[1,2],[3,4]]' },
  ],
  'fibonacci-number': [
    { id: 'tc1', label: 'Case 1', input: '2', expectedOutput: '1' },
    { id: 'tc2', label: 'Case 2', input: '7', expectedOutput: '13' },
    { id: 'tc3', label: 'Case 3', input: '10', expectedOutput: '55' },
  ],
  'contains-duplicate': [
    { id: 'tc1', label: 'Case 1', input: '[1,2,3,1]', expectedOutput: 'true' },
    { id: 'tc2', label: 'Case 2', input: '[1,2,3,4]', expectedOutput: 'false' },
    { id: 'tc3', label: 'Case 3', input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true' },
  ],
  'product-of-array-except-self': [
    { id: 'tc1', label: 'Case 1', input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]' },
    { id: 'tc2', label: 'Case 2', input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]' },
    { id: 'tc3', label: 'Case 3', input: '[2,3]', expectedOutput: '[3,2]' },
  ],
  'kth-smallest-in-bst': [
    { id: 'tc1', label: 'Case 1', input: '[3,1,4,null,2], 1', expectedOutput: '1' },
    { id: 'tc2', label: 'Case 2', input: '[5,3,6,2,4,null,null,1], 3', expectedOutput: '3' },
    { id: 'tc3', label: 'Case 3', input: '[2,1,3], 2', expectedOutput: '2' },
  ],
};

const targetCount = 120;
let index = 1;

while (practiceProblems.length < targetCount) {
  const topicPattern = topicPatternPool[(index - 1) % topicPatternPool.length];
  const titleFragment = titleFragments[(index - 1) % titleFragments.length];
  const difficulty = difficulties[(index + Math.floor(index / 7)) % difficulties.length];
  const title = `${titleFragment} ${index}`;
  const id = `${slugify(title)}-${slugify(topicPattern.topic)}`;

  practiceProblems.push({
    id,
    title,
    difficulty,
    topic: topicPattern.topic,
    pattern: topicPattern.pattern,
    description: `Design an algorithm for a ${topicPattern.topic.toLowerCase()} task where the objective is to ${titleFragment.toLowerCase()}. Use ${topicPattern.pattern.toLowerCase()} thinking to improve efficiency over naive scanning.`,
    example: {
      input: `sampleInput = ${index}, mode = "${topicPattern.pattern}"`,
      output: `${(index % 7) + 2}`,
      explanation: `The sample demonstrates how ${topicPattern.pattern.toLowerCase()} narrows the search space and produces a deterministic result.`,
    },
    constraints: [
      '1 <= n <= 10^5',
      'Input values are integers unless otherwise stated',
      'Expected solution should outperform quadratic brute force',
    ],
    approaches: makeApproaches(topicPattern.pattern),
    realWorldExamples: [
      `Optimizing ${topicPattern.topic.toLowerCase()} processing in analytics pipelines.`,
      `Building reliable decision logic with ${topicPattern.pattern.toLowerCase()} under latency constraints.`,
      'Handling large production inputs with predictable memory usage.',
    ],
  });

  practiceTestCases[id] = [
    {
      id: 'tc1',
      label: 'Case 1',
      input: `${index}, ${index + 1}, ${index + 2}`,
      expectedOutput: `${(index % 5) + 1}`,
    },
    {
      id: 'tc2',
      label: 'Case 2',
      input: `${index + 3}, ${index + 5}, ${index + 8}`,
      expectedOutput: `${(index % 4) + 2}`,
    },
    {
      id: 'tc3',
      label: 'Case 3',
      input: `${index + 13}, ${index + 21}`,
      expectedOutput: `${(index % 6) + 1}`,
    },
  ];

  index += 1;
}

export const practiceProblem = practiceProblems[0];
export const practiceTestCasesList = practiceTestCases[practiceProblem.id] || [];
