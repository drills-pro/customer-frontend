import * as React from 'react';
import { Box, Button, Card, Field, Flex, Input, Stack, Text } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router';
import { CircleCheck, KeyRound, Lock, Monitor, Smartphone, Trash2 } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { AppDialog } from '@/components/shared/app-dialog';
import { DangerCard } from '@/components/shared/danger-card';
import { SectionCard } from '@/components/shared/section-card';
import { ToneBadge } from '@/components/shared/tone-badge';
import { useDashboardLayout } from '@/features/dashboard/context';
import { useChangePassword, useCurrentUser, useDeleteAccount, useEndSession, useSecurity, useSessions } from '@/features/account/queries';
import { relativeTimeLong } from '@/lib/format';
import { PageHeader, SettingRow } from './-components/page-header';

export const Route = createFileRoute('/_app/account/security')({
  component: SecurityRoute,
});
function SecurityRoute() {
  return (
    <>
      <PageHeader title="Security" description="Manage how you sign in and keep your account secure." />
      <PasswordCard />
      <SignInMethodsCard />
      <SessionsCard />
      <DeleteAccountCard />
    </>
  );
}

/** Rows in a card, ruled off from each other. */
function RowList({ children }: { children: React.ReactNode }) {
  return <Box css={{ '& > * + *': { borderTopWidth: '1px', borderColor: 'border' } }}>{children}</Box>;
}

function PasswordCard() {
  const [open, setOpen] = React.useState(false);
  const security = useSecurity().data;
  const lastChanged = security ? relativeTimeLong(security.password_changed_at) : '…';

  return (
    <Card.Root variant="outline">
      <SettingRow icon={KeyRound} title="Password" description={`Last changed ${lastChanged}.`}>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Change password
        </Button>
      </SettingRow>
      <ChangePasswordDialog
        open={open}
        onOpenChange={setOpen}
        onChanged={() => toaster.create({ type: 'success', title: 'Password changed.' })}
      />
    </Card.Root>
  );
}

type PasswordValues = { current: string; next: string; confirm: string };
const emptyPasswords: PasswordValues = { current: '', next: '', confirm: '' };

function ChangePasswordDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const changePassword = useChangePassword();
  const [values, setValues] = React.useState(emptyPasswords);
  const [errors, setErrors] = React.useState<Partial<PasswordValues>>({});

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setValues(emptyPasswords);
      setErrors({});
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Partial<PasswordValues> = {};
    if (!values.current) nextErrors.current = 'Enter your current password.';
    if (values.next.length < 8) nextErrors.next = 'Use at least 8 characters.';
    else if (values.next === values.current) nextErrors.next = 'Choose a password you have not used here.';
    if (values.confirm !== values.next) nextErrors.confirm = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || changePassword.isPending) return;
    changePassword.mutate(
      { current: values.current, next: values.next },
      {
        onSuccess: () => {
          onChanged();
          close(false);
        },
      },
    );
  }

  const fields: Array<{
    key: keyof PasswordValues;
    label: string;
    autoComplete: string;
    hint?: string;
  }> = [
    {
      key: 'current',
      label: 'Current password',
      autoComplete: 'current-password',
    },
    {
      key: 'next',
      label: 'New password',
      autoComplete: 'new-password',
      hint: 'At least 8 characters.',
    },
    {
      key: 'confirm',
      label: 'Confirm new password',
      autoComplete: 'new-password',
    },
  ];

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      onSubmit={submit}
      title="Change password"
      description="Other sessions stay signed in until you sign them out."
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="solid" size="sm">
            Update password
          </Button>
        </>
      }
    >
      <Stack gap="4">
        {fields.map((field) => {
          const error = errors[field.key];
          return (
            <Field.Root key={field.key} invalid={Boolean(error)}>
              <Field.Label>{field.label}</Field.Label>
              <Input
                type="password"
                value={values[field.key]}
                autoComplete={field.autoComplete}
                onChange={(event) => {
                  const value = event.target.value;
                  setValues((current) => ({
                    ...current,
                    [field.key]: value,
                  }));
                  setErrors((current) => ({
                    ...current,
                    [field.key]: undefined,
                  }));
                }}
              />
              {field.hint && !error && <Field.HelperText>{field.hint}</Field.HelperText>}
              <Field.ErrorText>{error}</Field.ErrorText>
            </Field.Root>
          );
        })}
      </Stack>
    </AppDialog>
  );
}

