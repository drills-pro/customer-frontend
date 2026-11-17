import type { TaskType } from '@/modules/projects';
import type { Schemas } from '@/shared/api/client';
import { DEFAULT_SEED, HYPERPARAMETERS, SEED_MAX, shownHyperparameters, type Hyperparameter } from '@/modules/training/constants';

export type Preset = Schemas['PresetSummary'];
export type RunCreate = Schemas['TrainingRunCreate'];

/** Number fields are kept as typed, so a half-typed value is not lost; they are read when checked and sent. */
export interface RunFormValues {
  versionId: string | null;
  preset: string | null;
  hyperparameters: Record<Hyperparameter, string>;
  seed: string;
}

export type Limit = Schemas['HyperparameterRange'];

const isLimit = (v: unknown): v is Limit =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Limit).min === 'number' &&
  typeof (v as Limit).max === 'number' &&
  typeof (v as Limit).default === 'number';

/** The bounds a preset puts on one hyperparameter, or undefined when the task's bundle defines it another way (a tabular preset
 * has none of epochs, batch size or image size; its own fields are not offered yet). */
export const limitOf = (preset: Preset, h: Hyperparameter): Limit | undefined => {
  const v: unknown = preset.hyperparameters[h];
  return isLimit(v) ? v : undefined;
};

/** The shown hyperparameters this preset bounds, with their bounds. */
export const shownLimits = (task: TaskType, preset: Preset): [Hyperparameter, Limit][] =>
  shownHyperparameters(task).flatMap((h): [Hyperparameter, Limit][] => {
    const limit = limitOf(preset, h);
    return limit ? [[h, limit]] : [];
  });

/** A preset's defaults, as the form shows them. */
export const defaultsFor = (preset: Preset): Record<Hyperparameter, string> =>
  Object.fromEntries(HYPERPARAMETERS.map((h) => [h, String(limitOf(preset, h)?.default ?? '')])) as Record<Hyperparameter, string>;

export const initialValues = (preset: Preset | undefined): RunFormValues => ({
  versionId: null,
  preset: preset?.name ?? null,
  hyperparameters: preset ? defaultsFor(preset) : { epochs: '', batch_size: '', image_size: '' },
  seed: String(DEFAULT_SEED),
});

export type FieldError = 'required' | 'range';
export type SettingsField = Hyperparameter | 'seed';
export type FieldErrors = Partial<Record<SettingsField, FieldError>>;

const INTEGER = /^\d+$/;
/** A whole number in [min, max], or why not. */
function check(value: string, min: number, max: number): FieldError | undefined {
  const text = value.trim();
  if (!text) return 'required';
  if (!INTEGER.test(text)) return 'range';
  const n = Number(text);
  return n < min || n > max ? 'range' : undefined;
}

/** What the API would refuse on the Settings step, found before the request. Only the fields the task shows are checked. */
export function fieldErrors(v: RunFormValues, preset: Preset, task: TaskType): FieldErrors {
  const errors: FieldErrors = {};
  for (const [h, { min, max }] of shownLimits(task, preset)) {
    const error = check(v.hyperparameters[h], min, max);
    if (error) errors[h] = error;
  }
  const seed = check(v.seed, 0, SEED_MAX);
  if (seed) errors.seed = seed;
  return errors;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A run's settings as form values. core-api keeps the resolved hyperparameters in `config`; a value that is missing, not a whole
 * number or outside the preset's bounds falls back to the preset's default. */
export function configHyperparameters(config: unknown, preset: Preset): Record<Hyperparameter, string> {
  const defaults = defaultsFor(preset);
  if (!isRecord(config)) return defaults;
  return Object.fromEntries(
    HYPERPARAMETERS.map((h) => {
      const v = config[h];
      const limit = limitOf(preset, h);
      const inBounds = limit && typeof v === 'number' && Number.isInteger(v) && v >= limit.min && v <= limit.max;
      return [h, inBounds ? String(v) : defaults[h]];
    }),
  ) as Record<Hyperparameter, string>;
}

/** Where a clone of `run` starts: its preset while it is still offered (else `fallback`), with its settings. The seed is not
 * returned by the API, so it stays the default. */
export function cloneValues(
  run: { preset: string | null; config: unknown } | undefined,
  presets: Preset[],
  fallback: Preset,
): RunFormValues {
  const preset = presets.find((p) => p.name === run?.preset);
  if (!run || !preset) return initialValues(fallback);
  return { ...initialValues(preset), hyperparameters: configHyperparameters(run.config, preset) };
}

/** The create request: the shown hyperparameters as numbers; image size stays out for text tasks, and a preset that bounds none of
 * them sends none (core-api then uses the preset's own values). */
export function toRunBody(v: RunFormValues & { versionId: string; preset: string }, task: TaskType, preset: Preset): RunCreate {
  const hyperparameters: Schemas['HyperparameterOverrides'] = {};
  for (const [h] of shownLimits(task, preset)) hyperparameters[h] = Number(v.hyperparameters[h].trim());
  return { dataset_version_id: v.versionId, preset: v.preset, hyperparameters, seed: Number(v.seed.trim()) };
}
