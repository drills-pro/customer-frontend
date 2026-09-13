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
  NewProjectCard,
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
  organization: 'all',
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
  const { preferences } = useDashboardLayout()
  const [filters, setFilters] = React.useState<ProjectFiltersState>(
    defaultProjectFilters,
  )
  const updateFilters = (patch: Partial<ProjectFiltersState>) =>
    setFilters((current) => ({ ...current, ...patch }))

  const availableProjects = allProjects(preferences)
  const organizationCount = new Set(
    availableProjects.map((project) => project.orgId),
  ).size
  const normalizedQuery = filters.query.trim().toLowerCase()
  const visibleProjects = availableProjects
    .filter(
      (project) =>
        project.name.toLowerCase().includes(normalizedQuery) &&
        (filters.organization === 'all' ||
          project.orgId === filters.organization) &&
        (filters.task === 'all' || project.task === filters.task) &&
        (filters.status === 'all' || project.status === filters.status),
    )
    .sort((left, right) =>
      filters.sort === 'name' ? left.name.localeCompare(right.name) : 0,
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
            {availableProjects.length} projects across {organizationCount}{' '}
            {organizationCount === 1 ? 'organization' : 'organizations'}
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
            <NewProjectCard />
          </section>
        ) : (
          <ProjectsTable projects={visibleProjects} />
        )
      ) : (
        <Empty className="min-h-80 border bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No matching projects</EmptyTitle>
            <EmptyDescription>
              Try a different search or change the selected filters.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  )
}
