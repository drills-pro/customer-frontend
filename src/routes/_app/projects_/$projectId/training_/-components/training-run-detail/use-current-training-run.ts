import { getRouteApi } from '@tanstack/react-router'

import { useProjectDetail } from '@/features/dashboard/context'
import { useTrainingRun } from '@/features/dashboard/hooks'

const route = getRouteApi('/_app/projects_/$projectId/training_/$runId')

/** The run of the current page. The route renders not-found before this runs. */
export function useCurrentTrainingRun() {
  const { runId } = route.useParams()
  const { project } = useProjectDetail()
  const result = useTrainingRun(project.id, runId)
  if (!result) throw new Error(`Training run ${runId} not found`)
  return { project, ...result }
}
