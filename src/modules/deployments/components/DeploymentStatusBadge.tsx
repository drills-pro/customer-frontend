import { Badge } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DeploymentStatus } from '@/modules/projects/constants';

const PALETTE: Record<string, string> = {
  [DeploymentStatus.Active]: 'success',
  [DeploymentStatus.Deploying]: 'warning',
  [DeploymentStatus.Failed]: 'danger',
  [DeploymentStatus.Deleted]: 'gray',
};

/** A deployment's status word, colored. Unknown statuses show as they come, in gray. */
export function DeploymentStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge colorPalette={PALETTE[status] ?? 'gray'} variant="subtle" data-testid="deployment-status" data-status={status}>
      {t(`deployments.status.${status}`, { defaultValue: status })}
    </Badge>
  );
}
