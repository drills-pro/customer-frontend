import * as React from 'react';
import { Box, Tabs } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router';

import { RouteBreadcrumbs } from '@/components/breadcrumbs';
import { isNotFound } from '@/api/errors';
import { PageError, PageLoading } from '@/components/shared/query-states';
import { useProjectDetail } from '@/features/dashboard/context';
import { useDeployment } from '@/features/deployments/queries';
import {
  DeploymentHeader,
  DeploymentNotFound,
  IntegrationTab,
  LogsTab,
  MonitoringTab,
  SettingsTab,
  tabs,
} from './-components/deployment-detail';
import type { DeploymentTab } from './-components/deployment-detail';

export const Route = createFileRoute('/_app/projects_/$projectId/deployments_/$deploymentId')({
  component: DeploymentDetailRoute,
  notFoundComponent: DeploymentDetailNotFoundRoute,
  staticData: {
    breadcrumb: ({ entities: { deployment }, parent: { project } }) => {
      if (!project || !deployment) return null;
      return {
        items: [
          {
            id: 'deployments',
            label: 'Deployments',
            link: {
              to: '/projects/$projectId/deployments',
              params: { projectId: project.id },
            },
          },
          { id: deployment.id, label: deployment.name },
        ],
        data: { deployment },
      };
    },
  },
});

function DeploymentDetailRoute() {
  const { deploymentId } = Route.useParams();
  const { project } = useProjectDetail();
  const [tab, setTab] = React.useState<DeploymentTab>('monitoring');
  const { data: found, error, refetch } = useDeployment(project.id, deploymentId);

  if (error) {
    return isNotFound(error) ? (
      <DeploymentNotFound projectId={project.id} />
    ) : (
      <PageError title="Could not load this deployment" error={error} onRetry={() => void refetch()} />
    );
  }
  if (!found) return <PageLoading />;

  return (
    <Box as="main" id="dashboard-main" mx="auto" w="full" maxW="1448px" minW="0" flex="1" p={{ base: '4', sm: '6' }}>
      <RouteBreadcrumbs mb="3" />

      <DeploymentHeader />

      <Tabs.Root
        variant="subtle"
        size="sm"
        // Only the open tab is in the page, as before.
        lazyMount
        unmountOnExit
        value={tab}
        onValueChange={(event) => setTab(event.value as DeploymentTab)}
        minW="0"
      >
        <Tabs.List aria-label="Deployment sections" mb="6" flexWrap="wrap" gap="2">
          {tabs.map((item) => (
            <Tabs.Trigger key={item} value={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="monitoring" pt="0">
          <MonitoringTab onEditScaling={() => setTab('settings')} />
        </Tabs.Content>
        <Tabs.Content value="integration" pt="0">
          <IntegrationTab />
        </Tabs.Content>
        <Tabs.Content value="logs" pt="0">
          <LogsTab />
        </Tabs.Content>
        <Tabs.Content value="settings" pt="0">
          <SettingsTab />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

function DeploymentDetailNotFoundRoute() {
  const { projectId } = Route.useParams();
  return <DeploymentNotFound projectId={projectId} />;
}
