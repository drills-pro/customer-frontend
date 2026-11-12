import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { ProblemCode } from '@/modules/training/constants';

const BY_CODE: Record<ProblemCode, string> = {
  [ProblemCode.TaskTypeMissing]: 'training.error.noTask',
  [ProblemCode.TaskTypeMismatch]: 'training.error.taskMismatch',
  [ProblemCode.TaskNotTrainable]: 'training.error.notTrainable',
  [ProblemCode.TooManyRuns]: 'training.error.tooManyRuns',
  [ProblemCode.IdempotencyMismatch]: 'training.error.keyReused',
  [ProblemCode.StartFailed]: 'training.error.startFailed',
  [ProblemCode.UnknownPreset]: 'training.error.unknownPreset',
  [ProblemCode.OutOfRange]: 'training.error.outOfRange',
  [ProblemCode.InvalidState]: 'training.error.invalidState',
  [ProblemCode.CancelFailed]: 'training.error.cancelFailed',
};

const isCode = (code: string | undefined): code is ProblemCode => code !== undefined && code in BY_CODE;

/** Locale key for a training error: the problem `code` first (server text is never shown), then the status, then the app-wide fallbacks. */
export function trainingErrorKey(e: unknown): string {
  if (e instanceof ApiError) {
    if (isCode(e.code)) return BY_CODE[e.code];
    if (e.status === 429) return BY_CODE[ProblemCode.TooManyRuns];
    if (e.status === 503) return BY_CODE[ProblemCode.StartFailed];
  }
  return errorKey(e);
}

/** Creating a run answers 404 when the chosen dataset version is gone (or was never this project's). */
export function createErrorKey(e: unknown): string {
  if (e instanceof ApiError && e.status === 404) return 'training.error.versionGone';
  return trainingErrorKey(e);
}

export const isConflict = (e: unknown) => e instanceof ApiError && e.status === 409;
export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;
export const blockingCode = (e: unknown, codes: readonly string[]) =>
  e instanceof ApiError && e.code !== undefined && codes.includes(e.code) ? e.code : null;
