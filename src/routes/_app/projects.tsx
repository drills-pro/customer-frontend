import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  allProjects,
  projectTaskTypes,
  projects,
} from '@/features/dashboard/data'
import type { Project } from '@/features/dashboard/data'
import {
  ProjectCard,
  ProjectFilters,
  ProjectsTable,
} from './-components/projects-list'
import type { ProjectFiltersState } from './-components/projects-list'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage,
})

const defaultProjectFilters: ProjectFiltersState = {
  query: '',
  task: 'all',
  status: 'all',
  sort: 'recent',
  view: 'grid',
}

const taskTypes = [
  ...new Set([...projects.map((project) => project.task), ...projectTaskTypes]),
]
const statuses: Array<Project['status']> = ['Active', 'Draft', 'Archived']

function ProjectsPage() {
  const { preferences, org } = useDashboardLayout()
  const [filters, setFilters] = React.useState<ProjectFiltersState>(
    defaultProjectFilters,
  )
  const updateFilters = (patch: Partial<ProjectFiltersState>) =>
    setFilters((current) => ({ ...current, ...patch }))

  // The header switcher owns the organization: this page lists only its projects.
  const orgProjects = allProjects(preferences).filter(
    (project) => project.orgId === org.id,
  )
  const normalizedQuery = filters.query.trim().toLowerCase()
  const visibleProjects = orgProjects
    .filter(
      (project) =>
        project.name.toLowerCase().includes(normalizedQuery) &&
        (filters.task === 'all' || project.task === filters.task) &&
        (filters.status === 'all' || project.status === filters.status),
    )
    .sort((left, right) =>
      filters.sort === 'name'
        ? left.name.localeCompare(right.name)
        : right.updatedAt - left.updatedAt,
    )

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] flex-1 p-4 sm:p-6"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            {orgProjects.length}{' '}
            {orgProjects.length === 1 ? 'project' : 'projects'} in {org.name}
          </p>
        </div>
        <Button asChild size="lg" className="px-3.5">
          <Link to="/projects/new">
            <Plus />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      <ProjectFilters
        filters={filters}
        onFiltersChange={updateFilters}
        taskTypes={taskTypes}
        statuses={statuses}
      />

      {visibleProjects.length ? (
        filters.view === 'grid' ? (
          <section
            aria-label="Projects"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            <Link
              to="/projects/new"
              className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-input text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary-muted/30 hover:text-primary"
            >
              <Plus className="size-6" />
              New project
            </Link>
          </section>
        ) : (
          <ProjectsTable projects={visibleProjects} />
        )
      ) : (
        <Empty className="min-h-80 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>
              {orgProjects.length
                ? 'No matching projects'
                : `No projects in ${org.name} yet`}
            </EmptyTitle>
            <EmptyDescription>
              {orgProjects.length
                ? 'Try a different search or change the selected filters.'
                : 'Create a project to start training models, or switch organization.'}
            </EmptyDescription>
          </EmptyHeader>
          {orgProjects.length === 0 && (
            <Button asChild>
              <Link to="/projects/new">
                <Plus />
                New project
              </Link>
            </Button>
          )}
        </Empty>
      )}
    </main>
  )
}
