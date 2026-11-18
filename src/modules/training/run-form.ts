import type { TaskType } from '@/modules/projects';
import type { Schemas } from '@/shared/api/client';
import {
  BUNDLE_BOUNDS,
  DEFAULT_SEED,
  HYPERPARAMETERS,
  SEED_MAX,
  TASK_BOUNDS,
  shownHyperparameters,
  type Bounds,
  type Hyperparameter,
} from '@/modules/training/constants';

export type Preset = Schemas['PresetSummary'];
export type RunCreate = Schemas['TrainingRunCreate'];

/** One hyperparameter of the selected preset: its default and what a run may set it to. */
export interface Range extends Bounds {
  default: number;
}
/** The hyperparameters a preset offers; one it does not offer is absent. */
export type Ranges = Partial<Record<Hyperparameter, Range>>;

/** Number fields are kept as typed, so a half-typed value is not lost; they are read when checked and sent. */
export interface RunFormValues {
  versionId: string | null;
  preset: string | null;
  hyperparameters: Record<Hyperparameter, string>;
  seed: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isWhole = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/** A preset's hyperparameters, whichever shape core-api sends: `{default, min, max}` for a task from before bundles, or the default
 * value alone for a task trained by a bundle, bounded by the task's manifest (`TASK_BOUNDS`, else `BUNDLE_BOUNDS`). */
export function rangesFor(preset: Preset, task: TaskType): Ranges {
  const given: unknown = preset.hyperparameters;
  if (!isRecord(given)) return {};
  const ranges: Ranges = {};
  for (const h of HYPERPARAMETERS) {
    const v = given[h];
    if (isWhole(v)) ranges[h] = { default: v, ...(TASK_BOUNDS[task]?.[h] ?? BUNDLE_BOUNDS[h]) };
    else if (isRecord(v) && isWhole(v.default) && isWhole(v.min) && isWhole(v.max))
      ranges[h] = { default: v.default, min: v.min, max: v.max, step: 1 };
  }
  return ranges;
}

/** A preset's defaults, as the form shows them; one the preset does not offer is empty. */
export const defaultsFor = (preset: Preset, task: TaskType): Record<Hyperparameter, string> => {
  const ranges = rangesFor(preset, task);
  return Object.fromEntries(HYPERPARAMETERS.map((h) => [h, ranges[h] ? String(ranges[h].default) : ''])) as Record<Hyperparameter, string>;
};

export const initialValues = (preset: Preset | undefined, task: TaskType): RunFormValues => ({
  versionId: null,
  preset: preset?.name ?? null,
  hyperparameters: preset ? defaultsFor(preset, task) : { epochs: '', batch_size: '', image_size: '' },
  seed: String(DEFAULT_SEED),
});

export type FieldError = 'required' | 'range' | 'step';
export type SettingsField = Hyperparameter | 'seed';
export type FieldErrors = Partial<Record<SettingsField, FieldError>>;

const INTEGER = /^\d+$/;
/** A whole number in [min, max] that is a multiple of `step`, or why not. */
function check(value: string, { min, max, step }: Bounds): FieldError | undefined {
  const text = value.trim();
  if (!text) return 'required';
  if (!INTEGER.test(text)) return 'range';
  const n = Number(text);
  if (n < min || n > max) return 'range';
  return n % step === 0 ? undefined : 'step';
}

/** What the API would refuse on the Settings step, found before the request. Only the fields the task and preset show are checked. */
export function fieldErrors(v: RunFormValues, preset: Preset, task: TaskType): FieldErrors {
  const errors: FieldErrors = {};
  const ranges = rangesFor(preset, task);
  for (const h of shownHyperparameters(task, ranges)) {
    const range = ranges[h];
    const error = range && check(v.hyperparameters[h], range);
    if (error) errors[h] = error;
  }
  const seed = check(v.seed, { min: 0, max: SEED_MAX, step: 1 });
  if (seed) errors.seed = seed;
  return errors;
}

/** Whether the shown settings or the seed differ from the preset's defaults. Values that do not parse count as changed. */
export function isCustomized(v: RunFormValues, preset: Preset, task: TaskType): boolean {
  const defaults = defaultsFor(preset, task);
  const differs = (value: string, fallback: string) => value.trim() === '' || Number(value.trim()) !== Number(fallback);
  return (
    shownHyperparameters(task, rangesFor(preset, task)).some((h) => differs(v.hyperparameters[h], defaults[h])) ||
    differs(v.seed, String(DEFAULT_SEED))
  );
}

/** A run's settings as form values. core-api keeps the resolved hyperparameters in `config`; a value that is missing or that the
 * preset's bounds refuse falls back to the preset's default. */
export function configHyperparameters(config: unknown, preset: Preset, task: TaskType): Record<Hyperparameter, string> {
  const defaults = defaultsFor(preset, task);
  if (!isRecord(config)) return defaults;
  const ranges = rangesFor(preset, task);
  return Object.fromEntries(
    HYPERPARAMETERS.map((h) => {
      const v = config[h];
      const range = ranges[h];
      return [h, range && isWhole(v) && !check(String(v), range) ? String(v) : defaults[h]];
    }),
  ) as Record<Hyperparameter, string>;
}

/** Where a clone of `run` starts: its preset while it is still offered (else `fallback`), with its settings. The seed is not
 * returned by the API, so it stays the default. */
export function cloneValues(
  run: { preset: string | null; config: unknown } | undefined,
  presets: Preset[],
  fallback: Preset,
  task: TaskType,
): RunFormValues {
  const preset = presets.find((p) => p.name === run?.preset);
  if (!run || !preset) return initialValues(fallback, task);
  return { ...initialValues(preset, task), hyperparameters: configHyperparameters(run.config, preset, task) };
}

/** The create request: the shown hyperparameters as numbers; image size stays out for text tasks and any the preset does not offer. */
export function toRunBody(
  v: Omit<RunFormValues, 'versionId' | 'preset'> & { versionId: string; preset: Preset },
  task: TaskType,
): RunCreate {
  const hyperparameters: Schemas['HyperparameterOverrides'] = {};
  for (const h of shownHyperparameters(task, rangesFor(v.preset, task))) hyperparameters[h] = Number(v.hyperparameters[h].trim());
  return { dataset_version_id: v.versionId, preset: v.preset.name, hyperparameters, seed: Number(v.seed.trim()) };
}
