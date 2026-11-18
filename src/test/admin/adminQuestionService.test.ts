import { describe, it, expect, vi } from 'vitest';
import { adminQuestionService } from '../../services/admin/adminQuestionService';
import { apiClient } from '../../core/api/apiClient';
import type { ApiResponse } from '../../core/types/api';

describe('adminQuestionService unit tests', () => {
  describe('getQuestions', () => {
    it('normalizes valid question page with diverse company formats', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        statusCode: 200,
        message: 'Success',
        data: {
          content: [
            {
              id: 1,
              title: 'Two Sum',
              description: 'Find two numbers',
              difficultyName: 'Easy',
              topicName: 'Arrays',
              companies: ['Google', { id: 2, name: 'Amazon', logo: 'amazon.png' }],
              questionPlatform: 'LeetCode',
            },
          ],
          totalElements: 1,
          totalPages: 1,
          pageNumber: 0,
          pageSize: 10,
        },
      } as unknown as ApiResponse<unknown>);

      const response = await adminQuestionService.getQuestions({
        level: null,
        companies: null,
        topic: null,
        questionPlatform: null,
        searchText: null,
        pageRequest: { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
      });

      expect(response.data.totalElements).toBe(1);
      expect(response.data.content).toHaveLength(1);
      const question = response.data.content[0];
      expect(question.id).toBe(1);
      expect(question.title).toBe('Two Sum');
      expect(question.companies).toHaveLength(2);
      expect(question.companies[0].name).toBe('Google');
      expect(question.companies[1].name).toBe('Amazon');
      expect(question.questionPlatform?.refName).toBe('LeetCode');
    });

    it('rejects pages containing malformed rows with missing ID or title', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        statusCode: 200,
        message: 'Success',
        data: {
          content: [
            {
              id: -5,
              title: '',
            },
          ],
          totalElements: 1,
          totalPages: 1,
          pageNumber: 0,
          pageSize: 10,
        },
      } as unknown as ApiResponse<unknown>);

      await expect(
        adminQuestionService.getQuestions({
          level: null,
          companies: null,
          topic: null,
          questionPlatform: null,
          searchText: null,
          pageRequest: { pageNumber: 0, pageSize: 10, sortBy: 'id', sortDirection: 'ASC' },
        })
      ).rejects.toThrow('Unexpected questions list item format');
    });
  });
});
