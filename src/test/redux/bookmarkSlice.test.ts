import { describe, it, expect } from 'vitest';
import bookmarkReducer, {
  clearBookmarkError,
  clearBookmarks,
  isBookmarkItem,
  mapServerBookmark,
  fetchBookmarks,
  toggleBookmarkItem,
  type BookmarkState,
  type BookmarkItem,
} from '../../features/bookmarks/redux/bookmarkSlice';

describe('bookmarkSlice Reducer & Helpers', () => {
  const initialTestState: BookmarkState = {
    bookmarks: [
      {
        id: 'bm-q-10',
        itemId: '10',
        type: 'PROBLEM',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
      },
    ],
    loading: false,
    error: 'Failed to sync',
    currentRequestId: 'req-1',
    activeUserId: 'user-42',
    lastFetchedAt: Date.now(),
    pendingToggleKeys: { 'PROBLEM:10': true },
  };

  it('initializes with empty bookmarks array without local storage dependence', () => {
    const defaultState = bookmarkReducer(undefined, { type: '@@INIT' });
    expect(defaultState.bookmarks).toEqual([]);
    expect(defaultState.loading).toBe(false);
    expect(defaultState.error).toBeNull();
  });

  it('maps server bookmark DTO cleanly without fabricated timestamps', () => {
    const mapped = mapServerBookmark({
      questionId: 42,
      title: 'Valid Palindrome',
      difficulty: 'Easy',
    });
    expect(mapped).toEqual({
      id: 'bm-q-42',
      itemId: '42',
      type: 'PROBLEM',
      title: 'Valid Palindrome',
      difficulty: 'Easy',
    });
    expect('savedAt' in mapped).toBe(false);
  });

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
      id: 'bm-q-10',
      itemId: '10',
      type: 'PROBLEM',
      title: 'Two Sum',
    };

    expect(isBookmarkItem(item, '10', 'PROBLEM')).toBe(true);
    expect(isBookmarkItem(item, 10, 'PROBLEM')).toBe(true);
    expect(isBookmarkItem(item, '10')).toBe(true);
    expect(isBookmarkItem(item, '10', 'COMPANY')).toBe(false);
    expect(isBookmarkItem(item, '99', 'PROBLEM')).toBe(false);
  });

  it('commits server bookmarks on fetchBookmarks.fulfilled when request matches', () => {
    const pendingState = bookmarkReducer(
      { ...initialTestState, activeUserId: 'user-1' },
      { type: fetchBookmarks.pending.type, meta: { requestId: 'req-fetch-1' } }
    );
    expect(pendingState.loading).toBe(true);
    expect(pendingState.currentRequestId).toBe('req-fetch-1');

    const serverItems: BookmarkItem[] = [
      { id: 'bm-q-1', itemId: '1', type: 'PROBLEM', title: 'Two Sum', difficulty: 'Easy' },
      { id: 'bm-q-2', itemId: '2', type: 'PROBLEM', title: 'Add Two Numbers', difficulty: 'Medium' },
    ];

    const fulfilledState = bookmarkReducer(pendingState, {
      type: fetchBookmarks.fulfilled.type,
      payload: { userId: 'user-1', bookmarks: serverItems, fetchedAt: 12345 },
      meta: { requestId: 'req-fetch-1' },
    });

    expect(fulfilledState.loading).toBe(false);
    expect(fulfilledState.bookmarks).toEqual(serverItems);
    expect(fulfilledState.lastFetchedAt).toBe(12345);
  });

  it('handles toggleBookmarkItem.fulfilled to add and remove items', () => {
    const existingItem: BookmarkItem = {
      id: 'bm-q-10',
      itemId: '10',
      type: 'PROBLEM',
      title: 'Two Sum',
      difficulty: 'Easy',
    };

    // Remove existing
    const removedState = bookmarkReducer(initialTestState, {
      type: toggleBookmarkItem.fulfilled.type,
      payload: { item: existingItem, removed: true },
    });
    expect(removedState.bookmarks).toEqual([]);

    // Add new
    const newItem: BookmarkItem = {
      id: 'bm-q-20',
      itemId: '20',
      type: 'PROBLEM',
      title: '3Sum',
      difficulty: 'Medium',
    };
    const addedState = bookmarkReducer(removedState, {
      type: toggleBookmarkItem.fulfilled.type,
      payload: { item: newItem, removed: false },
    });
    expect(addedState.bookmarks).toEqual([newItem]);
  });
});
