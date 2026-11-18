import { test, expect } from './fixtures';
import { ACME_SLUG, PROJECT } from './mock-api';

const overview = `/w/${ACME_SLUG}/projects/${PROJECT}`;
const ana = { user_sub: 'ana', role: 'member' as const, created_at: '2026-10-02T00:00:00Z', email: 'ana@example.com', display_name: 'Ana' };

test('removing the last project admin explains the rule and makes someone else admin first', async ({ page, api }) => {
  api.members.push(ana);
  api.projectMembers.push({ user_sub: 'ana', roles: ['editor'], created_at: '2026-10-03T00:00:00Z' });
  await page.goto(overview);
  await page.getByTestId('project-team-remove-me').click();
  await page.getByTestId('team-remove-confirm').click();
  await expect(page.getByTestId('last-admin-blocked')).toBeVisible();
  expect(api.projectMembers.map((m) => m.user_sub)).toEqual(['me', 'ana']);

  await page.getByTestId('team-remove-confirm').click();
  await expect(page.getByTestId('last-admin-blocked')).toHaveCount(0);
  await expect(page.getByTestId('project-team-member')).toHaveCount(1);
  expect(api.projectMembers).toEqual([expect.objectContaining({ user_sub: 'ana', roles: ['editor', 'project_admin'] })]);
});

test('with nobody else to promote, the dialog says to invite someone first and offers no way to continue', async ({ page }) => {
  await page.goto(overview);
  await page.getByTestId('project-team-remove-me').click();
  await page.getByTestId('team-remove-confirm').click();
  await expect(page.getByTestId('last-admin-blocked')).toBeVisible();
  await expect(page.getByTestId('team-remove-confirm')).toBeDisabled();
});
