import { useState, type ReactNode } from 'react';
import { Alert, Box, Button, Field, FileUpload, Heading, Input, Progress, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Upload } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { RadioButton, RadioButtonGroup } from '@/components/radio-button-group';
import { SimpleSelect } from '@/components/simple-select';
import { useDataset, useSubmitImport, useVersions, useWriteDenied, type SubmitStage } from '@/modules/datasets/api';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { canImport, HF_DEFAULT_REVISION, IMPORT_SOURCES, ImportSource, isTabular, SPLITS, type Split } from '@/modules/datasets/constants';
import { datasetErrorKey, UploadFailed, UploadLinkLost } from '@/modules/datasets/errors';
import { EMPTY_FORM, formErrors, toImportBody, type ImportFormValues } from '@/modules/datasets/import-form';
import { useWorkspace } from '@/modules/workspaces';

const FROM = '/app/w/$slug/projects/$projectId/datasets/$datasetId/imports/new';
const NO_SPLIT = 'none';
const UPLOAD_ACCEPT = { tabular: '.csv,text/csv', archive: '.zip,application/zip' };

type Stage = 'idle' | SubmitStage;

/** Upload failures have their own copy; every other error is the dataset mapping. */
function submitErrorKey(e: unknown): string {
  if (e instanceof UploadLinkLost) return 'datasets.newImport.uploadLinkLost';
  if (e instanceof UploadFailed) return 'datasets.newImport.uploadFailed';
  return datasetErrorKey(e);
}

