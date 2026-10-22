import { useMutation, useQueryClient, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { client, unwrap } from '@/shared/api/client';
import { meKey } from '@/modules/workspaces';

export const membersKey = (id: string) => ['workspace', id, 'members'] as const;
export const invitationsKey = (id: string) => ['workspace', id, 'invitations'] as const;

export const membersQuery = (id: string) =>
  queryOptions({
    queryKey: membersKey(id),
    queryFn: () => unwrap(client.GET('/v1/tenants/{tenant_id}/members', { params: { path: { tenant_id: id } } })),
  });
export const invitationsQuery = (id: string) =>
  queryOptions({
    queryKey: invitationsKey(id),
    queryFn: () => unwrap(client.GET('/v1/tenants/{tenant_id}/invitations', { params: { path: { tenant_id: id } } })),
  });
export const useMembers = (id: string) => useSuspenseQuery(membersQuery(id)).data;
export const useInvitations = (id: string) => useSuspenseQuery(invitationsQuery(id)).data;

export function useSetMemberRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sub, role }: { sub: string; role: 'owner' | 'admin' | 'member' }) =>
      unwrap(
        client.PUT('/v1/tenants/{tenant_id}/members/{user_sub}', { params: { path: { tenant_id: id, user_sub: sub } }, body: { role } }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(id) }),
  });
}

export function useRemoveMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sub: string) =>
      unwrap(client.DELETE('/v1/tenants/{tenant_id}/members/{user_sub}', { params: { path: { tenant_id: id, user_sub: sub } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(id) }),
  });
}

/** The answer carries the invite token once; the caller shows it as a link. */
export function useInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role: 'admin' | 'member' }) =>
      unwrap(client.POST('/v1/tenants/{tenant_id}/invitations', { params: { path: { tenant_id: id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitationsKey(id) }),
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => unwrap(client.POST('/v1/invitations/{token}:accept', { params: { path: { token } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: meKey }),
  });
}
