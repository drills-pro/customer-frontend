/**
 * Reference data the mock server answers the catalog endpoints from, and reads
 * itself when it creates a project, names a run or estimates a training.
 */
import type {
  ApiComputeOption,
  ApiPlan,
  ApiProjectTemplate,
  ApiRegion,
  ApiTaskType,
} from '@/features/catalog/api/types'
import type { ApiDatasetModality } from '@/features/datasets/api/types'
import { mb } from './units'

export const taskTypes: ApiTaskType[] = [
  {
    id: 'image_classification',
    label: 'Image Classification',
    selectable: true,
  },
  { id: 'object_detection', label: 'Object Detection', selectable: true },
  { id: 'segmentation', label: 'Segmentation', selectable: true },
  { id: 'text_classification', label: 'Text Classification', selectable: true },
  {
    id: 'named_entity_recognition',
    label: 'Named Entity Recognition',
    selectable: true,
  },
  { id: 'tabular_prediction', label: 'Tabular Prediction', selectable: true },
  { id: 'time_series', label: 'Time Series', selectable: true },
  // Types older projects were created with; no longer offered for new ones.
  { id: 'tabular', label: 'Tabular', selectable: false },
  { id: 'document_ai', label: 'Document AI', selectable: false },
]

/** What a dataset added to a project of this type holds. */
export function modalityForTask(taskType: string): ApiDatasetModality {
  if (taskType.includes('image')) return 'image'
  if (taskType.includes('text')) return 'text'
  return 'tabular'
}

export function frameworkForTask(taskType: string) {
  if (taskType === 'tabular' || taskType === 'tabular_prediction')
    return 'XGBoost 3.0'
  if (taskType === 'time_series') return 'PyTorch Forecasting'
  if (
    taskType === 'text_classification' ||
    taskType === 'named_entity_recognition'
  )
    return 'Transformers 5.1'
  return 'PyTorch 2.4'
}

