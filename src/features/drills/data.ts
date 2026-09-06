import { z } from 'zod'

export const taskTypes = [
  'Image Classification',
  'Object Detection',
  'Segmentation',
  'Text Classification',
  'Named Entity Recognition',
  'Tabular Prediction',
  'Time Series',
] as const
const base = { id: z.string(), name: z.string().min(1), createdAt: z.number() }
const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  plan: z.string(),
})
const projectSchema = z.object({
  ...base,
  orgId: z.string(),
  description: z.string(),
  task: z.enum(taskTypes),
  color: z.string(),
  visibility: z.string(),
  region: z.string(),
  updatedAt: z.number(),
})
const datasetSchema = z.object({
  ...base,
  projectId: z.string(),
  split: z.enum(['Train', 'Validation', 'Test', 'Unsplit']),
  items: z.number().nonnegative(),
  size: z.string(),
  classes: z.number(),
  status: z.enum(['Ready', 'Processing', 'Error']),
  version: z.number(),
  files: z.array(z.string()),
  readyAt: z.number().optional(),
})
const runSchema = z.object({
  ...base,
  projectId: z.string(),
  datasetId: z.string(),
  architecture: z.string(),
  status: z.enum(['Queued', 'Running', 'Completed', 'Failed', 'Stopped']),
  epochs: z.number().int().positive(),
  progress: z.number().min(0).max(100),
  accuracy: z.number(),
  batchSize: z.number(),
  learningRate: z.string(),
  augmentations: z.array(z.string()),
  earlyStopping: z.boolean(),
  compute: z.string(),
  startedAt: z.number(),
  duration: z.number().positive(),
  author: z.string(),
})
const modelSchema = z.object({
  ...base,
  projectId: z.string(),
  runId: z.string(),
  version: z.number(),
  accuracy: z.number(),
  f1: z.number(),
  size: z.string(),
  stage: z.enum(['Production', 'Staging', 'Archived']),
  architecture: z.string(),
})
const deploymentSchema = z.object({
  ...base,
  projectId: z.string(),
  modelId: z.string(),
  status: z.enum(['Live', 'Paused', 'Deploying']),
  environment: z.enum(['Production', 'Staging', 'Batch', 'Edge']),
  requests: z.number(),
  latency: z.number(),
  errors: z.number(),
  cost: z.number(),
  minReplicas: z.number().int().min(1),
  maxReplicas: z.number().int().max(20),
  concurrency: z.number().int().positive(),
  readyAt: z.number().optional(),
})
const activitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  text: z.string(),
  kind: z.enum(['dataset', 'training', 'deployment', 'project']),
  resourceId: z.string(),
  time: z.number(),
})
export const stateSchema = z
  .object({
    version: z.literal(1),
    orgId: z.string(),
    selectedProjectId: z.string(),
    organizations: z.array(organizationSchema).min(1),
    projects: z.array(projectSchema),
    datasets: z.array(datasetSchema),
    runs: z.array(runSchema),
    models: z.array(modelSchema),
    deployments: z.array(deploymentSchema),
    activities: z.array(activitySchema),
    onboardingDismissed: z.boolean(),
  })
  .refine((s) => {
    const project = (id: string) => s.projects.find((p) => p.id === id)
    return (
      s.organizations.some((o) => o.id === s.orgId) &&
      s.projects.every((p) => s.organizations.some((o) => o.id === p.orgId)) &&
      s.datasets.every((d) => project(d.projectId)) &&
      s.runs.every((r) =>
        s.datasets.some(
          (d) => d.id === r.datasetId && d.projectId === r.projectId,
        ),
      ) &&
      s.models.every((m) =>
        s.runs.some((r) => r.id === m.runId && r.projectId === m.projectId),
      ) &&
      s.deployments.every((d) =>
        s.models.some((m) => m.id === d.modelId && m.projectId === d.projectId),
      )
    )
  }, 'Invalid resource relationships')
