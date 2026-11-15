import { useState } from 'react';
import { Button, Center, Dialog, HStack, Portal } from '@chakra-ui/react';
import { useNavigate } from '@tanstack/react-router';
import { Pause, Play, Trash, WarningDiamond } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { useWorkspace } from '@/modules/workspaces';
import { useDeleteDeployment, useMoveDeployment, type Deployment } from '@/modules/deployments/api';
import { deploymentErrorKey } from '@/modules/deployments/errors';
import { statusUi } from '@/modules/deployments/status';

/** Stop or start the endpoint (the key stays valid either way), and delete it behind a confirm. */
export function DeploymentActions({ deployment }: { deployment: Deployment }) {
  const { t } = useTranslation();
  const { id: workspaceId } = useWorkspace();
  const move = useMoveDeployment(workspaceId, deployment.project_id, deployment.id);
  const ui = statusUi(deployment.status);
  const to = ui.stop ? 'stop' : ui.start ? 'start' : null;
  const run = (step: 'stop' | 'start') =>
    move.mutate(step, {
      onError: (e) => toaster.create({ type: 'error', title: t(`deployments.toast.${step}Failed`), description: t(deploymentErrorKey(e)) }),
    });

  return (
    <HStack gap="2" flexShrink={0}>
      {to && (
        <Button size="sm" loading={move.isPending} onClick={() => run(to)} data-testid={`deployment-${to}`}>
          {to === 'stop' ? <Pause /> : <Play />}
          {t(`deployments.detail.${to}`)}
        </Button>
      )}
      <DeleteDialog deployment={deployment} />
    </HStack>
  );
}

function DeleteDialog({ deployment }: { deployment: Deployment }) {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const navigate = useNavigate();
  const remove = useDeleteDeployment(workspaceId, deployment.project_id, deployment.id);
  const [open, setOpen] = useState(false);
  // mutateAsync: the list replaces this page, and a per-call onSuccess would not run once it unmounts.
  const confirm = async () => {
    try {
      await remove.mutateAsync();
      setOpen(false);
      toaster.create({ type: 'success', title: t('deployments.toast.deleted') });
      await navigate({ to: '/w/$slug/projects/$projectId/deployments', params: { slug, projectId: deployment.project_id } });
    } catch (e) {
      setOpen(false);
      toaster.create({ type: 'error', title: t('deployments.toast.deleteFailed'), description: t(deploymentErrorKey(e)) });
    }
  };

  return (
    <Dialog.Root role="alertdialog" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="solid" colorPalette="danger" data-testid="deployment-delete">
          <Trash />
          {t('deployments.detail.delete.open')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-testid="deployment-delete-dialog">
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
                  {t('deployments.detail.delete.title')}
                </HStack>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>{t('deployments.detail.delete.description')}</Dialog.Description>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button size="sm">{t('deployments.detail.delete.keep')}</Button>
              </Dialog.ActionTrigger>
              <Button
                size="sm"
                variant="solid"
                colorPalette="danger"
                loading={remove.isPending}
                onClick={() => void confirm()}
                data-testid="deployment-delete-confirm"
              >
                {t('deployments.detail.delete.confirm')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
