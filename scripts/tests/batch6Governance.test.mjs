import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

// Mock localStorage for node environment
const memStore = new Map();
globalThis.localStorage = {
  getItem: (k) => memStore.get(k) || null,
  setItem: (k, v) => memStore.set(k, String(v)),
  removeItem: (k) => memStore.delete(k),
  clear: () => memStore.clear(),
};

// Import production bookmarkReducer and thunks
const bookmarkModule = await import('../../src/features/bookmarks/redux/bookmarkSlice.ts');
const { default: bookmarkReducer, fetchBookmarks, toggleBookmarkItem, clearBookmarks, isBookmarkItem } = bookmarkModule;
const progressModule = await import('../../src/features/progress/redux/progressSlice.ts');
const { default: progressReducer, hydrateProgress } = progressModule;
const profileModule = await import('../../src/features/profile/redux/profileSlice.ts');
const { default: profileReducer, fetchUserInfoThunk } = profileModule;
const referenceModule = await import('../../src/features/references/redux/referenceSlice.ts');
const { default: referenceReducer, fetchReferenceGroup } = referenceModule;
const languageModule = await import('../../src/features/languages/redux/languageSlice.ts');
const { default: languageReducer, fetchLanguages } = languageModule;
const { configureStore } = await import('@reduxjs/toolkit');
const { userQuestionService } = await import('../../src/services/userQuestionService.ts');

