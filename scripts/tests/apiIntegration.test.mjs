import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
const {
  executionService,
  normalizeExecutionResult,
  normalizeExecutionTestCaseResult,
  isExecutionResultSuccessful,
  MAX_SOURCE_CODE_LENGTH,
  MAX_CUSTOM_INPUT_LENGTH,
} = await import('../../src/services/executionService.ts');
const { adminLanguageService } = await import('../../src/services/admin/adminLanguageService.ts');
const { userQuestionService } = await import('../../src/services/userQuestionService.ts');
const { questionService } = await import('../../src/services/questionService.ts');
const { problemService } = await import('../../src/services/problemService.ts');
const { learningSheetService } = await import('../../src/services/learningSheetService.ts');
const { adminLearningSheetService } = await import('../../src/services/admin/adminLearningSheetService.ts');
const { getDsaQuestionProblemPath } = await import('../../src/features/dsaSheet/utils/questionRoute.ts');

describe('API Integration: Endpoints, Contracts, & Payload Integrity', () => {
  describe('1. Endpoint URL Formatting & Route Definitions', () => {
    it('does not present configured admin auth state as a live validation result', () => {
      const source = fs.readFileSync('src/features/admin/components/dashboard/DashboardSystemInfo.tsx', 'utf8');
      assert.doesNotMatch(source, /Validated Token|RBAC Protected/);
      assert.match(source, /JWT authentication configured/);
      assert.match(source, /Current role:/);
    });

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

    it('formats DSA learning sheet endpoints with their owning resource IDs', () => {
      assert.equal(API_ENDPOINTS.LEARNING_SHEET.LIST, '/user/learningSheets');
      assert.equal(API_ENDPOINTS.LEARNING_SHEET.SECTIONS(4), '/user/learningSheets/4/sections');
      assert.equal(API_ENDPOINTS.LEARNING_SHEET.SECTION_QUESTIONS(8), '/user/learningSheet/section/8/questions');
      assert.equal(API_ENDPOINTS.LEARNING_SHEET.ADMIN_SECTION_DELETE(8), '/admin/learningSheet/section/8');
      assert.equal(API_ENDPOINTS.LEARNING_SHEET.ADMIN_QUESTION_DELETE(8, 12), '/admin/learningSheet/section/8/question/12');
    });
  });

  describe('DSA learning sheet contracts', () => {
    it('uses the nested question ID for problem navigation and never the association ID', () => {
      assert.equal(
        getDsaQuestionProblemPath({ id: 999, question: { id: 13 } }),
        '/problems/13'
      );
    });

    it('sends resource IDs only for DSA save operations in edit mode', async () => {
      const originalPost = apiClient.post;
      const calls = [];
      apiClient.post = async (...args) => {
        calls.push(args);
        return { statusCode: 200, message: 'Saved', data: {} };
      };
      try {
        await adminLearningSheetService.saveSheet({
          id: 4,
          sheetCode: 'JAVA-DSA-001',
          sheetName: 'Java DSA',
          description: 'Updated',
          isActive: true,
        });
        await adminLearningSheetService.saveSection({
          id: 8,
          sheetId: 4,
          parentSectionId: null,
          sectionName: 'Arrays',
          displayOrder: 2,
          isActive: true,
        });
        await adminLearningSheetService.linkQuestion({
          id: 12,
          sectionId: 8,
          question: { id: 13 },
          displayOrder: 3,
          isActive: false,
        });

        assert.deepEqual(calls, [
          ['/admin/learningSheet', { id: 4, sheetCode: 'JAVA-DSA-001', sheetName: 'Java DSA', description: 'Updated', isActive: true }],
          ['/admin/learningSheet/section', { id: 8, sheetId: 4, parentSectionId: null, sectionName: 'Arrays', displayOrder: 2, isActive: true }],
          ['/admin/learningSheet/question', { id: 12, sectionId: 8, question: { id: 13 }, displayOrder: 3, isActive: false }],
        ]);
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('orders top-level sections and excludes nested sections from the supplied list contract', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({
        statusCode: 200,
        data: [
          { id: 3, sheetId: 1, parentSectionId: null, sectionName: 'Arrays', displayOrder: 2, isActive: true },
          { id: 4, sheetId: 1, parentSectionId: 3, sectionName: 'Nested', displayOrder: 1, isActive: true },
          { id: 2, sheetId: 1, parentSectionId: null, sectionName: 'Prefix Sum', displayOrder: 1, isActive: true },
        ],
      });
      try {
        const sections = await learningSheetService.getSections(1);
        assert.deepEqual(sections.map((section) => section.id), [2, 3]);
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('rejects malformed successful learning sheet payloads', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({ statusCode: 200, data: [{ id: 1, sheetName: 'Missing fields' }] });
      try {
        await assert.rejects(() => learningSheetService.getSheets(), /Unexpected learning sheets response format/);
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('leaves DELETE body ownership to the central apiClient interceptor', async () => {
      const originalDelete = apiClient.delete;
      const calls = [];
      apiClient.delete = async (...args) => {
        calls.push(args);
        return { statusCode: 200, message: 'Deleted', data: null };
      };
      try {
        await adminLearningSheetService.deleteSection(5);
        await adminLearningSheetService.unlinkQuestion(5, 9);
        assert.deepEqual(calls, [
          ['/admin/learningSheet/section/5'],
          ['/admin/learningSheet/section/5/question/9'],
        ]);
      } finally {
        apiClient.delete = originalDelete;
      }
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

    it('rejects missing userId for getBookmarkedQuestions instead of fabricating an empty result', async () => {
      await assert.rejects(() => userQuestionService.getBookmarkedQuestions(null), /userId is required/);
    });

    it('rejects missing userId for progress endpoints', async () => {
      await assert.rejects(() => userQuestionService.getSolvedQuestions(undefined), /userId is required/);
      await assert.rejects(() => userQuestionService.getAttemptedQuestions(''), /userId is required/);
    });

    it('rejects missing userId or questionId for getQuestionSubmissions', async () => {
      await assert.rejects(() => userQuestionService.getQuestionSubmissions(null, 1), /Both userId and questionId are required/);
      await assert.rejects(() => userQuestionService.getQuestionSubmissions(63, null), /Both userId and questionId are required/);
    });

    it('rejects malformed successful list responses instead of reporting false empty states', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({ statusCode: 200, data: { unexpected: true } });
      try {
        await assert.rejects(
          () => userQuestionService.getBookmarkedQuestions(63),
          /Unexpected bookmarks response format/
        );
        await assert.rejects(
          () => userQuestionService.getSolvedQuestions(63),
          /Unexpected solved questions response format/
        );
        await assert.rejects(
          () => userQuestionService.getQuestionSubmissions(63, 9),
          /Unexpected question submissions response format/
        );
      } finally {
        apiClient.get = originalGet;
      }
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
        await assert.rejects(() => problemService.getProblemById(3), (error) => {
          assert.equal(error.statusCode, 500);
          assert.equal(error.message, 'Question Fetch Unsuccessfull');
          return true;
        });
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

    it('rejects a title-only degraded detail payload without promoting a catalog row to detail data', async () => {
      const originalGet = apiClient.get;
      const originalPost = apiClient.post;
      let catalogCalls = 0;
      apiClient.get = async () => ({
        statusCode: 200,
        message: 'Degraded details response',
        data: { title: 'Title without identity' },
      });
      apiClient.post = async () => {
        catalogCalls += 1;
        return {
          statusCode: 200,
          message: 'Questions Fetched Successfully',
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
            totalElements: 1,
            totalPages: 1,
          },
        };
      };

      try {
        await assert.rejects(
          () => problemService.getProblemById(3),
          /Question #3 returned an invalid detail response/
        );
        assert.equal(catalogCalls, 0);
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

        await adminLanguageService.saveLanguage({ referenceId: 6, judge0LanguageId: 71 });
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
        executionTime: undefined,
        executionTimeUnit: undefined,
        memoryUsage: undefined,
        memoryUnit: undefined,
        status: undefined,
        message: undefined,
        stdout: undefined,
        diagnostics: [],
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

    it('normalizes observed execution fields without inventing runtime or memory units', () => {
      const normalized = normalizeExecutionResult({
        totalTestCases: 1,
        passedTestCases: 0,
        failedTestCases: 1,
        time: '0.014',
        memory: 12352,
        errors: ['Execution failed'],
        stderr: 'runtime diagnostic',
        stdout: 'program output',
        compileOutput: 'compiler diagnostic',
        message: 'Code execution completed',
        status: 'Failed',
        testCases: [{
          testCaseId: 11,
          status: 'Failed',
          stderr: 'case runtime diagnostic',
          stdout: 'visible output',
          isHidden: false,
        }],
      });

      assert.equal(normalized.executionTime, '0.014');
      assert.equal(normalized.executionTimeUnit, undefined);
      assert.equal(normalized.memoryUsage, 12352);
      assert.equal(normalized.memoryUnit, undefined);
      assert.equal(normalized.status, 'Failed');
      assert.equal(normalized.message, 'Code execution completed');
      assert.equal(normalized.stdout, 'program output');
      assert.deepEqual(normalized.diagnostics, [
        'Execution failed',
        'runtime diagnostic',
        'compiler diagnostic',
      ]);
      assert.equal(normalized.testCases[0].actualOutput, 'visible output');
      assert.equal(normalized.testCases[0].errorMessage, 'case runtime diagnostic');
    });

    it('retains units only for explicitly unit-named legacy execution fields', () => {
      const normalized = normalizeExecutionResult({
        totalTestCases: 1,
        passedTestCases: 1,
        failedTestCases: 0,
        runtimeMs: 18,
        memoryMb: '12.5',
        errors: null,
        stderr: null,
        compileOutput: null,
        testCases: [],
      });

      assert.equal(normalized.executionTime, 18);
      assert.equal(normalized.executionTimeUnit, 'ms');
      assert.equal(normalized.memoryUsage, '12.5');
      assert.equal(normalized.memoryUnit, 'MB');
      assert.deepEqual(normalized.diagnostics, []);
    });

    it('rejects missing verdicts and accepts only a complete passing result', () => {
      assert.throws(
        () => normalizeExecutionResult({ message: 'ok' }),
        /returned no test verdict/
      );
      assert.equal(
        isExecutionResultSuccessful({
          totalTestCases: 0,
          passedTestCases: 0,
          failedTestCases: 0,
          testCases: [],
        }),
        false
      );
      assert.equal(
        isExecutionResultSuccessful({
          totalTestCases: 2,
          passedTestCases: 1,
          failedTestCases: 0,
          testCases: [],
        }),
        false
      );
      assert.equal(
        isExecutionResultSuccessful({
          totalTestCases: 2,
          passedTestCases: 1,
          failedTestCases: 1,
          testCases: [],
        }),
        false
      );
      assert.equal(
        isExecutionResultSuccessful({
          totalTestCases: 2,
          passedTestCases: 2,
          failedTestCases: 0,
          testCases: [],
        }),
        true
      );
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

    it('rejects oversized execution payloads before any language or execution request', async () => {
      await assert.rejects(
        () => executionService.prepareExecutionPayload({
          questionId: 7,
          languageId: 1,
          sourceCode: 'x'.repeat(MAX_SOURCE_CODE_LENGTH + 1),
        }),
        /Source code exceeds/
      );
      await assert.rejects(
        () => executionService.prepareExecutionPayload({
          questionId: 7,
          languageId: 1,
          sourceCode: 'print(1)',
          customInput: 'x'.repeat(MAX_CUSTOM_INPUT_LENGTH + 1),
        }),
        /Custom input exceeds/
      );
    });

    it('masks hidden test case input and all outputs in the shared normalizer', () => {
      const normalized = normalizeExecutionResult({
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
      });

      assert.equal(normalized.testCases.length, 3);
      const visibleCase = normalized.testCases[0];
      assert.equal(visibleCase.input, '1 2');
      assert.equal(visibleCase.expectedOutput, '3');
      assert.equal(visibleCase.actualOutput, '3');

      const hiddenFailCase = normalized.testCases[2];
      assert.equal(hiddenFailCase.isHidden, true);
      assert.equal(hiddenFailCase.status, 'Failed');
      assert.equal(hiddenFailCase.input, undefined);
      assert.equal(hiddenFailCase.expectedOutput, undefined);
      assert.equal(hiddenFailCase.actualOutput, undefined);
      assert.equal(hiddenFailCase.errorMessage, undefined);

      const directlyNormalized = normalizeExecutionTestCaseResult({
        isHidden: true,
        status: 'Failed',
        input: 'secret',
        expectedOutput: 'secret expected',
        stdout: 'secret actual',
      });
      assert.equal(directlyNormalized.input, undefined);
      assert.equal(directlyNormalized.expectedOutput, undefined);
      assert.equal(directlyNormalized.actualOutput, undefined);
    });
  });
});
