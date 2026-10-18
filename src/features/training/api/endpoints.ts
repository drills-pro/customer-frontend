/**
 * Calls for training runs, served by core-api (app/modules/user/training).
 * Progress, epoch and ETA come from the trainer's per-epoch log lines; the
 * GPU fields are 0 until there is a source for them.
 */
import { get, post, qs } from '@/api/client'
import type {
  ApiLogLine,
  ApiRunMetric,
  ApiTrainingEstimate,
  ApiTrainingRun,
  CreateTrainingRunRequest,
  EstimateTrainingRequest,
} from './types'

const runs = (projectId: string) =>
  `/v1/projects/${encodeURIComponent(projectId)}/training-runs`

const run = (projectId: string, runId: string) =>
  `${runs(projectId)}/${encodeURIComponent(runId)}`

export const trainingApi = {
  list: (projectId: string) => get<ApiTrainingRun[]>(runs(projectId)),
  create: (projectId: string, input: CreateTrainingRunRequest) =>
    post<ApiTrainingRun>(runs(projectId), input),
  get: (projectId: string, runId: string) =>
    get<ApiTrainingRun>(run(projectId, runId)),
  cancel: (projectId: string, runId: string) =>
    post<ApiTrainingRun>(`${run(projectId, runId)}/cancel`),
  getLogs: (projectId: string, runId: string, level?: ApiLogLine['level']) =>
    get<ApiLogLine[]>(`${run(projectId, runId)}/logs${qs({ level })}`),
  getMetrics: (projectId: string, runId: string) =>
    get<ApiRunMetric[]>(`${run(projectId, runId)}/metrics`),
  estimate: (projectId: string, input: EstimateTrainingRequest) =>
    post<ApiTrainingEstimate>(`${runs(projectId)}/estimate`, input),
}
