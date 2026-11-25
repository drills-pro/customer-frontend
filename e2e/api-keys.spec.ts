import { test, expect } from './fixtures';
import { ACME_SLUG, PROJECT, SIDE_SLUG } from './mock-api';

const keysPage = `/w/${ACME_SLUG}/api-keys`;
const SECOND = '22222222-0000-4000-8000-000000000004';

test('the API keys tab lists keys and is in the sidebar for an owner', async ({ page }) => {
  await page.goto(`/w/${ACME_SLUG}/`);
  await expect(page.getByTestId('shell-nav-api-keys')).toBeVisible();
  await page.getByTestId('shell-nav-api-keys').click();
  await expect(page).toHaveURL(keysPage);
  await expect(page.getByTestId('keys-empty')).toBeVisible();
});

test('an owner creates a key for the project, sees the secret once, and it is listed', async ({ page, api }) => {
  await page.goto(keysPage);
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

test('several projects can be picked at once', async ({ page, api }) => {
  api.extraProjects.push({ ...api.project, id: SECOND, name: 'Second project' });
  await page.goto(keysPage);
  await page.getByTestId('keys-create-open').click();
  await page.getByTestId(`keys-project-${PROJECT}`).click();
  await page.getByTestId(`keys-project-${SECOND}`).click();
  await expect(page.getByTestId(`keys-project-${PROJECT}`).locator('input')).toBeChecked();
  await expect(page.getByTestId(`keys-project-${SECOND}`).locator('input')).toBeChecked();
  await page.getByTestId('keys-name').fill('both');
  await page.getByTestId('keys-create').click();
  await expect(page.getByTestId('keys-secret')).toHaveValue(/^drl_/);
  expect(api.apiKeys[0].project_ids.sort()).toEqual([PROJECT, SECOND].sort());
});

test('the expiry is a date picked on the calendar, sent as the end of that day', async ({ page, api }) => {
  await page.goto(keysPage);
  await page.getByTestId('keys-create-open').click();
  await page.getByTestId('keys-name').fill('dated');
  await page.getByTestId(`keys-project-${PROJECT}`).click();
  await page.getByTestId('keys-more').click();
  await page.getByTestId('keys-expiry').fill('12/31/2030');
  await page.getByTestId('keys-expiry').press('Enter');
  await page.getByTestId('keys-create').click();
  await expect(page.getByTestId('keys-secret')).toHaveValue(/^drl_/);
  const d = new Date(api.apiKeys[0].expires_at ?? '');
  expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2030, 11, 31]);
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
  await page.goto(keysPage);
  await page.getByTestId('keys-revoke-open').click();
  await page.getByTestId('keys-revoke-confirm').click();
  await expect.poll(() => api.apiKeys[0].revoked_at).not.toBeNull();
  await expect(page.getByTestId('keys-row')).toHaveAttribute('data-key-status', 'revoked');
  await expect(page.getByTestId('keys-revoke-open')).toHaveCount(0);
});

test('a member has no API keys tab', async ({ page }) => {
  await page.goto(`/w/${SIDE_SLUG}/`);
  await expect(page.getByTestId('shell-nav-settings')).toBeVisible();
  await expect(page.getByTestId('shell-nav-api-keys')).toHaveCount(0);
});
