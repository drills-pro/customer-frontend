import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { ACME_SLUG, PROJECT, REPORT, dataset, importOf, versionOf } from './mock-api';

const BASE = `/w/${ACME_SLUG}/projects/${PROJECT}/datasets`;
const CSV = { name: 'orders.csv', mimeType: 'text/csv', buffer: Buffer.from('x,y\n1,2\n') };

async function fillUpload(page: Page) {
  await page.getByTestId('import-file').setInputFiles(CSV);
  await page.getByTestId('import-target').fill('y');
}

test('walks create, upload, start, review, commit, publish', async ({ page, api }) => {
  await page.clock.install();
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}/imports/new`);
  await fillUpload(page);
  await page.getByTestId('import-submit').click();

  await expect(page).toHaveURL(/\/imports\/[0-9a-f-]+$/);
  expect(api.uploads).toHaveLength(1);
  expect(api.created).toEqual([{ source: 'upload', base_version_id: null, params: { target: 'y' } }]);
  const imp = api.imports[0];
  expect(imp.status).toBe('queued');
  await expect(page.getByTestId('import-working')).toBeVisible();
  await expect(page.getByTestId('import-cancel')).toBeVisible();

  imp.status = 'running';
  await page.clock.runFor(3500);
  await expect(page.getByTestId('import-status')).toHaveAttribute('data-status', 'running');

  imp.status = 'awaiting_review';
  imp.report = REPORT;
  await page.clock.runFor(5000);
  await expect(page.getByTestId('import-review')).toBeVisible();
  await expect(page.getByTestId('import-issue')).toHaveCount(1);
  await expect(page.getByTestId('import-issues-omitted')).toBeVisible();
  await expect(page.getByTestId('preview-row')).toHaveCount(2);
  await expect(page.getByTestId('import-commit')).toBeVisible();
  await expect(page.getByTestId('import-discard')).toBeVisible();
  await expect(page.getByTestId('import-cancel')).toHaveCount(0);

  await page.getByTestId('import-commit').click();
  await expect(page.getByTestId('import-succeeded')).toBeVisible();
  await page.getByTestId('import-view-versions').click();
  await expect(page.getByTestId('version-row')).toHaveCount(1);
  await page.getByTestId('version-publish').click();
  await expect(page.getByTestId('version-published')).toBeVisible();
});

test('polling follows a moving import and stops on a settled one', async ({ page, api }) => {
  await page.clock.install();
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'running' });
  await page.goto(`${BASE}/${d.id}/imports/${imp.id}`);
  await expect(page.getByTestId('import-working')).toBeVisible();
  const before = api.importGets[imp.id];
  await page.clock.runFor(4000);
  await expect.poll(() => api.importGets[imp.id]).toBeGreaterThan(before);

  imp.status = 'failed';
  imp.report = {
    ...REPORT,
    outcome: 'failed',
    stats: null,
    issues: [{ code: 'target_missing', severity: 'error', path: 'y', message: 'no such column' }],
  };
  await page.clock.runFor(6000);
  await expect(page.getByTestId('import-failed')).toBeVisible();
  await expect(page.getByTestId('import-issue')).toHaveAttribute('data-severity', 'error');
  const settled = api.importGets[imp.id];
  await page.clock.runFor(120_000);
  expect(api.importGets[imp.id]).toBe(settled);
});

test('polling stops when the page is left', async ({ page, api }) => {
  await page.clock.install();
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'queued' });
  await page.goto(`${BASE}/${d.id}/imports/${imp.id}`);
  await expect(page.getByTestId('import-working')).toBeVisible();
  await page.getByTestId('shell-nav-overview').click();
  await expect(page.getByTestId('import-working')).toHaveCount(0);
  const left = api.importGets[imp.id];
  await page.clock.runFor(120_000);
  expect(api.importGets[imp.id]).toBe(left);
});

test('cancel and discard end an import', async ({ page, api }) => {
  const d = dataset(api);
  const running = importOf(api, d.id, { status: 'running' });
  await page.goto(`${BASE}/${d.id}/imports/${running.id}`);
  await page.getByTestId('import-cancel').click();
  await expect(page.getByTestId('import-ended')).toBeVisible();

  const review = importOf(api, d.id, { status: 'awaiting_review', report: REPORT });
  await page.goto(`${BASE}/${d.id}/imports/${review.id}`);
  await page.getByTestId('import-discard').click();
  await expect(page.getByTestId('import-ended')).toBeVisible();
  expect(review.status).toBe('discarded');
});

test('a 409 on commit re-renders from the server state', async ({ page, api }) => {
  api.commitConflict = 'discarded';
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'awaiting_review', report: REPORT });
  await page.goto(`${BASE}/${d.id}/imports/${imp.id}`);
  await page.getByTestId('import-commit').click();
  await expect(page.getByTestId('import-ended')).toBeVisible();
  await expect(page.getByTestId('import-commit')).toHaveCount(0);
});

test('a 429 on create shows an error and stays on the form', async ({ page, api }) => {
  api.importCap = true;
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}/imports/new`);
  await fillUpload(page);
  await page.getByTestId('import-submit').click();
  await expect(page.getByTestId('import-error')).toBeVisible();
  await expect(page).toHaveURL(/imports\/new$/);
  expect(api.uploads).toHaveLength(0);
});

