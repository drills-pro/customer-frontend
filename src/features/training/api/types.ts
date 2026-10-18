/**
 * Request and response shapes for training runs, as the API sends them:
 * snake_case fields, lower-case enums and ISO timestamp strings.
 */

/** `failed`: the job crashed; `stopped`: someone stopped it. */
export type ApiRunStatus = 'running' | 'stopped' | 'completed' | 'failed'
export type ApiScheduler = 'cosine' | 'linear' | 'constant'

export type ApiTrainingConfig = {
  epochs: number
  batch_size: number
  /** Percentages that add up to 100. */
  split: { train: number; validation: number; test: number }
  learning_rate: number
  scheduler: ApiScheduler
  augmentations: string[]
  early_stopping: boolean
  /** A compute option id from `GET /v1/catalog/compute-options`. */
  instance_id: string
  spot: boolean
}

export type ApiTrainingRun = {
  id: string
  project_id: string
  dataset_id: string
  name: string
  /** Display name of the architecture. */
  architecture: string
  instance_name: string
  config: ApiTrainingConfig
  estimated_hours: number
  estimated_cost_usd: number
  author: string
  started_at: string
  /** Live state, current as of the response. */
  status: ApiRunStatus
  /** 0 to 100. */
  progress: number
  step: number
  total_steps: number
  epoch: number
  /** `null` once the run is no longer running. */
  eta_seconds: number | null
  throughput_per_second: number
  /** What is being counted: `img`, `items`, `pages`. */
  throughput_unit: string
  gpu_utilization_percent: number
  gpu_memory_used_gb: number
  gpu_memory_total_gb: number
}

/** `POST /v1/projects/{id}/training-runs`. The server names the run. */
export type CreateTrainingRunRequest = {
  dataset_id: string
  /** An id from `GET /v1/catalog/architectures`. */
  architecture_id: string
  config: ApiTrainingConfig
}

/** `POST /v1/projects/{id}/training-runs/estimate`. */
export type EstimateTrainingRequest = {
  dataset_id: string
  architecture_id: string
  epochs: number
  batch_size: number
  instance_id: string
  spot: boolean
}

export type ApiTrainingEstimate = {
  hours: number
  cost_usd: number
}

/** One line of `GET …/{run_id}/logs`. */
export type ApiLogLine = {
  level: 'info' | 'warn' | 'error'
  message: string
}

/** One point of `GET …/{run_id}/metrics`. */
export type ApiRunMetric = {
  epoch: number
  loss: number
  accuracy: number
}
