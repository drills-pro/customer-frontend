import type { Page } from '@playwright/test';
import { MOCK_DB_STORAGE_KEY } from '../../src/api/mock/db';
import type { ProjectRecord } from '../../src/api/mock/seed/projects';

export { MOCK_DB_STORAGE_KEY };

/**
 * The mock API keeps what was created or changed in `localStorage` (see
 * src/api/mock/db.ts). These helpers put records there before a page loads,
 * and read them back, in the API's wire shape.
 */

/** A project as `POST /v1/projects` stores it: a draft with nothing in it. */
export function emptyProject(id: string, name: string): ProjectRecord {
  const now = new Date().toISOString();
  return {
    id,
    organization_id: 'acme',
    name,
    description: '',
    task_type: 'image_classification',
    status: 'draft',
    color: '#6366f1',
    created_at: now,
    updated_at: now,
    dataset_count: 0,
    model_count: 0,
    deployment_count: 0,
    framework: 'PyTorch 2.4',
    region: 'us-east-1',
    visibility: 'organization',
    pipeline: { runs: 0, running: 0, complete_through: 1 },
    best_model: null,
    readme: null,
    readme_markdown: null,
    usage_scale: { gpu_scale: 0, storage_scale: 0, endpoints_max: 0 },
  };
}

/** Replaces the stored delta. Reload or navigate afterwards to pick it up. */
export async function seedMockDb(page: Page, collections: Record<string, unknown[]>) {
  await page.evaluate(({ key, stored }) => localStorage.setItem(key, JSON.stringify(stored)), {
    key: MOCK_DB_STORAGE_KEY,
    stored: Object.fromEntries(Object.entries(collections).map(([name, records]) => [name, { records, deleted: [] }])),
  });
}

/** The created or changed records of one collection. */
export async function storedRecords<T = Record<string, unknown>>(page: Page, collection: string): Promise<T[]> {
  return page.evaluate(
    ({ key, name }) => {
      const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
      return stored[name]?.records ?? [];
    },
    { key: MOCK_DB_STORAGE_KEY, name: collection },
  );
}
