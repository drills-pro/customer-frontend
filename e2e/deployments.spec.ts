import { test, expect } from './fixtures';
import { ACME_SLUG, API_URL, PROJECT, deployment } from './mock-api';

const BASE = `/w/${ACME_SLUG}/projects/${PROJECT}`;
const PREDICT = `${API_URL}/v1/predict`;

test('a deployment shows its endpoint on the public API, with a call example', async ({ page, api }) => {
  const d = deployment(api, 'active');
  await page.goto(`${BASE}/deployments/${d.id}`);
  await expect(page.getByTestId('deployment-endpoint')).toHaveAttribute('data-endpoint', PREDICT);
  // The default snippet is curl and calls the same endpoint.
  await expect(page.getByTestId('deployment-snippet')).toHaveAttribute('data-language', 'curl');
  await expect(page.getByTestId('deployment-snippet')).toHaveAttribute('data-endpoint', PREDICT);
  await expect(page.getByTestId('deployment-example-request')).toBeVisible();
  await expect(page.getByTestId('deployment-example-response')).toBeVisible();
});

test('the snippets switch between curl, Python and JavaScript, all on the same endpoint', async ({ page, api }) => {
  const d = deployment(api, 'active');
  await page.goto(`${BASE}/deployments/${d.id}`);
  await page.getByTestId('deployment-snippet-python').click();
  await expect(page.getByTestId('deployment-snippet')).toHaveAttribute('data-language', 'python');
  await expect(page.getByTestId('deployment-snippet')).toHaveAttribute('data-endpoint', PREDICT);
  await page.getByTestId('deployment-snippet-javascript').click();
  await expect(page.getByTestId('deployment-snippet')).toHaveAttribute('data-language', 'javascript');
  await expect(page.getByTestId('deployment-snippet')).toHaveAttribute('data-endpoint', PREDICT);
});

test('a deployment that is not serving says so', async ({ page, api }) => {
  const d = deployment(api, 'deploying');
  await page.goto(`${BASE}/deployments/${d.id}`);
  await expect(page.getByTestId('deployment-not-live')).toBeVisible();
});
