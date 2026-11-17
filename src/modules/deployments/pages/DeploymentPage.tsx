import { useState } from 'react';
import { Alert, Box, Button, Flex, Heading, HStack, Skeleton, Stack, Tabs, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/modules/workspaces';
import { NotFound } from '@/shared/ui/NotFound';
import { errorKey } from '@/shared/api/errors';
import { ApiError } from '@/shared/api/client';
import { DeploymentStatusBadge } from '@/modules/deployments/components/DeploymentStatusBadge';
import {
  useDeleteDeployment,
  useDeployment,
  useDeploymentSchema,
  useStartDeployment,
  useStopDeployment,
  type DeploymentDetail,
  type DeploymentSchema,
} from '@/modules/deployments/api';
import { DeploymentStatus } from '@/modules/projects/constants';

const FROM = '/app/w/$slug/projects/$projectId/deployments/$deploymentId';
const SNIPPETS = ['curl', 'python', 'javascript'] as const;
type Snippet = (typeof SNIPPETS)[number];

/** One deployment: its endpoint and status, the controls that change it, and how to call it. */
export function DeploymentPage() {
  const { t } = useTranslation();
  const { projectId, deploymentId } = useParams({ from: FROM });
  const { data: deployment, error, isError, isPending, refetch } = useDeployment(projectId, deploymentId);

  if (isError) {
    if (error instanceof ApiError && error.status === 404) return <NotFound />;
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="deployment-load-error">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('deployments.detail.loadFailed')}</Alert.Title>
          <Alert.Description>{t(errorKey(error))}</Alert.Description>
          <Box>
            <Button size="sm" onClick={() => void refetch()}>
              {t('deployments.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );
  }
  if (isPending) return <Skeleton h="48" />;

  return (
    <Stack gap="6">
      <DeploymentHeader deployment={deployment} projectId={projectId} />
      <DeploymentCall projectId={projectId} deploymentId={deployment.id} live={deployment.status === DeploymentStatus.Active} />
    </Stack>
  );
}

function DeploymentHeader({ deployment, projectId }: { deployment: DeploymentDetail; projectId: string }) {
  const { t, i18n } = useTranslation();
  const { slug } = useWorkspace();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  const start = useStartDeployment(projectId);
  const stop = useStopDeployment(projectId);
  const remove = useDeleteDeployment(projectId);
  const [confirming, setConfirming] = useState(false);
  const busy = start.isPending || stop.isPending || remove.isPending;
  const failure = start.error ?? stop.error ?? remove.error;
  const deleted = deployment.status === DeploymentStatus.Deleted;

  return (
    <Stack gap="3">
      <Flex wrap="wrap" align="flex-start" justify="space-between" gap="3">
        <Box minW="0">
          <Flex align="center" gap="3" wrap="wrap">
            <Heading as="h2" textStyle="h2" fontFamily="mono" truncate>
              {deployment.route_prefix}
            </Heading>
            <DeploymentStatusBadge status={deployment.status} />
          </Flex>
          <HStack mt="1" columnGap="4" rowGap="1" wrap="wrap" color="fg.muted">
            <Text>{t('deployments.detail.createdOn', { date: date.format(new Date(deployment.created_at)) })}</Text>
            <Text>{t('deployments.detail.rate', { count: deployment.rate_limit_per_minute })}</Text>
            <Link to="/w/$slug/projects/$projectId/training/$runId" params={{ slug, projectId, runId: deployment.training_run_id }}>
              <Text as="span" color="brand-text">
                {t('deployments.detail.fromRun')}
              </Text>
            </Link>
          </HStack>
        </Box>
        {!deleted && (
          <HStack gap="2" flexShrink={0} wrap="wrap">
            {deployment.status === DeploymentStatus.Active && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => stop.mutate(deployment.id)} data-testid="deployment-stop">
                {t('deployments.detail.stop')}
              </Button>
            )}
            {deployment.status === DeploymentStatus.Failed && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => start.mutate(deployment.id)}
                data-testid="deployment-start"
              >
                {t('deployments.detail.start')}
              </Button>
            )}
            {confirming ? (
              <Button
                size="sm"
                colorPalette="danger"
                disabled={busy}
                onClick={() => remove.mutate(deployment.id, { onSuccess: () => setConfirming(false) })}
                data-testid="deployment-delete-confirm"
              >
                {t('deployments.detail.confirmDelete')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                colorPalette="danger"
                disabled={busy}
                onClick={() => setConfirming(true)}
                data-testid="deployment-delete"
              >
                {t('deployments.detail.delete')}
              </Button>
            )}
          </HStack>
        )}
      </Flex>
      {failure && (
        <Text color="fg.error" textStyle="body-sm" role="alert" data-testid="deployment-action-error">
          {t(errorKey(failure))}
        </Text>
      )}
    </Stack>
  );
}

