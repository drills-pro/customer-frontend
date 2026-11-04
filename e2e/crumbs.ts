import type { Page } from '@playwright/test';

/** Below the shell's md breakpoint, where the breadcrumb keeps only its last two crumbs. */
export const PHONE = { width: 390, height: 844 };

/** The shell breadcrumb link to a URL, found by where it leads rather than its position, so a new hierarchy level does not break it. */
export function crumbTo(page: Page, href: string) {
  return page.getByTestId('shell-crumb').locator(`a[href="${href}"]`);
}
