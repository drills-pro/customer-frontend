import { createRoute } from '@tanstack/react-router';
import { DATASET_TABS, type DatasetTab } from '@/modules/datasets/tabs';
import { DatasetPage } from '@/modules/datasets/pages/DatasetPage';
import { DatasetsPage } from '@/modules/datasets/pages/DatasetsPage';
import { ImportPage } from '@/modules/datasets/pages/ImportPage';
import { NewImportPage } from '@/modules/datasets/pages/NewImportPage';
import { VersionPage } from '@/modules/datasets/pages/VersionPage';
import { projectsLayoutRoute } from '@/modules/projects';

/** Parent of every /w/$slug/projects/$projectId/datasets page; renders only its child. */
export const datasetsLayoutRoute = createRoute({ getParentRoute: () => projectsLayoutRoute, path: '$projectId/datasets' });
export const datasetListRoute = createRoute({ getParentRoute: () => datasetsLayoutRoute, path: '/', component: DatasetsPage });
export const datasetRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: '$datasetId',
  validateSearch: (search: Record<string, unknown>): { tab?: DatasetTab } => ({
    tab: search.tab === DATASET_TABS.imports ? DATASET_TABS.imports : undefined,
  }),
  component: DatasetPage,
});
export const newImportRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: '$datasetId/imports/new',
  component: NewImportPage,
});
export const importRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: '$datasetId/imports/$importId',
  component: ImportPage,
});
export const versionRoute = createRoute({
  getParentRoute: () => datasetsLayoutRoute,
  path: '$datasetId/versions/$versionId',
  component: VersionPage,
});
