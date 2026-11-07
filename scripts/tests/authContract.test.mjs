import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const axiosStub = `
let postImpl = async () => ({ data: {} });
export const postCalls = [];
export const requestHandlers = [];
export const responseErrorHandlers = [];
export function setPostImpl(next) { postImpl = next; }
export function resetPostCalls() { postCalls.length = 0; }
function create() {
  const client = async () => ({});
  client.interceptors = {
    request: { use: (fulfilled) => requestHandlers.push(fulfilled) },
    response: { use: (_fulfilled, rejected) => responseErrorHandlers.push(rejected) },
  };
  return client;
}
const axios = {
  create,
  isCancel: () => false,
  post: (...args) => {
    postCalls.push(args);
    return postImpl(...args);
  },
};
export default axios;
export const AxiosInstance = {};
export const AxiosResponse = {};
export const InternalAxiosRequestConfig = {};
`;

const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent(${JSON.stringify(axiosStub)})
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return nextResolve(specifier + '.ts', context);
    }
    throw error;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const axiosModule = await import('axios');
const {
  apiClient,
  executeRefreshToken,
  registerAuthFailureListener,
} = await import('../../src/core/api/apiClient.ts');
const { authService } = await import('../../src/services/authService.ts');
const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');
const { getUserFromAuthSession, requireAuthSessionData } = await import('../../src/core/security/authContract.ts');
const { withCrossTabRefreshLock } = await import('../../src/core/security/refreshCoordinator.ts');
const { userScopedStorage } = await import('../../src/core/storage/userScopedStorage.ts');

const setNavigator = (value) => {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value });
};

setNavigator({
  locks: {
    request: (_name, _options, callback) => callback(),
  },
});

it('forces public signup to USER even when an untyped caller supplies another role', async () => {
  const originalPost = apiClient.post;
  let capturedPayload;
  try {
    apiClient.post = async (_url, payload) => {
      capturedPayload = payload;
      return { statusCode: 200, message: 'Created', data: {} };
    };
    await authService.signUp({
      firstName: 'A',
      lastName: 'User',
      email: 'a.user@example.test',
      password: 'example-password',
      role: 'ADMIN',
    });
    assert.equal(capturedPayload.role, 'USER');
  } finally {
    apiClient.post = originalPost;
  }
});

it('normalizes the login accessToken alias before persisting or returning the session', async () => {
  const originalPost = apiClient.post;
  tokenStorage.clearTokens({ broadcast: false });
  try {
    apiClient.post = async () => ({
      statusCode: 200,
      message: 'Login Successful',
      data: {
        accessToken: 'login-access-token',
        user: { id: 7, role: 'USER', email: 'login@c2c.test' },
      },
    });
    const response = await authService.login({ email: 'login@c2c.test', password: 'example-password' });
    assert.equal(response.data?.token, 'login-access-token');
    assert.equal('accessToken' in response.data, false);
    assert.equal(tokenStorage.getAccessToken(), 'login-access-token');
    assert.equal(tokenStorage.getUser()?.email, 'login@c2c.test');
  } finally {
    apiClient.post = originalPost;
    tokenStorage.clearTokens({ broadcast: false });
  }
});

