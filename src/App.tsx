import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { router } from './routes/appRoutes';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './shared/context/ThemeContext';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { hydrateProgress } from './features/progress/redux/progressSlice';
import { AppErrorBoundary } from './shared/components/errors/AppErrorBoundary';

const ProgressHydrator: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const scopeKey = isAuthenticated
    ? String(user?.id ?? user?.email ?? 'authenticated')
    : 'guest';

  React.useEffect(() => {
    void dispatch(hydrateProgress());
  }, [dispatch, scopeKey]);

  return null;
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ProgressHydrator />
      <ThemeProvider>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            className: 'c2c-toast',
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
              borderRadius: '16px',
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: 'var(--toast-shadow)',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#F43F5E',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
