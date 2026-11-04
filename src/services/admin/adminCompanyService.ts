import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type { Company, Problem } from '../../core/types/domain';
import { companyService } from '../companyService';
import type {
  CompanyExamItem,
  CompanyExamSectionItem,
  CompanyRoleItem,
  PageRequestPayload,
  PaginatedData,
} from '../../features/companies/types/companyExam';

export type CompanyItem = Company;

/**
 * Verified Strict Company API Contract
 * Strictly maps to backend Spring Boot REST DTO fields.
 */
/**
 * Dedicated Admin Company Service Layer
 * REAL API ONLY — Bypasses mock data entirely.
 * Uses shared `apiClient` to interact with Java Spring Boot backend.
 */
export const adminCompanyService = {
  async getCompaniesPaginated(
    pageRequest: Partial<PageRequestPayload>,
    signal?: AbortSignal
  ): Promise<ApiResponse<PaginatedData<Company>>> {
    return companyService.getCompaniesPaginated(pageRequest, signal);
  },

  /**
   * POST /api/v1/company/list
   * Fetches the company list with bearer authentication and business fields only.
   */
  async getCompanies(signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    return companyService.getAllCompanies(signal);
  },

  /**
   * GET /api/v1/company/:id
   * Fetches single company details directly from backend database.
   */
  async getCompanyById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<Company>> {
    return apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(id), { signal });
  },

  /**
   * POST /api/v1/admin/company
   * Saves a new company (id: null) or updates an existing company (id: number).
   * The read DTO exposes `website` and `logo`. The write DTO has not been
   * safely live-verified, so preserve those exact field names rather than
   * inventing client-only URL aliases.
   */
  async saveOrUpdateCompany(payload: CompanyItem): Promise<ApiResponse<Company>> {
    const formattedPayload = {
      id: payload.id ? Number(payload.id) : null,
      name: payload.name.trim(),
      website: payload.website || '',
      logo: payload.logo || '',
      description: payload.description || '',
      isActive: payload.isActive ?? true,
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_BASE, formattedPayload);
  },

  /**
   * POST /api/v1/questions (filtered by company)
   * Fetches questions/problems associated with a specific company.
   */
  async getCompanyProblems(id: string | number, signal?: AbortSignal): Promise<ApiResponse<Problem[]>> {
    return companyService.getCompanyProblems(id, undefined, signal);
  },

  /**
   * POST /api/v1/admin/companyRole
   * Saves or updates a company exam role
   * Authentication fields are attached centrally by apiClient.
   */
  async saveOrUpdateCompanyRole(payload: {
    id: number | null;
    companyExamId: number;
    roleName: string;
    roleCode: string;
    salary: string;
    description: string;
  }): Promise<ApiResponse<CompanyRoleItem>> {
    const formattedPayload = {
      id: payload.id ? Number(payload.id) : null,
      companyExamId: Number(payload.companyExamId),
      roleName: payload.roleName.trim(),
      roleCode: payload.roleCode.trim(),
      salary: payload.salary.trim(),
      description: payload.description?.trim() || '',
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_ROLE, formattedPayload);
  },

  /**
   * POST /api/v1/admin/examSection
   * Saves or updates an exam section / round
   * Section and question type IDs must come from the reference library.
   */
  async saveOrUpdateExamSection(payload: {
    id: number | null;
    companyExamId: number;
    parentSectionId?: number | null;
    sectionName: string;
    sectionTypeId?: number;
    sectionType?: { id: number } | number;
    questionTypeId?: number | null;
    questionType?: { id: number } | number | null;
    questionCount?: number | null;
    durationMinutes?: number | null;
    totalMarks?: number | null;
    sequenceNumber?: number;
  }): Promise<ApiResponse<CompanyExamSectionItem>> {
    const sectionTypeId =
      typeof payload.sectionType === 'object' && payload.sectionType
        ? payload.sectionType.id
        : Number(payload.sectionTypeId || payload.sectionType);

    const questionTypeId =
      typeof payload.questionType === 'object' && payload.questionType
        ? payload.questionType.id
        : (payload.questionTypeId || payload.questionType ? Number(payload.questionTypeId || payload.questionType) : null);

    if (!Number.isInteger(sectionTypeId) || sectionTypeId <= 0) {
      throw new Error('Section classification must be selected from the reference library.');
    }
    if (questionTypeId !== null && (!Number.isInteger(questionTypeId) || questionTypeId <= 0)) {
      throw new Error('Question type must be selected from the reference library.');
    }

    const formattedPayload = {
      id: payload.id ? Number(payload.id) : null,
      companyExamId: Number(payload.companyExamId),
      parentSectionId: payload.parentSectionId ? Number(payload.parentSectionId) : null,
      sectionName: payload.sectionName.trim(),
      sectionType: { id: sectionTypeId },
      questionType: questionTypeId ? { id: questionTypeId } : null,
      questionCount: payload.questionCount !== undefined && payload.questionCount !== null ? Number(payload.questionCount) : null,
      durationMinutes: payload.durationMinutes !== undefined && payload.durationMinutes !== null ? Number(payload.durationMinutes) : null,
      totalMarks: payload.totalMarks !== undefined && payload.totalMarks !== null ? Number(payload.totalMarks) : null,
      sequenceNumber: payload.sequenceNumber ? Number(payload.sequenceNumber) : 1,
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_EXAM_SECTION, formattedPayload);
  },

  /**
   * POST /api/v1/admin/companyExam
   * Saves or updates a company exam
   * Authentication fields are attached centrally by apiClient.
   */
  async saveOrUpdateCompanyExam(payload: {
    id: number | null;
    companyId: number;
    examName: string;
    year: number;
    description: string;
    totalDurationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    sourceUrl?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<CompanyExamItem>> {
    const formattedPayload = {
      id: payload.id ? Number(payload.id) : null,
      companyId: Number(payload.companyId),
      examName: payload.examName.trim(),
      year: Number(payload.year),
      description: payload.description?.trim() || '',
      totalDurationMinutes: Number(payload.totalDurationMinutes) || 0,
      totalQuestions: Number(payload.totalQuestions) || 0,
      totalMarks: Number(payload.totalMarks) || 0,
      sourceUrl: payload.sourceUrl?.trim() || '',
      isActive: payload.isActive ?? true,
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_EXAM, formattedPayload);
  },
};

