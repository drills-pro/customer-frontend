import * as React from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Menu,
  Portal,
  Stack,
  Table,
  Tabs,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react';
import type { MenuItemProps } from '@chakra-ui/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Lock, MailPlus, MoreHorizontal, Search, Send, ShieldCheck, UserMinus, UserPlus, X } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { MemberAvatar, RoleBadge } from '@/features/organizations/components/org-ui';
import { formatDate, plural } from '@/features/organizations/utils';
import { AppDialog } from '@/components/shared/app-dialog';
import { EmptyNotice } from '@/components/shared/empty-notice';
import { SectionCard } from '@/components/shared/section-card';
import { SimpleSelect } from '@/components/simple-select';
import { orgRoles } from '@/features/dashboard/domain/types';
import type { OrgMember, OrgRole } from '@/features/dashboard/domain/types';
import { orgRoleDescriptions } from '@/features/organizations/constants';
import { useInviteMembers, useRemoveMember, useResendInvitation, useSetMemberRole } from '@/features/organizations/queries';
import { useOrgDetail } from '../-components/org-context';
import { InviteMembersDialog } from '../-components/invite-members-dialog';

type MembersSearch = { invite?: true };

export const Route = createFileRoute('/_app/organizations_/$orgId/members')({
  validateSearch: (search: Record<string, unknown>): MembersSearch => ({
    invite: search.invite === true || search.invite === 'true' ? true : undefined,
  }),
  component: OrgMembers,
});

const PAGE_SIZE = 10;
const assignableRoles: OrgRole[] = ['Admin', 'Member', 'Viewer'];

/** A row action with a muted icon; `danger` for the destructive ones. */
function ActionItem({ danger = false, ...props }: { danger?: boolean } & MenuItemProps) {
  return (
    <Menu.Item
      gap="2"
      color={danger ? 'fg.error' : undefined}
      _highlighted={danger ? { bg: 'bg.error', color: 'fg.error' } : undefined}
      css={{
        '& svg': { boxSize: '4', color: danger ? 'fg.error' : 'fg.muted' },
      }}
      {...props}
    />
  );
}

/** A status with its dot, so it never relies on color alone. */
function StatusDot({ color, children }: { color: string; children: string }) {
  return (
    <HStack as="span" display="inline-flex" gap="1.5" color={color}>
      <Box as="span" boxSize="1.5" rounded="full" bg="currentColor" />
      {children}
    </HStack>
  );
}

