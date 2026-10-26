import { useState } from 'react';
import { Alert, Box, Button, Flex, Heading, HStack, Progress, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import {
  useCommitImport,
  useDataset,
  useImport,
  useImportAction,
  useImportPreview,
  useVersions,
  useWriteDenied,
  type DatasetImport,
} from '@/modules/datasets/api';
import { ImportStatusBadge } from '@/modules/datasets/components/ImportStatusBadge';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { PreviewPanel } from '@/modules/datasets/components/PreviewPanel';
import { ReportView } from '@/modules/datasets/components/ReportView';
import { DEFAULT_PREVIEW_LIMIT, ImportStatus } from '@/modules/datasets/constants';
import { datasetErrorKey } from '@/modules/datasets/errors';
import { STATUS_UI } from '@/modules/datasets/status';
import { DATASET_TABS } from '@/modules/datasets/tabs';
import { useWorkspace } from '@/modules/workspaces';
import { ApiError } from '@/shared/api/client';
import { NotFound } from '@/shared/ui/NotFound';

const FROM = '/app/w/$slug/projects/$projectId/datasets/$datasetId/imports/$importId';

/** One import, driven by its status: wait, review and decide, or read how it ended. */
export function ImportPage() {
  const { t, i18n } = useTranslation();
  const { slug } = useWorkspace();
  const { projectId, datasetId, importId } = useParams({ from: FROM });
  const denied = useWriteDenied(projectId);
  const { data: item, error, isError, isPending, refetch } = useImport(projectId, datasetId, importId);
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });

  const back = (
    <Button asChild variant="ghost" size="sm" mb="2">
      <Link
        to="/w/$slug/projects/$projectId/datasets/$datasetId"
        params={{ slug, projectId, datasetId }}
        search={{ tab: DATASET_TABS.imports }}
      >
        <ArrowLeft />
        {t('datasets.backToDataset')}
      </Link>
    </Button>
  );

  if (isError) {
    if (error instanceof ApiError && error.status === 404) return <NotFound />;
    return (
      <Stack gap="4">
        {back}
        <LoadError title={t('datasets.import.loadFailed')} error={error} onRetry={() => void refetch()} />
      </Stack>
    );
  }
  if (isPending)
    return (
      <Stack gap="4">
        {back}
        <Skeleton h="48" />
      </Stack>
    );

  return (
    <Stack gap="6">
      <Box>
        {back}
        <Flex align="center" gap="3" wrap="wrap">
          <Heading as="h1" textStyle="h1">
            {t('datasets.import.title')}
          </Heading>
          <ImportStatusBadge status={item.status} />
        </Flex>
        <HStack mt="1" gap="4" wrap="wrap" color="fg.muted">
          <Text>{t(`datasets.source.${item.source}`)}</Text>
          <Text>{t('datasets.import.createdOn', { date: date.format(new Date(item.created_at)) })}</Text>
        </HStack>
      </Box>
      <ImportBody
        item={item}
        projectId={projectId}
        datasetId={datasetId}
        slug={slug}
        denied={denied}
        deadline={item.expires_at ? date.format(new Date(item.expires_at)) : null}
      />
    </Stack>
  );
}

