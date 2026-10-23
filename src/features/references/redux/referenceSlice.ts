import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { referenceService } from '../../../services/referenceService';
import type { ReferenceItem } from '../../../core/types/domain';

export interface ReferenceState {
  groups: Record<string, ReferenceItem[]>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  lastFetchedAt: Record<string, number | null>;
  requestIds: Record<string, string | null>;
}

const initialState: ReferenceState = {
  groups: {},
  loading: {},
  errors: {},
  lastFetchedAt: {},
  requestIds: {},
};

export const REFERENCE_CACHE_TTL_MS = 30 * 60 * 1000;

export const normalizeReferenceGroupCode = (groupCode: string): string =>
  groupCode.trim().toUpperCase();

export type ReferenceGroupRequest = string | { groupCode: string; force?: boolean };

const getRequestGroupCode = (request: ReferenceGroupRequest): string =>
  normalizeReferenceGroupCode(typeof request === 'string' ? request : request.groupCode);

export const fetchReferenceGroup = createAsyncThunk<
  { groupCode: string; items: ReferenceItem[]; fetchedAt: number },
  ReferenceGroupRequest,
  { state: { references: ReferenceState }; rejectValue: { groupCode: string; message: string } }
>(
  'references/fetchGroup',
  async (request, { rejectWithValue, signal }) => {
    const groupCode = getRequestGroupCode(request);
    try {
      const response = await referenceService.getByGroupCode(groupCode, signal);
      return {
        groupCode,
        items: Array.isArray(response.data) ? response.data : [],
        fetchedAt: Date.now(),
      };
    } catch (error: any) {
      if (signal.aborted) throw error;
      return rejectWithValue({
        groupCode,
        message: error?.message || 'Failed to load reference data',
      });
    }
  },
  {
    condition: (request, { getState }) => {
      const state = getState();
      const groupCode = getRequestGroupCode(request);
      if (state.references.loading[groupCode]) {
        return false;
      }
      const force = typeof request === 'object' && Boolean(request.force);
      if (force) return true;
      const lastFetchedAt = state.references.lastFetchedAt[groupCode];
      return !lastFetchedAt || Date.now() - lastFetchedAt >= REFERENCE_CACHE_TTL_MS;
    },
  }
);

const referenceSlice = createSlice({
  name: 'references',
  initialState,
  reducers: {
    invalidateReferenceGroup(state, action: PayloadAction<string>) {
      const groupCode = normalizeReferenceGroupCode(action.payload);
      state.lastFetchedAt[groupCode] = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferenceGroup.pending, (state, action) => {
        const groupCode = getRequestGroupCode(action.meta.arg);
        state.loading[groupCode] = true;
        state.errors[groupCode] = null;
        state.requestIds[groupCode] = action.meta.requestId;
      })
      .addCase(fetchReferenceGroup.fulfilled, (state, action) => {
        const { groupCode, items, fetchedAt } = action.payload;
        if (state.requestIds[groupCode] !== action.meta.requestId) return;
        state.loading[groupCode] = false;
        state.requestIds[groupCode] = null;
        state.groups[groupCode] = items;
        state.lastFetchedAt[groupCode] = fetchedAt;
      })
      .addCase(fetchReferenceGroup.rejected, (state, action) => {
        const groupCode = getRequestGroupCode(action.meta.arg);
        if (state.requestIds[groupCode] !== action.meta.requestId) return;
        state.loading[groupCode] = false;
        state.requestIds[groupCode] = null;
        if (!action.meta.aborted && !action.meta.condition) {
          state.errors[groupCode] = action.payload?.message || action.error.message || 'Failed to load reference data';
        }
      });
  },
});

export const { invalidateReferenceGroup } = referenceSlice.actions;
export default referenceSlice.reducer;
