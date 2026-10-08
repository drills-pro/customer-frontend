import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
}

test('the user menu opens each account page', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  const openMenu = () => page.getByRole('button', { name: 'User menu' }).click()
  const nav = page.getByRole('navigation', { name: 'Account settings' })

  await openMenu()
  const menu = page.getByRole('menu')
  await expect(menu.getByText('alex@acme.ai')).toBeVisible()
  await expect(menu.getByText('760 / 2,000')).toBeVisible()
  await menu.getByRole('menuitem', { name: 'Billing & usage' }).click()
  await expect(page).toHaveURL(/\/account\/billing$/)
  await expect(
    page.getByRole('heading', { name: 'Billing & usage' }),
  ).toBeVisible()
  await expect(
    nav.getByRole('link', { name: 'Billing & usage' }),
  ).toHaveAttribute('aria-current', 'page')

  await openMenu()
  await page.getByRole('menuitem', { name: 'Account settings' }).click()
  await expect(page).toHaveURL(/\/account\/security$/)
  await expect(page.getByRole('heading', { name: 'Security' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Delete account' }),
  ).toBeVisible()

  await nav.getByRole('link', { name: 'Team' }).click()
  await expect(page.getByText('Alex Rivera (you)')).toBeVisible()
})

test('/account redirects to the profile tab', async ({ page }) => {
  await page.goto('/account')
  await waitForHydration(page)
  await expect(page).toHaveURL(/\/account\/profile$/)
  await expect(page.getByLabel('Full name')).toHaveValue('Alex Rivera')
})

test('profile edits validate, save and reset', async ({ page }) => {
  await page.goto('/account/profile')
  await waitForHydration(page)

  const save = page.getByRole('button', { name: 'Save changes' })
  await expect(save).toBeDisabled()

  await page.getByLabel('Email').fill('not-an-email')
  await save.click()
  await expect(page.getByText('Enter a valid email address.')).toBeVisible()

  await page.getByLabel('Email').fill('alex.rivera@acme.ai')
  await save.click()
  await expect(page.getByText('Profile saved')).toBeVisible()
  await expect(save).toBeDisabled()
})

test('deleting the account requires typing the username', async ({ page }) => {
  await page.goto('/account/security')
  await waitForHydration(page)

  await page.getByRole('button', { name: 'Delete account' }).click()
  const dialog = page.getByRole('alertdialog')
  const confirm = dialog.getByRole('button', { name: 'Delete my account' })
  await expect(confirm).toBeDisabled()
  await dialog.getByLabel('Type alexrivera to confirm').fill('alexrivera')
  await expect(confirm).toBeEnabled()
})

test('the appearance choice persists and shows in the user menu', async ({
  page,
}) => {
  await page.goto('/account/appearance')
  await waitForHydration(page)

  const html = page.locator('html')
  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(html).toHaveClass(/\bdark\b/)

  await page.reload({ waitUntil: 'commit' })
  // The boot script applies the saved theme before the app hydrates.
  await expect(html).toHaveClass(/\bdark\b/)
  await waitForHydration(page)
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked()

  await page.getByRole('button', { name: 'User menu' }).click()
  await expect(
    page.getByRole('menuitem', { name: 'Appearance' }),
  ).toContainText('Dark')
})

test('the system theme follows the OS color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/account/appearance')
  await waitForHydration(page)

  const html = page.locator('html')
  await expect(html).toHaveClass(/\blight\b/)

  await page.getByRole('radio', { name: 'System' }).click()
  await expect(html).toHaveClass(/\bdark\b/)

  await page.emulateMedia({ colorScheme: 'light' })
  await expect(html).toHaveClass(/\blight\b/)
  await expect(html).not.toHaveClass(/\bdark\b/)
})

test('keyboard shortcuts open the panel and navigate', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  await page.keyboard.press('ControlOrMeta+/')
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('Search shortcuts').fill('nothing matches')
  await expect(
    dialog.getByText('No shortcuts match your search.'),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.keyboard.press('Shift+?')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')

  await page.keyboard.press('g')
  await page.keyboard.press('a')
  await expect(page).toHaveURL(/\/account\/profile$/)

  // Single-key shortcuts stay quiet while typing.
  await page.getByLabel('Bio').focus()
  await page.keyboard.press('Shift+?')
  await expect(dialog).toBeHidden()
})

test('account pages do not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const tab of ['profile', 'security', 'billing', 'api-keys', 'team']) {
    await page.goto(`/account/${tab}`)
    await waitForHydration(page)
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(overflows, tab).toBe(false)
  }
})
