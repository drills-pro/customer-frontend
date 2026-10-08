import * as React from 'react'
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router'

import { toast } from 'sonner'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { allOrganizations, allProjects } from '@/features/dashboard/data'
import type {
  OrgMember,
  Organization,
  Project,
} from '@/features/dashboard/data'
import { initialMembers } from '@/features/dashboard/selectors/organizations'
import { orgDeployments } from '@/features/dashboard/selectors/deployments'
import { orgTrainingRuns } from '@/features/dashboard/selectors/training-runs'
import {
  DashboardLayoutContext,
  useDashboardLayout,
} from '@/features/dashboard/context'
import { useApplyTheme } from '@/features/dashboard/theme'
import {
  AppHeader,
  AppSidebar,
  buildSearchItems,
  KeyboardShortcutsDialog,
  useAppShortcuts,
  usePreferences,
  WorkspaceSearch,
} from './-components/shell'
import { CreateOrganizationDialog } from './organizations_/-components/create-organization-dialog'

export { useDashboardLayout }

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { preferences, updatePreferences, hydrated, persistenceAvailable } =
    usePreferences()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const [createOrgOpen, setCreateOrgOpen] = React.useState(false)
  const [memberLists, setMemberLists] = React.useState<
    Record<string, OrgMember[]>
  >({})
  const navigate = useNavigate()
  useApplyTheme(preferences.theme, hydrated)
  const { projectId } = useParams({ strict: false })

  useAppShortcuts({
    toggleSearch: () => {
      setShortcutsOpen(false)
      setSearchOpen((open) => !open)
    },
    toggleShortcuts: () => {
      setSearchOpen(false)
      setShortcutsOpen((open) => !open)
    },
    openShortcuts: () => setShortcutsOpen(true),
  })

  const organizations = allOrganizations(preferences)
  const org =
    organizations.find((item) => item.id === preferences.organizationId) ??
    organizations[0]

  const membersOf = (item: Organization) =>
    memberLists[item.id] ?? initialMembers(item)

  const updateMembers = React.useCallback(
    (item: Organization, update: (members: OrgMember[]) => OrgMember[]) =>
      setMemberLists((current) => ({
        ...current,
        [item.id]: update(current[item.id] ?? initialMembers(item)),
      })),
    [],
  )

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

  function createOrganization(created: Organization) {
    updatePreferences({
      createdOrganizations: [...preferences.createdOrganizations, created],
      organizationId: created.id,
    })
    void navigate({
      to: '/organizations/$orgId/overview',
      params: { orgId: created.id },
    })
    toast.success(`${created.name} created. You're now working in it.`)
  }

  const orgEntries = organizations.map((item) => ({
    org: item,
    projects: availableProjects.filter((project) => project.orgId === item.id)
      .length,
    members: membersOf(item).filter((member) => member.status === 'active')
      .length,
  }))

  const searchItems = buildSearchItems({
    organizations,
    projects: orgProjects,
    trainingRuns: orgTrainingRuns(preferences, org.id),
    deployments: orgDeployments(preferences, org.id),
  })

  return (
    <DashboardLayoutContext.Provider
      value={{
        preferences,
        updatePreferences,
        hydrated,
        persistenceAvailable,
        org,
        organizations,
        switchOrganization,
        openCreateOrganization: () => setCreateOrgOpen(true),
        membersOf,
        updateMembers,
      }}
    >
      <TooltipProvider>
        <SidebarProvider
          style={{ '--sidebar-width': '15rem' } as React.CSSProperties}
        >
          <a href="#dashboard-main" className="skip-link">
            Skip to content
          </a>

          <AppSidebar org={org} currentProject={currentProject} />

          <SidebarInset
            className="min-w-0 bg-background"
            data-testid="dashboard-app"
            data-hydrated={hydrated}
          >
            <AppHeader
              org={org}
              orgEntries={orgEntries}
              theme={preferences.theme}
              notificationsRead={preferences.notificationsRead}
              onSwitchOrganization={switchOrganization}
              onCreateOrganization={() => setCreateOrgOpen(true)}
              onMarkNotificationsRead={() =>
                updatePreferences({ notificationsRead: true })
              }
              onOpenSearch={() => setSearchOpen(true)}
              onOpenShortcuts={() => setShortcutsOpen(true)}
            />
            <Outlet />
          </SidebarInset>

          <WorkspaceSearch
            open={searchOpen}
            onOpenChange={setSearchOpen}
            items={searchItems}
          />
          <KeyboardShortcutsDialog
            open={shortcutsOpen}
            onOpenChange={setShortcutsOpen}
          />
          <CreateOrganizationDialog
            open={createOrgOpen}
            onOpenChange={setCreateOrgOpen}
            organizations={organizations}
            onCreate={createOrganization}
          />
        </SidebarProvider>
      </TooltipProvider>
    </DashboardLayoutContext.Provider>
  )
}
