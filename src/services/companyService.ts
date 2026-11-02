import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Company, Problem } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';
import { fetchResilientQuestionPage } from './admin/adminQuestionService';
import type {
  CompanyExamItem,
  CompanyExamDetailsData,
  PaginatedData,
  PageRequestPayload,
} from '../features/companies/types/companyExam';

export type CompanyItem = Company;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const mapCompanyItem = (value: unknown): CompanyItem => {
  if (!isRecord(value) || typeof value.name !== 'string' || !value.name.trim()) {
    throw new Error('Unexpected company record format');
  }
  const id = typeof value.id === 'string' || typeof value.id === 'number' ? value.id : null;
  const slug = typeof value.slug === 'string' && value.slug.trim()
    ? value.slug
    : id !== null
    ? String(id)
    : value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    ...(value as unknown as Company),
    id: id ?? slug,
    name: value.name,
    slug,
    logo: typeof value.logo === 'string' ? value.logo : '',
    website: typeof value.website === 'string' ? value.website : '',
  };
};

const normalizePage = <T>(
  data: unknown,
  fallbackPageNumber: number,
  fallbackPageSize: number,
  mapItem: (item: unknown) => T,
  label: string
): PaginatedData<T> => {
  const page = isRecord(data) ? data : null;
  const rawContent = Array.isArray(data) ? data : page && Array.isArray(page.content) ? page.content : null;
  if (!rawContent) throw new Error(`Unexpected ${label} response format`);
  const content = rawContent.map(mapItem);
  const numberValue = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  return {
    content,
    pageNumber: numberValue(page?.pageNumber, fallbackPageNumber),
    pageSize: numberValue(page?.pageSize, fallbackPageSize),
    totalElements: numberValue(page?.totalElements, content.length),
    totalPages: numberValue(page?.totalPages, 1),
    first: typeof page?.first === 'boolean' ? page.first : fallbackPageNumber === 0,
    last: typeof page?.last === 'boolean' ? page.last : true,
  };
};

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
    };

    const res: ApiResponse<unknown> = await apiClient.post(API_ENDPOINTS.COMPANY.LIST, payload, { signal });
    return {
      ...res,
      data: normalizePage(res.data, payload.pageNumber, payload.pageSize, mapCompanyItem, 'companies'),
    };
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
   * Loads the complete company catalog so client-side search and industry
   * filters operate across every server page, not only the visible page.
   */
  async getAllCompanies(signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    const firstPage = await this.getCompaniesPaginated(
      { pageNumber: 0, pageSize: 100, sortBy: 'name', sortDirection: 'ASC' },
      signal
    );
    const pages: PaginatedData<CompanyItem>[] = [firstPage.data];
    const totalPages = Math.max(1, Number(firstPage.data.totalPages) || 1);

    for (let pageNumber = 1; pageNumber < totalPages; pageNumber += 1) {
      signal?.throwIfAborted();
      const response = await this.getCompaniesPaginated(
        { pageNumber, pageSize: 100, sortBy: 'name', sortDirection: 'ASC' },
        signal
      );
      pages.push(response.data);
    }

    const seen = new Set<string>();
    const companies = pages.flatMap((page) => page.content).filter((company) => {
      const key = String(company.id ?? company.slug ?? company.name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      statusCode: 200,
      message: 'Companies Fetched Successfully',
      data: companies,
      errors: null,
      timestamp: firstPage.timestamp,
    };
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
    };

    const res: ApiResponse<unknown> = await apiClient.post(
      API_ENDPOINTS.COMPANY.EXAMS(companyId),
      payload,
      { signal }
    );
    return {
      ...res,
      data: normalizePage(
        res.data,
        payload.pageNumber,
        payload.pageSize,
        (item) => {
          if (!isRecord(item) || typeof item.id !== 'number' || typeof item.examName !== 'string') {
            throw new Error('Unexpected company exam record format');
          }
          return item as unknown as CompanyExamItem;
        },
        'company exams'
      ),
    };
  },

  /**
   * GET /api/v1/company/exams/:examId
   * Fetches complete details of a company exam (exam, roles, pattern)
   */
  async getCompanyExamDetails(
    examId: number | string,
    signal?: AbortSignal
  ): Promise<ApiResponse<CompanyExamDetailsData>> {
    const res: ApiResponse<unknown> = await apiClient.get(
      API_ENDPOINTS.COMPANY.EXAM_DETAILS(examId),
      { signal }
    );
    if (!isRecord(res.data) || !isRecord(res.data.exam)) {
      throw new Error('Unexpected company exam details response format');
    }
    if (!Array.isArray(res.data.roles) || !Array.isArray(res.data.pattern)) {
      throw new Error('Unexpected company exam details response format');
    }
    return {
      ...res,
      data: {
        exam: res.data.exam as unknown as CompanyExamItem,
        roles: res.data.roles as CompanyExamDetailsData['roles'],
        pattern: res.data.pattern as CompanyExamDetailsData['pattern'],
      },
    };
  },

  async getCompanyBySlug(slug: string, signal?: AbortSignal): Promise<ApiResponse<Company>> {
    try {
      const res: ApiResponse<unknown> = await apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(slug), { signal });
      return { ...res, data: mapCompanyItem(res.data) };

    } catch (err: unknown) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      // F-012: Only genuine HTTP 404 responses trigger catalog search fallback.
      // Propagate HTTP 500, network failures, auth errors, and any non-404 failures.
      const error = err && typeof err === 'object' ? err as {
        statusCode?: number;
        status?: number;
        response?: { status?: number };
      } : null;
      const status = error?.statusCode || error?.response?.status || error?.status;
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
    let lastAttemptFailed = false;

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

        const res = await fetchResilientQuestionPage(payload, signal);
        const list = res.data.content;

        for (const item of list) {
          const problem = mapProblemDto(item);
          const normalizedTitle = problem.title.toLowerCase().trim();
          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            problemsList.push(problem);
          }
        }
        lastAttemptFailed = false;
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        lastBackendError = err;
        lastAttemptFailed = true;
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

        const res = await fetchResilientQuestionPage(payload, signal);
        const list = res.data.content;

        for (const item of list) {
          const problem = mapProblemDto(item);
          const normalizedTitle = problem.title.toLowerCase().trim();
          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            problemsList.push(problem);
          }
        }
        lastAttemptFailed = false;
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        lastBackendError = err;
        lastAttemptFailed = true;
      }
    }

    if (problemsList.length === 0 && lastAttemptFailed && lastBackendError) {
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
