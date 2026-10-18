/**
 * Calls for datasets, served by core-api (app/modules/user/datasets).
 *
 * Datasets are copied into the mock as they arrive (`mirrorToMock`), because
 * training, which looks a run's dataset up, is still mocked.
 */
import {
  get,
  mirrorToMock,
  post,
  postFile,
  postForm,
  qs,
} from '@/api/client'
import type {
  ApiDataset,
  ApiDatasetDetail,
  ApiDatasetManifest,
  ApiDatasetQuality,
  ApiDatasetSample,
  ApiDatasetStatistics,
  ApiDatasetStatus,
  ApiDatasetVersion,
  CreateDatasetRequest,
  CreatedDataset,
  ImportDatasetRequest,
} from './types'

const datasets = (projectId: string) =>
  `/v1/projects/${encodeURIComponent(projectId)}/datasets`

const dataset = (projectId: string, datasetId: string) =>
  `${datasets(projectId)}/${encodeURIComponent(datasetId)}`

const mirrored = (row: ApiDataset) =>
  mirrorToMock('datasets', [row]).then(() => row)

/**
 * The dashboard's upload dialog. `live` sends these to core-api even when the
 * whole API is mocked, as the dialog always has.
 */
export const datasetsApi = {
  createDataset: (projectId: string, name: string) =>
    post<CreatedDataset>(`${datasets(projectId)}${qs({ name })}`, undefined, {
      live: true,
    }),
  /** A .zip of `<label>/<file>` folders. */
  uploadDatasetZip: (projectId: string, datasetId: string, file: File) =>
    postForm(`${dataset(projectId, datasetId)}/upload-zip`, file, {
      live: true,
    }),
  /** A feature/label CSV with a header row. */
  uploadDatasetCsv: (projectId: string, datasetId: string, file: File) =>
    postFile(`${dataset(projectId, datasetId)}/tabular`, file, 'text/csv', {
      live: true,
    }),
}

/** What the project pages call. */
export const projectDatasetsApi = {
  list: (projectId: string, status?: ApiDatasetStatus) =>
    get<ApiDataset[]>(`${datasets(projectId)}${qs({ status })}`).then((rows) =>
      mirrorToMock('datasets', rows),
    ),
  create: (projectId: string, input: CreateDatasetRequest) =>
    post<ApiDataset>(datasets(projectId), input).then(mirrored),
  get: (projectId: string, datasetId: string) =>
    get<ApiDatasetDetail>(dataset(projectId, datasetId)).then((row) =>
      mirrorToMock('datasets', [row]).then(() => row),
    ),
  /**
   * Sends one of the files a create announced. A .zip is unpacked as
   * `<label>/<file>` folders, a .csv becomes the dataset's table, and any
   * other file is stored as it is (an image waits in `_unlabeled/`).
   */
  upload: (projectId: string, datasetId: string, file: File) => {
    const name = file.name.toLowerCase()
    if (name.endsWith('.zip')) {
      return postForm(`${dataset(projectId, datasetId)}/upload-zip`, file)
    }
    if (name.endsWith('.csv')) {
      return postFile(
        `${dataset(projectId, datasetId)}/tabular`,
        file,
        'text/csv',
      )
    }
    return postForm(`${dataset(projectId, datasetId)}/upload-file`, file)
  },
  importFromBucket: (
    projectId: string,
    datasetId: string,
    input: ImportDatasetRequest,
  ) =>
    post<ApiDataset>(`${dataset(projectId, datasetId)}/import`, input).then(
      mirrored,
    ),
  getPreview: (projectId: string, datasetId: string) =>
    get<ApiDatasetSample[]>(`${dataset(projectId, datasetId)}/preview`),
  getStatistics: (projectId: string, datasetId: string) =>
    get<ApiDatasetStatistics>(`${dataset(projectId, datasetId)}/statistics`),
  getQuality: (projectId: string, datasetId: string) =>
    get<ApiDatasetQuality>(`${dataset(projectId, datasetId)}/quality`),
  listVersions: (projectId: string, datasetId: string) =>
    get<ApiDatasetVersion[]>(`${dataset(projectId, datasetId)}/versions`),
  getManifest: (projectId: string, datasetId: string) =>
    get<ApiDatasetManifest>(`${dataset(projectId, datasetId)}/manifest`),
  reprocess: (projectId: string, datasetId: string) =>
    post<ApiDataset>(`${dataset(projectId, datasetId)}/reprocess`).then(
      mirrored,
    ),
}
