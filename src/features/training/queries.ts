/**
 * React Query hooks for training runs. Components call these; the hooks call
 * `trainingApi` and hand back the UI types from `./mappers`.
 */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { organizationKeys } from '@/features/organizations/queries'
import { projectKeys } from '@/features/projects/queries'
import { trainingApi } from './api'
import type {
  ApiTrainingRun,
  CreateTrainingRunRequest,
  EstimateTrainingRequest,
} from './api'
import { toTrainingRun } from './mappers'

export const trainingKeys = {
  all: (projectId: string) => ['training-runs', projectId] as const,
  list: (projectId: string) => ['training-runs', projectId, 'list'] as const,
  one: (projectId: string, runId: string) =>
    ['training-runs', projectId, 'one', runId] as const,
}

/**
 * How often a running run is asked for its progress. The API reports status,
 * step, epoch and ETA; nothing is worked out in the browser.
 */
const RUN_POLL_MS = 1_000

const toRuns = (rows: ApiTrainingRun[]) => rows.map(toTrainingRun)

/** A project's runs, newest first. Refreshes while any of them is running. */
export function useTrainingRuns(projectId: string) {
  return useQuery({
    queryKey: trainingKeys.list(projectId),
    queryFn: () => trainingApi.list(projectId),
    select: toRuns,
    refetchInterval: (query) =>
      query.state.data?.some((run) => run.status === 'running')
        ? RUN_POLL_MS
        : false,
  })
}

/** One run. Refreshes while it is running. */
export function useTrainingRun(
  projectId: string,
  runId: string,
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: [...trainingKeys.one(projectId, runId), 'detail'],
    queryFn: () => trainingApi.get(projectId, runId),
    select: toTrainingRun,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? RUN_POLL_MS : false,
  })
}

/** A run's log. Grows with the run, so it refreshes alongside it. */
export function useTrainingLogs(
  projectId: string,
  runId: string,
  running: boolean,
) {
  return useQuery({
    queryKey: [...trainingKeys.one(projectId, runId), 'logs'],
    queryFn: () => trainingApi.getLogs(projectId, runId),
    refetchInterval: running ? RUN_POLL_MS : false,
  })
}

export function useTrainingMetrics(projectId: string, runId: string) {
  return useQuery({
    queryKey: [...trainingKeys.one(projectId, runId), 'metrics'],
    queryFn: () => trainingApi.getMetrics(projectId, runId),
  })
}

/** Time and cost for a configuration; `undefined` input means "not yet". */
export function useTrainingEstimate(
  projectId: string,
  input: EstimateTrainingRequest | undefined,
) {
  return useQuery({
    queryKey: ['training-runs', projectId, 'estimate', input],
    queryFn: () => trainingApi.estimate(projectId, input!),
    enabled: Boolean(input),
    // Keep showing the last numbers while a changed slider is re-estimated.
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })
}

/** A run starting or stopping also moves the counts around it. */
function useInvalidateRuns(projectId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trainingKeys.all(projectId) }),
      queryClient.invalidateQueries({ queryKey: projectKeys.one(projectId) }),
      queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['search'] }),
    ])
}

export function useStartTraining(projectId: string) {
  const invalidate = useInvalidateRuns(projectId)
  return useMutation({
    mutationFn: async (input: CreateTrainingRunRequest) =>
      toTrainingRun(await trainingApi.create(projectId, input)),
    onSuccess: invalidate,
  })
}

export function useCancelTraining(projectId: string, runId: string) {
  const invalidate = useInvalidateRuns(projectId)
  return useMutation({
    mutationFn: () => trainingApi.cancel(projectId, runId),
    onSuccess: invalidate,
  })
}
