import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isNotFound } from '@/api/errors'
import { PageError, PageLoading } from '@/components/shared/query-states'
import { useProjectDetail } from '@/features/dashboard/context'
import { useDeployment } from '@/features/deployments/queries'
import {
  DeploymentHeader,
  DeploymentNotFound,
  IntegrationTab,
  LogsTab,
  MonitoringTab,
  SettingsTab,
  tabs,
} from './-components/deployment-detail'
import type { DeploymentTab } from './-components/deployment-detail'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/deployments_/$deploymentId',
)({
  component: DeploymentDetailRoute,
  notFoundComponent: DeploymentDetailNotFoundRoute,
  staticData: {
    breadcrumb: ({ entities: { deployment }, parent: { project } }) => {
      if (!project || !deployment) return null
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
      }
    },
  },
})

function DeploymentDetailRoute() {
  const { deploymentId } = Route.useParams()
  const { project } = useProjectDetail()
  const [tab, setTab] = React.useState<DeploymentTab>('monitoring')
  const {
    data: found,
    error,
    refetch,
  } = useDeployment(project.id, deploymentId)

  if (error) {
    return isNotFound(error) ? (
      <DeploymentNotFound projectId={project.id} />
    ) : (
      <PageError
        title="Could not load this deployment"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }
  if (!found) return <PageLoading />

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <RouteBreadcrumbs mb="3" />

      <DeploymentHeader />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as DeploymentTab)}
        className="min-w-0 gap-0"
      >
        <TabsList
          variant="chip"
          aria-label="Deployment sections"
          className="mb-6"
        >
          {tabs.map((item) => (
            <TabsTrigger key={item} value={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="monitoring">
          <MonitoringTab onEditScaling={() => setTab('settings')} />
        </TabsContent>
        <TabsContent value="integration">
          <IntegrationTab />
        </TabsContent>
        <TabsContent value="logs">
          <LogsTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function DeploymentDetailNotFoundRoute() {
  const { projectId } = Route.useParams()
  return <DeploymentNotFound projectId={projectId} />
}
