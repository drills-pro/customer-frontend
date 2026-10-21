import { MockHttpError } from '../router';

export const nowIso = () => new Date().toISOString();

export const shortId = () => crypto.randomUUID().slice(0, 8);

/** The request body as an object; anything else answers 422. */
export function bodyOf<T>(body: unknown): T {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MockHttpError(422, 'Expected a JSON object body');
  }
  return body as T;
}

export function conflict(detail: string): never {
  throw new MockHttpError(409, detail);
}

export function invalid(detail: string): never {
  throw new MockHttpError(422, detail);
}

export function forbidden(detail: string): never {
  throw new MockHttpError(403, detail);
}

/** Keeps only the listed keys that the request actually sent. */
export function pick<T extends object, TKey extends keyof T>(source: T, keys: readonly TKey[]): Partial<Pick<T, TKey>> {
  const result: Partial<Pick<T, TKey>> = {};
  for (const key of keys) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
}

export function slugify(value: string, fallback: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback
  );
}
