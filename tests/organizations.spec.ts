import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
}

test('the organization switcher shows plans, counts and management links', async ({
  page,
}) => {
  await page.goto('/')
  await waitForHydration(page)

  await page
    .getByRole('button', { name: 'Current organization: Acme AI' })
    .click()
  const menu = page.getByRole('menu')
  await expect(menu.getByText('Switch organization')).toBeVisible()
  await expect(
    menu.getByText(/Team plan · \d+ projects · 24 members/),
  ).toBeVisible()
  await expect(
    menu.getByText(/Enterprise plan · \d+ projects · 86 members/),
  ).toBeVisible()

  await menu.getByRole('menuitem', { name: 'Manage members' }).click()
  await expect(page).toHaveURL(/\/organizations\/acme\/members$/)
  await expect(
    page.getByRole('heading', { name: 'Acme AI', level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('Showing 1–10 of 24')).toBeVisible()

  await page
    .getByRole('button', { name: 'Current organization: Acme AI' })
    .click()
  await page.getByRole('menuitem', { name: 'View all organizations' }).click()
  await expect(page).toHaveURL(/\/organizations$/)
  await expect(
    page.getByRole('heading', { name: 'Organizations' }),
  ).toBeVisible()
})

test('creating an organization switches to it and persists', async ({
  page,
}) => {
  await page.goto('/organizations')
  await waitForHydration(page)

  await page.getByRole('button', { name: 'Create organization' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Create organization' }).click()
  await expect(dialog.getByText('Organization name is required.')).toBeVisible()

  await dialog.getByLabel('Organization name').fill('Contoso Vision')
  await expect(dialog.getByLabel('URL')).toHaveValue('contoso-vision')
  await dialog.getByRole('button', { name: 'Create organization' }).click()

  await expect(page).toHaveURL(/\/organizations\/org-[a-z0-9]+\/overview$/)
  await expect(
    page.getByRole('button', { name: 'Current organization: Contoso Vision' }),
  ).toBeVisible()
  await expect(page.getByText('No projects yet')).toBeVisible()

  await page.reload()
  await waitForHydration(page)
  await expect(
    page.getByRole('button', { name: 'Current organization: Contoso Vision' }),
  ).toBeVisible()
})

test('members can be invited and removed', async ({ page }) => {
  await page.goto('/organizations/acme/members')
  await waitForHydration(page)

  await page.getByRole('button', { name: 'Invite members' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Email addresses').fill('not-an-email')
  await dialog.getByRole('button', { name: 'Send invite' }).click()
  await expect(
    dialog.getByText('Not a valid email: not-an-email'),
  ).toBeVisible()
  await dialog
    .getByLabel('Email addresses')
    .fill('new.person@acme.ai, second@acme.ai')
  await dialog.getByRole('button', { name: 'Send 2 invites' }).click()
  await expect(
    page.getByRole('cell', { name: /new\.person@acme\.ai/ }),
  ).toBeVisible()

  await page.getByRole('tab', { name: /Members/ }).click()
  await page.getByLabel('Search members').fill('marcus')
  const row = page.getByRole('row', { name: /Marcus/ }).first()
  const rowName = (await row.getByRole('paragraph').first().textContent()) ?? ''
  await row.getByRole('button', { name: /Actions for/ }).click()
  await page.getByRole('menuitem', { name: 'Remove from organization' }).click()
  await page.getByRole('button', { name: 'Remove member' }).click()
  await expect(
    page.getByText(`${rowName} was removed from Acme AI.`),
  ).toBeVisible()
})

test('settings rename a seeded organization and block deleting it', async ({
  page,
}) => {
  await page.goto('/organizations/solo/settings')
  await waitForHydration(page)

  const save = page.getByRole('button', { name: 'Save changes' })
  await expect(save).toBeDisabled()
  await page.getByLabel('Organization name').fill('Alex Lab')
  await save.click()
  await expect(
    page.getByRole('heading', { name: 'Alex Lab', level: 1 }),
  ).toBeVisible()

  await page.reload()
  await waitForHydration(page)
  await expect(page.getByLabel('Organization name')).toHaveValue('Alex Lab')
  await expect(page.getByRole('button', { name: 'Leave' })).toBeDisabled()
})

test('a created organization can be deleted', async ({ page }) => {
  await page.goto('/organizations')
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Create organization' }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Organization name')
    .fill('Temp Org')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Create organization' })
    .click()
  await page.getByRole('link', { name: 'Settings', exact: true }).last().click()

  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  const confirm = page.getByRole('button', { name: 'Delete organization' })
  await expect(confirm).toBeDisabled()
  await page.getByLabel('Type Temp Org to confirm').fill('Temp Org')
  await confirm.click()

  await expect(page).toHaveURL(/\/organizations$/)
  await expect(page.getByText('Temp Org was deleted.')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Current organization: Acme AI' }),
  ).toBeVisible()
})

test('accepting an invitation adds the organization', async ({ page }) => {
  await page.goto('/organizations')
  await waitForHydration(page)
  await expect(
    page.getByText('Marcus Chen invited you to join Globex Research'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Accept invitation' }).click()
  await expect(
    page.getByRole('link', { name: 'Globex Research' }),
  ).toBeVisible()
  await expect(
    page.getByText('Marcus Chen invited you to join Globex Research'),
  ).toBeHidden()
})

test('an unknown organization renders a recovery path', async ({ page }) => {
  await page.goto('/organizations/nope/overview')
  await waitForHydration(page)
  await expect(
    page.getByRole('heading', { name: 'Organization not found' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'View all organizations' }).click()
  await expect(page).toHaveURL(/\/organizations$/)
})
