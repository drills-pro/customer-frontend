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
}
export interface OfferRec {
  from_sub: string;
  to_sub: string;
  step_down: boolean;
  created_at: string;
  expires_at: string;
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
  /** Bounds for a task from before bundles; the default values alone for a task trained by a bundle (as production sends). */
  hyperparameters: Record<'epochs' | 'batch_size' | 'image_size', { default: number; min: number; max: number } | number>;
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
  project_id: string;
  training_run_id: string;
  /** The one model version it serves. */
  model_version_id: string | null;
  rate_limit_per_minute: number;
  idempotency_key: string;
}
/** A console prediction as the try-it log lists it. */
export interface TestCallRec {
  id: string;
  status: string;
  request: unknown;
  response: unknown;
  error: { code: string; detail: string } | null;
  latency_ms: number | null;
  created_at: string;
}
/** A model version as GET /models lists it. */
export interface ModelRec {
  id: string;
  model_id: string;
  training_run_id: string;
  mlflow_model_name: string;
  mlflow_version: string;
  stage: 'None' | 'Staging' | 'Production' | 'Archived';
  customer_label: string;
  created_at: string;
  promotion_status: 'pending' | 'failed' | null;
  promotion_error: string | null;
  promotion_error_code: string | null;
}
/** What reached POST /v1/predict: the headers that name the model and project, and the body. */
export interface PredictCallRec {
  project: string | null;
  model: string | null;
  revision: string | null;
  body: unknown;
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
  /** Workspaces the user is not in yet: accepting an invite to one moves it into `workspaces` (so /v1/me lists it only after). */
  invitedTo: Workspace[];
  /** The workspace's one project, PROJECT; any other id answers 404. */
  project: ProjectRec;
  projectMembers: ProjectMemberRec[];
  /** The workspace's open ownership offer; its `status` is derived from `expires_at` against OFFER_NOW, as the API does. */
  offer: OfferRec | null;
  runs: RunRec[];
  deployments: DeploymentRec[];
  /** A deploy without acknowledge_risk=true answers 409 deploy_risk_unacknowledged (the run has no test split). */
  deployRisk: boolean;
  /** The Idempotency-Key and acknowledge_risk of each deploy that reached the backend, in order. */
  deployCalls: { key: string; acknowledge: boolean; versionId: string }[];
  /** The console predictions of the try-it log, newest first, as core-api lists them. */
  testCalls: TestCallRec[];
  /** Every call that reached POST /v1/predict, in order. */
  predictCalls: PredictCallRec[];
  /** The model versions of the project. A run gets one (registered at settle time) the first time its lineage is read. */
  models: ModelRec[];
  /** Each promote request that reached the backend: the version, the stage and acknowledge_risk. */
  promoteCalls: { versionId: string; stage: string; acknowledge: boolean }[];
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
  /** The epoch every run is on (training), or null before the first one. */
  epoch: number | null;
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
  invitedTo: [],
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
  },
  projectMembers: [{ user_sub: 'me', roles: ['project_admin'], created_at: '2026-10-02T00:00:00Z' }],
  offer: null,
  runs: [],
  deployments: [],
  deployRisk: false,
  deployCalls: [],
  testCalls: [],
  predictCalls: [],
  models: [],
  promoteCalls: [],
  failRuns: false,
  presets: [preset('small', 10, 32), preset('medium', 20, 16)],
  failPresets: null,
  failCancel: null,
  failCreates: [],
  runKeys: [],
  runBodies: [],
  epoch: null,
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
  Object.fromEntries(
    Object.entries(state.presets.find((p) => p.name === name)?.hyperparameters ?? {}).map(([k, v]) => [
      k,
      typeof v === 'number' ? v : v.default,
    ]),
  );

/** A preset of a task trained by a bundle: the same preset, its hyperparameters the default values only. */
export function bundlePreset(name: string, epochs: number, batch: number): PresetRec {
  return { ...preset(name, epochs, batch), hyperparameters: { epochs, batch_size: batch, image_size: 224 } };
}

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
  role === 'owner'
    ? ['tenant.admin', 'tenant.member.manage', 'tenant.delete', 'tenant.transfer_ownership', 'project.list']
    : ['project.list'];

