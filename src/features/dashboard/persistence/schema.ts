import { z } from 'zod'

/**
 * The complete shape of everything the app persists. Validation is deliberately
 * bounded, not just typed: a syntactically valid document with a negative
 * progress or a NaN timestamp must not cross this boundary.
 *
 * Migrations run before validation (see `./migrations`), so these schemas
 * describe the current shape only.
 */

const finite = z.number().finite()
const count = finite.int().min(0)
const percent = finite.min(0).max(100)

export const activitySchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  icon: z.enum(['success', 'dataset', 'deployment', 'error', 'person']),
  lead: z.string(),
  text: z.string(),
  time: z.string(),
  action: z.string(),
})

export const datasetSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  modality: z.enum(['image', 'text', 'tabular']),
  split: z.enum(['Train', 'Validation', 'Test', 'Unsplit']),
  items: count,
  size: z.string(),
  classes: count,
  version: finite.int().min(1),
  status: z.enum(['Ready', 'Processing', 'Error']),
  created: z.string(),
  files: z.array(z.string()),
})

export const trainingSplitSchema = z
  .object({
    train: finite.min(5),
    validation: finite.min(5),
    test: finite.min(5),
  })
  .refine(
    (split) => split.train + split.validation + split.test === 100,
    'split must total 100',
  )

export const trainingRunSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  datasetId: z.string().min(1),
  name: z.string().min(1),
  architecture: z.string(),
  status: z.enum(['Running', 'Stopped', 'Completed']),
  epochs: finite.int().min(1).max(10_000),
  batchSize: finite.int().min(1).max(100_000),
  split: trainingSplitSchema,
  learningRate: finite.gt(0).lte(1),
  scheduler: z.enum(['cosine', 'linear', 'constant']),
  augmentations: z.array(z.string()),
  earlyStopping: z.boolean(),
  instanceId: z.string(),
  instanceName: z.string(),
  spot: z.boolean(),
  estimatedHours: finite.min(0),
  estimatedCost: finite.min(0),
  progress: percent,
  step: count,
  totalSteps: count,
  throughput: z.string(),
  gpuUtilization: z.string(),
  gpuMemory: z.string(),
  author: z.string(),
  startedAt: finite.min(0),
})

const resourceUsagePointSchema = z.object({
  label: z.string(),
  shortLabel: z.string(),
  value: finite,
})

export const resourceUsageSchema = z.object({
  id: z.enum(['gpu-hours', 'storage', 'endpoints']),
  label: z.string(),
  description: z.string(),
  unit: z.string(),
  limit: finite.min(0),
  aggregation: z.enum(['sum', 'peak']),
  color: z.string(),
  series: z.object({
    day: z.array(resourceUsagePointSchema),
    week: z.array(resourceUsagePointSchema),
    month: z.array(resourceUsagePointSchema),
  }),
})

export const projectSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1),
  task: z.string(),
  description: z.string(),
  datasets: count,
  models: count,
  deployed: count,
  status: z.enum(['Active', 'Draft', 'Archived']),
  updatedAt: finite.min(0),
  updated: z.string(),
  color: z.string(),
})

export const projectOverviewSchema = z.object({
  created: z.string(),
  framework: z.string(),
  region: z.string(),
  visibility: z.enum(['Organization', 'Private']),
  pipeline: z.object({
    runs: count,
    running: count,
    completeThrough: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
  }),
  bestModel: z
    .object({
      name: z.string(),
      run: z.string(),
      updated: z.string(),
      accuracy: finite,
      f1: finite,
      latency: z.string(),
      size: z.string(),
    })
    .optional(),
  resourceUsage: z.array(resourceUsageSchema),
  readme: z
    .object({
      about: z.string(),
      architecture: z.string(),
      quickstart: z.string(),
      notes: z.array(z.object({ label: z.string(), text: z.string() })),
    })
    .optional(),
  team: z.array(
    z.object({
      name: z.string(),
      initials: z.string(),
      role: z.enum(['Owner', 'Editor', 'Viewer']),
      color: z.string(),
    }),
  ),
})

export const createdProjectSchema = z.object({
  project: projectSchema,
  overview: projectOverviewSchema,
  startMethod: z.enum(['upload', 'template', 'clone']),
  template: z.string().optional(),
  clonedFromProjectId: z.string().optional(),
})

export const preferencesSchema = z.object({
  organizationId: z.string().min(1),
  onboardingDismissed: z.boolean(),
  notificationsRead: z.boolean(),
  uploads: z.array(activitySchema),
  datasets: z.array(datasetSchema),
  trainingRuns: z.array(trainingRunSchema),
  createdProjects: z.array(createdProjectSchema),
})

/**
 * Validates one entry, returning `undefined` instead of throwing so a single
 * corrupt record is dropped rather than discarding the whole workspace.
 */
export function parseEntry<T>(
  schema: z.ZodType<T>,
  value: unknown,
): T | undefined {
  const result = schema.safeParse(value)
  return result.success ? result.data : undefined
}
