import { useMutation, useQueryClient, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { client, unwrap } from '@/shared/api/client';
import { meKey } from '@/modules/workspaces';

export const membersKey = (id: string) => ['workspace', id, 'members'] as const;
export const invitationsKey = (id: string) => ['workspace', id, 'invitations'] as const;

/** The workspace's members with their names. Listing them takes `tenant.admin`. */
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

const postAccept = (token: string) => unwrap(client.POST('/v1/invitations/{token}:accept', { params: { path: { token } } }));
/** One request per token per page load: a remount (StrictMode, a re-run route) gets the first answer, not a second POST. */
const accepting = new Map<string, ReturnType<typeof postAccept>>();

/** Accept, then refetch /v1/me (inactive too): the workspace route reads it from the cache and must find the new workspace. */
export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => {
      let sent = accepting.get(token);
      if (!sent) {
        sent = postAccept(token);
        accepting.set(token, sent);
        sent.catch(() => accepting.delete(token)); // a failure may be retried
      }
      return sent;
    },
    onSuccess: () => qc.refetchQueries({ queryKey: meKey, type: 'all' }),
  });
}
