import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { client, unwrap, type Schemas } from '@/shared/api/client';

export type Me = Schemas['Me'];
export type WorkspaceSummary = Schemas['TenantSummary'];

export const meKey = ['me'] as const;
export const meQuery = queryOptions({ queryKey: meKey, queryFn: () => unwrap(client.GET('/v1/me')) });

/** The signed-in user and their workspaces. Routes under the app layout have loaded it already. */
export const useMe = () => useSuspenseQuery(meQuery).data;

export const workspaceKey = (id: string) => ['workspace', id] as const;
export const workspaceQuery = (id: string) =>
  queryOptions({
    queryKey: workspaceKey(id),
    queryFn: () => unwrap(client.GET('/v1/tenants/{tenant_id}', { params: { path: { tenant_id: id } } })),
  });
export const useWorkspaceDetail = (id: string) => useSuspenseQuery(workspaceQuery(id)).data;

/** The workspace's members with their names. Listing them takes `tenant.admin`. */
export const membersKey = (id: string) => [...workspaceKey(id), 'members'] as const;
export const membersQuery = (id: string) =>
  queryOptions({
    queryKey: membersKey(id),
    queryFn: () => unwrap(client.GET('/v1/tenants/{tenant_id}/members', { params: { path: { tenant_id: id } } })),
  });

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
      unwrap(client.POST('/v1/tenants', { params: { header: { 'Idempotency-Key': key } }, body: { name, slug } })),
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
