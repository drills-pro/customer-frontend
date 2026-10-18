/** Organizations, their members, invitations to the caller, billing, search. */
import type {
  ApiBilling,
  ApiOrgMember,
  ApiOrgRole,
  ApiOrganization,
  ApiSearchHit,
  CreateOrganizationRequest,
  InviteMembersRequest,
  UpdateOrganizationRequest,
} from '@/features/organizations/api/types'
import { notFound, retiredRoute, route } from '../router'
import { liveRun } from '../runs'
import { billingSeed, invoiceSeed } from '../seed/account'
import { planLimits } from '../seed/catalog'
import {
  INVITED_ORG_AGE_DAYS,
  memberColors,
  youAsMember,
} from '../seed/organizations'
import type { MemberRecord, OrganizationRecord } from '../seed/organizations'
import { daysAgo } from '../seed/units'
import {
  datasets,
  deployments,
  invitations,
  members,
  models,
  organizations,
  projects,
  trainingRuns,
} from '../store'
import { bodyOf, conflict, forbidden, invalid, nowIso, pick } from './shared'

function organization(orgId: string) {
  return organizations.get(orgId) ?? notFound('Organization')
}

function membersOf(orgId: string) {
  return members.all().filter((item) => item.organization_id === orgId)
}

function projectIdsOf(orgId: string) {
  return new Set(
    projects
      .all()
      .filter((item) => item.organization_id === orgId)
      .map((item) => item.id),
  )
}

function toApi(record: OrganizationRecord): ApiOrganization {
  const { credits_used, mirrored: _, ...rest } = record
  const people = membersOf(record.id)
  const projectIds = projectIdsOf(record.id)
  return {
    ...rest,
    summary: {
      projects: projectIds.size,
      members: people.filter((item) => item.status === 'active').length,
      invited: people.filter((item) => item.status === 'invited').length,
      running_trainings: trainingRuns
        .all()
        .filter(
          (run) =>
            projectIds.has(run.project_id) && liveRun(run).status === 'running',
        ).length,
      deployments: deployments
        .all()
        .filter((item) => projectIds.has(item.project_id)).length,
      credits_used,
    },
    limits: planLimits(record.plan),
  }
}

function toApiMember({
  organization_id: _,
  ...member
}: MemberRecord): ApiOrgMember {
  // The caller is by definition active right now.
  return member.is_you ? { ...member, last_active_at: nowIso() } : member
}

function assertSlugFree(slug: string, ownId?: string) {
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) invalid('Invalid organization URL')
  const taken = organizations
    .all()
    .some((item) => item.slug === slug && item.id !== ownId)
  if (taken) conflict('That URL is already taken.')
}

function canManage(record: OrganizationRecord) {
  return record.your_role === 'owner' || record.your_role === 'admin'
}

/** Removes an organization and everything created inside it. */
function removeOrganization(orgId: string) {
  if (organizations.all().length <= 1) {
    conflict('You cannot leave your only organization.')
  }
  const projectIds = projectIdsOf(orgId)
  for (const collection of [datasets, trainingRuns, models, deployments]) {
    for (const item of collection.all()) {
      if (projectIds.has(item.project_id)) collection.remove(item.id)
    }
  }
  for (const projectId of projectIds) projects.remove(projectId)
  for (const member of membersOf(orgId)) members.remove(member.id)
  organizations.remove(orgId)
}

// Copies of core-api organizations (`../mirror.ts`) stay out of the mock's own list.
retiredRoute('GET', '/v1/organizations', () =>
  organizations
    .all()
    .filter((item) => !item.mirrored)
    .map(toApi),
)

retiredRoute('POST', '/v1/organizations', ({ body }) => {
  const input = bodyOf<CreateOrganizationRequest>(body)
  const name = input.name.trim()
  if (name.length < 2) invalid('Organization name is too short')
  assertSlugFree(input.slug)

  const created = organizations.put({
    id: `org-${Date.now().toString(36)}`,
    name,
    slug: input.slug,
    description: '',
    color: input.color,
    plan: input.plan,
    created_at: nowIso(),
    your_role: 'owner',
    default_project_visibility: 'organization',
    require_two_factor: false,
    allow_domain_join: true,
    credits_used: 0,
  })
  members.put(
    youAsMember(created.id, 'owner', `${created.slug}.org`, created.created_at),
  )
  return toApi(created)
})

