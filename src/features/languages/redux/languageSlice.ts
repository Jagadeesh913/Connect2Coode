import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { executionService } from '../../../services/executionService';
import type { Language } from '../../../core/types/domain';

export interface LanguageState {
  languages: Language[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  currentRequestId: string | null;
}

const initialState: LanguageState = {
  languages: [],
  loading: false,
  error: null,
  lastFetchedAt: null,
  currentRequestId: null,
};

const LANGUAGE_CACHE_TTL_MS = 30 * 60 * 1000;

export const fetchLanguages = createAsyncThunk<
  { items: Language[]; fetchedAt: number },
  { force?: boolean } | void
>(
  'languages/fetchDropdown',
  async (_, { rejectWithValue }) => {
    try {
      return {
        items: await executionService.getLanguageDropdown(Boolean(_?.force)),
        fetchedAt: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to load languages');
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState() as { languages: LanguageState };
      if (state.languages.loading) return false;
      if (arg?.force) return true;
      return !state.languages.lastFetchedAt ||
        Date.now() - state.languages.lastFetchedAt >= LANGUAGE_CACHE_TTL_MS;
    },
  }
);

const languageSlice = createSlice({
  name: 'languages',
  initialState,
  reducers: {
    invalidateLanguages(state) {
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLanguages.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.currentRequestId = null;
        state.languages = action.payload.items;
        state.lastFetchedAt = action.payload.fetchedAt;
      })
      .addCase(fetchLanguages.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.currentRequestId = null;
        if (!action.meta.condition && !action.meta.aborted) {
          state.error = action.payload as string;
        }
      });
  },
});

export const { invalidateLanguages } = languageSlice.actions;
export default languageSlice.reducer;
