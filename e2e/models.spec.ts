import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { ACME_SLUG, PROJECT, model, run, settlePromotion } from './mock-api';

const MODELS = `/w/${ACME_SLUG}/projects/${PROJECT}/models`;
const row = (page: Page, id: string) => page.locator(`[data-testid="model-row"][data-model="${id}"]`);
/** Opens a version's promote dialog and confirms it. */
async function promote(page: Page, id: string) {
  await row(page, id).getByTestId('model-promote').click();
  await page.getByTestId('model-promote-confirm').click();
}
/** Opens a version's row menu. */
const menu = (page: Page, id: string) => row(page, id).getByTestId('model-menu').click();

test('promoting a version asks first, shows it deploying, then serving, and the one that served is a candidate again', async ({
  page,
  api,
}) => {
  const v1 = model(api, 'Production');
  const v2 = model(api, 'Staging');
  await page.goto(MODELS);
  await expect(row(page, v1.id).getByTestId('model-serving')).toBeVisible();
  await expect(row(page, v2.id).getByTestId('model-promote')).toHaveAttribute('data-action', 'promote');

  // Closing the dialog promotes nothing.
  await row(page, v2.id).getByTestId('model-promote').click();
  await expect(page.getByTestId('model-promote-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(api.promoteCalls).toHaveLength(0);

  await promote(page, v2.id);
  // Pending: the version that serves keeps serving until the new one's deployment is active.
  await expect(row(page, v2.id).getByTestId('model-promoting')).toBeVisible();
  await expect(row(page, v1.id)).toHaveAttribute('data-stage', 'Production');
  expect(api.promoteCalls).toEqual([{ versionId: v2.id, stage: 'Production', acknowledge: false }]);

  settlePromotion(api, v2);
  await expect(row(page, v2.id)).toHaveAttribute('data-stage', 'Production', { timeout: 10_000 });
  await expect(row(page, v1.id)).toHaveAttribute('data-stage', 'Staging');
  await expect(page.getByTestId('model-serving')).toHaveCount(1); // one version is the serving one
});

test('promoting an older version than the serving one is offered as a rollback', async ({ page, api }) => {
  const v1 = model(api, 'Staging');
  model(api, 'Production');
  await page.goto(MODELS);
  await expect(row(page, v1.id).getByTestId('model-promote')).toHaveAttribute('data-action', 'rollback');
});

test('a promotion that failed leaves the stages as they were, says why, and can be tried again', async ({ page, api }) => {
  const v1 = model(api, 'Production');
  const v2 = model(api, 'Staging', {
    promotion_status: 'failed',
    promotion_error: 'server text the UI must not show',
    promotion_error_code: 'too_many_deployments',
  });
  await page.goto(MODELS);
  await expect(row(page, v2.id).getByTestId('model-promotion-failed')).toBeVisible();
  await expect(row(page, v2.id).getByTestId('model-status')).toHaveAttribute('data-status', 'failed');
  await expect(row(page, v1.id)).toHaveAttribute('data-stage', 'Production');
  await expect(row(page, v2.id)).toHaveAttribute('data-stage', 'Staging');
  await promote(page, v2.id);
  await expect(row(page, v2.id).getByTestId('model-promoting')).toBeVisible();
  expect(api.promoteCalls).toHaveLength(1);
});

test('a promotion refused for an unchecked run is retried only after the risk is accepted', async ({ page, api }) => {
  model(api, 'Production');
  const v2 = model(api, 'Staging', { promotion_status: 'failed', promotion_error_code: 'deploy_risk_unacknowledged' });
  await page.goto(MODELS);
  await row(page, v2.id).getByTestId('model-promote').click();
  await expect(page.getByTestId('model-promote-confirm')).toBeDisabled();
  await page.getByTestId('model-promote-risk-accept').click();
  await page.getByTestId('model-promote-confirm').click();
  await expect(row(page, v2.id).getByTestId('model-promoting')).toBeVisible();
  expect(api.promoteCalls.map((c) => c.acknowledge)).toEqual([true]);
});

test('the serving version has no promote and no stage to set by hand', async ({ page, api }) => {
  const v1 = model(api, 'Production');
  await page.goto(MODELS);
  await expect(row(page, v1.id).getByTestId('model-serving')).toBeVisible();
  await expect(row(page, v1.id).getByTestId('model-promote')).toHaveCount(0);
  await expect(row(page, v1.id).getByTestId('model-menu')).toHaveCount(0); // nothing left to offer
});

test('a stage is set from the row menu', async ({ page, api }) => {
  const v1 = model(api, 'Staging');
  await page.goto(MODELS);
  await expect(row(page, v1.id).getByTestId('model-status')).toHaveAttribute('data-status', 'candidate');
  await menu(page, v1.id);
  await expect(page.getByTestId('model-stage-Staging')).toHaveCount(0); // not the stage it has
  await page.getByTestId('model-stage-Archived').click();
  await expect(row(page, v1.id)).toHaveAttribute('data-stage', 'Archived');
  await expect(row(page, v1.id).getByTestId('model-status')).toHaveAttribute('data-status', 'archived');
  expect(api.promoteCalls).toEqual([{ versionId: v1.id, stage: 'Archived', acknowledge: false }]);
});

test("a version shows its run's score and links to the run", async ({ page, api }) => {
  const r = run(api, 'succeeded', { metrics: { accuracy: 0.91 } });
  const v1 = model(api, 'Staging', { training_run_id: r.id });
  await page.goto(MODELS);
  await expect(row(page, v1.id).getByTestId('model-score')).toHaveText('accuracy 0.91'); // lint-ok: a metric name and number, not copy
  await row(page, v1.id).getByTestId('model-run-link').click();
  await expect(page).toHaveURL(new RegExp(`/training/${r.id}$`));
});

test('an API that does not send the run still lists the version', async ({ page, api }) => {
  const v1 = model(api, 'Staging', { training_run_id: undefined });
  await page.goto(MODELS);
  await expect(row(page, v1.id)).toBeVisible();
  await expect(row(page, v1.id).getByTestId('model-run-link')).toHaveCount(0);
});
