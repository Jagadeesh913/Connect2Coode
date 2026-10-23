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

function removeCookie(name: string): void {
  try {
    document.cookie =
      `${name}=; path=/; max-age=0; SameSite=Lax${cookieSecurityAttributes()}`;
  } catch {}
}

function removeLegacyBrowserStorage(key: string): void {
  try {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(`c2c_${key}`);
      storage.removeItem(key);
    }
  } catch {}
}

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

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
    removeCookie('token');
    removeCookie('access_token');
    removeCookie('jwt');
    removeCookie('jwtToken');
    removeCookie('jwttoken');
    removeCookie('authToken');
    removeLegacyBrowserStorage(ACCESS_TOKEN_KEY);
    removeLegacyBrowserStorage('token');
    removeLegacyBrowserStorage('access_token');
    removeLegacyBrowserStorage('jwtToken');
    removeLegacyBrowserStorage('jwttoken');
  },

  removeAccessToken(): void {
    inMemoryAccessToken = null;
    removeCookie(ACCESS_TOKEN_KEY);
    removeCookie('token');
    removeCookie('access_token');
    removeCookie('jwtToken');
    removeCookie('jwttoken');
    removeLegacyBrowserStorage(ACCESS_TOKEN_KEY);
    removeLegacyBrowserStorage('token');
    removeLegacyBrowserStorage('access_token');
    removeLegacyBrowserStorage('jwtToken');
    removeLegacyBrowserStorage('jwttoken');
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
    removeCookie('refresh_token');
    removeLegacyBrowserStorage(REFRESH_TOKEN_KEY);
    removeLegacyBrowserStorage('refresh_token');
  },

  removeRefreshToken(): void {
    inMemoryRefreshToken = null;
    removeCookie(REFRESH_TOKEN_KEY);
    removeCookie('refresh_token');
    removeCookie('refreshToken');
    removeLegacyBrowserStorage(REFRESH_TOKEN_KEY);
    removeLegacyBrowserStorage('refresh_token');
    removeLegacyBrowserStorage('refreshToken');
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
    removeCookie(USER_PROFILE_KEY);
    removeCookie('user');
    removeLegacyBrowserStorage(USER_PROFILE_KEY);
    removeLegacyBrowserStorage('user');
  },

  /**
   * Clears this tab's in-memory state and the shared cookie session. The
   * broadcast is suppressed only while processing another tab's notification.
   */
  clearTokens(options: { broadcast?: boolean } = {}): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
    // Clear any residual legacy cookies from earlier versions
    removeCookie(ACCESS_TOKEN_KEY);
    removeCookie(REFRESH_TOKEN_KEY);
    if (options.broadcast !== false) {
      publishAuthSessionEvent('session-cleared');
    }
  },

  /** Discards stale per-tab token caches so shared cookies become authoritative. */
  discardInMemorySession(): void {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
  },
};
