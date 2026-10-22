import { Button, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { useRestoreWorkspace } from '@/modules/workspaces/api';
import { useCan, useWorkspace } from '@/modules/workspaces/context';
import { StateScreen } from '@/shared/ui/StateScreen';

/** What a workspace in pending_delete shows: the API only accepts restore from here. */
export function RestorePage() {
  const { t } = useTranslation();
  const { id, name } = useWorkspace();
  const canRestore = useCan('tenant.delete');
  const restore = useRestoreWorkspace(id);
  const failed = restore.error && !(restore.error instanceof ApiError && restore.error.status === 401);
  return (
    <StateScreen
      pose="idle"
      label={t('restore.label')}
      title={t('restore.title', { name })}
      body={t(canRestore ? 'restore.body' : 'restore.bodyMember')}
      page
    >
      {canRestore && (
        <Button variant="solid" onClick={() => restore.mutate()} loading={restore.isPending} data-testid="restore-confirm">
          {t('restore.cta')}
        </Button>
      )}
      <Button asChild variant="outline">
        <Link to="/">{t('restore.other')}</Link>
      </Button>
      {failed && (
        <Text color="fg.error" role="alert">
          {t(errorKey(restore.error))}
        </Text>
      )}
    </StateScreen>
  );
}
