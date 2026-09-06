import { createFileRoute } from '@tanstack/react-router'
import { DeploymentDetail } from '../features/drills/Deployment'

export const Route = createFileRoute(
  '/projects/$projectId/deployments/$deploymentId',
)({ component: DeploymentDetail })
