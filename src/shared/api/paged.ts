import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';

/** One page of a core-api list: its items and the token for the next page, if there is one. */
export interface Page<T> {
  items: T[];
  next_page_token?: string | null;
}

/** An infinite list: pages load as the caller asks; `items` flattens the pages loaded so far. */
export function usePagedList<T>(queryKey: QueryKey, fetchPage: (pageToken: string | null) => Promise<Page<T>>) {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (page) => page.next_page_token ?? undefined,
  });
  return { ...query, items: query.data?.pages.flatMap((page) => page.items) };
}
