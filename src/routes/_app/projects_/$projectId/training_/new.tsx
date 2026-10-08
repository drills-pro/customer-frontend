import { createFileRoute } from '@tanstack/react-router'

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

  // Keyed on the inputs that prefill the form, so a new prefill resets it.
  return (
    <TrainingWizard
      key={`${projectId}-${search.dataset ?? ''}-${search.clone ?? ''}`}
    />
  )
}
