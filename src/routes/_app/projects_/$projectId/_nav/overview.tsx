import * as React from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'

import { SectionCard } from '@/components/shared/section-card'
import { ToneBadge } from '@/components/shared/tone-badge'
import { useProjectDetail } from '@/features/dashboard/context'
import { useUpdateProject } from '@/features/projects/queries'
import { useInView } from '@/hooks/use-in-view'
import { unavailable } from '@/lib/unavailable'
import { FactList, serializeReadme } from '../-components/project-overview'
import { ReadmeCard } from '../-components/readme-editor'
import { ResourceUsageCard } from '../-components/resource-usage-card'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/_nav/overview',
)({
  component: ProjectOverviewRoute,
})

function ProjectOverviewRoute() {
  const { project, details, organization } = useProjectDetail()
  const { ref: usageCardRef, inView: usageChartsInView } =
    useInView<HTMLDivElement>()
  const bestModel = details.bestModel
  const updateProject = useUpdateProject(project.id)

  const pipeline = [
    {
      title: 'Data',
      description: `${project.datasets} datasets ready`,
    },
    {
      title: 'Train',
      description: `${details.pipeline.runs} runs · ${details.pipeline.running} running`,
    },
    {
      title: 'Evaluate',
      description: bestModel
        ? `Best ${bestModel.accuracy.toFixed(1)}% acc`
        : 'No evaluations yet',
    },
    {
      title: 'Deploy',
      description: `${project.deployed} live endpoints`,
    },
  ]

  return (
    <>
      <SectionCard title="Pipeline" divided={false} mt="6">
        <Grid
          gap="3"
          px="5"
          pb="5"
          alignItems={{ lg: 'center' }}
          templateColumns={{
            lg: 'minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr)',
          }}
        >
          {pipeline.map((stage, index) => {
            const completed = details.pipeline.completeThrough > index + 1
            return (
              <React.Fragment key={stage.title}>
                <Button
                  variant="outline"
                  minW="0"
                  h="auto"
                  p="3"
                  gap="3"
                  justifyContent="flex-start"
                  whiteSpace="normal"
                  textAlign="start"
                  fontWeight="normal"
                  boxShadow="none"
                  colorPalette="success"
                  bg={completed ? 'colorPalette.subtle' : 'surface-raised'}
                  borderColor={completed ? 'colorPalette.border' : 'border'}
                  _hover={{ borderColor: 'brand-text' }}
                  onClick={() => unavailable(stage.title)}
                >
                  <Center
                    boxSize="8"
                    flexShrink={0}
                    rounded="full"
                    fontSize="xs"
                    fontWeight="semibold"
                    bg={completed ? 'colorPalette.solid' : 'bg.muted'}
                    color={completed ? 'colorPalette.contrast' : 'fg.muted'}
                  >
                    {completed ? (
                      <Icon boxSize="4" asChild>
                        <Check />
                      </Icon>
                    ) : (
                      index + 1
                    )}
                  </Center>
                  <Box minW="0">
                    <Text textStyle="body-sm" fontWeight="medium">
                      {stage.title}
                    </Text>
                    <Text truncate textStyle="body-sm" color="fg.muted">
                      {stage.description}
                    </Text>
                  </Box>
                </Button>
                {index < pipeline.length - 1 && (
                  <Box
                    display={{ base: 'none', lg: 'block' }}
                    color="fg.subtle"
                  >
                    <ArrowRight size={16} />
                  </Box>
                )}
              </React.Fragment>
            )
          })}
        </Grid>
      </SectionCard>

      <Grid
        mt="6"
        alignItems="start"
        gap="6"
        templateColumns={{ xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }}
      >
        <Grid minW="0" gap="6">
          {bestModel ? (
            <SectionCard
              title="Best model"
              action={
                <ToneBadge tone="success" dot>
                  Completed
                </ToneBadge>
              }
            >
              <Flex
                direction={{ base: 'column', lg: 'row' }}
                align={{ lg: 'center' }}
                gap="5"
                p="5"
              >
                <Box minW="44">
                  <Heading as="h3" fontSize="md" fontWeight="semibold">
                    {bestModel.name}
                  </Heading>
                  <Text mt="1" textStyle="body-sm" color="fg.muted">
                    From run {bestModel.run} · {bestModel.updated}
                  </Text>
                </Box>
                <SimpleGrid flex="1" columns={{ base: 2, sm: 4 }} gap="4">
                  {[
                    ['Accuracy', `${bestModel.accuracy.toFixed(1)}%`],
                    ['F1', bestModel.f1.toFixed(3)],
                    ['Latency', bestModel.latency],
                    ['Size', bestModel.size],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Text fontSize="xs" color="fg.muted">
                        {label}
                      </Text>
                      <Text as="strong" fontSize="lg" fontWeight="semibold">
                        {value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
                <Button asChild variant="solid" size="sm">
                  <Link
                    to="/projects/$projectId/models"
                    params={{ projectId: project.id }}
                  >
                    Deploy →
                  </Link>
                </Button>
              </Flex>
            </SectionCard>
          ) : (
            <Card.Root variant="outline">
              <Card.Body
                minH="40"
                alignItems="center"
                justifyContent="center"
                p="6"
                textAlign="center"
              >
                <Heading as="h2" fontSize="md" fontWeight="semibold">
                  No trained models yet
                </Heading>
                <Text mt="1" textStyle="body-sm" color="fg.muted">
                  Add a ready dataset, then start this project's first training
                  run.
                </Text>
                <Button asChild variant="solid" size="sm" mt="4">
                  <Link
                    to="/projects/$projectId/training/new"
                    params={{ projectId: project.id }}
                  >
                    New Training
                  </Link>
                </Button>
              </Card.Body>
            </Card.Root>
          )}

          <ReadmeCard
            readme={
              details.readme && bestModel ? (
                <Stack gap="5" w="full">
                  <HStack wrap="wrap" gap="2">
                    <ToneBadge tone="success" fontFamily="mono">
                      status: production
                    </ToneBadge>
                    <ToneBadge tone="accent" fontFamily="mono">
                      pytorch 2.4
                    </ToneBadge>
                    <ToneBadge tone="warning" fontFamily="mono">
                      acc {bestModel.accuracy.toFixed(1)}%
                    </ToneBadge>
                    <ToneBadge tone="info" fontFamily="mono">
                      {details.region}
                    </ToneBadge>
                  </HStack>

                  <section>
                    <ReadmeHeading>About</ReadmeHeading>
                    <Text pt="2" color="fg.muted">
                      {details.readme.about}
                    </Text>
                  </section>

                  <section>
                    <ReadmeHeading>Model</ReadmeHeading>
                    <Box as="dl" textStyle="body-sm">
                      {[
                        ['Architecture', details.readme.architecture],
                        [
                          'Accuracy / F1',
                          `${bestModel.accuracy.toFixed(1)}% / ${bestModel.f1.toFixed(3)}`,
                        ],
                        ['Latency', `${bestModel.latency} (p50, GPU)`],
                        ['Size', bestModel.size],
                      ].map(([label, value]) => (
                        <SimpleGrid
                          key={label}
                          columns={2}
                          gap="4"
                          py="2"
                          borderTopWidth="1px"
                          borderColor="border"
                          _first={{ borderTopWidth: '0' }}
                        >
                          <Box as="dt" fontWeight="medium">
                            {label}
                          </Box>
                          <Box as="dd" color="fg.muted">
                            {value}
                          </Box>
                        </SimpleGrid>
                      ))}
                    </Box>
                  </section>

                  <section>
                    <ReadmeHeading>Quickstart</ReadmeHeading>
                    <Text py="2" color="fg.muted">
                      Call the live endpoint with a base64-encoded shelf image:
                    </Text>
                    <Box
                      as="pre"
                      overflowX="auto"
                      rounded="l3"
                      bg="night"
                      color="on-night"
                      p="4"
                      fontFamily="mono"
                      fontSize="xs"
                      lineHeight="1.25rem"
                    >
                      <code>{details.readme.quickstart}</code>
                    </Box>
                  </section>

                  <section>
                    <ReadmeHeading>Notes</ReadmeHeading>
                    <Stack as="ul" gap="1" pt="2" color="fg.muted">
                      {details.readme.notes.map((note) => (
                        <li key={note.label}>
                          <Text as="strong" fontWeight="semibold" color="fg">
                            {note.label}:
                          </Text>{' '}
                          {note.text}
                        </li>
                      ))}
                    </Stack>
                  </section>
                </Stack>
              ) : undefined
            }
            initialMarkdown={
              details.readme && bestModel
                ? serializeReadme(details.readme, bestModel, details.region)
                : undefined
            }
            markdown={details.readmeMarkdown}
            onSave={(markdown) =>
              updateProject.mutate({ readme_markdown: markdown })
            }
          />
        </Grid>

        <Grid as="aside" minW="0" gap="6">
          <SectionCard title="Project info" divided={false}>
            <Box px="5" pb="5">
              <FactList
                items={[
                  ['Created', details.created],
                  ['Owner', organization.name],
                  ['Task', project.task],
                  ['Framework', details.framework],
                  ['Region', details.region],
                  ['Visibility', details.visibility],
                ]}
              />
            </Box>
          </SectionCard>

          <ResourceUsageCard ref={usageCardRef} inView={usageChartsInView} />

          <SectionCard title="Team" divided={false}>
            <Stack gap="4" px="5" pb="5">
              {details.team.map((member) => (
                <HStack key={member.name} gap="3">
                  <Avatar.Root
                    boxSize="9"
                    borderWidth="0"
                    color="white"
                    // The member's own color, from the API.
                    bg={member.color}
                  >
                    <Avatar.Fallback fontSize="xs">
                      {member.initials}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <Box minW="0">
                    <Text textStyle="body-sm" fontWeight="medium">
                      {member.name}
                    </Text>
                    <Text textStyle="body-sm" color="fg.muted">
                      {member.role}
                    </Text>
                  </Box>
                </HStack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

/** A section heading in the generated README summary. */
function ReadmeHeading({ children }: { children: React.ReactNode }) {
  return (
    <Heading
      as="h3"
      pb="2"
      borderBottomWidth="1px"
      borderColor="border"
      fontSize="sm"
      fontWeight="semibold"
    >
      {children}
    </Heading>
  )
}
