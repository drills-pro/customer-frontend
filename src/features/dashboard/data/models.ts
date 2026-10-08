import type { Model } from '../domain/types'

/**
 * Trained model versions. Like `seededTrainingRuns`, these are fixtures for the
 * projects the demo populates; other projects render the empty state.
 */
export const models: Model[] = [
  {
    id: 'retail-resnet50-v3',
    projectId: 'retail',
    name: 'resnet50',
    version: 3,
    architecture: 'ResNet-50',
    framework: 'PyTorch 2.4',
    runId: 't1',
    accuracy: 94.2,
    f1: 0.938,
    latencyP95: '82 ms',
    size: '98 MB',
    stage: 'Production',
    author: 'Alex Rivera',
    created: '6 days ago',
  },
  {
    id: 'retail-convnext-tiny-v1',
    projectId: 'retail',
    name: 'convnext-tiny',
    version: 1,
    architecture: 'ConvNeXt-Tiny',
    framework: 'PyTorch 2.4',
    runId: 't1',
    accuracy: 92.8,
    f1: 0.921,
    latencyP95: '96 ms',
    size: '112 MB',
    stage: 'Staging',
    author: 'Priya Nair',
    created: '9 days ago',
  },
  {
    id: 'retail-mobilenet-v3-v1',
    projectId: 'retail',
    name: 'mobilenet-v3',
    version: 1,
    architecture: 'MobileNetV3-Large',
    framework: 'PyTorch 2.4',
    runId: 't1',
    accuracy: 88.1,
    f1: 0.874,
    latencyP95: '24 ms',
    size: '21 MB',
    stage: 'Staging',
    author: 'Alex Rivera',
    created: '3 weeks ago',
  },
  {
    id: 'retail-resnet50-v2',
    projectId: 'retail',
    name: 'resnet50',
    version: 2,
    architecture: 'ResNet-50',
    framework: 'PyTorch 2.4',
    runId: 't1',
    accuracy: 91.7,
    f1: 0.905,
    latencyP95: '94 ms',
    size: '98 MB',
    stage: 'Archived',
    author: 'Alex Rivera',
    created: '5 weeks ago',
  },
  {
    id: 'retail-resnet50-v1',
    projectId: 'retail',
    name: 'resnet50',
    version: 1,
    architecture: 'ResNet-50',
    framework: 'PyTorch 2.3',
    runId: 't1',
    accuracy: 86.6,
    f1: 0.844,
    latencyP95: '97 ms',
    size: '98 MB',
    stage: 'Archived',
    author: 'Priya Nair',
    created: '8 weeks ago',
  },

  {
    id: 'support-bert-triage-v2',
    projectId: 'support',
    name: 'bert-triage',
    version: 2,
    architecture: 'bert-base',
    framework: 'PyTorch 2.4',
    runId: 't2',
    accuracy: 91.4,
    f1: 0.899,
    latencyP95: '58 ms',
    size: '418 MB',
    stage: 'Production',
    author: 'Priya Nair',
    created: '4 days ago',
  },
  {
    id: 'support-bert-triage-v1',
    projectId: 'support',
    name: 'bert-triage',
    version: 1,
    architecture: 'bert-base',
    framework: 'PyTorch 2.4',
    runId: 't2',
    accuracy: 87.9,
    f1: 0.861,
    latencyP95: '61 ms',
    size: '418 MB',
    stage: 'Archived',
    author: 'Priya Nair',
    created: '3 weeks ago',
  },
  {
    id: 'support-distilbert-triage-v1',
    projectId: 'support',
    name: 'distilbert-triage',
    version: 1,
    architecture: 'distilbert-base',
    framework: 'PyTorch 2.4',
    runId: 't2',
    accuracy: 89.2,
    f1: 0.877,
    latencyP95: '27 ms',
    size: '256 MB',
    stage: 'Staging',
    author: 'Alex Rivera',
    created: '1 week ago',
  },
]

export type ModelDetail = {
  /** The dataset the source run trained on, for the lineage strip. */
  datasetId: string
  /** Weakest classes first — the list is only useful sorted that way. */
  perClassAccuracy: Array<{ label: string; accuracy: number; support: number }>
  files: Array<{ name: string; type: string; size: string }>
}

export const modelDetails: Partial<Record<string, ModelDetail>> = {
  'retail-resnet50-v3': {
    datasetId: 'retail-train',
    perClassAccuracy: [
      { label: 'beverages_soda_500ml', accuracy: 81.2, support: 142 },
      { label: 'snacks_chips_family', accuracy: 84.0, support: 98 },
      { label: 'dairy_yogurt_cup', accuracy: 86.5, support: 211 },
      { label: 'bakery_bread_loaf', accuracy: 88.1, support: 174 },
      { label: 'produce_apple_bag', accuracy: 89.4, support: 203 },
    ],
    files: [
      { name: 'model.safetensors', type: 'Weights', size: '98 MB' },
      { name: 'config.json', type: 'Config', size: '2 KB' },
      { name: 'preprocessor_config.json', type: 'Config', size: '1 KB' },
      { name: 'labels.txt', type: 'Classes', size: '4 KB' },
      { name: 'README.md', type: 'Docs', size: '3 KB' },
    ],
  },
  'support-bert-triage-v2': {
    datasetId: 'support-train',
    perClassAccuracy: [
      { label: 'billing_refund_request', accuracy: 78.4, support: 89 },
      { label: 'account_access_locked', accuracy: 83.1, support: 124 },
      { label: 'shipping_delay', accuracy: 88.7, support: 302 },
      { label: 'product_defect', accuracy: 90.2, support: 187 },
      { label: 'general_enquiry', accuracy: 92.5, support: 411 },
    ],
    files: [
      { name: 'model.safetensors', type: 'Weights', size: '418 MB' },
      { name: 'config.json', type: 'Config', size: '2 KB' },
      { name: 'tokenizer.json', type: 'Tokenizer', size: '694 KB' },
      { name: 'labels.txt', type: 'Classes', size: '1 KB' },
    ],
  },
}

/** Stand-in detail for a model with no fixture, so the tabs are never blank. */
export function fallbackModelDetail(model: Model): ModelDetail {
  return {
    datasetId: `${model.projectId}-train`,
    perClassAccuracy: [],
    files: [
      { name: 'model.safetensors', type: 'Weights', size: model.size },
      { name: 'config.json', type: 'Config', size: '2 KB' },
      { name: 'README.md', type: 'Docs', size: '3 KB' },
    ],
  }
}
