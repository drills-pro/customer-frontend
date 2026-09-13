import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Square, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

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
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  datasets as seededDatasets,
  resolveProject,
} from '@/features/dashboard/data'
import { formatDuration, trainingLog } from '@/features/dashboard/training'
import {
  liveRun,
  resolveTrainingRun,
  runProgressAt,
} from '@/features/dashboard/selectors/training-runs'
import { useNow } from '@/hooks/use-now'
import {
  ConfigCard,
  LogsCard,
  MetricCard,
  RunNotFound,
  StatusBadge,
} from './-components/training-run-detail'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/training_/$runId',
)({
  component: TrainingRunRoute,
  notFoundComponent: RunNotFoundRoute,
  staticData: {
    breadcrumb: ({ params, preferences, parent: { project } }) => {
      if (!project) return null
      const run = resolveTrainingRun(preferences, project.id, params.runId)
      if (!run) return null
      return {
        items: [
          { id: 'training', label: 'Training' },
          { id: run.id, label: run.name },
        ],
        data: { run },
      }
    },
  },
})

function TrainingRunRoute() {
  const { projectId, runId } = Route.useParams()
  const { preferences, updatePreferences, hydrated } = useDashboardLayout()
  const [tab, setTab] = React.useState('metrics')
  const [level, setLevel] = React.useState('all')
  const [autoscroll, setAutoscroll] = React.useState(true)
  const logRef = React.useRef<HTMLPreElement>(null)

  const now = useNow()
  const resolved = resolveProject(projectId, preferences)
  const stored = resolved
    ? resolveTrainingRun(preferences, resolved.project.id, runId)
    : undefined
  // Progress, step, and status come from elapsed time, not the frozen values
  // written when the run was created.
  const run = stored ? liveRun(stored, now) : undefined
  const dataset = resolved
    ? [...preferences.datasets, ...seededDatasets].find(
        (item) =>
          item.id === run?.datasetId && item.projectId === resolved.project.id,
      )
    : undefined
  const logLines = run ? trainingLog(run, dataset) : []
  const visibleLogs = logLines.filter(
    (line) => level === 'all' || line.startsWith(level),
  )

  React.useEffect(() => {
    if (autoscroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [autoscroll, tab, level, run?.status])

  if (!hydrated) {
    return <main id="dashboard-main" className="min-h-96 flex-1" />
  }
  if (!resolved || !run) return <RunNotFound projectId={projectId} />
  const { project } = resolved

  const live = runProgressAt(run, now)
  const runStats: Array<[string, string]> = [
    ['Epoch', `${live.epoch} / ${run.epochs}`],
    [
      'Step',
      `${run.step.toLocaleString()} / ${run.totalSteps.toLocaleString()}`,
    ],
    ['Throughput', run.status === 'Running' ? run.throughput : '—'],
    ['GPU util', run.status === 'Running' ? run.gpuUtilization : '0%'],
    ['GPU memory', run.status === 'Running' ? run.gpuMemory : '0 GB'],
  ]

  const stopRun = () => {
    // Freeze the run at its derived progress. A seeded run has no persisted
    // record yet, so stopping it writes one as a user override of the fixture.
    const stoppedRun = { ...run, status: 'Stopped' as const }
    const isPersisted = preferences.trainingRuns.some(
      (item) => item.id === run.id,
    )
    updatePreferences({
      trainingRuns: isPersisted
        ? preferences.trainingRuns.map((item) =>
            item.id === run.id ? stoppedRun : item,
          )
        : [stoppedRun, ...preferences.trainingRuns],
      uploads: [
        {
          id: `training-stopped-${run.id}`,
          orgId: project.orgId,
          icon: 'error',
          lead: `Training ${run.name}`,
          text: 'stopped by Alex Rivera',
          time: 'Just now',
          action: 'View',
        },
        ...preferences.uploads,
      ],
    })
    toast.info(`Training ${run.name} stopped.`)
  }

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <RouteBreadcrumbs className="mb-3" />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {run.name}
            </h1>
            <StatusBadge status={run.status} />
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
                  <AlertDialogMedia className="bg-rose-50 text-rose-600">
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
          className="h-1.5 rounded-none [&_[data-slot=progress-indicator]]:bg-sky-500"
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
            <MetricCard title="Loss" dataKey="loss" color="#4f46e5" />
            <MetricCard title="Accuracy" dataKey="accuracy" color="#10b981" />
          </div>
          <LogsCard
            run={run}
            lines={visibleLogs}
            level={level}
            setLevel={setLevel}
            autoscroll={autoscroll}
            setAutoscroll={setAutoscroll}
            logRef={logRef}
          />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <LogsCard
            run={run}
            lines={visibleLogs}
            level={level}
            setLevel={setLevel}
            autoscroll={autoscroll}
            setAutoscroll={setAutoscroll}
            logRef={logRef}
          />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <ConfigCard run={run} dataset={dataset} />
        </TabsContent>
        <TabsContent value="artifacts" className="mt-4">
          <Empty className="min-h-64 border bg-white">
            <EmptyHeader>
              <EmptyTitle>No artifacts yet</EmptyTitle>
              <EmptyDescription>
                {run.status === 'Stopped'
                  ? 'This run was stopped before producing model artifacts.'
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
