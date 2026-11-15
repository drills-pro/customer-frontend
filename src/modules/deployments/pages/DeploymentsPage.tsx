import { Alert, Box, Button, EmptyState, Heading, Link as ChakraLink, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { CloudServer } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import type { DeploymentListItem } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { useDeploymentList } from '@/modules/deployments/api';
import { DeploymentStatusBadge } from '@/modules/deployments/components/DeploymentStatusBadge';
import { SHORT_ID_LENGTH } from '@/modules/deployments/constants';
import { deploymentErrorKey } from '@/modules/deployments/errors';

const FROM = '/app/w/$slug/projects/$projectId/deployments/';

/** The project's endpoints, newest first, each leading to its page. A deploying one moves to active by itself. */
export function DeploymentsPage() {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const { projectId } = useParams({ from: FROM });
  const { data: deployments, error, isError, isPending, refetch } = useDeploymentList(workspaceId, projectId);

  return (
    <Stack gap="6">
      <Box>
        <Heading as="h2" textStyle="h2">
          {t('deployments.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('deployments.list.subtitle')}
        </Text>
      </Box>
      {isError ? (
        <Alert.Root status="error" colorPalette="danger" data-testid="deployments-load-error">
          <Alert.Indicator />
          <Alert.Content gap="3">
            <Alert.Title>{t('deployments.list.loadFailed')}</Alert.Title>
            <Alert.Description>{t(deploymentErrorKey(error))}</Alert.Description>
            <Box>
              <Button size="sm" onClick={() => void refetch()}>
                {t('deployments.retry')}
              </Button>
            </Box>
          </Alert.Content>
        </Alert.Root>
      ) : isPending ? (
        <Skeleton h="48" />
      ) : deployments.length === 0 ? (
        <EmptyState.Root
          minH="64"
          borderWidth="1px"
          borderColor="border"
          borderRadius="l3"
          bg="surface-raised"
          data-testid="deployments-empty"
        >
          <EmptyState.Content>
            <EmptyState.Indicator>
              <CloudServer />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('deployments.list.empty.title')}</EmptyState.Title>
            <EmptyState.Description>{t('deployments.list.empty.body')}</EmptyState.Description>
            <Button asChild size="sm">
              <Link to="/w/$slug/projects/$projectId/training" params={{ slug, projectId }} data-testid="deployments-empty-runs">
                {t('deployments.list.empty.action')}
              </Link>
            </Button>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <DeploymentsTable deployments={deployments} slug={slug} projectId={projectId} />
      )}
    </Stack>
  );
}

function DeploymentsTable({ deployments, slug, projectId }: { deployments: DeploymentListItem[]; slug: string; projectId: string }) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  const newestFirst = [...deployments].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <Table.ScrollArea borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised">
      <Table.Root variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('deployments.list.col.deployment')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('deployments.list.col.status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('deployments.list.col.id')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {newestFirst.map((d) => (
            <Table.Row key={d.id} data-testid="deployments-row" data-deployment={d.id}>
              <Table.Cell>
                <ChakraLink asChild fontWeight="medium" color="brand-text">
                  <Link to="/w/$slug/projects/$projectId/deployments/$deploymentId" params={{ slug, projectId, deploymentId: d.id }}>
                    {date.format(new Date(d.created_at))}
                  </Link>
                </ChakraLink>
              </Table.Cell>
              <Table.Cell>
                <DeploymentStatusBadge status={d.status} />
              </Table.Cell>
              <Table.Cell>
                <Text as="span" textStyle="mono-sm" color="fg.muted">
                  {d.id.slice(0, SHORT_ID_LENGTH)}
                </Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
