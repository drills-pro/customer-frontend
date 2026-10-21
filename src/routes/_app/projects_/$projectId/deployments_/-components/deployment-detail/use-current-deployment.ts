import { getRouteApi } from '@tanstack/react-router';

import { useProjectDetail } from '@/features/dashboard/context';
import { useDeployment } from '@/features/deployments/queries';
import { useModels } from '@/features/models/queries';

const route = getRouteApi('/_app/projects_/$projectId/deployments_/$deploymentId');

/**
 * The deployment of the current page, read from the cache the route filled.
 * The route renders loading and not-found before anything calls this.
 */
export function useCurrentDeployment() {
  const { deploymentId } = route.useParams();
  const { project } = useProjectDetail();
  const deployment = useDeployment(project.id, deploymentId).data;
  const models = useModels(project.id).data;
  if (!deployment) throw new Error(`Deployment ${deploymentId} not found`);
  return {
    project,
    deployment,
    /** The model being served; absent while the project's models load. */
    model: models?.find((item) => item.id === deployment.modelId),
  };
}
