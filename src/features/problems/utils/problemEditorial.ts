import type { Problem } from '../../../core/types/domain';

export interface EditorialApproach {
  isUnavailable?: boolean;
  intuition: string;
  bruteForce: {
    title: string;
    description: string;
    timeComplexity: string;
    spaceComplexity: string;
  };
  optimal: {
    title: string;
    description: string;
    timeComplexity: string;
    spaceComplexity: string;
    pseudocode?: string;
  };
  tips?: string[];
}

/**
 * Editorial generator providing takeUforward/LeetCode style DSA breakdowns (F-007)
 */
export function getProblemEditorial(p: Problem | null): EditorialApproach {
  const title = (p?.title || '').toLowerCase();

  if (title.includes('largest') && !title.includes('second')) {
    return {
      intuition:
        'To find the maximum element in an unsorted array, we examine each element sequentially while maintaining a running maximum value.',
      bruteForce: {
        title: 'Sorting Approach',
        description: 'Sort the entire array in ascending order and return the element at the last index (n - 1).',
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(1)',
      },
      optimal: {
        title: 'Single-Pass Linear Scan',
        description:
          'Initialize a variable `maxVal` with the first element `arr[0]`. Iterate through indices 1 to n - 1, updating `maxVal = max(maxVal, arr[i])`.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        pseudocode: `int maxVal = arr[0];
for (int i = 1; i < n; i++) {
    if (arr[i] > maxVal) {
        maxVal = arr[i];
    }
}
return maxVal;`,
      },
      tips: [
        'Always initialize with arr[0] or Integer.MIN_VALUE instead of 0 to support arrays containing only negative integers.',
        'Single element arrays (n = 1) should instantly return arr[0].',
      ],
    };
  }

  if (title.includes('second largest')) {
    return {
      intuition:
        'We need the greatest value that is strictly less than the array maximum. Tracking two running variables lets us accomplish this in a single scan.',
      bruteForce: {
        title: 'Two-Pass Scan / Sorting',
        description:
          'Sort the array (O(N log N)) or find the maximum in pass 1, then find the greatest element strictly smaller than max in pass 2.',
        timeComplexity: 'O(N log N) or O(2N)',
        spaceComplexity: 'O(1)',
      },
      optimal: {
        title: 'Single-Pass Dual Variable Tracking',
        description:
          'Maintain `largest = -1` and `secondLargest = -1`. For each element, update both variables conditionally when a strictly larger value appears.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        pseudocode: `int largest = arr[0], second = -1;
for (int i = 1; i < n; i++) {
    if (arr[i] > largest) {
        second = largest;
        largest = arr[i];
    } else if (arr[i] < largest && arr[i] > second) {
        second = arr[i];
    }
}
return second;`,
      },
      tips: [
        'If all elements in the array are identical (e.g., [10, 10, 10]), return -1 as no second largest exists.',
        'Beware of duplicate maximums.',
      ],
    };
  }

  if (title.includes('reverse') && title.includes('array')) {
    return {
      intuition:
        'Reversing an array is equivalent to swapping symmetrical elements moving from both boundary ends inward toward the center.',
      bruteForce: {
        title: 'Auxiliary Array Method',
        description:
          'Allocate a new array of size N. Iterate the original array backwards from n - 1 to 0 and insert into the auxiliary array.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
      },
      optimal: {
        title: 'Two-Pointers In-Place Swap',
        description:
          'Place `left = 0` and `right = n - 1`. While `left < right`, swap `arr[left]` and `arr[right]`, then advance `left++` and decrement `right--`.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        pseudocode: `int left = 0, right = n - 1;
while (left < right) {
    swap(arr[left], arr[right]);
    left++;
    right--;
}`,
      },
      tips: [
        'Loop condition must be `left < right` (not `left <= right`) to avoid redundant self-swaps.',
        'This in-place algorithm uses zero extra memory.',
      ],
    };
  }

  if (title.includes('longest substring') || title.includes('distinct characters')) {
    return {
      intuition:
        'To find the length of the longest substring without repeating characters, maintain a sliding window of unique characters with two pointers.',
      bruteForce: {
        title: 'Check All Substrings',
        description: 'Generate all possible substrings O(N^2) and check if each substring contains only unique characters using a Set O(N).',
        timeComplexity: 'O(N³)',
        spaceComplexity: 'O(min(N, M))',
      },
      optimal: {
        title: 'Sliding Window with Hash Map / Index Array',
        description:
          'Maintain a sliding window [left, right] and a map storing the last seen index of each character. When a duplicate character is encountered, jump the left pointer to max(left, lastSeen[char] + 1). Update max length at each step.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(min(N, M))',
        pseudocode: `Map<Character, Integer> charMap = new HashMap<>();
int maxLen = 0, left = 0;
for (int right = 0; right < s.length(); right++) {
    char c = s.charAt(right);
    if (charMap.containsKey(c)) {
        left = Math.max(left, charMap.get(c) + 1);
    }
    charMap.put(c, right);
    maxLen = Math.max(maxLen, right - left + 1);
}
return maxLen;`,
      },
      tips: [
        'The left pointer should never move backwards when updating: left = Math.max(left, charMap.get(c) + 1).',
        'String may contain symbols, spaces, and digits in addition to English letters.',
      ],
    };
  }

  if (title.includes('two sum') || title.includes('sum')) {
    return {
      intuition:
        'For any element X, the required complement to reach the target is (target - X). A hash table allows O(1) existence checks.',
      bruteForce: {
        title: 'Nested Loops',
        description: 'Iterate over all pairs (i, j) with i < j and check if arr[i] + arr[j] == target.',
        timeComplexity: 'O(N²)',
        spaceComplexity: 'O(1)',
      },
      optimal: {
        title: 'Hash Map Lookup',
        description:
          'Maintain a hash map of value to index. As you iterate each number, check if (target - arr[i]) exists in the map.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        pseudocode: `Map<Integer, Integer> map = new HashMap<>();
for (int i = 0; i < n; i++) {
    int complement = target - arr[i];
    if (map.containsKey(complement)) {
        return new int[]{map.get(complement), i};
    }
    map.put(arr[i], i);
}`,
      },
      tips: [
        'The same element cannot be used twice.',
        'Hash map average lookup time is O(1), making this optimal for large arrays.',
      ],
    };
  }

  // No verified editorial is available for unrecognized problems (F-007)
  return {
    isUnavailable: true,
    intuition: 'Editorial content is currently in preparation for this problem.',
    bruteForce: {
      title: 'Editorial in Preparation',
      description: 'The editorial approach and complexity analysis are currently being curated.',
      timeComplexity: '—',
      spaceComplexity: '—',
    },
    optimal: {
      title: 'Editorial in Preparation',
      description: 'Optimal solution and pseudocode will be available soon.',
      timeComplexity: '—',
      spaceComplexity: '—',
    },
    tips: [],
  };
}
