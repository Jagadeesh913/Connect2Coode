import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { problemService } from '../../../services/problemService';
import { isRequestCanceled } from '../../../core/api/apiClient';
import type { Problem, ProblemFilter } from '../../../core/types/domain';

const PROBLEM_LIST_CACHE_TTL_MS = 60_000;
const PROBLEM_DETAIL_CACHE_TTL_MS = 5 * 60_000;
const MAX_LIST_CACHE_ENTRIES = 30;
const MAX_DETAIL_CACHE_ENTRIES = 40;

export interface ProblemPagination {
  page: number;
  total: number;
  limit: number;
  totalPages: number;
}

interface ProblemListCacheEntry {
  problems: Problem[];
  pagination: ProblemPagination;
  fetchedAt: number;
}

interface ProblemDetailCacheEntry {
  problem: Problem | null;
  fetchedAt: number;
}

export interface ProblemState {
  problems: Problem[];
  selectedProblem: Problem | null;
  loading: boolean;
  listLoading: boolean;
  detailLoading: boolean;
  listError: string | null;
  detailError: string | null;
  listRequestId: string | null;
  detailRequestId: string | null;
  error: string | null;
  filters: ProblemFilter;
  pagination: ProblemPagination;
  activeListKey: string | null;
  activeDetailKey: string | null;
  currentRequestId: string | null;
  listCache: Record<string, ProblemListCacheEntry>;
  detailCache: Record<string, ProblemDetailCacheEntry>;
}

const initialState: ProblemState = {
  problems: [],
  selectedProblem: null,
  loading: false,
  listLoading: false,
  detailLoading: false,
  listError: null,
  detailError: null,
  listRequestId: null,
  detailRequestId: null,
  error: null,
  filters: {
    search: '',
    difficulty: 'All',
    topic: 'All',
    company: 'All',
  },
  pagination: {
    page: 1,
    total: 0,
    limit: 20,
    totalPages: 1,
  },
  activeListKey: null,
  activeDetailKey: null,
  currentRequestId: null,
  listCache: {},
  detailCache: {},
};

const normalizeFilterValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return [...value].map((item) => String(item)).sort();
  }
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
};

const getProblemListKey = (params?: ProblemFilter): string =>
  JSON.stringify({
    category: normalizeFilterValue(params?.category),
    search: normalizeFilterValue(params?.searchText ?? params?.search),
    difficulty: normalizeFilterValue(params?.difficulty ?? params?.level),
    topic: normalizeFilterValue(params?.topic),
    companies: normalizeFilterValue(params?.companies ?? params?.company),
    platform: normalizeFilterValue(params?.platform ?? params?.platforms ?? params?.qpf),
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  });

const getProblemDetailKey = (id: string | number): string => String(id).trim().toLowerCase();

const isFresh = (fetchedAt: number, ttlMs: number): boolean =>
  fetchedAt > 0 && Date.now() - fetchedAt < ttlMs;

export const sanitizeProblemFilters = (params?: ProblemFilter): ProblemFilter | undefined => {
  if (!params) return undefined;
  const sanitized: ProblemFilter = {};
  if (params.page !== undefined) sanitized.page = params.page;
  if (params.limit !== undefined) sanitized.limit = params.limit;

  const search = params.searchText?.trim();
  if (search) {
    sanitized.searchText = search;
  }

  if (params.category?.trim()) sanitized.category = params.category.trim();

  const cleanArray = (val: unknown): (number | string)[] | undefined => {
    if (!val) return undefined;
    const items = Array.isArray(val) ? val : [val];
    const cleaned = items
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item) => {
        if (item === undefined || item === null || item === '') return false;
        if (typeof item === 'number') return Number.isFinite(item) && item > 0;
        return true;
      });
    return cleaned.length > 0 ? (cleaned as (number | string)[]) : undefined;
  };

  const difficulty = cleanArray(params.difficulty);
  if (difficulty) {
    sanitized.difficulty = difficulty as any;
  }

  const topic = cleanArray(params.topic);
  if (topic) sanitized.topic = topic as any;

  const companies = cleanArray(params.companies);
  if (companies) {
    sanitized.companies = companies as any;
  }

  const platform = cleanArray(params.platform);
  if (platform) {
    sanitized.platform = platform as any;
  }

  return sanitized;
};

