import { useState } from 'react';
import { Box, Button, CloseButton, Dialog, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { Archive, Copy, MoreVertical, Trash, Undo } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { useDeleteProject, useRestoreProject, useUpdateProjectStatus, type ProjectSummary } from '@/modules/projects/api';
import { errorKey } from '@/shared/api/errors';

/** A project's actions: copy its id, archive (hide) or bring it back, move it to the Trash (restorable until a date). */
export function ProjectMenu({ project, workspaceId }: { project: ProjectSummary; workspaceId: string }) {
  const { t, i18n } = useTranslation();
  const updateStatus = useUpdateProjectStatus(workspaceId);
  const del = useDeleteProject(workspaceId);
  const restore = useRestoreProject(workspaceId);
  const [confirming, setConfirming] = useState(false);
  const archived = project.status === 'archived';
  const fail = (title: string) => (e: unknown) => toaster.create({ type: 'error', title, description: t(errorKey(e)) });

  const copyId = () =>
    navigator.clipboard.writeText(project.id).then(
      () => toaster.create({ type: 'success', title: t('projects.toast.copied') }),
      () => toaster.create({ type: 'error', title: t('projects.toast.copyFailed') }),
    );

  const toggleArchive = () => {
    updateStatus.mutate(
      { projectId: project.id, status: archived ? 'active' : 'archived' },
      {
        onSuccess: () => {
          toaster.create({
            type: 'success',
            title: t(archived ? 'projects.toast.unarchived' : 'projects.toast.archived', { name: project.name }),
          });
        },
        onError: fail(t('projects.toast.updateFailed')),
      },
    );
  };

  // mutateAsync: the row leaves the list once the refetch lands, and a per-call callback would not run after that.
  const doRestore = async () => {
    try {
      await restore.mutateAsync(project.id);
      toaster.create({ type: 'success', title: t('projects.toast.restored', { name: project.name }) });
    } catch (e) {
      fail(t('projects.toast.restoreFailed'))(e);
    }
  };
  const doDelete = async () => {
    try {
      const deleted = await del.mutateAsync(project.id);
      setConfirming(false);
      const until = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(new Date(deleted.restorable_until));
      toaster.create({
        type: 'success',
        title: t('projects.toast.trashed', { name: project.name, date: until }),
        action: { label: t('projects.undo'), onClick: () => void doRestore() },
      });
    } catch (e) {
      fail(t('projects.toast.deleteFailed'))(e);
    }
  };

  return (
    <>
      <Menu.Root positioning={{ placement: 'bottom-end' }}>
        <Menu.Trigger asChild>
          <IconButton
            variant="ghost"
            size="xs"
            flexShrink={0}
            color="fg.muted"
            aria-label={t('projects.actions', { name: project.name })}
            data-testid="project-menu"
          >
            <MoreVertical />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="copy" onSelect={copyId}>
                <Copy />
                {t('projects.copyId')}
              </Menu.Item>
              <Menu.Item value="archive" disabled={updateStatus.isPending} onSelect={toggleArchive} data-testid="project-menu-archive">
                {archived ? <Undo /> : <Archive />}
                <Box>
                  <Text>{t(archived ? 'projects.menu.unarchive' : 'projects.menu.archive')}</Text>
                  <Text textStyle="body-sm" color="fg.muted">
                    {t(archived ? 'projects.menu.unarchiveHint' : 'projects.menu.archiveHint')}
                  </Text>
                </Box>
              </Menu.Item>
              <Menu.Item value="trash" onSelect={() => setConfirming(true)} data-testid="project-menu-trash">
                <Trash />
                <Box>
                  <Text>{t('projects.menu.trash')}</Text>
                  <Text textStyle="body-sm" color="fg.muted">
                    {t('projects.menu.trashHint')}
                  </Text>
                </Box>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <Dialog.Root role="alertdialog" open={confirming} onOpenChange={(e) => setConfirming(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{t('projects.delete.title', { name: project.name })}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>{t('projects.delete.body')}</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button>{t('projects.delete.cancel')}</Button>
                </Dialog.ActionTrigger>
                <Button
                  variant="solid"
                  colorPalette="danger"
                  loading={del.isPending}
                  onClick={() => void doDelete()}
                  data-testid="project-trash-confirm"
                >
                  {t('projects.delete.confirm')}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" aria-label={t('projects.delete.close')} />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
