const fallbackTemplates = {
  JavaScript: `function solve(...args) {
  // TODO: Write logic here
  return undefined;
}
`,
  Python: `class Solution:
    def solve(self, *args):
        # TODO: Write logic here
        return None
`,
  Java: `class Solution {
  public Object solve(Object... args) {
    // TODO: Write logic here
    return null;
  }
}
`,
  'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  int solve() {
    // TODO: Write logic here
    return 0;
  }
};
`,
};

export const practiceProblemMeta = {
  'two-sum': {
    functionName: 'twoSum',
    paramTypes: ['intArray', 'int'],
    templates: {
      Python: `class Solution:
    def twoSum(self, nums, target):
        # TODO: Write logic here
        return []
`,
      Java: `class Solution {
  public int[] twoSum(int[] nums, int target) {
    // TODO: Write logic here
    return new int[0];
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  vector<int> twoSum(vector<int>& nums, int target) {
    // TODO: Write logic here
    return {};
  }
};
`,
    },
  },
  'valid-parentheses': {
    functionName: 'isValid',
    paramTypes: ['string'],
    templates: {
      Python: `class Solution:
    def isValid(self, s):
        # TODO: Write logic here
        return False
`,
      Java: `class Solution {
  public boolean isValid(String s) {
    // TODO: Write logic here
    return false;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  bool isValid(string s) {
    // TODO: Write logic here
    return false;
  }
};
`,
    },
  },
  'reverse-string': {
    functionName: 'reverseString',
    paramTypes: ['charArray'],
    templates: {
      Python: `class Solution:
    def reverseString(self, s):
        # TODO: Write logic here
        return s[::-1]
`,
      Java: `class Solution {
  public char[] reverseString(char[] s) {
    // TODO: Write logic here
    return s;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  vector<string> reverseString(vector<string>& s) {
    // TODO: Write logic here
    return s;
  }
};
`,
    },
  },
  'maximum-subarray': {
    functionName: 'maxSubArray',
    paramTypes: ['intArray'],
    templates: {
      Python: `class Solution:
    def maxSubArray(self, nums):
        # TODO: Write logic here
        return 0
`,
      Java: `class Solution {
  public int maxSubArray(int[] nums) {
    // TODO: Write logic here
    return 0;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  int maxSubArray(vector<int>& nums) {
    // TODO: Write logic here
    return 0;
  }
};
`,
    },
  },
  'binary-search': {
    functionName: 'search',
    paramTypes: ['intArray', 'int'],
    templates: {
      Python: `class Solution:
    def search(self, nums, target):
        # TODO: Write logic here
        return -1
`,
      Java: `class Solution {
  public int search(int[] nums, int target) {
    // TODO: Write logic here
    return -1;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  int search(vector<int>& nums, int target) {
    // TODO: Write logic here
    return -1;
  }
};
`,
    },
  },
  'climbing-stairs': {
    functionName: 'climbStairs',
    paramTypes: ['int'],
    templates: {
      Python: `class Solution:
    def climbStairs(self, n):
        # TODO: Write logic here
        return 0
`,
      Java: `class Solution {
  public int climbStairs(int n) {
    // TODO: Write logic here
    return 0;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  int climbStairs(int n) {
    // TODO: Write logic here
    return 0;
  }
};
`,
    },
  },
  'longest-substring-without-repeating-characters': {
    functionName: 'lengthOfLongestSubstring',
    paramTypes: ['string'],
    templates: {
      Python: `class Solution:
    def lengthOfLongestSubstring(self, s):
        # TODO: Write logic here
        return 0
`,
      Java: `class Solution {
  public int lengthOfLongestSubstring(String s) {
    // TODO: Write logic here
    return 0;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  int lengthOfLongestSubstring(string s) {
    // TODO: Write logic here
    return 0;
  }
};
`,
    },
  },
  'merge-intervals': {
    functionName: 'merge',
    paramTypes: ['intMatrix'],
    templates: {
      Python: `class Solution:
    def merge(self, intervals):
        # TODO: Write logic here
        return intervals
`,
      Java: `class Solution {
  public int[][] merge(int[][] intervals) {
    // TODO: Write logic here
    return intervals;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  vector<vector<int>> merge(vector<vector<int>>& intervals) {
    // TODO: Write logic here
    return intervals;
  }
};
`,
    },
  },
  'fibonacci-number': {
    functionName: 'fib',
    paramTypes: ['int'],
    templates: {
      Python: `class Solution:
    def fib(self, n):
        # TODO: Write logic here
        return 0
`,
      Java: `class Solution {
  public int fib(int n) {
    // TODO: Write logic here
    return 0;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  int fib(int n) {
    // TODO: Write logic here
    return 0;
  }
};
`,
    },
  },
  'contains-duplicate': {
    functionName: 'containsDuplicate',
    paramTypes: ['intArray'],
    templates: {
      Python: `class Solution:
    def containsDuplicate(self, nums):
        # TODO: Write logic here
        return False
`,
      Java: `class Solution {
  public boolean containsDuplicate(int[] nums) {
    // TODO: Write logic here
    return false;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  bool containsDuplicate(vector<int>& nums) {
    // TODO: Write logic here
    return false;
  }
};
`,
    },
  },
  'product-of-array-except-self': {
    functionName: 'productExceptSelf',
    paramTypes: ['intArray'],
    templates: {
      Python: `class Solution:
    def productExceptSelf(self, nums):
        # TODO: Write logic here
        return []
`,
      Java: `class Solution {
  public int[] productExceptSelf(int[] nums) {
    // TODO: Write logic here
    return new int[0];
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  vector<int> productExceptSelf(vector<int>& nums) {
    // TODO: Write logic here
    return {};
  }
};
`,
    },
  },
  'kth-smallest-in-bst': {
    functionName: 'kthSmallest',
    paramTypes: ['treeLevelOrder', 'int'],
    templates: {
      Python: `class Solution:
    def kthSmallest(self, root, k):
        # TODO: Write logic here
        return 0
`,
      Java: `class Solution {
  public int kthSmallest(Object root, int k) {
    // TODO: Write logic here
    return 0;
  }
}
`,
      'C++': `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
  int kthSmallest(void* root, int k) {
    // TODO: Write logic here
    return 0;
  }
};
`,
    },
  },
};

function buildJavaScriptStarterCode(problemId) {
  const meta = practiceProblemMeta[problemId];
  const functionName = meta?.functionName || 'solve';

  return `function ${functionName}(...args) {
  // TODO: Write logic here
  return undefined;
}
`;
}

function buildPythonStarterCode(problemId) {
  const template = practiceProblemMeta[problemId]?.templates?.Python || fallbackTemplates.Python;
  const lines = template.split('\n');
  const methodLine = lines.find((line) => line.trim().startsWith('def '));
  const bodyLines = lines.filter(
    (line) => line.startsWith('    ') && !line.trim().startsWith('def ')
  );

  if (!methodLine) {
    return `def solve(*args):
    # TODO: Write logic here
    return None
`;
  }

  return `${methodLine.trim().replace('(self, ', '(').replace('(self)', '()')}
${bodyLines.map((line) => line.slice(4)).join('\n')}
`;
}

function buildJavaStarterCode(problemId) {
  const template = practiceProblemMeta[problemId]?.templates?.Java || fallbackTemplates.Java;
  return template
    .split('\n')
    .filter((line) => line.trim() !== 'class Solution {' && line.trim() !== '}')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return '';
      }

      return line.replace(/^ {2}/, '').replace(/^public\s+/, 'public static ');
    })
    .join('\n')
    .trim()
    .concat('\n');
}

function buildCppStarterCode(problemId) {
  const template = practiceProblemMeta[problemId]?.templates?.['C++'] || fallbackTemplates['C++'];
  return template
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith('#include') &&
        line.trim() !== 'using namespace std;' &&
        line.trim() !== 'class Solution {' &&
        line.trim() !== 'public:' &&
        line.trim() !== '};'
    )
    .map((line) => line.replace(/^ {2}/, ''))
    .join('\n')
    .trim()
    .concat('\n');
}

export function getPracticeProblemMeta(problemId) {
  return (
    practiceProblemMeta[problemId] || {
      functionName: 'solve',
      paramTypes: [],
      templates: fallbackTemplates,
    }
  );
}

export function getPracticeStarterCode(problemId, language) {
  const meta = getPracticeProblemMeta(problemId);
  if (language === 'JavaScript') {
    return buildJavaScriptStarterCode(problemId);
  }

  if (language === 'Python') {
    return buildPythonStarterCode(problemId);
  }

  if (language === 'Java') {
    return buildJavaStarterCode(problemId);
  }

  if (language === 'C++') {
    return buildCppStarterCode(problemId);
  }

  return meta.templates?.[language] || fallbackTemplates[language] || '';
}
