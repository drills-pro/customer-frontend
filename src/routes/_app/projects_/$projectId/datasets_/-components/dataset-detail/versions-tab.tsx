import { Download } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Dataset, DatasetDetailMock } from '@/features/dashboard/data'

import { downloadJson } from './helpers'

export function VersionsTab({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetailMock
}) {
  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Dataset versions</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Version</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.versions.map((version) => (
              <TableRow key={version.version}>
                <TableCell className="px-5">
                  <Badge variant="secondary">
                    v{version.version}
                    {version.version === dataset.version ? ' · current' : ''}
                  </Badge>
                </TableCell>
                <TableCell>{version.items.toLocaleString('en-US')}</TableCell>
                <TableCell>
                  <Badge variant="success">Ready</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {version.created}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download version ${version.version}`}
                    onClick={() =>
                      downloadJson(`${dataset.name}-v${version.version}.json`, {
                        ...dataset,
                        version: version.version,
                      })
                    }
                  >
                    <Download />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
