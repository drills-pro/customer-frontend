import { cfg } from './config';

export interface Me { sub: string; email: string | null; name: string | null; tenants: { id: string; name: string; role: string }[] }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${cfg.apiUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.detail ?? res.statusText);
  }
  return res.json();
}

export const getMe = (token: string) => api<Me>('/v1/me', token);
