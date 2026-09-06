import { Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { Project } from '../data'
import { projectLink, sections, trainingLink } from '../navigation'
import { useDemo } from '../store'
import { Avatar, ProjectIcon } from './display'
import { Button } from './forms'

export function ProjectHead({
  project,
  section,
}: {
  project: Project
  section: string
}) {
  const { state, notify } = useDemo()
  const organization = state.organizations.find(
    (item) => item.id === project.orgId,
  )
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>{organization?.name}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="project-head flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="project-title flex items-start gap-3">
          <ProjectIcon project={project} />
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
              {project.name}
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {project.task}
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
        </div>
        <div className="actions flex items-center gap-2">
          <div className="avatar-stack flex -space-x-2">
            <Avatar small />
            <Avatar name="Priya Nair" small />
            <Avatar name="Sam Cole" small />
          </div>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href)
                notify(
                  'Project link copied. This demo data is local to your browser.',
                )
              } catch {
                notify('Select the address bar to copy this project link.')
              }
            }}
          >
            Share
          </Button>
          <Button asChild>
            <Link {...trainingLink(project.id)}>
              <Plus /> New Training
            </Link>
          </Button>
        </div>
      </div>
      <nav
        className="project-tabs flex gap-1 overflow-x-auto border-b border-slate-200"
        aria-label="Project sections"
      >
        {sections.map((item) => (
          <Button
            key={item}
            variant={section === item ? 'subtle' : 'ghost'}
            asChild
          >
            <Link {...projectLink(project.id, item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  )
}

export function BackLink({
  project,
  section,
  name,
}: {
  project: Project
  section: string
  name: string
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              {...projectLink(project.id, section)}
              className="inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              {section[0].toUpperCase() + section.slice(1)}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
