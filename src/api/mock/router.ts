/**
 * The mock server's route table: `route('GET', '/v1/projects/:projectId', …)`.
 * Handlers register themselves on import (see `./handlers`).
 *
 * A route core-api now serves is registered with `retiredRoute` instead of
 * being deleted. The app sends it to core-api; it still answers when the
 * whole API is mocked (`VITE_API_MOCK=all`: the e2e suite, offline work) and
 * keeps recording the contract (tests/contract-fixtures.spec.ts).
 */

export type MockRequest = {
  /** `:name` segments of the matched pattern, URL-decoded. */
  params: Record<string, string>
  query: URLSearchParams
  /** The parsed JSON body, or `undefined` when the request carried none. */
  body: unknown
}

/** Returns the JSON to answer with; `undefined` answers 204. */
export type MockHandler = (request: MockRequest) => unknown

export type MockMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Thrown by a handler to answer with an error, shaped like core-api's. */
export class MockHttpError extends Error {
  status: number

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'MockHttpError'
    this.status = status
  }
}

export function notFound(what: string): never {
  throw new MockHttpError(404, `${what} not found`)
}

type Route = {
  method: MockMethod
  pattern: string
  segments: string[]
  /** Fixed segments; the more a pattern has, the more specific it is. */
  fixed: number
  handler: MockHandler
  /** Served by core-api; answered here only when retired routes are included. */
  retired: boolean
}

const routes: Route[] = []

const split = (path: string) => path.split('/').filter(Boolean)

function register(
  method: MockMethod,
  pattern: string,
  handler: MockHandler,
  retired: boolean,
) {
  const segments = split(pattern)
  routes.push({
    method,
    pattern,
    segments,
    fixed: segments.filter((segment) => !segment.startsWith(':')).length,
    handler,
    retired,
  })
}

export function route(
  method: MockMethod,
  pattern: string,
  handler: MockHandler,
) {
  register(method, pattern, handler, false)
}

/** A route core-api serves. See the note at the top of this file. */
export function retiredRoute(
  method: MockMethod,
  pattern: string,
  handler: MockHandler,
) {
  register(method, pattern, handler, true)
}

function capture(candidate: Route, parts: string[]) {
  if (candidate.segments.length !== parts.length) return undefined
  const params: Record<string, string> = {}
  for (const [index, segment] of candidate.segments.entries()) {
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = decodeURIComponent(parts[index])
    } else if (segment !== parts[index]) {
      return undefined
    }
  }
  return params
}

/**
 * Every registered route, retired ones included, for the contract fixtures
 * (tests/contract-fixtures.spec.ts).
 */
export function registeredRoutes(): {
  method: MockMethod
  pattern: string
  retired: boolean
}[] {
  return routes.map(({ method, pattern, retired }) => ({
    method,
    pattern,
    retired,
  }))
}

export type MatchOptions = {
  /** Also answer the routes core-api serves (`retiredRoute`). */
  includeRetired?: boolean
}

export type RouteMatch = {
  handler: MockHandler
  params: Record<string, string>
  query: URLSearchParams
}

/**
 * Finds the handler for a request. When two patterns fit, the one with more
 * fixed segments wins, so `/training-runs/estimate` beats `/training-runs/:runId`.
 */
export function matchRoute(
  method: string,
  path: string,
  { includeRetired = false }: MatchOptions = {},
): RouteMatch | undefined {
  const [pathname, search = ''] = path.split('?')
  const parts = split(pathname)
  let best: { candidate: Route; params: Record<string, string> } | undefined

  for (const candidate of routes) {
    if (candidate.method !== method) continue
    if (candidate.retired && !includeRetired) continue
    const params = capture(candidate, parts)
    if (params && (!best || candidate.fixed > best.candidate.fixed)) {
      best = { candidate, params }
    }
  }

  return best
    ? {
        handler: best.candidate.handler,
        params: best.params,
        query: new URLSearchParams(search),
      }
    : undefined
}
