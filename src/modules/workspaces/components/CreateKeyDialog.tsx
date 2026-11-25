import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Clipboard,
  CloseButton,
  Collapsible,
  Dialog,
  Field,
  IconButton,
  Input,
  InputGroup,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Key } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { useCreateApiKey, useWorkspaceProjects } from '@/modules/workspaces/api';

const NAME_MAX = 100;
/** The backend's problem code when a chosen project is no longer one of the workspace's active projects. */
const UNKNOWN_PROJECT = 'unknown_project';

/** Create a workspace key: name, the projects it works in, optional expiry. The same dialog then shows the secret once. */
export function CreateKeyDialog({ workspaceId }: { workspaceId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [expiry, setExpiry] = useState('');
  const projects = useWorkspaceProjects(workspaceId, open);
  const create = useCreateApiKey(workspaceId);
  const created = create.data;
  const active = (projects.data ?? []).filter((p) => p.status === 'active');
  const trimmed = name.trim();
  const hide = create.error instanceof ApiError && create.error.status === 401;
  const errorText =
    create.error instanceof ApiError && create.error.code === UNKNOWN_PROJECT ? 'apiKeys.error.unknownProject' : errorKey(create.error);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setName('');
      setProjectIds([]);
      setExpiry('');
      create.reset();
    }
  };
  const toggle = (id: string, on: boolean) => setProjectIds((ids) => (on ? [...ids, id] : ids.filter((x) => x !== id)));
  const submit = () =>
    create.mutate({
      name: trimmed,
      scopes: ['predict'],
      project_ids: projectIds,
      // The chosen day counts to its end, in the browser's time zone.
      expires_at: expiry ? new Date(`${expiry}T23:59:59`).toISOString() : null,
    });

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="solid" data-testid="keys-create-open">
          <Key />
          {t('apiKeys.create')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{created ? t('apiKeys.reveal.title') : t('apiKeys.form.title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {created ? (
                <Stack gap="4" data-testid="keys-revealed">
                  <Alert.Root status="warning" colorPalette="warning">
                    <Alert.Indicator />
                    <Alert.Description>{t('apiKeys.reveal.body')}</Alert.Description>
                  </Alert.Root>
                  <Clipboard.Root value={created.secret}>
                    <Clipboard.Label>{t('apiKeys.reveal.label')}</Clipboard.Label>
                    <InputGroup
                      endElement={
                        <Clipboard.Trigger asChild>
                          <IconButton variant="ghost" size="xs" aria-label={t('apiKeys.reveal.copy')}>
                            <Clipboard.Indicator />
                          </IconButton>
                        </Clipboard.Trigger>
                      }
                    >
                      <Clipboard.Input asChild>
                        <Input readOnly fontFamily="mono" data-testid="keys-secret" />
                      </Clipboard.Input>
                    </InputGroup>
                  </Clipboard.Root>
                </Stack>
              ) : (
                <Stack gap="5" data-testid="keys-form">
                  <Field.Root required>
                    <Field.Label>{t('apiKeys.form.name')}</Field.Label>
                    <Input
                      data-testid="keys-name"
                      value={name}
                      maxLength={NAME_MAX}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('apiKeys.form.namePlaceholder')}
                    />
                    <Field.HelperText>{t('apiKeys.form.nameHelp')}</Field.HelperText>
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{t('apiKeys.form.projects')}</Field.Label>
                    <Stack gap="2" data-testid="keys-projects">
                      {active.map((p) => (
                        <Checkbox.Root
                          key={p.id}
                          size="sm"
                          checked={projectIds.includes(p.id)}
                          onCheckedChange={(e) => toggle(p.id, e.checked === true)}
                          data-testid={`keys-project-${p.id}`}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>{p.name}</Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                    <Field.HelperText>{t('apiKeys.form.projectsHelp')}</Field.HelperText>
                  </Field.Root>
                  <Collapsible.Root>
                    <Collapsible.Trigger asChild>
                      <Button variant="ghost" size="sm" alignSelf="start" data-testid="keys-more">
                        {t('apiKeys.form.moreOptions')}
                      </Button>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <Field.Root pt="3">
                        <Field.Label>{t('apiKeys.form.expiry')}</Field.Label>
                        <Input type="date" data-testid="keys-expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                        <Field.HelperText>{t('apiKeys.form.expiryHelp')}</Field.HelperText>
                      </Field.Root>
                    </Collapsible.Content>
                  </Collapsible.Root>
                  {create.isError && !hide && (
                    <Alert.Root status="error" colorPalette="danger">
                      <Alert.Indicator />
                      <Alert.Description>{t(errorText)}</Alert.Description>
                    </Alert.Root>
                  )}
                  {!projects.isPending && active.length === 0 && (
                    <Text color="fg.muted" data-testid="keys-no-projects">
                      {t('apiKeys.form.noProjects')}
                    </Text>
                  )}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {created ? (
                <Dialog.ActionTrigger asChild>
                  <Button variant="solid" data-testid="keys-done">
                    {t('apiKeys.reveal.done')}
                  </Button>
                </Dialog.ActionTrigger>
              ) : (
                <>
                  <Dialog.ActionTrigger asChild>
                    <Button>{t('workspace.cancel')}</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    variant="solid"
                    loading={create.isPending}
                    disabled={!trimmed || projectIds.length === 0}
                    onClick={submit}
                    data-testid="keys-create"
                  >
                    {t('apiKeys.form.submit')}
                  </Button>
                </>
              )}
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
