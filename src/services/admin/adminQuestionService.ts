import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type {
  CodeExecutionPayload,
  ExecutionResult,
  PageRequest,
  Question,
  QuestionCompanySummary,
  QuestionListItem as DomainQuestionListItem,
  QuestionListRequest,
  QuestionPage,
  QuestionPlatformSummary,
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

/**
 * Resiliently normalizes a raw backend question list row into a strongly-typed
 * domain QuestionListItem. Accommodates real Spring Boot API variations including
 * nullable descriptions, nullable company logos/websites, string company arrays,
 * and string/null question platforms without dropping valid catalog rows.
 */
export const normalizeQuestionListItem = (
  value: unknown,
  fallbackIndex = 0
): DomainQuestionListItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const hasQuestionShape =
    value.id !== undefined ||
    value.questionId !== undefined ||
    value.title !== undefined ||
    value.questionTitle !== undefined ||
    value.questionName !== undefined ||
    value.problemTitle !== undefined ||
    value.name !== undefined ||
    value.difficultyName !== undefined ||
    value.difficultyRefName !== undefined ||
    value.difficultyId !== undefined ||
    value.topicName !== undefined ||
    value.topicRefName !== undefined ||
    value.topicId !== undefined ||
    value.companies !== undefined ||
    value.questionPlatform !== undefined;

  if (!hasQuestionShape) {
    return null;
  }

  const rawId = value.id ?? value.questionId ?? value.idQuestion ?? value._id;
  let id: number;
  if (typeof rawId === 'number' && Number.isInteger(rawId) && rawId > 0) {
    id = rawId;
  } else if (rawId !== undefined && rawId !== null) {
    const parsed = parseInt(String(rawId).replace(/\D/g, ''), 10);
    id = Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackIndex + 1;
  } else {
    id = fallbackIndex + 1;
  }

  const rawTitle =
    value.title ??
    value.questionTitle ??
    value.questionName ??
    value.problemTitle ??
    value.name;
  const title =
    typeof rawTitle === 'string' && rawTitle.trim()
      ? rawTitle.trim()
      : `Problem #${id}`;

  const description = typeof value.description === 'string' ? value.description : '';

  const rawDiffId = value.difficultyId;
  const difficultyId =
    typeof rawDiffId === 'number' && Number.isInteger(rawDiffId) && rawDiffId > 0
      ? rawDiffId
      : 0;
  const difficultyName =
    typeof value.difficultyName === 'string' && value.difficultyName
      ? value.difficultyName
      : typeof value.difficultyRefName === 'string' && value.difficultyRefName
      ? value.difficultyRefName
      : typeof value.difficulty === 'string' && value.difficulty
      ? value.difficulty
      : '';

  const rawTopicId = value.topicId;
  const topicId =
    typeof rawTopicId === 'number' && Number.isInteger(rawTopicId) && rawTopicId > 0
      ? rawTopicId
      : 0;
  const topicName =
    typeof value.topicName === 'string' && value.topicName
      ? value.topicName
      : typeof value.topicRefName === 'string' && value.topicRefName
      ? value.topicRefName
      : typeof value.topic === 'string' && value.topic
      ? value.topic
      : '';

  const isOwnProblem = typeof value.isOwnProblem === 'boolean' ? value.isOwnProblem : true;
  const isActive = typeof value.isActive === 'boolean' ? value.isActive : true;

  const companies: QuestionCompanySummary[] = [];
  if (Array.isArray(value.companies)) {
    for (let i = 0; i < value.companies.length; i++) {
      const comp = value.companies[i];
      if (typeof comp === 'string' && comp.trim()) {
        companies.push({
          id: i + 1,
          name: comp.trim(),
          logo: '',
          website: '',
          isActive: true,
        });
      } else if (isRecord(comp)) {
        const compId =
          typeof comp.id === 'number' && Number.isInteger(comp.id) && comp.id > 0
            ? comp.id
            : i + 1;
        const compName = typeof comp.name === 'string' ? comp.name.trim() : '';
        if (compName) {
          companies.push({
            id: compId,
            name: compName,
            logo: typeof comp.logo === 'string' ? comp.logo : '',
            website: typeof comp.website === 'string' ? comp.website : '',
            isActive: typeof comp.isActive === 'boolean' ? comp.isActive : true,
          });
        }
      }
    }
  }

  let questionPlatform: QuestionPlatformSummary | null = null;
  const rawPlatform =
    value.questionPlatform ?? value.platform ?? value.examPlatform ?? value.platformName;
  if (rawPlatform && typeof rawPlatform === 'object' && !Array.isArray(rawPlatform)) {
    const p = rawPlatform as Record<string, unknown>;
    const pId = typeof p.id === 'number' && Number.isInteger(p.id) && p.id > 0 ? p.id : 0;
    const pRefName =
      typeof p.refName === 'string'
        ? p.refName
        : typeof p.name === 'string'
        ? p.name
        : '';
    const pRefCode =
      typeof p.refCode === 'string'
        ? p.refCode
        : pRefName
        ? pRefName.toUpperCase()
        : '';
    const pRefGroupCode =
      typeof p.refGroupCode === 'string' ? p.refGroupCode : 'QPF';
    const pRefGroupName =
      typeof p.refGroupName === 'string' ? p.refGroupName : null;
    const pLogoUrl = typeof p.logoUrl === 'string' ? p.logoUrl : null;
    const pIsActive = typeof p.isActive === 'boolean' ? p.isActive : true;

    if (pRefName || pRefCode) {
      questionPlatform = {
        id: pId,
        refGroupCode: pRefGroupCode,
        refGroupName: pRefGroupName,
        refCode: pRefCode,
        refName: pRefName,
        isActive: pIsActive,
        logoUrl: pLogoUrl,
      };
    }
  } else if (typeof rawPlatform === 'string' && rawPlatform.trim()) {
    const trimmed = rawPlatform.trim();
    questionPlatform = {
      id: 0,
      refGroupCode: 'QPF',
      refGroupName: null,
      refCode: trimmed.toUpperCase(),
      refName: trimmed,
      isActive: true,
      logoUrl: null,
    };
  }

  return {
    id,
    title,
    description,
    difficultyId,
    difficultyName,
    topicId,
    topicName,
    companies,
    questionPlatform,
    isOwnProblem,
    isActive,
  };
};

export const isQuestionListItem = (value: unknown): value is DomainQuestionListItem =>
  normalizeQuestionListItem(value) !== null;

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

  const normalizedContent: DomainQuestionListItem[] = [];
  for (let i = 0; i < data.content.length; i++) {
    const item = data.content[i];
    if (!isRecord(item)) {
      continue;
    }
    const normalized = normalizeQuestionListItem(item, i);
    if (normalized) {
      normalizedContent.push(normalized);
    }
  }

  if (data.content.length > 0 && normalizedContent.length === 0) {
    throw new Error('Unexpected questions list item format');
  }

  response.data = {
    ...(data as unknown as PaginatedQuestionResponse),
    content: normalizedContent,
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
