import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse, ApiPage } from '../core/types/api';
import type { McqQuestion, McqQueryPayload } from '../core/types/domain';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const optionalString = (value: unknown): string | null | undefined =>
  value === null || value === undefined ? value : typeof value === 'string' ? value : undefined;

const mapMcqQuestion = (value: unknown): McqQuestion => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    value.id <= 0
  ) {
    throw new Error('Unexpected MCQ record ID');
  }
  if (typeof value.question !== 'string' || !value.question.trim()) {
    throw new Error('Unexpected MCQ question text');
  }
  if (
    typeof value.subjectGroupCode !== 'string' ||
    typeof value.subjectRefCode !== 'string' ||
    typeof value.subjectRefName !== 'string'
  ) {
    throw new Error('Unexpected MCQ subject metadata');
  }

  const rawOptions = value.options === undefined || value.options === null ? [] : value.options;
  if (!Array.isArray(rawOptions)) throw new Error('Unexpected MCQ options format');
  const options = rawOptions.map((option, index) => {
    if (
      !isRecord(option) ||
      typeof option.optionLabel !== 'string' ||
      typeof option.optionText !== 'string' ||
      typeof option.isCorrect !== 'boolean'
    ) {
      throw new Error(`Unexpected MCQ option #${index + 1}`);
    }
    return {
      id: typeof option.id === 'number' && Number.isSafeInteger(option.id) ? option.id : undefined,
      optionLabel: option.optionLabel,
      optionText: option.optionText,
      isCorrect: option.isCorrect,
    };
  });

  return {
    id: Number(value.id),
    subjectGroupCode: value.subjectGroupCode,
    subjectRefCode: value.subjectRefCode,
    subjectRefName: value.subjectRefName,
    topicGroupCode: optionalString(value.topicGroupCode),
    topicRefCode: optionalString(value.topicRefCode),
    topicRefName: optionalString(value.topicRefName),
    difficultyGroupCode: optionalString(value.difficultyGroupCode),
    difficultyRefCode: optionalString(value.difficultyRefCode),
    difficultyRefName: optionalString(value.difficultyRefName),
    companyName: optionalString(value.companyName),
    companyId: value.companyId === null || value.companyId === undefined
      ? value.companyId
      : typeof value.companyId === 'number' && Number.isSafeInteger(value.companyId)
        ? value.companyId
        : null,
    question: value.question,
    explanation: optionalString(value.explanation),
    isActive: typeof value.isActive === 'boolean' ? value.isActive : undefined,
    options,
  };
};

const mapMcqPage = (value: unknown): ApiPage<McqQuestion> => {
  if (!isRecord(value) || !Array.isArray(value.content)) {
    throw new Error('Unexpected MCQ list response format');
  }
  const numberField = (field: unknown, label: string): number => {
    if (typeof field !== 'number' || !Number.isFinite(field)) {
      throw new Error(`Unexpected MCQ ${label}`);
    }
    return field;
  };
  const content = value.content.map(mapMcqQuestion);
  const totalPages = numberField(value.totalPages, 'total pages');
  const totalElements = numberField(value.totalElements, 'total elements');
  const size = numberField(value.size ?? value.pageSize, 'page size');
  const pageNumber = numberField(value.number ?? value.pageNumber, 'page number');
  return {
    content,
    pageable: value.pageable,
    last: typeof value.last === 'boolean' ? value.last : pageNumber + 1 >= totalPages,
    totalPages,
    totalElements,
    size,
    number: pageNumber,
    pageSize: typeof value.pageSize === 'number' ? value.pageSize : undefined,
    pageNumber: typeof value.pageNumber === 'number' ? value.pageNumber : undefined,
    sort: value.sort,
    numberOfElements: typeof value.numberOfElements === 'number'
      ? value.numberOfElements
      : content.length,
    first: typeof value.first === 'boolean' ? value.first : pageNumber === 0,
    empty: typeof value.empty === 'boolean' ? value.empty : content.length === 0,
  };
};

export const mcqService = {
  async getMcqList(payload: McqQueryPayload, signal?: AbortSignal): Promise<ApiResponse<ApiPage<McqQuestion>>> {
    const response: ApiResponse<unknown> = await apiClient.post(API_ENDPOINTS.MCQ.LIST, payload, { signal });
    return { ...response, data: mapMcqPage(response.data) };
  },

  async getMcqById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<McqQuestion>> {
    const response: ApiResponse<unknown> = await apiClient.get(API_ENDPOINTS.MCQ.DETAILS(id), { signal });
    return { ...response, data: mapMcqQuestion(response.data) };
  },

  /**
   * List rows are allowed to omit options. Fetch the authoritative detail only
   * when an answerable question is opened; never synthesize choices locally.
   */
  async getMcqForAnswering(question: McqQuestion, signal?: AbortSignal): Promise<McqQuestion> {
    if (Array.isArray(question.options) && question.options.length > 0) {
      return question;
    }

    const response = await this.getMcqById(question.id, signal);
    if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
      throw new Error('Unexpected MCQ detail response format');
    }
    return response.data;
  },
};