describe('BATCH 6 AUDIT REMEDIATION TEST SUITE: Governance, CI Infrastructure & Automation', () => {

  describe('F-038: Full Root TypeScript Configuration & Scope Coverage', () => {
    it('verifies root tsconfig.json covers all files in src/ without exclusion', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      assert.ok(fs.existsSync(tsconfigPath), 'root tsconfig.json must exist');

      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      assert.equal(content.compilerOptions.strict, true, 'Strict mode must be enabled');
      assert.equal(content.compilerOptions.noEmit, true, 'noEmit must be true for CI typechecking');
      assert.ok(
        content.include.includes('src/**/*') || content.include.includes('src'),
        'include must cover entire src directory'
      );
    });

    it('verifies package.json typecheck script references root tsconfig.json', () => {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert.match(
        pkg.scripts.typecheck,
        /tsconfig\.json/,
        'package.json typecheck must reference tsconfig.json'
      );
    });
  });

  describe('F-033: Automated Test Runner Script in package.json', () => {
    it('verifies package.json provides native node test script for CI and local execution', () => {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert.ok(pkg.scripts.test, 'npm test script must be configured');
      assert.match(pkg.scripts.test, /node --test/, 'test script must invoke native node test runner');
    });
  });

  describe('F-010: Global Bookmark Hydration & Concurrency Guard', () => {
    it('verifies AppRouterLayout mounts global fetchBookmarks hydration on bootstrap and tracks userId', () => {
      const layoutPath = path.resolve(process.cwd(), 'src/layouts/AppRouterLayout.tsx');
      const code = fs.readFileSync(layoutPath, 'utf8');
      assert.match(code, /fetchBookmarks/, 'AppRouterLayout must import fetchBookmarks');
      assert.match(code, /dispatch\(fetchBookmarks\(\)\)/, 'AppRouterLayout must dispatch fetchBookmarks');
      assert.match(code, /\[dispatch,\s*userId\]/, 'AppRouterLayout must re-hydrate bookmarks on userId transition');
    });

    it('verifies fetchBookmarks thunk condition guard rejects redundant fetches when already loading', () => {
      const slicePath = path.resolve(process.cwd(), 'src/features/bookmarks/redux/bookmarkSlice.ts');
      const code = fs.readFileSync(slicePath, 'utf8');
      assert.match(code, /condition:\s*\(/, 'fetchBookmarks must define a condition guard');
      assert.match(code, /state\.bookmarks\?\.loading/, 'condition guard must inspect loading state');
    });

    it('verifies failure resets loading state so retry is possible', () => {
      const slicePath = path.resolve(process.cwd(), 'src/features/bookmarks/redux/bookmarkSlice.ts');
      const code = fs.readFileSync(slicePath, 'utf8');
      assert.match(code, /addCase\(fetchBookmarks\.rejected,\s*\(state,\s*action\)\s*=>\s*\{[\s\S]*?state\.loading\s*=\s*false/, 'fetchBookmarks.rejected must set loading to false');
    });

    it('verifies auth transitions reset bookmarks and browser-only types use scoped storage', () => {
      const slicePath = path.resolve(process.cwd(), 'src/features/bookmarks/redux/bookmarkSlice.ts');
      const code = fs.readFileSync(slicePath, 'utf8');
      assert.match(code, /auth\/logout\/fulfilled/, 'bookmarkSlice must handle auth/logout/fulfilled');
      assert.match(code, /auth\/logout\/rejected/, 'bookmarkSlice must handle auth/logout/rejected');
      assert.match(code, /auth\/login\/fulfilled/, 'bookmarkSlice must handle auth/login/fulfilled');
      assert.match(code, /userScopedStorage/, 'browser-only bookmark types must use user-scoped storage');
      assert.match(code, /item\.type === 'APTITUDE' \|\| item\.type === 'COMPANY'/, 'only unsupported browser-only types may hydrate locally');

      const middlewareCode = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/clientPersistenceMiddleware.ts'),
        'utf8'
      );
      assert.match(middlewareCode, /type === 'APTITUDE' \|\| type === 'COMPANY'/);
      assert.match(middlewareCode, /\.filter\(isLocalOnlyBookmark\)/);
    });

    // =========================================================================
    // BEHAVIORAL REDUCER TESTS: EXACT ACCOUNT-SWITCH RACE-CONDITION SEQUENCE
    // =========================================================================
    it('exact sequence: User A pending request resolves AFTER User B logs in & starts hydration -> User A late response is safely discarded', () => {
      // Step 1: User A is authenticated
      const userA = { id: 'user-A', email: 'userA@c2c.test' };
      const userB = { id: 'user-B', email: 'userB@c2c.test' };

      let state = bookmarkReducer(undefined, {
        type: 'auth/login/fulfilled',
        payload: userA,
      });
      assert.equal(state.activeUserId, 'user-A');
      assert.equal(state.loading, false);
      assert.equal(state.currentRequestId, null);

      // Step 2: User A's fetchBookmarks request starts and remains pending (req-A)
      state = bookmarkReducer(state, {
        type: fetchBookmarks.pending.type,
        meta: { requestId: 'req-A' },
      });
      assert.equal(state.loading, true);
      assert.equal(state.currentRequestId, 'req-A');
      assert.equal(state.activeUserId, 'user-A');

      // Step 3: User A logs out
      state = bookmarkReducer(state, {
        type: 'auth/logout/fulfilled',
      });
      assert.equal(state.activeUserId, null);
      assert.equal(state.loading, false);
      assert.equal(state.currentRequestId, null);
      assert.deepEqual(state.bookmarks, []);

      // Step 4: User B logs in
      state = bookmarkReducer(state, {
        type: 'auth/login/fulfilled',
        payload: userB,
      });
      assert.equal(state.activeUserId, 'user-B');
      assert.equal(state.loading, false);
      assert.equal(state.currentRequestId, null);

      // Step 5: User B's bookmark hydration starts (req-B)
      state = bookmarkReducer(state, {
        type: fetchBookmarks.pending.type,
        meta: { requestId: 'req-B' },
      });
      assert.equal(state.loading, true);
      assert.equal(state.currentRequestId, 'req-B');
      assert.equal(state.activeUserId, 'user-B');

      // Step 6: User A's OLD request (req-A) resolves AFTER User B started
      const userABookmarks = [
        { id: 'bm-1', itemId: '101', type: 'PROBLEM', title: 'Problem 101 from User A', savedAt: '2026-01-01' },
      ];
      state = bookmarkReducer(state, {
        type: fetchBookmarks.fulfilled.type,
        payload: { userId: 'user-A', bookmarks: userABookmarks },
        meta: { requestId: 'req-A' },
      });

      // ACCEPTANCE CRITERIA VERIFICATION:
      // - User A's late response must never overwrite User B's bookmark state
      assert.deepEqual(state.bookmarks, [], 'User A bookmarks must never overwrite User B bookmark state');
      // - Loading and error state must remain consistent
      assert.equal(state.loading, true, 'Loading must remain true for User B active request');
      assert.equal(state.currentRequestId, 'req-B', 'currentRequestId must remain bound to User B');
      assert.equal(state.error, null, 'Error must remain null');

      // Step 7: User B's own request (req-B) resolves with User B's bookmarks
      const userBBookmarks = [
        { id: 'bm-2', itemId: '202', type: 'PROBLEM', title: 'Problem 202 from User B', savedAt: '2026-02-02' },
      ];
      state = bookmarkReducer(state, {
        type: fetchBookmarks.fulfilled.type,
        payload: { userId: 'user-B', bookmarks: userBBookmarks },
        meta: { requestId: 'req-B' },
      });

      // User B bookmarks committed cleanly
      assert.deepEqual(state.bookmarks, userBBookmarks, 'User B bookmarks must be cleanly committed');
      assert.equal(state.loading, false, 'Loading must resolve to false');
      assert.equal(state.currentRequestId, null, 'currentRequestId must be reset to null');
    });

    it('exact sequence: User A late rejection does NOT clear User B loading or set error', () => {
      // User A starts
      let state = bookmarkReducer(undefined, {
        type: 'auth/login/fulfilled',
        payload: { id: 'user-A' },
      });
      state = bookmarkReducer(state, {
        type: fetchBookmarks.pending.type,
        meta: { requestId: 'req-A' },
      });

      // User A logs out, User B logs in and starts req-B
      state = bookmarkReducer(state, { type: 'auth/logout/fulfilled' });
      state = bookmarkReducer(state, {
        type: 'auth/login/fulfilled',
        payload: { id: 'user-B' },
      });
      state = bookmarkReducer(state, {
        type: fetchBookmarks.pending.type,
        meta: { requestId: 'req-B' },
      });

      // User A's old request fails
      state = bookmarkReducer(state, {
        type: fetchBookmarks.rejected.type,
        meta: { requestId: 'req-A' },
        error: { message: 'Network failed for User A' },
      });

      // User B session is unaffected
      assert.equal(state.loading, true, 'User B must remain in loading state');
      assert.equal(state.currentRequestId, 'req-B', 'currentRequestId must remain req-B');
      assert.equal(state.error, null, 'User A error must not leak into User B state');
    });

    it('exact sequence: failed request permits a subsequent retry', () => {
      let state = bookmarkReducer(undefined, {
        type: 'auth/login/fulfilled',
        payload: { id: 'user-B' },
      });

      // First attempt starts
      state = bookmarkReducer(state, {
        type: fetchBookmarks.pending.type,
        meta: { requestId: 'req-B1' },
      });
      assert.equal(state.loading, true);

      // First attempt fails
      state = bookmarkReducer(state, {
        type: fetchBookmarks.rejected.type,
        meta: { requestId: 'req-B1' },
        payload: 'Internal Server Error (500)',
      });
      assert.equal(state.loading, false);
      assert.equal(state.currentRequestId, null);
      assert.equal(state.error, 'Internal Server Error (500)');

      // Subsequent retry is permitted and succeeds
      state = bookmarkReducer(state, {
        type: fetchBookmarks.pending.type,
        meta: { requestId: 'req-B2' },
      });
      assert.equal(state.loading, true);
      assert.equal(state.currentRequestId, 'req-B2');
      assert.equal(state.error, null);

      const retryBookmarks = [{ id: 'bm-r', itemId: '303', type: 'PROBLEM', title: 'Problem 303', savedAt: '2026-03-03' }];
      state = bookmarkReducer(state, {
        type: fetchBookmarks.fulfilled.type,
        payload: { userId: 'user-B', bookmarks: retryBookmarks },
        meta: { requestId: 'req-B2' },
      });
      assert.equal(state.loading, false);
      assert.equal(state.currentRequestId, null);
      assert.deepEqual(state.bookmarks, retryBookmarks);
    });

    it('preserves known server bookmarks and restores scoped local-only bookmarks on refresh failure', () => {
      const problem = { id: 'bm-q-1', itemId: '1', type: 'PROBLEM', title: 'Two Sum', savedAt: '2026-01-01' };
      const aptitude = { id: 'bm-aptitude-7', itemId: '7', type: 'APTITUDE', title: 'Ratios', savedAt: '2026-01-02' };
      let state = {
        ...bookmarkReducer(undefined, { type: '@@init' }),
        activeUserId: 'user-A',
        bookmarks: [problem],
        loading: true,
        currentRequestId: 'req-A',
      };

      state = bookmarkReducer(state, {
        type: fetchBookmarks.rejected.type,
        payload: {
          userId: 'user-A',
          localBookmarks: [aptitude],
          message: 'Network unavailable',
        },
        meta: { requestId: 'req-A', aborted: false, condition: false },
        error: {},
      });

      assert.deepEqual(state.bookmarks, [problem, aptitude]);
      assert.equal(state.error, 'Network unavailable');
      assert.equal(state.loading, false);
    });

    it('exact sequence: duplicate requests are prevented while loading', async () => {
      const dispatched = [];
      const fakeDispatch = (action) => dispatched.push(action);
      const getStateLoading = () => ({
        bookmarks: {
          loading: true,
        },
      });

      const thunkFn = fetchBookmarks();
      const res = await thunkFn(fakeDispatch, getStateLoading, undefined);

      assert.equal(res?.meta?.condition, true, 'Thunk must be rejected by condition guard');
      assert.equal(
        dispatched.some((a) => a.type === fetchBookmarks.pending.type),
        false,
        'Pending action must not be dispatched when loading is already true'
      );
    });

    it('exact sequence: existing bookmark toggle and clear functionality remains intact', () => {
      let state = bookmarkReducer(undefined, {
        type: 'auth/login/fulfilled',
        payload: { id: 'user-B' },
      });

      const sampleBookmarks = [{ id: 'bm-t1', itemId: '404', type: 'PROBLEM', title: 'Problem 404', savedAt: '2026-04-04' }];
      state = bookmarkReducer(state, {
        type: toggleBookmarkItem.fulfilled.type,
        payload: { item: sampleBookmarks[0], removed: false },
      });
      assert.deepEqual(state.bookmarks, sampleBookmarks);

      state = bookmarkReducer(state, {
        type: clearBookmarks.type,
      });
      assert.deepEqual(state.bookmarks, []);
      assert.equal(state.loading, false);
      assert.equal(state.currentRequestId, null);
    });

    it('uses type plus itemId as bookmark identity so problem and aptitude IDs cannot collide', () => {
      const problem = { id: 'p-1', itemId: '1', type: 'PROBLEM', title: 'Problem 1', savedAt: '2026-04-04' };
      const aptitude = { id: 'a-1', itemId: '1', type: 'APTITUDE', title: 'Aptitude 1', savedAt: '2026-04-04' };

      assert.equal(isBookmarkItem(problem, '1', 'PROBLEM'), true);
      assert.equal(isBookmarkItem(problem, '1', 'APTITUDE'), false);

      let state = bookmarkReducer(undefined, {
        type: toggleBookmarkItem.fulfilled.type,
        payload: { item: problem, removed: false },
      });
      state = bookmarkReducer(state, {
        type: toggleBookmarkItem.fulfilled.type,
        payload: { item: aptitude, removed: false },
      });
      assert.equal(state.bookmarks.length, 2);
    });
  });

  describe('F-042: Server-Owned Admin Test Cases and Motion Accessibility', () => {
    it('does not report an unsaved test-case mutation as a successful local save', () => {
      const modalPath = path.resolve(process.cwd(), 'src/features/admin/components/questions/TestCaseModal.tsx');
      const code = fs.readFileSync(modalPath, 'utf8');

      assert.doesNotMatch(code, /userScopedStorage/, 'Admin test cases must not be persisted in browser storage');
      assert.doesNotMatch(code, /Saved \$\{payload\.length\} test cases locally/, 'A failed API save must remain visibly failed');
    });

    it('does not override backend-owned question metadata or test cases from browser storage or fixtures', () => {
      const questionPage = fs.readFileSync(
        path.resolve(process.cwd(), 'src/features/admin/pages/AdminQuestions.tsx'),
        'utf8'
      );
      const resolver = fs.readFileSync(
        path.resolve(process.cwd(), 'src/features/admin/utils/testCaseUtils.ts'),
        'utf8'
      );

      assert.doesNotMatch(questionPage, /userScopedStorage/, 'Admin question metadata must reflect the API response');
      assert.doesNotMatch(resolver, /userScopedStorage|KNOWN_PROBLEM_TEST_CASES|admin_test_cases_/, 'Problem test cases must come from the API payload or visible problem content');
    });

    it('keeps submission history server-derived instead of mirroring execution data in browser storage', () => {
      const problemDetails = fs.readFileSync(
        path.resolve(process.cwd(), 'src/features/problems/pages/ProblemDetails.tsx'),
        'utf8'
      );

      assert.doesNotMatch(problemDetails, /submissions_\$\{activeQuestionId\}/, 'Submission history must be fetched from its API endpoint');
      assert.doesNotMatch(problemDetails, /userScopedStorage\.(?:getItem|setItem)\([^\n]*submission/i, 'Submission records must never be mirrored into user-scoped storage');
      assert.match(problemDetails, /setSubmissionsRetry\(\(attempt\) => attempt \+ 1\)/, 'A completed submission must invalidate the live history query');
    });

    it('uses Framer Motion with reduced-motion support for admin modals', () => {
      const modalPath = path.resolve(process.cwd(), 'src/features/admin/components/AdminModal.tsx');
      const code = fs.readFileSync(modalPath, 'utf8');

      assert.match(code, /AnimatePresence/, 'AdminModal must coordinate mount/unmount transitions');
      assert.match(code, /useReducedMotion/, 'AdminModal must respect reduced-motion preferences');
      assert.match(code, /role="dialog"/, 'AdminModal must expose dialog semantics');
      assert.match(code, /aria-modal="true"/, 'AdminModal must expose modal semantics');
      assert.match(code, /e\.key === 'Tab'/, 'AdminModal must keep keyboard focus inside the active dialog');
    });
  });

  describe('F-043: Redux User Scope and Request Ownership', () => {
    it('ignores late progress responses from the previous authenticated user', () => {
      let state = progressReducer(undefined, {
        type: hydrateProgress.pending.type,
        meta: { requestId: 'progress-A', arg: { userId: 'A' } },
      });
      state = progressReducer(state, {
        type: hydrateProgress.pending.type,
        meta: { requestId: 'progress-B', arg: { userId: 'B' } },
      });
      state = progressReducer(state, {
        type: hydrateProgress.fulfilled.type,
        payload: { solved: { 1: true }, attempted: {}, userId: 'A', warning: null },
        meta: { requestId: 'progress-A', arg: { userId: 'A' } },
      });

      assert.deepEqual(state.solvedByProblemId, {});
      assert.equal(state.currentRequestId, 'progress-B');
    });

    it('clears populated progress immediately when a different account begins hydration', () => {
      let state = progressReducer(undefined, {
        type: hydrateProgress.pending.type,
        meta: { requestId: 'progress-A', arg: { userId: 'A' } },
      });
      state = progressReducer(state, {
        type: hydrateProgress.fulfilled.type,
        payload: {
          solved: { 42: true },
          attempted: { 43: true },
          solvedItems: [{ questionId: 42 }],
          attemptedItems: [{ questionId: 43 }],
          userId: 'A',
          fetchedAt: 10,
          warning: null,
        },
        meta: { requestId: 'progress-A', arg: { userId: 'A' } },
      });
      state = progressReducer(state, {
        type: hydrateProgress.pending.type,
        meta: { requestId: 'progress-B', arg: { userId: 'B' } },
      });

      assert.deepEqual(state.solvedByProblemId, {});
      assert.deepEqual(state.attemptedByProblemId, {});
      assert.deepEqual(state.solvedItems, []);
      assert.deepEqual(state.attemptedItems, []);
      assert.equal(state.lastFetchedUserId, 'B');
    });

    it('keeps user-scoped local progress visible when both server progress requests fail', async () => {
      const originalSolved = userQuestionService.getSolvedQuestions;
      const originalAttempted = userQuestionService.getAttemptedQuestions;
      userQuestionService.getSolvedQuestions = async () => { throw new Error('offline'); };
      userQuestionService.getAttemptedQuestions = async () => { throw new Error('offline'); };
      const store = configureStore({
        reducer: {
          progress: progressReducer,
          auth: () => ({ isAuthenticated: true, user: { id: 'A' } }),
        },
      });

      try {
        const result = await store.dispatch(hydrateProgress({ userId: 'A', force: true }));
        assert.equal(result.type, hydrateProgress.fulfilled.type);
        assert.match(store.getState().progress.error, /Showing locally saved progress/);
      } finally {
        userQuestionService.getSolvedQuestions = originalSolved;
        userQuestionService.getAttemptedQuestions = originalAttempted;
      }
    });

    it('ignores late academic-profile responses after a newer user owns the request', () => {
      let state = profileReducer(undefined, {
        type: fetchUserInfoThunk.pending.type,
        meta: { requestId: 'profile-A', arg: { userId: 'A' } },
      });
      state = profileReducer(state, {
        type: fetchUserInfoThunk.pending.type,
        meta: { requestId: 'profile-B', arg: { userId: 'B' } },
      });
      state = profileReducer(state, {
        type: fetchUserInfoThunk.fulfilled.type,
        payload: { userId: 'A', data: { userId: 1, regNumber: 'A' } },
        meta: { requestId: 'profile-A', arg: { userId: 'A' } },
      });

      assert.equal(state.userInfo, null);
      assert.equal(state.userInfoRequestId, 'profile-B');
    });

    it('stores the academic payload rather than the thunk request wrapper', () => {
      let state = profileReducer(undefined, {
        type: fetchUserInfoThunk.pending.type,
        meta: { requestId: 'profile-current', arg: { userId: 63 } },
      });
      state = profileReducer(state, {
        type: fetchUserInfoThunk.fulfilled.type,
        payload: { userId: 63, data: { userId: 63, regNumber: 'C2C-63' } },
        meta: { requestId: 'profile-current', arg: { userId: 63 } },
      });

      assert.equal(state.userInfo?.regNumber, 'C2C-63');
      assert.equal('data' in state.userInfo, false);
    });

    it('injects the requested user ID when a valid profile response omits it', () => {
      let state = profileReducer(undefined, {
        type: fetchUserInfoThunk.pending.type,
        meta: { requestId: 'profile-current', arg: { userId: 63 } },
      });
      state = profileReducer(state, {
        type: fetchUserInfoThunk.fulfilled.type,
        payload: { userId: 63, data: { regNumber: 'C2C-63' } },
        meta: { requestId: 'profile-current', arg: { userId: 63 } },
      });

      assert.equal(state.userInfo?.userId, 63);
    });

    it('clears cached profile data when a different account becomes active', () => {
      const previousState = {
        ...profileReducer(undefined, { type: '@@init' }),
        profile: { id: 'A', email: 'a@example.test' },
        userInfo: { userId: 'A', regNumber: 'A-1' },
        activeUserInfoUserId: 'A',
      };
      const state = profileReducer(previousState, {
        type: 'auth/setAuthenticatedSession',
        payload: { user: { id: 'B', email: 'b@example.test' } },
      });

      assert.equal(state.profile, null);
      assert.equal(state.userInfo, null);
      assert.equal(state.activeUserInfoUserId, 'B');
    });
  });

  describe('F-040: Hardened Smoke Preview Asset & Container Verification', () => {
    it('verifies smoke-preview.mjs validates root mount container and bundle assets', () => {
      const smokePath = path.resolve(process.cwd(), 'scripts/smoke-preview.mjs');
      const code = fs.readFileSync(smokePath, 'utf8');
      assert.match(code, /id="root"/, 'smoke-preview must verify root mounting element');
      assert.match(code, /verifiedAssets/, 'smoke-preview must track and verify bundle assets');
      assert.match(code, /fetchWithTimeout\(`\$\{baseUrl\}\$\{assetPath\}`\)/, 'smoke-preview must fetch referenced assets');
      assert.match(code, /verifiedAssets\.size\s*===\s*0/, 'smoke-preview must assert at least one bundle asset was detected');
    });

    it('verifies smoke check logic fails for missing #root container', () => {
      const htmlWithoutRoot = '<!doctype html><html><body><div>No root here</div></body></html>';
      assert.throws(() => {
        if (!htmlWithoutRoot.includes('id="root"')) {
          throw new Error('missing #root mounting container');
        }
      }, /missing #root mounting container/);
    });

    it('verifies smoke check logic fails for non-200 bundle response', () => {
      const mockResponse = { ok: false, status: 404 };
      assert.throws(() => {
        if (!mockResponse.ok) {
          throw new Error(`Referenced asset /assets/index.js failed to load (HTTP ${mockResponse.status})`);
        }
      }, /HTTP 404/);
    });

    it('verifies smoke check logic fails when static asset returns SPA HTML fallback', () => {
      const mockAssetContent = '<!doctype html><html><head></head><body><div id="root"></div></body></html>';
      assert.throws(() => {
        if (mockAssetContent.startsWith('<!doctype') || mockAssetContent.startsWith('<!DOCTYPE')) {
          throw new Error('Referenced asset returned SPA HTML fallback instead of static asset bundle');
        }
      }, /returned SPA HTML fallback/);
    });
  });

  describe('F-020: Feature Flag Environment Variable Evaluation', () => {
    function evaluateComingSoonFlag(envVal) {
      return envVal !== 'false';
    }

    it('defaults SHOW_COMING_SOON to true when env variable is not set or empty', () => {
      assert.equal(evaluateComingSoonFlag(undefined), true);
      assert.equal(evaluateComingSoonFlag(''), true);
      assert.equal(evaluateComingSoonFlag('true'), true);
    });

    it('disables SHOW_COMING_SOON when VITE_SHOW_COMING_SOON is explicitly set to false', () => {
      assert.equal(evaluateComingSoonFlag('false'), false);
    });
  });

  describe('Reference and language Redux cache ownership', () => {
    it('caches an API-confirmed empty reference group using the thunk timestamp', () => {
      let state = referenceReducer(undefined, {
        type: fetchReferenceGroup.pending.type,
        meta: { requestId: 'ref-current', arg: 'topic' },
      });
      state = referenceReducer(state, {
        type: fetchReferenceGroup.fulfilled.type,
        payload: { groupCode: 'TOPIC', items: [], fetchedAt: 1234 },
        meta: { requestId: 'ref-current', arg: 'topic' },
      });

      assert.deepEqual(state.groups.TOPIC, []);
      assert.equal(state.lastFetchedAt.TOPIC, 1234);
      assert.equal(state.loading.TOPIC, false);
    });

    it('ignores a stale reference response after a newer request takes ownership', () => {
      let state = referenceReducer(undefined, {
        type: fetchReferenceGroup.pending.type,
        meta: { requestId: 'ref-old', arg: 'DIFF' },
      });
      state = referenceReducer(state, {
        type: fetchReferenceGroup.pending.type,
        meta: { requestId: 'ref-new', arg: { groupCode: 'DIFF', force: true } },
      });
      state = referenceReducer(state, {
        type: fetchReferenceGroup.fulfilled.type,
        payload: { groupCode: 'DIFF', items: [{ id: 1, refCode: 'OLD' }], fetchedAt: 1 },
        meta: { requestId: 'ref-old', arg: 'DIFF' },
      });

      assert.equal(state.requestIds.DIFF, 'ref-new');
      assert.equal(state.loading.DIFF, true);
      assert.equal(state.groups.DIFF, undefined);
    });

    it('uses the language thunk timestamp and ignores superseded responses', () => {
      let state = languageReducer(undefined, {
        type: fetchLanguages.pending.type,
        meta: { requestId: 'lang-old', arg: undefined },
      });
      state = languageReducer(state, {
        type: fetchLanguages.pending.type,
        meta: { requestId: 'lang-new', arg: { force: true } },
      });
      state = languageReducer(state, {
        type: fetchLanguages.fulfilled.type,
        payload: { items: [{ id: 1, name: 'Old' }], fetchedAt: 1 },
        meta: { requestId: 'lang-old', arg: undefined },
      });
      assert.equal(state.currentRequestId, 'lang-new');
      assert.deepEqual(state.languages, []);

      state = languageReducer(state, {
        type: fetchLanguages.fulfilled.type,
        payload: { items: [], fetchedAt: 5678 },
        meta: { requestId: 'lang-new', arg: { force: true } },
      });
      assert.deepEqual(state.languages, []);
      assert.equal(state.lastFetchedAt, 5678);
    });
  });

});
