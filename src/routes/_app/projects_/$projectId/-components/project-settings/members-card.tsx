import * as React from 'react'
import { UserPlus, X } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
          toast.success(
            `${member.name} is now ${role === 'Editor' ? 'an' : 'a'} ${role}.`,
          ),
      },
    )
  }

  function remove(member: Member) {
    removeMember.mutate(member.id, {
      onSuccess: () =>
        toast.success(
          member.invited
            ? `Invitation to ${member.email} cancelled.`
            : `${member.name} was removed from the project.`,
        ),
    })
  }

  return (
    <Card id="members" size="flush" className="scroll-mt-22">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>
          Members{' '}
          <span className="font-normal text-muted-foreground tabular-nums">
            {members.length}
          </span>
        </CardTitle>
        <CardDescription>People who can work in this project.</CardDescription>
        <CardAction>
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <UserPlus />
            Invite
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
                  <span className="truncate">{member.name}</span>
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

              {member.role === 'Owner' ? (
                <Badge
                  variant="secondary"
                  className="border-0 bg-primary-muted text-primary"
                >
                  Owner
                </Badge>
              ) : (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(value) => changeRole(member, value as Role)}
                  >
                    <SelectTrigger
                      aria-label={`Role for ${member.name}`}
                      className="w-[110px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {assignableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${member.name}`}
                    onClick={() => remove(member)}
                  >
                    <X />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        existing={members.map((member) => member.email)}
        onInvite={(email, role) =>
          inviteMember.mutate(
            { email, role },
            { onSuccess: () => toast.success(`Invitation sent to ${email}.`) },
          )
        }
      />
    </Card>
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
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              They get an email with a link to join this project.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-2">
            <Field data-invalid={Boolean(error) || undefined}>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
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
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as Role)}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                      <span className="text-muted-foreground">
                        — {roleDescriptions[item]}
                      </span>
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