const trimCache = <T extends { fetchedAt: number }>(
  cache: Record<string, T>,
  maxEntries: number
): Record<string, T> => {
  const entries = Object.entries(cache).sort(([, left], [, right]) => right.fetchedAt - left.fetchedAt);
  return Object.fromEntries(entries.slice(0, maxEntries));
};

let activeListSignal: AbortSignal | null = null;
let activeDetailSignal: AbortSignal | null = null;

export const fetchProblems = createAsyncThunk(
  'problems/fetchList',
  async (params: ProblemFilter | undefined, { rejectWithValue, getState, signal }) => {
    activeListSignal = signal;
    const sanitizedParams = sanitizeProblemFilters(params);
    const key = getProblemListKey(sanitizedParams);
    const state = getState() as { problems: ProblemState };
    const cached = state.problems.listCache[key];

    if (cached && isFresh(cached.fetchedAt, PROBLEM_LIST_CACHE_TTL_MS)) {
      return {
        key,
        problems: cached.problems,
        pagination: cached.pagination,
        fetchedAt: cached.fetchedAt,
      };
    }

    try {
      const res = await problemService.getProblems(sanitizedParams, signal);
      const problems = Array.isArray(res.data) ? res.data : [];
      const total = res.meta?.total ?? problems.length;
      const limit = res.meta?.limit ?? params?.limit ?? 20;

      return {
        key,
        problems,
        pagination: {
          page: res.meta?.page ?? params?.page ?? 1,
          total,
          limit,
          totalPages: res.meta?.totalPages ?? (Math.ceil(total / limit) || 1),
        },
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch problems');
    }
  },
  {
    condition: (params, { getState }) => {
      const state = getState() as { problems: ProblemState };
      const key = getProblemListKey(sanitizeProblemFilters(params));
      const cached = state.problems.listCache[key];

      if (state.problems.listLoading && state.problems.activeListKey === key) {
        if (activeListSignal && activeListSignal.aborted) {
          return true;
        }
        return false;
      }

      return !(cached && isFresh(cached.fetchedAt, PROBLEM_LIST_CACHE_TTL_MS) && state.problems.activeListKey === key);
    },
  }
);

export const fetchProblemById = createAsyncThunk(
  'problems/fetchById',
  async (id: string, { rejectWithValue, getState, signal }) => {
    activeDetailSignal = signal;
    const key = getProblemDetailKey(id);
    const state = getState() as { problems: ProblemState };
    const cached = state.problems.detailCache[key];

    if (cached && isFresh(cached.fetchedAt, PROBLEM_DETAIL_CACHE_TTL_MS)) {
      return {
        key,
        problem: cached.problem,
        fetchedAt: cached.fetchedAt,
      };
    }

    try {
      const res = await problemService.getProblemById(id, signal);
      return {
        key,
        problem: res.data,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch problem detail');
    }
  },
  {
    condition: (id, { getState }) => {
      const state = getState() as { problems: ProblemState };
      const key = getProblemDetailKey(id);
      const cached = state.problems.detailCache[key];

      if (state.problems.detailLoading && state.problems.activeDetailKey === key) {
        if (activeDetailSignal && activeDetailSignal.aborted) {
          return true;
        }
        return false;
      }

      if (
        state.problems.selectedProblem &&
        (getProblemDetailKey(state.problems.selectedProblem.id) === key ||
          (state.problems.selectedProblem.slug &&
            getProblemDetailKey(state.problems.selectedProblem.slug) === key)) &&
        cached &&
        isFresh(cached.fetchedAt, PROBLEM_DETAIL_CACHE_TTL_MS)
      ) {
        return false;
      }

      return true;
    },
  }
);

export const fetchProblemBySlug = fetchProblemById;


const problemSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {
    setFilter(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    setPaginationPage(state, action) {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state, action) => {
        state.listLoading = true;
        state.loading = true;
        state.listRequestId = action.meta.requestId;
        state.currentRequestId = action.meta.requestId;
        state.error = null;
        state.listError = null;
        state.activeListKey = getProblemListKey(sanitizeProblemFilters(action.meta.arg));
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        const { key, problems, pagination, fetchedAt } = action.payload;
        state.listCache = trimCache(
          {
            ...state.listCache,
            [key]: { problems, pagination, fetchedAt },
          },
          MAX_LIST_CACHE_ENTRIES
        );

        // A superseded response may warm the cache, but must never replace the
        // visible query or release the newer request's loading ownership.
        if (state.listRequestId !== action.meta.requestId) return;

        const isCurrent = state.listRequestId === action.meta.requestId;
        if (isCurrent) {
          state.listLoading = false;
          state.listRequestId = null;
          state.loading = state.listLoading || state.detailLoading;
          if (state.currentRequestId === action.meta.requestId) state.currentRequestId = null;
        }

        if (!isCurrent || state.activeListKey !== key) {
          return;
        }

        state.problems = problems;
        state.pagination = pagination;
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        const isCurrent = state.listRequestId === action.meta.requestId;
        const key = getProblemListKey(sanitizeProblemFilters(action.meta.arg));

        if (action.meta.aborted) {
          if (isCurrent) {
            state.listLoading = false;
          state.listRequestId = null;
          state.loading = state.listLoading || state.detailLoading;
            if (state.currentRequestId === action.meta.requestId) state.currentRequestId = null;
            if (state.activeListKey === key) {
              state.activeListKey = null;
            }
          }
          return;
        }

        if (isCurrent) {
          state.listLoading = false;
          state.listRequestId = null;
          state.loading = state.listLoading || state.detailLoading;
          if (state.currentRequestId === action.meta.requestId) state.currentRequestId = null;
        }

        if (!isCurrent || state.activeListKey !== key) {
          return;
        }

        state.listError = state.error = (action.payload as string) || action.error.message || 'Failed to fetch problems';

      })
      .addCase(fetchProblemById.pending, (state, action) => {
        state.detailLoading = true;
        state.loading = true;
        state.detailRequestId = action.meta.requestId;
        state.currentRequestId = action.meta.requestId;
        state.error = null;
        state.detailError = null;
        state.activeDetailKey = getProblemDetailKey(action.meta.arg);
        if (state.selectedProblem && getProblemDetailKey(state.selectedProblem.id) !== state.activeDetailKey && getProblemDetailKey(state.selectedProblem.slug || "") !== state.activeDetailKey) state.selectedProblem = null;
      })
      .addCase(fetchProblemById.fulfilled, (state, action) => {
        const { key, problem, fetchedAt } = action.payload;
        state.detailCache = trimCache(
          {
            ...state.detailCache,
            [key]: { problem, fetchedAt },
          },
          MAX_DETAIL_CACHE_ENTRIES
        );

        if (state.detailRequestId !== action.meta.requestId) return;

        const isCurrent = state.detailRequestId === action.meta.requestId;
        if (isCurrent) {
          state.detailLoading = false;
          state.detailRequestId = null;
          state.loading = state.listLoading || state.detailLoading;
          if (state.currentRequestId === action.meta.requestId) state.currentRequestId = null;
        }

        if (!isCurrent || state.activeDetailKey !== key) {
          return;
        }

        state.selectedProblem = problem || null;
      })
      .addCase(fetchProblemById.rejected, (state, action) => {
        const isCurrent = state.detailRequestId === action.meta.requestId;
        const key = getProblemDetailKey(action.meta.arg);

        if (action.meta.aborted) {
          if (isCurrent) {
            state.detailLoading = false;
          state.detailRequestId = null;
          state.loading = state.listLoading || state.detailLoading;
            if (state.currentRequestId === action.meta.requestId) state.currentRequestId = null;
            if (state.activeDetailKey === key) {
              state.activeDetailKey = null;
            }
          }
          return;
        }

        if (isCurrent) {
          state.detailLoading = false;
          state.detailRequestId = null;
          state.loading = state.listLoading || state.detailLoading;
          if (state.currentRequestId === action.meta.requestId) state.currentRequestId = null;
        }

        if (!isCurrent || state.activeDetailKey !== key) {
          return;
        }

        state.detailError = state.error = (action.payload as string) || action.error.message || 'Failed to fetch problem detail';
      });
  },
});

export const { setFilter, resetFilters, setPaginationPage } = problemSlice.actions;
export default problemSlice.reducer;
