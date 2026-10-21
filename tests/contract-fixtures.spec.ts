// Must load before the mock: it fixes the clock and the random ids.
import { FIXED_NOW, resetDeterminism } from './contract/deterministic';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { handleMockRequest, reloadMockDb } from '../src/api/mock';
import { registeredRoutes } from '../src/api/mock/router';
import { members, organizations } from '../src/api/mock/store';

/**
 * The mock's answers, recorded as core-api's contract fixtures
 * (core-api/tests/contract/<area>.json). core-api's pytest compares its own
 * answers with them by shape (core-api/tests/test_contract.py).
 *
 * Every request runs on a freshly seeded mock, so no request depends on
 * another. Run with UPDATE_CONTRACT=1 (`pnpm contract:export`) to rewrite
 * the fixtures; without it, a stale fixture fails.
 *
 * When core-api takes an endpoint live and its mock route is deleted, keep
 * its request here: it goes on answering from the committed fixture.
 */

type ContractRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  /** Puts the seed in the state this request needs. */
  setup?: () => void;
};

const FIXTURE_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../core-api/tests/contract');

const FIXED_ISO = new Date(FIXED_NOW).toISOString();

const datasets = '/v1/projects/retail/datasets';
const runs = '/v1/projects/retail/training-runs';
const models = '/v1/projects/retail/models';
const deployments = '/v1/projects/retail/deployments';

const runConfig = {
  epochs: 10,
  batch_size: 32,
  split: { train: 80, validation: 10, test: 10 },
  learning_rate: 0.001,
  scheduler: 'cosine',
  augmentations: [],
  early_stopping: true,
  instance_id: 'a10g-1',
  spot: false,
};

const newProject = {
  organization_id: 'acme',
  name: 'Shelf Audit',
  description: '',
  task_type: 'image_classification',
  region: 'us-east-1',
  visibility: 'organization',
  start_method: 'template',
  template_id: 'retail-shelf-audit',
};

const newOrganization = {
  name: 'Contract Labs',
  slug: 'contract-labs',
  plan: 'team',
  color: '#6366f1',
};

