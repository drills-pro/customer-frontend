import { Badge, BadgeDot } from '@/components/ui/badge'
import type { DeploymentStatus } from '@/features/dashboard/data'

const deploymentTone = {
  Live: 'success',
  Deploying: 'warning',
  Paused: 'neutral',
} as const

export function DeploymentStatusBadge({
  status,
}: {
  status: DeploymentStatus
}) {
  return (
    <Badge variant={deploymentTone[status]}>
      <BadgeDot className={status === 'Live' ? 'animate-pulse' : undefined} />
      {status}
    </Badge>
  )
}
