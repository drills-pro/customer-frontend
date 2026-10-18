/**
 * How a request to core-api is made: base URL, who is calling, JSON in and out,
 * and one error type. Nothing in here knows about a specific endpoint; those
 * live with their business area, in `src/features/<area>/api/`.
 */
import type {
  mirrorDatasets,
  mirrorModels,
  mirrorOrganizations,
  mirrorProjects,
} from './mock'
import { authHeaders } from './session'

/**
 * Where core-api lives. The compose stack publishes it on :8090, a different
 * origin from this dev server; core-api's CORS allows that because requests
 * authenticate with headers, not cookies.
 */
export const API_BASE = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8090'
).replace(/\/+$/, '')

/**
 * `status` is the HTTP status, or 0 when no response arrived at all (the app
 * is not configured, or the API is unreachable). `message` is safe to show.
 */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function errorMessage(data: unknown, response: Response) {
  const detail = (data as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (detail) return JSON.stringify(detail)
  return `${response.status} ${response.statusText}`.trim()
}

/**
 * How much of the API the in-app mock answers (`./mock/index.ts`):
 *
 * - `partial` (the default): what core-api doesn't serve yet. Everything else
 *   goes to core-api.
 * - `all` (`VITE_API_MOCK=all`): everything, so the app runs with no backend.
 *   The e2e suite runs this way.
 * - `off` (`VITE_API_MOCK=false`): nothing.
 */
export const MOCK_MODE: 'partial' | 'all' | 'off' =
  import.meta.env.VITE_API_MOCK === 'false'
    ? 'off'
    : import.meta.env.VITE_API_MOCK === 'all'
      ? 'all'
      : 'partial'

/** How long a mocked answer takes, so loading states are visible in dev. */
const MOCK_DELAY_MS = Number(import.meta.env.VITE_API_MOCK_DELAY_MS ?? 200) || 0

export type RequestOptions = {
  /**
   * Always use the network, even when the mock has a handler for this path,
   * in every mock mode. For a call core-api serves on a path the mock answers
   * differently (`datasetsApi.createDataset`), or one with no mock at all.
   */
  live?: boolean
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(data, response))
  }
  return data as T
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  { live = false }: RequestOptions = {},
): Promise<T> {
  if (MOCK_MODE !== 'off' && !live) {
    // Loaded on demand, so a build with the mock off does not ship its data.
    const { handleMockRequest } = await import('./mock')
    const mocked = await handleMockRequest(
      init.method ?? 'GET',
      path,
      init.body,
      MOCK_DELAY_MS,
      { includeRetired: MOCK_MODE === 'all' },
    )
    // Before the tenant check on purpose: mocked pages need no backend setup.
    if (mocked) return parse<T>(mocked)
  }

  const identity = authHeaders()
  if (!identity) {
    throw new ApiError(
      0,
      'VITE_DEV_TENANT_ID is not set. Add a tenant id to .env to load workspace data.',
    )
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...identity, ...(init.headers as Record<string, string>) },
    })
  } catch {
    throw new ApiError(0, `Could not reach the API at ${API_BASE}.`)
  }

  return parse<T>(response)
}

/** A request with an optional JSON body. */
function send<T>(
  method: string,
  path: string,
  json: unknown,
  options?: RequestOptions,
) {
  if (json === undefined) return request<T>(path, { method }, options)
  return request<T>(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
    },
    options,
  )
}

export function get<T>(path: string, options?: RequestOptions) {
  return request<T>(path, {}, options)
}

/** POST, with an optional JSON body. */
export function post<T>(
  path: string,
  json?: unknown,
  options?: RequestOptions,
) {
  return send<T>('POST', path, json, options)
}

export function put<T>(path: string, json?: unknown, options?: RequestOptions) {
  return send<T>('PUT', path, json, options)
}

export function patch<T>(
  path: string,
  json?: unknown,
  options?: RequestOptions,
) {
  return send<T>('PATCH', path, json, options)
}

export function del<T = void>(path: string, options?: RequestOptions) {
  return send<T>('DELETE', path, undefined, options)
}

/** POST one file as `multipart/form-data`, under the field name `file`. */
export function postForm<T>(
  path: string,
  file: File,
  options?: RequestOptions,
) {
  const form = new FormData()
  form.append('file', file)
  // No Content-Type header on purpose: the browser has to set the multipart
  // boundary itself.
  return request<T>(path, { method: 'POST', body: form }, options)
}

/** POST one file as the raw request body, for endpoints that read it directly. */
export function postFile<T>(
  path: string,
  file: File,
  contentType: string,
  options?: RequestOptions,
) {
  return request<T>(
    path,
    { method: 'POST', headers: { 'Content-Type': contentType }, body: file },
    options,
  )
}

type QueryValue = string | number | boolean | undefined | null

/**
 * Builds `?a=1&b=2`, skipping empty values. core-api takes many arguments as
 * query params rather than a JSON body, so this is used on POSTs too.
 */
export function qs(params: Record<string, QueryValue>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '')
      search.append(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}

type Mirrored = {
  organizations: Parameters<typeof mirrorOrganizations>[0]
  projects: Parameters<typeof mirrorProjects>[0]
  datasets: Parameters<typeof mirrorDatasets>[0]
  models: Parameters<typeof mirrorModels>[0]
}

/**
 * Copies records core-api answered with into the mock's store, so the
 * endpoints still mocked can find them: a mocked dataset list needs the
 * live project it belongs to, mocked billing the live organization. Only
 * in `partial` mode; in `all` the mock is the source and in `off` there is
 * none. Returns the rows unchanged, for use in a `.then`.
 */
export async function mirrorToMock<TKind extends keyof Mirrored>(
  kind: TKind,
  rows: Mirrored[TKind],
): Promise<Mirrored[TKind]> {
  if (MOCK_MODE !== 'partial') return rows
  const mock = await import('./mock')
  if (kind === 'organizations') {
    mock.mirrorOrganizations(rows as Mirrored['organizations'])
  } else if (kind === 'projects') {
    mock.mirrorProjects(rows as Mirrored['projects'])
  } else if (kind === 'datasets') {
    mock.mirrorDatasets(rows as Mirrored['datasets'])
  } else {
    mock.mirrorModels(rows as Mirrored['models'])
  }
  return rows
}
