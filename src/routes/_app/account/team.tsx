import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isEmail, teamMembers } from './-components/account-data'
import type { TeamMember, TeamRole } from './-components/account-data'
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
const inviteColors = ['#0ea5e9', '#14b8a6', '#ec4899', '#6366f1']

function TeamCard() {
  const orgName = useDashboardLayout().org.name
  const [members, setMembers] = React.useState<TeamMember[]>(teamMembers)
  const [inviteOpen, setInviteOpen] = React.useState(false)

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>
          Members{' '}
          <span className="font-normal text-muted-foreground tabular-nums">
            {members.length}
          </span>
        </CardTitle>
        <CardDescription>Everyone in {orgName}.</CardDescription>
        <CardAction>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus />
            Invite member
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y">
          {members.map((member) => (
            <li
              key={member.email}
              className="flex flex-wrap items-center gap-3 px-5 py-3"
            >
              <Avatar className="size-8">
                <AvatarFallback
                  className="text-[11px] text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div className="mr-auto min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-medium">
                  <span className="truncate">
                    {member.name}
                    {member.you && (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        (you)
                      </span>
                    )}
                  </span>
                  {member.invited && (
                    <Badge
                      variant="secondary"
                      className="border-0 bg-warning-muted text-warning"
                    >
                      Invited
                    </Badge>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={
                  member.role === 'Admin'
                    ? 'border-0 bg-success-muted text-success'
                    : 'border-0 bg-muted text-muted-foreground'
                }
              >
                {member.role}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgName={orgName}
        existing={members.map((member) => member.email)}
        onInvite={(email, role) => {
          setMembers((current) => [
            ...current,
            {
              name: email.split('@')[0],
              email,
              initials: email.slice(0, 2).toUpperCase(),
              color: inviteColors[current.length % inviteColors.length],
              role,
              invited: true,
            },
          ])
          toast.success(`Invitation sent to ${email}.`)
        }}
      />
    </Card>
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
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              They get an email with a link to join {orgName}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-2">
            <Field data-invalid={Boolean(error) || undefined}>
              <FieldLabel htmlFor="team-invite-email">Email</FieldLabel>
              <Input
                id="team-invite-email"
                type="email"
                value={email}
                placeholder="teammate@acme.ai"
                aria-invalid={Boolean(error) || undefined}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="team-invite-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as TeamRole)}
              >
                <SelectTrigger id="team-invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamRoles.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Send invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
