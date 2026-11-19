import { test, expect } from './fixtures';
import { ACME_SLUG, dataset, model } from './mock-api';

const PROJECTS = `/w/${ACME_SLUG}/projects`;

test('a card and a list row count the live datasets, models and deployments; zero reads as a dash', async ({ page, api }) => {
  dataset(api);
  dataset(api);
  model(api, 'Staging');
  await page.goto(PROJECTS);
  await expect(page.getByTestId('project-card-count-datasets')).toHaveText('2'); // lint-ok
  await expect(page.getByTestId('project-card-count-models')).toHaveText('1'); // lint-ok
  await expect(page.getByTestId('project-card-count-deployments')).toHaveText('-'); // lint-ok

  await page.getByTestId('projects-view-list').click();
  await expect(page.getByTestId('projects-count-datasets')).toHaveText('2'); // lint-ok
  await expect(page.getByTestId('projects-count-models')).toHaveText('1'); // lint-ok
});

test('the list starts with name, task, status, datasets and models; the header menu changes that, keeps it after a reload, and resets', async ({
  page,
}) => {
  await page.goto(PROJECTS);
  await expect(page.getByTestId('project-link').first()).toBeVisible();
  await expect(page.getByTestId('projects-columns')).toHaveCount(0); // grid view has no columns

  await page.getByTestId('projects-view-list').click();
  await Promise.all(['task', 'status', 'datasets', 'models'].map((c) => expect(page.getByTestId(`projects-table-col-${c}`)).toBeVisible()));
  await Promise.all(['deployments', 'created', 'id'].map((c) => expect(page.getByTestId(`projects-table-col-${c}`)).toHaveCount(0)));

  await page.getByTestId('projects-columns').click();
  await expect(page.getByTestId('projects-columns-reset')).toHaveAttribute('data-disabled');
  await page.getByTestId('projects-column-id').click();
  await page.getByTestId('projects-column-models').click();
  await expect(page.getByTestId('projects-table-col-id')).toBeVisible();
  await expect(page.getByTestId('projects-table-col-models')).toHaveCount(0);

  await page.reload();
  await page.getByTestId('projects-view-list').click();
  await expect(page.getByTestId('projects-table-col-id')).toBeVisible();
  await expect(page.getByTestId('projects-table-col-models')).toHaveCount(0);

  await page.getByTestId('projects-columns').click();
  await page.getByTestId('projects-columns-reset').click();
  await expect(page.getByTestId('projects-table-col-id')).toHaveCount(0);
  await expect(page.getByTestId('projects-table-col-models')).toBeVisible();
});