/** How to call the endpoint: the request and response shape, then a snippet per language. A stopped deployment answers nothing. */
function DeploymentCall({ projectId, deploymentId, live }: { projectId: string; deploymentId: string; live: boolean }) {
  const { t } = useTranslation();
  const schema = useDeploymentSchema(projectId, deploymentId);
  const [snippet, setSnippet] = useState<Snippet>('curl');

  if (schema.isError) {
    return (
      <Text color="fg.error" textStyle="body-sm" role="alert">
        {t(errorKey(schema.error))}
      </Text>
    );
  }
  if (schema.isPending) return <Skeleton h="32" />;

  return (
    <Stack gap="5">
      {!live && (
        <Text color="fg.muted" textStyle="body-sm" data-testid="deployment-not-live">
          {t('deployments.detail.notLive')}
        </Text>
      )}
      <CallSnippets schema={schema.data} snippet={snippet} onSnippet={setSnippet} />
      <Box>
        <Heading as="h3" textStyle="body" fontWeight="semibold">
          {t('deployments.detail.shape')}
        </Heading>
        <Flex mt="3" gap="4" wrap="wrap">
          <JsonBlock label={t('deployments.detail.input')} value={schema.data.input} testId="deployment-input" />
          <JsonBlock label={t('deployments.detail.output')} value={schema.data.output} testId="deployment-output" />
        </Flex>
      </Box>
    </Stack>
  );
}

function CallSnippets({ schema, snippet, onSnippet }: { schema: DeploymentSchema; snippet: Snippet; onSnippet: (s: Snippet) => void }) {
  const { t } = useTranslation();
  return (
    <Box>
      <Heading as="h3" textStyle="body" fontWeight="semibold">
        {t('deployments.detail.call')}
      </Heading>
      <Tabs.Root value={snippet} onValueChange={(e) => onSnippet(e.value as Snippet)} lazyMount mt="3">
        <Tabs.List aria-label={t('deployments.detail.call')}>
          <Tabs.Indicator />
          {SNIPPETS.map((id) => (
            <Tabs.Trigger key={id} value={id} data-testid={`deployment-snippet-${id}`}>
              {t(`deployments.detail.snippet.${id}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {SNIPPETS.map((id) => (
          <Tabs.Content key={id} value={id} pt="3">
            <Box
              as="pre"
              p="4"
              borderWidth="1px"
              borderColor="border"
              borderRadius="l2"
              bg="surface-raised"
              overflowX="auto"
              fontFamily="mono"
              textStyle="mono-sm"
              data-testid="deployment-snippet"
            >
              {schema.snippets[id]}
            </Box>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Box>
  );
}

function JsonBlock({ label, value, testId }: { label: string; value: unknown; testId: string }) {
  return (
    <Box flex="1" minW="16rem" maxW="100%">
      <Text textStyle="body-sm" fontWeight="semibold" mb="2">
        {label}
      </Text>
      <Box
        as="pre"
        p="3"
        borderWidth="1px"
        borderColor="border"
        borderRadius="l2"
        bg="surface-raised"
        overflowX="auto"
        fontFamily="mono"
        textStyle="mono-sm"
        data-testid={testId}
      >
        {JSON.stringify(value, null, 2)}
      </Box>
    </Box>
  );
}
