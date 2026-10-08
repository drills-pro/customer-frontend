import { getRouteApi } from '@tanstack/react-router'

import { useProjectDetail } from '@/features/dashboard/context'
import { useDataset } from '@/features/dashboard/hooks'

const route = getRouteApi('/_app/projects_/$projectId/datasets_/$datasetId')

/** The dataset of the current page. The route renders not-found before this runs. */
export function useCurrentDataset() {
  const { datasetId } = route.useParams()
  const { project } = useProjectDetail()
  const result = useDataset(project.id, datasetId)
  if (!result) throw new Error(`Dataset ${datasetId} not found`)
  return { project, ...result }
}
