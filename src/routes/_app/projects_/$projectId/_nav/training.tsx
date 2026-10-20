import {
  Box,
  Button,
  Flex,
  Link,
  Progress,
  Table,
  Text,
} from '@chakra-ui/react'
import { Link as RouterLink, createFileRoute } from '@tanstack/react-router'
import { Cpu, Plus } from 'lucide-react'

import { EmptyNotice } from '@/components/shared/empty-notice'
import { SectionError, SectionLoading } from '@/components/shared/query-states'
import { useProjectDetail } from '@/features/dashboard/context'
import { useProjectDatasets } from '@/features/datasets/queries'
import { formatDuration } from '@/features/training/format'
import { useTrainingRuns } from '@/features/training/queries'
import { TrainingStatusBadge } from '@/features/training/components/training-status-badge'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/_nav/training',
)({
  component: ProjectTrainingRoute,
})

function ProjectTrainingRoute() {
  const { project } = useProjectDetail()
  const runsQuery = useTrainingRuns(project.id)
  const runs = runsQuery.data ?? []
  const allDatasets = useProjectDatasets(project.id).data ?? []

  return (
    <Box mt="6">
      {runsQuery.error ? (
        <SectionError
          title="Could not load training runs"
          error={runsQuery.error}
          onRetry={() => void runsQuery.refetch()}
        />
      ) : runsQuery.isPending ? (
        <SectionLoading />
      ) : runs.length === 0 ? (
        <EmptyNotice
          minH="64"
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
          icon={<Cpu />}
          title="No training runs yet"
          description="Start a run from a ready dataset to see it here."
        >
          <Button asChild variant="solid" size="sm">
            <RouterLink
              to="/projects/$projectId/training/new"
              params={{ projectId: project.id }}
            >
              <Plus />
              New Training
            </RouterLink>
          </Button>
        </EmptyNotice>
      ) : (
        <Table.ScrollArea
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
        >
          <Table.Root variant="data">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Run</Table.ColumnHeader>
                <Table.ColumnHeader>Dataset</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader w="48">Progress</Table.ColumnHeader>
                <Table.ColumnHeader>Epoch</Table.ColumnHeader>
                <Table.ColumnHeader>Estimated</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {runs.map((run) => (
                <Table.Row key={run.id}>
                  <Table.Cell>
                    <Link asChild fontWeight="medium" color="brand-text">
                      <RouterLink
                        to="/projects/$projectId/training/$runId"
                        params={{ projectId: project.id, runId: run.id }}
                      >
                        {run.name}
                      </RouterLink>
                    </Link>
                    <Text mt="0.5" fontSize="xs" color="fg.muted">
                      {run.architecture}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {allDatasets.find((item) => item.id === run.datasetId)
                      ?.name ?? run.datasetId}
                  </Table.Cell>
                  <Table.Cell>
                    <TrainingStatusBadge status={run.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <Progress.Root size="xs" flex="1" value={run.progress}>
                        <Progress.Track aria-label={`${run.name} progress`}>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                      <Text as="span" w="9" flexShrink={0} fontSize="xs">
                        {run.progress}%
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    {Math.floor((run.progress / 100) * run.epochs)} /{' '}
                    {run.epochs}
                  </Table.Cell>
                  <Table.Cell>{formatDuration(run.estimatedHours)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
    </Box>
  )
}
