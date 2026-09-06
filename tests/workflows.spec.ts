import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { STORAGE_KEY } from '../src/features/drills/data'

async function home(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /Good morning/ }),
  ).toBeVisible()
}
async function organization(page: Page, name: string) {
  const trigger = page.getByRole('button', { name: /Current organization/ })
  await trigger.click()
  await page
    .getByRole('menu')
    .getByRole('menuitem', { name: new RegExp(name) })
    .click()
  await expect(trigger).toContainText(name)
}

test('complete project → dataset → training → model → deployment journey persists', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await home(page)
  await page.getByRole('link', { name: 'New Project', exact: true }).click()
  await page.getByLabel('Project name').fill('Workflow Test')
  await page.getByLabel('Description').fill('Persistent demo workflow')
  await page.getByRole('button', { name: 'Continue →', exact: true }).click()
  await page.getByRole('button', { name: /Image Classification/ }).click()
  await page.getByRole('button', { name: 'Continue →', exact: true }).click()
  await page.getByRole('button', { name: /Empty project/ }).click()
  await page
    .getByRole('button', { name: 'Create project', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: /Workflow Test/ }),
  ).toBeVisible()
  const overview = page.url()
  const projectId = overview.split('/')[4]
  await page
    .locator('.project-tabs')
    .getByRole('link', { name: 'Datasets', exact: true })
    .click()
  await page.getByRole('button', { name: 'Add Dataset', exact: true }).click()
  await page.getByLabel('Dataset name').fill('test-images')
  await page.getByLabel('Source', { exact: true }).selectOption('sample')
  await page.getByRole('button', { name: 'Add dataset', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'test-images', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Create Training →' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'test-images', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Create Training →' }).click()
  await expect(page.getByRole('radio')).toBeChecked()
  await page.getByRole('button', { name: 'Continue →', exact: true }).click()
  await page.getByRole('button', { name: 'Continue →', exact: true }).click()
  await page.getByRole('slider').fill('5')
  await page.getByRole('button', { name: 'Continue →', exact: true }).click()
  await page.getByRole('button', { name: 'Continue →', exact: true }).click()
  await page.getByLabel('Run name').fill('test-efficientnet')
  await page.getByRole('button', { name: 'Start training' }).click()
  await expect(
    page.getByRole('heading', { name: /test-efficientnet/ }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'View model →' })).toBeVisible({
    timeout: 40000,
  })
  await page.getByRole('link', { name: 'View model →' }).click()
  await page.getByRole('button', { name: 'Use sample input' }).click()
  await page.getByRole('button', { name: 'Run prediction' }).click()
  await expect(page.locator('.prediction-result')).toContainText('96.4%')
  await page.getByRole('button', { name: 'Deploy →' }).click()
  await page.getByLabel('Endpoint name').fill('test-production')
  await page.getByRole('button', { name: 'Deploy model', exact: true }).click()
  await expect(page.locator('.page-head .badge')).toHaveText('Live')
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page
    .getByRole('button', { name: 'Pause deployment', exact: true })
    .click()
  await expect(page.locator('.page-head .badge')).toHaveText('Paused')
  await page.reload()
  await expect(page.locator('.page-head .badge')).toHaveText('Paused')
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(page.locator('.page-head .badge')).toHaveText('Live')
  await page.getByRole('button', { name: 'Edit scaling' }).click()
  await page.getByLabel('Min replicas').fill('2')
  await page.getByLabel('Max replicas').fill('5')
  await page.getByRole('button', { name: 'Save scaling' }).click()
  await page.reload()
  await expect(page.locator('.facts')).toContainText(['2 / 5', '2'])
  const counts = await page.evaluate(
    ({ key, projectId: savedProjectId }) => {
      const s = JSON.parse(localStorage.getItem(key)!)
      return {
        datasets: s.datasets.filter(
          (d: { projectId: string }) => d.projectId === savedProjectId,
        ).length,
        models: s.models.filter(
          (m: { projectId: string }) => m.projectId === savedProjectId,
        ).length,
      }
    },
    { key: STORAGE_KEY, projectId },
  )
  expect(counts).toEqual({ datasets: 1, models: 1 })
  expect(errors).toEqual([])
})

