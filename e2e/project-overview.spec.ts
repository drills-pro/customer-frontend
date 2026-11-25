import { test, expect } from './fixtures';
import { crumbTo } from './crumbs';
import { ACME_SLUG, PROJECT, dataset, deployment, run } from './mock-api';

const BASE = `/w/${ACME_SLUG}/projects/${PROJECT}`;

test('a project link opens its overview', async ({ page }) => {
  await page.goto(`/w/${ACME_SLUG}/projects`);
  await page.getByTestId('project-link').first().click();
  await expect(page).toHaveURL(BASE);
  await expect(page.getByTestId('project-name')).toBeVisible();
  await expect(page.getByTestId('project-tab-overview')).toHaveAttribute('aria-selected', 'true');
});

test('the pipeline counts datasets, runs and live deployments', async ({ page, api }) => {
  dataset(api);
  dataset(api);
  run(api, 'succeeded');
  run(api, 'running');
  deployment(api, 'active');
  deployment(api, 'stopped');
  await page.goto(BASE);
  await expect(page.getByTestId('pipeline-data')).toHaveAttribute('data-count', '2');
  await expect(page.getByTestId('pipeline-data')).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('pipeline-train')).toHaveAttribute('data-count', '2');
  await expect(page.getByTestId('pipeline-train')).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('pipeline-deploy')).toHaveAttribute('data-count', '1');
});

test('a stage that fails to load does not break the page', async ({ page, api }) => {
  api.failRuns = true;
  await page.goto(BASE);
  await expect(page.getByTestId('pipeline-train')).toHaveAttribute('data-state', 'unavailable');
  await expect(page.getByTestId('pipeline-data')).toHaveAttribute('data-state', 'todo');
  await expect(page.getByTestId('project-info')).toBeVisible();
});

test('the team lists the project members', async ({ page, api }) => {
  api.projectMembers.push({ user_sub: 'someone-else', roles: ['viewer'], created_at: '2026-10-03T00:00:00Z' });
  await page.goto(BASE);
  await expect(page.getByTestId('project-team-member')).toHaveCount(2);
});

test('the datasets tab opens the datasets and keeps the header', async ({ page }) => {
  await page.goto(BASE);
  await page.getByTestId('project-tab-datasets').click();
  await expect(page).toHaveURL(`${BASE}/datasets`);
  await expect(page.getByTestId('project-tab-datasets')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('project-header')).toBeVisible();
  await expect(page.getByTestId('datasets-import-empty')).toBeVisible();
});

test('the data stage links to the datasets', async ({ page }) => {
  await page.goto(BASE);
  await page.getByTestId('pipeline-data-link').click();
  await expect(page).toHaveURL(`${BASE}/datasets`);
});

test('archiving from the header updates its status', async ({ page, api }) => {
  await page.goto(BASE);
  const header = page.getByTestId('project-header');
  await header.getByTestId('project-menu').click();
  await page.getByTestId('project-menu-archive').click();
  await expect.poll(() => api.project.status).toBe('archived');
  await expect(header.getByTestId('project-status')).toHaveAttribute('data-status', 'archived');
});

test('an unknown project shows not found', async ({ page }) => {
  await page.goto(`/w/${ACME_SLUG}/projects/${crypto.randomUUID()}`);
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'idle');
  await expect(page.getByTestId('project-header')).toHaveCount(0);
});

test('new training opens the training wizard', async ({ page }) => {
  await page.goto(BASE);
  await page.getByTestId('project-new-training').click();
  await expect(page).toHaveURL(`${BASE}/training/new`);
  await expect(page.getByTestId('project-new-training')).toHaveCount(0);
  await expect(page.getByTestId('project-tab-training')).toHaveAttribute('aria-selected', 'true');
});

test('new training stays in the header on every tab', async ({ page }) => {
  await page.goto(`${BASE}/datasets`);
  await expect(page.getByTestId('project-new-training')).toBeVisible();
  await page.getByTestId('project-tab-training').click();
  await expect(page).toHaveURL(`${BASE}/training`);
  await expect(page.getByTestId('project-new-training')).toBeVisible();
});

test('the breadcrumb ends at the project and leads back to the list', async ({ page }) => {
  await page.goto(BASE);
  // Workspace, projects, the project.
  await expect(page.getByTestId('shell-crumb')).toHaveCount(3);
  await crumbTo(page, `/w/${ACME_SLUG}/projects`).click();
  await expect(page).toHaveURL(`/w/${ACME_SLUG}/projects`);
});

test('the info card carries the project ID', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByTestId('project-info').getByRole('button')).toHaveCount(1);
});
