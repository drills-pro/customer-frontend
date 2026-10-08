import type {
  OrgInvitation,
  OrgMember,
  OrgPlan,
  OrgRole,
  Organization,
} from '../domain/types'

const DAY = 24 * 60 * 60 * 1000
/** Fixtures are relative to load so their relative times stay plausible. */
const SEED_NOW = Date.now()

export const organizations: Organization[] = [
  {
    id: 'acme',
    name: 'Acme AI',
    initial: 'A',
    color: '#10b981',
    slug: 'acme-ai',
    plan: 'Team',
    description: 'Applied ML for retail and customer support.',
    createdAt: SEED_NOW - DAY * 412,
    yourRole: 'Admin',
  },
  {
    id: 'northwind',
    name: 'Northwind Labs',
    initial: 'N',
    color: '#0ea5e9',
    slug: 'northwind-labs',
    plan: 'Enterprise',
    description: 'Computer vision research for manufacturing lines.',
    createdAt: SEED_NOW - DAY * 980,
    yourRole: 'Member',
  },
  {
    id: 'solo',
    name: 'Solo Sandbox',
    initial: 'S',
    color: '#f59e0b',
    slug: 'alex-sandbox',
    plan: 'Free',
    description: 'Personal experiments.',
    createdAt: SEED_NOW - DAY * 60,
    yourRole: 'Owner',
  },
]

export const planDetails: Record<
  OrgPlan,
  { seats: number; projects: number; credits: number; price: string }
> = {
  Free: { seats: 3, projects: 3, credits: 100, price: '$0' },
  Team: { seats: 30, projects: 25, credits: 2000, price: '$249/mo' },
  Enterprise: { seats: 250, projects: 200, credits: 20000, price: 'Custom' },
}

export const orgCreditsUsed: Record<string, number> = {
  acme: 760,
  northwind: 12_480,
  solo: 42,
}

export const orgRoleDescriptions: Record<OrgRole, string> = {
  Owner: 'Full control, including billing and deleting the organization.',
  Admin: 'Manage members, settings and every project.',
  Member: 'Create projects, train and deploy models.',
  Viewer: 'Read-only access to projects and results.',
}

export const orgColors = [
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
const activity = [
  'Active now',
  '12m ago',
  '1h ago',
  '3h ago',
  'Yesterday',
  '3d ago',
  '2w ago',
]

const you = {
  name: 'Alex Rivera',
  initials: 'AR',
  color: '#8b5cf6',
}

export function currentUserMember(
  orgId: string,
  role: OrgRole,
  domain: string,
  joinedAt: number,
): OrgMember {
  return {
    id: `${orgId}-you`,
    ...you,
    email: `alex@${domain}`,
    role,
    joinedAt,
    lastActive: 'Active now',
    status: 'active',
    you: true,
  }
}

/** Deterministic member rows so every reload shows the same people. */
function seedMembers(
  org: Organization,
  count: number,
  domain: string,
  invited: number,
): OrgMember[] {
  const members: OrgMember[] = [
    currentUserMember(org.id, org.yourRole, domain, org.createdAt + DAY * 3),
  ]
  for (let index = 0; members.length < count; index++) {
    const first = firstNames[index % firstNames.length]
    const last = lastNames[(index * 5) % lastNames.length]
    const role: OrgRole =
      org.yourRole !== 'Owner' && index === 0
        ? 'Owner'
        : index % 7 === 1
          ? 'Admin'
          : index % 5 === 4
            ? 'Viewer'
            : 'Member'
    const isInvited = index >= count - 1 - invited
    members.push({
      id: `${org.id}-member-${index}`,
      name: `${first} ${last}`,
      email:
        `${first}.${last}${index >= firstNames.length ? index : ''}@${domain}`.toLowerCase(),
      initials: `${first[0]}${last[0]}`,
      color: orgColors[(index * 3) % orgColors.length],
      role: isInvited && role === 'Owner' ? 'Member' : role,
      // The founding owner joined when the org was created.
      joinedAt:
        role === 'Owner'
          ? org.createdAt
          : SEED_NOW - DAY * ((index * 17) % 380) - DAY,
      lastActive: isInvited ? 'Pending' : activity[index % activity.length],
      status: isInvited ? 'invited' : 'active',
    })
  }
  return members
}

export const seedOrgMembers: Record<string, OrgMember[]> = {
  acme: seedMembers(organizations[0], 26, 'acme.ai', 2),
  northwind: seedMembers(organizations[1], 88, 'northwind.io', 2),
  solo: seedMembers(organizations[2], 1, 'sandbox.dev', 0),
}

export const orgInvitations: OrgInvitation[] = [
  {
    id: 'invite-globex',
    invitedBy: 'Marcus Chen',
    sentAt: SEED_NOW - DAY * 2,
    organization: {
      id: 'globex',
      name: 'Globex Research',
      initial: 'G',
      color: '#6366f1',
      slug: 'globex-research',
      plan: 'Team',
      description: 'Forecasting and anomaly detection for energy grids.',
      createdAt: SEED_NOW - DAY * 540,
      yourRole: 'Member',
    },
  },
]
