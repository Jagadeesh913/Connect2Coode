import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse, ApiPage } from '../../core/types/api';
import type {
  Institution,
  InstitutionFilterParams,
  CreateInstitutionRequest,
  UpdateInstitutionRequest,
  UpdateInstitutionStatusRequest,
} from '../../core/types/domain';

export type InstitutionItem = Institution;
export type InstitutionPageResponse = ApiPage<Institution> | Institution[];

/**
 * Dedicated Admin Institution Service Layer
 * Interacts directly with Spring Boot REST endpoints:
 * Base URL: /api/v1/admin/institutions
 */
export const adminInstitutionService = {
  /**
   * GET /api/v1/admin/institutions
   * Fetches institutions with pagination and optional filters.
   * Supports query (name/AISHE), type/institutionType, state, district, activeOnly/isActive.
   */
  async getInstitutions(
    params?: InstitutionFilterParams,
    signal?: AbortSignal
  ): Promise<ApiResponse<InstitutionPageResponse>> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.size !== undefined) queryParams.size = params.size;
      if (params.query?.trim()) queryParams.query = params.query.trim();

      const instType = params.type || params.institutionType;
      if (instType) {
        queryParams.type = instType;
        queryParams.institutionType = instType;
      }

      if (params.state?.trim()) queryParams.state = params.state.trim();
      if (params.district?.trim()) queryParams.district = params.district.trim();

      const activeVal = params.activeOnly !== undefined ? params.activeOnly : params.isActive;
      if (activeVal !== undefined) {
        queryParams.activeOnly = activeVal;
        queryParams.isActive = activeVal;
      }
    }

    return apiClient.get(API_ENDPOINTS.INSTITUTION.ADMIN.BASE, {
      params: queryParams,
      signal,
    });
  },

  async getAllInstitutions(
    params: Omit<InstitutionFilterParams, 'page' | 'size'> = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<Institution[]>> {
    const first = await this.getInstitutions({ ...params, page: 0, size: 100 }, signal);
    if (Array.isArray(first.data)) {
      return { ...first, data: first.data };
    }
    if (!first.data || !Array.isArray(first.data.content)) {
      throw new Error('Unexpected institutions response format');
    }

    const pages: Institution[][] = [first.data.content];
    const totalPages = Math.max(1, Number(first.data.totalPages) || 1);
    for (let page = 1; page < totalPages; page += 1) {
      signal?.throwIfAborted();
      const response = await this.getInstitutions({ ...params, page, size: 100 }, signal);
      if (Array.isArray(response.data)) {
        pages.push(response.data);
      } else if (response.data && Array.isArray(response.data.content)) {
        pages.push(response.data.content);
      } else {
        throw new Error('Unexpected institutions response format');
      }
    }

    const seen = new Set<string>();
    const data = pages.flat().filter((institution) => {
      const key = String(institution.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { ...first, data };
  },

  /**
   * GET /api/v1/admin/institutions/{id}
   * Returns complete institution details, including affiliated university info.
   */
  async getInstitutionById(
    id: string | number,
    signal?: AbortSignal
  ): Promise<ApiResponse<Institution>> {
    return apiClient.get(API_ENDPOINTS.INSTITUTION.ADMIN.DETAILS(id), { signal });
  },

  /**
   * POST /api/v1/admin/institutions
   * Creates a new college or university.
   * Validates mandatory fields and rejects duplicate AISHE codes.
   */
  async createInstitution(
    payload: CreateInstitutionRequest
  ): Promise<ApiResponse<Institution>> {
    return apiClient.post(API_ENDPOINTS.INSTITUTION.ADMIN.BASE, payload);
  },

  /**
   * PUT /api/v1/admin/institutions/{id}
   * Updates an existing institution details.
   */
  async updateInstitution(
    id: string | number,
    payload: UpdateInstitutionRequest
  ): Promise<ApiResponse<Institution>> {
    return apiClient.put(API_ENDPOINTS.INSTITUTION.ADMIN.DETAILS(id), payload);
  },

  /**
   * PATCH /api/v1/admin/institutions/{id}/status
   * Activates or deactivates an institution (soft status toggle).
   */
  async updateInstitutionStatus(
    id: string | number,
    isActive: boolean
  ): Promise<ApiResponse<Institution>> {
    const payload: UpdateInstitutionStatusRequest = { isActive };
    return apiClient.patch(API_ENDPOINTS.INSTITUTION.ADMIN.STATUS(id), payload);
  },
};
