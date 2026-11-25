import { useState } from 'react';
import { Alert, Badge, Button, Card, CloseButton, Dialog, Heading, Portal, Table, Text } from '@chakra-ui/react';
import { Check, Minus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { type ApiKey, useApiKeys, useRevokeApiKey, useWorkspaceProjects } from '@/modules/workspaces/api';
import { CreateKeyDialog } from '@/modules/workspaces/components/CreateKeyDialog';

/** The workspace's API keys: who they work in, when they were used, and revoke. Shown to the workspace's admins and owners. */
export function ApiKeysCard({ workspaceId }: { workspaceId: string }) {
  const { t, i18n } = useTranslation();
  const keys = useApiKeys(workspaceId);
  const projects = useWorkspaceProjects(workspaceId, true);
  const names = new Map((projects.data ?? []).map((p) => [p.id, p.name]));
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  const when = (iso: string | null | undefined) => (iso ? date.format(new Date(iso)) : t('apiKeys.never'));

  return (
    <Card.Root data-testid="keys-card">
      <Card.Header>
        <Heading as="h2" textStyle="h2">
          {t('apiKeys.title')}
        </Heading>
        <Text color="fg.muted">{t('apiKeys.subtitle')}</Text>
      </Card.Header>
      <Card.Body gap="4">
        <CreateKeyDialog workspaceId={workspaceId} />
        {keys.isError ? (
          <Alert.Root status="error" colorPalette="danger">
            <Alert.Indicator />
            <Alert.Description>{t(errorKey(keys.error))}</Alert.Description>
          </Alert.Root>
        ) : keys.data?.length === 0 ? (
          <Text color="fg.muted" data-testid="keys-empty">
            {t('apiKeys.empty')}
          </Text>
        ) : (
          <Table.Root size="sm" data-testid="keys-table">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t('apiKeys.col.name')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('apiKeys.col.projects')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('apiKeys.col.lastUsed')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('apiKeys.col.status')}</Table.ColumnHeader>
                <Table.ColumnHeader />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(keys.data ?? []).map((key) => (
                <KeyRow key={key.id} keyItem={key} workspaceId={workspaceId} names={names} when={when} />
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Card.Body>
    </Card.Root>
  );
}

function KeyRow({
  keyItem,
  workspaceId,
  names,
  when,
}: {
  keyItem: ApiKey;
  workspaceId: string;
  names: Map<string, string>;
  when: (iso: string | null | undefined) => string;
}) {
  const { t } = useTranslation();
  const revoked = keyItem.revoked_at !== null;
  const projectNames = keyItem.project_ids.map((id) => names.get(id) ?? t('apiKeys.unknownProject'));
  return (
    <Table.Row data-testid="keys-row" data-key-id={keyItem.id} data-key-status={revoked ? 'revoked' : 'active'}>
      <Table.Cell>
        <Text fontWeight="medium">{keyItem.name}</Text>
        <Text color="fg.muted" fontFamily="mono" textStyle="sm">
          {keyItem.prefix}…
        </Text>
      </Table.Cell>
      <Table.Cell>{projectNames.join(', ')}</Table.Cell>
      <Table.Cell>{when(keyItem.last_used_at)}</Table.Cell>
      <Table.Cell>
        {revoked ? (
          <Badge variant="outline" colorPalette="gray">
            <Minus />
            {t('apiKeys.status.revoked')}
          </Badge>
        ) : (
          <Badge variant="subtle" colorPalette="success">
            <Check />
            {t('apiKeys.status.active')}
          </Badge>
        )}
      </Table.Cell>
      <Table.Cell textAlign="end">{!revoked && <RevokeButton keyItem={keyItem} workspaceId={workspaceId} />}</Table.Cell>
    </Table.Row>
  );
}

/** Revoke is final and cuts off apps at their next call, so it asks first. */
function RevokeButton({ keyItem, workspaceId }: { keyItem: ApiKey; workspaceId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const revoke = useRevokeApiKey(workspaceId);
  const hide = revoke.error instanceof ApiError && revoke.error.status === 401;
  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(e) => {
        setOpen(e.open);
        if (!e.open) revoke.reset();
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="outline" colorPalette="danger" size="xs" data-testid="keys-revoke-open">
          {t('apiKeys.revoke')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('apiKeys.revokeTitle', { name: keyItem.name })}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>{t('apiKeys.revokeBody')}</Text>
              {revoke.isError && !hide && (
                <Alert.Root status="error" colorPalette="danger" mt="4">
                  <Alert.Indicator />
                  <Alert.Description>{t(errorKey(revoke.error))}</Alert.Description>
                </Alert.Root>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button>{t('workspace.cancel')}</Button>
              </Dialog.ActionTrigger>
              <Button
                variant="solid"
                colorPalette="danger"
                loading={revoke.isPending}
                data-testid="keys-revoke-confirm"
                onClick={() => revoke.mutate(keyItem.id, { onSuccess: () => setOpen(false) })}
              >
                {t('apiKeys.revokeConfirm')}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={t('members.close')} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
