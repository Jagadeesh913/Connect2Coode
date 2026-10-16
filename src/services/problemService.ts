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
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(id), { signal });
      const data = res?.data || res;

      if (!data || (!data.id && !data.title)) {
        throw new Error('Problem details response did not contain a problem');
      }

      return {
        statusCode: 200,
        message: 'Problem details fetched',
        data: mapProblemDto(data),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      throw err;
    }
  },
};
