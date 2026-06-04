/** User-selectable theme preference; 'system' follows the OS via prefers-color-scheme. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** The concrete theme actually applied to the document. */
export type ResolvedTheme = 'light' | 'dark';

/** localStorage key — MUST match the inline no-flash boot script in index.html. */
export const THEME_STORAGE_KEY = 'redwave-theme';

export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}
