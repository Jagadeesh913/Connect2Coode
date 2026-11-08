/* eslint-disable react-refresh/only-export-components -- provider and hook share one context module */
import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../../core/security/tokenStorage';
import { userScopedStorage } from '../../core/storage/userScopedStorage';
import { profileService } from '../../services/profileService';

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
  const themeRequestVersionRef = useRef(0);
  const themeSaveQueueRef = useRef(Promise.resolve());

  const authenticatedUserId =
    isAuthenticated && user?.id !== undefined && user?.id !== null && String(user.id).trim()
      ? user.id
      : null;

  useEffect(() => {
    const nextPreference = loadScopedThemePreference();
    setPreference(nextPreference);
    setThemeState(resolveThemePreference(nextPreference));
  }, [authStatus, isAuthenticated, scopeKey]);

  // The backend is authoritative for an authenticated account's explicit
  // light/dark setting. Browser storage remains a per-user cache and guest
  // fallback; it does not replace the server preference.
  useEffect(() => {
    if (authenticatedUserId === null) return;
    const controller = new AbortController();
    const requestVersion = ++themeRequestVersionRef.current;

    void profileService.getThemePreference(authenticatedUserId, controller.signal)
      .then((response) => {
        if (controller.signal.aborted || requestVersion !== themeRequestVersionRef.current) return;
        const nextPreference: Theme = response.data.isDarkTheme ? 'dark' : 'light';
        userScopedStorage.setItem('theme_pref', nextPreference);
        setPreference(nextPreference);
      })
      // A theme endpoint failure must not log the user out or discard a local
      // preference. The next authenticated session can retry the server read.
      .catch(() => undefined);

    return () => controller.abort();
  }, [authenticatedUserId, scopeKey]);

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
    if (authenticatedUserId === null || nextPreference === 'system') return;

    // A choice made while the initial server read is in flight wins over that
    // stale read; the queued mutation below will persist this choice.
    themeRequestVersionRef.current += 1;
    const isDarkTheme = nextPreference === 'dark';
    // Serialize mutations so rapid toggles cannot arrive out of order and
    // leave the persisted server preference opposite to the visible theme.
    themeSaveQueueRef.current = themeSaveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await profileService.saveThemePreference(authenticatedUserId, isDarkTheme);
      })
      .catch(() => undefined);
  }, [authenticatedUserId]);

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
