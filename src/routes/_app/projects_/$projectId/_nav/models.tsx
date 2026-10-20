import * as React from 'react'
import {
  Box,
  Button,
  Card,
  Center,
  Code,
  Flex,
  Input,
  InputGroup,
  Link,
  SimpleGrid,
  Table,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { Box as BoxIcon, Grid2X2, List, Plus, Search } from 'lucide-react'

import { EmptyNotice } from '@/components/shared/empty-notice'
import {
  RadioButton,
  RadioButtonGroup,
} from '@/components/shared/radio-button-group'
import { SimpleSelect } from '@/components/simple-select'
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
      <Box mt="6">
        <SectionError
          title="Could not load models"
          error={modelsQuery.error}
          onRetry={() => void modelsQuery.refetch()}
        />
      </Box>
    )
  }
  if (modelsQuery.isPending) {
    return (
      <Box mt="6">
        <SectionLoading />
      </Box>
    )
  }
  if (models.length === 0) {
    return (
      <EmptyNotice
        mt="6"
        minH="64"
        rounded="l3"
        borderWidth="1px"
        borderColor="border"
        bg="surface-raised"
        icon={<BoxIcon />}
        title="No models yet"
        description="A model appears here each time a training run completes."
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
            aria-label="Search models"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <Flex wrap="wrap" gap="2">
          <SimpleSelect
            label="Filter by stage"
            hideLabel
            size="sm"
            width="132px"
            value={stage}
            onChange={setStage}
            items={[
              { label: 'All stages', value: 'all' },
              ...stageOptions.map((item) => ({ label: item, value: item })),
            ]}
          />
          <SimpleSelect
            label="Filter by architecture"
            hideLabel
            size="sm"
            width="180px"
            value={architecture}
            onChange={setArchitecture}
            items={[
              { label: 'All architectures', value: 'all' },
              ...architectures.map((item) => ({ label: item, value: item })),
            ]}
          />
          <RadioButtonGroup
            attached
            aria-label="Model view"
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

      {visibleModels.length === 0 ? (
        <EmptyNotice
          minH="64"
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
          icon={<Search />}
          title="No models found"
          description="Adjust your search or filters to see more models."
        />
      ) : view === 'table' ? (
        <Table.ScrollArea
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
        >
          <Table.Root variant="data" minW="900px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Model</Table.ColumnHeader>
                <Table.ColumnHeader>Version</Table.ColumnHeader>
                <Table.ColumnHeader>Source run</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  Accuracy
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  Macro F1
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Size</Table.ColumnHeader>
                <Table.ColumnHeader>Stage</Table.ColumnHeader>
                <Table.ColumnHeader>Deployment</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visibleModels.map((model) => {
                const deployment = deploymentByModelId.get(model.id)
                return (
                  <Table.Row key={model.id}>
                    <Table.Cell>
                      <Link asChild fontWeight="medium" color="brand-text">
                        <RouterLink
                          to="/projects/$projectId/models/$modelId"
                          params={{
                            projectId: model.projectId,
                            modelId: model.id,
                          }}
                        >
                          {model.name}
                        </RouterLink>
                      </Link>
                      <Text mt="0.5" fontSize="xs" color="fg.muted">
                        {model.architecture}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Code size="sm">v{model.version}</Code>
                    </Table.Cell>
                    <Table.Cell>
                      <Link asChild fontWeight="medium" color="fg">
                        <RouterLink
                          to="/projects/$projectId/training/$runId"
                          params={{
                            projectId: model.projectId,
                            runId: model.runId,
                          }}
                        >
                          {model.runId}
                        </RouterLink>
                      </Link>
                    </Table.Cell>
                    <Table.Cell
                      textAlign="end"
                      fontWeight="semibold"
                      fontVariantNumeric="tabular-nums"
                      color="fg"
                    >
                      {formatAccuracy(model.accuracy)}
                    </Table.Cell>
                    <Table.Cell
                      textAlign="end"
                      fontVariantNumeric="tabular-nums"
                    >
                      {formatF1(model.f1)}
                    </Table.Cell>
                    <Table.Cell
                      textAlign="end"
                      fontVariantNumeric="tabular-nums"
                    >
                      {model.size}
                    </Table.Cell>
                    <Table.Cell>
                      <StageBadge stage={model.stage} />
                    </Table.Cell>
                    <Table.Cell>
                      {deployment ? (
                        <Link asChild fontWeight="medium" color="brand-text">
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
                      ) : (
                        <Text as="span" color="fg.muted">
                          —
                        </Text>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} gap="3">
          {visibleModels.map((model) => (
            <Card.Root key={model.id} variant="outline">
              <Card.Body gap="3" p="4">
                <Flex align="center" gap="3">
                  <Center
                    boxSize="9"
                    flexShrink={0}
                    rounded="l2"
                    bg="brand.subtle"
                    color="brand.fg"
                  >
                    <BoxIcon size={16} />
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
                          to="/projects/$projectId/models/$modelId"
                          params={{
                            projectId: model.projectId,
                            modelId: model.id,
                          }}
                        >
                          {model.name} v{model.version}
                        </RouterLink>
                      </Link>
                    </Card.Title>
                    <Text fontSize="xs" color="fg.muted">
                      {model.architecture} · {model.created}
                    </Text>
                  </Box>
                  <StageBadge stage={model.stage} />
                </Flex>
                <Text textStyle="body-sm" fontVariantNumeric="tabular-nums">
                  {formatAccuracy(model.accuracy)} accuracy · {model.size}
                </Text>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}
    </>
  )
}
