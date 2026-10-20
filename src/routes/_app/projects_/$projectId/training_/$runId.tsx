import * as React from 'react'
import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Heading,
  HStack,
  Progress,
  SimpleGrid,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Square, TriangleAlert } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { TrainingStatusBadge } from '@/features/training/components/training-status-badge'
import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { AppDialog } from '@/components/shared/app-dialog'
import { EmptyNotice } from '@/components/shared/empty-notice'
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
  const [stopOpen, setStopOpen] = React.useState(false)
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

  const stopRun = () => {
    setStopOpen(false)
    cancel.mutate(undefined, {
      onSuccess: () =>
        toaster.create({
          type: 'info',
          title: `Training ${run.name} stopped.`,
        }),
    })
  }

  return (
    <Box
      as="main"
      id="dashboard-main"
      mx="auto"
      w="full"
      maxW="1448px"
      minW="0"
      flex="1"
      p={{ base: '4', sm: '6' }}
    >
      <RouteBreadcrumbs mb="3" />

      <Flex
        mb="5"
        wrap="wrap"
        align="flex-start"
        justify="space-between"
        gap="3"
      >
        <Box>
          <HStack wrap="wrap" gap="2">
            <Heading
              as="h1"
              fontSize="2xl"
              fontWeight="semibold"
              letterSpacing="tight"
            >
              {run.name}
            </Heading>
            <TrainingStatusBadge status={run.status} />
          </HStack>
          <Text mt="1" textStyle="body-sm" color="fg.muted">
            Run {run.id} · started by {run.author} · estimated{' '}
            {formatDuration(run.estimatedHours)}
          </Text>
        </Box>
        <HStack gap="2">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/projects/$projectId/training/new"
              params={{ projectId: project.id }}
              search={{ clone: run.id }}
            >
              Clone
            </Link>
          </Button>
          {run.status === 'Running' && (
            <>
              <Button
                variant="solid"
                colorPalette="danger"
                size="sm"
                onClick={() => setStopOpen(true)}
              >
                <Square />
                Stop run
              </Button>
              <AppDialog
                role="alertdialog"
                open={stopOpen}
                onOpenChange={setStopOpen}
                title={
                  <HStack gap="3">
                    <Center
                      boxSize="9"
                      rounded="l2"
                      bg="bg.error"
                      color="fg.error"
                    >
                      <TriangleAlert size={18} />
                    </Center>
                    Stop this training run?
                  </HStack>
                }
                description="Progress will be saved, but this run will not produce model artifacts."
                footer={
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStopOpen(false)}
                    >
                      Keep running
                    </Button>
                    <Button
                      variant="solid"
                      colorPalette="danger"
                      size="sm"
                      onClick={stopRun}
                    >
                      Stop run
                    </Button>
                  </>
                }
              />
            </>
          )}
        </HStack>
      </Flex>

      <Card.Root variant="outline" overflow="hidden">
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} gap="5" p="5">
          {runStats.map(([label, value]) => (
            <Box key={label}>
              <Text fontSize="xs" color="fg.muted">
                {label}
              </Text>
              <Text mt="1" fontSize="lg" fontWeight="semibold">
                {value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
        <Progress.Root size="xs" colorPalette="info" value={run.progress}>
          <Progress.Track rounded="none" aria-label="Training progress">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Card.Root>

      <Tabs.Root
        variant="line"
        mt="6"
        minW="0"
        // Only the open tab is in the page, as before.
        lazyMount
        unmountOnExit
        value={tab}
        onValueChange={(event) => setTab(event.value)}
      >
        <Tabs.List>
          <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
          <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
          <Tabs.Trigger value="config">Config</Tabs.Trigger>
          <Tabs.Trigger value="artifacts">Artifacts</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="metrics" pt="4">
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" mb="6">
            <MetricCard title="Loss" dataKey="loss" color="brand" />
            <MetricCard title="Accuracy" dataKey="accuracy" color="success" />
          </SimpleGrid>
          <LogsCard
            level={level}
            setLevel={setLevel}
            autoscroll={autoscroll}
            setAutoscroll={setAutoscroll}
            logRef={logRef}
          />
        </Tabs.Content>
        <Tabs.Content value="logs" pt="4">
          <LogsCard
            level={level}
            setLevel={setLevel}
            autoscroll={autoscroll}
            setAutoscroll={setAutoscroll}
            logRef={logRef}
          />
        </Tabs.Content>
        <Tabs.Content value="config" pt="4">
          <ConfigCard />
        </Tabs.Content>
        <Tabs.Content value="artifacts" pt="4">
          <EmptyNotice
            minH="64"
            rounded="l3"
            borderWidth="1px"
            borderColor="border"
            bg="surface-raised"
            title="No artifacts yet"
            description={
              run.status === 'Stopped'
                ? 'This run was stopped before producing model artifacts.'
                : run.status === 'Failed'
                  ? 'This run failed before producing model artifacts. Its logs say why.'
                  : 'Artifacts will appear when training completes.'
            }
          />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}

function RunNotFoundRoute() {
  const { projectId } = Route.useParams()
  return <RunNotFound projectId={projectId} />
}
