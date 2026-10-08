import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectDetail } from '@/features/dashboard/context'
import { useDeployment } from '@/features/dashboard/hooks'
import { resolveDeployment } from '@/features/dashboard/selectors/deployments'
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
    breadcrumb: ({ params, parent: { project } }) => {
      if (!project) return null
      const deployment = resolveDeployment(project.id, params.deploymentId)
      if (!deployment) return null
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
  const found = useDeployment(project.id, deploymentId)

  if (!found) return <DeploymentNotFound projectId={project.id} />

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <RouteBreadcrumbs className="mb-3" />

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
          <MonitoringTab />
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
