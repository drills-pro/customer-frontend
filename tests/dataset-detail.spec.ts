import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/datasets/retail-train');
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByRole('heading', { name: 'retail-shelf-train', exact: true })).toBeVisible();
});

test('renders and filters image-classification samples', async ({ page }) => {
  await expect(page.getByText('image dataset · 18,420 images · 240 classes · 4.2 GB')).toBeVisible();
  await expect(page.getByText('v3', { exact: true })).toBeVisible();
  await expect(page.getByText('Showing 24 of 18,420')).toBeVisible();
  await expect(page.getByRole('img', { name: 'beverages dataset sample' })).toHaveCount(4);
  await expect(page.getByText('Class distribution')).toBeVisible();
  await expect(page.getByText('142 near-duplicates found')).toBeVisible();
  await expect(page.locator('a[data-active="true"]').filter({ hasText: 'Datasets' })).toBeVisible();

  await page.getByRole('combobox', { name: 'Filter by class' }).click();
  await page.getByRole('option', { name: 'produce' }).click();
  await expect(page.getByText('Showing 4 of 18,420')).toBeVisible();
  await expect(page.getByRole('img', { name: 'produce dataset sample' })).toHaveCount(4);
});

test('renders and filters text-classification examples', async ({ page }) => {
  await page.goto('/projects/support/datasets/support-train');
  await expect(page.getByRole('heading', { name: 'support-tickets-train' })).toBeVisible();
  await expect(page.getByText('text dataset · 42,300 rows · 18 labels · 8.4 MB')).toBeVisible();
  await expect(page.getByText('v2', { exact: true })).toBeVisible();
  await expect(page.getByText(/My order #48213/)).toBeVisible();
  await expect(page.getByText('Label distribution')).toBeVisible();

  await page.getByRole('combobox', { name: 'Filter by label' }).click();
  await page.getByRole('option', { name: 'Account access' }).click();
  await expect(page.getByText('Showing 2 of 42,300')).toBeVisible();
  await page.getByRole('textbox', { name: 'Search sample text' }).fill('password');
  await expect(page.getByText('Showing 1 of 42,300')).toBeVisible();
  await expect(page.getByText(/How do I reset my password/)).toBeVisible();
});

test('switches tabs, reviews issues, and downloads metadata', async ({ page }) => {
  await page.getByRole('tab', { name: 'Statistics' }).click();
  await expect(page.getByText('Class distribution')).toBeVisible();
  await expect(page.getByText('Split distribution')).toBeVisible();
  await expect(page.getByText('Dataset composition')).toBeVisible();
  // Derived from the generated per-class counts, which sum to 18,420.
  await expect(page.getByText('77', { exact: true })).toBeVisible();
  await expect(page.getByText('3.2 : 1')).toBeVisible();
  await expect(page.getByText('fresh_produce')).toBeVisible();
  await expect(page.getByText('14,736')).toBeVisible();
  await expect(page.getByText('1024 × 768 px')).toBeVisible();

  // "Review issues" lives on the Preview tab's health card.
  await page.getByRole('tab', { name: 'Preview' }).click();
  await page.getByRole('button', { name: 'Review issues' }).click();
  await expect(page.getByText('Quality report')).toBeVisible();
  await expect(page.getByText('72', { exact: true })).toBeVisible();
  await expect(page.getByText('Needs attention — lowered by 2 findings below')).toBeVisible();
  await expect(page.getByText('Findings, ranked by impact')).toBeVisible();

  await page.getByRole('button', { name: 'Review class distribution' }).click();
  await expect(page.getByText('Dataset composition')).toBeVisible();

  await page.getByRole('tab', { name: 'Quality' }).click();
  const reportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download full report' }).click();
  expect((await reportDownload).suggestedFilename()).toBe('retail-shelf-train-quality.json');

  await page.getByRole('tab', { name: 'Versions' }).click();
  await expect(page.getByText('Dataset versions')).toBeVisible();
  await expect(page.getByText('v3 · current')).toBeVisible();

  const manifestDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await manifestDownload).suggestedFilename()).toBe('retail-shelf-train-manifest.json');
});

test('shows processing, failed, and missing dataset states', async ({ page }) => {
  await page.goto('/projects/retail/datasets/retail-raw');
  await expect(page.getByText('Processing dataset')).toBeVisible();

  await page.goto('/projects/retail/datasets/retail-legacy');
  await expect(page.getByText('Dataset processing failed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry processing' })).toBeVisible();

  await page.goto('/projects/retail/datasets/support-train');
  await expect(page.getByText('Dataset not found')).toBeVisible();
  await page.goto('/projects/retail/datasets/does-not-exist');
  await expect(page.getByText('Dataset not found')).toBeVisible();
});

test('dataset detail does not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
