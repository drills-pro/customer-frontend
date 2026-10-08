import type { Deployment } from '../domain/types'

/** Served models. Fixtures for the projects the demo populates. */
export const deployments: Deployment[] = [
  {
    id: 'retail-classify-prod',
    projectId: 'retail',
    modelId: 'retail-resnet50-v3',
    name: 'retail-classify-prod',
    status: 'Live',
    environment: 'Production',
    endpoint: 'https://api.drills.ai/v1/ep/rc-prod-8f2a/predict',
    region: 'us-east-1',
    instanceName: 'a10g-1',
    minReplicas: 1,
    maxReplicas: 10,
    activeReplicas: 3,
    requests24h: '142,380',
    latencyP50: '61 ms',
    latencyP95: '140 ms',
    latencyP99: '218 ms',
    errorRate: '0.11%',
    costPerDay: '$12.40',
    deployed: '6 days ago',
  },
  {
    id: 'retail-classify-canary',
    projectId: 'retail',
    modelId: 'retail-convnext-tiny-v1',
    name: 'retail-classify-canary',
    status: 'Live',
    environment: 'Staging',
    endpoint: 'https://api.drills.ai/v1/ep/rc-canary-1d70/predict',
    region: 'us-east-1',
    instanceName: 't4-1',
    minReplicas: 1,
    maxReplicas: 3,
    activeReplicas: 1,
    requests24h: '8,210',
    latencyP50: '44 ms',
    latencyP95: '96 ms',
    latencyP99: '151 ms',
    errorRate: '0.04%',
    costPerDay: '$3.10',
    deployed: '2 days ago',
  },
  {
    id: 'retail-batch-nightly',
    projectId: 'retail',
    modelId: 'retail-resnet50-v2',
    name: 'batch-nightly',
    status: 'Paused',
    environment: 'Batch',
    endpoint: 'https://api.drills.ai/v1/ep/batch-nightly-c31e/predict',
    region: 'us-west-2',
    instanceName: 'cpu-4',
    minReplicas: 0,
    maxReplicas: 8,
    activeReplicas: 0,
    requests24h: '—',
    latencyP50: '—',
    latencyP95: '—',
    latencyP99: '—',
    errorRate: '—',
    costPerDay: '$0.00',
    deployed: '5 weeks ago',
  },
  {
    id: 'retail-edge-package',
    projectId: 'retail',
    modelId: 'retail-mobilenet-v3-v1',
    name: 'edge-package',
    status: 'Deploying',
    environment: 'Edge',
    endpoint: 'https://api.drills.ai/v1/ep/edge-pkg-77b4/predict',
    region: 'eu-west-1',
    instanceName: 'edge-arm64',
    minReplicas: 0,
    maxReplicas: 1,
    activeReplicas: 0,
    requests24h: '—',
    latencyP50: '—',
    latencyP95: '—',
    latencyP99: '—',
    errorRate: '—',
    costPerDay: '$0.00',
    deployed: 'in progress',
  },
  {
    id: 'support-triage-prod',
    projectId: 'support',
    modelId: 'support-bert-triage-v2',
    name: 'support-triage-prod',
    status: 'Live',
    environment: 'Production',
    endpoint: 'https://api.drills.ai/v1/ep/st-prod-4b19/predict',
    region: 'us-east-1',
    instanceName: 't4-1',
    minReplicas: 2,
    maxReplicas: 6,
    activeReplicas: 2,
    requests24h: '31,940',
    latencyP50: '38 ms',
    latencyP95: '58 ms',
    latencyP99: '104 ms',
    errorRate: '0.02%',
    costPerDay: '$6.80',
    deployed: '4 days ago',
  },
]

/**
 * 24 hourly request counts ending "now". Deterministic on purpose — the same
 * reason `createResourceUsage` is: these values are asserted in tests.
 */
export const requestVolume24h = [
  3120, 2740, 2310, 2050, 1980, 2240, 3480, 5120, 7340, 8210, 8640, 8120, 7960,
  8430, 8890, 9240, 8760, 8110, 7420, 6380, 5240, 4610, 3980, 3410,
]

export type RequestLogEntry = {
  time: string
  method: string
  status: number
  latency: string
  client: string
  requestId: string
}

const logShape: Array<[string, number, string, string]> = [
  ['12:41:02', 200, '78 ms', 'sdk-python/1.4'],
  ['12:40:58', 200, '142 ms', 'sdk-js/2.1'],
  ['12:40:51', 429, '—', 'curl/8.4'],
  ['12:40:44', 200, '91 ms', 'sdk-python/1.4'],
  ['12:40:39', 500, '—', 'sdk-js/2.1'],
  ['12:40:31', 200, '104 ms', 'sdk-python/1.4'],
  ['12:40:22', 200, '67 ms', 'sdk-go/0.9'],
]

/** Request log for one deployment. Empty unless it is actually serving. */
export function deploymentLogs(deployment: Deployment): RequestLogEntry[] {
  if (deployment.status !== 'Live') return []
  const slug = deployment.endpoint.split('/').at(-2) ?? deployment.id
  return logShape.map(([time, status, latency, client], index) => ({
    time,
    method: 'POST',
    status,
    latency,
    client,
    requestId: `req_${slug}_${(9124 - index * 37).toString(16)}`,
  }))
}
