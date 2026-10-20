import { ToneBadge } from '@/components/shared/tone-badge'
import type { ModelStage } from '@/features/dashboard/data'

const tone = {
  Production: 'success',
  Staging: 'warning',
  Archived: 'neutral',
} as const

export const stageOptions: ModelStage[] = ['Production', 'Staging', 'Archived']

export function StageBadge({ stage }: { stage: ModelStage }) {
  return (
    <ToneBadge tone={tone[stage]} dot>
      {stage}
    </ToneBadge>
  )
}
