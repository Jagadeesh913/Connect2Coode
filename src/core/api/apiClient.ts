import axios from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from '../security/tokenStorage';
import {
  getUserFromAuthSession,
  requireAuthSessionData,
  type AuthSessionData,
} from '../security/authContract';
import { withCrossTabRefreshLock } from '../security/refreshCoordinator';
import { userScopedStorage } from '../storage/userScopedStorage';

/**
 * Resolves and normalizes the API base URL.
 *
 * - Preserves explicitly configured absolute HTTP/HTTPS URLs (stripping trailing slashes).
 * - Supports relative API base paths (e.g. '/api/v1') to enable Vite development proxying.
 * - Normalizes relative paths without a leading slash (e.g. 'api/v1' -> '/api/v1').
 * - Handles missing, empty, or invalid configuration safely and clearly by defaulting
 *   to production 'https://api.connect2code.in/api/v1'.
 */
export const BACKEND_ORIGIN = 'https://api.connect2code.in';
export const DEFAULT_API_BASE_URL = 'https://api.connect2code.in/api/v1';

export const resolveApiBaseUrl = (rawUrl?: string | null): string => {
  if (typeof rawUrl !== 'string') {
    return DEFAULT_API_BASE_URL;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_API_BASE_URL;
  }

  // 1. Explicit absolute HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }

  // 2. Explicit relative path starting with '/'
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/+$/, '');
  }

  // 3. Relative path without leading slash (e.g. 'api/v1')
  if (!trimmed.includes('://')) {
    return `/${trimmed}`.replace(/\/+$/, '');
  }

  // 4. Invalid protocol or unsupported format -> fallback to default backend
  return DEFAULT_API_BASE_URL;
};

export const getBackendOrigin = (rawUrl?: string | null): string => {
  const resolved = resolveApiBaseUrl(rawUrl);
  const stripped = resolved.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  if (!stripped || !stripped.startsWith('http')) {
    return BACKEND_ORIGIN;
  }
  return stripped;
};

export const resolveDeploymentApiBaseUrl = (
  rawUrl?: string | null,
  isLocal?: boolean
): string => {
  const resolved = resolveApiBaseUrl(rawUrl);

  const isLocalEnv =
    typeof isLocal === 'boolean'
      ? isLocal
      : typeof import.meta !== 'undefined' && import.meta.env
      ? Boolean(import.meta.env.DEV || import.meta.env.MODE === 'development' || import.meta.env.MODE === 'preview')
      : typeof window !== 'undefined'
      ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      : false;

  // In local development or preview environments:
  // - Support relative API paths (e.g. '/api/v1') so the Vite dev/preview proxy routes requests.
  // - Support local development servers (e.g. 'http://localhost:8080/api/v1' or 'http://127.0.0.1:8080/api/v1').
  // - Support custom absolute backend URLs.
  // - Default safely to canonical production backend if unconfigured or empty.
  if (isLocalEnv) {
    return resolved;
  }

  // In deployed production environments (e.g. static production SPA):
  // - Guard against accidentally baking localhost or loopback addresses into client production bundles.
  // - Guard against relative API paths when the static host lacks an API reverse proxy.
  // - Fallback safely to the canonical production backend.
  if (
    resolved.includes('localhost') ||
    resolved.includes('127.0.0.1') ||
    !resolved.startsWith('http')
  ) {
    return DEFAULT_API_BASE_URL;
  }

  return resolved;
};

export const getBaseUrl = (): string => {
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_BASE_URL
      : undefined;

  return resolveDeploymentApiBaseUrl(envUrl);
};

export const BASE_URL = getBaseUrl();

export const getGoogleOAuthUrl = (): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  return `${getBackendOrigin(envUrl)}/oauth2/authorization/google`;
};

export const isRequestCanceled = (error: unknown): boolean => axios.isCancel(error);

export type AuthPolicy = 'public' | 'protected';
export type C2CAxiosRequestConfig = AxiosRequestConfig & { authPolicy?: AuthPolicy };

type UnwrappedApiClient = Omit<AxiosInstance, 'request' | 'get' | 'delete' | 'post' | 'put' | 'patch'> & {
  <T = any>(config: C2CAxiosRequestConfig): Promise<T>;
  request<T = any>(config: C2CAxiosRequestConfig): Promise<T>;
  get<T = any>(url: string, config?: C2CAxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: C2CAxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: unknown, config?: C2CAxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: unknown, config?: C2CAxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: unknown, config?: C2CAxiosRequestConfig): Promise<T>;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
}) as UnwrappedApiClient;

type AuthListener = (token: string, data: AuthSessionData) => void;
type AuthFailureListener = () => void;

const authListeners: AuthListener[] = [];
const authFailureListeners: AuthFailureListener[] = [];

