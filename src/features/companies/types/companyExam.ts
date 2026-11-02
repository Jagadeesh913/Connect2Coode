import type { Company, ReferenceItem } from '../../../core/types/domain';

export type ReferenceRef = ReferenceItem;

export type CompanyItem = Company;

export interface CompanyExamItem {
  id: number;
  companyId: number;
  examName: string;
  year: number;
  description: string;
  totalDurationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  sourceUrl: string;
  isActive: boolean;
}

export interface CompanyRoleItem {
  id: number;
  companyExamId: number;
  roleName: string;
  roleCode: string;
  salary: string;
  description: string;
}

export interface CompanyExamSectionItem {
  id: number;
  companyExamId: number;
  parentSectionId: number | null;
  sectionName: string;
  sectionType: ReferenceRef;
  questionType?: ReferenceRef | null;
  questionCount?: number | null;
  durationMinutes?: number | null;
  totalMarks?: number | null;
  sequenceNumber?: number;
  sections?: CompanyExamSectionItem[];
}

export interface CompanyExamDetailsData {
  exam: CompanyExamItem;
  roles: CompanyRoleItem[];
  pattern: CompanyExamSectionItem[];
}

export interface PaginatedData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PageRequestPayload {
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
