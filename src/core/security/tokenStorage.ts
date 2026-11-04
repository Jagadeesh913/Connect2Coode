import type { User } from '../types/domain';
import { publishAuthSessionEvent } from './authSessionSync';

/**
 * Browser-side authentication storage.
 *
 * Security Requirements & Documentation (F-011):
 * - Tokens are stored in JavaScript-accessible cookies as a fallback because the current
 *   backend returns them in the JSON response body rather than in HttpOnly response headers.
 * - Browser JavaScript (document.cookie) CANNOT set the HttpOnly flag.
 * - Backend Architectural Requirement:
 *   The Spring Boot backend should issue refresh tokens via HttpOnly, Secure, SameSite=Strict
 *   cookies in Set-Cookie headers:
 *   `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
 * - Frontend Security Hardening:
 *   Client-set cookies are restricted with `SameSite=Lax` and `; Secure` on HTTPS origins.
 *   Tokens are deliberately NOT mirrored into localStorage to prevent persistent exposure.
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'user_profile';
const ACCESS_TOKEN_COOKIE_KEYS = [
  ACCESS_TOKEN_KEY,
  'token',
  'access_token',
  'jwt',
  'jwtToken',
  'jwttoken',
  'jwt_token',
  'authToken',
] as const;
const REFRESH_TOKEN_COOKIE_KEYS = [REFRESH_TOKEN_KEY, 'refresh_token', 'refresh-token'] as const;
const USER_COOKIE_KEYS = [USER_PROFILE_KEY, 'user'] as const;
const KNOWN_COOKIE_PATHS = ['/', '/auth', '/api', '/api/v1', '/api/v1/auth'] as const;
const COOKIE_EXPIRY = 'Thu, 01 Jan 1970 00:00:00 GMT';

function cookieSecurityAttributes(): string {
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '; Secure'
    : '';
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  try {
    const encodedValue = encodeURIComponent(value);
    document.cookie =
      `${name}=${encodedValue}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${cookieSecurityAttributes()}`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i += 1) {
      const c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
  } catch {}
  return null;
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

function removeCookie(name: string): void {
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

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let sessionEpoch = 0;

export const tokenStorage = {
  getAccessToken(): string | null {
    return (
      inMemoryAccessToken ||
      getCookie(ACCESS_TOKEN_KEY) ||
      getCookie('token') ||
      getCookie('access_token') ||
      getCookie('accessToken') ||
      getCookie('jwt') ||
      getCookie('jwtToken') ||
      getCookie('jwttoken') ||
      getCookie('authToken')
    );
  },

  setAccessToken(token: string, maxAgeSeconds: number = 900): void {
    inMemoryAccessToken = token;
    setCookie(ACCESS_TOKEN_KEY, token, maxAgeSeconds);
    for (const key of ACCESS_TOKEN_COOKIE_KEYS) {
      if (key !== ACCESS_TOKEN_KEY) removeCookie(key);
      removeLegacyBrowserStorage(key);
    }
  },

  removeAccessToken(): void {
    inMemoryAccessToken = null;
    for (const key of ACCESS_TOKEN_COOKIE_KEYS) {
      removeCookie(key);
      removeLegacyBrowserStorage(key);
    }
  },

  getRefreshToken(): string | null {
    return (
      inMemoryRefreshToken ||
      getCookie(REFRESH_TOKEN_KEY) ||
      getCookie('refresh_token') ||
      getCookie('refreshToken')
    );
  },

  setRefreshToken(token: string, maxAgeSeconds: number = 604800): void {
    inMemoryRefreshToken = token;
    setCookie(REFRESH_TOKEN_KEY, token, maxAgeSeconds);
    for (const key of REFRESH_TOKEN_COOKIE_KEYS) {
      if (key !== REFRESH_TOKEN_KEY) removeCookie(key);
      removeLegacyBrowserStorage(key);
    }
  },

  removeRefreshToken(): void {
    inMemoryRefreshToken = null;
    for (const key of REFRESH_TOKEN_COOKIE_KEYS) {
      removeCookie(key);
      removeLegacyBrowserStorage(key);
    }
  },

  // User profile is UI/session metadata, not an authentication credential (F-013).
  getUser(): User | null {
    const raw =
      getCookie(USER_PROFILE_KEY) ||
      getCookie('user');
    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {}
    }
    return null;
  },

  setUser(user: User, maxAgeSeconds: number = 604800): void {
    const serialized = JSON.stringify(user);
    setCookie(USER_PROFILE_KEY, serialized, maxAgeSeconds);
    removeCookie('user');
    removeLegacyBrowserStorage(USER_PROFILE_KEY);
    removeLegacyBrowserStorage('user');
  },

  removeUser(): void {
    for (const key of USER_COOKIE_KEYS) {
      removeCookie(key);
      removeLegacyBrowserStorage(key);
    }
  },

  /**
   * Clears this tab's in-memory state and the shared cookie session. The
   * broadcast is suppressed only while processing another tab's notification.
   */
  clearTokens(options: { broadcast?: boolean } = {}): void {
    sessionEpoch += 1;
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
    if (options.broadcast !== false) {
      publishAuthSessionEvent('session-cleared');
    }
  },

  /** Used to reject authentication responses that complete after logout. */
  getSessionEpoch(): number {
    return sessionEpoch;
  },

  /**
   * Claims ownership for new authentication work without clearing the current
   * session. Older login/refresh responses become stale, while a later logout
   * or login can still supersede this owner.
   */
  claimSessionOwnership(): number {
    sessionEpoch += 1;
    return sessionEpoch;
  },

  /** Discards stale per-tab token caches so shared cookies become authoritative. */
  discardInMemorySession(): void {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
  },
};
