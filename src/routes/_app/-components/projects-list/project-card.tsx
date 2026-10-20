import { Box, Card, Flex, HStack, Link, Text } from '@chakra-ui/react'
import { Link as RouterLink } from '@tanstack/react-router'

import type { Project } from '@/features/dashboard/data'
import {
  Collaborators,
  ProjectMark,
} from '@/features/projects/components/project-ui'

import { ProjectMenu } from './project-menu'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card.Root
      variant="outline"
      overflow="hidden"
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: 'md' }}
    >
      <Flex align="flex-start" gap="3" px="5" pt="5">
        <ProjectMark project={project} />
        <Box flex="1" minW="0">
          <Card.Title as="h2" textStyle="body" fontWeight="semibold">
            <Link
              asChild
              maxW="full"
              color="fg"
              fontWeight="semibold"
              _hover={{ color: 'brand-text', textDecoration: 'underline' }}
            >
              <RouterLink
                to="/projects/$projectId/overview"
                params={{ projectId: project.id }}
              >
                <Text as="span" truncate>
                  {project.name}
                </Text>
              </RouterLink>
            </Link>
          </Card.Title>
          <Text fontSize="xs" color="fg.muted">
            {project.task}
          </Text>
        </Box>
        <ProjectMenu project={project} />
      </Flex>
      <Box px="5" pt="3">
        <Text minH="10" textStyle="body-sm" color="fg.muted">
          {project.description}
        </Text>
        <HStack
          mt="4"
          wrap="wrap"
          columnGap="4"
          rowGap="1"
          fontSize="xs"
          color="fg.muted"
        >
          {(
            [
              [project.datasets, 'datasets'],
              [project.models, 'models'],
              [project.deployed, 'deployed'],
            ] as const
          ).map(([count, noun]) => (
            <span key={noun}>
              <Text as="strong" fontWeight="semibold" color="fg">
                {count}
              </Text>{' '}
              {noun}
            </span>
          ))}
        </HStack>
      </Box>
      <Flex
        mt="4"
        align="center"
        justify="space-between"
        borderTopWidth="1px"
        borderColor="border"
        px="5"
        pt="3"
        pb="5"
      >
        <Collaborators />
        <Text fontSize="xs" color="fg.muted">
          Updated {project.updated}
        </Text>
      </Flex>
    </Card.Root>
  )
}
