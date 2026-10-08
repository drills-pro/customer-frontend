import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  MailPlus,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  MemberAvatar,
  RoleBadge,
} from '@/features/organizations/components/org-ui'
import { formatDate, plural } from '@/features/organizations/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  orgColors,
  orgRoleDescriptions,
  orgRoles,
} from '@/features/dashboard/data'
import type { OrgMember, OrgRole } from '@/features/dashboard/data'
import { useOrgDetail } from '../-components/org-context'
import { InviteMembersDialog } from '../-components/invite-members-dialog'

type MembersSearch = { invite?: true }

export const Route = createFileRoute('/_app/organizations_/$orgId/members')({
  validateSearch: (search: Record<string, unknown>): MembersSearch => ({
    invite:
      search.invite === true || search.invite === 'true' ? true : undefined,
  }),
  component: OrgMembers,
})

const PAGE_SIZE = 10
const assignableRoles: OrgRole[] = ['Admin', 'Member', 'Viewer']

function OrgMembers() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { org, members, summary, canManage, updateMembers } = useOrgDetail()

  const [tab, setTab] = React.useState<'members' | 'invitations'>('members')
  const [query, setQuery] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<'all' | OrgRole>('all')
  const [page, setPage] = React.useState(0)
  const [removing, setRemoving] = React.useState<OrgMember | null>(null)
  const inviteOpen = canManage && search.invite === true

  function setInviteOpen(open: boolean) {
    void navigate({
      search: open ? { invite: true } : {},
      replace: true,
    })
  }

  const active = members.filter((member) => member.status === 'active')
  const invited = members.filter((member) => member.status === 'invited')
  const source = tab === 'members' ? active : invited
  const normalized = query.trim().toLowerCase()
  const filtered = source.filter(
    (member) =>
      (roleFilter === 'all' || member.role === roleFilter) &&
      (!normalized ||
        member.name.toLowerCase().includes(normalized) ||
        member.email.includes(normalized)),
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  )
  const seatsLeft = Math.max(
    0,
    summary.limits.seats - summary.members - summary.invited,
  )

  /** Admins manage everyone but owners; nobody edits their own row here. */
  function canEdit(member: OrgMember) {
    return canManage && !member.you && member.role !== 'Owner'
  }

  function changeRole(member: OrgMember, role: OrgRole) {
    updateMembers((current) =>
      current.map((item) => (item.id === member.id ? { ...item, role } : item)),
    )
    toast.success(
      `${member.name} is now ${role === 'Admin' ? 'an' : 'a'} ${role}.`,
    )
  }

  function remove(member: OrgMember) {
    updateMembers((current) => current.filter((item) => item.id !== member.id))
    toast.success(
      member.status === 'invited'
        ? `Invitation to ${member.email} revoked.`
        : `${member.name} was removed from ${org.name}.`,
    )
  }

  function invite(emails: string[], role: OrgRole) {
    updateMembers((current) => [
      ...current,
      ...emails.map((email, index) => ({
        id: `${org.id}-invite-${Date.now().toString(36)}-${index}`,
        name: email.split('@')[0],
        email,
        initials: email.slice(0, 2).toUpperCase(),
        color: orgColors[(current.length + index) % orgColors.length],
        role,
        joinedAt: Date.now(),
        lastActive: 'Pending',
        status: 'invited' as const,
      })),
    ])
    setTab('invitations')
    setPage(0)
    toast.success(
      emails.length === 1
        ? `Invitation sent to ${emails[0]}.`
        : `${emails.length} invitations sent.`,
    )
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card size="flush" className="min-w-0">
        <CardHeader className="gap-3 border-b [--card-section:--spacing(3.5)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Manage members</CardTitle>
              <CardDescription>
                {plural(summary.members, 'member')} ·{' '}
                {summary.limits.seats - seatsLeft} of {summary.limits.seats}{' '}
                seats used
              </CardDescription>
            </div>
            {canManage ? (
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus />
                Invite members
              </Button>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                Only owners and admins can manage members.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(value as typeof tab)
                setPage(0)
              }}
            >
              <TabsList variant="line" className="gap-5">
                <TabsTrigger value="members">
                  Members
                  <span className="text-muted-foreground tabular-nums">
                    {active.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="invitations">
                  Invitations
                  <span className="text-muted-foreground tabular-nums">
                    {invited.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <InputGroup className="min-w-0 flex-1 sm:w-56">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label="Search members"
                  placeholder="Search members"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(0)
                  }}
                />
              </InputGroup>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as typeof roleFilter)
                  setPage(0)
                }}
              >
                <SelectTrigger aria-label="Filter by role" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {orgRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {visible.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {tab === 'members' ? <Search /> : <MailPlus />}
                </EmptyMedia>
                <EmptyTitle>
                  {source.length === 0 && tab === 'invitations'
                    ? 'No pending invitations'
                    : 'No matching members'}
                </EmptyTitle>
                <EmptyDescription>
                  {source.length === 0 && tab === 'invitations'
                    ? 'People you invite show up here until they accept.'
                    : 'Try a different name, email or role.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5">
                    {tab === 'members' ? 'Member' : 'Invitee'}
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>{tab === 'members' ? 'Joined' : 'Sent'}</TableHead>
                  <TableHead>
                    {tab === 'members' ? 'Last active' : 'Status'}
                  </TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <MemberAvatar member={member} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {member.name}
                            {member.you && (
                              <span className="font-normal text-muted-foreground">
                                {' '}
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canEdit(member) ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            changeRole(member, value as OrgRole)
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            aria-label={`Role for ${member.name}`}
                            className="w-28"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assignableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.status === 'invited' ? (
                        <span className="inline-flex items-center gap-1.5 text-warning">
                          <span className="size-1.5 rounded-full bg-warning" />
                          Pending
                        </span>
                      ) : member.lastActive === 'Active now' ? (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <span className="size-1.5 rounded-full bg-success" />
                          Active now
                        </span>
                      ) : (
                        member.lastActive
                      )}
                    </TableCell>
                    <TableCell className="pr-3 text-right">
                      {canEdit(member) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${member.name}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.status === 'invited' ? (
                              <>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    toast.success(
                                      `Invitation resent to ${member.email}.`,
                                    )
                                  }
                                >
                                  <Send />
                                  Resend invitation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => remove(member)}
                                >
                                  <X />
                                  Revoke invitation
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                {member.role !== 'Admin' && (
                                  <DropdownMenuItem
                                    onSelect={() => changeRole(member, 'Admin')}
                                  >
                                    <ShieldCheck />
                                    Make admin
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onSelect={() =>
                                    toast.info(
                                      `Email ${member.email} directly in this demo.`,
                                    )
                                  }
                                >
                                  <Send />
                                  Send message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => setRemoving(member)}
                                >
                                  <UserMinus />
                                  Remove from organization
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Showing {currentPage * PAGE_SIZE + 1}–
              {Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE)} of{' '}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="px-2 tabular-nums">
                {currentPage + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card size="flush" className="self-start">
        <CardHeader className="border-b [--card-section:--spacing(3.5)]">
          <CardTitle>Roles</CardTitle>
          <CardDescription>What each role can do.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <dl className="divide-y">
            {orgRoles.map((role) => (
              <div key={role} className="grid gap-1.5 px-5 py-3">
                <dt className="flex items-center justify-between gap-2">
                  <RoleBadge role={role} />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {active.filter((member) => member.role === role).length}
                  </span>
                </dt>
                <dd className="text-xs text-muted-foreground">
                  {orgRoleDescriptions[role]}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <InviteMembersDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        org={org}
        existingEmails={members.map((member) => member.email)}
        seatsLeft={seatsLeft}
        onInvite={invite}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to every project in {org.name} right away. Their
              training runs and models stay in the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => removing && remove(removing)}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
