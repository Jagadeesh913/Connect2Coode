import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';
import { userQuestionService } from '../../../services/userQuestionService';
import { tokenStorage } from '../../../core/security/tokenStorage';

export interface BookmarkItem {
  id: string;
  itemId: string;
  type: 'PROBLEM' | 'COMPANY' | 'APTITUDE';
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

const saveBookmarksToStorage = (bookmarks: BookmarkItem[]) => {
  try {
    userScopedStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Failed to save bookmarks to storage', e);
  }
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
};

export const fetchBookmarks = createAsyncThunk<
  { userId: string | number | null; bookmarks: BookmarkItem[] },
  { force?: boolean } | boolean | void
>(
  'bookmarks/fetchList',
  async (_, { getState, rejectWithValue }) => {
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
          };
        }
      } catch {
        return rejectWithValue('Could not refresh bookmarks. Your saved data is still shown.');
      }
    }

    return {
      userId: userId || null,
      bookmarks: local,
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

export const toggleBookmarkItem = createAsyncThunk(
  'bookmarks/toggle',
  async (
    payload: {
      itemId: string;
      type?: 'PROBLEM' | 'COMPANY' | 'APTITUDE';
      title?: string;
      difficulty?: string;
      category?: string;
    },
    { getState, rejectWithValue }
  ) => {
    const { itemId, type = 'PROBLEM', title, difficulty, category } = payload;
    const state = getState() as RootState;
    const current = state.bookmarks.bookmarks;
    const exists = current.some((b) => b.itemId === itemId);
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

    // On successful server sync or for local unauthenticated usage, update state & storage
    let updated: BookmarkItem[];
    if (exists) {
      updated = current.filter((b) => b.itemId !== itemId);
    } else {
      const newItem: BookmarkItem = {
        id: `bm-${Date.now()}`,
        itemId,
        type,
        title: title || itemId,
        difficulty,
        category,
        savedAt: new Date().toISOString(),
      };
      updated = [newItem, ...current];
    }

    saveBookmarksToStorage(updated);
    return updated;
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
      state.activeUserId = getInitialActiveUserId();
      state.bookmarks = [];
      saveBookmarksToStorage([]);
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

        const bookmarks = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.bookmarks || [];
        const targetUserId =
          !Array.isArray(action.payload) && action.payload?.userId !== undefined
            ? action.payload.userId
              ? String(action.payload.userId)
              : null
            : state.activeUserId
            ? String(state.activeUserId)
            : null;
        const currentActiveUserId = state.activeUserId ? String(state.activeUserId) : null;

        if (targetUserId !== currentActiveUserId) {
          // Target user no longer matches the active session user
          return;
        }

        state.loading = false;
        state.currentRequestId = null;
        state.bookmarks = bookmarks;
        state.lastFetchedAt = Date.now();
        saveBookmarksToStorage(bookmarks);
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
      .addCase(toggleBookmarkItem.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
        state.error = null;
      })
      .addCase(toggleBookmarkItem.rejected, (state, action) => {
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
          state.bookmarks = loadBookmarksFromStorage();
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type === 'auth/login/fulfilled' ||
          action.type === 'auth/loginWithGoogleRefreshToken/fulfilled' ||
          action.type === 'auth/refreshSession/fulfilled' ||
          action.type === 'auth/silentRefresh/fulfilled',
        (state, action: any) => {
          state.currentRequestId = null;
          state.activeUserId = action.payload?.id ?? action.payload?.user?.id ?? null;
          state.bookmarks = loadBookmarksFromStorage();
          state.loading = false;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/initializeAuth',
        (state) => {
          state.currentRequestId = null;
          state.activeUserId = getInitialActiveUserId();
          state.bookmarks = loadBookmarksFromStorage();
          state.loading = false;
          state.error = null;
        }
      );
  },
});

export const { clearBookmarkError, clearBookmarks } = bookmarkSlice.actions;
export default bookmarkSlice.reducer;
