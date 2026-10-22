import { test, expect } from './fixtures';

test.describe('signed out', () => {
  test.use({ signedIn: false });

  test('home lands on login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login\?return_to=%2F$/);
    await expect(page.getByTestId('login-signin')).toBeVisible();
  });

  test('login keeps where the visitor was headed', async ({ page }) => {
    await page.goto('/new');
    await expect(page).toHaveURL(/\/login\?return_to=%2Fnew$/);
  });
});

test('a signed-in visit to login moves on', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/w\/[^/]+$/);
  await expect(page.getByTestId('login-signin')).toBeHidden();
});
