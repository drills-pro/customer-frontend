import { useState } from 'react';
import { Alert, Button, Clipboard, CloseButton, Dialog, Field, IconButton, Input, InputGroup, Portal, Stack, Text } from '@chakra-ui/react';
import { UserPlus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { useInvite } from '@/modules/members/api';
import { SimpleSelect } from '@/components/simple-select';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The backend's problem code when the invitation email was refused (the invitation is then not created). */
const MAIL_NOT_SENT = 'mail_not_sent';

/** Invite by email. The backend mails the one-time link to the invitee; with mail off (dev) it hands the link back to show here. */
export function InviteDialog({ workspaceId }: { workspaceId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const invite = useInvite(workspaceId);
  const sent = invite.data?.email_sent === true;
  const link = invite.data?.token ? `${location.origin}/invite/${invite.data.token}` : null;
  const done = sent || link !== null;
  const roles = [
    { label: t('role.member'), value: 'member' },
    { label: t('role.admin'), value: 'admin' },
  ];

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      invite.reset();
      setEmail('');
    }
  };
  const hideError = invite.error instanceof ApiError && invite.error.status === 401;
  const errorText =
    invite.error instanceof ApiError && invite.error.code === MAIL_NOT_SENT ? 'members.invite.mailFailed' : errorKey(invite.error);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="solid" data-testid="members-invite-open">
          <UserPlus />
          {t('members.invite.open')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('members.invite.title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {sent ? (
                <Alert.Root status="success" colorPalette="success" data-testid="invite-sent">
                  <Alert.Indicator />
                  <Alert.Description>{t('members.invite.sentBody', { email: invite.data?.email })}</Alert.Description>
                </Alert.Root>
              ) : link ? (
                <Stack gap="4">
                  <Text>{t('members.invite.linkBody', { email: invite.data?.email })}</Text>
                  <Clipboard.Root value={link}>
                    <Clipboard.Label>{t('members.invite.linkLabel')}</Clipboard.Label>
                    <InputGroup
                      endElement={
                        <Clipboard.Trigger asChild>
                          <IconButton variant="ghost" size="xs" aria-label={t('members.invite.copy')}>
                            <Clipboard.Indicator />
                          </IconButton>
                        </Clipboard.Trigger>
                      }
                    >
                      <Clipboard.Input asChild>
                        <Input readOnly fontFamily="mono" data-testid="invite-link" />
                      </Clipboard.Input>
                    </InputGroup>
                  </Clipboard.Root>
                  <Alert.Root status="warning" colorPalette="warning">
                    <Alert.Indicator />
                    <Alert.Description>{t('members.invite.once')}</Alert.Description>
                  </Alert.Root>
                </Stack>
              ) : (
                <Stack
                  as="form"
                  gap="4"
                  id="invite-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    invite.mutate({ email: email.trim(), role });
                  }}
                >
                  <Field.Root required>
                    <Field.Label>{t('members.invite.email')}</Field.Label>
                    <Input data-testid="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Field.HelperText>{t('members.invite.emailHelp')}</Field.HelperText>
                  </Field.Root>
                  <SimpleSelect
                    label={t('members.invite.role')}
                    items={roles}
                    value={role}
                    onChange={(v) => setRole(v as 'admin' | 'member')}
                  />
                  {invite.isError && !hideError && (
                    <Alert.Root status="error" colorPalette="danger">
                      <Alert.Indicator />
                      <Alert.Description>{t(errorText)}</Alert.Description>
                    </Alert.Root>
                  )}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button data-testid="invite-close">{t(done ? 'members.invite.done' : 'workspace.cancel')}</Button>
              </Dialog.ActionTrigger>
              {!done && (
                <Button
                  type="submit"
                  form="invite-form"
                  variant="solid"
                  loading={invite.isPending}
                  disabled={!EMAIL.test(email.trim())}
                  data-testid="invite-submit"
                >
                  {t('members.invite.create')}
                </Button>
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
