import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Company, Problem } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';
export type CompanyItem = Company;

export const companyService = {
  async getCompanies(search?: string, signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.BASE, {
        params: { search },
        signal,
      });
      const rawData = res?.data || res;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.content)
        ? rawData.content
        : null;

      if (!list) {
        throw new Error('Unexpected companies response format');
      }

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
        data: mappedList,
        errors: null,
        timestamp: new Date().toISOString(),
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
