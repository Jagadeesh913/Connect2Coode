import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileService } from '../../../services/profileService';
import type { UserProfile, UserInfoData, SaveUserInfoPayload } from '../../../core/types/domain';

export interface ProfileState {
  profile: UserProfile | null;
  userInfo: UserInfoData | null;
  loading: boolean;
  userInfoLoading: boolean;
  error: string | null;
  userInfoError: string | null;
  userInfoRequestId: string | null;
  activeUserInfoUserId: string | number | null;
}

const initialState: ProfileState = {
  profile: null,
  userInfo: null,
  loading: false,
  userInfoLoading: false,
  error: null,
  userInfoError: null,
  userInfoRequestId: null,
  activeUserInfoUserId: null,
};

export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  { force?: boolean } | boolean | void
>(
  'profile/fetch',
  async () => {
    const res = await profileService.getProfile();
    return res.data;
  },
  {
    condition: (arg, { getState }) => {
      const state = getState() as { profile: ProfileState };
      if (state.profile?.loading) {
        return false;
      }
      const force = typeof arg === 'boolean' ? arg : Boolean(arg?.force);
      if (force) {
        return true;
      }
      if (state.profile?.profile) {
        return false;
      }
      return true;
    },
  }
);

export const fetchUserInfoThunk = createAsyncThunk<
  { userId: string | number; data: UserInfoData | null },
  { userId: string | number; force?: boolean },
  { rejectValue: string }
>(
  'profile/fetchUserInfo',
  async ({ userId }, { rejectWithValue, signal }) => {
    try {
      const res = await profileService.getUserInfo(userId, signal);
      return { userId, data: res.data };
    } catch (err: any) {
      if (signal.aborted) throw err;
      return rejectWithValue(err?.message || 'Unable to refresh academic details.');
    }
  },
  {
    condition: ({ userId, force }, { getState }) => {
      const state = getState() as { profile: ProfileState };
      const sameUser =
        String(state.profile.activeUserInfoUserId ?? '') === String(userId);
      if (state.profile.userInfoLoading && sameUser) {
        return false;
      }
      if (force) return true;
      if (
        sameUser &&
        state.profile.userInfoRequestId === null &&
        state.profile.userInfoError === null
      ) {
        return false;
      }
      return true;
    },
  }
);

export const saveUserInfoThunk = createAsyncThunk<
  UserInfoData,
  { userId: string | number; payload: SaveUserInfoPayload },
  { rejectValue: string }
>(
  'profile/saveUserInfo',
  async (
    { userId, payload }: { userId: string | number; payload: SaveUserInfoPayload },
    { rejectWithValue }
  ) => {
    try {
      const res = await profileService.saveUserInfo(userId, payload);
      return {
        ...payload,
        ...res.data,
        userId,
        college: res.data?.college || res.data?.collegeName || payload.college,
        collegeName: res.data?.collegeName || res.data?.college || payload.college,
      };
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Unable to save academic details.');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchUserProfile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      // fetchUserInfo
      .addCase(fetchUserInfoThunk.pending, (state, action) => {
        const isNewUser =
          String(state.activeUserInfoUserId ?? '') !== String(action.meta.arg.userId);
        if (isNewUser) {
          state.userInfo = null;
        }
        state.userInfoLoading = true;
        state.userInfoError = null;
        state.userInfoRequestId = action.meta.requestId;
        state.activeUserInfoUserId = action.meta.arg.userId;
      })
      .addCase(fetchUserInfoThunk.fulfilled, (state, action) => {
        if (state.userInfoRequestId !== action.meta.requestId) return;
        state.userInfoLoading = false;
        state.userInfoRequestId = null;
        state.activeUserInfoUserId = action.meta.arg.userId;
        state.userInfo = action.payload.data
          ? {
              ...action.payload.data,
              userId: action.payload.data.userId ?? action.payload.userId,
            }
          : null;
      })
      .addCase(fetchUserInfoThunk.rejected, (state, action) => {
        if (state.userInfoRequestId !== action.meta.requestId) return;
        state.userInfoLoading = false;
        state.userInfoRequestId = null;
        if (!action.meta.aborted && !action.meta.condition) {
          state.userInfoError = action.payload || action.error.message || 'Unable to refresh academic details.';
        }
      })
      // saveUserInfo
      .addCase(saveUserInfoThunk.pending, (state, action) => {
        state.userInfoLoading = true;
        state.userInfoError = null;
        state.userInfoRequestId = action.meta.requestId;
        state.activeUserInfoUserId = action.meta.arg.userId;
      })
      .addCase(saveUserInfoThunk.fulfilled, (state, action) => {
        if (state.userInfoRequestId !== action.meta.requestId) return;
        state.userInfoLoading = false;
        state.userInfoRequestId = null;
        state.activeUserInfoUserId = action.meta.arg.userId;
        state.userInfo = action.payload;
      })
      .addCase(saveUserInfoThunk.rejected, (state, action) => {
        if (state.userInfoRequestId !== action.meta.requestId) return;
        state.userInfoLoading = false;
        state.userInfoRequestId = null;
        state.userInfoError = action.payload || action.error.message || 'Unable to save academic details.';
      })
      .addMatcher(
        (action) => action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected',
        (state) => {
          state.profile = null;
          state.userInfo = null;
          state.userInfoLoading = false;
          state.userInfoError = null;
          state.userInfoRequestId = null;
          state.activeUserInfoUserId = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type === 'auth/login/fulfilled' ||
          action.type === 'auth/loginWithGoogleRefreshToken/fulfilled' ||
          action.type === 'auth/setAuthenticatedSession' ||
          action.type === 'auth/initializeAuth',
        (state, action: any) => {
          const nextUser = action.payload?.user || action.payload?.savedUser || action.payload;
          const nextUserId = nextUser?.id ?? null;
          const profileBelongsToNextUser =
            state.profile?.id != null && String(state.profile.id) === String(nextUserId ?? '');
          const userInfoBelongsToNextUser =
            state.activeUserInfoUserId != null &&
            String(state.activeUserInfoUserId) === String(nextUserId ?? '');

          if (!profileBelongsToNextUser) state.profile = null;
          if (!userInfoBelongsToNextUser) {
            state.userInfo = null;
            state.userInfoLoading = false;
            state.userInfoError = null;
            state.userInfoRequestId = null;
            state.activeUserInfoUserId = nextUserId;
          }
        }
      );
  },
});

export default profileSlice.reducer;
