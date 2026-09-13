import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/overview')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await expect(
    page.getByRole('heading', { name: 'Retail Vision', exact: true }),
  ).toBeVisible()
})

test('matches the reference project shell spacing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const content = page.locator('#dashboard-main')
  const breadcrumb = content.getByRole('navigation', { name: 'breadcrumb' })
  const projectNavigation = content.getByRole('navigation', {
    name: 'Project sections',
  })
  const pipeline = content
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Pipeline' })
    .first()

  await expect(content).toHaveCSS('padding-left', '24px')
  await expect(breadcrumb).toHaveCSS('margin-bottom', '12px')
  await expect(projectNavigation).toHaveCSS('column-gap', '24px')
  await expect(pipeline).toHaveCSS('margin-top', '24px')
})

test('renders the Retail Vision project overview', async ({ page }) => {
  const content = page.locator('#dashboard-main')
  await expect(content.getByText('23 runs · 3 running')).toBeVisible()
  await expect(
    content.getByRole('heading', { name: 'resnet50-v3', exact: true }),
  ).toBeVisible()
  await expect(content.getByText('94.2%', { exact: true })).toBeVisible()
  await expect(content.getByText('12 Jun 2026')).toBeVisible()
  await expect(
    content.getByRole('definition').filter({ hasText: 'PyTorch 2.4' }),
  ).toBeVisible()
  await expect(content.getByText('42 / 100 GPU hours')).toBeVisible()
  await expect(content.getByText('Usage, last 7 days')).toBeVisible()
  await expect(content.getByText('Alex Rivera', { exact: true })).toBeVisible()
  await expect(
    content.getByRole('img', {
      name: 'GPU hours usage for the last 7 days',
    }),
  ).toBeVisible()
  await expect(content.getByText('README.md')).toBeVisible()
  await expect(
    content.getByText(/Retail Vision classifies shelf photos/),
  ).toBeVisible()
  await expect(content.getByText('Architecture')).toBeVisible()
  await expect(content.getByText('Quickstart')).toBeVisible()
  await expect(content.getByText('Data drift:')).toBeVisible()
  await expect(content.getByText('Validation accuracy over runs')).toHaveCount(
    0,
  )
  await expect(page.getByRole('link', { name: 'Projects' })).toHaveAttribute(
    'data-active',
    'true',
  )
  await expect(
    page.getByRole('link', { name: 'Overview', exact: true }).last(),
  ).toHaveAttribute('data-active', 'true')
})

test('changes the resource usage interval for every chart', async ({
  page,
}) => {
  await page.getByRole('combobox', { name: 'Usage interval' }).click()
  await page.getByRole('option', { name: 'Month' }).click()

  await expect(page.getByText('Usage, last 7 months')).toBeVisible()
  await expect(page.getByText('91 / 100 GPU hours')).toBeVisible()
  await expect(
    page.getByRole('img', {
      name: 'Storage usage for the last 7 months',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('img', {
      name: 'Endpoints usage for the last 7 months',
    }),
  ).toBeVisible()
})

test('shows an exact usage value when a bar is hovered', async ({ page }) => {
  const latestGpuBar = page
    .getByTestId('usage-chart-gpu-hours')
    .locator('.recharts-bar-rectangle')
    .last()

  await latestGpuBar.hover()
  await expect(page.getByText('Sunday', { exact: true })).toBeVisible()
  await expect(page.getByText('8 GPU hours', { exact: true })).toBeVisible()
})

test('share works and project actions navigate', async ({ page }) => {
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await expect(
    page.getByText(/Project link copied|Select the address bar/),
  ).toBeVisible()

  await page.getByRole('link', { name: 'New Training' }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/training\/new$/)
  await page.goto('/projects/retail/overview')

  await page
    .getByRole('navigation', { name: 'Project sections' })
    .getByRole('link', { name: 'Datasets' })
    .click()
  await expect(page).toHaveURL(/\/projects\/retail\/datasets$/)
})

test('deep links synchronize the project organization', async ({ page }) => {
  await page.goto('/projects/docs/overview')
  await expect(
    page.getByRole('heading', { name: 'Doc Extractor', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: /Current organization: Northwind Labs/,
    }),
  ).toBeVisible()
  await expect(page.getByText('layoutlm-invoices')).toBeVisible()
})

test('unknown projects render a recovery path', async ({ page }) => {
  await page.goto('/projects/unknown/overview')
  await expect(
    page.getByRole('heading', { name: 'Project not found' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Return to Projects' }),
  ).toBeVisible()
})

test('project overview does not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible()
  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
