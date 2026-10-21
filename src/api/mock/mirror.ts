/**
 * Keeps copies of records core-api serves, so the endpoints still mocked
 * can find them.
 *
 * Organizations, projects, datasets, training runs and models come from
 * core-api, but deployments, the model playground and billing are still
 * answered here, and those handlers look their parent up in this store
 * (`notFound('Project')`, `notFound('Model')`). The client copies every live
 * organization, project, dataset and model in as it arrives (`mirrorToMock`
 * in `../client.ts`), so a mocked deployment of a real model works and
 * billing knows a real organization's plan.
 *
 * Children created under a mirrored record live only in the mock. core-api
 * doesn't know about them, so its counts leave them out.
 */
import type { ApiDataset } from '@/features/datasets/api/types';
import type { ApiModel } from '@/features/models/api/types';
import type { ApiOrganization } from '@/features/organizations/api/types';
import type { ApiProject, ApiProjectDetail } from '@/features/projects/api/types';
import type { OrganizationRecord } from './seed/organizations';
import type { ProjectRecord } from './seed/projects';
import { datasets, models, organizations, projects } from './store';

// Datasets have no `mirrored` field to mark them by, so the ids are kept here.
const mirroredDatasets = new Set<string>();

/** Live datasets, for the training handlers that look a run's dataset up. */
export function mirrorDatasets(rows: ApiDataset[]) {
  for (const row of rows) {
    if (datasets.get(row.id) && !mirroredDatasets.has(row.id)) continue;
    mirroredDatasets.add(row.id);
    datasets.put(row);
  }
}

const mirroredModels = new Set<string>();

/** Live models, for the deployments and playground handlers that look one up. */
export function mirrorModels(rows: ApiModel[]) {
  for (const { deployment_id: _, ...row } of rows) {
    if (models.get(row.id) && !mirroredModels.has(row.id)) continue;
    mirroredModels.add(row.id);
    models.put(row);
  }
}

export function mirrorOrganizations(rows: ApiOrganization[]) {
  for (const { summary, limits: _, ...row } of rows) {
    const existing = organizations.get(row.id);
    // Never overwrite the mock's own records.
    if (existing && !existing.mirrored) continue;
    organizations.put({
      ...row,
      credits_used: summary.credits_used,
      mirrored: true,
    } satisfies OrganizationRecord);
  }
}

/** Takes list rows or details; a list row keeps what a detail added before. */
export function mirrorProjects(rows: Array<ApiProject | ApiProjectDetail>) {
  for (const row of rows) {
    const existing = projects.get(row.id);
    if (existing && !existing.mirrored) continue;
    projects.put({
      framework: '',
      region: 'default',
      visibility: 'organization',
      pipeline: { runs: 0, running: 0, complete_through: 1 },
      best_model: null,
      readme: null,
      readme_markdown: null,
      // A real project's usage comes from core-api, never from these.
      usage_scale: { gpu_scale: 0, storage_scale: 0, endpoints_max: 0 },
      ...existing,
      ...row,
      mirrored: true,
    } satisfies ProjectRecord);
  }
}
