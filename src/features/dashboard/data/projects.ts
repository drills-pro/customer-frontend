import type {
  Project,
  ProjectOverview,
  ResourceUsage,
  UsagePeriod,
} from '../domain/types'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
/** Fixtures are relative to load so their relative times stay plausible. */
const SEED_NOW = Date.now()

export const projects: Project[] = [
  {
    id: 'retail',
    orgId: 'acme',
    name: 'Retail Vision',
    task: 'Image Classification',
    description: 'Classify 240 SKU categories from shelf photos',
    datasets: 4,
    models: 5,
    deployed: 2,
    status: 'Active',
    updatedAt: SEED_NOW - HOUR * 2,
    updated: '2h ago',
    color: '#6366f1',
  },
  {
    id: 'support',
    orgId: 'acme',
    name: 'Support Triage',
    task: 'Text Classification',
    description: 'Route inbound tickets to the right queue automatically',
    datasets: 2,
    models: 5,
    deployed: 1,
    status: 'Active',
    updatedAt: SEED_NOW - DAY,
    updated: '1d ago',
    color: '#10b981',
  },
  {
    id: 'churn',
    orgId: 'acme',
    name: 'Churn Predictor',
    task: 'Tabular',
    description: 'Predict 90-day subscriber churn from usage signals',
    datasets: 3,
    models: 3,
    deployed: 1,
    status: 'Active',
    updatedAt: SEED_NOW - DAY * 2,
    updated: '2d ago',
    color: '#f59e0b',
  },
  {
    id: 'defect',
    orgId: 'acme',
    name: 'Defect Detection',
    task: 'Object Detection',
    description: 'Find surface defects on production line imagery',
    datasets: 6,
    models: 11,
    deployed: 3,
    status: 'Active',
    updatedAt: SEED_NOW - DAY * 3,
    updated: '3d ago',
    color: '#d946ef',
  },
  {
    id: 'docs',
    orgId: 'northwind',
    name: 'Doc Extractor',
    task: 'Document AI',
    description: 'Extract fields from scanned invoices',
    datasets: 2,
    models: 4,
    deployed: 0,
    status: 'Draft',
    updatedAt: SEED_NOW - HOUR * 5,
    updated: '5h ago',
    color: '#0ea5e9',
  },
  {
    id: 'demand',
    orgId: 'northwind',
    name: 'Demand Forecast',
    task: 'Time Series',
    description: 'Weekly SKU-level demand forecasting',
    datasets: 5,
    models: 7,
    deployed: 1,
    status: 'Archived',
    updatedAt: SEED_NOW - DAY * 4,
    updated: '4d ago',
    color: '#f43f5e',
  },
]

export const defaultTeam: ProjectOverview['team'] = [
  { name: 'Alex Rivera', initials: 'AR', role: 'Owner', color: '#8b5cf6' },
  { name: 'Priya Nair', initials: 'PN', role: 'Editor', color: '#d946ef' },
  { name: 'Sam Cole', initials: 'SC', role: 'Viewer', color: '#6366f1' },
]

const MONTH_DAYS = 30

function hourLabels(): Array<[string, string]> {
  return Array.from({ length: 24 }, (_, hour) => {
    const clock = hour % 12 === 0 ? 12 : hour % 12
    const meridiem = hour < 12 ? 'AM' : 'PM'
    return [`${clock} ${meridiem}`, `${clock}${hour < 12 ? 'a' : 'p'}`]
  })
}

function monthDayLabels(): Array<[string, string]> {
  return Array.from({ length: MONTH_DAYS }, (_, index) => {
    const day = index + 1
    return [`Sep ${day}`, String(day)]
  })
}

// Each period is a window; every bar is one natural sub-unit inside it.
const usageLabels: Record<UsagePeriod, Array<[string, string]>> = {
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
}

const usagePointCounts: Record<UsagePeriod, number> = {
  day: usageLabels.day.length,
  week: usageLabels.week.length,
  month: usageLabels.month.length,
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

type UsageCurve = {
  /** Value of the first bar, before jitter. */
  start: number
  /** Value of the last bar, before jitter. */
  end: number
  /** Exact aggregate the rendered bars should add up to, when given. */
  total?: number
  /** Round every bar to a whole number (for "peak"-style counts). */
  integer?: boolean
  seed?: number
}

/**
 * Builds a plausible upward-trending series of `count` bars. Deterministic on
 * purpose: these series are persisted to localStorage and asserted in tests.
 */
function usageCurve(count: number, curve: UsageCurve): number[] {
  const { start, end, total, integer = false, seed = 7 } = curve
  let noise = seed
  const values = Array.from({ length: count }, (_, index) => {
    noise = (noise * 1103515245 + 12345) % 2147483648
    const trend =
      start + (end - start) * (count === 1 ? 1 : index / (count - 1))
    const jitter = integer ? 0 : (noise / 2147483648 - 0.5) * 0.35 * trend
    return Math.max(0, trend + jitter)
  })

  if (integer) return values.map((value) => Math.round(value))
  if (total === undefined) return values.map(round1)

  const sum = values.reduce((carry, value) => carry + value, 0)
  const scaled = values.map((value) =>
    round1(sum === 0 ? 0 : (value * total) / sum),
  )
  // Spread rounding drift one tenth at a time so the headline total is exact
  // without any single bar jumping off the trend.
  let drift = Math.round(
    (total - scaled.reduce((carry, value) => carry + value, 0)) * 10,
  )
  for (let index = scaled.length - 1; drift !== 0 && index >= 0; index -= 1) {
    const step = drift > 0 ? 0.1 : -0.1
    if (scaled[index] + step < 0) continue
    scaled[index] = round1(scaled[index] + step)
    drift -= drift > 0 ? 1 : -1
    if (index === 0) index = scaled.length
  }
  return scaled
}

function usageSeries(
  curves: Record<UsagePeriod, UsageCurve>,
  scale = 1,
): ResourceUsage['series'] {
  return Object.fromEntries(
    Object.entries(curves).map(([key, curve]) => {
      const period = key as UsagePeriod
      const labels = usageLabels[period]
      return [
        period,
        usageCurve(usagePointCounts[period], curve).map((value, index) => {
          const [label, shortLabel] = labels[index]
          return {
            label,
            shortLabel,
            value: round1(value * scale),
          }
        }),
      ]
    }),
  ) as ResourceUsage['series']
}

export function createResourceUsage({
  gpuScale = 1,
  storageScale = 1,
  endpointsMax = 2,
} = {}): ResourceUsage[] {
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
        gpuScale,
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
        storageScale,
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
        endpointsMax / 2,
      ),
    },
  ]
}

