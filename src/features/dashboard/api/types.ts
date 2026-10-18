/**
 * Response shapes, exactly as core-api sends them: snake_case fields and ISO
 * timestamp strings.
 */

/** `GET /v1/dashboard`. */
export type DashboardSummary = {
  metrics: {
    active_projects: number
    trainings_running: number
    models_deployed: number
    inference_calls_30d: number
    /** Workspace totals; they drive the "Getting started" checklist. */
    datasets: number
    training_runs: number
    deployments: number
  }
  projects: ApiProject[]
  live_trainings: ApiLiveTraining[]
  deployments: ApiDeployment[]
  activity: ApiActivity[]
}

export type ApiProject = {
  id: string
  name: string
  task_type: string
  status: string
  created_at: string
  /** The newest thing created inside the project, or its own `created_at`. */
  updated_at: string
  dataset_count: number
  model_count: number
  deployment_count: number
}

export type ApiLiveTraining = {
  id: string
  project_id: string
  project_name: string
  status: 'submitted' | 'running'
  config: { trainer?: { epochs?: number } } | null
  created_at: string
}

export type ApiDeployment = {
  id: string
  project_id: string
  project_name: string
  route_prefix: string
  status: 'deploying' | 'active' | 'failed'
  created_at: string
}

export type ApiActivity = {
  /** `<kind>:<row id>`, unique across the feed. */
  id: string
  /** `project`, `dataset`, `training_run`, `deployment`, `model_version`, or an audit entity type. */
  kind: string
  action: string
  name: string
  project_id: string
  project_name: string
  /** Only audit-log events record who did it. */
  actor: string | null
  occurred_at: string
}

/** The four headline numbers that `GET /v1/dashboard/metrics/history` charts. */
export type ApiMetricKey =
  | 'active_projects'
  | 'trainings_running'
  | 'models_deployed'
  | 'inference_calls'

export type ApiMetricSeries = {
  /** One point per day, oldest first. */
  points: Array<{ date: string; value: number }>
  /** How far the metric moved over the window, in `change_unit`. */
  change: number
  change_unit: 'count' | 'percent'
}

/** `GET /v1/dashboard/metrics/history?days=30`. Mocked until core-api records it. */
export type ApiMetricHistory = {
  days: number
  metrics: Record<ApiMetricKey, ApiMetricSeries>
}
