import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Dataset } from '@/features/dashboard/data'
import { unavailable } from './helpers'

export function DatasetActions({ dataset }: { dataset: Dataset }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${dataset.name}`}
        >
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            to="/projects/$projectId/datasets/$datasetId"
            params={{ projectId: dataset.projectId, datasetId: dataset.id }}
          >
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => unavailable('Dataset download')}>
          Download metadata
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
