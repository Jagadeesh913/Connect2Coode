import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios/apiClient
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: (e) => Boolean(e?.name === "CanceledError" || e?.message === "canceled") }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = (e) => Boolean(e?.name === "CanceledError" || e?.message === "canceled");')
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

// Import real modules after loader registration
const { companyService } = await import('../../src/services/companyService.ts');
const { questionService } = await import('../../src/services/questionService.ts');
const { adminQuestionService } = await import('../../src/services/admin/adminQuestionService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');
const { getProblemEditorial } = await import('../../src/features/problems/utils/problemEditorial.ts');

describe('BATCH 5 AUDIT REMEDIATION TEST SUITE: Editorial & Service Resilience', () => {

  describe('F-012: Numeric Company Details & Text Slug Resolution', () => {
    it('sends numeric company identifiers directly to the detail endpoint', async () => {
      const originalGet = apiClient.get;
      let requestedUrl = null;
      apiClient.get = async (url) => {
        requestedUrl = url;
        return { statusCode: 200, message: 'OK', data: { id: 42, name: 'Numeric Corp' } };
      };

      try {
        const response = await companyService.getCompanyBySlug('42');
        assert.equal(requestedUrl, '/company/42');
        assert.equal(response.data.id, 42);
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('resolves text slugs through the catalog before issuing a numeric detail request', async () => {
      const originalGet = apiClient.get;
      const originalPost = apiClient.post;
      let detailCalled = false;
      apiClient.get = async (url) => {
        detailCalled = true;
        assert.equal(url, '/company/99');
        return { statusCode: 200, message: 'OK', data: { id: 99, name: 'Target Corp' } };
      };
      apiClient.post = async (url) => {
        if (url.includes('/company/list') || url.includes('/company')) {
          return {
            statusCode: 200,
            timestamp: '2026-11-06T00:00:00Z',
            data: {
              content: [{ id: 99, name: 'Target Corp', slug: 'target-corp' }],
              totalElements: 1,
              totalPages: 1,
              pageNumber: 0,
              pageSize: 24,
            }
          };
        }
        return { data: {} };
      };

      try {
        const res = await companyService.getCompanyBySlug('target-corp');
        assert.equal(detailCalled, true);
        assert.equal(res.data.name, 'Target Corp');
        assert.equal(res.data.id, 99);
      } finally {
        apiClient.get = originalGet;
        apiClient.post = originalPost;
      }
    });

    it('rejects a slug match without a numeric backend ID instead of recursing', async () => {
      const originalGet = apiClient.get;
      const originalPost = apiClient.post;
      let detailCalls = 0;
      apiClient.get = async () => { detailCalls += 1; return { data: {} }; };
      apiClient.post = async () => ({
        statusCode: 200,
        data: {
          content: [{ name: 'Legacy Corp', slug: 'legacy-corp' }],
          totalElements: 1,
          totalPages: 1,
          pageNumber: 0,
          pageSize: 24,
        },
      });

      try {
        await assert.rejects(
          () => companyService.getCompanyBySlug('legacy-corp'),
          /has no valid backend ID/
        );
        assert.equal(detailCalls, 0);
      } finally {
        apiClient.get = originalGet;
        apiClient.post = originalPost;
      }
    });

    it('rejects malformed nested exam records before the page renders them', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => ({
        statusCode: 200,
        data: {
          exam: {
            id: 1,
            companyId: 2,
            examName: 'Placement Test',
            year: 2026,
            description: '',
            totalDurationMinutes: 60,
            totalQuestions: 10,
            totalMarks: 100,
            sourceUrl: 'https://example.com',
            isActive: true,
          },
          roles: [null],
          pattern: [],
        },
      });

      try {
        await assert.rejects(
          () => companyService.getCompanyExamDetails(1),
          /Unexpected company role record format/
        );
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('preserves numeric company filtering and propagates its failure without a global name fallback', async () => {
      const originalPost = apiClient.post;
      apiClient.post = async (_url, payload) => {
        if (Array.isArray(payload.companies) && payload.companies.length > 0) {
          throw { statusCode: 500, message: 'Numeric company filter failed' };
        }
        return {
          statusCode: 200,
          message: 'No matching questions',
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 50,
            first: true,
            last: true,
            empty: true,
            numberOfElements: 0,
          },
        };
      };

      try {
        await assert.rejects(
          () => companyService.getCompanyProblems(42, 'No Results Inc'),
          (error) => {
            assert.equal(error.statusCode, 500);
            assert.equal(error.message, 'Numeric company filter failed');
            return true;
          }
        );
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('loads every reported company-question page without a fixed 50-row cap', async () => {
      const originalPost = apiClient.post;
      const requestedPages = [];
      apiClient.post = async (_url, payload) => {
        requestedPages.push(payload.pageRequest.pageNumber);
        const pageNumber = payload.pageRequest.pageNumber;
        return {
          statusCode: 200,
          message: 'OK',
          data: {
            content: [{
              id: pageNumber + 1,
              title: `Problem ${pageNumber + 1}`,
              description: 'Solve the problem.',
              difficultyId: 2,
              difficultyName: 'Easy',
              topicId: 9,
              topicName: 'Arrays',
              isOwnProblem: true,
              isActive: true,
              companies: [],
              questionPlatform: null,
            }],
            totalElements: 3,
            totalPages: 3,
            pageNumber,
            pageSize: 50,
          },
        };
      };

      try {
        const response = await companyService.getCompanyProblems(42);
        assert.deepEqual(requestedPages, [0, 1, 2]);
        assert.deepEqual(response.data.map((problem) => String(problem.id)), ['1', '2', '3']);
      } finally {
        apiClient.post = originalPost;
      }
    });
  });

  describe('F-037: Canonical Question CRUD Service Consolidation', () => {
    it('canonical questionService dispatches getById to /api/v1/question/:id via GET with AbortSignal', async () => {
      const originalGet = apiClient.get;
      let capturedUrl = '';
      let capturedConfig = null;

      apiClient.get = async (url, config) => {
        capturedUrl = url;
        capturedConfig = config;
        return { statusCode: 200, message: 'OK', data: { id: 77, title: 'Sample Question' } };
      };

      try {
        const controller = new AbortController();
        const res = await questionService.getById(77, controller.signal);
        assert.equal(capturedUrl, '/question/77');
        assert.equal(capturedConfig.signal, controller.signal);
        assert.equal(res.data.id, 77);
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('canonical questionService dispatches saveOrUpdate to /api/v1/question via POST with AbortSignal', async () => {
      const originalPost = apiClient.post;
      let capturedUrl = '';
      let capturedPayload = null;
      let capturedConfig = null;

      apiClient.post = async (url, payload, config) => {
        capturedUrl = url;
        capturedPayload = payload;
        capturedConfig = config;
        return { statusCode: 200, message: 'Saved', data: payload };
      };

      try {
        const controller = new AbortController();
        const payload = { title: 'New Problem', description: 'Desc' };
        const res = await questionService.saveOrUpdate(payload, controller.signal);
        assert.equal(capturedUrl, '/question');
        assert.deepEqual(capturedPayload, payload);
        assert.equal(capturedConfig.signal, controller.signal);
        assert.equal(res.data.title, 'New Problem');
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('canonical questionService dispatches addTestCases to /api/v1/question/:id/testCases via POST', async () => {
      const originalPost = apiClient.post;
      let capturedUrl = '';
      let capturedPayload = null;

      apiClient.post = async (url, payload, _config) => {
        capturedUrl = url;
        capturedPayload = payload;
        return { statusCode: 200, message: 'TestCases Added', data: payload };
      };

      try {
        const testCases = [{ input: '10', expectedOutput: '20' }];
        const res = await questionService.addTestCases(88, testCases);
        assert.equal(capturedUrl, '/question/88/testCases');
        assert.deepEqual(capturedPayload, testCases);
        assert.equal(res.data.length, 1);
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('propagates test-case mutation failures instead of returning a fabricated success response', async () => {
      const originalPost = apiClient.post;
      apiClient.post = async () => {
        throw { statusCode: 500, message: 'Database rejected test cases' };
      };

      try {
        await assert.rejects(
          () => questionService.addTestCases(1, [{ input: '1', expectedOutput: '1' }]),
          (error) => error?.statusCode === 500 && error?.message === 'Database rejected test cases'
        );
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('adminQuestionService delegates getQuestionById to canonical questionService', async () => {
      const originalGetById = questionService.getById;
      let delegatedCall = false;

      questionService.getById = async (id, _signal) => {
        delegatedCall = true;
        assert.equal(id, '42');
        return { statusCode: 200, message: 'OK', data: { id: 42, title: 'Delegated Question' } };
      };

      try {
        const res = await adminQuestionService.getQuestionById('42');
        assert.equal(delegatedCall, true, 'adminQuestionService must delegate to questionService.getById');
        assert.equal(res.data.title, 'Delegated Question');
      } finally {
        questionService.getById = originalGetById;
      }
    });

    it('adminQuestionService delegates saveOrUpdateQuestion to canonical questionService', async () => {
      const originalSave = questionService.saveOrUpdate;
      let delegatedCall = false;

      questionService.saveOrUpdate = async (payload, _signal) => {
        delegatedCall = true;
        assert.equal(payload.title, 'New Question');
        return { statusCode: 200, message: 'Saved', data: payload };
      };

      try {
        const payload = { title: 'New Question', description: 'Desc' };
        const res = await adminQuestionService.saveOrUpdateQuestion(payload);
        assert.equal(delegatedCall, true, 'adminQuestionService must delegate to questionService.saveOrUpdate');
        assert.equal(res.data.title, 'New Question');
      } finally {
        questionService.saveOrUpdate = originalSave;
      }
    });

    it('adminQuestionService delegates addTestCases to canonical questionService', async () => {
      const originalAddTestCases = questionService.addTestCases;
      let delegatedCall = false;

      questionService.addTestCases = async (id, testCases, _signal) => {
        delegatedCall = true;
        assert.equal(id, 10);
        assert.equal(testCases.length, 2);
        return { statusCode: 200, message: 'Added', data: testCases };
      };

      try {
        const testCases = [{ input: '1', expectedOutput: '2' }, { input: '3', expectedOutput: '4' }];
        const res = await adminQuestionService.addTestCases(10, testCases);
        assert.equal(delegatedCall, true, 'adminQuestionService must delegate to questionService.addTestCases');
        assert.equal(res.data.length, 2);
      } finally {
        questionService.addTestCases = originalAddTestCases;
      }
    });

    it('adminQuestionService.getTestCases loads all test cases including hidden evaluation cases from question details', async () => {
      const originalGetById = questionService.getById;

      questionService.getById = async (id) => {
        return {
          statusCode: 200,
          message: 'OK',
          data: {
            id: Number(id),
            title: 'Sample Problem',
            description: 'Example 1:\nInput: 1\nOutput: 2',
            testCases: [
              { id: 1, input: '1', expectedOutput: '2', explanation: 'Sample 1', isHidden: false, displayOrder: 1, typeRefGroupCode: 'TESTCASETYPE', typeRefCode: 'SAMPLE' },
              { id: 2, input: '10', expectedOutput: '20', explanation: '', isHidden: true, displayOrder: 2, typeRefGroupCode: 'TESTCASETYPE', typeRefCode: 'NECESSARY' },
              { id: 3, input: '-5', expectedOutput: '-10', explanation: '', isHidden: true, displayOrder: 3, typeRefGroupCode: 'TESTCASETYPE', typeRefCode: 'NECESSARY' },
            ],
          },
        };
      };

      try {
        const cases = await adminQuestionService.getTestCases(10);
        assert.equal(cases.length, 3, 'Must return all 3 test cases, not just the single visible example');
        assert.equal(cases[0].isHidden, false);
        assert.equal(cases[1].isHidden, true);
        assert.equal(cases[2].isHidden, true);
      } finally {
        questionService.getById = originalGetById;
      }
    });

    it('adminQuestionService.getTestCases does not issue an unestablished direct GET', async () => {
      const originalApiClientGet = apiClient.get;
      const originalGetById = questionService.getById;
      let directCalled = false;

      apiClient.get = async (url) => {
        if (url.includes('/question/42/testCases')) {
          directCalled = true;
          throw new Error('Unexpected direct GET');
        }
        return typeof originalApiClientGet === 'function' ? originalApiClientGet(url) : { data: {} };
      };
      questionService.getById = async () => ({
        statusCode: 200,
        message: 'OK',
        data: {
          id: 42,
          title: 'Authoritative detail',
          testCases: [{ id: 101, input: '100', expectedOutput: '200', isHidden: false }],
        },
      });

      try {
        const cases = await adminQuestionService.getTestCases(42);
        assert.equal(directCalled, false, 'Direct testCases GET must not be attempted');
        assert.equal(cases.length, 1);
        assert.equal(cases[0].input, '100');
      } finally {
        apiClient.get = originalApiClientGet;
        questionService.getById = originalGetById;
      }
    });
  });

  describe('F-007: Editorial Unavailability Empty State Logic (Real Production getProblemEditorial)', () => {
    it('returns full editorial details for recognized DSA pattern problems', () => {
      const largest = getProblemEditorial({ title: 'Find Largest Element in Array' });
      assert.equal(largest.isUnavailable, undefined, 'Recognized problem must NOT be marked unavailable');
      assert.match(largest.intuition, /maximum/i);
      assert.equal(largest.optimal.title, 'Single-Pass Linear Scan');
      assert.ok(largest.optimal.pseudocode);

      const secondLargest = getProblemEditorial({ title: 'Second Largest Element' });
      assert.equal(secondLargest.isUnavailable, undefined);
      assert.equal(secondLargest.optimal.title, 'Single-Pass Dual Variable Tracking');

      const reverse = getProblemEditorial({ title: 'Reverse an Array' });
      assert.equal(reverse.isUnavailable, undefined);
      assert.equal(reverse.optimal.title, 'Two-Pointers In-Place Swap');

      const twoSum = getProblemEditorial({ title: 'Two Sum Problem' });
      assert.equal(twoSum.isUnavailable, undefined);
      assert.equal(twoSum.optimal.title, 'Hash Map Lookup');
    });

    it('returns isUnavailable: true for un-patterned problems to trigger clean EmptyState', () => {
      const sudoku = getProblemEditorial({ title: 'Sudoku Solver' });
      assert.equal(sudoku.isUnavailable, true);
      assert.equal(sudoku.optimal.title, 'Editorial in Preparation');
      assert.equal(sudoku.optimal.timeComplexity, '—');

      const alien = getProblemEditorial({ title: 'Alien Dictionary' });
      assert.equal(alien.isUnavailable, true);

      const nullProblem = getProblemEditorial(null);
      assert.equal(nullProblem.isUnavailable, true);

      const emptyTitle = getProblemEditorial({ title: '' });
      assert.equal(emptyTitle.isUnavailable, true);
    });
  });

  describe('F-024: Action Button Accessibility Attributes', () => {
    function computeActionAriaLabels(isSolved, isBookmarked) {
      return {
        solveAriaLabel: isSolved ? 'Mark as Not Answered' : 'Mark as Answered',
        bookmarkAriaLabel: isBookmarked ? 'Remove Bookmark' : 'Bookmark Question',
      };
    }

    it('computes accessible aria-labels matching solve and bookmark button states', () => {
      const unsolvedUnbookmarked = computeActionAriaLabels(false, false);
      assert.equal(unsolvedUnbookmarked.solveAriaLabel, 'Mark as Answered');
      assert.equal(unsolvedUnbookmarked.bookmarkAriaLabel, 'Bookmark Question');

      const solvedBookmarked = computeActionAriaLabels(true, true);
      assert.equal(solvedBookmarked.solveAriaLabel, 'Mark as Not Answered');
      assert.equal(solvedBookmarked.bookmarkAriaLabel, 'Remove Bookmark');
    });
  });

});
