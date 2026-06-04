/**
 * ThemeToggle — the Light / Dark / System control (design-system §3.5). Applies instantly; when the
 * user is signed in it persists per-user via PATCH /v1/account/theme (handled by `useAuth().setTheme`),
 * so the choice follows the user across devices. Reads the current preference from the ThemeProvider.
 */
import { Monitor, Moon, Sun } from 'lucide-react';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useAuth } from '../auth/useAuth';
import { useTheme } from './useTheme';
import type { ThemePreference } from './theme.types';

const OPTIONS = [
  { value: 'light' as const, label: <Sun size={16} aria-hidden /> },
  { value: 'dark' as const, label: <Moon size={16} aria-hidden /> },
  { value: 'system' as const, label: <Monitor size={16} aria-hidden /> },
];

export function ThemeToggle() {
  const { preference } = useTheme();
  const { setTheme } = useAuth();
  return (
    <SegmentedControl<ThemePreference>
      options={OPTIONS}
      value={preference}
      onChange={setTheme}
      size="sm"
      ariaLabel="Theme"
    />
  );
}
