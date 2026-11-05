const REFRESH_LOCK_NAME = 'c2c-auth-refresh';

type RefreshTask<T> = () => Promise<T>;

export class RefreshCoordinationUnavailableError extends Error {
  constructor() {
    super('Secure cross-tab session refresh is unavailable in this browser');
    this.name = 'RefreshCoordinationUnavailableError';
  }
}

/**
 * Serializes rotating-cookie refreshes with the browser's atomic lock manager.
 * localStorage is intentionally not used as a mutex because its read/write
 * operations cannot provide cross-tab compare-and-set semantics.
 */
export async function withCrossTabRefreshLock<T>(task: RefreshTask<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK_NAME, { mode: 'exclusive' }, task);
  }
  throw new RefreshCoordinationUnavailableError();
}
