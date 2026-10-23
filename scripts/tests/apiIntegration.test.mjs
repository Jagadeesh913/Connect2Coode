import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to stub axios and resolve .ts extensions in node --test
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } }, post: async () => ({ data: {} }), get: async () => ({ data: [] }), delete: async () => ({ data: {} }) }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const { API_ENDPOINTS } = await import('../../src/core/api/endpoints.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');
const { executionService, normalizeExecutionResult } = await import('../../src/services/executionService.ts');
const { adminLanguageService } = await import('../../src/services/admin/adminLanguageService.ts');
const { userQuestionService } = await import('../../src/services/userQuestionService.ts');
const { questionService } = await import('../../src/services/questionService.ts');
const { problemService } = await import('../../src/services/problemService.ts');

describe('API Integration: Endpoints, Contracts, & Payload Integrity', () => {
  describe('1. Endpoint URL Formatting & Route Definitions', () => {
    it('defines user-facing code execution endpoints', () => {
      assert.equal(API_ENDPOINTS.EXECUTION.USER_RUN, '/runCode');
      assert.equal(API_ENDPOINTS.EXECUTION.USER_SUBMIT, '/submitCode');
    });

    it('defines admin-only code execution endpoints', () => {
      assert.equal(API_ENDPOINTS.EXECUTION.ADMIN_RUN, '/admin/testCode');
      assert.equal(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, '/admin/submitCode');
    });

    it('formats user bookmark and question progress endpoints with dynamic IDs', () => {
      assert.equal(
        API_ENDPOINTS.USER.BOOKMARK(63, 1),
        '/users/63/questions/1/bookmark'
      );
      assert.equal(
        API_ENDPOINTS.USER.BOOKMARK('usr_42', 'q_100'),
        '/users/usr_42/questions/q_100/bookmark'
      );
      assert.equal(
        API_ENDPOINTS.USER.BOOKMARKS(63),
        '/users/63/questions/bookmarks'
      );
      assert.equal(
        API_ENDPOINTS.USER.SUBMITTED_QUESTIONS(63),
        '/63/getSubmiteedQuestionIds'
      );
      assert.equal(
        API_ENDPOINTS.USER.ATTEMPTED_QUESTIONS(63),
        '/63/getAPttemptedQuestionIds'
      );
      assert.equal(
        API_ENDPOINTS.USER.QUESTION_SUBMISSIONS(63, 1),
        '/63/question/1/getSubmissions'
      );
    });

    it('defines language registry endpoints', () => {
      assert.equal(API_ENDPOINTS.LANGUAGE.BASE, '/language');
      assert.equal(API_ENDPOINTS.LANGUAGE.DETAILS(1), '/language/1');
    });
  });

  describe('2. User Question Service Validation', () => {
    it('rejects bookmarking without valid userId or questionId', async () => {
      await assert.rejects(
        () => userQuestionService.bookmarkQuestion('', 1),
        /Both userId and questionId are required/
      );
      await assert.rejects(
        () => userQuestionService.bookmarkQuestion(63, ''),
        /Both userId and questionId are required/
      );
    });

    it('rejects unbookmarking without valid userId or questionId', async () => {
      await assert.rejects(
        () => userQuestionService.unbookmarkQuestion(null, 1),
        /Both userId and questionId are required/
      );
      await assert.rejects(
        () => userQuestionService.unbookmarkQuestion(63, null),
        /Both userId and questionId are required/
      );
    });

    it('safely returns empty list if userId is missing for getBookmarkedQuestions', async () => {
      const res = await userQuestionService.getBookmarkedQuestions(null);
      assert.deepEqual(res, []);
    });

    it('safely returns empty list if userId is missing for progress endpoints', async () => {
      const solved = await userQuestionService.getSolvedQuestions(undefined);
      assert.deepEqual(solved, []);
      const attempted = await userQuestionService.getAttemptedQuestions('');
      assert.deepEqual(attempted, []);
    });

    it('safely returns empty list if userId or questionId is missing for getQuestionSubmissions', async () => {
      const emptyUser = await userQuestionService.getQuestionSubmissions(null, 1);
      assert.deepEqual(emptyUser, []);
      const emptyQ = await userQuestionService.getQuestionSubmissions(63, null);
      assert.deepEqual(emptyQ, []);
    });
  });

  describe('3. Question-detail fallback request discipline', () => {
    it('does not make a known-failing test-case GET after a question-detail failure', async () => {
      const originalGet = apiClient.get;
      const originalPost = apiClient.post;
      const getUrls = [];
      apiClient.get = async (url) => {
        getUrls.push(url);
        throw { statusCode: 500, message: 'Question Fetch Unsuccessfull' };
      };
      apiClient.post = async () => ({
        statusCode: 200,
        data: {
          content: [{
            id: 3,
            title: 'Catalog question',
            description: 'Visible description',
            difficultyName: 'Easy',
            topicName: 'Arrays',
            questionPlatform: 'Practice',
            companies: [],
          }],
        },
      });

      try {
        await assert.rejects(() => questionService.getById(3), (error) => {
          assert.equal(error.statusCode, 500);
          assert.equal(error.message, 'Question Fetch Unsuccessfull');
          return true;
        });
        await problemService.getProblemById(3);
        assert.deepEqual(getUrls, [
          API_ENDPOINTS.QUESTION.DETAILS(3),
          API_ENDPOINTS.QUESTION.DETAILS(3),
        ]);
        assert.equal(
          getUrls.includes(API_ENDPOINTS.QUESTION.TEST_CASES(3)),
          false,
          'catalog fallback must not add a test-case request that production rejects with 401'
        );
      } finally {
        apiClient.get = originalGet;
        apiClient.post = originalPost;
      }
    });
  });

  describe('4. Language ID Mapping & Execution Payload Resolution', () => {
    it('invalidates the shared execution-language cache after an admin mutation', async () => {
      const originalGet = apiClient.get;
      const originalPost = apiClient.post;
      let getCalls = 0;

      apiClient.get = async () => {
        getCalls += 1;
        return {
          statusCode: 200,
          data: [{ id: getCalls, languageName: getCalls === 1 ? 'Java' : 'Python', referenceId: getCalls + 4 }],
        };
      };
      apiClient.post = async (_url, payload) => ({ statusCode: 200, message: 'Saved', data: payload });

      try {
        executionService.invalidateLanguageCache();
        const beforeMutation = await executionService.getLanguageDropdown();
        await executionService.getLanguageDropdown();
        assert.equal(getCalls, 1, 'consecutive reads should reuse the language cache');
        assert.equal(beforeMutation[0].name, 'Java');

        await adminLanguageService.createLanguage({ referenceId: 6, judge0LanguageId: 71 });
        const afterMutation = await executionService.getLanguageDropdown();
        assert.equal(getCalls, 2, 'successful admin mutation must invalidate the language cache');
        assert.equal(afterMutation[0].name, 'Python');
      } finally {
        executionService.invalidateLanguageCache();
        apiClient.get = originalGet;
        apiClient.post = originalPost;
      }
    });

    it('resolves language IDs only from the backend registry', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({
        statusCode: 200,
        data: [{ id: 1, languageName: 'Java', referenceId: 5 }],
      });
      try {
        executionService.invalidateLanguageCache();
        assert.equal(await executionService.resolveLanguageReferenceId(1), 5);
        assert.equal(await executionService.resolveLanguageReferenceId(5), 5);
      } finally {
        executionService.invalidateLanguageCache();
        apiClient.get = originalGet;
      }
    });

    it('rejects a language response that omits the captured languageName field', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({
        statusCode: 200,
        data: [{ id: 1, name: 'Java', referenceId: 5 }],
      });
      try {
        executionService.invalidateLanguageCache();
        await assert.rejects(
          () => executionService.getLanguageDropdown(),
          /invalid language record/
        );
      } finally {
        executionService.invalidateLanguageCache();
        apiClient.get = originalGet;
      }
    });

    it('throws when an ID has no backend-provided language mapping', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({
        statusCode: 200,
        data: [{ id: 1, languageName: 'Java', referenceId: 5 }],
      });
      try {
        executionService.invalidateLanguageCache();
        await assert.rejects(
          () => executionService.resolveLanguageReferenceId(99),
          /No backend reference mapping found for language id: 99/
        );
      } finally {
        executionService.invalidateLanguageCache();
        apiClient.get = originalGet;
      }
    });

    it('prepares execution payload with numeric questionId and sanitized code', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({
        statusCode: 200,
        data: [{ id: 1, languageName: 'Java', referenceId: 5 }],
      });
      try {
        executionService.invalidateLanguageCache();
        const payload = await executionService.prepareExecutionPayload({
          questionId: '42',
          languageId: 1,
          sourceCode: 'public class Solution { public void solve() {} }',
        });

        assert.equal(payload.questionId, 42);
        assert.equal(payload.languageId, 5);
        assert.match(payload.sourceCode, /public class Main/);
        assert.doesNotMatch(payload.sourceCode, /public class Solution/);
      } finally {
        executionService.invalidateLanguageCache();
        apiClient.get = originalGet;
      }
    });

    it('does not alter non-Java source code entry classes', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({
        statusCode: 200,
        data: [{ id: 2, languageName: 'Python', referenceId: 6 }],
      });
      try {
        executionService.invalidateLanguageCache();
        const pyCode = 'def solution():\n    return 42';
        const payload = await executionService.prepareExecutionPayload({
          questionId: 10,
          languageId: 2,
          sourceCode: pyCode,
        });

        assert.equal(payload.languageId, 6);
        assert.equal(payload.sourceCode, pyCode);
      } finally {
        executionService.invalidateLanguageCache();
        apiClient.get = originalGet;
      }
    });
  });

  describe('4. Test Case Response Secrecy & Null Safety', () => {
    it('normalizes partial execution responses without inventing test data', () => {
      const normalized = normalizeExecutionResult({
        passedTestCases: '1',
        failedTestCases: 0,
        testCases: [{ status: 'Passed', actualOutput: '42' }],
      });

      assert.deepEqual(normalized, {
        totalTestCases: 1,
        passedTestCases: 1,
        failedTestCases: 0,
        runtimeMs: undefined,
        memoryMb: undefined,
        testCases: [{
          testCaseId: 1,
          testCaseType: 'Test Case',
          isHidden: null,
          status: 'Passed',
          input: undefined,
          expectedOutput: undefined,
          actualOutput: '42',
          errorMessage: undefined,
        }],
      });
    });

    it('sends custom input only when the API-supported field is non-empty', async () => {
      const originalGet = apiClient.get;
      try {
        executionService.invalidateLanguageCache();
        apiClient.get = async () => ({
          data: [{ id: 1, languageName: 'Java', referenceId: 5, isActive: true }],
        });

        const withInput = await executionService.prepareExecutionPayload({
          questionId: 7,
          languageId: 1,
          sourceCode: 'public class Main {}',
          customInput: '4\n1 2 3 4',
        });
        const withoutInput = await executionService.prepareExecutionPayload({
          questionId: 7,
          languageId: 1,
          sourceCode: 'public class Main {}',
          customInput: '   ',
        });

        assert.equal(withInput.customInput, '4\n1 2 3 4');
        assert.equal('customInput' in withoutInput, false);
      } finally {
        executionService.invalidateLanguageCache();
        apiClient.get = originalGet;
      }
    });

    it('handles nullable and hidden test case fields without throwing errors', () => {
      const mockResult = {
        totalTestCases: 3,
        passedTestCases: 2,
        failedTestCases: 1,
        testCases: [
          {
            testCaseId: 101,
            testCaseType: 'Sample',
            isHidden: false,
            status: 'Passed',
            input: '1 2',
            expectedOutput: '3',
            actualOutput: '3',
          },
          {
            testCaseId: 102,
            testCaseType: 'Hidden',
            isHidden: true,
            status: 'Passed',
            input: null,
            expectedOutput: null,
            actualOutput: null,
          },
          {
            testCaseId: 103,
            testCaseType: 'Hidden',
            isHidden: true,
            status: 'Failed',
            input: 'secret_input',
            expectedOutput: 'secret_expected',
            actualOutput: 'wrong_output',
          },
        ],
      };

      assert.equal(mockResult.testCases.length, 3);
      // Hidden test case contract: isHidden === true must mask input and expected output in client UI
      const hiddenFailCase = mockResult.testCases[2];
      assert.equal(hiddenFailCase.isHidden, true);
      assert.equal(hiddenFailCase.status, 'Failed');

      // Function simulating the ProblemDetails.tsx masking logic
      const getDisplayedTestCase = (tc) => {
        if (tc.isHidden) {
          return {
            status: tc.status,
            isHidden: true,
            input: null,
            expectedOutput: null,
            actualOutput: tc.actualOutput,
          };
        }
        return tc;
      };

      const masked = getDisplayedTestCase(hiddenFailCase);
      assert.equal(masked.input, null);
      assert.equal(masked.expectedOutput, null);
      assert.equal(masked.status, 'Failed');
    });
  });
});
