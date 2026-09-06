import { useEffect, useState } from 'react'
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import {
  Activity,
  Bell,
  Check,
  Folder,
  House,
  RotateCcw,
  Search,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  useSidebar,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useDemo } from './store'
import { Avatar, Progress } from './components/display'
import { Button } from './components/forms'
import { Confirm } from './components/overlays'
import {
  activityLink,
  modelLink,
  projectLink,
  runLink,
  sections,
} from './navigation'

function CloseSidebarOnNavigate() {
  const location = useLocation()
  const { setOpenMobile } = useSidebar()

  useEffect(() => setOpenMobile(false), [location.pathname, setOpenMobile])
  return null
}

export function Shell() {
  const { state, update, reset, storageWarning } = useDemo()
  const [resetOpen, setResetOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams({ strict: false })
  const routeProject = state.projects.find(
    (project) => project.id === params.projectId,
  )
  const org =
    state.organizations.find(
      (organization) =>
        organization.id === (routeProject?.orgId || state.orgId),
    ) || state.organizations[0]
  const projects = state.projects.filter((project) => project.orgId === org.id)
  const current =
    routeProject ||
    projects.find((project) => project.id === state.selectedProjectId) ||
    projects.at(0)
  const projectIds = new Set(projects.map((project) => project.id))
  const activity = state.activities.filter((item) =>
    projectIds.has(item.projectId),
  )

  useEffect(() => {
    if (
      routeProject &&
      (state.orgId !== routeProject.orgId ||
        state.selectedProjectId !== routeProject.id)
    ) {
      update((draft) => {
        draft.orgId = routeProject.orgId
        draft.selectedProjectId = routeProject.id
      })
    }
  }, [routeProject?.id, state.orgId, state.selectedProjectId])

  useEffect(() => {
    setSearchOpen(false)
    setActivityOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [])

  const results = [
    ...projects.map((project) => ({
      id: project.id,
      name: project.name,
      type: 'Project',
      link: projectLink(project.id),
    })),
    ...state.models
      .filter((model) => projectIds.has(model.projectId))
      .map((model) => ({
        id: model.id,
        name: model.name,
        type: 'Model',
        link: modelLink(model.projectId, model.id),
      })),
    ...state.runs
      .filter((run) => projectIds.has(run.projectId))
      .map((run) => ({
        id: run.id,
        name: run.name,
        type: 'Training',
        link: runLink(run.projectId, run.id),
      })),
  ]
    .filter((result) => result.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <CloseSidebarOnNavigate />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-slate-200 p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" tooltip="DRILLS home">
                  <Link to="/" aria-label="DRILLS home">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                      D
                    </span>
                    <span className="font-semibold tracking-tight">DRILLS</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent role="navigation" aria-label="Main navigation">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/'}
                      tooltip="Home"
                    >
                      <Link to="/">
                        <House />
                        <span>Home</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith('/projects')}
                      tooltip="Projects"
                    >
                      <Link to="/projects">
                        <Folder />
                        <span>Projects</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                CURRENT PROJECT
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {current ? (
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={current.name}>
                        <Link {...projectLink(current.id)}>
                          <span
                            className="size-2 rounded-full"
                            style={{ background: current.color }}
                          />
                          <span>{current.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {sections.map((section) => {
                          const active =
                            params.section === section ||
                            (section !== 'overview' &&
                              location.pathname.includes(`/${section}`))
                          return (
                            <SidebarMenuSubItem key={section}>
                              <SidebarMenuSubButton asChild isActive={active}>
                                <Link
                                  {...projectLink(current.id, section)}
                                  activeOptions={{ exact: true }}
                                >
                                  {section[0].toUpperCase() + section.slice(1)}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  </SidebarMenu>
                ) : (
                  <p className="px-2 text-xs text-muted-foreground">
                    Create a project to get started.
                  </p>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-slate-200 p-3">
            <div className="space-y-2 rounded-lg bg-slate-100/80 p-3 group-data-[collapsible=icon]:hidden">
              <div className="flex justify-between text-xs font-medium">
                <span>GPU hours</span>
                <span>42 / 100</span>
              </div>
              <Progress value={42} />
              <p className="text-xs text-muted-foreground">
                Team workspace · Demo
              </p>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setResetOpen(true)}
                  tooltip="Reset demo data"
                >
                  <RotateCcw />
                  <span>Reset demo data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label={`Current organization: ${org.name}`}
                >
                  <span
                    className="flex size-6 items-center justify-center rounded-md text-xs font-semibold text-white"
                    style={{ background: org.color }}
                  >
                    {org.name[0]}
                  </span>
                  {org.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="start">
                <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {state.organizations.map((organization) => (
                  <DropdownMenuItem
                    key={organization.id}
                    onSelect={() => {
                      update((draft) => {
                        draft.orgId = organization.id
                        draft.selectedProjectId =
                          draft.projects.find(
                            (project) => project.orgId === organization.id,
                          )?.id || ''
                      })
                      void navigate({ to: '/' })
                    }}
                  >
                    <span
                      className="flex size-7 items-center justify-center rounded-md text-xs font-semibold text-white"
                      style={{ background: organization.color }}
                    >
                      {organization.name[0]}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <strong>{organization.name}</strong>
                      <small>
                        {organization.plan} ·{' '}
                        {
                          state.projects.filter(
                            (project) => project.orgId === organization.id,
                          ).length
                        }{' '}
                        projects
                      </small>
                    </span>
                    {organization.id === org.id && (
                      <Check className="text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              className="mx-auto hidden w-full max-w-md justify-start border-0 bg-slate-100 ring-1 ring-slate-200 text-slate-500 hover:bg-slate-200/60 sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search />
              <span className="flex-1 text-left">
                Search projects, models, runs…
              </span>
              <kbd>⌘ K</kbd>
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground lg:inline">
                1,240 credits
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Recent activity"
                onClick={() => setActivityOpen(true)}
              >
                <Bell />
              </Button>
              <Avatar />
            </div>
          </header>
          {storageWarning && (
            <Alert className="m-4 mb-0">
              <AlertDescription>{storageWarning}</AlertDescription>
            </Alert>
          )}
          <main id="main" className="main-content flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
          <footer className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              All systems operational
            </span>
            <span>DRILLS demo · Sample metrics & local data</span>
          </footer>
        </SidebarInset>

        {resetOpen && (
          <Confirm
            title="Reset demo data?"
            description="This removes your local changes and restores the original projects, datasets, training runs, models, and deployments."
            label="Reset demo data"
            onClose={() => setResetOpen(false)}
            onConfirm={() => {
              reset()
              void navigate({ to: '/' })
            }}
          />
        )}

        <CommandDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          title="Search your workspace"
        >
          <Command>
            <CommandInput
              autoFocus
              placeholder="Search projects, models, runs…"
              value={query}
              onValueChange={setQuery}
              aria-label="Search workspace"
            />
            <CommandList>
              <CommandEmpty>No results in {org.name}.</CommandEmpty>
              <CommandGroup heading="Workspace">
                {results.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.name} ${result.type}`}
                    onSelect={() => {
                      setSearchOpen(false)
                      void navigate(result.link)
                    }}
                  >
                    <span>{result.name}</span>
                    <small className="ml-auto text-muted-foreground">
                      {result.type}
                    </small>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>

        <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Recent activity</SheetTitle>
              <SheetDescription>Latest changes in {org.name}.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
              {activity.map((item) => (
                <Button
                  key={item.id}
                  asChild
                  variant="ghost"
                  className="h-auto justify-start py-3 text-left whitespace-normal"
                >
                  <Link
                    {...activityLink(
                      item.projectId,
                      item.kind,
                      item.resourceId,
                    )}
                    onClick={() => setActivityOpen(false)}
                  >
                    <Activity className="self-start" />
                    <span>{item.text}</span>
                  </Link>
                </Button>
              ))}
              {!activity.length && (
                <p className="text-sm text-muted-foreground">
                  Your project activity will appear here.
                </p>
              )}
            </div>
            <SheetFooter>
              <Button variant="ghost" onClick={() => setActivityOpen(false)}>
                Close
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </SidebarProvider>
    </TooltipProvider>
  )
}
