/** Turns model rows from the API into what the pages render. */
import type { Model, ModelStage } from '@/features/dashboard/domain/types';
import { formatBytes, formatMs, relativeTimeLong } from '@/lib/format';
import type { ApiModel, ApiModelDetail, ApiModelFile, ApiModelStage } from './api';

const stageLabels: Record<ApiModelStage, ModelStage> = {
  production: 'Production',
  staging: 'Staging',
  archived: 'Archived',
};

export function toModel(row: ApiModel, now?: number): Model {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    version: row.version,
    architecture: row.architecture,
    framework: row.framework,
    runId: row.run_id,
    accuracy: row.accuracy,
    f1: row.f1,
    latencyP95: formatMs(row.latency_p95_ms),
    size: formatBytes(row.size_bytes),
    stage: stageLabels[row.stage],
    author: row.author,
    created: relativeTimeLong(row.created_at, now),
    deploymentId: row.deployment_id ?? undefined,
  };
}

export type ModelDetail = {
  /** The dataset the source run trained on, for the lineage strip. */
  datasetId: string;
  /** Weakest classes first: the list is only useful sorted that way. */
  perClassAccuracy: Array<{ label: string; accuracy: number; support: number }>;
  files: Array<{ name: string; type: string; size: string }>;
};

export function toModelDetail(detail: ApiModelDetail, files: ApiModelFile[]): ModelDetail {
  return {
    datasetId: detail.dataset_id,
    perClassAccuracy: detail.per_class_accuracy,
    files: files.map((file) => ({
      name: file.name,
      type: file.type,
      size: formatBytes(file.size_bytes),
    })),
  };
}
