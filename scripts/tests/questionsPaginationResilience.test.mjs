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

const { adminQuestionService } = await import('../../src/services/admin/adminQuestionService.ts');
const { problemService } = await import('../../src/services/problemService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');

const request = {
  level: null,
  companies: null,
  topic: null,
  searchText: null,
  pageRequest: { pageNumber: 2, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
};

describe('Questions API pagination contract', () => {
  it('preserves pagination metadata returned by the API', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({
        statusCode: 200,
        message: 'Questions Fetched Successfully',
        data: {
          content: Array.from({ length: 10 }, (_, index) => ({ id: index + 21 })),
          totalElements: 49,
          totalPages: 5,
          number: 2,
          size: 10,
        },
      });

      const response = await adminQuestionService.getQuestions(request);
      assert.equal(response.data.totalElements, 49);
      assert.equal(response.data.totalPages, 5);
      assert.equal(response.data.number, 2);
      assert.equal(response.data.content.length, 10);
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('makes exactly one API call and propagates backend failures', async () => {
    const originalPost = apiClient.post;
    let calls = 0;
    try {
      apiClient.post = async () => {
        calls += 1;
        const error = new Error('Questions Fetch Unsuccessful');
        error.statusCode = 500;
        throw error;
      };

      await assert.rejects(
        () => adminQuestionService.getQuestions(request),
        /Questions Fetch Unsuccessful/
      );
      assert.equal(calls, 1, 'one failed page must not fan out into record-by-record probes');
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('rejects malformed successful responses', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({ statusCode: 200, message: 'OK', data: { content: null } });
      await assert.rejects(
        () => adminQuestionService.getQuestions(request),
        /Unexpected questions response format/
      );
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('propagates question-list failures through problemService', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => {
        throw new Error('Questions Fetch Unsuccessful');
      };
      await assert.rejects(
        () => problemService.getProblems({ page: 3, limit: 10 }),
        /Questions Fetch Unsuccessful/
      );
    } finally {
      apiClient.post = originalPost;
    }
  });
});
