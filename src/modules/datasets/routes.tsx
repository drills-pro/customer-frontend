import { createRoute, Navigate, useParams } from '@tanstack/react-router';
import { VersionCrumb } from '@/modules/datasets/components/Crumbs';
import { DATASET_TABS, type DatasetTab } from '@/modules/datasets/tabs';
import { DatasetPage } from '@/modules/datasets/pages/DatasetPage';
import { ImportPage } from '@/modules/datasets/pages/ImportPage';
import { NewImportPage } from '@/modules/datasets/pages/NewImportPage';
import { VersionPage } from '@/modules/datasets/pages/VersionPage';
import { projectRoute } from '@/modules/projects';
import { textCrumb } from '@/shared/ui/crumbs';

/** Parent of every /w/$slug/projects/$projectId/datasets page; renders only its child. A project has one dataset, so its pages are not nested under an id. */
export const datasetsLayoutRoute = createRoute({
  getParentRoute: () => projectRoute,
  path: 'datasets',
  staticData: { crumb: textCrumb('datasets.title') },
});
/** The project's dataset: its versions and its imports. */
export const datasetRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): { tab?: DatasetTab } => ({
    tab: search.tab === DATASET_TABS.imports ? DATASET_TABS.imports : undefined,
  }),
  component: DatasetPage,
});
export const newImportRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: 'imports/new',
  staticData: { crumb: textCrumb('datasets.newImport.title') },
  component: NewImportPage,
});
export const importRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: 'imports/$importId',
  // An import is listed on the dataset's imports tab, so the datasets crumb returns there.
  staticData: { crumb: textCrumb('datasets.import.title'), parentSearch: { tab: DATASET_TABS.imports } },
  component: ImportPage,
});
export const versionRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: 'versions/$versionId',
  staticData: { crumb: VersionCrumb },
  component: VersionPage,
});
/** Links to a dataset by id, from before a project had one dataset: they go to the project's dataset. */
export const legacyDatasetRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: '$datasetId',
  component: function LegacyDatasetRedirect() {
    const { slug, projectId } = useParams({ from: '/app/w/$slug/projects/$projectId/datasets/$datasetId' });
    return <Navigate to="/w/$slug/projects/$projectId/datasets" params={{ slug, projectId }} replace />;
  },
});

/** The whole subtree, for the router to mount under the project route. */
export const datasetsRoute = datasetsLayoutRoute.addChildren([datasetRoute, newImportRoute, importRoute, versionRoute, legacyDatasetRoute]);
