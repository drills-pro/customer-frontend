import { useState } from 'react';
import { Alert, Box, Button, Card, Grid, Heading, Stack, Text } from '@chakra-ui/react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { DEFAULT_VISIBILITY, useCreateProject, useSetProjectVisibility, type TaskType, type Visibility } from '@/modules/projects/api';
import { BasicsStep } from '@/modules/projects/components/BasicsStep';
import { TaskStep } from '@/modules/projects/components/TaskStep';
import { useWorkspace } from '@/modules/workspaces';
import { errorKey } from '@/shared/api/errors';
import { SummaryCard, type SummaryRow } from '@/shared/ui/wizard';

/** One screen: the name, the task and the visibility, with the summary beside them. Creating it opens the project. */
export function NewProjectPage() {
  const { t } = useTranslation();
  const workspace = useWorkspace();
  return (
    <Stack gap="6">
      <Box>
        <Heading as="h1" textStyle="h1">
          {t('newProject.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('newProject.subtitle')}
        </Text>
      </Box>
      <ProjectForm workspace={workspace} />
    </Stack>
  );
}

function ProjectForm({ workspace }: { workspace: { id: string; slug: string; name: string } }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createProject = useCreateProject(workspace.id);
  const setVisibility = useSetProjectVisibility(workspace.id);
  const [name, setName] = useState('');
  const [visibility, setVisibilityValue] = useState<Visibility>(DEFAULT_VISIBILITY);
  const [task, setTask] = useState<TaskType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const valid = trimmed.length > 0 && task !== null;
  const busy = createProject.isPending || setVisibility.isPending;

  async function create() {
    if (!valid || !task) return;
    setError(null);
    try {
      const project = await createProject.mutateAsync({ name: trimmed, taskType: task });
      if (visibility !== DEFAULT_VISIBILITY) {
        // The project exists either way: a failed visibility change is said, not raised over the success.
        await setVisibility
          .mutateAsync({ projectId: project.id, visibility })
          .catch(() => toaster.create({ type: 'warning', title: t('newProject.done.visibilityFailedTitle') }));
      }
      toaster.create({ type: 'success', title: t('newProject.done.title', { name: project.name }) });
      void navigate({ to: '/w/$slug/projects/$projectId', params: { slug: workspace.slug, projectId: project.id } });
    } catch (e) {
      setError(t(`newProject.${errorKey(e)}`));
    }
  }

  const summary: SummaryRow[] = [
    { id: 'workspace', label: t('newProject.basics.workspace'), value: workspace.name },
    { id: 'name', label: t('newProject.basics.name'), value: trimmed || '—' },
    { id: 'visibility', label: t('newProject.basics.visibilityLabel'), value: t(`newProject.visibility.${visibility}`) },
    { id: 'task', label: t('newProject.task.title'), value: task ? t(`projects.taskType.${task}.label`) : '—' },
  ];

  return (
    <Grid minW="0" alignItems="start" gap="6" templateColumns={{ lg: 'repeat(3, minmax(0, 1fr))' }}>
      <Card.Root minW="0" gridColumn={{ lg: 'span 2' }}>
        <Card.Body gap="8">
          <BasicsStep
            workspaces={[{ label: workspace.name, value: workspace.id }]}
            workspaceId={workspace.id}
            setWorkspaceId={() => undefined}
            name={name}
            setName={setName}
            visibility={visibility}
            setVisibility={setVisibilityValue}
          />
          <TaskStep task={task} setTask={setTask} />
          {error && (
            <Alert.Root status="error" colorPalette="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('newProject.error.title')}</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
        </Card.Body>
        <Card.Footer justifyContent="space-between" gap="3" flexWrap="wrap">
          <Button asChild variant="ghost" disabled={busy}>
            <Link to="/w/$slug/projects" params={{ slug: workspace.slug }}>
              {t('newProject.cancel')}
            </Link>
          </Button>
          <Button variant="solid" onClick={() => void create()} loading={busy} disabled={!valid}>
            {t('newProject.create')}
          </Button>
        </Card.Footer>
      </Card.Root>

      <SummaryCard title={t('newProject.summary')} rows={summary} />
    </Grid>
  );
}
