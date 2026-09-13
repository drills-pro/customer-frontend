import * as React from 'react'
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import {
  Bell,
  BellRing,
  Check,
  ChevronDown,
  FolderKanban,
  House,
  LayoutGrid,
  Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  DASHBOARD_STORAGE_KEY,
  allProjects,
  defaultPreferences,
  deployments,
  organizations,
  restorePreferences,
  trainings,
} from '@/features/dashboard/data'
import type { DashboardPreferences, Project } from '@/features/dashboard/data'
import {
  DashboardLayoutContext,
  useDashboardLayout,
} from '@/features/dashboard/context'

export { useDashboardLayout }

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

type MainNavigationItem = {
  label: string
  icon: LucideIcon
} & ({ to: '/' | '/projects' } | { action: 'unavailable' })

const mainNavigation: MainNavigationItem[] = [
  { label: 'Home', icon: House, to: '/' },
  { label: 'Projects', icon: FolderKanban, to: '/projects' },
  { label: 'All Screens', icon: LayoutGrid, action: 'unavailable' },
]

const projectNavigation = [
  'Overview',
  'Datasets',
  'Training',
  'Models',
  'Deployments',
  'Settings',
]

function unavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}

function AppLayout() {
  const [preferences, setPreferences] =
    React.useState<DashboardPreferences>(defaultPreferences)
  const [hydrated, setHydrated] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const navigate = useNavigate()
  const { projectId } = useParams({ strict: false })

  React.useEffect(() => {
    setPreferences(
      restorePreferences(window.localStorage.getItem(DASHBOARD_STORAGE_KEY)),
    )
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify(preferences),
    )
  }, [hydrated, preferences])

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

  const updatePreferences = React.useCallback(
    (partial: Partial<DashboardPreferences>) =>
      setPreferences((current) => ({ ...current, ...partial })),
    [],
  )

  const org =
    organizations.find((item) => item.id === preferences.organizationId) ??
    organizations[0]

  const availableProjects = allProjects(preferences)
  const orgProjects = availableProjects.filter((item) => item.orgId === org.id)
  const orgTrainings = trainings.filter((item) => item.orgId === org.id)
  const orgDeployments = deployments.filter((item) => item.orgId === org.id)
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

  const searchItems = [
    ...orgProjects.map((item) => ({
      id: item.id,
      label: item.name,
      group: 'Projects',
    })),
    ...orgTrainings.map((item) => ({
      id: item.id,
      label: item.name,
      group: 'Training runs',
    })),
    ...orgDeployments.map((item) => ({
      id: item.id,
      label: item.name,
      group: 'Deployments',
    })),
  ]

  return (
    <DashboardLayoutContext.Provider
      value={{ preferences, updatePreferences, hydrated, org }}
    >
      <TooltipProvider>
        <SidebarProvider
          style={{ '--sidebar-width': '15rem' } as React.CSSProperties}
        >
          <a href="#dashboard-main" className="skip-link">
            Skip to content
          </a>

          <Sidebar collapsible="icon">
            <SidebarHeader className="h-14 justify-center border-b px-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    tooltip="DRILLS home"
                    className="font-semibold"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                      D
                    </span>
                    <span>DRILLS</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent aria-label="Main navigation">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {mainNavigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <SidebarMenuItem key={item.label}>
                          {'to' in item ? (
                            <SidebarMenuButton asChild tooltip={item.label}>
                              <Link
                                to={item.to}
                                activeOptions={{ exact: item.to === '/' }}
                                activeProps={{ 'data-active': 'true' }}
                              >
                                <Icon />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              tooltip={item.label}
                              onClick={() => unavailable(item.label)}
                            >
                              <Icon />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-slate-400">
                  CURRENT PROJECT
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild={Boolean(currentProject)}
                        tooltip={currentProject?.name ?? 'No project'}
                      >
                        {currentProject ? (
                          <Link
                            to="/projects/$projectId/overview"
                            params={{ projectId: currentProject.id }}
                          >
                            <span className="size-2 rounded-full bg-indigo-500" />
                            <span>{currentProject.name}</span>
                          </Link>
                        ) : (
                          <span>No active project</span>
                        )}
                      </SidebarMenuButton>

                      {currentProject && (
                        <SidebarMenuSub>
                          {projectNavigation.map((label) => (
                            <SidebarMenuSubItem key={label}>
                              {label === 'Overview' || label === 'Datasets' ? (
                                <SidebarMenuSubButton asChild>
                                  <Link
                                    to={
                                      label === 'Overview'
                                        ? '/projects/$projectId/overview'
                                        : '/projects/$projectId/datasets'
                                    }
                                    params={{ projectId: currentProject.id }}
                                    activeProps={{ 'data-active': 'true' }}
                                  >
                                    {label}
                                  </Link>
                                </SidebarMenuSubButton>
                              ) : (
                                <SidebarMenuSubButton
                                  onClick={() => unavailable(label)}
                                >
                                  {label}
                                </SidebarMenuSubButton>
                              )}
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>

          <SidebarInset
            className="min-w-0 bg-slate-50"
            data-testid="dashboard-app"
            data-hydrated={hydrated}
          >
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/95 px-3 backdrop-blur sm:px-5">
              <SidebarTrigger aria-label="Toggle navigation" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    aria-label={`Current organization: ${org.name}`}
                    className="gap-2"
                  >
                    <span
                      className="flex size-6 items-center justify-center rounded-md text-xs font-semibold text-white"
                      style={{ backgroundColor: org.color }}
                    >
                      {org.initial}
                    </span>
                    <span className="hidden sm:inline">{org.name}</span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {organizations.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onSelect={() => switchOrganization(item.id)}
                    >
                      <span
                        className="flex size-7 items-center justify-center rounded-md text-xs font-semibold text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.initial}
                      </span>
                      <span className="flex-1">{item.name}</span>
                      {item.id === org.id && <Check className="size-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setSearchOpen(true)}
                className="mx-auto hidden h-8 w-full max-w-md items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm text-slate-400 transition-colors hover:bg-slate-200 md:flex"
                aria-label="Search projects, models, runs"
              >
                <Search className="size-4" />
                <span className="flex-1 text-left">
                  Search projects, models, runs...
                </span>
                <kbd className="rounded border bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                  ⌘K
                </kbd>
              </Button>

              <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <Badge
                  variant="secondary"
                  className="hidden rounded-full bg-indigo-50 font-medium text-indigo-700 sm:flex"
                >
                  1,240 credits
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open search"
                  className="md:hidden"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search />
                </Button>

                <DropdownMenu
                  onOpenChange={(open) =>
                    open && updatePreferences({ notificationsRead: true })
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Notifications"
                      className="relative"
                    >
                      {preferences.notificationsRead ? <Bell /> : <BellRing />}
                      {!preferences.notificationsRead && (
                        <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-3 text-sm">
                      <strong>Training complete</strong>
                      <p className="mt-1 text-muted-foreground">
                        resnet50-v3 reached 94.2% accuracy.
                      </p>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="User menu">
                      <Avatar>
                        <AvatarFallback className="bg-violet-600 text-white">
                          AR
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Alex Rivera</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => unavailable('Profile')}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => unavailable('Account settings')}
                    >
                      Account settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <Outlet />
          </SidebarInset>

          <CommandDialog
            open={searchOpen}
            onOpenChange={setSearchOpen}
            title="Search workspace"
            description="Search projects, training runs, and deployments."
          >
            <Command>
              <CommandInput placeholder="Search projects, models, runs..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {['Projects', 'Training runs', 'Deployments'].map((group) => (
                  <CommandGroup heading={group} key={group}>
                    {searchItems
                      .filter((item) => item.group === group)
                      .map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.label}
                          onSelect={() => {
                            setSearchOpen(false)
                            if (group === 'Projects') {
                              void navigate({
                                to: '/projects/$projectId/overview',
                                params: { projectId: item.id },
                              })
                            } else {
                              unavailable(item.label)
                            }
                          }}
                        >
                          <Search />
                          {item.label}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </CommandDialog>
        </SidebarProvider>
      </TooltipProvider>
    </DashboardLayoutContext.Provider>
  )
}
