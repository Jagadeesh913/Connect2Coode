import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { QuestionCompanySummary, QuestionPlatformSummary } from '../core/types/domain';
import type {
  DsaSheet,
  DsaSheetQuestionLink,
  DsaSheetQuestionSummary,
  DsaSheetSection,
} from '../features/dsaSheet/types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isPositiveId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isSheet = (value: unknown): value is DsaSheet =>
  isRecord(value) &&
  isPositiveId(value.id) &&
  typeof value.sheetCode === 'string' &&
  typeof value.sheetName === 'string' &&
  typeof value.description === 'string' &&
  typeof value.isActive === 'boolean';

const isSection = (value: unknown): value is DsaSheetSection =>
  isRecord(value) &&
  isPositiveId(value.id) &&
  isPositiveId(value.sheetId) &&
  (value.parentSectionId === null || isPositiveId(value.parentSectionId)) &&
  typeof value.sectionName === 'string' &&
  typeof value.displayOrder === 'number' &&
  typeof value.isActive === 'boolean';

const isQuestionCompany = (value: unknown): value is QuestionCompanySummary =>
  isRecord(value) &&
  isPositiveId(value.id) &&
  typeof value.name === 'string' &&
  typeof value.logo === 'string' &&
  typeof value.website === 'string' &&
  typeof value.isActive === 'boolean';

const isQuestionPlatform = (value: unknown): value is QuestionPlatformSummary | null =>
  value === null ||
  (isRecord(value) &&
    isPositiveId(value.id) &&
    typeof value.refGroupCode === 'string' &&
    (value.refGroupName === null || typeof value.refGroupName === 'string') &&
    typeof value.refCode === 'string' &&
    typeof value.refName === 'string' &&
    typeof value.isActive === 'boolean' &&
    (value.logoUrl === null || typeof value.logoUrl === 'string'));

const isQuestion = (value: unknown): value is DsaSheetQuestionSummary =>
  isRecord(value) &&
  isPositiveId(value.id) &&
  typeof value.title === 'string' &&
  typeof value.description === 'string' &&
  isPositiveId(value.difficultyId) &&
  typeof value.difficultyName === 'string' &&
  isPositiveId(value.topicId) &&
  typeof value.topicName === 'string' &&
  typeof value.isOwnProblem === 'boolean' &&
  typeof value.isActive === 'boolean' &&
  isQuestionPlatform(value.questionPlatform) &&
  Array.isArray(value.companies) &&
  value.companies.every(isQuestionCompany);

const isQuestionLink = (value: unknown): value is DsaSheetQuestionLink =>
  isRecord(value) &&
  isPositiveId(value.id) &&
  isQuestion(value.question) &&
  typeof value.displayOrder === 'number' &&
  typeof value.isActive === 'boolean' &&
  (value.sectionId === null || isPositiveId(value.sectionId));

const requireArray = <T>(value: unknown, guard: (item: unknown) => item is T, label: string): T[] => {
  if (!Array.isArray(value) || !value.every(guard)) {
    throw new Error(`Unexpected ${label} response format`);
  }
  return value;
};

const assertId = (id: number, label: string): void => {
  if (!isPositiveId(id)) throw new Error(`${label} must be a positive integer`);
};

export const learningSheetService = {
  async getSheets(signal?: AbortSignal): Promise<DsaSheet[]> {
    const response: ApiResponse<unknown> = await apiClient.get(API_ENDPOINTS.LEARNING_SHEET.LIST, { signal });
    return requireArray(response.data, isSheet, 'learning sheets');
  },

  async getSheet(sheetId: number, signal?: AbortSignal): Promise<DsaSheet> {
    assertId(sheetId, 'Sheet ID');
    const response: ApiResponse<unknown> = await apiClient.get(
      API_ENDPOINTS.LEARNING_SHEET.DETAILS(sheetId),
      { signal }
    );
    if (!isSheet(response.data) || response.data.id !== sheetId) {
      throw new Error('Unexpected learning sheet response format');
    }
    return response.data;
  },

  async getSections(sheetId: number, signal?: AbortSignal): Promise<DsaSheetSection[]> {
    assertId(sheetId, 'Sheet ID');
    const response: ApiResponse<unknown> = await apiClient.get(API_ENDPOINTS.LEARNING_SHEET.SECTIONS(sheetId), { signal });
    return requireArray(response.data, isSection, 'learning sheet sections')
      .filter((section) => section.sheetId === sheetId)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  },

  async getSectionQuestions(sectionId: number, signal?: AbortSignal): Promise<DsaSheetQuestionLink[]> {
    assertId(sectionId, 'Section ID');
    const response: ApiResponse<unknown> = await apiClient.get(
      API_ENDPOINTS.LEARNING_SHEET.SECTION_QUESTIONS(sectionId),
      { signal }
    );
    const links = requireArray(response.data, isQuestionLink, 'learning sheet questions');
    if (links.some((link) => link.sectionId !== null && link.sectionId !== sectionId)) {
      throw new Error('Unexpected learning sheet questions response format');
    }
    return links
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  },
};
