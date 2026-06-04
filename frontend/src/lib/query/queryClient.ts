/**
 * The shared TanStack Query client. One instance for the app; cleared on logout (AuthProvider) so a
 * new session never sees a previous user's cached data. Conservative defaults for an operations tool:
 * short stale time, one retry, no refetch-on-focus (avoids surprise refetches mid-task). — CLAUDE §13
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
