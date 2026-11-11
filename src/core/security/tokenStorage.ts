import type { User } from '../types/domain';
import { publishAuthSessionEvent } from './authSessionSync';

/**
 * Per-tab, memory-only authentication state.
 *
 * The backend exclusively owns the refresh token in an HttpOnly cookie. The
 * frontend must never read, create, update, or serialize that cookie. Access
 * tokens and session identity are deliberately kept out of browser storage so
 * a page reload restores the session only through POST /auth/refresh.
 */

const ACCESS_TOKEN_COOKIE_KEYS = [
  'accessToken',
  'token',
  'access_token',
  'jwt',
  'jwtToken',
  'jwttoken',
  'jwt_token',
  'authToken',
] as const;
const USER_COOKIE_KEYS = ['user_profile', 'user'] as const;
const KNOWN_COOKIE_PATHS = ['/', '/auth', '/api', '/api/v1', '/api/v1/auth'] as const;
const COOKIE_EXPIRY = 'Thu, 01 Jan 1970 00:00:00 GMT';

function cookieSecurityAttributes(): string {
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '; Secure'
    : '';
}

function getCookiePaths(): string[] {
  const paths = new Set<string>(KNOWN_COOKIE_PATHS);
  if (typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    while (segments.length > 0) {
      paths.add(`/${segments.join('/')}`);
      segments.pop();
    }
  }
  return [...paths];
}

function getCookieDomains(): Array<string | null> {
  const domains: Array<string | null> = [null];
  if (typeof window === 'undefined') return domains;

  const hostname = window.location.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return domains;
  }

  domains.push(hostname, `.${hostname}`);
  const labels = hostname.split('.');
  if (labels.length > 2) {
    const parentDomain = labels.slice(-2).join('.');
    domains.push(parentDomain, `.${parentDomain}`);
  }
  return [...new Set(domains)];
}

/** Removes only obsolete JavaScript-readable cookies. HttpOnly refresh cookies are untouched. */
function removeLegacyCookie(name: string): void {
  try {
    for (const path of getCookiePaths()) {
      for (const domain of getCookieDomains()) {
        const domainAttribute = domain ? `; Domain=${domain}` : '';
        document.cookie =
          `${name}=; Path=${path}; Max-Age=0; Expires=${COOKIE_EXPIRY}; SameSite=Lax${domainAttribute}${cookieSecurityAttributes()}`;
      }
    }
  } catch {}
}

/**
 * Removes all readable browser cookies across all known path and domain combinations.
 * HttpOnly refresh cookies are exclusively owned and cleared by the backend
 * through Set-Cookie on POST /api/v1/auth/logout.
 */
export function clearAllReadableCookies(): void {
  if (typeof document === 'undefined') return;
  try {
    const rawCookies = document.cookie ? document.cookie.split(';') : [];
    for (const cookieStr of rawCookies) {
      const eqPos = cookieStr.indexOf('=');
      const name = (eqPos > -1 ? cookieStr.substring(0, eqPos) : cookieStr).trim();
      if (name && !name.toLowerCase().includes('refresh')) {
        removeLegacyCookie(name);
      }
    }
  } catch {}

  // Explicitly sweep known token and user keys regardless of document.cookie readability
  for (const key of ACCESS_TOKEN_COOKIE_KEYS) {
    removeLegacyCookie(key);
  }
  for (const key of USER_COOKIE_KEYS) {
    removeLegacyCookie(key);
  }
  // Common session/auth cookie keys (HttpOnly refresh token is preserved for backend contract)
  const extraKeys = ['jwt', 'sessionId', 'JSESSIONID', 'auth', 'c2c_session'];
  for (const key of extraKeys) {
    removeLegacyCookie(key);
  }
}

function removeLegacyBrowserStorage(key: string): void {
  const stores: Array<Storage | null> = [];
  try {
    stores.push(typeof localStorage !== 'undefined' ? localStorage : null);
  } catch {
    stores.push(null);
  }
  try {
    stores.push(typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  } catch {
    stores.push(null);
  }

  for (const storage of stores) {
    if (!storage) continue;
    try {
      storage.removeItem(`c2c_${key}`);
      storage.removeItem(key);
    } catch {}
  }
}

function purgeLegacyReadableSession(): void {
  clearAllReadableCookies();
  for (const key of ACCESS_TOKEN_COOKIE_KEYS) {
    removeLegacyBrowserStorage(key);
  }
  for (const key of USER_COOKIE_KEYS) {
    removeLegacyBrowserStorage(key);
  }
}

let inMemoryAccessToken: string | null = null;
let inMemoryUser: User | null = null;
let sessionEpoch = 0;

export const tokenStorage = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string): void {
    inMemoryAccessToken = token;
    purgeLegacyReadableSession();
  },

  removeAccessToken(): void {
    inMemoryAccessToken = null;
    purgeLegacyReadableSession();
  },

  getUser(): User | null {
    return inMemoryUser;
  },

  setUser(user: User): void {
    inMemoryUser = { ...user };
    purgeLegacyReadableSession();
  },

  removeUser(): void {
    inMemoryUser = null;
    purgeLegacyReadableSession();
  },

  clearTokens(options: { broadcast?: boolean } = {}): void {
    sessionEpoch += 1;
    inMemoryAccessToken = null;
    inMemoryUser = null;
    clearAllReadableCookies();
    purgeLegacyReadableSession();
    try {
      sessionStorage.removeItem('post_auth_redirect');
      sessionStorage.removeItem('c2c_auth_session_event');
    } catch {}
    if (options.broadcast !== false) {
      publishAuthSessionEvent('session-cleared');
    }
  },

  /** Used to reject authentication responses that complete after logout. */
  getSessionEpoch(): number {
    return sessionEpoch;
  },

  /** Supersedes older login/refresh responses without persisting credentials. */
  claimSessionOwnership(): number {
    sessionEpoch += 1;
    return sessionEpoch;
  },

  /** Discards this tab's volatile session before cookie-backed restoration. */
  discardInMemorySession(): void {
    sessionEpoch += 1;
    inMemoryAccessToken = null;
    inMemoryUser = null;
  },
};
