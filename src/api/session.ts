/**
 * Who is calling the API. For now this is mock authentication.
 *
 * There is no login yet, so the "session" is read from env vars and sent as
 * the dev headers core-api honours under `AUTH_MODE=dev` (see
 * core-api/app/core/tenancy.py). A backend in the default `zitadel` mode
 * ignores them and answers 401.
 *
 * This file is the whole seam: real auth replaces `getSession` and
 * `authHeaders` (a bearer token instead of these headers) and nothing else in
 * the app has to know.
 */
export type Session = {
  /**
   * The caller's home organization; a UUID from core-api's `tenants`. They
   * own it in dev mode, and it is the fallback when no organization is
   * selected.
   */
  tenantId: string | undefined
  userId: string
  /** Matched against invitations addressed to the caller. Optional. */
  email: string | undefined
  displayName: string
}

const env = import.meta.env

export function getSession(): Session {
  return {
    tenantId: env.VITE_DEV_TENANT_ID || undefined,
    userId: env.VITE_DEV_USER_ID || 'dev-user',
    email: env.VITE_DEV_USER_EMAIL || undefined,
    displayName: env.VITE_DEV_USER_NAME || 'Alex',
  }
}

let currentOrganizationId: string | undefined

/**
 * The organization the app is showing, sent as `X-Organization-Id` so the
 * routes that act in "the current organization" (the dashboard) follow the
 * switcher. Set by the app shell as it renders (`routes/_app/route.tsx`).
 * Routes that name their organization in the path or query don't need it.
 */
export function setCurrentOrganizationId(organizationId: string | undefined) {
  currentOrganizationId = organizationId
}

/** Headers that identify the caller to core-api, or `null` when unconfigured. */
export function authHeaders(): Record<string, string> | null {
  const session = getSession()
  if (!session.tenantId) return null
  const headers: Record<string, string> = {
    'X-Tenant-Id': session.tenantId,
    'X-User-Id': session.userId,
  }
  if (currentOrganizationId)
    headers['X-Organization-Id'] = currentOrganizationId
  if (session.email) headers['X-User-Email'] = session.email
  return headers
}
