import * as React from 'react'
import { Download } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { Badge, BadgeDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDeploymentLogs } from '@/features/deployments/queries'
import { useCurrentDeployment } from './use-current-deployment'

/** 2xx succeeded, 4xx is the caller's problem, 5xx is ours. */
function statusTone(status: number) {
  if (status < 300) return 'success' as const
  if (status < 500) return 'warning' as const
  return 'error' as const
}

export function LogsTab() {
  const { project, deployment } = useCurrentDeployment()
  const [filter, setFilter] = React.useState('all')
  const logs = useDeploymentLogs(project.id, deployment.id).data ?? []
  const visible = logs.filter(
    (entry) =>
      filter === 'all' || String(entry.status).startsWith(filter.charAt(0)),
  )

  return (
    <Card size="flush">
      <CardHeader className="flex-row flex-wrap items-center gap-2 border-b [--card-section:--spacing(3)]">
        <CardTitle className="mr-auto">Request log</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger
            size="lg"
            aria-label="Filter by status"
            className="w-[136px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="2xx">2xx</SelectItem>
            <SelectItem value="4xx">4xx</SelectItem>
            <SelectItem value="5xx">5xx</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
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
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {visible.length === 0 ? (
          <Empty className="min-h-48 border-0">
            <EmptyHeader>
              <EmptyTitle>No requests</EmptyTitle>
              <EmptyDescription>
                {logs.length === 0
                  ? `This deployment is ${deployment.status.toLowerCase()}, so nothing is reaching it.`
                  : 'No requests match this status filter.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-5">Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Request ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((entry) => (
                <TableRow key={entry.requestId}>
                  <TableCell className="px-5 font-mono text-xs tabular-nums">
                    {entry.time}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-foreground">
                    {entry.method}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusTone(entry.status)}>
                      <BadgeDot />
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.latency}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.client}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.requestId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
