import { test, expect } from '@playwright/test';
import { BUNDLE_BOUNDS, SEED_MAX, TASK_BOUNDS } from '@/modules/training/constants';
import { failureKey, readReport } from '@/modules/training/report';
import {
  cloneValues,
  configHyperparameters,
  fieldErrors,
  initialValues,
  isCustomized,
  rangesFor,
  toRunBody,
  type Preset,
} from '@/modules/training/run-form';
import { elapsedParts } from '@/modules/training/format';

const PRESET: Preset = {
  name: 'small',
  base_model: { repo_id: 'org/model', revision: 'a'.repeat(40) },
  learning_rate: 1e-4,
  cpu: 4,
  memory_bytes: 1,
  gpu: 0,
  max_runtime_s: 3600,
  hyperparameters: {
    epochs: { default: 10, min: 1, max: 100 },
    batch_size: { default: 32, min: 1, max: 256 },
    image_size: { default: 224, min: 64, max: 512 },
  },
  vram_gb: null,
  lr_schedule: 'constant',
  warmup_fraction: 0,
  augmentation: 'none',
  early_stopping_patience: 0,
};
const IMAGE = 'image-classification' as const;
const TEXT = 'text-classification' as const;
const DETECTION = 'object-detection' as const;
/** A preset of a task trained by a bundle, as production sends it: the default values only; the bounds are the manifest's. */
const BUNDLE: Preset = { ...PRESET, name: 'medium', hyperparameters: { epochs: 30, batch_size: 16, image_size: 224 } };

test.describe('run form', () => {
  test("a preset's defaults are valid", () => {
    expect(fieldErrors(initialValues(PRESET, IMAGE), PRESET, IMAGE)).toEqual({});
  });

  test('values outside the bounds, half-typed or empty are refused', () => {
    const v = initialValues(PRESET, IMAGE);
    v.hyperparameters.epochs = '101';
    v.hyperparameters.batch_size = '1.5';
    v.hyperparameters.image_size = '';
    v.seed = String(SEED_MAX + 1);
    expect(fieldErrors(v, PRESET, IMAGE)).toEqual({ epochs: 'range', batch_size: 'range', image_size: 'required', seed: 'range' });
  });

  test('a text task ignores the image size, in the checks and in the body', () => {
    const v = { ...initialValues(PRESET, TEXT), versionId: 'v1', preset: PRESET };
    v.hyperparameters = { ...v.hyperparameters, image_size: 'not checked' };
    expect(fieldErrors(v, PRESET, TEXT)).toEqual({});
    expect(toRunBody(v, TEXT)).toEqual({
      dataset_version_id: 'v1',
      preset: 'small',
      hyperparameters: { epochs: 10, batch_size: 32 },
      seed: 42,
    });
  });

  test('a preset that bounds none of the shown fields checks and sends none of them', () => {
    // A bundle-defined preset (tabular) has its own fields, not epochs, batch size or image size ranges.
    const TABULAR: Preset = {
      ...PRESET,
      name: 'tabular',
      hyperparameters: { target: 'label', n_estimators: 200 } as unknown as Preset['hyperparameters'],
    };
    const v = { ...initialValues(TABULAR, 'tabular-classification'), versionId: 'v1', preset: TABULAR };
    expect(fieldErrors(v, TABULAR, 'tabular-classification')).toEqual({});
    expect(toRunBody(v, 'tabular-classification').hyperparameters).toEqual({});
  });

  test('settings count as customized once a shown value or the seed differs from the defaults', () => {
    const v = initialValues(PRESET, IMAGE);
    expect(isCustomized(v, PRESET, IMAGE)).toBe(false);
    expect(isCustomized({ ...v, seed: ' 042 ' }, PRESET, IMAGE)).toBe(false);
    expect(isCustomized({ ...v, seed: '7' }, PRESET, IMAGE)).toBe(true);
    expect(isCustomized({ ...v, seed: '' }, PRESET, IMAGE)).toBe(true);
    expect(isCustomized({ ...v, hyperparameters: { ...v.hyperparameters, epochs: '11' } }, PRESET, IMAGE)).toBe(true);
    // A text task does not show the image size, so changing it changes nothing.
    expect(isCustomized({ ...v, hyperparameters: { ...v.hyperparameters, image_size: '99' } }, PRESET, TEXT)).toBe(false);
  });

  test('the body sends numbers, trimmed', () => {
    const v = { ...initialValues(PRESET, IMAGE), versionId: 'v1', preset: PRESET, seed: ' 7 ' };
    expect(toRunBody(v, IMAGE).seed).toBe(7);
    expect(toRunBody(v, IMAGE).hyperparameters).toEqual({ epochs: 10, batch_size: 32, image_size: 224 });
  });

  test("a bundle preset's values are its defaults, held to the manifest's bounds", () => {
    expect(rangesFor(BUNDLE, IMAGE)).toEqual({
      epochs: { default: 30, ...BUNDLE_BOUNDS.epochs },
      batch_size: { default: 16, ...BUNDLE_BOUNDS.batch_size },
      image_size: { default: 224, ...BUNDLE_BOUNDS.image_size },
    });
    expect(initialValues(BUNDLE, IMAGE).hyperparameters).toEqual({ epochs: '30', batch_size: '16', image_size: '224' });
    expect(fieldErrors(initialValues(BUNDLE, IMAGE), BUNDLE, IMAGE)).toEqual({});
    const v = initialValues(BUNDLE, IMAGE);
    v.hyperparameters.epochs = String(BUNDLE_BOUNDS.epochs.max + 1);
    expect(fieldErrors(v, BUNDLE, IMAGE)).toEqual({ epochs: 'range' });
  });

  test("a task's own bounds win, and a value off the step is refused", () => {
    const side = TASK_BOUNDS[DETECTION]?.image_size;
    expect(rangesFor(BUNDLE, DETECTION).image_size).toEqual({ default: 224, ...side });
    const v = initialValues(BUNDLE, DETECTION);
    v.hyperparameters.image_size = '230';
    expect(fieldErrors(v, BUNDLE, DETECTION)).toEqual({ image_size: 'step' });
  });

  test('a hyperparameter the preset does not offer is not shown, checked or sent', () => {
    const tabular: Preset = { ...PRESET, hyperparameters: { n_estimators: 200, max_depth: 6 } };
    expect(rangesFor(tabular, IMAGE)).toEqual({});
    const v = { ...initialValues(tabular, IMAGE), versionId: 'v1', preset: tabular };
    expect(fieldErrors(v, tabular, IMAGE)).toEqual({});
    expect(toRunBody(v, IMAGE).hyperparameters).toEqual({});
  });
});

