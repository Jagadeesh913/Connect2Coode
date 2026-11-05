import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import { authService, type LoginPayload } from '../../../services/authService';
import type { AuthResponseData } from '../../../services/authService';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { executeRefreshToken } from '../../../core/api/apiClient';
import type { AuthSessionData } from '../../../core/security/authContract';

export type AuthStatus = 'LOADING' | 'AUTHENTICATED' | 'RECOVERY_REQUIRED' | 'UNAUTHENTICATED';

export interface UserProfile {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  isDarkTheme?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot';
}

interface RefreshFailure {
  message: string;
  statusCode: number;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'LOADING',
  isAuthenticated: false,
  loading: true,
  error: null,
  isAuthModalOpen: false,
  authModalMode: 'login',
};

const buildUserProfile = (
  data: AuthResponseData | null | undefined,
  fallback: UserProfile | null = null
): UserProfile | null => {
  const raw = data?.user || data;
  const email = raw?.email || fallback?.email;
  const id = raw?.id ?? fallback?.id;
  if (!email && id === undefined) return fallback;

  const firstName = raw?.firstName ?? fallback?.firstName;
  const lastName = raw?.lastName ?? fallback?.lastName;
  return {
    ...fallback,
    id,
    firstName,
    lastName,
    fullName:
      raw?.fullName ||
      `${firstName || ''} ${lastName || ''}`.trim() ||
      fallback?.fullName ||
      email ||
      'User',
    email: String(email || ''),
    role: raw?.role ?? fallback?.role,
    avatarUrl: raw?.avatarUrl ?? fallback?.avatarUrl,
    isDarkTheme: raw?.isDarkTheme ?? fallback?.isDarkTheme,
  };
};

// Canonical session refresh thunk. The browser supplies the HttpOnly cookie.
export const refreshSessionThunk = createAsyncThunk<
  AuthSessionData,
  void,
  { rejectValue: RefreshFailure }
>(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      return await executeRefreshToken();
    } catch (err: any) {
      const responseData = err?.response?.data;
      const statusCode = Number(err?.response?.status || responseData?.statusCode || 0);
      return rejectWithValue({
        message: statusCode === 401
          ? 'Your session has expired. Please sign in again.'
          : 'We could not verify your session. Please try again.',
        statusCode,
      });
    }
  }
);

export const loginUser = createAsyncThunk<AuthSessionData, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await authService.login(payload);
      if (res.statusCode === 200 && res.data?.token) {
        return res.data as AuthSessionData;
      }
      return rejectWithValue('The authentication service returned an invalid response. Please try again.');
    } catch (err: any) {
      const statusCode = Number(err?.statusCode || err?.response?.status || 0);
      if (statusCode === 401) return rejectWithValue('Invalid email or password.');
      if (statusCode === 429) return rejectWithValue('Too many attempts. Please try again later.');
      return rejectWithValue('Unable to sign in right now. Please try again.');
    }
  }
);

export const generatePasswordResetOtpThunk = createAsyncThunk(
  'auth/generateOtp',
  async (email: string, { rejectWithValue }) => {
    try {
      const res = await authService.generatePasswordResetOtp(email);
      return res?.message || 'Password Reset OTP Sent Successfully';
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Failed to send OTP. Please try again.';
      return rejectWithValue(errMsg);
    }
  }
);

export const verifyPasswordResetOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: { email: string; otp: string; password?: string }, { rejectWithValue }) => {
    try {
      const res = await authService.verifyPasswordResetOtp(payload);
      return res?.message || 'Password Reset Successfully';
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Failed to verify OTP. Please try again.';
      return rejectWithValue(errMsg);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth(state) {
      // Keep route guards closed until the unconditional startup refresh settles.
      state.status = 'LOADING';
      state.isAuthenticated = false;
      state.loading = true;
      state.error = null;
      state.token = tokenStorage.getAccessToken();
      state.user = tokenStorage.getUser();
    },
    setAuthenticatedSession(state, action: PayloadAction<{ token: string; user?: any }>) {
      state.status = 'AUTHENTICATED';
      state.isAuthenticated = true;
      state.loading = false;
      state.token = action.payload.token;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    setUnauthenticatedSession(state) {
      state.status = 'UNAUTHENTICATED';
      state.isAuthenticated = false;
      state.loading = false;
      state.token = null;
      state.user = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    openAuthModal(state, action: PayloadAction<{ mode?: 'login' | 'signup' | 'forgot' } | undefined>) {
      state.isAuthModalOpen = true;
      if (action?.payload?.mode) {
        state.authModalMode = action.payload.mode;
      }
    },
    closeAuthModal(state) {
      state.isAuthModalOpen = false;
    },
    setAuthModalMode(state, action: PayloadAction<'login' | 'signup' | 'forgot'>) {
      state.authModalMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Canonical startup/OAuth/HTTP-401 session refresh lifecycle.
      .addCase(refreshSessionThunk.pending, (state) => {
        if (!state.isAuthenticated) state.status = 'LOADING';
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'AUTHENTICATED';
        state.isAuthenticated = true;
        state.error = null;
        state.token = action.payload.token;
        state.user = buildUserProfile(action.payload, state.user);
      })
      .addCase(refreshSessionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || null;
        if (action.payload?.statusCode !== 401 && state.isAuthenticated && state.token) {
          // A transient refresh failure is not proof that the current session is invalid.
          state.status = 'AUTHENTICATED';
        } else if (action.payload?.statusCode === 401) {
          state.user = null;
          state.token = null;
          state.status = 'UNAUTHENTICATED';
          state.isAuthenticated = false;
        } else {
          // A temporary startup failure does not prove the HttpOnly cookie is invalid.
          state.status = 'RECOVERY_REQUIRED';
          state.isAuthenticated = false;
        }
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'AUTHENTICATED';
        state.isAuthenticated = true;
        state.isAuthModalOpen = false;
        state.token = action.payload.token;
        state.user = buildUserProfile(action.payload, state.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout - Unconditional token and state cleanup (F-035)
      .addMatcher(
        isAnyOf(logoutUser.pending, logoutUser.fulfilled, logoutUser.rejected),
        (state) => {
          state.user = null;
          state.token = null;
          state.status = 'UNAUTHENTICATED';
          state.isAuthenticated = false;
          state.loading = false;
          state.error = null;
        }
      );
  },
});

export const {
  initializeAuth,
  setAuthenticatedSession,
  setUnauthenticatedSession,
  clearAuthError,
  openAuthModal,
  closeAuthModal,
  setAuthModalMode,
} = authSlice.actions;

export default authSlice.reducer;
