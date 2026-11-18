import { Alert, Box, Button, EmptyState, Heading, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Trash } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { useRestoreTrashedDataset, useTrashedDatasets } from '@/modules/datasets';
import { useRestoreProject, useTrashedProjects } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { errorKey } from '@/shared/api/errors';

/** Deleted projects and datasets, each with the date it can be restored until. Archived projects are not here: archive only hides. */
export function TrashPage() {
  const { t, i18n } = useTranslation();
  const { id } = useWorkspace();
  const projects = useTrashedProjects(id);
  const datasets = useTrashedDatasets(id);
  const restoreProject = useRestoreProject(id);
  const restoreDataset = useRestoreTrashedDataset();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' });
  const until = (iso: string) => t('trash.until', { date: date.format(new Date(iso)) });
  const done = (name: string) => toaster.create({ type: 'success', title: t('trash.restored', { name }) });
  const fail = (e: unknown) => toaster.create({ type: 'error', title: t('trash.restoreFailed'), description: t(errorKey(e)) });

  const error = projects.error ?? datasets.error;
  if (error)
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="trash-error">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('trash.loadFailed')}</Alert.Title>
          <Alert.Description>{t(errorKey(error))}</Alert.Description>
          <Box>
            <Button
              size="sm"
              onClick={() => {
                void projects.refetch();
                void datasets.refetch();
              }}
            >
              {t('trash.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );

  const loading = projects.isPending || datasets.isPending;
  const empty = !loading && !projects.projects?.length && !datasets.datasets?.length;

  return (
    <Stack gap="6">
      <Box>
        <Heading as="h1" textStyle="h1">
          {t('trash.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('trash.subtitle')}
        </Text>
      </Box>
      {loading && <Skeleton h="40" />}
      {empty && (
        <EmptyState.Root borderWidth="2px" borderColor="border" borderRadius="l3" data-testid="trash-empty">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Trash />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('trash.empty.title')}</EmptyState.Title>
            <EmptyState.Description>{t('trash.empty.body')}</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      )}
      {!!projects.projects?.length && (
        <Stack gap="3">
          <Heading as="h2" textStyle="h3">
            {t('trash.projects')}
          </Heading>
          <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
            <Table.Root variant="data">
              <Table.Body>
                {projects.projects.map((p) => (
                  <Table.Row key={p.id} data-testid="trash-project-row">
                    <Table.Cell fontWeight="medium">{p.name}</Table.Cell>
                    <Table.Cell color="fg.muted">{until(p.restorable_until)}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Button
                        size="xs"
                        loading={restoreProject.isPending && restoreProject.variables === p.id}
                        data-testid="trash-restore-project"
                        onClick={() => restoreProject.mutateAsync(p.id).then(() => done(p.name), fail)}
                      >
                        {t('trash.restore')}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Stack>
      )}
      {!!datasets.datasets?.length && (
        <Stack gap="3">
          <Heading as="h2" textStyle="h3">
            {t('trash.datasets')}
          </Heading>
          <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
            <Table.Root variant="data">
              <Table.Body>
                {datasets.datasets.map((d) => (
                  <Table.Row key={d.id} data-testid="trash-dataset-row">
                    <Table.Cell>
                      <Text fontWeight="medium">{d.name}</Text>
                      <Text textStyle="body-sm" color="fg.muted">
                        {t('trash.inProject', { name: d.project_name })}
                      </Text>
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{until(d.restorable_until)}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Button
                        size="xs"
                        loading={restoreDataset.isPending && restoreDataset.variables?.datasetId === d.id}
                        data-testid="trash-restore-dataset"
                        onClick={() =>
                          restoreDataset.mutateAsync({ projectId: d.project_id, datasetId: d.id }).then(() => done(d.name), fail)
                        }
                      >
                        {t('trash.restore')}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Stack>
      )}
    </Stack>
  );
}
