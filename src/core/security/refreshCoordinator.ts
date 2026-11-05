const REFRESH_LOCK_NAME = 'c2c-auth-refresh';
const REFRESH_LEASE_KEY = 'c2c:auth:refresh-lease';
const LEASE_DURATION_MS = 35_000;

type RefreshTask<T> = () => Promise<T>;

const waitForLeaseChange = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      setTimeout(resolve, delayMs);
      return;
    }

    const timeoutId = window.setTimeout(finish, delayMs);
    function finish() {
      window.clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorage);
      resolve();
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === REFRESH_LEASE_KEY) finish();
    }
    window.addEventListener('storage', handleStorage);
  });

const createOwnerId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16)).join('-');
};

async function withStorageLease<T>(task: RefreshTask<T>): Promise<T> {
  if (typeof localStorage === 'undefined') return task();

  const owner = createOwnerId();
  const waitDeadline = Date.now() + LEASE_DURATION_MS * 2;

  while (Date.now() < waitDeadline) {
    const now = Date.now();
    let lease: { owner?: string; expiresAt?: number } | null = null;
    try {
      const raw = localStorage.getItem(REFRESH_LEASE_KEY);
      lease = raw ? JSON.parse(raw) : null;
    } catch {
      return task();
    }

    if (!lease?.owner || !lease.expiresAt || lease.expiresAt <= now) {
      const candidate = JSON.stringify({ owner, expiresAt: now + LEASE_DURATION_MS });
      try {
        localStorage.setItem(REFRESH_LEASE_KEY, candidate);
        await waitForLeaseChange(25);
        const confirmed = JSON.parse(localStorage.getItem(REFRESH_LEASE_KEY) || 'null');
        if (confirmed?.owner === owner) {
          try {
            return await task();
          } finally {
            try {
              const current = JSON.parse(localStorage.getItem(REFRESH_LEASE_KEY) || 'null');
              if (current?.owner === owner) localStorage.removeItem(REFRESH_LEASE_KEY);
            } catch {}
          }
        }
      } catch {
        return task();
      }
    }

    const remaining = Math.max(25, Math.min(500, Number(lease?.expiresAt || now + 250) - now));
    await waitForLeaseChange(remaining);
  }

  throw new Error('Timed out waiting to restore the authenticated session');
}

/** Serializes refresh-token rotation across tabs without sharing credentials. */
export async function withCrossTabRefreshLock<T>(task: RefreshTask<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK_NAME, { mode: 'exclusive' }, task);
  }
  return withStorageLease(task);
}
