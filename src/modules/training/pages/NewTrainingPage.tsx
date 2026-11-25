import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Card, Grid, Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useProjectDetail, type TaskType } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { useIdempotencyKey } from '@/shared/api/idempotency';
import { SummaryCard, WizardBody, WizardSteps, type SummaryRow } from '@/shared/ui/wizard';
import { useCreateRun, usePresets, useRunOnce, type TrainingRun } from '@/modules/training/api';
import { DataStep, type DataChoice } from '@/modules/training/components/DataStep';
import { ModelStep, usePresetLabel, usePresetResources } from '@/modules/training/components/ModelStep';
import { SettingsStep, useSettingsMode } from '@/modules/training/components/SettingsStep';
import {
  BLOCKING_CODES,
  DEFAULT_PRESET,
  SettingsMode,
  shownHyperparameters,
  step as stepIndex,
  STEPS,
  type Hyperparameter,
} from '@/modules/training/constants';
import { blockingCode, createErrorKey, isNotFound, trainingErrorKey } from '@/modules/training/errors';
import { cloneValues, defaultsFor, fieldErrors, rangesFor, toRunBody, type Preset, type RunFormValues } from '@/modules/training/run-form';

const FROM = '/app/w/$slug/projects/$projectId/training/new';
const DATA = stepIndex('data');
const SETTINGS = stepIndex('settings');
const EMPTY = '-';

/** Choose the data, the preset and its settings, review, then start the run and follow it on its page. `?clone=<run>` starts from
 * that run's data, preset and settings; a run that is gone just means starting from the defaults. */
