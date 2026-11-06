import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Company, Problem, QuestionListRequest } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';
import { fetchQuestionPage } from './admin/adminQuestionService';
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
  mapItem: (item: unknown) => T,
  label: string
): PaginatedData<T> => {
  const page = isRecord(data) ? data : null;
  const rawContent =
    page && Array.isArray(page.content)
      ? page.content
      : Array.isArray(data)
      ? data
      : null;
  if (!rawContent) throw new Error(`Unexpected ${label} response format`);
  const content = rawContent.map(mapItem);
  const optionalNumber = (primary: unknown, alias: unknown, fallback: number): number => {
    const value = typeof primary === 'number' ? primary : alias;
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  };
  const pageNumber = optionalNumber(page?.pageNumber, page?.number, 0);
  const pageSize = optionalNumber(page?.pageSize, page?.size, rawContent.length || 10);
  const totalElements =
    typeof page?.totalElements === 'number' && Number.isFinite(page.totalElements)
      ? page.totalElements
      : typeof page?.total === 'number' && Number.isFinite(page.total)
      ? page.total
      : rawContent.length;
  const totalPages =
    typeof page?.totalPages === 'number' && Number.isFinite(page.totalPages)
      ? page.totalPages
      : Math.max(1, Math.ceil(totalElements / (pageSize || 1)));

  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    first: typeof page?.first === 'boolean' ? page.first : pageNumber === 0,
    last: typeof page?.last === 'boolean' ? page.last : pageNumber + 1 >= totalPages,
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
      data: normalizePage(res.data, mapCompanyItem, 'companies'),
    };
  },

  /**
   * Fetches full list of companies for selector dropdowns / filters
   */
  async getCompanies(search?: string, signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    const response = await this.getAllCompanies(signal);
    if (!search?.trim()) return response;

    const query = search.toLowerCase().trim();
    return {
      ...response,
      data: response.data.filter((company) => company.name.toLowerCase().includes(query)),
    };
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
    const normalizedIdentifier = slug.trim();
    const numericId = Number(normalizedIdentifier);
    if (Number.isSafeInteger(numericId) && numericId > 0) {
      const res: ApiResponse<unknown> = await apiClient.get(
        API_ENDPOINTS.COMPANY.DETAILS(numericId),
        { signal }
      );
      return { ...res, data: mapCompanyItem(res.data) };
    }

    // The backend detail route accepts a numeric Long path variable. Sending a
    // text slug reaches its security/error catch-all instead of a slug lookup,
    // so resolve text routes through the real paginated catalog directly.
    const allCompRes = await this.getAllCompanies(signal);
    const normalizedSlug = normalizedIdentifier.toLowerCase();
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
      timestamp: allCompRes.timestamp,
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
    const seenProblemIds = new Set<string>();
    let lastBackendError: unknown = null;
    let lastAttemptFailed = false;

    const loadAllMatchingPages = async (
      companies: number[] | null,
      searchText: string | null
    ): Promise<void> => {
      const pageSize = 50;
      let pageNumber = 0;
      let totalPages = 1;

      do {
        signal?.throwIfAborted();
        const response = await fetchQuestionPage({
          level: null,
          companies,
          topic: null,
          searchText,
          pageRequest: { pageNumber, pageSize, sortBy: 'id', sortDirection: 'ASC' },
        }, signal);
        const page = response.data;
        totalPages = Math.max(1, Number(page.totalPages) || 1);
        page.content.forEach((item) => {
          const problem = mapProblemDto(item);
          const key = String(problem.id);
          if (!seenProblemIds.has(key)) {
            seenProblemIds.add(key);
            problemsList.push(problem);
          }
        });
        pageNumber += 1;
      } while (pageNumber < totalPages);
    };

    if (numericCandidate !== undefined) {
      try {
        await loadAllMatchingPages([numericCandidate], null);
        lastAttemptFailed = false;
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        lastBackendError = err;
        lastAttemptFailed = true;
      }
    }

    if (numericCandidate === undefined && problemsList.length === 0 && nameStr) {
      try {
        await loadAllMatchingPages(null, nameStr);
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

  async getCompanyProblemsPaginated(
    companyId: number,
    filters: {
      difficulty?: number[];
      searchText?: string;
      pageNumber?: number;
      pageSize?: number;
    } = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PaginatedData<Problem>>> {
    const pageNumber = filters.pageNumber ?? 0;
    const pageSize = filters.pageSize ?? 10;
    const payload: QuestionListRequest = {
      level: filters.difficulty?.length ? filters.difficulty : null,
      companies: [companyId],
      topic: null,
      searchText: filters.searchText?.trim() || null,
      pageRequest: {
        pageNumber,
        pageSize,
        sortBy: 'id',
        sortDirection: 'ASC',
      },
    };
    const response = await fetchQuestionPage(payload, signal);
    const page = response.data;
    return {
      ...response,
      data: {
        content: page.content.map(mapProblemDto),
        pageNumber: typeof page.pageNumber === 'number'
          ? page.pageNumber
          : typeof page.number === 'number'
            ? page.number
            : pageNumber,
        pageSize: typeof page.pageSize === 'number'
          ? page.pageSize
          : typeof page.size === 'number'
            ? page.size
            : pageSize,
        totalElements: typeof page.totalElements === 'number' ? page.totalElements : page.content.length,
        totalPages: Math.max(1, typeof page.totalPages === 'number' ? page.totalPages : 1),
        first: typeof page.first === 'boolean' ? page.first : pageNumber === 0,
        last: typeof page.last === 'boolean' ? page.last : pageNumber + 1 >= page.totalPages,
      },
    };
  },
};
