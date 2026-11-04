/* eslint-disable react-refresh/only-export-components -- provider and hook share one context module */
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../../core/security/tokenStorage';
import { userScopedStorage } from '../../core/storage/userScopedStorage';

type Theme = 'dark' | 'light';
type ThemePreference = Theme | 'system';
const LEGACY_THEME_KEY = 'c2c_theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const resolveThemePreference = (preference: string | null): Theme => {
  if (preference === 'light' || preference === 'dark') return preference;
  if (preference === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const hasAccountScope = (): boolean => {
  const scopedUser = tokenStorage.getUser();
  return Boolean(
    scopedUser?.id !== undefined && scopedUser?.id !== null && String(scopedUser.id).trim()
      ? true
      : scopedUser?.email?.trim()
  );
};

const removeLegacyTheme = () => {
  try {
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {}
};

const loadScopedThemePreference = (): ThemePreference => {
  const scopedPreference = userScopedStorage.getItem('theme_pref');
  if (
    scopedPreference === 'light' ||
    scopedPreference === 'dark' ||
    scopedPreference === 'system'
  ) {
    if (hasAccountScope()) removeLegacyTheme();
    return scopedPreference;
  }

  let legacyPreference: string | null = null;
  try {
    legacyPreference = localStorage.getItem(LEGACY_THEME_KEY);
  } catch {}

  const migratedPreference: ThemePreference =
    legacyPreference === 'light' || legacyPreference === 'dark'
      ? legacyPreference
      : 'dark';
  userScopedStorage.setItem('theme_pref', migratedPreference);

  // The global key cannot safely represent more than one account. Once its
  // value has been migrated into the active scope, stop using it as a mirror.
  if (hasAccountScope() && (legacyPreference === 'light' || legacyPreference === 'dark')) {
    removeLegacyTheme();
  }

  return migratedPreference;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authStatus = useAppSelector((state) => state.auth.status);
  const normalizedIdentity =
    user?.id !== undefined && user?.id !== null && String(user.id).trim()
      ? `id:${String(user.id)}`
      : user?.email
        ? `email:${String(user.email).trim().toLowerCase()}`
        : 'authenticated';
  const scopeKey = isAuthenticated
    ? normalizedIdentity
    : 'guest';
  const [preference, setPreference] = useState<ThemePreference>(loadScopedThemePreference);
  const [theme, setThemeState] = useState<Theme>(() => resolveThemePreference(preference));

  useEffect(() => {
    const nextPreference = loadScopedThemePreference();
    setPreference(nextPreference);
    setThemeState(resolveThemePreference(nextPreference));
  }, [authStatus, isAuthenticated, scopeKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyPreference = () => setThemeState(resolveThemePreference(preference));
    applyPreference();
    if (preference !== 'system') return;
    mediaQuery.addEventListener('change', applyPreference);
    return () => mediaQuery.removeEventListener('change', applyPreference);
  }, [preference]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const updateTheme = useCallback((nextPreference: ThemePreference) => {
    userScopedStorage.setItem('theme_pref', nextPreference);
    setPreference(nextPreference);
  }, []);

  const setTheme = useCallback((nextPreference: ThemePreference) => {
    updateTheme(nextPreference);
  }, [updateTheme]);

  const toggleTheme = () => {
    updateTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
