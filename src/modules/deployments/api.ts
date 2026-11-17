import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap, type Schemas } from '@/shared/api/client';

export type DeploymentDetail = Schemas['DeploymentDetail'];
export type DeploymentSchema = Schemas['DeploymentSchema'];

const deploymentsKey = (projectId: string) => ['project', projectId, 'deployments'] as const;
const deploymentKey = (projectId: string, deploymentId: string) => [...deploymentsKey(projectId), deploymentId] as const;
const pathOf = (projectId: string, deploymentId: string) => ({ path: { project_id: projectId, deployment_id: deploymentId } });

export function useDeployment(projectId: string, deploymentId: string) {
  return useQuery({
    queryKey: deploymentKey(projectId, deploymentId),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/deployments/{deployment_id}', { params: pathOf(projectId, deploymentId) })),
  });
}

/** How callers send a request to the deployment: its input and output shape, and ready-to-run snippets. */
export function useDeploymentSchema(projectId: string, deploymentId: string) {
  return useQuery({
    queryKey: [...deploymentKey(projectId, deploymentId), 'schema'],
    queryFn: () =>
      unwrap(client.GET('/v1/projects/{project_id}/deployments/{deployment_id}/schema', { params: pathOf(projectId, deploymentId) })),
  });
}

/** Start or stop changes the status; the list and the page both refetch. */
function useDeploymentAction(projectId: string, action: 'start' | 'stop') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deploymentId: string) =>
      action === 'start'
        ? unwrap(client.POST('/v1/projects/{project_id}/deployments/{deployment_id}/start', { params: pathOf(projectId, deploymentId) }))
        : unwrap(client.POST('/v1/projects/{project_id}/deployments/{deployment_id}/stop', { params: pathOf(projectId, deploymentId) })),
    onSuccess: () => qc.invalidateQueries({ queryKey: deploymentsKey(projectId) }),
  });
}

export const useStartDeployment = (projectId: string) => useDeploymentAction(projectId, 'start');
export const useStopDeployment = (projectId: string) => useDeploymentAction(projectId, 'stop');

export function useDeleteDeployment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deploymentId: string) =>
      unwrap(client.DELETE('/v1/projects/{project_id}/deployments/{deployment_id}', { params: pathOf(projectId, deploymentId) })),
    onSuccess: () => qc.invalidateQueries({ queryKey: deploymentsKey(projectId) }),
  });
}

/** Deploys a finished run's model. `acknowledgeRisk` is for runs the API flags (no held-out test split). */
export function useCreateDeployment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, acknowledgeRisk }: { runId: string; acknowledgeRisk: boolean }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/deployments', {
          params: {
            path: { project_id: projectId },
            query: { training_run_id: runId, acknowledge_risk: acknowledgeRisk },
            // One key per attempt: a retried request replays the first answer instead of creating a second deployment.
            header: { 'Idempotency-Key': crypto.randomUUID() },
          },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: deploymentsKey(projectId) }),
  });
}
