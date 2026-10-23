import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import { authService, type LoginPayload } from '../../../services/authService';
import type { AuthResponseData } from '../../../services/authService';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { decodeJwtPayload, isJwtExpired, isTokenValid } from '../../../core/security/jwt';

export type AuthStatus = 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

export interface UserProfile {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role?: string;
  avatarUrl?: string;
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
  };
};

// Canonical session refresh thunk: calls POST /api/v1/auth/refresh with HttpOnly cookie or explicit token
export const refreshSessionThunk = createAsyncThunk<
  AuthResponseData,
  string | undefined,
  { rejectValue: string }
>(
  'auth/refreshSession',
  async (explicitToken, { rejectWithValue }) => {
    try {
      const res = await authService.refreshToken(explicitToken);
      return res.data;
    } catch (err: any) {
      const currentToken = tokenStorage.getAccessToken();
      if (!currentToken || !isTokenValid(currentToken)) {
        tokenStorage.clearTokens();
      }
      const errMsg = err?.message || (err?.errors && err?.errors[0]) || 'Session refresh failed';
      return rejectWithValue(errMsg);
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
    initializeAuth: {
      prepare() {
        const token = tokenStorage.getAccessToken();
        const savedUser = tokenStorage.getUser();
        return {
          payload: {
            token,
            savedUser,
            hasValidToken: isTokenValid(token),
            canRefresh: Boolean(tokenStorage.getRefreshToken() || savedUser),
          },
        };
      },
      reducer(
        state,
        action: PayloadAction<{
          token: string | null;
          savedUser: UserProfile | null;
          hasValidToken: boolean;
          canRefresh: boolean;
        }>
      ) {
        const { token, savedUser, hasValidToken, canRefresh } = action.payload;
        if (hasValidToken && token) {
          state.status = 'AUTHENTICATED';
          state.isAuthenticated = true;
          state.user = savedUser;
          state.token = token;
          state.loading = false;
        } else {
          // Keep the startup gate closed while AppRouterLayout attempts a refresh.
          // Clearing here would erase the refresh cookie before that request runs.
          state.status = canRefresh ? 'LOADING' : 'UNAUTHENTICATED';
          state.isAuthenticated = false;
          state.user = canRefresh ? savedUser : null;
          state.token = null;
          state.loading = canRefresh;
        }
      },
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
        state.token = action.payload.accessToken || action.payload.token || state.token;
        state.user = buildUserProfile(action.payload, state.user);
      })
      .addCase(refreshSessionThunk.rejected, (state) => {
        state.loading = false;
        const currentToken = state.token;
        const isStillValid = Boolean(currentToken && !isJwtExpired(decodeJwtPayload(currentToken)));
        if (isStillValid) {
          // Preserve valid active access token session! Do NOT purge or log user out.
          state.status = 'AUTHENTICATED';
          state.isAuthenticated = true;
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
        isAnyOf(logoutUser.fulfilled, logoutUser.rejected),
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
