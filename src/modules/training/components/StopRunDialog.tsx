import { useState } from 'react';
import { Button, Center, Dialog, HStack, Portal } from '@chakra-ui/react';
import { Stop, WarningDiamond } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { useWorkspace } from '@/modules/workspaces';
import { useCancelRun } from '@/modules/training/api';
import { trainingErrorKey } from '@/modules/training/errors';

/** Stop a queued or training run, after asking: a stopped run keeps its epochs so far but leaves no model. */
export function StopRunDialog({ projectId, runId }: { projectId: string; runId: string }) {
  const { t } = useTranslation();
  const { id: workspaceId } = useWorkspace();
  const cancel = useCancelRun(workspaceId, projectId);
  const [open, setOpen] = useState(false);
  const stop = () =>
    cancel.mutate(runId, {
      onSuccess: () => setOpen(false),
      onError: (e) => {
        setOpen(false);
        toaster.create({ type: 'error', title: t('training.toast.cancelFailed'), description: t(trainingErrorKey(e)) });
      },
    });

  return (
    <Dialog.Root role="alertdialog" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="solid" colorPalette="danger" loading={cancel.isPending} data-testid="training-run-cancel">
          <Stop />
          {t('training.run.stop.open')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-testid="training-stop-dialog">
            <Dialog.Header>
              <Dialog.Title>
                <HStack gap="3">
                  <Center
                    boxSize="9"
                    flexShrink={0}
                    borderRadius="l2"
                    colorPalette="danger"
                    bg="colorPalette.subtle"
                    color="colorPalette.fg"
                  >
                    <WarningDiamond width={18} height={18} />
                  </Center>
                  {t('training.run.stop.title')}
                </HStack>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>{t('training.run.stop.description')}</Dialog.Description>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button size="sm" data-testid="training-stop-keep">
                  {t('training.run.stop.keep')}
                </Button>
              </Dialog.ActionTrigger>
              <Button
                size="sm"
                variant="solid"
                colorPalette="danger"
                loading={cancel.isPending}
                onClick={stop}
                data-testid="training-stop-confirm"
              >
                {t('training.run.stop.confirm')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
