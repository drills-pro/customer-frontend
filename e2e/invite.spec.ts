import { test, expect } from './fixtures';
import { SIDE_SLUG } from './mock-api';

test('a good invite joins the workspace', async ({ page }) => {
  await page.goto('/invite/good');
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'ship');
  await expect(page).toHaveURL(`/w/${SIDE_SLUG}`);
});

test('a bad invite says so', async ({ page }) => {
  await page.goto('/invite/bad');
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'oops');
});
