import { test, expect } from './fixtures';
import { ACME, ACME_SLUG, SIDE_SLUG } from './mock-api';

test('home goes to the first active workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(`/w/${ACME_SLUG}`);
  await expect(page.getByTestId('shell')).toBeVisible();
});

test('the switcher lists both workspaces and switches', async ({ page }) => {
  await page.goto(`/w/${ACME_SLUG}`);
  await page.getByTestId('workspace-switcher').click();
  await expect(page.getByTestId(`workspace-option-${ACME_SLUG}`)).toBeVisible();
  await page.getByTestId(`workspace-option-${SIDE_SLUG}`).click();
  await expect(page).toHaveURL(`/w/${SIDE_SLUG}`);
});

test('an old link with the workspace id redirects to the slug', async ({ page }) => {
  await page.goto(`/w/${ACME}/settings`);
  await expect(page).toHaveURL(`/w/${ACME_SLUG}/settings`);
});

test('a workspace waiting for deletion offers restore', async ({ page, api }) => {
  api.workspaces[0].status = 'pending_delete';
  await page.goto(`/w/${ACME_SLUG}`);
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'idle');
  await expect(page.getByTestId('shell')).toBeHidden();
  await page.getByTestId('restore-confirm').click();
  await expect(page.getByTestId('shell')).toBeVisible();
  await expect(page.getByTestId('state-screen')).toHaveCount(0);
});

test('an unknown workspace is not found', async ({ page }) => {
  await page.goto('/w/nope');
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'idle');
  await expect(page.getByTestId('shell')).toBeHidden();
});

test('a plain member has no Members item', async ({ page }) => {
  await page.goto(`/w/${SIDE_SLUG}`);
  await expect(page.getByTestId('shell-nav-settings')).toBeVisible();
  await expect(page.getByTestId('shell-nav-members')).toHaveCount(0);
});

test('an owner has the Members item', async ({ page }) => {
  await page.goto(`/w/${ACME_SLUG}`);
  await expect(page.getByTestId('shell-nav-members')).toBeVisible();
});
