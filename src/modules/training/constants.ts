import type { TaskType } from '@/modules/projects';

/** The new-training wizard's steps; each id is also its `training.new.step.*` key. */
export const STEPS = ['data', 'model', 'settings', 'review'] as const;
export type StepId = (typeof STEPS)[number];
export const step = (id: StepId) => STEPS.indexOf(id);

/** What a run may override from its preset, in the order the form shows them; each is also its `training.settings.*` key. */
export const HYPERPARAMETERS = ['epochs', 'batch_size', 'image_size'] as const;
export type Hyperparameter = (typeof HYPERPARAMETERS)[number];
/** Tasks that train on text, where an image size means nothing: the form hides it and the body leaves it out. */
export const NO_IMAGE_SIZE: readonly TaskType[] = ['text-classification'];
export const shownHyperparameters = (task: TaskType): readonly Hyperparameter[] =>
  NO_IMAGE_SIZE.includes(task) ? HYPERPARAMETERS.filter((h) => h !== 'image_size') : HYPERPARAMETERS;

/** Seed bounds and default, as core-api (DEFAULT_SEED in job_spec.py, SEED_MAX in training/constants.py). */
export const DEFAULT_SEED = 42;
export const SEED_MAX = 2 ** 32 - 1;
/** The preset picked first when the project's task has it. */
export const DEFAULT_PRESET = 'small';
/** Preset names the copy knows (`training.preset.<name>.*`); an admin may add others, which show by name. */
export const KNOWN_PRESETS: readonly string[] = ['small', 'medium', 'large'];

/** `code` of a problem+json body. Values mirror core-api (training/constants.py). Branch on these, never on the HTTP text. */
export const ProblemCode = {
  TaskTypeMissing: 'project_task_type_missing',
  TaskTypeMismatch: 'task_type_mismatch',
  TaskNotTrainable: 'task_type_not_trainable',
  TooManyRuns: 'too_many_training_runs',
  IdempotencyMismatch: 'idempotency_mismatch',
  StartFailed: 'training_start_failed',
  UnknownPreset: 'unknown_preset',
  OutOfRange: 'hyperparameter_out_of_range',
  InvalidState: 'invalid_training_state',
  CancelFailed: 'training_cancel_failed',
} as const;
export type ProblemCode = (typeof ProblemCode)[keyof typeof ProblemCode];
/** Codes that mean this project cannot train at all, so the page shows why instead of the form. */
export const BLOCKING_CODES: readonly string[] = [ProblemCode.TaskTypeMissing, ProblemCode.TaskNotTrainable];

/** Bytes in a GiB, for a preset's memory. */
export const GIB = 1024 ** 3;
export const SECONDS_PER_HOUR = 3600;

/** Why a run failed, from its report's `code`. Values mirror core-api (data_plane/train_report.py, FailureCode); each is also its
 * `training.run.failure.*` key. */
export const FailureCode = {
  OutOfMemory: 'oom',
  BadData: 'bad_data',
  Unsupported: 'unsupported',
  Timeout: 'timeout',
  Internal: 'internal',
} as const;
export type FailureCode = (typeof FailureCode)[keyof typeof FailureCode];
export const FAILURE_CODES: readonly string[] = Object.values(FailureCode);

/** Most series the progress chart draws: one per chart color token (`chart-1` .. `chart-6`). */
export const CHART_COLORS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6'] as const;
/** Percent, for a preset's warmup share and a run's epoch progress. */
export const PERCENT = 100;
export const MS_PER_SECOND = 1000;

/** The run page's tabs; each id is also its `training.run.tab.*` key. */
export const RUN_TABS = ['metrics', 'logs', 'config'] as const;
export type RunTab = (typeof RUN_TABS)[number];
/** Characters of a run id shown in the run page's subtitle: enough to tell runs apart, short enough to read. */
export const SHORT_ID_LENGTH = 8;
