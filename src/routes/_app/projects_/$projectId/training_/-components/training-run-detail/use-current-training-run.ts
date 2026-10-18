import { getRouteApi } from '@tanstack/react-router'

import { useProjectDetail } from '@/features/dashboard/context'
import { useProjectDatasets } from '@/features/datasets/queries'
import { useTrainingRun } from '@/features/training/queries'

const route = getRouteApi('/_app/projects_/$projectId/training_/$runId')

/**
 * The run of the current page, read from the cache the route filled. The
 * route renders loading and not-found before anything calls this.
 */
export function useCurrentTrainingRun() {
  const { runId } = route.useParams()
  const { project } = useProjectDetail()
  const run = useTrainingRun(project.id, runId).data
  const datasets = useProjectDatasets(project.id).data
  if (!run) throw new Error(`Training run ${runId} not found`)
  return {
    project,
    run,
    /** Absent while the project's datasets are still loading. */
    dataset: datasets?.find((item) => item.id === run.datasetId),
  }
}
