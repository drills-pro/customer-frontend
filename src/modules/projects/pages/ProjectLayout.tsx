import { Alert, Box, Button, Flex, Heading, HStack, Skeleton, Stack, Tabs, Text } from '@chakra-ui/react';
import { Link, Outlet, useMatchRoute, useParams } from '@tanstack/react-router';
import { Plus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useProject } from '@/modules/projects/api';
import { ProjectMark } from '@/modules/projects/components/ProjectMark';
import { ProjectMenu } from '@/modules/projects/components/ProjectMenu';
import { StatusBadge } from '@/modules/projects/components/StatusBadge';
import { PROJECT_TABS, ProjectTab } from '@/modules/projects/constants';
import { useWorkspace } from '@/modules/workspaces';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { NotFound } from '@/shared/ui/NotFound';

const TAB_PATHS = {
  [ProjectTab.Overview]: '/w/$slug/projects/$projectId',
  [ProjectTab.Datasets]: '/w/$slug/projects/$projectId/datasets',
  [ProjectTab.Training]: '/w/$slug/projects/$projectId/training',
  [ProjectTab.Deployments]: '/w/$slug/projects/$projectId/deployments',
} as const;
const NEW_TRAINING_PATH = '/w/$slug/projects/$projectId/training/new';
/** The section tabs that own a subtree: any page under one keeps it selected. Anything else is the overview. */
const SECTION_TABS = [ProjectTab.Datasets, ProjectTab.Training, ProjectTab.Deployments] as const;

/** One project: its header and section tabs around the section's page. The shell breadcrumb leads back up. */
export function ProjectLayout() {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const { projectId } = useParams({ from: '/app/w/$slug/projects/$projectId' });
  const matchRoute = useMatchRoute();
  const { data: project, error, isError, isPending, refetch } = useProject(workspaceId, projectId);
  const tab = SECTION_TABS.find((id) => matchRoute({ to: TAB_PATHS[id], fuzzy: true })) ?? ProjectTab.Overview;
  // The header owns the project's one primary action, in the same place on every tab; the wizard it opens hides it.
  const training = !matchRoute({ to: NEW_TRAINING_PATH });

  if (isError) {
    if (error instanceof ApiError && error.status === 404) return <NotFound />;
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="project-load-error">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('projects.detail.loadFailed')}</Alert.Title>
          <Alert.Description>{t(errorKey(error))}</Alert.Description>
          <Box>
            <Button size="sm" onClick={() => void refetch()}>
              {t('projects.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );
  }
  if (isPending) return <Skeleton h="32" />;

  return (
    <Stack gap="6">
      <Box data-testid="project-header">
        {/* With only the menu beside it, the title keeps one row on phones too. */}
        <Flex
          direction={training ? { base: 'column', sm: 'row' } : 'row'}
          // Centered beside the title block; stacked on phones, the button lines up at the start instead.
          align={{ base: 'flex-start', sm: 'center' }}
          justify="space-between"
          gap="4"
        >
          <Flex minW="0" align="flex-start" gap="3">
            <ProjectMark taskType={project.task_type} />
            <Box minW="0">
              <Heading as="h1" textStyle="h1" truncate data-testid="project-name">
                {project.name}
              </Heading>
              <HStack mt="1" gap="3" wrap="wrap">
                <StatusBadge status={project.status} />
                <Text textStyle="body-sm" color="fg.muted">
                  {t(`projects.taskType.${project.task_type}.label`)}
                </Text>
              </HStack>
            </Box>
          </Flex>
          <HStack gap="2" flexShrink={0}>
            {training && (
              <Button asChild variant="solid" size="sm">
                <Link to={NEW_TRAINING_PATH} params={{ slug, projectId }} data-testid="project-new-training">
                  <Plus />
                  {t('projects.detail.newTraining')}
                </Link>
              </Button>
            )}
            <ProjectMenu project={project} workspaceId={workspaceId} />
          </HStack>
        </Flex>
      </Box>

      {/* Manual activation: arrows move focus, Enter follows the focused link. The URL owns the value, so `navigate` is off:
          by default the tabs click the selected trigger's link whenever the value changes, which would send a deep link
          (training/new) back up to its section's root. */}
      <Tabs.Root value={tab} activationMode="manual" navigate={null}>
        <Tabs.List aria-label={t('projects.detail.sections')}>
          <Tabs.Indicator />
          {PROJECT_TABS.map((id) => (
            <Tabs.Trigger key={id} value={id} asChild data-testid={`project-tab-${id}`}>
              <Link to={TAB_PATHS[id]} params={{ slug, projectId }}>
                {t(`projects.detail.tab.${id}`)}
              </Link>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <Outlet />
    </Stack>
  );
}
