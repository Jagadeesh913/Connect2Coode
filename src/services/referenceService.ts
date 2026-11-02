import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { ReferenceItem } from '../core/types/domain';

export type { ReferenceItem };

const normalizeGroupCode = (value: string): string => value.trim().toUpperCase();

const isReferenceItem = (value: unknown, expectedGroupCode: string): value is ReferenceItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ReferenceItem>;
  return (
    typeof item.id === 'number' &&
    Number.isFinite(item.id) &&
    typeof item.refGroupCode === 'string' &&
    normalizeGroupCode(item.refGroupCode) === expectedGroupCode &&
    typeof item.refCode === 'string' &&
    item.refCode.trim().length > 0 &&
    typeof item.refName === 'string' &&
    item.refName.trim().length > 0 &&
    typeof item.isActive === 'boolean'
  );
};

export const referenceService = {
  async getGroupCodes(signal?: AbortSignal): Promise<ApiResponse<string[]>> {
    const response: ApiResponse<string[]> = await apiClient.get(
      API_ENDPOINTS.REFERENCE.GROUP_CODES,
      { signal }
    );
    if (
      !Array.isArray(response.data) ||
      response.data.some((code) => typeof code !== 'string' || code.trim().length === 0)
    ) {
      throw new Error('Unexpected reference group code response format');
    }
    return response;
  },

  async getByGroupCode(
    refGroupCode: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<ReferenceItem[]>> {
    const normalizedGroupCode = normalizeGroupCode(refGroupCode);
    if (!normalizedGroupCode) {
      throw new Error('Reference group code is required');
    }
    const response: ApiResponse<ReferenceItem[]> = await apiClient.get(
      API_ENDPOINTS.REFERENCE.GROUP(normalizedGroupCode),
      { signal }
    );
    if (
      !Array.isArray(response.data) ||
      response.data.some((item) => !isReferenceItem(item, normalizedGroupCode))
    ) {
      throw new Error(`Unexpected ${normalizedGroupCode} reference response format`);
    }
    return response;
  },
};
