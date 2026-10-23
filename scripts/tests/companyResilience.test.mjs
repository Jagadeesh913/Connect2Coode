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

  describe('F-012: Company 500 Error Propagation & 404 Fallback Isolation', () => {
    it('propagates HTTP 500 server errors instead of swallowing into getCompanies fallback', async () => {
      const originalGet = apiClient.get;
      let fallbackCalled = false;

      apiClient.get = async (url) => {
        if (url === '/company/error-company' || url.endsWith('/error-company')) {
          const err = new Error('Internal Server Error');
          err.statusCode = 500;
          throw err;
        }
        if (url === '/company' || url.startsWith('/company?')) {
          fallbackCalled = true;
          return { data: [] };
        }
        return { data: {} };
      };

      try {
        await assert.rejects(
          async () => {
            await companyService.getCompanyBySlug('error-company');
          },
          (err) => {
            assert.equal(err.statusCode, 500);
            return true;
          },
          'Must re-throw 500 server error'
        );
        assert.equal(fallbackCalled, false, 'Fallback getCompanies must NOT be called on 500');
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('propagates network connection errors without status instead of swallowing into fallback', async () => {
      const originalGet = apiClient.get;
      let fallbackCalled = false;

      apiClient.get = async (url) => {
        if (url === '/company/net-error' || url.endsWith('/net-error')) {
          const netErr = new Error('Network Error: Connection Refused');
          // Network errors have no HTTP response status
          throw netErr;
        }
        if (url === '/company' || url.startsWith('/company?')) {
          fallbackCalled = true;
          return { data: [] };
        }
        return { data: {} };
      };

      try {
        await assert.rejects(
          async () => {
            await companyService.getCompanyBySlug('net-error');
          },
          (err) => {
            assert.match(err.message, /Network Error/);
            return true;
          },
          'Must re-throw network error without swallowing'
        );
        assert.equal(fallbackCalled, false, 'Fallback getCompanies must NOT be called on network errors');
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('propagates HTTP 400 Bad Request errors without triggering catalog fallback', async () => {
      const originalGet = apiClient.get;
      let fallbackCalled = false;

      apiClient.get = async (url) => {
        if (url === '/company/bad-req' || url.endsWith('/bad-req')) {
          const err = new Error('Bad Request: Invalid identifier syntax');
          err.statusCode = 400;
          throw err;
        }
        if (url === '/company' || url.startsWith('/company?')) {
          fallbackCalled = true;
          return { data: [] };
        }
        return { data: {} };
      };

      try {
        await assert.rejects(
          async () => {
            await companyService.getCompanyBySlug('bad-req');
          },
          (err) => {
            assert.equal(err.statusCode, 400);
            return true;
          },
          'Must re-throw 400 bad request error'
        );
        assert.equal(fallbackCalled, false, 'Fallback getCompanies must NOT be called on 400');
      } finally {
        apiClient.get = originalGet;
      }
    });

    it('falls back to getCompanies directory search ONLY when slug returns genuine 404 Not Found', async () => {
      const originalGet = apiClient.get;
      const originalPost = apiClient.post;
      let fallbackInvoked = false;

      apiClient.get = async (url) => {
        if (url === '/company/missing-slug' || url.endsWith('/missing-slug')) {
          const err = new Error('Not Found');
          err.statusCode = 404;
          throw err;
        }
        if (url === '/company' || url.startsWith('/company?')) {
          fallbackInvoked = true;
          return {
            data: [
              { id: 99, name: 'Target Corp', slug: 'target-corp' }
            ]
          };
        }
        return { data: {} };
      };

      apiClient.post = async (url) => {
        if (url.includes('/company/list') || url.includes('/company')) {
          fallbackInvoked = true;
          return {
            data: {
              content: [
                { id: 99, name: 'Target Corp', slug: 'target-corp' }
              ]
            }
          };
        }
        return { data: {} };
      };

      try {
        const res = await companyService.getCompanyBySlug('target-corp');
        assert.equal(fallbackInvoked, true, 'Fallback getCompanies should be called on genuine 404');
        assert.equal(res.data.name, 'Target Corp');
        assert.equal(res.data.id, 99);
      } finally {
        apiClient.get = originalGet;
        apiClient.post = originalPost;
      }
    });

    it('propagates cancellation signal errors immediately', async () => {
      const originalGet = apiClient.get;
      apiClient.get = async () => {
        const err = new Error('canceled');
        err.name = 'CanceledError';
        throw err;
      };

      try {
        await assert.rejects(
          async () => {
            await companyService.getCompanyBySlug('canceled-slug');
          },
          (err) => {
            return err.name === 'CanceledError' || err.message === 'canceled';
          }
        );
      } finally {
        apiClient.get = originalGet;
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
