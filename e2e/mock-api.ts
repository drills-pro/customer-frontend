import type { Page, Route } from '@playwright/test';

export const API_URL = 'http://api.e2e.test';
export const ACME = 'aaaaaaaa-0000-4000-8000-000000000001';
export const SIDE = 'bbbbbbbb-0000-4000-8000-000000000002';
export const ACME_SLUG = 'acme-vision';
export const SIDE_SLUG = 'side-project';

export type Role = 'owner' | 'admin' | 'member';
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'pending_delete';
  role: Role;
  plan_tier: string;
  created_at: string;
  deleted_at: string | null;
}
export interface Member {
  user_sub: string;
  role: Role;
  created_at: string;
  email: string;
  display_name: string | null;
}
export interface Invitation {
  id: string;
  email: string;
  role: Role;
  expires_at: string;
  created_at: string;
}
/** What the fake backend knows. Each test gets its own copy and may change it before it navigates. */
export interface ApiState {
  emailVerified: boolean;
  workspaces: Workspace[];
  members: Member[];
  invitations: Invitation[];
  /** Tokens `POST /v1/invitations/{token}:accept` accepts, mapped to the workspace they join. */
  acceptable: Record<string, string>;
}

const workspace = (id: string, name: string, slug: string, role: Role): Workspace => ({
  id,
  name,
  slug,
  status: 'active',
  role,
  plan_tier: 'free',
  created_at: '2026-10-01T00:00:00Z',
  deleted_at: null,
});

export const newState = (): ApiState => ({
  emailVerified: true,
  workspaces: [workspace(ACME, 'Acme Vision', ACME_SLUG, 'owner'), workspace(SIDE, 'Side Project', SIDE_SLUG, 'member')],
  members: [{ user_sub: 'me', role: 'owner', created_at: '2026-10-01T00:00:00Z', email: 'dev@example.com', display_name: 'Dev User' }],
  invitations: [],
  acceptable: { good: SIDE },
});

const capabilities = (role: Role) =>
  role === 'owner' ? ['tenant.admin', 'tenant.member.manage', 'tenant.delete', 'project.list'] : ['project.list'];

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = (route: Route, status: number, body?: unknown) =>
  route.fulfill({
    status,
    headers: CORS,
    ...(body === undefined ? {} : { contentType: 'application/json', body: JSON.stringify(body) }),
  });

/** Answer every API call from `state`, so no backend has to run. */
export async function installApi(page: Page, state: ApiState) {
  await page.route(`${API_URL}/**`, async (route) => {
    const req = route.request();
    const method = req.method();
    if (method === 'OPTIONS') return json(route, 204);
    if (!req.headers()['authorization']) return json(route, 401, { code: 'unauthorized' });

    const path = new URL(req.url()).pathname;
    const body = (req.postDataJSON() ?? {}) as Record<string, string>;
    const find = (id: string) => state.workspaces.find((w) => w.id === id);
    let m: RegExpMatchArray | null;

    if (path === '/v1/me') {
      return json(route, 200, {
        sub: 'me',
        email: 'dev@example.com',
        email_verified: state.emailVerified,
        name: 'Dev User',
        tenants: state.workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          role: w.role,
          status: w.status,
          capabilities: capabilities(w.role),
        })),
      });
    }
    if (path === '/v1/tenants' && method === 'POST') {
      const w = workspace(crypto.randomUUID(), body.name, body.slug, 'owner');
      state.workspaces.push(w);
      return json(route, 201, { id: w.id, name: w.name, slug: w.slug, role: w.role });
    }
    if ((m = path.match(/^\/v1\/tenants\/([^/:]+)$/))) {
      const w = find(m[1]);
      if (!w) return json(route, 404, { code: 'not_found' });
      if (method === 'PATCH') w.name = body.name;
      return json(route, 200, w);
    }
    if ((m = path.match(/^\/v1\/tenants\/([^/:]+):(delete|restore)$/))) {
      const w = find(m[1]);
      if (!w) return json(route, 404, { code: 'not_found' });
      if (m[2] === 'delete') {
        if (body.confirm_name !== w.name) return json(route, 422, { code: 'confirmation_mismatch' });
        w.status = 'pending_delete';
      } else {
        w.status = 'active';
      }
      return json(route, 200, w);
    }
    if (/^\/v1\/tenants\/[^/:]+\/members$/.test(path)) return json(route, 200, state.members);
    if ((m = path.match(/^\/v1\/tenants\/[^/:]+\/members\/(.+)$/))) {
      const sub = decodeURIComponent(m[1]);
      if (method === 'PUT') {
        const member = state.members.find((x) => x.user_sub === sub);
        if (member) member.role = body.role as Role;
        return json(route, 200, { user_sub: sub, role: body.role });
      }
      state.members = state.members.filter((x) => x.user_sub !== sub);
      return json(route, 204);
    }
    if (/^\/v1\/tenants\/[^/:]+\/invitations$/.test(path)) {
      if (method !== 'POST') return json(route, 200, state.invitations);
      const invitation: Invitation = {
        id: crypto.randomUUID(),
        email: body.email,
        role: body.role as Role,
        expires_at: '2026-10-29T00:00:00Z',
        created_at: new Date().toISOString(),
      };
      state.invitations.push(invitation);
      return json(route, 201, { ...invitation, token: `tok_${state.invitations.length}` });
    }
    if ((m = path.match(/^\/v1\/invitations\/(.+):accept$/))) {
      const tenantId = state.acceptable[decodeURIComponent(m[1])];
      return tenantId ? json(route, 200, { tenant_id: tenantId, role: 'member' }) : json(route, 404, { code: 'not_found' });
    }
    return json(route, 404, { code: 'not_found' });
  });
}
