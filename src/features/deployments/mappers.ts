/** Turns deployment rows from the API into what the pages render. */
import type { Deployment, DeploymentEnvironment, DeploymentStatus } from '@/features/dashboard/domain/types';
import { EMPTY, formatCount, formatMs, formatUsd, relativeTimeLong } from '@/lib/format';
import type { ApiDeployment, ApiDeploymentEnvironment, ApiDeploymentStatus, ApiRequestLog } from './api';

const statusLabels: Record<ApiDeploymentStatus, DeploymentStatus> = {
  live: 'Live',
  paused: 'Paused',
  deploying: 'Deploying',
};

const environmentLabels: Record<ApiDeploymentEnvironment, DeploymentEnvironment> = {
  production: 'Production',
  staging: 'Staging',
  batch: 'Batch',
  edge: 'Edge',
};

/** A deployment that is not serving has no traffic numbers: an em dash. */
const orDash = <T>(value: T | null, format: (value: T) => string) => (value === null ? EMPTY : format(value));

export function toDeployment(row: ApiDeployment, now?: number): Deployment {
  return {
    id: row.id,
    projectId: row.project_id,
    modelId: row.model_id,
    name: row.name,
    status: statusLabels[row.status],
    environment: environmentLabels[row.environment],
    endpoint: row.endpoint_url,
    region: row.region,
    instanceName: row.instance_type,
    serving: row.serving,
    minReplicas: row.min_replicas,
    maxReplicas: row.max_replicas,
    activeReplicas: row.active_replicas,
    targetConcurrency: row.target_concurrency,
    scaleDownDelaySeconds: row.scale_down_delay_seconds,
    requests24h: orDash(row.requests_24h, formatCount),
    latencyP50: orDash(row.latency_p50_ms, (value) => formatMs(value)),
    latencyP95: orDash(row.latency_p95_ms, (value) => formatMs(value)),
    latencyP99: orDash(row.latency_p99_ms, (value) => formatMs(value)),
    errorRate: orDash(row.error_rate_percent, (value) => `${value.toFixed(2)}%`),
    costPerDay: formatUsd(row.cost_per_day_usd),
    deployed: row.deployed_at ? relativeTimeLong(row.deployed_at, now) : 'in progress',
  };
}

export type RequestLogEntry = {
  time: string;
  method: string;
  status: number;
  latency: string;
  client: string;
  requestId: string;
};

export function toRequestLog(row: ApiRequestLog): RequestLogEntry {
  return {
    time: new Date(row.time).toLocaleTimeString('en-GB', { hour12: false }),
    method: row.method,
    status: row.status,
    latency: orDash(row.latency_ms, (value) => formatMs(value)),
    client: row.client,
    requestId: row.request_id,
  };
}
