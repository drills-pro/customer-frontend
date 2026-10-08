import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import type { DatasetSample } from '@/features/dashboard/data'
import { useCurrentDataset } from './use-current-dataset'

export function ImagePreview() {
  const { dataset, detail } = useCurrentDataset()
  const samples = detail.samples.filter(
    (sample): sample is Extract<DatasetSample, { modality: 'image' }> =>
      sample.modality === 'image',
  )
  const [label, setLabel] = React.useState('all')
  const [split, setSplit] = React.useState('all')
  const labels = Array.from(new Set(samples.map((sample) => sample.label)))
  const visible = samples.filter(
    (sample) =>
      (label === 'all' || sample.label === label) &&
      (split === 'all' || sample.split === split),
  )

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-inset:--spacing(4)] [--card-section:--spacing(3)]">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger
              size="lg"
              className="w-36"
              aria-label="Filter by class"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
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
        </div>
        <p className="text-xs text-muted-foreground sm:text-right">
          Showing {visible.length} of {dataset.items.toLocaleString('en-US')}
        </p>
      </CardHeader>
      <CardContent className="p-4">
        {visible.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {visible.map((sample) => (
              <figure
                key={sample.id}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={sample.image}
                  alt={`${sample.label} dataset sample`}
                  loading="lazy"
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                  <Badge className="border-0 bg-black/70 text-white">
                    {sample.label}
                  </Badge>
                  <span className="sr-only">{sample.split} split</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <Empty className="min-h-56">
            <EmptyHeader>
              <EmptyTitle>No matching samples</EmptyTitle>
              <EmptyDescription>
                Try a different class or split.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
