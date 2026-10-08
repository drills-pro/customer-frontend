import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { EllipsisVertical, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { useProjectDetail } from '@/features/dashboard/context'
import { unavailable } from '@/lib/unavailable'
import {
  projectSectionLink,
  projectSections,
} from '@/features/dashboard/navigation'
import {
  Collaborators,
  ProjectMark,
} from '@/features/projects/components/project-ui'

export const Route = createFileRoute('/_app/projects_/$projectId/_nav')({
  component: ProjectNavLayout,
})

// The line-tab treatment from `tabsListVariants`, applied to router links.
// No `!important`: nothing else styles these elements.
const sectionTabClass =
  'shrink-0 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-1 py-3 text-sm font-medium text-muted-foreground shadow-none transition-colors outline-hidden hover:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active]:border-b-primary data-[active]:text-primary'

function ProjectNavLayout() {
  const { project, details } = useProjectDetail()

  async function shareProject() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Project link copied to clipboard.')
    } catch {
      toast.info('Select the address bar to copy this project link.')
    }
  }

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] flex-1 p-4 sm:p-6"
    >
      <RouteBreadcrumbs className="mb-3" />

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ProjectMark project={project} className="size-10" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1>{project.name}</h1>
              <Badge
                variant="secondary"
                className="border-0 bg-muted font-medium text-muted-foreground"
              >
                {project.task}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Collaborators team={details.team} overflow={0} className="mr-2" />
          <Button
            size="lg"
            variant="outline"
            className="px-3.5"
            onClick={shareProject}
          >
            Share
          </Button>
          <Button asChild size="lg" className="px-3.5">
            <Link
              to="/projects/$projectId/training/new"
              params={{ projectId: project.id }}
            >
              <Plus />
              New Training
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More project actions"
            onClick={() => unavailable('More project actions')}
          >
            <EllipsisVertical />
          </Button>
        </div>
      </div>

      <nav
        aria-label="Project sections"
        className="flex items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-border"
      >
        {projectSections.map((section) => (
          <Link
            key={section}
            to={projectSectionLink(section)}
            params={{ projectId: project.id }}
            activeProps={{ 'data-active': 'true' }}
            className={sectionTabClass}
          >
            {section}
          </Link>
        ))}
      </nav>

      <Outlet />
    </main>
  )
}
