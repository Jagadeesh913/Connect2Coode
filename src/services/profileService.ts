import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import type { ApiResponse } from '../core/types/api';
import type { UserProfile, UserInfoData, SaveUserInfoPayload } from '../core/types/domain';

export type UserProfileData = UserProfile;

export const profileService = {
  /** Fetches immutable identity fields supplied by the authenticated session. */
  async getProfile(): Promise<ApiResponse<UserProfileData | null>> {
    const storedUser = tokenStorage.getUser();
    if (storedUser) {
      const profile: UserProfileData = {
        id: storedUser.id,
        email: storedUser.email,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        fullName: storedUser.fullName || `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim(),
        role: storedUser.role,
        avatarUrl: storedUser.avatarUrl,
      };

      return {
        statusCode: 200,
        message: 'Authenticated identity loaded',
        data: profile,
      };
    }

    return {
      statusCode: 200,
      message: 'No profile found',
      data: null,
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
    const res: ApiResponse<UserInfoData | null> = await apiClient.get(
      API_ENDPOINTS.USER.USER_INFO(userId),
      { signal }
    );
    const rawData = res.data;
    const normalizedData: UserInfoData | null = rawData
      ? {
          ...rawData,
          userId: rawData.userId ?? userId,
          college: rawData.college || rawData.collegeName || '',
          collegeName: rawData.collegeName || rawData.college || '',
        }
      : null;
    return {
      statusCode: res.statusCode,
      message: res.message,
      data: normalizedData,
      errors: res?.errors ?? null,
    };
  },

  /**
   * POST /api/v1/userInfo/{userId}
   * Creates or updates academic profile data with bearer authentication.
   */
  async saveUserInfo(
    userId: string | number,
    payload: SaveUserInfoPayload
  ): Promise<ApiResponse<UserInfoData>> {
    const requestPayload = {
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
    };
    const res: ApiResponse<UserInfoData> = await apiClient.post(
      API_ENDPOINTS.USER.USER_INFO(userId),
      requestPayload
    );
    if (!res.data || typeof res.data !== 'object') {
      throw new Error('Unexpected saved user profile response format');
    }
    const normalizedData: UserInfoData = {
      ...res.data,
      college: res.data.college || res.data.collegeName || payload.college,
      collegeName: res.data.collegeName || res.data.college || payload.college,
    };
    return {
      statusCode: res.statusCode,
      message: res.message,
      data: normalizedData,
      errors: res.errors ?? null,
    };
  },
};
