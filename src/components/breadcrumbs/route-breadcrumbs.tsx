import * as React from 'react'
import { useMatches, useParams } from '@tanstack/react-router'

import { useDashboardLayout } from '@/features/dashboard/context'
import { useDataset } from '@/features/datasets/queries'
import { useDeployment } from '@/features/deployments/queries'
import { useModel } from '@/features/models/queries'
import { useProject } from '@/features/projects/queries'
import { useTrainingRun } from '@/features/training/queries'
import { CollapsibleBreadcrumb } from './collapsible-breadcrumb'
import type { BreadcrumbData, Crumb } from './types'

/**
 * Builds the trail from every matched route's `staticData.breadcrumb`, parent
 * first, so each route only declares its own crumbs.
 *
 * The records the trail names are read with the same query hooks the page
 * uses, so they come out of the cache the page already filled.
 */
export function RouteBreadcrumbs({ className }: { className?: string }) {
  const matches = useMatches()
  const { organizations, hydrated } = useDashboardLayout()
  const {
    projectId = '',
    datasetId = '',
    runId = '',
    modelId = '',
    deploymentId = '',
  } = useParams({ strict: false })

  const project = useProject(projectId, { enabled: Boolean(projectId) }).data
    ?.project
  const dataset = useDataset(projectId, datasetId, {
    enabled: Boolean(projectId && datasetId),
  }).data?.dataset
  const run = useTrainingRun(projectId, runId, {
    enabled: Boolean(projectId && runId),
  }).data
  const model = useModel(projectId, modelId, {
    enabled: Boolean(projectId && modelId),
  }).data?.model
  const deployment = useDeployment(projectId, deploymentId, {
    enabled: Boolean(projectId && deploymentId),
  }).data

  const items = React.useMemo(() => {
    const crumbs: Crumb[] = []
    let data: BreadcrumbData = {}

    for (const match of matches) {
      const resolve = match.staticData.breadcrumb
      if (!resolve) continue

      const result = resolve({
        params: match.params,
        organizations,
        entities: { project, dataset, run, model, deployment },
        parent: data,
      })
      if (!result) break

      crumbs.push(...(result.items ?? []))
      data = { ...data, ...result.data }
    }

    return crumbs
  }, [matches, organizations, project, dataset, run, model, deployment])

  if (!hydrated) return null

  return <CollapsibleBreadcrumb items={items} className={className} />
}
