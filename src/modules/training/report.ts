import { FAILURE_CODES } from '@/modules/training/constants';

/** What a finished run reported (core-api data_plane/train_report.py). The API types `report` as unknown and the job that wrote
 * it is untrusted, so this reads only the named fields, keeps finite numbers only and drops any shape it does not expect. */
export interface ConfusionMatrix {
  labels: string[];
  /** matrix[true][predicted], rows and columns in `labels` order. */
  matrix: number[][];
}

export interface RunReport {
  code: string | null;
  metrics: Record<string, number>;
  confusionMatrix: ConfusionMatrix | null;
  /** Held-out images with a near twin in the training set; null when not measured. */
  nearDuplicates: number | null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isCount = (v: unknown): v is number => isNumber(v) && Number.isInteger(v) && v >= 0;

/** The numeric entries of an object, by name; anything else is left out. */
export function numericEntries(v: unknown): Record<string, number> {
  if (!isRecord(v)) return {};
  return Object.fromEntries(Object.entries(v).filter((entry): entry is [string, number] => isNumber(entry[1])));
}

/** A square matrix of counts whose size matches its labels, or null. */
function confusionMatrix(v: unknown): ConfusionMatrix | null {
  if (!isRecord(v) || !Array.isArray(v.labels) || !Array.isArray(v.matrix)) return null;
  const labels = v.labels;
  const n = labels.length;
  if (n === 0 || !labels.every((l) => typeof l === 'string')) return null;
  const rows = v.matrix;
  if (rows.length !== n || !rows.every((r) => Array.isArray(r) && r.length === n && r.every(isCount))) return null;
  return { labels: labels as string[], matrix: rows as number[][] };
}

export function readReport(report: unknown): RunReport | null {
  if (!isRecord(report)) return null;
  return {
    code: typeof report.code === 'string' ? report.code : null,
    metrics: numericEntries(report.metrics),
    confusionMatrix: confusionMatrix(report.confusion_matrix),
    nearDuplicates: isCount(report.near_duplicates) ? report.near_duplicates : null,
  };
}

/** Locale key for why a run failed: its report's code when the copy knows it, else the general failure line. */
export const failureKey = (code: string | null | undefined): string =>
  code && FAILURE_CODES.includes(code) ? `training.run.failure.${code}` : 'training.run.failed';
