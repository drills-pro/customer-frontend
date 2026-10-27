import { test, expect } from './fixtures';
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
  deployment(api, 'deploying');
  await page.goto(BASE);
  await expect(page.getByTestId('pipeline-data')).toHaveAttribute('data-count', '2');
  await expect(page.getByTestId('pipeline-data')).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('pipeline-train')).toHaveAttribute('data-count', '2');
  await expect(page.getByTestId('pipeline-train')).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('pipeline-deploy')).toHaveAttribute('data-count', '1');
});

test('an empty project has every stage still to do', async ({ page, api }) => {
  deployment(api, 'deploying');
  await page.goto(BASE);
  await expect(page.getByTestId('pipeline-data')).toHaveAttribute('data-state', 'todo');
  await expect(page.getByTestId('pipeline-train')).toHaveAttribute('data-state', 'todo');
  await expect(page.getByTestId('pipeline-deploy')).toHaveAttribute('data-state', 'active');
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
  await expect(page.getByTestId('datasets-create-open')).toBeVisible();
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

test('new training waits for the next release', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByTestId('project-new-training')).toBeDisabled();
});
