/** Turns organization rows from the API into what the pages render. */
import type { OrgInvitation, OrgMember, OrgPlan, OrgRole, OrgSummary, Organization } from '@/features/dashboard/domain/types';
import type { ApiInvitation, ApiOrgMember, ApiOrgPlan, ApiOrgRole, ApiOrganization, ApiVisibility } from './api';

const planLabels: Record<ApiOrgPlan, OrgPlan> = {
  free: 'Free',
  team: 'Team',
  enterprise: 'Enterprise',
};

const roleLabels: Record<ApiOrgRole, OrgRole> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export const toApiPlan = (plan: OrgPlan) => plan.toLowerCase() as ApiOrgPlan;
export const toApiRole = (role: OrgRole) => role.toLowerCase() as ApiOrgRole;
export const toPlan = (plan: ApiOrgPlan) => planLabels[plan];

export const toVisibility = (visibility: ApiVisibility) => (visibility === 'private' ? ('Private' as const) : ('Organization' as const));
export const toApiVisibility = (visibility: 'Organization' | 'Private') => visibility.toLowerCase() as ApiVisibility;

export function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/** `Priya Nair` reads `PN`; a single word reads its first two letters. */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

type OrganizationIdentity = Pick<ApiOrganization, 'id' | 'name' | 'slug' | 'description' | 'color' | 'plan'>;

function identity(row: OrganizationIdentity) {
  return {
    id: row.id,
    name: row.name,
    initial: initialOf(row.name),
    color: row.color,
    slug: row.slug,
    plan: planLabels[row.plan],
    description: row.description,
  };
}

export function toOrganization(row: ApiOrganization): Organization {
  return {
    ...identity(row),
    createdAt: new Date(row.created_at).getTime(),
    yourRole: roleLabels[row.your_role],
    defaults: {
      visibility: toVisibility(row.default_project_visibility),
      requireTwoFactor: row.require_two_factor,
      domainJoin: row.allow_domain_join,
    },
  };
}

export function toOrgSummary(row: ApiOrganization): OrgSummary {
  return {
    projects: row.summary.projects,
    members: row.summary.members,
    invited: row.summary.invited,
    runningTrainings: row.summary.running_trainings,
    deployments: row.summary.deployments,
    creditsUsed: row.summary.credits_used,
    limits: row.limits,
  };
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `Active now`, `12m ago`, `3h ago`, `Yesterday`, `3d ago`, `2w ago`. */
export function lastActiveLabel(iso: string | null, now = Date.now()) {
  if (!iso) return 'Pending';
  const diff = Math.max(0, now - new Date(iso).getTime());
  if (diff < 5 * MINUTE) return 'Active now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  const days = Math.floor(diff / DAY);
  return days < 14 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

export function toOrgMember(row: ApiOrgMember, now?: number): OrgMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    initials: initialsOf(row.name),
    color: row.color,
    role: roleLabels[row.role],
    joinedAt: new Date(row.joined_at).getTime(),
    lastActive: lastActiveLabel(row.last_active_at, now),
    status: row.status,
    you: row.is_you || undefined,
  };
}

export function toOrgInvitation(row: ApiInvitation): OrgInvitation {
  return {
    id: row.id,
    invitedBy: row.invited_by,
    sentAt: new Date(row.sent_at).getTime(),
    role: roleLabels[row.role],
    organization: identity(row.organization),
  };
}
