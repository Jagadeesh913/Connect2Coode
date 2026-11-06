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

  /**
   * List rows are allowed to omit options. Fetch the authoritative detail only
   * when an answerable question is opened; never synthesize choices locally.
   */
  async getMcqForAnswering(question: McqQuestion, signal?: AbortSignal): Promise<McqQuestion> {
    if (Array.isArray(question.options) && question.options.length > 0) {
      return question;
    }

    const response = await this.getMcqById(question.id, signal);
    if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
      throw new Error('Unexpected MCQ detail response format');
    }
    return response.data;
  },
};