export type Organization = z.infer<typeof organizationSchema>
export type Project = z.infer<typeof projectSchema>
export type Dataset = z.infer<typeof datasetSchema>
export type Run = z.infer<typeof runSchema>
export type Model = z.infer<typeof modelSchema>
export type Deployment = z.infer<typeof deploymentSchema>
export type DemoState = z.infer<typeof stateSchema>
export const STORAGE_KEY = 'drills-demo-v1'
export const id = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`
export const number = (n: number) => n.toLocaleString('en-US')
export const percent = (n: number) => `${(n * 100).toFixed(1)}%`
export const date = (n: number) =>
  new Date(n).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
export function seedState(now = Date.now()): DemoState {
  const organizations: Organization[] = [
    { id: 'acme', name: 'Acme AI', color: '#10b981', plan: 'Team plan' },
    {
      id: 'northwind',
      name: 'Northwind Labs',
      color: '#6366f1',
      plan: 'Enterprise plan',
    },
    { id: 'solo', name: 'Solo Sandbox', color: '#f59e0b', plan: 'Free plan' },
  ]
  const names = [
    'Retail Vision',
    'Support Triage',
    'Churn Predictor',
    'Defect Detection',
    'Doc Extractor',
    'Demand Forecast',
  ]
  const tasks: Project['task'][] = [
    'Image Classification',
    'Text Classification',
    'Tabular Prediction',
    'Object Detection',
    'Named Entity Recognition',
    'Time Series',
  ]
  const descriptions = [
    'Classify 240 SKU categories from shelf photos',
    'Route inbound tickets to the right queue automatically',
    'Predict 90-day subscriber churn from usage signals',
    'Find surface defects on production line imagery',
    'Extract fields from scanned invoices',
    'Weekly SKU-level demand forecasting',
  ]
  const projects: Project[] = names.map((name, i) => ({
    id: ['retail', 'support', 'churn', 'defects', 'docs', 'demand'][i],
    name,
    orgId: i < 4 ? 'acme' : 'northwind',
    description: descriptions[i],
    task: tasks[i],
    color: ['#6366f1', '#10b981', '#f59e0b', '#d946ef', '#0ea5e9', '#f43f5e'][
      i
    ],
    visibility: 'Organization',
    region: 'us-east-1',
    createdAt: now - 86400000 * 85,
    updatedAt: now - (i + 1) * 7200000,
  }))
  const datasets: Dataset[] = projects.flatMap((p, i) => [
    {
      id: `${p.id}-train`,
      projectId: p.id,
      name: i === 0 ? 'retail-shelf-train' : `${p.id}-train`,
      split: 'Train',
      items: i === 0 ? 18420 : 3200 + i * 1200,
      size: i === 0 ? '4.2 GB' : '520 MB',
      classes: i === 0 ? 240 : 12,
      status: 'Ready',
      version: 3,
      files: ['sample-001', 'sample-002'],
      createdAt: now - 86400000 * 12,
    },
    {
      id: `${p.id}-val`,
      projectId: p.id,
      name: `${p.id}-validation`,
      split: 'Validation',
      items: 2300,
      size: '520 MB',
      classes: i === 0 ? 240 : 12,
      status: 'Ready',
      version: 1,
      files: [],
      createdAt: now - 86400000 * 12,
    },
  ])
  datasets.push(
    {
      id: 'retail-test',
      projectId: 'retail',
      name: 'retail-shelf-test',
      split: 'Test',
      items: 2300,
      size: '518 MB',
      classes: 240,
      status: 'Ready',
      version: 1,
      files: [],
      createdAt: now - 86400000 * 12,
    },
    {
      id: 'retail-raw',
      projectId: 'retail',
      name: 'shelf-v2-raw',
      split: 'Unsplit',
      items: 31100,
      size: '7.8 GB',
      classes: 0,
      status: 'Processing',
      version: 1,
      files: [],
      createdAt: now - 7200000,
      readyAt: now + 90000,
    },
    {
      id: 'retail-legacy',
      projectId: 'retail',
      name: 'legacy-import',
      split: 'Train',
      items: 940,
      size: '180 MB',
      classes: 12,
      status: 'Error',
      version: 1,
      files: [],
      createdAt: now - 86400000 * 3,
    },
  )
  const makeRun = (
    p: Project,
    name: string,
    architecture: string,
    status: Run['status'],
    accuracy: number,
    i: number,
  ): Run => ({
    id: `${p.id}-run-${i}`,
    projectId: p.id,
    datasetId: `${p.id}-train`,
    name,
    architecture,
    status,
    epochs: 30,
    progress: status === 'Completed' ? 100 : status === 'Running' ? 40 : 0,
    accuracy,
    batchSize: 32,
    learningRate: '1e-3',
    augmentations: ['Random flip', 'Random crop', 'Rotation ±15°'],
    earlyStopping: true,
    compute: '1× A10G',
    author: i % 2 ? 'AR' : 'PN',
    createdAt: now - i * 3600000,
    startedAt: status === 'Running' ? now - 720000 : now,
    duration: 1800000,
  })
  const runs: Run[] = [
    makeRun(
      projects[0],
      'efficientnet-b4',
      'EfficientNet-B4',
      'Running',
      0.912,
      24,
    ),
    makeRun(projects[0], 'resnet50-v3', 'ResNet-50', 'Completed', 0.942, 23),
    makeRun(projects[0], 'vit-base-lr3', 'ViT-Base/16', 'Failed', 0, 22),
    makeRun(
      projects[0],
      'convnext-tiny',
      'ConvNeXt-Tiny',
      'Completed',
      0.928,
      21,
    ),
    makeRun(
      projects[0],
      'resnet50-baseline',
      'ResNet-50',
      'Completed',
      0.881,
      18,
    ),
    makeRun(projects[0], 'mobilenet-v3', 'MobileNetV3', 'Queued', 0, 25),
    ...projects
      .slice(1)
      .map((p, i) =>
        makeRun(
          p,
          [
            'bert-triage-v2',
            'xgboost-v1',
            'yolov8-defect',
            'bert-ner',
            'forecast-v1',
          ][i],
          ['BERT', 'XGBoost', 'YOLOv8', 'BERT', 'LSTM'][i],
          i === 0 || i === 2 ? 'Running' : 'Completed',
          0.91 + i * 0.004,
          1,
        ),
      ),
  ]
  const models: Model[] = runs
    .filter((r) => r.status === 'Completed')
    .map((r, i) => ({
      id: `model-${r.id}`,
      projectId: r.projectId,
      runId: r.id,
      name: r.name,
      version: i === 0 ? 3 : 1,
      accuracy: r.accuracy,
      f1: r.accuracy - 0.007,
      size: i === 1 ? '112 MB' : '98 MB',
      stage: i === 0 ? 'Production' : 'Staging',
      architecture: r.architecture,
      createdAt: r.createdAt,
    }))
  const deployments: Deployment[] = [
    {
      id: 'retail-prod',
      name: 'retail-classify-prod',
      modelId: models[0].id,
      status: 'Live',
      environment: 'Production',
      requests: 142380,
      latency: 140,
      errors: 0.11,
      cost: 12.4,
    },
    {
      id: 'retail-canary',
      name: 'retail-classify-canary',
      modelId: models[1].id,
      status: 'Live',
      environment: 'Staging',
      requests: 8200,
      latency: 96,
      errors: 0.04,
      cost: 3.1,
    },
    {
      id: 'retail-batch',
      name: 'batch-nightly',
      modelId: models[2].id,
      status: 'Paused',
      environment: 'Batch',
      requests: 0,
      latency: 0,
      errors: 0,
      cost: 0,
    },
  ].map((d) => ({
    ...d,
    projectId: 'retail',
    minReplicas: 1,
    maxReplicas: 10,
    concurrency: 40,
    createdAt: now - 86400000,
  })) as Deployment[]
  return {
    version: 1,
    orgId: 'acme',
    selectedProjectId: 'retail',
    organizations,
    projects,
    datasets,
    runs,
    models,
    deployments,
    activities: [
      {
        id: 'a1',
        projectId: 'retail',
        text: 'Training resnet50-v3 completed — 94.2% accuracy',
        kind: 'training',
        resourceId: 'retail-run-23',
        time: now - 720000,
      },
      {
        id: 'a2',
        projectId: 'retail',
        text: 'Dataset retail-shelf-train finished processing (18,420 items)',
        kind: 'dataset',
        resourceId: 'retail-train',
        time: now - 3600000,
      },
      {
        id: 'a3',
        projectId: 'retail',
        text: 'Endpoint retail-classify-prod scaled to 3 replicas',
        kind: 'deployment',
        resourceId: 'retail-prod',
        time: now - 7200000,
      },
      {
        id: 'a4',
        projectId: 'retail',
        text: 'Training vit-base-lr3 failed — CUDA out of memory',
        kind: 'training',
        resourceId: 'retail-run-22',
        time: now - 14400000,
      },
      {
        id: 'a5',
        projectId: 'retail',
        text: 'Project Retail Vision updated by Alex Rivera',
        kind: 'project',
        resourceId: 'retail',
        time: now - 86400000,
      },
    ],
    onboardingDismissed: false,
  }
}
export function addActivity(
  s: DemoState,
  projectId: string,
  text: string,
  kind: DemoState['activities'][number]['kind'],
  resourceId: string,
  now = Date.now(),
) {
  s.activities.unshift({
    id: `${kind}-${resourceId}-${now}`,
    projectId,
    text,
    kind,
    resourceId,
    time: now,
  })
  s.activities = s.activities.slice(0, 80)
  const p = s.projects.find((item) => item.id === projectId)
  if (p) p.updatedAt = now
}
export function advanceSimulation(previous: DemoState, now: number): DemoState {
  const s = structuredClone(previous)
  let changed = false
  for (const d of s.datasets)
    if (d.status === 'Processing' && d.readyAt && now >= d.readyAt) {
      d.status = 'Ready'
      d.classes = d.classes || 12
      changed = true
      addActivity(
        s,
        d.projectId,
        `Dataset ${d.name} finished processing`,
        'dataset',
        d.id,
        now,
      )
    }
  for (const r of s.runs)
    if (r.status === 'Running' || r.status === 'Queued') {
      const elapsed = now - r.startedAt
      const progress = Math.min(
        100,
        Math.max(0, Math.floor((elapsed / r.duration) * 100)),
      )
      if (
        progress !== r.progress ||
        (r.status === 'Queued' && elapsed > 2000)
      ) {
        r.progress = progress
        r.status =
          progress === 100 ? 'Completed' : elapsed > 2000 ? 'Running' : 'Queued'
        r.accuracy = 0.412 + (0.53 * progress) / 100
        changed = true
        if (
          r.status === 'Completed' &&
          !s.models.some((m) => m.runId === r.id)
        ) {
          s.models.unshift({
            id: `model-${r.id}`,
            projectId: r.projectId,
            runId: r.id,
            name: r.name,
            version: 1,
            accuracy: r.accuracy,
            f1: r.accuracy - 0.007,
            size: '98 MB',
            stage: 'Staging',
            architecture: r.architecture,
            createdAt: now,
          })
          addActivity(
            s,
            r.projectId,
            `Training ${r.name} completed — ${percent(r.accuracy)} accuracy`,
            'training',
            r.id,
            now,
          )
        }
      }
    }
  for (const d of s.deployments)
    if (d.status === 'Deploying' && d.readyAt && now >= d.readyAt) {
      d.status = 'Live'
      d.latency = 82
      changed = true
      addActivity(
        s,
        d.projectId,
        `Deployment ${d.name} is live`,
        'deployment',
        d.id,
        now,
      )
    }
  return changed ? s : previous
}
export function restoreState(raw: string | null, now: number) {
  if (!raw) return { state: seedState(now), recovered: false }
  try {
    const result = stateSchema.safeParse(JSON.parse(raw))
    if (result.success)
      return { state: advanceSimulation(result.data, now), recovered: false }
  } catch {
    /* Invalid JSON is replaced with the demo seed. */
  }
  return { state: seedState(now), recovered: true }
}
