// No imports: the e2e logic specs load this under Node, where the API client's env reads fail.
/** The numeric entries of an object, by name; anything else is left out. A run's metrics come from an untrusted job, so they are
 * read through this. */
export function numericEntries(v: unknown): Record<string, number> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
  return Object.fromEntries(
    Object.entries(v).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])),
  );
}
