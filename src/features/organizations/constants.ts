import type { OrgRole } from '@/features/dashboard/domain/types'

export const orgRoleDescriptions: Record<OrgRole, string> = {
  Owner: 'Full control, including billing and deleting the organization.',
  Admin: 'Manage members, settings and every project.',
  Member: 'Create projects, train and deploy models.',
  Viewer: 'Read-only access to projects and results.',
}

/** The brand colours an organization can pick from. */
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
