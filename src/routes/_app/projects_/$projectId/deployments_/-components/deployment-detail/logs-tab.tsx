import * as React from 'react';
import { Button, Card, Flex, Table } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { ToneBadge } from '@/components/shared/tone-badge';
import { SimpleSelect } from '@/components/simple-select';
import { useDeploymentLogs } from '@/features/deployments/queries';
import { useCurrentDeployment } from './use-current-deployment';

/** 2xx succeeded, 4xx is the caller's problem, 5xx is ours. */
function statusTone(status: number) {
  if (status < 300) return 'success' as const;
  if (status < 500) return 'warning' as const;
  return 'error' as const;
}

export function LogsTab() {
  const { project, deployment } = useCurrentDeployment();
  const [filter, setFilter] = React.useState('all');
  const logs = useDeploymentLogs(project.id, deployment.id).data ?? [];
  const visible = logs.filter((entry) => filter === 'all' || String(entry.status).startsWith(filter.charAt(0)));

  return (
    <Card.Root as="section" aria-labelledby="request-log-title" variant="outline" overflow="hidden">
      <Flex wrap="wrap" align="center" gap="2" px="5" py="3" borderBottomWidth="1px" borderColor="border">
        <Card.Title as="h2" id="request-log-title" me="auto" textStyle="body" fontWeight="semibold">
          Request log
        </Card.Title>
        <SimpleSelect
          label="Filter by status"
          hideLabel
          size="sm"
          width="136px"
          value={filter}
          onChange={setFilter}
          items={[
            { label: 'All statuses', value: 'all' },
            { label: '2xx', value: '2xx' },
            { label: '4xx', value: '4xx' },
            { label: '5xx', value: '5xx' },
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toaster.create({
              type: 'info',
              title: 'Log export is not available in this demo.',
            })
          }
        >
          <Download />
          Download
        </Button>
      </Flex>
      {visible.length === 0 ? (
        <EmptyNotice
          minH="48"
          title="No requests"
          description={
            logs.length === 0
              ? `This deployment is ${deployment.status.toLowerCase()}, so nothing is reaching it.`
              : 'No requests match this status filter.'
          }
        />
      ) : (
        <Table.ScrollArea>
          <Table.Root variant="data" minW="720px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader px="5">Time</Table.ColumnHeader>
                <Table.ColumnHeader>Method</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Latency</Table.ColumnHeader>
                <Table.ColumnHeader>Client</Table.ColumnHeader>
                <Table.ColumnHeader>Request ID</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visible.map((entry) => (
                <Table.Row key={entry.requestId}>
                  <Table.Cell px="5" fontFamily="mono" fontSize="xs" fontVariantNumeric="tabular-nums">
                    {entry.time}
                  </Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="xs" fontWeight="medium" color="fg">
                    {entry.method}
                  </Table.Cell>
                  <Table.Cell>
                    <ToneBadge tone={statusTone(entry.status)} dot>
                      {entry.status}
                    </ToneBadge>
                  </Table.Cell>
                  <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                    {entry.latency}
                  </Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="xs">
                    {entry.client}
                  </Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="xs">
                    {entry.requestId}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
    </Card.Root>
  );
}