test.describe('run report', () => {
  test('keeps finite numbers and drops anything else', () => {
    const r = readReport({
      code: null,
      metrics: { top1: 0.9, nan: 'NaN', inf: Infinity, nested: { a: 1 } },
      near_duplicates: -1,
      extra: 1,
    });
    expect(r).toEqual({ code: null, metrics: { top1: 0.9 }, confusionMatrix: null, nearDuplicates: null });
  });

  test('a confusion matrix must be square, of counts, and match its labels', () => {
    const labels = ['a', 'b'];
    expect(
      readReport({
        confusion_matrix: {
          labels,
          matrix: [
            [1, 2],
            [3, 4],
          ],
        },
      })?.confusionMatrix,
    ).toEqual({
      labels,
      matrix: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(readReport({ confusion_matrix: { labels, matrix: [[1, 2]] } })?.confusionMatrix).toBeNull();
    expect(
      readReport({
        confusion_matrix: {
          labels,
          matrix: [
            [1, 2],
            [3, 0.5],
          ],
        },
      })?.confusionMatrix,
    ).toBeNull();
    expect(readReport({ confusion_matrix: { labels: [], matrix: [] } })?.confusionMatrix).toBeNull();
  });

  test('no report reads as null', () => {
    expect(readReport(null)).toBeNull();
    expect(readReport('report')).toBeNull();
  });

  test('a known failure code has its own message; anything else the general one', () => {
    expect(failureKey('oom')).toBe('training.run.failure.oom');
    expect(failureKey('something-new')).toBe('training.run.failed');
    expect(failureKey(null)).toBe('training.run.failed');
  });
});

test.describe('clone', () => {
  test("a run's config becomes the form's settings, each held to the preset's bounds", () => {
    expect(configHyperparameters({ epochs: 7, batch_size: 8, image_size: 128 }, PRESET, IMAGE)).toEqual({
      epochs: '7',
      batch_size: '8',
      image_size: '128',
    });
    // Out of bounds, not whole, not a number or missing: the preset's default.
    expect(configHyperparameters({ epochs: 500, batch_size: 2.5, image_size: '128' }, PRESET, IMAGE)).toEqual({
      epochs: '10',
      batch_size: '32',
      image_size: '224',
    });
    expect(configHyperparameters(null, PRESET, IMAGE)).toEqual({ epochs: '10', batch_size: '32', image_size: '224' });
    expect(configHyperparameters([1, 2], PRESET, IMAGE)).toEqual({ epochs: '10', batch_size: '32', image_size: '224' });
  });

  test("a clone keeps the run's preset while it is offered, else starts from the fallback", () => {
    const other: Preset = { ...PRESET, name: 'medium' };
    const clone = cloneValues({ preset: 'medium', config: { epochs: 3 } }, [PRESET, other], PRESET, IMAGE);
    expect(clone).toMatchObject({ preset: 'medium', hyperparameters: { epochs: '3', batch_size: '32' }, seed: '42' });
    expect(cloneValues({ preset: 'gone', config: { epochs: 3 } }, [PRESET], PRESET, IMAGE)).toEqual(initialValues(PRESET, IMAGE));
    expect(cloneValues(undefined, [PRESET], PRESET, IMAGE)).toEqual(initialValues(PRESET, IMAGE));
  });
});

test.describe('duration', () => {
  test('splits milliseconds into whole days, then the hours and minutes left', () => {
    const MINUTE = 60_000;
    expect(elapsedParts(0)).toEqual({ days: 0, hours: 0, minutes: 0 });
    expect(elapsedParts(59_999)).toEqual({ days: 0, hours: 0, minutes: 0 });
    expect(elapsedParts(125 * MINUTE)).toEqual({ days: 0, hours: 2, minutes: 5 });
    expect(elapsedParts((26 * 60 + 7) * MINUTE)).toEqual({ days: 1, hours: 2, minutes: 7 });
    // Clock skew can put the end before the start: that reads as none, not a negative time.
    expect(elapsedParts(-5 * MINUTE)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});
