import * as React from 'react'
import {
  Alert,
  Button,
  Field,
  Flex,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'

import { AppDialog } from '@/components/shared/app-dialog'
import { SimpleSelect } from '@/components/simple-select'
import type { OrgRole, Organization } from '@/features/dashboard/domain/types'
import { orgRoleDescriptions } from '@/features/organizations/constants'
import { isEmail } from '@/lib/validation'

/** Owners are made by transferring ownership, never by invitation. */
const invitableRoles: OrgRole[] = ['Admin', 'Member', 'Viewer']

export function parseEmails(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}

export function InviteMembersDialog({
  open,
  onOpenChange,
  org,
  existingEmails,
  seatsLeft,
  onInvite,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: Organization
  existingEmails: string[]
  seatsLeft: number
  onInvite: (emails: string[], role: OrgRole) => void
}) {
  const [value, setValue] = React.useState('')
  const [role, setRole] = React.useState<OrgRole>('Member')
  const [error, setError] = React.useState('')

  const emails = parseEmails(value)
  const overLimit = emails.length > seatsLeft

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setValue('')
      setRole('Member')
      setError('')
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (emails.length === 0) {
      setError('Enter at least one email address.')
      return
    }
    const invalid = emails.filter((email) => !isEmail(email))
    if (invalid.length > 0) {
      setError(`Not a valid email: ${invalid.join(', ')}`)
      return
    }
    const taken = emails.filter((email) => existingEmails.includes(email))
    if (taken.length > 0) {
      setError(`Already in ${org.name}: ${taken.join(', ')}`)
      return
    }
    if (overLimit) {
      setError(
        `Your ${org.plan} plan has ${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left.`,
      )
      return
    }
    onInvite(emails, role)
    close(false)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      onSubmit={submit}
      title="Invite members"
      description={`They get an email with a link to join ${org.name}.`}
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
            {emails.length > 1
              ? `Send ${emails.length} invites`
              : 'Send invite'}
          </Button>
        </>
      }
    >
      <Stack gap="4">
        <Field.Root invalid={Boolean(error)}>
          <Flex w="full" align="baseline" justify="space-between" gap="2">
            <Field.Label>Email addresses</Field.Label>
            {emails.length > 0 && (
              <Text
                as="span"
                fontSize="xs"
                color="fg.muted"
                fontVariantNumeric="tabular-nums"
              >
                {emails.length} of {seatsLeft} seats
              </Text>
            )}
          </Flex>
          <Textarea
            rows={3}
            value={value}
            placeholder="priya@acme.ai, marcus@acme.ai"
            onChange={(event) => {
              setValue(event.target.value)
              setError('')
            }}
          />
          <Field.HelperText>
            Separate addresses with commas or new lines.
          </Field.HelperText>
          <Field.ErrorText>{error}</Field.ErrorText>
        </Field.Root>
        <Stack gap="1.5">
          <SimpleSelect
            label="Role"
            width="full"
            portalled={false}
            value={role}
            onChange={(next) => setRole(next as OrgRole)}
            items={invitableRoles.map((item) => ({ label: item, value: item }))}
          />
          <Text textStyle="body-sm" color="fg.muted">
            {orgRoleDescriptions[role]}
          </Text>
        </Stack>
        {overLimit && !error && (
          <Alert.Root status="warning" colorPalette="warning">
            <Alert.Indicator />
            <Alert.Description>
              That's more than the {seatsLeft} seats left on your {org.plan}{' '}
              plan. Remove some addresses or upgrade.
            </Alert.Description>
          </Alert.Root>
        )}
      </Stack>
    </AppDialog>
  )
}
