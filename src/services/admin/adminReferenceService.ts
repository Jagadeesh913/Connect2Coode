import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type {
  ReferenceItem,
  SaveReferenceItemRequest,
} from '../../core/types/domain';

const requireReferenceItem = (response: ApiResponse<ReferenceItem>): ApiResponse<ReferenceItem> => {
  const item = response.data;
  if (
    !item ||
    typeof item.id !== 'number' ||
    typeof item.refGroupCode !== 'string' ||
    typeof item.refCode !== 'string' ||
    typeof item.refName !== 'string' ||
    typeof item.isActive !== 'boolean'
  ) {
    throw new Error('Unexpected reference library mutation response format');
  }
  return response;
};

export const adminReferenceService = {
  async save(payload: SaveReferenceItemRequest): Promise<ApiResponse<ReferenceItem>> {
    const response: ApiResponse<ReferenceItem> = await apiClient.post(
      API_ENDPOINTS.REFERENCE.BASE,
      payload
    );
    return requireReferenceItem(response);
  },

  async hardDelete(refGroupCode: string, refCode: string): Promise<ApiResponse<null>> {
    const response: ApiResponse<null> = await apiClient.delete(
      API_ENDPOINTS.REFERENCE.ITEM(refGroupCode, refCode)
    );
    if (response.data !== null) {
      throw new Error('Unexpected reference library delete response format');
    }
    return response;
  },
};
