import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deploymentsKey } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { client, unwrap, type Schemas } from '@/shared/api/client';
import { usePolledQuery } from '@/shared/api/poll';

/** Field the list gains with the run link. */
interface NewListFields {
  training_run_id: string;
}
// shortcut: the API does not send these yet (the core-api change is unpushed), so they are declared here and optional; take them from
// the schema once it has them.
export type ModelVersion = Schemas['ModelVersionItem'] & Partial<NewListFields>;
export type ModelStage = Schemas['ModelStage'];

/** The stages a person sets by hand, in the order the table offers them; each is also its `models.move.*` key (the menu item that sets it). Production is not one of
 * them: a version gets there by being promoted, which deploys it (the serving version is never moved down, only replaced). */
export const MODEL_STAGES: readonly ModelStage[] = ['None', 'Staging', 'Archived'];

/** `promotion_status` of a version whose promotion to Production has not finished. Mirrors core-api (model_registry/constants.py). */
export const PromotionStatus = { Pending: 'pending', Failed: 'failed' } as const;

/** The version is being deployed; until that deployment is active the version that was serving keeps serving. */
export const isPromoting = (v: ModelVersion) => v.promotion_status === PromotionStatus.Pending;
/** The version a model's calls are answered with: its one Production version. */
export const isServing = (v: ModelVersion) => v.stage === 'Production';
/** The version a model serves now, other than `v`. */
export const servingOf = (models: readonly ModelVersion[], v: ModelVersion) =>
  models.find((m) => m.model_id === v.model_id && isServing(m) && m.id !== v.id);
/** Promoting a version older than the one serving is a rollback. */
export const isRollback = (models: readonly ModelVersion[], v: ModelVersion) => {
  const serving = servingOf(models, v);
  return serving !== undefined && new Date(v.created_at) < new Date(serving.created_at);
};

export const modelsKey = (projectId: string) => ['project', projectId, 'models'] as const;
const projectPath = (projectId: string) => ({ path: { project_id: projectId } });

/** The project's registered model versions, newest first, polled while a promotion is being deployed. When it settles the deployments
 * list (which the promotion may have added to) is refetched too. */
export function useModels(projectId: string) {
  const qc = useQueryClient();
  const { id: workspaceId } = useWorkspace();
  const wasPromoting = useRef(false);
  return usePolledQuery({
    queryKey: modelsKey(projectId),
    queryFn: async () => {
      const models = await unwrap(client.GET('/v1/projects/{project_id}/models', { params: projectPath(projectId) }));
      const promoting = models.some(isPromoting);
      if (wasPromoting.current && !promoting) void qc.invalidateQueries({ queryKey: deploymentsKey(workspaceId, projectId) });
      wasPromoting.current = promoting;
      return models;
    },
    shouldPoll: (models) => models?.some(isPromoting) ?? false,
  });
}

/** Moves a version to a stage. Production answers at once with the version pending (see `isPromoting`): the list polls until it is
 * serving or its promotion failed. `acknowledgeRisk` is sent once the person accepted that a run without a test split is unchecked. */
export function usePromoteModel(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, stage, acknowledgeRisk = false }: { versionId: string; stage: ModelStage; acknowledgeRisk?: boolean }) =>
      unwrap(
        client.POST('/v1/projects/{project_id}/models/{model_version_id}/promote', {
          params: {
            path: { project_id: projectId, model_version_id: versionId },
            query: { stage, acknowledge_risk: acknowledgeRisk },
          },
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