function overview(
  values: Pick<ProjectOverview, 'created' | 'region' | 'bestModel'> &
    Partial<Omit<ProjectOverview, 'created' | 'region' | 'bestModel'>>,
): ProjectOverview {
  return {
    framework: 'PyTorch 2.4',
    visibility: 'Organization',
    pipeline: { runs: 8, running: 1, completeThrough: 3 },
    resourceUsage: createResourceUsage(),
    team: defaultTeam,
    ...values,
  }
}

export const projectOverviews: Partial<Record<string, ProjectOverview>> = {
  retail: overview({
    created: '12 Jun 2026',
    region: 'us-east-1',
    pipeline: { runs: 23, running: 3, completeThrough: 3 },
    readme: {
      about:
        'Retail Vision classifies shelf photos into 240 SKU categories for planogram compliance and out-of-stock detection. It is trained on images captured from in-store fixed cameras and handheld audits.',
      architecture: 'resnet50-v3',
      quickstart: `# predict.sh
curl -X POST https://api.drills.ai/v1/predict \\
  -H "Authorization: Bearer $DRILLS_KEY" \\
  -d '{"model": "resnet50-v3", "image": "<base64>"}'`,
      notes: [
        {
          label: 'Data drift',
          text: 'Retrain monthly because shelf lighting varies by store region.',
        },
        {
          label: 'Known limitation',
          text: 'Confuses near-identical private-label variants in under 3% of frames.',
        },
        {
          label: 'Owner',
          text: 'Alex Rivera — coordinate in #retail-vision before promoting a new run.',
        },
      ],
    },
    bestModel: {
      name: 'resnet50-v3',
      run: '#23',
      updated: '2 hours ago',
      accuracy: 94.2,
      f1: 0.938,
      latency: '82ms',
      size: '98 MB',
    },
  }),
  support: overview({
    created: '3 May 2026',
    region: 'us-west-2',
    pipeline: { runs: 12, running: 1, completeThrough: 4 },
    bestModel: {
      name: 'bert-triage-v2',
      run: '#12',
      updated: '1 day ago',
      accuracy: 92.7,
      f1: 0.921,
      latency: '64ms',
      size: '112 MB',
    },
  }),
  churn: overview({
    created: '18 Apr 2026',
    framework: 'XGBoost 3.0',
    region: 'us-east-1',
    pipeline: { runs: 9, running: 0, completeThrough: 4 },
    bestModel: {
      name: 'churn-xgb-v4',
      run: '#9',
      updated: '2 days ago',
      accuracy: 89.6,
      f1: 0.884,
      latency: '31ms',
      size: '24 MB',
    },
  }),
  defect: overview({
    created: '25 Mar 2026',
    region: 'eu-west-1',
    pipeline: { runs: 18, running: 2, completeThrough: 4 },
    bestModel: {
      name: 'yolov8-defect',
      run: '#18',
      updated: '3 days ago',
      accuracy: 91.8,
      f1: 0.909,
      latency: '105ms',
      size: '86 MB',
    },
  }),
  docs: overview({
    created: '27 Aug 2026',
    framework: 'Transformers 5.1',
    region: 'eu-central-1',
    pipeline: { runs: 4, running: 1, completeThrough: 3 },
    bestModel: {
      name: 'layoutlm-invoices',
      run: '#4',
      updated: '5 hours ago',
      accuracy: 88.4,
      f1: 0.872,
      latency: '118ms',
      size: '132 MB',
    },
    resourceUsage: createResourceUsage({
      gpuScale: 18 / 42,
      storageScale: 0.5,
      endpointsMax: 0,
    }),
  }),
  demand: overview({
    created: '9 Feb 2026',
    framework: 'PyTorch Forecasting',
    region: 'ap-southeast-1',
    pipeline: { runs: 14, running: 0, completeThrough: 4 },
    bestModel: {
      name: 'temporal-fusion-v2',
      run: '#14',
      updated: '4 days ago',
      accuracy: 86.9,
      f1: 0.861,
      latency: '76ms',
      size: '71 MB',
    },
  }),
}

export const projectTaskTypes = [
  'Image Classification',
  'Object Detection',
  'Segmentation',
  'Text Classification',
  'Named Entity Recognition',
  'Tabular Prediction',
  'Time Series',
] as const

export const projectRegions = [
  { id: 'us-east-1', label: 'US East (N. Virginia)' },
  { id: 'us-west-2', label: 'US West (Oregon)' },
  { id: 'eu-west-1', label: 'EU (Ireland)' },
  { id: 'eu-central-1', label: 'EU (Frankfurt)' },
  { id: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
] as const
