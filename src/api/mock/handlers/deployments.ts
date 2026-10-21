/** Deployments: rollout, traffic numbers, logs, keys, test calls. */
import type {
  ApiDeployment,
  ApiDeploymentKey,
  ApiDeploymentMetrics,
  ApiRotatedKey,
  ApiTestCall,
  CreateDeploymentRequest,
  UpdateDeploymentRequest,
} from '@/features/deployments/api/types';
import { notFound, route } from '../router';
import { requestLogs, requestVolume24h, servingInstanceTypes } from '../seed/deployments';
import { cannedPrediction } from '../seed/models';
import { minutesAgo, weeksAgo } from '../seed/units';
import { deploymentKeys, deployments } from '../store';
import { model } from './models';
import { project, touchProject } from './projects';
import { bodyOf, conflict, invalid, nowIso, pick, shortId, slugify } from './shared';

const base = '/v1/projects/:projectId/deployments';

/** How long a rollout takes in the mock. */
const ROLLOUT_MS = 15_000;

/** A deployment as stored; `rollout_ends_at` is when "deploying" turns live. */
type DeploymentRecord = ApiDeployment & { rollout_ends_at?: string };

const idle = {
  active_replicas: 0,
  requests_24h: null,
  latency_p50_ms: null,
  latency_p95_ms: null,
  latency_p99_ms: null,
  error_rate_percent: null,
  cost_per_day_usd: 0,
} satisfies Partial<ApiDeployment>;

/** Finishes a rollout whose time has come, then drops the internal field. */
function toApi(record: DeploymentRecord): ApiDeployment {
  const { rollout_ends_at, ...current } = record;
  if (current.status === 'deploying' && rollout_ends_at && Date.now() >= new Date(rollout_ends_at).getTime()) {
    const live: ApiDeployment = {
      ...current,
      status: 'live',
      active_replicas: Math.max(1, current.min_replicas),
      requests_24h: current.requests_24h ?? 0,
      deployed_at: rollout_ends_at,
    };
    deployments.put(live);
    return live;
  }
  return current;
}

function deploymentsOf(projectId: string) {
  const all: DeploymentRecord[] = deployments.all();
  return all.filter((item) => item.project_id === projectId);
}

function deployment(projectId: string, deploymentId: string) {
  const found: DeploymentRecord | undefined = deployments.get(deploymentId);
  return found && found.project_id === projectId ? found : notFound('Deployment');
}

function rolloutEnd() {
  return new Date(Date.now() + ROLLOUT_MS).toISOString();
}

/** Live ones first, so problems surface. */
const rank = { live: 0, deploying: 1, paused: 2 } as const;

route('GET', base, ({ params }) =>
  deploymentsOf(project(params.projectId).id)
    .map(toApi)
    .sort((left, right) => rank[left.status] - rank[right.status]),
);

route('POST', base, ({ params, body }) => {
  const owner = project(params.projectId);
  const input = bodyOf<CreateDeploymentRequest>(body);
  const served = model(owner.id, input.model_id);

  const name = slugify(input.name ?? `${served.name}-v${served.version}`, 'deployment');
  if (deploymentsOf(owner.id).some((item) => item.name === name)) {
    conflict('A deployment with this name already exists.');
  }
  const record: DeploymentRecord = {
    ...idle,
    id: `${name}-${shortId()}`,
    project_id: owner.id,
    model_id: served.id,
    name,
    status: 'deploying',
    environment: input.environment ?? 'staging',
    endpoint_url: `https://api.drills.ai/v1/ep/${name}-${shortId().slice(0, 4)}/predict`,
    region: owner.region,
    instance_type: 't4-1',
    serving: 'pinned',
    min_replicas: 1,
    max_replicas: 3,
    target_concurrency: 40,
    scale_down_delay_seconds: 300,
    deployed_at: null,
    rollout_ends_at: rolloutEnd(),
  };
  deployments.put(record);
  touchProject(owner.id, (current) => ({
    deployment_count: current.deployment_count + 1,
    pipeline: { ...current.pipeline, complete_through: 4 },
  }));
  return toApi(record);
});

route('GET', `${base}/:deploymentId`, ({ params }) => toApi(deployment(params.projectId, params.deploymentId)));

