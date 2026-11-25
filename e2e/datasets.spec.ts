import { test, expect } from './fixtures';
import { crumbTo, PHONE } from './crumbs';
import { ACME_SLUG, PROJECT, dataset, importOf, versionOf } from './mock-api';

const BASE = `/w/${ACME_SLUG}/projects/${PROJECT}/datasets`;

test('shows the project dataset with its versions', async ({ page, api }) => {
  const d = dataset(api, { name: 'alpha' });
  const imp = importOf(api, d.id, { status: 'succeeded' });
  versionOf(api, d.id, imp.id);
  await page.goto(BASE);
  await expect(page.getByTestId('dataset-tab-versions')).toBeVisible();
  await expect(page.getByTestId('version-row')).toHaveCount(1);
});

test('an empty project offers its first import, which is where the dataset is made', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByTestId('datasets-import-empty')).toBeVisible();
  await page.getByTestId('datasets-import-empty').click();
  await expect(page).toHaveURL(`${BASE}/imports/new`);
});

test('a project with no task type cannot import', async ({ page, api }) => {
  api.project.task_type = null;
  dataset(api);
  await page.goto(BASE);
  await expect(page.getByTestId('dataset-import-blocked')).toBeVisible();
  await expect(page.getByTestId('dataset-new-import')).toBeDisabled();
  await page.goto(`${BASE}/imports/new`);
  await expect(page.getByTestId('import-blocked')).toBeVisible();
  await expect(page.getByTestId('import-submit')).toHaveCount(0);
});

test('a version opens a preview', async ({ page, api }) => {
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'succeeded' });
  versionOf(api, d.id, imp.id);
  await page.goto(BASE);
  await page.getByTestId('version-preview-link').click();
  await expect(page.getByTestId('preview-row')).toHaveCount(2);
});

test('imports tab lists imports and links to one', async ({ page, api }) => {
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'cancelled' });
  await page.goto(`${BASE}?tab=imports`);
  await expect(page.getByTestId('import-row')).toHaveCount(1);
  await page.getByTestId('import-link').click();
  await expect(page).toHaveURL(new RegExp(`/imports/${imp.id}$`));
  await expect(page.getByTestId('import-ended')).toBeVisible();
});

test('the breadcrumb leads from the dataset page back to the project', async ({ page, api }) => {
  dataset(api);
  await page.goto(BASE);
  // Workspace, projects, the project, datasets (the current page, not a link).
  await expect(page.getByTestId('shell-crumb')).toHaveCount(4);
  await crumbTo(page, `/w/${ACME_SLUG}/projects/${PROJECT}`).click();
  await expect(page).toHaveURL(`/w/${ACME_SLUG}/projects/${PROJECT}`);
});

test('an import sits under the datasets in the breadcrumb, which returns to the imports tab', async ({ page, api }) => {
  const d = dataset(api);
  const imp = importOf(api, d.id, { status: 'succeeded' });
  await page.goto(`${BASE}/imports/${imp.id}`);
  await expect(page.getByTestId('shell-crumb')).toHaveCount(5);
  await crumbTo(page, `${BASE}?tab=imports`).click();
  await expect(page).toHaveURL(`${BASE}?tab=imports`);
  await expect(page.getByTestId('dataset-tab-imports')).toHaveAttribute('aria-selected', 'true');
});

test('phones show only the last two crumbs', async ({ page, api }) => {
  dataset(api);
  await page.setViewportSize(PHONE);
  await page.goto(BASE);
  const crumbs = page.getByTestId('shell-crumb');
  const separators = page.getByTestId('shell-crumb-separator');
  await expect(crumbs).toHaveCount(4);
  await expect(separators).toHaveCount(3);
  await Promise.all([
    ...[0, 1].map((i) => expect(crumbs.nth(i)).toBeHidden()),
    ...[2, 3].map((i) => expect(crumbs.nth(i)).toBeVisible()),
    ...[0, 1].map((i) => expect(separators.nth(i)).toBeHidden()),
    expect(separators.nth(2)).toBeVisible(),
  ]);
});

test('the empty versions state starts an import', async ({ page, api }) => {
  dataset(api);
  await page.goto(BASE);
  await page.getByTestId('dataset-versions-empty-import').click();
  await expect(page).toHaveURL(`${BASE}/imports/new`);
});

test('the empty versions state offers no import when importing is blocked', async ({ page, api }) => {
  api.project.task_type = null;
  dataset(api);
  await page.goto(BASE);
  await expect(page.getByTestId('dataset-import-blocked')).toBeVisible();
  await expect(page.getByTestId('dataset-versions-empty-import')).toHaveCount(0);
});
