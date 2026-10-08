import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectDetail } from '@/features/dashboard/context'
import { useModel } from '@/features/dashboard/hooks'
import { resolveModel } from '@/features/dashboard/selectors/models'
import {
  FilesTab,
  ModelHeader,
  ModelNotFound,
  OverviewTab,
  PlaygroundTab,
  tabs,
  VersionsTab,
} from './-components/model-detail'
import type { ModelTab } from './-components/model-detail'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/models_/$modelId',
)({
  component: ModelDetailRoute,
  notFoundComponent: ModelDetailNotFoundRoute,
  staticData: {
    breadcrumb: ({ params, parent: { project } }) => {
      if (!project) return null
      const model = resolveModel(project.id, params.modelId)
      if (!model) return null
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
      }
    },
  },
})

function ModelDetailRoute() {
  const { modelId } = Route.useParams()
  const { project } = useProjectDetail()
  const [tab, setTab] = React.useState<ModelTab>('overview')

  const found = useModel(project.id, modelId)

  if (!found) return <ModelNotFound projectId={project.id} />

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <RouteBreadcrumbs className="mb-3" />

      <ModelHeader />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ModelTab)}
        className="min-w-0 gap-0"
      >
        <TabsList variant="chip" aria-label="Model sections" className="mb-6">
          {tabs.map((item) => (
            <TabsTrigger key={item} value={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="playground">
          <PlaygroundTab />
        </TabsContent>
        <TabsContent value="files">
          <FilesTab />
        </TabsContent>
        <TabsContent value="versions">
          <VersionsTab />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function ModelDetailNotFoundRoute() {
  const { projectId } = Route.useParams()
  return <ModelNotFound projectId={projectId} />
}
