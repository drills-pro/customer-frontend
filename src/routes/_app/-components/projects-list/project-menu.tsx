import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Project } from '@/features/dashboard/data'

import { unavailable } from '@/lib/unavailable'

export function ProjectMenu({ project }: { project: Project }) {
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
        {['Project settings', 'Archive project'].map((action) => (
          <DropdownMenuItem
            key={action}
            onSelect={() => unavailable(`${action}: ${project.name}`)}
          >
            {action}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
