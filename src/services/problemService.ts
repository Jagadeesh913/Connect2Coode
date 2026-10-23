import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Problem, ProblemFilter } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';

export type ProblemItem = Problem;
export type ProblemFilterParams = ProblemFilter;

export function parseToIdList(raw: unknown): number[] | null {
  if (raw === undefined || raw === null || raw === '' || raw === 'All' || raw === 'all') {
    return null;
  }

  const items = Array.isArray(raw) ? raw : [raw];
  const ids = items
    .map((item) => Number(item))
    .filter((id) => Number.isFinite(id) && id > 0);

  return ids.length > 0 ? Array.from(new Set(ids)) : null;
}

export const problemService = {
  async getProblems(
    params: ProblemFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<ProblemItem[]>> {
    const pageNum = params.page ? Math.max(0, params.page - 1) : 0;
    const pageSize = params.limit || 20;

    const levelArr = parseToIdList(params.level ?? params.difficulty);
    const topicArr = parseToIdList(params.topic);
    const companiesArr = parseToIdList(params.companies ?? params.company);
    const platformArr = parseToIdList(params.platform ?? params.platforms ?? params.qpf);

    const rawSearch = params.searchText?.trim()
      ? params.searchText.trim()
      : params.search?.trim()
      ? params.search.trim()
      : null;

    const payload: Record<string, any> = {
      pageRequest: {
        pageNumber: pageNum,
        pageSize,
        sortBy: 'id',
        sortDirection: 'ASC' as const,
      },
    };

    if (levelArr && levelArr.length > 0) {
      payload.level = levelArr;
    }
    if (companiesArr && companiesArr.length > 0) {
      payload.companies = companiesArr;
    }
    if (topicArr && topicArr.length > 0) {
      payload.topic = topicArr;
    }
    if (platformArr && platformArr.length > 0) {
      payload.platform = platformArr;
    }
    if (rawSearch) {
      payload.searchText = rawSearch;
    }

    try {
      const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
      const rawData = res?.data || res;

      let list: any[] = [];
      let total = 0;

      if (rawData && Array.isArray(rawData.content)) {
        list = rawData.content;
        total = typeof rawData.totalElements === 'number' ? rawData.totalElements : list.length;
      } else if (Array.isArray(rawData)) {
        list = rawData;
        total = list.length;
      } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.data)) {
        list = rawData.data;
        total = typeof rawData.total === 'number' ? rawData.total : list.length;
      } else {
        throw new Error('Unexpected problems response format');
      }

      const mappedList: ProblemItem[] = list.map((item: any) => mapProblemDto(item));

      return {
        statusCode: 200,
        message: 'Problems retrieved successfully',
        data: mappedList,
        meta: {
          page: rawData?.number !== undefined ? rawData.number + 1 : params.page || 1,
          limit: pageSize,
          total,
          totalPages: rawData?.totalPages || Math.ceil(total / pageSize) || 1,
        },
      };
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      throw err;
    }
  },

  async getProblemById(
    id: string | number,
    signal?: AbortSignal
  ): Promise<ApiResponse<ProblemItem | null>> {
    const numericId = Number(id);
    const isNumericId = Number.isFinite(numericId) && numericId > 0;

    // Numeric detail requests use the verified full-detail contract first.
    if (isNumericId) {
      try {
        const res: any = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(numericId), { signal });
        const data = res?.data;
        if (data && (data.id || data.title)) {
          return {
            statusCode: res?.statusCode || 200,
            message: res?.message || 'Problem details fetched',
            data: mapProblemDto(data),
          };
        }
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        // Retain catalog fallback for backend deployments with a degraded
        // details controller and for older response variants.
      }
    }

    // Catalog fallback resolves slugs because the backend details path accepts
    // numeric IDs only.
    try {
      const pageNumber = isNumericId ? Math.max(0, Math.floor((numericId - 1) / 50)) : 0;

      const payload: Record<string, any> = {
        level: null,
        companies: null,
        topic: null,
        searchText: null,
        pageRequest: {
          pageNumber,
          pageSize: 50,
          sortBy: 'id',
          sortDirection: 'ASC' as const,
        },
      };

      const resList: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
      const rawList = resList?.data || resList;
      const items = Array.isArray(rawList?.content)
        ? rawList.content
        : Array.isArray(rawList)
        ? rawList
        : Array.isArray(rawList?.data)
        ? rawList.data
        : [];

      const targetStr = String(id).trim().toLowerCase();
      let matched = items.find((item: any) => {
        const itemId = String(item.id ?? item._id ?? '').trim().toLowerCase();
        const itemSlug = String(item.slug || '').trim().toLowerCase();
        const itemTitle = String(item.title || item.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return itemId === targetStr || itemSlug === targetStr || itemTitle === targetStr;
      });

      if (!matched && pageNumber !== 0) {
        const res0: any = await apiClient.post(
          API_ENDPOINTS.PROBLEMS.LIST,
          {
            level: null,
            companies: null,
            topic: null,
            searchText: null,
            pageRequest: { pageNumber: 0, pageSize: 50, sortBy: 'id', sortDirection: 'ASC' as const },
          },
          { signal }
        );
        const items0 = Array.isArray(res0?.data?.content)
          ? res0.data.content
          : Array.isArray(res0?.content)
          ? res0.content
          : Array.isArray(res0?.data)
          ? res0.data
          : [];

        matched = items0.find((item: any) => {
          const itemId = String(item.id ?? item._id ?? '').trim().toLowerCase();
          const itemSlug = String(item.slug || '').trim().toLowerCase();
          const itemTitle = String(item.title || item.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return itemId === targetStr || itemSlug === targetStr || itemTitle === targetStr;
        });
      }

      if (matched) {
        return {
          statusCode: 200,
          message: 'Problem details fetched',
          data: mapProblemDto(matched),
        };
      }
    } catch (catalogErr: any) {
      if (isRequestCanceled(catalogErr)) {
        throw catalogErr;
      }
    }

    throw new Error(`Problem #${id} not found`);
  },
};
