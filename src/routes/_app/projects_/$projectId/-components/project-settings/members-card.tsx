import * as React from 'react'
import {
  Avatar,
  Box,
  Button,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { UserPlus, X } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { AppDialog } from '@/components/shared/app-dialog'
import { SectionCard } from '@/components/shared/section-card'
import { SECTION_OFFSET } from '@/components/shared/settings-nav'
import { ToneBadge } from '@/components/shared/tone-badge'
import { SimpleSelect } from '@/components/simple-select'
import { useProjectDetail } from '@/features/dashboard/context'
import type {
  ProjectMember,
  ProjectTeamRole,
} from '@/features/projects/mappers'
import {
  useInviteProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
  useSetProjectMemberRole,
} from '@/features/projects/queries'

type Role = ProjectTeamRole
type Member = ProjectMember

const assignableRoles: Array<Exclude<Role, 'Owner'>> = ['Editor', 'Viewer']
const roleDescriptions: Record<Role, string> = {
  Owner: 'Full access, including billing and deletion',
  Editor: 'Upload data, train and deploy models',
  Viewer: 'Read-only access to runs and metrics',
}

export function MembersCard() {
  const { project } = useProjectDetail()
  const members = useProjectMembers(project.id).data ?? []
  const inviteMember = useInviteProjectMember(project.id)
  const setRole = useSetProjectMemberRole(project.id)
  const removeMember = useRemoveProjectMember(project.id)
  const [inviteOpen, setInviteOpen] = React.useState(false)

  function changeRole(member: Member, role: Role) {
    setRole.mutate(
      { userId: member.id, role },
      {
        onSuccess: () =>
          toaster.create({
            type: 'success',
            title: `${member.name} is now ${role === 'Editor' ? 'an' : 'a'} ${role}.`,
          }),
      },
    )
  }

  function remove(member: Member) {
    removeMember.mutate(member.id, {
      onSuccess: () =>
        toaster.create({
          type: 'success',
          title: member.invited
            ? `Invitation to ${member.email} cancelled.`
            : `${member.name} was removed from the project.`,
        }),
    })
  }

  return (
    <SectionCard
      id="members"
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title={
        <>
          Members{' '}
          <Text
            as="span"
            fontWeight="normal"
            color="fg.muted"
            fontVariantNumeric="tabular-nums"
          >
            {members.length}
          </Text>
        </>
      }
      description="People who can work in this project."
      action={
        <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Invite
        </Button>
      }
    >
      <Stack as="ul" gap="0">
        {members.map((member) => (
          <Flex
            as="li"
            key={member.email}
            wrap="wrap"
            align="center"
            gap="3"
            px="5"
            py="3"
            borderTopWidth="1px"
            borderColor="border"
            _first={{ borderTopWidth: '0' }}
          >
            <Avatar.Root
              boxSize="8"
              borderWidth="0"
              color="white"
              // The member's own color, from the API.
              bg={member.color}
            >
              <Avatar.Fallback fontSize="11px">
                {member.initials}
              </Avatar.Fallback>
            </Avatar.Root>
            <Box me="auto" minW="0">
              <HStack gap="2" fontSize="13px" fontWeight="medium">
                <Text as="span" truncate>
                  {member.name}
                </Text>
                {member.invited && (
                  <ToneBadge tone="warning">Invited</ToneBadge>
                )}
              </HStack>
              <Text truncate fontSize="xs" color="fg.muted">
                {member.email}
              </Text>
            </Box>

            {member.role === 'Owner' ? (
              <ToneBadge tone="accent">Owner</ToneBadge>
            ) : (
              <>
                <SimpleSelect
                  label={`Role for ${member.name}`}
                  hideLabel
                  size="sm"
                  width="110px"
                  value={member.role}
                  onChange={(value) => changeRole(member, value as Role)}
                  items={assignableRoles.map((role) => ({
                    label: role,
                    value: role,
                  }))}
                />
                <IconButton
                  variant="ghost"
                  colorPalette="gray"
                  size="sm"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => remove(member)}
                >
                  <X />
                </IconButton>
              </>
            )}
          </Flex>
        ))}
      </Stack>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        existing={members.map((member) => member.email)}
        onInvite={(email, role) =>
          inviteMember.mutate(
            { email, role },
            {
              onSuccess: () =>
                toaster.create({
                  type: 'success',
                  title: `Invitation sent to ${email}.`,
                }),
            },
          )
        }
      />
    </SectionCard>
  )
}

function InviteDialog({
  open,
  onOpenChange,
  existing,
  onInvite,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: string[]
  onInvite: (email: string, role: Role) => void
}) {
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<Role>('Editor')
  const [error, setError] = React.useState('')

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setEmail('')
      setRole('Editor')
      setError('')
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter a valid email address.')
      return
    }
    if (existing.includes(value)) {
      setError('That person already has access.')
      return
    }
    onInvite(value, role)
    close(false)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      onSubmit={submit}
      title="Invite a member"
      description="They get an email with a link to join this project."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => close(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="solid" size="sm">
            Send invite
          </Button>
        </>
      }
    >
      <Stack gap="4">
        <Field.Root invalid={Boolean(error)}>
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            value={email}
            placeholder="teammate@acme.ai"
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
          />
          <Field.ErrorText>{error}</Field.ErrorText>
        </Field.Root>
        <SimpleSelect
          label="Role"
          width="full"
          portalled={false}
          value={role}
          onChange={(value) => setRole(value as Role)}
          items={assignableRoles.map((item) => ({
            label: `${item} — ${roleDescriptions[item]}`,
            value: item,
          }))}
        />
      </Stack>
    </AppDialog>
  )
}
