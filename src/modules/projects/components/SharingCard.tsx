import { useState } from 'react';
import { Button, Card, Center, Dialog, HStack, Portal, RadioGroup, Stack, Text } from '@chakra-ui/react';
import { WarningDiamond } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { SHARING_LEVELS, SHARING_PRIVATE, useSetProjectSharing, type ProjectDetail, type Sharing } from '@/modules/projects/api';
import { useWorkspace } from '@/modules/workspaces';
import { errorKey } from '@/shared/api/errors';

/**
 * The project's one Sharing choice: private, in the gallery, or in the gallery with downloads. Going back to private asks first,
 * because it takes the project out of the gallery in one step. A model or dataset version can still be left out one by one.
 */
export function SharingCard({ project }: { project: ProjectDetail }) {
  const { t } = useTranslation();
  const workspace = useWorkspace();
  const setSharing = useSetProjectSharing(workspace.id);
  const [confirming, setConfirming] = useState(false);

  const apply = (sharing: Sharing) =>
    setSharing.mutate(
      { projectId: project.id, sharing },
      {
        onSuccess: () => toaster.create({ type: 'success', title: t(`projects.sharing.toast.${sharing}`) }),
        onError: (e) => toaster.create({ type: 'error', title: t('projects.sharing.toast.failed'), description: t(errorKey(e)) }),
        onSettled: () => setConfirming(false),
      },
    );
  const choose = (sharing: Sharing) => (sharing === SHARING_PRIVATE ? setConfirming(true) : apply(sharing));

  return (
    <Card.Root variant="outline" data-testid="project-sharing" data-sharing={project.sharing}>
      <Card.Header>
        <Card.Title as="h2" textStyle="body" fontWeight="semibold">
          {t('projects.sharing.title')}
        </Card.Title>
      </Card.Header>
      <Card.Body gap="4">
        <RadioGroup.Root
          value={project.sharing}
          disabled={setSharing.isPending}
          onValueChange={(e) => e.value && e.value !== project.sharing && choose(e.value as Sharing)}
        >
          <Stack gap="4">
            {SHARING_LEVELS.map((level) => (
              <RadioGroup.Item key={level} value={level} alignItems="flex-start" data-testid={`sharing-${level}`}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <Stack gap="0.5">
                  <RadioGroup.ItemText fontWeight="medium">{t(`projects.sharing.level.${level}.label`)}</RadioGroup.ItemText>
                  <Text textStyle="body-sm" color="fg.muted">
                    {t(`projects.sharing.level.${level}.help`)}
                  </Text>
                </Stack>
              </RadioGroup.Item>
            ))}
          </Stack>
        </RadioGroup.Root>
        <Text textStyle="body-sm" color="fg.muted">
          {t('projects.sharing.exclude')}
        </Text>
      </Card.Body>
      <Dialog.Root role="alertdialog" open={confirming} onOpenChange={(e) => setConfirming(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content data-testid="sharing-private-dialog">
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
                    {t('projects.sharing.confirm.title')}
                  </HStack>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Dialog.Description>{t('projects.sharing.confirm.description')}</Dialog.Description>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button size="sm" data-testid="sharing-private-keep">
                    {t('projects.sharing.confirm.keep')}
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  size="sm"
                  variant="solid"
                  colorPalette="danger"
                  loading={setSharing.isPending}
                  onClick={() => apply(SHARING_PRIVATE)}
                  data-testid="sharing-private-confirm"
                >
                  {t('projects.sharing.confirm.confirm')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Card.Root>
  );
}
