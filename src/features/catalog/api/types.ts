/**
 * Reference data the wizards and forms choose from, as the API sends it.
 * It changes with the platform, not with a workspace, so it caches for long.
 */
import type { ApiOrgPlan, ApiPlanLimits } from '@/features/organizations/api'
import type { ApiDatasetModality } from '@/features/datasets/api'

export type ApiTaskType = {
  id: string
  label: string
  /** Offered when creating a project; older types stay readable but hidden. */
  selectable: boolean
}

export type ApiRegion = {
  id: string
  label: string
}

export type ApiProjectTemplate = {
  id: string
  task_type: string
  name: string
  description: string
  /** The sample dataset a project created from this template starts with. */
  dataset: {
    name: string
    modality: ApiDatasetModality
    item_count: number
    size_bytes: number
    class_count: number
  }
}

export type ApiArchitecture = {
  id: string
  name: string
  description: string
  /** Size and pretraining, e.g. `19M params · ImageNet pretrained`. */
  meta: string
  /** The typical result range, e.g. `92–95%`. */
  expected_accuracy: string
}

export type ApiComputeOption = {
  id: string
  name: string
  specification: string
  hourly_rate_usd: number
}

export type ApiPlan = ApiPlanLimits & {
  id: ApiOrgPlan
}
