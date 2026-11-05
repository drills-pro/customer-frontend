import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useDataset, useVersions } from '@/modules/datasets/api';
import { CrumbName } from '@/shared/ui/crumbs';

/** The dataset's name in the breadcrumb; its pages load the same query. */
export function DatasetCrumb() {
  const { projectId, datasetId } = useParams({ from: '/app/w/$slug/projects/$projectId/datasets/$datasetId' });
  const { data, isPending } = useDataset(projectId, datasetId);
  return <CrumbName name={data?.name} pending={isPending} />;
}

/** "Version 3" once the versions list has it, like the version page's heading. */
export function VersionCrumb() {
  const { t } = useTranslation();
  const { projectId, datasetId, versionId } = useParams({
    from: '/app/w/$slug/projects/$projectId/datasets/$datasetId/versions/$versionId',
  });
  const { versions } = useVersions(projectId, datasetId);
  const number = versions?.find((v) => v.id === versionId)?.number;
  return number === undefined ? t('datasets.version.title') : t('datasets.version.titleNumber', { number });
}
