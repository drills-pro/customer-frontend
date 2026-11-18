import { test, expect } from './fixtures';
import { ACME_SLUG, PROJECT, dataset } from './mock-api';

const trash = `/w/${ACME_SLUG}/trash`;

test('an empty Trash says so', async ({ page }) => {
  await page.goto(trash);
  await expect(page.getByTestId('trash-empty')).toBeVisible();
});

test('moving a project to the Trash takes it off the list, and Restore brings it back', async ({ page, api }) => {
  await page.goto(`/w/${ACME_SLUG}/projects`);
  await expect(page.getByTestId('project-menu')).toHaveCount(1);
  await page.getByTestId('project-menu').click();
  await page.getByTestId('project-menu-trash').click();
  await page.getByTestId('project-trash-confirm').click();
  await expect.poll(() => api.project.status).toBe('pending_delete');
  await expect(page.getByTestId('project-menu')).toHaveCount(0);

  await page.getByTestId('shell-nav-trash').click();
  await expect(page).toHaveURL(trash);
  await expect(page.getByTestId('trash-project-row')).toHaveCount(1);
  await page.getByTestId('trash-restore-project').click();
  await expect(page.getByTestId('trash-empty')).toBeVisible();
  expect(api.project.status).toBe('active');
});

test('a deleted dataset is listed with its project and restores from the Trash', async ({ page, api }) => {
  const d = dataset(api, { name: 'orders', deleted_at: '2026-11-18T00:00:00Z' });
  await page.goto(trash);
  await expect(page.getByTestId('trash-dataset-row')).toHaveCount(1);
  await page.getByTestId('trash-restore-dataset').click();
  await expect(page.getByTestId('trash-empty')).toBeVisible();
  expect(api.datasets.find((x) => x.id === d.id)?.deleted_at).toBeNull();
  await page.goto(`/w/${ACME_SLUG}/projects/${PROJECT}/datasets`);
  await expect(page.getByTestId('dataset-row')).toHaveCount(1);
});
