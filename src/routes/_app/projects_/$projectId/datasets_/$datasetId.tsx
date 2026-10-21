import * as React from 'react';
import { Box, Button, Grid, Tabs, Text } from '@chakra-ui/react';
import { createFileRoute, Link } from '@tanstack/react-router';

import { RouteBreadcrumbs } from '@/components/breadcrumbs';
import { EmptyNotice } from '@/components/shared/empty-notice';
import { RecordNotFound } from '@/components/shared/record-not-found';
import { SectionCard } from '@/components/shared/section-card';
import { isNotFound } from '@/api/errors';
import { PageError, PageLoading } from '@/components/shared/query-states';
import { useProjectDetail } from '@/features/dashboard/context';
import { useDataset } from '@/features/datasets/queries';
import {
  DatasetHeader,
  DatasetStatus,
  DistributionCard,
  HealthCard,
  ImagePreview,
  StatisticsTab,
  QualityTab,
  tabs,
  TextPreview,
  VersionsTab,
} from './-components/dataset-detail';
import type { DatasetTab } from './-components/dataset-detail';

export const Route = createFileRoute('/_app/projects_/$projectId/datasets_/$datasetId')({
  component: DatasetDetailRoute,
  notFoundComponent: DatasetDetailNotFoundRoute,
  staticData: {
    breadcrumb: ({ entities: { dataset }, parent: { project } }) => {
      if (!project || !dataset) return null;
      return {
        items: [
          {
            id: 'datasets',
            label: 'Datasets',
            link: {
              to: '/projects/$projectId/datasets',
              params: { projectId: project.id },
            },
          },
          { id: dataset.id, label: dataset.name },
        ],
        data: { dataset },
      };
    },
  },
});

function DatasetDetailRoute() {
  const { datasetId } = Route.useParams();
  const { project, organization } = useProjectDetail();
  const [tab, setTab] = React.useState<DatasetTab>('preview');
  const { data: found, error, refetch } = useDataset(project.id, datasetId);

  if (error) {
    return isNotFound(error) ? (
      <DatasetDetailNotFound projectId={project.id} />
    ) : (
      <PageError title="Could not load this dataset" error={error} onRetry={() => void refetch()} />
    );
  }
  if (!found) return <PageLoading />;
  const { dataset } = found;

  return (
    <Box as="main" id="dashboard-main" mx="auto" w="full" maxW="1448px" minW="0" flex="1" p={{ base: '4', sm: '6' }}>
      <RouteBreadcrumbs mb="3" />

      <DatasetHeader />

      {dataset.status !== 'Ready' ? (
        <DatasetStatus />
      ) : (
        <Tabs.Root
          variant="subtle"
          size="sm"
          // Only the open tab is in the page, as before.
          lazyMount
          unmountOnExit
          value={tab}
          onValueChange={(event) => setTab(event.value as DatasetTab)}
          minW="0"
        >
          <Tabs.List aria-label="Dataset sections" mb="6" flexWrap="wrap" gap="2">
            {tabs.map((item) => (
              <Tabs.Trigger key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="preview" pt="0">
            <Grid minW="0" alignItems="start" gap="6" templateColumns={{ lg: 'repeat(4, minmax(0, 1fr))' }}>
              <Box minW="0" gridColumn={{ lg: 'span 3' }}>
                {dataset.modality === 'image' ? (
                  <ImagePreview />
                ) : dataset.modality === 'text' ? (
                  <TextPreview />
                ) : (
                  <EmptyNotice
                    minH="64"
                    rounded="l3"
                    borderWidth="1px"
                    borderColor="border"
                    bg="surface-raised"
                    title="No preview available"
                    description="This demo currently includes image and text previews."
                  />
                )}
              </Box>

              <Grid as="aside" gap="6">
                <DistributionCard />
                <HealthCard onReview={() => setTab('quality')} />
                <SectionCard title="Dataset owner" divided={false}>
                  <Box px="5" pb="5" textStyle="body-sm">
                    <Text fontWeight="medium">{organization.name}</Text>
                    <Text mt="1" color="fg.muted">
                      {project.name}
                    </Text>
                  </Box>
                </SectionCard>
              </Grid>
            </Grid>
          </Tabs.Content>

          <Tabs.Content value="statistics" pt="0">
            <StatisticsTab />
          </Tabs.Content>
          <Tabs.Content value="quality" pt="0">
            <QualityTab onNavigateTab={setTab} />
          </Tabs.Content>
          <Tabs.Content value="versions" pt="0">
            <VersionsTab />
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Box>
  );
}

function DatasetDetailNotFoundRoute() {
  const { projectId } = Route.useParams();
  return <DatasetDetailNotFound projectId={projectId} />;
}

function DatasetDetailNotFound({ projectId }: { projectId: string }) {
  return (
    <RecordNotFound title="Dataset not found" description="This dataset does not exist in the selected project.">
      <Button asChild variant="solid" size="sm">
        <Link to="/projects/$projectId/datasets" params={{ projectId }}>
          Return to datasets
        </Link>
      </Button>
    </RecordNotFound>
  );
}
