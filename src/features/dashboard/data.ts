export const DASHBOARD_STORAGE_KEY = 'drills-dashboard-v1'

export type Organization = {
  id: string
  name: string
  initial: string
  color: string
}
export type Project = {
  id: string
  orgId: string
  name: string
  task: string
  description: string
  datasets: number
  models: number
  deployed: number
  status: 'Active' | 'Draft' | 'Archived'
  updated: string
  color: string
}
export type UsagePeriod = 'hour' | 'day' | 'week' | 'month'
export type ResourceUsage = {
  id: 'gpu-hours' | 'storage' | 'endpoints'
  label: string
  description: string
  unit: string
  limit: number
  aggregation: 'sum' | 'peak'
  color: string
  series: Record<
    UsagePeriod,
    Array<{
      label: string
      shortLabel: string
      value: number
    }>
  >
}
export type ProjectOverview = {
  created: string
  framework: string
  region: string
  visibility: 'Organization' | 'Private'
  pipeline: {
    runs: number
    running: number
    completeThrough: 1 | 2 | 3 | 4
  }
  bestModel?: {
    name: string
    run: string
    updated: string
    accuracy: number
    f1: number
    latency: string
    size: string
  }
  resourceUsage: ResourceUsage[]
  readme?: {
    about: string
    architecture: string
    quickstart: string
    notes: Array<{
      label: string
      text: string
    }>
  }
  team: Array<{
    name: string
    initials: string
    role: 'Owner' | 'Editor' | 'Viewer'
    color: string
  }>
}
export type Activity = {
  id: string
  orgId: string
  icon: 'success' | 'dataset' | 'deployment' | 'error' | 'person'
  lead: string
  text: string
  time: string
  action: string
}
export type Training = {
  id: string
  orgId: string
  name: string
  epoch: number
  epochs: number
  progress: number
  eta: string
}
export type TrainingRunStatus = 'Running' | 'Stopped'
export type TrainingRun = {
  id: string
  projectId: string
  datasetId: string
  name: string
  architecture: string
  status: TrainingRunStatus
  epochs: number
  batchSize: number
  learningRate: 'auto' | 'low' | 'high'
  augmentations: string[]
  earlyStopping: boolean
  optimizer: string
  weightDecay: string
  warmupSteps: number
  mixedPrecision: string
  instanceId: string
  instanceName: string
  spot: boolean
  estimatedHours: number
  estimatedCost: number
  progress: number
  step: number
  totalSteps: number
  throughput: string
  gpuUtilization: string
  gpuMemory: string
  author: string
  startedAt: number
}
export type CreatedProject = {
  project: Project
  overview: ProjectOverview
  startMethod: 'upload' | 'template' | 'clone'
  template?: string
  clonedFromProjectId?: string
}
export type Deployment = {
  id: string
  orgId: string
  name: string
  latency: string
  errorRate: string
  status: 'Live' | 'Paused'
}
export type Dataset = {
  id: string
  projectId: string
  name: string
  modality: 'image' | 'text' | 'tabular'
  split: 'Train' | 'Validation' | 'Test' | 'Unsplit'
  items: number
  size: string
  classes: number
  version: number
  status: 'Ready' | 'Processing' | 'Error'
  created: string
  files: string[]
}
export type DatasetSample =
  | {
      id: string
      modality: 'image'
      image: string
      label: string
      split: 'Train' | 'Validation' | 'Test'
    }
  | {
      id: string
      modality: 'text'
      text: string
      label: string
      words: number
      split: 'Train' | 'Validation' | 'Test'
    }
export type DatasetDetailMock = {
  samples: DatasetSample[]
  distribution: Array<{ label: string; count: number }>
  healthChecks: Array<{
    status: 'pass' | 'warning'
    label: string
  }>
  splitDistribution: Array<{
    label: 'Train' | 'Validation' | 'Test'
    percent: number
  }>
  versions: Array<{
    version: number
    items: number
    created: string
  }>
}
export type DashboardPreferences = {
  organizationId: string
  onboardingDismissed: boolean
  notificationsRead: boolean
  uploads: Activity[]
  datasets: Dataset[]
  trainingRuns: TrainingRun[]
  createdProjects: CreatedProject[]
}

