import { test, expect } from './fixtures';
import { ACME_SLUG, SIDE_SLUG } from './mock-api';

const settings = `/w/${ACME_SLUG}/settings`;
const teammate = {
  user_sub: 'ana',
  role: 'admin' as const,
  created_at: '2026-10-02T00:00:00Z',
  email: 'ana@example.com',
  display_name: 'Ana',
};

test('an owner offers ownership, sees it pending, and can cancel it', async ({ page, api }) => {
  api.members.push(teammate);
  await page.goto(settings);
  await page.getByTestId('ownership-open').click();
  await page.getByTestId('ownership-step-down').click();
  await page.getByTestId('ownership-send').click();
  await expect(page.getByTestId('ownership-offer')).toHaveAttribute('data-status', 'pending');
  expect(api.offer).toMatchObject({ to_sub: 'ana', step_down: true });
  await page.getByTestId('ownership-cancel').click();
  await expect(page.getByTestId('ownership-open')).toBeVisible();
  expect(api.offer).toBeNull();
});

test('an expired offer says so and Resend sends it again with a new expiry', async ({ page, api }) => {
  api.members.push(teammate);
  api.offer = { from_sub: 'me', to_sub: 'ana', step_down: false, created_at: '2026-11-01T00:00:00Z', expires_at: '2026-11-08T00:00:00Z' };
  await page.goto(settings);
  await expect(page.getByTestId('ownership-offer')).toHaveAttribute('data-status', 'expired');
  await page.getByTestId('ownership-resend').click();
  await expect(page.getByTestId('ownership-offer')).toHaveAttribute('data-status', 'pending');
  expect(api.offer?.expires_at).toBe('2026-11-25T00:00:00Z');
});

test('the person offered ownership can accept it', async ({ page, api }) => {
  api.offer = { from_sub: 'boss', to_sub: 'me', step_down: true, created_at: '2026-11-17T00:00:00Z', expires_at: '2026-11-25T00:00:00Z' };
  await page.goto(`/w/${SIDE_SLUG}/settings`);
  await expect(page.getByTestId('ownership-offer')).toHaveAttribute('data-status', 'pending');
  await expect(page.getByTestId('ownership-open')).toHaveCount(0);
  await page.getByTestId('ownership-accept').click();
  await expect(page.getByTestId('settings-ownership')).toHaveCount(0);
  expect(api.offer).toBeNull();
});
