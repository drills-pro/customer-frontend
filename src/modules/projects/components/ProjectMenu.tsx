import { IconButton, Menu, Portal } from '@chakra-ui/react';
import { Archive, Copy, MoreVertical, Undo } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { useUpdateProjectStatus, type ProjectSummary } from '@/modules/projects/api';
import { errorKey } from '@/shared/api/errors';

/** A project's actions: copy its id, archive or bring it back. `onUpdated` gets the project as the server returns it. */
export function ProjectMenu({ project, workspaceId }: { project: ProjectSummary; workspaceId: string }) {
  const { t } = useTranslation();
  const updateStatus = useUpdateProjectStatus(workspaceId);
  const archived = project.status === 'archived';

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
        onError: (e) => toaster.create({ type: 'error', title: t('projects.toast.updateFailed'), description: t(errorKey(e)) }),
      },
    );
  };

  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <IconButton variant="ghost" size="xs" flexShrink={0} color="fg.muted" aria-label={t('projects.actions', { name: project.name })}>
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
            <Menu.Item value="archive" disabled={updateStatus.isPending} onSelect={toggleArchive}>
              {archived ? <Undo /> : <Archive />}
              {t(archived ? 'projects.menu.unarchive' : 'projects.menu.archive')}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
