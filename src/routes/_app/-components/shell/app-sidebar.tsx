import { Link } from '@tanstack/react-router'
import { FolderKanban, House, LayoutGrid } from 'lucide-react'
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
import type { Project } from '@/features/dashboard/data'
import { unavailable } from './helpers'

type MainNavigationItem = {
  label: string
  icon: LucideIcon
} & ({ to: '/' | '/projects' } | { action: 'unavailable' })

const mainNavigation: MainNavigationItem[] = [
  { label: 'Home', icon: House, to: '/' },
  { label: 'Projects', icon: FolderKanban, to: '/projects' },
  { label: 'All Screens', icon: LayoutGrid, action: 'unavailable' },
]

export function AppSidebar({
  currentProject,
}: {
  currentProject: Project | undefined
}) {
  return (
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
                    {projectSections.map((label) => {
                      const to = projectSectionLink(label)
                      return (
                        <SidebarMenuSubItem key={label}>
                          {to ? (
                            <SidebarMenuSubButton asChild>
                              <Link
                                to={to}
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
                      )
                    })}
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
