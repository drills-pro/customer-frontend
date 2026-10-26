import type { TFunction } from 'i18next';
import type { Schemas } from '@/shared/api/client';

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

export function formatBytes(bytes: number, locale?: string): string {
  const i = Math.min(UNITS.length - 1, bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(1024)) : 0);
  return new Intl.NumberFormat(locale, { style: 'unit', unit: UNITS[i], unitDisplay: 'short', maximumFractionDigits: i ? 1 : 0 }).format(
    bytes / 1024 ** i,
  );
}

/** Version stats are an open dict on the wire; read only the counts the report defines, ignoring anything else. */
export function versionCounts(stats: Record<string, unknown>) {
  const num = (key: string) => (typeof stats[key] === 'number' ? (stats[key] as number) : undefined);
  return { rows: num('row_count'), files: num('file_count'), bytes: num('total_bytes') };
}

/** A project's task type as a word; a type the app has no copy for shows its slug. */
export const taskLabel = (t: TFunction, task: Schemas['TaskType']) => t(`projects.taskType.${task}.label`, { defaultValue: task });

/** A preview cell: strings as they are, everything else as JSON. */
export const cellText = (value: unknown) =>
  typeof value === 'string' ? value : value === null || value === undefined ? '' : JSON.stringify(value);
