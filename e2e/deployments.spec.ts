import { test, expect } from './fixtures';
import { ACME_SLUG, API_URL, DEPLOYMENT_SCHEMA, PROJECT, deployment, run } from './mock-api';

const BASE = `/w/${ACME_SLUG}/projects/${PROJECT}`;
const PREDICT = `${API_URL}/v1/predict`;
const LIST = `${BASE}/deployments`;
const DEPLOYMENT_URL = new RegExp(`${LIST}/[0-9a-f-]{36}$`);

test('the Deployments tab shows an empty state that leads to the training runs', async ({ page }) => {
  await page.goto(BASE);
  await page.getByTestId('project-tab-deployments').click();
  await expect(page).toHaveURL(LIST);
  await expect(page.getByTestId('project-tab-deployments')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('deployments-empty')).toBeVisible();
  await page.getByTestId('deployments-empty-runs').click();
  await expect(page).toHaveURL(`${BASE}/training`);
});

test('the pipeline Deploy stage links to the deployments', async ({ page }) => {
  await page.goto(BASE);
  await page.getByTestId('pipeline-deploy-link').click();
  await expect(page).toHaveURL(LIST);
});

test('lists deployments with their status and opens one', async ({ page, api }) => {
  const live = deployment(api, 'active');
  deployment(api, 'stopped');
  deployment(api, 'deleted');
  await page.goto(LIST);
  await expect(page.getByTestId('deployments-row')).toHaveCount(2);
  const row = page.locator(`[data-testid="deployments-row"][data-deployment="${live.id}"]`);
  await expect(row.getByTestId('deployment-status')).toHaveAttribute('data-status', 'active');
  await row.getByRole('link').click();
  await expect(page).toHaveURL(`${LIST}/${live.id}`);
  await expect(page.getByTestId('deployment-status')).toHaveAttribute('data-status', 'active');
});

test('deploys a finished run, shows its model ID, then the run links to its deployment', async ({ page, api }) => {
  const r = run(api, 'succeeded');
  await page.goto(`${BASE}/training/${r.id}`);
  await page.getByTestId('training-run-deploy').click();
  await page.getByTestId('deploy-confirm').click();
  await expect(page.getByTestId('deploy-id')).toHaveValue(api.deployments[0].id);
  expect(api.deployCalls).toHaveLength(1);
  // The deploy names the run; the deployment serves the one model version that run made.
  expect(api.deployCalls[0].runId).toBe(r.id);
  expect(api.deployments[0].model_version_id).toBe(api.models[0].id);
  expect(api.deployments[0].training_run_id).toBe(r.id);

  await page.getByTestId('deploy-open').click();
  await expect(page).toHaveURL(DEPLOYMENT_URL);
  // A deployment is live as soon as it exists.
  await expect(page.getByTestId('deployment-status')).toHaveAttribute('data-status', 'active');

  await page.getByTestId('deployment-run-link').click();
  await expect(page.getByTestId('training-run-deployment')).toBeVisible();
  await expect(page.getByTestId('training-run-deploy')).toHaveCount(0);
});

test('the deploy dialog can make the deployment the main model', async ({ page, api }) => {
  const r = run(api, 'succeeded');
  await page.goto(`${BASE}/training/${r.id}`);
  await page.getByTestId('training-run-deploy').click();
  await page.getByTestId('deploy-set-main').click();
  await page.getByTestId('deploy-confirm').click();
  await expect(page.getByTestId('deploy-created')).toHaveAttribute('data-deployment', api.deployments[0].id);
  expect(api.deployCalls[0].setMain).toBe(true);
  expect(api.deployments[0].main).toBe(true);
});

test('a run without a test split deploys only after the risk is accepted, with a new key', async ({ page, api }) => {
  api.deployRisk = true;
  const r = run(api, 'succeeded');
  await page.goto(`${BASE}/training/${r.id}`);
  await page.getByTestId('training-run-deploy').click();
  await page.getByTestId('deploy-confirm').click();
  await expect(page.getByTestId('deploy-risk')).toBeVisible();
  await expect(page.getByTestId('deploy-confirm')).toBeDisabled();

  await page.getByTestId('deploy-risk-accept').click();
  await page.getByTestId('deploy-confirm').click();
  await expect(page.getByTestId('deploy-created')).toBeVisible();
  expect(api.deployCalls.map((c) => c.acknowledge)).toEqual([false, true]);
  expect(api.deployCalls[0].key).not.toBe(api.deployCalls[1].key);
});

test('a run whose deployment is deleted can be deployed again', async ({ page, api }) => {
  const r = run(api, 'succeeded');
  deployment(api, 'deleted', r.id);
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('training-run-deploy')).toBeVisible();
  await expect(page.getByTestId('training-run-deployment')).toHaveCount(0);
});

