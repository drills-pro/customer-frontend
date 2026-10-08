import { models } from '@/features/dashboard/data/models'
import type { Model } from '@/features/dashboard/data'

/**
 * Models are fixtures — nothing in the dashboard creates one yet — so these
 * read straight from the seed set rather than merging persisted entries the
 * way `allTrainingRuns` has to.
 */

/** Every model version in one project. Newest first, versions grouped. */
export function projectModels(projectId: string): Model[] {
  return models
    .filter((model) => model.projectId === projectId)
    .sort(
      (left, right) =>
        right.accuracy - left.accuracy || right.version - left.version,
    )
}

export function resolveModel(
  projectId: string,
  modelId: string,
): Model | undefined {
  return models.find(
    (model) => model.id === modelId && model.projectId === projectId,
  )
}

/** Every version of one model name, oldest version first. */
export function modelVersions(model: Model): Model[] {
  return models
    .filter(
      (item) => item.projectId === model.projectId && item.name === model.name,
    )
    .sort((left, right) => left.version - right.version)
}

/** The deployment a model is served by, if any. */
export function modelDeploymentId(
  model: Model,
  deployments: Array<{ id: string; modelId: string }>,
): string | undefined {
  return deployments.find((item) => item.modelId === model.id)?.id
}
