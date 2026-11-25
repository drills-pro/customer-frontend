import { Alert, Box, Button, EmptyState, Flex, Heading, HStack, Skeleton, Stack, Tabs, Text } from '@chakra-ui/react';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { Database, Upload } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useProjectDataset, useWriteDenied } from '@/modules/datasets/api';
import { ImportsTab } from '@/modules/datasets/components/ImportsTab';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { VersionsTab } from '@/modules/datasets/components/VersionsTab';
import { canImport } from '@/modules/datasets/constants';
import { taskLabel } from '@/modules/datasets/format';
import { DATASET_TABS } from '@/modules/datasets/tabs';
import { useProjectDetail } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';

const FROM = '/app/w/$slug/projects/$projectId/datasets/';

/** The project's dataset: its versions and its imports, and the way to add data to it. */
export function DatasetPage() {
  const { t, i18n } = useTranslation();
  const { slug, id: workspaceId } = useWorkspace();
  const { projectId } = useParams({ from: FROM });
  const { tab = DATASET_TABS.versions } = useSearch({ from: FROM });
  const navigate = useNavigate();
  const denied = useWriteDenied(projectId);
  const project = useProjectDetail(workspaceId, projectId);
  const { dataset, isPending, isError, error, refetch } = useProjectDataset(projectId);
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  const when = (iso: string) => date.format(new Date(iso));

  const task = project.task_type;
  const importable = canImport(task);
  const blocked = importable ? null : task === null ? 'datasets.import.noTask' : 'datasets.import.unsupportedTask';
  const importsDisabled = denied || !importable;
  // The header holds the screen's primary action; the empty state repeats it as a secondary one.
  const newImport = (testId: string, variant: 'solid' | 'outline') => (
    <Button asChild variant={variant}>
      <Link to="/w/$slug/projects/$projectId/datasets/imports/new" params={{ slug, projectId }} data-testid={testId}>
        <Upload />
        {t('datasets.import.new')}
      </Link>
    </Button>
  );

  const heading = (
    <Box minW="0">
      <Heading as="h2" textStyle="h2">
        {t('datasets.title')}
      </Heading>
      <Text mt="1" color="fg.muted">
        {task ? taskLabel(t, task) : t('datasets.noTask')}
      </Text>
    </Box>
  );

  if (isError) return <LoadError title={t('datasets.loadFailed')} error={error} onRetry={() => void refetch()} />;
  if (isPending) return <Skeleton h="48" />;

  if (!dataset)
    return (
      <Stack gap="6">
        {heading}
        {blocked && (
          <Alert.Root status="info" colorPalette="info" data-testid="dataset-import-blocked">
            <Alert.Indicator />
            <Alert.Description>{t(blocked)}</Alert.Description>
          </Alert.Root>
        )}
        <EmptyState.Root borderWidth="2px" borderStyle="dashed" borderColor="border.emphasized" borderRadius="l3">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Database />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('datasets.empty.title')}</EmptyState.Title>
            <EmptyState.Description>{t('datasets.empty.body')}</EmptyState.Description>
            {!importsDisabled && newImport('datasets-import-empty', 'outline')}
          </EmptyState.Content>
        </EmptyState.Root>
      </Stack>
    );

  return (
    <Stack gap="6">
      <Flex align="end" justify="space-between" gap="4" wrap="wrap">
        {heading}
        <HStack gap="2">
          {importsDisabled ? (
            <Button variant="solid" disabled data-testid="dataset-new-import">
              <Upload />
              {t('datasets.import.new')}
            </Button>
          ) : (
            newImport('dataset-new-import', 'solid')
          )}
        </HStack>
      </Flex>
      {blocked && (
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
      <Tabs.Root
        variant="subtle"
        size="sm"
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
          <VersionsTab
            projectId={projectId}
            slug={slug}
            dataset={dataset}
            denied={denied}
            when={when}
            emptyAction={importsDisabled ? undefined : newImport('dataset-versions-empty-import', 'outline')}
          />
        </Tabs.Content>
        <Tabs.Content value={DATASET_TABS.imports}>
          <ImportsTab projectId={projectId} slug={slug} datasetId={dataset.id} when={when} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
