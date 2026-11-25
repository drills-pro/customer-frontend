import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useProjectDataset, useVersions } from '@/modules/datasets/api';

/** "Version 3" once the versions list has it, like the version page's heading. */
export function VersionCrumb() {
  const { t } = useTranslation();
  const { projectId, versionId } = useParams({ from: '/app/w/$slug/projects/$projectId/datasets/versions/$versionId' });
  const { dataset } = useProjectDataset(projectId);
  return dataset ? <VersionNumber projectId={projectId} datasetId={dataset.id} versionId={versionId} /> : t('datasets.version.title');
}

function VersionNumber({ projectId, datasetId, versionId }: { projectId: string; datasetId: string; versionId: string }) {
  const { t } = useTranslation();
  const { versions } = useVersions(projectId, datasetId);
  const number = versions?.find((v) => v.id === versionId)?.number;
  return number === undefined ? t('datasets.version.title') : t('datasets.version.titleNumber', { number });
}
