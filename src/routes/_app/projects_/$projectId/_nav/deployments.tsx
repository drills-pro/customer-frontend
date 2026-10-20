import * as React from 'react'
import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Input,
  InputGroup,
  Link,
  SimpleGrid,
  Table,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { Grid2X2, List, Rocket, Search } from 'lucide-react'

import { EmptyNotice } from '@/components/shared/empty-notice'
import {
  RadioButton,
  RadioButtonGroup,
} from '@/components/shared/radio-button-group'
import { SimpleSelect } from '@/components/simple-select'
import { DeploymentStatusBadge } from '@/features/deployments/components/deployment-status-badge'
import { useProjectDetail } from '@/features/dashboard/context'
import { SectionError, SectionLoading } from '@/components/shared/query-states'
import { useDeployments } from '@/features/deployments/queries'
import { useModels } from '@/features/models/queries'
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

  const deploymentsQuery = useDeployments(project.id)
  const deployments = deploymentsQuery.data ?? []
  const models = useModels(project.id).data ?? []
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
      <Link asChild fontFamily="mono" color="fg">
        <RouterLink
          to="/projects/$projectId/models/$modelId"
          params={{
            projectId: deployment.projectId,
            modelId: deployment.modelId,
          }}
        >
          {modelLabel(deployment)}
        </RouterLink>
      </Link>
    )
  }

  if (deploymentsQuery.error) {
    return (
      <Box mt="6">
        <SectionError
          title="Could not load deployments"
          error={deploymentsQuery.error}
          onRetry={() => void deploymentsQuery.refetch()}
        />
      </Box>
    )
  }
  if (deploymentsQuery.isPending) {
    return (
      <Box mt="6">
        <SectionLoading />
      </Box>
    )
  }
  if (deployments.length === 0) {
    return (
      <EmptyNotice
        mt="6"
        minH="64"
        rounded="l3"
        borderWidth="1px"
        borderColor="border"
        bg="surface-raised"
        icon={<Rocket />}
        title="No deployments yet"
        description="Deploy a trained model to serve predictions from an endpoint."
      >
        <Button asChild variant="solid" size="sm">
          <RouterLink
            to="/projects/$projectId/models"
            params={{ projectId: project.id }}
          >
            View models
          </RouterLink>
        </Button>
      </EmptyNotice>
    )
  }

  return (
    <>
      <Flex mt="6" mb="4" wrap="wrap" align="center" gap="2">
        <InputGroup
          flex="1"
          minW="220px"
          startElement={<Search size={16} aria-hidden="true" />}
        >
          <Input
            size="sm"
            aria-label="Search deployments"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <Flex wrap="wrap" gap="2">
          <SimpleSelect
            label="Filter by environment"
            hideLabel
            size="sm"
            width="168px"
            value={environment}
            onChange={setEnvironment}
            items={[
              { label: 'All environments', value: 'all' },
              ...environmentOptions.map((item) => ({
                label: item,
                value: item,
              })),
            ]}
          />
          <SimpleSelect
            label="Filter by status"
            hideLabel
            size="sm"
            width="140px"
            value={status}
            onChange={setStatus}
            items={[
              { label: 'All statuses', value: 'all' },
              ...statusOptions.map((item) => ({ label: item, value: item })),
            ]}
          />
          <RadioButtonGroup
            attached
            aria-label="Deployment view"
            value={view}
            onChange={setView}
          >
            <RadioButton value="grid" size="sm" px="2.5" aria-label="Grid view">
              <Grid2X2 />
            </RadioButton>
            <RadioButton
              value="table"
              size="sm"
              px="2.5"
              aria-label="Table view"
            >
              <List />
            </RadioButton>
          </RadioButtonGroup>
        </Flex>
      </Flex>

      {visibleDeployments.length === 0 ? (
        <EmptyNotice
          minH="64"
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
          icon={<Search />}
          title="No deployments found"
          description="Adjust your search or filters to see more deployments."
        />
      ) : view === 'grid' ? (
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
          {visibleDeployments.map((deployment) => {
            const idle = deployment.status !== 'Live'
            return (
              <Card.Root
                key={deployment.id}
                variant="outline"
                overflow="hidden"
              >
                <Flex align="center" gap="3" p="4">
                  <Center
                    boxSize="9"
                    flexShrink={0}
                    rounded="l2"
                    bg={idle ? 'bg.muted' : 'brand.subtle'}
                    color={idle ? 'fg.muted' : 'brand.fg'}
                  >
                    <Rocket size={16} />
                  </Center>
                  <Box minW="0" flex="1">
                    <Card.Title
                      as="h2"
                      truncate
                      fontFamily="mono"
                      textStyle="body-sm"
                      fontWeight="semibold"
                    >
                      <Link asChild color="brand-text">
                        <RouterLink
                          to="/projects/$projectId/deployments/$deploymentId"
                          params={{
                            projectId: deployment.projectId,
                            deploymentId: deployment.id,
                          }}
                        >
                          {deployment.name}
                        </RouterLink>
                      </Link>
                    </Card.Title>
                    <Flex wrap="wrap" align="center" gap="1.5" fontSize="xs">
                      <ModelLink deployment={deployment} />
                      <EnvironmentBadge environment={deployment.environment} />
                    </Flex>
                  </Box>
                  <DeploymentStatusBadge status={deployment.status} />
                </Flex>
                <SimpleGrid
                  columns={4}
                  gap="2"
                  borderTopWidth="1px"
                  borderColor="border"
                  p="4"
                >
                  {(
                    [
                      ['Requests 24h', deployment.requests24h],
                      ['p95', deployment.latencyP95],
                      ['Errors', deployment.errorRate],
                      ['Cost/day', deployment.costPerDay],
                    ] as const
                  ).map(([label, value]) => (
                    <Box key={label} minW="0">
                      <Text truncate fontSize="11px" color="fg.muted">
                        {label}
                      </Text>
                      <Text
                        mt="0.5"
                        truncate
                        fontSize="13px"
                        fontWeight="semibold"
                        fontVariantNumeric="tabular-nums"
                        color={value === '—' ? 'fg.muted' : undefined}
                      >
                        {value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Card.Root>
            )
          })}
        </SimpleGrid>
      ) : (
        <Table.ScrollArea
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
        >
          <Table.Root variant="data" minW="940px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Deployment</Table.ColumnHeader>
                <Table.ColumnHeader>Model</Table.ColumnHeader>
                <Table.ColumnHeader>Environment</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  Requests 24h
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">p95</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Errors</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  Cost/day
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visibleDeployments.map((deployment) => (
                <Table.Row key={deployment.id}>
                  <Table.Cell>
                    <Link
                      asChild
                      fontFamily="mono"
                      fontWeight="medium"
                      color="brand-text"
                    >
                      <RouterLink
                        to="/projects/$projectId/deployments/$deploymentId"
                        params={{
                          projectId: deployment.projectId,
                          deploymentId: deployment.id,
                        }}
                      >
                        {deployment.name}
                      </RouterLink>
                    </Link>
                    <Text mt="0.5" fontSize="xs" color="fg.muted">
                      {deployment.region} · {deployment.instanceName}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <ModelLink deployment={deployment} />
                  </Table.Cell>
                  <Table.Cell>
                    <EnvironmentBadge environment={deployment.environment} />
                  </Table.Cell>
                  <Table.Cell>
                    <DeploymentStatusBadge status={deployment.status} />
                  </Table.Cell>
                  {[
                    deployment.requests24h,
                    deployment.latencyP95,
                    deployment.errorRate,
                    deployment.costPerDay,
                  ].map((value, index) => (
                    <Table.Cell
                      key={index}
                      textAlign="end"
                      fontVariantNumeric="tabular-nums"
                    >
                      {value}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
    </>
  )
}
