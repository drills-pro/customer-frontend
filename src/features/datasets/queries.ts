/**
 * React Query hooks for a project's datasets. Components call these; the
 * hooks call `projectDatasetsApi` and hand back the UI types from `./mappers`.
 */
import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Dataset } from '@/features/dashboard/domain/types'
import { projectKeys } from '@/features/projects/queries'
import { projectDatasetsApi } from './api'
import type { ApiDataset } from './api'
import { toApiSplit, toDataset, toDatasetDetail } from './mappers'

export const datasetKeys = {
  all: (projectId: string) => ['datasets', projectId] as const,
  list: (projectId: string) => ['datasets', projectId, 'list'] as const,
  one: (projectId: string, datasetId: string) =>
    ['datasets', projectId, 'one', datasetId] as const,
}

const toDatasets = (rows: ApiDataset[]) => rows.map((row) => toDataset(row))
const toReadyDatasets = (rows: ApiDataset[]) =>
  toDatasets(rows.filter((row) => row.status === 'ready'))

/** A project's datasets, newest first. */
export function useProjectDatasets(
  projectId: string,
  { readyOnly = false }: { readyOnly?: boolean } = {},
) {
  return useQuery({
    queryKey: datasetKeys.list(projectId),
    queryFn: () => projectDatasetsApi.list(projectId),
    select: readyOnly ? toReadyDatasets : toDatasets,
  })
}

/**
 * One dataset with every tab of its page. Five requests, one per resource the
 * API serves; the page shows nothing until all of them are in.
 */
export function useDataset(
  projectId: string,
  datasetId: string,
  { enabled = true } = {},
) {
  const key = datasetKeys.one(projectId, datasetId)
  const detail = useQuery({
    queryKey: [...key, 'detail'],
    queryFn: () => projectDatasetsApi.get(projectId, datasetId),
    enabled,
  })
  // The other resources only exist once the dataset does.
  const found = enabled && Boolean(detail.data)
  const samples = useQuery({
    queryKey: [...key, 'preview'],
    queryFn: () => projectDatasetsApi.getPreview(projectId, datasetId),
    enabled: found,
  })
  const statistics = useQuery({
    queryKey: [...key, 'statistics'],
    queryFn: () => projectDatasetsApi.getStatistics(projectId, datasetId),
    enabled: found,
  })
  const quality = useQuery({
    queryKey: [...key, 'quality'],
    queryFn: () => projectDatasetsApi.getQuality(projectId, datasetId),
    enabled: found,
  })
  const versions = useQuery({
    queryKey: [...key, 'versions'],
    queryFn: () => projectDatasetsApi.listVersions(projectId, datasetId),
    enabled: found,
  })

  const data = React.useMemo(
    () =>
      detail.data &&
      samples.data &&
      statistics.data &&
      quality.data &&
      versions.data
        ? {
            dataset: toDataset(detail.data),
            detail: toDatasetDetail({
              detail: detail.data,
              samples: samples.data,
              statistics: statistics.data,
              quality: quality.data,
              versions: versions.data,
            }),
          }
        : undefined,
    [detail.data, samples.data, statistics.data, quality.data, versions.data],
  )
  const error =
    detail.error ??
    samples.error ??
    statistics.error ??
    quality.error ??
    versions.error

  return {
    data,
    error: data ? null : error,
    isPending: enabled && !data && !error,
    refetch: () => detail.refetch(),
  }
}

/** A new or changed dataset also moves its project's counts and pipeline. */
function useInvalidateDatasets(projectId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: datasetKeys.all(projectId) }),
      queryClient.invalidateQueries({ queryKey: projectKeys.one(projectId) }),
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] }),
    ])
}

export type NewDataset = {
  name: string
  split: Dataset['split']
} & (
  { source: 'files'; files: File[] } | { source: 'bucket'; bucketUri: string }
)

/**
 * Creates a dataset and uploads its local files one by one, or creates it and
 * imports a bucket. The dataset is `processing` until its files land.
 */
export function useAddDataset(projectId: string) {
  const invalidate = useInvalidateDatasets(projectId)
  return useMutation({
    mutationFn: async (input: NewDataset) => {
      const created = await projectDatasetsApi.create(projectId, {
        name: input.name,
        split: toApiSplit(input.split),
        files:
          input.source === 'files'
            ? input.files.map((file) => ({
                name: file.name,
                size_bytes: file.size,
              }))
            : [],
      })
      if (input.source === 'bucket') {
        return toDataset(
          await projectDatasetsApi.importFromBucket(projectId, created.id, {
            bucket_uri: input.bucketUri,
          }),
        )
      }
      for (const file of input.files) {
        await projectDatasetsApi.upload(projectId, created.id, file)
      }
      return toDataset(await projectDatasetsApi.get(projectId, created.id))
    },
    // Also on failure: the dataset may exist even if its import was refused.
    onSettled: invalidate,
  })
}

export function useReprocessDataset(projectId: string, datasetId: string) {
  const invalidate = useInvalidateDatasets(projectId)
  return useMutation({
    mutationFn: () => projectDatasetsApi.reprocess(projectId, datasetId),
    onSuccess: invalidate,
  })
}
