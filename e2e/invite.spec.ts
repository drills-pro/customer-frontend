import { test, expect } from './fixtures';
import { SIDE, SIDE_SLUG } from './mock-api';

test('a good invite joins the workspace', async ({ page }) => {
  await page.goto('/invite/good');
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'ship');
  await expect(page).toHaveURL(`/w/${SIDE_SLUG}`);
});

test('a new member lands in the workspace they just joined, not a 404', async ({ page, api }) => {
  api.invitedTo = api.workspaces.filter((w) => w.id === SIDE);
  api.workspaces = api.workspaces.filter((w) => w.id !== SIDE);
  await page.goto('/');
  await page.goto('/invite/good'); // /v1/me is cached from the first page without the new workspace
  await expect(page).toHaveURL(`/w/${SIDE_SLUG}`);
  await expect(page.getByTestId('state-screen')).toHaveCount(0);
});

test('accepting sends the token once', async ({ page }) => {
  let accepts = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith(':accept')) accepts++;
  });
  await page.goto('/invite/good');
  await expect(page).toHaveURL(`/w/${SIDE_SLUG}`);
  expect(accepts).toBe(1);
});

test('a bad invite says so', async ({ page }) => {
  await page.goto('/invite/bad');
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'oops');
});
