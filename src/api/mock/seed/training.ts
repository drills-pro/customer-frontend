import type { ApiTrainingRun } from '@/features/training/api/types';
import { SEED_NOW } from './units';

/**
 * Wall-clock milliseconds a run takes per estimated hour of compute. A typical
 * wizard run is estimated at about 1.33 hours, so it completes in about 30
 * seconds.
 */
export const SIMULATED_MS_PER_ESTIMATED_HOUR = 22_500;

type SeedRun = Omit<ApiTrainingRun, 'started_at' | 'status' | 'epoch' | 'eta_seconds' | 'author' | 'config'> & {
  epochs: number;
  /** Where the run stands when the mock loads; it advances from there. */
  elapsed_fraction: number;
};

/**
 * Seeded runs are always mid-flight on a fresh load. Their long
 * `estimated_hours` keep them running for the length of a session.
 */
function run({ epochs, elapsed_fraction, ...rest }: SeedRun): ApiTrainingRun {
  return {
    ...rest,
    config: {
      epochs,
      batch_size: 32,
      split: { train: 80, validation: 10, test: 10 },
      learning_rate: 1e-3,
      scheduler: 'cosine',
      augmentations: [],
      early_stopping: true,
      instance_id: rest.instance_name.includes('A100') ? 'a100' : 't4',
      spot: false,
    },
    author: 'Alex Rivera',
    status: 'running',
    epoch: Math.max(1, Math.ceil(elapsed_fraction * epochs)),
    eta_seconds: null,
    started_at: new Date(SEED_NOW - elapsed_fraction * rest.estimated_hours * SIMULATED_MS_PER_ESTIMATED_HOUR).toISOString(),
  };
}

export const trainingRunSeed = (): ApiTrainingRun[] => [
  run({
    id: 't1',
    project_id: 'retail',
    dataset_id: 'retail-train',
    name: 'efficientnet-b4',
    architecture: 'efficientnet-b4',
    epochs: 30,
    instance_name: '1× A100 80GB',
    estimated_hours: 24,
    estimated_cost_usd: 78.72,
    progress: 40,
    step: 4_820,
    total_steps: 12_000,
    throughput_per_second: 312,
    throughput_unit: 'img',
    gpu_utilization_percent: 94,
    gpu_memory_used_gb: 18.2,
    gpu_memory_total_gb: 24,
    elapsed_fraction: 0.4,
  }),
  run({
    id: 't2',
    project_id: 'support',
    dataset_id: 'support-train',
    name: 'bert-triage-v2',
    architecture: 'bert-base',
    epochs: 10,
    instance_name: '1× T4 16GB',
    estimated_hours: 36,
    estimated_cost_usd: 21.24,
    progress: 38,
    step: 1_520,
    total_steps: 4_000,
    throughput_per_second: 312,
    throughput_unit: 'items',
    gpu_utilization_percent: 71,
    gpu_memory_used_gb: 9.4,
    gpu_memory_total_gb: 16,
    elapsed_fraction: 0.38,
  }),
  run({
    id: 't3',
    project_id: 'defect',
    dataset_id: 'defect-train',
    name: 'yolov8-defect',
    architecture: 'yolov8m',
    epochs: 40,
    instance_name: '1× A100 80GB',
    estimated_hours: 18,
    estimated_cost_usd: 59.04,
    progress: 67,
    step: 10_720,
    total_steps: 16_000,
    throughput_per_second: 184,
    throughput_unit: 'img',
    gpu_utilization_percent: 97,
    gpu_memory_used_gb: 21.8,
    gpu_memory_total_gb: 24,
    elapsed_fraction: 0.67,
  }),
  run({
    id: 't4',
    project_id: 'docs',
    dataset_id: 'docs-train',
    name: 'layoutlm-invoices',
    architecture: 'layoutlmv3-base',
    epochs: 20,
    instance_name: '1× T4 16GB',
    estimated_hours: 30,
    estimated_cost_usd: 17.7,
    progress: 30,
    step: 2_400,
    total_steps: 8_000,
    throughput_per_second: 96,
    throughput_unit: 'pages',
    gpu_utilization_percent: 68,
    gpu_memory_used_gb: 8.1,
    gpu_memory_total_gb: 16,
    elapsed_fraction: 0.3,
  }),
];