function ImportBody({
  item,
  projectId,
  datasetId,
  slug,
  denied,
  deadline,
}: {
  item: DatasetImport;
  projectId: string;
  datasetId: string;
  slug: string;
  denied: boolean;
  deadline: string | null;
}) {
  const { t } = useTranslation();
  const ui = STATUS_UI[item.status];
  const cancel = useImportAction(projectId, datasetId, 'cancel');
  const discard = useImportAction(projectId, datasetId, 'discard');
  const commit = useCommitImport(projectId, datasetId);
  const dataset = useDataset(projectId, datasetId);
  const [limit, setLimit] = useState(DEFAULT_PREVIEW_LIMIT);
  const preview = useImportPreview(projectId, datasetId, item.id, limit, ui.review);
  const { versions } = useVersions(projectId, datasetId);
  const made = item.status === ImportStatus.Succeeded ? versions?.find((v) => v.import_id === item.id) : undefined;
  const writeLocked = denied || Boolean(dataset.data?.deleted_at);
  const busy = cancel.isPending || discard.isPending || commit.isPending;
  const fail = (title: string) => (e: unknown) => toaster.create({ type: 'error', title, description: t(datasetErrorKey(e)) });
  const newImport = (
    <Button asChild variant="solid">
      <Link
        to="/w/$slug/projects/$projectId/datasets/$datasetId/imports/new"
        params={{ slug, projectId, datasetId }}
        data-testid="import-new"
      >
        {t('datasets.import.new')}
      </Link>
    </Button>
  );

  const cancelButton = ui.cancel && (
    <Box>
      <Button
        loading={cancel.isPending}
        disabled={writeLocked || busy}
        data-testid="import-cancel"
        onClick={() => cancel.mutate(item.id, { onError: fail(t('datasets.toast.cancelFailed')) })}
      >
        {t('datasets.import.cancel')}
      </Button>
    </Box>
  );

  if (ui.poll && item.status !== ImportStatus.Committing)
    return (
      <Stack gap="4" maxW="xl" role="status" data-testid="import-working">
        <Progress.Root value={null} colorPalette="brand">
          <Progress.Label>{t(`datasets.import.working.${item.status}`)}</Progress.Label>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        <Text color="fg.muted">{t('datasets.import.workingHelp')}</Text>
        {cancelButton}
      </Stack>
    );

  switch (item.status) {
    case ImportStatus.AwaitingUpload:
      return (
        <Stack gap="4" maxW="xl" data-testid="import-awaiting-upload">
          <Text>{t('datasets.import.awaitingUpload')}</Text>
          <HStack gap="2">
            {cancelButton}
            {newImport}
          </HStack>
        </Stack>
      );
    case ImportStatus.Committing:
      return (
        <Stack gap="4" maxW="xl" role="status" data-testid="import-committing">
          <Progress.Root value={null} colorPalette="brand">
            <Progress.Label>{t('datasets.import.committing')}</Progress.Label>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Stack>
      );
    case ImportStatus.AwaitingReview:
      return (
        <Stack gap="6">
          <Alert.Root status="warning" colorPalette="warning" data-testid="import-review">
            <Alert.Indicator />
            <Alert.Description>
              {deadline ? t('datasets.import.reviewUntil', { date: deadline }) : t('datasets.import.review')}
            </Alert.Description>
          </Alert.Root>
          {item.report && <ReportView report={item.report} />}
          <Box>
            <Heading as="h2" textStyle="h3" mb="3">
              {t('datasets.import.previewTitle')}
            </Heading>
            <PreviewPanel query={preview} limit={limit} onLimit={setLimit} />
          </Box>
          <HStack gap="3">
            <Button
              variant="solid"
              loading={commit.isPending}
              disabled={writeLocked || busy}
              data-testid="import-commit"
              onClick={() =>
                commit.mutate(item.id, {
                  onSuccess: (version) =>
                    toaster.create({ type: 'success', title: t('datasets.toast.committed', { number: version.number }) }),
                  onError: fail(t('datasets.toast.commitFailed')),
                })
              }
            >
              {t('datasets.import.commit')}
            </Button>
            <Button
              loading={discard.isPending}
              disabled={writeLocked || busy}
              data-testid="import-discard"
              onClick={() => discard.mutate(item.id, { onError: fail(t('datasets.toast.discardFailed')) })}
            >
              {t('datasets.import.discard')}
            </Button>
          </HStack>
          {writeLocked && <Text color="fg.muted">{t('datasets.readOnly')}</Text>}
        </Stack>
      );
    case ImportStatus.Succeeded:
      return (
        <Stack gap="6">
          <Alert.Root status="success" colorPalette="success" data-testid="import-succeeded">
            <Alert.Indicator />
            <Alert.Description>
              {made ? t('datasets.import.succeededVersion', { number: made.number }) : t('datasets.import.succeeded')}
            </Alert.Description>
          </Alert.Root>
          {item.report && <ReportView report={item.report} />}
          <Box>
            <Button asChild variant="solid">
              <Link
                to="/w/$slug/projects/$projectId/datasets/$datasetId"
                params={{ slug, projectId, datasetId }}
                search={{ tab: DATASET_TABS.versions }}
                data-testid="import-view-versions"
              >
                {t('datasets.import.viewVersions')}
              </Link>
            </Button>
          </Box>
        </Stack>
      );
    case ImportStatus.Failed:
      return (
        <Stack gap="6">
          <Alert.Root status="error" colorPalette="danger" data-testid="import-failed">
            <Alert.Indicator />
            <Alert.Description>{t('datasets.import.failed')}</Alert.Description>
          </Alert.Root>
          {item.report && <ReportView report={item.report} />}
          <Box>{newImport}</Box>
        </Stack>
      );
    default:
      // cancelled, expired, discarded: nothing left to do with this one
      return (
        <Stack gap="4" maxW="xl" data-testid="import-ended">
          <Text>{t(`datasets.import.ended.${item.status}`)}</Text>
          <Box>{newImport}</Box>
        </Stack>
      );
  }
}
