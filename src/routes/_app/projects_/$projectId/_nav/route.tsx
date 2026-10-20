import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Text,
} from '@chakra-ui/react'
import {
  createFileRoute,
  Link as RouterLink,
  Outlet,
} from '@tanstack/react-router'
import { EllipsisVertical, Plus } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { SectionTab, SectionTabs } from '@/components/shared/section-tabs'
import { useProjectDetail } from '@/features/dashboard/context'
import { unavailable } from '@/lib/unavailable'
import {
  projectSectionLink,
  projectSections,
} from '@/features/dashboard/navigation'
import {
  Collaborators,
  ProjectMark,
} from '@/features/projects/components/project-ui'

export const Route = createFileRoute('/_app/projects_/$projectId/_nav')({
  component: ProjectNavLayout,
})

function ProjectNavLayout() {
  const { project, details } = useProjectDetail()

  async function shareProject() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toaster.create({
        type: 'success',
        title: 'Project link copied to clipboard.',
      })
    } catch {
      toaster.create({
        type: 'info',
        title: 'Select the address bar to copy this project link.',
      })
    }
  }

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
      <RouteBreadcrumbs mb="3" />

      <Flex
        mb="5"
        direction={{ base: 'column', sm: 'row' }}
        align={{ sm: 'center' }}
        justify={{ sm: 'space-between' }}
        gap="4"
      >
        <Flex minW="0" align="flex-start" gap="3">
          <ProjectMark project={project} boxSize="10" />
          <Box minW="0">
            <HStack wrap="wrap" gap="2">
              <Heading
                as="h1"
                fontSize="2xl"
                fontWeight="semibold"
                letterSpacing="-0.65px"
                lineHeight="1.35"
              >
                {project.name}
              </Heading>
              <Badge colorPalette="gray" variant="subtle">
                {project.task}
              </Badge>
            </HStack>
            <Text textStyle="body-sm" color="fg.muted">
              {project.description}
            </Text>
          </Box>
        </Flex>

        <HStack wrap="wrap" gap="2" justify={{ sm: 'flex-end' }}>
          <Collaborators team={details.team} overflow={0} me="2" />
          <Button size="sm" variant="outline" px="3.5" onClick={shareProject}>
            Share
          </Button>
          <Button asChild size="sm" variant="solid" px="3.5">
            <RouterLink
              to="/projects/$projectId/training/new"
              params={{ projectId: project.id }}
            >
              <Plus />
              New Training
            </RouterLink>
          </Button>
          <IconButton
            variant="ghost"
            colorPalette="gray"
            size="sm"
            aria-label="More project actions"
            onClick={() => unavailable('More project actions')}
          >
            <EllipsisVertical />
          </IconButton>
        </HStack>
      </Flex>

      <SectionTabs aria-label="Project sections">
        {projectSections.map((section) => (
          <SectionTab key={section}>
            <RouterLink
              to={projectSectionLink(section)}
              params={{ projectId: project.id }}
              activeProps={{ 'data-active': 'true' }}
            >
              {section}
            </RouterLink>
          </SectionTab>
        ))}
      </SectionTabs>

      <Outlet />
    </Box>
  )
}
