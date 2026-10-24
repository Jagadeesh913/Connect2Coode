import type { Middleware } from '@reduxjs/toolkit';
import { userScopedStorage } from '../core/storage/userScopedStorage';

const BOOKMARK_STORAGE_KEY = 'myjo_bookmarks';
const PROGRESS_STORAGE_KEY = 'problem_progress';

const BOOKMARK_ACTIONS = new Set([
  'bookmarks/fetchList/fulfilled',
  'bookmarks/toggle/fulfilled',
  'bookmarks/clearBookmarks',
]);

const PROGRESS_ACTIONS = new Set([
  'progress/hydrate/fulfilled',
  'progress/toggleSolved/fulfilled',
  'progress/markSolved/fulfilled',
]);

const isLocalOnlyBookmark = (item: unknown): boolean => {
  if (!item || typeof item !== 'object' || !('type' in item)) return false;
  const type = (item as { type?: unknown }).type;
  return type === 'APTITUDE' || type === 'COMPANY';
};

/**
 * Browser persistence belongs in middleware, after reducers produce the next
 * state. This keeps Redux reducers deterministic and prevents stale thunk
 * snapshots from overwriting a newer in-memory result.
 */
export const clientPersistenceMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);
  const actionType = typeof action === 'object' && action && 'type' in action
    ? String(action.type)
    : '';
  const state = storeApi.getState() as {
    bookmarks?: { bookmarks?: unknown[] };
    progress?: { solvedByProblemId?: Record<string, boolean> };
  };

  try {
    if (BOOKMARK_ACTIONS.has(actionType)) {
      const localOnlyBookmarks = (state.bookmarks?.bookmarks || []).filter(isLocalOnlyBookmark);
      userScopedStorage.setItem(
        BOOKMARK_STORAGE_KEY,
        JSON.stringify(localOnlyBookmarks)
      );
    }
    if (PROGRESS_ACTIONS.has(actionType)) {
      userScopedStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify(state.progress?.solvedByProblemId || {})
      );
    }
  } catch {
    // Storage is an optional resilience layer; Redux state remains authoritative
    // for the active browser session when persistence is unavailable.
  }

  return result;
};