export const registerAuthListener = (listener: AuthListener) => {
  authListeners.push(listener);
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
};

export const registerAuthFailureListener = (listener: AuthFailureListener) => {
  authFailureListeners.push(listener);
  return () => {
    const idx = authFailureListeners.indexOf(listener);
    if (idx !== -1) authFailureListeners.splice(idx, 1);
  };
};

function notifyAuthListeners(token: string, data: AuthSessionData) {
  authListeners.forEach((fn) => {
    try { fn(token, data); } catch {}
  });
}

function notifyAuthFailure() {
  authFailureListeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

function clearInvalidSession(): void {
  userScopedStorage.clearForUser(tokenStorage.getUser(), { preserveKeys: ['theme_pref'] });
  tokenStorage.clearTokens();
  notifyAuthFailure();
}

// One promise deduplicates this tab; the coordinator serializes rotation across tabs.
let refreshTokenPromise: Promise<AuthSessionData> | null = null;
let refreshTokenPromiseEpoch: number | null = null;

export const executeRefreshToken = async (): Promise<AuthSessionData> => {
  const requestedEpoch = tokenStorage.getSessionEpoch();
  if (refreshTokenPromise && refreshTokenPromiseEpoch === requestedEpoch) {
    return refreshTokenPromise;
  }

  const nextPromise = withCrossTabRefreshLock(async () => {
    const sessionEpoch = requestedEpoch;
    try {
      const refreshUrl = `${BASE_URL}/auth/refresh`;

      const refreshRes: any = await axios.post(
        refreshUrl,
        undefined,
        {
          timeout: 30_000,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const responseData = refreshRes.data;
      const tokenData = requireAuthSessionData(responseData?.data || responseData);

      if (tokenStorage.getSessionEpoch() !== sessionEpoch) {
        throw new Error('Authentication session changed while refresh was in progress');
      }
      tokenStorage.setAccessToken(tokenData.token);
      tokenStorage.setUser(getUserFromAuthSession(tokenData));
      notifyAuthListeners(tokenData.token, tokenData);
      return tokenData;
    } catch (refreshErr) {
      const refreshStatus = (refreshErr as { response?: { status?: number } })?.response?.status;
      if (refreshStatus === 401 && tokenStorage.getSessionEpoch() === sessionEpoch) {
        clearInvalidSession();
      }
      throw refreshErr;
    }
  });
  refreshTokenPromise = nextPromise;
  refreshTokenPromiseEpoch = requestedEpoch;
  void nextPromise.finally(() => {
    if (refreshTokenPromise === nextPromise) {
      refreshTokenPromise = null;
      refreshTokenPromiseEpoch = null;
    }
  }).catch(() => {});

  return nextPromise;
};

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/signUp',
  '/auth/refresh',
  '/auth/generatePasswordResetOtp',
  '/auth/verifyPasswordResetOtp',
] as const;

const isPublicAuthPath = (url: string): boolean =>
  PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

const getAuthPolicy = (config: C2CAxiosRequestConfig): AuthPolicy =>
  isPublicAuthPath(config.url || '') ? 'public' : config.authPolicy || 'protected';

// Request Interceptor: attach the current in-memory access token only.
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const CREDENTIAL_FIELD_NAMES = new Set([
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'refresh-token',
  'jwttoken',
  'jwt_token',
]);

const isCredentialField = (key: string): boolean =>
  CREDENTIAL_FIELD_NAMES.has(key.toLowerCase());

/** Recursively removes credentials from request bodies at every nesting level. */
const cloneWithoutDuplicateTokenFields = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof FormData) {
    const sanitized = new FormData();
    value.forEach((child, key) => {
      if (isCredentialField(key)) return;
      sanitized.append(key, child);
    });
    return sanitized;
  }
  if (value instanceof URLSearchParams) {
    const sanitized = new URLSearchParams();
    value.forEach((child, key) => {
      if (isCredentialField(key)) return;
      sanitized.append(key, child);
    });
    return sanitized;
  }
  if (Array.isArray(value)) return value.map(cloneWithoutDuplicateTokenFields);
  if (!isPlainObject(value)) return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (isCredentialField(key)) {
      continue;
    }
    sanitized[key] = cloneWithoutDuplicateTokenFields(child);
  }
  return sanitized;
};

/**
 * Clones request bodies and removes legacy credential fields without changing
 * caller-owned data. Authentication belongs exclusively to the Authorization
 * header.
 */
export const sanitizeRequestData = (data: unknown): unknown => {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(sanitizeRequestData(parsed));
    } catch {
      return data;
    }
  }

  return cloneWithoutDuplicateTokenFields(data);
};

