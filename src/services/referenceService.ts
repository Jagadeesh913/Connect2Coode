import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { ReferenceItem } from '../core/types/domain';

export type { ReferenceItem };

export const referenceService = {
  async getByGroupCode(
    refGroupCode: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<ReferenceItem[]>> {
    const response: ApiResponse<ReferenceItem[]> = await apiClient.get(
      API_ENDPOINTS.REFERENCE.GROUP(refGroupCode),
      { signal }
    );
    if (!Array.isArray(response.data)) {
      throw new Error(`Unexpected ${refGroupCode} reference response format`);
    }
    return response;
  },
};
