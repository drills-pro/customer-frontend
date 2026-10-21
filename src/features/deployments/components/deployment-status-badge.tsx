import { ToneBadge } from '@/components/shared/tone-badge';
import type { DeploymentStatus } from '@/features/dashboard/data';

const deploymentTone = {
  Live: 'success',
  Deploying: 'warning',
  Paused: 'neutral',
} as const;

export function DeploymentStatusBadge({ status }: { status: DeploymentStatus }) {
  return (
    <ToneBadge tone={deploymentTone[status]} dot pulse={status === 'Live'}>
      {status}
    </ToneBadge>
  );
}
