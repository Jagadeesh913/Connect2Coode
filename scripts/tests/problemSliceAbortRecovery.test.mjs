import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
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

// Import real production reducer and thunks
const problemSliceModule = await import('../../src/features/problems/redux/problemSlice.ts');
const {
  default: problemReducer,
  fetchProblems,
  fetchProblemById,
} = problemSliceModule;

describe('BATCH-2A: F-041 Redux Abort-State Recovery & Request Ownership', () => {
  const getInitialState = () => problemReducer(undefined, { type: '@@INIT' });

  // 1. Current list request abort
  describe('Scenario 1: Current list request abort', () => {
    it('pending -> aborted rejection resets loading to false, clears ownership, and enables retry', () => {
      const state0 = getInitialState();
      assert.equal(state0.loading, false);
      assert.equal(state0.currentRequestId, null);

      // Pending
      const pendingAction = {
        type: fetchProblems.pending.type,
        meta: { requestId: 'req-list-1', arg: { page: 1, limit: 20 } },
      };
      const state1 = problemReducer(state0, pendingAction);
      assert.equal(state1.loading, true);
      assert.equal(state1.currentRequestId, 'req-list-1');
      assert.notEqual(state1.activeListKey, null);

      // Aborted rejection for current request
      const rejectedAction = {
        type: fetchProblems.rejected.type,
        meta: {
          requestId: 'req-list-1',
          arg: { page: 1, limit: 20 },
          aborted: true,
        },
      };
      const state2 = problemReducer(state1, rejectedAction);

      assert.equal(state2.loading, false, 'Loading must be false after current list request is aborted');
      assert.equal(state2.currentRequestId, null, 'Loading ownership must be cleared');
      assert.equal(state2.activeListKey, null, 'Active list key must be cleared so retry can proceed');
    });
  });

  // 2. Current detail request abort
  describe('Scenario 2: Current detail request abort', () => {
    it('pending -> aborted rejection resets loading to false, clears ownership, and enables retry', () => {
      const state0 = getInitialState();

      // Pending
      const pendingAction = {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-detail-1', arg: 'two-sum' },
      };
      const state1 = problemReducer(state0, pendingAction);
      assert.equal(state1.loading, true);
      assert.equal(state1.currentRequestId, 'req-detail-1');
      assert.equal(state1.activeDetailKey, 'two-sum');

      // Aborted rejection for current request
      const rejectedAction = {
        type: fetchProblemById.rejected.type,
        meta: {
          requestId: 'req-detail-1',
          arg: 'two-sum',
          aborted: true,
        },
      };
      const state2 = problemReducer(state1, rejectedAction);

      assert.equal(state2.loading, false, 'Loading must be false after current detail request is aborted');
      assert.equal(state2.currentRequestId, null, 'Loading ownership must be cleared');
      assert.equal(state2.activeDetailKey, null, 'Active detail key must be cleared so retry can proceed');
    });
  });

  // 3. Stale list abort
  describe('Scenario 3: Stale list abort', () => {
    it('request A starts, request B becomes loading owner, A aborts -> B remains loading', () => {
      const state0 = getInitialState();

      // Request A starts
      const state1 = problemReducer(state0, {
        type: fetchProblems.pending.type,
        meta: { requestId: 'req-A', arg: { page: 1, limit: 20 } },
      });
      assert.equal(state1.currentRequestId, 'req-A');

      // Request B starts and becomes loading owner
      const state2 = problemReducer(state1, {
        type: fetchProblems.pending.type,
        meta: { requestId: 'req-B', arg: { page: 2, limit: 20 } },
      });
      assert.equal(state2.loading, true);
      assert.equal(state2.currentRequestId, 'req-B');

      // Request A aborts
      const state3 = problemReducer(state2, {
        type: fetchProblems.rejected.type,
        meta: { requestId: 'req-A', arg: { page: 1, limit: 20 }, aborted: true },
      });

      assert.equal(state3.loading, true, 'Loading must remain true because Request B is still active');
      assert.equal(state3.currentRequestId, 'req-B', 'Ownership must remain with Request B');
      assert.notEqual(state3.activeListKey, null, 'Active list key for Request B must not be cleared');
    });
  });

  // 4. Stale detail abort
  describe('Scenario 4: Stale detail abort', () => {
    it('request A starts, request B becomes loading owner, A aborts -> B remains loading', () => {
      const state0 = getInitialState();

      // Detail A starts
      const state1 = problemReducer(state0, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-detail-A', arg: 'two-sum' },
      });
      assert.equal(state1.currentRequestId, 'req-detail-A');

      // Detail B starts
      const state2 = problemReducer(state1, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-detail-B', arg: 'three-sum' },
      });
      assert.equal(state2.loading, true);
      assert.equal(state2.currentRequestId, 'req-detail-B');
      assert.equal(state2.activeDetailKey, 'three-sum');

      // Detail A aborts
      const state3 = problemReducer(state2, {
        type: fetchProblemById.rejected.type,
        meta: { requestId: 'req-detail-A', arg: 'two-sum', aborted: true },
      });

      assert.equal(state3.loading, true, 'Loading must remain true because Request B is active');
      assert.equal(state3.currentRequestId, 'req-detail-B', 'Ownership must remain with Request B');
      assert.equal(state3.activeDetailKey, 'three-sum', 'Active key for Request B must be preserved');
    });
  });

  // 5. Cross-type overlap
  describe('Scenario 5: Cross-type overlap (List & Detail)', () => {
    it('list request starts, detail request starts and takes ownership, list aborts -> detail remains loading', () => {
      const state0 = getInitialState();

      // List request starts
      const state1 = problemReducer(state0, {
        type: fetchProblems.pending.type,
        meta: { requestId: 'req-list', arg: { page: 1 } },
      });
      assert.equal(state1.currentRequestId, 'req-list');

      // Detail request starts and becomes current loading owner
      const state2 = problemReducer(state1, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-detail', arg: 'two-sum' },
      });
      assert.equal(state2.loading, true);
      assert.equal(state2.currentRequestId, 'req-detail');
      assert.equal(state2.activeDetailKey, 'two-sum');

      // List request aborts
      const state3 = problemReducer(state2, {
        type: fetchProblems.rejected.type,
        meta: { requestId: 'req-list', arg: { page: 1 }, aborted: true },
      });

      assert.equal(state3.loading, true, 'Loading must remain true because detail request owns loading');
      assert.equal(state3.currentRequestId, 'req-detail', 'Detail request must retain ownership');
      assert.equal(state3.activeDetailKey, 'two-sum', 'Detail active key must NOT be cleared by list abort');
    });

    it('detail request starts, list request starts and takes ownership, detail aborts -> list remains loading', () => {
      const state0 = getInitialState();

      // Detail request starts
      const state1 = problemReducer(state0, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-detail', arg: 'two-sum' },
      });

      // List request starts and takes ownership
      const state2 = problemReducer(state1, {
        type: fetchProblems.pending.type,
        meta: { requestId: 'req-list', arg: { page: 1 } },
      });
      assert.equal(state2.loading, true);
      assert.equal(state2.currentRequestId, 'req-list');

      // Detail request aborts
      const state3 = problemReducer(state2, {
        type: fetchProblemById.rejected.type,
        meta: { requestId: 'req-detail', arg: 'two-sum', aborted: true },
      });

      assert.equal(state3.loading, true, 'Loading must remain true because list request owns loading');
      assert.equal(state3.currentRequestId, 'req-list', 'List request must retain ownership');
      assert.notEqual(state3.activeListKey, null, 'List active key must NOT be cleared by detail abort');
    });
  });

  // 6. Older completion / failure
  describe('Scenario 6: Older request completing or failing', () => {
    it('older request fulfilling does not clear loading owned by newer request', () => {
      const state0 = getInitialState();

      // Request A starts
      const state1 = problemReducer(state0, {
        type: fetchProblems.pending.type,
        meta: { requestId: 'req-A', arg: { page: 1 } },
      });

      // Request B starts
      const state2 = problemReducer(state1, {
        type: fetchProblems.pending.type,
        meta: { requestId: 'req-B', arg: { page: 2 } },
      });
      assert.equal(state2.loading, true);
      assert.equal(state2.currentRequestId, 'req-B');

      // Request A fulfills
      const state3 = problemReducer(state2, {
        type: fetchProblems.fulfilled.type,
        meta: { requestId: 'req-A', arg: { page: 1 } },
        payload: {
          key: JSON.stringify({ page: 1 }),
          problems: [{ id: 1, title: 'Prob 1' }],
          pagination: { page: 1, total: 1, limit: 20, totalPages: 1 },
          fetchedAt: Date.now(),
        },
      });

      assert.equal(state3.loading, true, 'Loading must remain true because Request B is still in flight');
      assert.equal(state3.currentRequestId, 'req-B', 'Ownership must remain with Request B');
      assert.ok(state3.listCache[JSON.stringify({ page: 1 })], 'Cache for older request is still saved');
    });

    it('older non-aborted failure does not clear loading owned by newer request', () => {
      const state0 = getInitialState();

      // Request A starts
      const state1 = problemReducer(state0, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-A', arg: 'two-sum' },
      });

      // Request B starts
      const state2 = problemReducer(state1, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-B', arg: 'three-sum' },
      });

      // Request A fails (non-abort 500 error)
      const state3 = problemReducer(state2, {
        type: fetchProblemById.rejected.type,
        meta: { requestId: 'req-A', arg: 'two-sum', aborted: false },
        payload: 'Server error on two-sum',
      });

      assert.equal(state3.loading, true, 'Loading must remain true because Request B is active');
      assert.equal(state3.currentRequestId, 'req-B', 'Ownership must remain with Request B');
    });
  });

  // 7. Same-key retry / React StrictMode lifecycle simulation
  describe('Scenario 7: Same-key retry / React StrictMode lifecycle', () => {
    it('Mount 1 pending -> StrictMode abort -> Mount 2 can immediately dispatch and succeed', () => {
      const state0 = getInitialState();

      // Mount 1 dispatch
      const state1 = problemReducer(state0, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'mount-1', arg: 'two-sum' },
      });
      assert.equal(state1.loading, true);
      assert.equal(state1.activeDetailKey, 'two-sum');

      // StrictMode unmount cleanup aborts Mount 1
      const state2 = problemReducer(state1, {
        type: fetchProblemById.rejected.type,
        meta: { requestId: 'mount-1', arg: 'two-sum', aborted: true },
      });
      assert.equal(state2.loading, false, 'Loading must be recovered to false');
      assert.equal(state2.currentRequestId, null, 'Ownership must be null');
      assert.equal(state2.activeDetailKey, null, 'Active key must be null so condition allows retry');

      // Mount 2 dispatch with the SAME key 'two-sum'
      const state3 = problemReducer(state2, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'mount-2', arg: 'two-sum' },
      });
      assert.equal(state3.loading, true, 'Mount 2 must successfully enter pending');
      assert.equal(state3.currentRequestId, 'mount-2', 'Mount 2 owns loading');
      assert.equal(state3.activeDetailKey, 'two-sum', 'Mount 2 sets activeDetailKey');

      // Mount 2 fulfills
      const state4 = problemReducer(state3, {
        type: fetchProblemById.fulfilled.type,
        meta: { requestId: 'mount-2', arg: 'two-sum' },
        payload: {
          key: 'two-sum',
          problem: { id: 1, title: 'Two Sum', slug: 'two-sum' },
          fetchedAt: Date.now(),
        },
      });
      assert.equal(state4.loading, false, 'Mount 2 fulfills and clears loading');
      assert.equal(state4.selectedProblem?.id, 1, 'Problem entity is loaded successfully');
    });
  });

  // 8. Normal success and failure
  describe('Scenario 8: Normal success and failure behavior', () => {
    it('normal successful request fulfills, clears loading and currentRequestId, and caches data', () => {
      const state0 = getInitialState();

      const state1 = problemReducer(state0, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-success', arg: 'two-sum' },
      });
      assert.equal(state1.loading, true);

      const state2 = problemReducer(state1, {
        type: fetchProblemById.fulfilled.type,
        meta: { requestId: 'req-success', arg: 'two-sum' },
        payload: {
          key: 'two-sum',
          problem: { id: 42, title: 'Two Sum' },
          fetchedAt: Date.now(),
        },
      });

      assert.equal(state2.loading, false);
      assert.equal(state2.currentRequestId, null);
      assert.equal(state2.selectedProblem?.id, 42);
      assert.ok(state2.detailCache['two-sum'], 'Cached entry exists in detailCache');
    });

    it('normal non-abort failure sets error message, resets loading, and clears currentRequestId', () => {
      const state0 = getInitialState();

      const state1 = problemReducer(state0, {
        type: fetchProblemById.pending.type,
        meta: { requestId: 'req-fail', arg: 'two-sum' },
      });
      assert.equal(state1.loading, true);

      const state2 = problemReducer(state1, {
        type: fetchProblemById.rejected.type,
        meta: { requestId: 'req-fail', arg: 'two-sum', aborted: false },
        payload: 'Problem not found in catalog',
      });

      assert.equal(state2.loading, false, 'Loading must be false after failure');
      assert.equal(state2.currentRequestId, null, 'Ownership must be cleared');
      assert.equal(state2.error, 'Problem not found in catalog');
      assert.equal(state2.selectedProblem, null);
    });
  });

  // 9. StrictMode Synchronous Abort-Signal Recovery
  describe('Scenario 9: StrictMode Synchronous Abort-Signal Recovery', () => {
    it('remount dispatch is not skipped by condition when previous request was aborted', async () => {
      const { configureStore } = await import('@reduxjs/toolkit');
      const store = configureStore({
        reducer: {
          problems: problemReducer,
        },
      });

      // Mount 1 dispatch
      const req1 = store.dispatch(fetchProblemById('two-sum'));
      assert.equal(store.getState().problems.loading, true);

      // StrictMode unmount cleanup aborts req1 synchronously
      req1.abort();

      // Mount 2 dispatch occurs synchronously
      const req2 = store.dispatch(fetchProblemById('two-sum'));

      // req2 must NOT be rejected by condition (meta.condition should be undefined, not true)
      const res2 = await req2;
      assert.notEqual(res2.meta?.condition, true, 'Mount 2 must not be cancelled by condition');
    });
  });
});

