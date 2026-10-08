import * as React from 'react'
import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { orgRoleDescriptions } from '@/features/dashboard/data'
import type { OrgRole, Organization } from '@/features/dashboard/data'
import { isEmail } from '../../account/-components/account-data'

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
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>Invite members</DialogTitle>
            <DialogDescription>
              They get an email with a link to join {org.name}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-2">
            <Field data-invalid={Boolean(error) || undefined}>
              <div className="flex items-baseline justify-between gap-2">
                <FieldLabel htmlFor="org-invite-emails">
                  Email addresses
                </FieldLabel>
                {emails.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {emails.length} of {seatsLeft} seats
                  </span>
                )}
              </div>
              <Textarea
                id="org-invite-emails"
                rows={3}
                value={value}
                placeholder="priya@acme.ai, marcus@acme.ai"
                aria-invalid={Boolean(error) || undefined}
                onChange={(event) => {
                  setValue(event.target.value)
                  setError('')
                }}
              />
              <FieldDescription>
                Separate addresses with commas or new lines.
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="org-invite-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(next) => setRole(next as OrgRole)}
              >
                <SelectTrigger id="org-invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {invitableRoles.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{orgRoleDescriptions[role]}</FieldDescription>
            </Field>
            {overLimit && !error && (
              <Alert>
                <TriangleAlert />
                <AlertDescription>
                  That's more than the {seatsLeft} seats left on your {org.plan}{' '}
                  plan. Remove some addresses or upgrade.
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {emails.length > 1
                ? `Send ${emails.length} invites`
                : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
