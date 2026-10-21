/**
 * Training runs: listing, starting, stopping, logs, metrics, estimates. core-api
 * serves all of these (app/modules/user/training), so they're retired:
 * answered only when the whole API is mocked.
 */
import type {
  ApiLogLine,
  ApiRunMetric,
  ApiTrainingEstimate,
  ApiTrainingRun,
  CreateTrainingRunRequest,
  EstimateTrainingRequest,
} from '@/features/training/api/types';
import { MockHttpError, notFound, retiredRoute } from '../router';
import { liveRun } from '../runs';
import { architecturesFor, computeOptions } from '../seed/catalog';
import type { MockArchitecture, MockComputeOption } from '../seed/catalog';
import type { ProjectRecord } from '../seed/projects';
import { datasets, trainingRuns, users } from '../store';
import { dataset } from './datasets';
import { project, touchProject } from './projects';
import { bodyOf, conflict, invalid, nowIso, shortId } from './shared';

const base = '/v1/projects/:projectId/training-runs';

function runsOf(projectId: string) {
  return trainingRuns.all().filter((item) => item.project_id === projectId);
}

function run(projectId: string, runId: string) {
  const found = trainingRuns.get(runId);
  return found && found.project_id === projectId ? found : notFound('Training run');
}

/**
 * The architecture and compute a run asks for. A project copied from core-api
 * (`../mirror.ts`) picks from core-api's catalogue, which the mock's seed
 * doesn't list, so there an unknown id stands in at the seed's default speed
 * and price.
 */
function choices(
  owner: ProjectRecord,
  architectureId: string,
  instanceId: string,
): { architecture: MockArchitecture; compute: MockComputeOption } {
  const architecture =
    architecturesFor(owner.task_type).find((item) => item.id === architectureId) ??
    (owner.mirrored
      ? {
          id: architectureId,
          name: architectureId,
          description: '',
          meta: '',
          factor: 1,
          expected_accuracy: '',
        }
      : undefined);
  const fallback = instanceId.startsWith('cpu') ? computeOptions.find((item) => item.id === 'cpu') : computeOptions[0];
  const compute =
    computeOptions.find((item) => item.id === instanceId) ??
    (owner.mirrored && fallback ? { ...fallback, id: instanceId, name: instanceId } : undefined);
  if (!architecture) invalid('Unknown architecture for this project');
  if (!compute) invalid('Unknown compute option');
  return { architecture, compute };
}

function estimate(projectId: string, input: EstimateTrainingRequest): ApiTrainingEstimate {
  const owner = project(projectId);
  const source = dataset(projectId, input.dataset_id);
  const { architecture, compute } = choices(owner, input.architecture_id, input.instance_id);

  const datasetFactor = Math.max(0.2, source.item_count / 18_420);
  const hours = Math.max(
    0.15,
    ((input.epochs / 30) * datasetFactor * architecture.factor * (32 / input.batch_size) * 1.33) / compute.performance,
  );
  return {
    hours,
    cost_usd: hours * compute.hourly_rate_usd * (input.spot ? 0.4 : 1),
  };
}

retiredRoute('GET', base, ({ params }) =>
  runsOf(project(params.projectId).id)
    .map((item) => liveRun(item))
    .sort((left, right) => new Date(right.started_at).getTime() - new Date(left.started_at).getTime()),
);

retiredRoute('POST', `${base}/estimate`, ({ params, body }) => estimate(params.projectId, bodyOf<EstimateTrainingRequest>(body)));

