import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/overview')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
})

test('the Models section tab navigates to the model list', async ({ page }) => {
  await page
    .getByRole('navigation', { name: 'Project sections' })
    .getByRole('link', { name: 'Models' })
    .click()

  await expect(page).toHaveURL(/\/projects\/retail\/models$/)

  const table = page.getByRole('table')
  await expect(
    table.getByRole('link', { name: 'resnet50' }).first(),
  ).toBeVisible()
  await expect(table.getByRole('cell', { name: '94.2%' })).toBeVisible()
  // Every version is its own row, so resnet50 appears three times.
  await expect(table.getByRole('link', { name: 'resnet50' })).toHaveCount(3)
})

test('searches, filters, and switches model views', async ({ page }) => {
  await page.goto('/projects/retail/models')

  await page.getByRole('textbox', { name: 'Search models' }).fill('convnext')
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2)

  await page.getByRole('textbox', { name: 'Search models' }).fill('')
  await page.getByRole('combobox', { name: 'Filter by stage' }).click()
  await page.getByRole('option', { name: 'Production' }).click()
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2)

  await page.getByRole('combobox', { name: 'Filter by stage' }).click()
  await page.getByRole('option', { name: 'All stages' }).click()
  await page.getByRole('radio', { name: 'Grid view' }).click()
  await expect(page.getByRole('table')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'resnet50 v3' })).toBeVisible()
})

test('a model links to its source run and its deployment', async ({ page }) => {
  await page.goto('/projects/retail/models')

  const row = page.getByRole('row').filter({ hasText: 'retail-classify-prod' })
  await row.getByRole('link', { name: 'retail-classify-prod' }).click()
  await expect(page).toHaveURL(
    /\/projects\/retail\/deployments\/retail-classify-prod$/,
  )
})

test('opens a model and moves through every tab', async ({ page }) => {
  await page.goto('/projects/retail/models')
  await page.getByRole('link', { name: 'resnet50' }).first().click()

  await expect(page).toHaveURL(
    /\/projects\/retail\/models\/retail-resnet50-v3$/,
  )
  await expect(
    page.getByRole('heading', { name: 'resnet50', exact: true }),
  ).toBeVisible()

  // Stat strip reads from the model fixture.
  await expect(page.getByText('94.2%')).toBeVisible()
  await expect(page.getByText('▲ 2.5 pts vs v2')).toBeVisible()

  // Overview: lineage and the weakest classes.
  await expect(page.getByText('retail-shelf-train')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'retail-train' })).toBeVisible()
  await expect(page.getByText('beverages_soda_500ml')).toBeVisible()

  await page.getByRole('tab', { name: 'Playground' }).click()
  await expect(page.getByText('Why this prediction')).toBeVisible()
  await expect(page.getByText('beverages_cola_330ml').first()).toBeVisible()

  await page.getByRole('tab', { name: 'Files' }).click()
  await expect(page.getByText('model.safetensors')).toBeVisible()

  await page.getByRole('tab', { name: 'Versions' }).click()
  await expect(
    page.getByRole('cell').filter({ hasText: 'viewing' }),
  ).toContainText('v3')
  await expect(
    page.getByRole('link', { name: 'v1', exact: true }),
  ).toBeVisible()
})

test('the version select navigates between model versions', async ({
  page,
}) => {
  await page.goto('/projects/retail/models/retail-resnet50-v3')

  await expect(
    page.getByRole('combobox', { name: 'Model version' }),
  ).toContainText('v3 (latest)')

  await page.getByRole('combobox', { name: 'Model version' }).click()
  await page.getByRole('option', { name: 'v2' }).click()

  await expect(page).toHaveURL(
    /\/projects\/retail\/models\/retail-resnet50-v2$/,
  )
  await expect(page.getByText('91.7%')).toBeVisible()
  await expect(page.getByText('▲ 5.1 pts vs v1')).toBeVisible()
})

test('breadcrumbs lead back from a model to the model list', async ({
  page,
}) => {
  await page.goto('/projects/retail/models/retail-resnet50-v3')

  const crumbs = page
    .locator('#dashboard-main')
    .getByRole('navigation', { name: 'Breadcrumb' })
  await expect(crumbs).toContainText('resnet50 v3')

  await crumbs.getByRole('link', { name: 'Models' }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/models$/)
})

test('shows an empty state for a project with no models', async ({ page }) => {
  await page.goto('/projects/churn/models')
  await expect(page.getByText('No models yet')).toBeVisible()
  await expect(page.getByRole('link', { name: 'New Training' })).toHaveCount(2)
})

test('an unknown model renders a recovery path', async ({ page }) => {
  await page.goto('/projects/retail/models/not-a-model')
  await expect(page.getByText('Model not found')).toBeVisible()
  await page.getByRole('link', { name: 'Return to models' }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/models$/)
})

test('model pages do not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  for (const path of [
    '/projects/retail/models',
    '/projects/retail/models/retail-resnet50-v3',
  ]) {
    await page.goto(path)
    await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
      'data-hydrated',
      'true',
    )
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    )
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0)
  }
})
