import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { clientPersistenceMiddleware } from './clientPersistenceMiddleware';

export const createAppStore = () => configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(clientPersistenceMiddleware),
  devTools: import.meta.env.DEV,
});

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
