/**
 * Trained model versions, their files, stage changes and the playground. core-api
 * serves all but the playground (app/modules/user/model_registry), so those are
 * retired. Live models are copied into the store (`mirrorModels`) for the
 * playground and the deployments handlers, which are still mocked.
 */
import type {
  ApiModel,
  ApiModelDetail,
  ApiModelStage,
  ApiPrediction,
} from '@/features/models/api/types'
import { notFound, retiredRoute, route } from '../router'
import { cannedPrediction, extrasFor } from '../seed/models'
import type { ModelRecord } from '../seed/models'
import { deployments, models } from '../store'
import { project, touchProject } from './projects'

const base = '/v1/projects/:projectId/models'

function modelsOf(projectId: string) {
  return models.all().filter((item) => item.project_id === projectId)
}

export function model(projectId: string, modelId: string) {
  const found = models.get(modelId)
  return found && found.project_id === projectId ? found : notFound('Model')
}

export function toApiModel(record: ModelRecord): ApiModel {
  return {
    ...record,
    deployment_id:
      deployments.all().find((item) => item.model_id === record.id)?.id ?? null,
  }
}

function versionsOf(record: ModelRecord) {
  return modelsOf(record.project_id)
    .filter((item) => item.name === record.name)
    .sort((left, right) => left.version - right.version)
}

/** Best first, with the versions of one model next to each other. */
retiredRoute('GET', base, ({ params }) =>
  modelsOf(project(params.projectId).id)
    .sort(
      (left, right) =>
        right.accuracy - left.accuracy || right.version - left.version,
    )
    .map(toApiModel),
)

retiredRoute('GET', `${base}/:modelId`, ({ params }): ApiModelDetail => {
  const found = model(params.projectId, params.modelId)
  const { dataset_id, per_class_accuracy } = extrasFor(found)
  return {
    ...toApiModel(found),
    dataset_id,
    versions: versionsOf(found).map(toApiModel),
    per_class_accuracy,
  }
})

retiredRoute(
  'GET',
  `${base}/:modelId/files`,
  ({ params }) => extrasFor(model(params.projectId, params.modelId)).files,
)

function setStage(projectId: string, modelId: string, stage: ApiModelStage) {
  const found = model(projectId, modelId)
  // One production version per model name: promoting retires the previous one.
  if (stage === 'production') {
    for (const sibling of versionsOf(found)) {
      if (sibling.id !== found.id && sibling.stage === 'production') {
        models.put({ ...sibling, stage: 'archived' })
      }
    }
  }
  touchProject(projectId)
  return toApiModel(models.put({ ...found, stage }))
}

retiredRoute('POST', `${base}/:modelId/promote`, ({ params }) =>
  setStage(params.projectId, params.modelId, 'production'),
)

retiredRoute('POST', `${base}/:modelId/archive`, ({ params }) =>
  setStage(params.projectId, params.modelId, 'archived'),
)

route('POST', `${base}/:modelId/predict`, ({ params }): ApiPrediction => {
  const found = model(params.projectId, params.modelId)
  return { ...cannedPrediction, latency_ms: found.latency_p95_ms }
})
