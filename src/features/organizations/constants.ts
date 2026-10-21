import type { OrgRole } from '@/features/dashboard/domain/types'

export const orgRoleDescriptions: Record<OrgRole, string> = {
  Owner: 'Full control, including billing and deleting the organization.',
  Admin: 'Manage members, settings and every project.',
  Member: 'Create projects, train and deploy models.',
  Viewer: 'Read-only access to projects and results.',
}

/** The brand colours an organization can pick from. */
export const orgColors = [
  '#10b981', // lint-ok: stored with the organization
  '#0ea5e9', // lint-ok: stored with the organization
  '#6366f1', // lint-ok: stored with the organization
  '#8b5cf6', // lint-ok: stored with the organization
  '#ec4899', // lint-ok: stored with the organization
  '#f43f5e', // lint-ok: stored with the organization
  '#f59e0b', // lint-ok: stored with the organization
  '#64748b', // lint-ok: stored with the organization
]
