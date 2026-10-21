import * as React from 'react';

import type { OrgMember, OrgSummary, Organization } from '@/features/dashboard/domain/types';

export type OrgDetailContextValue = {
  org: Organization;
  members: OrgMember[];
  summary: OrgSummary;
  isCurrent: boolean;
  /** Owners and admins can invite, change roles and edit settings. */
  canManage: boolean;
};

export const OrgDetailContext = React.createContext<OrgDetailContextValue | null>(null);

export function useOrgDetail() {
  const context = React.useContext(OrgDetailContext);
  if (!context) {
    throw new Error('useOrgDetail must be used inside the organization layout');
  }
  return context;
}
