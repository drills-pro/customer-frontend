import { test, expect } from './fixtures';
import { crumbTo, PHONE } from './crumbs';
import { ACME_SLUG, PROJECT, dataset, importOf, versionOf } from './mock-api';

const BASE = `/w/${ACME_SLUG}/projects/${PROJECT}/datasets`;

test('lists datasets with their published version and latest import', async ({ page, api }) => {
  const a = dataset(api, { name: 'alpha' });
  const imp = importOf(api, a.id, { status: 'succeeded' });
  const v = versionOf(api, a.id, imp.id);
  a.published_version_id = v.id;
  dataset(api, { name: 'beta', task_type: null });
  await page.goto(BASE);
  await expect(page.getByTestId('dataset-row')).toHaveCount(2);
  await expect(page.getByTestId('import-status').first()).toHaveAttribute('data-status', 'succeeded');
});

test('shows an empty state', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByTestId('datasets-create-open')).toBeVisible();
  await expect(page.getByTestId('dataset-row')).toHaveCount(0);
});

test('loads the next page by cursor', async ({ page, api }) => {
  api.pageSize = 2;
  for (let i = 0; i < 3; i++) dataset(api);
  await page.goto(BASE);
  await expect(page.getByTestId('dataset-row')).toHaveCount(2);
  await page.getByTestId('datasets-load-more').click();
  await expect(page.getByTestId('dataset-row')).toHaveCount(3);
  await expect(page.getByTestId('datasets-load-more')).toHaveCount(0);
});

test('creates a dataset and opens it', async ({ page, api }) => {
  await page.goto(BASE);
  await page.getByTestId('datasets-create-open').click();
  await page.getByTestId('datasets-create-name').fill('fresh');
  await page.getByTestId('datasets-create-submit').click();
  await expect(page.getByTestId('dataset-name')).toBeVisible();
  expect(api.datasets.map((d) => d.name)).toEqual(['fresh']);
});

test('a project with datasets can add another from the card under the list', async ({ page, api }) => {
  dataset(api, { name: 'first' });
  await page.goto(BASE);
  await expect(page.getByTestId('dataset-row')).toHaveCount(1);
  await page.getByTestId('datasets-add-card').getByTestId('datasets-create-open').click();
  await page.getByTestId('datasets-create-name').fill('second');
  await page.getByTestId('datasets-create-submit').click();
  await expect(page.getByTestId('dataset-name')).toBeVisible();
  expect(api.datasets.map((d) => d.name).sort()).toEqual(['first', 'second']);
});

test('deletes with a confirmation, and restores from the deleted dataset', async ({ page, api }) => {
  const d = dataset(api, { name: 'gone' });
  await page.goto(BASE);
  await page.getByTestId('dataset-menu').click();
  await page.getByTestId('dataset-delete').click();
  await page.getByTestId('dataset-delete-confirm').click();
  await expect(page.getByTestId('dataset-row')).toHaveCount(0);
  expect(api.datasets[0].deleted_at).not.toBeNull();

  await page.goto(`${BASE}/${d.id}`);
  await expect(page.getByTestId('dataset-deleted')).toBeVisible();
  await page.getByTestId('dataset-menu').click();
  await page.getByTestId('dataset-restore').click();
  await expect(page.getByTestId('dataset-deleted')).toHaveCount(0);
  expect(api.datasets[0].deleted_at).toBeNull();
});

test('a 403 on a write turns the write actions off', async ({ page, api }) => {
  api.denyWrites = true;
  dataset(api);
  await page.goto(BASE);
  await page.getByTestId('dataset-menu').click();
  await page.getByTestId('dataset-delete').click();
  await page.getByTestId('dataset-delete-confirm').click();
  await expect(page.getByTestId('datasets-read-only')).toBeVisible();
  await expect(page.getByTestId('datasets-create-open')).toBeDisabled();
});

