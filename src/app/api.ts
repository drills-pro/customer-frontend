import { cfg } from './config';

export interface Me {
  sub: string;
  email: string | null;
  email_verified: boolean;
  name: string | null;
  tenants: { id: string; name: string; role: string }[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = { ...init.headers, Authorization: `Bearer ${token}` };
  const res = await fetch(`${cfg.apiUrl}${path}`, { ...init, headers }); // lint-ok
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText);
  }
  return res.json();
}

export const getMe = (token: string) => api<Me>('/v1/me', token);

export interface TenantCreated {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/** The same Idempotency-Key replays the first answer, so a retry of one attempt never makes a second tenant. */
export const createTenant = (token: string, body: { name: string; slug: string }, idempotencyKey: string) =>
  api<TenantCreated>('/v1/tenants', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });
