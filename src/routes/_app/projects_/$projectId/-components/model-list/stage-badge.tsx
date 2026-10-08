import { Badge, BadgeDot } from '@/components/ui/badge'
import type { ModelStage } from '@/features/dashboard/data'

const tone = {
  Production: 'success',
  Staging: 'warning',
  Archived: 'neutral',
} as const

export const stageOptions: ModelStage[] = ['Production', 'Staging', 'Archived']

export function StageBadge({ stage }: { stage: ModelStage }) {
  return (
    <Badge variant={tone[stage]}>
      <BadgeDot />
      {stage}
    </Badge>
  )
}
