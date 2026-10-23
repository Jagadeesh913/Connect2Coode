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
    return apiClient.get(API_ENDPOINTS.REFERENCE.GROUP(refGroupCode), { signal });
  },
};
