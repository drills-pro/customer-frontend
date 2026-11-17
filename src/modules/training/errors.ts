import { ApiError } from '@/shared/api/client';
import { problemErrorKey } from '@/shared/api/errors';
import { ProblemCode } from '@/modules/training/constants';

const CONFLICT = 409;
const NOT_FOUND = 404;
const TOO_MANY_REQUESTS = 429;
const SERVICE_UNAVAILABLE = 503;

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

/** Locale key for a training error: the problem `code` first (server text is never shown), then the status, then the app-wide fallbacks. */
export const trainingErrorKey = problemErrorKey(BY_CODE, {
  [TOO_MANY_REQUESTS]: BY_CODE[ProblemCode.TooManyRuns],
  [SERVICE_UNAVAILABLE]: BY_CODE[ProblemCode.StartFailed],
});

/** Creating a run answers 404 when the chosen dataset version is gone (or was never this project's). */
export function createErrorKey(e: unknown): string {
  if (e instanceof ApiError && e.status === NOT_FOUND) return 'training.error.versionGone';
  return trainingErrorKey(e);
}

export const isConflict = (e: unknown) => e instanceof ApiError && e.status === CONFLICT;
export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === NOT_FOUND;
export const blockingCode = (e: unknown, codes: readonly string[]) =>
  e instanceof ApiError && e.code !== undefined && codes.includes(e.code) ? e.code : null;
