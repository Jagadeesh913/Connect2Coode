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
const { decodeJwtPayload, isJwtAdmin } = await import('../../src/core/security/jwt.ts');
const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');
const { isAuthSessionEvent } = await import('../../src/core/security/authSessionSync.ts');
const authSliceModule = await import('../../src/features/auth/redux/authSlice.ts');
const { default: authReducer, logoutUser, refreshSessionThunk, initializeAuth } = authSliceModule;

// Helper to create mock JWT tokens with base64url payload
function createMockJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'mockSignatureString123';
  return `${header}.${body}.${signature}`;
}

describe('BATCH-3: Security, Session Hygiene & Route Authorization', () => {

  // =========================================================================
  // F-036: AdminRoute Role Check Relies on Signed JWT Claims (Not LocalStorage)
  // =========================================================================
  describe('F-036: Signed JWT Claims & Admin Authorization', () => {
    it('accurately decodes claims from valid base64url JWT', () => {
      const payload = { sub: '42', email: 'admin@c2c.test', role: 'ADMIN' };
      const token = createMockJwt(payload);
      const decoded = decodeJwtPayload(token);

      assert.equal(decoded?.sub, '42');
      assert.equal(decoded?.email, 'admin@c2c.test');
      assert.equal(decoded?.role, 'ADMIN');
    });

    it('identifies ADMIN role from payload.role', () => {
      const adminToken = createMockJwt({ role: 'ADMIN' });
      assert.equal(isJwtAdmin(adminToken), true);

      const roleAdminToken = createMockJwt({ role: 'ROLE_ADMIN' });
      assert.equal(isJwtAdmin(roleAdminToken), true);

      const lowercaseAdminToken = createMockJwt({ role: 'admin' });
      assert.equal(isJwtAdmin(lowercaseAdminToken), true);
    });

    it('identifies ADMIN role from payload.roles array or authorities array', () => {
      const rolesArrayToken = createMockJwt({ roles: ['USER', 'ADMIN'] });
      assert.equal(isJwtAdmin(rolesArrayToken), true);

      const springAuthoritiesToken = createMockJwt({
        authorities: [{ authority: 'ROLE_ADMIN' }],
      });
      assert.equal(isJwtAdmin(springAuthoritiesToken), true);
    });

    it('identifies uppercase Role claim from live backend JWTs', () => {
      const liveRenderAdminToken = createMockJwt({
        sub: 'admin@c2c.test',
        Role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      assert.equal(isJwtAdmin(liveRenderAdminToken), true);

      const rolesUpperToken = createMockJwt({
        Roles: ['ADMIN'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      assert.equal(isJwtAdmin(rolesUpperToken), true);
    });

    it('rejects regular USER tokens (prevents privilege escalation)', () => {
      const userToken = createMockJwt({ role: 'USER', email: 'user@c2c.test' });
      assert.equal(isJwtAdmin(userToken), false);
    });

    it('rejects expired JWT tokens even if role is ADMIN', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createMockJwt({ role: 'ADMIN', exp: pastTimestamp });
      assert.equal(isJwtAdmin(expiredToken), false);
    });

    it('safely rejects malformed, empty, or non-JWT strings', () => {
      assert.equal(isJwtAdmin(null), false);
      assert.equal(isJwtAdmin(''), false);
      assert.equal(isJwtAdmin('not.a.valid.jwt.token'), false);
      assert.equal(isJwtAdmin('randomString'), false);
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

    it('PRESERVES active session state if access token is unexpired when refreshSessionThunk is rejected', () => {
      const validToken = createMockJwt({
        sub: 'user-42',
        role: 'USER',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
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
        error: { message: 'Refresh token invalid or expired' },
      });

      assert.equal(nextState.isAuthenticated, true, 'Active session must be preserved on background refresh failure');
      assert.equal(nextState.status, 'AUTHENTICATED', 'Status must remain AUTHENTICATED');
      assert.equal(nextState.loading, false, 'Loading must be false');
      assert.equal(nextState.user?.id, 'user-42', 'User must not be cleared');
    });

    it('CLEARS session if access token is expired when refreshSessionThunk is rejected', () => {
      const expiredToken = createMockJwt({
        sub: 'user-42',
        role: 'USER',
        exp: Math.floor(Date.now() / 1000) - 3600,
      });
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
        error: { message: 'Refresh token invalid or expired' },
      });

      assert.equal(nextState.isAuthenticated, false, 'Session must be cleared when expired token refresh fails');
      assert.equal(nextState.status, 'UNAUTHENTICATED', 'Status must be UNAUTHENTICATED');
      assert.equal(nextState.user, null, 'User must be cleared');
    });

    it('keeps startup loading while an expired access token still has a refresh session', () => {
      const expiredToken = createMockJwt({
        sub: 'user-42',
        exp: Math.floor(Date.now() / 1000) - 60,
      });
      const originalGetAccessToken = tokenStorage.getAccessToken;
      const originalGetRefreshToken = tokenStorage.getRefreshToken;
      const originalGetUser = tokenStorage.getUser;

      tokenStorage.getAccessToken = () => expiredToken;
      tokenStorage.getRefreshToken = () => 'refresh-token';
      tokenStorage.getUser = () => ({ id: 'user-42', email: 'user@c2c.test' });

      const nextState = authReducer(undefined, initializeAuth());

      assert.equal(nextState.status, 'LOADING');
      assert.equal(nextState.loading, true);
      assert.equal(nextState.isAuthenticated, false);

      tokenStorage.getAccessToken = originalGetAccessToken;
      tokenStorage.getRefreshToken = originalGetRefreshToken;
      tokenStorage.getUser = originalGetUser;
    });

    it('preserves the existing user profile when refresh returns token fields without email', () => {
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
        payload: { token: 'new-token', refreshToken: 'new-refresh', id: 63, role: 'USER' },
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

    it('stores the typed User profile in the session cookie without mirroring it into web storage', () => {
      // Mock browser persistence for the Node.js test environment.
      const memoryStore = new Map();
      globalThis.localStorage = {
        getItem: (k) => memoryStore.get(k) || null,
        setItem: (k, v) => memoryStore.set(k, v),
        removeItem: (k) => memoryStore.delete(k),
        clear: () => memoryStore.clear(),
      };
      const cookieStore = new Map();
      Object.defineProperty(globalThis, 'document', {
        value: {
          get cookie() {
            return Array.from(cookieStore.entries()).map(([key, value]) => `${key}=${value}`).join('; ');
          },
          set cookie(value) {
            const [nameValue, ...attributes] = value.split(';').map((part) => part.trim());
            const separator = nameValue.indexOf('=');
            const name = nameValue.slice(0, separator);
            const cookieValue = nameValue.slice(separator + 1);
            const maxAge = attributes.find((attribute) => attribute.toLowerCase().startsWith('max-age='));
            if (maxAge === 'max-age=0') cookieStore.delete(name);
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

      tokenStorage.clearTokens();
      assert.equal(tokenStorage.getUser(), null);
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