export function NewTrainingPage() {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const { projectId } = useParams({ from: FROM });
  const { clone: cloneId } = useSearch({ from: FROM });
  const project = useProjectDetail(workspaceId, projectId);
  const presets = usePresets(projectId);
  const clone = useRunOnce(projectId, cloneId);
  const cloneError = clone.isError && !isNotFound(clone.error) ? clone.error : null;

  const shell = (body: ReactNode) => (
    <Stack gap="6">
      <Box>
        <Heading as="h2" textStyle="h2">
          {t('training.new.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('training.new.subtitle')}
        </Text>
      </Box>
      {body}
    </Stack>
  );

  if (presets.isError || cloneError) {
    const code = presets.isError ? blockingCode(presets.error, BLOCKING_CODES) : null;
    if (code) return shell(<Blocked text={t(trainingErrorKey(presets.error))} />);
    return shell(
      <Alert.Root status="error" colorPalette="danger" data-testid="training-load-error">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('training.new.loadFailed')}</Alert.Title>
          <Alert.Description>{t(trainingErrorKey(presets.error ?? cloneError))}</Alert.Description>
          <Box>
            <Button
              size="sm"
              onClick={() => {
                void presets.refetch();
                if (cloneId) void clone.refetch();
              }}
            >
              {t('training.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>,
    );
  }
  if (presets.isPending || (cloneId && clone.isPending)) return shell(<Skeleton h="64" />);
  if (presets.data.length === 0) return shell(<Blocked text={t('training.error.notTrainable')} />);

  return shell(
    <TrainingForm
      key={cloneId ?? ''}
      workspaceId={workspaceId}
      slug={slug}
      projectId={projectId}
      task={project.task_type}
      presets={presets.data}
      clone={clone.data}
    />,
  );
}

function Blocked({ text }: { text: string }) {
  return (
    <Alert.Root status="info" colorPalette="info" data-testid="training-blocked">
      <Alert.Indicator />
      <Alert.Description>{text}</Alert.Description>
    </Alert.Root>
  );
}

interface FormProps {
  workspaceId: string;
  slug: string;
  projectId: string;
  task: TaskType;
  presets: Preset[];
  /** The run this one starts from, if any. */
  clone: TrainingRun | undefined;
}

/** A clone's data, as far as its ids go; the data step fills in the names. */
const cloneData = (run: TrainingRun | undefined): DataChoice | null =>
  run?.dataset_id ? { datasetId: run.dataset_id, datasetName: '', versionId: run.dataset_version_id, versionNumber: null } : null;

function TrainingForm({ workspaceId, slug, projectId, task, presets, clone }: FormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const presetLabel = usePresetLabel();
  const presetResources = usePresetResources();
  const create = useCreateRun(workspaceId, projectId);
  // The key is reused by every retry of the same request and replaced as soon as the request changes.
  const { keyFor } = useIdempotencyKey();
  const [step, setStep] = useState(DATA);
  const [data, setData] = useState<DataChoice | null>(() => cloneData(clone));
  const [values, setValues] = useState<RunFormValues>(() =>
    cloneValues(clone, presets, presets.find((p) => p.name === DEFAULT_PRESET) ?? presets[0], task),
  );
  const preset = presets.find((p) => p.name === values.preset);
  const { mode, setMode, forgetCustomSettings } = useSettingsMode(task, preset, values, setValues);
  const [error, setError] = useState<string | null>(null);
  const onData = useCallback((choice: DataChoice) => setData(choice), []);

  const errors = preset ? fieldErrors(values, preset, task) : {};
  // The first screen needs a dataset version and a preset; the second needs settings that pass their bounds.
  const valid = [Boolean(data?.versionId) && Boolean(preset), Boolean(preset) && Object.keys(errors).length === 0];
  const go = (to: number) => {
    setError(null);
    setStep(to);
  };
  const choosePreset = (name: string) => {
    const next = presets.find((p) => p.name === name);
    if (!next || name === values.preset) return;
    setValues((v) => ({ ...v, preset: name, hyperparameters: defaultsFor(next, task) }));
    forgetCustomSettings();
  };
  const setHyperparameter = (name: Hyperparameter, value: string) =>
    setValues((v) => ({ ...v, hyperparameters: { ...v.hyperparameters, [name]: value } }));

  async function start() {
    if (!data?.versionId || !preset || !valid.every(Boolean)) return;
    const body = toRunBody({ ...values, versionId: data.versionId, preset }, task);
    const key = keyFor(JSON.stringify(body));
    setError(null);
    try {
      const run = await create.mutateAsync({ body, key });
      await navigate({ to: '/w/$slug/projects/$projectId/training/$runId', params: { slug, projectId, runId: run.id } });
    } catch (e) {
      setError(createErrorKey(e));
    }
  }

  const version = typeof data?.versionNumber === 'number' ? t('training.data.version', { number: data.versionNumber }) : EMPTY;
  const rows: SummaryRow[] = [
    { id: 'dataset', label: t('training.data.dataset'), value: data?.datasetName ?? EMPTY },
    { id: 'version', label: t('training.data.versionLabel'), value: version },
    { id: 'preset', label: t('training.model.label'), value: preset ? presetLabel(preset.name) : EMPTY },
    // Recommended is one row; Custom lists every value, so the summary says what the Settings step's switch says.
    ...(mode === SettingsMode.Custom
      ? [
          ...shownHyperparameters(task, preset && rangesFor(preset, task)).map((h) => ({
            id: h,
            label: t(`training.settings.${h}.label`),
            value: values.hyperparameters[h] || EMPTY,
          })),
          { id: 'seed', label: t('training.settings.seed.label'), value: values.seed || EMPTY },
        ]
      : [{ id: 'settings', label: t('training.settings.title'), value: t('training.review.recommended') }]),
  ];

  const steps = (
    <WizardSteps
      labels={STEPS.map((id) => t(`training.new.step.${id}`))}
      step={step}
      onSelect={(to) => {
        if (to < step) go(to);
      }}
    />
  );

  return (
    <Grid minW="0" alignItems="start" gap="5" templateColumns={{ xl: 'minmax(0, 1fr) 300px' }}>
      <Card.Root minW="0">
        <Card.Header as="nav" aria-label={t('training.new.steps')} data-testid="training-steps">
          {steps}
        </Card.Header>

        <WizardBody step={step}>
          {step === DATA && (
            <Stack gap="8">
              <DataStep projectId={projectId} slug={slug} choice={data} onChange={onData} />
              <ModelStep presets={presets} task={task} preset={values.preset} setPreset={choosePreset} />
            </Stack>
          )}
          {step === SETTINGS && preset && (
            <SettingsStep
              task={task}
              preset={preset}
              values={values}
              errors={errors}
              mode={mode}
              setMode={setMode}
              setHyperparameter={setHyperparameter}
              setSeed={(seed) => setValues((v) => ({ ...v, seed }))}
            />
          )}
          {step === SETTINGS && error && (
            <Alert.Root status="error" colorPalette="danger" data-testid="training-error">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('training.review.failed')}</Alert.Title>
                <Alert.Description>{t(error)}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
        </WizardBody>

        <Card.Footer justifyContent="space-between" gap="3" flexWrap="wrap" borderTopWidth="1px" borderColor="border" pt="5">
          <Button asChild variant="ghost" disabled={create.isPending}>
            <Link to="/w/$slug/projects/$projectId/training" params={{ slug, projectId }} data-testid="training-cancel">
              {t('training.new.cancel')}
            </Link>
          </Button>
          <HStack gap="3">
            {step > DATA && (
              <Button onClick={() => go(step - 1)} disabled={create.isPending} data-testid="training-back">
                <ChevronLeft />
                {t('training.new.back')}
              </Button>
            )}
            {step === DATA && (
              <Button variant="solid" onClick={() => go(SETTINGS)} disabled={!valid[DATA]} data-testid="training-next">
                {t('training.new.next')}
                <ChevronRight />
              </Button>
            )}
            {step === SETTINGS && (
              <Button
                variant="solid"
                onClick={() => void start()}
                loading={create.isPending}
                disabled={!valid.every(Boolean)}
                data-testid="training-start"
              >
                {t(error ? 'training.new.retry' : 'training.new.start')}
                <ChevronRight />
              </Button>
            )}
          </HStack>
        </Card.Footer>
      </Card.Root>

      <Grid minW="0" gap="4" position={{ xl: 'sticky' }} top="6">
        <SummaryCard title={t('training.new.summary')} rows={rows} />
        {preset && <SummaryCard title={t('training.resources.title')} rows={presetResources(preset)} testId="training-resources" />}
      </Grid>
    </Grid>
  );
}
