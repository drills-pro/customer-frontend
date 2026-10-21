/**
 * React Query hooks for organizations. Components call these; the hooks call
 * `organizationsApi` and hand back the UI types from `./mappers`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OrgRole, OrgSummary, Organization } from '@/features/dashboard/domain/types';
import { organizationsApi } from './api';
import type { ApiInvitation, ApiOrgMember, ApiOrganization, CreateOrganizationRequest, UpdateOrganizationRequest } from './api';
import { toApiRole, toOrgInvitation, toOrgMember, toOrgSummary, toOrganization } from './mappers';

export const organizationKeys = {
  all: ['organizations'] as const,
  list: () => ['organizations', 'list'] as const,
  members: (orgId: string) => ['organizations', orgId, 'members'] as const,
  billing: (orgId: string) => ['organizations', orgId, 'billing'] as const,
  invoices: (orgId: string) => ['organizations', orgId, 'invoices'] as const,
  invitations: ['invitations'] as const,
  search: (orgId: string) => ['search', orgId] as const,
};

export type OrganizationEntry = {
  organization: Organization;
  summary: OrgSummary;
};

const toEntries = (rows: ApiOrganization[]): OrganizationEntry[] =>
  rows.map((row) => ({
    organization: toOrganization(row),
    summary: toOrgSummary(row),
  }));

/** Every organization the user belongs to, with its counts. */
export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: organizationsApi.list,
    select: toEntries,
  });
}

/** Anything that changes an organization can change its counts and the lists. */
function useInvalidateOrganizations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

export function useCreateOrganization() {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    meta: { inlineConflict: true },
    mutationFn: async (input: CreateOrganizationRequest) => toOrganization(await organizationsApi.create(input)),
    onSuccess: invalidate,
  });
}

export function useUpdateOrganization(orgId: string) {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    meta: { inlineConflict: true },
    mutationFn: (input: UpdateOrganizationRequest) => organizationsApi.update(orgId, input),
    onSuccess: invalidate,
  });
}

/** Deleting or leaving also removes the organization's projects from view. */
function useRemoveOrganization(remove: (orgId: string) => Promise<unknown>, orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => remove(orgId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
      ]),
  });
}

export function useDeleteOrganization(orgId: string) {
  return useRemoveOrganization(organizationsApi.remove, orgId);
}

export function useLeaveOrganization(orgId: string) {
  return useRemoveOrganization(organizationsApi.leave, orgId);
}

export function useTransferOwnership(orgId: string) {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: (memberId: string) => organizationsApi.transferOwnership(orgId, memberId),
    onSuccess: invalidate,
  });
}

const toMembers = (rows: ApiOrgMember[]) => rows.map((row) => toOrgMember(row));

export function useOrgMembers(orgId: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: organizationKeys.members(orgId),
    queryFn: () => organizationsApi.listMembers(orgId),
    select: toMembers,
    enabled,
  });
}

export function useInviteMembers(orgId: string) {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: ({ emails, role }: { emails: string[]; role: OrgRole }) =>
      organizationsApi.invite(orgId, { emails, role: toApiRole(role) }),
    onSuccess: invalidate,
  });
}

export function useSetMemberRole(orgId: string) {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgRole }) =>
      organizationsApi.setMemberRole(orgId, memberId, toApiRole(role)),
    onSuccess: invalidate,
  });
}

/** Removes a member, or revokes a pending invitation. */
export function useRemoveMember(orgId: string) {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: (memberId: string) => organizationsApi.removeMember(orgId, memberId),
    onSuccess: invalidate,
  });
}

export function useResendInvitation(orgId: string) {
  return useMutation({
    mutationFn: (memberId: string) => organizationsApi.resendInvitation(orgId, memberId),
  });
}

const toInvitations = (rows: ApiInvitation[]) => rows.map(toOrgInvitation);

/** Invitations addressed to the signed-in user. */
export function useInvitations() {
  return useQuery({
    queryKey: organizationKeys.invitations,
    queryFn: organizationsApi.listInvitations,
    select: toInvitations,
  });
}

function useAnswerInvitation(answer: (invitationId: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: answer,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationKeys.invitations,
        }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
      ]),
  });
}

export function useAcceptInvitation() {
  return useAnswerInvitation(organizationsApi.acceptInvitation);
}

export function useDeclineInvitation() {
  return useAnswerInvitation(organizationsApi.declineInvitation);
}

export function useBilling(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.billing(orgId),
    queryFn: () => organizationsApi.getBilling(orgId),
  });
}

export function useInvoices(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.invoices(orgId),
    queryFn: () => organizationsApi.listInvoices(orgId),
  });
}

/** Everything the command palette can jump to inside one organization. */
export function useWorkspaceSearch(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.search(orgId),
    queryFn: () => organizationsApi.search(orgId),
  });
}
