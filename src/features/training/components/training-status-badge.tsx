import { Badge, BadgeDot } from '@/components/ui/badge'
import type { TrainingRunStatus } from '@/features/dashboard/data'

export function TrainingStatusBadge({ status }: { status: TrainingRunStatus }) {
  const running = status === 'Running'

  return (
    <Badge variant={running ? 'info' : 'neutral'}>
      <BadgeDot className={running ? 'animate-pulse' : undefined} />
      {status}
    </Badge>
  )
}