export const DELETED_AT = '2026-11-18T00:00:00Z';
export const RESTORABLE_UNTIL = '2026-12-18T00:00:00Z';

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = (route: Route, status: number, body?: unknown) =>
  route.fulfill({
    status,
    headers: CORS,
    ...(body === undefined ? {} : { contentType: 'application/json', body: JSON.stringify(body) }),
  });

/** What the API reads as "now" for an offer's expiry (the offer's own dates are set against it by the tests). */
export const OFFER_NOW = '2026-11-18T00:00:00Z';
const withStatus = (o: OfferRec) => ({ ...o, status: o.expires_at > OFFER_NOW ? 'pending' : 'expired' });

/** GET, POST, DELETE of the workspace's one ownership offer and its :accept. The API shows an offer only to its two people and owners; the mock to everyone. */
function offerRoutes(route: Route, state: ApiState, method: string, path: string, body: Record<string, unknown>) {
  if (path.endsWith(':accept')) {
    if (!state.offer || state.offer.expires_at <= OFFER_NOW) return json(route, 404, { code: 'not_found' });
    const me = state.members.find((x) => x.user_sub === 'me');
    if (me) me.role = 'owner';
    const w = state.workspaces[0];
    w.role = 'owner';
    state.offer = null;
    return json(route, 200, { user_sub: 'me', role: 'owner' });
  }
  if (method === 'POST') {
    if (state.offer) return json(route, 409, { code: 'ownership_offer_pending' });
    state.offer = {
      from_sub: 'me',
      to_sub: String(body.to_sub),
      step_down: Boolean(body.step_down),
      created_at: OFFER_NOW,
      expires_at: '2026-11-25T00:00:00Z',
    };
    return json(route, 201, withStatus(state.offer));
  }
  if (!state.offer) return json(route, 404, { code: 'not_found' });
  if (method === 'DELETE') {
    state.offer = null;
    return json(route, 204);
  }
  return json(route, 200, withStatus(state.offer));
}

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
    if (path === '/v1/me/tenant-slug-available') {
      const slug = new URL(route.request().url()).searchParams.get('slug') ?? '';
      return json(route, 200, { slug, available: !state.workspaces.some((w) => w.slug === slug) });
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
    if (/^\/v1\/tenants\/[^/:]+\/ownership-offer(:accept)?$/.test(path)) return offerRoutes(route, state, method, path, body);
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
      const joining = state.invitedTo.findIndex((w) => w.id === tenantId);
      if (joining >= 0) state.workspaces.push(...state.invitedTo.splice(joining, 1));
      return tenantId ? json(route, 200, { tenant_id: tenantId, role: 'member' }) : json(route, 404, { code: 'not_found' });
    }
    if (path === '/v1/predict' && method === 'POST') return predictRoute(route, state, req);
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
export const deployment = (state: ApiState, status: string, trainingRunId: string = crypto.randomUUID()): DeploymentRec => {
  const d: DeploymentRec = {
    id: crypto.randomUUID(),
    status,
    route_prefix: '/p',
    created_at: NOW,
    project_id: PROJECT,
    training_run_id: trainingRunId,
    model_version_id: null,
    rate_limit_per_minute: 60,
    idempotency_key: crypto.randomUUID(),
  };
  state.deployments.push(d);
  return d;
};
const MODEL_NAME = 'shelf';
const MODEL_ID = 'dddddddd-0000-4000-8000-000000000004';
const LABELS = { None: 'internal only', Staging: 'candidate', Production: 'serving', Archived: 'retired' } as const;
/** A registered version of the project's one model; versions are numbered in the order they are made, a day apart. */
export const model = (state: ApiState, stage: ModelRec['stage'] = 'None', patch: Partial<ModelRec> = {}): ModelRec => {
  const n = state.models.length + 1;
  const m: ModelRec = {
    id: crypto.randomUUID(),
    model_id: MODEL_ID,
    training_run_id: crypto.randomUUID(),
    mlflow_model_name: MODEL_NAME,
    mlflow_version: String(n),
    stage,
    customer_label: LABELS[stage],
    created_at: new Date(Date.UTC(2026, 9, n)).toISOString(),
    promotion_status: null,
    promotion_error: null,
    promotion_error_code: null,
    ...patch,
  };
  state.models.push(m);
  return m;
};
/** What core-api does when a promotion settles: the version serves, the one that did goes back to Staging. */
export const settlePromotion = (state: ApiState, m: ModelRec) => {
  for (const o of state.models)
    if (o.model_id === m.model_id && o.stage === 'Production') Object.assign(o, { stage: 'Staging', customer_label: LABELS.Staging });
  Object.assign(m, {
    stage: 'Production',
    customer_label: LABELS.Production,
    promotion_status: null,
    promotion_error: null,
    promotion_error_code: null,
  });
};
/** The predict key a fresh deployment answers with, once. */
export const PREDICT_KEY = 'pk_e2e_once';
export const DEPLOYMENT_SCHEMA = {
  task_type: 'tabular-classification',
  model_id: 'dddddddd-0000-4000-8000-000000000004',
  model_revision: '3',
  input: { text: 'string' },
  output: { predictions: [{ class: 'string', probability: 'number' }] },
  snippets: { curl: 'curl -X POST', python: 'import requests', javascript: 'await fetch' },
};
export const TEST_RESPONSE = { predictions: [{ class: 'cat', probability: 0.9 }] };
const listItem = ({ id, status, route_prefix, created_at, model_version_id }: DeploymentRec) => ({
  id,
  status,
  route_prefix,
  created_at,
  model_version_id,
});
/** DeploymentDetail: everything but the key the mock replays creates by. */
const detail = (d: DeploymentRec) => ({
  ...listItem(d),
  project_id: d.project_id,
  training_run_id: d.training_run_id,
  rate_limit_per_minute: d.rate_limit_per_minute,
});

