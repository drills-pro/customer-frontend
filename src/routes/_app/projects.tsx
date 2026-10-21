import * as React from 'react';
import { Box, Button, Flex, Heading, Link, SimpleGrid, Text } from '@chakra-ui/react';
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { SectionError, SectionLoading } from '@/components/shared/query-states';
import { useTaskTypes } from '@/features/catalog/queries';
import { useDashboardLayout } from '@/features/dashboard/context';
import type { Project } from '@/features/dashboard/data';
import { useProjects } from '@/features/projects/queries';
import { ProjectCard, ProjectFilters, ProjectsTable } from './-components/projects-list';
import type { ProjectFiltersState } from './-components/projects-list';

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage,
});

const defaultProjectFilters: ProjectFiltersState = {
  query: '',
  task: 'all',
  status: 'all',
  sort: 'recent',
  view: 'grid',
};

const statuses: Array<Project['status']> = ['Active', 'Draft', 'Archived'];

function ProjectsPage() {
  const { org } = useDashboardLayout();
  const projectsQuery = useProjects(org.id);
  const taskTypes = (useTaskTypes().data ?? []).map((item) => item.label);
  const [filters, setFilters] = React.useState<ProjectFiltersState>(defaultProjectFilters);
  const updateFilters = (patch: Partial<ProjectFiltersState>) => setFilters((current) => ({ ...current, ...patch }));

  // The header switcher owns the organization: this page lists only its projects.
  const orgProjects = projectsQuery.data ?? [];
  const normalizedQuery = filters.query.trim().toLowerCase();
  const visibleProjects = orgProjects
    .filter(
      (project) =>
        project.name.toLowerCase().includes(normalizedQuery) &&
        (filters.task === 'all' || project.task === filters.task) &&
        (filters.status === 'all' || project.status === filters.status),
    )
    .sort((left, right) => (filters.sort === 'name' ? left.name.localeCompare(right.name) : right.updatedAt - left.updatedAt));

  return (
    <Box as="main" id="dashboard-main" mx="auto" w="full" maxW="1448px" flex="1" p={{ base: '4', sm: '6' }}>
      <Flex mb="6" align="flex-start" justify="space-between" gap="4">
        <Box>
          <Heading as="h1" fontSize="2xl" fontWeight="bold" letterSpacing="tight">
            Projects
          </Heading>
          <Text mt="1" color="fg.muted">
            {projectsQuery.data ? `${orgProjects.length} ${orgProjects.length === 1 ? 'project' : 'projects'} in ${org.name}` : org.name}
          </Text>
        </Box>
        <Button asChild size="sm" variant="solid" px="3.5">
          <RouterLink to="/projects/new">
            <Plus />
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>
              New Project
            </Text>
            <Text as="span" display={{ sm: 'none' }}>
              New
            </Text>
          </RouterLink>
        </Button>
      </Flex>

      <ProjectFilters filters={filters} onFiltersChange={updateFilters} taskTypes={taskTypes} statuses={statuses} />

      {projectsQuery.error ? (
        <SectionError title="Could not load projects" error={projectsQuery.error} onRetry={() => void projectsQuery.refetch()} />
      ) : projectsQuery.isPending ? (
        <SectionLoading />
      ) : visibleProjects.length ? (
        filters.view === 'grid' ? (
          <SimpleGrid as="section" aria-label="Projects" columns={{ base: 1, md: 2, xl: 3 }} gap="4">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            <Link
              asChild
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap="3"
              minH="200px"
              w="full"
              rounded="l3"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="border.emphasized"
              textStyle="body-sm"
              fontWeight="medium"
              color="fg.muted"
              textDecoration="none"
              _hover={{
                borderColor: 'brand-text',
                bg: 'brand.subtle',
                color: 'brand-text',
                textDecoration: 'none',
              }}
            >
              <RouterLink to="/projects/new">
                <Plus size={24} />
                New project
              </RouterLink>
            </Link>
          </SimpleGrid>
        ) : (
          <ProjectsTable projects={visibleProjects} />
        )
      ) : (
        <EmptyNotice
          minH="80"
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          bg="surface-raised"
          icon={<Search />}
          title={orgProjects.length ? 'No matching projects' : `No projects in ${org.name} yet`}
          description={
            orgProjects.length
              ? 'Try a different search or change the selected filters.'
              : 'Create a project to start training models, or switch organization.'
          }
        >
          {orgProjects.length === 0 && (
            <Button asChild size="sm" variant="solid">
              <RouterLink to="/projects/new">
                <Plus />
                New project
              </RouterLink>
            </Button>
          )}
        </EmptyNotice>
      )}
    </Box>
  );
}
