import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

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
import {
  formatAccuracy,
  formatF1,
  StageBadge,
} from '../../../-components/model-list'
import { useCurrentModel } from './use-current-model'

export function VersionsTab() {
  const { model, versions } = useCurrentModel()
  return (
    <Card size="flush">
      <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
        <CardTitle className="mr-auto">Versions</CardTitle>
        <span className="text-xs text-muted-foreground">
          Promoting a version repoints every deployment tracking “latest”.
        </span>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Version</TableHead>
              <TableHead>Source run</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead className="text-right">Macro F1</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...versions].reverse().map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5">
                  {item.id === model.id ? (
                    <span className="font-mono font-semibold text-foreground">
                      v{item.version}
                      <span className="ml-2 text-[11px] font-medium text-primary">
                        viewing
                      </span>
                    </span>
                  ) : (
                    <Link
                      to="/projects/$projectId/models/$modelId"
                      params={{ projectId: item.projectId, modelId: item.id }}
                      className="h-auto border-none p-0 font-mono font-medium text-primary"
                    >
                      v{item.version}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    to="/projects/$projectId/training/$runId"
                    params={{ projectId: item.projectId, runId: item.runId }}
                    className="h-auto border-none p-0 font-medium"
                  >
                    {item.runId}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-foreground">
                  {formatAccuracy(item.accuracy)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatF1(item.f1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.size}
                </TableCell>
                <TableCell>
                  <StageBadge stage={item.stage} />
                </TableCell>
                <TableCell>{item.created}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toast.info(
                        `Changing the stage of v${item.version} is not available in this demo.`,
                      )
                    }
                  >
                    {item.stage === 'Production' ? 'Archive' : 'Promote'}
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
