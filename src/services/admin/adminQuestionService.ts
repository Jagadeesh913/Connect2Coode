import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type {
  CodeExecutionPayload,
  ExecutionResult,
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const requirePageInteger = (
  primary: unknown,
  alias: unknown,
  label: string,
  minimum: number
): number => {
  const value = typeof primary === 'number' ? primary : alias;
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new Error(`Unexpected questions ${label} metadata`);
  }
  return value as number;
};

/**
 * Fetches a question page without fabricating records or pagination metadata.
 * The API owns this data, so malformed responses and server failures remain
 * failures until the backend data or contract is repaired.
 */
export async function fetchQuestionPage(
  payload: QuestionListRequestPayload,
  signal?: AbortSignal
): Promise<ApiResponse<PaginatedQuestionResponse>> {
  const response: ApiResponse<PaginatedQuestionResponse> = await apiClient.post(
    API_ENDPOINTS.PROBLEMS.LIST,
    payload,
    { signal }
  );

  const data: unknown = response.data;
  if (!isRecord(data) || !Array.isArray(data.content)) {
    throw new Error('Unexpected questions response format');
  }

  const pageNumber = requirePageInteger(data.pageNumber, data.number, 'page number', 0);
  const pageSize = requirePageInteger(data.pageSize, data.size, 'page size', 1);
  const totalElements = requirePageInteger(data.totalElements, undefined, 'total elements', 0);
  const totalPages = requirePageInteger(data.totalPages, undefined, 'total pages', 0);

  response.data = {
    ...(data as unknown as PaginatedQuestionResponse),
    number: pageNumber,
    size: pageSize,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
  };

  return response;
}

/** Dedicated admin question API layer. */
export const adminQuestionService = {
  async getQuestions(
    payload: QuestionListRequestPayload,
    signal?: AbortSignal
  ): Promise<ApiResponse<PaginatedQuestionResponse>> {
    return fetchQuestionPage(payload, signal);
  },

  async getQuestionById(
    id: string | number,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionPayload>> {
    return questionService.getById(id, signal);
  },

  async saveOrUpdateQuestion(
    payload: QuestionPayload,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionPayload>> {
    return questionService.saveOrUpdate(payload, signal);
  },

  async getTestCases(id: string | number, signal?: AbortSignal): Promise<QuestionTestCase[]> {
    return questionService.getTestCases(id, signal);
  },

  async addTestCases(
    id: string | number,
    testCases: QuestionTestCase[],
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionTestCase[]>> {
    return questionService.addTestCases(id, testCases, signal);
  },

  async adminTestCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResult> {
    return executionService.adminTestCode(payload, signal);
  },

  async adminSubmitCode(payload: CodeExecutionPayload, signal?: AbortSignal): Promise<ExecutionResult> {
    return executionService.adminSubmitCode(payload, signal);
  },
};
