import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/** `onUnauthorized` runs once for any 401 from a query or mutation: drop the session and go to login. */
export function createQueryClient(onUnauthorized: () => void) {
  const on401 = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) onUnauthorized();
  };
  return new QueryClient({
    queryCache: new QueryCache({ onError: on401 }),
    mutationCache: new MutationCache({ onError: on401 }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, e) => count < 1 && !(e instanceof ApiError && e.status >= 400 && e.status < 500),
      },
    },
  });
}
