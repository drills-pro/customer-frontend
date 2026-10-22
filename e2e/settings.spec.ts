import { test, expect } from './fixtures';
import { ACME_SLUG, SIDE_SLUG } from './mock-api';

const settings = `/w/${ACME_SLUG}/settings`;

test('rename saves once the name changes', async ({ page, api }) => {
  await page.goto(settings);
  await expect(page.getByTestId('settings-save')).toBeDisabled();
  await page.getByTestId('settings-name').fill('Acme Renamed');
  await expect(page.getByTestId('settings-save')).toBeEnabled();
  await page.getByTestId('settings-save').click();
  await expect.poll(() => api.workspaces[0].name).toBe('Acme Renamed');
  await expect(page.getByTestId('settings-save')).toBeDisabled();
});

test('delete needs the typed name, then leaves for the other workspace', async ({ page, api }) => {
  await page.goto(settings);
  await page.getByTestId('settings-delete-open').click();
  await expect(page.getByTestId('settings-delete-confirm')).toBeDisabled();
  await page.getByTestId('settings-delete-name').fill('wrong');
  await expect(page.getByTestId('settings-delete-confirm')).toBeDisabled();
  await page.getByTestId('settings-delete-name').fill(api.workspaces[0].name);
  await expect(page.getByTestId('settings-delete-confirm')).toBeEnabled();
  await page.getByTestId('settings-delete-confirm').click();
  await expect(page).toHaveURL(`/w/${SIDE_SLUG}`);
  expect(api.workspaces[0].status).toBe('pending_delete');
});

test('a non-owner has no danger zone', async ({ page }) => {
  await page.goto(`/w/${SIDE_SLUG}/settings`);
  await expect(page.getByTestId('settings-name')).toBeVisible();
  await expect(page.getByTestId('settings-danger')).toHaveCount(0);
});
