import { useParams } from '@tanstack/react-router'
import { useDemo } from './store'

export function useProject() {
  const { projectId } = useParams({ strict: false })
  const { state } = useDemo()
  return state.projects.find((project) => project.id === projectId)
}
