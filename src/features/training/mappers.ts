/** Turns training-run rows from the API into what the pages render. */
import type {
  TrainingRun,
  TrainingRunStatus,
} from '@/features/dashboard/domain/types'
import { EMPTY } from '@/lib/format'
import type { ApiRunStatus, ApiTrainingRun } from './api'

const statusLabels: Record<ApiRunStatus, TrainingRunStatus> = {
  running: 'Running',
  stopped: 'Stopped',
  completed: 'Completed',
  failed: 'Failed',
}

/** `~45s`, `~12m`, `~2h 05m`; an em dash when there is no time left to show. */
export function formatEta(seconds: number | null) {
  if (seconds === null) return EMPTY
  if (seconds < 60) return `~${Math.max(0, Math.round(seconds))}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `~${minutes}m`
  return `~${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export function toTrainingRun(row: ApiTrainingRun): TrainingRun {
  const { config } = row
  return {
    id: row.id,
    projectId: row.project_id,
    datasetId: row.dataset_id,
    name: row.name,
    architecture: row.architecture,
    status: statusLabels[row.status],
    epochs: config.epochs,
    batchSize: config.batch_size,
    split: config.split,
    learningRate: config.learning_rate,
    scheduler: config.scheduler,
    augmentations: config.augmentations,
    earlyStopping: config.early_stopping,
    instanceId: config.instance_id,
    instanceName: row.instance_name,
    spot: config.spot,
    estimatedHours: row.estimated_hours,
    estimatedCost: row.estimated_cost_usd,
    progress: row.progress,
    step: row.step,
    totalSteps: row.total_steps,
    epoch: row.epoch,
    eta: formatEta(row.eta_seconds),
    throughput: `${row.throughput_per_second} ${row.throughput_unit}/s`,
    gpuUtilization: `${row.gpu_utilization_percent}%`,
    gpuMemory: `${row.gpu_memory_used_gb} / ${row.gpu_memory_total_gb} GB`,
    author: row.author,
    startedAt: new Date(row.started_at).getTime(),
  }
}
