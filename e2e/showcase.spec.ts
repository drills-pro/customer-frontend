import { test, expect } from './fixtures';

test('the showcase opens on its overview page', async ({ page }) => {
  await page.goto('/showcase');
  await expect(page).toHaveURL('/showcase/overview');
  await expect(page.getByTestId('showcase')).toBeVisible();
  await expect(page.getByTestId('showcase-nav-overview')).toHaveAttribute('aria-current', 'page');
});
