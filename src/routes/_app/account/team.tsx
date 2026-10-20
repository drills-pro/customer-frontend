import * as React from 'react'
import {
  Avatar,
  Box,
  Button,
  Field,
  Flex,
  HStack,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { createFileRoute } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { AppDialog } from '@/components/shared/app-dialog'
import { SectionCard } from '@/components/shared/section-card'
import { ToneBadge } from '@/components/shared/tone-badge'
import { SimpleSelect } from '@/components/simple-select'
import { useDashboardLayout } from '@/features/dashboard/context'
import { CardError, CardLoading } from '@/components/shared/query-states'
import {
  useInviteMembers,
  useOrgMembers,
} from '@/features/organizations/queries'
import { isEmail } from '@/lib/validation'
import type { TeamRole } from './-components/account-data'
import { PageHeader } from './-components/page-header'

export const Route = createFileRoute('/_app/account/team')({
  component: TeamRoute,
})
function TeamRoute() {
  const { org } = useDashboardLayout()
  return (
    <>
      <PageHeader
        title="Team members"
        description={`People with access to ${org.name} on DRILLS.`}
      />
      <TeamCard key={org.id} />
    </>
  )
}

const teamRoles: TeamRole[] = ['Member', 'Admin']

/** The current organization's members: the same list its Members page edits. */
function TeamCard() {
  const { org } = useDashboardLayout()
  const orgName = org.name
  const membersQuery = useOrgMembers(org.id)
  const invite = useInviteMembers(org.id)
  const members = membersQuery.data ?? []
  const [inviteOpen, setInviteOpen] = React.useState(false)

  return (
    <SectionCard
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
      description={`Everyone in ${orgName}.`}
      action={
        <Button variant="solid" size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Invite member
        </Button>
      }
    >
      {membersQuery.error && (
        <CardError
          title="Could not load members"
          error={membersQuery.error}
          onRetry={() => void membersQuery.refetch()}
        />
      )}
      {membersQuery.isPending && <CardLoading />}
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
                  {member.you && (
                    <Text as="span" fontWeight="normal" color="fg.muted">
                      {' '}
                      (you)
                    </Text>
                  )}
                </Text>
                {member.status === 'invited' && (
                  <ToneBadge tone="warning">Invited</ToneBadge>
                )}
              </HStack>
              <Text truncate fontSize="xs" color="fg.muted">
                {member.email}
              </Text>
            </Box>
            <ToneBadge
              tone={
                member.role === 'Admin' || member.role === 'Owner'
                  ? 'success'
                  : 'neutral'
              }
            >
              {member.role}
            </ToneBadge>
          </Flex>
        ))}
      </Stack>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgName={orgName}
        existing={members.map((member) => member.email)}
        onInvite={(email, role) =>
          invite.mutate(
            { emails: [email], role },
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

function InviteMemberDialog({
  open,
  onOpenChange,
  orgName,
  existing,
  onInvite,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgName: string
  existing: string[]
  onInvite: (email: string, role: TeamRole) => void
}) {
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<TeamRole>('Member')
  const [error, setError] = React.useState('')

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setEmail('')
      setRole('Member')
      setError('')
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!isEmail(value)) {
      setError('Enter a valid email address.')
      return
    }
    if (existing.includes(value)) {
      setError('That person is already on the team.')
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
      description={`They get an email with a link to join ${orgName}.`}
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
          onChange={(value) => setRole(value as TeamRole)}
          items={teamRoles.map((item) => ({ label: item, value: item }))}
        />
      </Stack>
    </AppDialog>
  )
}
