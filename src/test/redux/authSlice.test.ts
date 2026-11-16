import { describe, it, expect } from 'vitest';
import authReducer, {
  openAuthModal,
  closeAuthModal,
  setAuthModalMode,
  clearAuthError,
  setUnauthenticatedSession,
  type AuthState,
} from '../../features/auth/redux/authSlice';

describe('authSlice Reducer', () => {
  const initialTestState: AuthState = {
    user: null,
    token: null,
    status: 'LOADING',
    isAuthenticated: false,
    loading: true,
    error: 'Temporary error',
    isAuthModalOpen: false,
    authModalMode: 'login',
    refreshRequestId: null,
  };

  it('opens auth modal with default or specified mode', () => {
    const nextState = authReducer(initialTestState, openAuthModal({ mode: 'signup' }));
    expect(nextState.isAuthModalOpen).toBe(true);
    expect(nextState.authModalMode).toBe('signup');
  });

  it('closes auth modal cleanly', () => {
    const openState: AuthState = { ...initialTestState, isAuthModalOpen: true };
    const nextState = authReducer(openState, closeAuthModal());
    expect(nextState.isAuthModalOpen).toBe(false);
  });

  it('sets auth modal mode', () => {
    const nextState = authReducer(initialTestState, setAuthModalMode('forgot'));
    expect(nextState.authModalMode).toBe('forgot');
  });

  it('clears auth error message', () => {
    const stateWithError: AuthState = { ...initialTestState, error: 'Bad credentials' };
    const nextState = authReducer(stateWithError, clearAuthError());
    expect(nextState.error).toBeNull();
  });

  it('sets unauthenticated session state', () => {
    const nextState = authReducer(initialTestState, setUnauthenticatedSession());
    expect(nextState.status).toBe('UNAUTHENTICATED');
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(nextState.loading).toBe(false);
  });
});
