import type {
  ApiInvitation,
  ApiOrgMember,
  ApiOrgRole,
  ApiOrganization,
} from '@/features/organizations/api/types'
import { SEED_NOW, daysAgo, hoursAgo, minutesAgo } from './units'

/** An organization as stored: its counts and limits are worked out per request. */
export type OrganizationRecord = Omit<ApiOrganization, 'summary' | 'limits'> & {
  credits_used: number
  /** A copy of a core-api organization (`../mirror.ts`). */
  mirrored?: boolean
}

export type MemberRecord = ApiOrgMember & { organization_id: string }

const DAY = 24 * 60 * 60 * 1000

export const organizationSeed: OrganizationRecord[] = [
  {
    id: 'acme',
    name: 'Acme AI',
    slug: 'acme-ai',
    description: 'Applied ML for retail and customer support.',
    color: '#10b981',
    plan: 'team',
    created_at: daysAgo(412),
    your_role: 'admin',
    default_project_visibility: 'organization',
    require_two_factor: false,
    allow_domain_join: true,
    credits_used: 760,
  },
  {
    id: 'northwind',
    name: 'Northwind Labs',
    slug: 'northwind-labs',
    description: 'Computer vision research for manufacturing lines.',
    color: '#0ea5e9',
    plan: 'enterprise',
    created_at: daysAgo(980),
    your_role: 'member',
    default_project_visibility: 'organization',
    require_two_factor: false,
    allow_domain_join: true,
    credits_used: 12_480,
  },
  {
    id: 'solo',
    name: 'Solo Sandbox',
    slug: 'alex-sandbox',
    description: 'Personal experiments.',
    color: '#f59e0b',
    plan: 'free',
    created_at: daysAgo(60),
    your_role: 'owner',
    default_project_visibility: 'organization',
    require_two_factor: false,
    allow_domain_join: true,
    credits_used: 42,
  },
]

/** Avatar colours handed to new members in turn. */
export const memberColors = [
  '#10b981',
  '#0ea5e9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#64748b',
]

const firstNames = [
  'Priya',
  'Marcus',
  'Yuki',
  'Sofia',
  'Daniel',
  'Amara',
  'Liam',
  'Mei',
  'Omar',
  'Hannah',
  'Kenji',
  'Lucia',
  'Noah',
  'Aisha',
  'Mateo',
  'Freya',
]
const lastNames = [
  'Nair',
  'Chen',
  'Tanaka',
  'Rossi',
  'Okafor',
  'Levi',
  'Walsh',
  'Park',
  'Haddad',
  'Berg',
  'Silva',
  'Novak',
]
// A spread from "active now" to two weeks back.
const lastActive = [
  () => minutesAgo(0),
  () => minutesAgo(12),
  () => hoursAgo(1),
  () => hoursAgo(3),
  () => hoursAgo(30),
  () => daysAgo(3),
  () => daysAgo(14),
]

/** The signed-in user's own row in an organization. */
export function youAsMember(
  organizationId: string,
  role: ApiOrgRole,
  domain: string,
  joinedAt: string,
): MemberRecord {
  return {
    id: `${organizationId}-you`,
    organization_id: organizationId,
    name: 'Alex Rivera',
    email: `alex@${domain}`,
    color: '#8b5cf6',
    role,
    status: 'active',
    joined_at: joinedAt,
    last_active_at: new Date().toISOString(),
    is_you: true,
  }
}

/** Deterministic member rows so every load shows the same people. */
function seedMembers(
  organization: OrganizationRecord,
  count: number,
  domain: string,
  invited: number,
): MemberRecord[] {
  const createdAt = new Date(organization.created_at).getTime()
  const members: MemberRecord[] = [
    youAsMember(
      organization.id,
      organization.your_role,
      domain,
      new Date(createdAt + DAY * 3).toISOString(),
    ),
  ]
  for (let index = 0; members.length < count; index++) {
    const first = firstNames[index % firstNames.length]
    const last = lastNames[(index * 5) % lastNames.length]
    const role: ApiOrgRole =
      organization.your_role !== 'owner' && index === 0
        ? 'owner'
        : index % 7 === 1
          ? 'admin'
          : index % 5 === 4
            ? 'viewer'
            : 'member'
    const isInvited = index >= count - 1 - invited
    members.push({
      id: `${organization.id}-member-${index}`,
      organization_id: organization.id,
      name: `${first} ${last}`,
      email:
        `${first}.${last}${index >= firstNames.length ? index : ''}@${domain}`.toLowerCase(),
      color: memberColors[(index * 3) % memberColors.length],
      role: isInvited && role === 'owner' ? 'member' : role,
      status: isInvited ? 'invited' : 'active',
      // The founding owner joined when the organization was created.
      joined_at:
        role === 'owner'
          ? organization.created_at
          : new Date(SEED_NOW - DAY * ((index * 17) % 380) - DAY).toISOString(),
      last_active_at: isInvited
        ? null
        : lastActive[index % lastActive.length](),
      is_you: false,
    })
  }
  return members
}

export const memberSeed = (): MemberRecord[] => [
  ...seedMembers(organizationSeed[0], 26, 'acme.ai', 2),
  ...seedMembers(organizationSeed[1], 88, 'northwind.io', 2),
  ...seedMembers(organizationSeed[2], 1, 'sandbox.dev', 0),
]

export const invitationSeed: ApiInvitation[] = [
  {
    id: 'invite-globex',
    invited_by: 'Marcus Chen',
    sent_at: daysAgo(2),
    role: 'member',
    organization: {
      id: 'globex',
      name: 'Globex Research',
      slug: 'globex-research',
      description: 'Forecasting and anomaly detection for energy grids.',
      color: '#6366f1',
      plan: 'team',
    },
  },
]

/** How long ago the invited organization was founded, in days. */
export const INVITED_ORG_AGE_DAYS = 540
