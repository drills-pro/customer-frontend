import { queryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { TRAINING_RUN_LIMIT } from '@/modules/projects/constants';
import { client, unwrap, type Schemas } from '@/shared/api/client';
import { datasetListKey } from '@/shared/api/keys';

export type ProjectSummary = Schemas['ProjectSummary'];
export type ProjectStatus = Schemas['ProjectStatus'];
export type Visibility = Schemas['Visibility'];
export type TaskType = Schemas['TaskType'];
export type ProjectDetail = Schemas['ProjectDetail'];
export type DefaultAccess = Schemas['DefaultAccess'];
export type ProjectRole = Schemas['Role'];
export type ProjectMember = Schemas['app__modules__user__projects__schemas__Member'];
export type TrainingRunSummary = Schemas['TrainingRunSummary'];
export type DeploymentListItem = Schemas['DeploymentListItem'];

export const TASK_TYPES = [
  'image-classification',
  'object-detection',
  'tabular-classification',
  'text-classification',
] as const satisfies readonly TaskType[];
export const LEGACY_TASK_TYPE = 'legacy_untyped' as const;
export const VISIBILITIES = ['internal', 'private'] as const satisfies readonly Visibility[];
/** Every workspace member can open the project, with its `default_access`. */
export const VISIBILITY_INTERNAL = 'internal' as const satisfies Visibility;
export const DEFAULT_VISIBILITY: Visibility = VISIBILITY_INTERNAL;

export const projectsKey = (workspaceId: string) => ['workspace', workspaceId, 'projects'] as const;
/** Under `projectsKey`, so the list's invalidations (archive, restore) refresh the open project too. */
const projectKey = (workspaceId: string, projectId: string) => [...projectsKey(workspaceId), projectId] as const;
/** The project's training runs. Exported so the training pages refresh the overview's Train stage when they create or cancel one. */
export const trainingRunsKey = (workspaceId: string, projectId: string) =>
  [...projectKey(workspaceId, projectId), 'training-runs'] as const;
/** The project's deployments. Exported so the deployment pages refresh the overview's Deploy stage when one changes. */
export const deploymentsKey = (workspaceId: string, projectId: string) => [...projectKey(workspaceId, projectId), 'deployments'] as const;
const tenantHeader = (workspaceId: string) => ({ 'x-tenant-id': workspaceId });

export function useProjects(workspaceId: string) {
  const query = useInfiniteQuery({
    queryKey: projectsKey(workspaceId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      unwrap(
        client.GET('/v1/projects', {
          params: { query: { page_token: pageParam }, header: tenantHeader(workspaceId) },
        }),
      ),
    getNextPageParam: (page) => page.next_page_token ?? undefined,
  });
  return { ...query, projects: query.data?.pages.flatMap((page) => page.items) };
}

export function useCreateProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, taskType }: { name: string; taskType: TaskType }) =>
      unwrap(
        client.POST('/v1/projects', {
          params: { query: { name, task_type: taskType }, header: tenantHeader(workspaceId) },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
  });
}

export function useSetProjectVisibility(workspaceId: string) {
  return useMutation({
    mutationFn: ({ projectId, visibility }: { projectId: string; visibility: Visibility }) =>
      unwrap(
        client.PATCH('/v1/projects/{project_id}/visibility', {
          params: {
            path: { project_id: projectId },
            query: { visibility },
            header: tenantHeader(workspaceId),
          },
        }),
      ),
  });
}

export function useUpdateProjectStatus(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: ProjectStatus }) =>
      unwrap(
        client.PATCH('/v1/projects/{project_id}', {
          params: {
            path: { project_id: projectId },
            query: { status },
            header: tenantHeader(workspaceId),
          },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
  });
}

const projectQuery = (workspaceId: string, projectId: string) =>
  queryOptions({
    queryKey: projectKey(workspaceId, projectId),
    queryFn: () =>
      unwrap(client.GET('/v1/projects/{project_id}', { params: { path: { project_id: projectId }, header: tenantHeader(workspaceId) } })),
  });
export const useProject = (workspaceId: string, projectId: string) => useQuery(projectQuery(workspaceId, projectId));
/** For pages under the project layout, which renders them only once the project has loaded. */
export const useProjectDetail = (workspaceId: string, projectId: string) => useSuspenseQuery(projectQuery(workspaceId, projectId)).data;

export function useProjectMembers(workspaceId: string, projectId: string) {
  return useQuery({
    queryKey: [...projectKey(workspaceId, projectId), 'members'],
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/members', { params: { path: { project_id: projectId }, header: tenantHeader(workspaceId) } }),
      ),
  });
}

/** The project's runs, newest first, one page of TRAINING_RUN_LIMIT. Shared with the training list, which adds polling. */
export const trainingRunsQuery = (workspaceId: string, projectId: string) =>
  queryOptions({
    queryKey: trainingRunsKey(workspaceId, projectId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/training-runs', {
          params: { path: { project_id: projectId }, query: { limit: TRAINING_RUN_LIMIT }, header: tenantHeader(workspaceId) },
        }),
      ),
  });

export const useTrainingRuns = (workspaceId: string, projectId: string) => useQuery(trainingRunsQuery(workspaceId, projectId));

/** The project's deployments, as the overview reads them; the deployments page polls the same query. */
export const deploymentsQuery = (workspaceId: string, projectId: string) =>
  queryOptions({
    queryKey: deploymentsKey(workspaceId, projectId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/deployments', {
          params: { path: { project_id: projectId }, header: tenantHeader(workspaceId) },
        }),
      ),
  });

export const useDeployments = (workspaceId: string, projectId: string) => useQuery(deploymentsQuery(workspaceId, projectId));

/** The first page of the project's datasets, for a count. Its key sits under the dataset list's, so dataset changes refresh it. */
export function useDatasetCount(workspaceId: string, projectId: string) {
  return useQuery({
    queryKey: [...datasetListKey(projectId), 'count'],
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/datasets', {
          params: { path: { project_id: projectId }, header: tenantHeader(workspaceId) },
        }),
      ),
    select: (page) => ({ count: page.items.length, more: Boolean(page.next_page_token) }),
  });
}
