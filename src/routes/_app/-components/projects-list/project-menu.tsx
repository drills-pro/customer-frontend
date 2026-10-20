import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Project } from '@/features/dashboard/data'
import { useArchiveProject } from '@/features/projects/queries'

export function ProjectMenu({ project }: { project: Project }) {
  const archive = useArchiveProject(project.id)
  const archived = project.status === 'Archived'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          aria-label={`Actions for ${project.name}`}
        >
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            to="/projects/$projectId/overview"
            params={{ projectId: project.id }}
          >
            Open project
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/projects/$projectId/settings"
            params={{ projectId: project.id }}
          >
            Project settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={archive.isPending}
          onSelect={() =>
            archive.mutate(!archived, {
              onSuccess: () =>
                toaster.create({
                  type: 'success',
                  title: `${project.name} ${archived ? 'unarchived' : 'archived'}.`,
                }),
            })
          }
        >
          {archived ? 'Unarchive project' : 'Archive project'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
