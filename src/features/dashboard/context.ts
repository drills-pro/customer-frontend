import * as React from 'react'
import type {
  Organization,
  Project,
  ProjectOverview,
  DashboardPreferences,
  organizations,
} from '@/features/dashboard/data'

export type DashboardLayoutContextValue = {
  preferences: DashboardPreferences
  updatePreferences: (partial: Partial<DashboardPreferences>) => void
  hydrated: boolean
  org: (typeof organizations)[number]
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
