import { ApiError } from './client';

/** Locale key for an error: the UI never shows server text. Pages with a more specific message check `status`/`code` first. */
export function errorKey(e: unknown): string {
  if (!(e instanceof ApiError)) return 'error.generic';
  switch (e.status) {
    case 0:
      return 'error.network';
    case 403:
      return 'error.forbidden';
    case 404:
      return 'error.notFound';
    case 409:
      return 'error.conflict';
    case 422:
      return 'error.invalid';
    case 429:
      return 'error.rateLimited';
    default:
      return 'error.generic';
  }
}
