import * as React from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Flex,
  HStack,
  Input,
  InputGroup,
  Link,
  SimpleGrid,
  Table,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react';
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router';
import { Box as BoxIcon, Grid2X2, List, Plus, Search } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { RadioButton, RadioButtonGroup } from '@/components/shared/radio-button-group';
import { SimpleSelect } from '@/components/simple-select';
import { SectionError, SectionLoading } from '@/components/shared/query-states';
import { useProjectDetail } from '@/features/dashboard/context';
import { useAddDataset, useProjectDatasets } from '@/features/datasets/queries';
import type { NewDataset } from '@/features/datasets/queries';
import { unavailable } from '@/lib/unavailable';
import { AddDatasetDialog, DatasetActions, StatusBadge, splitOptions, statusOptions } from '../-components/dataset-list';

type ProjectDatasetsSearch = { add?: boolean };

export const Route = createFileRoute('/_app/projects_/$projectId/_nav/datasets')({
  validateSearch: (search: Record<string, unknown>): ProjectDatasetsSearch => ({
    add: search.add === true || search.add === 'true' ? true : undefined,
  }),
  component: ProjectDatasetsRoute,
});

function ProjectDatasetsRoute() {
  const search = Route.useSearch();
  const { project } = useProjectDetail();
  const datasetsQuery = useProjectDatasets(project.id);
  const addDatasetMutation = useAddDataset(project.id);
  const [query, setQuery] = React.useState('');
  const [split, setSplit] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [view, setView] = React.useState('table');
  const [addOpen, setAddOpen] = React.useState(search.add === true);

  const allDatasets = datasetsQuery.data ?? [];
  const visibleDatasets = allDatasets.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (split === 'all' || item.split === split) &&
      (status === 'all' || item.status === status),
  );

  function addDataset(dataset: NewDataset) {
    addDatasetMutation.mutate(dataset, {
      onSuccess: (created) =>
        toaster.create({
          type: 'success',
          title: `Dataset ${created.name} added for processing.`,
        }),
    });
  }

  return (
    <>
      <Flex mt="6" mb="4" wrap="wrap" align="center" gap="2">
        <InputGroup flex="1" minW="220px" startElement={<Search size={16} aria-hidden="true" />}>
          <Input
            size="sm"
            aria-label="Search datasets"
            placeholder="Search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <Flex wrap="wrap" gap="2">
          <SimpleSelect
            label="Filter by type"
            hideLabel
            size="sm"
            width="116px"
            value={split}
            onChange={setSplit}
            items={[{ label: 'All types', value: 'all' }, ...splitOptions.map((item) => ({ label: item, value: item }))]}
          />
          <SimpleSelect
            label="Filter by status"
            hideLabel
            size="sm"
            width="132px"
            value={status}
            onChange={setStatus}
            items={[{ label: 'All statuses', value: 'all' }, ...statusOptions.map((item) => ({ label: item, value: item }))]}
          />
          <RadioButtonGroup attached aria-label="Dataset view" value={view} onChange={setView}>
            <RadioButton value="grid" size="sm" px="2.5" aria-label="Grid view">
              <Grid2X2 />
            </RadioButton>
            <RadioButton value="table" size="sm" px="2.5" aria-label="Table view">
              <List />
            </RadioButton>
          </RadioButtonGroup>
        </Flex>
      </Flex>

      {datasetsQuery.error ? (
        <SectionError title="Could not load datasets" error={datasetsQuery.error} onRetry={() => void datasetsQuery.refetch()} />
      ) : datasetsQuery.isPending ? (
        <SectionLoading />
      ) : visibleDatasets.length === 0 ? (
        <EmptyNotice
          minH="64"
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
          icon={<Search />}
          title="No datasets found"
          description="Adjust your search or filters, or add a new dataset."
        >
          <Button variant="solid" size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            Add Dataset
          </Button>
        </EmptyNotice>
      ) : view === 'table' ? (
        <Table.ScrollArea rounded="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
          <Table.Root variant="data">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Items</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>Classes</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created</Table.ColumnHeader>
                <Table.ColumnHeader>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visibleDatasets.map((dataset) => (
                <Table.Row key={dataset.id}>
                  <Table.Cell>
                    <Link asChild fontWeight="medium" color="brand-text">
                      <RouterLink
                        to="/projects/$projectId/datasets/$datasetId"
                        params={{
                          projectId: dataset.projectId,
                          datasetId: dataset.id,
                        }}
                      >
                        {dataset.name}
                      </RouterLink>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="gray" variant="subtle" fontWeight="normal">
                      {dataset.split}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell color="fg">
                    {dataset.items.toLocaleString('en-US')} {project.task.includes('Image') ? 'images' : 'items'}
                  </Table.Cell>
                  <Table.Cell>{dataset.size}</Table.Cell>
                  <Table.Cell>{dataset.classes || '—'}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={dataset.status} />
                  </Table.Cell>
                  <Table.Cell>{dataset.created}</Table.Cell>
                  <Table.Cell textAlign="end">
                    <DatasetActions dataset={dataset} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} gap="3">
          {visibleDatasets.map((dataset) => (
            <Card.Root key={dataset.id} variant="outline">
              <Card.Body gap="3" p="4">
                <Flex align="flex-start" gap="3">
                  <Center boxSize="9" flexShrink={0} rounded="l2" bg="brand.subtle" color="brand.fg">
                    <BoxIcon size={16} />
                  </Center>
                  <Box minW="0" flex="1">
                    <Card.Title as="h2" truncate textStyle="body-sm" fontWeight="semibold">
                      <Link asChild color="brand-text">
                        <RouterLink
                          to="/projects/$projectId/datasets/$datasetId"
                          params={{
                            projectId: dataset.projectId,
                            datasetId: dataset.id,
                          }}
                        >
                          {dataset.name}
                        </RouterLink>
                      </Link>
                    </Card.Title>
                    <Text mt="1" fontSize="xs" color="fg.muted">
                      {dataset.split} · {dataset.created}
                    </Text>
                  </Box>
                  <DatasetActions dataset={dataset} />
                </Flex>
                <Flex align="center" justify="space-between" textStyle="body-sm">
                  <span>
                    {dataset.items.toLocaleString('en-US')} items · {dataset.size}
                  </span>
                  <StatusBadge status={dataset.status} />
                </Flex>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}

      <EmptyNotice
        mt="6"
        px="6"
        py="16"
        rounded="l3"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor="border.emphasized"
        bg="surface-raised"
        icon={<BoxIcon />}
        title="Add more training data"
        description="Drag and drop files, or connect a cloud bucket. Supports CSV, JSONL, Parquet, ZIP, COCO and YOLO formats."
      >
        <HStack mt="2" gap="3">
          <Button variant="solid" size="sm" px="3.5" onClick={() => setAddOpen(true)}>
            <Plus />
            Add Dataset
          </Button>
          <Button variant="plain" size="sm" color="brand-text" onClick={() => unavailable('Learn more')}>
            Learn more →
          </Button>
        </HStack>
      </EmptyNotice>
      <AddDatasetDialog open={addOpen} onOpenChange={setAddOpen} existing={allDatasets} onAdd={addDataset} />
    </>
  );
}
