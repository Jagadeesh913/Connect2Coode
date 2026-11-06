import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import { publishAuthSessionEvent } from '../core/security/authSessionSync';
import { requireAuthSessionData, type AuthSessionData } from '../core/security/authContract';
import { userScopedStorage } from '../core/storage/userScopedStorage';
import type { ApiResponse } from '../core/types/api';

export interface AuthResponseData {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  email?: string;
  role?: string;
  isDarkTheme?: boolean;
  token?: string;
  user?: {
    id?: number | string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatarUrl?: string;
    email?: string;
    role?: string;
    isDarkTheme?: boolean;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  password?: string;
}

const persistAuthSession = (data: AuthSessionData): void => {
  tokenStorage.setAccessToken(data.token);

  const currentUser = tokenStorage.getUser();
  const responseUser = data.user || data;
  const email = responseUser.email || currentUser?.email;
  const id = responseUser.id ?? currentUser?.id;

  // Only non-sensitive backend identity fields are kept with the access token.
  if (email) {
    tokenStorage.setUser({
      ...currentUser,
      id,
      email,
      firstName: responseUser.firstName ?? currentUser?.firstName,
      lastName: responseUser.lastName ?? currentUser?.lastName,
      fullName: responseUser.fullName ?? currentUser?.fullName,
      avatarUrl: responseUser.avatarUrl ?? currentUser?.avatarUrl,
      role: responseUser.role ?? currentUser?.role,
      isDarkTheme: responseUser.isDarkTheme ?? currentUser?.isDarkTheme,
    });
  }
};

export const authService = {
  // SignUp: POST /api/v1/signUp (Does NOT require OTP)
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async signUp(payload: SignUpPayload & { labelUserName?: string; userName?: string }): Promise<ApiResponse<AuthResponseData>> {
    const rawLabel = payload.email ? payload.email.split('@')[0] : `${payload.firstName}${payload.lastName}`;
    const sanitizedLabel = rawLabel.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `user${Date.now()}`;

    const requestPayload = {
      ...payload,
      role: 'USER' as const,
      labelUserName: payload.labelUserName || sanitizedLabel,
      userName: payload.userName || sanitizedLabel,
    };
    return apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, requestPayload, {
      timeout: 120000,
      authPolicy: 'public',
    });
  },

  // Login: POST /api/v1/auth/login
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
    // Supersede any older refresh/login without clearing a still-valid session.
    // A logout or newer login will advance the epoch again and reject this response.
    const sessionEpoch = tokenStorage.claimSessionOwnership();
    const response: ApiResponse<AuthResponseData> = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload, {
      timeout: 120000,
      authPolicy: 'public',
    });
    if (response?.data) {
      const session = requireAuthSessionData(response.data);
      if (tokenStorage.getSessionEpoch() !== sessionEpoch) {
        throw new Error('Authentication session changed while login was in progress');
      }
      // Advance the epoch before installing the new account so any older login
      // or refresh response cannot overwrite this session after it resolves.
      tokenStorage.clearTokens({ broadcast: false });
      persistAuthSession(session);
      publishAuthSessionEvent('session-updated');
      response.data = session;
    }
    return response;
  },

  // Logout: POST /api/v1/auth/logout with credentials
  // Backend invalidates session and clears HttpOnly refresh cookie via Set-Cookie
  async logout(): Promise<ApiResponse<string>> {
    const currentUser = tokenStorage.getUser();
    userScopedStorage.clearForUser(currentUser, { preserveKeys: ['theme_pref'] });
    // Local logout must be immediate and must invalidate any in-flight login or
    // refresh response before waiting on the network.
    tokenStorage.clearTokens();
    return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, undefined, {
      withCredentials: true,
      timeout: 30_000,
      authPolicy: 'public',
    });
  },

  // Generate Password Reset OTP: POST /api/v1/auth/generatePasswordResetOtp
  async generatePasswordResetOtp(email: string): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ENDPOINTS.AUTH.GENERATE_PASSWORD_RESET_OTP, { email }, {
      timeout: 60000,
      authPolicy: 'public',
    });
  },

  // Verify OTP and Reset Password: POST /api/v1/auth/verifyPasswordResetOtp
  async verifyPasswordResetOtp(payload: VerifyOtpPayload): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_PASSWORD_RESET_OTP, payload, {
      timeout: 60000,
      authPolicy: 'public',
    });
  },
};
