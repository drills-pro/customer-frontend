import { getRouteApi } from '@tanstack/react-router'

import { useProjectDetail } from '@/features/dashboard/context'
import { useModel } from '@/features/dashboard/hooks'

const route = getRouteApi('/_app/projects_/$projectId/models_/$modelId')

/** The model of the current page. The route renders not-found before this runs. */
export function useCurrentModel() {
  const { modelId } = route.useParams()
  const { project } = useProjectDetail()
  const result = useModel(project.id, modelId)
  if (!result) throw new Error(`Model ${modelId} not found`)
  return { project, ...result }
}
