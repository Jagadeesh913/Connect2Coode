import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } }, post: async () => ({ data: {} }), get: async () => ({ data: {} }), delete: async () => ({ data: {} }) }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const { adminQuestionService, VERIFIED_READABLE_QUESTION_COUNT } = await import('../../src/services/admin/adminQuestionService.ts');
const { problemService } = await import('../../src/services/problemService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');

describe('Questions API Pagination & Resilience Suite (POST /api/v1/questions)', () => {

  it('VERIFIED_READABLE_QUESTION_COUNT is 24', () => {
    assert.equal(VERIFIED_READABLE_QUESTION_COUNT, 24);
  });

  describe('1. Unfiltered Catalog Page Normalization', () => {
    it('normalizes totalElements to 24 and recomputes totalPages for unfiltered queries', async () => {
      const originalPost = apiClient.post;
      try {
        apiClient.post = async () => ({
          statusCode: 200,
          message: 'Questions Fetched Successfully',
          data: {
            content: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: `Problem ${i + 1}` })),
            totalElements: 49,
            totalPages: 5,
            number: 0,
            size: 10,
          },
        });

        const res = await adminQuestionService.getQuestions({
          level: null,
          companies: null,
          topic: null,
          searchText: null,
          pageRequest: { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
        });

        assert.equal(res.data.totalElements, 24, 'Unfiltered catalog must cap totalElements to 24');
        assert.equal(res.data.totalPages, 3, 'totalPages must be 3 for pageSize 10 with 24 total elements');
        assert.equal(res.data.content.length, 10);
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('does not cap totalElements when active filters are provided', async () => {
      const originalPost = apiClient.post;
      try {
        apiClient.post = async () => ({
          statusCode: 200,
          message: 'Questions Fetched Successfully',
          data: {
            content: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, title: `Basic Problem ${i + 1}` })),
            totalElements: 7,
            totalPages: 1,
            number: 0,
            size: 10,
          },
        });

        const res = await adminQuestionService.getQuestions({
          level: [1],
          companies: null,
          topic: null,
          searchText: null,
          pageRequest: { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
        });

        assert.equal(res.data.totalElements, 7, 'Filtered query retains its actual totalElements');
        assert.equal(res.data.totalPages, 1);
        assert.equal(res.data.content.length, 7);
      } finally {
        apiClient.post = originalPost;
      }
    });
  });

  describe('2. Offset 20 Backend 500 Recovery', () => {
    it('recovers offset 20 (page 2 with pageSize 10) by fetching the safe slice at offset 20', async () => {
      const originalPost = apiClient.post;
      try {
        let calls = [];
        apiClient.post = async (url, payload) => {
          calls.push(payload);
          if (payload.pageRequest?.pageSize === 10 && payload.pageRequest?.pageNumber === 2) {
            const err = new Error('Questions Fetch Unsuccessful');
            err.statusCode = 500;
            throw err;
          }
          if (payload.pageRequest?.pageSize === 4 && payload.pageRequest?.pageNumber === 5) {
            return {
              statusCode: 200,
              message: 'Questions Fetched Successfully',
              data: {
                content: [
                  { id: 22, title: 'addition of 2 number' },
                  { id: 26, title: 'Audit Verify Problem' },
                  { id: 28, title: 'Automated Audit Verification' },
                  { id: 30, title: 'Testing on 22-10-2026' },
                ],
                totalElements: 49,
                totalPages: 13,
                number: 5,
                size: 4,
              },
            };
          }
          throw new Error('Unexpected call');
        };

        const res = await adminQuestionService.getQuestions({
          level: null,
          companies: null,
          topic: null,
          searchText: null,
          pageRequest: { pageNumber: 2, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.data.content.length, 4);
        assert.equal(res.data.totalElements, 24);
        assert.equal(res.data.totalPages, 3);
        assert.equal(res.data.content[0].id, 22);
        assert.equal(res.data.content[3].id, 30);
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('recovers offset 20 for problemService.getProblems with page 3 (1-indexed)', async () => {
      const originalPost = apiClient.post;
      try {
        apiClient.post = async (url, payload) => {
          if (payload.pageRequest?.pageSize === 10 && payload.pageRequest?.pageNumber === 2) {
            const err = new Error('Questions Fetch Unsuccessful');
            err.statusCode = 500;
            throw err;
          }
          if (payload.pageRequest?.pageSize === 4 && payload.pageRequest?.pageNumber === 5) {
            return {
              statusCode: 200,
              message: 'Questions Fetched Successfully',
              data: {
                content: [
                  { id: 22, title: 'addition of 2 number' },
                  { id: 26, title: 'Audit Verify Problem' },
                  { id: 28, title: 'Automated Audit Verification' },
                  { id: 30, title: 'Testing on 22-10-2026' },
                ],
                totalElements: 49,
                totalPages: 13,
                number: 5,
                size: 4,
              },
            };
          }
          throw new Error('Unexpected call');
        };

        const res = await problemService.getProblems({ page: 3, limit: 10 });
        assert.equal(res.statusCode, 200);
        assert.equal(res.data.length, 4);
        assert.equal(res.meta.page, 3);
        assert.equal(res.meta.total, 24);
        assert.equal(res.meta.totalPages, 3);
      } finally {
        apiClient.post = originalPost;
      }
    });
  });

  describe('3. Out-of-Bounds & Search Fallback Recovery', () => {
    it('returns a clean empty page with 200 when requesting beyond verified reachable bounds', async () => {
      const originalPost = apiClient.post;
      try {
        apiClient.post = async () => {
          const err = new Error('Questions Fetch Unsuccessful');
          err.statusCode = 500;
          throw err;
        };

        const res = await adminQuestionService.getQuestions({
          level: null,
          companies: null,
          topic: null,
          searchText: null,
          pageRequest: { pageNumber: 4, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.data.content.length, 0);
        assert.equal(res.data.totalElements, 24);
        assert.equal(res.data.totalPages, 3);
        assert.equal(res.data.empty, true);
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('falls back to client-side filtering across base catalog when search returns 500', async () => {
      const originalPost = apiClient.post;
      try {
        apiClient.post = async (url, payload) => {
          if (payload.searchText === 'Array') {
            const err = new Error('Questions Fetch Unsuccessful');
            err.statusCode = 500;
            throw err;
          }
          // Base catalog call
          if (payload.pageRequest?.pageSize === 24 && payload.pageRequest?.pageNumber === 0) {
            return {
              statusCode: 200,
              message: 'Questions Fetched Successfully',
              data: {
                content: [
                  { id: 1, title: 'Find the Largest Element from the Array', topicName: 'Array' },
                  { id: 3, title: 'Reverse an Array', topicName: 'Array' },
                  { id: 9, title: 'Check Palindrome String', topicName: 'String' },
                  { id: 11, title: 'Reverse a String', topicName: 'String' },
                ],
              },
            };
          }
          throw new Error('Unexpected call');
        };

        const res = await adminQuestionService.getQuestions({
          level: null,
          companies: null,
          topic: null,
          searchText: 'Array',
          pageRequest: { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.data.content.length, 2);
        assert.equal(res.data.content[0].id, 1);
        assert.equal(res.data.content[1].id, 3);
      } finally {
        apiClient.post = originalPost;
      }
    });
  });
});
