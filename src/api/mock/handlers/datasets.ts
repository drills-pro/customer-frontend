/**
 * Datasets of a project and the tabs of the dataset page. core-api serves all
 * of these (app/modules/user/datasets), so they're retired: answered only
 * when the whole API is mocked. Live datasets are copied into the store
 * (`mirrorDatasets`) for the training handlers, which are still mocked.
 */
import type {
  ApiDataset,
  ApiDatasetDetail,
  ApiDatasetManifest,
  CreateDatasetRequest,
  ImportDatasetRequest,
} from '@/features/datasets/api/types';
import { notFound, retiredRoute } from '../router';
import { modalityForTask } from '../seed/catalog';
import { extrasFor } from '../seed/datasets';
import { mb } from '../seed/units';
import { datasets } from '../store';
import { project, touchProject } from './projects';
import { bodyOf, conflict, invalid, nowIso, shortId } from './shared';

const base = '/v1/projects/:projectId/datasets';

function datasetsOf(projectId: string) {
  return datasets.all().filter((item) => item.project_id === projectId);
}

export function dataset(projectId: string, datasetId: string) {
  const found = datasets.get(datasetId);
  return found && found.project_id === projectId ? found : notFound('Dataset');
}

retiredRoute('GET', base, ({ params, query }) => {
  const status = query.get('status');
  return datasetsOf(project(params.projectId).id).filter((item) => !status || item.status === status);
});

retiredRoute('POST', base, ({ params, body }) => {
  const owner = project(params.projectId);
  const input = bodyOf<CreateDatasetRequest>(body);
  const name = input.name.trim();
  if (!name) invalid('Enter a dataset name.');
  const taken = datasetsOf(owner.id).some((item) => item.name.toLowerCase() === name.toLowerCase());
  if (taken) conflict('This dataset name already exists in the project.');

  const created = datasets.put({
    id: `dataset-${shortId()}`,
    project_id: owner.id,
    name,
    modality: modalityForTask(owner.task_type),
    split: input.split,
    item_count: input.files.length,
    size_bytes: input.files.reduce((total, file) => total + file.size_bytes, 0),
    class_count: 0,
    version: 1,
    status: 'processing',
    created_at: nowIso(),
    files: input.files.map((file) => file.name),
  });
  touchProject(owner.id, (current) => ({
    dataset_count: current.dataset_count + 1,
    pipeline: {
      ...current.pipeline,
      complete_through: Math.max(2, current.pipeline.complete_through) as 2 | 3 | 4,
    },
  }));
  return created;
});

retiredRoute('GET', `${base}/:datasetId`, ({ params }): ApiDatasetDetail => {
  const found = dataset(params.projectId, params.datasetId);
  return { ...found, health_checks: extrasFor(found).health_checks };
});

retiredRoute('POST', `${base}/:datasetId/import`, ({ params, body }): ApiDataset => {
  const found = dataset(params.projectId, params.datasetId);
  const { bucket_uri } = bodyOf<ImportDatasetRequest>(body);
  if (!/^s3:\/\/[^\s]+$/.test(bucket_uri)) {
    invalid('Enter a bucket path such as s3://my-bucket/dataset.');
  }
  // The mock has no bucket to read; every import is the same size.
  return datasets.put({
    ...found,
    item_count: 1200,
    size_bytes: mb(24),
    status: 'processing',
    files: [bucket_uri],
  });
});

retiredRoute('GET', `${base}/:datasetId/preview`, ({ params, query }) => {
  const label = query.get('label');
  const split = query.get('split');
  const needle = (query.get('q') ?? '').trim().toLowerCase();
  return extrasFor(dataset(params.projectId, params.datasetId)).samples.filter(
    (sample) =>
      (!label || sample.label === label) &&
      (!split || sample.split === split) &&
      (!needle || (sample.modality === 'text' && sample.text.toLowerCase().includes(needle))),
  );
});

retiredRoute('GET', `${base}/:datasetId/statistics`, ({ params }) => extrasFor(dataset(params.projectId, params.datasetId)).statistics);

retiredRoute('GET', `${base}/:datasetId/quality`, ({ params }) => extrasFor(dataset(params.projectId, params.datasetId)).quality);

retiredRoute('GET', `${base}/:datasetId/versions`, ({ params }) => extrasFor(dataset(params.projectId, params.datasetId)).versions);

retiredRoute('GET', `${base}/:datasetId/manifest`, ({ params }): ApiDatasetManifest => {
  const found = dataset(params.projectId, params.datasetId);
  return { dataset: found, versions: extrasFor(found).versions };
});

retiredRoute('POST', `${base}/:datasetId/reprocess`, ({ params }) => {
  const found = dataset(params.projectId, params.datasetId);
  if (found.status === 'ready') conflict('This dataset is already processed.');
  return datasets.put({ ...found, status: 'processing' });
});

// The uploads that follow a create (`useAddDataset`). The mock keeps no
// bytes: a landed upload just finishes processing, as core-api's recount does.
function landed(projectId: string, datasetId: string) {
  const found = dataset(projectId, datasetId);
  datasets.put({ ...found, status: 'ready' });
}

retiredRoute('POST', `${base}/:datasetId/upload-zip`, ({ params }) => {
  landed(params.projectId, params.datasetId);
  return { uploaded: 0, skipped: 0, labels: {} };
});

retiredRoute('POST', `${base}/:datasetId/tabular`, ({ params }) => {
  landed(params.projectId, params.datasetId);
  return { rows: 0, columns: [] };
});

retiredRoute('POST', `${base}/:datasetId/upload-file`, ({ params }) => {
  landed(params.projectId, params.datasetId);
  return { key: '_unlabeled/file' };
});
