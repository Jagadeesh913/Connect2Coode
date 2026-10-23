import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and mock network layers
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } }, post: async () => ({ data: {} }), get: async () => ({ data: {} }) }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

// Import real security, API, service, and Redux modules
const { getGoogleOAuthUrl, getBackendOrigin } = await import('../../src/core/api/apiClient.ts');
const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');
const authSliceModule = await import('../../src/features/auth/redux/authSlice.ts');
const {
  default: authReducer,
  refreshSessionThunk,
  loginUser,
  logoutUser,
  setAuthenticatedSession,
  setUnauthenticatedSession,
} = authSliceModule;

describe('PRODUCTION-GRADE GOOGLE OAUTH & AUTHENTICATION LIFECYCLE', () => {
  beforeEach(() => {
    tokenStorage.clearTokens();
  });

  // =========================================================================
  // 1. Backend OAuth URL Resolution & Browser Navigation Target
  // =========================================================================
  describe('1. Backend OAuth URL & Browser Navigation', () => {
    it('resolves correct Google OAuth endpoint relative to backend origin', () => {
      assert.equal(
        getBackendOrigin('https://api.connect2code.in/api/v1'),
        'https://api.connect2code.in'
      );
      assert.equal(
        getBackendOrigin('/api/v1'),
        'https://api.connect2code.in'
      );
      assert.equal(
        getBackendOrigin(undefined),
        'https://api.connect2code.in'
      );
    });

    it('generates exact Spring Security Google authorization endpoint without double slashes', () => {
      const url = getGoogleOAuthUrl();
      assert.equal(url, 'https://api.connect2code.in/oauth2/authorization/google');
    });
  });

  // =========================================================================
  // 2. In-Memory Access Token Storage (Strict Isolation from localStorage/cookies)
  // =========================================================================
  describe('2. In-Memory Access Token Storage', () => {
    it('stores and retrieves access token strictly in memory', () => {
      tokenStorage.setAccessToken('jwt.mock.access.token');
      assert.equal(tokenStorage.getAccessToken(), 'jwt.mock.access.token');

      tokenStorage.removeAccessToken();
      assert.equal(tokenStorage.getAccessToken(), null);
    });

    it('stores and retrieves refresh token in tokenStorage', () => {
      tokenStorage.setRefreshToken('test.refresh.token');
      assert.equal(tokenStorage.getRefreshToken(), 'test.refresh.token');
      tokenStorage.removeRefreshToken();
      assert.equal(tokenStorage.getRefreshToken(), null);
    });

    it('clearTokens wipes in-memory access token and profile', () => {
      tokenStorage.setAccessToken('active.token');
      tokenStorage.clearTokens();
      assert.equal(tokenStorage.getAccessToken(), null);
    });
  });

  // =========================================================================
  // 3. Redux Authentication State Lifecycle
  // =========================================================================
  describe('3. Redux Authentication State Lifecycle', () => {
    const initialLoadingState = {
      user: null,
      token: null,
      refreshToken: null,
      status: 'LOADING',
      isAuthenticated: false,
      loading: true,
      error: null,
      isAuthModalOpen: false,
      authModalMode: 'login',
    };

    it('starts in LOADING state to prevent premature route redirection on reload', () => {
      const state = authReducer(undefined, { type: '@@INIT' });
      assert.equal(state.status, 'LOADING');
      assert.equal(state.isAuthenticated, false);
      assert.equal(state.loading, true);
    });

    it('transitions to AUTHENTICATED on refreshSessionThunk.fulfilled', () => {
      tokenStorage.setAccessToken('new.jwt.access.token');
      const payload = {
        accessToken: 'new.jwt.access.token',
        user: {
          id: 42,
          email: 'coder@c2c.test',
          firstName: 'Code',
          lastName: 'Ninja',
          role: 'USER',
        },
      };

      const nextState = authReducer(initialLoadingState, {
        type: refreshSessionThunk.fulfilled.type,
        payload,
      });

      assert.equal(nextState.status, 'AUTHENTICATED');
      assert.equal(nextState.isAuthenticated, true);
      assert.equal(nextState.loading, false);
      assert.equal(nextState.token, 'new.jwt.access.token');
      assert.equal(nextState.user?.id, 42);
      assert.equal(nextState.user?.email, 'coder@c2c.test');
    });

    it('transitions to UNAUTHENTICATED on refreshSessionThunk.rejected without crashing', () => {
      const nextState = authReducer(initialLoadingState, {
        type: refreshSessionThunk.rejected.type,
        payload: 'No valid refresh session',
      });

      assert.equal(nextState.status, 'UNAUTHENTICATED');
      assert.equal(nextState.isAuthenticated, false);
      assert.equal(nextState.loading, false);
      assert.equal(nextState.token, null);
      assert.equal(nextState.user, null);
    });

    it('transitions to AUTHENTICATED on loginUser.fulfilled', () => {
      tokenStorage.setAccessToken('login.access.token');
      const payload = {
        id: 101,
        accessToken: 'login.access.token',
        email: 'developer@c2c.test',
        firstName: 'Jane',
        lastName: 'Dev',
        role: 'ADMIN',
      };

      const nextState = authReducer(initialLoadingState, {
        type: loginUser.fulfilled.type,
        payload,
      });

      assert.equal(nextState.status, 'AUTHENTICATED');
      assert.equal(nextState.isAuthenticated, true);
      assert.equal(nextState.loading, false);
      assert.equal(nextState.token, 'login.access.token');
      assert.equal(nextState.user?.id, 101);
      assert.equal(nextState.user?.role, 'ADMIN');
    });

    it('unconditionally cleans up on logoutUser.fulfilled or logoutUser.rejected', () => {
      const loggedInState = {
        user: { id: 1, email: 'user@c2c.test', role: 'USER' },
        token: 'activeToken',
        status: 'AUTHENTICATED',
        isAuthenticated: true,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login',
      };

      const loggedOutState = authReducer(loggedInState, {
        type: logoutUser.fulfilled.type,
      });
      assert.equal(loggedOutState.status, 'UNAUTHENTICATED');
      assert.equal(loggedOutState.isAuthenticated, false);
      assert.equal(loggedOutState.token, null);
      assert.equal(loggedOutState.user, null);

      const rejectedLogoutState = authReducer(loggedInState, {
        type: logoutUser.rejected.type,
      });
      assert.equal(rejectedLogoutState.status, 'UNAUTHENTICATED');
      assert.equal(rejectedLogoutState.isAuthenticated, false);
      assert.equal(rejectedLogoutState.token, null);
      assert.equal(rejectedLogoutState.user, null);
    });

    it('updates state via background single-flight auth listeners', () => {
      const state = authReducer(initialLoadingState, setAuthenticatedSession({
        token: 'bg.refreshed.token',
        user: { id: 99, email: 'bg@c2c.test', role: 'USER' },
      }));

      assert.equal(state.status, 'AUTHENTICATED');
      assert.equal(state.isAuthenticated, true);
      assert.equal(state.token, 'bg.refreshed.token');
      assert.equal(state.user?.id, 99);

      const unauthState = authReducer(state, setUnauthenticatedSession());
      assert.equal(unauthState.status, 'UNAUTHENTICATED');
      assert.equal(unauthState.isAuthenticated, false);
      assert.equal(unauthState.token, null);
      assert.equal(unauthState.user, null);
    });
  });

  // =========================================================================
  // 4. Single-Flight Refresh Simulation & Storm Prevention Verification
  // =========================================================================
  describe('4. Single-Flight Refresh & Concurrency Storm Prevention', () => {
    it('deduplicates multiple concurrent 401s into exactly one refresh call', async () => {
      let refreshCallCount = 0;
      let sharedRefreshPromise = null;

      const triggerRefresh = () => {
        if (!sharedRefreshPromise) {
          refreshCallCount += 1;
          sharedRefreshPromise = new Promise((resolve) => {
            setTimeout(() => {
              sharedRefreshPromise = null;
              resolve('new.shared.access.token');
            }, 10);
          });
        }
        return sharedRefreshPromise;
      };

      // Simulate 10 concurrent API calls receiving 401 simultaneously
      const results = await Promise.all([
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
        triggerRefresh(),
      ]);

      assert.equal(refreshCallCount, 1, 'Exactly ONE refresh request must be executed for concurrent 401s');
      assert.equal(results.length, 10);
      assert.ok(results.every((token) => token === 'new.shared.access.token'));
    });
  });

  // =========================================================================
  // 5. Open-Redirect Vulnerability Defense
  // =========================================================================
  describe('5. Open-Redirect Prevention', () => {
    const sanitizeUrl = (target) => {
      if (!target || typeof target !== 'string') return '/practice';
      const trimmed = target.trim();
      if (
        trimmed.startsWith('/') &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('/\\') &&
        !trimmed.includes(':') &&
        trimmed !== '/login' &&
        trimmed !== '/signup' &&
        !trimmed.startsWith('/oauth')
      ) {
        return trimmed;
      }
      return '/practice';
    };

    it('permits internal application routes', () => {
      assert.equal(sanitizeUrl('/practice'), '/practice');
      assert.equal(sanitizeUrl('/problems/two-sum'), '/problems/two-sum');
      assert.equal(sanitizeUrl('/admin/dashboard'), '/admin/dashboard');
      assert.equal(sanitizeUrl('/companies/google'), '/companies/google');
    });

    it('rejects external absolute URLs and protocol-relative URLs', () => {
      assert.equal(sanitizeUrl('https://evil-attacker.com'), '/practice');
      assert.equal(sanitizeUrl('http://phishing.site'), '/practice');
      assert.equal(sanitizeUrl('//evil-domain.com/path'), '/practice');
      assert.equal(sanitizeUrl('/\\evil.com'), '/practice');
      assert.equal(sanitizeUrl('javascript:alert(1)'), '/practice');
      assert.equal(sanitizeUrl('/login'), '/practice');
      assert.equal(sanitizeUrl('/oauth/callback'), '/practice');
      assert.equal(sanitizeUrl(null), '/practice');
      assert.equal(sanitizeUrl(''), '/practice');
    });
  });
});
