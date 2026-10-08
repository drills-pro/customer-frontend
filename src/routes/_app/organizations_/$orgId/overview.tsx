import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  OrgMark,
  MemberAvatar,
  RoleBadge,
} from '@/features/organizations/components/org-ui'
import { plural } from '@/features/organizations/utils'
import { ProjectMark } from '@/features/projects/components/project-ui'
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { useDashboardLayout } from '@/features/dashboard/context'
import { allProjects } from '@/features/dashboard'
import { useOrgDetail } from '../-components/org-context'

export const Route = createFileRoute('/_app/organizations_/$orgId/overview')({
  component: OrgOverview,
})

function OrgOverview() {
  const { preferences } = useDashboardLayout()
  const { org, members, summary, canManage } = useOrgDetail()
  const projects = allProjects(preferences)
    .filter((project) => project.orgId === org.id)
    .sort((left, right) => right.updatedAt - left.updatedAt)
  const activeMembers = members.filter((member) => member.status === 'active')
  const { limits } = summary

  const stats: Array<{
    label: string
    value: string
    hint: string
    icon: LucideIcon
  }> = [
    {
      label: 'Projects',
      value: String(summary.projects),
      hint: `of ${limits.projects} on ${org.plan}`,
      icon: FolderKanban,
    },
    {
      label: 'Members',
      value: String(summary.members),
      hint:
        summary.invited > 0
          ? `${plural(summary.invited, 'pending invite')}`
          : `of ${limits.seats} seats`,
      icon: Users,
    },
    {
      label: 'Trainings running',
      value: String(summary.runningTrainings),
      hint: 'across all projects',
      icon: Activity,
    },
    {
      label: 'Deployments',
      value: String(summary.deployments),
      hint: 'endpoints across projects',
      icon: Rocket,
    },
  ]

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="lg">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.hint}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary"
              >
                <stat.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-5">
          <Card size="flush">
            <CardHeader className="border-b [--card-section:--spacing(3.5)]">
              <CardTitle>
                Projects{' '}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {projects.length}
                </span>
              </CardTitle>
              <CardDescription>Most recently updated first.</CardDescription>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/projects">
                    All projects
                    <ArrowRight />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              {projects.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderKanban />
                    </EmptyMedia>
                    <EmptyTitle>No projects yet</EmptyTitle>
                    <EmptyDescription>
                      Switch to {org.name} and create a project to start
                      training models.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="divide-y">
                  {projects.slice(0, 6).map((project) => (
                    <li key={project.id}>
                      <Link
                        to="/projects/$projectId/overview"
                        params={{ projectId: project.id }}
                        className="flex items-center gap-3 px-5 py-3 transition-colors outline-hidden hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        <ProjectMark project={project} className="size-8" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">
                            {project.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {project.task} · {plural(project.models, 'model')}
                          </span>
                        </span>
                        <Badge
                          variant={
                            project.status === 'Active'
                              ? 'success'
                              : project.status === 'Draft'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {project.status}
                        </Badge>
                        <span className="hidden w-16 text-right text-xs text-muted-foreground sm:block">
                          {project.updated}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card size="flush">
            <CardHeader className="border-b [--card-section:--spacing(3.5)]">
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3 p-5">
              <OrgMark org={org} className="size-9" />
              <div className="min-w-0 text-sm">
                <p>
                  {org.description || (
                    <span className="text-muted-foreground">
                      No description yet.
                    </span>
                  )}
                </p>
                {canManage && (
                  <Button asChild variant="link" size="sm" className="mt-2">
                    <Link
                      to="/organizations/$orgId/settings"
                      params={{ orgId: org.id }}
                    >
                      Edit organization details
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-5">
          <Card size="flush">
            <CardHeader className="border-b [--card-section:--spacing(3.5)]">
              <CardTitle>Plan & usage</CardTitle>
              <CardDescription>
                {org.plan} plan · {limits.price}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-5">
              <UsageMeter
                label="GPU credits"
                used={summary.creditsUsed}
                limit={limits.credits}
              />
              <UsageMeter
                label="Seats"
                used={summary.members + summary.invited}
                limit={limits.seats}
              />
              <UsageMeter
                label="Projects"
                used={summary.projects}
                limit={limits.projects}
              />
              {org.plan !== 'Enterprise' && (
                <div className="flex items-start gap-3 rounded-lg bg-primary-muted/70 p-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 text-xs">
                    <p className="font-medium text-primary">Need more room?</p>
                    <p className="mt-0.5 text-primary/80">
                      {org.plan === 'Free'
                        ? 'Team adds 30 seats and 2,000 GPU credits a month.'
                        : 'Enterprise adds SSO, audit logs and dedicated GPUs.'}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        toast.info(
                          'Plan upgrades are not available in this demo.',
                        )
                      }
                    >
                      Upgrade plan
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card size="flush">
            <CardHeader className="border-b [--card-section:--spacing(3.5)]">
              <CardTitle>
                Members{' '}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {activeMembers.length}
                </span>
              </CardTitle>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to="/organizations/$orgId/members"
                    params={{ orgId: org.id }}
                  >
                    Manage
                    <ArrowRight />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {activeMembers.slice(0, 5).map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-5 py-2.5"
                  >
                    <MemberAvatar member={member} className="size-7" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {member.name}
                        {member.you && (
                          <span className="font-normal text-muted-foreground">
                            {' '}
                            (you)
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {member.lastActive}
                      </span>
                    </span>
                    <RoleBadge role={member.role} />
                  </li>
                ))}
              </ul>
              {activeMembers.length > 5 && (
                <p className="border-t px-5 py-2.5 text-xs text-muted-foreground">
                  and {plural(activeMembers.length - 5, 'more member')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const percent = Math.min(100, Math.round((used / limit) * 100))
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          <span
            className={
              percent >= 90 ? 'font-semibold text-warning' : 'text-foreground'
            }
          >
            {used.toLocaleString('en-US')}
          </span>{' '}
          / {limit.toLocaleString('en-US')}
        </span>
      </div>
      <Progress value={percent} aria-label={`${label} used`} />
    </div>
  )
}