retiredRoute('GET', '/v1/organizations/:orgId', ({ params }) =>
  toApi(organization(params.orgId)),
)

retiredRoute('PATCH', '/v1/organizations/:orgId', ({ params, body }) => {
  const current = organization(params.orgId)
  if (!canManage(current)) forbidden('Only owners and admins can edit this.')
  const changes = pick(bodyOf<UpdateOrganizationRequest>(body), [
    'name',
    'slug',
    'description',
    'color',
    'default_project_visibility',
    'require_two_factor',
    'allow_domain_join',
  ])
  if (changes.slug !== undefined) assertSlugFree(changes.slug, current.id)
  if (changes.name !== undefined) {
    changes.name = changes.name.trim()
    if (changes.name.length < 2) invalid('Organization name is too short')
  }
  return toApi(organizations.put({ ...current, ...changes }))
})

retiredRoute('DELETE', '/v1/organizations/:orgId', ({ params }) => {
  const current = organization(params.orgId)
  if (current.your_role !== 'owner') {
    forbidden('Only the owner can delete this organization.')
  }
  removeOrganization(current.id)
})

retiredRoute('POST', '/v1/organizations/:orgId/leave', ({ params }) => {
  const current = organization(params.orgId)
  if (current.your_role === 'owner') {
    conflict('Owners must transfer ownership before they can leave.')
  }
  removeOrganization(current.id)
})

retiredRoute(
  'POST',
  '/v1/organizations/:orgId/transfer-ownership',
  ({ params, body }) => {
    const current = organization(params.orgId)
    if (current.your_role !== 'owner') {
      forbidden('Only the owner can transfer ownership.')
    }
    const { member_id } = bodyOf<{ member_id: string }>(body)
    const people = membersOf(current.id)
    const next = people.find(
      (item) => item.id === member_id && item.status === 'active',
    )
    if (!next || next.is_you) invalid('Choose another active member.')
    for (const member of people) {
      if (member.id === next.id) members.put({ ...member, role: 'owner' })
      else if (member.is_you) members.put({ ...member, role: 'admin' })
    }
    return toApi(organizations.put({ ...current, your_role: 'admin' }))
  },
)

retiredRoute('GET', '/v1/organizations/:orgId/members', ({ params }) =>
  membersOf(organization(params.orgId).id).map(toApiMember),
)

retiredRoute(
  'POST',
  '/v1/organizations/:orgId/invitations',
  ({ params, body }) => {
    const current = organization(params.orgId)
    if (!canManage(current)) forbidden('Only owners and admins can invite.')
    const { emails, role } = bodyOf<InviteMembersRequest>(body)
    const existing = membersOf(current.id)
    const known = new Set(existing.map((item) => item.email.toLowerCase()))
    const fresh = [
      ...new Set(emails.map((email) => email.trim().toLowerCase())),
    ].filter((email) => email && !known.has(email))
    if (fresh.length === 0) conflict('Everyone listed is already a member.')
    if (existing.length + fresh.length > planLimits(current.plan).seats) {
      conflict('Not enough seats left on this plan.')
    }

    const stamp = Date.now().toString(36)
    const invited = fresh.map((email, index): MemberRecord => ({
      id: `${current.id}-invite-${stamp}-${index}`,
      organization_id: current.id,
      name: email.split('@')[0],
      email,
      color: memberColors[(existing.length + index) % memberColors.length],
      role,
      status: 'invited',
      joined_at: nowIso(),
      last_active_at: null,
      is_you: false,
    }))
    // Stored last-typed first, so the list reads in the order they were typed.
    for (const item of [...invited].reverse()) members.put(item)
    return invited.map(toApiMember)
  },
)

function findMember(orgId: string, memberId: string) {
  const found = members.get(memberId)
  return found && found.organization_id === orgId ? found : notFound('Member')
}

