import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
});

test('matches the reference page and toolbar spacing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const content = page.locator('#dashboard-main');
  await expect(content).toHaveCSS('padding-left', '24px');
  await expect(content).toHaveCSS('max-width', '1448px');
  await expect(page.getByRole('textbox', { name: 'Search projects' })).toHaveCSS('height', '36px');
  await expect(page.getByRole('combobox', { name: 'Filter by task type' })).toHaveCSS('height', '36px');
  await expect(page.getByRole('combobox', { name: 'Filter by organization' })).toHaveCount(0);
});

test('renders projects and navigates with active sidebar links', async ({ page }) => {
  const content = page.locator('#dashboard-main');
  await expect(page.getByText('4 projects in Acme AI')).toBeVisible();
  await expect(content.getByRole('link', { name: 'Retail Vision', exact: true })).toBeVisible();
  await expect(content.getByRole('link', { name: 'Demand Forecast', exact: true })).not.toBeVisible();

  const projectsLink = page.getByRole('link', { name: 'Projects' });
  await expect(projectsLink).toHaveAttribute('data-active', 'true');
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { name: /Good morning, Alex/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute('data-active', 'true');
});

test('searches, filters, sorts, and switches views', async ({ page }) => {
  const content = page.locator('#dashboard-main');
  await page.getByRole('textbox', { name: 'Search projects' }).fill('churn');
  await expect(content.getByRole('link', { name: 'Churn Predictor', exact: true })).toBeVisible();
  await expect(content.getByRole('link', { name: 'Retail Vision', exact: true })).not.toBeVisible();

  await page.getByRole('textbox', { name: 'Search projects' }).clear();
  await page.getByRole('combobox', { name: 'Filter by task type' }).click();
  await page.getByRole('option', { name: 'Text Classification' }).click();
  await page.getByRole('combobox', { name: 'Filter by status' }).click();
  await page.getByRole('option', { name: 'Active', exact: true }).click();
  await expect(content.getByRole('link', { name: 'Support Triage', exact: true })).toBeVisible();
  await expect(page.getByText('No matching projects')).not.toBeVisible();

  await page.getByRole('combobox', { name: 'Filter by status' }).click();
  await page.getByRole('option', { name: 'Draft', exact: true }).click();
  await expect(page.getByText('No matching projects')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
  await page.getByRole('combobox', { name: 'Sort projects' }).click();
  await page.getByRole('option', { name: 'Name A–Z' }).click();
  await page.getByRole('radio', { name: 'List view' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  const rows = page.getByRole('row');
  await expect(rows.nth(1)).toContainText('Churn Predictor');
});

test('the header organization scopes the list and project cards navigate', async ({ page }) => {
  const content = page.locator('#dashboard-main');
  await page.getByRole('button', { name: /Current organization/ }).click();
  await page.getByRole('menuitem', { name: /Northwind Labs/ }).click();
  await expect(page.getByText('2 projects in Northwind Labs')).toBeVisible();
  await expect(content.getByRole('link', { name: 'Demand Forecast', exact: true })).toBeVisible();
  await expect(content.getByRole('link', { name: 'Retail Vision', exact: true })).not.toBeVisible();

  await page.getByRole('button', { name: /Current organization/ }).click();
  await page.getByRole('menuitem', { name: /Solo Sandbox/ }).click();
  await expect(page.getByText('No projects in Solo Sandbox yet')).toBeVisible();

  await page.getByRole('button', { name: /Current organization/ }).click();
  await page.getByRole('menuitem', { name: /Acme AI/ }).click();

  await expect(page.getByRole('link', { name: 'New Project', exact: true })).toHaveAttribute('href', '/projects/new');
  await content.getByRole('link', { name: 'Retail Vision', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/retail\/overview$/);
  await expect(page.getByRole('heading', { name: 'Retail Vision', exact: true })).toBeVisible();
});

test('new project basics fields are accessible and report name conflicts', async ({ page }) => {
  await page.getByRole('link', { name: 'New Project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create project' })).toBeVisible();

  const name = page.getByRole('textbox', { name: 'Project name' });
  const description = page.getByRole('textbox', { name: /Description/ });
  const organization = page.getByRole('textbox', { name: 'Organization' });
  const region = page.getByRole('combobox', { name: 'Region' });
  const visibility = page.getByRole('combobox', { name: 'Visibility' });

  await expect(name).toBeVisible();
  await expect(description).toBeVisible();
  await expect(organization).toBeVisible();
  await expect(region).toBeVisible();
  await expect(visibility).toBeVisible();

  await name.fill('Retail Vision');
  const error = page.getByRole('alert');
  await expect(error).toHaveText('A project with this name already exists in this organization.');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAttribute('aria-describedby', 'new-project-name-error');

  await name.fill('Accessible Project');
  await description.fill('A project created from the accessible basics step.');
  await region.click();
  await page.getByRole('option', { name: 'EU (Ireland)' }).click();
  await visibility.click();
  await page.getByRole('option', { name: /Private — visible only/ }).click();

  await expect(error).not.toBeVisible();
  await expect(description).toHaveValue('A project created from the accessible basics step.');
  await expect(region).toContainText('EU (Ireland)');
  await expect(visibility).toContainText('Private');
  await expect(page.locator('aside')).toContainText('Accessible Project');
  await expect(page.locator('aside')).toContainText('EU (Ireland)');
  await expect(page.locator('aside')).toContainText('Private');
});

test('list rows and project menus open project details', async ({ page }) => {
  await page.getByRole('radio', { name: 'List view' }).click();
  await page.getByRole('table').getByRole('link', { name: 'Churn Predictor', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/churn\/overview$/);

  await page.goto('/projects');
  await expect(page.getByTestId('dashboard-app')).toHaveAttribute('data-hydrated', 'true');
  await page.getByRole('button', { name: 'Actions for Retail Vision' }).click();
  await page.getByRole('menuitem', { name: 'Open project' }).click();
  await expect(page).toHaveURL(/\/projects\/retail\/overview$/);
});

test('projects page does not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('radio', { name: 'Grid view' })).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflows).toBe(false);
});