function SignInMethodsCard() {
  const orgName = useDashboardLayout().org.name;
  const security = useSecurity().data;
  const twoFactor = security?.two_factor_enabled ?? false;
  const google = security?.sso.find((item) => item.provider === 'Google');
  return (
    <Card.Root variant="outline">
      <RowList>
        <SettingRow icon={Lock} title="Two-factor authentication" description="Require a code from your authenticator app at sign-in.">
          <ToneBadge tone={twoFactor ? 'success' : 'neutral'}>{twoFactor ? 'On' : 'Off'}</ToneBadge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toaster.create({
                type: 'info',
                title: 'Two-factor authentication is not available in this demo.',
              })
            }
          >
            Enable
          </Button>
        </SettingRow>
        <SettingRow icon={CircleCheck} title="Google SSO" description={`Sign in with your ${orgName} Google Workspace account.`}>
          <ToneBadge tone={google?.connected ? 'success' : 'neutral'}>{google?.connected ? 'Connected' : 'Not connected'}</ToneBadge>
        </SettingRow>
      </RowList>
    </Card.Root>
  );
}

function SessionsCard() {
  const sessions = useSessions().data ?? [];
  const endSession = useEndSession();

  return (
    <SectionCard title="Active sessions" description="Devices currently signed in to your account.">
      <RowList>
        {sessions.map((session) => (
          <SettingRow
            key={session.id}
            icon={session.kind === 'mobile' ? Smartphone : Monitor}
            title={`${session.device} — ${session.location}`}
            description={session.current ? 'Current session' : `Last active ${relativeTimeLong(session.last_active_at)}`}
          >
            {session.current ? (
              <ToneBadge tone="success">This device</ToneBadge>
            ) : (
              <Button
                variant="ghost"
                colorPalette="gray"
                size="sm"
                aria-label={`Sign out ${session.device}`}
                disabled={endSession.isPending}
                onClick={() =>
                  endSession.mutate(session.id, {
                    onSuccess: () =>
                      toaster.create({
                        type: 'success',
                        title: `Signed out of ${session.device}.`,
                      }),
                  })
                }
              >
                Sign out
              </Button>
            )}
          </SettingRow>
        ))}
      </RowList>
    </SectionCard>
  );
}

function DeleteAccountCard() {
  const [open, setOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState('');
  const deleteAccount = useDeleteAccount();
  const confirmWord = useCurrentUser().data?.username ?? '';
  const confirmed = Boolean(confirmWord) && confirmation === confirmWord;

  function close(next: boolean) {
    setOpen(next);
    if (!next) setConfirmation('');
  }

  return (
    <DangerCard title="Delete account">
      <Flex wrap="wrap" align="center" gap="4" p="5">
        <Text me="auto" minW="0" flexBasis="60" flexGrow={1} fontSize="xs" color="fg.muted">
          Permanently remove your account and all associated data. This can't be undone.
        </Text>
        <Button variant="solid" colorPalette="danger" size="sm" px="3.5" onClick={() => setOpen(true)}>
          <Trash2 />
          Delete account
        </Button>
        <AppDialog
          role="alertdialog"
          open={open}
          onOpenChange={close}
          title="Delete your account?"
          description="You lose access to every organization and project, and your API keys stop working. This cannot be undone."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button
                variant="solid"
                colorPalette="danger"
                size="sm"
                disabled={!confirmed || deleteAccount.isPending}
                onClick={() => {
                  close(false);
                  // Refused while the user still owns an organization; the
                  // reason comes back from the API and is shown as a toast.
                  deleteAccount.mutate(undefined, {
                    onSuccess: () =>
                      toaster.create({
                        type: 'info',
                        title: 'Your account was deleted.',
                      }),
                  });
                }}
              >
                Delete my account
              </Button>
            </>
          }
        >
          <Field.Root>
            <Field.Label fontWeight="normal">
              <span>
                Type{' '}
                <Text as="b" fontWeight="semibold">
                  {confirmWord}
                </Text>{' '}
                to confirm
              </span>
            </Field.Label>
            <Input value={confirmation} autoComplete="off" onChange={(event) => setConfirmation(event.target.value)} />
          </Field.Root>
        </AppDialog>
      </Flex>
    </DangerCard>
  );
}
