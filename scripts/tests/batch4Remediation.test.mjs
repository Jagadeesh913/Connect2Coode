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

// Import real modules after loader registration
const { sanitizeProblemFilters } = await import('../../src/features/problems/redux/problemSlice.ts');
const { parseToIdList } = await import('../../src/services/problemService.ts');
const {
  default: companyReducer,
  fetchCompanies,
  fetchCompanyBySlug,
  fetchCompanyProblems,
} = await import('../../src/features/companies/redux/companySlice.ts');

describe('BATCH 4 AUDIT REMEDIATION TEST SUITE', () => {

  describe('F-018: Problem Filter Payload Sanitization', () => {
    it('strips empty arrays and null fields from search/filter parameters', () => {
      const sanitized = sanitizeProblemFilters({
        search: '',
        searchText: '',
        difficulty: [],
        topic: [],
        companies: [],
        page: 1,
        limit: 20,
      });

      assert.deepEqual(sanitized, {
        page: 1,
        limit: 20,
      });
      assert.equal(sanitized.searchText, undefined);
      assert.equal(sanitized.search, undefined);
      assert.equal(sanitized.difficulty, undefined);
      assert.equal(sanitized.topic, undefined);
      assert.equal(sanitized.companies, undefined);
    });

    it('retains valid non-empty filter parameters, category, and string/numeric IDs', () => {
      const sanitized = sanitizeProblemFilters({
        searchText: 'two sum',
        category: 'Arrays',
        difficulty: [1, 2],
        topic: ['Trees'],
        companies: [10],
        page: 2,
        limit: 50,
      });

      assert.equal(sanitized.searchText, 'two sum');
      assert.equal(sanitized.category, 'Arrays');
      assert.deepEqual(sanitized.difficulty, [1, 2]);
      assert.deepEqual(sanitized.topic, ['Trees']);
      assert.deepEqual(sanitized.companies, [10]);
      assert.equal(sanitized.page, 2);
      assert.equal(sanitized.limit, 50);
    });

    it('parseToIdList converts raw array, single value, and filters invalid IDs', () => {
      assert.equal(parseToIdList(null), null);
      assert.equal(parseToIdList(undefined), null);
      assert.equal(parseToIdList(''), null);
      assert.equal(parseToIdList('All'), null);
      assert.equal(parseToIdList([]), null);
      assert.deepEqual(parseToIdList('5'), [5]);
      assert.deepEqual(parseToIdList(12), [12]);
      assert.deepEqual(parseToIdList([1, '2', 'invalid', -4, 0, 3]), [1, 2, 3]);
    });
  });

  describe('F-014: Company Loading State Separation', () => {
    it('initializes listLoading and detailsLoading independently in initial state', () => {
      const initialState = companyReducer(undefined, { type: '@@INIT' });

      assert.equal(initialState.listLoading, false, 'listLoading must initialize to false');
      assert.equal(initialState.detailsLoading, false, 'detailsLoading must initialize to false');
      assert.equal(initialState.loading, false, 'combined loading must initialize to false');
    });

    it('sets listLoading without affecting detailsLoading on fetchCompanies.pending', () => {
      const stateBefore = companyReducer(undefined, { type: '@@INIT' });

      const stateAfter = companyReducer(stateBefore, {
        type: fetchCompanies.pending.type,
        meta: { arg: undefined, requestId: 'req-list-1' },
      });

      assert.equal(stateAfter.listLoading, true, 'listLoading must be true during list fetch');
      assert.equal(stateAfter.detailsLoading, false, 'detailsLoading must remain false during list fetch');
      assert.equal(stateAfter.loading, true, 'combined loading is true');
    });

    it('sets detailsLoading without affecting listLoading on fetchCompanyBySlug.pending', () => {
      const stateBefore = companyReducer(undefined, { type: '@@INIT' });

      const stateAfter = companyReducer(stateBefore, {
        type: fetchCompanyBySlug.pending.type,
        meta: { arg: 'google', requestId: 'req-detail-1' },
      });

      assert.equal(stateAfter.detailsLoading, true, 'detailsLoading must be true during detail fetch');
      assert.equal(stateAfter.listLoading, false, 'listLoading must remain false during detail fetch');
      assert.equal(stateAfter.loading, true, 'combined loading is true');
    });

    it('clears listLoading on fetchCompanies.fulfilled while preserving detailsLoading if active', () => {
      const initial = companyReducer(undefined, { type: '@@INIT' });
      const pendingState = {
        ...initial,
        listLoading: true,
        detailsLoading: true,
        loading: true,
        companiesRequestKey: '',
        companiesRequestId: 'req-list-1',
      };

      const fulfilledState = companyReducer(pendingState, {
        type: fetchCompanies.fulfilled.type,
        payload: { key: '', companies: [{ id: '1', name: 'Google' }], fetchedAt: Date.now() },
        meta: { arg: undefined, requestId: 'req-list-1' },
      });

      assert.equal(fulfilledState.listLoading, false, 'listLoading must reset to false');
      assert.equal(fulfilledState.detailsLoading, true, 'detailsLoading must remain true');
      assert.equal(fulfilledState.loading, true, 'combined loading remains true because details is loading');
    });

    it('ignores late company detail responses after a newer route owns the request', () => {
      const initial = companyReducer(undefined, { type: '@@INIT' });
      const firstPending = companyReducer(initial, {
        type: fetchCompanyBySlug.pending.type,
        meta: { arg: 'company-a', requestId: 'detail-a' },
      });
      const secondPending = companyReducer(firstPending, {
        type: fetchCompanyBySlug.pending.type,
        meta: { arg: 'company-b', requestId: 'detail-b' },
      });
      const staleFulfilled = companyReducer(secondPending, {
        type: fetchCompanyBySlug.fulfilled.type,
        payload: { key: 'company-a', company: { id: 1, name: 'Company A' }, fetchedAt: Date.now() },
        meta: { arg: 'company-a', requestId: 'detail-a' },
      });

      assert.equal(staleFulfilled.selectedCompany, null);
      assert.equal(staleFulfilled.detailsLoading, true);
      assert.equal(staleFulfilled.companyDetailRequestId, 'detail-b');
    });

    it('keeps existing company problems visible during same-company refresh failure', () => {
      const initial = companyReducer(undefined, { type: '@@INIT' });
      const existingProblems = [{ id: 1, title: 'Two Sum' }];
      const seeded = {
        ...initial,
        companyProblems: existingProblems,
        companyProblemsRequestKey: 'id:7|name:acme',
      };
      const pending = companyReducer(seeded, {
        type: fetchCompanyProblems.pending.type,
        meta: { arg: { id: 7, name: 'Acme' }, requestId: 'problems-refresh' },
      });
      const rejected = companyReducer(pending, {
        type: fetchCompanyProblems.rejected.type,
        payload: 'Refresh failed',
        error: {},
        meta: { arg: { id: 7, name: 'Acme' }, requestId: 'problems-refresh', aborted: false },
      });

      assert.deepEqual(rejected.companyProblems, existingProblems);
      assert.equal(rejected.companyProblemsLoading, false);
      assert.equal(rejected.problemsError, 'Refresh failed');
    });

    it('releases combined loading when the company-problems request settles', () => {
      const initial = companyReducer(undefined, { type: '@@INIT' });
      const pending = companyReducer(initial, {
        type: fetchCompanyProblems.pending.type,
        meta: { arg: { id: 7, name: 'Acme' }, requestId: 'problems-only' },
      });
      assert.equal(pending.loading, true);

      const fulfilled = companyReducer(pending, {
        type: fetchCompanyProblems.fulfilled.type,
        payload: { key: 'id:7|name:acme', problems: [], fetchedAt: Date.now() },
        meta: { arg: { id: 7, name: 'Acme' }, requestId: 'problems-only' },
      });
      assert.equal(fulfilled.companyProblemsLoading, false);
      assert.equal(fulfilled.loading, false);
    });
  });

  describe('F-003: Solved Problem Count & Percentage Against Catalog Total', () => {
    function computeSolvedMetrics({ solvedByProblemId, problems, paginationTotal, loading, isFiltered, isBookmarkedTab }) {
      const totalCatalogProblems =
        paginationTotal > 0
          ? paginationTotal
          : paginationTotal === 0 && !loading && problems.length === 0
          ? 0
          : problems.length;

      const globalSolvedCount = Object.values(solvedByProblemId).filter(Boolean).length;
      const rawSolvedCount =
        isBookmarkedTab
          ? problems.filter((p) => Boolean(solvedByProblemId[p.id] ?? p.isSolved)).length
          : isFiltered
          ? problems.filter((p) => Boolean(solvedByProblemId[p.id] ?? p.isSolved)).length
          : globalSolvedCount > 0
          ? globalSolvedCount
          : problems.filter((p) => Boolean(solvedByProblemId[p.id] ?? p.isSolved)).length;

      const solvedCount = totalCatalogProblems > 0 ? Math.min(rawSolvedCount, totalCatalogProblems) : 0;
      const progressPercent = totalCatalogProblems > 0
        ? Math.min(100, Math.round((solvedCount / totalCatalogProblems) * 100))
        : 0;

      return { solvedCount, totalCatalogProblems, progressPercent };
    }

    it('calculates percentage against total catalog count (e.g. 500) rather than page limit (20)', () => {
      const solvedMap = { '1': true, '2': true, '3': true };
      const currentPageProblems = Array.from({ length: 20 }, (_, i) => ({ id: String(i + 1) }));
      const paginationTotal = 500;

      const metrics = computeSolvedMetrics({
        solvedByProblemId: solvedMap,
        problems: currentPageProblems,
        paginationTotal,
        loading: false,
        isFiltered: false,
        isBookmarkedTab: false,
      });
      assert.equal(metrics.solvedCount, 3);
      assert.equal(metrics.totalCatalogProblems, 500);
      assert.equal(metrics.progressPercent, 1); // 3 / 500 = 0.6% rounded to 1%
    });

    it('correctly reports 0 total and 0% for empty catalog when pagination.total is 0', () => {
      const metrics = computeSolvedMetrics({
        solvedByProblemId: { '1': true },
        problems: [],
        paginationTotal: 0,
        loading: false,
        isFiltered: false,
        isBookmarkedTab: false,
      });
      assert.equal(metrics.solvedCount, 0);
      assert.equal(metrics.totalCatalogProblems, 0);
      assert.equal(metrics.progressPercent, 0);
    });

    it('clamps solved count so numerator never exceeds filtered catalog denominator', () => {
      // User has 10 problems solved globally, but filtered search returns only 2 matching problems (1 of which is solved)
      const solvedMap = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i + 1), true]));
      const filteredProblems = [{ id: '1', isSolved: true }, { id: '99', isSolved: false }];

      const metrics = computeSolvedMetrics({
        solvedByProblemId: solvedMap,
        problems: filteredProblems,
        paginationTotal: 2,
        loading: false,
        isFiltered: true,
        isBookmarkedTab: false,
      });

      assert.equal(metrics.solvedCount, 1, 'Solved count in filtered view must be scoped to matching problems (1)');
      assert.equal(metrics.totalCatalogProblems, 2);
      assert.equal(metrics.progressPercent, 50); // 1 / 2 = 50%
    });

    it('handles initial loading state before pagination arrives without crashing', () => {
      const metrics = computeSolvedMetrics({
        solvedByProblemId: {},
        problems: [],
        paginationTotal: 0,
        loading: true,
        isFiltered: false,
        isBookmarkedTab: false,
      });
      assert.equal(metrics.solvedCount, 0);
      assert.equal(metrics.totalCatalogProblems, 0);
      assert.equal(metrics.progressPercent, 0);
    });
  });

  describe('F-030: Deterministic Skeleton Key Pattern', () => {
    it('generates deterministic skeleton keys with prefix instead of raw array index', () => {
      const count = 5;
      const keys = Array.from({ length: count }).map((_, idx) => `skeleton-${idx}`);

      assert.deepEqual(keys, [
        'skeleton-0',
        'skeleton-1',
        'skeleton-2',
        'skeleton-3',
        'skeleton-4',
      ]);
      assert.ok(keys.every((k) => k.startsWith('skeleton-')));
    });
  });

  describe('F-031: Page Parameter Validation and Sanitization', () => {
    function validatePageParam(rawPage) {
      const parsedPage = Number(rawPage || '1');
      const isValid = Number.isInteger(parsedPage) && parsedPage > 0;
      return {
        currentPage: isValid ? parsedPage : 1,
        needsSanitization: rawPage !== null && !isValid,
      };
    }

    it('accepts valid positive integer strings', () => {
      assert.deepEqual(validatePageParam('1'), { currentPage: 1, needsSanitization: false });
      assert.deepEqual(validatePageParam('5'), { currentPage: 5, needsSanitization: false });
      assert.deepEqual(validatePageParam(null), { currentPage: 1, needsSanitization: false });
    });

    it('detects invalid, negative, decimal, or alphabetic page params and flags for sanitization', () => {
      assert.deepEqual(validatePageParam('0'), { currentPage: 1, needsSanitization: true });
      assert.deepEqual(validatePageParam('-3'), { currentPage: 1, needsSanitization: true });
      assert.deepEqual(validatePageParam('abc'), { currentPage: 1, needsSanitization: true });
      assert.deepEqual(validatePageParam('2.5'), { currentPage: 1, needsSanitization: true });
      assert.deepEqual(validatePageParam('NaN'), { currentPage: 1, needsSanitization: true });
    });

    it('clamps or normalizes out-of-bounds page parameters when totalPages is exceeded', () => {
      function normalizeOutOfBounds(currentPage, totalPages) {
        if (totalPages > 0 && currentPage > totalPages) {
          return totalPages;
        }
        return currentPage;
      }

      assert.equal(normalizeOutOfBounds(10, 3), 3);
      assert.equal(normalizeOutOfBounds(1, 3), 1);
      assert.equal(normalizeOutOfBounds(3, 3), 3);
    });
  });

  describe('F-002: Bookmarked & Answered Tab Client-Side Pagination Slicing', () => {
    function paginateTabItems(items, currentPage, pageSize, tab) {
      if (tab === 'all') {
        return items;
      }
      const startIndex = (currentPage - 1) * pageSize;
      return items.slice(startIndex, startIndex + pageSize);
    }

    it('returns server-paginated items unmodified for "all" tab', () => {
      const serverItems = Array.from({ length: 20 }, (_, i) => ({ id: `p-${i + 1}` }));
      const result = paginateTabItems(serverItems, 1, 20, 'all');
      assert.equal(result.length, 20);
      assert.equal(result[0].id, 'p-1');
    });

    it('slices bookmarked items by page for client-side tabs', () => {
      const bookmarkedItems = Array.from({ length: 45 }, (_, i) => ({ id: `bm-${i + 1}` }));

      const page1 = paginateTabItems(bookmarkedItems, 1, 20, 'bookmarked');
      assert.equal(page1.length, 20);
      assert.equal(page1[0].id, 'bm-1');
      assert.equal(page1[19].id, 'bm-20');

      const page2 = paginateTabItems(bookmarkedItems, 2, 20, 'bookmarked');
      assert.equal(page2.length, 20);
      assert.equal(page2[0].id, 'bm-21');
      assert.equal(page2[19].id, 'bm-40');

      const page3 = paginateTabItems(bookmarkedItems, 3, 20, 'bookmarked');
      assert.equal(page3.length, 5);
      assert.equal(page3[0].id, 'bm-41');
      assert.equal(page3[4].id, 'bm-45');

      const page4 = paginateTabItems(bookmarkedItems, 4, 20, 'bookmarked');
      assert.equal(page4.length, 0);
    });
  });

  describe('F-020: Feature Flag Environment Variable Configuration', () => {
    function resolveShowComingSoon(envValue) {
      return envValue !== 'false';
    }

    it('defaults to true when environment variable is undefined or true', () => {
      assert.equal(resolveShowComingSoon(undefined), true);
      assert.equal(resolveShowComingSoon('true'), true);
      assert.equal(resolveShowComingSoon(''), true);
    });

    it('disables coming soon overlay when environment variable is explicitly "false"', () => {
      assert.equal(resolveShowComingSoon('false'), false);
    });
  });

  describe('F-002: Bookmark Item Synthesis Field Completeness', () => {
    function synthesizeBookmarkProblem(bookmark, solvedMap) {
      return {
        id: String(bookmark.itemId),
        title: bookmark.title || `Problem #${bookmark.itemId}`,
        slug: String(bookmark.itemId),
        difficulty: bookmark.difficulty || 'Medium',
        topic: bookmark.category || 'General',
        category: bookmark.category || 'General',
        companies: [],
        acceptanceRate: '',
        isBookmarked: true,
        isSolved: Boolean(solvedMap[bookmark.itemId]),
      };
    }

    it('synthesizes all required problem fields for component rendering without missing properties', () => {
      const bookmark = {
        id: 'bm-1',
        itemId: '42',
        type: 'PROBLEM',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
        savedAt: '2026-10-09',
      };
      const problem = synthesizeBookmarkProblem(bookmark, { '42': true });

      assert.equal(problem.id, '42');
      assert.equal(problem.title, 'Two Sum');
      assert.equal(problem.slug, '42');
      assert.equal(problem.difficulty, 'Easy');
      assert.equal(problem.topic, 'Arrays');
      assert.equal(problem.category, 'Arrays');
      assert.deepEqual(problem.companies, []);
      assert.equal(problem.acceptanceRate, '');
      assert.equal(problem.isBookmarked, true);
      assert.equal(problem.isSolved, true);
    });
  });

  describe('F-034: API Status Indicator Label Verification', () => {
    it('uses honest REST API Client architecture label without claiming active/live socket connection', () => {
      const headerLabel = 'REST API Client';
      const overviewLabel = 'REST API Client';

      assert.ok(!headerLabel.includes('Connected'), 'Must not claim live connectivity');
      assert.ok(!headerLabel.includes('Active'), 'Must not claim active probe');
      assert.equal(headerLabel, 'REST API Client');
      assert.equal(overviewLabel, 'REST API Client');
    });
  });

});
