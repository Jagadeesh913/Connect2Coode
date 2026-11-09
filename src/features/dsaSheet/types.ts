import type { QuestionCompanySummary, QuestionPlatformSummary } from '../../core/types/domain';

export interface DsaSheet {
  id: number;
  sheetCode: string;
  sheetName: string;
  description: string;
  isActive: boolean;
}

export interface DsaSheetSection {
  id: number;
  sheetId: number;
  parentSectionId: number | null;
  sectionName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface DsaSheetQuestionSummary {
  id: number;
  title: string;
  description: string;
  difficultyId: number;
  difficultyName: string;
  topicId: number;
  topicName: string;
  isOwnProblem: boolean;
  isActive: boolean;
  companies: QuestionCompanySummary[];
  questionPlatform: QuestionPlatformSummary | null;
}

export interface DsaSheetQuestionLink {
  id: number;
  question: DsaSheetQuestionSummary;
  displayOrder: number;
  isActive: boolean;
  sectionId: number | null;
}

export interface SaveDsaSheetPayload {
  id?: number | null;
  sheetCode: string;
  sheetName: string;
  description: string;
  isActive: boolean;
}

export interface SaveDsaSheetSectionPayload {
  id?: number | null;
  sheetId: number;
  parentSectionId: number | null;
  sectionName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface LinkDsaSheetQuestionPayload {
  id: number | null;
  sectionId: number;
  question: { id: number };
  displayOrder: number;
  isActive: boolean;
}
