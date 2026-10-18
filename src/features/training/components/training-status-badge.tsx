import { Badge, BadgeDot } from '@/components/ui/badge'
import type { TrainingRunStatus } from '@/features/dashboard/data'

export function TrainingStatusBadge({ status }: { status: TrainingRunStatus }) {
  const running = status === 'Running'
  const variant = running ? 'info' : status === 'Failed' ? 'error' : 'neutral'

  return (
    <Badge variant={variant}>
      <BadgeDot className={running ? 'animate-pulse' : undefined} />
      {status}
    </Badge>
  )
}
