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
    !Number.isSafeInteger(item.id) ||
    item.id <= 0 ||
    typeof item.refGroupCode !== 'string' ||
    item.refGroupCode.trim().length === 0 ||
    typeof item.refCode !== 'string' ||
    item.refCode.trim().length === 0 ||
    typeof item.refName !== 'string' ||
    item.refName.trim().length === 0 ||
    typeof item.isActive !== 'boolean' ||
    (item.logoUrl !== undefined && item.logoUrl !== null && typeof item.logoUrl !== 'string')
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

  async hardDelete(refGroupCode: string, refCode: string): Promise<void> {
    const response: ApiResponse<null> | undefined = await apiClient.delete(
      API_ENDPOINTS.REFERENCE.ITEM(refGroupCode, refCode)
    );
    // Spring may answer a successful DELETE with either a normal API envelope
    // (`data: null`) or HTTP 204 (no response body). Axios exposes the latter
    // as `undefined`; both are authoritative success responses.
    if (response !== undefined && response.data !== null) {
      throw new Error('Unexpected reference library delete response format');
    }
  },
};
