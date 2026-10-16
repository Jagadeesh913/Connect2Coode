import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';
import { userQuestionService } from '../../../services/userQuestionService';

const PROGRESS_STORAGE_KEY = 'problem_progress';
const LEGACY_PROGRESS_KEYS = ['solved_problems', 'dsa_sheet_solved'] as const;

export type SolvedByProblemId = Record<string, boolean>;
export type AttemptedByProblemId = Record<string, boolean>;

export interface ProblemProgressState {
  solvedByProblemId: SolvedByProblemId;
  attemptedByProblemId: AttemptedByProblemId;
  loading: boolean;
  lastFetchedUserId: string | number | null;
  lastFetchedAt: number | null;
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

const persistProgress = (solvedByProblemId: SolvedByProblemId): void => {
  try {
    userScopedStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(solvedByProblemId));
  } catch {}
};

const initialState: ProblemProgressState = {
  solvedByProblemId: loadInitialProgress(),
  attemptedByProblemId: {},
  loading: false,
  lastFetchedUserId: null,
  lastFetchedAt: null,
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
  { solved: SolvedByProblemId; attempted: AttemptedByProblemId; userId?: string | number | null },
  { force?: boolean } | boolean | void
>(
  'progress/hydrate',
  async (_, { getState }) => {
    const canonical = loadInitialProgress();
    const state = getState() as RootState;
    const userId = state.auth?.user?.id;
    const isAuthenticated = state.auth?.isAuthenticated;
    const attemptedMap: AttemptedByProblemId = {};

    if (isAuthenticated && userId) {
      try {
        const [solvedRes, attemptedRes] = await Promise.allSettled([
          userQuestionService.getSolvedQuestions(userId),
          userQuestionService.getAttemptedQuestions(userId),
        ]);

        if (solvedRes.status === 'fulfilled' && Array.isArray(solvedRes.value) && solvedRes.value.length > 0) {
          solvedRes.value.forEach((item: any) => {
            const qId = String(item?.questionId ?? item?.id ?? item);
            if (qId && qId !== '[object Object]') {
              canonical[qId] = true;
            }
          });
          persistProgress(canonical);
        }

        if (attemptedRes.status === 'fulfilled' && Array.isArray(attemptedRes.value) && attemptedRes.value.length > 0) {
          attemptedRes.value.forEach((item: any) => {
            const qId = String(item?.questionId ?? item?.id ?? item);
            if (qId && qId !== '[object Object]') {
              attemptedMap[qId] = true;
            }
          });
        }
      } catch {
        // preserve local progress safely
      }
    }

    return {
      solved: canonical,
      attempted: attemptedMap,
      userId: userId || null,
    };
  },
  {
    condition: (arg, { getState }) => {
      const state = getState() as RootState;
      if (state.progress?.loading) {
        return false;
      }
      const force = typeof arg === 'boolean' ? arg : Boolean(arg?.force);
      if (force) {
        return true;
      }
      const userId = state.auth?.user?.id ?? null;
      const isSameUser = String(state.progress?.lastFetchedUserId ?? '') === String(userId ?? '');
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
      .addCase(hydrateProgress.pending, (state) => {
        state.loading = true;
      })
      .addCase(hydrateProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.lastFetchedAt = Date.now();
        if (action.payload && typeof action.payload === 'object' && 'solved' in action.payload) {
          state.solvedByProblemId = action.payload.solved;
          state.attemptedByProblemId = action.payload.attempted;
          state.lastFetchedUserId = action.payload.userId ?? null;
        } else {
          state.solvedByProblemId = action.payload as any;
        }
      })
      .addCase(hydrateProgress.rejected, (state) => {
        state.loading = false;
      })
      .addCase(toggleSolvedProblem.fulfilled, (state, action) => {
        state.solvedByProblemId[action.payload.problemId] = action.payload.isSolved;
        persistProgress(state.solvedByProblemId);
      })
      .addCase(markSolvedProblem.fulfilled, (state, action) => {
        state.solvedByProblemId[action.payload.problemId] = true;
        persistProgress(state.solvedByProblemId);
      });
  },
});

export default problemProgressSlice.reducer;
