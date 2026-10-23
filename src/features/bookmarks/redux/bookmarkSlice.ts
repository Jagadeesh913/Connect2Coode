import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';
import { userQuestionService } from '../../../services/userQuestionService';
import { tokenStorage } from '../../../core/security/tokenStorage';

export type BookmarkType = 'PROBLEM' | 'COMPANY' | 'APTITUDE';

export interface BookmarkItem {
  id: string;
  itemId: string;
  type: BookmarkType;
  title: string;
  difficulty?: string;
  category?: string;
  savedAt: string;
}

export interface BookmarkState {
  bookmarks: BookmarkItem[];
  loading: boolean;
  error: string | null;
  currentRequestId: string | null;
  activeUserId: string | number | null;
  lastFetchedAt: number | null;
  pendingToggleKeys: Record<string, boolean>;
}

const LOCAL_STORAGE_KEY = 'myjo_bookmarks';

const loadBookmarksFromStorage = (): BookmarkItem[] => {
  try {
    const saved = userScopedStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load bookmarks from storage', e);
  }
  return [];
};

const getInitialActiveUserId = (): string | number | null => {
  try {
    const user = tokenStorage.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
};

const initialState: BookmarkState = {
  bookmarks: loadBookmarksFromStorage(),
  loading: false,
  error: null,
  currentRequestId: null,
  activeUserId: getInitialActiveUserId(),
  lastFetchedAt: null,
  pendingToggleKeys: {},
};

const getBookmarkKey = (itemId: string | number, type: BookmarkType): string =>
  `${type}:${String(itemId)}`;

export const isBookmarkItem = (
  item: BookmarkItem,
  itemId: string | number,
  type: BookmarkType
): boolean => item.type === type && String(item.itemId) === String(itemId);

export const fetchBookmarks = createAsyncThunk<
  { userId: string | number | null; bookmarks: BookmarkItem[]; fetchedAt: number; warning?: string },
  { force?: boolean } | boolean | void,
  { state: RootState }
>(
  'bookmarks/fetchList',
  async (_, { getState }) => {
    const local = loadBookmarksFromStorage();
    const state = getState() as RootState;
    const userId = state.auth?.user?.id;
    const isAuthenticated = state.auth?.isAuthenticated;

    if (isAuthenticated && userId) {
      try {
        const serverBookmarks = await userQuestionService.getBookmarkedQuestions(userId);
        if (Array.isArray(serverBookmarks)) {
          const mappedServer: BookmarkItem[] = serverBookmarks.map((item: any) => ({
            id: `bm-q-${item.questionId || item.id}`,
            itemId: String(item.questionId || item.id),
            type: 'PROBLEM' as const,
            title: item.title || item.questionTitle || `Problem #${item.questionId || item.id}`,
            difficulty: item.difficulty || item.difficultyLevel,
            category: item.category || item.topic,
            savedAt: item.savedAt || new Date().toISOString(),
          }));

          // Preserve non-problem bookmarks (e.g. COMPANY, APTITUDE) from client storage
          const nonProblemBookmarks = local.filter((b) => b.type !== 'PROBLEM');
          const merged = [...mappedServer, ...nonProblemBookmarks];
          return {
            userId,
            bookmarks: merged,
            fetchedAt: Date.now(),
          };
        }
      } catch {
        return {
          userId,
          bookmarks: local,
          fetchedAt: Date.now(),
          warning: 'Could not refresh bookmarks. Your saved data is still shown.',
        };
      }
    }

    return {
      userId: userId || null,
      bookmarks: local,
      fetchedAt: Date.now(),
    };
  },
  {
    condition: (arg, { getState }) => {
      const state = getState() as RootState;
      if (state.bookmarks?.loading) {
        return false;
      }
      const force = typeof arg === 'boolean' ? arg : Boolean(arg?.force);
      if (force) {
        return true;
      }
      const userId = state.auth?.user?.id;
      const isSameUser = String(state.bookmarks?.activeUserId ?? '') === String(userId ?? '');
      const isFresh =
        state.bookmarks?.lastFetchedAt &&
        Date.now() - state.bookmarks.lastFetchedAt < 60_000;
      if (isSameUser && isFresh && state.bookmarks?.bookmarks !== undefined) {
        return false;
      }
      return true;
    },
  }
);

export const toggleBookmarkItem = createAsyncThunk<
  { item: BookmarkItem; removed: boolean },
  {
    itemId: string;
    type?: BookmarkType;
    title?: string;
    difficulty?: string;
    category?: string;
  },
  { state: RootState; rejectValue: string }
>(
  'bookmarks/toggle',
  async (
    payload,
    { getState, rejectWithValue }
  ) => {
    const { itemId, type = 'PROBLEM', title, difficulty, category } = payload;
    const state = getState() as RootState;
    const current = state.bookmarks.bookmarks;
    const existing = current.find((b) => isBookmarkItem(b, itemId, type));
    const exists = Boolean(existing);
    const userId = state.auth?.user?.id;
    const isAuthenticated = state.auth?.isAuthenticated;

    // Cloud synchronization for PROBLEM bookmarks when authenticated
    if (type === 'PROBLEM' && isAuthenticated && userId) {
      try {
        if (exists) {
          await userQuestionService.unbookmarkQuestion(userId, itemId);
        } else {
          await userQuestionService.bookmarkQuestion(userId, itemId);
        }
      } catch (apiErr: any) {
        const msg =
          apiErr?.message ||
          (apiErr?.errors && apiErr.errors[0]) ||
          'Failed to update bookmark on server';
        return rejectWithValue(msg);
      }
    }

    return {
      removed: exists,
      item:
        existing || {
          id: `bm-${type.toLowerCase()}-${itemId}`,
          itemId,
          type,
          title: title || itemId,
          difficulty,
          category,
          savedAt: new Date().toISOString(),
        },
    };
  },
  {
    condition: (payload, { getState }) => {
      const type = payload.type || 'PROBLEM';
      return !getState().bookmarks.pendingToggleKeys[getBookmarkKey(payload.itemId, type)];
    },
  }
);

const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    clearBookmarkError(state) {
      state.error = null;
    },
    clearBookmarks(state) {
      state.currentRequestId = null;
      state.bookmarks = [];
      state.pendingToggleKeys = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        const isCurrent = state.currentRequestId === action.meta.requestId;
        if (!isCurrent) {
          // Ignore late or superseded response
          return;
        }

        const bookmarks = action.payload.bookmarks;
        const targetUserId = action.payload.userId
          ? String(action.payload.userId)
          : null;
        const currentActiveUserId = state.activeUserId ? String(state.activeUserId) : null;

        if (targetUserId !== currentActiveUserId) {
          // Target user no longer matches the active session user
          return;
        }

        state.loading = false;
        state.currentRequestId = null;
        state.bookmarks = bookmarks;
        state.lastFetchedAt = action.payload.fetchedAt;
        state.error = action.payload.warning || null;
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        const isCurrent = state.currentRequestId === action.meta.requestId;
        if (!isCurrent) {
          // Ignore late rejection
          return;
        }

        state.loading = false;
        state.currentRequestId = null;
        if (action.meta.aborted) return;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch bookmarks';
      })
      .addCase(toggleBookmarkItem.pending, (state, action) => {
        const type = action.meta.arg.type || 'PROBLEM';
        state.pendingToggleKeys[getBookmarkKey(action.meta.arg.itemId, type)] = true;
        state.error = null;
      })
      .addCase(toggleBookmarkItem.fulfilled, (state, action) => {
        const { item, removed } = action.payload;
        const key = getBookmarkKey(item.itemId, item.type);
        delete state.pendingToggleKeys[key];
        if (removed) {
          state.bookmarks = state.bookmarks.filter(
            (bookmark) => !isBookmarkItem(bookmark, item.itemId, item.type)
          );
        } else if (!state.bookmarks.some((bookmark) => isBookmarkItem(bookmark, item.itemId, item.type))) {
          state.bookmarks.unshift(item);
        }
        state.error = null;
      })
      .addCase(toggleBookmarkItem.rejected, (state, action) => {
        const type = action.meta.arg.type || 'PROBLEM';
        delete state.pendingToggleKeys[getBookmarkKey(action.meta.arg.itemId, type)];
        if (action.meta.condition) return;
        state.error = (action.payload as string) || 'Failed to toggle bookmark';
      })
      // Reset and re-scope bookmarks on auth lifecycle events (logout, login) (F-010)
      .addMatcher(
        (action) =>
          action.type === 'auth/logout/fulfilled' ||
          action.type === 'auth/logout/rejected',
        (state) => {
          state.currentRequestId = null;
          state.activeUserId = null;
          state.bookmarks = [];
          state.pendingToggleKeys = {};
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type === 'auth/login/fulfilled' ||
          action.type === 'auth/loginWithGoogleRefreshToken/fulfilled' ||
          action.type === 'auth/refreshSession/fulfilled' ||
          action.type === 'auth/silentRefresh/fulfilled' ||
          action.type === 'auth/setAuthenticatedSession',
        (state, action: any) => {
          state.currentRequestId = null;
          state.activeUserId =
            action.payload?.user?.id ?? action.payload?.id ?? state.activeUserId;
          state.bookmarks = [];
          state.pendingToggleKeys = {};
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/initializeAuth',
        (state, action: any) => {
          state.currentRequestId = null;
          const nextUserId = action.payload?.savedUser?.id ?? null;
          const isSameScope = String(state.activeUserId ?? '') === String(nextUserId ?? '');
          state.activeUserId = nextUserId;
          if (!isSameScope) state.bookmarks = [];
          state.pendingToggleKeys = {};
          state.loading = false;
          state.error = null;
        }
      );
  },
});

export const { clearBookmarkError, clearBookmarks } = bookmarkSlice.actions;
export default bookmarkSlice.reducer;
