import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from 'cn'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  datasetDetails,
  datasets as seededDatasets,
  resolveProject,
} from '@/features/dashboard/data'
import type { DatasetSample } from '@/features/dashboard/data'
import {
  DatasetHeader,
  DatasetStatus,
  DistributionCard,
  fallbackDetail,
  HealthCard,
  ImagePreview,
  StatisticsTab,
  QualityTab,
  tabs,
  TextPreview,
  VersionsTab,
} from './-components/dataset-detail'
import type { DatasetTab } from './-components/dataset-detail'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/datasets_/$datasetId',
)({
  component: DatasetDetailRoute,
  notFoundComponent: DatasetDetailNotFoundRoute,
})

function DatasetDetailRoute() {
  const { projectId, datasetId } = Route.useParams()
  const { preferences, updatePreferences, hydrated } = useDashboardLayout()
  const [tab, setTab] = React.useState<DatasetTab>('preview')
  const resolved = resolveProject(projectId, preferences)

  React.useEffect(() => {
    if (
      hydrated &&
      resolved &&
      preferences.organizationId !== resolved.project.orgId
    )
      updatePreferences({ organizationId: resolved.project.orgId })
  }, [hydrated, preferences.organizationId, resolved, updatePreferences])

  if (!hydrated) {
    return <main id="dashboard-main" className="min-h-96 flex-1" />
  }
  if (!resolved) return <DatasetDetailNotFound projectId={projectId} />

  const { project, organization } = resolved

  const dataset = [...preferences.datasets, ...seededDatasets].find(
    (item) => item.id === datasetId && item.projectId === project.id,
  )

  if (!dataset) return <DatasetDetailNotFound projectId={projectId} />

  const detail = datasetDetails[dataset.id] ?? fallbackDetail(dataset)
  const imageSamples = detail.samples.filter(
    (sample): sample is Extract<DatasetSample, { modality: 'image' }> =>
      sample.modality === 'image',
  )
  const textSamples = detail.samples.filter(
    (sample): sample is Extract<DatasetSample, { modality: 'text' }> =>
      sample.modality === 'text',
  )

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/projects/$projectId/overview"
                params={{ projectId: project.id }}
              >
                {organization.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/projects/$projectId/overview"
                params={{ projectId: project.id }}
              >
                {project.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/projects/$projectId/datasets"
                params={{ projectId: project.id }}
              >
                Datasets
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{dataset.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <DatasetHeader dataset={dataset} project={project} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <Button
            key={item}
            type="button"
            variant="ghost"
            onClick={() => setTab(item)}
            className={cn(
              'h-auto shrink-0 gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
              tab === item
                ? 'bg-indigo-600 font-semibold text-white! shadow-xs hover:bg-indigo-600 hover:text-white!'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-white hover:text-indigo-600',
            )}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      {dataset.status !== 'Ready' ? (
        <DatasetStatus dataset={dataset} />
      ) : tab === 'preview' ? (
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-4">
          <div className="min-w-0 lg:col-span-3">
            {dataset.modality === 'image' ? (
              <ImagePreview dataset={dataset} samples={imageSamples} />
            ) : dataset.modality === 'text' ? (
              <TextPreview dataset={dataset} samples={textSamples} />
            ) : (
              <Empty className="min-h-64 border bg-white">
                <EmptyHeader>
                  <EmptyTitle>No preview available</EmptyTitle>
                  <EmptyDescription>
                    This demo currently includes image and text previews.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>

          <aside className="grid gap-6 lg:col-span-1">
            <DistributionCard
              title={
                dataset.modality === 'text'
                  ? 'Label distribution'
                  : 'Class distribution'
              }
              distribution={detail.distribution}
            />
            <HealthCard
              checks={detail.healthChecks}
              onReview={() => setTab('quality')}
            />
            <Card size="lg">
              <CardHeader>
                <CardTitle>Dataset owner</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{organization.name}</p>
                <p className="mt-1 text-muted-foreground">{project.name}</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : tab === 'statistics' ? (
        <StatisticsTab dataset={dataset} detail={detail} />
      ) : tab === 'quality' ? (
        <QualityTab dataset={dataset} detail={detail} />
      ) : (
        <VersionsTab dataset={dataset} detail={detail} />
      )}
    </main>
  )
}

function DatasetDetailNotFoundRoute() {
  const { projectId } = Route.useParams()
  return <DatasetDetailNotFound projectId={projectId} />
}

function DatasetDetailNotFound({ projectId }: { projectId: string }) {
  return (
    <main
      id="dashboard-main"
      className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-1 items-center p-6"
    >
      <Empty className="w-full border bg-white">
        <EmptyHeader>
          <EmptyTitle>Dataset not found</EmptyTitle>
          <EmptyDescription>
            This dataset does not exist in the selected project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/projects/$projectId/datasets" params={{ projectId }}>
              Return to datasets
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
