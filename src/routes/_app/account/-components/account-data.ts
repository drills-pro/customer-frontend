/** Demo account data. Every change made on the account pages is session-only. */

export const accountRoles = ['ML Engineer', 'Data Scientist', 'Admin'] as const
export type AccountRole = (typeof accountRoles)[number]

export type AccountProfile = {
  fullName: string
  username: string
  email: string
  role: AccountRole
  bio: string
}

export const currentUser = {
  initials: 'AR',
  color: '#8b5cf6',
  profile: {
    fullName: 'Alex Rivera',
    username: 'alexrivera',
    email: 'alex@acme.ai',
    role: 'ML Engineer',
    bio: 'Building retail vision models.',
  } satisfies AccountProfile,
}

export const plan = {
  name: 'Team plan',
  badge: 'TEAM PLAN',
  creditsUsed: 760,
  creditsTotal: 2000,
  renews: 'Oct 12',
}

export function creditsLabel() {
  return `${plan.creditsUsed.toLocaleString('en-US')} / ${plan.creditsTotal.toLocaleString('en-US')}`
}

export function creditsPercent() {
  return Math.round((plan.creditsUsed / plan.creditsTotal) * 100)
}

export type Session = {
  id: string
  device: string
  location: string
  kind: 'desktop' | 'mobile'
  lastActive: string
  current?: boolean
}

export const sessions: Session[] = [
  {
    id: 'session-mac',
    device: 'Chrome on macOS',
    location: 'Bangkok, TH',
    kind: 'desktop',
    lastActive: 'Current session',
    current: true,
  },
  {
    id: 'session-iphone',
    device: 'Safari on iPhone',
    location: 'Bangkok, TH',
    kind: 'mobile',
    lastActive: 'Last active 2 hours ago',
  },
]

export const paymentMethod = { brand: 'Visa', last4: '4417', expires: '08/28' }

export const invoices = [
  { id: 'inv-2026-09', period: 'Sep 2026', amount: '$249.00' },
  { id: 'inv-2026-08', period: 'Aug 2026', amount: '$249.00' },
  { id: 'inv-2026-07', period: 'Jul 2026', amount: '$249.00' },
]

export const notificationSettings = [
  {
    id: 'training-completed',
    title: 'Training run completed',
    description: 'When a run finishes or fails.',
    enabled: true,
  },
  {
    id: 'deployment-status',
    title: 'Deployment status changes',
    description: 'When a live endpoint goes up or down.',
    enabled: true,
  },
  {
    id: 'weekly-usage',
    title: 'Weekly usage summary',
    description: 'Credits and GPU hours, every Monday.',
    enabled: false,
  },
  {
    id: 'product-updates',
    title: 'Product updates',
    description: 'New features and changes to DRILLS.',
    enabled: true,
  },
]

export type TeamRole = 'Admin' | 'Member'

export type TeamMember = {
  name: string
  email: string
  initials: string
  color: string
  role: TeamRole
  you?: boolean
  invited?: boolean
}

export const teamMembers: TeamMember[] = [
  {
    name: 'Alex Rivera',
    email: 'alex@acme.ai',
    initials: 'AR',
    color: '#8b5cf6',
    role: 'Admin',
    you: true,
  },
  {
    name: 'Priya Nair',
    email: 'priya@acme.ai',
    initials: 'PN',
    color: '#f59e0b',
    role: 'Member',
  },
  {
    name: 'Sam Chen',
    email: 'sam@acme.ai',
    initials: 'SC',
    color: '#10b981',
    role: 'Member',
  },
]

/** "light" → "Light". */
export function themeLabel(theme: string) {
  return theme.charAt(0).toUpperCase() + theme.slice(1)
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
