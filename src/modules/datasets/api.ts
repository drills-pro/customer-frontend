import { useRef } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { ApiError, client, unwrap, type Schemas } from '@/shared/api/client';
import { isForbidden } from '@/modules/datasets/errors';
import { nextPoll } from '@/modules/datasets/status';

export type DatasetSummary = Schemas['DatasetSummary'];
export type DatasetVersion = Schemas['DatasetVersion'];
export type DatasetImport = Schemas['DatasetImport'];
export type ImportCreate = Schemas['ImportCreate'];
export type ImportReport = Schemas['ImportReport'];
export type DatasetPreview = Schemas['DatasetPreview'];

/** Every dataset query hangs off the project, so one invalidation covers a project's datasets. */
const root = (projectId: string) => ['project', projectId, 'datasets'] as const;
export const datasetKey = (projectId: string, datasetId: string) => [...root(projectId), datasetId] as const;
const listKey = (projectId: string) => [...root(projectId), 'list'] as const;
const versionsKey = (projectId: string, datasetId: string) => [...datasetKey(projectId, datasetId), 'versions'] as const;
const importsKey = (projectId: string, datasetId: string, pageSize?: number) =>
  [...datasetKey(projectId, datasetId), 'imports', pageSize ?? 'all'] as const;
export const importKey = (projectId: string, datasetId: string, importId: string) =>
  [...datasetKey(projectId, datasetId), 'import', importId] as const;

const path = (projectId: string, datasetId: string) => ({ project_id: projectId, dataset_id: datasetId });

const deniedKey = (projectId: string) => [...root(projectId), 'write-denied'] as const;
/** A 403 on any write means this user cannot change the project's datasets: remember it so the pages disable their write actions. */
const noteDenied = (qc: QueryClient, projectId: string) => (e: unknown) => {
  if (isForbidden(e)) qc.setQueryData(deniedKey(projectId), true);
};
export function useWriteDenied(projectId: string) {
  return useQuery({ queryKey: deniedKey(projectId), queryFn: () => false, initialData: false, staleTime: Infinity, gcTime: Infinity }).data;
}

/** A 409 means someone else moved the import: the server state wins, so refetch it. */
const onImportError = (qc: QueryClient, projectId: string, datasetId: string, importId: string) => (e: unknown) => {
  noteDenied(qc, projectId)(e);
  if (e instanceof ApiError && e.status === 409) void qc.invalidateQueries({ queryKey: importKey(projectId, datasetId, importId) });
};

export function useDatasets(projectId: string) {
  const query = useInfiniteQuery({
    queryKey: listKey(projectId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      unwrap(
        client.GET('/v1/projects/{project_id}/datasets', { params: { path: { project_id: projectId }, query: { page_token: pageParam } } }),
      ),
    getNextPageParam: (page) => page.next_page_token ?? undefined,
  });
  return { ...query, datasets: query.data?.pages.flatMap((page) => page.items) };
}

export function useDataset(projectId: string, datasetId: string) {
  return useQuery({
    queryKey: datasetKey(projectId, datasetId),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/datasets/{dataset_id}', { params: { path: path(projectId, datasetId) } })),
  });
}

export function useCreateDataset(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      unwrap(client.POST('/v1/projects/{project_id}/datasets', { params: { path: { project_id: projectId } }, body: { name } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey(projectId) }),
    onError: noteDenied(qc, projectId),
  });
}

/** Delete, restore, publish and unpublish all answer with the dataset, so one place keeps the caches in step. */
function useDatasetMutation<V>(projectId: string, run: (datasetId: string, vars: V) => Promise<DatasetSummary>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ datasetId, ...vars }: { datasetId: string } & V) => run(datasetId, vars as V),
    onSuccess: (dataset) => {
      qc.setQueryData(datasetKey(projectId, dataset.id), dataset);
      return qc.invalidateQueries({ queryKey: listKey(projectId) });
    },
    onError: noteDenied(qc, projectId),
  });
}

export const useDeleteDataset = (projectId: string) =>
  useDatasetMutation<object>(projectId, (datasetId) =>
    unwrap(client.DELETE('/v1/projects/{project_id}/datasets/{dataset_id}', { params: { path: path(projectId, datasetId) } })),
  );

export const useRestoreDataset = (projectId: string) =>
  useDatasetMutation<object>(projectId, (datasetId) =>
    unwrap(client.POST('/v1/projects/{project_id}/datasets/{dataset_id}:restore', { params: { path: path(projectId, datasetId) } })),
  );

export const usePublishVersion = (projectId: string) =>
  useDatasetMutation<{ versionId: string }>(projectId, (datasetId, { versionId }) =>
    unwrap(
      client.PUT('/v1/projects/{project_id}/datasets/{dataset_id}/published', {
        params: { path: path(projectId, datasetId) },
        body: { version_id: versionId },
      }),
    ),
  );

