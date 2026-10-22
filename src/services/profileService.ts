import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import type { ApiResponse } from '../core/types/api';
import type { UserProfile, UserInfoData, SaveUserInfoPayload } from '../core/types/domain';

export type UserProfileData = UserProfile;

export const profileService = {
  /**
   * Fetches baseline user profile from session and userInfo endpoint
   */
  async getProfile(): Promise<ApiResponse<UserProfileData>> {
    const storedUser = tokenStorage.getUser();
    if (storedUser) {
      const fallbackProfile: UserProfileData = {
        id: storedUser.id,
        email: storedUser.email,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        fullName: storedUser.fullName || `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim(),
        role: storedUser.role,
        avatarUrl: storedUser.avatarUrl,
      };

      if (storedUser.id) {
        try {
          const infoRes = await this.getUserInfo(storedUser.id);
          if (infoRes?.data) {
            fallbackProfile.regNumber = infoRes.data.regNumber;
            fallbackProfile.collegeName = infoRes.data.college;
            fallbackProfile.bio = infoRes.data.bio;
            fallbackProfile.joinedYear = infoRes.data.joinedYear;
            fallbackProfile.passedOutYear = infoRes.data.passedOutYear;
          }
        } catch {}
      }

      return {
        statusCode: 200,
        message: 'Profile loaded from session',
        data: fallbackProfile,
      };
    }

    return {
      statusCode: 200,
      message: 'No profile found',
      data: null as any,
    };
  },

  /**
   * Updates base profile and synchronizes with tokenStorage
   */
  async updateProfile(payload: Partial<UserProfileData>): Promise<ApiResponse<UserProfileData>> {
    const current = tokenStorage.getUser() || ({} as any);
    const updated = {
      ...current,
      ...payload,
      fullName: payload.fullName || `${payload.firstName || current.firstName || ''} ${payload.lastName || current.lastName || ''}`.trim() || current.fullName,
    };
    tokenStorage.setUser(updated);

    return {
      statusCode: 200,
      message: 'Profile updated successfully',
      data: updated as UserProfileData,
    };
  },

  /**
   * GET /api/v1/userInfo/{userId}
   * Fetches academic/user registration details by userId
   */
  async getUserInfo(
    userId: string | number,
    signal?: AbortSignal
  ): Promise<ApiResponse<UserInfoData | null>> {
    const res: any = await apiClient.get(API_ENDPOINTS.USER.USER_INFO(userId), { signal });
    const rawData = res?.data ?? null;
    const normalizedData: UserInfoData | null = rawData
      ? {
          ...rawData,
          college: rawData.college || rawData.collegeName || '',
          collegeName: rawData.collegeName || rawData.college || '',
        }
      : null;
    return {
      statusCode: res?.statusCode || 200,
      message: res?.message || 'User profile fetched successfully',
      data: normalizedData,
      errors: res?.errors ?? null,
    };
  },

  /**
   * POST /api/v1/userInfo/{userId}
   * Creates or updates academic user profile info with token in payload
   */
  async saveUserInfo(
    userId: string | number,
    payload: SaveUserInfoPayload
  ): Promise<ApiResponse<UserInfoData>> {
    const token = tokenStorage.getAccessToken();
    const effectiveToken = token || payload.jwtToken;
    const payloadWithToken: Record<string, any> = {
      id: payload.id !== undefined && payload.id !== null ? Number(payload.id) : null,
      userId: Number(userId),
      regNumber: payload.regNumber,
      joinedYear: Number(payload.joinedYear),
      passedOutYear: Number(payload.passedOutYear),
      college: payload.college,
      collegeId: payload.collegeId !== undefined && payload.collegeId !== null ? String(payload.collegeId) : null,
      bio: payload.bio ?? '',
      gender: payload.gender ?? null,
      dob: payload.dob ?? null,
      jwtToken: effectiveToken,
    };
    const res: any = await apiClient.post(API_ENDPOINTS.USER.USER_INFO(userId), payloadWithToken);
    const rawData = res?.data ?? res;
    const normalizedData: UserInfoData = rawData
      ? {
          ...rawData,
          college: rawData.college || rawData.collegeName || payload.college || '',
          collegeName: rawData.collegeName || rawData.college || payload.college || '',
        }
      : rawData;
    return {
      statusCode: res?.statusCode || 200,
      message: res?.message || 'User profile saved successfully',
      data: normalizedData,
      errors: res?.errors ?? null,
    };
  },
};
