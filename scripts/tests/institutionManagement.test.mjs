import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Loader hook to resolve extensionless imports and mock apiClient if needed
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
const { adminInstitutionService } = await import('../../src/services/admin/adminInstitutionService.ts');
const { institutionService } = await import('../../src/services/institutionService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');

describe('BATCH-10: Institution Management API & Service Contracts', () => {
  it('API_ENDPOINTS: accurately defines Admin and Public institution endpoints', () => {
    assert.equal(API_ENDPOINTS.INSTITUTION.ADMIN.BASE, '/admin/institutions');
    assert.equal(API_ENDPOINTS.INSTITUTION.ADMIN.DETAILS(54860), '/admin/institutions/54860');
    assert.equal(API_ENDPOINTS.INSTITUTION.ADMIN.DETAILS('U-0043'), '/admin/institutions/U-0043');
    assert.equal(API_ENDPOINTS.INSTITUTION.ADMIN.STATUS(54860), '/admin/institutions/54860/status');

    assert.equal(API_ENDPOINTS.INSTITUTION.PUBLIC.SEARCH, '/institutions/search');
    assert.equal(API_ENDPOINTS.INSTITUTION.PUBLIC.DETAILS(54860), '/institutions/54860');
  });

  describe('Admin Institution Service', () => {
    it('getInstitutions: passes query, type, location, active, and pagination parameters to apiClient.get', async () => {
      let capturedUrl = '';
      let capturedConfig = null;

      apiClient.get = async (url, config) => {
        capturedUrl = url;
        capturedConfig = config;
        return {
          statusCode: 200,
          message: 'Institutions retrieved successfully',
          data: {
            content: [
              {
                id: 54860,
                aisheCode: 'U-0043',
                name: "Vignan's Foundation for Science, Technology and Research",
                institutionType: 'UNIVERSITY',
                state: 'Andhra Pradesh',
                district: 'Guntur',
                isActive: true,
              },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        };
      };

      const res = await adminInstitutionService.getInstitutions({
        page: 0,
        size: 20,
        query: 'Vignan',
        type: 'UNIVERSITY',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        activeOnly: true,
      });

      assert.equal(capturedUrl, '/admin/institutions');
      assert.deepEqual(capturedConfig.params, {
        page: 0,
        size: 20,
        query: 'Vignan',
        type: 'UNIVERSITY',
        institutionType: 'UNIVERSITY',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        activeOnly: true,
        isActive: true,
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.content[0].aisheCode, 'U-0043');
    });

    it('getInstitutionById: requests correct admin detail URL', async () => {
      let capturedUrl = '';
      apiClient.get = async (url) => {
        capturedUrl = url;
        return {
          statusCode: 200,
          message: 'Institution retrieved successfully',
          data: { id: 54860, name: 'Test University' },
        };
      };

      const res = await adminInstitutionService.getInstitutionById(54860);
      assert.equal(capturedUrl, '/admin/institutions/54860');
      assert.equal(res.data.id, 54860);
    });

    it('createInstitution: sends POST to /admin/institutions with payload', async () => {
      let capturedUrl = '';
      let capturedBody = null;
      apiClient.post = async (url, body) => {
        capturedUrl = url;
        capturedBody = body;
        return {
          statusCode: 201,
          message: 'Institution created successfully',
          data: { id: 101, ...body },
        };
      };

      const payload = {
        aisheCode: 'U-0043',
        name: "Vignan's Foundation for Science, Technology and Research",
        institutionType: 'UNIVERSITY',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        website: 'https://www.vignan.ac.in/',
        yearOfEstablishment: 2008,
        isActive: true,
      };

      const res = await adminInstitutionService.createInstitution(payload);
      assert.equal(capturedUrl, '/admin/institutions');
      assert.deepEqual(capturedBody, payload);
      assert.equal(res.data.aisheCode, 'U-0043');
    });

    it('updateInstitution: sends PUT to /admin/institutions/{id} with payload', async () => {
      let capturedUrl = '';
      let capturedBody = null;
      apiClient.put = async (url, body) => {
        capturedUrl = url;
        capturedBody = body;
        return {
          statusCode: 200,
          message: 'Institution updated successfully',
          data: { id: 54860, ...body },
        };
      };

      const updateData = {
        name: "Vignan's University Updated",
        website: 'https://www.vignan.ac.in/updated',
      };

      const res = await adminInstitutionService.updateInstitution(54860, updateData);
      assert.equal(capturedUrl, '/admin/institutions/54860');
      assert.deepEqual(capturedBody, updateData);
      assert.equal(res.data.name, "Vignan's University Updated");
    });

    it('updateInstitutionStatus: sends PATCH to /admin/institutions/{id}/status with { isActive }', async () => {
      let capturedUrl = '';
      let capturedBody = null;
      apiClient.patch = async (url, body) => {
        capturedUrl = url;
        capturedBody = body;
        return {
          statusCode: 200,
          message: 'Institution status updated successfully',
          data: { id: 54860, isActive: false },
        };
      };

      const res = await adminInstitutionService.updateInstitutionStatus(54860, false);
      assert.equal(capturedUrl, '/admin/institutions/54860/status');
      assert.deepEqual(capturedBody, { isActive: false });
      assert.equal(res.data.isActive, false);
    });
  });

  describe('Public Institution Service (Student Autocomplete)', () => {
    it('searchInstitutions: enforces min 3 characters and avoids network dispatch when query is too short', async () => {
      let networkCalled = false;
      apiClient.get = async () => {
        networkCalled = true;
        return {};
      };

      const emptyRes = await institutionService.searchInstitutions('');
      assert.equal(networkCalled, false);
      assert.deepEqual(emptyRes.data, []);

      const shortRes = await institutionService.searchInstitutions('vi');
      assert.equal(networkCalled, false);
      assert.deepEqual(shortRes.data, []);

      const whitespaceRes = await institutionService.searchInstitutions('  a  ');
      assert.equal(networkCalled, false);
      assert.deepEqual(whitespaceRes.data, []);
    });

    it('searchInstitutions: dispatches query to /institutions/search when query has >= 3 chars', async () => {
      let capturedUrl = '';
      let capturedConfig = null;

      apiClient.get = async (url, config) => {
        capturedUrl = url;
        capturedConfig = config;
        return {
          statusCode: 200,
          message: 'Institutions retrieved successfully',
          data: [
            {
              id: 54860,
              name: "Vignan's Foundation for Science, Technology and Research",
              institutionType: 'UNIVERSITY',
              state: 'Andhra Pradesh',
              district: 'Guntur',
            },
          ],
        };
      };

      const res = await institutionService.searchInstitutions('  vignan  ');
      assert.equal(capturedUrl, '/institutions/search');
      assert.deepEqual(capturedConfig.params, { query: 'vignan' });
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.length, 1);
      assert.equal(res.data[0].institutionType, 'UNIVERSITY');
    });

    it('getPublicInstitutionById: requests public institution detail endpoint', async () => {
      let capturedUrl = '';
      apiClient.get = async (url) => {
        capturedUrl = url;
        return {
          statusCode: 200,
          message: 'Institution retrieved successfully',
          data: { id: 54860, name: 'Vignan' },
        };
      };

      const res = await institutionService.getPublicInstitutionById(54860);
      assert.equal(capturedUrl, '/institutions/54860');
      assert.equal(res.data.id, 54860);
    });
  });
});
