import { Grid2X2, List, Search } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { organizations } from '@/features/dashboard/data'

import type { ProjectFiltersState, View } from './types'

export function ProjectFilters({
  filters,
  onFiltersChange,
  taskTypes,
  statuses,
}: {
  filters: ProjectFiltersState
  onFiltersChange: (patch: Partial<ProjectFiltersState>) => void
  taskTypes: Array<string>
  statuses: Array<string>
}) {
  return (
    <section
      aria-label="Project filters"
      className="mb-4 flex flex-wrap items-center gap-2"
    >
      <InputGroup size="lg" className="min-w-[220px] flex-1 bg-white">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={filters.query}
          onChange={(event) => onFiltersChange({ query: event.target.value })}
          placeholder="Search projects..."
          aria-label="Search projects"
        />
      </InputGroup>

      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.organization}
          onValueChange={(value) => onFiltersChange({ organization: value })}
        >
          <SelectTrigger
            size="lg"
            className="min-w-44 flex-1 bg-white xl:flex-none"
            aria-label="Filter by organization"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">All organizations</SelectItem>
            {organizations.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.task}
          onValueChange={(value) => onFiltersChange({ task: value })}
        >
          <SelectTrigger
            size="lg"
            className="min-w-40 flex-1 bg-white xl:flex-none"
            aria-label="Filter by task type"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">All task types</SelectItem>
            {taskTypes.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ status: value })}
        >
          <SelectTrigger
            size="lg"
            className="min-w-36 flex-1 bg-white xl:flex-none"
            aria-label="Filter by status"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => onFiltersChange({ sort: value })}
        >
          <SelectTrigger
            size="lg"
            className="min-w-44 flex-1 bg-white xl:ml-auto xl:flex-none"
            aria-label="Sort projects"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="recent">Recently updated</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={filters.view}
          onValueChange={(value) =>
            value && onFiltersChange({ view: value as View })
          }
          variant="outline"
          size="lg"
          spacing={0}
          aria-label="Project view"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid2X2 />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </section>
  )
}
