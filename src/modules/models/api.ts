import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap, type Schemas } from '@/shared/api/client';

export type ModelVersion = Schemas['ModelVersionItem'];
export type ModelStage = Schemas['ModelStage'];

/** The stages a version can be moved to, in the order the table offers them; each is also its `models.stage.*` key. */
export const MODEL_STAGES: readonly ModelStage[] = ['None', 'Staging', 'Production', 'Archived'];

export const modelsKey = (projectId: string) => ['project', projectId, 'models'] as const;
const projectPath = (projectId: string) => ({ path: { project_id: projectId } });

/** The project's registered model versions, newest first. */
export function useModels(projectId: string) {
  return useQuery({
    queryKey: modelsKey(projectId),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/models', { params: projectPath(projectId) })),
  });
}

/** Whether the version is listed for others to see, and whether its metadata and artifact are published with it. */
export function usePublishModel(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, publish }: { versionId: string; publish: boolean }) =>
      unwrap(
        client.PATCH('/v1/projects/{project_id}/models/{model_version_id}/publish', {
          params: { path: { project_id: projectId, model_version_id: versionId } },
          body: { publish_metadata: publish, publish_artifact: publish },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelsKey(projectId) }),
  });
}

export function usePromoteModel(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, stage }: { versionId: string; stage: ModelStage }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/models/{model_version_id}/promote', {
          params: { path: { project_id: projectId, model_version_id: versionId }, query: { stage } },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelsKey(projectId) }),
  });
}

/** Registers a finished run's model under `name`; the new version appears in the list. */
export function useRegisterModel(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, name }: { runId: string; name: string }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/models/{run_id}/register', {
          params: { path: { project_id: projectId, run_id: runId }, query: { name } },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelsKey(projectId) }),
  });
}
