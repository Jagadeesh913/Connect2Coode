import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type {
  CodeExecutionPayload,
  ExecutionResult,
  Language,
  PageRequest,
  Question,
  QuestionListItem as DomainQuestionListItem,
  QuestionListRequest,
  QuestionPage,
  QuestionTestCase,
} from '../../core/types/domain';
import { executionService } from '../executionService';
import { questionService } from '../questionService';
export type PageRequestPayload = PageRequest;
export type QuestionListRequestPayload = QuestionListRequest;
export type QuestionListItem = DomainQuestionListItem;
export type PaginatedQuestionResponse = QuestionPage;
export type QuestionPayload = Question;

/**
 * Dedicated Admin Question Service Layer
 * REAL API ONLY — Routes all requests through the shared API client.
 * Routes 100% of network requests through the shared `apiClient` instance
 * targeting the configured Java Spring Boot REST API.
 */
export const adminQuestionService = {
  /**
   * POST /api/v1/questions
   * Fetches real paginated question list directly from Java Spring Boot backend.
   */
  async getQuestions(payload: QuestionListRequestPayload, signal?: AbortSignal): Promise<ApiResponse<PaginatedQuestionResponse>> {
    return apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
  },

  /**
   * GET /api/v1/question/:id
   * Fetches single question statement and details directly from Java backend.
   */
  async getQuestionById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<QuestionPayload>> {
    return questionService.getById(id, signal);
  },

  /**
   * POST /api/v1/question
   * Saves a new question or updates an existing question in the Java database.
   */
  async saveOrUpdateQuestion(payload: QuestionPayload, signal?: AbortSignal): Promise<ApiResponse<QuestionPayload>> {
    return questionService.saveOrUpdate(payload, signal);
  },

  /**
   * GET /api/v1/question/:id/testCases
   * Fetches test cases for a question from backend or fallback.
   */
  async getTestCases(id: string | number, signal?: AbortSignal): Promise<QuestionTestCase[]> {
    return questionService.getTestCases(id, signal);
  },

  /**
   * POST /api/v1/question/:id/testCases
   * Attaches test cases to a question in the Java database.
   */
  async addTestCases(id: string | number, testCases: QuestionTestCase[], signal?: AbortSignal): Promise<ApiResponse<QuestionTestCase[]>> {
    return questionService.addTestCases(id, testCases, signal);
  },

  /**
   * GET /api/v1/language/dropdown & /language
   * Fetches supported languages with database table IDs and reference IDs for admin execution
   */
  async getLanguagesDropdown(): Promise<Language[]> {
    return executionService.getLanguageDropdown();
  },

  /**
   * POST /api/v1/admin/testCode
   * Admin RUN: executes sample / visible test cases for testing without persistence.
   * Auto-resolves the backend referenceId and uses the dedicated admin endpoint.
   */
  async adminTestCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResult> {
    return executionService.adminTestCode(payload, signal);
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin SUBMIT: executes all test cases (visible + hidden) for validation without persistence.
   * Auto-resolves referenceId and falls back seamlessly if token role is not admin on Render.
   */
  async adminSubmitCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResult> {
    return executionService.adminSubmitCode(payload, signal);
  },
};
