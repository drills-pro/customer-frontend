import { Alert, Badge, Box, Button, Flex, Heading, HStack, Skeleton, Stack, Tabs, Text } from '@chakra-ui/react';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { ArrowLeft, Upload } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDataset, useWriteDenied } from '@/modules/datasets/api';
import { DatasetMenu } from '@/modules/datasets/components/DatasetMenu';
import { ImportsTab } from '@/modules/datasets/components/ImportsTab';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { VersionsTab } from '@/modules/datasets/components/VersionsTab';
import { canImport, RETENTION_DAYS } from '@/modules/datasets/constants';
import { taskLabel } from '@/modules/datasets/format';
import { DATASET_TABS } from '@/modules/datasets/tabs';
import { useWorkspace } from '@/modules/workspaces';
import { ApiError } from '@/shared/api/client';
import { NotFound } from '@/shared/ui/NotFound';

const DAY_MS = 24 * 60 * 60 * 1000;
const FROM = '/app/w/$slug/projects/$projectId/datasets/$datasetId';

/** One dataset: its versions and its imports, and the way to start a new import. */
export function DatasetPage() {
  const { t, i18n } = useTranslation();
  const { slug } = useWorkspace();
  const { projectId, datasetId } = useParams({ from: FROM });
  const { tab = DATASET_TABS.versions } = useSearch({ from: FROM });
  const navigate = useNavigate();
  const denied = useWriteDenied(projectId);
  const { data: dataset, error, isError, isPending, refetch } = useDataset(projectId, datasetId);
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  const when = (iso: string) => date.format(new Date(iso));

  if (isError) {
    if (error instanceof ApiError && error.status === 404) return <NotFound />;
    return <LoadError title={t('datasets.loadOneFailed')} error={error} onRetry={() => void refetch()} />;
  }
  if (isPending) return <Skeleton h="48" />;

  const deleted = dataset.deleted_at !== null;
  const importable = canImport(dataset.task_type);
  const blocked = importable ? null : dataset.task_type === null ? 'datasets.import.noTask' : 'datasets.import.unsupportedTask';
  const importsDisabled = deleted || denied || !importable;
  const restorableUntil = dataset.deleted_at ? date.format(new Date(new Date(dataset.deleted_at).getTime() + RETENTION_DAYS * DAY_MS)) : '';

  return (
    <Stack gap="6">
      <Box>
        <Button asChild variant="ghost" size="sm" mb="2">
          <Link to="/w/$slug/projects/$projectId/datasets" params={{ slug, projectId }}>
            <ArrowLeft />
            {t('datasets.backToDatasets')}
          </Link>
        </Button>
        <Flex align="end" justify="space-between" gap="4" wrap="wrap">
          <Box minW="0">
            <Heading as="h2" textStyle="h2" truncate data-testid="dataset-name">
              {dataset.name}
            </Heading>
            <HStack mt="1" gap="3" wrap="wrap" color="fg.muted">
              <Text>{dataset.task_type ? taskLabel(t, dataset.task_type) : t('datasets.noTask')}</Text>
              {deleted && (
                <Badge colorPalette="danger" variant="subtle">
                  {t('datasets.deleted')}
                </Badge>
              )}
            </HStack>
          </Box>
          <HStack gap="2">
            {importsDisabled ? (
              <Button variant="solid" disabled data-testid="dataset-new-import">
                <Upload />
                {t('datasets.import.new')}
              </Button>
            ) : (
              <Button asChild variant="solid">
                <Link
                  to="/w/$slug/projects/$projectId/datasets/$datasetId/imports/new"
                  params={{ slug, projectId, datasetId }}
                  data-testid="dataset-new-import"
                >
                  <Upload />
                  {t('datasets.import.new')}
                </Link>
              </Button>
            )}
            <DatasetMenu projectId={projectId} dataset={dataset} disabled={denied} />
          </HStack>
        </Flex>
      </Box>
      {deleted && (
        <Alert.Root status="warning" colorPalette="warning" data-testid="dataset-deleted">
          <Alert.Indicator />
          <Alert.Description>{t('datasets.deletedNotice', { date: restorableUntil })}</Alert.Description>
        </Alert.Root>
      )}
      {blocked && !deleted && (
        <Alert.Root status="info" colorPalette="info" data-testid="dataset-import-blocked">
          <Alert.Indicator />
          <Alert.Description>{t(blocked)}</Alert.Description>
        </Alert.Root>
      )}
      {denied && (
        <Text color="fg.muted" data-testid="datasets-read-only">
          {t('datasets.readOnly')}
        </Text>
      )}
      {!deleted && (
        <Tabs.Root
          value={tab}
          onValueChange={(e) =>
            void navigate({
              to: '.',
              search: { tab: e.value === DATASET_TABS.imports ? DATASET_TABS.imports : DATASET_TABS.versions },
              replace: true,
            })
          }
        >
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value={DATASET_TABS.versions} data-testid="dataset-tab-versions">
              {t('datasets.tab.versions')}
            </Tabs.Trigger>
            <Tabs.Trigger value={DATASET_TABS.imports} data-testid="dataset-tab-imports">
              {t('datasets.tab.imports')}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value={DATASET_TABS.versions}>
            <VersionsTab projectId={projectId} slug={slug} dataset={dataset} denied={denied} when={when} />
          </Tabs.Content>
          <Tabs.Content value={DATASET_TABS.imports}>
            <ImportsTab projectId={projectId} slug={slug} datasetId={datasetId} when={when} />
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Stack>
  );
}
