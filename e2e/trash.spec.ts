import { test, expect } from './fixtures';
import { ACME_SLUG } from './mock-api';

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
