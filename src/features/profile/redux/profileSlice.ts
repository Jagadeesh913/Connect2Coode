import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { profileService } from '../../../services/profileService';
import type { UserProfile, UserInfoData, SaveUserInfoPayload } from '../../../core/types/domain';

export interface ProfileState {
  profile: UserProfile | null;
  userInfo: UserInfoData | null;
  loading: boolean;
  userInfoLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  userInfo: null,
  loading: false,
  userInfoLoading: false,
  error: null,
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

export const updateUserProfile = createAsyncThunk(
  'profile/update',
  async (payload: Partial<UserProfile>) => {
    const res = await profileService.updateProfile(payload);
    return res.data;
  }
);

export const fetchUserInfoThunk = createAsyncThunk<
  UserInfoData | null,
  string | number,
  { rejectValue: any }
>(
  'profile/fetchUserInfo',
  async (userId: string | number, { rejectWithValue }) => {
    try {
      const res = await profileService.getUserInfo(userId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  },
  {
    condition: (userId, { getState }) => {
      const state = getState() as { profile: ProfileState };
      if (state.profile?.userInfoLoading) {
        return false;
      }
      if (
        state.profile?.userInfo &&
        String(state.profile.userInfo.userId ?? '') === String(userId)
      ) {
        return false;
      }
      return true;
    },
  }
);

export const saveUserInfoThunk = createAsyncThunk(
  'profile/saveUserInfo',
  async (
    { userId, payload }: { userId: string | number; payload: SaveUserInfoPayload },
    { rejectWithValue }
  ) => {
    try {
      const res = await profileService.saveUserInfo(userId, payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
    },
    setUserInfo(state, action: PayloadAction<UserInfoData | null>) {
      state.userInfo = action.payload;
    },
  },
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
      // updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
      })
      // fetchUserInfo
      .addCase(fetchUserInfoThunk.pending, (state) => {
        state.userInfoLoading = true;
      })
      .addCase(fetchUserInfoThunk.fulfilled, (state, action) => {
        state.userInfoLoading = false;
        state.userInfo = action.payload;
      })
      .addCase(fetchUserInfoThunk.rejected, (state) => {
        state.userInfoLoading = false;
      })
      // saveUserInfo
      .addCase(saveUserInfoThunk.pending, (state) => {
        state.userInfoLoading = true;
      })
      .addCase(saveUserInfoThunk.fulfilled, (state, action) => {
        state.userInfoLoading = false;
        state.userInfo = action.payload;
      })
      .addCase(saveUserInfoThunk.rejected, (state) => {
        state.userInfoLoading = false;
      });
  },
});

export const { setProfile, setUserInfo } = profileSlice.actions;
export default profileSlice.reducer;