test('a failed upload retries with the same key and the same import', async ({ page, api }) => {
  api.failUploads = 1;
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}/imports/new`);
  await fillUpload(page);
  await page.getByTestId('import-submit').click();
  await expect(page.getByTestId('import-error')).toBeVisible();
  await page.getByTestId('import-submit').click();
  await expect(page).toHaveURL(/\/imports\/[0-9a-f-]+$/);
  expect(api.keys).toHaveLength(1);
  expect(api.imports).toHaveLength(1);
  expect(api.uploads).toHaveLength(1);
});

test('start over cancels the half-made import and uses a new key', async ({ page, api }) => {
  api.failUploads = 1;
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}/imports/new`);
  await fillUpload(page);
  await page.getByTestId('import-submit').click();
  await page.getByTestId('import-start-over').click();
  await expect.poll(() => api.imports[0]?.status).toBe('cancelled');
  await page.getByTestId('import-submit').click();
  await expect(page).toHaveURL(/\/imports\/[0-9a-f-]+$/);
  expect(api.keys).toHaveLength(2);
  expect(new Set(api.keys).size).toBe(2);
});

test('Hugging Face validates the repo, then imports without an upload', async ({ page, api }) => {
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}/imports/new`);
  await page.getByTestId('import-source-huggingface').click();
  await page.getByTestId('import-repo').fill('not/a/repo');
  await page.getByTestId('import-submit').click();
  expect(api.created).toHaveLength(0);
  await page.getByTestId('import-repo').fill('user/data');
  await page.getByTestId('import-submit').click();
  await expect(page).toHaveURL(/\/imports\/[0-9a-f-]+$/);
  expect(api.created).toEqual([{ source: 'huggingface', base_version_id: null, params: { repo: 'user/data' } }]);
  expect(api.uploads).toHaveLength(0);
  expect(api.imports[0].status).toBe('queued');
});

test('an import on a dataset with versions extends the latest one', async ({ page, api }) => {
  const d = dataset(api);
  const first = importOf(api, d.id, { status: 'succeeded' });
  versionOf(api, d.id, first.id);
  const second = importOf(api, d.id, { status: 'succeeded' });
  const latest = versionOf(api, d.id, second.id);
  await page.goto(`${BASE}/${d.id}/imports/new`);
  await fillUpload(page);
  await page.getByTestId('import-submit').click();
  await expect(page).toHaveURL(/\/imports\/[0-9a-f-]+$/);
  expect((api.created[0] as { base_version_id: string }).base_version_id).toBe(latest.id);
});

test('a missing import shows not found', async ({ page, api }) => {
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}/imports/${crypto.randomUUID()}`);
  await expect(page.getByTestId('state-screen')).toBeVisible();
});
