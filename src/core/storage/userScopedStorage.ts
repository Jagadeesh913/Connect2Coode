import { tokenStorage } from '../security/tokenStorage';
import type { User } from '../types/domain';

const GUEST_SCOPE = 'guest';
let lastResolvedAccountScope: string | null = null;

function encodeScope(value: string): string {
  // Encoding the complete canonical identity is injective. A truncated hash is
  // not: two valid account IDs could otherwise resolve to the same local key.
  return `v2:${encodeURIComponent(value)}`;
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
  if (identity === GUEST_SCOPE) return GUEST_SCOPE;
  const scope = encodeScope(identity);
  lastResolvedAccountScope = scope;
  return scope;
}

function getScopeForUser(user: Pick<User, 'id' | 'email'> | null): string {
  if (user?.id !== undefined && user?.id !== null && String(user.id).trim()) {
    return encodeScope(`id:${String(user.id)}`);
  }
  if (user?.email) {
    return encodeScope(`email:${String(user.email).trim().toLowerCase()}`);
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
    const explicitScope = getScopeForUser(user);
    const scope = explicitScope === GUEST_SCOPE ? lastResolvedAccountScope : explicitScope;
    if (scope === GUEST_SCOPE) return;
    if (!scope) return;

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
      if (lastResolvedAccountScope === scope) lastResolvedAccountScope = null;
    } catch {}
  },
};