retiredRoute('POST', base, ({ params, body }): ApiTrainingRun => {
  const owner = project(params.projectId);
  const input = bodyOf<CreateTrainingRunRequest>(body);
  const source = dataset(owner.id, input.dataset_id);
  if (source.status !== 'ready') conflict('That dataset is not ready yet.');

  const { config } = input;
  const { split } = config;
  if (split.train + split.validation + split.test !== 100) {
    invalid('The split must add up to 100.');
  }
  // `estimate` also validates the architecture and the compute option.
  const { hours, cost_usd } = estimate(owner.id, {
    dataset_id: source.id,
    architecture_id: input.architecture_id,
    epochs: config.epochs,
    batch_size: config.batch_size,
    instance_id: config.instance_id,
    spot: config.spot,
  });
  const { architecture, compute } = choices(owner, input.architecture_id, config.instance_id);
  const onCpu = compute.id.startsWith('cpu');

  const created = trainingRuns.put({
    id: `run-${shortId()}`,
    project_id: owner.id,
    dataset_id: source.id,
    name: `${architecture.id}-${runsOf(owner.id).length + 1}`,
    architecture: architecture.name,
    instance_name: compute.name,
    config,
    estimated_hours: hours,
    estimated_cost_usd: cost_usd,
    author: users.get('me')?.full_name ?? 'Unknown',
    started_at: nowIso(),
    status: 'running',
    progress: 0,
    step: 0,
    total_steps: 12_000,
    epoch: 1,
    eta_seconds: null,
    throughput_per_second: 312,
    throughput_unit: source.modality === 'image' ? 'img' : 'items',
    gpu_utilization_percent: onCpu ? 0 : 94,
    gpu_memory_used_gb: onCpu ? 0 : 18.2,
    gpu_memory_total_gb: onCpu ? 0 : 24,
  });
  touchProject(owner.id, (current) => ({
    pipeline: { ...current.pipeline, runs: current.pipeline.runs + 1 },
  }));
  return liveRun(created);
});

retiredRoute('GET', `${base}/:runId`, ({ params }) => liveRun(run(params.projectId, params.runId)));

retiredRoute('POST', `${base}/:runId/cancel`, ({ params }) => {
  const current = liveRun(run(params.projectId, params.runId));
  if (current.status === 'completed') {
    throw new MockHttpError(409, 'This run has already finished.');
  }
  // Frozen where it stood: a stopped run no longer derives from its start time.
  return liveRun(trainingRuns.put({ ...current, status: 'stopped' }));
});

function formatLearningRate(value: number) {
  return value.toExponential(1).replace('.0e', 'e');
}

retiredRoute('GET', `${base}/:runId/logs`, ({ params, query }): ApiLogLine[] => {
  const current = liveRun(run(params.projectId, params.runId));
  const source = datasets.get(current.dataset_id);
  const { config } = current;
  const epoch = Math.floor((current.progress / 100) * config.epochs);
  const info = (message: string): ApiLogLine => ({ level: 'info', message });

  const lines: ApiLogLine[] = [
    info(`Loading dataset ${source?.name ?? current.dataset_id} (${source?.item_count ?? 0} items)`),
    info(`Building ${current.architecture} with pretrained weights`),
    info(`lr=${formatLearningRate(config.learning_rate)} scheduler=${config.scheduler}`),
    ...Array.from({ length: Math.max(epoch, 1) }, (_, index) => {
      const number = index + 1;
      const loss = (3.812 / number).toFixed(3);
      const metric = (0.412 + (0.5 * number) / config.epochs).toFixed(3);
      return info(
        `Epoch ${number}/${config.epochs} loss=${loss} val_metric=${metric} ${current.throughput_per_second} ${current.throughput_unit}/s`,
      );
    }),
    current.status === 'stopped'
      ? { level: 'warn', message: `Run stopped by ${current.author}.` }
      : info('Checkpoint saved. Waiting for next training step…'),
  ];
  const level = query.get('level');
  return level ? lines.filter((line) => line.level === level) : lines;
});

retiredRoute('GET', `${base}/:runId/metrics`, ({ params }): ApiRunMetric[] => {
  run(params.projectId, params.runId);
  return Array.from({ length: 12 }, (_, index) => ({
    epoch: index + 1,
    loss: Number((3.812 / (index + 1)).toFixed(3)),
    accuracy: Number((0.412 + (0.5 * (index + 1)) / 12).toFixed(3)),
  }));
});
