import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DASHBOARD_STORAGE_KEY } from '../src/features/dashboard/data'
import {
  API_URL,
  TENANT_ID,
  dashboardSummary,
  emptySummary,
  json,
  mockDashboardApi,
} from './fixtures/api'
import type { DashboardApi } from './fixtures/api'

let api: DashboardApi

async function openDashboard(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /Good morning, Alex/ }),
  ).toBeVisible()
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
}

test.beforeEach(async ({ page }) => {
  api = await mockDashboardApi(page)
  await openDashboard(page)
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
  await expect(page.getByRole('link', { name: 'New Project' })).toHaveCSS(
    'height',
    '36px',
  )
})

test('renders the workspace from the API', async ({ page }) => {
  const metrics = page.getByRole('region', { name: 'Workspace metrics' })
  await expect(metrics.getByText('182k')).toBeVisible()
  await expect(
    metrics.getByText('Active Projects').locator('..').getByText('2', {
      exact: true,
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: /Retail Vision Image Classification · 3 models Updated 5m ago/,
    }),
  ).toBeVisible()
  await expect(page.getByText('Deployment /retail-canary')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Run 44444444 · Retail Vision' }),
  ).toBeVisible()
  await expect(page.getByText('Epoch —/10')).toBeVisible()
  await expect(page.getByText('Running', { exact: true })).toBeVisible()
  await expect(page.getByText('Failed', { exact: true })).toBeVisible()

  // Mock auth: the tenant travels as core-api's dev header.
  expect(api.requests[0]['x-tenant-id']).toBe(TENANT_ID)
  expect(api.requests[0]['x-user-id']).toBe('dev-user')
})

test('each metric charts its own history', async ({ page }) => {
  const metrics = page.getByRole('region', { name: 'Workspace metrics' })
  const charts = metrics.getByRole('img', { name: /last 30 days/ })
  await expect(charts).toHaveCount(4)
  await expect(metrics.getByText('vs last 30d')).toHaveCount(4)

  // Drawn from the mocked history, not one shared placeholder line.
  const shapes = await charts
    .locator('polyline')
    .evaluateAll((lines) => lines.map((line) => line.getAttribute('points')))
  expect(shapes.every((points) => points?.split(' ').length === 30)).toBe(true)
  expect(new Set(shapes).size).toBe(4)
})

test('the checklist reflects what the workspace already has', async ({
  page,
}) => {
  const card = page.getByText('Getting started').locator('../..')
  // Projects, a dataset and runs exist in the fixture; no deployment counted.
  // 3 of 4 steps: the bar's indicator is offset by the remaining quarter.
  await expect(card.locator('[data-slot=progress-indicator]')).toHaveAttribute(
    'style',
    /translateX\(-25%\)/,
  )
})

test('cards do not link into pages that still read mock data', async ({
  page,
}) => {
  await page.getByRole('button', { name: '/retail-classify' }).click()
  await expect(
    page.getByText(/\/retail-classify is not available/),
  ).toBeVisible()
})

test('switching organization leaves the tenant dashboard alone', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Current organization/ }).click()
  await page.getByRole('menuitem', { name: /Northwind Labs/ }).click()
  await expect(
    page.getByRole('button', { name: /Current organization: Northwind Labs/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Retail Vision Image Classification/ }),
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

test('dataset upload validates, uploads and refreshes the dashboard', async ({
  page,
}) => {
  const uploads: string[] = []
  await page.route(`${API_URL}/v1/projects/*/datasets?name=*`, (route) => {
    uploads.push(route.request().url())
    return json(route, { id: 'ds-new', name: 'catalog-v3' }, 201)
  })
  await page.route(
    `${API_URL}/v1/projects/*/datasets/ds-new/tabular`,
    (route) => {
      uploads.push(route.request().url())
      // The server now has the dataset; the next summary shows it.
      const next = dashboardSummary()
      next.activity.unshift({
        id: 'dataset:ds-new',
        kind: 'dataset',
        action: 'create',
        name: 'catalog-v3',
        project_id: next.projects[1].id,
        project_name: 'Churn Model',
        actor: null,
        occurred_at: new Date().toISOString(),
      })
      api.summary = next
      return json(route, { rows: 1, columns: ['name', 'label'] })
    },
  )

  const csv = {
    name: 'catalog.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,label\na,1'),
  }
  const submit = page.getByRole('button', {
    name: 'Upload dataset',
    exact: true,
  })
  const dialog = page.getByRole('dialog')

  await page.getByRole('button', { name: 'Upload Dataset' }).click()
  await submit.click()
  await expect(dialog.getByRole('alert')).toContainText('Enter a dataset name')

  await page.getByLabel('Dataset name').fill('catalog-v3')
  await submit.click()
  await expect(dialog.getByRole('alert')).toContainText('Choose a project')

  // An image project does not take a CSV; nothing is sent.
  await page.getByLabel('Project', { exact: true }).click()
  await page.getByRole('option', { name: 'Retail Vision' }).click()
  await page.getByLabel('Dataset files').setInputFiles(csv)
  await submit.click()
  await expect(dialog.getByRole('alert')).toContainText(
    'Image Classification projects take a ZIP file here.',
  )
  expect(uploads).toEqual([])

  await page.getByLabel('Project', { exact: true }).click()
  await page.getByRole('option', { name: 'Churn Model' }).click()
  await submit.click()

  await expect(
    page.getByText('catalog-v3 uploaded to Churn Model.'),
  ).toBeVisible()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Dataset catalog-v3')).toBeVisible()
  expect(uploads).toHaveLength(2)
  expect(uploads[0]).toContain('/datasets?name=catalog-v3')
})

