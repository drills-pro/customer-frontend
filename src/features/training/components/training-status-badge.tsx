import { ToneBadge } from '@/components/shared/tone-badge';
import type { TrainingRunStatus } from '@/features/dashboard/data';

export function TrainingStatusBadge({ status }: { status: TrainingRunStatus }) {
  const running = status === 'Running';
  const tone = running ? 'info' : status === 'Failed' ? 'error' : 'neutral';

  return (
    <ToneBadge tone={tone} dot pulse={running}>
      {status}
    </ToneBadge>
  );
}
