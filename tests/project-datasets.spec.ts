import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/datasets')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await expect(
    page.getByRole('heading', { name: 'Retail Vision', exact: true }),
  ).toBeVisible()
})

test('matches the reference toolbar and table spacing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const search = page.getByRole('textbox', { name: 'Search datasets' })
  const firstHeader = page.getByRole('columnheader', { name: 'Name' })
  const firstCell = page.getByRole('cell').first()

  await expect(search).toHaveCSS('height', '36px')
  await expect(firstHeader).toHaveCSS('padding-left', '16px')
  await expect(firstHeader).toHaveCSS('padding-top', '12px')
  await expect(firstCell).toHaveCSS('padding-left', '16px')
  await expect(firstCell).toHaveCSS('padding-top', '12px')
})

test('renders datasets and active project navigation', async ({ page }) => {
  for (const name of [
    'retail-shelf-train',
    'retail-shelf-val',
    'retail-shelf-test',
    'shelf-v2-raw',
    'legacy-import',
  ]) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible()
  }
  await expect(
    page.getByRole('link', { name: 'Datasets', exact: true }).last(),
  ).toHaveAttribute('data-active', 'true')
})

test('searches, filters, and switches dataset views', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Search datasets' }).fill('legacy')
  await expect(
    page.getByRole('link', { name: 'legacy-import', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'retail-shelf-train', exact: true }),
  ).not.toBeVisible()
  await page.getByRole('textbox', { name: 'Search datasets' }).fill('')

  await page.getByRole('combobox', { name: 'Filter by status' }).click()
  await page.getByRole('option', { name: 'Error' }).click()
  await expect(
    page.getByRole('link', { name: 'legacy-import', exact: true }),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Filter by type' }).click()
  await page.getByRole('option', { name: 'Validation' }).click()
  await expect(page.getByText('No datasets found')).toBeVisible()

  await page.getByRole('combobox', { name: 'Filter by status' }).click()
  await page.getByRole('option', { name: 'All statuses' }).click()
  await page.getByRole('radio', { name: 'Grid view' }).click()
  await expect(page.getByText('retail-shelf-val')).toBeVisible()
})

test('opens dataset details from table and grid views', async ({ page }) => {
  await page
    .getByRole('link', { name: 'retail-shelf-train', exact: true })
    .click()
  await expect(page).toHaveURL(/\/projects\/retail\/datasets\/retail-train$/)

  await page.goto('/projects/retail/datasets')
  await page.getByRole('radio', { name: 'Grid view' }).click()
  await page
    .getByRole('link', { name: 'retail-shelf-train', exact: true })
    .click()
  await expect(page).toHaveURL(/\/projects\/retail\/datasets\/retail-train$/)
})

test('validates, creates, and persists a local dataset', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Dataset' }).last().click()
  await page.getByRole('button', { name: 'Add dataset', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Enter a dataset name')
  await page.getByLabel('Dataset name').fill('catalog-v3')
  await page.getByLabel('Dataset files').setInputFiles({
    name: 'catalog.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,label\na,1'),
  })
  await page.getByRole('button', { name: 'Add dataset', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'catalog-v3', exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('link', { name: 'catalog-v3', exact: true }),
  ).toBeVisible()
})

test('handles project errors and mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false)
  await page.goto('/projects/unknown/datasets')
  await expect(
    page.getByRole('heading', { name: 'Project not found' }),
  ).toBeVisible()
})