/** Pick a source, fill in what it needs, then create the import, upload the file when there is one, and start it. */
export function NewImportPage() {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const { projectId, datasetId } = useParams({ from: FROM });
  const navigate = useNavigate();
  const denied = useWriteDenied(projectId);
  const dataset = useDataset(projectId, datasetId);
  const versions = useVersions(projectId, datasetId);
  const { submit, reset } = useSubmitImport(projectId, datasetId);

  const [values, setValues] = useState<ImportFormValues>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [base, setBase] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const shell = (body: ReactNode) => (
    <Stack gap="6">
      <Heading as="h2" textStyle="h2">
        {t('datasets.newImport.title')}
      </Heading>
      {body}
    </Stack>
  );

  if (dataset.isError)
    return shell(<LoadError title={t('datasets.loadOneFailed')} error={dataset.error} onRetry={() => void dataset.refetch()} />);
  if (versions.isError)
    return shell(<LoadError title={t('datasets.versions.loadFailed')} error={versions.error} onRetry={() => void versions.refetch()} />);
  if (dataset.isPending || versions.isPending || !versions.versions) return shell(<Skeleton h="48" />);

  const { task_type: task } = dataset.data;
  const blocked = dataset.data.deleted_at
    ? 'datasets.import.deleted'
    : task === null
      ? 'datasets.import.noTask'
      : !canImport(task)
        ? 'datasets.import.unsupportedTask'
        : denied
          ? 'datasets.readOnly'
          : null;
  if (blocked || !canImport(task))
    return shell(
      <Alert.Root status="info" colorPalette="info" data-testid="import-blocked">
        <Alert.Indicator />
        <Alert.Description>{t(blocked ?? 'datasets.import.unsupportedTask')}</Alert.Description>
      </Alert.Root>,
    );

  const list = versions.versions;
  const latest = list[0]?.id ?? null;
  const baseId = list.length ? (base ?? latest) : null;
  const errors = formErrors(values, task, file !== null);
  const busy = stage !== 'idle';
  const set = <K extends keyof ImportFormValues>(key: K, value: ImportFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const show = (field: keyof typeof errors) => (touched && errors[field] ? errors[field] : undefined);
  const invalidText = (field: 'target' | 'repo' | 'revision' | 'column') => t(`datasets.newImport.error.${errors[field]}`);

  async function run() {
    setTouched(true);
    if (Object.keys(errors).length || !canImport(task)) return;
    const body = toImportBody(values, task, baseId);
    setError(null);
    try {
      const created = await submit({ body, file, onStage: setStage, onProgress: setProgress });
      await navigate({
        to: '/w/$slug/projects/$projectId/datasets/$datasetId/imports/$importId',
        params: { slug, projectId, datasetId, importId: created.id },
      });
    } catch (e) {
      setError(submitErrorKey(e));
    } finally {
      setStage('idle');
    }
  }

  /** The upload link is gone or dead: cancel the half-made import (best effort) and begin again with a new key. */
  async function startOver() {
    setError(null);
    await reset();
  }

  const accept = isTabular(task) ? UPLOAD_ACCEPT.tabular : UPLOAD_ACCEPT.archive;
  const splitItems = [
    { label: t('datasets.split.none'), value: NO_SPLIT },
    ...SPLITS.map((s) => ({ label: t(`datasets.split.${s}`), value: s })),
  ];
  const baseItems = list.map((v) => ({ label: t('datasets.versionNumber', { number: v.number }), value: v.id }));
  const errorLost = error === 'datasets.newImport.uploadLinkLost' || error === 'datasets.newImport.uploadFailed';

  return shell(
    <Stack
      as="form"
      gap="6"
      maxW="2xl"
      aria-busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        void run();
      }}
    >
      <Field.Root>
        <Field.Label>{t('datasets.newImport.source')}</Field.Label>
        <RadioButtonGroup
          aria-label={t('datasets.newImport.source')}
          value={values.source}
          onChange={(v) => {
            set('source', v as ImportSource);
            setError(null);
          }}
        >
          {IMPORT_SOURCES.map((s) => (
            <RadioButton key={s} value={s} disabled={busy} data-testid={`import-source-${s}`}>
              {t(`datasets.source.${s}`)}
            </RadioButton>
          ))}
        </RadioButtonGroup>
        <Field.HelperText>{t(`datasets.newImport.sourceHelp.${values.source}`)}</Field.HelperText>
      </Field.Root>

      {values.source === ImportSource.Upload ? (
        <>
          <Field.Root required invalid={Boolean(show('file'))}>
            <Field.Label>{t('datasets.newImport.file')}</Field.Label>
            <FileUpload.Root
              maxFiles={1}
              accept={accept}
              disabled={busy}
              onFileChange={(d) => setFile(d.acceptedFiles[0] ?? null)}
              onFileReject={() => setFile(null)}
              data-testid="import-dropzone"
            >
              <FileUpload.HiddenInput data-testid="import-file" />
              <FileUpload.Dropzone w="full">
                <Upload width={24} height={24} />
                <FileUpload.DropzoneContent>
                  <Box>{t('datasets.newImport.drop')}</Box>
                  <Box color="fg.muted">{t(isTabular(task) ? 'datasets.newImport.acceptCsv' : 'datasets.newImport.acceptZip')}</Box>
                </FileUpload.DropzoneContent>
                <FileUpload.Trigger asChild>
                  <Button size="sm">{t('datasets.newImport.choose')}</Button>
                </FileUpload.Trigger>
              </FileUpload.Dropzone>
              <FileUpload.List showSize clearable />
            </FileUpload.Root>
            {show('file') && <Field.ErrorText>{t('datasets.newImport.error.fileRequired')}</Field.ErrorText>}
          </Field.Root>
          {isTabular(task) && (
            <Field.Root required invalid={Boolean(show('target'))}>
              <Field.Label>{t('datasets.newImport.target')}</Field.Label>
              <Input data-testid="import-target" value={values.target} disabled={busy} onChange={(e) => set('target', e.target.value)} />
              <Field.HelperText>{t('datasets.newImport.targetHelp')}</Field.HelperText>
              {show('target') && <Field.ErrorText>{invalidText('target')}</Field.ErrorText>}
            </Field.Root>
          )}
        </>
      ) : (
        <>
          <Field.Root required invalid={Boolean(show('repo'))}>
            <Field.Label>{t('datasets.newImport.repo')}</Field.Label>
            <Input
              data-testid="import-repo"
              value={values.repo}
              disabled={busy}
              placeholder="owner/name"
              onChange={(e) => set('repo', e.target.value)}
            />
            <Field.HelperText>{t('datasets.newImport.repoHelp')}</Field.HelperText>
            {show('repo') && <Field.ErrorText>{invalidText('repo')}</Field.ErrorText>}
          </Field.Root>
          <Field.Root invalid={Boolean(show('revision'))}>
            <Field.Label>{t('datasets.newImport.revision')}</Field.Label>
            <Input
              data-testid="import-revision"
              value={values.revision}
              disabled={busy}
              placeholder={HF_DEFAULT_REVISION}
              onChange={(e) => set('revision', e.target.value)}
            />
            <Field.HelperText>{t('datasets.newImport.revisionHelp')}</Field.HelperText>
            {show('revision') && <Field.ErrorText>{invalidText('revision')}</Field.ErrorText>}
          </Field.Root>
          <Field.Root invalid={Boolean(show('column'))}>
            <Field.Label>{t('datasets.newImport.column')}</Field.Label>
            <Input data-testid="import-column" value={values.column} disabled={busy} onChange={(e) => set('column', e.target.value)} />
            <Field.HelperText>{t('datasets.newImport.columnHelp')}</Field.HelperText>
            {show('column') && <Field.ErrorText>{invalidText('column')}</Field.ErrorText>}
          </Field.Root>
        </>
      )}

      <Box>
        <SimpleSelect
          label={t('datasets.newImport.split')}
          items={splitItems}
          value={values.split || NO_SPLIT}
          onChange={(v) => set('split', v === NO_SPLIT ? '' : (v as Split))}
        />
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          {t('datasets.newImport.splitHelp')}
        </Text>
      </Box>

      {baseItems.length > 0 && (
        <Box>
          <SimpleSelect label={t('datasets.newImport.base')} items={baseItems} value={baseId ?? ''} onChange={setBase} />
          <Text mt="1" textStyle="body-sm" color="fg.muted">
            {t('datasets.newImport.baseHelp')}
          </Text>
        </Box>
      )}

      {stage === 'uploading' && (
        <Progress.Root value={Math.round(progress * 100)} colorPalette="brand" data-testid="import-progress">
          <Progress.Label>{t('datasets.newImport.uploading')}</Progress.Label>
          <Progress.ValueText />
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      )}
      {error && (
        <Alert.Root status="error" colorPalette="danger" data-testid="import-error">
          <Alert.Indicator />
          <Alert.Content gap="3">
            <Alert.Description>{t(error)}</Alert.Description>
            {errorLost && (
              <Box>
                <Button size="sm" onClick={() => void startOver()} data-testid="import-start-over">
                  {t('datasets.newImport.startOver')}
                </Button>
              </Box>
            )}
          </Alert.Content>
        </Alert.Root>
      )}
      <Box>
        <Button type="submit" variant="solid" loading={busy} data-testid="import-submit">
          {t(error ? 'datasets.newImport.retry' : 'datasets.newImport.submit')}
        </Button>
      </Box>
    </Stack>,
  );
}
