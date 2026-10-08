import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Box, Grid2X2, List, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  useDashboardLayout,
  useProjectDetail,
} from '@/features/dashboard/context'
import { datasets as seededDatasets } from '@/features/dashboard/data'
import type { Dataset } from '@/features/dashboard/data'
import { unavailable } from '@/lib/unavailable'
import {
  AddDatasetDialog,
  DatasetActions,
  StatusBadge,
  splitOptions,
  statusOptions,
} from '../-components/dataset-list'

type ProjectDatasetsSearch = { add?: boolean }

export const Route = createFileRoute(
  '/_app/projects_/$projectId/_nav/datasets',
)({
  validateSearch: (search: Record<string, unknown>): ProjectDatasetsSearch => ({
    add: search.add === true || search.add === 'true' ? true : undefined,
  }),
  component: ProjectDatasetsRoute,
})

function ProjectDatasetsRoute() {
  const search = Route.useSearch()
  const { project } = useProjectDetail()
  const { preferences, updatePreferences } = useDashboardLayout()
  const [query, setQuery] = React.useState('')
  const [split, setSplit] = React.useState('all')
  const [status, setStatus] = React.useState('all')
  const [view, setView] = React.useState('table')
  const [addOpen, setAddOpen] = React.useState(search.add === true)

  const allDatasets = [...preferences.datasets, ...seededDatasets].filter(
    (item) => item.projectId === project.id,
  )
  const visibleDatasets = allDatasets.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (split === 'all' || item.split === split) &&
      (status === 'all' || item.status === status),
  )

  function addDataset(dataset: Dataset) {
    updatePreferences({
      datasets: [dataset, ...preferences.datasets],
      createdProjects: preferences.createdProjects.map((saved) =>
        saved.project.id === project.id
          ? {
              ...saved,
              project: {
                ...saved.project,
                datasets: saved.project.datasets + 1,
                updated: 'Just now',
              },
              overview: {
                ...saved.overview,
                pipeline: {
                  ...saved.overview.pipeline,
                  completeThrough: Math.max(
                    2,
                    saved.overview.pipeline.completeThrough,
                  ) as 2 | 3 | 4,
                },
              },
            }
          : saved,
      ),
      uploads: [
        {
          id: `dataset-${dataset.id}`,
          orgId: project.orgId,
          icon: 'dataset',
          lead: `Dataset ${dataset.name}`,
          text: 'added for processing',
          time: 'Just now',
          action: 'View',
        },
        ...preferences.uploads,
      ],
    })
    toast.success(`Dataset ${dataset.name} added for processing.`)
  }

  return (
    <>
      <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
        <InputGroup size="lg" className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search datasets"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <div className="flex flex-wrap gap-2">
          <Select value={split} onValueChange={setSplit}>
            <SelectTrigger
              size="lg"
              aria-label="Filter by type"
              className="w-[116px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {splitOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              size="lg"
              aria-label="Filter by status"
              className="w-[132px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => value && setView(value)}
            variant="outline"
            size="lg"
            spacing={0}
            aria-label="Dataset view"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid2X2 />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {visibleDatasets.length === 0 ? (
        <Empty className="min-h-64 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No datasets found</EmptyTitle>
            <EmptyDescription>
              Adjust your search or filters, or add a new dataset.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setAddOpen(true)}>
              <Plus />
              Add Dataset
            </Button>
          </EmptyContent>
        </Empty>
      ) : view === 'table' ? (
        <Table containerClassName="overflow-y-hidden rounded-xl border bg-card shadow-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDatasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell>
                  <Link
                    to="/projects/$projectId/datasets/$datasetId"
                    params={{
                      projectId: dataset.projectId,
                      datasetId: dataset.id,
                    }}
                    className="h-auto border-none p-0 font-medium text-primary"
                  >
                    {dataset.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {dataset.split}
                  </Badge>
                </TableCell>
                <TableCell>
                  {dataset.items.toLocaleString('en-US')}{' '}
                  {project.task.includes('Image') ? 'images' : 'items'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dataset.size}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dataset.classes || '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={dataset.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dataset.created}
                </TableCell>
                <TableCell className="text-right">
                  <DatasetActions dataset={dataset} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleDatasets.map((dataset) => (
            <Card key={dataset.id} className="gap-3">
              <CardHeader className="flex-row items-start">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary">
                  <Box className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-sm text-primary">
                    <Link
                      to="/projects/$projectId/datasets/$datasetId"
                      params={{
                        projectId: dataset.projectId,
                        datasetId: dataset.id,
                      }}
                    >
                      {dataset.name}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dataset.split} · {dataset.created}
                  </p>
                </div>
                <DatasetActions dataset={dataset} />
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <span>
                  {dataset.items.toLocaleString('en-US')} items · {dataset.size}
                </span>
                <StatusBadge status={dataset.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Empty className="mt-6 gap-0 border-2 bg-card px-6 py-16">
        <EmptyHeader className="gap-0">
          <EmptyMedia
            variant="icon"
            className="mb-4 size-12 bg-primary-muted text-primary"
          >
            <Box className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Add more training data</EmptyTitle>
          <EmptyDescription className="mt-1">
            Drag and drop files, or connect a cloud bucket. Supports CSV, JSONL,
            Parquet, ZIP, COCO and YOLO formats.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-5 gap-3">
          <Button size="lg" className="px-3.5" onClick={() => setAddOpen(true)}>
            <Plus />
            Add Dataset
          </Button>
          <Button variant="link" onClick={() => unavailable('Learn more')}>
            Learn more →
          </Button>
        </EmptyContent>
      </Empty>
      <AddDatasetDialog
        project={project}
        open={addOpen}
        onOpenChange={setAddOpen}
        existing={allDatasets}
        onAdd={addDataset}
      />
    </>
  )
}
