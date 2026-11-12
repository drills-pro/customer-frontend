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
export interface ProjectRec {
  id: string;
  name: string;
  status: 'active' | 'archived' | 'pending_delete';
  team_id: string | null;
  task_type: string;
  created_at: string;
  default_test_dataset_id: string | null;
  settings: Record<string, unknown>;
  visibility: 'internal' | 'private';
  default_access: 'read' | 'edit';
  publish_project_metadata: boolean;
}
export interface ProjectMemberRec {
  user_sub: string;
  roles: string[];
  created_at: string;
}
export interface RunRec {
  id: string;
  status: string;
  dataset_ref: string;
  dataset_id: string | null;
  dataset_version_id: string | null;
  preset: string | null;
  idempotency_key: string;
  ray_job_id: string;
  mlflow_run_id: string | null;
  config: unknown;
  metrics: unknown;
  created_at: string;
  completed_at: string | null;
  /** Epochs the trainer reported (detail only in core-api; the mock sends it everywhere). */
  progress: { latest: ProgressRec; history: ProgressRec[] } | null;
  /** The job's report.json once it ended. */
  report: unknown;
}
export interface ProgressRec {
  seq: number;
  epoch: number;
  epochs: number;
  metrics: Record<string, number>;
  created_at: string;
}
export interface PresetRec {
  name: string;
  base_model: { repo_id: string; revision: string };
  learning_rate: number;
  cpu: number;
  memory_bytes: number;
  gpu: number;
  max_runtime_s: number;
  hyperparameters: Record<'epochs' | 'batch_size' | 'image_size', { default: number; min: number; max: number }>;
  vram_gb: number | null;
  lr_schedule: 'constant' | 'cosine';
  warmup_fraction: number;
  augmentation: 'none' | 'flip' | 'flip_crop';
  early_stopping_patience: number;
}
/** One reported epoch per entry of `metrics`, as core-api's RunProgress. */
export const progressOf = (epochs: number, metrics: Record<string, number>[]): RunRec['progress'] => {
  const history = metrics.map((m, i) => ({ seq: i, epoch: i + 1, epochs, metrics: m, created_at: NOW }));
  return history.length ? { latest: history[history.length - 1], history } : null;
};
/** A problem the next call answers with. */
export interface Fail {
  status: number;
  code: string;
}
export interface DeploymentRec {
  id: string;
  status: string;
  route_prefix: string;
  created_at: string;
}
export interface PreviewRow {
  data: Record<string, unknown>;
  url?: string;
}
/** What the fake backend knows. Each test gets its own copy and may change it before it navigates. */
export interface ApiState {
  emailVerified: boolean;
  /** How many verification mails were asked for (POST /v1/me/email-verification). */
  verificationMails: number;
  workspaces: Workspace[];
  members: Member[];
  invitations: Invitation[];
  /** Creating an invitation mails the link (production) instead of handing it back (mail off, dev). */
  mailInvites: boolean;
  /** Tokens `POST /v1/invitations/{token}:accept` accepts, mapped to the workspace they join. */
  acceptable: Record<string, string>;
  /** The workspace's one project, PROJECT; any other id answers 404. */
  project: ProjectRec;
  projectMembers: ProjectMemberRec[];
  runs: RunRec[];
  deployments: DeploymentRec[];
  /** The training-runs list answers 500. */
  failRuns: boolean;
  /** What the training-presets list answers with: the project's task type's presets. */
  presets: PresetRec[];
  /** The training-presets list answers this problem instead. */
  failPresets: Fail | null;
  /** The next run cancel answers this problem instead. */
  failCancel: Fail | null;
  /** The next training-run creates answer these problems, one each, in order. */
  failCreates: Fail[];
  /** The Idempotency-Key and body of each training-run create that reached the backend, in order. */
  runKeys: string[];
  runBodies: unknown[];
  /** Every run's log tail. */
  logs: string;
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
  verificationMails: 0,
  workspaces: [workspace(ACME, 'Acme Vision', ACME_SLUG, 'owner'), workspace(SIDE, 'Side Project', SIDE_SLUG, 'member')],
  members: [{ user_sub: 'me', role: 'owner', created_at: '2026-10-01T00:00:00Z', email: 'dev@example.com', display_name: 'Dev User' }],
  invitations: [],
  mailInvites: false,
  acceptable: { good: SIDE },
  project: {
    id: PROJECT,
    name: 'Shelf vision',
    status: 'active',
    team_id: null,
    task_type: 'tabular-classification',
    created_at: '2026-10-02T00:00:00Z',
    default_test_dataset_id: null,
    settings: {},
    visibility: 'internal',
    default_access: 'read',
    publish_project_metadata: false,
  },
  projectMembers: [{ user_sub: 'me', roles: ['project_admin'], created_at: '2026-10-02T00:00:00Z' }],
  runs: [],
  deployments: [],
  failRuns: false,
  presets: [preset('small', 10, 32), preset('medium', 20, 16)],
  failPresets: null,
  failCancel: null,
  failCreates: [],
  runKeys: [],
  runBodies: [],
  logs: '',
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
const presetDefaults = (state: ApiState, name: string): Record<string, number> =>
  Object.fromEntries(Object.entries(state.presets.find((p) => p.name === name)?.hyperparameters ?? {}).map(([k, v]) => [k, v.default]));

function preset(name: string, epochs: number, batch: number): PresetRec {
  return {
    name,
    base_model: { repo_id: `facebook/convnext-${name}-224`, revision: 'a'.repeat(40) },
    learning_rate: 1e-4,
    cpu: 4,
    memory_bytes: 8 * 1024 ** 3,
    gpu: 0,
    max_runtime_s: 7200,
    hyperparameters: {
      epochs: { default: epochs, min: 1, max: 100 },
      batch_size: { default: batch, min: 1, max: 256 },
      image_size: { default: 224, min: 64, max: 512 },
    },
    vram_gb: null,
    lr_schedule: 'cosine',
    warmup_fraction: 0.05,
    augmentation: 'flip_crop',
    early_stopping_patience: 3,
  };
}
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
    if (path === '/v1/me/email-verification') {
      if (method === 'GET') return json(route, 200, { verified: state.emailVerified });
      if (state.emailVerified) return json(route, 409, { code: 'email_already_verified' });
      state.verificationMails += 1;
      return json(route, 204);
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
      if (state.mailInvites) return json(route, 201, { ...invitation, email_sent: true, token: null });
      return json(route, 201, { ...invitation, email_sent: false, token: `tok_${state.invitations.length}` });
    }
    if ((m = path.match(/^\/v1\/invitations\/(.+):accept$/))) {
      const tenantId = state.acceptable[decodeURIComponent(m[1])];
      return tenantId ? json(route, 200, { tenant_id: tenantId, role: 'member' }) : json(route, 404, { code: 'not_found' });
    }
    const ds = datasetRoutes(route, state, method, path, req);
    if (ds) return ds;
    const pr = projectRoutes(route, state, method, path, req);
    if (pr) return pr;
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

export const run = (state: ApiState, status: string, patch: Partial<RunRec> = {}): RunRec => {
  const r: RunRec = {
    id: crypto.randomUUID(),
    status,
    dataset_ref: 'ref',
    dataset_id: null,
    dataset_version_id: null,
    preset: 'small',
    idempotency_key: crypto.randomUUID(),
    ray_job_id: 'job',
    mlflow_run_id: null,
    config: {},
    metrics: {},
    created_at: NOW,
    completed_at: null,
    progress: null,
    report: null,
    ...patch,
  };
  state.runs.push(r);
  return r;
};
export const deployment = (state: ApiState, status: string): DeploymentRec => {
  const d: DeploymentRec = { id: crypto.randomUUID(), status, route_prefix: '/p', created_at: NOW };
  state.deployments.push(d);
  return d;
};

/** /v1/projects and /v1/projects/{PROJECT} with its members, runs and deployments. Returns undefined when the path is not one of them. */
function projectRoutes(route: Route, state: ApiState, method: string, path: string, req: ReturnType<Route['request']>) {
  if (path === '/v1/projects' && method === 'GET') {
    const { id, name, status, team_id, task_type, created_at } = state.project;
    return json(route, 200, paginate([{ id, name, status, team_id, task_type, created_at }], req.url(), state.pageSize));
  }
  const tr = trainingRoutes(route, state, method, path, req);
  if (tr) return tr;
  const m = path.match(/^\/v1\/projects\/([^/:]+)(\/[a-z-]+)?$/);
  if (!m) return undefined;
  if (m[1] !== PROJECT) return problem(route, 404, 'not_found');
  switch (m[2] ?? '') {
    case '': {
      const status = new URL(req.url()).searchParams.get('status');
      if (method === 'PATCH' && status) state.project.status = status as ProjectRec['status'];
      return json(route, 200, state.project);
    }
    case '/members':
      return json(route, 200, state.projectMembers);
    case '/training-runs':
      return state.failRuns ? problem(route, 500, 'internal') : json(route, 200, state.runs);
    case '/deployments':
      return json(route, 200, state.deployments);
  }
  return undefined;
}

/** Presets, creating a run (replayed by Idempotency-Key, like core-api), one run, its logs and cancel. Returns undefined for any other path. */
function trainingRoutes(route: Route, state: ApiState, method: string, path: string, req: ReturnType<Route['request']>) {
  if (path === `/v1/projects/${PROJECT}/training-presets`) {
    return state.failPresets ? problem(route, state.failPresets.status, state.failPresets.code) : json(route, 200, state.presets);
  }
  if (path === `/v1/projects/${PROJECT}/training-runs` && method === 'POST') {
    const key = req.headers()['idempotency-key'] ?? '';
    const body = (req.postDataJSON() ?? {}) as { dataset_version_id: string; preset: string; hyperparameters?: Record<string, number> };
    state.runKeys.push(key);
    state.runBodies.push(body);
    const fail = state.failCreates.shift();
    if (fail) return problem(route, fail.status, fail.code);
    const same = state.runs.find((r) => r.idempotency_key === key);
    if (same) return json(route, 202, same);
    const version = state.versions.find((v) => v.id === body.dataset_version_id);
    const datasetId = state.imports.find((i) => i.id === version?.import_id)?.dataset_id ?? null;
    return json(
      route,
      202,
      run(state, 'submitted', {
        idempotency_key: key,
        preset: body.preset,
        // core-api keeps the resolved hyperparameters: the preset's defaults where the request is silent.
        config: { ...presetDefaults(state, body.preset), ...body.hyperparameters },
        dataset_version_id: body.dataset_version_id,
        dataset_id: datasetId,
      }),
    );
  }
  const m = path.match(new RegExp(`^/v1/projects/${PROJECT}/training-runs/([^/]+)(/logs|/cancel)?$`));
  if (!m) return undefined;
  const r = state.runs.find((x) => x.id === m[1]);
  if (!r) return problem(route, 404, 'not_found');
  if (m[2] === '/logs') return json(route, 200, { status: r.status, logs: state.logs });
  if (m[2] === '/cancel') {
    const fail = state.failCancel;
    state.failCancel = null;
    if (fail) return problem(route, fail.status, fail.code);
    if (r.status !== 'submitted' && r.status !== 'running') return problem(route, 409, 'invalid_training_state');
    r.status = 'cancelled';
    r.completed_at = NOW;
  }
  return json(route, 200, r);
}

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
