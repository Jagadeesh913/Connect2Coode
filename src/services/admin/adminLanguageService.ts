import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import { executionService } from '../executionService';
import type { ApiResponse } from '../../core/types/api';
import type { AdminLanguage } from '../../core/types/domain';

export type AdminLanguageItem = AdminLanguage;

/**
 * Dedicated Admin Language Service Layer
 * Supports full language lifecycle and dropdown integration
 * Base URL: /api/v1/language
 */
export const adminLanguageService = {
  /**
   * POST /api/v1/language
   * Registers a new language in the platform (without id)
   */
  async createLanguage(payload: {
    referenceId: number;
    judge0LanguageId: number;
    version?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<AdminLanguageItem>> {
    const response: ApiResponse<AdminLanguageItem> = await apiClient.post(
      API_ENDPOINTS.LANGUAGE.BASE,
      payload
    );
    executionService.invalidateLanguageCache();
    return response;
  },

  /**
   * POST /api/v1/language
   * Updates an existing language (includes id in request body)
   */
  async updateLanguage(payload: {
    id: number;
    referenceId: number;
    judge0LanguageId: number;
    version?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<AdminLanguageItem>> {
    const response: ApiResponse<AdminLanguageItem> = await apiClient.post(
      API_ENDPOINTS.LANGUAGE.BASE,
      payload
    );
    executionService.invalidateLanguageCache();
    return response;
  },

  /**
   * DELETE /api/v1/language/:id
   * Performs soft delete (sets isActive = false)
   */
  async deleteLanguage(id: number | string): Promise<ApiResponse<null>> {
    const response: ApiResponse<null> = await apiClient.delete(
      API_ENDPOINTS.LANGUAGE.DETAILS(id)
    );
    executionService.invalidateLanguageCache();
    return response;
  },
};

