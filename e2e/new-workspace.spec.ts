import { test, expect } from './fixtures';

test('the wizard creates a workspace and opens it', async ({ page, api }) => {
  api.workspaces = [];
  await page.goto('/new');
  await expect(page.getByTestId('wizard-step')).toHaveAttribute('data-step', 'details');
  await expect(page.getByTestId('wizard-next')).toBeDisabled();

  await page.getByTestId('wizard-name').fill('My Team');
  await expect(page.getByTestId('wizard-slug')).toHaveValue('my-team');
  await page.getByTestId('wizard-next').click();

  await expect(page.getByTestId('wizard-step')).toHaveAttribute('data-step', 'review');
  await page.getByTestId('wizard-create').click();

  await expect(page.getByTestId('wizard-step')).toHaveAttribute('data-step', 'done');
  await expect(page.getByTestId('wizard-bit')).toHaveAttribute('data-pose', 'ship');
  expect(api.workspaces).toHaveLength(1);

  await page.getByTestId('wizard-open').click();
  await expect(page).toHaveURL(`/w/${api.workspaces[0].slug}`);
});

test('an unverified email starts on the verify step', async ({ page, api }) => {
  api.emailVerified = false;
  await page.goto('/new');
  await expect(page.getByTestId('wizard-step')).toHaveAttribute('data-step', 'verify');
  await expect(page.getByTestId('wizard-verify')).toBeVisible();
  await expect(page.getByTestId('wizard-name')).toHaveCount(0);
});

test('the verify step has the link mailed once on arrival, and resend asks again', async ({ page, api }) => {
  api.emailVerified = false;
  await page.goto('/new');
  await expect(page.getByTestId('wizard-verify-notice')).toHaveAttribute('data-notice', 'sent');
  expect(api.verificationMails).toBe(1);

  await page.reload(); // the same tab does not mail again: that would replace the link already on its way
  await expect(page.getByTestId('wizard-verify-notice')).toHaveAttribute('data-notice', 'sent');
  expect(api.verificationMails).toBe(1);

  await page.getByTestId('wizard-resend').click();
  await expect.poll(() => api.verificationMails).toBe(2);
});
