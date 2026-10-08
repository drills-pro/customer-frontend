import type { DashboardPreferences } from '../domain/types'
import { projectOverviews, projects } from '../data/projects'
import { findOrganization } from './organization-lookup'

export function allProjects(preferences: DashboardPreferences) {
  return [
    ...preferences.createdProjects.map((item) => item.project),
    ...projects,
  ]
}

export function resolveProject(
  projectId: string,
  preferences: DashboardPreferences,
) {
  const created = preferences.createdProjects.find(
    (item) => item.project.id === projectId,
  )
  const project =
    created?.project ?? projects.find((item) => item.id === projectId)
  const details = created?.overview ?? projectOverviews[projectId]
  const organization = project
    ? findOrganization(project.orgId, preferences)
    : undefined
  return project && details && organization
    ? { project, details, organization }
    : undefined
}
