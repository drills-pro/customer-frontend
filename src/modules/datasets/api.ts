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

/**
 * A project has one dataset: its imports make the versions. Null until the first import creates it. The list is read for it, so
 * the first page is enough.
 */
export function useProjectDataset(projectId: string) {
  const { datasets, isPending, isError, error, refetch } = useDatasets(projectId);
  return { dataset: datasets?.[0] ?? null, isPending, isError, error, refetch };
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

/** Newest first. `pageSize: 1` is a one-row read. */
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
function createImportCall(projectId: string, datasetId: string, body: ImportCreate, key: string) {
  return unwrap(
    client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports', {
      params: { path: path(projectId, datasetId), header: { [IDEMPOTENCY_HEADER]: key } },
      body,
    }),
  );
}

type ImportAction = 'start' | 'cancel' | 'discard';
function importActionCall(projectId: string, datasetId: string, importId: string, action: ImportAction) {
  const params = { params: { path: { ...path(projectId, datasetId), import_id: importId } } };
  switch (action) {
    case 'start':
      return unwrap(client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/start', params));
    case 'cancel':
      return unwrap(client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/cancel', params));
    case 'discard':
      return unwrap(client.POST('/v1/projects/{project_id}/datasets/{dataset_id}/imports/{import_id}/discard', params));
  }
}

/** start, cancel and discard answer with the import; its cache entry takes the new status. */
export function useImportAction(projectId: string, datasetId: string, action: ImportAction) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (importId: string) => importActionCall(projectId, datasetId, importId, action),
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
 * Create the import, upload its file when there is one, and start it. The project's dataset is made first when it has none yet, once,
 * and its id is kept, so a retry never makes a second one. A retry of the same attempt reuses what already succeeded (the created
 * import, the uploaded file) and its key, so nothing is made twice. `reset()` cancels the created import (best effort) and drops the
 * attempt, so the next submit begins again.
 */
export function useSubmitImport(projectId: string, projectName: string, datasetId: string | null) {
  const qc = useQueryClient();
  const createDataset = useCreateDataset(projectId);
  const made = useRef<string | null>(null);
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
      let dsId = datasetId ?? made.current;
      if (!dsId) {
        dsId = (await createDataset.mutateAsync(projectName)).id;
        made.current = dsId;
      }
      try {
        a.created = await createImportCall(projectId, dsId, body, a.key);
      } catch (e) {
        noteDenied(qc, projectId)(e);
        throw e;
      }
      qc.setQueryData(importKey(projectId, dsId, a.created.id), a.created);
      void qc.invalidateQueries({ queryKey: [...datasetKey(projectId, dsId), 'imports'] });
    }
    const created = a.created;
    if (body.source === ImportSource.Upload && !a.uploaded && file) {
      if (!created.upload_url) throw new UploadLinkLost();
      onStage('uploading');
      onProgress(0);
      abort.current = new AbortController();
      await putFile(created.upload_url, file, onProgress, abort.current.signal).catch(() => {
        throw new UploadFailed();
      });
      a.uploaded = true;
    }
    onStage('starting');
    try {
      await importActionCall(projectId, created.dataset_id, created.id, 'start');
    } catch (e) {
      // Someone else moved it: the import page shows the server's state.
      onImportError(qc, projectId, created.dataset_id, created.id)(e);
      if (!isConflict(e)) throw e;
    }
    return created;
  }

  /** Start over: the attempt is dropped at once; its created import is cancelled best effort, and a failure there is ignored. */
  async function reset() {
    const created = attempt.current?.created;
    attempt.current = null;
    if (created) await importActionCall(projectId, created.dataset_id, created.id, 'cancel').catch(() => undefined);
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
