import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { ACTIVE_TRAINING } from '@/modules/projects';
import { client, unwrap, type Schemas } from '@/shared/api/client';
import { IDEMPOTENCY_HEADER } from '@/shared/api/idempotency';
import { fetchTrainingRuns, trainingRunsKey } from '@/shared/api/overview';
import { isConflict } from '@/modules/training/errors';
import type { RunCreate } from '@/modules/training/run-form';
import { statusUi } from '@/modules/training/status';
import { usePolledQuery } from '@/shared/api/poll';

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
  return usePolledQuery({
    queryKey: trainingRunsKey(workspaceId, projectId),
    queryFn: () => fetchTrainingRuns(projectId),
    shouldPoll: (runs) => runs?.some((r) => ACTIVE_TRAINING.includes(r.status)) ?? false,
  });
}

/** The key is made once per attempt by the caller: a retry of the same attempt replays the first answer instead of starting a second run. */
export function useCreateRun(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, key }: { body: RunCreate; key: string }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/training-runs', {
          params: { path: { project_id: projectId }, header: { [IDEMPOTENCY_HEADER]: key } },
          body,
        }),
      ),
    onSuccess: (run) => settle(qc, workspaceId, projectId, run),
  });
}

/** One run, polled while its status is moving (`STATUS_UI[status].poll`). The interval stops by itself on a settled status and on unmount. */
export function useRun(projectId: string, runId: string) {
  return usePolledQuery({
    queryKey: runKey(projectId, runId),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/training-runs/{run_id}', { params: runPath(projectId, runId) })),
    shouldPoll: (run) => run !== undefined && statusUi(run.status).poll,
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
  const moving = status !== undefined && statusUi(status).poll;
  return usePolledQuery({
    // The status is in the key, so a settled run reads its final steps once.
    queryKey: [...stepsKey(projectId, runId), moving ? 'moving' : status],
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/training-runs/{run_id}/steps', { params: runPath(projectId, runId) })),
    enabled: status !== undefined,
    retry: false,
    shouldPoll: () => moving,
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
