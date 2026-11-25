import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { BUNDLE_BOUNDS } from '@/modules/training/constants';
import { crumbTo } from './crumbs';
import { ACME_SLUG, PROJECT, bundlePreset, dataset, importOf, progressOf, run, versionOf, type ApiState } from './mock-api';

const BASE = `/w/${ACME_SLUG}/projects/${PROJECT}`;
const NEW = `${BASE}/training/new`;
const RUN_URL = new RegExp(`${BASE}/training/[0-9a-f-]{36}$`);

/** An image project with one dataset that has one committed version. */
function withVersion(api: ApiState) {
  api.project.task_type = 'image-classification';
  const d = dataset(api, { task_type: 'image-classification' });
  const v = versionOf(api, d.id, importOf(api, d.id, { status: 'succeeded' }).id);
  return { d, v };
}

/** The button that moves on: Next from the data-and-model screen, Start on the settings screen. */
const next = (page: Page) => page.getByTestId('training-next').or(page.getByTestId('training-start'));
const field = (page: Page, name: string) => page.getByTestId(`training-${name}`).locator('input');
/** The value a setting slider shows beside its name. */
const shown = (page: Page, name: string) => page.getByTestId(`training-${name}-value`);
/** The settings step's Recommended | Custom switch; `data-mode` says which is on. */
const mode = (page: Page) => page.getByTestId('training-mode');
/** Switches the settings step to Custom, where the sliders, the number fields and the seed are. */
const custom = (page: Page) => page.getByTestId('training-mode-custom').click();
/** Switches the settings step back to Recommended, which sets the preset's defaults. */
const recommendedMode = (page: Page) => page.getByTestId('training-mode-recommended').click();
/** Moves a setting slider to its minimum, then `steps` up from there, with the keyboard. */
async function slide(page: Page, name: string, steps: number) {
  const thumb = page.getByTestId(`training-${name}`).locator('[data-part="thumb"]');
  await thumb.focus();
  await thumb.press('Home');
  // One press after another: each has to land before the next.
  await Array.from({ length: steps }).reduce<Promise<void>>((done) => done.then(() => thumb.press('ArrowRight')), Promise.resolve());
}

/** From the data step, with its defaults, to the review step. */
async function toSettings(page: Page) {
  await expect(page.getByTestId('training-versions')).toBeVisible();
  await page.getByTestId('training-next').click();
  await expect(page.getByTestId('training-start')).toBeVisible();
}

