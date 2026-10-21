import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/datasets/retail-train');
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
});

test('collapses to the last three crumbs and pages with the ellipsis', async ({ page }) => {
  const breadcrumb = page.locator('#dashboard-main').getByRole('navigation', { name: 'breadcrumb' });
  const previous = breadcrumb.getByRole('button', {
    name: 'Show previous breadcrumbs',
  });
  const next = breadcrumb.getByRole('button', { name: 'Show next breadcrumbs' });

  await expect(breadcrumb.getByText('Retail Vision')).toBeVisible();
  await expect(breadcrumb.getByText('Datasets')).toBeVisible();
  await expect(breadcrumb.getByText('retail-shelf-train')).toBeVisible();
  await expect(breadcrumb.getByText('Acme')).toHaveCount(0);
  await expect(next).toHaveCount(0);

  await previous.click();
  await expect(breadcrumb.getByText('Acme')).toBeVisible();
  await expect(breadcrumb.getByText('Datasets')).toBeVisible();
  await expect(breadcrumb.getByText('retail-shelf-train')).toHaveCount(0);
  await expect(previous).toHaveCount(0);

  await next.click();
  await expect(breadcrumb.getByText('retail-shelf-train')).toBeVisible();
  await expect(breadcrumb.getByText('Acme')).toHaveCount(0);
});

test('resets the trail when navigating to a parent crumb', async ({ page }) => {
  const breadcrumb = page.locator('#dashboard-main').getByRole('navigation', { name: 'breadcrumb' });

  await breadcrumb.getByRole('link', { name: 'Datasets' }).click();
  await expect(page).toHaveURL(/\/projects\/retail\/datasets$/);
  await expect(breadcrumb.getByText('Retail Vision')).toBeVisible();
  await expect(breadcrumb.getByRole('button')).toHaveCount(0);
});

test('the training run breadcrumb links back to the run list', async ({ page }) => {
  await page.goto('/projects/retail/training/t1');
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
  const breadcrumb = page.locator('#dashboard-main').getByRole('navigation', { name: 'breadcrumb' });

  await breadcrumb.getByRole('link', { name: 'Training' }).click();
  await expect(page).toHaveURL(/\/projects\/retail\/training$/);
});
