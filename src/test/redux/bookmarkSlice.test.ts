import { describe, it, expect } from 'vitest';
import bookmarkReducer, {
  clearBookmarkError,
  clearBookmarks,
  isBookmarkItem,
  type BookmarkState,
  type BookmarkItem,
} from '../../features/bookmarks/redux/bookmarkSlice';

describe('bookmarkSlice Reducer & Helpers', () => {
  const initialTestState: BookmarkState = {
    bookmarks: [
      {
        id: 'bm-problem-10',
        itemId: '10',
        type: 'PROBLEM',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
        savedAt: '2026-01-01T00:00:00Z',
      },
    ],
    loading: false,
    error: 'Failed to sync',
    currentRequestId: 'req-1',
    activeUserId: 'user-42',
    lastFetchedAt: Date.now(),
    pendingToggleKeys: { 'PROBLEM:10': true },
  };

  it('clears bookmark error message', () => {
    const nextState = bookmarkReducer(initialTestState, clearBookmarkError());
    expect(nextState.error).toBeNull();
  });

  it('clears all bookmarks, pending toggles, and state on account change', () => {
    const nextState = bookmarkReducer(initialTestState, clearBookmarks());
    expect(nextState.bookmarks).toEqual([]);
    expect(nextState.pendingToggleKeys).toEqual({});
    expect(nextState.currentRequestId).toBeNull();
    expect(nextState.loading).toBe(false);
    expect(nextState.error).toBeNull();
  });

  it('isBookmarkItem matches items by ID and type accurately', () => {
    const item: BookmarkItem = {
      id: 'bm-problem-10',
      itemId: '10',
      type: 'PROBLEM',
      title: 'Two Sum',
    };

    expect(isBookmarkItem(item, '10', 'PROBLEM')).toBe(true);
    expect(isBookmarkItem(item, 10, 'PROBLEM')).toBe(true);
    expect(isBookmarkItem(item, '10', 'COMPANY')).toBe(false);
    expect(isBookmarkItem(item, '99', 'PROBLEM')).toBe(false);
  });
});
