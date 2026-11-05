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
const { executeRefreshToken } = await import('../../src/core/api/apiClient.ts');
const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');
const { requireAuthSessionData } = await import('../../src/core/security/authContract.ts');
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
          token: 'new-access-token',
          id: 42,
          email: 'user@c2c.test',
          role: 'USER',
        },
      },
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);
    assert.equal(firstResult.token, 'new-access-token');
    assert.equal(secondResult.token, 'new-access-token');
    assert.equal(tokenStorage.getAccessToken(), 'new-access-token');
    assert.equal(tokenStorage.getUser()?.role, 'USER');
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
    assert.match(loginSource, /isAdminRole\(userObj\?\.user\?\.role \|\| userObj\?\.role\)/);
    assert.match(callbackSource, /dispatch\(refreshSessionThunk\(\)\)/);
    assert.doesNotMatch(`${loginSource}\n${callbackSource}`, /isJwtAdmin/);
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

  it('uses explicit request auth policy and never refreshes public HTTP 401 responses', async () => {
    tokenStorage.setAccessToken('in-memory-token');
    const requestHandler = axiosModule.requestHandlers[0];
    const publicConfig = await requestHandler({
      url: '/institutions/search',
      authPolicy: 'public',
      headers: {},
    });
    const protectedConfig = await requestHandler({
      url: '/questions',
      authPolicy: 'protected',
      headers: {},
    });
    assert.equal(publicConfig.headers.Authorization, undefined);
    assert.equal(protectedConfig.headers.Authorization, 'Bearer in-memory-token');

    axiosModule.resetPostCalls();
    const responseErrorHandler = axiosModule.responseErrorHandlers[0];
    await assert.rejects(() => responseErrorHandler({
      config: { url: '/institutions/search', authPolicy: 'public' },
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

  it('keeps OAuth refresh failures generic and removes hardcoded problem samples', async () => {
    const fs = await import('node:fs');
    const callbackSource = fs.readFileSync('src/features/auth/pages/OAuthCallback.tsx', 'utf8');
    const testCaseSource = fs.readFileSync('src/features/admin/utils/testCaseUtils.ts', 'utf8');
    assert.doesNotMatch(callbackSource, /result\.payload\?\.message|err\?\.message/);
    assert.doesNotMatch(testCaseSource, /getStandardSampleCases|1 4 3 2 6 5|10 20 30 40/);
  });
});