export const regions: ApiRegion[] = [
  { id: 'us-east-1', label: 'US East (N. Virginia)' },
  { id: 'us-west-2', label: 'US West (Oregon)' },
  { id: 'eu-west-1', label: 'EU (Ireland)' },
  { id: 'eu-central-1', label: 'EU (Frankfurt)' },
  { id: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
]

export const plans: ApiPlan[] = [
  { id: 'free', seats: 3, projects: 3, credits: 100, price: '$0' },
  { id: 'team', seats: 30, projects: 25, credits: 2000, price: '$249/mo' },
  {
    id: 'enterprise',
    seats: 250,
    projects: 200,
    credits: 20000,
    price: 'Custom',
  },
]

export function planLimits(plan: ApiPlan['id']) {
  const { id: _id, ...limits } = plans.find((item) => item.id === plan)!
  return limits
}

export const projectTemplates: ApiProjectTemplate[] = [
  {
    id: 'retail-shelf-audit',
    task_type: 'image_classification',
    name: 'Retail shelf audit',
    description: 'Classify product categories from shelf photos.',
    dataset: {
      name: 'retail-shelf-sample',
      modality: 'image',
      item_count: 1200,
      size_bytes: mb(180),
      class_count: 6,
    },
  },
  {
    id: 'plant-disease',
    task_type: 'image_classification',
    name: 'Plant disease detection',
    description: 'Identify crop disease from leaf close-ups.',
    dataset: {
      name: 'plant-disease-sample',
      modality: 'image',
      item_count: 940,
      size_bytes: mb(140),
      class_count: 8,
    },
  },
  {
    id: 'surface-defects',
    task_type: 'object_detection',
    name: 'Surface defect detection',
    description: 'Locate defects on production line imagery.',
    dataset: {
      name: 'surface-defect-sample',
      modality: 'image',
      item_count: 860,
      size_bytes: mb(210),
      class_count: 4,
    },
  },
  {
    id: 'ppe-compliance',
    task_type: 'object_detection',
    name: 'PPE compliance',
    description: 'Detect helmets, vests, and gloves in site photos.',
    dataset: {
      name: 'ppe-compliance-sample',
      modality: 'image',
      item_count: 780,
      size_bytes: mb(190),
      class_count: 5,
    },
  },
  {
    id: 'road-scene-segmentation',
    task_type: 'segmentation',
    name: 'Road scene segmentation',
    description: 'Pixel-level segmentation of road, lane, and obstacles.',
    dataset: {
      name: 'road-scene-sample',
      modality: 'image',
      item_count: 620,
      size_bytes: mb(340),
      class_count: 7,
    },
  },
  {
    id: 'medical-scan-segmentation',
    task_type: 'segmentation',
    name: 'Medical scan segmentation',
    description: 'Segment anatomical structures from scan slices.',
    dataset: {
      name: 'medical-scan-sample',
      modality: 'image',
      item_count: 410,
      size_bytes: mb(280),
      class_count: 3,
    },
  },
  {
    id: 'support-ticket-routing',
    task_type: 'text_classification',
    name: 'Support ticket routing',
    description: 'Route inbound tickets to the right queue.',
    dataset: {
      name: 'support-ticket-sample',
      modality: 'text',
      item_count: 3200,
      size_bytes: mb(6.1),
      class_count: 6,
    },
  },
  {
    id: 'review-sentiment',
    task_type: 'text_classification',
    name: 'Review sentiment',
    description: 'Classify customer reviews as positive, neutral, negative.',
    dataset: {
      name: 'review-sentiment-sample',
      modality: 'text',
      item_count: 4100,
      size_bytes: mb(7.8),
      class_count: 3,
    },
  },
  {
    id: 'invoice-entities',
    task_type: 'named_entity_recognition',
    name: 'Invoice entity extraction',
    description: 'Tag vendor, amount, and date entities in invoice text.',
    dataset: {
      name: 'invoice-entity-sample',
      modality: 'text',
      item_count: 1500,
      size_bytes: mb(3.2),
      class_count: 5,
    },
  },
  {
    id: 'resume-entities',
    task_type: 'named_entity_recognition',
    name: 'Resume entity extraction',
    description: 'Tag skills, employers, and titles in resume text.',
    dataset: {
      name: 'resume-entity-sample',
      modality: 'text',
      item_count: 1100,
      size_bytes: mb(2.6),
      class_count: 6,
    },
  },
  {
    id: 'churn-prediction',
    task_type: 'tabular_prediction',
    name: 'Subscriber churn',
    description: 'Predict 90-day subscriber churn from usage signals.',
    dataset: {
      name: 'churn-sample',
      modality: 'tabular',
      item_count: 8600,
      size_bytes: mb(4.4),
      class_count: 2,
    },
  },
  {
    id: 'credit-risk',
    task_type: 'tabular_prediction',
    name: 'Credit risk scoring',
    description: 'Score loan applications for default risk.',
    dataset: {
      name: 'credit-risk-sample',
      modality: 'tabular',
      item_count: 9400,
      size_bytes: mb(5.1),
      class_count: 2,
    },
  },
  {
    id: 'demand-forecast',
    task_type: 'time_series',
    name: 'Weekly demand forecast',
    description: 'Forecast SKU-level demand for the next 4 weeks.',
    dataset: {
      name: 'demand-sample',
      modality: 'tabular',
      item_count: 5200,
      size_bytes: mb(3.8),
      class_count: 0,
    },
  },
  {
    id: 'energy-load-forecast',
    task_type: 'time_series',
    name: 'Energy load forecast',
    description: 'Forecast hourly grid load from historical usage.',
    dataset: {
      name: 'energy-load-sample',
      modality: 'tabular',
      item_count: 6100,
      size_bytes: mb(4.6),
      class_count: 0,
    },
  },
]

/** id, name, description, meta, training cost factor, expected accuracy. */
type ArchitectureTuple = [string, string, string, string, number, string]

const catalogs: Record<string, ArchitectureTuple[]> = {
  image_classification: [
    [
      'efficientnet-b4',
      'EfficientNet-B4',
      'Balanced accuracy and speed',
      '19M params · ImageNet pretrained',
      1,
      '92–95%',
    ],
    [
      'resnet50',
      'ResNet-50',
      'Reliable, fast-training baseline',
      '25M params · ImageNet pretrained',
      0.8,
      '88–91%',
    ],
    [
      'convnext-tiny',
      'ConvNeXt-Tiny',
      'Modern CNN, strong accuracy',
      '28M params · ImageNet pretrained',
      1.15,
      '91–94%',
    ],
    [
      'vit-base',
      'ViT-Base/16',
      'Transformer for larger datasets',
      '86M params · ImageNet-21k pretrained',
      1.6,
      '93–96%',
    ],
    [
      'mobilenetv3',
      'MobileNetV3',
      'Optimized for edge deployment',
      '5.4M params · ImageNet pretrained',
      0.5,
      '85–89%',
    ],
    [
      'scratch',
      'Start from scratch',
      'Train without pretrained weights',
      'Random initialization',
      1.3,
      '70–85%',
    ],
  ],
  text_classification: [
    [
      'bert-base',
      'BERT Base',
      'Strong general-purpose classifier',
      '110M params · pretrained',
      1,
      '89–93%',
    ],
    [
      'distilbert',
      'DistilBERT',
      'Faster, compact language model',
      '66M params · pretrained',
      0.6,
      '87–91%',
    ],
    [
      'roberta-base',
      'RoBERTa Base',
      'Robust accuracy on varied text',
      '125M params · pretrained',
      1.15,
      '90–94%',
    ],
    [
      'scratch',
      'Start from scratch',
      'Train without pretrained weights',
      'Random initialization',
      1.4,
      '70–84%',
    ],
  ],
  tabular: [
    [
      'xgboost',
      'XGBoost',
      'High-quality boosted-tree baseline',
      'Gradient boosted trees',
      0.35,
      '84–91%',
    ],
    [
      'lightgbm',
      'LightGBM',
      'Fast training on large tables',
      'Gradient boosted trees',
      0.25,
      '83–91%',
    ],
    [
      'tabnet',
      'TabNet',
      'Deep learning with feature attention',
      'Neural tabular model',
      0.8,
      '82–90%',
    ],
    [
      'mlp',
      'Start from scratch',
      'Custom multilayer perceptron',
      'Random initialization',
      0.65,
      '76–87%',
    ],
  ],
  object_detection: [
    [
      'yolov8',
      'YOLOv8',
      'Fast, production-ready detector',
      'COCO pretrained',
      1,
      '87–92% mAP',
    ],
    [
      'faster-rcnn',
      'Faster R-CNN',
      'Accurate two-stage detector',
      'COCO pretrained',
      1.5,
      '89–94% mAP',
    ],
    [
      'detr',
      'DETR',
      'Transformer-based object detector',
      'COCO pretrained',
      1.7,
      '88–93% mAP',
    ],
  ],
  document_ai: [
    [
      'layoutlmv3',
      'LayoutLMv3',
      'Understands text and page layout',
      'Document pretrained',
      1.25,
      '89–94%',
    ],
    [
      'donut',
      'Donut',
      'OCR-free document understanding',
      'Document pretrained',
      1.5,
      '88–93%',
    ],
    [
      'trocr',
      'TrOCR',
      'Transformer optical character recognition',
      'Printed text pretrained',
      1.1,
      '87–92%',
    ],
  ],
  segmentation: [
    [
      'unet',
      'U-Net',
      'Reliable encoder-decoder segmentation baseline',
      '31M params · ImageNet pretrained encoder',
      1,
      '82–89% mIoU',
    ],
    [
      'deeplabv3plus',
      'DeepLabV3+',
      'Strong accuracy with atrous convolutions',
      '41M params · ImageNet pretrained encoder',
      1.3,
      '85–91% mIoU',
    ],
    [
      'segformer',
      'SegFormer',
      'Transformer-based segmentation',
      '64M params · ImageNet-21k pretrained',
      1.6,
      '86–92% mIoU',
    ],
    [
      'scratch',
      'Start from scratch',
      'Train without pretrained weights',
      'Random initialization',
      1.4,
      '60–78% mIoU',
    ],
  ],
  named_entity_recognition: [
    [
      'bert-ner',
      'BERT (token classification)',
      'Strong general-purpose entity tagger',
      '110M params · pretrained',
      1,
      '88–93% F1',
    ],
    [
      'distilbert-ner',
      'DistilBERT (token classification)',
      'Faster, compact entity tagger',
      '66M params · pretrained',
      0.6,
      '86–91% F1',
    ],
    [
      'roberta-ner',
      'RoBERTa (token classification)',
      'Robust accuracy on varied text',
      '125M params · pretrained',
      1.15,
      '89–94% F1',
    ],
    [
      'scratch',
      'Start from scratch',
      'Train without pretrained weights',
      'Random initialization',
      1.4,
      '65–80% F1',
    ],
  ],
  tabular_prediction: [
    [
      'xgboost',
      'XGBoost',
      'High-quality boosted-tree baseline',
      'Gradient boosted trees',
      0.35,
      '84–91%',
    ],
    [
      'lightgbm',
      'LightGBM',
      'Fast training on large tables',
      'Gradient boosted trees',
      0.25,
      '83–91%',
    ],
    [
      'tabnet',
      'TabNet',
      'Deep learning with feature attention',
      'Neural tabular model',
      0.8,
      '82–90%',
    ],
    [
      'mlp',
      'Start from scratch',
      'Custom multilayer perceptron',
      'Random initialization',
      0.65,
      '76–87%',
    ],
  ],
  time_series: [
    [
      'tft',
      'Temporal Fusion Transformer',
      'Multi-horizon forecasting',
      'Attention-based forecast model',
      1.2,
      '8–14% MAPE',
    ],
    [
      'nbeats',
      'N-BEATS',
      'Strong univariate forecasting baseline',
      'Deep residual forecast model',
      0.8,
      '10–16% MAPE',
    ],
    [
      'lstm',
      'LSTM',
      'Reliable recurrent baseline',
      'Sequence model',
      0.65,
      '12–18% MAPE',
    ],
  ],
}

export type MockArchitecture = {
  id: string
  name: string
  description: string
  meta: string
  /** Relative training cost; goes into the time estimate. */
  factor: number
  expected_accuracy: string
}

export function architecturesFor(taskType: string): MockArchitecture[] {
  const catalog = catalogs[taskType] ?? catalogs.text_classification
  return catalog.map(
    ([id, name, description, meta, factor, expected_accuracy]) => ({
      id,
      name,
      description,
      meta,
      factor,
      expected_accuracy,
    }),
  )
}

export type MockComputeOption = ApiComputeOption & {
  /** Relative speed; goes into the time estimate. */
  performance: number
}

export const computeOptions: MockComputeOption[] = [
  {
    id: 'a10g-1',
    name: '1× A10G',
    specification: '24 GB VRAM',
    hourly_rate_usd: 0.75,
    performance: 1,
  },
  {
    id: 'a100-1',
    name: '1× A100',
    specification: '80 GB VRAM',
    hourly_rate_usd: 2.1,
    performance: 1.7,
  },
  {
    id: 'a10g-4',
    name: '4× A10G',
    specification: '96 GB VRAM total',
    hourly_rate_usd: 2.9,
    performance: 3.2,
  },
  {
    id: 'cpu',
    name: 'CPU only',
    specification: '32 vCPU · 64 GB RAM',
    hourly_rate_usd: 0.2,
    performance: 0.15,
  },
]
