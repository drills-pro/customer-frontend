import { useState } from 'react';
import { Button, CloseButton, Dialog, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { MoreVertical, Trash, Undo } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { useDeleteDataset, useRestoreDataset, type DatasetSummary } from '@/modules/datasets/api';
import { datasetErrorKey } from '@/modules/datasets/errors';

/** Move to the Trash (after a confirmation, with an Undo toast for the restore window) or restore. `disabled` is the write-denied state. */
export function DatasetMenu({ projectId, dataset, disabled }: { projectId: string; dataset: DatasetSummary; disabled?: boolean }) {
  const { t, i18n } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteDataset(projectId);
  const restore = useRestoreDataset(projectId);
  const deleted = dataset.deleted_at !== null;
  const fail = (title: string) => (e: unknown) => toaster.create({ type: 'error', title, description: t(datasetErrorKey(e)) });

  // mutateAsync, not mutate: the row leaves the list once the refetch lands, and a per-call callback would not run after that.
  const doRestore = async () => {
    try {
      await restore.mutateAsync({ datasetId: dataset.id });
      toaster.create({ type: 'success', title: t('datasets.toast.restored', { name: dataset.name }) });
    } catch (e) {
      fail(t('datasets.toast.restoreFailed'))(e);
    }
  };
  const doDelete = async () => {
    try {
      const result = await del.mutateAsync({ datasetId: dataset.id });
      setConfirming(false);
      const until = result.restorable_until
        ? new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(new Date(result.restorable_until))
        : '';
      toaster.create({
        type: 'success',
        title: t('datasets.toast.deleted', { name: dataset.name, date: until }),
        action: { label: t('datasets.undo'), onClick: () => void doRestore() },
      });
    } catch (e) {
      fail(t('datasets.toast.deleteFailed'))(e);
    }
  };

  return (
    <>
      <Menu.Root positioning={{ placement: 'bottom-end' }}>
        <Menu.Trigger asChild>
          <IconButton
            variant="ghost"
            size="xs"
            color="fg.muted"
            aria-label={t('datasets.actions', { name: dataset.name })}
            data-testid="dataset-menu"
          >
            <MoreVertical />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              {deleted ? (
                <Menu.Item
                  value="restore"
                  disabled={disabled || restore.isPending}
                  onSelect={() => void doRestore()}
                  data-testid="dataset-restore"
                >
                  <Undo />
                  {t('datasets.restore')}
                </Menu.Item>
              ) : (
                <Menu.Item value="delete" disabled={disabled} onSelect={() => setConfirming(true)} data-testid="dataset-delete">
                  <Trash />
                  {t('datasets.delete.action')}
                </Menu.Item>
              )}
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
                <Dialog.Title>{t('datasets.delete.title', { name: dataset.name })}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>{t('datasets.delete.body')}</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button>{t('datasets.cancel')}</Button>
                </Dialog.ActionTrigger>
                <Button
                  variant="solid"
                  colorPalette="danger"
                  loading={del.isPending}
                  onClick={() => void doDelete()}
                  data-testid="dataset-delete-confirm"
                >
                  {t('datasets.delete.confirm')}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" aria-label={t('datasets.close')} />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
