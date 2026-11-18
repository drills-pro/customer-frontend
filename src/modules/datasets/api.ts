import { useEffect, useRef } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { ApiError, client, unwrap, type Schemas } from '@/shared/api/client';
import { datasetListKey, projectDatasetsKey } from '@/shared/api/keys';
import { IDEMPOTENCY_HEADER, newIdempotencyKey } from '@/shared/api/idempotency';
import { usePagedList } from '@/shared/api/paged';
import { usePolledQuery } from '@/shared/api/poll';
import { putFile } from '@/shared/api/upload';
import { ImportSource, WRITE_DENIED_RECHECK_MS } from '@/modules/datasets/constants';
import { isConflict, isForbidden, UploadFailed, UploadLinkLost } from '@/modules/datasets/errors';
import { STATUS_UI } from '@/modules/datasets/status';

export type DatasetSummary = Schemas['DatasetSummary'];
export type DatasetVersion = Schemas['DatasetVersion'];
export type DatasetImport = Schemas['DatasetImport'];
export type ImportCreate = Schemas['ImportCreate'];
export type ImportReport = Schemas['ImportReport'];
export type DatasetPreview = Schemas['DatasetPreview'];

export const datasetKey = (projectId: string, datasetId: string) => [...projectDatasetsKey(projectId), datasetId] as const;
const versionsKey = (projectId: string, datasetId: string) => [...datasetKey(projectId, datasetId), 'versions'] as const;
const importsKey = (projectId: string, datasetId: string, pageSize?: number) =>
  [...datasetKey(projectId, datasetId), 'imports', pageSize ?? 'all'] as const;
export const importKey = (projectId: string, datasetId: string, importId: string) =>
  [...datasetKey(projectId, datasetId), 'import', importId] as const;

const path = (projectId: string, datasetId: string) => ({ project_id: projectId, dataset_id: datasetId });

const deniedKey = (projectId: string) => [...projectDatasetsKey(projectId), 'write-denied'] as const;
/**
 * A 403 on any write means this user cannot change the project's datasets: remember it so the pages disable their write actions.
 * The latch clears after WRITE_DENIED_RECHECK_MS, so the next write re-checks the permission.
 */
const noteDenied = (qc: QueryClient, projectId: string) => (e: unknown) => {
  if (!isForbidden(e)) return;
  qc.setQueryData(deniedKey(projectId), true);
  setTimeout(() => qc.setQueryData(deniedKey(projectId), false), WRITE_DENIED_RECHECK_MS);
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
  const paged = usePagedList(datasetListKey(projectId), (pageToken) =>
    unwrap(
      client.GET('/v1/projects/{project_id}/datasets', { params: { path: { project_id: projectId }, query: { page_token: pageToken } } }),
    ),
  );
  return { ...paged, datasets: paged.items };
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
    onSuccess: () => qc.invalidateQueries({ queryKey: datasetListKey(projectId) }),
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
      return qc.invalidateQueries({ queryKey: datasetListKey(projectId) });
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
  const paged = usePagedList(versionsKey(projectId, datasetId), (pageToken) =>
    unwrap(
      client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/versions', {
        params: { path: path(projectId, datasetId), query: { page_token: pageToken } },
      }),
    ),
  );
  return { ...paged, versions: paged.items };
}

/** Newest first. `pageSize: 1` is the dataset list's "latest import" cell. */
export function useImports(projectId: string, datasetId: string, pageSize?: number) {
  const paged = usePagedList(importsKey(projectId, datasetId, pageSize), (pageToken) =>
    unwrap(
      client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/imports', {
        params: { path: path(projectId, datasetId), query: { page_token: pageToken, page_size: pageSize } },
      }),
    ),
  );
  return { ...paged, imports: paged.items };
}

/** One import, polled while its status is moving (see `STATUS_UI`). The interval stops by itself on a settled status and on unmount. */
export function useImport(projectId: string, datasetId: string, importId: string) {
  return usePolledQuery<DatasetImport>({
    queryKey: importKey(projectId, datasetId, importId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}', {
          params: { path: { ...path(projectId, datasetId), import_id: importId } },
        }),
      ),
    shouldPoll: (d) => d !== undefined && STATUS_UI[d.status].poll,
  });
}

/** The key is made once per attempt by the caller: a retry of the same attempt replays the first answer instead of making a second import. */
export function useCreateImport(projectId: string, datasetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, key }: { body: ImportCreate; key: string }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports', {
          params: { path: path(projectId, datasetId), header: { [IDEMPOTENCY_HEADER]: key } },
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

export type SubmitStage = 'creating' | 'uploading' | 'starting';

interface SubmitArgs {
  body: ImportCreate;
  file: File | null;
  onStage: (stage: SubmitStage) => void;
  onProgress: (fraction: number) => void;
}

/**
 * Create the import, upload its file when there is one, and start it. A retry of the same attempt reuses what already succeeded (the
 * created import, the uploaded file) and its key, so nothing is made twice. `reset()` cancels the created import (best effort) and
 * drops the attempt, so the next submit begins again.
 */
export function useSubmitImport(projectId: string, datasetId: string) {
  const create = useCreateImport(projectId, datasetId);
  const start = useImportAction(projectId, datasetId, 'start');
  const cancel = useImportAction(projectId, datasetId, 'cancel');
  /** One attempt at making an import. The key is reused by every retry of the same request and replaced as soon as the request changes. */
  const attempt = useRef<{ key: string; signature: string; created?: DatasetImport; uploaded: boolean } | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function submit({ body, file, onStage, onProgress }: SubmitArgs): Promise<DatasetImport> {
    const signature = JSON.stringify([body, file?.name, file?.size]);
    if (attempt.current?.signature !== signature) attempt.current = { key: newIdempotencyKey(), signature, uploaded: false };
    const a = attempt.current;
    if (!a.created) {
      onStage('creating');
      a.created = await create.mutateAsync({ body, key: a.key });
    }
    if (body.source === ImportSource.Upload && !a.uploaded && file) {
      if (!a.created.upload_url) throw new UploadLinkLost();
      onStage('uploading');
      onProgress(0);
      abort.current = new AbortController();
      await putFile(a.created.upload_url, file, onProgress, abort.current.signal).catch(() => {
        throw new UploadFailed();
      });
      a.uploaded = true;
    }
    onStage('starting');
    try {
      await start.mutateAsync(a.created.id);
    } catch (e) {
      // Someone else moved it: the import page shows the server's state.
      if (!isConflict(e)) throw e;
    }
    return a.created;
  }

  /** Start over: the attempt is dropped at once; its created import is cancelled best effort, and a failure there is ignored. */
  async function reset() {
    const created = attempt.current?.created;
    attempt.current = null;
    if (created) await cancel.mutateAsync(created.id).catch(() => undefined);
  }

  return { submit, reset };
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
