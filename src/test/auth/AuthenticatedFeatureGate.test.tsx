import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { AuthenticatedFeatureGate } from '../../features/auth/components/AuthenticatedFeatureGate';
import { type AuthState } from '../../features/auth/redux/authSlice';

const createMockStore = (authState: Partial<AuthState>) =>
  configureStore({
    reducer: {
      auth: () => ({
        user: null,
        token: null,
        status: 'UNAUTHENTICATED' as const,
        isAuthenticated: false,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login' as const,
        refreshRequestId: null,
        ...authState,
      }),
    },
  });

describe('AuthenticatedFeatureGate Component', () => {
  it('renders loading state when auth status is LOADING', () => {
    const store = createMockStore({ status: 'LOADING', loading: true });
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <AuthenticatedFeatureGate title="Protected Feature" description="Please sign in">
            <div>Secret Content</div>
          </AuthenticatedFeatureGate>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(container.querySelector('[role="status"]') || container.firstElementChild).toBeInTheDocument();
  });

  it('renders public hub content when unauthenticated on a registered public route', () => {
    const store = createMockStore({ status: 'UNAUTHENTICATED', isAuthenticated: false });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AuthenticatedFeatureGate
            title="Coding Practice"
            description="Explore problem catalog"
            publicPath="/practice"
          >
            <div>Secret Problem Workspace</div>
          </AuthenticatedFeatureGate>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.queryByText('Secret Problem Workspace')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coding Practice for Placement Interviews' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in to continue' })).toBeInTheDocument();
  });

  it('renders default empty state when unauthenticated without a publicPath', () => {
    const store = createMockStore({ status: 'UNAUTHENTICATED', isAuthenticated: false });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AuthenticatedFeatureGate title="Private Notes" description="Sign in to view your private notes">
            <div>Private Notes List</div>
          </AuthenticatedFeatureGate>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.queryByText('Private Notes List')).not.toBeInTheDocument();
    expect(screen.getAllByText('Private Notes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sign in to view your private notes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders protected children when authenticated', () => {
    const store = createMockStore({
      status: 'AUTHENTICATED',
      isAuthenticated: true,
      user: { email: 'student@connect2code.in' },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <AuthenticatedFeatureGate title="Protected Feature" description="Please sign in">
            <div data-testid="protected-content">Authenticated Dashboard View</div>
          </AuthenticatedFeatureGate>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Authenticated Dashboard View')).toBeInTheDocument();
  });
});
