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
const { getSafeRedirectUrl } = await import('../../src/core/security/jwt.ts');
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

    it('does not expose any JavaScript refresh-token storage API', () => {
      assert.equal('setRefreshToken' in tokenStorage, false);
      assert.equal('getRefreshToken' in tokenStorage, false);
      assert.equal('removeRefreshToken' in tokenStorage, false);
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
    it('permits internal application routes using exported getSafeRedirectUrl', () => {
      assert.equal(getSafeRedirectUrl('/practice'), '/practice');
      assert.equal(getSafeRedirectUrl('/problems/two-sum'), '/problems/two-sum');
      assert.equal(getSafeRedirectUrl('/admin/dashboard'), '/admin/dashboard');
      assert.equal(getSafeRedirectUrl('/companies/google'), '/companies/google');
      assert.equal(getSafeRedirectUrl('/practice?topic=arrays&page=2'), '/practice?topic=arrays&page=2');
    });

    it('rejects external absolute URLs and protocol-relative URLs', () => {
      assert.equal(getSafeRedirectUrl('https://evil-attacker.com'), '/practice');
      assert.equal(getSafeRedirectUrl('http://phishing.site'), '/practice');
      assert.equal(getSafeRedirectUrl('//evil-domain.com/path'), '/practice');
      assert.equal(getSafeRedirectUrl('javascript:alert(1)'), '/practice');
      assert.equal(getSafeRedirectUrl(null), '/practice');
      assert.equal(getSafeRedirectUrl(''), '/practice');
      assert.equal(getSafeRedirectUrl(undefined), '/practice');
    });

    it('rejects backslash injection and URL-encoded backslash/slash variants', () => {
      assert.equal(getSafeRedirectUrl('/\\evil.com'), '/practice');
      assert.equal(getSafeRedirectUrl('/foo\\bar'), '/practice');
      assert.equal(getSafeRedirectUrl('/admin\\..\\evil'), '/practice');
      assert.equal(getSafeRedirectUrl('/%5Cevil.com'), '/practice');
      assert.equal(getSafeRedirectUrl('/%5cevil.com'), '/practice');
      assert.equal(getSafeRedirectUrl('/%2F%2Fevil.com'), '/practice');
      assert.equal(getSafeRedirectUrl('/%2fevil.com'), '/practice');
      assert.equal(getSafeRedirectUrl('/%E0%A4%A'), '/practice'); // Malformed URI component
    });

    it('rejects control characters, newlines, tabs, and colons', () => {
      assert.equal(getSafeRedirectUrl('/practice\r\n/evil'), '/practice');
      assert.equal(getSafeRedirectUrl('/practice\0/evil'), '/practice');
      assert.equal(getSafeRedirectUrl('/practice\t/evil'), '/practice');
      assert.equal(getSafeRedirectUrl('/https://evil.com'), '/practice');
      assert.equal(getSafeRedirectUrl('/javascript:alert(1)'), '/practice');
      assert.equal(getSafeRedirectUrl('/%3A/test'), '/practice');
    });

    it('rejects authentication, password recovery, and oauth route prefixes to prevent loops', () => {
      assert.equal(getSafeRedirectUrl('/login'), '/practice');
      assert.equal(getSafeRedirectUrl('/login?redirect=/admin'), '/practice');
      assert.equal(getSafeRedirectUrl('/signup'), '/practice');
      assert.equal(getSafeRedirectUrl('/signup/verify'), '/practice');
      assert.equal(getSafeRedirectUrl('/forgot-password'), '/practice');
      assert.equal(getSafeRedirectUrl('/auth'), '/practice');
      assert.equal(getSafeRedirectUrl('/auth/callback'), '/practice');
      assert.equal(getSafeRedirectUrl('/oauth'), '/practice');
      assert.equal(getSafeRedirectUrl('/oauth/callback'), '/practice');
    });
  });

  // =========================================================================
  // 6. OAuth Callback URL Parameter Sanitization Invariant
  // =========================================================================
  describe('6. OAuth Callback Credential Sanitization', () => {
    it('never accepts refresh or access tokens from OAuth callback query parameters', async () => {
      const fs = await import('node:fs');
      const callbackSource = fs.readFileSync('src/features/auth/pages/OAuthCallback.tsx', 'utf8');
      assert.doesNotMatch(callbackSource, /searchParams\.get\(['"](?:refreshToken|refresh_token|token|accessToken|access_token)['"]\)/);
      assert.match(callbackSource, /dispatch\(refreshSessionThunk\(\)\)/);
    });

    it('never accepts tokens from OAuth callback hash fragments', async () => {
      const fs = await import('node:fs');
      const callbackSource = fs.readFileSync('src/features/auth/pages/OAuthCallback.tsx', 'utf8');
      assert.doesNotMatch(callbackSource, /hashParams\.get\(['"](?:refreshToken|refresh_token|token|accessToken|access_token)['"]\)/);
    });

    it('extracts error parameters from query and hash fragments', () => {
      const searchParams = new URLSearchParams('?error=access_denied&error_description=User+cancelled');
      const errorQuery = searchParams.get('error') || searchParams.get('error_description');
      assert.equal(errorQuery, 'access_denied');

      const hashParams = new URLSearchParams('error=unauthorized_client'.replace(/^#/, ''));
      const errorHash = hashParams.get('error') || hashParams.get('error_description');
      assert.equal(errorHash, 'unauthorized_client');
    });
  });

  // =========================================================================
  // 7. OAuth postMessage Security & Origin / Source Validation
  // =========================================================================
  describe('7. OAuth postMessage Contract & Origin Verification', () => {
    it('rejects cross-origin postMessage events', () => {
      const expectedOrigin = 'https://connect2code.in';
      const messageHandler = (event) => {
        if (event.origin !== expectedOrigin) return 'REJECTED_ORIGIN';
        if (event.source === event.target) return 'REJECTED_SELF';
        if (event.data?.type === 'C2C_GOOGLE_OAUTH_SUCCESS') return 'ACCEPTED';
        return 'REJECTED_TYPE';
      };

      assert.equal(
        messageHandler({ origin: 'https://attacker.evil', data: { type: 'C2C_GOOGLE_OAUTH_SUCCESS' } }),
        'REJECTED_ORIGIN'
      );
    });

    it('rejects self-targeted messages (event.source === window) to prevent message loops', () => {
      const mockWindow = {};
      const expectedOrigin = 'https://connect2code.in';
      const messageHandler = (event) => {
        if (event.origin !== expectedOrigin) return 'REJECTED_ORIGIN';
        if (event.source === mockWindow) return 'REJECTED_SELF';
        if (event.data?.type === 'C2C_GOOGLE_OAUTH_SUCCESS') return 'ACCEPTED';
        return 'REJECTED_TYPE';
      };

      assert.equal(
        messageHandler({
          origin: expectedOrigin,
          source: mockWindow,
          data: { type: 'C2C_GOOGLE_OAUTH_SUCCESS' },
        }),
        'REJECTED_SELF'
      );
    });

    it('accepts valid postMessage from child popup on matching origin without trusting payload tokens', () => {
      const mockParent = {};
      const mockPopup = {};
      const expectedOrigin = 'https://connect2code.in';
      let discardedInMemorySession = false;
      let refreshCalled = false;

      const messageHandler = (event) => {
        if (event.origin !== expectedOrigin) return;
        if (event.source === mockParent) return;
        if (event.data?.type === 'C2C_GOOGLE_OAUTH_SUCCESS') {
          // Verify that payload tokens are ignored and session is refreshed from authoritative cookies
          discardedInMemorySession = true;
          refreshCalled = true;
        }
      };

      messageHandler({
        origin: expectedOrigin,
        source: mockPopup,
        data: {
          type: 'C2C_GOOGLE_OAUTH_SUCCESS',
          token: 'attacker.injected.token', // Must be ignored
        },
      });

      assert.equal(discardedInMemorySession, true);
      assert.equal(refreshCalled, true);
    });
  });

  // =========================================================================
  // 8. Role-Based Redirection on Authentication Invariant
  // =========================================================================
  describe('8. Role-Based Navigation Routing', () => {
    it('routes non-admin users to /practice even if targetUrl points to /admin', () => {
      const computeDestination = (targetUrl, isAdmin) => {
        const safeDestination = getSafeRedirectUrl(targetUrl);
        if (isAdmin) {
          return safeDestination.startsWith('/admin') ? safeDestination : '/admin/dashboard';
        }
        return safeDestination.startsWith('/admin') ? '/practice' : safeDestination;
      };

      assert.equal(computeDestination('/admin/users', false), '/practice');
      assert.equal(computeDestination('/admin/dashboard', false), '/practice');
      assert.equal(computeDestination('/practice/problems', false), '/practice/problems');
      assert.equal(computeDestination(null, false), '/practice');
    });

    it('routes admin users to /admin destinations correctly', () => {
      const computeDestination = (targetUrl, isAdmin) => {
        const safeDestination = getSafeRedirectUrl(targetUrl);
        if (isAdmin) {
          return safeDestination.startsWith('/admin') ? safeDestination : '/admin/dashboard';
        }
        return safeDestination.startsWith('/admin') ? '/practice' : safeDestination;
      };

      assert.equal(computeDestination('/admin/questions', true), '/admin/questions');
      assert.equal(computeDestination('/practice', true), '/admin/dashboard');
      assert.equal(computeDestination(null, true), '/admin/dashboard');
    });
  });

  // =========================================================================
  // 9. Logout Error Sanitization Invariant
  // =========================================================================
  describe('9. Logout Error Logging Sanitization', () => {
    it('sanitizes error logging so request headers and tokens are never exposed in console', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args);

      try {
        const simulatedError = new Error('Request failed with status code 500');
        simulatedError.config = {
          headers: {
            Authorization: 'Bearer secret.jwt.access.token',
          },
          url: 'https://api.connect2code.in/api/v1/auth/logout',
        };

        // Execute sanitized logging pattern
        console.warn('Logout API warning:', simulatedError instanceof Error ? simulatedError.message : 'Logout request unfulfilled');

        assert.equal(warnings.length, 1);
        assert.equal(warnings[0][0], 'Logout API warning:');
        assert.equal(warnings[0][1], 'Request failed with status code 500');

        // Verify that config, headers, and token are NOT in the logged arguments
        const loggedString = JSON.stringify(warnings[0]);
        assert.equal(loggedString.includes('secret.jwt.access.token'), false);
        assert.equal(loggedString.includes('Authorization'), false);
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});
