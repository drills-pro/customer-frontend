import { getRouteApi } from '@tanstack/react-router'

import { useProjectDetail } from '@/features/dashboard/context'
import { useDeployment } from '@/features/dashboard/hooks'

const route = getRouteApi(
  '/_app/projects_/$projectId/deployments_/$deploymentId',
)

/** The deployment of the current page. The route renders not-found before this runs. */
export function useCurrentDeployment() {
  const { deploymentId } = route.useParams()
  const { project } = useProjectDetail()
  const result = useDeployment(project.id, deploymentId)
  if (!result) throw new Error(`Deployment ${deploymentId} not found`)
  return { project, ...result }
}
