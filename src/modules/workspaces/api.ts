import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ApiError, client, unwrap, type Schemas } from '@/shared/api/client';
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
    // The name is all the user gives: the server makes the handle from it, and adds an ending when the handle is taken.
    mutationFn: ({ name, key }: { name: string; key: string }) =>
      unwrap(client.POST('/v1/tenants', { params: { header: { [IDEMPOTENCY_HEADER]: key } }, body: { name } })),
    onSuccess: refresh,
  });
}

/** Whether a handle is free. One indexed lookup on the server, so asking before every create is cheap. */
export const slugAvailable = (slug: string) =>
  unwrap(client.GET('/v1/me/tenant-slug-available', { params: { query: { slug } } })).then((r) => r.available);

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

export type OwnershipOffer = Schemas['OwnershipOffer'];
const offerKey = (id: string) => [...workspaceKey(id), 'ownership-offer'] as const;
const offerParams = (id: string) => ({ params: { path: { tenant_id: id } } });

/** The open ownership offer, or null when there is none (the API answers 404 to everyone but the two people involved and the owners). */
export function useOwnershipOffer(id: string) {
  return useQuery({
    queryKey: offerKey(id),
    queryFn: async () => {
      try {
        return await unwrap(client.GET('/v1/tenants/{tenant_id}/ownership-offer', offerParams(id)));
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });
}

/** Members an owner can offer ownership to. Same key and shape as the members module's list, so both share one cache entry. */
export function useOfferCandidates(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['workspace', id, 'members'],
    queryFn: () => unwrap(client.GET('/v1/tenants/{tenant_id}/members', offerParams(id))),
    enabled,
  });
}

type OfferBody = { to_sub: string; step_down: boolean };

export function useOfferOwnership(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OfferBody) => unwrap(client.POST('/v1/tenants/{tenant_id}/ownership-offer', { ...offerParams(id), body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKey(id) }),
  });
}

/** The offering owner withdraws the offer, or its recipient declines it. */
export function useCancelOwnershipOffer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(client.DELETE('/v1/tenants/{tenant_id}/ownership-offer', offerParams(id))),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKey(id) }),
  });
}

/** Resend = withdraw the open (usually expired) offer and send the same one again, which starts a new expiry. */
export function useResendOwnershipOffer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: OfferBody) => {
      await unwrap(client.DELETE('/v1/tenants/{tenant_id}/ownership-offer', offerParams(id)));
      return unwrap(client.POST('/v1/tenants/{tenant_id}/ownership-offer', { ...offerParams(id), body }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: offerKey(id) }),
  });
}

/** Accepting changes the user's role here, so /v1/me is refetched with the offer. */
export function useAcceptOwnershipOffer(id: string) {
  const refresh = useRefresh(id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(client.POST('/v1/tenants/{tenant_id}/ownership-offer:accept', offerParams(id))),
    onSuccess: () => Promise.all([refresh(), qc.invalidateQueries({ queryKey: offerKey(id) })]),
  });
}

export type ApiKey = Schemas['ListedApiKey'];
export type NewApiKey = Schemas['NewApiKey'];
const apiKeysKey = (id: string) => ['workspace', id, 'api-keys'] as const;

/** The workspace's keys, revoked ones included, so a revoked key stays visible with its status. */
export function useApiKeys(id: string) {
  return useQuery({
    queryKey: apiKeysKey(id),
    queryFn: () => unwrap(client.GET('/v1/api-keys')),
  });
}

/** The workspace's projects, first page of 100: names for the keys table, and the choices in the create dialog. */
export function useWorkspaceProjects(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['workspace', id, 'key-projects'],
    queryFn: () => unwrap(client.GET('/v1/projects', { params: { query: { page_size: 100 } } })).then((page) => page.items),
    enabled,
  });
}

/** Creates a key. Not retried by Idempotency-Key (the API has none for keys), so the dialog disables Create while it runs. */
export function useCreateApiKey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NewApiKey) => unwrap(client.POST('/v1/api-keys', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeysKey(id) }),
  });
}

export function useRevokeApiKey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => unwrap(client.DELETE('/v1/api-keys/{key_id}', { params: { path: { key_id: keyId } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeysKey(id) }),
  });
}
