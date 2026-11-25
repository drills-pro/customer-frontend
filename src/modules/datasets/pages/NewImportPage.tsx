import type { ReactNode } from 'react';
import { Alert, Heading, Skeleton, Stack } from '@chakra-ui/react';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useProjectDataset, useVersions, useWriteDenied } from '@/modules/datasets/api';
import { ImportForm } from '@/modules/datasets/components/ImportForm';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { canImport } from '@/modules/datasets/constants';
import { useProjectDetail, type TaskType } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';

const FROM = '/app/w/$slug/projects/$projectId/datasets/imports/new';

/** Pick a source, fill in what it needs, then create the import, upload the file when there is one, and start it. The project's dataset
 * is made with the first import, so this page works before there is one. */
export function NewImportPage() {
  const { t } = useTranslation();
  const workspace = useWorkspace();
  const { projectId } = useParams({ from: FROM });
  const denied = useWriteDenied(projectId);
  const project = useProjectDetail(workspace.id, projectId);
  const { dataset, isPending, isError, error, refetch } = useProjectDataset(projectId);

  const shell = (body: ReactNode) => (
    <Stack gap="6">
      <Heading as="h2" textStyle="h2">
        {t('datasets.newImport.title')}
      </Heading>
      {body}
    </Stack>
  );

  if (isError) return shell(<LoadError title={t('datasets.loadFailed')} error={error} onRetry={() => void refetch()} />);
  if (isPending) return shell(<Skeleton h="48" />);

  const task = project.task_type;
  const blocked = denied
    ? 'datasets.readOnly'
    : task === null
      ? 'datasets.import.noTask'
      : !canImport(task)
        ? 'datasets.import.unsupportedTask'
        : null;
  if (blocked)
    return shell(
      <Alert.Root status="info" colorPalette="info" data-testid="import-blocked">
        <Alert.Indicator />
        <Alert.Description>{t(blocked)}</Alert.Description>
      </Alert.Root>,
    );

  const props = { projectId, projectName: project.name, slug: workspace.slug, task };
  return shell(
    dataset ? <ImportWithVersions {...props} datasetId={dataset.id} /> : <ImportForm {...props} datasetId={null} baseVersions={[]} />,
  );
}

/** The form for a project that has its dataset: it needs the versions to pick a base from. */
function ImportWithVersions({
  projectId,
  projectName,
  slug,
  task,
  datasetId,
}: {
  projectId: string;
  projectName: string;
  slug: string;
  task: TaskType;
  datasetId: string;
}) {
  const { t } = useTranslation();
  const versions = useVersions(projectId, datasetId);
  if (versions.isError)
    return <LoadError title={t('datasets.versions.loadFailed')} error={versions.error} onRetry={() => void versions.refetch()} />;
  if (versions.isPending || !versions.versions) return <Skeleton h="48" />;
  return (
    <ImportForm
      projectId={projectId}
      projectName={projectName}
      slug={slug}
      task={task}
      datasetId={datasetId}
      baseVersions={versions.versions}
    />
  );
}
