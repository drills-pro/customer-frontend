/**
 * React Query hooks for reference data. It changes with the platform, not
 * with a workspace, so it is fetched once per session.
 */
import { useQuery } from '@tanstack/react-query'

import { catalogApi } from './api'

const forSession = { staleTime: Infinity } as const

export function useTaskTypes() {
  return useQuery({
    queryKey: ['catalog', 'task-types'],
    queryFn: catalogApi.listTaskTypes,
    ...forSession,
  })
}

export function useRegions() {
  return useQuery({
    queryKey: ['catalog', 'regions'],
    queryFn: catalogApi.listRegions,
    ...forSession,
  })
}

export function useProjectTemplates(taskType: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'project-templates', taskType],
    queryFn: () => catalogApi.listProjectTemplates(taskType),
    enabled: Boolean(taskType),
    ...forSession,
  })
}

export function useArchitectures(taskType: string) {
  return useQuery({
    queryKey: ['catalog', 'architectures', taskType],
    queryFn: () => catalogApi.listArchitectures(taskType),
    ...forSession,
  })
}

export function useComputeOptions(
  purpose: 'training' | 'serving' = 'training',
) {
  return useQuery({
    queryKey: ['catalog', 'compute-options', purpose],
    queryFn: () => catalogApi.listComputeOptions(purpose),
    ...forSession,
  })
}

export function usePlans() {
  return useQuery({
    queryKey: ['catalog', 'plans'],
    queryFn: catalogApi.listPlans,
    ...forSession,
  })
}
