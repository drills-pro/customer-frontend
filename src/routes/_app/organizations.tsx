import * as React from 'react'
import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  HStack,
  Input,
  InputGroup,
  Link,
  Progress,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { ArrowRightLeft, Building2, Mail, Plus, Search } from 'lucide-react'
import { toaster } from '@/components/toaster'

import {
  OrgMark,
  PlanBadge,
  RoleBadge,
} from '@/features/organizations/components/org-ui'
import { plural } from '@/features/organizations/utils'
import { EmptyNotice } from '@/components/shared/empty-notice'
import { ToneBadge } from '@/components/shared/tone-badge'
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
        onSuccess: () =>
          toaster.create({ type: 'success', title: `You joined ${name}.` }),
      })
    } else {
      decline.mutate(invite.id, {
        onSuccess: () =>
          toaster.create({
            type: 'info',
            title: `Declined the invitation to ${name}.`,
          }),
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
    <Box
      as="main"
      id="dashboard-main"
      mx="auto"
      w="full"
      maxW="1448px"
      flex="1"
      p={{ base: '4', sm: '6' }}
    >
      <Flex
        mb="5"
        direction={{ base: 'column', sm: 'row' }}
        align={{ sm: 'flex-end' }}
        justify={{ sm: 'space-between' }}
        gap="4"
      >
        <PageHeader
          title="Organizations"
          description={`You belong to ${plural(organizations.length, 'organization')}. Switch between them or manage who has access.`}
        />
        <Button
          variant="solid"
          size="sm"
          px="3.5"
          onClick={openCreateOrganization}
        >
          <Plus />
          Create organization
        </Button>
      </Flex>

      {invitations.map((invite) => (
        <Card.Root
          key={invite.id}
          variant="outline"
          mb="5"
          overflow="hidden"
          borderColor="brand.border"
        >
          <Flex wrap="wrap" align="center" gap="4" bg="brand.subtle" p="4">
            <Center
              aria-hidden="true"
              boxSize="9"
              flexShrink={0}
              rounded="l2"
              bg="surface-raised"
              color="brand.fg"
            >
              <Mail size={16} />
            </Center>
            <Box me="auto" minW="0" flexBasis="64" flexGrow={1}>
              <Text fontSize="13px" fontWeight="medium">
                {invite.invitedBy} invited you to join{' '}
                {invite.organization.name}
              </Text>
              <Text mt="0.5" fontSize="xs" color="fg.muted">
                {invite.organization.plan} plan · joining as{' '}
                {invite.role.toLowerCase()} · {invite.organization.description}
              </Text>
            </Box>
            <HStack gap="2">
              <Button
                variant="ghost"
                colorPalette="gray"
                size="sm"
                disabled={answering}
                onClick={() => answer(invite, false)}
              >
                Decline
              </Button>
              <Button
                variant="solid"
                size="sm"
                disabled={answering}
                onClick={() => answer(invite, true)}
              >
                Accept invitation
              </Button>
            </HStack>
          </Flex>
        </Card.Root>
      ))}

      <InputGroup
        mb="5"
        maxW="sm"
        startElement={<Search size={16} aria-hidden="true" />}
      >
        <Input
          size="sm"
          bg="surface-raised"
          aria-label="Search organizations"
          placeholder="Search organizations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </InputGroup>

      {visible.length === 0 ? (
        <EmptyNotice
          py="12"
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
          icon={<Building2 />}
          title={`No organizations match “${query.trim()}”`}
          description="Check the spelling, or create a new organization."
        />
      ) : (
        <SimpleGrid as="ul" columns={{ base: 1, md: 2, xl: 3 }} gap="4">
          {visible.map((org) => (
            <Box as="li" key={org.id} minW="0">
              <OrgCard
                org={org}
                summary={orgSummaries[org.id]}
                current={org.id === currentOrg.id}
                onSwitch={() => {
                  switchOrganization(org.id)
                  toaster.create({
                    type: 'success',
                    title: `Switched to ${org.name}.`,
                  })
                }}
              />
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
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
    <Card.Root
      variant="outline"
      h="full"
      overflow="hidden"
      borderWidth={current ? '2px' : '1px'}
      borderColor={current ? 'brand' : 'border'}
    >
      <Box display="grid" gap="4" p="5">
        <Flex align="flex-start" gap="3">
          <OrgMark org={org} boxSize="11" rounded="l3" fontSize="md" />
          <Box minW="0" flex="1">
            <HStack gap="2">
              <Link
                asChild
                truncate
                fontWeight="semibold"
                color="fg"
                _hover={{ color: 'brand-text', textDecoration: 'underline' }}
              >
                <RouterLink
                  to="/organizations/$orgId/overview"
                  params={{ orgId: org.id }}
                >
                  {org.name}
                </RouterLink>
              </Link>
              {current && <ToneBadge tone="success">Current</ToneBadge>}
            </HStack>
            <Text truncate fontSize="xs" color="fg.muted">
              drills.ai/{org.slug}
            </Text>
            <HStack mt="2" wrap="wrap" gap="1.5">
              <PlanBadge plan={org.plan} />
              <RoleBadge role={org.yourRole} />
            </HStack>
          </Box>
        </Flex>

        <SimpleGrid
          as="dl"
          columns={3}
          gap="2"
          rounded="l2"
          bg="bg.muted"
          p="3"
          textAlign="center"
        >
          {[
            ['Projects', summary.projects],
            ['Members', summary.members],
            ['Running', summary.runningTrainings],
          ].map(([label, value]) => (
            <Box key={label}>
              <Box
                as="dd"
                fontSize="lg"
                fontWeight="semibold"
                fontVariantNumeric="tabular-nums"
              >
                {value}
              </Box>
              <Box as="dt" fontSize="11px" color="fg.muted">
                {label}
              </Box>
            </Box>
          ))}
        </SimpleGrid>

        <Box>
          <Flex mb="1.5" justify="space-between" fontSize="xs" color="fg.muted">
            <span>GPU credits</span>
            <Text as="span" color="fg" fontVariantNumeric="tabular-nums">
              {summary.creditsUsed.toLocaleString('en-US')} /{' '}
              {summary.limits.credits.toLocaleString('en-US')}
            </Text>
          </Flex>
          <Progress.Root size="xs" value={creditsPercent}>
            <Progress.Track aria-label={`${org.name} GPU credits used`}>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Box>
      </Box>
      <Flex
        mt="auto"
        gap="2"
        borderTopWidth="1px"
        borderColor="border"
        px="5"
        py="3"
      >
        <Button asChild variant="outline" size="sm" flex="1">
          <RouterLink
            to="/organizations/$orgId/overview"
            params={{ orgId: org.id }}
          >
            Open
          </RouterLink>
        </Button>
        {!current && (
          <Button variant="subtle" size="sm" flex="1" onClick={onSwitch}>
            <ArrowRightLeft />
            Switch
          </Button>
        )}
      </Flex>
    </Card.Root>
  )
}