test('walks the data and model, then the settings, then follows the new run', async ({ page, api }) => {
  const { v } = withVersion(api);
  await page.goto(NEW);
  // The first dataset and its newest version come preselected.
  await expect(page.getByTestId(`training-version-${v.id}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('summary-version')).toBeVisible();

  // The data and the model share one screen.
  await expect(page.getByTestId('training-preset-small')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('training-preset-medium').click();
  await expect(page.getByTestId('training-preset-medium')).toHaveAttribute('aria-pressed', 'true');
  await next(page).click();

  // The new preset's defaults, shown as the recommended settings.
  await expect(mode(page)).toHaveAttribute('data-mode', 'recommended');
  await expect(shown(page, 'epochs')).toHaveText('20'); // lint-ok: a number, not copy
  await expect(shown(page, 'batch_size')).toHaveText('16'); // lint-ok: a number, not copy
  await custom(page);
  await expect(field(page, 'epochs')).toHaveValue('20');
  await slide(page, 'epochs', 4);
  await expect(field(page, 'epochs')).toHaveValue('5');

  await page.getByTestId('training-start').click();
  await expect(page).toHaveURL(RUN_URL);
  expect(api.runBodies).toEqual([
    { dataset_version_id: v.id, preset: 'medium', hyperparameters: { epochs: 5, batch_size: 16, image_size: 224 }, seed: 42 },
  ]);
  expect(api.runKeys[0]).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.getByTestId('training-status')).toHaveAttribute('data-status', 'submitted');
  await expect(page.getByTestId('training-run-working')).toBeVisible();
  await expect(page.getByTestId('training-run-data')).toBeVisible();
  // The run page sits under the project's training list in the breadcrumb.
  await expect(crumbTo(page, BASE)).toBeVisible();
  await expect(crumbTo(page, `${BASE}/training`)).toBeVisible();
  await expect(page.getByTestId('project-tab-training')).toHaveAttribute('aria-selected', 'true');
});

test('a dataset with no versions cannot go on', async ({ page, api }) => {
  api.project.task_type = 'image-classification';
  dataset(api, { task_type: 'image-classification' });
  await page.goto(NEW);
  await expect(page.getByTestId('training-no-versions')).toBeVisible();
  await expect(next(page)).toBeDisabled();
});

test('a project with no datasets is sent to make one', async ({ page, api }) => {
  api.project.task_type = 'image-classification';
  await page.goto(NEW);
  await expect(page.getByTestId('training-no-datasets')).toBeVisible();
  await expect(next(page)).toBeDisabled();
});

test('settings stay inside the preset bounds; a bad seed blocks the next step; Recommended restores the defaults', async ({
  page,
  api,
}) => {
  withVersion(api);
  await page.goto(NEW);
  await expect(page.getByTestId('training-versions')).toBeVisible();
  await page.getByTestId('training-next').click();
  // The sliders, the seed and the preset's method wait under Custom.
  await expect(page.getByTestId('training-epochs')).toBeHidden();
  await expect(field(page, 'seed')).toBeHidden();
  await custom(page);
  await expect(page.getByTestId('training-method')).toBeVisible();
  await expect(page.getByTestId('training-method-base-model')).toBeVisible();
  // The slider cannot leave the bounds: End is the preset's maximum.
  await page.getByTestId('training-epochs').locator('[data-part="thumb"]').press('End');
  await expect(field(page, 'epochs')).toHaveValue('100');
  await expect(next(page)).toBeEnabled();

  await expect(field(page, 'seed')).toHaveValue('42');
  await field(page, 'seed').fill('99999999999');
  await expect(next(page)).toBeDisabled();
  await expect(page.getByTestId('training-seed')).toHaveAttribute('data-invalid', '');

  await recommendedMode(page);
  await expect(shown(page, 'epochs')).toHaveText('10'); // lint-ok: a number, not copy
  await expect(next(page)).toBeEnabled();
});

test("a bundle task's settings come from the selected model, bounded by its manifest", async ({ page, api }) => {
  withVersion(api);
  api.presets = [bundlePreset('small', 30, 16), bundlePreset('medium', 40, 8)];
  await page.goto(NEW);
  await expect(page.getByTestId('training-versions')).toBeVisible();
  await page.getByTestId('training-next').click();
  await expect(shown(page, 'epochs')).toHaveText('30'); // lint-ok: a number, not copy
  await expect(shown(page, 'batch_size')).toHaveText('16'); // lint-ok: a number, not copy
  await expect(next(page)).toBeEnabled();
  // End is the manifest's maximum, not a bound the preset sends.
  await custom(page);
  await page.getByTestId('training-epochs').locator('[data-part="thumb"]').press('End');
  await expect(field(page, 'epochs')).toHaveValue(String(BUNDLE_BOUNDS.epochs.max));

  // Another model brings its own defaults; Custom stays on.
  await page.getByTestId('training-back').click();
  await page.getByTestId('training-preset-medium').click();
  await next(page).click();
  await expect(mode(page)).toHaveAttribute('data-mode', 'custom');
  await expect(field(page, 'epochs')).toHaveValue('40');
  await expect(field(page, 'batch_size')).toHaveValue('8');
  await page.getByTestId('training-start').click();
  await expect(page).toHaveURL(RUN_URL);
  expect(api.runBodies[0]).toMatchObject({ preset: 'medium', hyperparameters: { epochs: 40, batch_size: 8, image_size: 224 } });
});

test('a text project has no image size and does not send one', async ({ page, api }) => {
  withVersion(api);
  api.project.task_type = 'text-classification';
  await page.goto(NEW);
  await expect(page.getByTestId('training-versions')).toBeVisible();
  await next(page).click();
  await custom(page);
  await expect(page.getByTestId('training-epochs')).toBeVisible();
  await expect(page.getByTestId('training-image_size')).toHaveCount(0);
  await expect(shown(page, 'image_size')).toHaveCount(0);
  await page.getByTestId('training-start').click();
  await expect(page).toHaveURL(RUN_URL);
  expect(api.runBodies[0]).toMatchObject({ hyperparameters: { epochs: 10, batch_size: 32 } });
  expect(api.runBodies[0]).not.toHaveProperty('hyperparameters.image_size');
});

test('a task with no presets says it cannot train', async ({ page, api }) => {
  withVersion(api);
  api.presets = [];
  await page.goto(NEW);
  await expect(page.getByTestId('training-blocked')).toBeVisible();
  await expect(page.getByTestId('training-next')).toHaveCount(0);
});

test('a task the server refuses to train says so instead of the form', async ({ page, api }) => {
  withVersion(api);
  api.failPresets = { status: 422, code: 'task_type_not_trainable' };
  await page.goto(NEW);
  await expect(page.getByTestId('training-blocked')).toBeVisible();
});

test('a retry of the same request reuses its key; a changed request gets a new one', async ({ page, api }) => {
  withVersion(api);
  api.failCreates = [
    { status: 503, code: 'training_start_failed' },
    { status: 429, code: 'too_many_training_runs' },
  ];
  await page.goto(NEW);
  await toSettings(page);

  await page.getByTestId('training-start').click();
  await expect(page.getByTestId('training-error')).toBeVisible();
  await page.getByTestId('training-start').click();
  await expect.poll(() => api.runKeys.length).toBe(2);
  expect(api.runKeys[1]).toBe(api.runKeys[0]);
  await expect(page.getByTestId('training-error')).toBeVisible();

  await page.getByTestId('training-back').click();
  await page.getByTestId('training-preset-medium').click();
  await page.getByTestId('training-next').click();
  await page.getByTestId('training-start').click();
  await expect(page).toHaveURL(RUN_URL);
  expect(api.runKeys).toHaveLength(3);
  expect(api.runKeys[2]).not.toBe(api.runKeys[0]);
});

test('the run page follows a running run to its result', async ({ page, api }) => {
  await page.clock.install();
  const r = run(api, 'running', { metrics: { accuracy: 0.91, note: 'not a number' } });
  api.epoch = 1;
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('training-run-working')).toBeVisible();
  await page.getByTestId('training-run-tab-steps').click();
  await expect(page.getByTestId('training-step-training')).toHaveAttribute('data-state', 'active');

  r.status = 'succeeded';
  r.completed_at = '2026-10-20T11:00:00Z';
  await page.clock.runFor(3500);
  await expect(page.getByTestId('training-status')).toHaveAttribute('data-status', 'succeeded');
  await expect(page.getByTestId('training-run-succeeded')).toBeVisible();
  await page.getByTestId('training-run-tab-metrics').click();
  await expect(page.getByTestId('training-metrics').locator('dt')).toHaveCount(1);
  await expect(page.getByTestId('training-run-cancel')).toHaveCount(0);
});

test('a queued run can be cancelled', async ({ page, api }) => {
  const r = run(api, 'submitted');
  await page.goto(`${BASE}/training/${r.id}`);
  await page.getByTestId('training-run-tab-steps').click();
  await expect(page.getByTestId('training-step-queued')).toHaveAttribute('data-state', 'active');
  await page.getByTestId('training-run-cancel').click();
  await page.getByTestId('training-stop-confirm').click();
  await expect(page.getByTestId('training-stop-dialog')).toBeHidden();
  await expect(page.getByTestId('training-status')).toHaveAttribute('data-status', 'cancelled');
  await expect(page.getByTestId('training-run-ended')).toBeVisible();
  await expect(page.getByTestId('project-new-training')).toBeVisible();
});

test('an unknown run shows not found', async ({ page }) => {
  await page.goto(`${BASE}/training/${crypto.randomUUID()}`);
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'idle');
});

test('the model step shows how the chosen preset trains and what it may use', async ({ page, api }) => {
  withVersion(api);
  api.presets[0].vram_gb = 16;
  api.presets[0].gpu = 1;
  await page.goto(NEW);
  await expect(page.getByTestId('training-versions')).toBeVisible();
  await expect(page.getByTestId('training-preset-small')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('training-preset-small').getByTestId('training-preset-recommended')).toBeVisible();
  // The aside lists the preset's resources, the GPU's memory included.
  await expect(page.getByTestId('training-resources').getByTestId('summary-vram')).toBeVisible();
  await page.getByTestId('training-preset-medium').click();
  await expect(page.getByTestId('training-preset-medium')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('training-resources').getByTestId('summary-vram')).toHaveCount(0);
  await next(page).click();
  // Untouched settings are one row in the summary.
  await expect(page.getByTestId('summary-settings')).toBeVisible();
  await expect(page.getByTestId('summary-epochs')).toHaveCount(0);
});

test('changed settings are listed in the review, survive a trip to Recommended, and a new wizard starts on Recommended', async ({
  page,
  api,
}) => {
  withVersion(api);
  await page.goto(NEW);
  await toSettings(page);
  await expect(page.getByTestId('summary-settings')).toBeVisible();

  await custom(page);
  // What a setting does waits behind its help button.
  await expect(page.getByTestId('training-epochs-help-content')).toBeHidden();
  await page.getByTestId('training-epochs-help').click();
  await expect(page.getByTestId('training-epochs-help-content')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByTestId('training-epochs-input').locator('input').fill('12');
  await expect(field(page, 'epochs')).toHaveValue('12');
  await expect(page.getByTestId('summary-epochs')).toBeVisible();

  // Recommended sets the defaults and the review is one row again; Custom brings the edit back.
  await recommendedMode(page);
  await expect(shown(page, 'epochs')).toHaveText('10'); // lint-ok: a number, not copy
  await expect(page.getByTestId('summary-settings')).toBeVisible();
  await expect(page.getByTestId('summary-epochs')).toHaveCount(0);
  await custom(page);
  await expect(field(page, 'epochs')).toHaveValue('12');
  await expect(page.getByTestId('summary-epochs')).toBeVisible();
  await expect(page.getByTestId('summary-settings')).toHaveCount(0);

  // A new wizard starts on Recommended again.
  await page.goto(NEW);
  await expect(page.getByTestId('training-versions')).toBeVisible();
  await next(page).click();
  await expect(mode(page)).toHaveAttribute('data-mode', 'recommended');
  await expect(page.getByTestId('summary-settings')).toBeVisible();

  // On Custom with the defaults untouched, the summary follows the switch, not the values.
  await custom(page);
  await expect(page.getByTestId('summary-epochs')).toBeVisible();
  await expect(page.getByTestId('summary-settings')).toHaveCount(0);
});

test('a training run shows its epoch, the latest scores and the chart', async ({ page, api }) => {
  const r = run(api, 'running', {
    progress: progressOf(10, [
      { loss: 0.9, accuracy: 0.5 },
      { loss: 0.6, accuracy: 0.7 },
      { loss: 0.4, accuracy: 0.8 },
    ]),
  });
  await page.goto(`${BASE}/training/${r.id}`);
  const progress = page.getByTestId('training-run-progress');
  await expect(progress).toHaveAttribute('data-epoch', '3');
  await expect(progress).toHaveAttribute('data-epochs', '10');
  await expect(page.getByTestId('training-latest-metrics').locator('dt')).toHaveCount(2);
  await expect(page.getByTestId('training-progress-chart')).toHaveAttribute('data-points', '3');
  await expect(page.getByTestId('training-progress-chart').locator('.recharts-line')).toHaveCount(2);
});

test('a queued run with no epoch yet has no chart', async ({ page, api }) => {
  const r = run(api, 'submitted');
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('training-run-progress')).toBeVisible();
  await expect(page.getByTestId('training-run-progress')).not.toHaveAttribute('data-epoch');
  await expect(page.getByTestId('training-progress-chart')).toHaveCount(0);
  await expect(page.getByTestId('training-metrics-empty')).toBeVisible();
});

test('a finished run reads its report: scores, the confusion grid and the near-duplicate warning', async ({ page, api }) => {
  const r = run(api, 'succeeded', {
    completed_at: '2026-10-20T11:00:00Z',
    metrics: { stale: 0.1 },
    progress: progressOf(2, [{ loss: 0.5 }, { loss: 0.3 }]),
    report: {
      schema_version: 1,
      status: 'succeeded',
      metrics: { top1: 0.92, top5: 0.99, bad: 'x' },
      confusion_matrix: {
        labels: ['cat', 'dog'],
        matrix: [
          [9, 1],
          [2, 8],
        ],
      },
      near_duplicates: 3,
    },
  });
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('training-run-succeeded')).toBeVisible();
  await expect(page.getByTestId('training-metrics').locator('dt')).toHaveCount(2);
  await expect(page.getByTestId('training-metrics-top1')).toBeVisible();
  await expect(page.getByTestId('training-confusion')).toBeVisible();
  await expect(page.getByTestId('training-confusion-1-0')).toHaveText('2'); // lint-ok: a number, not copy
  await expect(page.getByTestId('training-near-duplicates')).toHaveAttribute('data-count', '3');
  await expect(page.getByTestId('training-progress-chart')).toBeVisible();
});

test('a failed run says why, from its report', async ({ page, api }) => {
  const r = run(api, 'failed', {
    completed_at: '2026-10-20T11:00:00Z',
    report: { status: 'failed', code: 'oom', message: 'CUDA out of memory' },
  });
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('training-run-failed')).toHaveAttribute('data-code', 'oom');
  await expect(page.getByTestId('project-new-training')).toBeVisible();
});

test('a cancel the server cannot do leaves the run and says so', async ({ page, api }) => {
  const r = run(api, 'running');
  api.failCancel = { status: 503, code: 'training_cancel_failed' };
  await page.goto(`${BASE}/training/${r.id}`);
  await page.getByTestId('training-run-cancel').click();
  await page.getByTestId('training-stop-confirm').click();
  await expect(page.locator('[data-scope="toast"][data-part="root"][data-type="error"]')).toBeVisible();
  await expect(page.getByTestId('training-status')).toHaveAttribute('data-status', 'running');
  await expect(page.getByTestId('training-run-cancel')).toBeEnabled();
});

test('the run page header stops a run only after asking', async ({ page, api }) => {
  const r = run(api, 'running');
  await page.goto(`${BASE}/training/${r.id}`);
  await page.getByTestId('training-run-cancel').click();
  await expect(page.getByTestId('training-stop-dialog')).toBeVisible();
  await page.getByTestId('training-stop-keep').click();
  await expect(page.getByTestId('training-stop-dialog')).toBeHidden();
  expect(r.status).toBe('running');
  await expect(page.getByTestId('training-status')).toHaveAttribute('data-status', 'running');
});

test('the run page tabs show the steps and the saved configuration, which downloads', async ({ page, api }) => {
  const { d, v } = withVersion(api);
  const r = run(api, 'succeeded', {
    completed_at: '2026-10-20T11:00:00Z',
    dataset_id: d.id,
    dataset_version_id: v.id,
    config: { epochs: 7, batch_size: 8, image_size: 224 },
  });
  api.epoch = 7;
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('training-run-tab-metrics')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('training-stat-elapsed')).toBeVisible();

  await page.getByTestId('training-run-tab-steps').click();
  await expect(page.getByTestId('training-steps')).toBeVisible();
  await expect(page.getByTestId('training-step-finished')).toHaveAttribute('data-state', 'done');

  await page.getByTestId('training-run-tab-config').click();
  await expect(page.getByTestId('training-config-epochs')).toBeVisible();
  await expect(page.getByTestId('training-config-data-name')).toBeVisible();
  await expect(page.getByTestId('training-config-method')).toBeVisible();
  const config = page.waitForEvent('download');
  await page.getByTestId('training-config-download').click();
  expect((await config).suggestedFilename()).toMatch(/-config\.json$/);
});

test('clone starts the wizard from the run: its version, preset and settings', async ({ page, api }) => {
  const { d, v: older } = withVersion(api);
  const newer = versionOf(api, d.id, importOf(api, d.id, { status: 'succeeded' }).id);
  const r = run(api, 'succeeded', {
    preset: 'medium',
    dataset_id: d.id,
    dataset_version_id: older.id,
    config: { epochs: 7, batch_size: 8, image_size: 224 },
  });
  await page.goto(`${BASE}/training/${r.id}`);
  await page.getByTestId('training-run-clone').click();
  await expect(page).toHaveURL(`${NEW}?clone=${r.id}`);
  // Not the newest version, which a fresh wizard would pick.
  await expect(page.getByTestId(`training-version-${older.id}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId(`training-version-${newer.id}`)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('training-preset-medium')).toHaveAttribute('aria-pressed', 'true');
  await next(page).click();
  // The run's own settings are not the recommended ones, so Custom is on by itself.
  await expect(mode(page)).toHaveAttribute('data-mode', 'custom');
  await expect(page.getByTestId('training-epochs')).toBeVisible();
  await expect(field(page, 'epochs')).toHaveValue('7');
  await expect(field(page, 'batch_size')).toHaveValue('8');
  await page.getByTestId('training-start').click();
  await expect(page).toHaveURL(RUN_URL);
  expect(api.runBodies.at(-1)).toEqual({
    dataset_version_id: older.id,
    preset: 'medium',
    hyperparameters: { epochs: 7, batch_size: 8, image_size: 224 },
    seed: 42,
  });
});

test('a clone of a run that is gone starts from the defaults', async ({ page, api }) => {
  const { v } = withVersion(api);
  await page.goto(`${NEW}?clone=${crypto.randomUUID()}`);
  await expect(page.getByTestId(`training-version-${v.id}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('training-preset-small')).toHaveAttribute('aria-pressed', 'true');
});

test('the data step picks between datasets as cards, and the step list goes back to a passed step', async ({ page, api }) => {
  const { d } = withVersion(api);
  const other = dataset(api, { task_type: 'image-classification' });
  const ov = versionOf(api, other.id, importOf(api, other.id, { status: 'succeeded' }).id);
  await page.goto(NEW);
  await expect(page.getByTestId(`training-dataset-${d.id}`)).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId(`training-dataset-${other.id}`).click();
  await expect(page.getByTestId(`training-dataset-${other.id}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId(`training-version-${ov.id}`)).toHaveAttribute('aria-pressed', 'true');

  await next(page).click();
  // The settings step has been reached; the data step, passed, can be opened again.
  await page.getByTestId('wizard-step-trigger-0').click();
  await expect(page.getByTestId('training-datasets')).toBeVisible();
  await expect(page.getByTestId(`training-dataset-${other.id}`)).toHaveAttribute('aria-pressed', 'true');
});

test.describe('runs list', () => {
  test('a project with no runs says so and offers one', async ({ page }) => {
    await page.goto(`${BASE}/training`);
    await expect(page.getByTestId('project-tab-training')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('training-list-empty')).toBeVisible();
    await page.getByTestId('project-new-training').click();
    await expect(page).toHaveURL(NEW);
  });

  test('lists every run and opens one', async ({ page, api }) => {
    run(api, 'succeeded', { metrics: { top1: 0.9 } });
    const moving = run(api, 'running');
    await page.goto(`${BASE}/training`);
    await expect(page.getByTestId('training-row')).toHaveCount(2);
    const row = page.locator(`[data-testid="training-row"][data-run="${moving.id}"]`);
    await expect(row.getByTestId('training-status')).toHaveAttribute('data-status', 'running');
    await row.getByRole('link').click();
    await expect(page).toHaveURL(`${BASE}/training/${moving.id}`);
  });

  test('statuses move by themselves while a run is in flight', async ({ page, api }) => {
    await page.clock.install();
    const r = run(api, 'running');
    await page.goto(`${BASE}/training`);
    await expect(page.getByTestId('training-status')).toHaveAttribute('data-status', 'running');
    r.status = 'succeeded';
    await page.clock.runFor(3500);
    await expect(page.getByTestId('training-status')).toHaveAttribute('data-status', 'succeeded');
  });

  test('a list that fails to load can be retried', async ({ page, api }) => {
    api.failRuns = true;
    await page.goto(`${BASE}/training`);
    await expect(page.getByTestId('training-list-load-error')).toBeVisible();
  });

  test('the overview pipeline leads to the list', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('pipeline-train-link').click();
    await expect(page).toHaveURL(`${BASE}/training`);
  });
});

test('a finished run has a model card with its metrics and its lineage', async ({ page, api }) => {
  const r = run(api, 'succeeded', { completed_at: '2026-10-20T11:00:00Z', metrics: { top1: 0.92 } });
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('run-model-card')).toBeVisible();
  await expect(page.getByTestId('run-model-metrics-top1')).toBeVisible();
  await expect(page.getByTestId('run-lineage')).toBeVisible();
});
