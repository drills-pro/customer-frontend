import { createRoute } from '@tanstack/react-router';
import { DatasetCrumb, VersionCrumb } from '@/modules/datasets/components/Crumbs';
import { DATASET_TABS, type DatasetTab } from '@/modules/datasets/tabs';
import { DatasetPage } from '@/modules/datasets/pages/DatasetPage';
import { DatasetsPage } from '@/modules/datasets/pages/DatasetsPage';
import { ImportPage } from '@/modules/datasets/pages/ImportPage';
import { NewImportPage } from '@/modules/datasets/pages/NewImportPage';
import { VersionPage } from '@/modules/datasets/pages/VersionPage';
import { projectRoute } from '@/modules/projects';
import { textCrumb } from '@/shared/ui/crumbs';

/** Parent of every /w/$slug/projects/$projectId/datasets page; renders only its child. */
export const datasetsLayoutRoute = createRoute({
  getParentRoute: () => projectRoute,
  path: 'datasets',
  staticData: { crumb: textCrumb('datasets.title') },
});
export const datasetListRoute = createRoute({ getParentRoute: () => datasetsLayoutRoute, path: '/', component: DatasetsPage });
/** Parent of one dataset's pages, so its name sits in the breadcrumb above each of them; renders only its child. */
export const datasetLayoutRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: '$datasetId',
  staticData: { crumb: DatasetCrumb },
});
export const datasetRoute = createRoute({
  getParentRoute: () => datasetLayoutRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): { tab?: DatasetTab } => ({
    tab: search.tab === DATASET_TABS.imports ? DATASET_TABS.imports : undefined,
  }),
  component: DatasetPage,
});
export const newImportRoute = createRoute({
  getParentRoute: () => datasetLayoutRoute,
  path: 'imports/new',
  staticData: { crumb: textCrumb('datasets.newImport.title') },
  component: NewImportPage,
});
export const importRoute = createRoute({
  getParentRoute: () => datasetLayoutRoute,
  path: 'imports/$importId',
  // An import is listed on the dataset's imports tab, so the dataset crumb returns there.
  staticData: { crumb: textCrumb('datasets.import.title'), parentSearch: { tab: DATASET_TABS.imports } },
  component: ImportPage,
});
export const versionRoute = createRoute({
  getParentRoute: () => datasetLayoutRoute,
  path: 'versions/$versionId',
  staticData: { crumb: VersionCrumb },
  component: VersionPage,
});

/** The whole subtree, for the router to mount under the project route. */
export const datasetsRoute = datasetsLayoutRoute.addChildren([
  datasetListRoute,
  datasetLayoutRoute.addChildren([datasetRoute, newImportRoute, importRoute, versionRoute]),
]);
