import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Question, QuestionHint, QuestionTestCase } from '../core/types/domain';
import { extractTestCasesFromProblem } from '../features/admin/utils/testCaseUtils';

export type { Question, QuestionHint, QuestionTestCase };

export type QuestionPayload = Question;

export const questionService = {
  async saveOrUpdate(payload: QuestionPayload, signal?: AbortSignal): Promise<ApiResponse<QuestionPayload>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.BASE, payload, { signal });
  },

  async getById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<QuestionPayload>> {
    const numericId = Number(id);
    const isNumericId = Number.isFinite(numericId) && numericId > 0;

    // The verified numeric details endpoint is authoritative and includes the
    // complete question payload. Text slugs are not accepted by the backend.
    if (isNumericId) {
      try {
        const res: any = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(numericId), { signal });
        const data = res?.data;
        if (data && (data.id || data.title)) {
          return {
            statusCode: res?.statusCode || 200,
            message: res?.message || 'Question details fetched',
            data,
          };
        }
      } catch (err: unknown) {
        if (isRequestCanceled(err)) throw err;
        // Preserve the catalog fallback for deployments where the details route
        // is temporarily unavailable.
      }
    }

    // Catalog fallback also resolves human-readable route slugs.
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
        const rawMatched: any = matched;
        const descriptionText = String(rawMatched.description || '');
        const testCases: QuestionTestCase[] = extractTestCasesFromProblem({
          id: rawMatched.id,
          description: descriptionText,
          testCases: rawMatched.testCases,
        });

        const recovered: QuestionPayload = {
          id: Number(rawMatched.id),
          title: String(rawMatched.title || rawMatched.name || ''),
          description: descriptionText,
          constraints: String(rawMatched.constraints || ''),
          difficultyRefGroupCode: rawMatched.difficultyRefGroupCode || 'DIFF',
          difficultyRefCode: rawMatched.difficultyRefCode || (rawMatched.difficultyName ? String(rawMatched.difficultyName).toUpperCase() : 'MEDIUM'),
          difficultyRefName: rawMatched.difficultyRefName || rawMatched.difficultyName || 'Medium',
          topicRefGroupCode: rawMatched.topicRefGroupCode || 'TOPIC',
          topicRefCode: rawMatched.topicRefCode || (rawMatched.topicName ? String(rawMatched.topicName).toUpperCase() : 'GENERAL'),
          topicRefName: rawMatched.topicRefName || rawMatched.topicName || 'General',
          qpfRefGroupCode: rawMatched.qpfRefGroupCode || 'QPF',
          qpfRefCode: rawMatched.qpfRefCode || '',
          qpfRefName: rawMatched.qpfRefName || rawMatched.questionPlatform || rawMatched.platformName || '',
          questionPlatform: rawMatched.questionPlatform || rawMatched.qpfRefName || rawMatched.platformName || '',
          questionHints: Array.isArray(rawMatched.questionHints) ? rawMatched.questionHints : [],
          companies: Array.isArray(rawMatched.companies) ? rawMatched.companies : [],
          hackerRankUrl: rawMatched.hackerRankUrl,
          leetCodeUrl: rawMatched.leetCodeUrl,
          gfgUrl: rawMatched.gfgUrl,
          isOwnProblem: Boolean(rawMatched.isOwnProblem),
          isActive: rawMatched.isActive ?? true,
          askedDate: rawMatched.askedDate ?? null,
          testCases,
        };

        return {
          statusCode: 200,
          message: 'Question details fetched',
          data: recovered,
        };
      }
    } catch (err: unknown) {
      if (isRequestCanceled(err)) throw err;
      // The endpoint error is surfaced below as a domain-specific retrieval error.
    }

    throw new Error(`Question #${id} could not be retrieved`);
  },

  async getTestCases(id: string | number, signal?: AbortSignal): Promise<QuestionTestCase[]> {
    const numericId = Number(id);
    if (!numericId) return [];

    const response = await this.getById(numericId, signal);
    return extractTestCasesFromProblem(response.data);
  },

  async addTestCases(
    id: string | number,
    testCases: QuestionTestCase[],
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionTestCase[]>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.TEST_CASES(id), testCases, { signal });
  },
};
