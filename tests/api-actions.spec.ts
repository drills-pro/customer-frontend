import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { storedRecords } from './fixtures/mock-db';

/**
 * Actions that used to be session-only or "not available" and now go through
 * the API. Each test makes a change, reloads, and checks it is still there:
 * the reload proves the change reached the (mock) server, not just the screen.
 */
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
}

test('project settings save the name, visibility, members and integrations', async ({ page }) => {
  await open(page, '/projects/retail/settings');

  await page.getByLabel('Project name').fill('Retail Vision 2');
  await page.getByRole('radio', { name: /Private/ }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Project settings saved.')).toBeVisible();

  await page.getByRole('button', { name: 'Invite', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Email').fill('new.hire@acme.ai');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Send invite|Invite/ })
    .click();
  await expect(page.getByText('Invitation sent to new.hire@acme.ai.')).toBeVisible();

  await page.getByRole('switch', { name: 'Webhooks' }).click();
  await expect(page.getByText('Webhooks connected.')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Project name')).toHaveValue('Retail Vision 2');
  await expect(page.getByRole('radio', { name: /Private/ })).toBeChecked();
  await expect(page.getByText('new.hire@acme.ai')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Webhooks' })).toBeChecked();
  // A renamed project keeps its id, so the link still works.
  await expect(page.getByRole('heading', { name: 'Retail Vision 2', level: 1 })).toBeVisible();
});

test('a project name already used in the organization is refused inline', async ({ page }) => {
  await open(page, '/projects/retail/settings');
  await page.getByLabel('Project name').fill('Support Triage');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('A project with this name already exists.')).toHaveCount(1);
});

test('a README is saved with the project', async ({ page }) => {
  await open(page, '/projects/churn/overview');
  await page.getByRole('button', { name: 'Add a README' }).click();
  await page.getByRole('textbox').fill('# Churn\n\nPredicts who leaves.');
  await page.getByRole('button', { name: 'Save README' }).click();
  await expect(page.getByText('Predicts who leaves.')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Predicts who leaves.')).toBeVisible();
});

test('a project can be archived, transferred and deleted', async ({ page }) => {
  await open(page, '/projects/churn/settings');

  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Archive project' }).click();
  await expect(page.getByText('Churn Predictor archived.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unarchive', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Transfer', exact: true }).click();
  await page.getByRole('combobox', { name: 'New organization' }).click();
  await page.getByRole('option', { name: 'Solo Sandbox' }).click();
  await page.getByRole('button', { name: 'Transfer project' }).click();
  await expect(page.getByText('Churn Predictor moved to Solo Sandbox.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Current organization: Solo Sandbox' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete project' }).click();
  await page.getByLabel(/to confirm/).fill('Churn Predictor');
  await page.getByRole('button', { name: 'Delete this project' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByText('Churn Predictor was deleted.')).toBeVisible();

  await page.goto('/projects/churn/overview');
  await expect(page.getByText('Project not found')).toBeVisible();
});

test('model versions can be promoted and a model deployed', async ({ page }) => {
  await open(page, '/projects/retail/models/retail-resnet50-v2');
  await page.getByRole('tab', { name: 'Versions' }).click();

  // v2 is archived and v3 is in production; promoting v2 swaps them.
  const v2 = page.getByRole('row').filter({ hasText: /^v2/ });
  await v2.getByRole('button', { name: 'Promote' }).click();
  await expect(page.getByText('v2 promoted to production.')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Versions' }).click();
  await expect(page.getByRole('row').filter({ hasText: /^v2/ }).getByRole('button', { name: 'Archive' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /^v3/ }).getByRole('button', { name: 'Promote' })).toBeVisible();

  // A version nothing serves yet can be deployed from its header.
  await page.goto('/projects/support/models/support-distilbert-triage-v1');
  await page.getByRole('button', { name: 'Deploy' }).click();
  await expect(page).toHaveURL(/\/projects\/support\/deployments\/distilbert-triage-v1-/);
  await expect(page.getByText('Deploying', { exact: true })).toBeVisible();
});

test('the playground runs a prediction through the API', async ({ page }) => {
  await open(page, '/projects/retail/models/retail-resnet50-v3');
  await page.getByRole('tab', { name: 'Playground' }).click();
  await expect(page.getByText('beverages_cola_330ml').first()).toBeVisible();
  await page.getByRole('button', { name: 'Run prediction' }).click();
  await expect(page.getByText('Prediction complete.')).toBeVisible();
});

test('a deployment can be paused, resumed, rescaled, rekeyed and deleted', async ({ page }) => {
  await open(page, '/projects/retail/deployments/retail-classify-canary');

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('retail-classify-canary paused.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Paused', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByText('retail-classify-canary resumed.')).toBeVisible();

  await page.getByRole('button', { name: 'Edit scaling' }).click();
  await page.getByLabel('Max replicas').fill('7');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Deployment settings saved.')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page.getByLabel('Max replicas')).toHaveValue('7');

  // Fewer max than min replicas is refused by the API, with its reason.
  await page.getByLabel('Max replicas').fill('0');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText(/Max replicas must be at least 1/)).toBeVisible();

  await page.getByRole('tab', { name: 'Integration' }).click();
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText(/200 OK in \d+ ms\./)).toBeVisible();
  await page.getByRole('button', { name: 'Rotate key' }).click();
  await expect(page.getByText('Copy this key now. It will not be shown again.')).toBeVisible();
  await expect(page.getByText(/^drl_sk_[0-9a-f]{36}$/)).toBeVisible();

  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Delete deployment' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete deployment' }).click();
  await expect(page).toHaveURL(/\/projects\/retail\/deployments$/);
  await expect(page.getByText('retail-classify-canary was deleted.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'retail-classify-canary' })).toHaveCount(0);
});

test('datasets import from a bucket and reprocess after a failure', async ({ page }) => {
  await open(page, '/projects/retail/datasets');
  await page.getByRole('button', { name: 'Add Dataset' }).first().click();
  await page.getByLabel('Dataset name').fill('bucket-import');
  await page.getByRole('combobox', { name: 'Dataset source' }).click();
  await page.getByRole('option', { name: 'Cloud bucket' }).click();
  await page.getByLabel('Bucket path').fill('s3://acme/shelf');
  await page.getByRole('button', { name: 'Add dataset', exact: true }).click();
  await expect(page.getByText('Dataset bucket-import added for processing.')).toBeVisible();
  await page.reload();
  const row = page.getByRole('row').filter({ hasText: 'bucket-import' });
  await expect(row).toContainText('1,200');
  await expect(row).toContainText('24 MB');

  await page.goto('/projects/retail/datasets/retail-legacy');
  await page.getByRole('button', { name: 'Retry processing' }).click();
  await expect(page.getByText('Processing dataset')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Processing dataset')).toBeVisible();
});

test('organization defaults, roles and ownership are saved', async ({ page }) => {
  await open(page, '/organizations/solo/settings');
  await page.getByRole('switch', { name: /Require two-factor/ }).click();
  await expect(page.getByText('2FA is now required.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('switch', { name: /Require two-factor/ })).toBeChecked();

  // The only member of Solo Sandbox is the owner: nobody to transfer to.
  await page.getByRole('button', { name: 'Transfer', exact: true }).click();
  await expect(page.getByText('No other active members')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/organizations/solo/members?invite=true');
  await page.getByLabel('Email addresses').fill('partner@sandbox.dev');
  await page.getByRole('button', { name: /Send/ }).click();
  await expect(page.getByText('Invitation sent to partner@sandbox.dev.')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: /Invitations/ }).click();
  await expect(page.getByText('partner@sandbox.dev')).toBeVisible();
});

test('the account pages save through the API', async ({ page }) => {
  await open(page, '/account/profile');
  await page.getByLabel('Full name').fill('Alex R. Rivera');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Full name')).toHaveValue('Alex R. Rivera');

  await page.goto('/account/notifications');
  const weekly = page.getByRole('switch', { name: 'Weekly usage summary' });
  await expect(weekly).not.toBeChecked();
  await weekly.click();
  // Wait for the answer: a reload would cancel a request still in flight.
  await expect(weekly).toBeChecked();
  await page.reload();
  await expect(weekly).toBeChecked();

  await page.goto('/account/security');
  await expect(page.getByText('Last changed 4 months ago.')).toBeVisible();
  await page.getByRole('button', { name: 'Change password' }).click();
  await page.getByLabel('Current password').fill('old-password');
  await page.getByLabel('New password', { exact: true }).fill('new-password-1');
  await page.getByLabel('Confirm new password').fill('new-password-1');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Change password|Update/ })
    .click();
  await expect(page.getByText('Password changed.')).toBeVisible();
  await expect(page.getByText('Last changed just now.')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out Safari on iPhone' }).click();
  await expect(page.getByText('Signed out of Safari on iPhone.')).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Safari on iPhone/)).toHaveCount(0);
  await expect(page.getByText(/Last changed (just now|1 minute ago)\./)).toBeVisible();
});

test('deleting an account that owns an organization is refused with the reason', async ({ page }) => {
  await open(page, '/account/security');
  await page.getByRole('button', { name: 'Delete account' }).click();
  await page.getByLabel(/to confirm/).fill('alexrivera');
  await page.getByRole('button', { name: 'Delete my account' }).click();
  await expect(page.getByText(/Transfer or delete the organizations you own first/)).toBeVisible();
});

test('API keys are created and revoked on the server, per project', async ({ page }) => {
  await open(page, '/projects/retail/settings');
  await page.getByRole('button', { name: 'Generate key' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('retail-ci');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Generate/ })
    .click();
  await expect(page.getByTestId('generated-api-key')).toHaveText(/^drl_sk_[0-9a-f]{36}$/);
  await page.getByRole('button', { name: 'Done' }).click();

  // A key made in one project is not listed in another, but is on the account.
  await page.goto('/projects/support/settings');
  await expect(page.getByText('prod-inference')).toBeVisible();
  await expect(page.getByText('retail-ci')).toHaveCount(0);
  await page.goto('/account/api-keys');
  await expect(page.getByText('retail-ci')).toBeVisible();

  await page.getByRole('button', { name: 'Revoke retail-ci' }).click();
  await page.getByRole('button', { name: 'Revoke key' }).click();
  await expect(page.getByText('retail-ci was revoked.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('prod-inference')).toBeVisible();
  await expect(page.getByText('retail-ci')).toHaveCount(0);
});

test('the header reads credits and notifications from the API', async ({ page }) => {
  await open(page, '/projects');
  await expect(page.getByText('1,240 credits')).toBeVisible();

  await page.getByRole('button', { name: 'Notifications' }).click();
  await expect(page.getByText('Training complete')).toBeVisible();
  await page.keyboard.press('Escape');

  // Opening the bell marked everything read, on the server.
  await expect.poll(() => storedRecords<{ read: boolean }>(page, 'notifications')).toEqual([expect.objectContaining({ read: true })]);

  // The credits belong to the organization being worked in.
  await page.getByRole('button', { name: /Current organization/ }).click();
  await page.getByRole('menuitem', { name: /Northwind Labs/ }).click();
  await expect(page.getByText('7,520 credits')).toBeVisible();
});
