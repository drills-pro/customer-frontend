import type { ApiModel, ApiModelDetail, ApiModelFile } from '@/features/models/api/types';
import { daysAgo, kb, mb, weeksAgo } from './units';

/** A model as stored: which deployment serves it is worked out per request. */
export type ModelRecord = Omit<ApiModel, 'deployment_id'>;

const retail = { project_id: 'retail', run_id: 't1' };
const support = {
  project_id: 'support',
  run_id: 't2',
  architecture: 'bert-base',
  framework: 'PyTorch 2.4',
};

/** Trained model versions for the projects the demo populates. */
export const modelSeed: ModelRecord[] = [
  {
    ...retail,
    id: 'retail-resnet50-v3',
    name: 'resnet50',
    version: 3,
    architecture: 'ResNet-50',
    framework: 'PyTorch 2.4',
    accuracy: 94.2,
    f1: 0.938,
    latency_p95_ms: 82,
    size_bytes: mb(98),
    stage: 'production',
    author: 'Alex Rivera',
    created_at: daysAgo(6),
  },
  {
    ...retail,
    id: 'retail-convnext-tiny-v1',
    name: 'convnext-tiny',
    version: 1,
    architecture: 'ConvNeXt-Tiny',
    framework: 'PyTorch 2.4',
    accuracy: 92.8,
    f1: 0.921,
    latency_p95_ms: 96,
    size_bytes: mb(112),
    stage: 'staging',
    author: 'Priya Nair',
    created_at: daysAgo(9),
  },
  {
    ...retail,
    id: 'retail-mobilenet-v3-v1',
    name: 'mobilenet-v3',
    version: 1,
    architecture: 'MobileNetV3-Large',
    framework: 'PyTorch 2.4',
    accuracy: 88.1,
    f1: 0.874,
    latency_p95_ms: 24,
    size_bytes: mb(21),
    stage: 'staging',
    author: 'Alex Rivera',
    created_at: weeksAgo(3),
  },
  {
    ...retail,
    id: 'retail-resnet50-v2',
    name: 'resnet50',
    version: 2,
    architecture: 'ResNet-50',
    framework: 'PyTorch 2.4',
    accuracy: 91.7,
    f1: 0.905,
    latency_p95_ms: 94,
    size_bytes: mb(98),
    stage: 'archived',
    author: 'Alex Rivera',
    created_at: weeksAgo(5),
  },
  {
    ...retail,
    id: 'retail-resnet50-v1',
    name: 'resnet50',
    version: 1,
    architecture: 'ResNet-50',
    framework: 'PyTorch 2.3',
    accuracy: 86.6,
    f1: 0.844,
    latency_p95_ms: 97,
    size_bytes: mb(98),
    stage: 'archived',
    author: 'Priya Nair',
    created_at: weeksAgo(8),
  },
  {
    ...support,
    id: 'support-bert-triage-v2',
    name: 'bert-triage',
    version: 2,
    accuracy: 91.4,
    f1: 0.899,
    latency_p95_ms: 58,
    size_bytes: mb(418),
    stage: 'production',
    author: 'Priya Nair',
    created_at: daysAgo(4),
  },
  {
    ...support,
    id: 'support-bert-triage-v1',
    name: 'bert-triage',
    version: 1,
    accuracy: 87.9,
    f1: 0.861,
    latency_p95_ms: 61,
    size_bytes: mb(418),
    stage: 'archived',
    author: 'Priya Nair',
    created_at: weeksAgo(3),
  },
  {
    ...support,
    id: 'support-distilbert-triage-v1',
    name: 'distilbert-triage',
    version: 1,
    architecture: 'distilbert-base',
    accuracy: 89.2,
    f1: 0.877,
    latency_p95_ms: 27,
    size_bytes: mb(256),
    stage: 'staging',
    author: 'Alex Rivera',
    created_at: daysAgo(7),
  },
];

type ModelExtras = Pick<ApiModelDetail, 'dataset_id' | 'per_class_accuracy'> & {
  files: ApiModelFile[];
};

const modelExtras: Partial<Record<string, ModelExtras>> = {
  'retail-resnet50-v3': {
    dataset_id: 'retail-train',
    per_class_accuracy: [
      { label: 'beverages_soda_500ml', accuracy: 81.2, support: 142 },
      { label: 'snacks_chips_family', accuracy: 84.0, support: 98 },
      { label: 'dairy_yogurt_cup', accuracy: 86.5, support: 211 },
      { label: 'bakery_bread_loaf', accuracy: 88.1, support: 174 },
      { label: 'produce_apple_bag', accuracy: 89.4, support: 203 },
    ],
    files: [
      { name: 'model.safetensors', type: 'Weights', size_bytes: mb(98) },
      { name: 'config.json', type: 'Config', size_bytes: kb(2) },
      { name: 'preprocessor_config.json', type: 'Config', size_bytes: kb(1) },
      { name: 'labels.txt', type: 'Classes', size_bytes: kb(4) },
      { name: 'README.md', type: 'Docs', size_bytes: kb(3) },
    ],
  },
  'support-bert-triage-v2': {
    dataset_id: 'support-train',
    per_class_accuracy: [
      { label: 'billing_refund_request', accuracy: 78.4, support: 89 },
      { label: 'account_access_locked', accuracy: 83.1, support: 124 },
      { label: 'shipping_delay', accuracy: 88.7, support: 302 },
      { label: 'product_defect', accuracy: 90.2, support: 187 },
      { label: 'general_enquiry', accuracy: 92.5, support: 411 },
    ],
    files: [
      { name: 'model.safetensors', type: 'Weights', size_bytes: mb(418) },
      { name: 'config.json', type: 'Config', size_bytes: kb(2) },
      { name: 'tokenizer.json', type: 'Tokenizer', size_bytes: kb(694) },
      { name: 'labels.txt', type: 'Classes', size_bytes: kb(1) },
    ],
  },
};

/** A model with no fixture still gets a plausible file list and lineage. */
export function extrasFor(model: ModelRecord): ModelExtras {
  return (
    modelExtras[model.id] ?? {
      dataset_id: `${model.project_id}-train`,
      per_class_accuracy: [],
      files: [
        {
          name: 'model.safetensors',
          type: 'Weights',
          size_bytes: model.size_bytes,
        },
        { name: 'config.json', type: 'Config', size_bytes: kb(2) },
        { name: 'README.md', type: 'Docs', size_bytes: kb(3) },
      ],
    }
  );
}

/** What the playground answers; the mock has no model to run. */
export const cannedPrediction = {
  predictions: [
    { label: 'beverages_cola_330ml', confidence: 96.4 },
    { label: 'beverages_cola_500ml', confidence: 2.1 },
    { label: 'beverages_soda_330ml', confidence: 0.9 },
    { label: 'snacks_chips_large', confidence: 0.4 },
    { label: 'other', confidence: 0.2 },
  ],
  contributions: [
    { label: 'Label region — top-left quadrant', weight: 31 },
    { label: 'Color histogram — red channel', weight: 24 },
    { label: 'Texture uniformity', weight: 18 },
    { label: 'Aspect ratio', weight: 12 },
    { label: 'Background contrast', weight: 9 },
  ],
};
