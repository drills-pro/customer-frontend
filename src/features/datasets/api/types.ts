/**
 * Request and response shapes for datasets, as the API sends them:
 * snake_case fields, lower-case enums and ISO timestamp strings.
 */

/** `POST /v1/projects/{id}/datasets` as core-api answers it today. */
export type CreatedDataset = {
  id: string;
  name: string;
};

export type ApiDatasetModality = 'image' | 'text' | 'tabular';
export type ApiDatasetSplit = 'train' | 'validation' | 'test' | 'unsplit';
export type ApiDatasetStatus = 'ready' | 'processing' | 'error';

export type ApiDataset = {
  id: string;
  project_id: string;
  name: string;
  modality: ApiDatasetModality;
  split: ApiDatasetSplit;
  item_count: number;
  size_bytes: number;
  class_count: number;
  version: number;
  status: ApiDatasetStatus;
  created_at: string;
  /** Source file names, or the bucket path it was imported from. */
  files: string[];
};

/** `GET /v1/projects/{id}/datasets/{dataset_id}`. */
export type ApiDatasetDetail = ApiDataset & {
  health_checks: Array<{ status: 'pass' | 'warning'; label: string }>;
};

/**
 * `POST /v1/projects/{id}/datasets`, the form this frontend wants: metadata in
 * a JSON body, with the files the browser is about to send. A name already
 * used in the project answers 409.
 */
export type CreateDatasetRequest = {
  name: string;
  split: ApiDatasetSplit;
  files: Array<{ name: string; size_bytes: number }>;
};

/** `POST …/{dataset_id}/import`: fill the dataset from a cloud bucket. */
export type ImportDatasetRequest = {
  /** `s3://bucket/path`. */
  bucket_uri: string;
};

/** `GET …/{dataset_id}/manifest`: what "download manifest" saves. */
export type ApiDatasetManifest = {
  dataset: ApiDataset;
  versions: ApiDatasetVersion[];
};

type SampleSplit = Exclude<ApiDatasetSplit, 'unsplit'>;

/** One row of `GET …/{dataset_id}/preview`. */
export type ApiDatasetSample =
  | {
      id: string;
      modality: 'image';
      image_url: string;
      label: string;
      split: SampleSplit;
    }
  | {
      id: string;
      modality: 'text';
      text: string;
      label: string;
      word_count: number;
      split: SampleSplit;
    };

/** `GET …/{dataset_id}/statistics`. */
export type ApiDatasetStatistics = {
  /** The largest labels, for the summary card. */
  label_distribution: Array<{ label: string; count: number }>;
  /** One entry per class; the counts add up to `item_count`. */
  class_distribution: Array<{ name: string; count: number }>;
  split_distribution: Array<{ split: SampleSplit; percent: number }>;
  composition: {
    file_format: string;
    /** Image datasets only. */
    avg_width?: number;
    avg_height?: number;
    /** Text datasets only. */
    avg_words?: number;
  };
};

export type ApiQualityDimension =
  'integrity' | 'duplicates' | 'class_balance' | 'label_validity' | 'label_consistency' | 'image_quality' | 'split_integrity' | 'metadata';

/** `GET …/{dataset_id}/quality`. */
export type ApiDatasetQuality = {
  /** `null` when the dataset has never been checked. */
  last_checked_at: string | null;
  findings: Array<{
    dimension: ApiQualityDimension;
    severity: 'pass' | 'warning' | 'error';
    title: string;
    description?: string;
    action?: {
      label: string;
      /** The dataset tab that shows the detail, when there is one. */
      tab?: 'preview' | 'statistics' | 'quality' | 'versions';
    };
  }>;
};

/** One row of `GET …/{dataset_id}/versions`. */
export type ApiDatasetVersion = {
  version: number;
  item_count: number;
  created_at: string;
};
