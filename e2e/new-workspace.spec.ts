import { test, expect } from './fixtures';

test('the wizard creates a workspace and opens it', async ({ page, api }) => {
  api.workspaces = [];
  await page.goto('/new');
  await expect(page.getByTestId('wizard-step')).toHaveAttribute('data-step', 'details');
  await expect(page.getByTestId('wizard-create')).toBeDisabled();

  await page.getByTestId('wizard-name').fill('My Team');
  await expect(page.getByTestId('wizard-slug')).toHaveValue('my-team');
  await page.getByTestId('wizard-create').click();

  // One step: the workspace is made and opened, with no review or done screen in between.
  await expect.poll(() => api.workspaces.length).toBe(1);
  expect(api.workspaces[0].slug).toBe('my-team');
  await expect(page).toHaveURL('/w/my-team');
});

test('a taken handle gets a short ending instead of an error', async ({ page, api }) => {
  const taken = api.workspaces[0];
  await page.goto('/new');
  await page.getByTestId('wizard-name').fill(taken.name);
  const before = api.workspaces.length;
  await page.getByTestId('wizard-create').click();

  await expect.poll(() => api.workspaces.length).toBe(before + 1);
  const made = api.workspaces.at(-1)?.slug ?? '';
  expect(made).toMatch(new RegExp(`^${taken.slug}-[a-z0-9]{5}$`));
  await expect(page).toHaveURL(`/w/${made}`);
});

test('an unverified email starts on the verify step', async ({ page, api }) => {
  api.emailVerified = false;
  await page.goto('/new');
  await expect(page.getByTestId('wizard-step')).toHaveAttribute('data-step', 'verify');
  await expect(page.getByTestId('wizard-verify')).toBeVisible();
  await expect(page.getByTestId('wizard-name')).toHaveCount(0);
});

test('the verify step mails nothing by itself; only the resend button does', async ({ page, api }) => {
  api.emailVerified = false;
  await page.goto('/new');
  await expect(page.getByTestId('wizard-resend')).toBeVisible();
  await page.reload(); // a new mail would void the link sent at sign-up, so arriving never sends one
  await expect(page.getByTestId('wizard-verify-notice')).toHaveCount(0);
  expect(api.verificationMails).toBe(0);

  await page.getByTestId('wizard-resend').click();
  await expect(page.getByTestId('wizard-verify-notice')).toHaveAttribute('data-notice', 'sent');
  expect(api.verificationMails).toBe(1);
});
