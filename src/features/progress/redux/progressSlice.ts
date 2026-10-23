import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';
import { userQuestionService } from '../../../services/userQuestionService';
import type {
  UserAttemptedQuestionItem,
  UserSubmittedQuestionItem,
} from '../../../services/userQuestionService';

const PROGRESS_STORAGE_KEY = 'problem_progress';
const LEGACY_PROGRESS_KEYS = ['solved_problems', 'dsa_sheet_solved'] as const;

export type SolvedByProblemId = Record<string, boolean>;
export type AttemptedByProblemId = Record<string, boolean>;

export interface ProblemProgressState {
  solvedByProblemId: SolvedByProblemId;
  attemptedByProblemId: AttemptedByProblemId;
  solvedItems: UserSubmittedQuestionItem[];
  attemptedItems: UserAttemptedQuestionItem[];
  loading: boolean;
  lastFetchedUserId: string | number | null;
  lastFetchedAt: number | null;
  currentRequestId: string | null;
  loadingUserId: string | number | null;
  error: string | null;
}

const readMap = (key: string): SolvedByProblemId => {
  try {
    const saved = userScopedStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const loadInitialProgress = (): SolvedByProblemId => {
  const canonical = readMap(PROGRESS_STORAGE_KEY);

  // One-time logical migration: preserve legacy solved states that are not
  // already represented by the canonical map. Legacy keys remain untouched.
  LEGACY_PROGRESS_KEYS.forEach((key) => {
    const legacy = readMap(key);
    Object.entries(legacy).forEach(([problemId, isSolved]) => {
      if (canonical[problemId] === undefined && typeof isSolved === 'boolean') {
        canonical[problemId] = isSolved;
      }
    });
  });

  try {
    userScopedStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(canonical));
  } catch {}

  return canonical;
};

const initialState: ProblemProgressState = {
  solvedByProblemId: loadInitialProgress(),
  attemptedByProblemId: {},
  solvedItems: [],
  attemptedItems: [],
  loading: false,
  lastFetchedUserId: null,
  lastFetchedAt: null,
  currentRequestId: null,
  loadingUserId: null,
  error: null,
};

export interface ProblemProgressRef {
  id: string | number;
  fallbackSolved?: boolean;
}

export const getProblemSolvedStatus = (
  solvedByProblemId: SolvedByProblemId,
  ref: ProblemProgressRef
): boolean => solvedByProblemId[String(ref.id)] ?? !!ref.fallbackSolved;

export const getProblemAttemptedStatus = (
  attemptedByProblemId: AttemptedByProblemId | undefined,
  ref: ProblemProgressRef
): boolean => Boolean(attemptedByProblemId?.[String(ref.id)]);

export const hydrateProgress = createAsyncThunk<
  {
    solved: SolvedByProblemId;
    attempted: AttemptedByProblemId;
    solvedItems: UserSubmittedQuestionItem[];
    attemptedItems: UserAttemptedQuestionItem[];
    userId: string | number | null;
    fetchedAt: number;
    warning: string | null;
  },
  { force?: boolean; userId?: string | number | null } | boolean | void,
  { state: RootState; rejectValue: string }
>(
  'progress/hydrate',
  async (arg, { getState, rejectWithValue, signal }) => {
    const canonical = loadInitialProgress();
    const state = getState() as RootState;
    const requestedUserId = typeof arg === 'object' && arg ? arg.userId : undefined;
    const userId = requestedUserId !== undefined ? requestedUserId : state.auth?.user?.id ?? null;
    const isAuthenticated = state.auth?.isAuthenticated;
    const attemptedMap: AttemptedByProblemId = {};
    let solvedItems: UserSubmittedQuestionItem[] = [];
    let attemptedItems: UserAttemptedQuestionItem[] = [];
    let warning: string | null = null;

    if (isAuthenticated && userId) {
      const [solvedRes, attemptedRes] = await Promise.allSettled([
        userQuestionService.getSolvedQuestions(userId, signal),
        userQuestionService.getAttemptedQuestions(userId, signal),
      ]);

      if (solvedRes.status === 'rejected' && attemptedRes.status === 'rejected') {
        return rejectWithValue('Unable to refresh problem progress.');
      }

      if (solvedRes.status === 'fulfilled' && Array.isArray(solvedRes.value)) {
        solvedItems = solvedRes.value;
        if (solvedRes.value.length > 0) {
          solvedRes.value.forEach((item: any) => {
            const qId = String(item?.questionId ?? item?.id ?? item);
            if (qId && qId !== '[object Object]') {
              canonical[qId] = true;
            }
          });
        }
      } else {
        warning = 'Solved-problem progress could not be refreshed.';
      }

      if (attemptedRes.status === 'fulfilled' && Array.isArray(attemptedRes.value)) {
        attemptedItems = attemptedRes.value;
        if (attemptedRes.value.length > 0) {
          attemptedRes.value.forEach((item: any) => {
            const qId = String(item?.questionId ?? item?.id ?? item);
            if (qId && qId !== '[object Object]') {
              attemptedMap[qId] = true;
            }
          });
        }
      } else {
        warning = warning
          ? 'Some problem progress could not be refreshed.'
          : 'Attempted-problem progress could not be refreshed.';
      }
    }

    return {
      solved: canonical,
      attempted: attemptedMap,
      solvedItems,
      attemptedItems,
      userId,
      fetchedAt: Date.now(),
      warning,
    };
  },
  {
    condition: (arg, { getState }) => {
      const state = getState() as RootState;
      const requestedUserId = typeof arg === 'object' && arg && arg.userId !== undefined
        ? arg.userId
        : state.auth?.user?.id ?? null;
      const sameLoadingUser =
        String(state.progress?.loadingUserId ?? '') === String(requestedUserId ?? '');
      if (state.progress?.loading && sameLoadingUser) {
        return false;
      }
      const force = typeof arg === 'boolean' ? arg : Boolean(arg?.force);
      if (force) {
        return true;
      }
      const isSameUser = String(state.progress?.lastFetchedUserId ?? '') === String(requestedUserId ?? '');
      const isFresh =
        state.progress?.lastFetchedAt &&
        Date.now() - state.progress.lastFetchedAt < 60_000;
      if (isSameUser && isFresh) {
        return false;
      }
      return true;
    },
  }
);

export const toggleSolvedProblem = createAsyncThunk(
  'progress/toggleSolved',
  async (ref: ProblemProgressRef, { getState }) => {
    const state = getState() as RootState;
    const current = getProblemSolvedStatus(state.progress.solvedByProblemId, ref);
    const isSolved = !current;

    return {
      problemId: String(ref.id),
      isSolved,
    };
  }
);

export const markSolvedProblem = createAsyncThunk(
  'progress/markSolved',
  async (ref: ProblemProgressRef) => ({
    problemId: String(ref.id),
    isSolved: true,
  })
);

const problemProgressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(hydrateProgress.pending, (state, action) => {
        state.loading = true;
        state.currentRequestId = action.meta.requestId;
        state.loadingUserId =
          typeof action.meta.arg === 'object' && action.meta.arg
            ? action.meta.arg.userId ?? null
            : state.lastFetchedUserId;
        state.error = null;
      })
      .addCase(hydrateProgress.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.currentRequestId = null;
        state.loadingUserId = null;
        state.lastFetchedAt = action.payload.fetchedAt;
        state.solvedByProblemId = action.payload.solved;
        state.attemptedByProblemId = action.payload.attempted;
        state.solvedItems = action.payload.solvedItems;
        state.attemptedItems = action.payload.attemptedItems;
        state.lastFetchedUserId = action.payload.userId;
        state.error = action.payload.warning;
      })
      .addCase(hydrateProgress.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.currentRequestId = null;
        state.loadingUserId = null;
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload || action.error.message || 'Unable to refresh problem progress.';
        }
      })
      .addCase(toggleSolvedProblem.fulfilled, (state, action) => {
        state.solvedByProblemId[action.payload.problemId] = action.payload.isSolved;
      })
      .addCase(markSolvedProblem.fulfilled, (state, action) => {
        state.solvedByProblemId[action.payload.problemId] = true;
      });
  },
});

export default problemProgressSlice.reducer;
