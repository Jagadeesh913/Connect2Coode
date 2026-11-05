import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/redux/authSlice';
import problemReducer from '../features/problems/redux/problemSlice';
import companyReducer from '../features/companies/redux/companySlice';
import bookmarkReducer from '../features/bookmarks/redux/bookmarkSlice';
import profileReducer from '../features/profile/redux/profileSlice';
import referenceReducer from '../features/references/redux/referenceSlice';
import languageReducer from '../features/languages/redux/languageSlice';
import progressReducer from '../features/progress/redux/progressSlice';
import dsaSheetReducer from '../features/dsaSheet/redux/dsaSheetSlice';

const appReducer = combineReducers({
  auth: authReducer,
  problems: problemReducer,
  companies: companyReducer,
  bookmarks: bookmarkReducer,
  profile: profileReducer,
  references: referenceReducer,
  languages: languageReducer,
  progress: progressReducer,
  dsaSheet: dsaSheetReducer,
});

type AppState = ReturnType<typeof appReducer>;

/** Clears all user-protected caches as soon as local logout starts or auth fails. */
export const rootReducer = (
  state: AppState | undefined,
  action: { type: string; payload?: unknown }
): AppState => {
  const shouldClearProtectedState =
    action.type === 'auth/logout/pending' ||
    action.type === 'auth/logout/fulfilled' ||
    action.type === 'auth/logout/rejected' ||
    action.type === 'auth/setUnauthenticatedSession';

  if (shouldClearProtectedState) {
    const resetState = appReducer(undefined, { type: '@@c2c/RESET_PROTECTED_STATE' });
    return appReducer({ ...resetState, auth: state?.auth ?? resetState.auth }, action);
  }

  return appReducer(state, action);
};
