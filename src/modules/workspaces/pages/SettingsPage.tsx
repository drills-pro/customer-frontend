import { useState } from 'react';
import { Alert, Button, Card, CloseButton, Dialog, Field, Heading, Input, Portal, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { useDeleteWorkspace, useRenameWorkspace, useWorkspaceDetail } from '@/modules/workspaces/api';
import { toaster } from '@/components/toaster';
import { useCan, useWorkspace } from '@/modules/workspaces/context';

const NAME_MAX = 100;

function General({ id, name, slug }: { id: string; name: string; slug: string }) {
  const { t } = useTranslation();
  const canEdit = useCan('tenant.admin');
  const [value, setValue] = useState(name);
  const rename = useRenameWorkspace(id);
  const trimmed = value.trim();
  const hide = rename.error instanceof ApiError && rename.error.status === 401;
  return (
    <Card.Root>
      <Card.Header>
        <Heading as="h2" textStyle="h2">
          {t('settings.general')}
        </Heading>
      </Card.Header>
      <Card.Body>
        <Stack
          as="form"
          gap="5"
          maxW="md"
          onSubmit={(e) => {
            e.preventDefault();
            rename.mutate(trimmed, { onSuccess: () => toaster.create({ type: 'success', title: t('settings.renamed') }) });
          }}
        >
          <Field.Root required disabled={!canEdit}>
            <Field.Label>{t('workspace.details.name')}</Field.Label>
            <Input data-testid="settings-name" value={value} maxLength={NAME_MAX} onChange={(e) => setValue(e.target.value)} />
          </Field.Root>
          <Field.Root disabled>
            <Field.Label>{t('workspace.details.slug')}</Field.Label>
            <Input value={slug} readOnly fontFamily="mono" />
            <Field.HelperText>{t('settings.slugFixed')}</Field.HelperText>
          </Field.Root>
          {rename.isError && !hide && (
            <Alert.Root status="error" colorPalette="danger">
              <Alert.Indicator />
              <Alert.Description>{t(errorKey(rename.error))}</Alert.Description>
            </Alert.Root>
          )}
          {canEdit && (
            <Button
              type="submit"
              variant="solid"
              alignSelf="start"
              loading={rename.isPending}
              disabled={!trimmed || trimmed === name}
              data-testid="settings-save"
            >
              {t('settings.save')}
            </Button>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

function DangerZone({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const del = useDeleteWorkspace(id);
  const hide = del.error instanceof ApiError && del.error.status === 401;
  return (
    <Card.Root borderColor="border.error" data-testid="settings-danger">
      <Card.Header>
        <Heading as="h2" textStyle="h2" color="fg.error">
          {t('settings.danger.title')}
        </Heading>
      </Card.Header>
      <Card.Body gap="4">
        <Text color="fg.muted">{t('settings.danger.body')}</Text>
        <Dialog.Root
          role="alertdialog"
          open={open}
          onOpenChange={(e) => {
            setOpen(e.open);
            if (!e.open) {
              setTyped('');
              del.reset();
            }
          }}
        >
          <Dialog.Trigger asChild>
            <Button variant="outline" colorPalette="danger" alignSelf="start" data-testid="settings-delete-open">
              {t('settings.danger.open')}
            </Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>{t('settings.danger.confirmTitle', { name })}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap="4">
                    <Text>{t('settings.danger.confirmBody')}</Text>
                    <Field.Root>
                      <Field.Label>{t('settings.danger.typeName', { name })}</Field.Label>
                      <Input
                        data-testid="settings-delete-name"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        autoComplete="off"
                      />
                    </Field.Root>
                    {del.isError && !hide && (
                      <Alert.Root status="error" colorPalette="danger">
                        <Alert.Indicator />
                        <Alert.Description>
                          {t(del.error instanceof ApiError && del.error.status === 422 ? 'settings.danger.mismatch' : errorKey(del.error))}
                        </Alert.Description>
                      </Alert.Root>
                    )}
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button>{t('workspace.cancel')}</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    variant="solid"
                    colorPalette="danger"
                    loading={del.isPending}
                    disabled={typed !== name}
                    data-testid="settings-delete-confirm"
                    onClick={() =>
                      // mutateAsync: the layout swaps to the restore screen once /v1/me refreshes, which unmounts this page before a per-call onSuccess could run
                      void del.mutateAsync(typed).then(
                        () => navigate({ to: '/', replace: true }),
                        () => undefined, // shown by del.isError
                      )
                    }
                  >
                    {t('settings.danger.confirm')}
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" aria-label={t('members.close')} />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Card.Body>
    </Card.Root>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { id } = useWorkspace();
  const w = useWorkspaceDetail(id);
  const canDelete = useCan('tenant.delete');
  return (
    <Stack gap="6">
      <Heading as="h1" textStyle="h1">
        {t('shell.settings')}
      </Heading>
      <General id={id} name={w.name} slug={w.slug} />
      {canDelete && <DangerZone id={id} name={w.name} />}
    </Stack>
  );
}
