import { Download, FileText } from 'lucide-react'
import { toaster } from '@/components/toaster'

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
import { useCurrentModel } from './use-current-model'

export function FilesTab() {
  const { model, detail } = useCurrentModel()
  return (
    <Card size="flush">
      <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
        <CardTitle className="mr-auto">Artifacts</CardTitle>
        <code className="rounded bg-muted px-2 py-1 text-xs">
          drills://models/{model.id}
        </code>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.files.map((file) => (
              <TableRow key={file.name}>
                <TableCell className="px-5">
                  <span className="flex items-center gap-2 font-mono text-[13px] text-foreground">
                    <FileText className="size-4 text-muted-foreground" />
                    {file.name}
                  </span>
                </TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {file.size}
                </TableCell>
                <TableCell>{model.created}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toaster.create({
                        type: 'info',
                        title: `Downloading ${file.name} is not available in this demo.`,
                      })
                    }
                  >
                    <Download />
                    Download
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