describe('UX regression: visible problem data belongs to the active query', () => {
  const seedVisiblePage = () => {
    const pending = problemReducer(undefined, {
      type: fetchProblems.pending.type,
      meta: { requestId: 'seed-request', arg: { page: 1, limit: 20, searchText: 'arrays' } },
    });
    return problemReducer(pending, {
      type: fetchProblems.fulfilled.type,
      meta: { requestId: 'seed-request', arg: { page: 1, limit: 20, searchText: 'arrays' } },
      payload: {
        key: pending.activeListKey,
        problems: [{ id: 1, title: 'Array Sum' }],
        pagination: { page: 1, total: 1, limit: 20, totalPages: 1 },
        fetchedAt: Date.now(),
      },
    });
  };

  it('clears the previous query rows as soon as an uncached query starts', () => {
    const seeded = seedVisiblePage();
    assert.equal(seeded.problems[0]?.title, 'Array Sum');

    const next = problemReducer(seeded, {
      type: fetchProblems.pending.type,
      meta: { requestId: 'new-query', arg: { page: 2, limit: 20, searchText: 'graphs' } },
    });

    assert.deepEqual(next.problems, []);
    assert.equal(next.pagination.page, 2);
    assert.equal(next.pagination.total, 0);
    assert.equal(next.listLoading, true);
  });

  it('keeps current rows visible for a same-query background refresh', () => {
    const seeded = seedVisiblePage();
    const refreshed = problemReducer(seeded, {
      type: fetchProblems.pending.type,
      meta: { requestId: 'same-query', arg: { page: 1, limit: 20, searchText: 'arrays' } },
    });

    assert.equal(refreshed.problems[0]?.title, 'Array Sum');
    assert.equal(refreshed.pagination.total, 1);
    assert.equal(refreshed.listLoading, true);
  });
});
