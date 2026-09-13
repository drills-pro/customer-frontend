import type { DashboardPreferences, Project, ProjectOverview } from './types'
import { createResourceUsage, defaultTeam } from '../data/projects'
import { allProjects } from '../selectors/projects'

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
    updatedAt: Date.now(),
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
