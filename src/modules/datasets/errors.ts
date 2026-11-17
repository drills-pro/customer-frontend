import { ApiError } from '@/shared/api/client';
import { problemErrorKey } from '@/shared/api/errors';
import { ProblemCode } from '@/modules/datasets/constants';

const BY_CODE: Record<ProblemCode, string> = {
  [ProblemCode.InvalidState]: 'datasets.error.invalidState',
  [ProblemCode.TooManyImports]: 'datasets.error.tooManyImports',
  [ProblemCode.TaskTypeMissing]: 'datasets.error.noTaskType',
  [ProblemCode.TaskTypeMismatch]: 'datasets.error.invalidParams',
  [ProblemCode.InvalidParams]: 'datasets.error.invalidParams',
  [ProblemCode.BaseRequired]: 'datasets.error.staleBase',
  [ProblemCode.StaleBase]: 'datasets.error.staleBase',
  [ProblemCode.NotDeleted]: 'datasets.error.notDeleted',
  [ProblemCode.IdempotencyReused]: 'datasets.error.keyReused',
};

/** Locale key for a dataset error: the problem `code` first (server text is never shown), then the status, then the app-wide fallbacks. */
export const datasetErrorKey = problemErrorKey(BY_CODE, { 429: BY_CODE[ProblemCode.TooManyImports] });

export const isConflict = (e: unknown) => e instanceof ApiError && e.status === 409;
export const isForbidden = (e: unknown) => e instanceof ApiError && e.status === 403;

/** The import exists but the server gave it no upload link: this attempt cannot upload, so the user starts over. */
export class UploadLinkLost extends Error {}
/** The file did not reach storage (the network failed, or the upload was aborted). */
export class UploadFailed extends Error {}