function OrgMembers() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { org, members, summary, canManage } = useOrgDetail();
  const inviteMembers = useInviteMembers(org.id);
  const setRole = useSetMemberRole(org.id);
  const removeMember = useRemoveMember(org.id);
  const resendInvitation = useResendInvitation(org.id);

  const [tab, setTab] = React.useState<'members' | 'invitations'>('members');
  const [query, setQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<'all' | OrgRole>('all');
  const [page, setPage] = React.useState(0);
  const [removing, setRemoving] = React.useState<OrgMember | null>(null);
  const inviteOpen = canManage && search.invite === true;

  function setInviteOpen(open: boolean) {
    void navigate({
      search: open ? { invite: true } : {},
      replace: true,
    });
  }

  const active = members.filter((member) => member.status === 'active');
  const invited = members.filter((member) => member.status === 'invited');
  const source = tab === 'members' ? active : invited;
  const normalized = query.trim().toLowerCase();
  const filtered = source.filter(
    (member) =>
      (roleFilter === 'all' || member.role === roleFilter) &&
      (!normalized || member.name.toLowerCase().includes(normalized) || member.email.includes(normalized)),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const seatsLeft = Math.max(0, summary.limits.seats - summary.members - summary.invited);

  /** Admins manage everyone but owners; nobody edits their own row here. */
  function canEdit(member: OrgMember) {
    return canManage && !member.you && member.role !== 'Owner';
  }

  function changeRole(member: OrgMember, role: OrgRole) {
    setRole.mutate(
      { memberId: member.id, role },
      {
        onSuccess: () =>
          toaster.create({
            type: 'success',
            title: `${member.name} is now ${role === 'Admin' ? 'an' : 'a'} ${role}.`,
          }),
      },
    );
  }

  function remove(member: OrgMember) {
    removeMember.mutate(member.id, {
      onSuccess: () =>
        toaster.create({
          type: 'success',
          title: member.status === 'invited' ? `Invitation to ${member.email} revoked.` : `${member.name} was removed from ${org.name}.`,
        }),
    });
  }

  function invite(emails: string[], role: OrgRole) {
    inviteMembers.mutate(
      { emails, role },
      {
        onSuccess: () => {
          setTab('invitations');
          setPage(0);
          toaster.create({
            type: 'success',
            title: emails.length === 1 ? `Invitation sent to ${emails[0]}.` : `${emails.length} invitations sent.`,
          });
        },
      },
    );
  }

  return (
    <Box display="grid" minW="0" gap="5" gridTemplateColumns={{ xl: 'minmax(0, 1fr) 300px' }}>
      <Card.Root variant="outline" minW="0" overflow="hidden">
        <Stack gap="3" px="5" py="3.5" borderBottomWidth="1px" borderColor="border">
          <Flex wrap="wrap" align="flex-start" justify="space-between" gap="3">
            <Box>
              <Card.Title as="h2" textStyle="body" fontWeight="semibold">
                Manage members
              </Card.Title>
              <Card.Description textStyle="body-sm">
                {plural(summary.members, 'member')} · {summary.limits.seats - seatsLeft} of {summary.limits.seats} seats used
              </Card.Description>
            </Box>
            {canManage ? (
              <Button variant="solid" size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus />
                Invite members
              </Button>
            ) : (
              <HStack gap="1.5" fontSize="xs" color="fg.muted">
                <Lock size={14} />
                Only owners and admins can manage members.
              </HStack>
            )}
          </Flex>

          <Flex wrap="wrap" align="center" justify="space-between" gap="3">
            <Tabs.Root
              variant="line"
              size="sm"
              value={tab}
              onValueChange={(event) => {
                setTab(event.value as typeof tab);
                setPage(0);
              }}
            >
              <Tabs.List gap="5">
                <Tabs.Trigger value="members" gap="1.5">
                  Members
                  <Text as="span" color="fg.muted" fontVariantNumeric="tabular-nums">
                    {active.length}
                  </Text>
                </Tabs.Trigger>
                <Tabs.Trigger value="invitations" gap="1.5">
                  Invitations
                  <Text as="span" color="fg.muted" fontVariantNumeric="tabular-nums">
                    {invited.length}
                  </Text>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <Flex w={{ base: 'full', sm: 'auto' }} wrap="wrap" gap="2">
              <InputGroup flex="1" minW="0" w={{ sm: '56' }} startElement={<Search size={16} aria-hidden="true" />}>
                <Input
                  size="sm"
                  aria-label="Search members"
                  placeholder="Search members"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(0);
                  }}
                />
              </InputGroup>
              <SimpleSelect
                label="Filter by role"
                hideLabel
                size="sm"
                width="32"
                value={roleFilter}
                onChange={(value) => {
                  setRoleFilter(value as typeof roleFilter);
                  setPage(0);
                }}
                items={[{ label: 'All roles', value: 'all' }, ...orgRoles.map((role) => ({ label: role, value: role }))]}
              />
            </Flex>
          </Flex>
        </Stack>

        {visible.length === 0 ? (
          <EmptyNotice
            py="12"
            icon={tab === 'members' ? <Search /> : <MailPlus />}
            title={source.length === 0 && tab === 'invitations' ? 'No pending invitations' : 'No matching members'}
            description={
              source.length === 0 && tab === 'invitations'
                ? 'People you invite show up here until they accept.'
                : 'Try a different name, email or role.'
            }
          />
        ) : (
          <Table.ScrollArea>
            <Table.Root variant="data" minW="680px">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader px="5">{tab === 'members' ? 'Member' : 'Invitee'}</Table.ColumnHeader>
                  <Table.ColumnHeader>Role</Table.ColumnHeader>
                  <Table.ColumnHeader>{tab === 'members' ? 'Joined' : 'Sent'}</Table.ColumnHeader>
                  <Table.ColumnHeader>{tab === 'members' ? 'Last active' : 'Status'}</Table.ColumnHeader>
                  <Table.ColumnHeader w="12">
                    <VisuallyHidden>Actions</VisuallyHidden>
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {visible.map((member) => (
                  <Table.Row key={member.id}>
                    <Table.Cell px="5">
                      <Flex minW="0" align="center" gap="3">
                        <MemberAvatar member={member} />
                        <Box minW="0">
                          <Text truncate fontSize="13px" fontWeight="medium" color="fg">
                            {member.name}
                            {member.you && (
                              <Text as="span" fontWeight="normal" color="fg.muted">
                                {' '}
                                (you)
                              </Text>
                            )}
                          </Text>
                          <Text truncate fontSize="xs" color="fg.muted">
                            {member.email}
                          </Text>
                        </Box>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      {canEdit(member) ? (
                        <SimpleSelect
                          label={`Role for ${member.name}`}
                          hideLabel
                          size="sm"
                          width="28"
                          value={member.role}
                          onChange={(value) => changeRole(member, value as OrgRole)}
                          items={assignableRoles.map((role) => ({
                            label: role,
                            value: role,
                          }))}
                        />
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </Table.Cell>
                    <Table.Cell>{formatDate(member.joinedAt)}</Table.Cell>
                    <Table.Cell>
                      {member.status === 'invited' ? (
                        <StatusDot color="fg.warning">Pending</StatusDot>
                      ) : member.lastActive === 'Active now' ? (
                        <StatusDot color="fg.success">Active now</StatusDot>
                      ) : (
                        member.lastActive
                      )}
                    </Table.Cell>
                    <Table.Cell pe="3" textAlign="end">
                      {canEdit(member) && (
                        <Menu.Root positioning={{ placement: 'bottom-end' }}>
                          <Menu.Trigger asChild>
                            <IconButton variant="ghost" colorPalette="gray" size="xs" aria-label={`Actions for ${member.name}`}>
                              <MoreHorizontal />
                            </IconButton>
                          </Menu.Trigger>
                          <Portal>
                            <Menu.Positioner>
                              <Menu.Content>
                                {member.status === 'invited' ? (
                                  <>
                                    <ActionItem
                                      value="resend"
                                      onSelect={() =>
                                        resendInvitation.mutate(member.id, {
                                          onSuccess: () =>
                                            toaster.create({
                                              type: 'success',
                                              title: `Invitation resent to ${member.email}.`,
                                            }),
                                        })
                                      }
                                    >
                                      <Send />
                                      Resend invitation
                                    </ActionItem>
                                    <Menu.Separator />
                                    <ActionItem value="revoke" danger onSelect={() => remove(member)}>
                                      <X />
                                      Revoke invitation
                                    </ActionItem>
                                  </>
                                ) : (
                                  <>
                                    {member.role !== 'Admin' && (
                                      <ActionItem value="make-admin" onSelect={() => changeRole(member, 'Admin')}>
                                        <ShieldCheck />
                                        Make admin
                                      </ActionItem>
                                    )}
                                    <ActionItem
                                      value="message"
                                      onSelect={() =>
                                        toaster.create({
                                          type: 'info',
                                          title: `Email ${member.email} directly in this demo.`,
                                        })
                                      }
                                    >
                                      <Send />
                                      Send message
                                    </ActionItem>
                                    <Menu.Separator />
                                    <ActionItem value="remove" danger onSelect={() => setRemoving(member)}>
                                      <UserMinus />
                                      Remove from organization
                                    </ActionItem>
                                  </>
                                )}
                              </Menu.Content>
                            </Menu.Positioner>
                          </Portal>
                        </Menu.Root>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        )}

        {filtered.length > PAGE_SIZE && (
          <Flex
            align="center"
            justify="space-between"
            gap="3"
            borderTopWidth="1px"
            borderColor="border"
            px="5"
            py="3"
            fontSize="xs"
            color="fg.muted"
          >
            <Text as="span" fontVariantNumeric="tabular-nums">
              Showing {currentPage * PAGE_SIZE + 1}–{Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE)} of {filtered.length}
            </Text>
            <HStack gap="1">
              <IconButton
                variant="outline"
                size="xs"
                aria-label="Previous page"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft />
              </IconButton>
              <Text as="span" px="2" fontVariantNumeric="tabular-nums">
                {currentPage + 1} / {pageCount}
              </Text>
              <IconButton
                variant="outline"
                size="xs"
                aria-label="Next page"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight />
              </IconButton>
            </HStack>
          </Flex>
        )}
      </Card.Root>

      <SectionCard title="Roles" description="What each role can do." alignSelf="start">
        <Box as="dl">
          {orgRoles.map((role) => (
            <Stack key={role} gap="1.5" px="5" py="3" borderTopWidth="1px" borderColor="border" _first={{ borderTopWidth: '0' }}>
              <Flex as="dt" align="center" justify="space-between" gap="2">
                <RoleBadge role={role} />
                <Text as="span" fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                  {active.filter((member) => member.role === role).length}
                </Text>
              </Flex>
              <Box as="dd" fontSize="xs" color="fg.muted">
                {orgRoleDescriptions[role]}
              </Box>
            </Stack>
          ))}
        </Box>
      </SectionCard>

      <InviteMembersDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        org={org}
        existingEmails={members.map((member) => member.email)}
        seatsLeft={seatsLeft}
        onInvite={invite}
      />

      <AppDialog
        role="alertdialog"
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name}?`}
        description={`They lose access to every project in ${org.name} right away. Their training runs and models stay in the organization.`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorPalette="danger"
              size="sm"
              onClick={() => {
                if (removing) remove(removing);
                setRemoving(null);
              }}
            >
              Remove member
            </Button>
          </>
        }
      />
    </Box>
  );
}
