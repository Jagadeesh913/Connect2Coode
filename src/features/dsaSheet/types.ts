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
  companies: string[];
  questionPlatform: string;
}

export interface DsaSheetQuestionLink {
  id: number;
  question: DsaSheetQuestionSummary;
  displayOrder: number;
  isActive: boolean;
  sectionId: number | null;
}

export interface CreateDsaSheetPayload {
  sheetCode: string;
  sheetName: string;
  description: string;
  isActive: boolean;
}

export interface CreateDsaSheetSectionPayload {
  sheetId: number;
  parentSectionId: number | null;
  sectionName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface LinkDsaSheetQuestionPayload {
  id: null;
  sectionId: number;
  question: { id: number };
  displayOrder: number;
  isActive: boolean;
}
