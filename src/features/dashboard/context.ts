import * as React from 'react'
import type {
  Organization,
  OrgMember,
  Project,
  ProjectOverview,
  DashboardPreferences,
} from '@/features/dashboard/data'

export type DashboardLayoutContextValue = {
  preferences: DashboardPreferences
  updatePreferences: (partial: Partial<DashboardPreferences>) => void
  hydrated: boolean
  /** False when browser storage is blocked or full; the session stays usable. */
  persistenceAvailable: boolean
  org: Organization
  /** Seeded organizations with edits applied, plus created and joined ones. */
  organizations: Organization[]
  switchOrganization: (orgId: string) => void
  openCreateOrganization: () => void
  /** Session-only member lists; changes reset on reload like the demo team. */
  membersOf: (org: Organization) => OrgMember[]
  updateMembers: (
    org: Organization,
    update: (members: OrgMember[]) => OrgMember[],
  ) => void
}

export const DashboardLayoutContext =
  React.createContext<DashboardLayoutContextValue | null>(null)

export function useDashboardLayout() {
  const context = React.useContext(DashboardLayoutContext)
  if (!context) {
    throw new Error('useDashboardLayout must be used inside the _app layout')
  }
  return context
}

export type ProjectDetailContextValue = {
  project: Project
  details: ProjectOverview
  organization: Organization
}

export const ProjectDetailContext =
  React.createContext<ProjectDetailContextValue | null>(null)

export function useProjectDetail() {
  const context = React.useContext(ProjectDetailContext)
  if (!context) {
    throw new Error(
      'useProjectDetail must be used inside the project detail layout',
    )
  }
  return context
}
