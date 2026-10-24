import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Institution, InstitutionOptionDTO } from '../core/types/domain';

/**
 * Public Institution Service Layer (Student Registration & Autocomplete)
 * Base URL: /api/v1/institutions
 */
export const institutionService = {
  /**
   * GET /api/v1/institutions/search?query=...
   * Searches colleges and universities for autocomplete in student registration.
   * Enforces min 3 characters on the frontend before dispatching, limits to 15 results.
   */
  async searchInstitutions(
    query: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<InstitutionOptionDTO[]>> {
    const trimmed = (query || '').trim();
    if (trimmed.length < 3) {
      return {
        statusCode: 200,
        message: 'Query requires at least 3 characters',
        data: [],
      };
    }

    try {
      const res: any = await apiClient.get(API_ENDPOINTS.INSTITUTION.PUBLIC.SEARCH, {
        params: { query: trimmed },
        signal,
      });
      const rawData = res?.data || res;
      let list: any[] = [];
      if (rawData && Array.isArray(rawData.content)) {
        list = rawData.content;
      } else if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.data)) {
        list = rawData.data;
      } else {
        throw new Error('Unexpected institution search response format');
      }

      return {
        statusCode: res?.statusCode || 200,
        message: res?.message || 'Institutions fetched successfully',
        data: list as InstitutionOptionDTO[],
      };
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        throw err;
      }
      throw err;
    }
  },

  /**
   * GET /api/v1/institutions/{id}
   * Fetches public institution details by ID if required by the UI.
   */
  async getPublicInstitutionById(
    id: string | number,
    signal?: AbortSignal
  ): Promise<ApiResponse<Institution>> {
    return apiClient.get(API_ENDPOINTS.INSTITUTION.PUBLIC.DETAILS(id), { signal });
  },
};
