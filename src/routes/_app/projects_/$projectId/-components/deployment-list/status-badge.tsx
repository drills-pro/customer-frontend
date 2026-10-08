import { Badge } from '@/components/ui/badge'
import type {
  DeploymentEnvironment,
  DeploymentStatus,
} from '@/features/dashboard/data'

export const statusOptions: DeploymentStatus[] = ['Live', 'Deploying', 'Paused']
export const environmentOptions: DeploymentEnvironment[] = [
  'Production',
  'Staging',
  'Batch',
  'Edge',
]

/**
 * An environment is a label, not a state, so it stays uncolored — the status
 * badge beside it is the one carrying meaning.
 */
export function EnvironmentBadge({
  environment,
}: {
  environment: DeploymentEnvironment
}) {
  return (
    <Badge variant="outline" className="font-normal">
      {environment}
    </Badge>
  )
}
