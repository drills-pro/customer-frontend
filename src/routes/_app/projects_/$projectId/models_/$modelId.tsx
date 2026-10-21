import * as React from 'react';
import { Box, Tabs } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router';

import { RouteBreadcrumbs } from '@/components/breadcrumbs';
import { isNotFound } from '@/api/errors';
import { PageError, PageLoading } from '@/components/shared/query-states';
import { useProjectDetail } from '@/features/dashboard/context';
import { useModel } from '@/features/models/queries';
import { FilesTab, ModelHeader, ModelNotFound, OverviewTab, PlaygroundTab, tabs, VersionsTab } from './-components/model-detail';
import type { ModelTab } from './-components/model-detail';

export const Route = createFileRoute('/_app/projects_/$projectId/models_/$modelId')({
  component: ModelDetailRoute,
  notFoundComponent: ModelDetailNotFoundRoute,
  staticData: {
    breadcrumb: ({ entities: { model }, parent: { project } }) => {
      if (!project || !model) return null;
      return {
        items: [
          {
            id: 'models',
            label: 'Models',
            link: {
              to: '/projects/$projectId/models',
              params: { projectId: project.id },
            },
          },
          { id: model.id, label: `${model.name} v${model.version}` },
        ],
        data: { model },
      };
    },
  },
});

function ModelDetailRoute() {
  const { modelId } = Route.useParams();
  const { project } = useProjectDetail();
  const [tab, setTab] = React.useState<ModelTab>('overview');

  const { data: found, error, refetch } = useModel(project.id, modelId);

  if (error) {
    return isNotFound(error) ? (
      <ModelNotFound projectId={project.id} />
    ) : (
      <PageError title="Could not load this model" error={error} onRetry={() => void refetch()} />
    );
  }
  if (!found) return <PageLoading />;

  return (
    <Box as="main" id="dashboard-main" mx="auto" w="full" maxW="1448px" minW="0" flex="1" p={{ base: '4', sm: '6' }}>
      <RouteBreadcrumbs mb="3" />

      <ModelHeader />

      <Tabs.Root
        variant="subtle"
        size="sm"
        // Only the open tab is in the page, as before.
        lazyMount
        unmountOnExit
        value={tab}
        onValueChange={(event) => setTab(event.value as ModelTab)}
        minW="0"
      >
        <Tabs.List aria-label="Model sections" mb="6" flexWrap="wrap" gap="2">
          {tabs.map((item) => (
            <Tabs.Trigger key={item} value={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" pt="0">
          <OverviewTab />
        </Tabs.Content>
        <Tabs.Content value="playground" pt="0">
          <PlaygroundTab />
        </Tabs.Content>
        <Tabs.Content value="files" pt="0">
          <FilesTab />
        </Tabs.Content>
        <Tabs.Content value="versions" pt="0">
          <VersionsTab />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

function ModelDetailNotFoundRoute() {
  const { projectId } = Route.useParams();
  return <ModelNotFound projectId={projectId} />;
}
