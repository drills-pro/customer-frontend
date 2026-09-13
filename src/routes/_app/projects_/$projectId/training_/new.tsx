import { createFileRoute } from '@tanstack/react-router'

import { useDashboardLayout } from '@/features/dashboard/context'
import {
  datasets as seededDatasets,
  resolveProject,
} from '@/features/dashboard/data'
import { resolveTrainingRun } from '@/features/dashboard/selectors/training-runs'
import { TrainingNotFound } from './-components/training-not-found'
import { TrainingWizard } from './-components/training-wizard'

type TrainingSearch = { dataset?: string; clone?: string }

export const Route = createFileRoute(
  '/_app/projects_/$projectId/training_/new',
)({
  validateSearch: (search: Record<string, unknown>): TrainingSearch => ({
    dataset: typeof search.dataset === 'string' ? search.dataset : undefined,
    clone: typeof search.clone === 'string' ? search.clone : undefined,
  }),
  component: NewTrainingRoute,
  notFoundComponent: TrainingNotFound,
  staticData: {
    breadcrumb: ({ parent: { project } }) =>
      project
        ? { items: [{ id: 'new-training', label: 'New training run' }] }
        : null,
  },
})

function NewTrainingRoute() {
  const { projectId } = Route.useParams()
  const search = Route.useSearch()
  const { preferences, hydrated } = useDashboardLayout()

  if (!hydrated) {
    return <main id="dashboard-main" className="min-h-96 flex-1" />
  }

  const resolved = resolveProject(projectId, preferences)
  if (!resolved) return <TrainingNotFound />
  const { project } = resolved

  const datasets = [...preferences.datasets, ...seededDatasets].filter(
    (dataset, index, all) =>
      dataset.projectId === project.id &&
      dataset.status === 'Ready' &&
      all.findIndex((candidate) => candidate.id === dataset.id) === index,
  )
  const clone = search.clone
    ? resolveTrainingRun(preferences, project.id, search.clone)
    : undefined

  return (
    <TrainingWizard
      key={`${project.id}-${search.dataset ?? ''}-${clone?.id ?? ''}`}
      project={project}
      datasets={datasets}
      initialDatasetId={search.dataset}
      clone={clone}
    />
  )
}
