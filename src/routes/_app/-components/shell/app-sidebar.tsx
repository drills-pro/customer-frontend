import { Link } from '@tanstack/react-router'
import {
  Building2,
  FolderKanban,
  House,
  LayoutGrid,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  projectSectionLink,
  projectSections,
} from '@/features/dashboard/navigation'
import type { Organization, Project } from '@/features/dashboard/data'
import { unavailable } from '@/lib/unavailable'

type MainNavigationItem = {
  label: string
  icon: LucideIcon
} & (
  | {
      to:
        '/' | '/projects' | '/organizations' | '/organizations/$orgId/settings'
    }
  | { action: 'unavailable' }
)

const mainNavigation: MainNavigationItem[] = [
  { label: 'Home', icon: House, to: '/' },
  { label: 'Projects', icon: FolderKanban, to: '/projects' },
  { label: 'Organizations', icon: Building2, to: '/organizations' },
  { label: 'Settings', icon: Settings, to: '/organizations/$orgId/settings' },
  { label: 'All Screens', icon: LayoutGrid, action: 'unavailable' },
]

export function AppSidebar({
  org,
  currentProject,
}: {
  org: Organization
  currentProject: Project | undefined
}) {
  return (
    <Sidebar collapsible="icon">
      {/* The collapsed rail is 3rem wide: `px-2` leaves exactly the 2rem the
          logo mark needs, where `px-3` would clip it. */}
      <SidebarHeader className="h-14 justify-center border-b px-3 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="DRILLS home"
              className="font-semibold"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
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
                          params={{ orgId: org.id }}
                          // `/organizations` must not light up on an org's
                          // settings page, which the Settings item owns.
                          activeOptions={{
                            exact:
                              item.to === '/' || item.to === '/organizations',
                          }}
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
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground/80">
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
                      {/* An icon-sized slot, like the lucide icons above, so
                          the collapsed button shows only the mark. */}
                      <span
                        aria-hidden="true"
                        className="flex size-4 shrink-0 items-center justify-center"
                      >
                        <span className="size-2 rounded-full bg-primary" />
                      </span>
                      <span>{currentProject.name}</span>
                    </Link>
                  ) : (
                    <span>No active project</span>
                  )}
                </SidebarMenuButton>

                {currentProject && (
                  <SidebarMenuSub>
                    {projectSections.map((label) => (
                      <SidebarMenuSubItem key={label}>
                        <SidebarMenuSubButton asChild>
                          <Link
                            to={projectSectionLink(label)}
                            params={{ projectId: currentProject.id }}
                            activeProps={{ 'data-active': 'true' }}
                          >
                            {label}
                          </Link>
                        </SidebarMenuSubButton>
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
  )
}
