/**
 * App root — providers + router. Order: ThemeProvider (outermost; Light/Dark/System + no-flash boot) →
 * AuthProvider (inside Theme so it can apply the user's saved theme; outside the router so every route
 * has the session) → QueryClientProvider (server-state; queries see the session, logout clears it) →
 * Radix Tooltip + Toast providers → the router.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './auth/AuthProvider';
import { TooltipProvider } from './components/ui/Tooltip';
import { ToastProvider } from './components/ui/ToastProvider';
import { queryClient } from './lib/query/queryClient';
import { router } from './routes/router';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