retiredRoute(
  'PATCH',
  '/v1/organizations/:orgId/members/:memberId',
  ({ params, body }) => {
    const current = organization(params.orgId)
    if (!canManage(current)) forbidden('Only owners and admins can do this.')
    const target = findMember(current.id, params.memberId)
    const { role } = bodyOf<{ role: ApiOrgRole }>(body)
    if (target.is_you || target.role === 'owner' || role === 'owner') {
      forbidden('That role cannot be changed here.')
    }
    return toApiMember(members.put({ ...target, role }))
  },
)

retiredRoute(
  'DELETE',
  '/v1/organizations/:orgId/members/:memberId',
  ({ params }) => {
    const current = organization(params.orgId)
    if (!canManage(current)) forbidden('Only owners and admins can do this.')
    const target = findMember(current.id, params.memberId)
    if (target.is_you || target.role === 'owner') {
      forbidden('That member cannot be removed here.')
    }
    members.remove(target.id)
  },
)

retiredRoute(
  'POST',
  '/v1/organizations/:orgId/invitations/:memberId/resend',
  ({ params }) => {
    const target = findMember(organization(params.orgId).id, params.memberId)
    if (target.status !== 'invited') conflict('That member already joined.')
    return toApiMember(members.put({ ...target, joined_at: nowIso() }))
  },
)

retiredRoute('GET', '/v1/invitations', () => invitations.all())

retiredRoute('POST', '/v1/invitations/:invitationId/accept', ({ params }) => {
  const invitation =
    invitations.get(params.invitationId) ?? notFound('Invitation')
  const joined = organizations.put({
    ...invitation.organization,
    created_at: daysAgo(INVITED_ORG_AGE_DAYS),
    your_role: invitation.role,
    default_project_visibility: 'organization',
    require_two_factor: false,
    allow_domain_join: true,
    credits_used: 0,
  })
  members.put(
    youAsMember(joined.id, invitation.role, `${joined.slug}.org`, nowIso()),
  )
  invitations.remove(invitation.id)
  return toApi(joined)
})

retiredRoute('POST', '/v1/invitations/:invitationId/decline', ({ params }) => {
  if (!invitations.get(params.invitationId)) notFound('Invitation')
  invitations.remove(params.invitationId)
})

route('GET', '/v1/organizations/:orgId/billing', ({ params }): ApiBilling => {
  const current = organization(params.orgId)
  const limits = planLimits(current.plan)
  const paid = current.plan !== 'free'
  return {
    plan: current.plan,
    plan_name: `${current.plan.charAt(0).toUpperCase()}${current.plan.slice(1)} plan`,
    credits_used: current.credits_used,
    credits_total: limits.credits,
    renews_at: billingSeed.renews_at,
    payment_method: paid ? billingSeed.payment_method : null,
  }
})

route('GET', '/v1/organizations/:orgId/invoices', ({ params }) =>
  organization(params.orgId).plan === 'free' ? [] : invoiceSeed,
)

retiredRoute('GET', '/v1/search', ({ query }): ApiSearchHit[] => {
  const projectIds = projectIdsOf(query.get('organization_id') ?? '')
  const needle = (query.get('q') ?? '').trim().toLowerCase()
  const hits: ApiSearchHit[] = [
    ...projects
      .all()
      .filter((item) => projectIds.has(item.id))
      .map((item) => ({
        id: item.id,
        kind: 'project' as const,
        name: item.name,
        project_id: item.id,
      })),
    ...trainingRuns
      .all()
      .filter((item) => projectIds.has(item.project_id))
      .map((item) => ({
        id: item.id,
        kind: 'training_run' as const,
        name: item.name,
        project_id: item.project_id,
      })),
    ...deployments
      .all()
      .filter((item) => projectIds.has(item.project_id))
      .map((item) => ({
        id: item.id,
        kind: 'deployment' as const,
        name: item.name,
        project_id: item.project_id,
      })),
  ]
  return needle
    ? hits.filter((hit) => hit.name.toLowerCase().includes(needle))
    : hits
})
