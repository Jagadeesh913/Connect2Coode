import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { isRequestCanceled } from '../../../core/api/apiClient';
import { getActionableErrorMessage } from '../../../core/validation/serverErrorMapper';
import { learningSheetService } from '../../../services/learningSheetService';
import type { DsaSheet, DsaSheetQuestionLink, DsaSheetSection } from '../types';

export const DSA_SHEET_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

export interface DsaSheetState {
  sheets: DsaSheet[];
  selectedSheetId: number | null;
  sections: DsaSheetSection[];
  sectionsBySheetId: Record<number, DsaSheetSection[]>;
  questionsBySection: Record<number, DsaSheetQuestionLink[]>;
  expandedSectionId: number | null;

  // Loading flags
  loadingSheets: boolean;
  loadingSections: boolean;
  loadingQuestionSectionId: number | null;

  // Error messages
  sheetError: string | null;
  sectionsError: string | null;
  questionErrors: Record<number, string>;

  // Timestamps for TTL cache validation
  sheetsFetchedAt: number | null;
  sectionsFetchedAt: Record<number, number>;
  questionsFetchedAt: Record<number, number>;
}

const initialState: DsaSheetState = {
  sheets: [],
  selectedSheetId: null,
  sections: [],
  sectionsBySheetId: {},
  questionsBySection: {},
  expandedSectionId: null,

  loadingSheets: true,
  loadingSections: false,
  loadingQuestionSectionId: null,

  sheetError: null,
  sectionsError: null,
  questionErrors: {},

  sheetsFetchedAt: null,
  sectionsFetchedAt: {},
  questionsFetchedAt: {},
};

export const fetchDsaSheets = createAsyncThunk<
  DsaSheet[],
  { force?: boolean } | void,
  { state: RootState }
>('dsaSheet/fetchSheets', async (arg, { getState, rejectWithValue, signal }) => {
  const { dsaSheet } = getState();
  const now = Date.now();
  if (
    !arg?.force &&
    dsaSheet.sheets.length > 0 &&
    dsaSheet.sheetsFetchedAt &&
    now - dsaSheet.sheetsFetchedAt < DSA_SHEET_CACHE_TTL_MS
  ) {
    return dsaSheet.sheets;
  }
  try {
    const result = await learningSheetService.getSheets(signal);
    return result.filter((sheet) => sheet.isActive);
  } catch (error) {
    if (isRequestCanceled(error)) throw error;
    return rejectWithValue(getActionableErrorMessage(error, 'Unable to load DSA sheets.'));
  }
});

export const fetchDsaSections = createAsyncThunk<
  { sheetId: number; sections: DsaSheetSection[] },
  { sheetId: number; force?: boolean },
  { state: RootState }
>('dsaSheet/fetchSections', async ({ sheetId, force }, { getState, rejectWithValue, signal }) => {
  const { dsaSheet } = getState();
  const now = Date.now();
  const cached = dsaSheet.sectionsBySheetId[sheetId];
  const fetchedAt = dsaSheet.sectionsFetchedAt[sheetId];
  if (!force && cached && fetchedAt && now - fetchedAt < DSA_SHEET_CACHE_TTL_MS) {
    return { sheetId, sections: cached };
  }
  try {
    const result = await learningSheetService.getSections(sheetId, signal);
    const activeSections = result.filter((section) => section.isActive);
    return { sheetId, sections: activeSections };
  } catch (error) {
    if (isRequestCanceled(error)) throw error;
    return rejectWithValue(getActionableErrorMessage(error, 'Unable to load DSA sheet sections.'));
  }
});

export const fetchSectionQuestions = createAsyncThunk<
  { sectionId: number; questions: DsaSheetQuestionLink[] },
  { sectionId: number; force?: boolean },
  { state: RootState }
>('dsaSheet/fetchSectionQuestions', async ({ sectionId, force }, { getState, rejectWithValue, signal }) => {
  const { dsaSheet } = getState();
  const now = Date.now();
  const cached = dsaSheet.questionsBySection[sectionId];
  const fetchedAt = dsaSheet.questionsFetchedAt[sectionId];
  if (!force && cached && fetchedAt && now - fetchedAt < DSA_SHEET_CACHE_TTL_MS) {
    return { sectionId, questions: cached };
  }
  try {
    const result = await learningSheetService.getSectionQuestions(sectionId, signal);
    const activeQuestions = result.filter((link) => link.isActive && link.question.isActive);
    return { sectionId, questions: activeQuestions };
  } catch (error) {
    if (isRequestCanceled(error)) throw error;
    return rejectWithValue({
      sectionId,
      message: getActionableErrorMessage(error, 'Unable to load section questions.'),
    });
  }
});

