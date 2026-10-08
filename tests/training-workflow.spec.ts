import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import {
  createEmptyProjectOverview,
  createProjectRecord,
  DASHBOARD_STORAGE_KEY,
} from '../src/features/dashboard/data'

async function advanceToReview(page: Page) {
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole('button', { name: /Continue/ }).click()
  }
  await expect(
    page.getByRole('heading', { name: 'Review and start' }),
  ).toBeVisible()
}

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

test('walks through the redesigned wizard and updates its summary', async ({
  page,
}) => {
  await expect(
    page.getByRole('button', { name: /retail-shelf-train/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('80 / 10 / 10')).toBeVisible()

  const trainSplit = page.getByRole('slider', { name: 'Train split' })
  await trainSplit.press('ArrowLeft')
  await expect(page.getByText('79 / 11 / 10')).toBeVisible()

  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /ResNet-50/ }).click()
  await expect(
    page.locator('[data-slot=item-title]').filter({ hasText: 'ResNet-50' }),
  ).toBeVisible()

  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('slider', { name: 'Learning rate' }).press('Home')
  await page.getByLabel('linear schedule').click()
  await page.getByRole('slider', { name: 'Batch size' }).press('ArrowRight')
  const randomCropSwitch = page.getByRole('switch', { name: 'Random crop' })
  await randomCropSwitch.click()
  await expect(randomCropSwitch).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('1e-5, linear')).toBeVisible()
  await expect(page.getByText('33').last()).toBeVisible()

  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /1× A100/ }).click()
  const spotSwitch = page.getByRole('switch', { name: 'Use spot instance' })
  const uncheckedStyles = await spotSwitch.evaluate((element) => {
    const thumb = element.querySelector('[data-slot=switch-thumb]')!
    return {
      background: getComputedStyle(element).backgroundColor,
      translate: getComputedStyle(thumb).translate,
    }
  })
  await spotSwitch.click()
  await expect(spotSwitch).toHaveAttribute('aria-checked', 'true')
  await expect
    .poll(() =>
      spotSwitch.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    )
    .not.toBe(uncheckedStyles.background)
  await expect
    .poll(() =>
      spotSwitch.evaluate(
        (element) =>
          getComputedStyle(element.querySelector('[data-slot=switch-thumb]')!)
            .translate,
      ),
    )
    .not.toBe(uncheckedStyles.translate)
  await spotSwitch.click()
  await expect(spotSwitch).toHaveAttribute('aria-checked', 'false')
  await expect
    .poll(() =>
      spotSwitch.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    )
    .toBe(uncheckedStyles.background)
  await expect
    .poll(() =>
      spotSwitch.evaluate(
        (element) =>
          getComputedStyle(element.querySelector('[data-slot=switch-thumb]')!)
            .translate,
      ),
    )
    .toBe(uncheckedStyles.translate)
  await spotSwitch.click()
  await expect(page.getByText('1× A100 (spot)')).toBeVisible()

  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.getByText('79% / 11% / 10%')).toBeVisible()
  await expect(
    page.getByText('30 epochs · batch 33 · lr 1e-5 (linear) · early stopping'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Edit model' }).click()
  await expect(
    page.getByRole('heading', { name: 'Choose a model' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Configure' })).toBeDisabled()
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

  await advanceToReview(page)
  await page.getByRole('button', { name: /Start training/ }).click()
  await expect(page).toHaveURL(/\/projects\/retail\/training\/run-[a-z0-9]+$/)
  await expect(page.getByText('Running', { exact: true })).toBeVisible()

  const persistedRuns = await page.evaluate((key) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value).trainingRuns : []
  }, DASHBOARD_STORAGE_KEY)
  expect(persistedRuns).toHaveLength(1)
  expect(persistedRuns[0]).toMatchObject({
    split: { train: 80, validation: 10, test: 10 },
    learningRate: 0.001,
    scheduler: 'cosine',
  })

  await page.reload()
  await expect(page.getByText('Running', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Config' }).click()
  await expect(page.getByText('80% / 10% / 10%')).toBeVisible()
  await expect(page.getByText('cosine')).toBeVisible()
})

test('filters logs, stops a run, and clones its complete configuration', async ({
  page,
}) => {
  await page.getByRole('slider', { name: 'Train split' }).press('ArrowLeft')
  await advanceToReview(page)
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
  await expect(page.getByText('79 / 11 / 10')).toBeVisible()
})

test('migrates legacy saved training configuration', async ({ page }) => {
  await advanceToReview(page)
  await page.getByRole('button', { name: /Start training/ }).click()
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}')
    const run = saved.trainingRuns[0]
    run.learningRate = 'low'
    delete run.split
    delete run.scheduler
    run.optimizer = 'AdamW'
    run.weightDecay = '0.01'
    run.warmupSteps = 500
    run.mixedPrecision = 'bf16'
    localStorage.setItem(key, JSON.stringify(saved))
  }, DASHBOARD_STORAGE_KEY)

  await page.reload()
  await page.getByRole('tab', { name: 'Config' }).click()
  await expect(page.getByText('0.0001')).toBeVisible()
  await expect(page.getByText('80% / 10% / 10%')).toBeVisible()
  await expect(page.getByText('cosine')).toBeVisible()
})

test('uses task-specific models, handles empty datasets, and remains responsive', async ({
  page,
}) => {
  const emptyProject = {
    ...createProjectRecord({
      name: 'Empty Training Project',
      description: '',
      orgId: 'acme',
      task: 'Image Classification',
      hasDataset: false,
    }),
    id: 'empty-training-project',
  }
  const emptyOverview = createEmptyProjectOverview({
    region: 'us-east-1',
    visibility: 'Organization',
    task: emptyProject.task,
    hasDataset: false,
  })
  await page.evaluate(
    ({ key, project, overview }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          organizationId: 'acme',
          createdProjects: [{ project, overview, startMethod: 'upload' }],
        }),
      )
    },
    {
      key: DASHBOARD_STORAGE_KEY,
      project: emptyProject,
      overview: emptyOverview,
    },
  )
  await page.goto('/projects/empty-training-project/training/new')
  await expect(page.getByText('Add a ready dataset first')).toBeVisible()
  await expect(page.getByRole('button', { name: /Continue/ })).toBeDisabled()

  await page.evaluate(() => localStorage.clear())
  await page.goto('/projects/support/training/new')
  await page.getByRole('button', { name: /Continue/ }).click()
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
