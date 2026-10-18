import * as React from 'react'
import type {
  DashboardPreferences,
  OrgSummary,
  Organization,
  Project,
  ProjectOverview,
} from '@/features/dashboard/domain/types'

export type DashboardLayoutContextValue = {
  preferences: DashboardPreferences
  updatePreferences: (partial: Partial<DashboardPreferences>) => void
  hydrated: boolean
  /** False when browser storage is blocked or full; the session stays usable. */
  persistenceAvailable: boolean
  org: Organization
  /** Every organization the user belongs to. */
  organizations: Organization[]
  /** The counts of each organization, by id. */
  orgSummaries: Record<string, OrgSummary>
  switchOrganization: (orgId: string) => void
  openCreateOrganization: () => void
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