route('PATCH', `${base}/:deploymentId`, ({ params, body }) => {
  const current = deployment(params.projectId, params.deploymentId);
  const changes = pick(bodyOf<UpdateDeploymentRequest>(body), [
    'name',
    'serving',
    'min_replicas',
    'max_replicas',
    'instance_type',
    'target_concurrency',
    'scale_down_delay_seconds',
  ]);
  const next = { ...current, ...changes };
  if (!next.name.trim()) invalid('Deployment name is required');
  if (
    !Number.isInteger(next.min_replicas) ||
    !Number.isInteger(next.max_replicas) ||
    next.min_replicas < 0 ||
    next.max_replicas < Math.max(1, next.min_replicas)
  ) {
    invalid('Max replicas must be at least 1 and not below min replicas.');
  }
  // A project copied from core-api (`../mirror.ts`) picks from core-api's
  // serving options, which the seed doesn't list.
  if (!servingInstanceTypes.includes(next.instance_type) && !project(params.projectId).mirrored) {
    invalid('Unknown instance type');
  }
  return toApi(deployments.put({ ...next, name: next.name.trim() }));
});

route('DELETE', `${base}/:deploymentId`, ({ params }) => {
  const current = deployment(params.projectId, params.deploymentId);
  deployments.remove(current.id);
  deploymentKeys.remove(current.id);
  touchProject(current.project_id, (owner) => ({
    deployment_count: Math.max(0, owner.deployment_count - 1),
  }));
});

route('POST', `${base}/:deploymentId/pause`, ({ params }) => {
  const current = toApi(deployment(params.projectId, params.deploymentId));
  if (current.status !== 'live') conflict('Only a live deployment can pause.');
  return toApi(deployments.put({ ...current, ...idle, status: 'paused' }));
});

route('POST', `${base}/:deploymentId/resume`, ({ params }) => {
  const current = deployment(params.projectId, params.deploymentId);
  if (current.status !== 'paused') conflict('This deployment is not paused.');
  return toApi(
    deployments.put({
      ...current,
      status: 'live',
      active_replicas: Math.max(1, current.min_replicas),
      requests_24h: 0,
    }),
  );
});

route('POST', `${base}/:deploymentId/redeploy`, ({ params }) => {
  const current = deployment(params.projectId, params.deploymentId);
  const record: DeploymentRecord = {
    ...current,
    status: 'deploying',
    rollout_ends_at: rolloutEnd(),
  };
  return toApi(deployments.put(record));
});

route('GET', `${base}/:deploymentId/metrics`, ({ params }): ApiDeploymentMetrics => {
  const current = toApi(deployment(params.projectId, params.deploymentId));
  return {
    request_volume:
      current.status === 'live'
        ? requestVolume24h.map((requests, index) => ({
            hours_ago: requestVolume24h.length - 1 - index,
            requests,
          }))
        : [],
  };
});

route('GET', `${base}/:deploymentId/logs`, ({ params, query }) => {
  const status = query.get('status');
  return requestLogs(toApi(deployment(params.projectId, params.deploymentId))).filter(
    (entry) => !status || String(entry.status) === status,
  );
});

function keyOf(deploymentId: string): ApiDeploymentKey {
  const rotated = deploymentKeys.get(deploymentId);
  if (rotated) {
    const { id: _, ...key } = rotated;
    return key;
  }
  return {
    masked_key: 'drl_sk_••••••••3f9c',
    created_at: weeksAgo(18),
    last_used_at: minutesAgo(2),
  };
}

route('GET', `${base}/:deploymentId/api-key`, ({ params }) => keyOf(deployment(params.projectId, params.deploymentId).id));

route('POST', `${base}/:deploymentId/api-key/rotate`, ({ params }): ApiRotatedKey => {
  const { id } = deployment(params.projectId, params.deploymentId);
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const key = `drl_sk_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  const stored = deploymentKeys.put({
    id,
    masked_key: `drl_sk_••••••••${key.slice(-4)}`,
    created_at: nowIso(),
    last_used_at: null,
  });
  const { id: _, ...meta } = stored;
  return { ...meta, key };
});

route('POST', `${base}/:deploymentId/test`, ({ params }): ApiTestCall => {
  const current = toApi(deployment(params.projectId, params.deploymentId));
  if (current.status !== 'live') conflict('This deployment is not serving.');
  return {
    status: 200,
    latency_ms: current.latency_p50_ms ?? 60,
    predictions: cannedPrediction.predictions,
  };
});
