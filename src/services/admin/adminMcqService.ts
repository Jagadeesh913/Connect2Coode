import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse, ApiPage } from '../../core/types/api';
import type { McqQuestion, McqQueryPayload, AdminSaveMcqPayload } from '../../core/types/domain';
import { mcqService } from '../mcqService';

export const adminMcqService = {
  async getMcqs(payload: McqQueryPayload, signal?: AbortSignal): Promise<ApiResponse<ApiPage<McqQuestion>>> {
    return mcqService.getMcqList(payload, signal);
  },

  async getMcqById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<McqQuestion>> {
    return mcqService.getMcqById(id, signal);
  },

  async saveMcq(payload: AdminSaveMcqPayload): Promise<ApiResponse<McqQuestion>> {
    return apiClient.post(API_ENDPOINTS.MCQ.ADMIN_SAVE, payload);
  },

  async deleteMcq(id: string | number): Promise<ApiResponse<string>> {
    return apiClient.delete(API_ENDPOINTS.MCQ.ADMIN_DELETE(id));
  },
};
