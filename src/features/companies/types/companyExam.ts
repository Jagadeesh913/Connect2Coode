import type { Company } from '../../../core/types/domain';

export interface ReferenceRef {
  id: number;
  refGroupCode: string;
  refCode: string;
  refName: string;
  isActive: boolean;
}

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
  jwtToken?: string | null;
}

// Admin Payloads
export interface SaveCompanyPayload {
  id: number | null;
  name: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface SaveCompanyRolePayload {
  id: number | null;
  companyExamId: number;
  roleName: string;
  roleCode: string;
  salary: string;
  description: string;
}

export interface SaveExamSectionPayload {
  id: number | null;
  companyExamId: number;
  parentSectionId: number | null;
  sectionName: string;
  sectionType: { id: number };
  questionType?: { id: number } | null;
  questionCount?: number | null;
  durationMinutes?: number | null;
  totalMarks?: number | null;
  sequenceNumber?: number;
}

export interface SaveCompanyExamPayload {
  id: number | null;
  companyId: number;
  examName: string;
  year: number;
  description: string;
  totalDurationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  sourceUrl: string;
}
