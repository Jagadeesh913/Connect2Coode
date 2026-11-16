import { describe, it, expect } from 'vitest';
import {
  extractConstraintsFromDescription,
  extractTestCasesFromProblem,
} from '../../features/admin/utils/testCaseUtils';

describe('Admin TestCase Utils', () => {
  it('extracts constraints from problem description text', () => {
    const description = `
# Problem Statement
Given an array of integers nums and an integer target, return indices of the two numbers.

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
`;
    const constraints = extractConstraintsFromDescription(description);
    expect(constraints).toContain('2 <= nums.length <= 10^4');
    expect(constraints).toContain('-10^9 <= nums[i] <= 10^9');
  });

  it('returns empty string if no constraints exist', () => {
    const description = 'Simple problem without constraints section.';
    expect(extractConstraintsFromDescription(description)).toBe('');
    expect(extractConstraintsFromDescription(null)).toBe('');
  });

  it('extracts structured test cases from markdown description', () => {
    const problem = {
      id: 42,
      title: 'Two Sum',
      description: `
Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]
`,
    };

    const cases = extractTestCasesFromProblem(problem);
    expect(cases.length).toBe(2);
    expect(cases[0].input).toContain('nums = [2,7,11,15]');
    expect(cases[0].expectedOutput).toContain('[0,1]');
    expect(cases[0].isHidden).toBe(false);
    expect(cases[1].input).toContain('nums = [3,2,4]');
    expect(cases[1].expectedOutput).toContain('[1,2]');
  });
});
