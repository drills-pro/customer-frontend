/** Turns dataset rows from the API into what the pages render. */
import type { Dataset, DatasetDetail, DatasetSample, QualityDimension } from '@/features/dashboard/domain/types';
import { formatBytes, formatDate, recentOrDayMonth, relativeTimeLong } from '@/lib/format';
import type {
  ApiDataset,
  ApiDatasetDetail,
  ApiDatasetQuality,
  ApiDatasetSample,
  ApiDatasetSplit,
  ApiDatasetStatistics,
  ApiDatasetStatus,
  ApiDatasetVersion,
  ApiQualityDimension,
} from './api';

const splitLabels: Record<ApiDatasetSplit, Dataset['split']> = {
  train: 'Train',
  validation: 'Validation',
  test: 'Test',
  unsplit: 'Unsplit',
};

const statusLabels: Record<ApiDatasetStatus, Dataset['status']> = {
  ready: 'Ready',
  processing: 'Processing',
  error: 'Error',
};

export const toApiSplit = (split: Dataset['split']) => split.toLowerCase() as ApiDatasetSplit;

export function toDataset(row: ApiDataset, now?: number): Dataset {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    modality: row.modality,
    split: splitLabels[row.split],
    items: row.item_count,
    size: formatBytes(row.size_bytes),
    classes: row.class_count,
    version: row.version,
    status: statusLabels[row.status],
    created: recentOrDayMonth(row.created_at, now),
    files: row.files,
  };
}

type SampleSplit = DatasetSample['split'];

function toSample(row: ApiDatasetSample): DatasetSample {
  const split = splitLabels[row.split] as SampleSplit;
  return row.modality === 'image'
    ? {
        id: row.id,
        modality: 'image',
        image: row.image_url,
        label: row.label,
        split,
      }
    : {
        id: row.id,
        modality: 'text',
        text: row.text,
        label: row.label,
        words: row.word_count,
        split,
      };
}

const dimensions: Record<ApiQualityDimension, QualityDimension> = {
  integrity: 'integrity',
  duplicates: 'duplicates',
  class_balance: 'classBalance',
  label_validity: 'labelValidity',
  label_consistency: 'labelConsistency',
  image_quality: 'imageQuality',
  split_integrity: 'splitIntegrity',
  metadata: 'metadata',
};

/** The dataset page reads one object; the API serves it as five resources. */
export function toDatasetDetail(parts: {
  detail: ApiDatasetDetail;
  samples: ApiDatasetSample[];
  statistics: ApiDatasetStatistics;
  quality: ApiDatasetQuality;
  versions: ApiDatasetVersion[];
}): DatasetDetail {
  const { composition } = parts.statistics;
  return {
    samples: parts.samples.map(toSample),
    distribution: parts.statistics.label_distribution,
    classDistribution: parts.statistics.class_distribution,
    composition: {
      fileFormat: composition.file_format,
      avgDimensions:
        composition.avg_width && composition.avg_height ? { width: composition.avg_width, height: composition.avg_height } : undefined,
      avgWords: composition.avg_words,
    },
    healthChecks: parts.detail.health_checks,
    qualityReport: {
      lastChecked: parts.quality.last_checked_at ? relativeTimeLong(parts.quality.last_checked_at) : 'Not yet checked',
      findings: parts.quality.findings.map((finding) => ({
        ...finding,
        dimension: dimensions[finding.dimension],
      })),
    },
    splitDistribution: parts.statistics.split_distribution.map((entry) => ({
      label: splitLabels[entry.split] as SampleSplit,
      percent: entry.percent,
    })),
    versions: parts.versions.map((version) => ({
      version: version.version,
      items: version.item_count,
      created: formatDate(version.created_at),
    })),
  };
}