export const useUnpublishDataset = (projectId: string) =>
  useDatasetMutation<object>(projectId, (datasetId) =>
    unwrap(client.DELETE('/v1/projects/{project_id}/datasets/{dataset_id}/published', { params: { path: path(projectId, datasetId) } })),
  );

export function useVersions(projectId: string, datasetId: string) {
  const query = useInfiniteQuery({
    queryKey: versionsKey(projectId, datasetId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      unwrap(
        client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/versions', {
          params: { path: path(projectId, datasetId), query: { page_token: pageParam } },
        }),
      ),
    getNextPageParam: (page) => page.next_page_token ?? undefined,
  });
  return { ...query, versions: query.data?.pages.flatMap((page) => page.items) };
}

/** Newest first. `pageSize: 1` is the dataset list's "latest import" cell. */
export function useImports(projectId: string, datasetId: string, pageSize?: number) {
  const query = useInfiniteQuery({
    queryKey: importsKey(projectId, datasetId, pageSize),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      unwrap(
        client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/imports', {
          params: { path: path(projectId, datasetId), query: { page_token: pageParam, page_size: pageSize } },
        }),
      ),
    getNextPageParam: (page) => page.next_page_token ?? undefined,
  });
  return { ...query, imports: query.data?.pages.flatMap((page) => page.items) };
}

/** One import, polled while its status is moving (see `nextPoll`). The interval stops by itself on a settled status and on unmount. */
export function useImport(projectId: string, datasetId: string, importId: string) {
  // Backoff counts this page's own fetches: answers seeded by the create and start calls must not make the first poll slow.
  const fetches = useRef(0);
  return useQuery({
    queryKey: importKey(projectId, datasetId, importId),
    queryFn: () => {
      fetches.current += 1;
      return unwrap(
        client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}', {
          params: { path: { ...path(projectId, datasetId), import_id: importId } },
        }),
      );
    },
    staleTime: 0,
    refetchInterval: (query) => nextPoll(query.state.data?.status, fetches.current - 1),
  });
}

/** The key is made once per attempt by the caller: a retry of the same attempt replays the first answer instead of making a second import. */
export function useCreateImport(projectId: string, datasetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, key }: { body: ImportCreate; key: string }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports', {
          params: { path: path(projectId, datasetId), header: { 'Idempotency-Key': key } },
          body,
        }),
      ),
    onSuccess: (created) => {
      qc.setQueryData(importKey(projectId, datasetId, created.id), created);
      return qc.invalidateQueries({ queryKey: [...datasetKey(projectId, datasetId), 'imports'] });
    },
    onError: noteDenied(qc, projectId),
  });
}

type ImportAction = 'start' | 'cancel' | 'discard';
/** start, cancel and discard answer with the import; its cache entry takes the new status. The import id is the variable, so one hook serves a page and the new-import flow. */
export function useImportAction(projectId: string, datasetId: string, action: ImportAction) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (importId: string) => {
      const params = { params: { path: { ...path(projectId, datasetId), import_id: importId } } };
      switch (action) {
        case 'start':
          return unwrap(client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/start', params));
        case 'cancel':
          return unwrap(client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/cancel', params));
        case 'discard':
          return unwrap(client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/discard', params));
      }
    },
    onSuccess: (updated, importId) => {
      qc.setQueryData(importKey(projectId, datasetId, importId), updated);
      return qc.invalidateQueries({ queryKey: [...datasetKey(projectId, datasetId), 'imports'] });
    },
    onError: (e, importId) => onImportError(qc, projectId, datasetId, importId)(e),
  });
}

/** Commit makes version N+1 and moves the import to succeeded (or leaves it committing, which the poll follows). */
export function useCommitImport(projectId: string, datasetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (importId: string) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/commit', {
          params: { path: { ...path(projectId, datasetId), import_id: importId } },
        }),
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: datasetKey(projectId, datasetId) }),
    onError: (e, importId) => onImportError(qc, projectId, datasetId, importId)(e),
  });
}

/** Rows are not cached: image links are presigned and expire, so every mount and every limit change asks again. */
export function useVersionPreview(projectId: string, datasetId: string, versionId: string, limit: number) {
  return useQuery({
    queryKey: [...versionsKey(projectId, datasetId), versionId, 'preview', limit],
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/versions/{version_id}/preview', {
          params: { path: { ...path(projectId, datasetId), version_id: versionId }, query: { limit } },
        }),
      ),
    staleTime: 0,
    gcTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function useImportPreview(projectId: string, datasetId: string, importId: string, limit: number, enabled: boolean) {
  return useQuery({
    queryKey: [...importKey(projectId, datasetId, importId), 'preview', limit],
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/preview', {
          params: { path: { ...path(projectId, datasetId), import_id: importId }, query: { limit } },
        }),
      ),
    enabled,
    staleTime: 0,
    gcTime: 0,
    placeholderData: keepPreviousData,
  });
}