/** Deploying a model version (replayed by Idempotency-Key), one deployment and its moves, schema and test calls, and a run's lineage.
 * Returns undefined for any other path. */
function deploymentRoutes(route: Route, state: ApiState, method: string, path: string, req: ReturnType<Route['request']>) {
  const lineage = path.match(new RegExp(`^/v1/projects/${PROJECT}/training-runs/([^/]+)/lineage$`));
  if (lineage) {
    const r = state.runs.find((x) => x.id === lineage[1]);
    if (!r) return problem(route, 404, 'not_found');
    // core-api answers the run's newest deployment whatever its status, deleted and failed included.
    const d = state.deployments.findLast((x) => x.training_run_id === r.id);
    const v = state.models.find((x) => x.training_run_id === r.id) ?? model(state, 'None', { training_run_id: r.id });
    return json(route, 200, {
      training_run: r,
      dataset_version: null,
      model_version: { id: v.id, mlflow_model_name: v.mlflow_model_name, mlflow_version: v.mlflow_version, stage: v.stage },
      deployment: d ? { id: d.id, status: d.status, route_prefix: d.route_prefix } : null,
    });
  }
  if (path === `/v1/projects/${PROJECT}/deployments`) {
    if (method === 'GET') return json(route, 200, state.deployments.filter((d) => d.status !== 'deleted').map(listItem));
    const params = new URL(req.url()).searchParams;
    const key = req.headers()['idempotency-key'] ?? '';
    const acknowledge = params.get('acknowledge_risk') === 'true';
    const versionId = params.get('model_version_id') ?? '';
    state.deployCalls.push({ key, acknowledge, versionId });
    if (state.deployRisk && !acknowledge) return problem(route, 409, 'deploy_risk_unacknowledged');
    const version = state.models.find((v) => v.id === versionId);
    if (!version) return problem(route, 404, 'not_found');
    const same = state.deployments.find((d) => d.idempotency_key === key);
    const d = same ?? deployment(state, 'active', version.training_run_id);
    d.idempotency_key = key;
    d.model_version_id = version.id;
    return json(route, 202, {
      ...listItem(d),
      rate_limit_per_minute: d.rate_limit_per_minute,
      plan_tier: 'free',
      predict_key: PREDICT_KEY,
    });
  }
  const m = path.match(new RegExp(`^/v1/projects/${PROJECT}/deployments/([^/]+)(/stop|/start|/schema|/test-calls)?$`));
  if (!m) return undefined;
  const d = state.deployments.find((x) => x.id === m[1] && x.status !== 'deleted');
  if (!d) return problem(route, 404, 'not_found');
  switch (m[2] ?? '') {
    case '':
      if (method === 'DELETE') {
        d.status = 'deleted';
        return json(route, 204);
      }
      return json(route, 200, detail(d));
    case '/stop':
      if (d.status !== 'active') return problem(route, 409, 'invalid_deployment_transition');
      d.status = 'stopped';
      return json(route, 200, detail(d));
    case '/start':
      if (d.status !== 'stopped') return problem(route, 409, 'invalid_deployment_transition');
      d.status = 'active';
      return json(route, 200, detail(d));
    case '/schema':
      return json(route, 200, DEPLOYMENT_SCHEMA);
    case '/test-calls':
      return json(route, 200, state.testCalls);
  }
  return undefined;
}