test('organizations isolate projects, empty states work, search and filters work', async ({
  page,
}) => {
  await home(page)
  await organization(page, 'Solo Sandbox')
  await expect(
    page.getByRole('heading', { name: 'Create your first project' }),
  ).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'No matching projects' }),
  ).toBeVisible()
  await organization(page, 'Northwind Labs')
  await expect(page.locator('.recent-projects')).toContainText('Doc Extractor')
  await expect(page.locator('.recent-projects')).not.toContainText(
    'Retail Vision',
  )
  await organization(page, 'Acme AI')
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click()
  await page.getByLabel('Search this list').fill('Retail')
  await expect(page.locator('.project-card-title')).toHaveCount(1)
  await page.getByLabel('All task types').click()
  await page.getByRole('option', { name: 'Text Classification' }).click()
  await expect(
    page.getByRole('heading', { name: 'No matching projects' }),
  ).toBeVisible()
  await page.getByLabel('Search this list').fill('')
  await expect(page.locator('.project-card-title')).toContainText(
    'Support Triage',
  )
  await page.getByRole('button', { name: 'List view' }).click()
  await expect(page.getByRole('table')).toContainText('Support Triage')
  await page.reload()
  await expect(
    page.getByRole('button', { name: /Current organization/ }),
  ).toContainText('Acme AI')
})

test('dataset upload validates files and metadata survives refresh', async ({
  page,
}) => {
  await home(page)
  await page.goto('/projects/retail/datasets')
  await page.getByRole('button', { name: 'Add Dataset', exact: true }).click()
  await page.getByLabel('Dataset files').setInputFiles({
    name: 'bad.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('no'),
  })
  await expect(page.getByRole('alert')).toContainText('Choose CSV')
  await page.getByLabel('Dataset files').setInputFiles({
    name: 'records.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,label\na,1\nb,2'),
  })
  await page.getByRole('button', { name: 'Add dataset', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Create Training →' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'records', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.file-list')).toContainText('records.csv')
  for (const name of ['Statistics', 'Quality', 'Versions', 'Preview']) {
    await page.getByRole('tab', { name, exact: true }).click()
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  }
  const download = page.waitForEvent('download')
  await page
    .locator('.page-head')
    .getByRole('button', { name: 'Download', exact: true })
    .click()
  expect((await download).suggestedFilename()).toBe('records-manifest.json')
})

test('run selection, comparison, stop and clone update saved records', async ({
  page,
}) => {
  await home(page)
  await page.goto('/projects/retail/training')
  await page.getByLabel('Select resnet50-v3', { exact: true }).check()
  await page.getByLabel('Select convnext-tiny', { exact: true }).check()
  await page.getByRole('button', { name: 'Compare runs' }).click()
  await expect(page.getByRole('dialog')).toContainText('94.2%')
  await expect(page.getByRole('dialog')).toContainText('92.8%')
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: 'efficientnet-b4', exact: true }).click()
  await page.getByRole('button', { name: 'Stop run', exact: true }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Stop run', exact: true })
    .click()
  await page.reload()
  await expect(page.locator('.page-head .badge')).toHaveText('Stopped')
  await page.getByRole('link', { name: 'Clone', exact: true }).click()
  await page.getByRole('button', { name: 'Continue →' }).click()
  await expect(
    page.getByRole('radio', { name: /EfficientNet-B4/ }),
  ).toBeChecked()
})

