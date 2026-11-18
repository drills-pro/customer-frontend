import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { ACME_SLUG, PROJECT, model, settlePromotion } from './mock-api';

const MODELS = `/w/${ACME_SLUG}/projects/${PROJECT}/models`;
const row = (page: Page, id: string) => page.locator(`[data-testid="model-row"][data-model="${id}"]`);

test('promoting a version shows it deploying, then serving, and the one that served is a candidate again', async ({ page, api }) => {
  const v1 = model(api, 'Production');
  const v2 = model(api, 'Staging');
  await page.goto(MODELS);
  await expect(row(page, v1.id).getByTestId('model-serving')).toBeVisible();
  await expect(row(page, v2.id).getByTestId('model-promote')).toHaveAttribute('data-action', 'promote');

  await row(page, v2.id).getByTestId('model-promote').click();
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
  await expect(row(page, v1.id)).toHaveAttribute('data-stage', 'Production');
  await expect(row(page, v2.id)).toHaveAttribute('data-stage', 'Staging');
  await row(page, v2.id).getByTestId('model-promote').click();
  await expect(row(page, v2.id).getByTestId('model-promoting')).toBeVisible();
  expect(api.promoteCalls).toHaveLength(1);
});

test('a promotion refused for an unchecked run is retried only after the risk is accepted', async ({ page, api }) => {
  model(api, 'Production');
  const v2 = model(api, 'Staging', { promotion_status: 'failed', promotion_error_code: 'deploy_risk_unacknowledged' });
  await page.goto(MODELS);
  await expect(row(page, v2.id).getByTestId('model-promote')).toBeDisabled();
  await row(page, v2.id).getByTestId('model-promote-risk-accept').click();
  await row(page, v2.id).getByTestId('model-promote').click();
  await expect(row(page, v2.id).getByTestId('model-promoting')).toBeVisible();
  expect(api.promoteCalls.map((c) => c.acknowledge)).toEqual([true]);
});

test('the serving version has no stage to set by hand', async ({ page, api }) => {
  const v1 = model(api, 'Production');
  await page.goto(MODELS);
  await expect(row(page, v1.id).getByTestId('model-serving-note')).toBeVisible();
  await expect(row(page, v1.id).getByTestId('model-promote')).toHaveCount(0);
});
