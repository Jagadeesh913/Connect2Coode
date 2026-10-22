import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type { Company, Problem } from '../../core/types/domain';
import { tokenStorage } from '../../core/security/tokenStorage';
import { companyService } from '../companyService';

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
  /**
   * POST /api/v1/company/list
   * Fetches company list from backend database with JWT token in request payload.
   */
  async getCompanies(signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    const token = tokenStorage.getAccessToken();
    const payload = {
      pageNumber: 0,
      pageSize: 100,
      sortBy: 'name',
      sortDirection: 'ASC',
      jwtToken: token,
    };
    const res: any = await apiClient.post(API_ENDPOINTS.COMPANY.LIST, payload, { signal });
    const rawData = res?.data || res;
    const content = Array.isArray(rawData?.content)
      ? rawData.content
      : Array.isArray(rawData)
      ? rawData
      : [];

    return {
      statusCode: 200,
      message: res?.message || 'Companies Fetched Successfully',
      data: content,
      errors: null,
      timestamp: res?.timestamp || new Date().toISOString(),
    };
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
   * Request Payload: { "id": null, "name": "...", "websiteUrl": "...", "logoUrl": "...", "description": "...", "isActive": true, "jwtToken": "..." }
   */
  async saveOrUpdateCompany(payload: CompanyItem): Promise<ApiResponse<Company>> {
    const token = tokenStorage.getAccessToken();
    const formattedPayload = {
      id: payload.id ? Number(payload.id) : null,
      name: payload.name.trim(),
      websiteUrl: payload.websiteUrl || (payload as any).website || '',
      logoUrl: payload.logoUrl || (payload as any).logo || '',
      description: payload.description || '',
      isActive: payload.isActive ?? true,
      jwtToken: token,
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
   * Request Payload: { "id": null, "companyExamId": 1, "roleName": "Ninja", "roleCode": "NINJA", "salary": "...", "description": "...", "jwtToken": "..." }
   */
  async saveOrUpdateCompanyRole(payload: {
    id: number | null;
    companyExamId: number;
    roleName: string;
    roleCode: string;
    salary: string;
    description: string;
  }): Promise<ApiResponse<any>> {
    const token = tokenStorage.getAccessToken();
    const formattedPayload = {
      id: payload.id ? Number(payload.id) : null,
      companyExamId: Number(payload.companyExamId),
      roleName: payload.roleName.trim(),
      roleCode: payload.roleCode.trim(),
      salary: payload.salary.trim(),
      description: payload.description?.trim() || '',
      jwtToken: token,
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_ROLE, formattedPayload);
  },

  /**
   * POST /api/v1/admin/examSection
   * Saves or updates an exam section / round
   * Request Payload: { "id": 10, "companyExamId": 1, "parentSectionId": 9, "sectionName": "SQL", "sectionType": { "id": 100 }, "questionType": { "id": 89 }, "questionCount": 10, "durationMinutes": 15, "totalMarks": 10, "sequenceNumber": 1, "jwtToken": "..." }
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
  }): Promise<ApiResponse<any>> {
    const token = tokenStorage.getAccessToken();
    const sectionTypeId =
      typeof payload.sectionType === 'object' && payload.sectionType
        ? payload.sectionType.id
        : Number(payload.sectionTypeId || payload.sectionType || 100);

    const questionTypeId =
      typeof payload.questionType === 'object' && payload.questionType
        ? payload.questionType.id
        : (payload.questionTypeId || payload.questionType ? Number(payload.questionTypeId || payload.questionType) : null);

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
      jwtToken: token,
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_EXAM_SECTION, formattedPayload);
  },

  /**
   * POST /api/v1/admin/companyExam
   * Saves or updates a company exam
   * Request Payload: { "id": 1, "companyId": 1, "examName": "TCS NQT", "year": 2026, "description": "...", "totalDurationMinutes": 120, "totalQuestions": 65, "totalMarks": 100, "sourceUrl": "...", "jwtToken": "..." }
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
  }): Promise<ApiResponse<any>> {
    const token = tokenStorage.getAccessToken();
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
      jwtToken: token,
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_EXAM, formattedPayload);
  },
};

