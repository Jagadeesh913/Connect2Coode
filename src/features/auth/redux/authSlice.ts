import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import { authService, type LoginPayload } from '../../../services/authService';
import type { AuthResponseData } from '../../../services/authService';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { executeRefreshToken } from '../../../core/api/apiClient';

export type AuthStatus = 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

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
    isDarkTheme: raw?.isDarkTheme ?? fallback?.isDarkTheme,
  };
};

// Canonical session refresh thunk. The browser supplies the HttpOnly cookie.
export const refreshSessionThunk = createAsyncThunk<
  AuthResponseData,
  void,
  { rejectValue: RefreshFailure }
>(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      return await executeRefreshToken();
    } catch (err: any) {
      const responseData = err?.response?.data;
      const errMsg = responseData?.message || err?.message || (err?.errors && err?.errors[0]) || 'Session refresh failed';
      return rejectWithValue({
        message: errMsg,
        statusCode: Number(err?.response?.status || responseData?.statusCode || 0),
      });
    }
  }
);

// Backward compatibility alias for silent refresh
export const silentRefreshSession = refreshSessionThunk;

// Backward compatibility alias for legacy Google login thunk
export const loginWithGoogleRefreshToken = refreshSessionThunk;

export const loginUser = createAsyncThunk<AuthResponseData, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await authService.login(payload);
      if (res.statusCode === 200 && res.data) {
        return res.data;
      }
      return rejectWithValue(res.message || 'Invalid Email or Password');
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Invalid Email or Password';
      return rejectWithValue(errMsg);
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
      // Canonical Refresh Session (proactive background check does NOT block UI loading)
      .addCase(refreshSessionThunk.pending, () => {
        // Intentionally keep state.loading false so login form submit buttons remain interactive
      })
      .addCase(refreshSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'AUTHENTICATED';
        state.isAuthenticated = true;
        state.error = null;
        state.token = action.payload?.accessToken || action.payload?.token || state.token;
        state.user = buildUserProfile(action.payload, state.user);
      })
      .addCase(refreshSessionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || null;
        if (action.payload?.statusCode !== 401 && state.isAuthenticated && state.token) {
          // A transient refresh failure is not proof that the current session is invalid.
          state.status = 'AUTHENTICATED';
        } else {
          state.user = null;
          state.token = null;
          state.status = 'UNAUTHENTICATED';
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
        state.token = action.payload.accessToken || action.payload.token || null;
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
