import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse, ApiPage } from '../core/types/api';
import type { McqQuestion, McqQueryPayload, AdminCreateMcqPayload } from '../core/types/domain';

export const mcqService = {
  async getMcqList(payload: McqQueryPayload, signal?: AbortSignal): Promise<ApiResponse<ApiPage<McqQuestion>>> {
    return apiClient.post(API_ENDPOINTS.MCQ.LIST, payload, { signal });
  },

  async getMcqById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<McqQuestion>> {
    return apiClient.get(API_ENDPOINTS.MCQ.DETAILS(id), { signal });
  },

  async createMcq(payload: AdminCreateMcqPayload): Promise<ApiResponse<McqQuestion>> {
    return apiClient.post(API_ENDPOINTS.MCQ.ADMIN_CREATE, payload);
  },

  async deleteMcq(id: string | number): Promise<ApiResponse<string>> {
    return apiClient.delete(API_ENDPOINTS.MCQ.ADMIN_DELETE(id));
  },
};
