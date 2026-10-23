import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';

export interface UserBookmarkQuestionResponse {
  questionId: number;
  title?: string;
  difficulty?: string;
  category?: string;
  [key: string]: unknown;
}

export interface UserSubmittedQuestionItem {
  questionId: number;
  questionName?: string;
  difficultyLevel?: string;
  submittedDate?: string;
  [key: string]: unknown;
}

export interface UserAttemptedQuestionItem {
  questionId: number;
  title?: string;
  difficulty?: string;
  submittedDate?: string;
  [key: string]: unknown;
}

export interface UserQuestionSubmissionItem {
  id: number;
  userId: number;
  questionId: number;
  languageId: number;
  sourceCode: string;
  totalTestCases: number;
  passedTestCases: number;
  status: string | null;
  submittedAt: string;
  [key: string]: unknown;
}

export type UserQuestionProgressResponse = UserSubmittedQuestionItem;

/**
 * Service for user-scoped question interactions:
 * - Bookmarks: POST/DELETE/GET /api/v1/users/{userId}/questions/...
 * - Solved / Submitted Questions: GET /api/v1/{userId}/getSubmiteedQuestionIds
 * - Attempted Questions: GET /api/v1/{userId}/getAPttemptedQuestionIds
 * - Question Submissions: GET /api/v1/{userId}/question/{questionId}/getSubmissions
 */
export const userQuestionService = {
  /**
   * POST /api/v1/users/{userId}/questions/{questionId}/bookmark
   * Bookmarks a specific question for the authenticated user.
   * Path parameters are required; no request body is needed.
   */
  async bookmarkQuestion(
    userId: string | number,
    questionId: string | number
  ): Promise<ApiResponse<unknown>> {
    if (!userId || !questionId) {
      throw new Error('Both userId and questionId are required to bookmark a question');
    }
    return apiClient.post(API_ENDPOINTS.USER.BOOKMARK(userId, questionId));
  },

  /**
   * DELETE /api/v1/users/{userId}/questions/{questionId}/bookmark
   * Removes a bookmark for a specific question for the authenticated user.
   */
  async unbookmarkQuestion(
    userId: string | number,
    questionId: string | number
  ): Promise<ApiResponse<unknown>> {
    if (!userId || !questionId) {
      throw new Error('Both userId and questionId are required to remove a bookmark');
    }
    return apiClient.delete(API_ENDPOINTS.USER.BOOKMARK(userId, questionId));
  },

  /**
   * GET /api/v1/users/{userId}/questions/bookmarks
   * Retrieves all bookmarked questions for the user.
   * Returns empty array if none found or response format varies.
   */
  async getBookmarkedQuestions(
    userId: string | number
  ): Promise<UserBookmarkQuestionResponse[]> {
    if (!userId) {
      return [];
    }
    const res: any = await apiClient.get(API_ENDPOINTS.USER.BOOKMARKS(userId));
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * GET /api/v1/{userId}/getSubmiteedQuestionIds
   * Retrieves solved / submitted questions for user progress tracking.
   */
  async getSolvedQuestions(
    userId: string | number,
    signal?: AbortSignal
  ): Promise<UserSubmittedQuestionItem[]> {
    if (!userId) {
      return [];
    }
    const res: any = await apiClient.get(API_ENDPOINTS.USER.SUBMITTED_QUESTIONS(userId), { signal });
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * GET /api/v1/{userId}/getSubmiteedQuestionIds
   * Alias for getSolvedQuestions
   */
  async getSubmittedQuestions(
    userId: string | number
  ): Promise<UserSubmittedQuestionItem[]> {
    return this.getSolvedQuestions(userId);
  },

  /**
   * GET /api/v1/{userId}/getAPttemptedQuestionIds
   * Retrieves attempted questions for user progress tracking.
   */
  async getAttemptedQuestions(
    userId: string | number,
    signal?: AbortSignal
  ): Promise<UserAttemptedQuestionItem[]> {
    if (!userId) {
      return [];
    }
    const res: any = await apiClient.get(API_ENDPOINTS.USER.ATTEMPTED_QUESTIONS(userId), { signal });
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * GET /api/v1/{userId}/question/{questionId}/getSubmissions
   * Retrieves submission records for a particular question by the authenticated user.
   */
  async getQuestionSubmissions(
    userId: string | number,
    questionId: string | number
  ): Promise<UserQuestionSubmissionItem[]> {
    if (!userId || !questionId) {
      return [];
    }
    const res: any = await apiClient.get(
      API_ENDPOINTS.USER.QUESTION_SUBMISSIONS(userId, questionId)
    );
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },
};
