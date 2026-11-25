import { Alert, Box, Button, EmptyState, Heading, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Trash } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { useRestoreProject, useTrashedProjects } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { errorKey } from '@/shared/api/errors';

/** Deleted projects, each with the date it can be restored until. Archived projects are not here: archive only hides. */
export function TrashPage() {
  const { t, i18n } = useTranslation();
  const { id } = useWorkspace();
  const projects = useTrashedProjects(id);
  const restoreProject = useRestoreProject(id);
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' });
  const until = (iso: string) => t('trash.until', { date: date.format(new Date(iso)) });
  const done = (name: string) => toaster.create({ type: 'success', title: t('trash.restored', { name }) });
  const fail = (e: unknown) => toaster.create({ type: 'error', title: t('trash.restoreFailed'), description: t(errorKey(e)) });

  if (projects.error)
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="trash-error">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('trash.loadFailed')}</Alert.Title>
          <Alert.Description>{t(errorKey(projects.error))}</Alert.Description>
          <Box>
            <Button size="sm" onClick={() => void projects.refetch()}>
              {t('trash.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );

  const loading = projects.isPending;
  const empty = !loading && !projects.projects?.length;

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
    </Stack>
  );
}
