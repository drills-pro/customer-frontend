import type { ApiResourceUsage, ApiUsagePeriod } from '@/features/projects/api/types';

/** How a project's usage differs from the default curves. */
export type UsageScale = {
  gpu_scale: number;
  storage_scale: number;
  endpoints_max: number;
};

export const defaultUsageScale: UsageScale = {
  gpu_scale: 1,
  storage_scale: 1,
  endpoints_max: 2,
};

const MONTH_DAYS = 30;

function hourLabels(): Array<[string, string]> {
  return Array.from({ length: 24 }, (_, hour) => {
    const clock = hour % 12 === 0 ? 12 : hour % 12;
    const meridiem = hour < 12 ? 'AM' : 'PM';
    return [`${clock} ${meridiem}`, `${clock}${hour < 12 ? 'a' : 'p'}`];
  });
}

function monthDayLabels(): Array<[string, string]> {
  return Array.from({ length: MONTH_DAYS }, (_, index) => {
    const day = index + 1;
    return [`Sep ${day}`, String(day)];
  });
}

// Each period is a window; every bar is one natural sub-unit inside it.
const usageLabels: Record<ApiUsagePeriod, Array<[string, string]>> = {
  day: hourLabels(),
  week: [
    ['Monday', 'M'],
    ['Tuesday', 'T'],
    ['Wednesday', 'W'],
    ['Thursday', 'T'],
    ['Friday', 'F'],
    ['Saturday', 'S'],
    ['Sunday', 'S'],
  ],
  month: monthDayLabels(),
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

type UsageCurve = {
  /** Value of the first bar, before jitter. */
  start: number;
  /** Value of the last bar, before jitter. */
  end: number;
  /** Exact aggregate the rendered bars should add up to, when given. */
  total?: number;
  /** Round every bar to a whole number (for "peak"-style counts). */
  integer?: boolean;
  seed?: number;
};

/**
 * A repeatable stream of numbers in [0, 1): the same seed replays the same
 * stream, so seeded series can be asserted in tests.
 */
export function seededNoise(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

/**
 * Builds a plausible upward-trending series of `count` bars. Deterministic on
 * purpose: these values are asserted in tests.
 */
function usageCurve(count: number, curve: UsageCurve): number[] {
  const { start, end, total, integer = false, seed = 7 } = curve;
  const nextNoise = seededNoise(seed);
  const values = Array.from({ length: count }, (_, index) => {
    const noise = nextNoise();
    const trend = start + (end - start) * (count === 1 ? 1 : index / (count - 1));
    const jitter = integer ? 0 : (noise - 0.5) * 0.35 * trend;
    return Math.max(0, trend + jitter);
  });

  if (integer) return values.map((value) => Math.round(value));
  if (total === undefined) return values.map(round1);

  const sum = values.reduce((carry, value) => carry + value, 0);
  const scaled = values.map((value) => round1(sum === 0 ? 0 : (value * total) / sum));
  // Spread rounding drift one tenth at a time so the headline total is exact
  // without any single bar jumping off the trend.
  let drift = Math.round((total - scaled.reduce((carry, value) => carry + value, 0)) * 10);
  for (let index = scaled.length - 1; drift !== 0 && index >= 0; index -= 1) {
    const step = drift > 0 ? 0.1 : -0.1;
    if (scaled[index] + step < 0) continue;
    scaled[index] = round1(scaled[index] + step);
    drift -= drift > 0 ? 1 : -1;
    if (index === 0) index = scaled.length;
  }
  return scaled;
}

function usageSeries(curves: Record<ApiUsagePeriod, UsageCurve>, scale = 1): ApiResourceUsage['series'] {
  return Object.fromEntries(
    Object.entries(curves).map(([key, curve]) => {
      const period = key as ApiUsagePeriod;
      const labels = usageLabels[period];
      return [
        period,
        usageCurve(labels.length, curve).map((value, index) => {
          const [label, short_label] = labels[index];
          return { label, short_label, value: round1(value * scale) };
        }),
      ];
    }),
  ) as ApiResourceUsage['series'];
}

export function resourceUsage(scale: UsageScale): ApiResourceUsage[] {
  return [
    {
      id: 'gpu-hours',
      label: 'GPU hours',
      description: 'Usage',
      unit: 'GPU hours',
      limit: 100,
      aggregation: 'sum',
      color: '#6552f3',
      series: usageSeries(
        {
          day: { start: 0.1, end: 0.6, total: 8, seed: 11 },
          week: { start: 4, end: 8, total: 42, seed: 23 },
          month: { start: 2, end: 4.5, total: 91, seed: 37 },
        },
        scale.gpu_scale,
      ),
    },
    {
      id: 'storage',
      label: 'Storage',
      description: 'Growth',
      unit: 'GB',
      limit: 50,
      aggregation: 'sum',
      color: '#3b82f6',
      series: usageSeries(
        {
          day: { start: 0.05, end: 0.25, total: 3, seed: 5 },
          week: { start: 2, end: 3, total: 18, seed: 19 },
          month: { start: 0.8, end: 1.6, total: 36, seed: 31 },
        },
        scale.storage_scale,
      ),
    },
    {
      id: 'endpoints',
      label: 'Endpoints',
      description: 'Concurrent',
      unit: 'active',
      limit: 5,
      aggregation: 'peak',
      color: '#db3f91',
      series: usageSeries(
        {
          day: { start: 1, end: 2, integer: true },
          week: { start: 1, end: 2, integer: true },
          month: { start: 1, end: 2, integer: true },
        },
        scale.endpoints_max / 2,
      ),
    },
  ];
}
