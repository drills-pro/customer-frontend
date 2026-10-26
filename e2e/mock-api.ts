import type { Page, Route } from '@playwright/test';

export const API_URL = 'http://api.e2e.test';
export const ACME = 'aaaaaaaa-0000-4000-8000-000000000001';
export const SIDE = 'bbbbbbbb-0000-4000-8000-000000000002';
export const ACME_SLUG = 'acme-vision';
export const SIDE_SLUG = 'side-project';
export const PROJECT = 'cccccccc-0000-4000-8000-000000000003';
export const UPLOAD_HOST = 'http://storage.e2e.test';

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
export interface DatasetRec {
  id: string;
  name: string;
  task_type: string | null;
  created_at: string;
  deleted_at: string | null;
  published_version_id: string | null;
}
export interface ImportRec {
  id: string;
  dataset_id: string;
  source: 'upload' | 'huggingface';
  status: string;
  base_version_id: string | null;
  params: Record<string, string>;
  report: unknown;
  expires_at: string | null;
  created_at: string;
  completed_at: string | null;
}
export interface VersionRec {
  id: string;
  number: number;
  import_id: string;
  stats: Record<string, number>;
  created_at: string;
}
export interface PreviewRow {
  data: Record<string, unknown>;
  url?: string;
}
/** What the fake backend knows. Each test gets its own copy and may change it before it navigates. */
export interface ApiState {
  emailVerified: boolean;
  workspaces: Workspace[];
  members: Member[];
  invitations: Invitation[];
  /** Tokens `POST /v1/invitations/{token}:accept` accepts, mapped to the workspace they join. */
  acceptable: Record<string, string>;
  datasets: DatasetRec[];
  imports: ImportRec[];
  versions: VersionRec[];
  /** Rows every preview answers with. */
  previewRows: PreviewRow[];
  /** Datasets a list answers with per page, to test cursors. */
  pageSize: number;
  /** Every dataset write answers 403. */
  denyWrites: boolean;
  /** Creating an import answers 429 (the per-workspace cap). */
  importCap: boolean;
  /** Commit answers 409 and moves the import to this status, as if someone else did it. */
  commitConflict: string | null;
  /** How many times each import was fetched, by id: the polling tests count these. */
  importGets: Record<string, number>;
  /** The Idempotency-Key of each import create, in order. */
  keys: string[];
  /** Bodies of each import create. */
  created: unknown[];
  /** Files PUT to the upload host. */
  uploads: string[];
  /** The next this many uploads fail at the network. */
  failUploads: number;
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
  datasets: [],
  imports: [],
  versions: [],
  previewRows: [{ data: { x: 1, y: 2 } }, { data: { x: 3, y: 4 } }],
  pageSize: 50,
  denyWrites: false,
  importCap: false,
  commitConflict: null,
  importGets: {},
  keys: [],
  created: [],
  uploads: [],
  failUploads: 0,
});

const NOW = '2026-10-20T10:00:00Z';
export const dataset = (state: ApiState, patch: Partial<DatasetRec> = {}): DatasetRec => {
  const d: DatasetRec = {
    id: crypto.randomUUID(),
    name: `dataset-${state.datasets.length + 1}`,
    task_type: 'tabular-classification',
    created_at: NOW,
    deleted_at: null,
    published_version_id: null,
    ...patch,
  };
  state.datasets.push(d);
  return d;
};
export const importOf = (state: ApiState, datasetId: string, patch: Partial<ImportRec> = {}): ImportRec => {
  const i: ImportRec = {
    id: crypto.randomUUID(),
    dataset_id: datasetId,
    source: 'upload',
    status: 'queued',
    base_version_id: null,
    params: {},
    report: null,
    expires_at: '2026-10-27T10:00:00Z',
    created_at: NOW,
    completed_at: null,
    ...patch,
  };
  state.imports.unshift(i);
  return i;
};
export const versionOf = (state: ApiState, datasetId: string, importId: string): VersionRec => {
  const number = state.versions.filter((v) => state.imports.some((i) => i.id === v.import_id && i.dataset_id === datasetId)).length + 1;
  const v: VersionRec = {
    id: crypto.randomUUID(),
    number,
    import_id: importId,
    stats: { row_count: 12, file_count: 0, total_bytes: 0 },
    created_at: NOW,
  };
  state.versions.unshift(v);
  return v;
};
export const REPORT = {
  schema_version: 1,
  outcome: 'ok',
  stats: { file_count: 0, total_bytes: 0, row_count: 12, classes: { cat: 7, dog: 5 }, splits: {}, duplicates_skipped: 1 },
  issues: [{ code: 'duplicate_skipped', severity: 'warning', path: 'row 4', message: 'same as row 3' }],
  issues_omitted: 3,
};

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
    const ds = datasetRoutes(route, state, method, path, req);
    if (ds) return ds;
    return json(route, 404, { code: 'not_found' });
  });
  await page.route(`${UPLOAD_HOST}/**`, async (route) => {
    if (route.request().method() === 'PUT' && state.failUploads > 0) {
      state.failUploads--;
      return route.abort();
    }
    if (route.request().method() === 'PUT') state.uploads.push(new URL(route.request().url()).pathname);
    return route.fulfill({ status: route.request().method() === 'OPTIONS' ? 204 : 200, headers: CORS });
  });
}

