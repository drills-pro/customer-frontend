/**
 * React Query hooks for models. Components call these; the hooks call
 * `modelsApi` and hand back the UI types from `./mappers`.
 */
import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { projectKeys } from '@/features/projects/queries';
import { modelsApi } from './api';
import type { ApiModel } from './api';
import { toModel, toModelDetail } from './mappers';

export const modelKeys = {
  all: (projectId: string) => ['models', projectId] as const,
  list: (projectId: string) => ['models', projectId, 'list'] as const,
  one: (projectId: string, modelId: string) => ['models', projectId, 'one', modelId] as const,
};

const toModels = (rows: ApiModel[]) => rows.map((row) => toModel(row));

/** A project's model versions, best first. */
export function useModels(projectId: string) {
  return useQuery({
    queryKey: modelKeys.list(projectId),
    queryFn: () => modelsApi.list(projectId),
    select: toModels,
  });
}

/** One model version with its sibling versions, metrics and files. */
export function useModel(projectId: string, modelId: string, { enabled = true } = {}) {
  const key = modelKeys.one(projectId, modelId);
  const detail = useQuery({
    queryKey: [...key, 'detail'],
    queryFn: () => modelsApi.get(projectId, modelId),
    enabled,
  });
  const files = useQuery({
    queryKey: [...key, 'files'],
    queryFn: () => modelsApi.listFiles(projectId, modelId),
    enabled: enabled && Boolean(detail.data),
  });

  const data = React.useMemo(
    () =>
      detail.data && files.data
        ? {
            model: toModel(detail.data),
            versions: detail.data.versions.map((row) => toModel(row)),
            detail: toModelDetail(detail.data, files.data),
          }
        : undefined,
    [detail.data, files.data],
  );
  const error = detail.error ?? files.error;

  return {
    data,
    error: data ? null : error,
    isPending: enabled && !data && !error,
    refetch: () => detail.refetch(),
  };
}

/** Promotes a version to production, or archives it. */
export function useSetModelStage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, stage }: { modelId: string; stage: 'production' | 'archived' }) =>
      stage === 'production' ? modelsApi.promote(projectId, modelId) : modelsApi.archive(projectId, modelId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: modelKeys.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.one(projectId) }),
      ]),
  });
}

export function usePredict(projectId: string, modelId: string) {
  return useMutation({
    mutationFn: () => modelsApi.predict(projectId, modelId),
  });
}
