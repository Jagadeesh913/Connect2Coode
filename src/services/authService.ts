import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import type { ApiResponse } from '../core/types/api';

export interface AuthResponseData {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: number | string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    role?: string;
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
  role?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  password?: string;
}

export const authService = {
  // SignUp: POST /api/v1/signUp (Does NOT require OTP)
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async signUp(payload: SignUpPayload & { labelUserName?: string; userName?: string }): Promise<ApiResponse<AuthResponseData>> {
    const rawLabel = payload.email ? payload.email.split('@')[0] : `${payload.firstName}${payload.lastName}`;
    const sanitizedLabel = rawLabel.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `user${Date.now()}`;

    const requestPayload = {
      role: 'USER',
      labelUserName: payload.labelUserName || sanitizedLabel,
      userName: payload.userName || sanitizedLabel,
      ...payload,
    };
    return apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, requestPayload, { timeout: 120000 });
  },

  // Login: POST /api/v1/auth/login
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
    const response: any = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload, { timeout: 120000 });
    if (response && response.data) {
      const data = response.data;
      const token = data.accessToken || data.token;
      if (token) {
        tokenStorage.setAccessToken(token);
      }
      const refreshToken = data.refreshToken;
      if (refreshToken) {
        tokenStorage.setRefreshToken(refreshToken);
      }
      if (data.user) {
        tokenStorage.setUser(data.user);
      } else {
        tokenStorage.setUser(data);
      }
    }
    return response;
  },

  // Logout: POST /api/v1/auth/logout with credentials
  // Backend invalidates session and clears HttpOnly refresh cookie via Set-Cookie
  async logout(): Promise<ApiResponse<string>> {
    try {
      const token = tokenStorage.getRefreshToken();
      const payload = token ? { refreshToken: token } : {};
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, payload, { withCredentials: true });
    } catch (e) {
      console.warn('Logout API warning:', e);
    } finally {
      tokenStorage.clearTokens();
    }
    return {
      statusCode: 200,
      message: 'Logout Successful',
      data: 'User Logged Out Successfully',
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  // Refresh Token: POST /api/v1/auth/refresh with credentials
  // Browser automatically transmits HttpOnly refreshToken cookie to backend origin
  async refreshToken(explicitRefreshToken?: string): Promise<ApiResponse<AuthResponseData>> {
    const token = explicitRefreshToken || tokenStorage.getRefreshToken();
    const payload = token ? { refreshToken: token } : {};

    const response: any = await apiClient.post(
      API_ENDPOINTS.AUTH.REFRESH,
      payload,
      { withCredentials: true, timeout: 60000 }
    );
    if (response) {
      const data = response.data || response;
      const bearerToken = data.accessToken || data.token;
      if (bearerToken) {
        tokenStorage.setAccessToken(bearerToken);
      }
      const newRefreshToken = data.refreshToken || token;
      if (newRefreshToken) {
        tokenStorage.setRefreshToken(newRefreshToken);
      }
      if (data.user) {
        tokenStorage.setUser(data.user);
      } else if (data.id && data.email) {
        tokenStorage.setUser({
          id: data.id,
          email: data.email,
          role: data.role || 'USER',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        });
      }
    }
    return response;
  },

  // Generate Password Reset OTP: POST /api/v1/auth/generatePasswordResetOtp
  async generatePasswordResetOtp(email: string): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ENDPOINTS.AUTH.GENERATE_PASSWORD_RESET_OTP, { email }, { timeout: 60000 });
  },

  // Verify OTP and Reset Password: POST /api/v1/auth/verifyPasswordResetOtp
  async verifyPasswordResetOtp(payload: VerifyOtpPayload): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_PASSWORD_RESET_OTP, payload, { timeout: 60000 });
  },
};