const installMemoryStorage = () => {
  const values = new Map();
  globalThis.localStorage = {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
};

describe('Backend-owned refresh-cookie authentication contract', () => {
  it('shares one bodyless refresh request across concurrent callers', async () => {
    axiosModule.resetPostCalls();
    let resolveRefresh;
    axiosModule.setPostImpl(() => new Promise((resolve) => {
      resolveRefresh = resolve;
    }));

    const first = executeRefreshToken();
    const second = executeRefreshToken();
    await Promise.resolve();

    assert.equal(axiosModule.postCalls.length, 1);
    assert.equal(axiosModule.postCalls[0][0], 'https://api.connect2code.in/api/v1/auth/refresh');
    assert.equal(axiosModule.postCalls[0][1], undefined, 'Refresh token must not be sent in the body');
    assert.equal(axiosModule.postCalls[0][2].withCredentials, true);

    resolveRefresh({
      data: {
        statusCode: 200,
        data: {
          accessToken: 'new-access-token',
          user: {
            id: 42,
            email: 'user@c2c.test',
            role: 'USER',
            refreshToken: 'must-not-enter-user-state',
          },
        },
      },
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);
    assert.equal(firstResult.token, 'new-access-token');
    assert.equal(secondResult.token, 'new-access-token');
    assert.equal(tokenStorage.getAccessToken(), 'new-access-token');
    assert.equal(tokenStorage.getUser()?.role, 'USER');
    assert.equal('accessToken' in firstResult, false);
    assert.equal('refreshToken' in tokenStorage.getUser(), false);
  });

  it('preserves the active in-memory session when refresh fails temporarily', async () => {
    tokenStorage.setAccessToken('still-active');
    tokenStorage.setUser({ id: 42, email: 'user@c2c.test', role: 'USER' });
    axiosModule.setPostImpl(async () => {
      throw { response: { status: 500, data: { message: 'Temporary failure' } } };
    });

    await assert.rejects(() => executeRefreshToken());
    assert.equal(tokenStorage.getAccessToken(), 'still-active');
    assert.equal(tokenStorage.getUser()?.id, 42);
  });

  it('clears the in-memory session when refresh returns HTTP 401', async () => {
    installMemoryStorage();
    tokenStorage.setAccessToken('expired-access');
    tokenStorage.setUser({ id: 42, email: 'user@c2c.test', role: 'USER' });
    userScopedStorage.setItem('problem_progress', '{"1":true}');
    userScopedStorage.setItem('theme_pref', 'dark');
    axiosModule.setPostImpl(async () => {
      throw { response: { status: 401, data: { message: 'Refresh cookie expired' } } };
    });

    await assert.rejects(() => executeRefreshToken());
    assert.equal(tokenStorage.getAccessToken(), null);
    assert.equal(tokenStorage.getUser(), null);
    tokenStorage.setUser({ id: 42, email: 'user@c2c.test', role: 'USER' });
    assert.equal(userScopedStorage.getItem('problem_progress'), null);
    assert.equal(userScopedStorage.getItem('theme_pref'), 'dark');
    tokenStorage.clearTokens();
  });

  it('does not let a stale refresh 401 clear or notify failure after a newer login succeeds', async () => {
    axiosModule.resetPostCalls();
    tokenStorage.clearTokens();

    let rejectRefresh;
    axiosModule.setPostImpl(() => new Promise((_resolve, reject) => {
      rejectRefresh = reject;
    }));

    let authFailureNotifications = 0;
    const unregisterFailure = registerAuthFailureListener(() => {
      authFailureNotifications += 1;
    });
    const originalPost = apiClient.post;

    try {
      const staleRefresh = executeRefreshToken();
      await Promise.resolve();

      apiClient.post = async () => ({
        statusCode: 200,
        message: 'Login Successful',
        data: {
          accessToken: 'new-login-access-token',
          user: {
            id: 84,
            email: 'new-login@c2c.test',
            role: 'USER',
          },
        },
      });
      await authService.login({
        email: 'new-login@c2c.test',
        password: 'valid-password',
      });

      rejectRefresh({
        response: { status: 401, data: { message: 'Older refresh cookie was rejected' } },
      });
      await assert.rejects(() => staleRefresh);

      assert.equal(tokenStorage.getAccessToken(), 'new-login-access-token');
      assert.equal(tokenStorage.getUser()?.id, 84);
      assert.equal(authFailureNotifications, 0);
    } finally {
      apiClient.post = originalPost;
      unregisterFailure();
      tokenStorage.clearTokens();
    }
  });

  it('keeps startup, retry, OAuth, and role decisions aligned with the contract', async () => {
    const fs = await import('node:fs');
    const apiClientSource = fs.readFileSync('src/core/api/apiClient.ts', 'utf8');
    const layoutSource = fs.readFileSync('src/layouts/AppRouterLayout.tsx', 'utf8');
    const loginSource = fs.readFileSync('src/features/auth/pages/Login.tsx', 'utf8');
    const callbackSource = fs.readFileSync('src/features/auth/pages/OAuthCallback.tsx', 'utf8');

    assert.match(apiClientSource, /const isAuthFailure = status === 401;/);
    assert.doesNotMatch(apiClientSource, /status === 401 \|\| status === 403/);
    assert.doesNotMatch(apiClientSource, /Proactively Refresh|isTokenValid\(token\)/);
    assert.match(layoutSource, /dispatch\(initializeAuth\(\)\);\s*dispatch\(refreshSessionThunk\(\)\);/);
    assert.match(
      fs.readFileSync('src/core/guards/GuestRoute.tsx', 'utf8'),
      /<SessionRecoveryState allowSignIn \/>/,
      'A temporary startup refresh failure must not permanently hide the login UI'
    );
    assert.match(
      fs.readFileSync('src/features/auth/components/SessionRecoveryState.tsx', 'utf8'),
      /tokenStorage\.clearTokens\(\);[\s\S]*dispatch\(setUnauthenticatedSession\(\)\)/,
      'The guest recovery gate must provide an explicit account-replacement path'
    );
    assert.match(loginSource, /isAdminRole\(userObj\?\.user\?\.role \|\| userObj\?\.role\)/);
    assert.match(callbackSource, /dispatch\(refreshSessionThunk\(\)\)/);
    assert.doesNotMatch(`${loginSource}\n${callbackSource}`, /isJwtAdmin/);
  });

  it('routes login validation through the submit handler instead of browser-native validation', async () => {
    const fs = await import('node:fs');
    const loginSource = fs.readFileSync('src/features/auth/pages/Login.tsx', 'utf8');
    const loginForm = loginSource.match(
      /<form[^>]*onSubmit=\{handleSubmitLogin\(onLoginSubmit\)\}[^>]*>[\s\S]*?<\/form>/u
    )?.[0];

    assert.ok(loginForm, 'The login form must remain connected to React Hook Form');
    assert.match(
      loginForm,
      /<form[^>]*\bnoValidate\b[^>]*>/u,
      'Browser-native validation must not bypass the submit handler and its visible Zod errors'
    );
    assert.doesNotMatch(
      loginForm,
      /<input[^>]*\brequired(?:\s|=|>)/u,
      'Login fields must rely on the shared schema instead of duplicate native required rules'
    );
  });

  it('rejects login or refresh payloads that cannot restore identity and role', () => {
    assert.throws(
      () => requireAuthSessionData({ token: 'token-only' }),
      /missing token or required identity fields/
    );
    assert.throws(
      () => requireAuthSessionData({ id: 1, role: 'ADMIN', email: 'admin@c2c.test' }),
      /missing token or required identity fields/
    );
    assert.deepEqual(
      requireAuthSessionData({ token: 'jwt', id: 1, role: 'ADMIN', email: 'admin@c2c.test' }),
      { token: 'jwt', id: 1, role: 'ADMIN', email: 'admin@c2c.test', firstName: undefined, lastName: undefined, fullName: undefined, avatarUrl: undefined, isDarkTheme: undefined }
    );
    assert.deepEqual(
      requireAuthSessionData({ accessToken: 'jwt-alias', id: 3, role: 'USER', email: 'user@c2c.test' }),
      { token: 'jwt-alias', id: 3, role: 'USER', email: 'user@c2c.test', firstName: undefined, lastName: undefined, fullName: undefined, avatarUrl: undefined, isDarkTheme: undefined }
    );
    const nested = requireAuthSessionData({
      token: 'jwt',
      user: {
        id: 2,
        role: 'USER',
        email: 'user@c2c.test',
        avatarUrl: 'https://cdn.c2c.test/avatar.png',
        refreshToken: 'must-not-enter-profile-state',
      },
    });
    assert.equal(nested.user?.avatarUrl, 'https://cdn.c2c.test/avatar.png');
    assert.equal('refreshToken' in nested.user, false);
  });

  it('projects flat session payloads into credential-free user state', () => {
    const session = requireAuthSessionData({
      token: 'sensitive-access-token',
      refreshToken: 'sensitive-refresh-token',
      id: 42,
      role: 'USER',
      email: 'user@c2c.test',
      firstName: 'Test',
    });
    const user = getUserFromAuthSession(session);
    assert.deepEqual(user, {
      id: 42,
      role: 'USER',
      email: 'user@c2c.test',
      firstName: 'Test',
      lastName: undefined,
      fullName: undefined,
      avatarUrl: undefined,
      isDarkTheme: undefined,
    });
    assert.equal('token' in user, false);
    assert.equal('accessToken' in user, false);
    assert.equal('refreshToken' in user, false);
  });

  it('attaches Bearer auth to institution search and applies protected 401 refresh policy', async () => {
    const fs = await import('node:fs');
    const institutionServiceSource = fs.readFileSync('src/services/institutionService.ts', 'utf8');
    assert.match(
      institutionServiceSource,
      /INSTITUTION\.PUBLIC\.SEARCH[\s\S]*authPolicy:\s*'protected'/,
      'Institution search must explicitly use protected authentication'
    );

    tokenStorage.setAccessToken('in-memory-token');
    const requestHandler = axiosModule.requestHandlers[0];
    const publicConfig = await requestHandler({
      url: '/auth/login',
      authPolicy: 'public',
      headers: {},
    });
    const institutionConfig = await requestHandler({
      url: '/institutions/search',
      authPolicy: 'protected',
      headers: {},
    });
    assert.equal(publicConfig.headers.Authorization, undefined);
    assert.equal(institutionConfig.headers.Authorization, 'Bearer in-memory-token');

    axiosModule.resetPostCalls();
    const responseErrorHandler = axiosModule.responseErrorHandlers[0];
    axiosModule.setPostImpl(async () => ({
      data: {
        statusCode: 200,
        data: { token: 'refreshed-token', id: 42, email: 'user@c2c.test', role: 'USER' },
      },
    }));
    const failedInstitutionRequest = {
      url: '/institutions/search',
      authPolicy: 'protected',
      headers: {},
    };
    await responseErrorHandler({
      config: failedInstitutionRequest,
      response: { status: 401, data: { message: 'Expired access token' } },
      message: 'Unauthorized',
    });
    assert.equal(axiosModule.postCalls.length, 1, 'Protected institution 401 must attempt one refresh');
    assert.equal(axiosModule.postCalls[0][0], 'https://api.connect2code.in/api/v1/auth/refresh');
    assert.equal(failedInstitutionRequest.headers.Authorization, 'Bearer refreshed-token');

    axiosModule.resetPostCalls();
    await assert.rejects(() => responseErrorHandler({
      config: { url: '/auth/login', authPolicy: 'public' },
      response: { status: 401, data: { message: 'Public request denied' } },
      message: 'Unauthorized',
    }));
    assert.equal(axiosModule.postCalls.length, 0);

    await assert.rejects(() => responseErrorHandler({
      config: { url: '/questions', authPolicy: 'protected' },
      response: { status: 403, data: { message: 'Forbidden' } },
      message: 'Forbidden',
    }));
    await assert.rejects(() => responseErrorHandler({
      config: { url: '/questions', authPolicy: 'protected', _retry: true },
      response: { status: 401, data: { message: 'Unauthorized' } },
      message: 'Unauthorized',
    }));
    assert.equal(axiosModule.postCalls.length, 0, '403 and already-retried 401 responses must never refresh');
  });

  it('routes refresh work through one exclusive browser lock across concurrent tab callers', async () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    let lockQueue = Promise.resolve();
    let active = 0;
    let maxActive = 0;
    const lockNames = [];
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        locks: {
          request(name, options, callback) {
            lockNames.push([name, options.mode]);
            const run = lockQueue.then(async () => {
              active += 1;
              maxActive = Math.max(maxActive, active);
              await new Promise((resolve) => setTimeout(resolve, 5));
              try { return await callback(); } finally { active -= 1; }
            });
            lockQueue = run.catch(() => undefined);
            return run;
          },
        },
      },
    });

    try {
      const results = await Promise.all([
        withCrossTabRefreshLock(async () => 'tab-a'),
        withCrossTabRefreshLock(async () => 'tab-b'),
      ]);
      assert.deepEqual(results, ['tab-a', 'tab-b']);
      assert.equal(maxActive, 1);
      assert.deepEqual(lockNames, [
        ['c2c-auth-refresh', 'exclusive'],
        ['c2c-auth-refresh', 'exclusive'],
      ]);
    } finally {
      if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
      else delete globalThis.navigator;
    }
  });

  it('fails safely without Web Locks and never runs an uncoordinated refresh task', async () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    let taskCalls = 0;
    setNavigator({});
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => { throw new Error('Storage denied'); },
        setItem: () => { throw new Error('Storage denied'); },
      },
    });

    try {
      await assert.rejects(
        () => withCrossTabRefreshLock(async () => { taskCalls += 1; }),
        /Secure cross-tab session refresh is unavailable/
      );
      assert.equal(taskCalls, 0);
    } finally {
      if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
      else delete globalThis.navigator;
      if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
      else delete globalThis.localStorage;
    }
  });

  it('clears protected persisted data for the prior user while preserving theme preference', () => {
    installMemoryStorage();
    const user = { id: 7, email: 'user@c2c.test', role: 'USER' };
    tokenStorage.setUser(user);
    userScopedStorage.setItem('problem_progress', '{"1":true}');
    userScopedStorage.setItem('myjo_bookmarks', '[]');
    userScopedStorage.setItem('problem_code_draft_1_7', 'source');
    userScopedStorage.setItem('theme_pref', 'dark');

    userScopedStorage.clearForUser(user, { preserveKeys: ['theme_pref'] });

    assert.equal(userScopedStorage.getItem('problem_progress'), null);
    assert.equal(userScopedStorage.getItem('myjo_bookmarks'), null);
    assert.equal(userScopedStorage.getItem('problem_code_draft_1_7'), null);
    assert.equal(userScopedStorage.getItem('theme_pref'), 'dark');

    userScopedStorage.setItem('problem_progress', '{"2":true}');
    tokenStorage.removeUser();
    userScopedStorage.clearForUser(null, { preserveKeys: ['theme_pref'] });
    tokenStorage.setUser(user);
    assert.equal(userScopedStorage.getItem('problem_progress'), null);
    assert.equal(userScopedStorage.getItem('theme_pref'), 'dark');
  });

  it('keeps accounts isolated even when their legacy 32-bit scope hashes collide', () => {
    installMemoryStorage();
    const firstUser = { id: 'vyvfha1cvvv8l', email: 'first@c2c.test', role: 'USER' };
    const secondUser = { id: 'qia85adwygw5', email: 'second@c2c.test', role: 'USER' };

    tokenStorage.setUser(firstUser);
    userScopedStorage.setItem('problem_progress', 'first-account');
    tokenStorage.setUser(secondUser);
    assert.equal(userScopedStorage.getItem('problem_progress'), null);
    userScopedStorage.setItem('problem_progress', 'second-account');

    tokenStorage.setUser(firstUser);
    assert.equal(userScopedStorage.getItem('problem_progress'), 'first-account');
    tokenStorage.setUser(secondUser);
    assert.equal(userScopedStorage.getItem('problem_progress'), 'second-account');
  });

  it('keeps OAuth refresh failures generic and removes hardcoded problem samples', async () => {
    const fs = await import('node:fs');
    const callbackSource = fs.readFileSync('src/features/auth/pages/OAuthCallback.tsx', 'utf8');
    const testCaseSource = fs.readFileSync('src/features/admin/utils/testCaseUtils.ts', 'utf8');
    assert.doesNotMatch(callbackSource, /result\.payload\?\.message|err\?\.message/);
    assert.doesNotMatch(testCaseSource, /getStandardSampleCases|1 4 3 2 6 5|10 20 30 40/);
  });
});
