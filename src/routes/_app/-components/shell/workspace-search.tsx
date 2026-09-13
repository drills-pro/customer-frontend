import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type {
  Deployment,
  Project,
  TrainingRun,
} from '@/features/dashboard/data'
import { unavailable } from './helpers'

type SearchItem = {
  id: string
  label: string
  group: string
  /** Present for training runs, which live under a project route. */
  projectId?: string
}

const groups = ['Projects', 'Training runs', 'Deployments']

export function buildSearchItems({
  projects,
  trainingRuns,
  deployments,
}: {
  projects: Project[]
  trainingRuns: TrainingRun[]
  deployments: Deployment[]
}): SearchItem[] {
  return [
    ...projects.map((item) => ({
      id: item.id,
      label: item.name,
      group: 'Projects',
    })),
    ...trainingRuns.map((item) => ({
      id: item.id,
      label: item.name,
      group: 'Training runs',
      projectId: item.projectId,
    })),
    ...deployments.map((item) => ({
      id: item.id,
      label: item.name,
      group: 'Deployments',
    })),
  ]
}

export function WorkspaceSearch({
  open,
  onOpenChange,
  items,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SearchItem[]
}) {
  const navigate = useNavigate()

  function select(item: SearchItem) {
    onOpenChange(false)
    if (item.group === 'Projects') {
      void navigate({
        to: '/projects/$projectId/overview',
        params: { projectId: item.id },
      })
    } else if (item.projectId) {
      void navigate({
        to: '/projects/$projectId/training/$runId',
        params: { projectId: item.projectId, runId: item.id },
      })
    } else {
      unavailable(item.label)
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search workspace"
      description="Search projects, training runs, and deployments."
    >
      <Command>
        <CommandInput placeholder="Search projects, models, runs..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup heading={group} key={group}>
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => select(item)}
                  >
                    <Search />
                    {item.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
