import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Question, QuestionHint, QuestionTestCase } from '../core/types/domain';
import { extractTestCasesFromProblem } from '../features/admin/utils/testCaseUtils';

export type { Question, QuestionHint, QuestionTestCase };
export type QuestionPayload = Question;

const requireQuestionIdentity = (
  question: QuestionPayload | null | undefined,
  context: string,
  expectedId?: number,
  requireTitle = true
): QuestionPayload => {
  const id = Number(question?.id);
  if (
    !question ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    (requireTitle && (typeof question.title !== 'string' || !question.title.trim())) ||
    (expectedId !== undefined && id !== expectedId)
  ) {
    throw new Error(context);
  }
  question.id = id;
  if (typeof question.title === 'string') {
    question.title = question.title.trim();
  }
  return question;
};

export const questionService = {
  async saveOrUpdate(
    payload: QuestionPayload,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionPayload>> {
    const isUpdate = payload.id != null && Number(payload.id) > 0;
    // When updating an existing question with non-empty company associations,
    // clear existing associations first so Hibernate's @ManyToMany collection merge
    // purges removed companies rather than retaining them.
    if (isUpdate && Array.isArray(payload.companies) && payload.companies.length > 0) {
      try {
        await apiClient.post(
          API_ENDPOINTS.QUESTION.BASE,
          { ...payload, companies: [] },
          { signal }
        );
      } catch {
        // Fall through to primary save if pre-clear encounters any temporary issue
      }
    }

    const response: ApiResponse<QuestionPayload> = await apiClient.post(
      API_ENDPOINTS.QUESTION.BASE,
      payload,
      { signal }
    );
    const expectedId = payload.id == null ? undefined : Number(payload.id);
    const saved = requireQuestionIdentity(
      response.data,
      'Question save returned an invalid response',
      expectedId,
      false
    );
    response.data = {
      ...payload,
      ...saved,
      id: saved.id,
      title:
        typeof saved.title === 'string' && saved.title.trim()
          ? saved.title.trim()
          : payload.title,
    };
    return response;
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

    requireQuestionIdentity(
      response.data,
      `Question #${numericId} returned an invalid detail response`,
      numericId
    );

    return response;
  },

  /**
   * The backend currently exposes no authenticated GET test-case contract.
   * Use only cases embedded in a verified detail response; hidden cases remain
   * server-owned and are never synthesized in the browser.
   */
  async getTestCases(id: string | number, signal?: AbortSignal): Promise<QuestionTestCase[]> {
    const response = await this.getById(id, signal);
    const detail = response.data;
    if (Array.isArray(detail?.testCases) && detail.testCases.length > 0) {
      const valid = detail.testCases.filter(
        (tc) => tc && (tc.input?.trim() || tc.expectedOutput?.trim())
      );
      if (valid.length > 0) {
        return valid.map((tc, idx) => ({
          ...tc,
          displayOrder: tc.displayOrder || idx + 1,
          typeRefGroupCode: tc.typeRefGroupCode || '',
          typeRefCode: tc.typeRefCode || '',
          typeRefName: tc.typeRefName || '',
        }));
      }
    }
    return extractTestCasesFromProblem(detail);
  },

  async addTestCases(
    id: string | number,
    testCases: QuestionTestCase[],
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionTestCase[]>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.TEST_CASES(id), testCases, { signal });
  },
};
