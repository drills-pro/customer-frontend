import { getRouteApi } from '@tanstack/react-router'

import { useProjectDetail } from '@/features/dashboard/context'
import { useDataset } from '@/features/datasets/queries'

const route = getRouteApi('/_app/projects_/$projectId/datasets_/$datasetId')

/**
 * The dataset of the current page, read from the cache the route filled. The
 * route renders loading and not-found before anything calls this.
 */
export function useCurrentDataset() {
  const { datasetId } = route.useParams()
  const { project } = useProjectDetail()
  const result = useDataset(project.id, datasetId).data
  if (!result) throw new Error(`Dataset ${datasetId} not found`)
  return { project, ...result }
}
