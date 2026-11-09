import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Company, Problem, QuestionListRequest } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';
import { fetchQuestionPage } from './admin/adminQuestionService';
import type {
  CompanyExamItem,
  CompanyExamDetailsData,
  CompanyRoleItem,
  CompanyExamSectionItem,
  ReferenceRef,
  PaginatedData,
  PageRequestPayload,
} from '../features/companies/types/companyExam';

export type CompanyItem = Company;

// The observed /company/list contract returns 24 records per page. Keep the
// catalog selector on that supported request shape instead of requesting an
// unverified oversized page that can fail independently of the page UI.
const COMPANY_LIST_PAGE_SIZE = 24;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const requireFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Unexpected ${label} format`);
  }
  return value;
};

const requireString = (value: unknown, label: string): string => {
  if (typeof value !== 'string') throw new Error(`Unexpected ${label} format`);
  return value;
};

const requireBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') throw new Error(`Unexpected ${label} format`);
  return value;
};

const mapReference = (value: unknown, label: string): ReferenceRef => {
  if (!isRecord(value)) throw new Error(`Unexpected ${label} format`);
  return {
    id: requireFiniteNumber(value.id, `${label} ID`),
    refGroupCode: requireString(value.refGroupCode, `${label} group code`),
    refCode: requireString(value.refCode, `${label} code`),
    refName: requireString(value.refName, `${label} name`),
    isActive: requireBoolean(value.isActive, `${label} active flag`),
  };
};

const mapCompanyExam = (value: unknown): CompanyExamItem => {
  if (!isRecord(value)) throw new Error('Unexpected company exam record format');
  return {
    id: requireFiniteNumber(value.id, 'company exam ID'),
    companyId: requireFiniteNumber(value.companyId, 'company exam company ID'),
    examName: requireString(value.examName, 'company exam name'),
    year: requireFiniteNumber(value.year, 'company exam year'),
    description: requireString(value.description, 'company exam description'),
    totalDurationMinutes: requireFiniteNumber(value.totalDurationMinutes, 'company exam duration'),
    totalQuestions: requireFiniteNumber(value.totalQuestions, 'company exam question count'),
    totalMarks: requireFiniteNumber(value.totalMarks, 'company exam marks'),
    sourceUrl: requireString(value.sourceUrl, 'company exam source URL'),
    isActive: requireBoolean(value.isActive, 'company exam active flag'),
  };
};

const mapCompanyRole = (value: unknown): CompanyRoleItem => {
  if (!isRecord(value)) throw new Error('Unexpected company role record format');
  return {
    id: requireFiniteNumber(value.id, 'company role ID'),
    companyExamId: requireFiniteNumber(value.companyExamId, 'company role exam ID'),
    roleName: requireString(value.roleName, 'company role name'),
    roleCode: requireString(value.roleCode, 'company role code'),
    salary: requireString(value.salary, 'company role salary'),
    description: requireString(value.description, 'company role description'),
  };
};

const mapCompanyExamSection = (value: unknown, depth = 0): CompanyExamSectionItem => {
  if (!isRecord(value) || depth > 10) {
    throw new Error('Unexpected company exam section record format');
  }
  const childSections = value.sections === undefined
    ? undefined
    : Array.isArray(value.sections)
      ? value.sections.map((section) => mapCompanyExamSection(section, depth + 1))
      : (() => { throw new Error('Unexpected company exam child sections format'); })();

  const optionalNumber = (field: unknown, label: string): number | null | undefined =>
    field === undefined || field === null ? field : requireFiniteNumber(field, label);

  return {
    id: requireFiniteNumber(value.id, 'company exam section ID'),
    companyExamId: requireFiniteNumber(value.companyExamId, 'company exam section exam ID'),
    parentSectionId: value.parentSectionId === null
      ? null
      : requireFiniteNumber(value.parentSectionId, 'company exam parent section ID'),
    sectionName: requireString(value.sectionName, 'company exam section name'),
    sectionType: mapReference(value.sectionType, 'company exam section type'),
    questionType: value.questionType === null || value.questionType === undefined
      ? value.questionType
      : mapReference(value.questionType, 'company exam question type'),
    questionCount: optionalNumber(value.questionCount, 'company exam section question count'),
    durationMinutes: optionalNumber(value.durationMinutes, 'company exam section duration'),
    totalMarks: optionalNumber(value.totalMarks, 'company exam section marks'),
    sequenceNumber: optionalNumber(value.sequenceNumber, 'company exam section sequence') ?? undefined,
    sections: childSections,
  };
};

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
  if (!page || !Array.isArray(page.content)) {
    throw new Error(`Unexpected ${label} response format`);
  }
  const rawContent = page.content;
  const content = rawContent.map(mapItem);
  const requiredNumber = (primary: unknown, alias: unknown, field: string): number => {
    const value = typeof primary === 'number' ? primary : alias;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Unexpected ${label} ${field} metadata`);
    }
    return value;
  };
  const pageNumber = requiredNumber(page.pageNumber, page.number, 'page number');
  const pageSize = requiredNumber(page.pageSize, page.size, 'page size');
  const totalElements = requiredNumber(page.totalElements, page.total, 'total elements');
  const totalPages = requiredNumber(page.totalPages, undefined, 'total pages');

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
      { pageNumber: 0, pageSize: COMPANY_LIST_PAGE_SIZE, sortBy: 'name', sortDirection: 'ASC' },
      signal
    );
    const pages: PaginatedData<CompanyItem>[] = [firstPage.data];
    const totalPages = Math.max(1, Number(firstPage.data.totalPages) || 1);
    const pageSize = Math.max(1, Number(firstPage.data.pageSize) || COMPANY_LIST_PAGE_SIZE);

    for (let pageNumber = 1; pageNumber < totalPages; pageNumber += 1) {
      signal?.throwIfAborted();
      const response = await this.getCompaniesPaginated(
        { pageNumber, pageSize, sortBy: 'name', sortDirection: 'ASC' },
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
        mapCompanyExam,
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
        exam: mapCompanyExam(res.data.exam),
        roles: res.data.roles.map(mapCompanyRole),
        pattern: res.data.pattern.map((section) => mapCompanyExamSection(section)),
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

    const matchedId = Number(matched.id);
    if (!Number.isSafeInteger(matchedId) || matchedId <= 0) {
      throw new Error(`Company record for slug "${slug}" has no valid backend ID`);
    }

    return this.getCompanyBySlug(String(matchedId), signal);
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
