import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Heading,
  HStack,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ArrowRightLeft, Building2 } from 'lucide-react'

import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { SectionTab, SectionTabs } from '@/components/shared/section-tabs'
import { ToneBadge } from '@/components/shared/tone-badge'
import {
  OrgMark,
  PlanBadge,
  RoleBadge,
} from '@/features/organizations/components/org-ui'
import { formatDate } from '@/features/organizations/utils'
import { PageError, PageLoading } from '@/components/shared/query-states'
import { useDashboardLayout } from '@/features/dashboard/context'
import { useOrgMembers } from '@/features/organizations/queries'
import { OrgDetailContext } from '../-components/org-context'

export const Route = createFileRoute('/_app/organizations_/$orgId')({
  component: OrgDetailLayout,
  staticData: {
    breadcrumb: ({ params, organizations }) => {
      const organization = organizations.find(
        (item) => item.id === params.orgId,
      )
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

function OrgDetailLayout() {
  const { orgId } = Route.useParams()
  const {
    organizations,
    orgSummaries,
    org: currentOrg,
    switchOrganization,
  } = useDashboardLayout()
  const org = organizations.find((item) => item.id === orgId)
  const membersQuery = useOrgMembers(orgId, { enabled: Boolean(org) })

  if (!org) return <OrgNotFound orgId={orgId} />
  if (membersQuery.error) {
    return (
      <PageError
        title="Could not load this organization"
        error={membersQuery.error}
        onRetry={() => void membersQuery.refetch()}
      />
    )
  }
  if (!membersQuery.data) return <PageLoading />

  const members = membersQuery.data
  const summary = orgSummaries[org.id]
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
      }}
    >
      <Box
        as="main"
        id="dashboard-main"
        mx="auto"
        w="full"
        maxW="1448px"
        flex="1"
        p={{ base: '4', sm: '6' }}
      >
        <RouteBreadcrumbs mb="3" />

        <Flex
          mb="5"
          direction={{ base: 'column', sm: 'row' }}
          align={{ sm: 'center' }}
          justify={{ sm: 'space-between' }}
          gap="4"
        >
          <Flex minW="0" align="center" gap="3.5">
            <OrgMark org={org} boxSize="12" rounded="l3" fontSize="lg" />
            <Box minW="0">
              <HStack wrap="wrap" gap="2">
                <Heading
                  as="h1"
                  truncate
                  fontSize="2xl"
                  fontWeight="semibold"
                  letterSpacing="-0.65px"
                  lineHeight="1.35"
                >
                  {org.name}
                </Heading>
                <PlanBadge plan={org.plan} />
                {isCurrent && (
                  <ToneBadge tone="success" dot>
                    Current
                  </ToneBadge>
                )}
              </HStack>
              <Flex
                mt="0.5"
                wrap="wrap"
                align="center"
                columnGap="2"
                textStyle="body-sm"
                color="fg.muted"
              >
                <span>drills.ai/{org.slug}</span>
                <span aria-hidden="true">·</span>
                <span>Created {formatDate(org.createdAt)}</span>
                <span aria-hidden="true">·</span>
                <HStack as="span" gap="1.5">
                  You're <RoleBadge role={org.yourRole} />
                </HStack>
              </Flex>
            </Box>
          </Flex>

          <HStack wrap="wrap" gap="2" justify={{ sm: 'flex-end' }}>
            {!isCurrent && (
              <Button
                size="sm"
                variant="outline"
                px="3.5"
                onClick={() => switchOrganization(org.id)}
              >
                <ArrowRightLeft />
                Switch to this organization
              </Button>
            )}
          </HStack>
        </Flex>

        <SectionTabs aria-label="Organization sections" mb="5">
          {sections.map((section) => (
            <SectionTab key={section.label}>
              <Link
                to={section.to}
                params={{ orgId: org.id }}
                activeProps={{ 'data-active': 'true' }}
              >
                {section.label}
              </Link>
            </SectionTab>
          ))}
        </SectionTabs>

        <Outlet />
      </Box>
    </OrgDetailContext.Provider>
  )
}

function OrgNotFound({ orgId }: { orgId: string }) {
  return (
    <Center
      as="main"
      id="dashboard-main"
      mx="auto"
      minH="60vh"
      w="full"
      maxW="1440px"
      flex="1"
      p={{ base: '4', sm: '6', lg: '8' }}
    >
      <Card.Root variant="outline" w="full" maxW="md" textAlign="center">
        <Card.Body alignItems="center" py="8">
          <Center
            boxSize="12"
            rounded="full"
            bg="brand.subtle"
            color="brand.fg"
          >
            <Building2 />
          </Center>
          <Heading as="h1" mt="4" fontSize="xl" fontWeight="semibold">
            Organization not found
          </Heading>
          <Text mt="2" color="fg.muted">
            We could not find an organization with the ID “{orgId}”, or you are
            no longer a member.
          </Text>
          <Button asChild variant="solid" size="sm" mt="5">
            <Link to="/organizations">View all organizations</Link>
          </Button>
        </Card.Body>
      </Card.Root>
    </Center>
  )
}
