import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useRef } from 'react';

/** Backoff for pages that follow a server job (an import, a training run) until it settles. */
export const POLL_BASE_MS = 3000;
export const POLL_MAX_MS = 15000;
const POLL_FACTOR = 1.5;

/** Delay before the next poll: grows from POLL_BASE_MS by 1.5x per answer already received, capped at POLL_MAX_MS. */
export const pollDelay = (answers: number) => Math.min(POLL_BASE_MS * POLL_FACTOR ** answers, POLL_MAX_MS);

export interface PolledQuery<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** True while the server is still working on it (an import, a run, a deployment): the query keeps polling on the backoff. */
  shouldPoll: (data: T | undefined) => boolean;
  enabled?: boolean;
  /** `false` turns retries off; the app's default otherwise. */
  retry?: false;
}

/**
 * A query polled while `shouldPoll` holds. The backoff counts this hook's own fetches, so answers seeded by a create or start call
 * do not make the first poll slow. The interval stops by itself once `shouldPoll` is false, and on unmount.
 */
export function usePolledQuery<T>({ shouldPoll, queryFn, ...options }: PolledQuery<T>) {
  const fetches = useRef(0);
  return useQuery({
    ...options,
    queryFn: () => {
      fetches.current += 1;
      return queryFn();
    },
    staleTime: 0,
    refetchInterval: (query) => (shouldPoll(query.state.data) ? pollDelay(fetches.current - 1) : false),
  });
}
