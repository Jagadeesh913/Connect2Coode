import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Loader hook to resolve extensionless imports and mock apiClient
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } }, get: async () => ({}), post: async () => ({}), put: async () => ({}), patch: async () => ({}) }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
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

const { API_ENDPOINTS } = await import('../../src/core/api/endpoints.ts');
const { profileService } = await import('../../src/services/profileService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');

describe('BATCH-11: User Info & Profile API Contracts (GET/POST /userInfo/{userId})', () => {
  it('API_ENDPOINTS: accurately defines USER_INFO parameterized endpoint', () => {
    assert.equal(API_ENDPOINTS.USER.USER_INFO(68), '/userInfo/68');
    assert.equal(API_ENDPOINTS.USER.USER_INFO('101'), '/userInfo/101');
  });

  describe('profileService.getUserInfo', () => {
    it('handles "User profile not created yet" response with null data', async () => {
      let capturedUrl = '';
      apiClient.get = async (url) => {
        capturedUrl = url;
        return {
          statusCode: 200,
          message: 'User profile not created yet',
          data: null,
          errors: null,
          timestamp: '2026-10-12T23:24:27.0387946',
        };
      };

      const res = await profileService.getUserInfo(68);
      assert.equal(capturedUrl, '/userInfo/68');
      assert.equal(res.statusCode, 200);
      assert.equal(res.data, null);
      assert.equal(res.message, 'User profile not created yet');
    });

    it('handles existing user profile with academic details', async () => {
      let capturedUrl = '';
      apiClient.get = async (url) => {
        capturedUrl = url;
        return {
          statusCode: 200,
          message: 'User profile fetched successfully',
          data: {
            id: 1,
            userId: 68,
            regNumber: '22CS101',
            joinedYear: 2022,
            passedOutYear: 2026,
            college: 'ABC Engineering College',
            bio: 'Java developer and coding enthusiast',
          },
          errors: null,
          timestamp: '2026-10-12T23:29:58.3679181',
        };
      };

      const res = await profileService.getUserInfo(68);
      assert.equal(capturedUrl, '/userInfo/68');
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.id, 1);
      assert.equal(res.data.userId, 68);
      assert.equal(res.data.regNumber, '22CS101');
      assert.equal(res.data.joinedYear, 2022);
      assert.equal(res.data.passedOutYear, 2026);
      assert.equal(res.data.college, 'ABC Engineering College');
      assert.equal(res.data.bio, 'Java developer and coding enthusiast');
    });
  });

  describe('profileService.saveUserInfo', () => {
    it('sends POST /userInfo/{userId} with academic details payload', async () => {
      let capturedUrl = '';
      let capturedPayload = null;

      apiClient.post = async (url, payload) => {
        capturedUrl = url;
        capturedPayload = payload;
        return {
          statusCode: 200,
          message: 'User profile saved successfully',
          data: {
            id: 1,
            userId: 68,
            ...payload,
          },
          errors: null,
          timestamp: '2026-10-12T23:26:59.6955885',
        };
      };

      const payload = {
        regNumber: '22CS101',
        joinedYear: 2022,
        passedOutYear: 2026,
        college: 'ABC Engineering College',
        bio: 'Java developer and coding enthusiast',
      };

      const res = await profileService.saveUserInfo(68, payload);
      assert.equal(capturedUrl, '/userInfo/68');
      assert.deepEqual(capturedPayload, payload);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.id, 1);
      assert.equal(res.data.regNumber, '22CS101');
      assert.equal(res.data.college, 'ABC Engineering College');
    });
  });
});
