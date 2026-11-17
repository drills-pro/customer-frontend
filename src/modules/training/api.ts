import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { ACTIVE_TRAINING, trainingRunsKey, trainingRunsQuery } from '@/modules/projects';
import { client, unwrap, type Schemas } from '@/shared/api/client';
import { isConflict } from '@/modules/training/errors';
import type { RunCreate } from '@/modules/training/run-form';
import { nextRunPoll, statusUi } from '@/modules/training/status';
import { pollDelay } from '@/shared/api/poll';

export type TrainingRun = Schemas['TrainingRun'];

const trainingKey = (projectId: string) => ['project', projectId, 'training'] as const;
const presetsKey = (projectId: string) => [...trainingKey(projectId), 'presets'] as const;
export const runKey = (projectId: string, runId: string) => [...trainingKey(projectId), 'run', runId] as const;
const stepsKey = (projectId: string, runId: string) => [...runKey(projectId, runId), 'steps'] as const;

const runPath = (projectId: string, runId: string) => ({ path: { project_id: projectId, run_id: runId } });

/** The presets the project's task type trains with: their names, base models, resources and hyperparameter bounds. */
export function usePresets(projectId: string) {
  return useQuery({
    queryKey: presetsKey(projectId),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/training-presets', { params: { path: { project_id: projectId } } })),
  });
}

/** A run changed: its page gets the answer, the overview's run count refetches. */
const settle = (qc: QueryClient, workspaceId: string, projectId: string, run: TrainingRun) => {
  qc.setQueryData(runKey(projectId, run.id), run);
  return qc.invalidateQueries({ queryKey: trainingRunsKey(workspaceId, projectId) });
};

/** The project's runs (the overview's query), polled while any of them is queued or training so their statuses move by themselves. */
export function useRuns(workspaceId: string, projectId: string) {
  return useQuery({
    ...trainingRunsQuery(workspaceId, projectId),
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.some((r) => ACTIVE_TRAINING.includes(r.status)) ? pollDelay(query.state.dataUpdateCount - 1) : false,
  });
}

/** The key is made once per attempt by the caller: a retry of the same attempt replays the first answer instead of starting a second run. */
export function useCreateRun(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, key }: { body: RunCreate; key: string }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/training-runs', {
          params: { path: { project_id: projectId }, header: { 'Idempotency-Key': key } },
          body,
        }),
      ),
    onSuccess: (run) => settle(qc, workspaceId, projectId, run),
  });
}

/** One run, polled while its status is moving (see `nextRunPoll`). The interval stops by itself on a settled status and on unmount. */
export function useRun(projectId: string, runId: string) {
  // Backoff counts this page's own fetches: the answer seeded by the create call must not make the first poll slow.
  const fetches = useRef(0);
  return useQuery({
    queryKey: runKey(projectId, runId),
    queryFn: () => {
      fetches.current += 1;
      return unwrap(client.GET('/v1/projects/{project_id}/training-runs/{run_id}', { params: runPath(projectId, runId) }));
    },
    staleTime: 0,
    refetchInterval: (query) => nextRunPoll(query.state.data?.status, fetches.current - 1),
  });
}

/** One run read once, for the wizard to start a clone from; no id reads nothing. */
export function useRunOnce(projectId: string, runId: string | undefined) {
  return useQuery({
    queryKey: runKey(projectId, runId ?? ''),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/training-runs/{run_id}', { params: runPath(projectId, runId ?? '') })),
    enabled: Boolean(runId),
  });
}

/** The run's steps. It follows the run's status: polled with it while the run moves, read once more when it settles. */
export function useRunSteps(projectId: string, runId: string, status: string | undefined) {
  const fetches = useRef(0);
  const moving = status !== undefined && statusUi(status).poll;
  return useQuery({
    // The status is in the key, so a settled run reads its final steps once.
    queryKey: [...stepsKey(projectId, runId), moving ? 'moving' : status],
    queryFn: () => {
      fetches.current += 1;
      return unwrap(client.GET('/v1/projects/{project_id}/training-runs/{run_id}/steps', { params: runPath(projectId, runId) }));
    },
    enabled: status !== undefined,
    retry: false,
    refetchInterval: () => nextRunPoll(status, fetches.current - 1),
  });
}

export function useCancelRun(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      unwrap(client.POST('/v1/projects/{project_id}/training-runs/{run_id}/cancel', { params: runPath(projectId, runId) })),
    onSuccess: (run) => settle(qc, workspaceId, projectId, run),
    // A 409 means the run already ended: the server state wins, so refetch it.
    onError: (e, runId) => {
      if (isConflict(e)) void qc.invalidateQueries({ queryKey: runKey(projectId, runId) });
    },
  });
}
