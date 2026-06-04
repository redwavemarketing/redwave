import { useContext } from 'react';
import { ThemeContext } from './theme-context';
import type { ThemeContextValue } from './theme.types';

/** Access the current theme preference / resolved theme and the setter. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
