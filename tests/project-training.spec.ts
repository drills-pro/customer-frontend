import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/overview');
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByRole('heading', { name: 'Retail Vision', exact: true })).toBeVisible();
});

test('the Training section tab navigates to the run list', async ({ page }) => {
  await page.getByRole('navigation', { name: 'Project sections' }).getByRole('link', { name: 'Training' }).click();
  await expect(page).toHaveURL(/\/projects\/retail\/training$/);
  await expect(page.getByRole('link', { name: /efficientnet-b4/ })).toBeVisible();

  await page.getByRole('link', { name: /efficientnet-b4/ }).click();
  await expect(page).toHaveURL(/\/projects\/retail\/training\/t1$/);
});

test('shows an empty state for a project with no runs', async ({ page }) => {
  await page.goto('/projects/churn/training');
  await expect(page.getByText('No training runs yet')).toBeVisible();
  // Two links exist: the shared header CTA and this page's empty-state CTA.
  await page.getByRole('link', { name: 'New Training' }).last().click();
  await expect(page).toHaveURL(/\/projects\/churn\/training\/new$/);
});
