import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const dsaSheetSliceModule = await import('../../src/features/dsaSheet/redux/dsaSheetSlice.ts');
const {
  default: dsaSheetReducer,
  selectSheet,
  toggleSection,
  invalidateDsaSheetCache,
  resetDsaSheetErrors,
  fetchDsaSheets,
  fetchDsaSections,
  fetchSectionQuestions,
} = dsaSheetSliceModule;

describe('dsaSheetSlice: Redux Toolkit Architecture & State Management', () => {
  const getInitialState = () => dsaSheetReducer(undefined, { type: '@@INIT' });

  it('initializes with default empty state and loadingSheets true', () => {
    const state = getInitialState();
    assert.deepEqual(state.sheets, []);
    assert.equal(state.selectedSheetId, null);
    assert.deepEqual(state.sections, []);
    assert.deepEqual(state.sectionsBySheetId, {});
    assert.deepEqual(state.questionsBySection, {});
    assert.equal(state.expandedSectionId, null);
    assert.equal(state.loadingSheets, true);
    assert.equal(state.loadingSections, false);
    assert.equal(state.loadingQuestionSectionId, null);
    assert.equal(state.sheetError, null);
    assert.equal(state.sectionsError, null);
    assert.deepEqual(state.questionErrors, {});
  });

  describe('fetchDsaSheets extraReducers', () => {
    it('handles pending by resetting sheetError and setting loadingSheets', () => {
      const state0 = { ...getInitialState(), loadingSheets: false, sheetError: 'Old error' };
      const state1 = dsaSheetReducer(state0, { type: fetchDsaSheets.pending.type });
      assert.equal(state1.loadingSheets, true);
      assert.equal(state1.sheetError, null);
    });

    it('handles fulfilled by storing sheets, updating timestamp, and selecting first sheet', () => {
      const state0 = getInitialState();
      const mockSheets = [
        { id: 101, sheetName: 'Striver SDE Sheet', sheetCode: 'STRIVER', description: 'Top DSA', isActive: true },
        { id: 102, sheetName: 'Blind 75', sheetCode: 'BLIND75', description: 'Curated 75', isActive: true },
      ];
      const state1 = dsaSheetReducer(state0, {
        type: fetchDsaSheets.fulfilled.type,
        payload: mockSheets,
      });

      assert.equal(state1.loadingSheets, false);
      assert.deepEqual(state1.sheets, mockSheets);
      assert.equal(state1.selectedSheetId, 101);
      assert.notEqual(state1.sheetsFetchedAt, null);
      assert.equal(state1.loadingSections, true);
    });

    it('handles rejected by updating sheetError and resetting loadingSheets', () => {
      const state0 = getInitialState();
      const state1 = dsaSheetReducer(state0, {
        type: fetchDsaSheets.rejected.type,
        payload: 'Network connection lost.',
      });

      assert.equal(state1.loadingSheets, false);
      assert.equal(state1.sheetError, 'Network connection lost.');
    });
  });

  describe('selectSheet and toggleSection actions', () => {
    it('switches selectedSheetId and restores cached sections without re-triggering loading', () => {
      const cachedSections = [
        { id: 201, sheetId: 102, sectionName: 'Arrays & Hashing', orderIndex: 1, isActive: true },
      ];
      const state0 = {
        ...getInitialState(),
        selectedSheetId: 101,
        sectionsBySheetId: { 102: cachedSections },
        questionsBySection: { 201: [{ id: 1, sectionId: 201, questionId: 5, question: { id: 5, title: 'Two Sum', isActive: true } }] },
      };

      const state1 = dsaSheetReducer(state0, selectSheet(102));
      assert.equal(state1.selectedSheetId, 102);
      assert.deepEqual(state1.sections, cachedSections);
      assert.equal(state1.expandedSectionId, 201);
      assert.equal(state1.loadingSections, false);
      assert.equal(state1.loadingQuestionSectionId, null);
    });

    it('toggles section expansion and prepares loadingQuestionSectionId if uncached', () => {
      const state0 = {
        ...getInitialState(),
        expandedSectionId: null,
        questionsBySection: {},
      };

      const state1 = dsaSheetReducer(state0, toggleSection(305));
      assert.equal(state1.expandedSectionId, 305);
      assert.equal(state1.loadingQuestionSectionId, 305);

      // Collapsing section
      const state2 = dsaSheetReducer(state1, toggleSection(305));
      assert.equal(state2.expandedSectionId, null);
    });
  });

  describe('fetchDsaSections extraReducers', () => {
    it('handles fulfilled by storing sectionsBySheetId and selecting first section', () => {
      const state0 = {
        ...getInitialState(),
        selectedSheetId: 101,
        loadingSections: true,
      };

      const mockSections = [
        { id: 401, sheetId: 101, sectionName: 'Arrays', orderIndex: 1, isActive: true },
        { id: 402, sheetId: 101, sectionName: 'Linked List', orderIndex: 2, isActive: true },
      ];

      const state1 = dsaSheetReducer(state0, {
        type: fetchDsaSections.fulfilled.type,
        payload: { sheetId: 101, sections: mockSections },
      });

      assert.equal(state1.loadingSections, false);
      assert.deepEqual(state1.sections, mockSections);
      assert.deepEqual(state1.sectionsBySheetId[101], mockSections);
      assert.equal(state1.expandedSectionId, 401);
      assert.equal(state1.loadingQuestionSectionId, 401);
      assert.notEqual(state1.sectionsFetchedAt[101], undefined);
    });

    it('handles rejected by updating sectionsError and clearing loading', () => {
      const state0 = {
        ...getInitialState(),
        selectedSheetId: 101,
        loadingSections: true,
      };

      const state1 = dsaSheetReducer(state0, {
        type: fetchDsaSections.rejected.type,
        meta: { arg: { sheetId: 101 } },
        payload: 'Unable to load DSA sheet sections.',
      });

      assert.equal(state1.loadingSections, false);
      assert.equal(state1.sectionsError, 'Unable to load DSA sheet sections.');
      assert.deepEqual(state1.sections, []);
    });
  });

  describe('fetchSectionQuestions extraReducers', () => {
    it('handles fulfilled by caching questions and clearing loading', () => {
      const state0 = {
        ...getInitialState(),
        loadingQuestionSectionId: 401,
      };

      const mockQuestions = [
        {
          id: 501,
          sectionId: 401,
          questionId: 12,
          orderIndex: 1,
          isActive: true,
          question: {
            id: 12,
            title: 'Set Matrix Zeroes',
            difficultyName: 'Medium',
            topicName: 'Arrays',
            description: 'Given an m x n matrix...',
            companies: ['Amazon', 'Microsoft'],
            isActive: true,
          },
        },
      ];

      const state1 = dsaSheetReducer(state0, {
        type: fetchSectionQuestions.fulfilled.type,
        payload: { sectionId: 401, questions: mockQuestions },
      });

      assert.equal(state1.loadingQuestionSectionId, null);
      assert.deepEqual(state1.questionsBySection[401], mockQuestions);
      assert.notEqual(state1.questionsFetchedAt[401], undefined);
      assert.equal(state1.questionErrors[401], undefined);
    });

    it('handles rejected with sectionId error attribution', () => {
      const state0 = {
        ...getInitialState(),
        loadingQuestionSectionId: 401,
      };

      const state1 = dsaSheetReducer(state0, {
        type: fetchSectionQuestions.rejected.type,
        meta: { arg: { sectionId: 401 } },
        payload: { sectionId: 401, message: 'Question service timeout.' },
      });

      assert.equal(state1.loadingQuestionSectionId, null);
      assert.equal(state1.questionErrors[401], 'Question service timeout.');
    });
  });

  describe('cache invalidation and error reset', () => {
    it('clears cache timestamps when invalidateDsaSheetCache is called', () => {
      const state0 = {
        ...getInitialState(),
        sheetsFetchedAt: 12345,
        sectionsFetchedAt: { 101: 12345 },
        questionsFetchedAt: { 401: 12345 },
      };

      const state1 = dsaSheetReducer(state0, invalidateDsaSheetCache());
      assert.equal(state1.sheetsFetchedAt, null);
      assert.deepEqual(state1.sectionsFetchedAt, {});
      assert.deepEqual(state1.questionsFetchedAt, {});
    });

    it('clears all error messages when resetDsaSheetErrors is called', () => {
      const state0 = {
        ...getInitialState(),
        sheetError: 'Sheet error',
        sectionsError: 'Sections error',
        questionErrors: { 401: 'Question error' },
      };

      const state1 = dsaSheetReducer(state0, resetDsaSheetErrors());
      assert.equal(state1.sheetError, null);
      assert.equal(state1.sectionsError, null);
      assert.deepEqual(state1.questionErrors, {});
    });

    it('resets state to initialState on auth/logout/fulfilled and auth/logout/rejected', () => {
      const state0 = {
        ...getInitialState(),
        sheets: [{ id: 1, sheetName: 'Sheet 1', sheetCode: 'S1', isActive: true, createdAt: '', updatedAt: '' }],
        selectedSheetId: 1,
        sections: [{ id: 10, sectionTitle: 'Section 1', isActive: true, sheetId: 1, createdAt: '', updatedAt: '' }],
        loadingSheets: false,
      };

      const stateFulfilled = dsaSheetReducer(state0, { type: 'auth/logout/fulfilled' });
      assert.deepEqual(stateFulfilled.sheets, []);
      assert.equal(stateFulfilled.selectedSheetId, null);
      assert.equal(stateFulfilled.loadingSheets, true);

      const stateRejected = dsaSheetReducer(state0, { type: 'auth/logout/rejected' });
      assert.deepEqual(stateRejected.sheets, []);
      assert.equal(stateRejected.selectedSheetId, null);
      assert.equal(stateRejected.loadingSheets, true);
    });
  });
});
