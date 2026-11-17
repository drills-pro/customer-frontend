import { Alert, Box, Button, EmptyState, Heading, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { Cpu } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDeployments } from '@/modules/projects/api';
import type { DeploymentListItem } from '@/modules/projects/api';
import { useWorkspace } from '@/modules/workspaces';
import { DeploymentStatusBadge } from '@/modules/deployments/components/DeploymentStatusBadge';
import { errorKey } from '@/shared/api/errors';

const FROM = '/app/w/$slug/projects/$projectId/deployments/';

/** The project's deployments, newest first: each is a live endpoint for one trained model, and leads to its page. */
export function DeploymentsPage() {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const { projectId } = useParams({ from: FROM });
  const { data: deployments, error, isError, isPending, refetch } = useDeployments(workspaceId, projectId);

  return (
    <Stack gap="6">
      <Box>
        <Heading as="h2" textStyle="h2">
          {t('deployments.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('deployments.subtitle')}
        </Text>
      </Box>
      {isError ? (
        <Alert.Root status="error" colorPalette="danger" data-testid="deployments-load-error">
          <Alert.Indicator />
          <Alert.Content gap="3">
            <Alert.Title>{t('deployments.loadFailed')}</Alert.Title>
            <Alert.Description>{t(errorKey(error))}</Alert.Description>
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
              <Cpu />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('deployments.empty.title')}</EmptyState.Title>
            <EmptyState.Description>{t('deployments.empty.body')}</EmptyState.Description>
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
  return (
    <Table.ScrollArea borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised">
      <Table.Root variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('deployments.col.endpoint')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('deployments.col.status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('deployments.col.created')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {deployments.map((d) => (
            <Table.Row key={d.id} data-testid="deployment-row" data-deployment={d.id}>
              <Table.Cell>
                <Link
                  to="/w/$slug/projects/$projectId/deployments/$deploymentId"
                  params={{ slug, projectId, deploymentId: d.id }}
                  data-testid="deployment-link"
                >
                  <Text as="span" fontFamily="mono" color="brand-text" fontWeight="medium">
                    {d.route_prefix}
                  </Text>
                </Link>
              </Table.Cell>
              <Table.Cell>
                <DeploymentStatusBadge status={d.status} />
              </Table.Cell>
              <Table.Cell>{date.format(new Date(d.created_at))}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
