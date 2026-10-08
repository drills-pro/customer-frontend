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
import {
  Collaborators,
  ProjectMark,
} from '@/features/projects/components/project-ui'

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
            className="max-w-full justify-start text-base font-semibold text-foreground hover:text-primary"
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
        <p className="min-h-10 text-sm text-muted-foreground">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(
            [
              [project.datasets, 'datasets'],
              [project.models, 'models'],
              [project.deployed, 'deployed'],
            ] as const
          ).map(([count, noun]) => (
            <span key={noun}>
              <strong className="font-semibold text-foreground">{count}</strong>{' '}
              {noun}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-4 flex items-center justify-between border-t bg-card pt-3 pb-5">
        <Collaborators />
        <span className="text-xs text-muted-foreground/80">
          Updated {project.updated}
        </span>
      </CardFooter>
    </Card>
  )
}
