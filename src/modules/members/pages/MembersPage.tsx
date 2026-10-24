import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CloseButton,
  Dialog,
  Heading,
  HStack,
  IconButton,
  Portal,
  Stack,
  Table,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react';
import { Trash } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { ApiError, type Schemas } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { useInvitations, useMembers, useRemoveMember, useSetMemberRole } from '@/modules/members/api';
import { useMe } from '@/modules/workspaces';
import { SimpleSelect } from '@/components/simple-select';
import { toaster } from '@/components/toaster';
import { useCan, useWorkspace } from '@/modules/workspaces';
import { StateScreen } from '@/shared/ui/StateScreen';
import { InviteDialog } from '@/modules/members/components/InviteDialog';

type Member = Schemas['app__modules__user__tenant_members__schemas__Member'];

function fail(t: (k: string) => string, e: unknown) {
  if (e instanceof ApiError && e.status === 401) return; // the query client already sent the user to sign in
  toaster.create({ type: 'error', title: t(errorKey(e)) });
}

function RemoveDialog({ member, onClose, workspaceId }: { member: Member | null; onClose: () => void; workspaceId: string }) {
  const { t } = useTranslation();
  const remove = useRemoveMember(workspaceId);
  const who = member?.display_name ?? member?.email ?? '';
  return (
    <Dialog.Root role="alertdialog" open={!!member} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('members.remove.title', { name: who })}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>{t('members.remove.body')}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button>{t('workspace.cancel')}</Button>
              </Dialog.ActionTrigger>
              <Button
                variant="solid"
                colorPalette="danger"
                loading={remove.isPending}
                data-testid="remove-confirm"
                onClick={() =>
                  member &&
                  remove.mutate(member.user_sub, {
                    onSuccess: onClose,
                    onError: (e) => fail(t, e),
                  })
                }
              >
                {t('members.remove.confirm')}
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

function MembersTable({ workspaceId }: { workspaceId: string }) {
  const { t, i18n } = useTranslation();
  const members = useMembers(workspaceId);
  const me = useMe();
  const setRole = useSetMemberRole(workspaceId);
  const [removing, setRemoving] = useState<Member | null>(null);
  const roles = [
    { label: t('role.member'), value: 'member' },
    { label: t('role.admin'), value: 'admin' },
  ];
  return (
    <>
      <Table.ScrollArea borderWidth="2px" borderColor="border" borderRadius="l2">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t('members.col.member')}</Table.ColumnHeader>
              <Table.ColumnHeader w="40">{t('members.col.role')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('members.col.joined')}</Table.ColumnHeader>
              <Table.ColumnHeader w="12">
                <VisuallyHidden>{t('members.col.actions')}</VisuallyHidden>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {members.map((m) => {
              const self = m.user_sub === me.sub;
              const fixed = m.role === 'owner' || self; // owners change through an ownership offer; nobody edits themselves here
              return (
                <Table.Row key={m.user_sub} data-testid={`members-row-${m.user_sub}`}>
                  <Table.Cell>
                    <Text fontWeight="medium">{m.display_name ?? m.email ?? m.user_sub}</Text>
                    {m.display_name && m.email && (
                      <Text textStyle="body-sm" color="fg.muted">
                        {m.email}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {fixed ? (
                      <Badge colorPalette="brand" variant="subtle">
                        {t(`role.${m.role}`)}
                      </Badge>
                    ) : (
                      <SimpleSelect
                        size="sm"
                        label={t('members.col.role')}
                        hideLabel
                        items={roles}
                        value={m.role}
                        onChange={(role) =>
                          setRole.mutate({ sub: m.user_sub, role: role as 'admin' | 'member' }, { onError: (e) => fail(t, e) })
                        }
                      />
                    )}
                  </Table.Cell>
                  <Table.Cell>{new Date(m.created_at).toLocaleDateString(i18n.resolvedLanguage)}</Table.Cell>
                  <Table.Cell>
                    {!fixed && (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label={t('members.remove.open', { name: m.display_name ?? m.email ?? '' })}
                        data-testid={`members-remove-${m.user_sub}`}
                        onClick={() => setRemoving(m)}
                      >
                        <Trash />
                      </IconButton>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <RemoveDialog member={removing} onClose={() => setRemoving(null)} workspaceId={workspaceId} />
    </>
  );
}

function PendingInvitations({ workspaceId }: { workspaceId: string }) {
  const { t, i18n } = useTranslation();
  const invitations = useInvitations(workspaceId);
  if (invitations.length === 0) return null;
  return (
    <Stack gap="3">
      <Heading as="h2" textStyle="h3">
        {t('members.pending.title')}
      </Heading>
      <Table.ScrollArea borderWidth="2px" borderColor="border" borderRadius="l2">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t('members.invite.email')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('members.col.role')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('members.pending.expires')}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {invitations.map((i) => (
              <Table.Row key={i.id} data-testid={`members-invitation-${i.id}`}>
                <Table.Cell>{i.email}</Table.Cell>
                <Table.Cell>{t(`role.${i.role}`)}</Table.Cell>
                <Table.Cell>{new Date(i.expires_at).toLocaleDateString(i18n.resolvedLanguage)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  );
}

/** Alone in the workspace: one Bit and a prompt to invite someone, above the (one-row) table. */
function AloneNote({ workspaceId }: { workspaceId: string }) {
  const { t } = useTranslation();
  const members = useMembers(workspaceId);
  const invitations = useInvitations(workspaceId);
  if (members.length > 1 || invitations.length > 0) return null;
  return (
    <Card.Root>
      <StateScreen pose="idle" label={t('members.alone.label')} title={t('members.alone.title')} body={t('members.alone.body')} />
    </Card.Root>
  );
}

export function MembersPage() {
  const { t } = useTranslation();
  const { id } = useWorkspace();
  const canManage = useCan('tenant.member.manage');
  if (!canManage)
    return <StateScreen pose="idle" label={t('members.denied.label')} title={t('members.denied.title')} body={t('members.denied.body')} />;
  return (
    <Stack gap="6">
      <HStack justify="space-between" wrap="wrap" gap="3">
        <Heading as="h1" textStyle="h1">
          {t('shell.members')}
        </Heading>
        <InviteDialog workspaceId={id} />
      </HStack>
      <AloneNote workspaceId={id} />
      <MembersTable workspaceId={id} />
      <PendingInvitations workspaceId={id} />
    </Stack>
  );
}
