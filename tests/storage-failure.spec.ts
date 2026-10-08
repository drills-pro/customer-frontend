import { expect, test } from '@playwright/test'

/**
 * Privacy settings can make `localStorage` access throw, and a full quota makes
 * writes throw. Neither may break hydration or a user action.
 */
function breakStorage(mode: 'read' | 'write' | 'both') {
  return `
    const proto = Object.getPrototypeOf(window.localStorage)
    if (${mode !== 'write'}) {
      Object.defineProperty(proto, 'getItem', {
        configurable: true,
        value: () => {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    }
    if (${mode !== 'read'}) {
      Object.defineProperty(proto, 'setItem', {
        configurable: true,
        value: () => {
          throw new DOMException('quota', 'QuotaExceededError')
        },
      })
    }
  `
}

test('hydrates and stays usable when storage reads and writes throw', async ({
  page,
}) => {
  await page.addInitScript(breakStorage('both'))
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: /Good morning, Alex/ }),
  ).toBeVisible()
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible()

  // A preference change still applies in memory even though it cannot persist.
  await expect(page.getByText('Getting started')).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByText('Getting started')).toBeHidden()

  // Navigation keeps working after the failed write.
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

test('a blocked write alone does not break a user action', async ({ page }) => {
  await page.addInitScript(breakStorage('write'))
  await page.goto('/')
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute(
    'data-hydrated',
    'true',
  )

  await page.getByRole('button', { name: /Current organization/ }).click()
  await page.getByRole('menuitem', { name: /Northwind Labs/ }).click()
  await expect(
    page.getByRole('button', { name: /Current organization: Northwind Labs/ }),
  ).toBeVisible()
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible()
})