const REQUESTS: Record<string, ContractRequest[]> = {
  organizations: [
    { method: 'GET', path: '/v1/organizations' },
    { method: 'POST', path: '/v1/organizations', body: newOrganization },
    {
      method: 'POST',
      path: '/v1/organizations',
      body: { ...newOrganization, slug: 'acme-ai' },
    },
    { method: 'GET', path: '/v1/organizations/acme' },
    { method: 'GET', path: '/v1/organizations/missing' },
    {
      method: 'PATCH',
      path: '/v1/organizations/acme',
      body: { description: 'Edited' },
    },
    { method: 'DELETE', path: '/v1/organizations/solo' },
    { method: 'POST', path: '/v1/organizations/northwind/leave' },
    {
      method: 'POST',
      path: '/v1/organizations/solo/transfer-ownership',
      body: { member_id: 'solo-member-0' },
      // The seeded sandbox has no one but you to hand it to.
      setup: () =>
        members.put({
          id: 'solo-member-0',
          organization_id: 'solo',
          name: 'Sam Cole',
          email: 'sam@sandbox.dev',
          color: '#10b981',
          role: 'member',
          status: 'active',
          joined_at: FIXED_ISO,
          last_active_at: null,
          is_you: false,
        }),
    },
    { method: 'GET', path: '/v1/organizations/acme/members' },
    {
      method: 'POST',
      path: '/v1/organizations/acme/invitations',
      body: { emails: ['new.person@acme.ai'], role: 'member' },
    },
    {
      method: 'PATCH',
      path: '/v1/organizations/acme/members/acme-member-2',
      body: { role: 'viewer' },
    },
    {
      method: 'DELETE',
      path: '/v1/organizations/acme/members/acme-member-2',
    },
    {
      method: 'POST',
      path: '/v1/organizations/acme/invitations/acme-member-24/resend',
    },
    { method: 'GET', path: '/v1/invitations' },
    { method: 'POST', path: '/v1/invitations/invite-globex/accept' },
    { method: 'POST', path: '/v1/invitations/invite-globex/decline' },
    { method: 'GET', path: '/v1/organizations/acme/billing' },
    { method: 'GET', path: '/v1/organizations/acme/invoices' },
    { method: 'GET', path: '/v1/search?organization_id=acme&q=retail' },
  ],
  catalog: [
    { method: 'GET', path: '/v1/catalog/task-types' },
    { method: 'GET', path: '/v1/catalog/regions' },
    {
      method: 'GET',
      path: '/v1/catalog/project-templates?task_type=image_classification',
    },
    {
      method: 'GET',
      path: '/v1/catalog/architectures?task_type=image_classification',
    },
    { method: 'GET', path: '/v1/catalog/compute-options?purpose=training' },
    { method: 'GET', path: '/v1/catalog/compute-options?purpose=serving' },
    { method: 'GET', path: '/v1/catalog/plans' },
  ],
  projects: [
    { method: 'GET', path: '/v1/projects?organization_id=acme' },
    { method: 'POST', path: '/v1/projects', body: newProject },
    {
      method: 'POST',
      path: '/v1/projects',
      body: { ...newProject, name: ' retail vision ' },
    },
    { method: 'GET', path: '/v1/projects/retail' },
    { method: 'GET', path: '/v1/projects/missing' },
    {
      method: 'PATCH',
      path: '/v1/projects/retail',
      body: { description: 'Edited' },
    },
    {
      method: 'PATCH',
      path: '/v1/projects/retail/visibility',
      body: { visibility: 'private' },
    },
    { method: 'POST', path: '/v1/projects/retail/archive' },
    { method: 'POST', path: '/v1/projects/demand/unarchive' },
    {
      method: 'POST',
      path: '/v1/projects/churn/transfer',
      body: { organization_id: 'northwind' },
    },
    { method: 'DELETE', path: '/v1/projects/churn' },
    { method: 'GET', path: '/v1/projects/retail/usage' },
    { method: 'GET', path: '/v1/projects/retail/members' },
    {
      method: 'POST',
      path: '/v1/projects/retail/invitations',
      body: { email: 'new.person@acme.ai', role: 'viewer' },
    },
    {
      method: 'PUT',
      path: '/v1/projects/retail/members/sam-cole',
      body: { role: 'editor' },
    },
    { method: 'DELETE', path: '/v1/projects/retail/members/sam-cole' },
    { method: 'GET', path: '/v1/projects/retail/integrations' },
    {
      method: 'PUT',
      path: '/v1/projects/retail/integrations/slack',
      body: { enabled: true },
    },
  ],
  datasets: [
    { method: 'GET', path: datasets },
    {
      method: 'POST',
      path: datasets,
      body: {
        name: 'shelf-v3',
        split: 'train',
        files: [{ name: 'shelf-001.jpg', size_bytes: 182_000 }],
      },
    },
    { method: 'GET', path: `${datasets}/retail-train` },
    { method: 'GET', path: '/v1/projects/support/datasets/retail-train' },
    {
      method: 'POST',
      path: `${datasets}/retail-train/import`,
      body: { bucket_uri: 's3://acme-data/shelf' },
    },
    { method: 'GET', path: `${datasets}/retail-train/preview` },
    { method: 'GET', path: `${datasets}/retail-train/statistics` },
    { method: 'GET', path: `${datasets}/retail-train/quality` },
    { method: 'GET', path: `${datasets}/retail-train/versions` },
    { method: 'GET', path: `${datasets}/retail-train/manifest` },
    { method: 'POST', path: `${datasets}/retail-raw/reprocess` },
    { method: 'POST', path: `${datasets}/retail-raw/upload-zip` },
    { method: 'POST', path: `${datasets}/retail-raw/tabular` },
    { method: 'POST', path: `${datasets}/retail-raw/upload-file` },
  ],
  training: [
    { method: 'GET', path: runs },
    {
      method: 'POST',
      path: `${runs}/estimate`,
      body: {
        dataset_id: 'retail-train',
        architecture_id: 'resnet50',
        epochs: 30,
        batch_size: 32,
        instance_id: 'a10g-1',
        spot: false,
      },
    },
    {
      method: 'POST',
      path: runs,
      body: {
        dataset_id: 'retail-train',
        architecture_id: 'resnet50',
        config: runConfig,
      },
    },
    { method: 'GET', path: `${runs}/t1` },
    { method: 'POST', path: `${runs}/t1/cancel` },
    { method: 'GET', path: `${runs}/t1/logs` },
    { method: 'GET', path: `${runs}/t1/metrics` },
  ],
  models: [
    { method: 'GET', path: models },
    { method: 'GET', path: `${models}/retail-resnet50-v3` },
    { method: 'GET', path: `${models}/retail-resnet50-v3/files` },
    { method: 'POST', path: `${models}/retail-convnext-tiny-v1/promote` },
    { method: 'POST', path: `${models}/retail-resnet50-v1/archive` },
    { method: 'POST', path: `${models}/retail-resnet50-v3/predict` },
  ],
  deployments: [
    { method: 'GET', path: deployments },
    {
      method: 'POST',
      path: deployments,
      body: { model_id: 'retail-resnet50-v1' },
    },
    { method: 'GET', path: `${deployments}/retail-classify-prod` },
    {
      method: 'PATCH',
      path: `${deployments}/retail-classify-prod`,
      body: { min_replicas: 2, max_replicas: 4 },
    },
    { method: 'DELETE', path: `${deployments}/retail-edge-package` },
    { method: 'POST', path: `${deployments}/retail-classify-prod/pause` },
    { method: 'POST', path: `${deployments}/retail-batch-nightly/resume` },
    { method: 'POST', path: `${deployments}/retail-classify-canary/redeploy` },
    { method: 'GET', path: `${deployments}/retail-classify-prod/metrics` },
    { method: 'GET', path: `${deployments}/retail-classify-prod/logs` },
    { method: 'GET', path: `${deployments}/retail-classify-prod/api-key` },
    {
      method: 'POST',
      path: `${deployments}/retail-classify-prod/api-key/rotate`,
    },
    { method: 'POST', path: `${deployments}/retail-classify-prod/test` },
  ],
  account: [
    { method: 'GET', path: '/v1/users/me' },
    { method: 'PATCH', path: '/v1/users/me', body: { bio: 'Edited' } },
    { method: 'DELETE', path: '/v1/users/me/avatar' },
    { method: 'DELETE', path: '/v1/users/me' },
    {
      method: 'DELETE',
      path: '/v1/users/me',
      // Deleting your account waits until you own no organization.
      setup: () => organizations.remove('solo'),
    },
    { method: 'GET', path: '/v1/users/me/security' },
    {
      method: 'POST',
      path: '/v1/users/me/password',
      body: {
        current_password: 'old-password',
        new_password: 'new-password-1',
      },
    },
    { method: 'GET', path: '/v1/users/me/sessions' },
    { method: 'DELETE', path: '/v1/users/me/sessions/session-iphone' },
    { method: 'GET', path: '/v1/users/me/notification-settings' },
    {
      method: 'PATCH',
      path: '/v1/users/me/notification-settings',
      body: { 'weekly-usage': false },
    },
    { method: 'GET', path: '/v1/notifications' },
    { method: 'POST', path: '/v1/notifications/read' },
    { method: 'GET', path: '/v1/api-keys?project_id=retail' },
    {
      method: 'POST',
      path: '/v1/api-keys',
      body: {
        name: 'Contract key',
        scope: 'inference:read',
        project_id: 'retail',
      },
    },
    { method: 'DELETE', path: '/v1/api-keys/key-ci' },
  ],
  dashboard: [{ method: 'GET', path: '/v1/dashboard/metrics/history?days=30' }],
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

/** The registered pattern a request lands on, e.g. `/v1/projects/:projectId`. */
function patternOf(request: ContractRequest) {
  const parts = request.path.split('?')[0].split('/').filter(Boolean);
  const candidates = registeredRoutes().filter((item) => {
    const segments = item.pattern.split('/').filter(Boolean);
    return (
      item.method === request.method &&
      segments.length === parts.length &&
      segments.every((segment, i) => segment.startsWith(':') || segment === parts[i])
    );
  });
  // The most specific wins, as in matchRoute.
  const fixed = (pattern: string) => pattern.split('/').filter((segment) => segment && !segment.startsWith(':')).length;
  return candidates.sort((a, b) => fixed(b.pattern) - fixed(a.pattern))[0]?.pattern;
}

type Fixture = {
  method: string;
  route: string | undefined;
  path: string;
  body: unknown;
  status: number;
  response: unknown;
};

/**
 * The mock's answer, retired routes included (src/api/mock/router.ts), or
 * `undefined` once its route has been deleted. Such a request keeps its
 * committed fixture, so the contract outlives the mock.
 */
async function record(request: ContractRequest): Promise<Fixture | undefined> {
  resetDeterminism();
  reloadMockDb(memoryStorage());
  request.setup?.();
  const response = await handleMockRequest(
    request.method,
    request.path,
    request.body === undefined ? undefined : JSON.stringify(request.body),
    0,
    { includeRetired: true },
  );
  if (!response) return undefined;
  const text = await response.text();
  return {
    method: request.method,
    route: patternOf(request),
    path: request.path,
    body: request.body ?? null,
    status: response.status,
    response: text ? (JSON.parse(text) as unknown) : null,
  };
}

function readCommitted(file: string) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

test('every mock route has a contract request', () => {
  const requested = Object.values(REQUESTS).flat();
  const missing = registeredRoutes().filter(
    (item) => !requested.some((request) => request.method === item.method && patternOf(request) === item.pattern),
  );
  expect(missing).toEqual([]);
});

for (const [area, requests] of Object.entries(REQUESTS)) {
  test(`contract fixtures: ${area}`, async () => {
    const file = path.join(FIXTURE_DIR, `${area}.json`);
    const committed = readCommitted(file);
    const frozen = (committed ? JSON.parse(committed) : []) as Fixture[];

    const fixtures: Fixture[] = [];
    for (const request of requests) {
      const fixture = (await record(request)) ?? frozen.find((item) => item.method === request.method && item.path === request.path);
      if (!fixture) {
        throw new Error(`No mock route and no committed fixture for ${request.method} ${request.path}`);
      }
      fixtures.push(fixture);
    }
    const content = `${JSON.stringify(fixtures, null, 2)}\n`;

    if (process.env.UPDATE_CONTRACT) {
      writeFileSync(file, content);
      return;
    }
    expect(committed === content, `${file} is stale; run \`pnpm contract:export\``).toBe(true);
  });
}
