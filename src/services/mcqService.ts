import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse, ApiPage } from '../core/types/api';
import type { McqQuestion, McqQueryPayload } from '../core/types/domain';

export const mcqService = {
  async getMcqList(payload: McqQueryPayload, signal?: AbortSignal): Promise<ApiResponse<ApiPage<McqQuestion>>> {
    return apiClient.post(API_ENDPOINTS.MCQ.LIST, payload, { signal });
  },

  async getMcqById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<McqQuestion>> {
    return apiClient.get(API_ENDPOINTS.MCQ.DETAILS(id), { signal });
  },
};
