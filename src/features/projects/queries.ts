/**
 * React Query hooks for projects. Components call these; the hooks call
 * `projectsApi` and hand back the UI types from `./mappers`.
 */
import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { organizationKeys } from '@/features/organizations/queries';
import type { ApiVisibility } from '@/features/organizations/api';
import { projectsApi } from './api';
import type { ApiProject, ApiProjectMember, CreateProjectRequest, InviteProjectMemberRequest, UpdateProjectRequest } from './api';
import { toApiProjectRole, toProject, toProjectMember, toProjectOverview } from './mappers';
import type { ProjectTeamRole } from './mappers';

export const projectKeys = {
  all: ['projects'] as const,
  list: (orgId: string) => ['projects', 'list', orgId] as const,
  /** Everything about one project: detail, usage, members, integrations. */
  one: (projectId: string) => ['projects', 'one', projectId] as const,
  detail: (projectId: string) => ['projects', 'one', projectId, 'detail'] as const,
  usage: (projectId: string) => ['projects', 'one', projectId, 'usage'] as const,
  members: (projectId: string) => ['projects', 'one', projectId, 'members'] as const,
  integrations: (projectId: string) => ['projects', 'one', projectId, 'integrations'] as const,
};

const toProjects = (rows: ApiProject[]) => rows.map((row) => toProject(row));

/** The projects of one organization. */
export function useProjects(orgId: string) {
  return useQuery({
    queryKey: projectKeys.list(orgId),
    queryFn: () => projectsApi.list(orgId),
    select: toProjects,
  });
}

/**
 * One project with everything its pages show. Three requests, because usage
 * and members are their own endpoints; they share the cache with the cards
 * that read them alone.
 */
export function useProject(projectId: string, { enabled = true } = {}) {
  const detail = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.get(projectId),
    enabled,
  });
  const usage = useQuery({
    queryKey: projectKeys.usage(projectId),
    queryFn: () => projectsApi.getUsage(projectId),
    enabled,
  });
  const members = useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => projectsApi.listMembers(projectId),
    enabled,
  });

  const data = React.useMemo(
    () =>
      detail.data && usage.data && members.data
        ? {
            project: toProject(detail.data),
            details: toProjectOverview(detail.data, usage.data, members.data),
          }
        : undefined,
    [detail.data, usage.data, members.data],
  );
  const error = detail.error ?? usage.error ?? members.error;

  return {
    data,
    error: data ? null : error,
    isPending: !data && !error,
    refetch: () => Promise.all([detail.refetch(), usage.refetch(), members.refetch()]),
  };
}

/** A change to a project also changes its organization's lists and counts. */
export function useInvalidateProject() {
  const queryClient = useQueryClient();
  return (projectId?: string) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: projectId ? projectKeys.one(projectId) : projectKeys.all,
      }),
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] }),
      queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['search'] }),
    ]);
}

export function useCreateProject() {
  const invalidate = useInvalidateProject();
  return useMutation({
    meta: { inlineConflict: true },
    mutationFn: (input: CreateProjectRequest) => projectsApi.create(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateProject(projectId: string) {
  const invalidate = useInvalidateProject();
  return useMutation({
    meta: { inlineConflict: true },
    mutationFn: async ({ visibility, ...input }: UpdateProjectRequest & { visibility?: ApiVisibility }) => {
      if (Object.keys(input).length > 0) {
        await projectsApi.update(projectId, input);
      }
      if (visibility) await projectsApi.setVisibility(projectId, visibility);
    },
    onSettled: () => invalidate(projectId),
  });
}

export function useArchiveProject(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: (archive: boolean) => (archive ? projectsApi.archive(projectId) : projectsApi.unarchive(projectId)),
    // Archiving pauses the project's live deployments.
    onSuccess: () => Promise.all([invalidate(projectId), queryClient.invalidateQueries({ queryKey: ['deployments', projectId] })]),
  });
}

export function useTransferProject(projectId: string) {
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: (organizationId: string) => projectsApi.transfer(projectId, organizationId),
    onSuccess: () => invalidate(projectId),
  });
}

export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => projectsApi.remove(projectId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects', 'list'] }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
      ]),
  });
}

const toMembers = (rows: ApiProjectMember[]) => rows.map(toProjectMember);

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => projectsApi.listMembers(projectId),
    select: toMembers,
  });
}

function useMemberMutation<TInput>(projectId: string, mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: projectKeys.members(projectId),
      }),
  });
}

export function useInviteProjectMember(projectId: string) {
  return useMemberMutation(projectId, ({ email, role }: { email: string; role: ProjectTeamRole }) => {
    const input: InviteProjectMemberRequest = {
      email,
      role: toApiProjectRole(role),
    };
    return projectsApi.invite(projectId, input);
  });
}

export function useSetProjectMemberRole(projectId: string) {
  return useMemberMutation(projectId, ({ userId, role }: { userId: string; role: ProjectTeamRole }) =>
    projectsApi.setMemberRole(projectId, userId, toApiProjectRole(role)),
  );
}

export function useRemoveProjectMember(projectId: string) {
  return useMemberMutation(projectId, (userId: string) => projectsApi.removeMember(projectId, userId));
}

export function useProjectIntegrations(projectId: string) {
  return useQuery({
    queryKey: projectKeys.integrations(projectId),
    queryFn: () => projectsApi.listIntegrations(projectId),
  });
}

export function useSetProjectIntegration(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => projectsApi.setIntegration(projectId, id, enabled),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: projectKeys.integrations(projectId),
      }),
  });
}
