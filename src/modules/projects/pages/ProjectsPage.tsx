import { useState } from 'react';
import { Alert, Box, Button, EmptyState, Flex, Heading, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Briefcase, Plus, Search } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useProjects, type ProjectSummary } from '@/modules/projects/api';
import { ProjectCard } from '@/modules/projects/components/ProjectCard';
import { ProjectFilters } from '@/modules/projects/components/ProjectFilters';
import { ProjectMenu } from '@/modules/projects/components/ProjectMenu';
import { ProjectsTable } from '@/modules/projects/components/ProjectsTable';
import { DEFAULT_FILTERS, visibleProjects, type ProjectFiltersState } from '@/modules/projects/filters';
import { useWorkspace } from '@/modules/workspaces';
import { errorKey } from '@/shared/api/errors';

/** The projects in the current workspace, as cards or a table. */
export function ProjectsPage() {
  const { t } = useTranslation();
  const workspace = useWorkspace();
  return (
    <Stack gap="6">
      <Flex align="end" justify="space-between" gap="4" wrap="wrap">
        <Box>
          <Heading as="h1" textStyle="h1">
            {t('projects.title')}
          </Heading>
          <Text mt="1" color="fg.muted">
            {t('projects.subtitle')}
          </Text>
        </Box>
        <Button asChild variant="solid">
          <Link to="/w/$slug/projects/new" params={{ slug: workspace.slug }}>
            <Plus />
            {t('projects.create')}
          </Link>
        </Button>
      </Flex>
      <ProjectList workspaceId={workspace.id} slug={workspace.slug} />
    </Stack>
  );
}

function ProjectList({ workspaceId, slug }: { workspaceId: string; slug: string }) {
  const { t, i18n } = useTranslation();
  const { projects, error, isError, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useProjects(workspaceId);
  const [filters, setFilters] = useState<ProjectFiltersState>(DEFAULT_FILTERS);
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' });
  const created = (iso: string) => date.format(new Date(iso));
  const menu = (project: ProjectSummary) => <ProjectMenu project={project} workspaceId={workspaceId} />;

  if (isError)
    return (
      <Alert.Root status="error" colorPalette="danger">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('projects.loadFailed')}</Alert.Title>
          <Alert.Description>{t(errorKey(error))}</Alert.Description>
          <Box>
            <Button size="sm" onClick={() => void refetch()}>
              {t('projects.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );
  if (isPending || !projects) return <Skeleton h="48" />;
  if (!projects.length)
    return (
      <EmptyState.Root borderWidth="2px" borderColor="border" borderRadius="l3">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <Briefcase />
          </EmptyState.Indicator>
          <EmptyState.Title>{t('projects.empty.title')}</EmptyState.Title>
          <EmptyState.Description>{t('projects.empty.body')}</EmptyState.Description>
          <Button asChild variant="solid">
            <Link to="/w/$slug/projects/new" params={{ slug }}>
              <Plus />
              {t('projects.create')}
            </Link>
          </Button>
        </EmptyState.Content>
      </EmptyState.Root>
    );

  const visible = visibleProjects(projects, filters);
  return (
    <Stack gap="4">
      <ProjectFilters filters={filters} onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))} />
      <Text textStyle="body-sm" color="fg.muted">
        {t('projects.count', { count: projects.length })}
      </Text>
      {!visible.length ? (
        <EmptyState.Root borderWidth="2px" borderColor="border" borderRadius="l3">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Search />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('projects.noMatch.title')}</EmptyState.Title>
            <EmptyState.Description>{t('projects.noMatch.body')}</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : filters.view === 'grid' ? (
        <SimpleGrid as="section" aria-label={t('projects.title')} columns={{ base: 1, md: 2, xl: 3 }} gap="4">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} created={created(project.created_at)} menu={menu(project)} />
          ))}
          <Button
            asChild
            variant="plain"
            h="auto"
            minH="40"
            flexDirection="column"
            gap="3"
            borderRadius="l3"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="border.emphasized"
            color="fg.muted"
            _hover={{ borderColor: 'brand-text', bg: 'brand.subtle', color: 'brand-text' }}
          >
            <Link to="/w/$slug/projects/new" params={{ slug }}>
              <Plus />
              {t('projects.create')}
            </Link>
          </Button>
        </SimpleGrid>
      ) : (
        <ProjectsTable projects={visible} created={created} menu={menu} />
      )}
      {hasNextPage && (
        <Box>
          <Button onClick={() => void fetchNextPage()} loading={isFetchingNextPage}>
            {t('projects.loadMore')}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
