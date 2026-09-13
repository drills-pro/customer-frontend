import * as React from 'react'
import { Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
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
import type { Dataset, DatasetSample } from '@/features/dashboard/data'

export function TextPreview({
  dataset,
  samples,
}: {
  dataset: Dataset
  samples: Extract<DatasetSample, { modality: 'text' }>[]
}) {
  const [label, setLabel] = React.useState('all')
  const [split, setSplit] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const labels = Array.from(new Set(samples.map((sample) => sample.label)))
  const visible = samples.filter(
    (sample) =>
      (label === 'all' || sample.label === label) &&
      (split === 'all' || sample.split === split) &&
      sample.text.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-inset:--spacing(4)] [--card-section:--spacing(3)]">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger
              size="lg"
              className="w-36"
              aria-label="Filter by label"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All labels</SelectItem>
              {labels.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={split} onValueChange={setSplit}>
            <SelectTrigger
              size="lg"
              className="w-32"
              aria-label="Filter by split"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All splits</SelectItem>
              <SelectItem value="Train">Train</SelectItem>
              <SelectItem value="Validation">Validation</SelectItem>
              <SelectItem value="Test">Test</SelectItem>
            </SelectContent>
          </Select>
          <InputGroup size="lg" className="min-w-48 flex-1 sm:max-w-60">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search sample text"
              placeholder="Search text..."
            />
          </InputGroup>
        </div>
        <p className="text-xs text-muted-foreground sm:text-right">
          Showing {visible.length} of {dataset.items.toLocaleString('en-US')}
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {visible.length ? (
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Text</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Words</TableHead>
                <TableHead>Split</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((sample) => (
                <TableRow key={sample.id}>
                  <TableCell className="max-w-xl px-4 font-medium">
                    {sample.text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {sample.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sample.words}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {sample.split === 'Validation' ? 'Val' : sample.split}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="min-h-56">
            <EmptyHeader>
              <EmptyTitle>No matching samples</EmptyTitle>
              <EmptyDescription>
                Try a different label, split, or search.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
