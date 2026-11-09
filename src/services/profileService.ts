import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import type { ApiResponse } from '../core/types/api';
import type { ReferenceItem, UserProfile, UserInfoData, SaveUserInfoPayload } from '../core/types/domain';

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

const optionalText = (value: unknown, field: string): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new Error(`Unexpected user profile ${field} format`);
  return value;
};

const optionalYear = (value: unknown, field: string): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Unexpected user profile ${field} format`);
  }
  return value;
};

const optionalPositiveId = (value: unknown, field: string): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const numericValue = Number(value);
  if (!Number.isSafeInteger(numericValue) || numericValue < 1) {
    throw new Error(`Unexpected user profile ${field} format`);
  }
  return numericValue;
};

const normalizeGender = (value: unknown): ReferenceItem | null => {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Unexpected user profile gender format');
  }
  const gender = value as Record<string, unknown>;
  const id = optionalPositiveId(gender.id, 'gender ID');
  if (
    id === null ||
    typeof gender.refGroupCode !== 'string' ||
    typeof gender.refCode !== 'string' ||
    typeof gender.refName !== 'string' ||
    typeof gender.isActive !== 'boolean'
  ) {
    throw new Error('Unexpected user profile gender format');
  }
  return {
    id,
    refGroupCode: gender.refGroupCode,
    refCode: gender.refCode,
    refName: gender.refName,
    isActive: gender.isActive,
  };
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
  const id = optionalPositiveId(value.id, 'ID');
  const userId = optionalPositiveId(value.userId, 'user ID');
  const college = optionalText(value.college ?? value.collegeName, 'college');
  if (
    (userId !== null && userId !== normalizedRequestedUserId)
  ) {
    throw new Error('Unexpected user profile response format');
  }
  return {
    id,
    userId: userId ?? normalizedRequestedUserId,
    firstName: optionalText(value.firstName, 'first name'),
    lastName: optionalText(value.lastName, 'last name'),
    regNumber: optionalText(value.regNumber, 'registration number'),
    joinedYear: optionalYear(value.joinedYear, 'joined year'),
    passedOutYear: optionalYear(value.passedOutYear, 'passed-out year'),
    college,
    collegeId: optionalPositiveId(value.collegeId, 'college ID'),
    bio: optionalText(value.bio, 'bio'),
    gender: normalizeGender(value.gender),
    dob: optionalText(value.dob, 'date of birth'),
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
      ...(payload.collegeId !== undefined ? { collegeId: payload.collegeId } : {}),
      ...(payload.gender ? { gender: payload.gender } : {}),
      ...(payload.dob !== undefined ? { dob: payload.dob } : {}),
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
