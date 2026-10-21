import { Badge } from '@chakra-ui/react';
import type { DeploymentEnvironment, DeploymentStatus } from '@/features/dashboard/data';

export const statusOptions: DeploymentStatus[] = ['Live', 'Deploying', 'Paused'];
export const environmentOptions: DeploymentEnvironment[] = ['Production', 'Staging', 'Batch', 'Edge'];

/**
 * An environment is a label, not a state, so it stays uncolored — the status
 * badge beside it is the one carrying meaning.
 */
export function EnvironmentBadge({ environment }: { environment: DeploymentEnvironment }) {
  return (
    <Badge colorPalette="gray" variant="outline" fontWeight="normal">
      {environment}
    </Badge>
  );
}
