import { tokenStorage } from '../security/tokenStorage';
import type { User } from '../types/domain';

const GUEST_SCOPE = 'guest';

function hashScope(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function getIdentityKey(): string {
  const user = tokenStorage.getUser();

  if (user?.id !== undefined && user?.id !== null && String(user.id).trim()) {
    return `id:${String(user.id)}`;
  }

  if (user?.email) {
    return `email:${String(user.email).trim().toLowerCase()}`;
  }

  return GUEST_SCOPE;
}

function getScope(): string {
  const identity = getIdentityKey();
  return identity === GUEST_SCOPE ? GUEST_SCOPE : hashScope(identity);
}

function getScopeForUser(user: Pick<User, 'id' | 'email'> | null): string {
  if (user?.id !== undefined && user?.id !== null && String(user.id).trim()) {
    return hashScope(`id:${String(user.id)}`);
  }
  if (user?.email) {
    return hashScope(`email:${String(user.email).trim().toLowerCase()}`);
  }
  return GUEST_SCOPE;
}

function getScopedKey(key: string): string {
  return `c2c:user:${getScope()}:${key}`;
}

export const userScopedStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(getScopedKey(key));
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(getScopedKey(key), value);
    } catch {}
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(getScopedKey(key));
    } catch {}
  },

  /** Clears one signed-in user's cached data while preserving named preferences. */
  clearForUser(
    user: Pick<User, 'id' | 'email'> | null,
    options: { preserveKeys?: readonly string[] } = {}
  ): void {
    const scope = getScopeForUser(user);
    if (scope === GUEST_SCOPE) return;

    const prefix = `c2c:user:${scope}:`;
    const preserved = new Set(options.preserveKeys || []);
    try {
      const removals: string[] = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const storageKey = localStorage.key(index);
        if (!storageKey?.startsWith(prefix)) continue;
        if (!preserved.has(storageKey.slice(prefix.length))) removals.push(storageKey);
      }
      removals.forEach((storageKey) => localStorage.removeItem(storageKey));
    } catch {}
  },
};
