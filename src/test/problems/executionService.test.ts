import { describe, it, expect, vi } from 'vitest';
import {
  executionService,
  normalizeExecutionTestCaseResult,
  getExecutionVerdict,
  isExecutionResultSuccessful,
  type ExecutionResultData,
} from '../../services/executionService';
import { apiClient } from '../../core/api/apiClient';
import type { ApiResponse } from '../../core/types/api';
import type { ExecutionTestCaseResult } from '../../core/types/domain';

const makeTestCase = (
  overrides: Partial<ExecutionTestCaseResult> = {}
): ExecutionTestCaseResult => ({
  testCaseId: 1,
  testCaseType: 'Sample',
  status: 'Accepted',
  isHidden: false,
  ...overrides,
});

describe('executionService unit tests', () => {
  describe('normalizeExecutionTestCaseResult', () => {
    it('correctly marks visible test cases when isHidden is false', () => {
      const result = normalizeExecutionTestCaseResult({
        name: 'Case 1',
        isHidden: false,
        input: '1 2',
        expectedOutput: '3',
        actualOutput: '3',
        status: 'Accepted',
      });

      expect(result.isHidden).toBe(false);
      expect(result.name).toBe('Case 1');
      expect(result.input).toBe('1 2');
      expect(result.expectedOutput).toBe('3');
      expect(result.actualOutput).toBe('3');
      expect(result.status).toBe('Accepted');
    });

    it('redacts private details for hidden test cases', () => {
      const result = normalizeExecutionTestCaseResult({
        name: 'Hidden Case 2',
        isHidden: true,
        input: 'secret-input',
        expectedOutput: 'secret-output',
        actualOutput: 'secret-actual',
        status: 'Wrong Answer',
      });

      expect(result.isHidden).toBe(true);
      expect(result.input).toBeUndefined();
      expect(result.expectedOutput).toBeUndefined();
      expect(result.actualOutput).toBeUndefined();
      expect(result.status).toBe('Wrong Answer');
    });

    it('collects diagnostic messages from multiple fields into errorMessage for visible cases', () => {
      const result = normalizeExecutionTestCaseResult({
        isHidden: false,
        errorMessage: 'IndexOutOfBoundsException',
        stderr: 'Runtime error on line 4',
      });

      expect(result.errorMessage).toBe('IndexOutOfBoundsException');
    });
  });

  describe('getExecutionVerdict', () => {
    it('returns accepted when all test cases pass', () => {
      const result: ExecutionResultData = {
        totalTestCases: 2,
        passedTestCases: 2,
        failedTestCases: 0,
        diagnostics: [],
        testCases: [
          makeTestCase({ status: 'Accepted', isHidden: false }),
          makeTestCase({ status: 'Accepted', isHidden: true }),
        ],
      };
      expect(getExecutionVerdict(result)).toBe('accepted');
    });

    it('returns compilation-error when syntax or compilation fails', () => {
      const result: ExecutionResultData = {
        totalTestCases: 2,
        passedTestCases: 0,
        failedTestCases: 2,
        diagnostics: [],
        testCases: [
          makeTestCase({ status: 'Compilation Error: cannot find symbol', isHidden: false }),
        ],
      };
      expect(getExecutionVerdict(result)).toBe('compilation-error');
    });

    it('returns runtime-error when an exception or time limit occurs', () => {
      const result: ExecutionResultData = {
        totalTestCases: 2,
        passedTestCases: 0,
        failedTestCases: 2,
        diagnostics: [],
        testCases: [
          makeTestCase({ status: 'Runtime Error (NZEC)', isHidden: false }),
        ],
      };
      expect(getExecutionVerdict(result)).toBe('runtime-error');
    });

    it('returns failed for wrong answers without compiler/runtime exceptions', () => {
      const result: ExecutionResultData = {
        totalTestCases: 2,
        passedTestCases: 1,
        failedTestCases: 1,
        diagnostics: [],
        testCases: [
          makeTestCase({ status: 'Accepted', isHidden: false }),
          makeTestCase({ status: 'Wrong Answer', isHidden: false }),
        ],
      };
      expect(getExecutionVerdict(result)).toBe('failed');
    });
  });

  describe('isExecutionResultSuccessful', () => {
    it('returns true when total equals passed and failed is 0', () => {
      const success = isExecutionResultSuccessful({
        totalTestCases: 3,
        passedTestCases: 3,
        failedTestCases: 0,
        diagnostics: [],
        testCases: [],
      });
      expect(success).toBe(true);
    });

    it('returns false when passed test cases are less than total', () => {
      const success = isExecutionResultSuccessful({
        totalTestCases: 3,
        passedTestCases: 2,
        failedTestCases: 1,
        diagnostics: [],
        testCases: [],
      });
      expect(success).toBe(false);
    });
  });

  describe('prepareExecutionPayload', () => {
    it('validates question and language IDs are positive integers', async () => {
      await expect(
        executionService.prepareExecutionPayload({
          questionId: 0,
          languageId: 1,
          sourceCode: 'code',
        })
      ).rejects.toThrow('A valid question is required for code execution');

      await expect(
        executionService.prepareExecutionPayload({
          questionId: 1,
          languageId: -1,
          sourceCode: 'code',
        })
      ).rejects.toThrow('A valid language is required for code execution');
    });

    it('validates non-empty source code', async () => {
      await expect(
        executionService.prepareExecutionPayload({
          questionId: 1,
          languageId: 1,
          sourceCode: '   ',
        })
      ).rejects.toThrow('Source code is required');
    });

    it('renames public class Solution to public class Main for Java code', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        statusCode: 200,
        message: 'Languages Fetched',
        data: [
          { id: 1, languageName: 'Java', referenceId: 62, isActive: true },
          { id: 2, languageName: 'Python', referenceId: 71, isActive: true },
        ],
      } as unknown as ApiResponse<unknown>);

      const prepared = await executionService.prepareExecutionPayload({
        questionId: 10,
        languageId: 1,
        sourceCode: 'public class Solution {\n    public static void main(String[] args) {}\n}',
      });

      expect(prepared.languageId).toBe(62);
      expect(prepared.sourceCode).toContain('public class Main');
      expect(prepared.sourceCode).not.toContain('public class Solution');
    });
  });
});
