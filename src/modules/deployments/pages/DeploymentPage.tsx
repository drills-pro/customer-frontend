import { useState } from 'react';
import { Alert, Box, Button, Flex, Heading, HStack, Link as ChakraLink, Skeleton, Stack, Tabs, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DeploymentStatus } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { NotFound } from '@/shared/ui/NotFound';
import { useDeployment, type Deployment } from '@/modules/deployments/api';
import { DeploymentActions } from '@/modules/deployments/components/DeploymentActions';
import { DeploymentStatusBadge } from '@/modules/deployments/components/DeploymentStatusBadge';
import { IntegrationTab } from '@/modules/deployments/components/IntegrationTab';
import { TestTab } from '@/modules/deployments/components/TestTab';
import { DEPLOYMENT_TABS, SHORT_ID_LENGTH, type DeploymentTab } from '@/modules/deployments/constants';
import { deploymentErrorKey, isNotFound } from '@/modules/deployments/errors';

const FROM = '/app/w/$slug/projects/$projectId/deployments/$deploymentId';

/** One endpoint: where it stands, its actions, how to call it and a place to try it. */
export function DeploymentPage() {
  const { t } = useTranslation();
  const { projectId, deploymentId } = useParams({ from: FROM });
  const { data: deployment, error, isError, isPending, refetch } = useDeployment(projectId, deploymentId);
  const [tab, setTab] = useState<DeploymentTab>('integration');

  if (isError) {
    if (isNotFound(error)) return <NotFound />;
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="deployment-load-error">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('deployments.detail.loadFailed')}</Alert.Title>
          <Alert.Description>{t(deploymentErrorKey(error))}</Alert.Description>
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
  // A deleted deployment leaves the list; its page reads as gone too.
  if (deployment.status === DeploymentStatus.Deleted) return <NotFound />;

  return (
    <Stack gap="6">
      <Header deployment={deployment} />
      <Outcome deployment={deployment} />
      <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value as DeploymentTab)} lazyMount unmountOnExit>
        <Tabs.List aria-label={t('deployments.detail.sections')}>
          <Tabs.Indicator />
          {DEPLOYMENT_TABS.map((id) => (
            <Tabs.Trigger key={id} value={id} data-testid={`deployment-tab-${id}`}>
              {t(`deployments.detail.tab.${id}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="integration" pt="5">
          <IntegrationTab deployment={deployment} />
        </Tabs.Content>
        <Tabs.Content value="test" pt="5">
          <TestTab deployment={deployment} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}

function Header({ deployment }: { deployment: Deployment }) {
  const { t, i18n } = useTranslation();
  const { slug } = useWorkspace();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <Flex wrap="wrap" align="flex-start" justify="space-between" gap="3">
      <Box minW="0">
        <Flex align="center" gap="3" wrap="wrap">
          <Heading as="h2" textStyle="h2">
            {t('deployments.detail.title')}
          </Heading>
          <DeploymentStatusBadge status={deployment.status} />
        </Flex>
        <HStack mt="1" columnGap="4" rowGap="1" wrap="wrap" color="fg.muted">
          <Text fontFamily="mono">{t('deployments.detail.id', { id: deployment.id.slice(0, SHORT_ID_LENGTH) })}</Text>
          <ChakraLink asChild color="brand-text">
            <Link
              to="/w/$slug/projects/$projectId/training/$runId"
              params={{ slug, projectId: deployment.project_id, runId: deployment.training_run_id }}
              data-testid="deployment-run-link"
            >
              {t('deployments.detail.fromRun', { id: deployment.training_run_id.slice(0, SHORT_ID_LENGTH) })}
            </Link>
          </ChakraLink>
          <Text>{t('deployments.detail.createdOn', { date: date.format(new Date(deployment.created_at)) })}</Text>
          <Text>{t('deployments.detail.rateLimit', { count: deployment.rate_limit_per_minute })}</Text>
        </HStack>
      </Box>
      <DeploymentActions deployment={deployment} />
    </Flex>
  );
}

/** How the endpoint stands, in words, when that is not plain serving. */
function Outcome({ deployment }: { deployment: Deployment }) {
  const { t } = useTranslation();
  if (deployment.status === DeploymentStatus.Stopped)
    return (
      <Alert.Root status="info" colorPalette="info" data-testid="deployment-stopped">
        <Alert.Indicator />
        <Alert.Description>{t('deployments.detail.stopped')}</Alert.Description>
      </Alert.Root>
    );
  return null;
}
