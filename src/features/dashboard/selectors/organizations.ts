import type {
  DashboardPreferences,
  OrgMember,
  Organization,
} from '../domain/types'
import {
  currentUserMember,
  orgCreditsUsed,
  orgInvitations,
  planDetails,
  seedOrgMembers,
} from '../data/organizations'
import { allProjects } from './projects'
import { orgDeployments } from './deployments'
import { orgTrainingRuns } from './training-runs'

/** The starting member list: seeded rows, or just you for a new org. */
export function initialMembers(org: Organization): OrgMember[] {
  return (
    seedOrgMembers[org.id] ?? [
      currentUserMember(org.id, org.yourRole, `${org.slug}.org`, org.createdAt),
    ]
  )
}

export function pendingInvitations(preferences: DashboardPreferences) {
  return orgInvitations.filter(
    (invite) =>
      !preferences.declinedInvitations.includes(invite.id) &&
      !preferences.createdOrganizations.some(
        (org) => org.id === invite.organization.id,
      ),
  )
}

export type OrgSummary = {
  projects: number
  members: number
  invited: number
  runningTrainings: number
  deployments: number
  creditsUsed: number
  limits: (typeof planDetails)[keyof typeof planDetails]
}

export function orgSummary(
  org: Organization,
  members: OrgMember[],
  preferences: DashboardPreferences,
): OrgSummary {
  return {
    projects: allProjects(preferences).filter((item) => item.orgId === org.id)
      .length,
    members: members.filter((member) => member.status === 'active').length,
    invited: members.filter((member) => member.status === 'invited').length,
    runningTrainings: orgTrainingRuns(preferences, org.id).filter(
      (run) => run.status === 'Running',
    ).length,
    deployments: orgDeployments(preferences, org.id).length,
    creditsUsed: orgCreditsUsed[org.id] ?? 0,
    limits: planDetails[org.plan],
  }
}
