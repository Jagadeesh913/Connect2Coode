import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import type { ApiResponse } from '../core/types/api';
import type { UserProfile, UserInfoData, SaveUserInfoPayload } from '../core/types/domain';

export type UserProfileData = UserProfile;

export interface ThemePreferenceResponse {
  isDarkTheme: boolean;
}

const requireUserId = (userId: string | number): string | number => {
  if (typeof userId === 'number' && Number.isSafeInteger(userId) && userId > 0) return userId;
  if (typeof userId === 'string' && /^\d+$/.test(userId.trim()) && Number(userId) > 0) return userId.trim();
  throw new Error('A valid user ID is required to manage theme preference.');
};

const requireThemePreference = (data: unknown): ThemePreferenceResponse => {
  if (!data || typeof data !== 'object' || typeof (data as ThemePreferenceResponse).isDarkTheme !== 'boolean') {
    throw new Error('Unexpected theme preference response format');
  }
  return { isDarkTheme: (data as ThemePreferenceResponse).isDarkTheme };
};

const requireUserInfo = (data: unknown, requestedUserId: string | number): UserInfoData => {
  const normalizedRequestedUserId = Number(requestedUserId);
  if (!Number.isSafeInteger(normalizedRequestedUserId) || normalizedRequestedUserId < 1) {
    throw new Error('A valid user ID is required to manage profile details.');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected user profile response format');
  }
  const value = data as Record<string, unknown>;
  const id = value.id;
  const userId = value.userId;
  const regNumber = value.regNumber;
  const joinedYear = value.joinedYear;
  const passedOutYear = value.passedOutYear;
  const college = value.college;
  const bio = value.bio;
  if (
    (id !== undefined && (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1)) ||
    (userId !== undefined && (typeof userId !== 'number' || !Number.isSafeInteger(userId) || userId < 1)) ||
    (typeof userId === 'number' && userId !== normalizedRequestedUserId) ||
    typeof regNumber !== 'string' ||
    !Number.isInteger(joinedYear) ||
    !Number.isInteger(passedOutYear) ||
    typeof college !== 'string' ||
    typeof bio !== 'string'
  ) {
    throw new Error('Unexpected user profile response format');
  }
  return {
    id: typeof id === 'number' ? id : null,
    userId: typeof userId === 'number' ? userId : normalizedRequestedUserId,
    regNumber,
    joinedYear: joinedYear as number,
    passedOutYear: passedOutYear as number,
    college: college as string,
    bio: bio as string,
  };
};

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
    const res: ApiResponse<unknown> = await apiClient.get(
      API_ENDPOINTS.USER.USER_INFO(userId),
      { signal }
    );
    const normalizedData = res.data === null ? null : requireUserInfo(res.data, userId);
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
    const normalizedUserId = Number(userId);
    if (!Number.isSafeInteger(normalizedUserId) || normalizedUserId < 1) {
      throw new Error('A valid user ID is required to manage profile details.');
    }
    const requestPayload = {
      id: payload.id !== undefined && payload.id !== null ? Number(payload.id) : null,
      userId: normalizedUserId,
      regNumber: payload.regNumber,
      joinedYear: Number(payload.joinedYear),
      passedOutYear: Number(payload.passedOutYear),
      college: payload.college,
      bio: payload.bio,
    };
    const res: ApiResponse<unknown> = await apiClient.post(
      API_ENDPOINTS.USER.USER_INFO(userId),
      requestPayload
    );
    const normalizedData = requireUserInfo(res.data, userId);
    return {
      statusCode: res.statusCode,
      message: res.message,
      data: normalizedData,
      errors: res.errors ?? null,
    };
  },

  /** GET /api/v1/{userId}/getTheme. */
  async getThemePreference(
    userId: string | number,
    signal?: AbortSignal
  ): Promise<ApiResponse<ThemePreferenceResponse>> {
    const validUserId = requireUserId(userId);
    const response: ApiResponse<unknown> = await apiClient.get(
      API_ENDPOINTS.USER.GET_THEME(validUserId),
      { signal }
    );
    return {
      statusCode: response.statusCode,
      message: response.message,
      data: requireThemePreference(response.data),
      errors: response.errors ?? null,
      timestamp: response.timestamp,
    };
  },

  /** POST /api/v1/{userId}/theme/{isDarkTheme}; the bearer header is client-owned. */
  async saveThemePreference(
    userId: string | number,
    isDarkTheme: boolean
  ): Promise<ApiResponse<ThemePreferenceResponse>> {
    const validUserId = requireUserId(userId);
    const response: ApiResponse<unknown> = await apiClient.post(
      API_ENDPOINTS.USER.THEME(validUserId, isDarkTheme),
      undefined
    );
    return {
      statusCode: response.statusCode,
      message: response.message,
      data: requireThemePreference(response.data),
      errors: response.errors ?? null,
      timestamp: response.timestamp,
    };
  },
};
