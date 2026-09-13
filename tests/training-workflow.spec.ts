import { expect, test } from '@playwright/test'
import { DASHBOARD_STORAGE_KEY } from '../src/features/dashboard/data'

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/training/new')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await expect(
    page.getByRole('heading', { name: 'Create training' }),
  ).toBeVisible()
})

test('walks through the wizard and updates its configuration summary', async ({
  page,
}) => {
  await expect(
    page.getByRole('button', { name: /retail-shelf-train/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('EfficientNet-B4')).toBeVisible()

  await page.getByRole('button', { name: 'Configure', exact: true }).click()
  await page.getByRole('tab', { name: 'Advanced' }).click()
  await expect(page.getByLabel('Optimizer')).toBeVisible()
  await page.getByLabel('Batch size').click()
  await page.getByRole('option', { name: '64' }).click()
  await expect(page.getByText('64').last()).toBeVisible()

  await page.getByRole('tab', { name: 'Yaml' }).click()
  await expect(page.getByText('batch_size: 64')).toBeVisible()
  await expect(page.getByText('optimizer: AdamW')).toBeVisible()

  await page.getByRole('button', { name: 'Compute', exact: true }).click()
  await page.getByRole('button', { name: /1× A100/ }).click()
  await page.getByRole('switch', { name: 'Use spot instance' }).click()
  await expect(page.getByText('1× A100 (spot)')).toBeVisible()
})

test('prefills from dataset detail and starts a persisted run', async ({
  page,
}) => {
  await page.goto('/projects/retail/datasets/retail-train')
  await page.getByRole('link', { name: /Create Training/ }).click()
  await expect(page).toHaveURL(
    /\/projects\/retail\/training\/new\?dataset=retail-train$/,
  )
  await expect(
    page.getByRole('button', { name: /retail-shelf-train/ }),
  ).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await page.getByRole('button', { name: /Start training/ }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/training\/run-[a-z0-9]+$/)
  await expect(page.getByText('Running', { exact: true })).toBeVisible()

  const persistedRuns = await page.evaluate((key) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value).trainingRuns : []
  }, DASHBOARD_STORAGE_KEY)
  expect(persistedRuns).toHaveLength(1)

  await page.reload()
  await expect(page.getByText('Running', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Config' }).click()
  await expect(page.getByText('retail-shelf-train')).toBeVisible()
})

test('filters logs, stops a run, and clones its configuration', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await page.getByRole('button', { name: /Start training/ }).click()

  await page.getByRole('tab', { name: 'Logs' }).click()
  await page.getByLabel('Log level').click()
  await page.getByRole('option', { name: 'WARN' }).click()
  await expect(page.getByText('No logs at this level.')).toBeVisible()

  await page.getByRole('button', { name: 'Stop run' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Stop run' })
    .click()
  await expect(page.getByText('Stopped', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Clone' }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/training\/new\?clone=/)
  await expect(
    page.getByRole('button', { name: /retail-shelf-train/ }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('uses task-specific models and remains responsive', async ({ page }) => {
  await page.goto('/projects/support/training/new')
  await page.getByRole('button', { name: 'Model', exact: true }).click()
  await expect(page.getByRole('button', { name: /BERT Base/ })).toBeVisible()
  await expect(page.getByText('EfficientNet-B4')).not.toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false)
})