test('a run still training offers no deploy', async ({ page, api }) => {
  const r = run(api, 'running');
  await page.goto(`${BASE}/training/${r.id}`);
  await expect(page.getByTestId('training-run-cancel')).toBeVisible();
  await expect(page.getByTestId('training-run-deploy')).toHaveCount(0);
});

test('stops and starts a live deployment', async ({ page, api }) => {
  const d = deployment(api, 'active');
  await page.goto(`${LIST}/${d.id}`);
  await page.getByTestId('deployment-stop').click();
  await expect(page.getByTestId('deployment-status')).toHaveAttribute('data-status', 'stopped');
  await expect(page.getByTestId('deployment-stopped')).toBeVisible();
  await page.getByTestId('deployment-start').click();
  await expect(page.getByTestId('deployment-status')).toHaveAttribute('data-status', 'active');
  expect(d.status).toBe('active');
});

test('the integration tab shows the snippets and the model', async ({ page, api }) => {
  const d = deployment(api, 'active');
  await page.goto(`${LIST}/${d.id}`);
  await expect(page.getByTestId('deployment-snippet')).toBeVisible();
  await page.getByTestId('deployment-snippet-python').click();
  await expect(page.getByTestId('deployment-snippet-python')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('deployment-input-shape')).toBeVisible();
});

test('the endpoint and every snippet call the public API, with a call example', async ({ page, api }) => {
  const d = deployment(api, 'active');
  await page.goto(`${LIST}/${d.id}`);
  await expect(page.getByTestId('deployment-endpoint')).toHaveAttribute('data-endpoint', PREDICT);
  const snippet = page.getByTestId('deployment-snippet');
  // curl is the default; the others follow their tab.
  await expect(snippet).toHaveAttribute('data-language', 'curl');
  await expect(snippet).toHaveAttribute('data-endpoint', PREDICT);
  await page.getByTestId('deployment-snippet-python').click();
  await expect(snippet).toHaveAttribute('data-language', 'python');
  await expect(snippet).toHaveAttribute('data-endpoint', PREDICT);
  await page.getByTestId('deployment-snippet-javascript').click();
  await expect(snippet).toHaveAttribute('data-language', 'javascript');
  await expect(snippet).toHaveAttribute('data-endpoint', PREDICT);
  await expect(page.getByTestId('deployment-example-request')).toBeVisible();
  await expect(page.getByTestId('deployment-example-response')).toBeVisible();
});

test('try it is a real predict call as the signed-in member, counted toward usage, and the log lists it', async ({ page, api }) => {
  const d = deployment(api, 'active');
  await page.goto(`${LIST}/${d.id}`);
  await page.getByTestId('deployment-tab-test').click();
  await expect(page.getByTestId('deployment-test-calls-empty')).toBeVisible();
  await expect(page.getByTestId('deployment-test-usage')).toBeVisible();

  await page.getByTestId('deployment-test-body').fill('[1]');
  await expect(page.getByTestId('deployment-test-send')).toBeDisabled();
  await page.getByTestId('deployment-test-body').fill('{"input": {"text": "hello"}}');
  // The equivalent call from the person's own code is shown once the body is valid.
  await expect(page.getByTestId('deployment-test-curl')).toBeVisible();
  await page.getByTestId('deployment-test-send').click();
  await expect(page.getByTestId('deployment-test-result')).toBeVisible();
  await expect(page.getByTestId('deployment-test-call')).toHaveCount(1);
  // The model and project are named by the headers of POST /v1/predict, from the deployment's schema.
  expect(api.predictCalls).toEqual([{ project: PROJECT, model: DEPLOYMENT_SCHEMA.deployment_id, body: { input: { text: 'hello' } } }]);
  expect(api.testCalls[0].request).toEqual({ input: { text: 'hello' } });
});

test('a stopped deployment cannot be tested', async ({ page, api }) => {
  const d = deployment(api, 'stopped');
  await page.goto(`${LIST}/${d.id}`);
  await page.getByTestId('deployment-tab-test').click();
  await expect(page.getByTestId('deployment-test-unavailable')).toBeVisible();
  await expect(page.getByTestId('deployment-test-send')).toBeDisabled();
});

test('deletes a deployment after confirming and returns to the list', async ({ page, api }) => {
  const d = deployment(api, 'active');
  await page.goto(`${LIST}/${d.id}`);
  await page.getByTestId('deployment-delete').click();
  await page.getByTestId('deployment-delete-confirm').click();
  await expect(page).toHaveURL(LIST);
  await expect(page.getByTestId('deployments-empty')).toBeVisible();
  expect(d.status).toBe('deleted');
});

test('an unknown deployment shows not found', async ({ page }) => {
  await page.goto(`${LIST}/${crypto.randomUUID()}`);
  await expect(page.getByTestId('state-screen')).toHaveAttribute('data-pose', 'idle');
});
