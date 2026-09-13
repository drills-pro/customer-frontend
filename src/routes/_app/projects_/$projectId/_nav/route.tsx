import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { EllipsisVertical, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { useProjectDetail } from '@/features/dashboard/context'
import { Collaborators, ProjectMark } from '@/components/dashboard/project-ui'

export const Route = createFileRoute('/_app/projects_/$projectId/_nav')({
  component: ProjectNavLayout,
})

const sections = [
  'Overview',
  'Datasets',
  'Training',
  'Models',
  'Deployments',
  'Settings',
] as const

function unavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}

function ProjectNavLayout() {
  const { project, details, organization } = useProjectDetail()

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
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>{organization.name}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ProjectMark project={project} className="size-10" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1>{project.name}</h1>
              <Badge
                variant="secondary"
                className="border-0 bg-slate-100 font-medium text-slate-600"
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
        className="flex items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-slate-200"
      >
        {sections.map((section) =>
          section === 'Overview' || section === 'Datasets' ? (
            <Link
              key={section}
              to={
                section === 'Overview'
                  ? '/projects/$projectId/overview'
                  : '/projects/$projectId/datasets'
              }
              params={{ projectId: project.id }}
              activeProps={{ 'data-active': 'true' }}
              className="shrink-0 rounded-none border-x-0 border-t-0 border-b-2 !border-b-transparent bg-transparent px-1 py-3 font-medium !text-muted-foreground shadow-none hover:!text-indigo-600 data-[active]:!border-b-indigo-600 data-[active]:!text-indigo-600"
            >
              {section}
            </Link>
          ) : (
            <Button
              key={section}
              variant="ghost"
              className="h-auto shrink-0 rounded-none border-x-0 border-t-0 border-b-2 !border-b-transparent bg-transparent px-1 py-3 font-medium !text-muted-foreground shadow-none hover:!bg-transparent hover:!text-indigo-600"
              onClick={() => unavailable(section)}
            >
              {section}
            </Button>
          ),
        )}
      </nav>

      <Outlet />
    </main>
  )
}
