import type { ApiIntegration, ApiProjectDetail, ApiProjectMember } from '@/features/projects/api/types';
import { defaultUsageScale } from './usage';
import type { UsageScale } from './usage';
import { daysAgo, hoursAgo, mb, onDate } from './units';

/** A project as stored: the detail response plus what its usage is built from. */
export type ProjectRecord = ApiProjectDetail & {
  usage_scale: UsageScale;
  /** A copy of a core-api project (`../mirror.ts`). */
  mirrored?: boolean;
};

type SeedInput = Pick<
  ProjectRecord,
  | 'id'
  | 'organization_id'
  | 'name'
  | 'description'
  | 'task_type'
  | 'status'
  | 'color'
  | 'created_at'
  | 'updated_at'
  | 'dataset_count'
  | 'model_count'
  | 'deployment_count'
  | 'region'
  | 'best_model'
> &
  Partial<ProjectRecord>;

function project(values: SeedInput): ProjectRecord {
  return {
    framework: 'PyTorch 2.4',
    visibility: 'organization',
    pipeline: { runs: 8, running: 1, complete_through: 3 },
    readme: null,
    readme_markdown: null,
    usage_scale: defaultUsageScale,
    ...values,
  };
}

export const projectSeed: ProjectRecord[] = [
  project({
    id: 'retail',
    organization_id: 'acme',
    name: 'Retail Vision',
    description: 'Classify 240 SKU categories from shelf photos',
    task_type: 'image_classification',
    status: 'active',
    color: '#6366f1',
    created_at: onDate('2026-06-12'),
    updated_at: hoursAgo(2),
    dataset_count: 4,
    model_count: 5,
    deployment_count: 2,
    region: 'us-east-1',
    pipeline: { runs: 23, running: 3, complete_through: 3 },
    readme: {
      about:
        'Retail Vision classifies shelf photos into 240 SKU categories for planogram compliance and out-of-stock detection. It is trained on images captured from in-store fixed cameras and handheld audits.',
      architecture: 'resnet50-v3',
      quickstart: `# predict.sh
curl -X POST https://api.drills.ai/v1/predict \\
  -H "Authorization: Bearer $DRILLS_KEY" \\
  -d '{"model": "resnet50-v3", "image": "<base64>"}'`,
      notes: [
        {
          label: 'Data drift',
          text: 'Retrain monthly because shelf lighting varies by store region.',
        },
        {
          label: 'Known limitation',
          text: 'Confuses near-identical private-label variants in under 3% of frames.',
        },
        {
          label: 'Owner',
          text: 'Alex Rivera — coordinate in #retail-vision before promoting a new run.',
        },
      ],
    },
    best_model: {
      name: 'resnet50-v3',
      run: '#23',
      updated_at: hoursAgo(2),
      accuracy: 94.2,
      f1: 0.938,
      latency_ms: 82,
      size_bytes: mb(98),
    },
  }),
  project({
    id: 'support',
    organization_id: 'acme',
    name: 'Support Triage',
    description: 'Route inbound tickets to the right queue automatically',
    task_type: 'text_classification',
    status: 'active',
    color: '#10b981',
    created_at: onDate('2026-05-03'),
    updated_at: daysAgo(1),
    dataset_count: 2,
    model_count: 5,
    deployment_count: 1,
    region: 'us-west-2',
    pipeline: { runs: 12, running: 1, complete_through: 4 },
    best_model: {
      name: 'bert-triage-v2',
      run: '#12',
      updated_at: daysAgo(1),
      accuracy: 92.7,
      f1: 0.921,
      latency_ms: 64,
      size_bytes: mb(112),
    },
  }),
  project({
    id: 'churn',
    organization_id: 'acme',
    name: 'Churn Predictor',
    description: 'Predict 90-day subscriber churn from usage signals',
    task_type: 'tabular',
    status: 'active',
    color: '#f59e0b',
    created_at: onDate('2026-04-18'),
    updated_at: daysAgo(2),
    dataset_count: 3,
    model_count: 3,
    deployment_count: 1,
    framework: 'XGBoost 3.0',
    region: 'us-east-1',
    pipeline: { runs: 9, running: 0, complete_through: 4 },
    best_model: {
      name: 'churn-xgb-v4',
      run: '#9',
      updated_at: daysAgo(2),
      accuracy: 89.6,
      f1: 0.884,
      latency_ms: 31,
      size_bytes: mb(24),
    },
  }),
  project({
    id: 'defect',
    organization_id: 'acme',
    name: 'Defect Detection',
    description: 'Find surface defects on production line imagery',
    task_type: 'object_detection',
    status: 'active',
    color: '#d946ef',
    created_at: onDate('2026-03-25'),
    updated_at: daysAgo(3),
    dataset_count: 6,
    model_count: 11,
    deployment_count: 3,
    region: 'eu-west-1',
    pipeline: { runs: 18, running: 2, complete_through: 4 },
    best_model: {
      name: 'yolov8-defect',
      run: '#18',
      updated_at: daysAgo(3),
      accuracy: 91.8,
      f1: 0.909,
      latency_ms: 105,
      size_bytes: mb(86),
    },
  }),
  project({
    id: 'docs',
    organization_id: 'northwind',
    name: 'Doc Extractor',
    description: 'Extract fields from scanned invoices',
    task_type: 'document_ai',
    status: 'draft',
    color: '#0ea5e9',
    created_at: onDate('2026-08-27'),
    updated_at: hoursAgo(5),
    dataset_count: 2,
    model_count: 4,
    deployment_count: 0,
    framework: 'Transformers 5.1',
    region: 'eu-central-1',
    pipeline: { runs: 4, running: 1, complete_through: 3 },
    best_model: {
      name: 'layoutlm-invoices',
      run: '#4',
      updated_at: hoursAgo(5),
      accuracy: 88.4,
      f1: 0.872,
      latency_ms: 118,
      size_bytes: mb(132),
    },
    usage_scale: { gpu_scale: 18 / 42, storage_scale: 0.5, endpoints_max: 0 },
  }),
  project({
    id: 'demand',
    organization_id: 'northwind',
    name: 'Demand Forecast',
    description: 'Weekly SKU-level demand forecasting',
    task_type: 'time_series',
    status: 'archived',
    color: '#f43f5e',
    created_at: onDate('2026-02-09'),
    updated_at: daysAgo(4),
    dataset_count: 5,
    model_count: 7,
    deployment_count: 1,
    framework: 'PyTorch Forecasting',
    region: 'ap-southeast-1',
    pipeline: { runs: 14, running: 0, complete_through: 4 },
    best_model: {
      name: 'temporal-fusion-v2',
      run: '#14',
      updated_at: daysAgo(4),
      accuracy: 86.9,
      f1: 0.861,
      latency_ms: 76,
      size_bytes: mb(71),
    },
  }),
];

