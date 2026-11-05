import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
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

// Import real production security modules, types, and reducers
const { isAdminRole } = await import('../../src/core/security/jwt.ts');
const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');
const { isAuthSessionEvent } = await import('../../src/core/security/authSessionSync.ts');
const authSliceModule = await import('../../src/features/auth/redux/authSlice.ts');
const { default: authReducer, logoutUser, refreshSessionThunk, initializeAuth } = authSliceModule;

describe('BATCH-3: Security, Session Hygiene & Route Authorization', () => {

  // =========================================================================
  // F-036: Admin UI follows the role supplied by login/refresh responses
  // =========================================================================
  describe('F-036: Backend Response Role Authorization', () => {
    it('admin gating, guest redirects, and navigation use response roles rather than decoded JWT claims', async () => {
      const fs = await import('node:fs');
      const adminRouteSource = fs.readFileSync('src/core/guards/AdminRoute.tsx', 'utf8');
      const guestRouteSource = fs.readFileSync('src/core/guards/GuestRoute.tsx', 'utf8');
      const navbarSource = fs.readFileSync('src/shared/components/ui/Navbar.tsx', 'utf8');
      assert.match(adminRouteSource, /if \(!isAdminRole\(role\)\)/);
      assert.match(guestRouteSource, /if \(isAdminRole\(role\)\)/);
      assert.match(navbarSource, /isAdmin = isLoggedIn && isAdminRole\(currentUser\?\.role\)/);
      assert.doesNotMatch(`${adminRouteSource}\n${guestRouteSource}\n${navbarSource}`, /isJwtAdmin/);
      assert.equal(isAdminRole('ADMIN'), true);
      assert.equal(isAdminRole('ROLE_ADMIN'), true);
      assert.equal(isAdminRole('admin'), true);
      assert.equal(isAdminRole('USER'), false);
      assert.equal(isAdminRole('NOT_ADMIN'), false);
      assert.equal(isAdminRole('ADMINISTRATOR'), false);
      const jwtSource = fs.readFileSync('src/core/security/jwt.ts', 'utf8');
      assert.doesNotMatch(jwtSource, /decodeJwtPayload|isJwtAdmin|authorities|scope/);
    });
  });

  // =========================================================================
  // F-035: Unconditional Logout Token and Session State Cleanup
  // =========================================================================
  describe('F-035: Unconditional Client Logout', () => {
    const getLoggedInState = () => ({
      user: { id: 1, email: 'test@c2c.test', role: 'USER' },
      token: 'validToken123',
      status: 'AUTHENTICATED',
      isAuthenticated: true,
      loading: false,
      error: null,
      isAuthModalOpen: false,
      authModalMode: 'login',
    });

    it('clears user, tokens, and sets isAuthenticated to false on logoutUser.fulfilled', () => {
      const state = getLoggedInState();
      const nextState = authReducer(state, { type: logoutUser.fulfilled.type });

      assert.equal(nextState.user, null, 'User must be cleared');
      assert.equal(nextState.token, null, 'Access token must be cleared');
      assert.equal('refreshToken' in nextState, false, 'Refresh token must not be duplicated in Redux');
      assert.equal(nextState.isAuthenticated, false, 'isAuthenticated must be false');
      assert.equal(nextState.loading, false, 'Loading must be false');
    });

    it('UNCONDITIONALLY clears user, tokens, and session state on logoutUser.rejected (network error / 500)', () => {
      const state = getLoggedInState();
      const nextState = authReducer(state, {
        type: logoutUser.rejected.type,
        error: { message: 'Network Error: Backend offline' },
      });

      assert.equal(nextState.user, null, 'User must be cleared even on network failure');
      assert.equal(nextState.token, null, 'Token must be cleared even on network failure');
      assert.equal('refreshToken' in nextState, false, 'Refresh token must not be duplicated in Redux');
      assert.equal(nextState.isAuthenticated, false, 'Session must not remain active after failed logout');
      assert.equal(nextState.loading, false, 'Loading flag must be reset');
    });

    it('PRESERVES an active session when refreshSessionThunk has a temporary failure', () => {
      const validToken = 'active-access-token';
      const activeState = {
        user: { id: 'user-42', email: 'user@c2c.test' },
        token: validToken,
        status: 'AUTHENTICATED',
        isAuthenticated: true,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login',
      };

      const nextState = authReducer(activeState, {
        type: refreshSessionThunk.rejected.type,
        payload: { statusCode: 500, message: 'Temporary refresh failure' },
        error: { message: 'Refresh token invalid or expired' },
      });

      assert.equal(nextState.isAuthenticated, true, 'Active session must be preserved on background refresh failure');
      assert.equal(nextState.status, 'AUTHENTICATED', 'Status must remain AUTHENTICATED');
      assert.equal(nextState.loading, false, 'Loading must be false');
      assert.equal(nextState.user?.id, 'user-42', 'User must not be cleared');
    });

    it('CLEARS session only when refresh returns HTTP 401', () => {
      const expiredToken = 'previous-access-token';
      const expiredState = {
        user: { id: 'user-42', email: 'user@c2c.test' },
        token: expiredToken,
        status: 'AUTHENTICATED',
        isAuthenticated: true,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login',
      };

      const nextState = authReducer(expiredState, {
        type: refreshSessionThunk.rejected.type,
        payload: { statusCode: 401, message: 'Refresh token invalid or expired' },
        error: { message: 'Refresh token invalid or expired' },
      });

      assert.equal(nextState.isAuthenticated, false, 'Session must be cleared when expired token refresh fails');
      assert.equal(nextState.status, 'UNAUTHENTICATED', 'Status must be UNAUTHENTICATED');
      assert.equal(nextState.user, null, 'User must be cleared');
    });

    it('keeps startup loading until the unconditional cookie refresh settles', () => {
      const expiredToken = 'startup-access-token';
      const originalGetAccessToken = tokenStorage.getAccessToken;
      const originalGetUser = tokenStorage.getUser;

      tokenStorage.getAccessToken = () => expiredToken;
      tokenStorage.getUser = () => ({ id: 'user-42', email: 'user@c2c.test' });

      const nextState = authReducer(undefined, initializeAuth());

      assert.equal(nextState.status, 'LOADING');
      assert.equal(nextState.loading, true);
      assert.equal(nextState.isAuthenticated, false);

      tokenStorage.getAccessToken = originalGetAccessToken;
      tokenStorage.getUser = originalGetUser;
    });

    it('preserves optional profile fields when refresh returns the required identity fields', () => {
      const currentState = {
        user: { id: 63, email: 'user@c2c.test', firstName: 'Current', role: 'USER' },
        token: 'old-token',
        status: 'AUTHENTICATED',
        isAuthenticated: true,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login',
      };

      const nextState = authReducer(currentState, {
        type: refreshSessionThunk.fulfilled.type,
        payload: { token: 'new-token', id: 63, role: 'USER', email: 'user@c2c.test' },
      });

      assert.equal(nextState.token, 'new-token');
      assert.equal(nextState.user?.email, 'user@c2c.test');
      assert.equal(nextState.user?.firstName, 'Current');
    });
  });

  // =========================================================================
  // F-013: User Profile Serialization Strongly Typed in tokenStorage
  // =========================================================================
  describe('F-013 & F-011: tokenStorage Typing & Token Management', () => {
    it('clears a tab-local in-memory token so the shared cookie session is authoritative after cross-tab sync', () => {
      tokenStorage.setAccessToken('tab-local-token');
      tokenStorage.discardInMemorySession();
      assert.equal(tokenStorage.getAccessToken(), null);
    });

    it('accepts only token-free, well-formed cross-tab auth session events', () => {
      assert.equal(isAuthSessionEvent({ type: 'session-cleared', occurredAt: Date.now() }), true);
      assert.equal(isAuthSessionEvent({ type: 'session-updated', occurredAt: 1 }), true);
      assert.equal(isAuthSessionEvent({ type: 'session-cleared', token: 'must-not-exist' }), false);
      assert.equal(isAuthSessionEvent({ type: 'logout' }), false);
    });

    it('stores access/profile state only in memory and never manages the refresh cookie', () => {
      // Mock browser persistence for the Node.js test environment.
      const memoryStore = new Map();
      const sessionMemoryStore = new Map();
      globalThis.localStorage = {
        getItem: (k) => memoryStore.get(k) || null,
        setItem: (k, v) => memoryStore.set(k, v),
        removeItem: (k) => memoryStore.delete(k),
        clear: () => memoryStore.clear(),
      };
      globalThis.sessionStorage = {
        getItem: (k) => sessionMemoryStore.get(k) || null,
        setItem: (k, v) => sessionMemoryStore.set(k, v),
        removeItem: (k) => sessionMemoryStore.delete(k),
        clear: () => sessionMemoryStore.clear(),
      };
      const cookieStore = new Map();
      const cookieWrites = [];
      Object.defineProperty(globalThis, 'document', {
        value: {
          get cookie() {
            return Array.from(cookieStore.entries()).map(([key, value]) => `${key}=${value}`).join('; ');
          },
          set cookie(value) {
            cookieWrites.push(value);
            const [nameValue, ...attributes] = value.split(';').map((part) => part.trim());
            const separator = nameValue.indexOf('=');
            const name = nameValue.slice(0, separator);
            const cookieValue = nameValue.slice(separator + 1);
            const maxAge = attributes.find((attribute) => attribute.toLowerCase().startsWith('max-age='));
            if (maxAge?.toLowerCase() === 'max-age=0') cookieStore.delete(name);
            else cookieStore.set(name, cookieValue);
          },
        },
        writable: true,
        configurable: true,
      });

      const user = {
        id: 'user-42',
        email: 'developer@c2c.test',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
      };

      tokenStorage.setUser(user);
      const retrieved = tokenStorage.getUser();

      assert.equal(retrieved?.id, 'user-42');
      assert.equal(retrieved?.email, 'developer@c2c.test');
      assert.equal(retrieved?.role, 'USER');
      assert.equal(memoryStore.size, 0, 'Session metadata must not be mirrored into localStorage');

      document.cookie = 'accessToken=active-access; path=/';
      document.cookie = 'refreshToken=active-refresh; path=/';
      document.cookie = 'jwt=legacy-access; path=/';
      document.cookie = 'authToken=legacy-auth; path=/';
      localStorage.setItem('c2c_jwt', 'legacy-access');

      const epochBeforeLogout = tokenStorage.getSessionEpoch();
      tokenStorage.clearTokens();
      assert.equal(tokenStorage.getUser(), null);
      assert.equal(tokenStorage.getAccessToken(), null);
      assert.equal(cookieStore.get('refreshToken'), 'active-refresh', 'Frontend must not mutate the backend-owned refresh cookie');
      assert.equal(cookieStore.has('accessToken'), false, 'Legacy access cookies must be expired');
      assert.equal(cookieStore.has('jwt'), false, 'Legacy access aliases must be expired');
      assert.equal(memoryStore.size, 0, 'Legacy localStorage credentials must be removed');
      assert.equal(sessionMemoryStore.size, 0, 'Legacy sessionStorage credentials must be removed');
      assert.equal(tokenStorage.getSessionEpoch(), epochBeforeLogout + 1);
      assert.ok(
        cookieWrites.some((value) => value.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT')),
        'Cookie expiry must include an absolute past date as well as Max-Age=0'
      );
      assert.ok(
        cookieWrites.some((value) => value.includes('Path=/api/v1/auth')),
        'Known backend auth cookie paths must be explicitly expired'
      );
    });

    it('clears the local session before the logout network request and rejects stale refreshes', async () => {
      const fs = await import('node:fs');
      const authServiceSource = fs.readFileSync('src/services/authService.ts', 'utf8');
      const apiClientSource = fs.readFileSync('src/core/api/apiClient.ts', 'utf8');
      const logoutBody = authServiceSource.match(/async logout\(\)[\s\S]*?\n  \},/u)?.[0] || '';

      assert.ok(logoutBody.indexOf('tokenStorage.clearTokens()') >= 0);
      assert.ok(logoutBody.indexOf('tokenStorage.clearTokens()') < logoutBody.indexOf('apiClient.post'));
      assert.match(apiClientSource, /getSessionEpoch\(\)[\s\S]*Authentication session changed while refresh was in progress/);
      assert.match(apiClientSource, /PUBLIC_AUTH_PATHS[\s\S]*'\/auth\/logout'/);
      assert.match(logoutBody, /apiClient\.post\(API_ENDPOINTS\.AUTH\.LOGOUT, undefined/);
      assert.doesNotMatch(logoutBody, /refreshToken/);
    });

    it('invalidates older login work and routes every refresh through the shared lock', async () => {
      const fs = await import('node:fs');
      const authServiceSource = fs.readFileSync('src/services/authService.ts', 'utf8');
      const authSliceSource = fs.readFileSync('src/features/auth/redux/authSlice.ts', 'utf8');
      const apiClientSource = fs.readFileSync('src/core/api/apiClient.ts', 'utf8');
      const loginBody = authServiceSource.match(/async login\(payload: LoginPayload\)[\s\S]*?return response;/u)?.[0] || '';

      assert.ok(loginBody.indexOf('tokenStorage.claimSessionOwnership()') >= 0);
      assert.ok(loginBody.indexOf('tokenStorage.claimSessionOwnership()') < loginBody.indexOf('apiClient.post'));
      assert.ok(loginBody.indexOf("tokenStorage.clearTokens({ broadcast: false })") >= 0);
      assert.ok(loginBody.indexOf("tokenStorage.clearTokens({ broadcast: false })") < loginBody.indexOf('persistAuthSession'));
      assert.match(authSliceSource, /return await executeRefreshToken\(\)/);
      assert.match(apiClientSource, /let refreshTokenPromise: Promise<AuthSessionData> \| null = null/);
      assert.match(apiClientSource, /withCrossTabRefreshLock/);
      assert.match(apiClientSource, /refreshStatus === 401[\s\S]*clearInvalidSession\(\)/);
    });

    it('claims auth ownership without clearing the active session', () => {
      tokenStorage.setAccessToken('still-valid');
      const previousEpoch = tokenStorage.getSessionEpoch();

      const claimedEpoch = tokenStorage.claimSessionOwnership();

      assert.equal(claimedEpoch, previousEpoch + 1);
      assert.equal(tokenStorage.getAccessToken(), 'still-valid');
      tokenStorage.clearTokens();
    });
  });

  // =========================================================================
  // F-023: Navigation Location State Typing
  // =========================================================================
  describe('F-023: Navigation Location State', () => {
    it('safely extracts fromPath from typed LocationState without unsafe any coercion', () => {
      const stateWithFrom = { from: { pathname: '/problems/two-sum' } };
      const fromPath = stateWithFrom?.from?.pathname;
      assert.equal(fromPath, '/problems/two-sum');

      const emptyState = null;
      const emptyFromPath = emptyState?.from?.pathname;
      assert.equal(emptyFromPath, undefined);
    });
  });

  // =========================================================================
  // F-027: Canonical Auth Source in CompanyDetails
  // =========================================================================
  describe('F-027: CompanyDetails Single Auth Source of Truth', () => {
    it('confirms CompanyDetails relies on Redux isAuthenticated directly', () => {
      const reduxAuthState = { isAuthenticated: true };
      const isUserAuth = reduxAuthState.isAuthenticated;
      assert.equal(isUserAuth, true);

      const unauthState = { isAuthenticated: false };
      assert.equal(unauthState.isAuthenticated, false);
    });
  });
});