test('a rejected upload shows the reason from the API', async ({ page }) => {
  await page.route(`${API_URL}/v1/projects/*/datasets?name=*`, (route) =>
    json(route, { id: 'ds-new', name: 'catalog-v3' }, 201),
  )
  await page.route(
    `${API_URL}/v1/projects/*/datasets/ds-new/tabular`,
    (route) => json(route, { detail: 'CSV has no data rows' }, 400),
  )

  await page.getByRole('button', { name: 'Upload Dataset' }).click()
  await page.getByLabel('Dataset name').fill('catalog-v3')
  await page.getByLabel('Project', { exact: true }).click()
  await page.getByRole('option', { name: 'Churn Model' }).click()
  await page.getByLabel('Dataset files').setInputFiles({
    name: 'catalog.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,label'),
  })
  await page
    .getByRole('button', { name: 'Upload dataset', exact: true })
    .click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('alert')).toContainText('CSV has no data rows')
  await expect(dialog).toBeVisible()
})

test('activity expansion and onboarding dismissal work', async ({ page }) => {
  await expect(page.getByText('Project Retail Vision')).toBeHidden()
  await page
    .getByText('Recent activity')
    .locator('..')
    .getByRole('button', { name: 'View all', exact: true })
    .click()
  await expect(page.getByText('Project Retail Vision')).toBeVisible()
  await expect(page.getByText('created by alice')).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByText('Getting started')).not.toBeVisible()
  await page.reload()
  await expect(page.getByText('Getting started')).not.toBeVisible()
})

test('an API error is shown on each card and Retry recovers', async ({
  page,
}) => {
  await page.route(`${API_URL}/v1/dashboard`, (route) =>
    json(route, { detail: 'organization not provisioned' }, 403),
  )
  await page.reload()

  await expect(page.getByText('Could not load projects')).toBeVisible()
  await expect(page.getByText('organization not provisioned')).toHaveCount(4)
  // The counts fall back to a dash rather than a stale or invented number.
  await expect(
    page.getByRole('region', { name: 'Workspace metrics' }).getByText('—'),
  ).toHaveCount(4)

  await page.unroute(`${API_URL}/v1/dashboard`)
  await mockDashboardApi(page)
  await page.getByRole('button', { name: 'Retry' }).first().click()
  await expect(
    page.getByRole('button', { name: /Retail Vision Image Classification/ }),
  ).toBeVisible()
  await expect(page.getByText('Could not load projects')).toBeHidden()
})

test('cards show placeholders while the request is in flight', async ({
  page,
}) => {
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(`${API_URL}/v1/dashboard`, async (route) => {
    await held
    return json(route, dashboardSummary())
  })
  await page.reload()

  await expect(page.getByLabel('Loading').first()).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Retail Vision Image Classification/ }),
  ).toBeHidden()
  release()
  await expect(
    page.getByRole('button', { name: /Retail Vision Image Classification/ }),
  ).toBeVisible()
  await expect(page.getByLabel('Loading')).toHaveCount(0)
})

test('an empty workspace shows every empty state', async ({ page }) => {
  api.summary = emptySummary
  await page.reload()

  await expect(page.getByText('No activity yet')).toBeVisible()
  await expect(page.getByText('Create your first project')).toBeVisible()
  await expect(page.getByText('No live trainings')).toBeVisible()
  await expect(page.getByText('No deployments')).toBeVisible()
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
  await page.getByRole('button', { name: 'All Screens' }).click()
  await expect(page.getByText(/All Screens is not available/)).toBeVisible()
})

test('New Project links to the project creation flow', async ({ page }) => {
  await page.getByRole('link', { name: 'New Project' }).click()
  await expect(page).toHaveURL(/\/projects\/new$/)
})

test('sidebar state is session-only and resets on refresh', async ({
  page,
}) => {
  const sidebar = page.getByTestId('app-sidebar')
  await expect(sidebar).toHaveAttribute('data-state', 'expanded')

  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(sidebar).toHaveAttribute('data-state', 'collapsed')
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    'sidebar_state',
  )

  await page.reload()
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await expect(page.getByTestId('app-sidebar')).toHaveAttribute(
    'data-state',
    'expanded',
  )
})