test('a dataset whose project has no task type cannot import', async ({ page, api }) => {
  const d = dataset(api, { task_type: null });
  await page.goto(`${BASE}/${d.id}`);
  await expect(page.getByTestId('dataset-import-blocked')).toBeVisible();
  await expect(page.getByTestId('dataset-new-import')).toBeDisabled();
  await page.goto(`${BASE}/${d.id}/imports/new`);
  await expect(page.getByTestId('import-blocked')).toBeVisible();
  await expect(page.getByTestId('import-submit')).toHaveCount(0);
});

test('versions publish and unpublish, and open a preview', async ({ page, api }) => {
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'succeeded' });
  const v = versionOf(api, d.id, imp.id);
  await page.goto(`${BASE}/${d.id}`);
  await page.getByTestId('version-publish').click();
  await expect(page.getByTestId('version-published')).toBeVisible();
  expect(api.datasets[0].published_version_id).toBe(v.id);
  await page.getByTestId('version-unpublish').click();
  await expect(page.getByTestId('version-published')).toHaveCount(0);

  await page.getByTestId('version-preview-link').click();
  await expect(page.getByTestId('preview-row')).toHaveCount(2);
});

test('imports tab lists imports and links to one', async ({ page, api }) => {
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'cancelled' });
  await page.goto(`${BASE}/${d.id}?tab=imports`);
  await expect(page.getByTestId('import-row')).toHaveCount(1);
  await page.getByTestId('import-link').click();
  await expect(page).toHaveURL(new RegExp(`/imports/${imp.id}$`));
  await expect(page.getByTestId('import-ended')).toBeVisible();
});

test('the breadcrumb leads from a dataset back to its datasets', async ({ page, api }) => {
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}`);
  // Workspace, projects, the project, datasets, the dataset.
  await expect(page.getByTestId('shell-crumb')).toHaveCount(5);
  await crumbTo(page, BASE).click();
  await expect(page).toHaveURL(BASE);
});

test('an import sits under its dataset in the breadcrumb, which returns to the imports tab', async ({ page, api }) => {
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'succeeded' });
  await page.goto(`${BASE}/${d.id}/imports/${imp.id}`);
  await expect(page.getByTestId('shell-crumb')).toHaveCount(6);
  await crumbTo(page, `${BASE}/${d.id}?tab=imports`).click();
  await expect(page).toHaveURL(`${BASE}/${d.id}?tab=imports`);
  await expect(page.getByTestId('dataset-tab-imports')).toHaveAttribute('aria-selected', 'true');
});

test('phones show only the last two crumbs', async ({ page, api }) => {
  const d = dataset(api);
  await page.setViewportSize(PHONE);
  await page.goto(`${BASE}/${d.id}`);
  const crumbs = page.getByTestId('shell-crumb');
  const separators = page.getByTestId('shell-crumb-separator');
  await expect(crumbs).toHaveCount(5);
  await expect(separators).toHaveCount(4);
  await Promise.all([
    ...[0, 1, 2].map((i) => expect(crumbs.nth(i)).toBeHidden()),
    ...[3, 4].map((i) => expect(crumbs.nth(i)).toBeVisible()),
    ...[0, 1, 2].map((i) => expect(separators.nth(i)).toBeHidden()),
    expect(separators.nth(3)).toBeVisible(),
  ]);
});

test('the empty versions state starts an import', async ({ page, api }) => {
  const d = dataset(api);
  await page.goto(`${BASE}/${d.id}`);
  await page.getByTestId('dataset-versions-empty-import').click();
  await expect(page).toHaveURL(`${BASE}/${d.id}/imports/new`);
});

test('the empty versions state offers no import when importing is blocked', async ({ page, api }) => {
  const d = dataset(api, { task_type: null });
  await page.goto(`${BASE}/${d.id}`);
  await expect(page.getByTestId('dataset-import-blocked')).toBeVisible();
  await expect(page.getByTestId('dataset-versions-empty-import')).toHaveCount(0);
});