test('settings validation and deep links preserve project context', async ({
  page,
}) => {
  await home(page)
  await page.goto('/projects/retail/settings')
  await expect(page.getByLabel('Task type')).toBeDisabled()
  await page.getByLabel('Project name').fill('Support Triage')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('alert')).toContainText('unique project name')
  await page.getByLabel('Project name').fill('Retail Updated')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.reload()
  await expect(page.getByLabel('Project name')).toHaveValue('Retail Updated')
  await page.goto('/projects/docs/overview')
  await expect(
    page.getByRole('button', { name: /Current organization/ }),
  ).toContainText('Northwind Labs')
  await expect(
    page.getByRole('heading', { name: /Doc Extractor/ }),
  ).toBeVisible()
  await page.goto('/projects/retail/datasets/docs-train')
  await expect(
    page.getByRole('heading', { name: 'This resource could not be found' }),
  ).toBeVisible()
  await page.goto('/does-not-exist')
  await expect(
    page.getByRole('heading', { name: 'This resource could not be found' }),
  ).toBeVisible()
})

test('invalid storage recovers and reset clears changes', async ({ page }) => {
  await home(page)
  await page.evaluate(
    (key) => localStorage.setItem(key, '{broken'),
    STORAGE_KEY,
  )
  await page.reload()
  await expect(page.getByText(/fresh workspace/)).toBeVisible()
  await page.goto('/projects/retail/settings')
  await page.getByLabel('Project name').fill('Temporary rename')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page
    .getByRole('button', { name: 'Reset demo data', exact: true })
    .click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Reset demo data', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: /Good morning/ }),
  ).toBeVisible()
  await expect(page.locator('.recent-projects')).toContainText('Retail Vision')
  await expect(page.locator('.recent-projects')).not.toContainText(
    'Temporary rename',
  )
})

test('unavailable storage keeps session usable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'SecurityError')
    }
    Storage.prototype.getItem = () => {
      throw new DOMException('Blocked', 'SecurityError')
    }
  })
  await home(page)
  await expect(page.getByRole('alert')).toBeVisible()
  await page.goto('/projects')
  await expect(
    page.getByRole('heading', { name: 'Projects', exact: true }),
  ).toBeVisible()
})

test('mobile drawer, tabs and dialogs support keyboard and fit viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await home(page)
  await page.screenshot({
    path: testInfo.outputPath('dashboard-mobile.png'),
    fullPage: true,
  })
  const trigger = page.getByRole('button', { name: 'Toggle Sidebar' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page
    .getByRole('dialog', { name: 'Sidebar' })
    .getByRole('link', { name: 'Datasets', exact: true })
    .click()
  await expect(page.getByRole('dialog', { name: 'Sidebar' })).not.toBeVisible()
  await expect(
    page.getByRole('heading', { name: /Retail Vision/ }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'Add Dataset', exact: true }).click()
  await expect(page.getByLabel('Dataset name')).toBeFocused()
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() =>
        document
          .querySelector('[role="dialog"]')
          ?.contains(document.activeElement),
      ),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await page
    .getByRole('link', { name: 'retail-shelf-train', exact: true })
    .click()
  await page.getByRole('tab', { name: 'Preview', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    page.getByRole('tab', { name: 'Statistics', exact: true }),
  ).toBeFocused()
  await expect(
    page.getByRole('tab', { name: 'Statistics', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
})

test('desktop layouts and all core detail tabs render without page errors', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await home(page)
  await page.screenshot({
    path: testInfo.outputPath('dashboard-desktop.png'),
    fullPage: true,
  })
  await page.goto('/projects/retail/models/model-retail-run-23')
  for (const name of [
    'Performance',
    'Explainability',
    'Lineage',
    'Files',
    'Playground',
  ]) {
    await page.getByRole('tab', { name, exact: true }).click()
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  }
  await page.goto('/projects/retail/deployments/retail-prod')
  for (const name of [
    'Monitoring',
    'Playground',
    'Logs',
    'Settings',
    'Integration',
  ]) {
    await page.getByRole('tab', { name, exact: true }).click()
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  }
  for (const name of ['cURL', 'JavaScript', 'Go', 'Python']) {
    await page.getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.integration-code')).toContainText(
      'api.drills.example',
    )
  }
  await page.screenshot({
    path: testInfo.outputPath('deployment-desktop.png'),
    fullPage: true,
  })
  expect(errors).toEqual([])
})