/** The people every project starts with, until its members are changed. */
export const defaultProjectMembers: ApiProjectMember[] = [
  {
    id: 'alex-rivera',
    name: 'Alex Rivera',
    email: 'alex.rivera@acme.ai',
    color: '#8b5cf6',
    role: 'owner',
    status: 'active',
  },
  {
    id: 'priya-nair',
    name: 'Priya Nair',
    email: 'priya.nair@acme.ai',
    color: '#d946ef',
    role: 'editor',
    status: 'active',
  },
  {
    id: 'sam-cole',
    name: 'Sam Cole',
    email: 'sam.cole@acme.ai',
    color: '#6366f1',
    role: 'viewer',
    status: 'active',
  },
];

/** Avatar colours handed to invited project members in turn. */
export const projectInviteColors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899'];

export const integrationCatalog: ApiIntegration[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Start a training run when a config changes on main.',
    enabled: true,
  },
  {
    id: 'slack',
    name: 'Slack notifications',
    description: 'Post run results and deployment alerts to #ml-alerts.',
    enabled: true,
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    description: 'Send run and deployment events to your own endpoint.',
    enabled: false,
  },
  {
    id: 's3',
    name: 'S3 bucket sync',
    description: 'Import new images from a bucket as a dataset version.',
    enabled: false,
  },
];
