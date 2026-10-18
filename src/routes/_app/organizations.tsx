import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRightLeft, Building2, Mail, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import {
  OrgMark,
  PlanBadge,
  RoleBadge,
} from '@/features/organizations/components/org-ui'
import { plural } from '@/features/organizations/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { useDashboardLayout } from '@/features/dashboard/context'
import type {
  OrgInvitation,
  OrgSummary,
  Organization,
} from '@/features/dashboard/domain/types'
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useInvitations,
} from '@/features/organizations/queries'
import { PageHeader } from './account/-components'

export const Route = createFileRoute('/_app/organizations')({
  component: OrganizationsPage,
  staticData: {
    breadcrumb: () => ({
      items: [
        {
          id: 'organizations',
          label: 'Organizations',
          link: { to: '/organizations' },
        },
      ],
    }),
  },
})

function OrganizationsPage() {
  const {
    org: currentOrg,
    organizations,
    orgSummaries,
    switchOrganization,
    openCreateOrganization,
  } = useDashboardLayout()
  const [query, setQuery] = React.useState('')
  const invitations = useInvitations().data ?? []
  const accept = useAcceptInvitation()
  const decline = useDeclineInvitation()
  const answering = accept.isPending || decline.isPending

  function answer(invite: OrgInvitation, accepted: boolean) {
    const { name } = invite.organization
    if (accepted) {
      accept.mutate(invite.id, {
        onSuccess: () => toast.success(`You joined ${name}.`),
      })
    } else {
      decline.mutate(invite.id, {
        onSuccess: () => toast.info(`Declined the invitation to ${name}.`),
      })
    }
  }

  const normalized = query.trim().toLowerCase()
  const visible = organizations.filter(
    (org) =>
      !normalized ||
      org.name.toLowerCase().includes(normalized) ||
      org.slug.includes(normalized),
  )

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] flex-1 p-4 sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Organizations"
          description={`You belong to ${plural(organizations.length, 'organization')}. Switch between them or manage who has access.`}
        />
        <Button size="lg" className="px-3.5" onClick={openCreateOrganization}>
          <Plus />
          Create organization
        </Button>
      </div>

      {invitations.map((invite) => (
        <Card key={invite.id} size="flush" className="mb-5 ring-primary/30">
          <CardContent className="flex flex-wrap items-center gap-4 bg-primary-muted/50 p-4">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary"
            >
              <Mail className="size-4" />
            </span>
            <div className="mr-auto min-w-0 basis-64 grow">
              <p className="text-[13px] font-medium">
                {invite.invitedBy} invited you to join{' '}
                {invite.organization.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {invite.organization.plan} plan · joining as{' '}
                {invite.role.toLowerCase()} · {invite.organization.description}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={answering}
                onClick={() => answer(invite, false)}
              >
                Decline
              </Button>
              <Button disabled={answering} onClick={() => answer(invite, true)}>
                Accept invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <InputGroup className="mb-5 h-9 max-w-sm bg-card">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search organizations"
          placeholder="Search organizations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </InputGroup>

      {visible.length === 0 ? (
        <Card>
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>No organizations match “{query.trim()}”</EmptyTitle>
              <EmptyDescription>
                Check the spelling, or create a new organization.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((org) => (
            <li key={org.id} className="min-w-0">
              <OrgCard
                org={org}
                summary={orgSummaries[org.id]}
                current={org.id === currentOrg.id}
                onSwitch={() => {
                  switchOrganization(org.id)
                  toast.success(`Switched to ${org.name}.`)
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function OrgCard({
  org,
  summary,
  current,
  onSwitch,
}: {
  org: Organization
  summary: OrgSummary
  current: boolean
  onSwitch: () => void
}) {
  const creditsPercent = Math.min(
    100,
    Math.round((summary.creditsUsed / summary.limits.credits) * 100),
  )

  return (
    <Card
      size="flush"
      className={`h-full ${current ? 'ring-2 ring-primary' : ''}`}
    >
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-start gap-3">
          <OrgMark org={org} className="size-11 rounded-xl text-base" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                to="/organizations/$orgId/overview"
                params={{ orgId: org.id }}
                className="truncate font-semibold outline-hidden hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {org.name}
              </Link>
              {current && <Badge variant="success">Current</Badge>}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              drills.ai/{org.slug}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <PlanBadge plan={org.plan} />
              <RoleBadge role={org.yourRole} />
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center">
          {[
            ['Projects', summary.projects],
            ['Members', summary.members],
            ['Running', summary.runningTrainings],
          ].map(([label, value]) => (
            <div key={label}>
              <dd className="text-lg font-semibold tabular-nums">{value}</dd>
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>

        <div>
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>GPU credits</span>
            <span className="text-foreground tabular-nums">
              {summary.creditsUsed.toLocaleString('en-US')} /{' '}
              {summary.limits.credits.toLocaleString('en-US')}
            </span>
          </div>
          <Progress
            value={creditsPercent}
            aria-label={`${org.name} GPU credits used`}
          />
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex gap-2 border-t px-5 py-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/organizations/$orgId/overview" params={{ orgId: org.id }}>
            Open
          </Link>
        </Button>
        {!current && (
          <Button variant="secondary" className="flex-1" onClick={onSwitch}>
            <ArrowRightLeft />
            Switch
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