export const organizations: Organization[] = [
  { id: 'acme', name: 'Acme AI', initial: 'A', color: '#10b981' },
  { id: 'northwind', name: 'Northwind Labs', initial: 'N', color: '#0ea5e9' },
  { id: 'solo', name: 'Solo Sandbox', initial: 'S', color: '#f59e0b' },
]

export const projects: Project[] = [
  {
    id: 'retail',
    orgId: 'acme',
    name: 'Retail Vision',
    task: 'Image Classification',
    description: 'Classify 240 SKU categories from shelf photos',
    datasets: 4,
    models: 8,
    deployed: 2,
    status: 'Active',
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
    updated: '4d ago',
    color: '#f43f5e',
  },
]

const defaultTeam: ProjectOverview['team'] = [
  { name: 'Alex Rivera', initials: 'AR', role: 'Owner', color: '#8b5cf6' },
  { name: 'Priya Nair', initials: 'PN', role: 'Editor', color: '#d946ef' },
  { name: 'Sam Cole', initials: 'SC', role: 'Viewer', color: '#6366f1' },
]

const usageLabels: Record<UsagePeriod, Array<[string, string]>> = {
  hour: [
    ['8 AM', '8a'],
    ['9 AM', '9a'],
    ['10 AM', '10a'],
    ['11 AM', '11a'],
    ['12 PM', '12p'],
    ['1 PM', '1p'],
    ['2 PM', '2p'],
  ],
  day: [
    ['Monday', 'M'],
    ['Tuesday', 'T'],
    ['Wednesday', 'W'],
    ['Thursday', 'T'],
    ['Friday', 'F'],
    ['Saturday', 'S'],
    ['Sunday', 'S'],
  ],
  week: [
    ['Jul 20–26', 'W1'],
    ['Jul 27–Aug 2', 'W2'],
    ['Aug 3–9', 'W3'],
    ['Aug 10–16', 'W4'],
    ['Aug 17–23', 'W5'],
    ['Aug 24–30', 'W6'],
    ['Aug 31–Sep 6', 'W7'],
  ],
  month: [
    ['March', 'Mar'],
    ['April', 'Apr'],
    ['May', 'May'],
    ['June', 'Jun'],
    ['July', 'Jul'],
    ['August', 'Aug'],
    ['September', 'Sep'],
  ],
}

function usageSeries(
  values: Record<UsagePeriod, number[]>,
  scale = 1,
): ResourceUsage['series'] {
  return Object.fromEntries(
    Object.entries(values).map(([period, periodValues]) => [
      period,
      periodValues.map((value, index) => {
        const [label, shortLabel] = usageLabels[period as UsagePeriod][index]
        return {
          label,
          shortLabel,
          value: Math.round(value * scale * 10) / 10,
        }
      }),
    ]),
  ) as ResourceUsage['series']
}

function createResourceUsage({
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
          hour: [0.4, 0.8, 1.2, 0.7, 1.4, 1.8, 2.2],
          day: [4, 5, 6, 5, 7, 7, 8],
          week: [5, 7, 8, 6, 9, 10, 12],
          month: [8, 12, 10, 14, 16, 13, 18],
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
          hour: [0.1, 0.2, 0.2, 0.3, 0.2, 0.4, 0.5],
          day: [2, 2, 2, 3, 3, 3, 3],
          week: [1.5, 2, 2.5, 2, 3, 3.5, 4],
          month: [3, 4, 5, 4, 6, 6, 8],
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
          hour: [1, 1, 1, 2, 2, 2, 2],
          day: [1, 1, 2, 2, 2, 2, 2],
          week: [1, 1, 1, 2, 2, 2, 2],
          month: [1, 1, 1, 1, 2, 2, 2],
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

const DEFAULT_PROJECT_COLOR = '#6366f1'

export function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project'
  )
}

