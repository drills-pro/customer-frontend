import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/projects/retail/overview')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
})

test('the Settings section tab navigates to project settings', async ({
  page,
}) => {
  await page
    .getByRole('navigation', { name: 'Project sections' })
    .getByRole('link', { name: 'Settings' })
    .click()

  await expect(page).toHaveURL(/\/projects\/retail\/settings$/)
  await expect(
    page.getByRole('navigation', { name: 'Settings sections' }),
  ).toBeVisible()
  await expect(page.getByLabel('Project name')).toHaveValue('Retail Vision')
})

test('general settings track unsaved changes and validate the name', async ({
  page,
}) => {
  await page.goto('/projects/retail/settings')
  const save = page.getByRole('button', { name: 'Save changes' })
  const reset = page.getByRole('button', { name: 'Reset' })
  const name = page.getByLabel('Project name')

  await expect(save).toBeDisabled()
  await expect(reset).toBeDisabled()

  await name.fill('')
  await expect(page.getByText('Project name is required.')).toBeVisible()
  await expect(save).toBeDisabled()

  await name.fill('Retail Vision 2')
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  await expect(save).toBeEnabled()

  await reset.click()
  await expect(name).toHaveValue('Retail Vision')
  await expect(save).toBeDisabled()

  await page.getByRole('radio', { name: 'Private' }).click()
  await save.click()
  await expect(save).toBeDisabled()
  await expect(page.getByText('Unsaved changes')).toHaveCount(0)
})

test('generates an API key once and revokes it', async ({ page }) => {
  await page.goto('/projects/retail/settings')

  await page.getByRole('button', { name: 'Generate key' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Key name').fill('staging-inference')
  await dialog.getByRole('button', { name: 'Generate key' }).click()

  await expect(dialog.getByTestId('generated-api-key')).toHaveText(
    /^drl_sk_[0-9a-f]{36}$/,
  )
  await dialog.getByRole('button', { name: 'Done' }).click()

  const row = page.getByRole('row').filter({ hasText: 'staging-inference' })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Revoke staging-inference' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Revoke key' })
    .click()
  await expect(row).toHaveCount(0)
})

test('deleting a project requires typing its name', async ({ page }) => {
  await page.goto('/projects/retail/settings')

  await page.getByRole('button', { name: 'Delete project' }).click()
  const dialog = page.getByRole('alertdialog')
  const confirm = dialog.getByRole('button', { name: 'Delete this project' })

  await expect(confirm).toBeDisabled()
  await dialog.getByRole('textbox').fill('retail vision')
  await expect(confirm).toBeDisabled()
  await dialog.getByRole('textbox').fill('Retail Vision')
  await expect(confirm).toBeEnabled()
})

test('the settings menu scrolls in one click and follows the page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/projects/retail/settings')
  const nav = page.getByRole('navigation', { name: 'Settings sections' })
  const dangerZone = page.locator('#danger-zone')

  await nav.getByRole('link', { name: 'Danger zone' }).click()
  await expect(nav.getByRole('link', { name: 'Danger zone' })).toHaveAttribute(
    'aria-current',
    'location',
  )
  await expect(dangerZone).toBeInViewport()
  await expect(page).toHaveURL(/#danger-zone$/)

  // The sticky menu stays clear of the 56px app header.
  const box = await nav.boundingBox()
  expect(box?.y ?? 0).toBeGreaterThanOrEqual(56)

  await nav.getByRole('link', { name: 'Members' }).click()
  await expect(nav.getByRole('link', { name: 'Members' })).toHaveAttribute(
    'aria-current',
    'location',
  )
  // A clicked card settles just below the header, not underneath it.
  await expect
    .poll(async () => (await page.locator('#members').boundingBox())?.y)
    .toBeCloseTo(88, 0)

  await page.mouse.move(900, 500)
  await page.mouse.wheel(0, -5000)
  await expect(nav.getByRole('link', { name: 'General' })).toHaveAttribute(
    'aria-current',
    'location',
  )
})

test('a settings deep link opens at its section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/projects/retail/settings#api-keys')
  await expect(
    page
      .getByRole('navigation', { name: 'Settings sections' })
      .getByRole('link', { name: 'API keys' }),
  ).toHaveAttribute('aria-current', 'location')
  await expect(
    page.getByRole('button', { name: 'Generate key' }),
  ).toBeInViewport()
})

test('a clicked section near the page bottom keeps the highlight', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/projects/retail/settings')
  const nav = page.getByRole('navigation', { name: 'Settings sections' })
  const integrations = nav.getByRole('link', { name: 'Integrations' })

  await nav.getByRole('link', { name: 'API keys' }).click()
  await integrations.click()

  // Wait for the smooth scroll to reach the page bottom, then make sure the
  // bottom-of-page rule did not move the highlight to Danger zone.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2,
      ),
    )
    .toBe(true)
  await page.waitForTimeout(300)
  await expect(integrations).toHaveAttribute('aria-current', 'location')

  // Scrolling by hand hands the highlight back to the scroll position.
  await page.mouse.move(900, 500)
  await page.mouse.wheel(0, -100)
  await page.mouse.wheel(0, 400)
  await expect(nav.getByRole('link', { name: 'Danger zone' })).toHaveAttribute(
    'aria-current',
    'location',
  )
})
