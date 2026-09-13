import {
  SIMULATED_MS_PER_ESTIMATED_HOUR,
  allProjects,
  seededTrainingRuns,
} from '@/features/dashboard/data'
import type {
  DashboardPreferences,
  TrainingRun,
  TrainingRunStatus,
} from '@/features/dashboard/data'

/**
 * Every run the workspace knows about: user-created runs first so a persisted
 * override of a seeded id wins, then the immutable fixtures.
 */
export function allTrainingRuns(
  preferences: DashboardPreferences,
): TrainingRun[] {
  const seen = new Set(preferences.trainingRuns.map((run) => run.id))
  return [
    ...preferences.trainingRuns,
    ...seededTrainingRuns.filter((run) => !seen.has(run.id)),
  ]
}

export function resolveTrainingRun(
  preferences: DashboardPreferences,
  projectId: string,
  runId: string,
): TrainingRun | undefined {
  return allTrainingRuns(preferences).find(
    (run) => run.id === runId && run.projectId === projectId,
  )
}

/**
 * Runs key on `projectId`, so the org filter resolves through the projects the
 * workspace currently has (seeded plus user-created).
 */
export function orgTrainingRuns(
  preferences: DashboardPreferences,
  orgId: string,
): TrainingRun[] {
  const orgProjectIds = new Set(
    allProjects(preferences)
      .filter((project) => project.orgId === orgId)
      .map((project) => project.id),
  )
  return allTrainingRuns(preferences).filter((run) =>
    orgProjectIds.has(run.projectId),
  )
}

export type RunProgress = {
  status: TrainingRunStatus
  progress: number
  step: number
  epoch: number
  eta: string
}

function formatEta(remainingMs: number) {
  const seconds = Math.max(0, Math.round(remainingMs / 1000))
  if (seconds < 60) return `~${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `~${minutes}m`
  return `~${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

/**
 * Derives a run's live state from `startedAt` rather than the frozen values
 * written when it was created. A run the user stopped keeps its stored state.
 */
export function runProgressAt(run: TrainingRun, now: number): RunProgress {
  if (run.status === 'Stopped') {
    return {
      status: 'Stopped',
      progress: run.progress,
      step: run.step,
      epoch: Math.floor((run.progress / 100) * run.epochs),
      eta: '—',
    }
  }

  const durationMs = Math.max(
    1,
    run.estimatedHours * SIMULATED_MS_PER_ESTIMATED_HOUR,
  )
  const elapsed = Math.max(0, now - run.startedAt)
  const ratio = Math.min(1, elapsed / durationMs)
  const progress = Math.round(ratio * 100)

  return {
    status: ratio >= 1 ? 'Completed' : 'Running',
    progress,
    step: Math.round(ratio * run.totalSteps),
    epoch: Math.max(1, Math.ceil(ratio * run.epochs)),
    eta: ratio >= 1 ? '—' : formatEta(durationMs - elapsed),
  }
}

/** A run merged with its derived live state, for display. */
export function liveRun(run: TrainingRun, now: number): TrainingRun {
  const derived = runProgressAt(run, now)
  return {
    ...run,
    status: derived.status,
    progress: derived.progress,
    step: derived.step,
  }
}
