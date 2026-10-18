import type {
  ApiDeployment,
  ApiRequestLog,
} from '@/features/deployments/api/types'
import { SEED_NOW, daysAgo, weeksAgo } from './units'

const scaling = {
  serving: 'pinned',
  target_concurrency: 40,
  scale_down_delay_seconds: 300,
} satisfies Partial<ApiDeployment>

const idle = {
  active_replicas: 0,
  requests_24h: null,
  latency_p50_ms: null,
  latency_p95_ms: null,
  latency_p99_ms: null,
  error_rate_percent: null,
  cost_per_day_usd: 0,
} satisfies Partial<ApiDeployment>

/** Served models for the projects the demo populates. */
export const deploymentSeed: ApiDeployment[] = [
  {
    ...scaling,
    id: 'retail-classify-prod',
    project_id: 'retail',
    model_id: 'retail-resnet50-v3',
    name: 'retail-classify-prod',
    status: 'live',
    environment: 'production',
    endpoint_url: 'https://api.drills.ai/v1/ep/rc-prod-8f2a/predict',
    region: 'us-east-1',
    instance_type: 'a10g-1',
    min_replicas: 1,
    max_replicas: 10,
    active_replicas: 3,
    requests_24h: 142_380,
    latency_p50_ms: 61,
    latency_p95_ms: 140,
    latency_p99_ms: 218,
    error_rate_percent: 0.11,
    cost_per_day_usd: 12.4,
    deployed_at: daysAgo(6),
  },
  {
    ...scaling,
    id: 'retail-classify-canary',
    project_id: 'retail',
    model_id: 'retail-convnext-tiny-v1',
    name: 'retail-classify-canary',
    status: 'live',
    environment: 'staging',
    endpoint_url: 'https://api.drills.ai/v1/ep/rc-canary-1d70/predict',
    region: 'us-east-1',
    instance_type: 't4-1',
    min_replicas: 1,
    max_replicas: 3,
    active_replicas: 1,
    requests_24h: 8_210,
    latency_p50_ms: 44,
    latency_p95_ms: 96,
    latency_p99_ms: 151,
    error_rate_percent: 0.04,
    cost_per_day_usd: 3.1,
    deployed_at: daysAgo(2),
  },
  {
    ...scaling,
    ...idle,
    id: 'retail-batch-nightly',
    project_id: 'retail',
    model_id: 'retail-resnet50-v2',
    name: 'batch-nightly',
    status: 'paused',
    environment: 'batch',
    endpoint_url: 'https://api.drills.ai/v1/ep/batch-nightly-c31e/predict',
    region: 'us-west-2',
    instance_type: 'cpu-4',
    min_replicas: 0,
    max_replicas: 8,
    deployed_at: weeksAgo(5),
  },
  {
    ...scaling,
    ...idle,
    id: 'retail-edge-package',
    project_id: 'retail',
    model_id: 'retail-mobilenet-v3-v1',
    name: 'edge-package',
    status: 'deploying',
    environment: 'edge',
    endpoint_url: 'https://api.drills.ai/v1/ep/edge-pkg-77b4/predict',
    region: 'eu-west-1',
    instance_type: 'edge-arm64',
    min_replicas: 0,
    max_replicas: 1,
    deployed_at: null,
  },
  {
    ...scaling,
    id: 'support-triage-prod',
    project_id: 'support',
    model_id: 'support-bert-triage-v2',
    name: 'support-triage-prod',
    status: 'live',
    environment: 'production',
    endpoint_url: 'https://api.drills.ai/v1/ep/st-prod-4b19/predict',
    region: 'us-east-1',
    instance_type: 't4-1',
    min_replicas: 2,
    max_replicas: 6,
    active_replicas: 2,
    requests_24h: 31_940,
    latency_p50_ms: 38,
    latency_p95_ms: 58,
    latency_p99_ms: 104,
    error_rate_percent: 0.02,
    cost_per_day_usd: 6.8,
    deployed_at: daysAgo(4),
  },
]

/**
 * 24 hourly request counts ending "now". Deterministic on purpose: these
 * values are asserted in tests.
 */
export const requestVolume24h = [
  3120, 2740, 2310, 2050, 1980, 2240, 3480, 5120, 7340, 8210, 8640, 8120, 7960,
  8430, 8890, 9240, 8760, 8110, 7420, 6380, 5240, 4610, 3980, 3410,
]

/** Seconds before load, status, latency, client. */
const logShape: Array<[number, number, number | null, string]> = [
  [0, 200, 78, 'sdk-python/1.4'],
  [4, 200, 142, 'sdk-js/2.1'],
  [11, 429, null, 'curl/8.4'],
  [18, 200, 91, 'sdk-python/1.4'],
  [23, 500, null, 'sdk-js/2.1'],
  [31, 200, 104, 'sdk-python/1.4'],
  [40, 200, 67, 'sdk-go/0.9'],
]

/** The request log of one deployment. Empty unless it is serving. */
export function requestLogs(deployment: ApiDeployment): ApiRequestLog[] {
  if (deployment.status !== 'live') return []
  const slug = deployment.endpoint_url.split('/').at(-2) ?? deployment.id
  return logShape.map(([secondsAgo, status, latency_ms, client], index) => ({
    request_id: `req_${slug}_${(9124 - index * 37).toString(16)}`,
    time: new Date(SEED_NOW - secondsAgo * 1000).toISOString(),
    method: 'POST',
    status,
    latency_ms,
    client,
  }))
}

/** Instance types a deployment can run on. */
export const servingInstanceTypes = ['a10g-1', 't4-1', 'cpu-4', 'edge-arm64']
