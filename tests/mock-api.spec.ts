import { expect, test } from '@playwright/test';
import { MOCK_DB_STORAGE_KEY, handleMockRequest, mirrorProjects, reloadMockDb } from '../src/api/mock';

/**
 * The mock server, exercised without a browser: these run in Node against an
 * in-memory stand-in for `localStorage`. Retired routes (core-api serves them;
 * src/api/mock/router.ts) are included, as with `VITE_API_MOCK=all`.
 */
function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

async function call<T = any>(method: string, path: string, body?: unknown) {
  const response = await handleMockRequest(method, path, body === undefined ? undefined : JSON.stringify(body), 0, {
    includeRetired: true,
  });
  if (!response) throw new Error(`No mock route for ${method} ${path}`);
  const text = await response.text();
  return {
    status: response.status,
    data: (text ? JSON.parse(text) : undefined) as T,
  };
}

const runRequest = {
  dataset_id: 'retail-train',
  architecture_id: 'resnet50',
  config: {
    epochs: 10,
    batch_size: 32,
    split: { train: 80, validation: 10, test: 10 },
    learning_rate: 0.001,
    scheduler: 'cosine',
    augmentations: [],
    early_stopping: true,
    instance_id: 'a10g-1',
    spot: false,
  },
};

test.beforeEach(() => reloadMockDb(memoryStorage()));

test('a path without a handler is left to the network', async () => {
  expect(await handleMockRequest('GET', '/v1/dashboard')).toBeUndefined();
  expect(await handleMockRequest('GET', '/v1/nope')).toBeUndefined();
});

test('a retired route goes to core-api unless retired routes are included', async () => {
  expect(await handleMockRequest('GET', '/v1/organizations')).toBeUndefined();
  expect(
    await handleMockRequest('GET', '/v1/organizations', undefined, 0, {
      includeRetired: true,
    }),
  ).toBeDefined();
  // Billing is still mocked.
  expect(await handleMockRequest('GET', '/v1/organizations/acme/billing')).toBeDefined();
});

test('a project copied from core-api takes core-api catalog ids', async () => {
  mirrorProjects([
    {
      id: '33333333-3333-3333-3333-333333333333',
      organization_id: '11111111-1111-1111-1111-111111111111',
      name: 'Live',
      description: '',
      task_type: 'image_classification',
      status: 'draft',
      color: '#6366f1',
      created_at: '2026-10-15T00:00:00.000Z',
      updated_at: '2026-10-15T00:00:00.000Z',
      dataset_count: 0,
      model_count: 0,
      deployment_count: 0,
    },
  ]);
  const base = '/v1/projects/33333333-3333-3333-3333-333333333333';
  expect((await call('GET', `${base}/datasets`)).data).toEqual([]);
  const created = await call('POST', `${base}/datasets`, {
    name: 'Shelves',
    split: 'train',
    files: [],
  });
  expect(created.status).toBe(200);
  const estimate = await call('POST', `${base}/training-runs/estimate`, {
    dataset_id: created.data.id,
    architecture_id: 'yolo11n-cls',
    epochs: 10,
    batch_size: 32,
    instance_id: 'gpu-1',
    spot: false,
  });
  expect(estimate.status).toBe(200);
  // The mock's own projects still refuse ids their catalogue lacks.
  const seeded = await call('POST', '/v1/projects/retail/training-runs/estimate', {
    dataset_id: 'retail-train',
    architecture_id: 'yolo11n-cls',
    epochs: 10,
    batch_size: 32,
    instance_id: 'gpu-1',
    spot: false,
  });
  expect(seeded.status).toBe(422);
});

test('answers lists in wire format and scopes them by organization', async () => {
  const acme = await call('GET', '/v1/projects?organization_id=acme');
  expect(acme.status).toBe(200);
  expect(acme.data.map((item: { id: string }) => item.id)).toEqual(['retail', 'support', 'churn', 'defect']);
  expect(acme.data[0]).toMatchObject({
    organization_id: 'acme',
    task_type: 'image_classification',
    status: 'active',
    dataset_count: 4,
  });

  const organizations = await call('GET', '/v1/organizations');
  expect(organizations.data[0]).toMatchObject({
    id: 'acme',
    your_role: 'admin',
    summary: { projects: 4, members: 24, invited: 2, deployments: 5 },
    limits: { seats: 30 },
  });
});

test('a missing record answers 404 with a detail, like core-api', async () => {
  const missing = await call('GET', '/v1/projects/does-not-exist');
  expect(missing).toEqual({
    status: 404,
    data: { detail: 'Project not found' },
  });

  // A record that exists, asked for under the wrong project.
  const wrongParent = await call('GET', '/v1/projects/support/datasets/retail-train');
  expect(wrongParent.status).toBe(404);
});

test('the more specific of two matching routes wins', async () => {
  const estimate = await call('POST', '/v1/projects/retail/training-runs/estimate', {
    dataset_id: 'retail-train',
    architecture_id: 'resnet50',
    epochs: 30,
    batch_size: 32,
    instance_id: 'a10g-1',
    spot: false,
  });
  expect(estimate.status).toBe(200);
  expect(estimate.data.hours).toBeCloseTo(1.064, 3);
  expect(estimate.data.cost_usd).toBeCloseTo(0.798, 3);
});

