import { Link, createFileRoute } from '@tanstack/react-router'
import { Cpu, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDashboardLayout,
  useProjectDetail,
} from '@/features/dashboard/context'
import { datasets as seededDatasets } from '@/features/dashboard/data'
import {
  liveRun,
  projectTrainingRuns,
} from '@/features/dashboard/selectors/training-runs'
import { formatDuration } from '@/features/dashboard/training'
import { useNow } from '@/hooks/use-now'
import { TrainingStatusBadge } from '@/features/training/components/training-status-badge'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/_nav/training',
)({
  component: ProjectTrainingRoute,
})

function ProjectTrainingRoute() {
  const { project } = useProjectDetail()
  const { preferences } = useDashboardLayout()
  const now = useNow()

  const runs = projectTrainingRuns(preferences, project.id).map((run) =>
    liveRun(run, now),
  )
  const allDatasets = [...preferences.datasets, ...seededDatasets]

  return (
    <div className="mt-6">
      {runs.length === 0 ? (
        <Empty className="min-h-64 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Cpu />
            </EmptyMedia>
            <EmptyTitle>No training runs yet</EmptyTitle>
            <EmptyDescription>
              Start a run from a ready dataset to see it here.
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
      ) : (
        <Table containerClassName="overflow-y-hidden rounded-xl border bg-card shadow-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Run</TableHead>
              <TableHead>Dataset</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48">Progress</TableHead>
              <TableHead>Epoch</TableHead>
              <TableHead>Estimated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <Link
                    to="/projects/$projectId/training/$runId"
                    params={{ projectId: project.id, runId: run.id }}
                    className="h-auto border-none p-0 font-medium text-primary"
                  >
                    {run.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {run.architecture}
                  </p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {allDatasets.find((item) => item.id === run.datasetId)
                    ?.name ?? run.datasetId}
                </TableCell>
                <TableCell>
                  <TrainingStatusBadge status={run.status} />
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Progress value={run.progress} className="h-1.5" />
                  <span className="w-9 shrink-0 text-xs text-muted-foreground">
                    {run.progress}%
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {Math.floor((run.progress / 100) * run.epochs)} / {run.epochs}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDuration(run.estimatedHours)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
