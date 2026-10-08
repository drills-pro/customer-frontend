import { deployments } from '@/features/dashboard/data/deployments'
import { allProjects } from '@/features/dashboard/selectors/projects'
import type {
  DashboardPreferences,
  Deployment,
} from '@/features/dashboard/data'

/** Every deployment in one project. Live ones first, so problems surface. */
export function projectDeployments(projectId: string): Deployment[] {
  const rank = { Live: 0, Deploying: 1, Paused: 2 } as const
  return deployments
    .filter((item) => item.projectId === projectId)
    .sort((left, right) => rank[left.status] - rank[right.status])
}

export function resolveDeployment(
  projectId: string,
  deploymentId: string,
): Deployment | undefined {
  return deployments.find(
    (item) => item.id === deploymentId && item.projectId === projectId,
  )
}

/**
 * Deployments key on `projectId`, so the org filter resolves through the
 * projects the workspace currently has — the same shape as `orgTrainingRuns`.
 */
export function orgDeployments(
  preferences: DashboardPreferences,
  orgId: string,
): Deployment[] {
  const orgProjectIds = new Set(
    allProjects(preferences)
      .filter((project) => project.orgId === orgId)
      .map((project) => project.id),
  )
  return deployments.filter((item) => orgProjectIds.has(item.projectId))
}
