/**
 * Every entity the pages render, in the shape the components use. The API's
 * wire shapes live in `src/features/<area>/api/types.ts`; each feature's
 * `mappers.ts` turns one into the other.
 */

export const orgPlans = ['Free', 'Team', 'Enterprise'] as const
export type OrgPlan = (typeof orgPlans)[number]

export const orgRoles = ['Owner', 'Admin', 'Member', 'Viewer'] as const
export type OrgRole = (typeof orgRoles)[number]

export type Organization = {
  id: string
  name: string
  initial: string
  color: string
  /** URL handle, unique across DRILLS: `drills.ai/<slug>`. */
  slug: string
  plan: OrgPlan
  description: string
  createdAt: number
  /** The signed-in user's role in this organization. */
  yourRole: OrgRole
  /** What new projects and members in this organization start with. */
  defaults: {
    visibility: 'Organization' | 'Private'
    requireTwoFactor: boolean
    domainJoin: boolean
  }
}

/** What a plan allows. */
export type PlanLimits = {
  seats: number
  projects: number
  credits: number
  price: string
}

/** The counts shown on an organization's card, switcher row and overview. */
export type OrgSummary = {
  projects: number
  members: number
  invited: number
  runningTrainings: number
  deployments: number
  creditsUsed: number
  limits: PlanLimits
}

/** The editable identity fields of an organization. */
export type OrganizationProfile = Pick<
  Organization,
  'name' | 'slug' | 'description' | 'color'
>

export type OrgMember = {
  id: string
  name: string
  email: string
  initials: string
  color: string
  role: OrgRole
  joinedAt: number
  lastActive: string
  status: 'active' | 'invited'
  you?: boolean
}

/** An invitation to the signed-in user to join another organization. */
export type OrgInvitation = {
  id: string
  organization: Pick<
    Organization,
    'id' | 'name' | 'initial' | 'color' | 'slug' | 'plan' | 'description'
  >
  /** The role the user would join with. */
  role: OrgRole
  invitedBy: string
  sentAt: number
}
export type Project = {
  id: string
  orgId: string
  name: string
  /** The task type's display name; `taskType` is its id. */
  task: string
  taskType: string
  description: string
  datasets: number
  models: number
  deployed: number
  status: 'Active' | 'Draft' | 'Archived'
  /** Machine-readable last-update time; `updated` is its display form. */
  updatedAt: number
  updated: string
  color: string
}
export type UsagePeriod = 'day' | 'week' | 'month'
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
  /** Markdown saved from the README editor; shown instead of `readme`. */
  readmeMarkdown?: string
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
export type TrainingRunStatus = 'Running' | 'Stopped' | 'Completed' | 'Failed'
export type TrainingSplit = {
  train: number
  validation: number
  test: number
}
export type TrainingScheduler = 'cosine' | 'linear' | 'constant'
export type TrainingRun = {
  id: string
  projectId: string
  datasetId: string
  name: string
  architecture: string
  status: TrainingRunStatus
  epochs: number
  batchSize: number
  split: TrainingSplit
  learningRate: number
  scheduler: TrainingScheduler
  augmentations: string[]
  earlyStopping: boolean
  instanceId: string
  instanceName: string
  spot: boolean
  estimatedHours: number
  estimatedCost: number
  progress: number
  step: number
  totalSteps: number
  /** The epoch the run is in, and the time left: `~12m`, or `—` when idle. */
  epoch: number
  eta: string
  throughput: string
  gpuUtilization: string
  gpuMemory: string
  author: string
  startedAt: number
}
export type ModelStage = 'Production' | 'Staging' | 'Archived'
/** A trained model version, produced by one training run. */
export type Model = {
  id: string
  projectId: string
  /** Shared across versions: `resnet50` v1, v2 and v3 are three `Model`s. */
  name: string
  version: number
  architecture: string
  framework: string
  /** The `TrainingRun` this version came out of. */
  runId: string
  /** Percent, e.g. `94.2`. */
  accuracy: number
  /** Macro F1, e.g. `0.938`. */
  f1: number
  latencyP95: string
  size: string
  stage: ModelStage
  author: string
  created: string
  /** The deployment serving this version, if any. */
  deploymentId?: string
}

export type DeploymentStatus = 'Live' | 'Paused' | 'Deploying'
export type DeploymentEnvironment = 'Production' | 'Staging' | 'Batch' | 'Edge'
/**
 * A served model. Keyed on `projectId`, like `TrainingRun`; the org is resolved
 * through the project rather than stored twice.
 */
export type Deployment = {
  id: string
  projectId: string
  modelId: string
  name: string
  status: DeploymentStatus
  environment: DeploymentEnvironment
  endpoint: string
  region: string
  instanceName: string
  /** `pinned` keeps serving `modelId`; `latest` follows new promotions. */
  serving: 'pinned' | 'latest'
  minReplicas: number
  maxReplicas: number
  activeReplicas: number
  targetConcurrency: number
  scaleDownDelaySeconds: number
  /** Display strings: a paused deployment reads `—`, not `0`. */
  requests24h: string
  latencyP50: string
  latencyP95: string
  latencyP99: string
  errorRate: string
  costPerDay: string
  deployed: string
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
export type QualityDimension =
  | 'integrity'
  | 'duplicates'
  | 'classBalance'
  | 'labelValidity'
  | 'labelConsistency'
  | 'imageQuality'
  | 'splitIntegrity'
  | 'metadata'
export type QualitySeverity = 'pass' | 'warning' | 'error'
export type QualityFinding = {
  dimension: QualityDimension
  severity: QualitySeverity
  title: string
  description?: string
  /** `tab` is set only when a real tab shows the relevant detail; otherwise
   *  the action is demo-only (shows the standard "not available" toast). */
  action?: {
    label: string
    tab?: 'preview' | 'statistics' | 'quality' | 'versions'
  }
}
export type QualityReport = {
  findings: QualityFinding[]
  lastChecked: string
}
export type ClassCount = { name: string; count: number }
export type DatasetComposition = {
  fileFormat: string
  /** Image datasets only. */
  avgDimensions?: { width: number; height: number }
  /** Text datasets only. */
  avgWords?: number
}
/** Everything the dataset page's tabs show for one dataset. */
export type DatasetDetail = {
  samples: DatasetSample[]
  distribution: Array<{ label: string; count: number }>
  /** One entry per class/label, generated so the counts sum to the item total. */
  classDistribution: ClassCount[]
  composition: DatasetComposition
  healthChecks: Array<{
    status: 'pass' | 'warning'
    label: string
  }>
  qualityReport: QualityReport
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
export const themePreferences = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof themePreferences)[number]

/** The user's choices about the interface, kept in browser storage. */
export type DashboardPreferences = {
  /** The organization being worked in; empty means "the first one". */
  organizationId: string
  onboardingDismissed: boolean
  /** Applied to `<html>` by `useApplyTheme`; "system" follows the OS. */
  theme: ThemePreference
}
