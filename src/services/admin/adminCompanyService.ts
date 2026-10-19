import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type { Company, Problem } from '../../core/types/domain';

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
   * GET /api/v1/company
   * Fetches company list from backend database.
   */
  async getCompanies(signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    return apiClient.get(API_ENDPOINTS.COMPANY.BASE, { signal });
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
   * Verified working admin endpoint: POST /api/v1/admin/company
   */
  async saveOrUpdateCompany(payload: CompanyItem): Promise<ApiResponse<Company>> {
    const formattedPayload = {
      ...(payload.id ? { id: Number(payload.id) } : {}),
      name: payload.name.trim(),
      website: payload.websiteUrl || (payload as any).website || '',
      websiteUrl: payload.websiteUrl || (payload as any).website || '',
      logo: payload.logoUrl || (payload as any).logo || '',
      logoUrl: payload.logoUrl || (payload as any).logo || '',
      description: payload.description || '',
      isActive: payload.isActive ?? true,
    };
    return apiClient.post(API_ENDPOINTS.COMPANY.ADMIN_BASE, formattedPayload);
  },

  /**
   * GET /api/v1/company/:id/problems
   * Fetches questions/problems associated with a specific company.
   */
  async getCompanyProblems(id: string | number, signal?: AbortSignal): Promise<ApiResponse<Problem[]>> {
    return apiClient.get(API_ENDPOINTS.COMPANY.PROBLEMS(id), { signal });
  },
};
