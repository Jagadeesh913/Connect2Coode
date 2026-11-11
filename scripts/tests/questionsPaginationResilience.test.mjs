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
const { questionService } = await import('../../src/services/questionService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');

const request = {
  level: null,
  companies: null,
  topic: null,
  searchText: null,
  pageRequest: { pageNumber: 2, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
};

const questionListItem = (id = 1) => ({
  id,
  title: `Question ${id}`,
  description: 'Solve the problem.',
  difficultyId: 2,
  difficultyName: 'Easy',
  topicId: 9,
  topicName: 'Arrays',
  isOwnProblem: true,
  isActive: true,
  companies: [{ id: 1, name: 'TCS', logo: '', website: '', isActive: true }],
  questionPlatform: {
    id: 24,
    refGroupCode: 'QPF',
    refGroupName: null,
    refCode: 'LEETCODE',
    refName: 'LeetCode',
    isActive: true,
    logoUrl: 'https://example.com/leetcode.png',
  },
});

describe('Questions API pagination contract', () => {
  it('preserves pagination metadata returned by the API', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({
        statusCode: 200,
        message: 'Questions Fetched Successfully',
        data: {
          content: Array.from({ length: 10 }, (_, index) => questionListItem(index + 21)),
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

  it('rejects successful rows without authoritative pagination metadata', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({
        statusCode: 200,
        message: 'OK',
        data: { content: [{ id: 1, title: 'Two Sum', description: 'Find a pair.' }] },
      });
      await assert.rejects(
        () => adminQuestionService.getQuestions(request),
        /Unexpected questions page number metadata/
      );
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('rejects malformed question items missing identity or title', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({
        statusCode: 200,
        message: 'OK',
        data: {
          content: [{ invalid: true }],
          number: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        },
      });
      await assert.rejects(
        () => adminQuestionService.getQuestions(request),
        /Unexpected questions list item format/
      );
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('never fabricates question identities or titles from partial catalog rows', async () => {
    const originalPost = apiClient.post;
    try {
      for (const content of [
        [{ title: 'Missing ID', difficultyName: 'Easy' }],
        [{ id: 8, difficultyName: 'Easy' }],
      ]) {
        apiClient.post = async () => ({
          statusCode: 200,
          message: 'OK',
          data: { content, number: 0, size: 10, totalElements: 1, totalPages: 1 },
        });
        await assert.rejects(
          () => adminQuestionService.getQuestions(request),
          /Unexpected questions list item format/
        );
      }
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('rejects a mixed valid and malformed page instead of hiding rows behind server totals', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({
        statusCode: 200,
        message: 'OK',
        data: {
          content: [questionListItem(1), { id: 2, difficultyName: 'Easy' }],
          number: 0,
          size: 10,
          totalElements: 2,
          totalPages: 1,
        },
      });
      await assert.rejects(
        () => adminQuestionService.getQuestions(request),
        /Unexpected questions list item format/
      );
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('rejects mismatched detail identities and invalid save responses', async () => {
    const originalGet = apiClient.get;
    const originalPost = apiClient.post;
    try {
      apiClient.get = async () => ({
        statusCode: 200,
        message: 'OK',
        data: { id: 9, title: 'Wrong question' },
      });
      await assert.rejects(
        () => questionService.getById(8),
        /Question #8 returned an invalid detail response/
      );

      apiClient.post = async () => ({
        statusCode: 200,
        message: 'OK',
        data: { title: 'Missing saved identity' },
      });
      await assert.rejects(
        () => questionService.saveOrUpdate({ id: undefined, title: 'New question' }),
        /Question save returned an invalid response/
      );
    } finally {
      apiClient.get = originalGet;
      apiClient.post = originalPost;
    }
  });

  it('normalizes production question items with nullable fields and string summaries', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({
        statusCode: 200,
        message: 'OK',
        data: {
          content: [
            {
              id: 1,
              title: 'Two Sum',
              description: null,
              difficultyId: null,
              difficultyRefName: 'Easy',
              topicId: null,
              topicRefName: 'Arrays',
              companies: ['TCS', { id: 2, name: 'Amazon', logo: null, website: null, isActive: true }],
              questionPlatform: 'LeetCode',
              isOwnProblem: null,
              isActive: null,
            },
          ],
          number: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        },
      });
      const response = await adminQuestionService.getQuestions(request);
      assert.equal(response.data.content.length, 1);
      const item = response.data.content[0];
      assert.equal(item.id, 1);
      assert.equal(item.title, 'Two Sum');
      assert.equal(item.description, '');
      assert.equal(item.difficultyName, 'Easy');
      assert.equal(item.topicName, 'Arrays');
      assert.equal(item.companies.length, 2);
      assert.equal(item.companies[0].name, 'TCS');
      assert.equal(item.companies[0].logo, '');
      assert.equal(item.companies[1].name, 'Amazon');
      assert.equal(item.companies[1].website, '');
      assert.equal(item.questionPlatform?.refName, 'LeetCode');
      assert.equal(item.questionPlatform?.refCode, 'LEETCODE');
      assert.equal(item.isOwnProblem, true);
      assert.equal(item.isActive, true);
    } finally {
      apiClient.post = originalPost;
    }
  });

  it('normalizes the documented pageNumber/pageSize aliases without changing totals', async () => {
    const originalPost = apiClient.post;
    try {
      apiClient.post = async () => ({
        statusCode: 200,
        message: 'OK',
        data: {
          content: [],
          pageNumber: 0,
          pageSize: 10,
          totalElements: 0,
          totalPages: 0,
        },
      });
      const response = await adminQuestionService.getQuestions({
        ...request,
        pageRequest: { ...request.pageRequest, pageNumber: 0 },
      });
      assert.equal(response.data.number, 0);
      assert.equal(response.data.size, 10);
      assert.equal(response.data.totalElements, 0);
      assert.equal(response.data.totalPages, 0);
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

  it('sends only the documented question-list fields with numeric filter IDs', async () => {
    const originalPost = apiClient.post;
    let capturedPayload;
    try {
      apiClient.post = async (_url, payload) => {
        capturedPayload = payload;
        return {
          statusCode: 200,
          message: 'Questions Fetched Successfully',
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 1,
            size: 25,
          },
        };
      };

      await problemService.getProblems({
        page: 2,
        limit: 25,
        difficulty: [3, 3, 0],
        topic: ['9', 'invalid'],
        companies: [4],
        searchText: '  arrays  ',
        platform: [7],
      });

      assert.deepEqual(capturedPayload, {
        level: [3],
        companies: [4],
        topic: [9],
        searchText: 'arrays',
        pageRequest: {
          pageNumber: 1,
          pageSize: 25,
          sortBy: 'id',
          sortDirection: 'ASC',
        },
      });
      assert.equal(
        Object.hasOwn(capturedPayload, 'platform'),
        false,
        'QPF metadata is not a documented POST /questions filter field'
      );
    } finally {
      apiClient.post = originalPost;
    }
  });
});
