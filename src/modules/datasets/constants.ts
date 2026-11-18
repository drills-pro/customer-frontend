import type { Schemas } from '@/shared/api/client';

/** The backend's closed sets, named once. Values mirror core-api (datasets/constants.py, data_plane/report.py). */
export type ImportStatus = Schemas['ImportStatus'];
export const ImportStatus = {
  AwaitingUpload: 'awaiting_upload',
  Queued: 'queued',
  Running: 'running',
  AwaitingReview: 'awaiting_review',
  Committing: 'committing',
  Succeeded: 'succeeded',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Expired: 'expired',
  Discarded: 'discarded',
} as const satisfies Record<string, ImportStatus>;

export type ImportSource = Schemas['ImportSource'];
export const ImportSource = { Upload: 'upload', HuggingFace: 'huggingface' } as const satisfies Record<string, ImportSource>;
export const IMPORT_SOURCES: readonly ImportSource[] = [ImportSource.Upload, ImportSource.HuggingFace];

export type Split = Schemas['Split'];
export const Split = { Train: 'train', Validation: 'validation', Test: 'test' } as const satisfies Record<string, Split>;
export const SPLITS: readonly Split[] = [Split.Train, Split.Validation, Split.Test];

export type Severity = Schemas['Severity'];
export const Severity = { Error: 'error', Warning: 'warning' } as const satisfies Record<string, Severity>;

/** `code` of a problem+json body. Branch on these, never on the HTTP text. */
export const ProblemCode = {
  InvalidState: 'invalid_import_state',
  TooManyImports: 'too_many_active_imports',
  TaskTypeMissing: 'project_task_type_missing',
  TaskTypeMismatch: 'task_type_mismatch',
  InvalidParams: 'invalid_import_params',
  BaseRequired: 'base_version_required',
  StaleBase: 'stale_base',
  NotDeleted: 'dataset_not_deleted',
  IdempotencyReused: 'idempotency_key_reused',
} as const;
export type ProblemCode = (typeof ProblemCode)[keyof typeof ProblemCode];

type TaskType = Schemas['TaskType'];
/** What the platform can import today (SUPPORTED_TASK_TYPES in core-api); any other project task type cannot import. */
export const TABULAR_TASKS: readonly TaskType[] = ['tabular-classification', 'tabular-regression'];
export const IMPORT_TASKS: readonly TaskType[] = ['image-classification', 'object-detection', ...TABULAR_TASKS];
export const isTabular = (task: TaskType) => TABULAR_TASKS.includes(task);
export const canImport = (task: TaskType | null): task is TaskType => task !== null && IMPORT_TASKS.includes(task);

export const PREVIEW_LIMITS = [10, 20, 50, 100] as const;
export const DEFAULT_PREVIEW_LIMIT = 20;
/** Hugging Face repo and revision, same patterns as core-api so the form refuses what the API would. */
export const PARAM_MAX_LENGTH = 255;
const SEGMENT = String.raw`\.*[\w-][\w.-]*`;
export const HF_REPO = new RegExp(`^(${SEGMENT}/)?${SEGMENT}$`);
export const HF_REVISION = new RegExp(`^${SEGMENT}(/${SEGMENT})*$`);
export const HF_DEFAULT_REVISION = 'main';

/** A deleted dataset can be restored this long (DATASET_RETENTION_DAYS in core-api). */
export const RETENTION_DAYS = 7;

/** A 403 on a write latches "read only" for the project; it clears after this long so the next write re-checks the permission. */
export const WRITE_DENIED_RECHECK_MS = 60_000;
