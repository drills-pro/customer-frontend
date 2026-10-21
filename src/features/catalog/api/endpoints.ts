/**
 * Calls for reference data, served by core-api (app/modules/user/catalog).
 * It lists only what core-api can run, which is less than the mock's
 * catalogue.
 */
import { get, qs } from '@/api/client';
import type { ApiArchitecture, ApiComputeOption, ApiPlan, ApiProjectTemplate, ApiRegion, ApiTaskType } from './types';

export const catalogApi = {
  listTaskTypes: () => get<ApiTaskType[]>('/v1/catalog/task-types'),
  listRegions: () => get<ApiRegion[]>('/v1/catalog/regions'),
  listProjectTemplates: (taskType?: string) => get<ApiProjectTemplate[]>(`/v1/catalog/project-templates${qs({ task_type: taskType })}`),
  listArchitectures: (taskType: string) => get<ApiArchitecture[]>(`/v1/catalog/architectures${qs({ task_type: taskType })}`),
  /** `serving` lists the instance types a deployment can run on. */
  listComputeOptions: (purpose: 'training' | 'serving' = 'training') =>
    get<ApiComputeOption[]>(`/v1/catalog/compute-options${qs({ purpose })}`),
  listPlans: () => get<ApiPlan[]>('/v1/catalog/plans'),
};
