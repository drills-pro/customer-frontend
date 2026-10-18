/**
 * The mock server's database.
 *
 * Each collection is its seed plus a persisted delta: records created or
 * changed through the API, and the ids of seeded records that were deleted.
 * Seeds themselves are never stored, so a fixture placed relative to "now"
 * (a run that is always mid-flight) stays that way on every fresh load.
 *
 * Storage failures never throw. If `localStorage` is blocked or full the
 * database keeps working in memory for the session.
 */
import { z } from 'zod'

export const MOCK_DB_STORAGE_KEY = 'drills-mock-api-v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
type StoredCollection = { records: unknown[]; deleted: unknown[] }
type StoredDocument = Record<string, StoredCollection | undefined>

let storageOverride: StorageLike | undefined
let document_: StoredDocument | undefined

function storage(): StorageLike | undefined {
  if (storageOverride) return storageOverride
  try {
    // Reading the property can itself throw a SecurityError.
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function load(): StoredDocument {
  if (document_) return document_
  document_ = {}
  try {
    const raw = storage()?.getItem(MOCK_DB_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : undefined
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      document_ = parsed as StoredDocument
    }
  } catch {
    // Unreadable or malformed storage: start from the seed.
  }
  return document_
}

function save() {
  try {
    storage()?.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(load()))
  } catch {
    // Blocked or full storage: the in-memory document is still current.
  }
}

const collections: Array<Collection<any>> = []

/** The least a stored record must be to come back out of storage. */
const anyRecord = z.looseObject({ id: z.string().min(1) })

export class Collection<T extends { id: string }> {
  private readonly name: string
  private readonly buildSeed: () => T[]
  private readonly schema: z.ZodType
  private seedCache?: T[]
  private records?: T[]
  private deleted?: Set<string>

  /**
   * @param schema validates each stored record on load; a record that fails
   *   is dropped on its own, so one corrupt entry cannot cost the rest.
   */
  constructor(name: string, seed: () => T[] = () => [], schema?: z.ZodType) {
    this.name = name
    this.buildSeed = seed
    this.schema = schema ?? anyRecord
    collections.push(this)
  }

  private seed() {
    return (this.seedCache ??= this.buildSeed())
  }

  private restore() {
    if (this.records && this.deleted) return
    const saved = load()[this.name]
    this.records = (Array.isArray(saved?.records) ? saved.records : []).flatMap(
      (entry) => {
        const result = this.schema.safeParse(entry)
        return result.success ? [result.data as T] : []
      },
    )
    this.deleted = new Set(
      (Array.isArray(saved?.deleted) ? saved.deleted : []).filter(
        (id): id is string => typeof id === 'string',
      ),
    )
  }

  private persist() {
    load()[this.name] = {
      records: this.records ?? [],
      deleted: [...(this.deleted ?? [])],
    }
    save()
  }

  /** Created records first, newest first, then the seed with changes applied. */
  all(): T[] {
    this.restore()
    const records = this.records!
    const deleted = this.deleted!
    const seed = this.seed()
    const seedIds = new Set(seed.map((item) => item.id))
    const changed = new Map(records.map((item) => [item.id, item]))
    return [
      ...records.filter((item) => !seedIds.has(item.id)),
      ...seed
        .filter((item) => !deleted.has(item.id))
        .map((item) => changed.get(item.id) ?? item),
    ]
  }

  get(id: string): T | undefined {
    return this.all().find((item) => item.id === id)
  }

  /** Creates the record, or replaces the one with the same id. */
  put(record: T): T {
    this.restore()
    const exists = this.records!.some((item) => item.id === record.id)
    this.records = exists
      ? this.records!.map((item) => (item.id === record.id ? record : item))
      : [record, ...this.records!]
    this.deleted!.delete(record.id)
    this.persist()
    return record
  }

  /** Merges `changes` into an existing record. */
  patch(id: string, changes: Partial<T>): T | undefined {
    const current = this.get(id)
    return current ? this.put({ ...current, ...changes }) : undefined
  }

  remove(id: string) {
    this.restore()
    this.records = this.records!.filter((item) => item.id !== id)
    if (this.seed().some((item) => item.id === id)) this.deleted!.add(id)
    this.persist()
  }

  /** Forgets what was read from storage, so the next read loads it again. */
  forget() {
    this.records = undefined
    this.deleted = undefined
  }
}

/**
 * Drops everything read so far, so the next request reads storage again, as a
 * page reload does. Tests pass a `storage` to run without a browser.
 */
export function reloadMockDb(withStorage?: StorageLike) {
  if (withStorage) storageOverride = withStorage
  document_ = undefined
  for (const collection of collections) collection.forget()
}