/** POST /v1/predict from the console: stored as a console prediction the try-it log lists. */
function predictRoute(route: Route, state: ApiState, req: ReturnType<Route['request']>) {
  const h = req.headers();
  const body = req.postDataJSON() as { input?: unknown };
  state.predictCalls.push({
    project: h['x-project-id'] ?? null,
    model: h['x-model-id'] ?? null,
    revision: h['x-model-revision'] ?? null,
    body,
  });
  if (!state.deployments.some((d) => d.status === 'active')) return problem(route, 409, 'deployment_not_active');
  const call: TestCallRec = {
    id: `pred_${state.testCalls.length + 1}`,
    status: 'completed',
    request: { input: body.input },
    response: TEST_RESPONSE,
    error: null,
    latency_ms: 12,
    created_at: NOW,
  };
  state.testCalls.unshift(call);
  return json(route, 200, {
    id: call.id,
    status: 'completed',
    model: { id: h['x-model-id'], revision: h['x-model-revision'] },
    output: TEST_RESPONSE,
    usage: { latency_ms: 12 },
    metadata: {},
    error: null,
    expired: false,
    created_at: NOW,
  });
}

/** The model versions list and a promote: Production answers 202 with the version pending, and the test settles it (`settlePromotion`)
 * or fails it. Returns undefined for any other path. */
function modelRoutes(route: Route, state: ApiState, method: string, path: string, req: ReturnType<Route['request']>) {
  if (path === `/v1/projects/${PROJECT}/models` && method === 'GET') return json(route, 200, [...state.models].reverse());
  const m = path.match(new RegExp(`^/v1/projects/${PROJECT}/models/([^/]+)/promote$`));
  if (!m) return undefined;
  const v = state.models.find((x) => x.id === m[1]);
  if (!v) return problem(route, 404, 'not_found');
  const params = new URL(req.url()).searchParams;
  const stage = params.get('stage') as ModelRec['stage'];
  state.promoteCalls.push({ versionId: v.id, stage, acknowledge: params.get('acknowledge_risk') === 'true' });
  if (stage === 'Production') {
    Object.assign(v, { promotion_status: 'pending', promotion_error: null, promotion_error_code: null });
    return json(route, 202, v);
  }
  if (v.stage === 'Production') return problem(route, 409, 'live_version');
  Object.assign(v, { stage, customer_label: LABELS[stage] });
  return json(route, 200, v);
}

/** PUT (replace roles) and DELETE of one project member; removing the only project_admin is the 409 `last_project_admin`, as for a non-owner caller. */
function projectMemberRoute(route: Route, state: ApiState, method: string, sub: string, body: { roles?: string[] }) {
  const admins = state.projectMembers.filter((x) => x.roles.includes('project_admin'));
  const person = state.projectMembers.find((x) => x.user_sub === sub);
  if (method === 'PUT') {
    const roles = body.roles ?? [];
    if (person && admins.length === 1 && admins[0] === person && !roles.includes('project_admin'))
      return problem(route, 409, 'last_project_admin');
    if (person) person.roles = roles;
    else state.projectMembers.push({ user_sub: sub, roles, created_at: '2026-10-03T00:00:00Z' });
    return json(route, 200, { project_id: PROJECT, user_sub: sub, roles });
  }
  if (!person) return problem(route, 404, 'not_found');
  if (admins.length === 1 && admins[0] === person) return problem(route, 409, 'last_project_admin');
  state.projectMembers = state.projectMembers.filter((x) => x !== person);
  return json(route, 204);
}