const problem = (route: Route, status: number, code: string) =>
  json(route, status, { status, code, detail: 'server text the UI must not show' });
const paginate = <T>(items: T[], url: string, size: number) => {
  const from = Number(new URL(url).searchParams.get('page_token') ?? 0);
  const next = from + size;
  return { items: items.slice(from, next), next_page_token: next < items.length ? String(next) : null };
};

/** /v1/projects/{PROJECT}/datasets/...: the dataset flows. Returns undefined when the path is not one of them. */
function datasetRoutes(route: Route, state: ApiState, method: string, path: string, req: ReturnType<Route['request']>) {
  const m = path.match(new RegExp(`^/v1/projects/${PROJECT}/datasets(?:/([^/:]+)(:restore|/.*)?)?$`));
  if (!m) return undefined;
  const [, id, rest = ''] = m;
  const body = (req.postDataJSON() ?? {}) as Record<string, unknown>;
  const write = method !== 'GET';
  if (write && state.denyWrites) return problem(route, 403, 'forbidden');

  if (!id) {
    if (method === 'POST') return json(route, 201, dataset(state, { name: String(body.name) }));
    return json(
      route,
      200,
      paginate(
        state.datasets.filter((d) => !d.deleted_at),
        req.url(),
        state.pageSize,
      ),
    );
  }
  const d = state.datasets.find((x) => x.id === id);
  if (!d) return problem(route, 404, 'not_found');
  const ofDataset = <T extends { dataset_id: string }>(items: T[]) => items.filter((i) => i.dataset_id === id);

  if (rest === '') {
    if (method === 'DELETE') d.deleted_at = '2026-10-26T00:00:00Z';
    return json(route, method === 'DELETE' ? 202 : 200, d);
  }
  if (rest === ':restore') {
    d.deleted_at = null;
    return json(route, 200, d);
  }
  if (rest === '/published') {
    d.published_version_id = method === 'PUT' ? String(body.version_id) : null;
    return json(route, 200, d);
  }
  if (rest === '/versions') {
    const own = state.versions.filter((v) => state.imports.some((i) => i.id === v.import_id && i.dataset_id === id));
    return json(route, 200, paginate(own, req.url(), state.pageSize));
  }
  if (/^\/versions\/[^/]+\/preview$/.test(rest)) return json(route, 200, { rows: state.previewRows });
  if (rest === '/imports') {
    if (method === 'POST') {
      if (state.importCap) return problem(route, 429, 'too_many_active_imports');
      state.keys.push(req.headers()['idempotency-key'] ?? '');
      state.created.push(body);
      const rec = importOf(state, id, {
        source: body.source as ImportRec['source'],
        status: 'awaiting_upload',
        base_version_id: (body.base_version_id as string | null) ?? null,
        params: (body.params ?? {}) as Record<string, string>,
      });
      return json(route, 201, { ...rec, upload_url: rec.source === 'upload' ? `${UPLOAD_HOST}/upload/${rec.id}` : null });
    }
    return json(route, 200, paginate(ofDataset(state.imports), req.url(), state.pageSize));
  }
  const im = rest.match(/^\/imports\/([^/]+)(\/.*)?$/);
  if (im) {
    const rec = state.imports.find((i) => i.id === im[1]);
    if (!rec) return problem(route, 404, 'not_found');
    const action = im[2] ?? '';
    if (action === '') {
      state.importGets[rec.id] = (state.importGets[rec.id] ?? 0) + 1;
      return json(route, 200, rec);
    }
    if (action === '/preview') return json(route, 200, { rows: state.previewRows });
    if (action === '/start') rec.status = 'queued';
    if (action === '/cancel') rec.status = 'cancelled';
    if (action === '/discard') rec.status = 'discarded';
    if (action === '/commit') {
      if (state.commitConflict) {
        rec.status = state.commitConflict;
        return problem(route, 409, 'invalid_import_state');
      }
      rec.status = 'succeeded';
      return json(route, 200, versionOf(state, id, rec.id));
    }
    return json(route, action === '/start' ? 202 : 200, rec);
  }
  return undefined;
}
