import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrap, type Schemas } from '@/shared/api/client';

export type ProjectSummary = Schemas['ProjectSummary'];
export type ProjectStatus = Schemas['ProjectStatus'];
export type Visibility = Schemas['Visibility'];
export type TaskType = Exclude<Schemas['TaskType'], 'legacy_untyped'>;

export const TASK_TYPES = [
  'image_classification',
  'object_detection',
  'tabular_classification',
  'text_classification',
] as const satisfies readonly TaskType[];
export const LEGACY_TASK_TYPE = 'legacy_untyped' as const;
export const VISIBILITIES = ['internal', 'private'] as const satisfies readonly Visibility[];
export const DEFAULT_VISIBILITY: Visibility = 'internal';

export const projectsKey = (workspaceId: string) => ['workspace', workspaceId, 'projects'] as const;
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
