import { QueryClient } from '@tanstack/react-query';
import { isAppError } from '@/lib/errors/app-error';

/**
 * Shared TanStack Query client (technical-architecture §15.1, performance §21).
 *
 * - Reasonable staleTime avoids refetch storms; no background polling.
 * - Retries only transient failures, and never auth/permission/validation
 *   errors (retrying those is pointless and can lock accounts).
 * - Mutations are not retried by default — our writes go through idempotent
 *   RPCs, but blind retries of non-idempotent calls are avoided.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isAppError(error)) {
            if (
              ['auth', 'permission', 'validation', 'not_found', 'conflict'].includes(error.kind)
            ) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
