import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
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

const isCode = (code: string | undefined): code is ProblemCode => code !== undefined && code in BY_CODE;

/** Locale key for a dataset error: the problem `code` first (server text is never shown), then the status, then the app-wide fallbacks. */
export function datasetErrorKey(e: unknown): string {
  if (e instanceof ApiError) {
    if (isCode(e.code)) return BY_CODE[e.code];
    if (e.status === 429) return BY_CODE[ProblemCode.TooManyImports];
  }
  return errorKey(e);
}

export const isConflict = (e: unknown) => e instanceof ApiError && e.status === 409;
export const isForbidden = (e: unknown) => e instanceof ApiError && e.status === 403;
