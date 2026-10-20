import { Box, HStack, Link, Table, Text } from '@chakra-ui/react'
import { Link as RouterLink } from '@tanstack/react-router'

import type { Project } from '@/features/dashboard/data'
import { ProjectMark } from '@/features/projects/components/project-ui'

import { ProjectMenu } from './project-menu'

export function ProjectsTable({ projects }: { projects: Array<Project> }) {
  return (
    <Table.ScrollArea
      rounded="l3"
      borderWidth="1px"
      borderColor="border"
      bg="surface-raised"
    >
      <Table.Root minW="780px" variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Project</Table.ColumnHeader>
            <Table.ColumnHeader>Task type</Table.ColumnHeader>
            <Table.ColumnHeader>Datasets</Table.ColumnHeader>
            <Table.ColumnHeader>Models</Table.ColumnHeader>
            <Table.ColumnHeader>Deployed</Table.ColumnHeader>
            <Table.ColumnHeader>Updated</Table.ColumnHeader>
            <Table.ColumnHeader w="12" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {projects.map((project) => (
            <Table.Row key={project.id}>
              <Table.Cell>
                <HStack gap="3">
                  <ProjectMark project={project} />
                  <Box minW="0">
                    <Link
                      asChild
                      color="fg"
                      fontWeight="semibold"
                      _hover={{ color: 'brand-text' }}
                    >
                      <RouterLink
                        to="/projects/$projectId/overview"
                        params={{ projectId: project.id }}
                      >
                        {project.name}
                      </RouterLink>
                    </Link>
                    <Text maxW="72" truncate fontSize="xs" color="fg.muted">
                      {project.description}
                    </Text>
                  </Box>
                </HStack>
              </Table.Cell>
              <Table.Cell>{project.task}</Table.Cell>
              <Table.Cell>{project.datasets}</Table.Cell>
              <Table.Cell>{project.models}</Table.Cell>
              <Table.Cell>{project.deployed}</Table.Cell>
              <Table.Cell color="fg.muted">{project.updated}</Table.Cell>
              <Table.Cell>
                <ProjectMenu project={project} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
