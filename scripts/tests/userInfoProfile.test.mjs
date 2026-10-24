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
const { companyService } = await import('../../src/services/companyService.ts');
const { adminCompanyService } = await import('../../src/services/admin/adminCompanyService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');
const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');

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

    it('scopes a valid profile response to the requested user when userId is omitted', async () => {
      apiClient.get = async () => ({
        statusCode: 200,
        data: { id: 7, regNumber: 'C2C-89', college: 'Example College' },
      });

      const res = await profileService.getUserInfo(89);
      assert.equal(res.data.userId, 89);
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
            ...payload,
            id: 1,
            userId: 68,
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

      tokenStorage.setAccessToken('mock_session_jwt_token_123');
      const res = await profileService.saveUserInfo(68, payload);
      assert.equal(capturedUrl, '/userInfo/68');
      assert.equal(capturedPayload.userId, 68);
      assert.equal(capturedPayload.regNumber, '22CS101');
      assert.equal(capturedPayload.college, 'ABC Engineering College');
      assert.equal(capturedPayload.jwtToken, 'mock_session_jwt_token_123');
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.id, 1);
      assert.equal(res.data.regNumber, '22CS101');
      assert.equal(res.data.college, 'ABC Engineering College');
    });

    it('sends POST /userInfo/{userId} matching exact contract (userId: 89, regNumber, collegeId, gender, dob, jwtToken)', async () => {
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
            userId: 89,
            firstName: 'connecttocodetechsolutions',
            lastName: null,
            regNumber: '192G1A0497',
            joinedYear: 2024,
            passedOutYear: 2028,
            collegeName:
              'Ambaba Commerce College, Maniba Institute of Business Management & Deviba Institute of Computer Application',
            collegeId: 2250,
            bio: 'just for test',
            gender: { id: 102, refGroupCode: 'GENDER', refCode: 'MALE', refName: 'Male', isActive: true },
            dob: '2002-01-14',
          },
          errors: null,
          timestamp: '2026-10-22T14:56:51.2029399',
        };
      };

      const payload = {
        id: null,
        userId: 89,
        regNumber: '192G1A0497',
        joinedYear: 2024,
        passedOutYear: 2028,
        college: 'Anantha Lakshmi Institute of Technology & Sciences',
        collegeId: '2250',
        bio: 'just for test',
        gender: { id: 102, refGroupCode: 'GENDER', refCode: 'MALE', refName: 'Male', isActive: true },
        dob: '2002-01-14',
      };

      tokenStorage.setAccessToken('sample_access_jwt_token_xyz');
      const res = await profileService.saveUserInfo(89, payload);

      assert.equal(capturedUrl, '/userInfo/89');
      assert.equal(capturedPayload.id, null);
      assert.equal(capturedPayload.userId, 89);
      assert.equal(capturedPayload.regNumber, '192G1A0497');
      assert.equal(capturedPayload.joinedYear, 2024);
      assert.equal(capturedPayload.passedOutYear, 2028);
      assert.equal(capturedPayload.college, 'Anantha Lakshmi Institute of Technology & Sciences');
      assert.equal(capturedPayload.collegeId, '2250');
      assert.equal(capturedPayload.bio, 'just for test');
      assert.deepEqual(capturedPayload.gender, {
        id: 102,
        refGroupCode: 'GENDER',
        refCode: 'MALE',
        refName: 'Male',
        isActive: true,
      });
      assert.equal(capturedPayload.dob, '2002-01-14');
      assert.equal(capturedPayload.jwtToken, 'sample_access_jwt_token_xyz');
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.id, 1);
      assert.equal(
        res.data.collegeName,
        'Ambaba Commerce College, Maniba Institute of Business Management & Deviba Institute of Computer Application'
      );
      assert.equal(res.data.collegeId, 2250);
    });
  });

  describe('Comprehensive jwtToken verification across all API services', () => {
    const TEST_TOKEN = 'verified_access_jwt_token_999';

    it('companyService.getCompaniesPaginated sends jwtToken and no duplicate token/jwttoken', async () => {
      let capturedPayload = null;
      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Success', data: [] };
      };
      tokenStorage.setAccessToken(TEST_TOKEN);

      await companyService.getCompaniesPaginated({ pageNumber: 0, pageSize: 10 });
      assert.equal(capturedPayload.jwtToken, TEST_TOKEN);
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
    });

    it('companyService.getCompanyExamsList sends jwtToken and no duplicate token/jwttoken', async () => {
      let capturedPayload = null;
      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Success', data: [] };
      };
      tokenStorage.setAccessToken(TEST_TOKEN);

      await companyService.getCompanyExamsList(12);
      assert.equal(capturedPayload.jwtToken, TEST_TOKEN);
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
    });

    it('adminCompanyService.getCompanies sends jwtToken and no duplicate token/jwttoken', async () => {
      let capturedPayload = null;
      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Success', data: [] };
      };
      tokenStorage.setAccessToken(TEST_TOKEN);

      await adminCompanyService.getCompanies();
      assert.equal(capturedPayload.jwtToken, TEST_TOKEN);
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
    });

    it('adminCompanyService.saveOrUpdateCompany sends jwtToken and no duplicate token/jwttoken', async () => {
      let capturedPayload = null;
      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Success', data: {} };
      };
      tokenStorage.setAccessToken(TEST_TOKEN);

      await adminCompanyService.saveOrUpdateCompany({ id: 5, name: 'Microsoft' });
      assert.equal(capturedPayload.jwtToken, TEST_TOKEN);
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
    });

    it('adminCompanyService.saveOrUpdateCompanyRole sends jwtToken and no duplicate token/jwttoken', async () => {
      let capturedPayload = null;
      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Success', data: {} };
      };
      tokenStorage.setAccessToken(TEST_TOKEN);

      await adminCompanyService.saveOrUpdateCompanyRole({
        id: null,
        companyExamId: 10,
        roleName: 'SDE-1',
        roleCode: 'SDE1',
        salary: '15 LPA',
        description: 'Software Engineer',
      });
      assert.equal(capturedPayload.jwtToken, TEST_TOKEN);
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
    });

    it('adminCompanyService.saveOrUpdateExamSection sends jwtToken and no duplicate token/jwttoken', async () => {
      let capturedPayload = null;
      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Success', data: {} };
      };
      tokenStorage.setAccessToken(TEST_TOKEN);

      await adminCompanyService.saveOrUpdateExamSection({
        id: null,
        companyExamId: 10,
        sectionName: 'Coding Round',
      });
      assert.equal(capturedPayload.jwtToken, TEST_TOKEN);
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
    });

    it('adminCompanyService.saveOrUpdateCompanyExam sends jwtToken and no duplicate token/jwttoken', async () => {
      let capturedPayload = null;
      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Success', data: {} };
      };
      tokenStorage.setAccessToken(TEST_TOKEN);

      await adminCompanyService.saveOrUpdateCompanyExam({
        id: null,
        companyId: 2,
        examName: 'Infosys SP',
        year: 2026,
        description: 'Specialist Programmer',
        totalDurationMinutes: 180,
        totalQuestions: 3,
        totalMarks: 100,
      });
      assert.equal(capturedPayload.jwtToken, TEST_TOKEN);
      assert.equal(capturedPayload.token, undefined);
      assert.equal(capturedPayload.jwttoken, undefined);
    });
  });

  describe('company catalog pagination', () => {
    it('loads and de-duplicates every backend page for global client filters', async () => {
      const requestedPages = [];
      apiClient.post = async (_url, payload) => {
        requestedPages.push(payload.pageNumber);
        return {
          statusCode: 200,
          data: {
            content: payload.pageNumber === 0
              ? [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }]
              : [{ id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }],
            pageNumber: payload.pageNumber,
            pageSize: 100,
            totalElements: 3,
            totalPages: 2,
          },
        };
      };

      const response = await companyService.getAllCompanies();
      assert.deepEqual(requestedPages, [0, 1]);
      assert.deepEqual(response.data.map((company) => company.name), ['Alpha', 'Beta', 'Gamma']);
    });

    it('rejects malformed catalog responses instead of reporting an empty company list', async () => {
      apiClient.post = async () => ({ statusCode: 200, data: { unexpected: true } });
      await assert.rejects(
        () => companyService.getAllCompanies(),
        /Unexpected companies response format/
      );
    });
  });
});
