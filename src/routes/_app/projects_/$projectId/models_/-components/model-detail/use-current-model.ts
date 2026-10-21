import { getRouteApi } from '@tanstack/react-router';

import { useProjectDetail } from '@/features/dashboard/context';
import { useDeployments } from '@/features/deployments/queries';
import { useModel } from '@/features/models/queries';

const route = getRouteApi('/_app/projects_/$projectId/models_/$modelId');

/**
 * The model of the current page, read from the cache the route filled. The
 * route renders loading and not-found before anything calls this.
 */
export function useCurrentModel() {
  const { modelId } = route.useParams();
  const { project } = useProjectDetail();
  const result = useModel(project.id, modelId).data;
  const deployments = useDeployments(project.id).data;
  if (!result) throw new Error(`Model ${modelId} not found`);
  return {
    project,
    ...result,
    /** The deployment serving this version; absent while deployments load. */
    deployment: deployments?.find((item) => item.id === result.model.deploymentId),
  };
}
