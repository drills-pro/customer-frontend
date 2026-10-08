import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ArrowRightLeft, Building2 } from 'lucide-react'

import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import {
  OrgMark,
  PlanBadge,
  RoleBadge,
} from '@/features/organizations/components/org-ui'
import { formatDate } from '@/features/organizations/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboardLayout } from '@/features/dashboard/context'
import { findOrganization, orgSummary } from '@/features/dashboard'
import { OrgDetailContext } from '../-components/org-context'

export const Route = createFileRoute('/_app/organizations_/$orgId')({
  component: OrgDetailLayout,
  staticData: {
    breadcrumb: ({ params, preferences }) => {
      const organization = findOrganization(params.orgId, preferences)
      if (!organization) return null
      return {
        items: [
          {
            id: 'organizations',
            label: 'Organizations',
            link: { to: '/organizations' },
          },
          {
            id: organization.id,
            label: organization.name,
            link: {
              to: '/organizations/$orgId/overview',
              params: { orgId: organization.id },
            },
          },
        ],
        data: { organization },
      }
    },
  },
})

const sections = [
  { label: 'Overview', to: '/organizations/$orgId/overview' },
  { label: 'Members', to: '/organizations/$orgId/members' },
  { label: 'Settings', to: '/organizations/$orgId/settings' },
] as const

// The same line-tab treatment the project sections use.
const sectionTabClass =
  'shrink-0 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-1 py-3 text-sm font-medium text-muted-foreground shadow-none transition-colors outline-hidden hover:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active]:border-b-primary data-[active]:text-primary'

function OrgDetailLayout() {
  const { orgId } = Route.useParams()
  const {
    preferences,
    hydrated,
    org: currentOrg,
    switchOrganization,
    membersOf,
    updateMembers,
  } = useDashboardLayout()

  if (!hydrated) {
    return <main id="dashboard-main" className="min-h-96 flex-1" />
  }

  const org = findOrganization(orgId, preferences)
  if (!org) return <OrgNotFound orgId={orgId} />

  const members = membersOf(org)
  const summary = orgSummary(org, members, preferences)
  const isCurrent = currentOrg.id === org.id
  const canManage = org.yourRole === 'Owner' || org.yourRole === 'Admin'

  return (
    <OrgDetailContext.Provider
      value={{
        org,
        members,
        summary,
        isCurrent,
        canManage,
        updateMembers: (update) => updateMembers(org, update),
      }}
    >
      <main
        id="dashboard-main"
        className="mx-auto w-full max-w-[1448px] flex-1 p-4 sm:p-6"
      >
        <RouteBreadcrumbs className="mb-3" />

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <OrgMark org={org} className="size-12 rounded-xl text-lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate">{org.name}</h1>
                <PlanBadge plan={org.plan} />
                {isCurrent && (
                  <Badge variant="success">
                    <span className="size-1.5 rounded-full bg-current" />
                    Current
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span>drills.ai/{org.slug}</span>
                <span aria-hidden="true">·</span>
                <span>Created {formatDate(org.createdAt)}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  You're <RoleBadge role={org.yourRole} />
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {!isCurrent && (
              <Button
                size="lg"
                variant="outline"
                className="px-3.5"
                onClick={() => switchOrganization(org.id)}
              >
                <ArrowRightLeft />
                Switch to this organization
              </Button>
            )}
          </div>
        </div>

        <nav
          aria-label="Organization sections"
          className="mb-5 flex items-center gap-6 overflow-x-auto border-b border-border whitespace-nowrap"
        >
          {sections.map((section) => (
            <Link
              key={section.label}
              to={section.to}
              params={{ orgId: org.id }}
              activeProps={{ 'data-active': 'true' }}
              className={sectionTabClass}
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <Outlet />
      </main>
    </OrgDetailContext.Provider>
  )
}

function OrgNotFound({ orgId }: { orgId: string }) {
  return (
    <main
      id="dashboard-main"
      className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] flex-1 items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center py-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary-muted text-primary">
            <Building2 />
          </span>
          <h1 className="mt-4 text-xl">Organization not found</h1>
          <p className="mt-2 text-muted-foreground">
            We could not find an organization with the ID “{orgId}”, or you are
            no longer a member.
          </p>
          <Button asChild className="mt-5">
            <Link to="/organizations">View all organizations</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
