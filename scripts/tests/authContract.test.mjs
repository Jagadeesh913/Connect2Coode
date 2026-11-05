import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const axiosStub = `
let postImpl = async () => ({ data: {} });
export const postCalls = [];
export function setPostImpl(next) { postImpl = next; }
export function resetPostCalls() { postCalls.length = 0; }
function create() {
  const client = async () => ({});
  client.interceptors = {
    request: { use: () => undefined },
    response: { use: () => undefined },
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
    tokenStorage.setAccessToken('expired-access');
    tokenStorage.setUser({ id: 42, email: 'user@c2c.test', role: 'USER' });
    axiosModule.setPostImpl(async () => {
      throw { response: { status: 401, data: { message: 'Refresh cookie expired' } } };
    });

    await assert.rejects(() => executeRefreshToken());
    assert.equal(tokenStorage.getAccessToken(), null);
    assert.equal(tokenStorage.getUser(), null);
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
});
