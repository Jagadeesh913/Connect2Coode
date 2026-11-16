import { describe, it, expect } from 'vitest';
import {
  extractConstraintsFromDescription,
  extractTestCasesFromProblem,
  resolveTestCaseType,
  reconcileTestCasesWithReferenceTypes,
  validateTestCase,
} from '../../features/admin/utils/testCaseUtils';
import type { QuestionTestCase, ReferenceItem } from '../../core/types/domain';

const mockReferenceOptions: ReferenceItem[] = [
  {
    id: 1,
    refGroupCode: 'TESTCASETYPE',
    refCode: 'SAMPLE',
    refName: 'Visible Sample Test Case',
    isActive: true,
  },
  {
    id: 2,
    refGroupCode: 'TESTCASETYPE',
    refCode: 'NECESSARY',
    refName: 'Mandatory Test Case',
    isActive: true,
  },
];

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
    expect(cases[0].typeRefCode).toBe(''); // Raw extraction leaves empty type when no options provided
    expect(cases[1].input).toContain('nums = [3,2,4]');
    expect(cases[1].expectedOutput).toContain('[1,2]');
  });

  describe('resolveTestCaseType', () => {
    it('resolves visible testcase to SAMPLE reference option', () => {
      const resolved = resolveTestCaseType(mockReferenceOptions, false);
      expect(resolved).toBeDefined();
      expect(resolved?.refCode).toBe('SAMPLE');
      expect(resolved?.refName).toBe('Visible Sample Test Case');
    });

    it('resolves hidden testcase to NECESSARY reference option', () => {
      const resolved = resolveTestCaseType(mockReferenceOptions, true);
      expect(resolved).toBeDefined();
      expect(resolved?.refCode).toBe('NECESSARY');
      expect(resolved?.refName).toBe('Mandatory Test Case');
    });

    it('preserves existing valid type code if found in options', () => {
      const resolved = resolveTestCaseType(mockReferenceOptions, false, 'NECESSARY');
      expect(resolved).toBeDefined();
      expect(resolved?.refCode).toBe('NECESSARY');
    });

    it('preserves existing valid type code case-insensitively', () => {
      const resolved = resolveTestCaseType(mockReferenceOptions, false, 'sample');
      expect(resolved).toBeDefined();
      expect(resolved?.refCode).toBe('SAMPLE');
    });

    it('never invents defaults when reference options are empty', () => {
      const resolved = resolveTestCaseType([], false);
      expect(resolved).toBeUndefined();
    });
  });

  describe('reconcileTestCasesWithReferenceTypes', () => {
    it('preserves existing valid type codes on edited test cases', () => {
      const cases: QuestionTestCase[] = [
        {
          input: '1',
          expectedOutput: '2',
          explanation: '',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: 'SAMPLE',
          typeRefName: 'Visible Sample Test Case',
        },
        {
          input: '10',
          expectedOutput: '20',
          explanation: '',
          isHidden: true,
          displayOrder: 2,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: 'NECESSARY',
          typeRefName: 'Mandatory Test Case',
        },
      ];

      const reconciled = reconcileTestCasesWithReferenceTypes(cases, mockReferenceOptions);
      expect(reconciled[0].typeRefCode).toBe('SAMPLE');
      expect(reconciled[1].typeRefCode).toBe('NECESSARY');
      expect(reconciled[0].input).toBe('1');
      expect(reconciled[1].input).toBe('10');
    });

    it('reconciles imported/extracted test cases missing typeRefCode', () => {
      const importedCases: QuestionTestCase[] = [
        {
          input: '[1, 2]',
          expectedOutput: '3',
          explanation: '',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: '',
          typeRefCode: '',
          typeRefName: '',
        },
        {
          input: '[10, 20]',
          expectedOutput: '30',
          explanation: '',
          isHidden: true,
          displayOrder: 2,
          typeRefGroupCode: '',
          typeRefCode: '',
          typeRefName: '',
        },
      ];

      const reconciled = reconcileTestCasesWithReferenceTypes(importedCases, mockReferenceOptions);
      expect(reconciled[0].typeRefCode).toBe('SAMPLE');
      expect(reconciled[0].typeRefName).toBe('Visible Sample Test Case');
      expect(reconciled[0].typeRefGroupCode).toBe('TESTCASETYPE');

      expect(reconciled[1].typeRefCode).toBe('NECESSARY');
      expect(reconciled[1].typeRefName).toBe('Mandatory Test Case');
      expect(reconciled[1].typeRefGroupCode).toBe('TESTCASETYPE');
    });

    it('leaves test cases unchanged if options array is empty', () => {
      const cases: QuestionTestCase[] = [
        {
          input: '1',
          expectedOutput: '2',
          explanation: '',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: '',
          typeRefCode: '',
        },
      ];

      const reconciled = reconcileTestCasesWithReferenceTypes(cases, []);
      expect(reconciled[0].typeRefCode).toBe('');
    });
  });

  describe('extractTestCasesFromProblem with reference options', () => {
    it('populates valid SAMPLE type on extracted markdown examples when options are provided', () => {
      const problem = {
        id: 10,
        title: 'Reverse String',
        description: 'Example 1:\nInput: s = "hello"\nOutput: "olleh"',
      };

      const cases = extractTestCasesFromProblem(problem, mockReferenceOptions);
      expect(cases.length).toBe(1);
      expect(cases[0].input).toContain('s = "hello"');
      expect(cases[0].expectedOutput).toBe('"olleh"');
      expect(cases[0].typeRefCode).toBe('SAMPLE');
      expect(cases[0].typeRefName).toBe('Visible Sample Test Case');
      expect(cases[0].isHidden).toBe(false);
    });

    it('preserves existing valid types from explicit question.testCases', () => {
      const problem = {
        id: 20,
        title: 'Valid Parentheses',
        testCases: [
          {
            id: 101,
            input: '()',
            expectedOutput: 'true',
            explanation: '',
            isHidden: false,
            displayOrder: 1,
            typeRefGroupCode: 'TESTCASETYPE',
            typeRefCode: 'SAMPLE',
            typeRefName: 'Visible Sample Test Case',
          },
          {
            id: 102,
            input: '([)]',
            expectedOutput: 'false',
            explanation: '',
            isHidden: true,
            displayOrder: 2,
            typeRefGroupCode: 'TESTCASETYPE',
            typeRefCode: 'NECESSARY',
            typeRefName: 'Mandatory Test Case',
          },
        ],
      };

      const cases = extractTestCasesFromProblem(problem, mockReferenceOptions);
      expect(cases.length).toBe(2);
      expect(cases[0].typeRefCode).toBe('SAMPLE');
      expect(cases[1].typeRefCode).toBe('NECESSARY');
    });
  });

  describe('validateTestCase', () => {
    it('returns errors when required fields are missing', () => {
      const tc: QuestionTestCase = {
        input: '',
        expectedOutput: '',
        explanation: '',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: '',
      };

      const errors = validateTestCase(tc, mockReferenceOptions);
      expect(errors).toBeDefined();
      expect(errors?.input).toBe('Input raw string is required');
      expect(errors?.expectedOutput).toBe('Expected output raw string is required');
      expect(errors?.typeRefCode).toBe('Test case type is required');
    });

    it('rejects invalid typeRefCode not present in reference options', () => {
      const tc: QuestionTestCase = {
        input: '1',
        expectedOutput: '2',
        explanation: '',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'INVALID_TYPE',
      };

      const errors = validateTestCase(tc, mockReferenceOptions);
      expect(errors).toBeDefined();
      expect(errors?.typeRefCode).toBe('Select a valid type from the reference library');
    });

    it('returns null when test case is completely valid', () => {
      const tc: QuestionTestCase = {
        input: '1',
        expectedOutput: '2',
        explanation: '',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
      };

      const errors = validateTestCase(tc, mockReferenceOptions);
      expect(errors).toBeNull();
    });
  });
});

