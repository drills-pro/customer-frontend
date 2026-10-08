/**
 * Data hooks for dashboard sections.
 *
 * Each section component reads its own data through these instead of taking
 * it from the page. They wrap the local selectors today; swap a hook's body for
 * an API query and every section using it follows, with pages untouched.
 */
import { useNow } from '@/hooks/use-now'
import { useDashboardLayout } from './context'
import {
  activities,
  allProjects,
  datasetDetails,
  datasets as seededDatasets,
  fallbackDetail,
  fallbackModelDetail,
  modelDetails,
} from './data'
import {
  orgDeployments,
  projectDeployments,
  resolveDeployment,
} from './selectors/deployments'
import { modelVersions, resolveModel } from './selectors/models'
import {
  liveRun,
  orgTrainingRuns,
  resolveTrainingRun,
} from './selectors/training-runs'

export function useOrgProjects() {
  const { preferences, org } = useDashboardLayout()
  return allProjects(preferences).filter((project) => project.orgId === org.id)
}

export function useOrgTrainingRuns() {
  const { preferences, org } = useDashboardLayout()
  return orgTrainingRuns(preferences, org.id)
}

export function useOrgDeployments() {
  const { preferences, org } = useDashboardLayout()
  return orgDeployments(preferences, org.id)
}

export function useOrgActivity() {
  const { preferences, org } = useDashboardLayout()
  return [...preferences.uploads, ...activities].filter(
    (item) => item.orgId === org.id,
  )
}

/** Uploaded datasets first, then seeded ones, without duplicate ids. */
export function useProjectDatasets(
  projectId: string,
  { readyOnly = false }: { readyOnly?: boolean } = {},
) {
  const { preferences } = useDashboardLayout()
  return [...preferences.datasets, ...seededDatasets].filter(
    (dataset, index, all) =>
      dataset.projectId === projectId &&
      (!readyOnly || dataset.status === 'Ready') &&
      all.findIndex((candidate) => candidate.id === dataset.id) === index,
  )
}

export function useDataset(projectId: string, datasetId: string) {
  const dataset = useProjectDatasets(projectId).find(
    (item) => item.id === datasetId,
  )
  if (!dataset) return undefined
  return {
    dataset,
    detail: datasetDetails[dataset.id] ?? fallbackDetail(dataset),
  }
}

export function useModel(projectId: string, modelId: string) {
  const model = resolveModel(projectId, modelId)
  if (!model) return undefined
  return {
    model,
    versions: modelVersions(model),
    detail: modelDetails[model.id] ?? fallbackModelDetail(model),
    deployment: projectDeployments(projectId).find(
      (item) => item.modelId === model.id,
    ),
  }
}

export function useDeployment(projectId: string, deploymentId: string) {
  const deployment = resolveDeployment(projectId, deploymentId)
  if (!deployment) return undefined
  return { deployment, model: resolveModel(projectId, deployment.modelId) }
}

/**
 * A run merged with its time-derived progress, so it re-renders every second
 * while training.
 */
export function useTrainingRun(projectId: string, runId: string) {
  const { preferences } = useDashboardLayout()
  const now = useNow()
  const datasets = useProjectDatasets(projectId)
  const stored = resolveTrainingRun(preferences, projectId, runId)
  if (!stored) return undefined
  return {
    stored,
    run: liveRun(stored, now),
    dataset: datasets.find((item) => item.id === stored.datasetId),
  }
}
