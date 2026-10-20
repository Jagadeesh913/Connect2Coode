import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Company, Problem } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';
import { tokenStorage } from '../core/security/tokenStorage';
import type {
  CompanyExamItem,
  CompanyExamDetailsData,
  PaginatedData,
  PageRequestPayload,
} from '../features/companies/types/companyExam';

export type CompanyItem = Company;

export const companyService = {
  /**
   * POST /api/v1/company/list
   * Fetches paginated company list with sort & pagination parameters
   */
  async getCompaniesPaginated(
    pageRequest: Partial<PageRequestPayload> = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PaginatedData<CompanyItem>>> {
    const payload = {
      pageNumber: pageRequest.pageNumber ?? 0,
      pageSize: pageRequest.pageSize ?? 24,
      sortBy: pageRequest.sortBy ?? 'name',
      sortDirection: pageRequest.sortDirection ?? 'ASC',
      token: tokenStorage.getAccessToken(),
      jwtToken: tokenStorage.getAccessToken(),
    };

    try {
      const res: any = await apiClient.post(API_ENDPOINTS.COMPANY.LIST, payload, { signal });
      const rawData = res?.data || res;
      const content = Array.isArray(rawData?.content)
        ? rawData.content
        : Array.isArray(rawData)
        ? rawData
        : [];

      const mappedContent = content.map((item: any) => {
        const name = item.name || item.companyName || '';
        const safeSlug =
          item.slug ||
          (item.id ? String(item.id) : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

        return {
          ...item,
          id: item.id ?? safeSlug,
          name,
          slug: safeSlug,
          logo: item.logo || item.logoUrl || '',
          logoUrl: item.logoUrl || item.logo || '',
          website: item.website || item.websiteUrl || '',
          websiteUrl: item.websiteUrl || item.website || '',
        };
      });

      return {
        statusCode: 200,
        message: res?.message || 'Companies Fetched Successfully',
        data: {
          content: mappedContent,
          pageNumber: rawData?.pageNumber ?? payload.pageNumber,
          pageSize: rawData?.pageSize ?? payload.pageSize,
          totalElements: rawData?.totalElements ?? mappedContent.length,
          totalPages: rawData?.totalPages ?? 1,
          first: rawData?.first ?? true,
          last: rawData?.last ?? true,
        },
        errors: null,
        timestamp: res?.timestamp || new Date().toISOString(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      const status = err?.statusCode || err?.response?.status;
      if (status === 404) {
        // Fallback to GET /company if list route returns 404
        const fallbackRes: any = await apiClient.get(API_ENDPOINTS.COMPANY.BASE, { signal });
        const raw = fallbackRes?.data || fallbackRes;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : [];
        const mappedList = list.map((item: any) => {
          const name = item.name || item.companyName || '';
          const safeSlug =
            item.slug ||
            (item.id ? String(item.id) : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
          return {
            ...item,
            id: item.id ?? safeSlug,
            name,
            slug: safeSlug,
            logo: item.logo || item.logoUrl || '',
            logoUrl: item.logoUrl || item.logo || '',
          };
        });

        return {
          statusCode: 200,
          message: 'Companies Fetched Successfully',
          data: {
            content: mappedList,
            pageNumber: 0,
            pageSize: mappedList.length,
            totalElements: mappedList.length,
            totalPages: 1,
            first: true,
            last: true,
          },
          errors: null,
          timestamp: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  /**
   * Fetches full list of companies for selector dropdowns / filters
   */
  async getCompanies(search?: string, signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    try {
      const res = await this.getCompaniesPaginated(
        { pageNumber: 0, pageSize: 100, sortBy: 'name', sortDirection: 'ASC' },
        signal
      );
      let content = res.data.content;
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        content = content.filter((c) => c.name?.toLowerCase().includes(q));
      }
      return {
        statusCode: 200,
        message: 'Companies Fetched Successfully',
        data: content,
        errors: null,
        timestamp: res.timestamp,
      };
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      throw err;
    }
  },

  /**
   * POST /api/v1/company/:companyId/exams/list
   * Fetches exams associated with a company
   */
  async getCompanyExamsList(
    companyId: number | string,
    pageRequest: Partial<PageRequestPayload> = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PaginatedData<CompanyExamItem>>> {
    const payload = {
      pageNumber: pageRequest.pageNumber ?? 0,
      pageSize: pageRequest.pageSize ?? 20,
      sortBy: pageRequest.sortBy ?? 'year',
      sortDirection: pageRequest.sortDirection ?? 'DESC',
      token: tokenStorage.getAccessToken(),
      jwtToken: tokenStorage.getAccessToken(),
    };

    try {
      const res: any = await apiClient.post(
        API_ENDPOINTS.COMPANY.EXAMS(companyId),
        payload,
        { signal }
      );
      const rawData = res?.data || res;
      const content: CompanyExamItem[] = Array.isArray(rawData?.content)
        ? rawData.content
        : Array.isArray(rawData)
        ? rawData
        : [];

      return {
        statusCode: 200,
        message: res?.message || 'Company Exams Fetched Successfully',
        data: {
          content,
          pageNumber: rawData?.pageNumber ?? payload.pageNumber,
          pageSize: rawData?.pageSize ?? payload.pageSize,
          totalElements: rawData?.totalElements ?? content.length,
          totalPages: rawData?.totalPages ?? 1,
          first: rawData?.first ?? true,
          last: rawData?.last ?? true,
        },
        errors: null,
        timestamp: res?.timestamp || new Date().toISOString(),
      };
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      throw err;
    }
  },

  /**
   * GET /api/v1/company/exams/:examId
   * Fetches complete details of a company exam (exam, roles, pattern)
   */
  async getCompanyExamDetails(
    examId: number | string,
    signal?: AbortSignal
  ): Promise<ApiResponse<CompanyExamDetailsData>> {
    try {
      const res: any = await apiClient.get(
        API_ENDPOINTS.COMPANY.EXAM_DETAILS(examId),
        { signal }
      );
      const rawData = res?.data || res;

      return {
        statusCode: 200,
        message: res?.message || 'Company Exam Details Fetched Successfully',
        data: {
          exam: rawData?.exam || rawData,
          roles: Array.isArray(rawData?.roles) ? rawData.roles : [],
          pattern: Array.isArray(rawData?.pattern) ? rawData.pattern : [],
        },
        errors: null,
        timestamp: res?.timestamp || new Date().toISOString(),
      };
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      throw err;
    }
  },

  async getCompanyBySlug(slug: string, signal?: AbortSignal): Promise<ApiResponse<Company>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(slug), { signal });
      const compData = res?.data || res;

      if (compData && (compData.id || compData.name)) {
        const name = compData.name || compData.companyName || '';
        const safeSlug =
          compData.slug ||
          (compData.id ? String(compData.id) : '') ||
          slug ||
          name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        return {
          statusCode: 200,
          message: 'Company Fetched Successfully',
          data: {
            ...compData,
            name,
            slug: safeSlug,
          },
          errors: null,
          timestamp: new Date().toISOString(),
        };
      }

    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      // F-012: Only genuine HTTP 404 responses trigger catalog search fallback.
      // Propagate HTTP 500, network failures, auth errors, and any non-404 failures.
      const status = err?.statusCode || err?.response?.status || err?.status;
      if (status !== 404) {
        throw err;
      }
    }

    const allCompRes = await this.getCompanies(undefined, signal);
    const normalizedSlug = slug.toLowerCase();
    const matched = allCompRes.data.find(
      (company) =>
        String(company.id) === String(slug) ||
        company.slug?.toLowerCase() === normalizedSlug ||
        company.name?.toLowerCase() === normalizedSlug ||
        company.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalizedSlug
    );

    if (!matched) {
      throw new Error(`Company not found for slug: ${slug}`);
    }

    return {
      statusCode: 200,
      message: 'Company Fetched Successfully',
      data: matched,
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  async getCompanyProblems(
    companyIdOrName?: string | number,
    companyName?: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<Problem[]>> {
    const numericCandidate =
      companyIdOrName !== undefined &&
      String(companyIdOrName).trim() !== '' &&
      !Number.isNaN(Number(companyIdOrName))
        ? Number(companyIdOrName)
        : undefined;

    const nameStr =
      companyName?.trim() ||
      (numericCandidate === undefined && companyIdOrName !== undefined
        ? String(companyIdOrName).trim()
        : undefined);

    const problemsList: Problem[] = [];
    const seenTitles = new Set<string>();
    let lastBackendError: unknown = null;

    if (numericCandidate !== undefined) {
      try {
        const payload = {
          level: null,
          companies: [numericCandidate],
          topic: null,
          searchText: null,
          pageRequest: {
            pageNumber: 0,
            pageSize: 50,
            sortBy: 'id',
            sortDirection: 'ASC' as const,
          },
        };

        const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
        const raw = res?.data || res;
        const list = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : null;

        if (!list) {
          throw new Error('Unexpected company problems response format');
        }

        for (const item of list) {
          const problem = mapProblemDto(item, { fallbackCompany: nameStr });
          const normalizedTitle = problem.title.toLowerCase().trim();
          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            problemsList.push(problem);
          }
        }
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        lastBackendError = err;
      }
    }

    if (problemsList.length === 0 && nameStr) {
      try {
        const payload = {
          level: null,
          companies: null,
          topic: null,
          searchText: nameStr,
          pageRequest: {
            pageNumber: 0,
            pageSize: 50,
            sortBy: 'id',
            sortDirection: 'ASC' as const,
          },
        };

        const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
        const raw = res?.data || res;
        const list = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : null;

        if (!list) {
          throw new Error('Unexpected company search response format');
        }

        for (const item of list) {
          const problem = mapProblemDto(item, { fallbackCompany: nameStr });
          const normalizedTitle = problem.title.toLowerCase().trim();
          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            problemsList.push(problem);
          }
        }
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        lastBackendError = err;
      }
    }

    if (problemsList.length === 0 && lastBackendError) {
      throw lastBackendError;
    }

    return {
      statusCode: 200,
      message: 'Company Problems Fetched Successfully',
      data: problemsList,
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },
};