export const getPreparedRequestContentType = (data: unknown): string | null | undefined =>
  data instanceof URLSearchParams
    ? 'application/x-www-form-urlencoded;charset=UTF-8'
    : typeof FormData !== 'undefined' && data instanceof FormData
      ? null
      : undefined;

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestConfig = config as InternalAxiosRequestConfig & { authPolicy?: AuthPolicy };
    const authPolicy = getAuthPolicy(requestConfig);
    requestConfig.authPolicy = authPolicy;

    const token = tokenStorage.getAccessToken();

    if (token && authPolicy === 'protected') {
      config.headers = config.headers || {};
      if (typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      }
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['authorization'] = `Bearer ${token}`;
    }

    // Parameter protection: Ensure token is NEVER sent in URL query parameters
    if (config.params && typeof config.params === 'object') {
      for (const key of Object.keys(config.params)) {
        if (isCredentialField(key)) {
          delete config.params[key];
        }
      }
    }

    // Credentials are bearer-header only. Strip legacy body token fields so a
    // caller cannot accidentally duplicate or leak the active credential.
    config.data = sanitizeRequestData(config.data);
    const preparedContentType = getPreparedRequestContentType(config.data);
    if (preparedContentType === null) {
      if (typeof (config.headers as any).delete === 'function') {
        (config.headers as any).delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    } else if (preparedContentType) {
      if (typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Content-Type', preparedContentType);
      } else {
        config.headers['Content-Type'] = preparedContentType;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    const resData = response.data;

    // Reject unexpected HTML responses. Refresh is driven only by an HTTP 401.
    if (typeof resData === 'string' && (resData.includes('<!doctype') || resData.includes('<html') || resData.includes('accounts.google.com'))) {
      const errorMsg = 'Unexpected HTML response received from the API.';
      return Promise.reject({
        statusCode: 502,
        message: errorMsg,
        errors: [errorMsg],
        data: null,
      });
    }

    // Accept all 2xx HTTP and inner backend status codes (200, 201 Created, 202 Accepted, 204 No Content)
    if (resData && typeof resData === 'object' && 'statusCode' in resData) {
      const code = Number(resData.statusCode);

      if (code < 200 || code >= 300) {
        const errorMsg = resData.message || (resData.errors && resData.errors[0]) || 'Server processing error';
        return Promise.reject({
          statusCode: code,
          message: errorMsg,
          errors: resData.errors || [errorMsg],
          data: resData.data,
        });
      }
    }
    return resData;
  },
  async (error) => {
    // Preserve AbortController cancellation so callers can distinguish a canceled request from an API failure.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = (error.config || {}) as C2CAxiosRequestConfig & { _retry?: boolean };
    const authPolicy = getAuthPolicy(originalRequest);

    // Handle Timeout Errors gracefully with user-friendly cold-start explanation
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        statusCode: 408,
        message: 'The server is taking longer than expected to respond (waking up from sleep mode). Please wait a few seconds and try logging in again.',
        errors: ['Server connection timed out due to backend cold start'],
      });
    }

    const status = error.response?.status;
    const isAuthFailure = status === 401;

    // Only an HTTP 401 from a protected request is eligible for refresh.
    if (isAuthFailure && authPolicy === 'protected' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshedSession = await executeRefreshToken();
        const newAccessToken = refreshedSession.token;
        originalRequest.headers = originalRequest.headers || {};
        if (typeof (originalRequest.headers as any).set === 'function') {
          (originalRequest.headers as any).set('Authorization', `Bearer ${newAccessToken}`);
        }
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
        const refreshStatus = refreshErr?.response?.status || 0;
        const refreshBody = refreshErr?.response?.data;
        const fallbackMessage = refreshStatus === 401
          ? 'Your session has expired. Please log in again.'
          : refreshErr?.message || 'Session refresh failed. Please try again.';
        if (refreshBody && typeof refreshBody === 'object' && !Array.isArray(refreshBody)) {
          return Promise.reject({
            ...refreshBody,
            statusCode: refreshBody.statusCode || refreshStatus,
          });
        }
        return Promise.reject({
          statusCode: refreshStatus,
          message: fallbackMessage,
          errors: [fallbackMessage],
        });
      }
    }

    const isNetworkError =
      !error.response &&
      (error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        error.message?.includes('network'));

    const finalStatus = error.response?.status || (isNetworkError ? 0 : 500);
    let errorData = error.response?.data;

    if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
      if (!errorData.statusCode && finalStatus) {
        errorData.statusCode = finalStatus;
      }
    } else {
      const fallbackMsg = isNetworkError
        ? "We couldn't connect to the server. Check your connection and try again."
        : typeof errorData === 'string' && errorData.trim()
        ? errorData
        : error.message || 'Unable to complete your request. Please try again.';

      errorData = {
        statusCode: finalStatus,
        message: fallbackMsg,
        errors: [fallbackMsg],
      };
    }

    return Promise.reject(errorData);
  }
);
