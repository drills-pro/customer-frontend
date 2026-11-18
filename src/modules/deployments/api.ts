import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { deploymentsKey, fetchDeployments } from '@/modules/projects';
import { client, unwrap, type Schemas } from '@/shared/api/client';
import { IDEMPOTENCY_HEADER } from '@/shared/api/idempotency';
import { usePolledQuery } from '@/shared/api/poll';
import { TEST_CALL_LIMIT } from '@/modules/deployments/constants';
import { statusUi } from '@/modules/deployments/status';

export type Deployment = Schemas['DeploymentDetail'];
export type DeploymentCreated = Schemas['DeploymentCreated'];
export type DeploymentSchema = Schemas['DeploymentSchema'];
export type TestCall = Schemas['TestCall'];

const deploymentKey = (projectId: string, deploymentId: string) => ['project', projectId, 'deployment', deploymentId] as const;
const schemaKey = (projectId: string, deploymentId: string) => [...deploymentKey(projectId, deploymentId), 'schema'] as const;
const testCallsKey = (projectId: string, deploymentId: string) => [...deploymentKey(projectId, deploymentId), 'test-calls'] as const;
const lineageKey = (projectId: string, runId: string) => ['project', projectId, 'training', 'run', runId, 'lineage'] as const;

const deploymentPath = (projectId: string, deploymentId: string) => ({ path: { project_id: projectId, deployment_id: deploymentId } });

/** A deployment changed: its page gets the answer, the list (and the overview's Deploy stage) refetches. */
const settle = (qc: QueryClient, workspaceId: string, projectId: string, deployment?: Deployment) => {
  if (deployment) qc.setQueryData(deploymentKey(projectId, deployment.id), deployment);
  return qc.invalidateQueries({ queryKey: deploymentsKey(workspaceId, projectId) });
};

/** The project's deployments (the overview's query), polled while any of them is still deploying. */
export function useDeploymentList(workspaceId: string, projectId: string) {
  return usePolledQuery({
    queryKey: deploymentsKey(workspaceId, projectId),
    queryFn: () => fetchDeployments(projectId),
    shouldPoll: (list) => list?.some((d) => statusUi(d.status).poll) ?? false,
  });
}

/** One deployment, polled while it is deploying. */
export function useDeployment(projectId: string, deploymentId: string) {
  return usePolledQuery({
    queryKey: deploymentKey(projectId, deploymentId),
    queryFn: () =>
      unwrap(client.GET('/v1/projects/{project_id}/deployments/{deployment_id}', { params: deploymentPath(projectId, deploymentId) })),
    shouldPoll: (d) => d !== undefined && statusUi(d.status).poll,
  });
}

/** Deploy a model version (one deployment serves exactly one). `runId` is the run it came from, whose lineage is refetched. The key is
 * made once per attempt by the caller, so a retry replays the first answer instead of minting a second deployment. `acknowledgeRisk` is
 * sent once the person accepted that a run without a test split has unchecked scores. */
export function useCreateDeployment(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, key, acknowledgeRisk }: { versionId: string; runId: string; key: string; acknowledgeRisk: boolean }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/deployments', {
          params: {
            path: { project_id: projectId },
            query: { model_version_id: versionId, acknowledge_risk: acknowledgeRisk },
            header: { [IDEMPOTENCY_HEADER]: key },
          },
        }),
      ),
    onSuccess: (_created, { runId }) => {
      void qc.invalidateQueries({ queryKey: lineageKey(projectId, runId) });
      return settle(qc, workspaceId, projectId);
    },
  });
}

/** Stop serving (the key stays valid) or serve again. */
export function useMoveDeployment(workspaceId: string, projectId: string, deploymentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (to: 'stop' | 'start') =>
      unwrap(
        to === 'stop'
          ? client.POST('/v1/projects/{project_id}/deployments/{deployment_id}/stop', { params: deploymentPath(projectId, deploymentId) })
          : client.POST('/v1/projects/{project_id}/deployments/{deployment_id}/start', { params: deploymentPath(projectId, deploymentId) }),
      ),
    onSuccess: (deployment) => settle(qc, workspaceId, projectId, deployment),
    // A 409 means someone else moved it first: the server state wins.
    onError: () => void qc.invalidateQueries({ queryKey: deploymentKey(projectId, deploymentId) }),
  });
}

/** Soft delete: the endpoint and its key stop working and it leaves the list. The caller navigates away with `mutateAsync`. */
export function useDeleteDeployment(workspaceId: string, projectId: string, deploymentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(client.DELETE('/v1/projects/{project_id}/deployments/{deployment_id}', { params: deploymentPath(projectId, deploymentId) })),
    onSuccess: () => {
      qc.removeQueries({ queryKey: deploymentKey(projectId, deploymentId) });
      return settle(qc, workspaceId, projectId);
    },
  });
}

/** What the endpoint takes and answers, with ready-to-paste call snippets. Read once it serves (the model is known by then). */
export function useDeploymentSchema(projectId: string, deploymentId: string, enabled: boolean) {
  return useQuery({
    queryKey: schemaKey(projectId, deploymentId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/deployments/{deployment_id}/schema', { params: deploymentPath(projectId, deploymentId) }),
      ),
    enabled,
    retry: false,
  });
}

/** The in-app "try it": the real POST /v1/predict, with the signed-in session instead of a key. The call is stored, tagged as made from
 * the console, and counts toward usage like any other. `model` is what the deployment's schema names (`model_id`, `model_revision`). */
export function useTestDeployment(projectId: string, deploymentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ model, body }: { model: Pick<DeploymentSchema, 'model_id' | 'model_revision'>; body: Record<string, unknown> }) =>
      unwrap(
        client.POST('/v1/predict', {
          params: {
            header: { 'X-Model-Id': model.model_id, 'X-Model-Revision': model.model_revision, 'x-project-id': projectId },
          },
          // The route reads the JSON body itself; the spec leaves it untyped.
          body: body as never,
        }),
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: testCallsKey(projectId, deploymentId) }),
  });
}

/** The latest console predictions of the deployment (the try-it log), newest first. */
export function useTestCalls(projectId: string, deploymentId: string) {
  return useQuery({
    queryKey: testCallsKey(projectId, deploymentId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/deployments/{deployment_id}/test-calls', {
          params: { ...deploymentPath(projectId, deploymentId), query: { limit: TEST_CALL_LIMIT } },
        }),
      ),
  });
}

/** Where a run went: its deployment, if it has a live one. */
export function useRunLineage(projectId: string, runId: string) {
  return useQuery({
    queryKey: lineageKey(projectId, runId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/training-runs/{run_id}/lineage', {
          params: { path: { project_id: projectId, run_id: runId } },
        }),
      ),
    retry: false,
  });
}
