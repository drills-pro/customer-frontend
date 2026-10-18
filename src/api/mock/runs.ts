/** How a training run advances in the mock: purely from its start time. */
import type { ApiTrainingRun } from '@/features/training/api/types'
import { SIMULATED_MS_PER_ESTIMATED_HOUR } from './seed/training'

/**
 * A run's state as of `now`. A stopped run keeps the state it was stopped in;
 * any other run is somewhere along its simulated duration.
 */
export function liveRun(run: ApiTrainingRun, now = Date.now()): ApiTrainingRun {
  if (run.status === 'stopped') {
    return {
      ...run,
      epoch: Math.floor((run.progress / 100) * run.config.epochs),
      eta_seconds: null,
    }
  }

  const durationMs = Math.max(
    1,
    run.estimated_hours * SIMULATED_MS_PER_ESTIMATED_HOUR,
  )
  const elapsed = Math.max(0, now - new Date(run.started_at).getTime())
  const ratio = Math.min(1, elapsed / durationMs)

  return {
    ...run,
    status: ratio >= 1 ? 'completed' : 'running',
    progress: Math.round(ratio * 100),
    step: Math.round(ratio * run.total_steps),
    epoch: Math.max(1, Math.ceil(ratio * run.config.epochs)),
    eta_seconds: ratio >= 1 ? null : Math.round((durationMs - elapsed) / 1000),
  }
}
