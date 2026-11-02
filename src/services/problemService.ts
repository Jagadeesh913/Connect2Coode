import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Problem, ProblemFilter, QuestionListItem, QuestionListRequest } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';
import {
  fetchResilientQuestionPage,
  VERIFIED_READABLE_QUESTION_COUNT,
} from './admin/adminQuestionService';


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
    const pageSize = params.limit || 10;

    const levelArr = parseToIdList(params.level ?? params.difficulty);
    const topicArr = parseToIdList(params.topic);
    const companiesArr = parseToIdList(params.companies ?? params.company);
    const platformArr = parseToIdList(params.platform ?? params.platforms ?? params.qpf);

    const rawSearch = params.searchText?.trim()
      ? params.searchText.trim()
      : params.search?.trim()
      ? params.search.trim()
      : null;

    const payload: QuestionListRequest = {
      level: levelArr,
      companies: companiesArr,
      topic: topicArr,
      searchText: rawSearch,
      pageRequest: {
        pageNumber: pageNum,
        pageSize,
        sortBy: 'id',
        sortDirection: 'ASC' as const,
      },
    };

    if (platformArr && platformArr.length > 0) {
      payload.platform = platformArr;
    }

    try {
      const res = await fetchResilientQuestionPage(payload, signal);
      const page = res.data;
      if (!page || !Array.isArray(page.content)) {
        throw new Error('Unexpected problems response format');
      }
      const total = typeof page.totalElements === 'number' ? page.totalElements : page.content.length;
      const mappedList: ProblemItem[] = page.content.map((item) => mapProblemDto(item));

      return {
        statusCode: 200,
        message: 'Problems retrieved successfully',
        data: mappedList,
        meta: {
          page: typeof page.number === 'number' ? page.number + 1 : params.page || 1,
          limit: pageSize,
          total,
          totalPages: page.totalPages || Math.ceil(total / pageSize) || 1,
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
        const res: ApiResponse<unknown> = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(numericId), { signal });
        const data = res.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return {
            statusCode: res.statusCode,
            message: res.message,
            data: mapProblemDto(data),
            errors: res.errors,
            timestamp: res.timestamp,
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

      const payload: QuestionListRequest = {
        level: [],
        companies: [],
        topic: [],
        searchText: null,
        pageRequest: {
          pageNumber,
          pageSize: VERIFIED_READABLE_QUESTION_COUNT,
          sortBy: 'id',
          sortDirection: 'ASC' as const,
        },
      };

      const resList = await fetchResilientQuestionPage(payload, signal);
      const items = resList.data.content;

      const targetStr = String(id).trim().toLowerCase();
      let matched = items.find((item: QuestionListItem) => {
        const itemId = String(item.id ?? '').trim().toLowerCase();
        const itemTitle = String(item.title ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return itemId === targetStr || itemTitle === targetStr;
      });

      if (!matched && pageNumber !== 0) {
        const res0 = await fetchResilientQuestionPage(
          {
            level: null,
            companies: null,
            topic: null,
            searchText: null,
            pageRequest: { pageNumber: 0, pageSize: VERIFIED_READABLE_QUESTION_COUNT, sortBy: 'id', sortDirection: 'ASC' as const },
          },
          signal
        );

        const items0 = res0.data.content;

        matched = items0.find((item: QuestionListItem) => {
          const itemId = String(item.id ?? '').trim().toLowerCase();
          const itemTitle = String(item.title ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return itemId === targetStr || itemTitle === targetStr;
        });
      }

      if (matched) {
        // GET /question/{id}/testCases is currently rejected with 401 by the
        // backend even for an authenticated account. Avoid an extra failed
        // request after catalog fallback; map only catalog-provided cases.
        const problemItem = matched;
        return {
          statusCode: 200,
          message: 'Problem details fetched',
          data: mapProblemDto(problemItem),
        };
      }
    } catch (catalogErr: unknown) {
      if (isRequestCanceled(catalogErr)) {
        throw catalogErr;
      }
    }

    throw new Error(`Problem #${id} not found`);
  },
};
