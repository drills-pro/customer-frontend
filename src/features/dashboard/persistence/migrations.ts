import { projects } from '@/features/dashboard/data'

/**
 * Brings documents written by earlier versions up to the current shape. These
 * run *before* validation (see `./schema`), so each one takes `unknown` and
 * returns a best-effort object; whether the result is acceptable is the
 * schema's decision, not this module's.
 */

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

/** Learning rate used to be one of three named presets. */
const legacyLearningRates = {
  auto: 1e-3,
  low: 1e-4,
  high: 1e-2,
} as const

const DEFAULT_LEARNING_RATE = 1e-3
const DEFAULT_SPLIT = { train: 80, validation: 10, test: 10 } as const

export function migrateTrainingRun(value: unknown): unknown {
  const run = asRecord(value)
  if (!run) return value

  const learningRate =
    typeof run.learningRate === 'number' &&
    Number.isFinite(run.learningRate) &&
    run.learningRate > 0
      ? run.learningRate
      : typeof run.learningRate === 'string' &&
          run.learningRate in legacyLearningRates
        ? legacyLearningRates[
            run.learningRate as keyof typeof legacyLearningRates
          ]
        : DEFAULT_LEARNING_RATE

  // `scheduler` and `split` were both added after the first runs were written.
  const scheduler =
    run.scheduler === 'linear' || run.scheduler === 'constant'
      ? run.scheduler
      : 'cosine'

  const savedSplit = asRecord(run.split)
  const hasUsableSplit =
    savedSplit !== undefined &&
    typeof savedSplit.train === 'number' &&
    typeof savedSplit.validation === 'number' &&
    typeof savedSplit.test === 'number' &&
    savedSplit.train >= 5 &&
    savedSplit.validation >= 5 &&
    savedSplit.test >= 5 &&
    savedSplit.train + savedSplit.validation + savedSplit.test === 100
  const split = hasUsableSplit ? savedSplit : DEFAULT_SPLIT

  return { ...run, learningRate, scheduler, split }
}

/** `modality` and `version` were added after datasets were already persisted. */
export function migrateDataset(value: unknown): unknown {
  const dataset = asRecord(value)
  if (!dataset) return value

  const project = projects.find(
    (candidate) => candidate.id === dataset.projectId,
  )
  const modality =
    dataset.modality ??
    (project?.task.includes('Image')
      ? 'image'
      : project?.task.includes('Text')
        ? 'text'
        : 'tabular')

  return { ...dataset, modality, version: dataset.version ?? 1 }
}

/** `updatedAt` was added when "Recently updated" sorting became real. */
export function migrateCreatedProject(value: unknown): unknown {
  const created = asRecord(value)
  const project = created && asRecord(created.project)
  if (!created || !project || typeof project.updatedAt === 'number') {
    return value
  }
  return {
    ...created,
    project: { ...project, updatedAt: Date.now() },
  }
}
