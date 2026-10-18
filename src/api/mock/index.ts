/**
 * The in-app mock of the API this frontend wants.
 *
 * `src/api/client.ts` offers every request to `handleMockRequest` first. A
 * route with a handler is answered here, as a real `Response`, so the client's
 * parsing and error handling run exactly as they do against core-api. A route
 * without one returns `undefined` and goes to the network.
 *
 * When core-api serves an endpoint, register its handler with `retiredRoute`
 * (see `./router.ts`): the app then sends it to core-api, and the mock answers
 * it only with `includeRetired`.
 */
import './handlers'
import { MockHttpError, matchRoute } from './router'
import type { MatchOptions } from './router'

export { MOCK_DB_STORAGE_KEY, reloadMockDb } from './db'
export {
  mirrorDatasets,
  mirrorModels,
  mirrorOrganizations,
  mirrorProjects,
} from './mirror'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function parseBody(body: unknown) {
  if (typeof body !== 'string') return body ?? undefined
  try {
    return JSON.parse(body) as unknown
  } catch {
    return body
  }
}

export async function handleMockRequest(
  method: string,
  path: string,
  body?: unknown,
  delayMs = 0,
  options: MatchOptions = {},
): Promise<Response | undefined> {
  const match = matchRoute(method.toUpperCase(), path, options)
  if (!match) return undefined

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  try {
    const result = match.handler({
      params: match.params,
      query: match.query,
      body: parseBody(body),
    })
    return result === undefined
      ? new Response(null, { status: 204 })
      : json(200, result)
  } catch (error) {
    if (error instanceof MockHttpError) {
      return json(error.status, { detail: error.message })
    }
    return json(500, {
      detail: error instanceof Error ? error.message : 'Mock handler failed',
    })
  }
}
