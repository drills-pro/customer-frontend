import { Badge, BadgeDot } from '@/components/ui/badge'
import type { TrainingRun } from '@/features/dashboard/data'

export function StatusBadge({ status }: { status: TrainingRun['status'] }) {
  const running = status === 'Running'

  return (
    <Badge variant={running ? 'info' : 'neutral'}>
      <BadgeDot className={running ? 'animate-pulse' : undefined} />
      {status}
    </Badge>
  )
}
