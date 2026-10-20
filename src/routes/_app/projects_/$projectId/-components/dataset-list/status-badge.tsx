import { ToneBadge } from '@/components/shared/tone-badge'
import type { Dataset } from '@/features/dashboard/data'

const tone = {
  Ready: 'success',
  Processing: 'info',
  Error: 'error',
} as const

export function StatusBadge({ status }: { status: Dataset['status'] }) {
  return (
    <ToneBadge tone={tone[status]} dot>
      {status}
    </ToneBadge>
  )
}
