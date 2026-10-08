import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Grid2X2, List, Rocket, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DeploymentStatusBadge } from '@/features/deployments/components/deployment-status-badge'
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
import { cn } from 'cn'
import { useProjectDetail } from '@/features/dashboard/context'
import { projectDeployments } from '@/features/dashboard/selectors/deployments'
import { projectModels } from '@/features/dashboard/selectors/models'
import type { Deployment } from '@/features/dashboard/data'
import {
  EnvironmentBadge,
  environmentOptions,
  statusOptions,
} from '../-components/deployment-list'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/_nav/deployments',
)({
  component: ProjectDeploymentsRoute,
})

function ProjectDeploymentsRoute() {
  const { project } = useProjectDetail()
  const [query, setQuery] = React.useState('')
  const [environment, setEnvironment] = React.useState('all')
  const [status, setStatus] = React.useState('all')
  const [view, setView] = React.useState('grid')

  const deployments = projectDeployments(project.id)
  const models = projectModels(project.id)
  const modelById = new Map(models.map((item) => [item.id, item]))

  const visibleDeployments = deployments.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (environment === 'all' || item.environment === environment) &&
      (status === 'all' || item.status === status),
  )

  function modelLabel(deployment: Deployment) {
    const model = modelById.get(deployment.modelId)
    return model ? `${model.name} v${model.version}` : deployment.modelId
  }

  function ModelLink({ deployment }: { deployment: Deployment }) {
    return (
      <Link
        to="/projects/$projectId/models/$modelId"
        params={{
          projectId: deployment.projectId,
          modelId: deployment.modelId,
        }}
        className="h-auto border-none p-0 font-mono"
      >
        {modelLabel(deployment)}
      </Link>
    )
  }

  if (deployments.length === 0) {
    return (
      <Empty className="min-h-64 border bg-card mt-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Rocket />
          </EmptyMedia>
          <EmptyTitle>No deployments yet</EmptyTitle>
          <EmptyDescription>
            Deploy a trained model to serve predictions from an endpoint.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link
              to="/projects/$projectId/models"
              params={{ projectId: project.id }}
            >
              View models
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
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
            aria-label="Search deployments"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <div className="flex flex-wrap gap-2">
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger
              size="lg"
              aria-label="Filter by environment"
              className="w-[168px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All environments</SelectItem>
              {environmentOptions.map((item) => (
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
              className="w-[140px]"
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
            aria-label="Deployment view"
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

      {visibleDeployments.length === 0 ? (
        <Empty className="min-h-64 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No deployments found</EmptyTitle>
            <EmptyDescription>
              Adjust your search or filters to see more deployments.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : view === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleDeployments.map((deployment) => {
            const idle = deployment.status !== 'Live'
            return (
              <Card key={deployment.id} size="flush">
                {/* CardHeader is a grid: the media and action slots are what
                    give it its three columns, not a flex direction. */}
                <CardHeader className="items-center p-4">
                  <CardMedia
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      idle
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary-muted text-primary',
                    )}
                  >
                    <Rocket className="size-4" />
                  </CardMedia>
                  <CardTitle className="truncate font-mono text-sm text-primary">
                    <Link
                      to="/projects/$projectId/deployments/$deploymentId"
                      params={{
                        projectId: deployment.projectId,
                        deploymentId: deployment.id,
                      }}
                    >
                      {deployment.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-1.5 text-xs">
                    <ModelLink deployment={deployment} />
                    <EnvironmentBadge environment={deployment.environment} />
                  </CardDescription>
                  <CardAction>
                    <DeploymentStatusBadge status={deployment.status} />
                  </CardAction>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-2 border-t p-4">
                  {(
                    [
                      ['Requests 24h', deployment.requests24h],
                      ['p95', deployment.latencyP95],
                      ['Errors', deployment.errorRate],
                      ['Cost/day', deployment.costPerDay],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <p className="truncate text-[11px] text-muted-foreground">
                        {label}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 truncate text-[13px] font-semibold tabular-nums',
                          value === '—' && 'text-muted-foreground',
                        )}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Table
          className="min-w-[940px]"
          containerClassName="overflow-y-hidden rounded-xl border bg-card shadow-xs"
        >
          <TableHeader>
            <TableRow>
              <TableHead>Deployment</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Requests 24h</TableHead>
              <TableHead className="text-right">p95</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead className="text-right">Cost/day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDeployments.map((deployment) => (
              <TableRow key={deployment.id}>
                <TableCell>
                  <Link
                    to="/projects/$projectId/deployments/$deploymentId"
                    params={{
                      projectId: deployment.projectId,
                      deploymentId: deployment.id,
                    }}
                    className="h-auto border-none p-0 font-mono font-medium text-primary"
                  >
                    {deployment.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {deployment.region} · {deployment.instanceName}
                  </p>
                </TableCell>
                <TableCell>
                  <ModelLink deployment={deployment} />
                </TableCell>
                <TableCell>
                  <EnvironmentBadge environment={deployment.environment} />
                </TableCell>
                <TableCell>
                  <DeploymentStatusBadge status={deployment.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {deployment.requests24h}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {deployment.latencyP95}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {deployment.errorRate}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {deployment.costPerDay}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
