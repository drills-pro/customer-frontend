import { Badge, BadgeDot } from '@/components/ui/badge'

const tone = {
  Live: 'success',
  Paused: 'warning',
  Running: 'info',
  Completed: 'success',
  Stopped: 'neutral',
} as const

export function DashboardStatusBadge({
  status,
}: {
  status: keyof typeof tone
}) {
  return (
    <Badge variant={tone[status]}>
      <BadgeDot />
      {status}
    </Badge>
  )
}
