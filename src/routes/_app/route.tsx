import * as React from 'react'
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  allProjects,
  deployments,
  organizations,
} from '@/features/dashboard/data'
import type { Project } from '@/features/dashboard/data'
import { orgTrainingRuns } from '@/features/dashboard/selectors/training-runs'
import {
  DashboardLayoutContext,
  useDashboardLayout,
} from '@/features/dashboard/context'
import {
  AppHeader,
  AppSidebar,
  buildSearchItems,
  usePreferences,
  WorkspaceSearch,
} from './-components/shell'

export { useDashboardLayout }

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { preferences, updatePreferences, hydrated, persistenceAvailable } =
    usePreferences()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const navigate = useNavigate()
  const { projectId } = useParams({ strict: false })

  React.useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [])

  const org =
    organizations.find((item) => item.id === preferences.organizationId) ??
    organizations[0]

  const availableProjects = allProjects(preferences)
  const orgProjects = availableProjects.filter((item) => item.orgId === org.id)
  const currentProject: Project | undefined =
    availableProjects.find((item) => item.id === projectId) ?? orgProjects.at(0)

  function switchOrganization(nextOrgId: string) {
    if (nextOrgId === preferences.organizationId) return
    const openProject = availableProjects.find((item) => item.id === projectId)
    if (openProject && openProject.orgId !== nextOrgId) {
      // Leave the project page first so its own org-sync effect can't
      // immediately flip organizationId back once it re-renders.
      navigate({ to: '/' }).then(() =>
        updatePreferences({ organizationId: nextOrgId }),
      )
    } else {
      updatePreferences({ organizationId: nextOrgId })
    }
  }

  const searchItems = buildSearchItems({
    projects: orgProjects,
    trainingRuns: orgTrainingRuns(preferences, org.id),
    deployments: deployments.filter((item) => item.orgId === org.id),
  })

  return (
    <DashboardLayoutContext.Provider
      value={{
        preferences,
        updatePreferences,
        hydrated,
        persistenceAvailable,
        org,
      }}
    >
      <TooltipProvider>
        <SidebarProvider
          style={{ '--sidebar-width': '15rem' } as React.CSSProperties}
        >
          <a href="#dashboard-main" className="skip-link">
            Skip to content
          </a>

          <AppSidebar currentProject={currentProject} />

          <SidebarInset
            className="min-w-0 bg-slate-50"
            data-testid="dashboard-app"
            data-hydrated={hydrated}
          >
            <AppHeader
              org={org}
              notificationsRead={preferences.notificationsRead}
              onSwitchOrganization={switchOrganization}
              onMarkNotificationsRead={() =>
                updatePreferences({ notificationsRead: true })
              }
              onOpenSearch={() => setSearchOpen(true)}
            />
            <Outlet />
          </SidebarInset>

          <WorkspaceSearch
            open={searchOpen}
            onOpenChange={setSearchOpen}
            items={searchItems}
          />
        </SidebarProvider>
      </TooltipProvider>
    </DashboardLayoutContext.Provider>
  )
}
