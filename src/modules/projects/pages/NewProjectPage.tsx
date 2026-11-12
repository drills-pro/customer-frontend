import { useState } from 'react';
import { Alert, Box, Button, Card, Grid, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_VISIBILITY,
  useCreateProject,
  useSetProjectVisibility,
  type ProjectSummary,
  type TaskType,
  type Visibility,
} from '@/modules/projects/api';
import { BasicsStep } from '@/modules/projects/components/BasicsStep';
import { CopyId } from '@/modules/projects/components/CopyId';
import { ReviewStep, type ReviewRow } from '@/modules/projects/components/ReviewStep';
import { TaskStep } from '@/modules/projects/components/TaskStep';
import { step as stepIndex, STEPS } from '@/modules/projects/constants';
import { useWorkspace } from '@/modules/workspaces';
import { errorKey } from '@/shared/api/errors';
import { SummaryCard, WizardBody, WizardSteps } from '@/shared/ui/wizard';

const BASICS = stepIndex('basics');
const TASK = stepIndex('task');
const REVIEW = stepIndex('review');
const DONE = stepIndex('done');

/** A three-step form that creates a project in the workspace from the route. */
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
  const createProject = useCreateProject(workspace.id);
  const setVisibility = useSetProjectVisibility(workspace.id);
  const [step, setStep] = useState(BASICS);
  const [name, setName] = useState('');
  const [visibility, setVisibilityValue] = useState<Visibility>(DEFAULT_VISIBILITY);
  const [task, setTask] = useState<TaskType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ProjectSummary | null>(null);
  const [visibilityFailed, setVisibilityFailed] = useState(false);

  const trimmed = name.trim();
  const valid = [Boolean(trimmed), task !== null];
  const busy = createProject.isPending || setVisibility.isPending;
  const go = (to: number) => {
    setError(null);
    setStep(to);
  };

  async function create() {
    if (!trimmed || !task) return;
    setError(null);
    try {
      const project = await createProject.mutateAsync({ name: trimmed, taskType: task });
      let failed = false;
      if (visibility !== DEFAULT_VISIBILITY) {
        try {
          await setVisibility.mutateAsync({ projectId: project.id, visibility });
        } catch {
          failed = true;
        }
      }
      setCreated(project);
      setVisibilityFailed(failed);
      setStep(DONE);
    } catch (e) {
      setError(t(`newProject.${errorKey(e)}`));
    }
  }

  const taskLabel = task ? t(`projects.taskType.${task}.label`) : '—';
  const summary: ReviewRow[] = [
    { id: 'workspace', label: t('newProject.basics.workspace'), value: workspace.name, edit: 'basics' },
    { id: 'name', label: t('newProject.basics.name'), value: trimmed || '—', edit: 'basics' },
    { id: 'visibility', label: t('newProject.basics.visibilityLabel'), value: t(`newProject.visibility.${visibility}`), edit: 'basics' },
    { id: 'task', label: t('newProject.task.title'), value: taskLabel, edit: 'task' },
  ];

  return (
    <Grid minW="0" alignItems="start" gap="6" templateColumns={{ lg: 'repeat(3, minmax(0, 1fr))' }}>
      <Card.Root minW="0" gridColumn={{ lg: 'span 2' }}>
        <Card.Header>
          <WizardSteps labels={STEPS.map((id) => t(`newProject.step.${id}`))} step={step} />
        </Card.Header>

        <WizardBody step={step}>
          {step === BASICS && (
            <BasicsStep
              workspaces={[{ label: workspace.name, value: workspace.id }]}
              workspaceId={workspace.id}
              setWorkspaceId={() => undefined}
              name={name}
              setName={setName}
              visibility={visibility}
              setVisibility={setVisibilityValue}
            />
          )}
          {step === TASK && <TaskStep task={task} setTask={setTask} />}
          {step === REVIEW && <ReviewStep rows={summary} onEdit={go} error={error} />}
          {step === DONE && created && (
            <Stack gap="4">
              <Alert.Root status="success" colorPalette="success">
                <Alert.Indicator />
                <Alert.Content gap="2">
                  <Alert.Title>{t('newProject.done.title', { name: created.name })}</Alert.Title>
                  <Alert.Description>{t('newProject.done.body')}</Alert.Description>
                  <CopyId id={created.id} />
                </Alert.Content>
              </Alert.Root>
              {visibilityFailed && (
                <Alert.Root status="warning" colorPalette="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{t('newProject.done.visibilityFailedTitle')}</Alert.Title>
                    <Alert.Description>{t('newProject.done.visibilityFailedBody', { workspace: workspace.name })}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}
            </Stack>
          )}
        </WizardBody>

        <Card.Footer justifyContent="space-between" gap="3" flexWrap="wrap">
          {step === DONE ? (
            <span />
          ) : (
            <Button asChild variant="ghost" disabled={busy}>
              <Link to="/w/$slug/projects" params={{ slug: workspace.slug }}>
                {t('newProject.cancel')}
              </Link>
            </Button>
          )}
          <HStack gap="3">
            {step > BASICS && step < DONE && (
              <Button onClick={() => go(step - 1)} disabled={busy}>
                <ChevronLeft />
                {t('newProject.back')}
              </Button>
            )}
            {step < REVIEW && (
              <Button variant="solid" onClick={() => go(step + 1)} disabled={!valid[step]}>
                {t('newProject.next')}
                <ChevronRight />
              </Button>
            )}
            {step === REVIEW && (
              <Button variant="solid" onClick={() => void create()} loading={busy} disabled={!valid.every(Boolean)}>
                {t('newProject.create')}
              </Button>
            )}
            {step === DONE && (
              <Button asChild variant="solid">
                <Link to="/w/$slug/projects" params={{ slug: workspace.slug }}>
                  {t('newProject.done.cta')}
                </Link>
              </Button>
            )}
          </HStack>
        </Card.Footer>
      </Card.Root>

      <SummaryCard title={t('newProject.summary')} rows={summary} />
    </Grid>
  );
}