test('creating a project rejects a duplicate name and seeds a template dataset', async () => {
  const input = {
    organization_id: 'acme',
    name: 'Shelf Audit',
    description: '',
    task_type: 'image_classification',
    region: 'us-east-1',
    visibility: 'organization',
    start_method: 'template',
    template_id: 'retail-shelf-audit',
  };
  const created = await call('POST', '/v1/projects', input);
  expect(created.data).toMatchObject({
    id: 'shelf-audit',
    status: 'draft',
    dataset_count: 1,
    pipeline: { runs: 0, complete_through: 2 },
  });
  const datasets = await call('GET', '/v1/projects/shelf-audit/datasets');
  expect(datasets.data).toHaveLength(1);
  expect(datasets.data[0]).toMatchObject({
    name: 'retail-shelf-sample',
    status: 'ready',
    size_bytes: 180_000_000,
  });

  const duplicate = await call('POST', '/v1/projects', {
    ...input,
    name: ' retail vision ',
  });
  expect(duplicate.status).toBe(409);
});

test('a run advances from its start time and freezes when cancelled', async () => {
  const started = await call('POST', '/v1/projects/retail/training-runs', runRequest);
  expect(started.data).toMatchObject({
    name: 'resnet50-2',
    architecture: 'ResNet-50',
    status: 'running',
    progress: 0,
  });
  expect(started.data.id).toMatch(/^run-[a-z0-9]+$/);

  const path = `/v1/projects/retail/training-runs/${started.data.id}`;
  const stopped = await call('POST', `${path}/cancel`);
  expect(stopped.data).toMatchObject({ status: 'stopped', eta_seconds: null });

  const logs = await call('GET', `${path}/logs?level=warn`);
  expect(logs.data).toEqual([{ level: 'warn', message: 'Run stopped by Alex Rivera.' }]);
});

test('created and changed records survive a reload; seeds stay out of storage', async () => {
  const storage = memoryStorage();
  reloadMockDb(storage);

  const started = await call('POST', '/v1/projects/retail/training-runs', runRequest);
  await call('PATCH', '/v1/organizations/acme', { description: 'Edited' });
  await call('DELETE', '/v1/projects/churn');

  const saved = JSON.parse(storage.getItem(MOCK_DB_STORAGE_KEY) ?? '{}');
  expect(saved.training_runs.records).toHaveLength(1);
  // The project the run touched is the only stored project.
  expect(saved.projects.records.map((item: { id: string }) => item.id)).toEqual(['retail']);
  expect(saved.projects.deleted).toEqual(['churn']);

  reloadMockDb();
  const runs = await call('GET', '/v1/projects/retail/training-runs');
  expect(runs.data.map((run: { id: string }) => run.id)).toEqual([started.data.id, 't1']);
  const acme = await call('GET', '/v1/organizations/acme');
  expect(acme.data.description).toBe('Edited');
  expect((await call('GET', '/v1/projects/churn')).status).toBe(404);
});

test('a corrupt stored record is dropped on its own', async () => {
  const valid = (await call('POST', '/v1/projects/retail/training-runs', runRequest)).data;
  reloadMockDb(
    memoryStorage({
      [MOCK_DB_STORAGE_KEY]: JSON.stringify({
        training_runs: {
          records: [
            { id: 'incomplete-run', project_id: 'retail' },
            { ...valid, id: 'run-out-of-range', progress: 400 },
            { ...valid, id: 'run-kept' },
          ],
          deleted: [],
        },
      }),
    }),
  );
  const runs = await call('GET', '/v1/projects/retail/training-runs');
  expect(runs.data.map((run: { id: string }) => run.id)).toEqual(['run-kept', 't1']);
});

test('unreadable storage falls back to the seed, and a failing write is survivable', async () => {
  reloadMockDb(memoryStorage({ [MOCK_DB_STORAGE_KEY]: '{broken' }));
  expect((await call('GET', '/v1/organizations')).data).toHaveLength(3);

  reloadMockDb({
    getItem: () => {
      throw new DOMException('blocked', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('quota', 'QuotaExceededError');
    },
  });
  const created = await call('POST', '/v1/organizations', {
    name: 'In Memory',
    slug: 'in-memory',
    plan: 'team',
    color: '#6366f1',
  });
  expect(created.status).toBe(200);
  expect((await call('GET', '/v1/organizations')).data).toHaveLength(4);
});

test('organization rules: taken slugs, owner-only delete, invitations', async () => {
  const taken = await call('POST', '/v1/organizations', {
    name: 'Copy',
    slug: 'acme-ai',
    plan: 'team',
    color: '#6366f1',
  });
  expect(taken).toEqual({
    status: 409,
    data: { detail: 'That URL is already taken.' },
  });
  expect((await call('DELETE', '/v1/organizations/acme')).status).toBe(403);

  const invited = await call('POST', '/v1/organizations/acme/invitations', {
    emails: ['new.person@acme.ai'],
    role: 'viewer',
  });
  expect(invited.data[0]).toMatchObject({
    email: 'new.person@acme.ai',
    status: 'invited',
    last_active_at: null,
  });

  const accepted = await call('POST', '/v1/invitations/invite-globex/accept');
  expect(accepted.data).toMatchObject({ id: 'globex', your_role: 'member' });
  expect((await call('GET', '/v1/invitations')).data).toEqual([]);
});
