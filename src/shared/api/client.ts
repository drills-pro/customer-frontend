import createClient from 'openapi-fetch';
import { getToken } from '@/shared/auth/manager';
import { cfg } from '@/config';
import type { components, paths } from './schema';

export type Schemas = components['schemas'];

/** `status` 0 means the request never got an answer (offline, CORS, DNS). `code` is core-api's problem+json code. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
  ) {
    super(`API ${status}${code ? ` ${code}` : ''}`);
  }
}

/** The header core-api reads the active workspace from (it requires one when a user belongs to several workspaces). */
export const TENANT_HEADER = 'X-Tenant-Id';

/** The active workspace id, sent on every request as TENANT_HEADER. Set by WorkspaceProvider; no API call sets it by hand. */
let tenantId: string | undefined;
export const setApiTenant = (id?: string) => {
  tenantId = id;
};

export const client = createClient<paths>({ baseUrl: cfg.apiUrl });
client.use({
  async onRequest({ request }) {
    const token = await getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    if (tenantId) request.headers.set(TENANT_HEADER, tenantId);
    return request;
  },
});

/** Resolve to the response body (undefined for 204), or throw an ApiError. */
export async function unwrap<T>(req: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  let r;
  try {
    r = await req;
  } catch {
    throw new ApiError(0);
  }
  if (!r.response.ok) throw new ApiError(r.response.status, (r.error as { code?: string } | undefined)?.code);
  return r.data as T;
}
