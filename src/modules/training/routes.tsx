import { createRoute } from '@tanstack/react-router';
import { projectRoute } from '@/modules/projects';
import { textCrumb } from '@/shared/ui/crumbs';
import { NewTrainingPage } from '@/modules/training/pages/NewTrainingPage';
import { RunPage } from '@/modules/training/pages/RunPage';
import { RunsPage } from '@/modules/training/pages/RunsPage';

/** Parent of every /w/$slug/projects/$projectId/training page, so "Training" sits in the breadcrumb above each; renders only its child. */
export const trainingLayoutRoute = createRoute({
  getParentRoute: () => projectRoute,
  path: 'training',
  staticData: { crumb: textCrumb('training.title') },
});
export const runsRoute = createRoute({ getParentRoute: () => trainingLayoutRoute, path: '/', component: RunsPage });
/** `?clone=<run id>` starts the wizard from that run. */
interface NewTrainingSearch {
  clone?: string;
}

export const newTrainingRoute = createRoute({
  getParentRoute: () => trainingLayoutRoute,
  path: 'new',
  validateSearch: (search: Record<string, unknown>): NewTrainingSearch => ({
    clone: typeof search.clone === 'string' && search.clone ? search.clone : undefined,
  }),
  staticData: { crumb: textCrumb('training.new.title') },
  component: NewTrainingPage,
});
export const runRoute = createRoute({
  getParentRoute: () => trainingLayoutRoute,
  path: '$runId',
  staticData: { crumb: textCrumb('training.run.title') },
  component: RunPage,
});

/** The whole subtree, for the router to mount under the project route. */
export const trainingRoutes = [trainingLayoutRoute.addChildren([runsRoute, newTrainingRoute, runRoute])] as const;
