import type { Dataset, Project, TrainingRun } from './data'

export type ArchitectureOption = {
  id: string
  name: string
  description: string
  meta: string
  factor: number
  accuracy: string
}

export type ComputeOption = {
  id: string
  name: string
  specification: string
  hourlyRate: number
  performance: number
}

type ArchitectureTuple = [string, string, string, string, number, string]

const catalogs: Record<string, ArchitectureTuple[]> = {
  'Image Classification': [
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
  'Text Classification': [
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
  Tabular: [
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
  'Object Detection': [
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
  'Document AI': [
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
  Segmentation: [
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
  'Named Entity Recognition': [
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
  'Tabular Prediction': [
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
  'Time Series': [
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

export const computeOptions: ComputeOption[] = [
  {
    id: 'a10g-1',
    name: '1× A10G',
    specification: '24 GB VRAM',
    hourlyRate: 0.75,
    performance: 1,
  },
  {
    id: 'a100-1',
    name: '1× A100',
    specification: '80 GB VRAM',
    hourlyRate: 2.1,
    performance: 1.7,
  },
  {
    id: 'a10g-4',
    name: '4× A10G',
    specification: '96 GB VRAM total',
    hourlyRate: 2.9,
    performance: 3.2,
  },
  {
    id: 'cpu',
    name: 'CPU only',
    specification: '32 vCPU · 64 GB RAM',
    hourlyRate: 0.2,
    performance: 0.15,
  },
]

export function architecturesFor(project: Project) {
  const catalog = catalogs[project.task] ?? catalogs['Text Classification']
  return catalog.map(([id, name, description, meta, factor, accuracy]) => ({
    id,
    name,
    description,
    meta,
    factor,
    accuracy,
  }))
}

export function estimateTraining(
  dataset: Dataset,
  architecture: ArchitectureOption,
  epochs: number,
  batchSize: number,
  compute: ComputeOption,
  spot: boolean,
) {
  const datasetFactor = Math.max(0.2, dataset.items / 18_420)
  const hours = Math.max(
    0.15,
    ((epochs / 30) *
      datasetFactor *
      architecture.factor *
      (32 / batchSize) *
      1.33) /
      compute.performance,
  )
  return {
    hours,
    cost: hours * compute.hourlyRate * (spot ? 0.4 : 1),
  }
}

export function formatDuration(hours: number) {
  const minutes = Math.round(hours * 60)
  const wholeHours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return wholeHours
    ? `${wholeHours}h ${String(remainder).padStart(2, '0')}m`
    : `${minutes}m`
}

export function trainingLog(run: TrainingRun, dataset?: Dataset) {
  const epoch = Math.floor((run.progress / 100) * run.epochs)
  return [
    `INFO  Loading dataset ${dataset?.name ?? run.datasetId} (${dataset?.items ?? 0} items)`,
    `INFO  Building ${run.architecture} with pretrained weights`,
    `INFO  lr=${formatLearningRate(run.learningRate)} scheduler=${run.scheduler}`,
    ...Array.from({ length: Math.max(epoch, 1) }, (_, index) => {
      const current = index + 1
      const loss = (3.812 / current).toFixed(3)
      const accuracy = (0.412 + (0.5 * current) / run.epochs).toFixed(3)
      return `INFO  Epoch ${current}/${run.epochs} loss=${loss} val_metric=${accuracy} ${run.throughput}`
    }),
    run.status === 'Stopped'
      ? 'WARN  Run stopped by Alex Rivera.'
      : 'INFO  Checkpoint saved. Waiting for next training step…',
  ]
}

export function formatLearningRate(value: number) {
  return value.toExponential(1).replace('.0e', 'e')
}
