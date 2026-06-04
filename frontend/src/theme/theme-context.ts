import { createContext } from 'react';
import type { ThemeContextValue } from './theme.types';

/** Theme context — consumed via the `useTheme` hook. */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
