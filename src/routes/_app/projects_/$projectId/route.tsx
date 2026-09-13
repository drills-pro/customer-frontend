import { createFileRoute, Outlet } from '@tanstack/react-router'
import * as React from 'react'

import {
  ProjectDetailContext,
  useDashboardLayout,
} from '@/features/dashboard/context'
import { resolveProject } from '@/features/dashboard/data'
import { ProjectNotFound } from './-components/project-overview'

export const Route = createFileRoute('/_app/projects_/$projectId')({
  component: ProjectDetailRoute,
})

function ProjectDetailRoute() {
  const { projectId } = Route.useParams()
  const { preferences, updatePreferences, hydrated } = useDashboardLayout()
  const resolved = resolveProject(projectId, preferences)

  React.useEffect(() => {
    if (
      hydrated &&
      resolved &&
      preferences.organizationId !== resolved.project.orgId
    ) {
      updatePreferences({ organizationId: resolved.project.orgId })
    }
  }, [hydrated, preferences.organizationId, resolved, updatePreferences])

  if (!hydrated) {
    return <main id="dashboard-main" className="min-h-96 flex-1" />
  }
  if (!resolved) return <ProjectNotFound projectId={projectId} />

  const { project, details, organization } = resolved

  return (
    <ProjectDetailContext.Provider value={{ project, details, organization }}>
      <Outlet />
    </ProjectDetailContext.Provider>
  )
}
