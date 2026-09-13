import type { Activity, Deployment, TrainingRun } from '../domain/types'

export const activities: Activity[] = [
  {
    id: 'a1',
    orgId: 'acme',
    icon: 'success',
    lead: 'Training resnet50-v3',
    text: 'completed — 94.2% accuracy',
    time: '12m ago',
    action: 'Deploy',
  },
  {
    id: 'a2',
    orgId: 'acme',
    icon: 'dataset',
    lead: 'Dataset retail-products-v2',
    text: 'finished processing (18,420 images)',
    time: '1h ago',
    action: 'View',
  },
  {
    id: 'a3',
    orgId: 'acme',
    icon: 'deployment',
    lead: 'Endpoint sentiment-prod',
    text: 'scaled to 3 replicas',
    time: '2h ago',
    action: 'Monitor',
  },
  {
    id: 'a4',
    orgId: 'acme',
    icon: 'error',
    lead: 'Training vit-base-lr3',
    text: 'failed — CUDA out of memory',
    time: '4h ago',
    action: 'Retry',
  },
  {
    id: 'a5',
    orgId: 'acme',
    icon: 'person',
    lead: 'Priya Nair',
    text: 'joined organization Acme AI',
    time: 'Yesterday',
    action: 'Profile',
  },
  {
    id: 'a6',
    orgId: 'acme',
    icon: 'success',
    lead: 'Model churn-xgb-v4',
    text: 'promoted to production',
    time: '2d ago',
    action: 'View',
  },
  {
    id: 'n1',
    orgId: 'northwind',
    icon: 'dataset',
    lead: 'Dataset invoices-2026',
    text: 'finished processing (3,208 files)',
    time: '35m ago',
    action: 'View',
  },
]

/**
 * Wall-clock milliseconds a run takes per estimated hour of compute. A typical
 * wizard run is estimated at ~1.33 hours, so it completes in about 30 seconds.
 */
export const SIMULATED_MS_PER_ESTIMATED_HOUR = 22_500

/**
 * Fixtures are placed relative to module evaluation so the seeded runs are
 * always mid-flight on a fresh load and then advance like user-created runs.
 * Their long `estimatedHours` keep them running for the length of a session.
 */
const SEED_NOW = Date.now()

function seededRun(
  run: Omit<TrainingRun, 'startedAt'> & { elapsedFraction: number },
): TrainingRun {
  const { elapsedFraction, ...rest } = run
  return {
    ...rest,
    startedAt:
      SEED_NOW -
      elapsedFraction * rest.estimatedHours * SIMULATED_MS_PER_ESTIMATED_HOUR,
  }
}

const seededRunDefaults = {
  batchSize: 32,
  split: { train: 80, validation: 10, test: 10 },
  learningRate: 1e-3,
  scheduler: 'cosine',
  augmentations: [],
  earlyStopping: true,
  spot: false,
  status: 'Running',
  author: 'Alex Rivera',
} satisfies Partial<TrainingRun>

export const seededTrainingRuns: TrainingRun[] = [
  seededRun({
    ...seededRunDefaults,
    id: 't1',
    projectId: 'retail',
    datasetId: 'retail-train',
    name: 'efficientnet-b4',
    architecture: 'efficientnet-b4',
    epochs: 30,
    instanceId: 'a100',
    instanceName: '1× A100 80GB',
    estimatedHours: 24,
    estimatedCost: 78.72,
    progress: 40,
    step: 4_820,
    totalSteps: 12_000,
    throughput: '312 img/s',
    gpuUtilization: '94%',
    gpuMemory: '18.2 / 24 GB',
    elapsedFraction: 0.4,
  }),
  seededRun({
    ...seededRunDefaults,
    id: 't2',
    projectId: 'support',
    datasetId: 'support-train',
    name: 'bert-triage-v2',
    architecture: 'bert-base',
    epochs: 10,
    instanceId: 't4',
    instanceName: '1× T4 16GB',
    estimatedHours: 36,
    estimatedCost: 21.24,
    progress: 38,
    step: 1_520,
    totalSteps: 4_000,
    throughput: '312 items/s',
    gpuUtilization: '71%',
    gpuMemory: '9.4 / 16 GB',
    elapsedFraction: 0.38,
  }),
  seededRun({
    ...seededRunDefaults,
    id: 't3',
    projectId: 'defect',
    datasetId: 'defect-train',
    name: 'yolov8-defect',
    architecture: 'yolov8m',
    epochs: 40,
    instanceId: 'a100',
    instanceName: '1× A100 80GB',
    estimatedHours: 18,
    estimatedCost: 59.04,
    progress: 67,
    step: 10_720,
    totalSteps: 16_000,
    throughput: '184 img/s',
    gpuUtilization: '97%',
    gpuMemory: '21.8 / 24 GB',
    elapsedFraction: 0.67,
  }),
  seededRun({
    ...seededRunDefaults,
    id: 't4',
    projectId: 'docs',
    datasetId: 'docs-train',
    name: 'layoutlm-invoices',
    architecture: 'layoutlmv3-base',
    epochs: 20,
    instanceId: 't4',
    instanceName: '1× T4 16GB',
    estimatedHours: 30,
    estimatedCost: 17.7,
    progress: 30,
    step: 2_400,
    totalSteps: 8_000,
    throughput: '96 pages/s',
    gpuUtilization: '68%',
    gpuMemory: '8.1 / 16 GB',
    elapsedFraction: 0.3,
  }),
]

export const deployments: Deployment[] = [
  {
    id: 'd1',
    orgId: 'acme',
    name: 'sentiment-prod',
    latency: '82ms',
    errorRate: '0.02%',
    status: 'Live',
  },
  {
    id: 'd2',
    orgId: 'acme',
    name: 'retail-classify',
    latency: '140ms',
    errorRate: '0.11%',
    status: 'Live',
  },
  {
    id: 'd3',
    orgId: 'acme',
    name: 'defect-staging',
    latency: '—',
    errorRate: '—',
    status: 'Paused',
  },
  {
    id: 'd4',
    orgId: 'northwind',
    name: 'invoice-extract',
    latency: '118ms',
    errorRate: '0.05%',
    status: 'Live',
  },
]
