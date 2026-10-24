import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';
import { setApiTenant } from '@/shared/api/client';
import type { WorkspaceSummary } from '@/modules/workspaces/api';

const Ctx = createContext<WorkspaceSummary | null>(null);
/** Provided by the /w/$slug layout once the slug is known to be one of the user's workspaces. Also tells the API client which workspace is active. */
export function WorkspaceProvider({ value, children }: { value: WorkspaceSummary; children: ReactNode }) {
  // Layout effects run before any child's data-fetching effect, so requests always carry the header.
  useLayoutEffect(() => {
    setApiTenant(value.id);
    return () => setApiTenant();
  }, [value.id]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace(): WorkspaceSummary {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWorkspace must be used inside a workspace route');
  return v;
}

/** Capability strings come from /v1/me (e.g. 'tenant.admin'). Hiding is a courtesy; the API still decides. */
export const useCan = (capability: 'tenant.admin' | 'tenant.member.manage' | 'tenant.delete') =>
  useWorkspace().capabilities.includes(capability);
