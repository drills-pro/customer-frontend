import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
} from '@/components/ui/card'
import type { Project } from '@/features/dashboard/data'
import { Collaborators, ProjectMark } from '@/components/dashboard/project-ui'

import { ProjectCounts } from './project-counts'
import { ProjectMenu } from './project-menu'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card size="flush" className="transition-shadow hover:shadow-md">
      <CardHeader className="pt-5">
        <CardMedia>
          <ProjectMark project={project} />
        </CardMedia>
        <CardTitle>
          <Button
            asChild
            variant="link"
            className="max-w-full justify-start text-base font-semibold text-foreground hover:text-indigo-600"
          >
            <Link
              to="/projects/$projectId/overview"
              params={{ projectId: project.id }}
            >
              <span className="truncate">{project.name}</span>
            </Link>
          </Button>
        </CardTitle>
        <CardDescription>
          <p className="text-xs text-muted-foreground">{project.task}</p>
        </CardDescription>
        <CardAction className="justify-center">
          <ProjectMenu project={project} />
        </CardAction>
      </CardHeader>
      <CardContent className="pt-3">
        <p className="min-h-10 text-sm text-slate-600">{project.description}</p>
        <div className="mt-4">
          <ProjectCounts project={project} />
        </div>
      </CardContent>
      <CardFooter className="mt-4 flex items-center justify-between border-t bg-white pt-3 pb-5">
        <Collaborators />
        <span className="text-xs text-slate-400">
          Updated {project.updated}
        </span>
      </CardFooter>
    </Card>
  )
}
