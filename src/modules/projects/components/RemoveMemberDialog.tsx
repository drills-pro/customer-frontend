import { useState } from 'react';
import { Alert, Box, Button, CloseButton, Dialog, Portal, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SimpleSelect } from '@/components/simple-select';
import { toaster } from '@/components/toaster';
import { useRemoveProjectMember, useSetProjectMemberRoles, type ProjectRole } from '@/modules/projects/api';
import { ADMIN_ROLE } from '@/modules/projects/constants';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';

/** core-api's problem `code` for removing or demoting a project's only admin. */
const LAST_PROJECT_ADMIN = 'last_project_admin';

export interface Person {
  sub: string;
  name: string;
  roles: ProjectRole[];
}

/**
 * Remove someone from the project. When they are the last project admin the API refuses: this dialog then says why and offers the fix in place,
 * a picker for who becomes admin first, and removes them straight after.
 */
export function RemoveMemberDialog({
  workspaceId,
  projectId,
  target,
  candidates,
  onClose,
}: {
  workspaceId: string;
  projectId: string;
  target: Person | null;
  /** Everyone who could be made admin; the target is filtered out here. */
  candidates: Person[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useRemoveProjectMember(workspaceId, projectId);
  const setRoles = useSetProjectMemberRoles(workspaceId, projectId);
  const [pick, setPick] = useState('');
  const blocked = remove.error instanceof ApiError && remove.error.code === LAST_PROJECT_ADMIN;
  const others = candidates.filter((c) => c.sub !== target?.sub);
  const chosen = others.find((c) => c.sub === pick) ?? others[0];
  const close = () => {
    remove.reset();
    setPick('');
    onClose();
  };
  const done = (name: string) => {
    toaster.create({ type: 'success', title: t('projects.overview.team.removed', { name }) });
    close();
  };

  const run = async () => {
    if (!target) return;
    try {
      if (blocked && chosen)
        await setRoles.mutateAsync({ sub: chosen.sub, roles: [...new Set<ProjectRole>([...chosen.roles, ADMIN_ROLE])] });
      await remove.mutateAsync(target.sub);
      done(target.name);
    } catch {
      // shown below: the removal's own error, or the role change's
    }
  };
  const error = setRoles.error ?? (blocked ? null : remove.error);

  return (
    <Dialog.Root role="alertdialog" open={!!target} onOpenChange={(e) => !e.open && close()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('projects.overview.team.remove.title', { name: target?.name ?? '' })}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                <Text>{t('projects.overview.team.remove.body')}</Text>
                {blocked && (
                  <Alert.Root status="warning" colorPalette="warning" data-testid="last-admin-blocked">
                    <Alert.Indicator />
                    <Alert.Content gap="3">
                      <Alert.Description>{t('projects.overview.team.lastAdmin.rule', { name: target?.name ?? '' })}</Alert.Description>
                      {others.length ? (
                        <Box>
                          <SimpleSelect
                            label={t('projects.overview.team.lastAdmin.pick')}
                            items={others.map((c) => ({ label: c.name, value: c.sub }))}
                            value={chosen?.sub ?? ''}
                            onChange={setPick}
                          />
                        </Box>
                      ) : (
                        <Text>{t('projects.overview.team.lastAdmin.nobody')}</Text>
                      )}
                    </Alert.Content>
                  </Alert.Root>
                )}
                {error && (
                  <Alert.Root status="error" colorPalette="danger">
                    <Alert.Indicator />
                    <Alert.Description>{t(errorKey(error))}</Alert.Description>
                  </Alert.Root>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button>{t('projects.overview.team.remove.cancel')}</Button>
              </Dialog.ActionTrigger>
              <Button
                variant="solid"
                colorPalette="danger"
                loading={remove.isPending || setRoles.isPending}
                disabled={blocked && !chosen}
                data-testid="team-remove-confirm"
                onClick={() => void run()}
              >
                {blocked && chosen
                  ? t('projects.overview.team.lastAdmin.confirm', { admin: chosen.name, name: target?.name ?? '' })
                  : t('projects.overview.team.remove.confirm')}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={t('projects.overview.team.remove.close')} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
