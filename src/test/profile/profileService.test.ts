import { describe, it, expect, vi } from 'vitest';
import { profileService } from '../../services/profileService';
import { apiClient } from '../../core/api/apiClient';
import type { ApiResponse } from '../../core/types/api';
import type { SaveUserInfoPayload } from '../../core/types/domain';

describe('profileService unit tests', () => {
  describe('getUserInfo', () => {
    it('normalizes valid user info payload', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        statusCode: 200,
        message: 'Success',
        data: {
          id: 5,
          userId: 10,
          regNumber: 'REG12345',
          joinedYear: 2020,
          passedOutYear: 2024,
          college: 'IIT Madras',
          collegeName: 'IIT Madras',
          collegeId: 101,
          bio: 'Aspiring software engineer',
          gender: {
            id: 1,
            refGroupCode: 'GENDER',
            refCode: 'M',
            refName: 'Male',
            isActive: true,
          },
          dob: '2001-05-15',
        },
      } as unknown as ApiResponse<unknown>);

      const result = await profileService.getUserInfo(10);
      expect(result.data).not.toBeNull();
      expect(result.data?.userId).toBe(10);
      expect(result.data?.college).toBe('IIT Madras');
      expect(result.data?.gender?.refName).toBe('Male');
      expect(result.data?.joinedYear).toBe(2020);
      expect(result.data?.passedOutYear).toBe(2024);
    });

    it('rejects mismatched user IDs in response envelope', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        statusCode: 200,
        message: 'Success',
        data: {
          id: 1,
          userId: 99, // Mismatched user ID when requesting for 10
        },
      } as unknown as ApiResponse<unknown>);

      await expect(profileService.getUserInfo(10)).rejects.toThrow(
        'Unexpected user profile response format'
      );
    });
  });

  describe('saveUserInfo', () => {
    it('validates user ID is a positive integer', async () => {
      const payload: SaveUserInfoPayload = {
        userId: 0,
        regNumber: '123',
        joinedYear: 2020,
        passedOutYear: 2024,
        college: 'Test College',
        bio: 'Bio',
      };

      await expect(profileService.saveUserInfo(0, payload)).rejects.toThrow(
        'A valid user ID is required to manage profile details.'
      );
    });
  });

  describe('theme preference', () => {
    it('saves user theme preference with valid user ID', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        statusCode: 200,
        message: 'Theme saved',
        data: {
          isDarkTheme: true,
        },
      } as unknown as ApiResponse<unknown>);

      const result = await profileService.saveThemePreference(42, true);
      expect(result.data.isDarkTheme).toBe(true);
    });

    it('rejects theme preference saving with invalid user ID', async () => {
      await expect(profileService.saveThemePreference(0, true)).rejects.toThrow(
        'A valid user ID is required to manage theme preference.'
      );
    });
  });
});
