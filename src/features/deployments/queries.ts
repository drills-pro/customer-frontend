/**
 * React Query hooks for deployments. Components call these; the hooks call
 * `deploymentsApi` and hand back the UI types from `./mappers`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { modelKeys } from '@/features/models/queries';
import { organizationKeys } from '@/features/organizations/queries';
import { projectKeys } from '@/features/projects/queries';
import { deploymentsApi } from './api';
import type { ApiDeployment, ApiRequestLog, CreateDeploymentRequest, UpdateDeploymentRequest } from './api';
import { toDeployment, toRequestLog } from './mappers';

export const deploymentKeys = {
  all: (projectId: string) => ['deployments', projectId] as const,
  list: (projectId: string) => ['deployments', projectId, 'list'] as const,
  one: (projectId: string, deploymentId: string) => ['deployments', projectId, 'one', deploymentId] as const,
};

/** How often a rollout in progress is checked. */
const ROLLOUT_POLL_MS = 3_000;

const toDeployments = (rows: ApiDeployment[]) => rows.map((row) => toDeployment(row));

/** A project's deployments, live ones first. */
export function useDeployments(projectId: string) {
  return useQuery({
    queryKey: deploymentKeys.list(projectId),
    queryFn: () => deploymentsApi.list(projectId),
    select: toDeployments,
    refetchInterval: (query) => (query.state.data?.some((item) => item.status === 'deploying') ? ROLLOUT_POLL_MS : false),
  });
}

const toOne = (row: ApiDeployment) => toDeployment(row);

export function useDeployment(projectId: string, deploymentId: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: [...deploymentKeys.one(projectId, deploymentId), 'detail'],
    queryFn: () => deploymentsApi.get(projectId, deploymentId),
    select: toOne,
    enabled,
    refetchInterval: (query) => (query.state.data?.status === 'deploying' ? ROLLOUT_POLL_MS : false),
  });
}

export function useDeploymentMetrics(projectId: string, deploymentId: string) {
  return useQuery({
    queryKey: [...deploymentKeys.one(projectId, deploymentId), 'metrics'],
    queryFn: () => deploymentsApi.getMetrics(projectId, deploymentId),
  });
}

const toLogs = (rows: ApiRequestLog[]) => rows.map(toRequestLog);

export function useDeploymentLogs(projectId: string, deploymentId: string) {
  return useQuery({
    queryKey: [...deploymentKeys.one(projectId, deploymentId), 'logs'],
    queryFn: () => deploymentsApi.getLogs(projectId, deploymentId),
    select: toLogs,
  });
}

export function useDeploymentKey(projectId: string, deploymentId: string) {
  return useQuery({
    queryKey: [...deploymentKeys.one(projectId, deploymentId), 'api-key'],
    queryFn: () => deploymentsApi.getKey(projectId, deploymentId),
  });
}

/** A deployment changing also changes which model is served and the counts. */
function useInvalidateDeployments(projectId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: deploymentKeys.all(projectId),
      }),
      queryClient.invalidateQueries({ queryKey: modelKeys.all(projectId) }),
      queryClient.invalidateQueries({ queryKey: projectKeys.one(projectId) }),
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] }),
      queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['search'] }),
    ]);
}

export function useCreateDeployment(projectId: string) {
  const invalidate = useInvalidateDeployments(projectId);
  return useMutation({
    mutationFn: async (input: CreateDeploymentRequest) => toDeployment(await deploymentsApi.create(projectId, input)),
    onSuccess: invalidate,
  });
}

export function useUpdateDeployment(projectId: string, deploymentId: string) {
  const invalidate = useInvalidateDeployments(projectId);
  return useMutation({
    mutationFn: (input: UpdateDeploymentRequest) => deploymentsApi.update(projectId, deploymentId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDeployment(projectId: string, deploymentId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeployments(projectId);
  return useMutation({
    mutationFn: () => deploymentsApi.remove(projectId, deploymentId),
    onSuccess: () => {
      // The page for it is about to close; do not refetch what is gone.
      queryClient.removeQueries({
        queryKey: deploymentKeys.one(projectId, deploymentId),
      });
      return invalidate();
    },
  });
}

/** Pause, resume or redeploy. */
export function useDeploymentAction(projectId: string, deploymentId: string) {
  const invalidate = useInvalidateDeployments(projectId);
  return useMutation({
    mutationFn: (action: 'pause' | 'resume' | 'redeploy') => deploymentsApi[action](projectId, deploymentId),
    onSuccess: invalidate,
  });
}

export function useRotateDeploymentKey(projectId: string, deploymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deploymentsApi.rotateKey(projectId, deploymentId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...deploymentKeys.one(projectId, deploymentId), 'api-key'],
      }),
  });
}

export function useTestDeployment(projectId: string, deploymentId: string) {
  return useMutation({
    mutationFn: () => deploymentsApi.test(projectId, deploymentId),
  });
}
