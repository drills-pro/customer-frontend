import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Box, Grid2X2, List, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardMedia,
  CardTitle,
} from '@/components/ui/card'
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
import { useProjectDetail } from '@/features/dashboard/context'
import { SectionError, SectionLoading } from '@/components/shared/query-states'
import { useDeployments } from '@/features/deployments/queries'
import { useModels } from '@/features/models/queries'
import {
  formatAccuracy,
  formatF1,
  StageBadge,
  stageOptions,
} from '../-components/model-list'

export const Route = createFileRoute('/_app/projects_/$projectId/_nav/models')({
  component: ProjectModelsRoute,
})

function ProjectModelsRoute() {
  const { project } = useProjectDetail()
  const [query, setQuery] = React.useState('')
  const [stage, setStage] = React.useState('all')
  const [architecture, setArchitecture] = React.useState('all')
  const [view, setView] = React.useState('table')

  const modelsQuery = useModels(project.id)
  const models = modelsQuery.data ?? []
  const deployments = useDeployments(project.id).data ?? []
  const architectures = [...new Set(models.map((item) => item.architecture))]

  const visibleModels = models.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (stage === 'all' || item.stage === stage) &&
      (architecture === 'all' || item.architecture === architecture),
  )

  /** Deployments key on the model, so the lookup runs from the served side. */
  const deploymentByModelId = new Map(
    deployments.map((item) => [item.modelId, item]),
  )

  if (modelsQuery.error) {
    return (
      <div className="mt-6">
        <SectionError
          title="Could not load models"
          error={modelsQuery.error}
          onRetry={() => void modelsQuery.refetch()}
        />
      </div>
    )
  }
  if (modelsQuery.isPending) {
    return (
      <div className="mt-6">
        <SectionLoading />
      </div>
    )
  }
  if (models.length === 0) {
    return (
      <div className="mt-6">
        <Empty className="min-h-64 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Box />
            </EmptyMedia>
            <EmptyTitle>No models yet</EmptyTitle>
            <EmptyDescription>
              A model appears here each time a training run completes.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link
                to="/projects/$projectId/training/new"
                params={{ projectId: project.id }}
              >
                <Plus />
                New Training
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <>
      <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
        <InputGroup size="lg" className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search models"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <div className="flex flex-wrap gap-2">
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger
              size="lg"
              aria-label="Filter by stage"
              className="w-[132px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stageOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={architecture} onValueChange={setArchitecture}>
            <SelectTrigger
              size="lg"
              aria-label="Filter by architecture"
              className="w-[180px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All architectures</SelectItem>
              {architectures.map((item) => (
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
            aria-label="Model view"
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

      {visibleModels.length === 0 ? (
        <Empty className="min-h-64 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No models found</EmptyTitle>
            <EmptyDescription>
              Adjust your search or filters to see more models.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : view === 'table' ? (
        <Table
          className="min-w-[900px]"
          containerClassName="overflow-y-hidden rounded-xl border bg-card shadow-xs"
        >
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Source run</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead className="text-right">Macro F1</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Deployment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleModels.map((model) => {
              const deployment = deploymentByModelId.get(model.id)
              return (
                <TableRow key={model.id}>
                  <TableCell>
                    <Link
                      to="/projects/$projectId/models/$modelId"
                      params={{
                        projectId: model.projectId,
                        modelId: model.id,
                      }}
                      className="h-auto border-none p-0 font-medium text-primary"
                    >
                      {model.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {model.architecture}
                    </p>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      v{model.version}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/projects/$projectId/training/$runId"
                      params={{
                        projectId: model.projectId,
                        runId: model.runId,
                      }}
                      className="h-auto border-none p-0 font-medium"
                    >
                      {model.runId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-foreground">
                    {formatAccuracy(model.accuracy)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatF1(model.f1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {model.size}
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={model.stage} />
                  </TableCell>
                  <TableCell>
                    {deployment ? (
                      <Link
                        to="/projects/$projectId/deployments/$deploymentId"
                        params={{
                          projectId: deployment.projectId,
                          deploymentId: deployment.id,
                        }}
                        className="h-auto border-none p-0 font-medium text-primary"
                      >
                        {deployment.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleModels.map((model) => (
            <Card key={model.id} className="gap-3">
              {/* CardHeader is a grid: media and action are what give it its
                  three columns, not a flex direction. */}
              <CardHeader className="items-center">
                <CardMedia className="flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary">
                  <Box className="size-4" />
                </CardMedia>
                <CardTitle className="truncate font-mono text-sm text-primary">
                  <Link
                    to="/projects/$projectId/models/$modelId"
                    params={{ projectId: model.projectId, modelId: model.id }}
                  >
                    {model.name} v{model.version}
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs">
                  {model.architecture} · {model.created}
                </CardDescription>
                <CardAction>
                  <StageBadge stage={model.stage} />
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm tabular-nums">
                {formatAccuracy(model.accuracy)} accuracy · {model.size}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
