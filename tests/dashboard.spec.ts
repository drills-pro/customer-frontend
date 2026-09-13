import { expect, test } from '@playwright/test'
import { DASHBOARD_STORAGE_KEY } from '../src/features/dashboard/data'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /Good morning, Alex/ }),
  ).toBeVisible()
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
})

test('matches the reference page and card spacing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const layout = await page.locator('#dashboard-main').evaluate((element) => {
    const styles = getComputedStyle(element)
    const metrics = element.querySelector('[aria-label="Workspace metrics"]')
    const lowerContent = metrics?.nextElementSibling
    const firstMetric = metrics?.firstElementChild?.firstElementChild

    return {
      maxWidth: styles.maxWidth,
      paddingLeft: styles.paddingLeft,
      lowerContentMarginTop: lowerContent
        ? getComputedStyle(lowerContent).marginTop
        : null,
      metricPadding: firstMetric
        ? getComputedStyle(firstMetric).paddingTop
        : null,
    }
  })

  expect(layout).toEqual({
    maxWidth: '1448px',
    paddingLeft: '24px',
    lowerContentMarginTop: '24px',
    metricPadding: '20px',
  })
  await expect(page.getByRole('button', { name: 'New Project' })).toHaveCSS(
    'height',
    '36px',
  )
})

test('organization selection updates and persists the dashboard', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Current organization/ }).click()
  await page.getByRole('menuitem', { name: /Northwind Labs/ }).click()
  await expect(
    page.getByRole('button', { name: /Doc Extractor Document AI/ }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: /Current organization: Northwind Labs/ }),
  ).toBeVisible()
})

test('command search opens from keyboard and navigates to a project', async ({
  page,
}) => {
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByPlaceholder('Search projects, models, runs...').fill('Retail')
  await page.getByRole('option', { name: /Retail Vision/ }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/overview$/)
  await expect(
    page.getByRole('heading', { name: 'Retail Vision', exact: true }),
  ).toBeVisible()
})

test('dataset upload validates and adds recent activity', async ({ page }) => {
  await page.getByRole('button', { name: 'Upload Dataset' }).click()
  await page
    .getByRole('button', { name: 'Upload dataset', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('Enter a dataset name')
  await page.getByLabel('Dataset name').fill('catalog-v3')
  await page.getByLabel('Dataset files').setInputFiles({
    name: 'catalog.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,label\na,1'),
  })
  await page
    .getByRole('button', { name: 'Upload dataset', exact: true })
    .click()
  await expect(page.getByText('Dataset catalog-v3')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Dataset catalog-v3')).toBeVisible()
})

test('activity expansion and onboarding dismissal work', async ({ page }) => {
  await page
    .getByText('Recent activity')
    .locator('..')
    .getByRole('button', { name: 'View all', exact: true })
    .click()
  await expect(page.getByText('Model churn-xgb-v4')).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByText('Getting started')).not.toBeVisible()
  await page.reload()
  await expect(page.getByText('Getting started')).not.toBeVisible()
})

test('malformed storage recovers and mobile layout does not overflow', async ({
  page,
}) => {
  await page.evaluate(
    (key) => localStorage.setItem(key, '{broken'),
    DASHBOARD_STORAGE_KEY,
  )
  await page.reload()
  await expect(
    page.getByRole('button', { name: /Retail Vision Image Classification/ }),
  ).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    page.getByRole('button', { name: 'Toggle navigation' }),
  ).toBeVisible()
  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})

test('unavailable destination gives toast feedback', async ({ page }) => {
  await page.getByRole('button', { name: 'New Project' }).click()
  await expect(page.getByText(/New Project is not available/)).toBeVisible()
})
