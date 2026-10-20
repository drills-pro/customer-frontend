import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Square, TriangleAlert } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { TrainingStatusBadge } from '@/features/training/components/training-status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isNotFound } from '@/api/errors'
import { PageError, PageLoading } from '@/components/shared/query-states'
import { useProjectDetail } from '@/features/dashboard/context'
import { formatDuration } from '@/features/training/format'
import { useCancelTraining, useTrainingRun } from '@/features/training/queries'
import {
  ConfigCard,
  LogsCard,
  MetricCard,
  RunNotFound,
} from './-components/training-run-detail'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/training_/$runId',
)({
  component: TrainingRunRoute,
  notFoundComponent: RunNotFoundRoute,
  staticData: {
    breadcrumb: ({ entities: { run }, parent: { project } }) => {
      if (!project || !run) return null
      return {
        items: [
          {
            id: 'training',
            label: 'Training',
            link: {
              to: '/projects/$projectId/training',
              params: { projectId: project.id },
            },
          },
          { id: run.id, label: run.name },
        ],
        data: { run },
      }
    },
  },
})

function TrainingRunRoute() {
  const { runId } = Route.useParams()
  const { project } = useProjectDetail()
  const [tab, setTab] = React.useState('metrics')
  const [level, setLevel] = React.useState('all')
  const [autoscroll, setAutoscroll] = React.useState(true)
  const logRef = React.useRef<HTMLPreElement>(null)

  // Refreshes itself while the run is running, so the numbers keep moving.
  const { data: run, error, refetch } = useTrainingRun(project.id, runId)
  const cancel = useCancelTraining(project.id, runId)

  React.useEffect(() => {
    if (autoscroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [autoscroll, tab, level, run?.status])

  if (error) {
    return isNotFound(error) ? (
      <RunNotFound projectId={project.id} />
    ) : (
      <PageError
        title="Could not load this training run"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }
  if (!run) return <PageLoading />

  const runStats: Array<[string, string]> = [
    ['Epoch', `${run.epoch} / ${run.epochs}`],
    [
      'Step',
      `${run.step.toLocaleString()} / ${run.totalSteps.toLocaleString()}`,
    ],
    ['Throughput', run.status === 'Running' ? run.throughput : '—'],
    ['GPU util', run.status === 'Running' ? run.gpuUtilization : '0%'],
    ['GPU memory', run.status === 'Running' ? run.gpuMemory : '0 GB'],
  ]

  const stopRun = () =>
    cancel.mutate(undefined, {
      onSuccess: () =>
        toaster.create({
          type: 'info',
          title: `Training ${run.name} stopped.`,
        }),
    })

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <RouteBreadcrumbs mb="3" />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {run.name}
            </h1>
            <TrainingStatusBadge status={run.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Run {run.id} · started by {run.author} · estimated{' '}
            {formatDuration(run.estimatedHours)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link
              to="/projects/$projectId/training/new"
              params={{ projectId: project.id }}
              search={{ clone: run.id }}
            >
              Clone
            </Link>
          </Button>
          {run.status === 'Running' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Square />
                  Stop run
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive-muted text-destructive">
                    <TriangleAlert />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Stop this training run?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Progress will be saved, but this run will not produce model
                    artifacts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep running</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={stopRun}>
                    Stop run
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card size="flush">
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {runStats.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
        <Progress
          value={run.progress}
          className="h-1.5 rounded-none [&_[data-slot=progress-indicator]]:bg-info"
        />
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="mt-6 min-w-0">
        <TabsList variant="line">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="mt-4 grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <MetricCard title="Loss" dataKey="loss" color="var(--primary)" />
            <MetricCard
              title="Accuracy"
              dataKey="accuracy"
              color="var(--success)"
            />
          </div>
          <LogsCard
            level={level}
            setLevel={setLevel}
            autoscroll={autoscroll}
            setAutoscroll={setAutoscroll}
            logRef={logRef}
          />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <LogsCard
            level={level}
            setLevel={setLevel}
            autoscroll={autoscroll}
            setAutoscroll={setAutoscroll}
            logRef={logRef}
          />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <ConfigCard />
        </TabsContent>
        <TabsContent value="artifacts" className="mt-4">
          <Empty className="min-h-64 border bg-card">
            <EmptyHeader>
              <EmptyTitle>No artifacts yet</EmptyTitle>
              <EmptyDescription>
                {run.status === 'Stopped'
                  ? 'This run was stopped before producing model artifacts.'
                  : run.status === 'Failed'
                    ? 'This run failed before producing model artifacts. Its logs say why.'
                    : 'Artifacts will appear when training completes.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </TabsContent>
      </Tabs>
    </main>
  )
}

function RunNotFoundRoute() {
  const { projectId } = Route.useParams()
  return <RunNotFound projectId={projectId} />
}