/** /v1/projects and /v1/projects/{PROJECT} with its members, runs and deployments. Returns undefined when the path is not one of them. */
function projectRoutes(route: Route, state: ApiState, method: string, path: string, req: ReturnType<Route['request']>) {
  if (path === '/v1/projects' && method === 'GET') {
    const { id, name, status, team_id, task_type, created_at } = state.project;
    const counts = {
      datasets: state.datasets.filter((d) => !d.deleted_at).length,
      models: state.models.length,
      deployments: state.deployments.filter((d) => d.status !== 'deleted').length,
    };
    const live = status !== 'pending_delete' ? [{ id, name, status, team_id, task_type, created_at, ...counts }] : [];
    return json(route, 200, paginate(live, req.url(), state.pageSize));
  }
  if (path === '/v1/projects/trash') {
    const { id, name, status, created_at } = state.project;
    const gone = status === 'pending_delete' ? [{ id, name, created_at, deleted_at: DELETED_AT, restorable_until: RESTORABLE_UNTIL }] : [];
    return json(route, 200, paginate(gone, req.url(), state.pageSize));
  }
  if (path === `/v1/projects/${PROJECT}:restore` && method === 'POST') {
    state.project.status = 'active';
    return json(route, 200, state.project);
  }
  const mr = modelRoutes(route, state, method, path, req);
  if (mr) return mr;
  const dr = deploymentRoutes(route, state, method, path, req);
  if (dr) return dr;
  const tr = trainingRoutes(route, state, method, path, req);
  if (tr) return tr;
  const pm = path.match(new RegExp(`^/v1/projects/${PROJECT}/members/(.+)$`));
  if (pm) return projectMemberRoute(route, state, method, decodeURIComponent(pm[1]), (req.postDataJSON() ?? {}) as { roles?: string[] });
  const m = path.match(/^\/v1\/projects\/([^/:]+)(\/[a-z-]+)?$/);
  if (!m) return undefined;
  if (m[1] !== PROJECT) return problem(route, 404, 'not_found');
  switch (m[2] ?? '') {
    case '': {
      if (method === 'DELETE') {
        state.project.status = 'pending_delete';
        return json(route, 202, { id: PROJECT, status: 'pending_delete', deleted_at: DELETED_AT, restorable_until: RESTORABLE_UNTIL });
      }
      const status = new URL(req.url()).searchParams.get('status');
      if (method === 'PATCH' && status) state.project.status = status as ProjectRec['status'];
      return json(route, 200, state.project);
    }
    case '/members':
      return json(route, 200, state.projectMembers);
    case '/training-runs':
      return state.failRuns ? problem(route, 500, 'internal') : json(route, 200, state.runs);
  }
  return undefined;
}

/** Presets, creating a run (replayed by Idempotency-Key, like core-api), one run, its steps and cancel. Returns undefined for any other path. */
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
  const m = path.match(new RegExp(`^/v1/projects/${PROJECT}/training-runs/([^/]+)(/steps|/cancel|/card)?$`));
  if (!m) return undefined;
  const r = state.runs.find((x) => x.id === m[1]);
  if (!r) return problem(route, 404, 'not_found');
  if (m[2] === '/card') {
    return json(route, 200, {
      training_run_id: r.id,
      task: 'image-classification',
      preset: 'small',
      base_model: { repo_id: 'org/model', revision: 'a'.repeat(40), license: null },
      near_duplicates: 0,
      metrics: r.metrics ?? {},
      dataset_version: null,
      test_dataset_version: null,
      has_test_split: true,
      model_version: null,
    });
  }
  if (m[2] === '/steps') {
    const training = r.status === 'running' ? 'active' : r.status === 'submitted' ? 'pending' : 'done';
    const finished = { succeeded: 'done', failed: 'failed', cancelled: 'cancelled' }[r.status] ?? 'pending';
    const epoch = state.epoch;
    return json(route, 200, {
      status: r.status,
      steps: [
        { key: 'queued', state: r.status === 'submitted' ? 'active' : 'done' },
        { key: 'training', state: training, epoch, epochs: epoch === null ? null : 10 },
        { key: 'finished', state: finished, failure: r.status === 'failed' ? 'internal' : null },
      ],
    });
  }
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
  if (path === '/v1/datasets/trash') {
    const gone = state.datasets
      .filter((d) => d.deleted_at)
      .map((d) => ({
        id: d.id,
        name: d.name,
        created_at: d.created_at,
        deleted_at: d.deleted_at,
        project_id: PROJECT,
        project_name: state.project.name,
        restorable_until: RESTORABLE_UNTIL,
      }));
    return json(route, 200, paginate(gone, req.url(), state.pageSize));
  }
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
    return json(route, method === 'DELETE' ? 202 : 200, { ...d, restorable_until: d.deleted_at ? RESTORABLE_UNTIL : null });
  }
  if (rest === ':restore') {
    d.deleted_at = null;
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
