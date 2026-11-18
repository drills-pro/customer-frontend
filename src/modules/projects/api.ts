import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { client, unwrap, type Schemas } from '@/shared/api/client';
import { usePagedList } from '@/shared/api/paged';

export type ProjectSummary = Schemas['ProjectSummary'];
export type ProjectStatus = Schemas['ProjectStatus'];
export type Visibility = Schemas['Visibility'];
export type Sharing = Schemas['Sharing'];
export type TaskType = Schemas['TaskType'];
export type ProjectDetail = Schemas['ProjectDetail'];
export type DefaultAccess = Schemas['DefaultAccess'];
export type ProjectRole = Schemas['Role'];
export type ProjectMember = Schemas['app__modules__user__projects__schemas__Member'];
export type TrashedProject = Schemas['TrashedProject'];
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

/** What the project shows in the public gallery, from least to most; each id is also its `projects.sharing.level.*` key. */
export const SHARING_LEVELS = ['private', 'gallery', 'gallery_downloads'] as const satisfies readonly Sharing[];
export const SHARING_PRIVATE = 'private' as const satisfies Sharing;

export const projectsKey = (workspaceId: string) => ['workspace', workspaceId, 'projects'] as const;
/** Under `projectsKey`, so the list's invalidations (archive, restore) refresh the open project too. */
const projectKey = (workspaceId: string, projectId: string) => [...projectsKey(workspaceId), projectId] as const;
/** The project's deployments. Exported so the deployment pages refresh the overview's Deploy stage when one changes. */
export const deploymentsKey = (workspaceId: string, projectId: string) => [...projectKey(workspaceId, projectId), 'deployments'] as const;

export function useProjects(workspaceId: string) {
  const paged = usePagedList(projectsKey(workspaceId), (pageToken) =>
    unwrap(client.GET('/v1/projects', { params: { query: { page_token: pageToken } } })),
  );
  return { ...paged, projects: paged.items };
}

export function useCreateProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, taskType }: { name: string; taskType: TaskType }) =>
      unwrap(client.POST('/v1/projects', { params: { query: { name, task_type: taskType } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
  });
}

export function useSetProjectVisibility(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, visibility }: { projectId: string; visibility: Visibility }) =>
      unwrap(
        client.PATCH('/v1/projects/{project_id}/visibility', {
          params: {
            path: { project_id: projectId },
            query: { visibility },
          },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
  });
}

/** Setting a gallery level also makes the project internal, and Private takes it out of the gallery, so the project is read again. */
export function useSetProjectSharing(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, sharing }: { projectId: string; sharing: Sharing }) =>
      unwrap(client.PUT('/v1/projects/{project_id}/sharing', { params: { path: { project_id: projectId } }, body: { sharing } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
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
          },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
  });
}

const projectQuery = (workspaceId: string, projectId: string) =>
  queryOptions({
    queryKey: projectKey(workspaceId, projectId),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}', { params: { path: { project_id: projectId } } })),
  });
export const useProject = (workspaceId: string, projectId: string) => useQuery(projectQuery(workspaceId, projectId));
/** For pages under the project layout, which renders them only once the project has loaded. */
export const useProjectDetail = (workspaceId: string, projectId: string) => useSuspenseQuery(projectQuery(workspaceId, projectId)).data;

const projectMembersKey = (workspaceId: string, projectId: string) => [...projectKey(workspaceId, projectId), 'members'] as const;

export function useProjectMembers(workspaceId: string, projectId: string) {
  return useQuery({
    queryKey: projectMembersKey(workspaceId, projectId),
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/members', { params: { path: { project_id: projectId } } })),
  });
}

/** The project's deployments, one request. Exported so the deployments page can poll the same read. */
export const fetchDeployments = (projectId: string) =>
  unwrap(client.GET('/v1/projects/{project_id}/deployments', { params: { path: { project_id: projectId } } }));

export const useDeployments = (workspaceId: string, projectId: string) =>
  useQuery({ queryKey: deploymentsKey(workspaceId, projectId), queryFn: () => fetchDeployments(projectId) });

/** Deleted projects still inside their restore window. Under `projectsKey`, so a delete or restore refreshes the list and the Trash together. */
export function useTrashedProjects(workspaceId: string) {
  const paged = usePagedList([...projectsKey(workspaceId), 'trash'], (pageToken) =>
    unwrap(client.GET('/v1/projects/trash', { params: { query: { page_token: pageToken } } })),
  );
  return { ...paged, projects: paged.items };
}

export function useDeleteProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => unwrap(client.DELETE('/v1/projects/{project_id}', { params: { path: { project_id: projectId } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
  });
}

export function useRestoreProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      unwrap(client.POST('/v1/projects/{project_id}:restore', { params: { path: { project_id: projectId } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey(workspaceId) }),
  });
}

/** Replace the person's roles on the project with exactly these. */
export function useSetProjectMemberRoles(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sub, roles }: { sub: string; roles: ProjectRole[] }) =>
      unwrap(
        client.PUT('/v1/projects/{project_id}/members/{user_sub}', {
          params: { path: { project_id: projectId, user_sub: sub } },
          body: { roles },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectMembersKey(workspaceId, projectId) }),
  });
}

/** 409 `last_project_admin` when the person is the project's only admin (a workspace owner or admin may still do it). */
export function useRemoveProjectMember(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sub: string) =>
      unwrap(client.DELETE('/v1/projects/{project_id}/members/{user_sub}', { params: { path: { project_id: projectId, user_sub: sub } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectMembersKey(workspaceId, projectId) }),
  });
}
