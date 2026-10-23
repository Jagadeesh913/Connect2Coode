import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Question, QuestionHint, QuestionTestCase } from '../core/types/domain';
import { extractTestCasesFromProblem } from '../features/admin/utils/testCaseUtils';

export type { Question, QuestionHint, QuestionTestCase };
export type QuestionPayload = Question;

export const questionService = {
  async saveOrUpdate(
    payload: QuestionPayload,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionPayload>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.BASE, payload, { signal });
  },

  /**
   * A Question is the full detail DTO, not a catalog row. The captured list
   * endpoint does not contain its required reference/test-case fields, so it
   * must not be promoted into a fabricated detail result when this route fails.
   */
  async getById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<QuestionPayload>> {
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      throw new Error('A numeric question ID is required');
    }

    const response: ApiResponse<QuestionPayload> = await apiClient.get(
      API_ENDPOINTS.QUESTION.DETAILS(numericId),
      { signal }
    );

    if (!response.data || !response.data.id || !response.data.title) {
      throw new Error(`Question #${numericId} returned an invalid detail response`);
    }

    return response;
  },

  /**
   * The backend currently exposes no authenticated GET test-case contract.
   * Use only cases embedded in a verified detail response; hidden cases remain
   * server-owned and are never synthesized in the browser.
   */
  async getTestCases(id: string | number, signal?: AbortSignal): Promise<QuestionTestCase[]> {
    const response = await this.getById(id, signal);
    return extractTestCasesFromProblem(response.data);
  },

  async addTestCases(
    id: string | number,
    testCases: QuestionTestCase[],
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionTestCase[]>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.TEST_CASES(id), testCases, { signal });
  },
};
