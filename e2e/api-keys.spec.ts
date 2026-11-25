import { test, expect } from './fixtures';
import { ACME_SLUG, PROJECT, SIDE_SLUG } from './mock-api';

const settings = `/w/${ACME_SLUG}/settings`;

test('an owner creates a key for the project, sees the secret once, and it is listed', async ({ page, api }) => {
  await page.goto(settings);
  await expect(page.getByTestId('keys-empty')).toBeVisible();
  await page.getByTestId('keys-create-open').click();
  await expect(page.getByTestId('keys-create')).toBeDisabled();
  await page.getByTestId('keys-name').fill('website');
  await page.getByTestId(`keys-project-${PROJECT}`).click();
  await expect(page.getByTestId('keys-create')).toBeEnabled();
  await page.getByTestId('keys-create').click();
  await expect(page.getByTestId('keys-secret')).toHaveValue(/^drl_/);
  expect(api.apiKeys).toHaveLength(1);
  expect(api.apiKeys[0].project_ids).toEqual([PROJECT]);
  await page.getByTestId('keys-done').click();
  await expect(page.getByTestId('keys-row')).toHaveCount(1);
  await expect(page.getByTestId('keys-row')).toHaveAttribute('data-key-status', 'active');
});

test('revoke asks first, then the key is listed as revoked', async ({ page, api }) => {
  api.apiKeys.push({
    id: '11111111-0000-4000-8000-000000000001',
    name: 'mobile',
    prefix: 'drl_abcdefgh',
    project_ids: [PROJECT],
    expires_at: null,
    created_at: '2026-11-01T00:00:00Z',
    revoked_at: null,
    secret: 'drl_unused',
  });
  await page.goto(settings);
  await page.getByTestId('keys-revoke-open').click();
  await page.getByTestId('keys-revoke-confirm').click();
  await expect.poll(() => api.apiKeys[0].revoked_at).not.toBeNull();
  await expect(page.getByTestId('keys-row')).toHaveAttribute('data-key-status', 'revoked');
  await expect(page.getByTestId('keys-revoke-open')).toHaveCount(0);
});

test('a member has no keys card', async ({ page }) => {
  await page.goto(`/w/${SIDE_SLUG}/settings`);
  await expect(page.getByTestId('settings-name')).toBeVisible();
  await expect(page.getByTestId('keys-card')).toHaveCount(0);
});
