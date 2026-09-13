import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Project } from '@/features/dashboard/data'
import { ProjectMark } from '@/components/dashboard/project-ui'

import { ProjectMenu } from './project-menu'

export function ProjectsTable({ projects }: { projects: Array<Project> }) {
  return (
    <Table className="min-w-[780px] overflow-hidden rounded-xl border border-bordermedium bg-white">
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Task type</TableHead>
          <TableHead>Datasets</TableHead>
          <TableHead>Models</TableHead>
          <TableHead>Deployed</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Item className="flex-nowrap border-0 p-0">
                <ItemMedia className="self-center translate-y-0!">
                  <ProjectMark project={project} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>
                    <Button
                      asChild
                      variant="link"
                      className="font-semibold text-foreground"
                    >
                      <Link
                        to="/projects/$projectId/overview"
                        params={{ projectId: project.id }}
                      >
                        {project.name}
                      </Link>
                    </Button>
                  </ItemTitle>
                  <ItemDescription className="max-w-72 truncate text-xs">
                    {project.description}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </TableCell>
            <TableCell>{project.task}</TableCell>
            <TableCell>{project.datasets}</TableCell>
            <TableCell>{project.models}</TableCell>
            <TableCell>{project.deployed}</TableCell>
            <TableCell className="text-muted-foreground">
              {project.updated}
            </TableCell>
            <TableCell>
              <ProjectMenu project={project} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
