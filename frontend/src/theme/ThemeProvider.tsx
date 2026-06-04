/**
 * ThemeProvider — owns the user's theme preference (Light / Dark / System), resolves it to a concrete
 * theme, and applies it to <html data-theme>. 'System' follows the OS via prefers-color-scheme and
 * updates live. The choice persists to localStorage now; it is structured so `setPreference` can ALSO
 * `PATCH /v1/account/theme` once auth/login exists (the per-user `theme_preference`). The very first
 * paint is handled by the inline boot script in index.html (no flash of the wrong theme). — design-system §3.5
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './theme-context';
import { THEME_STORAGE_KEY, type ResolvedTheme, type ThemePreference } from './theme.types';

const isPreference = (v: unknown): v is ThemePreference =>
  v === 'light' || v === 'dark' || v === 'system';

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolve = (preference: ThemePreference): ResolvedTheme =>
  preference === 'system' ? (prefersDark() ? 'dark' : 'light') : preference;

const readStoredPreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isPreference(stored) ? stored : 'system';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(preference));

  // Apply the resolved theme to the document root whenever it changes.
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  // While on 'system', follow the OS setting live.
  useEffect(() => {
    if (preference !== 'system') {
      setResolvedTheme(resolve(preference));
      return;
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setResolvedTheme(mql.matches ? 'dark' : 'light');
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    // TODO(auth): once logged in, also `PATCH /v1/account/theme` { theme_preference: next }
    // so the choice follows the user across devices (design-system §3.5).
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
