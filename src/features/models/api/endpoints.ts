/**
 * Calls for models, served by core-api (app/modules/user/model_registry). A
 * run that succeeds becomes the next version of its architecture's model.
 * The playground (`predict`) is still mocked: it needs a live deployment.
 *
 * Models are copied into the mock as they arrive (`mirrorToMock`), because
 * deployments and the playground, which look a model up, are still mocked.
 */
import { get, mirrorToMock, post } from '@/api/client'
import type {
  ApiModel,
  ApiModelDetail,
  ApiModelFile,
  ApiPrediction,
} from './types'

const models = (projectId: string) =>
  `/v1/projects/${encodeURIComponent(projectId)}/models`

const model = (projectId: string, modelId: string) =>
  `${models(projectId)}/${encodeURIComponent(modelId)}`

const mirrored = <T extends ApiModel>(row: T) =>
  mirrorToMock('models', [row]).then(() => row)

export const modelsApi = {
  list: (projectId: string) =>
    get<ApiModel[]>(models(projectId)).then((rows) =>
      mirrorToMock('models', rows),
    ),
  get: (projectId: string, modelId: string) =>
    get<ApiModelDetail>(model(projectId, modelId)).then(mirrored),
  listFiles: (projectId: string, modelId: string) =>
    get<ApiModelFile[]>(`${model(projectId, modelId)}/files`),
  /** Makes this version the production one; the previous one is archived. */
  promote: (projectId: string, modelId: string) =>
    post<ApiModel>(`${model(projectId, modelId)}/promote`).then(mirrored),
  archive: (projectId: string, modelId: string) =>
    post<ApiModel>(`${model(projectId, modelId)}/archive`).then(mirrored),
  predict: (projectId: string, modelId: string) =>
    post<ApiPrediction>(`${model(projectId, modelId)}/predict`),
}
