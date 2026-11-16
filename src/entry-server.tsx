import React, { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createMemoryRouter } from 'react-router-dom';
import { App } from './App';
import { createAppStore } from './app/store';
import { routeTree } from './routes/appRoutes';

export const renderPublicRoute = (path: string): string => {
  const appStore = createAppStore();
  const appRouter = createMemoryRouter(routeTree, { initialEntries: [path] });

  return renderToString(
    <StrictMode>
      <App appStore={appStore} appRouter={appRouter} />
    </StrictMode>
  );
};
