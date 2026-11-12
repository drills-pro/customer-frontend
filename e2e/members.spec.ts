import { test, expect } from './fixtures';
import { ACME_SLUG } from './mock-api';

const members = `/w/${ACME_SLUG}/members`;

test('an owner alone is invited to invite', async ({ page }) => {
  await page.goto(members);
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'idle');
});

test('a mailed invitation says it was sent and shows no link', async ({ page, api }) => {
  api.mailInvites = true;
  await page.goto(members);
  await page.getByTestId('members-invite-open').click();
  await page.getByTestId('invite-email').fill('new@example.com');
  await page.getByTestId('invite-submit').click();

  await expect(page.getByTestId('invite-sent')).toBeVisible();
  await expect(page.getByTestId('invite-link')).toHaveCount(0);
  await page.getByTestId('invite-close').click();
  await expect(page.getByTestId(`members-invitation-${api.invitations[0].id}`)).toBeVisible();
});

test('inviting with mail off shows a one-time link and a pending row', async ({ page, api }) => {
  await page.goto(members);
  await page.getByTestId('members-invite-open').click();
  await page.getByTestId('invite-email').fill('new@example.com');
  await page.getByTestId('invite-submit').click();

  await expect(page.getByTestId('invite-link')).toBeVisible();
  await expect(page.getByTestId('invite-link')).toHaveValue(/\/invite\/tok_1$/);

  await page.getByTestId('invite-close').click();
  await expect(page.getByTestId(`members-invitation-${api.invitations[0].id}`)).toBeVisible();
  await expect(page.getByTestId('state-screen')).toHaveCount(0);
});

test('an invalid email cannot be submitted', async ({ page }) => {
  await page.goto(members);
  await page.getByTestId('members-invite-open').click();
  await expect(page.getByTestId('invite-submit')).toBeDisabled();
  await page.getByTestId('invite-email').fill('nope');
  await expect(page.getByTestId('invite-submit')).toBeDisabled();
  await page.getByTestId('invite-email').fill('ok@example.com');
  await expect(page.getByTestId('invite-submit')).toBeEnabled();
});

test('removing a member goes through a confirm dialog', async ({ page, api }) => {
  api.members.push({ user_sub: 'u2', role: 'member', created_at: '2026-10-02T00:00:00Z', email: 'two@example.com', display_name: null });
  await page.goto(members);
  await expect(page.getByTestId('members-row-u2')).toBeVisible();
  await expect(page.getByTestId('members-remove-me')).toHaveCount(0);

  await page.getByTestId('members-remove-u2').click();
  await page.getByTestId('remove-confirm').click();
  await expect(page.getByTestId('members-row-u2')).toHaveCount(0);
  expect(api.members.map((m) => m.user_sub)).toEqual(['me']);
});
