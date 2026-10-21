import { ApiError } from './client';

/** True when the API answered that the record does not exist. */
export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}