export function generateProjectId(
  name: string,
  preferences: DashboardPreferences,
) {
  const existingIds = new Set(allProjects(preferences).map((item) => item.id))
  const base = slugify(name)
  if (!existingIds.has(base)) return base
  let suffix = 2
  while (existingIds.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export function isProjectNameTaken(
  name: string,
  orgId: string,
  preferences: DashboardPreferences,
) {
  const normalized = name.trim().toLowerCase()
  return allProjects(preferences).some(
    (item) =>
      item.orgId === orgId && item.name.trim().toLowerCase() === normalized,
  )
}

export function createProjectRecord({
  name,
  description,
  orgId,
  task,
  hasDataset,
}: {
  name: string
  description: string
  orgId: string
  task: string
  hasDataset: boolean
}): Project {
  return {
    id: '',
    orgId,
    name: name.trim(),
    task,
    description: description.trim(),
    datasets: hasDataset ? 1 : 0,
    models: 0,
    deployed: 0,
    status: 'Draft',
    updated: 'Just now',
    color: DEFAULT_PROJECT_COLOR,
  }
}

export function frameworkForTask(task: string) {
  if (task === 'Tabular' || task === 'Tabular Prediction') return 'XGBoost 3.0'
  if (task === 'Time Series') return 'PyTorch Forecasting'
  if (task === 'Text Classification' || task === 'Named Entity Recognition')
    return 'Transformers 5.1'
  return 'PyTorch 2.4'
}

export function createEmptyProjectOverview({
  region,
  visibility,
  task,
  hasDataset,
}: {
  region: string
  visibility: ProjectOverview['visibility']
  task: string
  hasDataset: boolean
}): ProjectOverview {
  return {
    created: new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    framework: frameworkForTask(task),
    region,
    visibility,
    pipeline: {
      runs: 0,
      running: 0,
      completeThrough: hasDataset ? 2 : 1,
    },
    resourceUsage: createResourceUsage({
      gpuScale: 0,
      storageScale: hasDataset ? 0.1 : 0,
      endpointsMax: 0,
    }),
    team: defaultTeam,
  }
}

export function allProjects(preferences: DashboardPreferences) {
  return [
    ...preferences.createdProjects.map((item) => item.project),
    ...projects,
  ]
}

export function resolveProject(
  projectId: string,
  preferences: DashboardPreferences,
) {
  const created = preferences.createdProjects.find(
    (item) => item.project.id === projectId,
  )
  const project =
    created?.project ?? projects.find((item) => item.id === projectId)
  const overview = created?.overview ?? projectOverviews[projectId]
  const organization = organizations.find((item) => item.id === project?.orgId)
  return project && overview && organization
    ? { project, details: overview, organization }
    : undefined
}

export const activities: Activity[] = [
  {
    id: 'a1',
    orgId: 'acme',
    icon: 'success',
    lead: 'Training resnet50-v3',
    text: 'completed — 94.2% accuracy',
    time: '12m ago',
    action: 'Deploy',
  },
  {
    id: 'a2',
    orgId: 'acme',
    icon: 'dataset',
    lead: 'Dataset retail-products-v2',
    text: 'finished processing (18,420 images)',
    time: '1h ago',
    action: 'View',
  },
  {
    id: 'a3',
    orgId: 'acme',
    icon: 'deployment',
    lead: 'Endpoint sentiment-prod',
    text: 'scaled to 3 replicas',
    time: '2h ago',
    action: 'Monitor',
  },
  {
    id: 'a4',
    orgId: 'acme',
    icon: 'error',
    lead: 'Training vit-base-lr3',
    text: 'failed — CUDA out of memory',
    time: '4h ago',
    action: 'Retry',
  },
  {
    id: 'a5',
    orgId: 'acme',
    icon: 'person',
    lead: 'Priya Nair',
    text: 'joined organization Acme AI',
    time: 'Yesterday',
    action: 'Profile',
  },
  {
    id: 'a6',
    orgId: 'acme',
    icon: 'success',
    lead: 'Model churn-xgb-v4',
    text: 'promoted to production',
    time: '2d ago',
    action: 'View',
  },
  {
    id: 'n1',
    orgId: 'northwind',
    icon: 'dataset',
    lead: 'Dataset invoices-2026',
    text: 'finished processing (3,208 files)',
    time: '35m ago',
    action: 'View',
  },
]

export const trainings: Training[] = [
  {
    id: 't1',
    orgId: 'acme',
    name: 'efficientnet-b4',
    epoch: 12,
    epochs: 30,
    progress: 40,
    eta: '~18m',
  },
  {
    id: 't2',
    orgId: 'acme',
    name: 'bert-triage-v2',
    epoch: 4,
    epochs: 10,
    progress: 38,
    eta: '~42m',
  },
  {
    id: 't3',
    orgId: 'acme',
    name: 'yolov8-defect',
    epoch: 27,
    epochs: 40,
    progress: 67,
    eta: '~9m',
  },
  {
    id: 't4',
    orgId: 'northwind',
    name: 'layoutlm-invoices',
    epoch: 6,
    epochs: 20,
    progress: 30,
    eta: '~31m',
  },
]

export const deployments: Deployment[] = [
  {
    id: 'd1',
    orgId: 'acme',
    name: 'sentiment-prod',
    latency: '82ms',
    errorRate: '0.02%',
    status: 'Live',
  },
  {
    id: 'd2',
    orgId: 'acme',
    name: 'retail-classify',
    latency: '140ms',
    errorRate: '0.11%',
    status: 'Live',
  },
  {
    id: 'd3',
    orgId: 'acme',
    name: 'defect-staging',
    latency: '—',
    errorRate: '—',
    status: 'Paused',
  },
  {
    id: 'd4',
    orgId: 'northwind',
    name: 'invoice-extract',
    latency: '118ms',
    errorRate: '0.05%',
    status: 'Live',
  },
]

export const datasets: Dataset[] = projects.flatMap((project, index) => [
  {
    id: `${project.id}-train`,
    projectId: project.id,
    name:
      project.id === 'retail'
        ? 'retail-shelf-train'
        : project.id === 'support'
          ? 'support-tickets-train'
          : `${project.id}-train`,
    modality: project.task.includes('Image')
      ? 'image'
      : project.task.includes('Text')
        ? 'text'
        : 'tabular',
    split: 'Train',
    items:
      project.id === 'retail'
        ? 18420
        : project.id === 'support'
          ? 42300
          : 3200 + index * 1200,
    size:
      project.id === 'retail'
        ? '4.2 GB'
        : project.id === 'support'
          ? '8.4 MB'
          : '520 MB',
    classes: project.id === 'retail' ? 240 : project.id === 'support' ? 18 : 12,
    version: project.id === 'retail' ? 3 : project.id === 'support' ? 2 : 1,
    status: 'Ready',
    created: '12 Jun',
    files: [],
  },
  {
    id: `${project.id}-val`,
    projectId: project.id,
    name:
      project.id === 'retail' ? 'retail-shelf-val' : `${project.id}-validation`,
    modality: project.task.includes('Image')
      ? 'image'
      : project.task.includes('Text')
        ? 'text'
        : 'tabular',
    split: 'Validation',
    items: 2300,
    size: '520 MB',
    classes: project.id === 'retail' ? 240 : 12,
    version: 1,
    status: 'Ready',
    created: '12 Jun',
    files: [],
  },
])

datasets.push(
  {
    id: 'retail-test',
    projectId: 'retail',
    name: 'retail-shelf-test',
    modality: 'image',
    split: 'Test',
    items: 2300,
    size: '518 MB',
    classes: 240,
    version: 3,
    status: 'Ready',
    created: '12 Jun',
    files: [],
  },
  {
    id: 'retail-raw',
    projectId: 'retail',
    name: 'shelf-v2-raw',
    modality: 'image',
    split: 'Unsplit',
    items: 31100,
    size: '7.8 GB',
    classes: 0,
    version: 1,
    status: 'Processing',
    created: '2h ago',
    files: [],
  },
  {
    id: 'retail-legacy',
    projectId: 'retail',
    name: 'legacy-import',
    modality: 'image',
    split: 'Train',
    items: 940,
    size: '180 MB',
    classes: 12,
    version: 1,
    status: 'Error',
    created: '3d ago',
    files: [],
  },
)

const retailLabels = [
  'beverages',
  'snacks',
  'dairy',
  'produce',
  'bakery',
  'household',
] as const

const retailImageSamples: DatasetSample[] = Array.from(
  { length: 24 },
  (_, index) => {
    const label = retailLabels[index % retailLabels.length]
    return {
      id: `retail-sample-${index + 1}`,
      modality: 'image' as const,
      image: `/dataset-samples/retail/${label}.png`,
      label,
      split:
        index % 10 < 8
          ? ('Train' as const)
          : index % 10 === 8
            ? ('Validation' as const)
            : ('Test' as const),
    }
  },
)

const supportTextSamples: DatasetSample[] = [
  [
    'My order #48213 has not arrived yet and it has been two weeks.',
    'Shipping delay',
    'Train',
  ],
  [
    'How do I reset my password? I cannot access my account anymore.',
    'Account access',
    'Train',
  ],
  [
    'I was charged twice for the same order. Please refund the extra charge.',
    'Billing issue',
    'Train',
  ],
  [
    'Love the new app update; everything feels much faster now!',
    'Positive feedback',
    'Validation',
  ],
  [
    'The product arrived damaged and the box was crushed in transit.',
    'Damaged item',
    'Train',
  ],
  [
    'Please cancel my subscription. I no longer need the service.',
    'Cancellation',
    'Train',
  ],
  [
    'Can I change my delivery address after placing an order?',
    'Account access',
    'Test',
  ],
  [
    'Requesting a refund for order #77219 because it was never delivered.',
    'Refund request',
    'Train',
  ],
].map(([text, label, split], index) => ({
  id: `support-sample-${index + 1}`,
  modality: 'text' as const,
  text,
  label,
  words: text.split(/\s+/).length,
  split: split as 'Train' | 'Validation' | 'Test',
}))

export const datasetDetails: Partial<Record<string, DatasetDetailMock>> = {
  'retail-train': {
    samples: retailImageSamples,
    distribution: [
      { label: 'beverages', count: 3200 },
      { label: 'snacks', count: 2840 },
      { label: 'dairy', count: 2100 },
      { label: 'produce', count: 1750 },
      { label: 'bakery', count: 980 },
      { label: 'household', count: 7550 },
    ],
    healthChecks: [
      { status: 'pass', label: 'No corrupt files' },
      { status: 'warning', label: '142 near-duplicates found' },
      { status: 'warning', label: 'Class imbalance ratio 3.2:1' },
      { status: 'pass', label: 'All labels valid' },
    ],
    splitDistribution: [
      { label: 'Train', percent: 80 },
      { label: 'Validation', percent: 10 },
      { label: 'Test', percent: 10 },
    ],
    versions: [
      { version: 3, items: 18420, created: '12 Jun 2026' },
      { version: 2, items: 16980, created: '4 May 2026' },
      { version: 1, items: 14200, created: '18 Mar 2026' },
    ],
  },
  'support-train': {
    samples: supportTextSamples,
    distribution: [
      { label: 'Shipping delay', count: 9800 },
      { label: 'Account access', count: 6420 },
      { label: 'Billing issue', count: 5180 },
      { label: 'Damaged item', count: 3960 },
      { label: 'General feedback', count: 3210 },
      { label: 'Other', count: 13730 },
    ],
    healthChecks: [
      { status: 'pass', label: 'No empty rows' },
      { status: 'warning', label: '96 near-duplicate texts found' },
      { status: 'warning', label: 'Label imbalance ratio 4.1:1' },
      { status: 'warning', label: '3 mixed-language rows detected' },
      { status: 'pass', label: 'All rows labeled' },
    ],
    splitDistribution: [
      { label: 'Train', percent: 80 },
      { label: 'Validation', percent: 10 },
      { label: 'Test', percent: 10 },
    ],
    versions: [
      { version: 2, items: 42300, created: '3 May 2026' },
      { version: 1, items: 38120, created: '14 Apr 2026' },
    ],
  },
}

export const defaultPreferences: DashboardPreferences = {
  organizationId: 'acme',
  onboardingDismissed: false,
  notificationsRead: false,
  uploads: [],
  datasets: [],
  trainingRuns: [],
  createdProjects: [],
}

function isCreatedProject(value: unknown): value is CreatedProject {
  if (!value || typeof value !== 'object') return false
  const saved = value as Partial<CreatedProject>
  const project = saved.project as Partial<Project> | undefined
  const details = saved.overview as Partial<ProjectOverview> | undefined
  return Boolean(
    project &&
    typeof project.id === 'string' &&
    typeof project.orgId === 'string' &&
    typeof project.name === 'string' &&
    typeof project.task === 'string' &&
    typeof project.description === 'string' &&
    typeof project.datasets === 'number' &&
    typeof project.models === 'number' &&
    typeof project.deployed === 'number' &&
    (project.status === 'Active' ||
      project.status === 'Draft' ||
      project.status === 'Archived') &&
    typeof project.updated === 'string' &&
    typeof project.color === 'string' &&
    details &&
    typeof details.created === 'string' &&
    typeof details.framework === 'string' &&
    typeof details.region === 'string' &&
    (details.visibility === 'Organization' ||
      details.visibility === 'Private') &&
    details.pipeline &&
    typeof details.pipeline.runs === 'number' &&
    typeof details.pipeline.running === 'number' &&
    Array.isArray(details.resourceUsage) &&
    Array.isArray(details.team) &&
    (saved.startMethod === 'upload' ||
      saved.startMethod === 'template' ||
      saved.startMethod === 'clone'),
  )
}

function isTrainingRun(value: unknown): value is TrainingRun {
  if (!value || typeof value !== 'object') return false
  const run = value as Partial<TrainingRun>
  return Boolean(
    typeof run.id === 'string' &&
    typeof run.projectId === 'string' &&
    typeof run.datasetId === 'string' &&
    typeof run.name === 'string' &&
    typeof run.architecture === 'string' &&
    (run.status === 'Running' || run.status === 'Stopped') &&
    typeof run.epochs === 'number' &&
    typeof run.batchSize === 'number' &&
    (run.learningRate === 'auto' ||
      run.learningRate === 'low' ||
      run.learningRate === 'high') &&
    Array.isArray(run.augmentations) &&
    typeof run.earlyStopping === 'boolean' &&
    typeof run.optimizer === 'string' &&
    typeof run.weightDecay === 'string' &&
    typeof run.warmupSteps === 'number' &&
    typeof run.mixedPrecision === 'string' &&
    typeof run.instanceId === 'string' &&
    typeof run.instanceName === 'string' &&
    typeof run.spot === 'boolean' &&
    typeof run.estimatedHours === 'number' &&
    typeof run.estimatedCost === 'number' &&
    typeof run.progress === 'number' &&
    typeof run.step === 'number' &&
    typeof run.totalSteps === 'number' &&
    typeof run.throughput === 'string' &&
    typeof run.gpuUtilization === 'string' &&
    typeof run.gpuMemory === 'string' &&
    typeof run.author === 'string' &&
    typeof run.startedAt === 'number',
  )
}

export function restorePreferences(value: string | null): DashboardPreferences {
  if (!value) return defaultPreferences
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return defaultPreferences
    const saved = parsed as Partial<DashboardPreferences>
    return {
      organizationId: organizations.some(
        (org) => org.id === saved.organizationId,
      )
        ? saved.organizationId!
        : defaultPreferences.organizationId,
      onboardingDismissed: saved.onboardingDismissed === true,
      notificationsRead: saved.notificationsRead === true,
      uploads: Array.isArray(saved.uploads)
        ? saved.uploads.filter((item): item is Activity =>
            Boolean(typeof item.id === 'string'),
          )
        : [],
      datasets: Array.isArray(saved.datasets)
        ? saved.datasets
            .filter((item): item is Dataset =>
              Boolean(
                typeof item.id === 'string' &&
                typeof item.projectId === 'string' &&
                typeof item.name === 'string',
              ),
            )
            .map((item) => {
              const legacyItem = item as Omit<Dataset, 'modality' | 'version'> &
                Partial<Pick<Dataset, 'modality' | 'version'>>
              const project = projects.find(
                (candidate) => candidate.id === item.projectId,
              )
              return {
                ...item,
                modality:
                  legacyItem.modality ??
                  (project?.task.includes('Image')
                    ? 'image'
                    : project?.task.includes('Text')
                      ? 'text'
                      : 'tabular'),
                version: legacyItem.version ?? 1,
              }
            })
        : [],
      trainingRuns: Array.isArray(saved.trainingRuns)
        ? saved.trainingRuns.filter(isTrainingRun)
        : [],
      createdProjects: Array.isArray(saved.createdProjects)
        ? saved.createdProjects.filter(isCreatedProject)
        : [],
    }
  } catch {
    return defaultPreferences
  }
}
