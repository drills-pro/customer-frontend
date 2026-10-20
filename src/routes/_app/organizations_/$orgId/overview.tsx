import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Grid,
  Link,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toaster } from '@/components/toaster'

import {
  OrgMark,
  MemberAvatar,
  RoleBadge,
} from '@/features/organizations/components/org-ui'
import { plural } from '@/features/organizations/utils'
import { ProjectMark } from '@/features/projects/components/project-ui'
import { EmptyNotice } from '@/components/shared/empty-notice'
import { SectionAction, SectionCard } from '@/components/shared/section-card'
import { ToneBadge } from '@/components/shared/tone-badge'
import { CardLoading } from '@/components/shared/query-states'
import { useProjects } from '@/features/projects/queries'
import { useOrgDetail } from '../-components/org-context'

export const Route = createFileRoute('/_app/organizations_/$orgId/overview')({
  component: OrgOverview,
})

function OrgOverview() {
  const { org, members, summary, canManage } = useOrgDetail()
  const projectsQuery = useProjects(org.id)
  const projects = [...(projectsQuery.data ?? [])].sort(
    (left, right) => right.updatedAt - left.updatedAt,
  )
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
    <Grid gap="5">
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="4">
        {stats.map((stat) => (
          <Card.Root key={stat.label} variant="outline">
            <Flex align="flex-start" justify="space-between" gap="3" p="5">
              <Box minW="0">
                <Text textStyle="body-sm" color="fg.muted">
                  {stat.label}
                </Text>
                <Text
                  mt="1"
                  fontSize="3xl"
                  fontWeight="semibold"
                  letterSpacing="tight"
                  fontVariantNumeric="tabular-nums"
                  lineHeight="short"
                >
                  {stat.value}
                </Text>
                <Text mt="1" fontSize="xs" color="fg.muted">
                  {stat.hint}
                </Text>
              </Box>
              <Center
                aria-hidden="true"
                boxSize="9"
                flexShrink={0}
                rounded="l2"
                bg="brand.subtle"
                color="brand.fg"
              >
                <stat.icon size={16} />
              </Center>
            </Flex>
          </Card.Root>
        ))}
      </SimpleGrid>

      <Grid minW="0" gap="5" templateColumns={{ lg: 'minmax(0, 1fr) 360px' }}>
        <Grid minW="0" alignContent="start" gap="5">
          <SectionCard
            title={<Counted label="Projects" count={projects.length} />}
            description="Most recently updated first."
            action={
              <SectionAction asChild gap="1">
                <RouterLink to="/projects">
                  All projects
                  <ArrowRight />
                </RouterLink>
              </SectionAction>
            }
          >
            {projectsQuery.isPending ? (
              <CardLoading />
            ) : projects.length === 0 ? (
              <EmptyNotice
                py="10"
                icon={<FolderKanban />}
                title="No projects yet"
                description={`Switch to ${org.name} and create a project to start training models.`}
              />
            ) : (
              <Stack as="ul" gap="0">
                {projects.slice(0, 6).map((project) => (
                  <Box
                    as="li"
                    key={project.id}
                    borderTopWidth="1px"
                    borderColor="border"
                    _first={{ borderTopWidth: '0' }}
                  >
                    <Link
                      asChild
                      display="flex"
                      alignItems="center"
                      gap="3"
                      px="5"
                      py="3"
                      color="fg"
                      textDecoration="none"
                      _hover={{ bg: 'bg.subtle', textDecoration: 'none' }}
                    >
                      <RouterLink
                        to="/projects/$projectId/overview"
                        params={{ projectId: project.id }}
                      >
                        <ProjectMark project={project} boxSize="8" />
                        <Box as="span" minW="0" flex="1">
                          <Text
                            as="span"
                            display="block"
                            truncate
                            fontSize="13px"
                            fontWeight="medium"
                          >
                            {project.name}
                          </Text>
                          <Text
                            as="span"
                            display="block"
                            truncate
                            fontSize="xs"
                            color="fg.muted"
                          >
                            {project.task} · {plural(project.models, 'model')}
                          </Text>
                        </Box>
                        <ToneBadge
                          tone={
                            project.status === 'Active'
                              ? 'success'
                              : project.status === 'Draft'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {project.status}
                        </ToneBadge>
                        <Text
                          as="span"
                          display={{ base: 'none', sm: 'block' }}
                          w="16"
                          textAlign="end"
                          fontSize="xs"
                          color="fg.muted"
                        >
                          {project.updated}
                        </Text>
                      </RouterLink>
                    </Link>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard title="About">
            <Flex align="flex-start" gap="3" p="5">
              <OrgMark org={org} boxSize="9" />
              <Box minW="0" textStyle="body-sm">
                <Text>
                  {org.description || (
                    <Text as="span" color="fg.muted">
                      No description yet.
                    </Text>
                  )}
                </Text>
                {canManage && (
                  <SectionAction asChild mt="2">
                    <RouterLink
                      to="/organizations/$orgId/settings"
                      params={{ orgId: org.id }}
                    >
                      Edit organization details
                    </RouterLink>
                  </SectionAction>
                )}
              </Box>
            </Flex>
          </SectionCard>
        </Grid>

        <Grid minW="0" alignContent="start" gap="5">
          <SectionCard
            title="Plan & usage"
            description={`${org.plan} plan · ${limits.price}`}
          >
            <Stack gap="4" p="5">
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
                <Flex
                  align="flex-start"
                  gap="3"
                  rounded="l2"
                  bg="brand.subtle"
                  p="3"
                >
                  <Box mt="0.5" flexShrink={0} color="brand.fg">
                    <Sparkles size={16} />
                  </Box>
                  <Box minW="0" fontSize="xs">
                    <Text fontWeight="medium" color="brand.fg">
                      Need more room?
                    </Text>
                    <Text mt="0.5" color="fg.muted">
                      {org.plan === 'Free'
                        ? 'Team adds 30 seats and 2,000 GPU credits a month.'
                        : 'Enterprise adds SSO, audit logs and dedicated GPUs.'}
                    </Text>
                    <Button
                      variant="solid"
                      size="xs"
                      mt="2"
                      onClick={() =>
                        toaster.create({
                          type: 'info',
                          title:
                            'Plan upgrades are not available in this demo.',
                        })
                      }
                    >
                      Upgrade plan
                    </Button>
                  </Box>
                </Flex>
              )}
            </Stack>
          </SectionCard>

          <SectionCard
            title={<Counted label="Members" count={activeMembers.length} />}
            action={
              <SectionAction asChild gap="1">
                <RouterLink
                  to="/organizations/$orgId/members"
                  params={{ orgId: org.id }}
                >
                  Manage
                  <ArrowRight />
                </RouterLink>
              </SectionAction>
            }
          >
            <Stack as="ul" gap="0">
              {activeMembers.slice(0, 5).map((member) => (
                <Flex
                  as="li"
                  key={member.id}
                  align="center"
                  gap="3"
                  px="5"
                  py="2.5"
                  borderTopWidth="1px"
                  borderColor="border"
                  _first={{ borderTopWidth: '0' }}
                >
                  <MemberAvatar member={member} boxSize="7" />
                  <Box as="span" minW="0" flex="1">
                    <Text
                      as="span"
                      display="block"
                      truncate
                      fontSize="13px"
                      fontWeight="medium"
                    >
                      {member.name}
                      {member.you && (
                        <Text as="span" fontWeight="normal" color="fg.muted">
                          {' '}
                          (you)
                        </Text>
                      )}
                    </Text>
                    <Text
                      as="span"
                      display="block"
                      truncate
                      fontSize="xs"
                      color="fg.muted"
                    >
                      {member.lastActive}
                    </Text>
                  </Box>
                  <RoleBadge role={member.role} />
                </Flex>
              ))}
            </Stack>
            {activeMembers.length > 5 && (
              <Text
                borderTopWidth="1px"
                borderColor="border"
                px="5"
                py="2.5"
                fontSize="xs"
                color="fg.muted"
              >
                and {plural(activeMembers.length - 5, 'more member')}
              </Text>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Grid>
  )
}

/** A section title with its count in muted digits beside it. */
function Counted({ label, count }: { label: string; count: number }) {
  return (
    <>
      {label}{' '}
      <Text
        as="span"
        fontWeight="normal"
        color="fg.muted"
        fontVariantNumeric="tabular-nums"
      >
        {count}
      </Text>
    </>
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
    <Box>
      <Flex
        mb="1.5"
        align="baseline"
        justify="space-between"
        gap="2"
        fontSize="xs"
      >
        <Text as="span" fontWeight="medium">
          {label}
        </Text>
        <Text as="span" color="fg.muted" fontVariantNumeric="tabular-nums">
          <Text
            as="span"
            fontWeight={percent >= 90 ? 'semibold' : undefined}
            color={percent >= 90 ? 'fg.warning' : 'fg'}
          >
            {used.toLocaleString('en-US')}
          </Text>{' '}
          / {limit.toLocaleString('en-US')}
        </Text>
      </Flex>
      <Progress.Root size="xs" value={percent}>
        <Progress.Track aria-label={`${label} used`}>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Box>
  )
}