export const dsaSheetSlice = createSlice({
  name: 'dsaSheet',
  initialState,
  reducers: {
    selectSheet(state, action: PayloadAction<number>) {
      const sheetId = action.payload;
      if (state.selectedSheetId === sheetId) return;
      state.selectedSheetId = sheetId;
      state.sections = state.sectionsBySheetId[sheetId] ?? [];
      const firstSectionId = state.sections[0]?.id ?? null;
      state.expandedSectionId = firstSectionId;
      state.sectionsError = null;
      if (!state.sectionsBySheetId[sheetId]) {
        state.loadingSections = true;
      }
      if (firstSectionId && state.questionsBySection[firstSectionId] === undefined) {
        state.loadingQuestionSectionId = firstSectionId;
      }
    },
    toggleSection(state, action: PayloadAction<number>) {
      const sectionId = action.payload;
      const nextId = state.expandedSectionId === sectionId ? null : sectionId;
      state.expandedSectionId = nextId;
      if (nextId && state.questionsBySection[nextId] === undefined) {
        state.loadingQuestionSectionId = nextId;
      }
    },
    invalidateDsaSheetCache(state) {
      state.sheetsFetchedAt = null;
      state.sectionsFetchedAt = {};
      state.questionsFetchedAt = {};
    },
    resetDsaSheetErrors(state) {
      state.sheetError = null;
      state.sectionsError = null;
      state.questionErrors = {};
    },
  },
  extraReducers: (builder) => {
    // 1. Sheets List
    builder.addCase(fetchDsaSheets.pending, (state) => {
      state.loadingSheets = state.sheets.length === 0;
      state.sheetError = null;
    });
    builder.addCase(fetchDsaSheets.fulfilled, (state, action) => {
      state.loadingSheets = false;
      state.sheets = action.payload;
      state.sheetsFetchedAt = Date.now();
      state.sheetError = null;

      // Select first sheet if current selection is invalid
      const current = state.selectedSheetId;
      if (!current || !action.payload.some((sheet) => sheet.id === current)) {
        const nextId = action.payload[0]?.id ?? null;
        state.selectedSheetId = nextId;
        if (nextId) {
          state.sections = state.sectionsBySheetId[nextId] ?? [];
          const firstSectionId = state.sections[0]?.id ?? null;
          state.expandedSectionId = firstSectionId;
          state.loadingSections = !state.sectionsBySheetId[nextId];
          if (firstSectionId && state.questionsBySection[firstSectionId] === undefined) {
            state.loadingQuestionSectionId = firstSectionId;
          }
        } else {
          state.sections = [];
          state.expandedSectionId = null;
          state.loadingSections = false;
          state.loadingQuestionSectionId = null;
        }
      }
    });
    builder.addCase(fetchDsaSheets.rejected, (state, action) => {
      state.loadingSheets = false;
      state.sheetError = (action.payload as string) || 'Unable to load DSA sheets.';
    });

    // 2. Sections List
    builder.addCase(fetchDsaSections.pending, (state, action) => {
      const sheetId = action.meta.arg.sheetId;
      if (!state.sectionsBySheetId[sheetId] || action.meta.arg.force) {
        state.loadingSections = true;
      }
      state.sectionsError = null;
    });
    builder.addCase(fetchDsaSections.fulfilled, (state, action) => {
      state.loadingSections = false;
      state.sectionsBySheetId[action.payload.sheetId] = action.payload.sections;
      state.sectionsFetchedAt[action.payload.sheetId] = Date.now();
      state.sectionsError = null;

      if (state.selectedSheetId === action.payload.sheetId) {
        state.sections = action.payload.sections;
        if (state.expandedSectionId === null || !action.payload.sections.some((s) => s.id === state.expandedSectionId)) {
          const firstSectionId = action.payload.sections[0]?.id ?? null;
          state.expandedSectionId = firstSectionId;
          if (firstSectionId && state.questionsBySection[firstSectionId] === undefined) {
            state.loadingQuestionSectionId = firstSectionId;
          }
        }
      }
    });
    builder.addCase(fetchDsaSections.rejected, (state, action) => {
      state.loadingSections = false;
      state.loadingQuestionSectionId = null;
      state.sectionsError = (action.payload as string) || 'Unable to load DSA sheet sections.';
      if (!state.sectionsBySheetId[action.meta.arg.sheetId]) {
        state.sections = [];
      }
    });

    // 3. Section Questions
    builder.addCase(fetchSectionQuestions.pending, (state, action) => {
      const sectionId = action.meta.arg.sectionId;
      state.loadingQuestionSectionId = sectionId;
      delete state.questionErrors[sectionId];
    });
    builder.addCase(fetchSectionQuestions.fulfilled, (state, action) => {
      const { sectionId, questions } = action.payload;
      if (state.loadingQuestionSectionId === sectionId) {
        state.loadingQuestionSectionId = null;
      }
      state.questionsBySection[sectionId] = questions;
      state.questionsFetchedAt[sectionId] = Date.now();
      delete state.questionErrors[sectionId];
    });
    builder.addCase(fetchSectionQuestions.rejected, (state, action) => {
      const sectionId = action.meta.arg.sectionId;
      if (state.loadingQuestionSectionId === sectionId) {
        state.loadingQuestionSectionId = null;
      }
      const payload = action.payload as { sectionId: number; message: string } | undefined;
      const message = payload?.message || 'Unable to load section questions.';
      state.questionErrors[sectionId] = message;
    });
    builder.addMatcher(
      (action) =>
        action.type === 'auth/logout/fulfilled' ||
        action.type === 'auth/logout/rejected',
      () => initialState,
    );
  },
});

export const {
  selectSheet,
  toggleSection,
  invalidateDsaSheetCache,
  resetDsaSheetErrors,
} = dsaSheetSlice.actions;

export default dsaSheetSlice.reducer;
