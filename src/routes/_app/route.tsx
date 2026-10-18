import * as React from 'react'
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router'

import { toast } from 'sonner'

import { setCurrentOrganizationId } from '@/api/session'
import { PageError } from '@/components/shared/query-states'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { TooltipProvider } from '@/components/ui/tooltip'
import type {
  DashboardPreferences,
  Organization,
  Project,
} from '@/features/dashboard/domain/types'
import {
  DashboardLayoutContext,
  useDashboardLayout,
} from '@/features/dashboard/context'
import { useApplyTheme } from '@/features/dashboard/theme'
import {
  useOrganizations,
  useWorkspaceSearch,
} from '@/features/organizations/queries'
import type { OrganizationEntry } from '@/features/organizations/queries'
import { useProjects } from '@/features/projects/queries'
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

type PreferencesState = ReturnType<typeof usePreferences>

/**
 * The shell needs to know which organizations exist before it can render, so
 * it waits for them. Every page below can then rely on a current organization.
 */
function AppLayout() {
  const preferencesState = usePreferences()
  const organizations = useOrganizations()
  useApplyTheme(preferencesState.preferences.theme, preferencesState.hydrated)

  if (organizations.error) {
    return (
      <div className="flex min-h-svh bg-background">
        <PageError
          title="Could not load your workspace"
          error={organizations.error}
          onRetry={() => void organizations.refetch()}
        />
      </div>
    )
  }
  if (!preferencesState.hydrated || !organizations.data?.length) {
    return (
      <div
        className="flex min-h-svh items-center justify-center bg-background"
        aria-busy="true"
        aria-label="Loading workspace"
      >
        <Spinner />
      </div>
    )
  }
  return <AppShell {...preferencesState} entries={organizations.data} />
}

function AppShell({
  preferences,
  updatePreferences,
  hydrated,
  persistenceAvailable,
  entries,
}: PreferencesState & { entries: OrganizationEntry[] }) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const [createOrgOpen, setCreateOrgOpen] = React.useState(false)
  const navigate = useNavigate()
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

  const organizations = entries.map((entry) => entry.organization)
  const orgSummaries = Object.fromEntries(
    entries.map((entry) => [entry.organization.id, entry.summary]),
  )
  const org =
    organizations.find((item) => item.id === preferences.organizationId) ??
    organizations[0]
  // During render, not in an effect: children's queries start before a
  // parent's effects run, and their first requests must already name it.
  setCurrentOrganizationId(org.id)

  const orgProjects = useProjects(org.id).data
  const currentProject: Project | undefined =
    orgProjects?.find((item) => item.id === projectId) ?? orgProjects?.at(0)
  const searchHits = useWorkspaceSearch(org.id).data

  function selectOrganization(partial: Partial<DashboardPreferences>) {
    // An open project belongs to the organization being left. Leave its page
    // first so its own org-sync effect can't immediately flip the choice back.
    if (projectId) {
      void navigate({ to: '/' }).then(() => updatePreferences(partial))
    } else {
      updatePreferences(partial)
    }
  }

  function switchOrganization(nextOrgId: string) {
    if (nextOrgId === org.id) return
    selectOrganization({ organizationId: nextOrgId })
  }

  function organizationCreated(created: Organization) {
    updatePreferences({ organizationId: created.id })
    void navigate({
      to: '/organizations/$orgId/overview',
      params: { orgId: created.id },
    })
    toast.success(`${created.name} created. You're now working in it.`)
  }

  const orgEntries = entries.map(({ organization, summary }) => ({
    org: organization,
    projects: summary.projects,
    members: summary.members,
  }))

  return (
    <DashboardLayoutContext.Provider
      value={{
        preferences,
        updatePreferences,
        hydrated,
        persistenceAvailable,
        org,
        organizations,
        orgSummaries,
        switchOrganization,
        openCreateOrganization: () => setCreateOrgOpen(true),
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
              onSwitchOrganization={switchOrganization}
              onCreateOrganization={() => setCreateOrgOpen(true)}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenShortcuts={() => setShortcutsOpen(true)}
            />
            <Outlet />
          </SidebarInset>

          <WorkspaceSearch
            open={searchOpen}
            onOpenChange={setSearchOpen}
            items={buildSearchItems({ organizations, hits: searchHits ?? [] })}
          />
          <KeyboardShortcutsDialog
            open={shortcutsOpen}
            onOpenChange={setShortcutsOpen}
          />
          <CreateOrganizationDialog
            open={createOrgOpen}
            onOpenChange={setCreateOrgOpen}
            organizations={organizations}
            onCreated={organizationCreated}
          />
        </SidebarProvider>
      </TooltipProvider>
    </DashboardLayoutContext.Provider>
  )
}
