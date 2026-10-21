/**
 * Calls for organizations, their members, invitations, billing and search.
 * Served by core-api (app/modules/user/organizations, search), except
 * billing and invoices, which are still mocked.
 *
 * Organizations are copied into the mock as they arrive (`mirrorToMock`), so
 * the mocked billing knows each one's plan.
 */
import { del, get, mirrorToMock, patch, post, qs } from '@/api/client';
import type {
  ApiBilling,
  ApiInvitation,
  ApiInvoice,
  ApiOrgMember,
  ApiOrgRole,
  ApiOrganization,
  ApiSearchHit,
  CreateOrganizationRequest,
  InviteMembersRequest,
  UpdateOrganizationRequest,
} from './types';

const org = (orgId: string) => `/v1/organizations/${encodeURIComponent(orgId)}`;

const member = (orgId: string, memberId: string) => `${org(orgId)}/members/${encodeURIComponent(memberId)}`;

const invitation = (invitationId: string) => `/v1/invitations/${encodeURIComponent(invitationId)}`;

export const organizationsApi = {
  list: () => get<ApiOrganization[]>('/v1/organizations').then((rows) => mirrorToMock('organizations', rows)),
  create: (input: CreateOrganizationRequest) => post<ApiOrganization>('/v1/organizations', input),
  get: (orgId: string) => get<ApiOrganization>(org(orgId)),
  update: (orgId: string, input: UpdateOrganizationRequest) => patch<ApiOrganization>(org(orgId), input),
  remove: (orgId: string) => del(org(orgId)),
  leave: (orgId: string) => post<void>(`${org(orgId)}/leave`),
  transferOwnership: (orgId: string, memberId: string) =>
    post<ApiOrganization>(`${org(orgId)}/transfer-ownership`, {
      member_id: memberId,
    }),

  listMembers: (orgId: string) => get<ApiOrgMember[]>(`${org(orgId)}/members`),
  invite: (orgId: string, input: InviteMembersRequest) => post<ApiOrgMember[]>(`${org(orgId)}/invitations`, input),
  setMemberRole: (orgId: string, memberId: string, role: ApiOrgRole) => patch<ApiOrgMember>(member(orgId, memberId), { role }),
  /** Removes a member, or revokes a pending invitation. */
  removeMember: (orgId: string, memberId: string) => del(member(orgId, memberId)),
  resendInvitation: (orgId: string, memberId: string) =>
    post<ApiOrgMember>(`${org(orgId)}/invitations/${encodeURIComponent(memberId)}/resend`),

  /** Invitations addressed to the caller. */
  listInvitations: () => get<ApiInvitation[]>('/v1/invitations'),
  acceptInvitation: (invitationId: string) => post<ApiOrganization>(`${invitation(invitationId)}/accept`),
  declineInvitation: (invitationId: string) => post<void>(`${invitation(invitationId)}/decline`),

  getBilling: (orgId: string) => get<ApiBilling>(`${org(orgId)}/billing`),
  listInvoices: (orgId: string) => get<ApiInvoice[]>(`${org(orgId)}/invoices`),

  search: (orgId: string, query?: string) => get<ApiSearchHit[]>(`/v1/search${qs({ organization_id: orgId, q: query })}`),
};
