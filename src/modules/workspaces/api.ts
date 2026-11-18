import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { client, unwrap, type Schemas } from '@/shared/api/client';
import { IDEMPOTENCY_HEADER } from '@/shared/api/idempotency';

export type Me = Schemas['Me'];
export type WorkspaceSummary = Schemas['TenantSummary'];

export const meKey = ['me'] as const;
export const meQuery = queryOptions({ queryKey: meKey, queryFn: () => unwrap(client.GET('/v1/me')) });

/** The signed-in user and their workspaces. Routes under the app layout have loaded it already. */
export const useMe = () => useSuspenseQuery(meQuery).data;

/** Mail the user a verification link. 409: the email is verified already (the token is older); 429: one was just sent. */
export const sendVerificationEmail = () => unwrap(client.POST('/v1/me/email-verification'));

const VERIFY_POLL_MS = 5000;
/** The email's state now, which can be newer than the token: polled while the verify step waits for the link to be opened. */
export const useEmailVerified = (enabled: boolean) =>
  useQuery({
    queryKey: [...meKey, 'email-verification'],
    queryFn: () => unwrap(client.GET('/v1/me/email-verification')),
    enabled,
    refetchInterval: VERIFY_POLL_MS,
    select: (s) => s.verified,
  }).data === true;

export const workspaceKey = (id: string) => ['workspace', id] as const;
export const workspaceQuery = (id: string) =>
  queryOptions({
    queryKey: workspaceKey(id),
    queryFn: () => unwrap(client.GET('/v1/tenants/{tenant_id}', { params: { path: { tenant_id: id } } })),
  });
export const useWorkspaceDetail = (id: string) => useSuspenseQuery(workspaceQuery(id)).data;

/** Anything that changes a workspace also changes the switcher, which reads /v1/me. */
function useRefresh(id?: string) {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: meKey }), id ? qc.invalidateQueries({ queryKey: workspaceKey(id) }) : null]);
}

/** The same Idempotency-Key replays the first answer, so a retry of one attempt never makes a second workspace. */
export function useCreateWorkspace() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ name, slug, key }: { name: string; slug: string; key: string }) =>
      unwrap(client.POST('/v1/tenants', { params: { header: { [IDEMPOTENCY_HEADER]: key } }, body: { name, slug } })),
    onSuccess: refresh,
  });
}

export function useRenameWorkspace(id: string) {
  const refresh = useRefresh(id);
  return useMutation({
    mutationFn: (name: string) => unwrap(client.PATCH('/v1/tenants/{tenant_id}', { params: { path: { tenant_id: id } }, body: { name } })),
    onSuccess: refresh,
  });
}

export function useDeleteWorkspace(id: string) {
  const refresh = useRefresh(id);
  return useMutation({
    mutationFn: (confirmName: string) =>
      unwrap(client.POST('/v1/tenants/{tenant_id}:delete', { params: { path: { tenant_id: id } }, body: { confirm_name: confirmName } })),
    onSuccess: refresh,
  });
}

export function useRestoreWorkspace(id: string) {
  const refresh = useRefresh(id);
  return useMutation({
    mutationFn: () => unwrap(client.POST('/v1/tenants/{tenant_id}:restore', { params: { path: { tenant_id: id } } })),
    onSuccess: refresh,
  });
}
