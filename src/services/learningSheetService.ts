import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
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

const isQuestion = (value: unknown): value is DsaSheetQuestionSummary =>
  isRecord(value) &&
  isPositiveId(value.id) &&
  typeof value.title === 'string' &&
  typeof value.description === 'string' &&
  typeof value.difficultyId === 'number' &&
  typeof value.difficultyName === 'string' &&
  typeof value.topicId === 'number' &&
  typeof value.topicName === 'string' &&
  typeof value.isOwnProblem === 'boolean' &&
  typeof value.isActive === 'boolean' &&
  typeof value.questionPlatform === 'string' &&
  Array.isArray(value.companies) &&
  value.companies.every((company) => typeof company === 'string');

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
    const response: any = await apiClient.get(API_ENDPOINTS.LEARNING_SHEET.LIST, { signal });
    return requireArray(response?.data, isSheet, 'learning sheets');
  },

  async getSections(sheetId: number, signal?: AbortSignal): Promise<DsaSheetSection[]> {
    assertId(sheetId, 'Sheet ID');
    const response: any = await apiClient.get(API_ENDPOINTS.LEARNING_SHEET.SECTIONS(sheetId), { signal });
    return requireArray(response?.data, isSection, 'learning sheet sections')
      .filter((section) => section.parentSectionId === null)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  },

  async getSectionQuestions(sectionId: number, signal?: AbortSignal): Promise<DsaSheetQuestionLink[]> {
    assertId(sectionId, 'Section ID');
    const response: any = await apiClient.get(
      API_ENDPOINTS.LEARNING_SHEET.SECTION_QUESTIONS(sectionId),
      { signal }
    );
    return requireArray(response?.data, isQuestionLink, 'learning sheet questions')
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  },
};
