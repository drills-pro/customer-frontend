import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/overview')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
})

test('the Deployments section tab navigates to the deployment list', async ({
  page,
}) => {
  await page
    .getByRole('navigation', { name: 'Project sections' })
    .getByRole('link', { name: 'Deployments' })
    .click()

  await expect(page).toHaveURL(/\/projects\/retail\/deployments$/)

  // Grid is the default view here, so there is no table.
  await expect(page.getByRole('table')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'retail-classify-prod' }),
  ).toBeVisible()
  await expect(page.getByText('142,380')).toBeVisible()
})

test('filters deployments and switches to the table view', async ({ page }) => {
  await page.goto('/projects/retail/deployments')

  await page.getByRole('combobox', { name: 'Filter by status' }).click()
  await page.getByRole('option', { name: 'Paused' }).click()
  await expect(page.getByRole('link', { name: 'batch-nightly' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'retail-classify-prod' }),
  ).toHaveCount(0)

  await page.getByRole('combobox', { name: 'Filter by status' }).click()
  await page.getByRole('option', { name: 'All statuses' }).click()
  await page.getByRole('radio', { name: 'Table view' }).click()

  const table = page.getByRole('table')
  // Four deployments plus the header row.
  await expect(table.getByRole('row')).toHaveCount(5)
  await expect(table.getByRole('cell', { name: 'Production' })).toBeVisible()
})

test('a deployment links back to the model it serves', async ({ page }) => {
  await page.goto('/projects/retail/deployments')

  await page.getByRole('link', { name: 'resnet50 v3' }).first().click()
  await expect(page).toHaveURL(
    /\/projects\/retail\/models\/retail-resnet50-v3$/,
  )
})

test('opens a deployment and moves through every tab', async ({ page }) => {
  await page.goto('/projects/retail/deployments')
  await page.getByRole('link', { name: 'retail-classify-prod' }).click()

  await expect(page).toHaveURL(
    /\/projects\/retail\/deployments\/retail-classify-prod$/,
  )
  await expect(
    page.getByRole('heading', { name: 'retail-classify-prod' }),
  ).toBeVisible()
  await expect(
    page.getByText('https://api.drills.ai/v1/ep/rc-prod-8f2a/predict').first(),
  ).toBeVisible()

  // Monitoring: the percentiles share one scale, labelled by p99.
  await expect(page.getByText('scale 0 – 218 ms')).toBeVisible()
  await expect(page.getByText('the number to quote in an SLA')).toBeVisible()

  await page.getByRole('tab', { name: 'Integration' }).click()
  await expect(page.getByText('import requests')).toBeVisible()
  await page.getByRole('tab', { name: 'Go', exact: true }).click()
  await expect(page.getByText('http.NewRequest')).toBeVisible()
  await expect(page.getByText('Send a test request')).toBeVisible()

  await page.getByRole('tab', { name: 'Logs' }).click()
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(8)
  await page.getByRole('combobox', { name: 'Filter by status' }).click()
  await page.getByRole('option', { name: '5xx' }).click()
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2)

  await page.getByRole('tab', { name: 'Settings' }).click()
  await expect(
    page.getByRole('textbox', { name: 'Deployment name' }),
  ).toHaveValue('retail-classify-prod')
  await expect(page.getByText('Danger zone')).toBeVisible()
})

test('a paused deployment reports no traffic instead of empty charts', async ({
  page,
}) => {
  await page.goto('/projects/retail/deployments/retail-batch-nightly')

  await expect(page.getByText('No traffic', { exact: true })).toBeVisible()
  await expect(page.getByText('no traffic while paused')).toBeVisible()

  await page.getByRole('tab', { name: 'Logs' }).click()
  await expect(page.getByText('No requests')).toBeVisible()
})

test('breadcrumbs lead back from a deployment to the list', async ({
  page,
}) => {
  await page.goto('/projects/retail/deployments/retail-classify-prod')

  const crumbs = page
    .locator('#dashboard-main')
    .getByRole('navigation', { name: 'Breadcrumb' })
  await expect(crumbs).toContainText('retail-classify-prod')

  await crumbs.getByRole('link', { name: 'Deployments' }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/deployments$/)
})

test('shows an empty state for a project with no deployments', async ({
  page,
}) => {
  await page.goto('/projects/churn/deployments')
  await expect(page.getByText('No deployments yet')).toBeVisible()
  await page.getByRole('link', { name: 'View models' }).click()
  await expect(page).toHaveURL(/\/projects\/churn\/models$/)
})

test('an unknown deployment renders a recovery path', async ({ page }) => {
  await page.goto('/projects/retail/deployments/not-a-deployment')
  await expect(page.getByText('Deployment not found')).toBeVisible()
  await page.getByRole('link', { name: 'Return to deployments' }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/deployments$/)
})

test('the dashboard deployment card opens a real deployment', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )

  await page.getByRole('link', { name: 'retail-classify-prod' }).click()
  await expect(page).toHaveURL(
    /\/projects\/retail\/deployments\/retail-classify-prod$/,
  )
})

test('deployment pages do not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  for (const path of [
    '/projects/retail/deployments',
    '/projects/retail/deployments/retail-classify-prod',
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
