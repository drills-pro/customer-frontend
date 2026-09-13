import { Badge, BadgeDot } from '@/components/ui/badge'
import type { Dataset } from '@/features/dashboard/data'

const tone = {
  Ready: 'success',
  Processing: 'info',
  Error: 'error',
} as const

export function StatusBadge({ status }: { status: Dataset['status'] }) {
  return (
    <Badge variant={tone[status]}>
      <BadgeDot />
      {status}
    </Badge>
  )
}
