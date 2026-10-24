import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../security/tokenStorage';
import { isTokenValid } from '../security/jwt';
import { publishAuthSessionEvent } from '../security/authSessionSync';

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

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

type AuthListener = (token: string, data: any) => void;
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

function notifyAuthListeners(token: string, data: any) {
  authListeners.forEach((fn) => {
    try { fn(token, data); } catch {}
  });
}

function notifyAuthFailure() {
  authFailureListeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

// Shared Promise Lock for Single-Flight Concurrent 401/403 Refresh Requests
let refreshTokenPromise: Promise<string> | null = null;

export const executeRefreshToken = async (): Promise<string> => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const storedRefreshToken = tokenStorage.getRefreshToken();
      const payload = storedRefreshToken ? { refreshToken: storedRefreshToken } : {};
      const refreshUrl = `${BASE_URL}/auth/refresh`;

      const refreshRes: any = await axios.post(
        refreshUrl,
        payload,
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
      const tokenData = responseData?.data || responseData;
      const newAccessToken = tokenData?.accessToken || tokenData?.token;
      const newRefreshToken = tokenData?.refreshToken || storedRefreshToken;

      if (newAccessToken) {
        tokenStorage.setAccessToken(newAccessToken);
        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken);
        }
        publishAuthSessionEvent('session-updated');
        notifyAuthListeners(newAccessToken, tokenData);
        return newAccessToken;
      } else {
        throw new Error('No access token returned from refresh endpoint');
      }
    } catch (refreshErr) {
      tokenStorage.clearTokens();
      notifyAuthFailure();
      throw refreshErr;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

// Request Interceptor: Attach Access Token & Proactively Refresh if Expired
/**
 * Recursively removes duplicate/invalid 'token' and 'jwttoken' fields at any depth
 * within objects and arrays. Only 'jwtToken' is permitted as the valid field.
 */
function purgeDuplicateTokenFields(obj: any): void {
  if (!obj || typeof obj !== 'object' || obj instanceof FormData) return;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      purgeDuplicateTokenFields(item);
    }
    return;
  }
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'token' || (lowerKey === 'jwttoken' && key !== 'jwtToken') || lowerKey === 'jwt_token') {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      purgeDuplicateTokenFields(obj[key]);
    }
  }
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const reqUrl = config.url || '';
    const isPublicAuthEndpoint =
      reqUrl.includes('/auth/login') ||
      reqUrl.includes('/signUp') ||
      reqUrl.includes('/auth/refresh') ||
      reqUrl.includes('/auth/generatePasswordResetOtp') ||
      reqUrl.includes('/auth/verifyPasswordResetOtp');

    let token = tokenStorage.getAccessToken();
    const storedRefreshToken = tokenStorage.getRefreshToken();
    const storedUser = tokenStorage.getUser();

    const hasValidToken = Boolean(token && isTokenValid(token));
    // Proactively refresh if access token is missing or expired, but refresh token or user session exists
    if (!hasValidToken && (storedRefreshToken || storedUser) && !isPublicAuthEndpoint) {
      try {
        token = await executeRefreshToken();
      } catch {}
    }

    if (token && !isPublicAuthEndpoint) {
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
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'token' || lowerKey === 'jwttoken' || lowerKey === 'jwt_token') {
          delete config.params[key];
        }
      }
    }

    // Attach logged in user JWT token with the payload for API endpoints that inspect the request body
    // and strictly guarantee duplicate/invalid 'token' field is removed across each and every API call
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      if (typeof config.data === 'string') {
        try {
          const parsed = JSON.parse(config.data);
          if (parsed && typeof parsed === 'object') {
            purgeDuplicateTokenFields(parsed);
            if (token && !isPublicAuthEndpoint && !parsed.jwtToken && !Array.isArray(parsed)) {
              parsed.jwtToken = token;
            }
            config.data = JSON.stringify(parsed);
          }
        } catch {}
      } else {
        if (!config.data && method !== 'delete') {
          config.data = {};
        }
        if (
          config.data &&
          typeof config.data === 'object' &&
          !(config.data instanceof FormData)
        ) {
          purgeDuplicateTokenFields(config.data);
          if (token && !isPublicAuthEndpoint && !config.data.jwtToken && !Array.isArray(config.data)) {
            config.data.jwtToken = token;
          }
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    const resData = response.data;
    const originalRequest = response.config as any;
    const reqUrl = originalRequest?.url || '';

    const isPublicAuthEndpoint =
      reqUrl.includes('/auth/refresh') ||
      reqUrl.includes('/auth/login') ||
      reqUrl.includes('/signUp') ||
      reqUrl.includes('/auth/generatePasswordResetOtp') ||
      reqUrl.includes('/auth/verifyPasswordResetOtp');

    // Reject unexpected HTML responses from an API request when unauthenticated.
    if (typeof resData === 'string' && (resData.includes('<!doctype') || resData.includes('<html') || resData.includes('accounts.google.com'))) {
      if (!originalRequest?._retry && !isPublicAuthEndpoint && (tokenStorage.getRefreshToken() || tokenStorage.getAccessToken() || tokenStorage.getUser())) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await executeRefreshToken();
          originalRequest.headers = originalRequest.headers || {};
          if (typeof (originalRequest.headers as any).set === 'function') {
            (originalRequest.headers as any).set('Authorization', `Bearer ${newAccessToken}`);
          }
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch {}
      }

      const errorMsg = 'Authentication required. Please log in.';
      return Promise.reject({
        statusCode: 401,
        message: errorMsg,
        errors: [errorMsg],
        data: null,
      });
    }

    // Accept all 2xx HTTP and inner backend status codes (200, 201 Created, 202 Accepted, 204 No Content)
    if (resData && typeof resData === 'object' && 'statusCode' in resData) {
      const code = Number(resData.statusCode);

      // Handle 401 / 403 returned inside a 200 envelope
      if ((code === 401 || code === 403) && !originalRequest?._retry && !isPublicAuthEndpoint) {
        if (tokenStorage.getRefreshToken() || tokenStorage.getAccessToken() || tokenStorage.getUser()) {
          originalRequest._retry = true;
          try {
            const newAccessToken = await executeRefreshToken();
            originalRequest.headers = originalRequest.headers || {};
            if (typeof (originalRequest.headers as any).set === 'function') {
              (originalRequest.headers as any).set('Authorization', `Bearer ${newAccessToken}`);
            }
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['authorization'] = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } catch (refreshErr: any) {
            return Promise.reject({
              statusCode: 401,
              message: 'Your session has expired. Please login again.',
              errors: refreshErr?.response?.data?.errors || ['Session expired or unauthorized'],
            });
          }
        }
      }

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

    const originalRequest = error.config || {};
    const reqUrl = originalRequest?.url || '';

    // Handle Timeout Errors gracefully with user-friendly cold-start explanation
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        statusCode: 408,
        message: 'The server is taking longer than expected to respond (waking up from sleep mode). Please wait a few seconds and try logging in again.',
        errors: ['Server connection timed out due to backend cold start'],
      });
    }

    const status = error.response?.status;
    const isAuthFailure = status === 401 || status === 403;

    // Check for HTTP 401 / 403 Unauthorized
    if (isAuthFailure && !originalRequest._retry) {
      // Exclude public auth and refresh endpoints from the refresh loop to prevent recursion
      if (
        reqUrl.includes('/auth/refresh') ||
        reqUrl.includes('/auth/login') ||
        reqUrl.includes('/signUp') ||
        reqUrl.includes('/auth/generatePasswordResetOtp') ||
        reqUrl.includes('/auth/verifyPasswordResetOtp')
      ) {
        if (reqUrl.includes('/auth/refresh')) {
          tokenStorage.clearTokens();
          notifyAuthFailure();
        }
        const errBody = error.response?.data || {};
        return Promise.reject({
          statusCode: error.response?.status || status,
          message: errBody.message || 'Authentication error',
          errors: errBody.errors || [error.message],
        });
      }

      originalRequest._retry = true;

      // Do not attempt token refresh if there are no tokens in storage or user session
      const storedRefreshToken = tokenStorage.getRefreshToken();
      const storedAccessToken = tokenStorage.getAccessToken();
      const storedUser = tokenStorage.getUser();

      if (!storedRefreshToken && !storedAccessToken && !storedUser) {
        return Promise.reject({
          statusCode: 401,
          message: error.response?.data?.message || 'Authentication required. Please log in.',
          errors: error.response?.data?.errors || ['Authentication required'],
        });
      }

      try {
        const newAccessToken = await executeRefreshToken();
        originalRequest.headers = originalRequest.headers || {};
        if (typeof (originalRequest.headers as any).set === 'function') {
          (originalRequest.headers as any).set('Authorization', `Bearer ${newAccessToken}`);
        }
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
        return Promise.reject({
          statusCode: 401,
          message: 'Your session has expired. Please login again.',
          errors: refreshErr?.response?.data?.errors || ['Session expired or unauthorized'],
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
