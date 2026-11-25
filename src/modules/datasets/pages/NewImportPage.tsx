import type { ReactNode } from 'react';
import { Alert, Heading, Skeleton, Stack } from '@chakra-ui/react';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useDataset, useVersions, useWriteDenied } from '@/modules/datasets/api';
import { ImportForm } from '@/modules/datasets/components/ImportForm';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { canImport } from '@/modules/datasets/constants';
import { useWorkspace } from '@/modules/workspaces';

const FROM = '/app/w/$slug/projects/$projectId/datasets/$datasetId/imports/new';

/** Pick a source, fill in what it needs, then create the import, upload the file when there is one, and start it. */
export function NewImportPage() {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const { projectId, datasetId } = useParams({ from: FROM });
  const denied = useWriteDenied(projectId);
  const dataset = useDataset(projectId, datasetId);
  const versions = useVersions(projectId, datasetId);

  const shell = (body: ReactNode) => (
    <Stack gap="6">
      <Heading as="h2" textStyle="h2">
        {t('datasets.newImport.title')}
      </Heading>
      {body}
    </Stack>
  );

  if (dataset.isError)
    return shell(<LoadError title={t('datasets.loadOneFailed')} error={dataset.error} onRetry={() => void dataset.refetch()} />);
  if (versions.isError)
    return shell(<LoadError title={t('datasets.versions.loadFailed')} error={versions.error} onRetry={() => void versions.refetch()} />);
  if (dataset.isPending || versions.isPending || !versions.versions) return shell(<Skeleton h="48" />);

  const { task_type: task } = dataset.data;
  const blocked = dataset.data.deleted_at
    ? 'datasets.import.deleted'
    : task === null
      ? 'datasets.import.noTask'
      : !canImport(task)
        ? 'datasets.import.unsupportedTask'
        : denied
          ? 'datasets.readOnly'
          : null;
  if (blocked || !canImport(task))
    return shell(
      <Alert.Root status="info" colorPalette="info" data-testid="import-blocked">
        <Alert.Indicator />
        <Alert.Description>{t(blocked ?? 'datasets.import.unsupportedTask')}</Alert.Description>
      </Alert.Root>,
    );

  return shell(<ImportForm projectId={projectId} datasetId={datasetId} slug={slug} task={task} baseVersions={versions.versions} />);
}
