import { Link } from '@tanstack/react-router'
import { Download, FileText, Image as ImageIcon, Table2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from 'cn'
import type { Dataset, Project } from '@/features/dashboard/data'

import { downloadJson, itemNoun } from './helpers'

const modalityIcon = {
  image: ImageIcon,
  text: FileText,
  tabular: Table2,
} as const

export function DatasetHeader({
  dataset,
  project,
}: {
  dataset: Dataset
  project: Project
}) {
  const Icon = modalityIcon[dataset.modality]
  const isReady = dataset.status === 'Ready'
  const stats: Array<[string, string | number]> = [
    [
      itemNoun(dataset).replace(/^./, (c) => c.toUpperCase()),
      dataset.items.toLocaleString('en-US'),
    ],
    [
      dataset.modality === 'text' ? 'Labels' : 'Classes',
      dataset.classes || 'Pending',
    ],
    ['Storage', dataset.size],
    ['Split', dataset.split],
  ]

  return (
    <Card size="flush" className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[16px] font-semibold tracking-tight text-slate-900">
                {dataset.name}
              </h1>
              <Badge className="border-0 bg-indigo-50 font-semibold text-indigo-600">
                v{dataset.version}
              </Badge>
              <Badge
                className={cn(
                  'border-0 font-semibold',
                  isReady
                    ? 'bg-emerald-50 text-emerald-600'
                    : dataset.status === 'Error'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-amber-50 text-amber-600',
                )}
              >
                {isReady ? '✓ Ready' : dataset.status}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {dataset.modality} dataset ·{' '}
              {dataset.items.toLocaleString('en-US')} {itemNoun(dataset)} ·{' '}
              {dataset.classes}{' '}
              {dataset.modality === 'text' ? 'labels' : 'classes'} ·{' '}
              {dataset.size}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="px-3.5 shadow-xs"
            onClick={() =>
              downloadJson(`${dataset.name}-manifest.json`, dataset)
            }
          >
            <Download className="size-4" />
            Download
          </Button>
          {isReady ? (
            <Button asChild size="lg" className="px-3.5 shadow-xs">
              <Link
                to="/projects/$projectId/training/new"
                params={{ projectId: project.id }}
                search={{ dataset: dataset.id }}
              >
                Create Training →
              </Link>
            </Button>
          ) : (
            <Button disabled size="lg" className="px-3.5 shadow-xs">
              Create Training →
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-4">
        {stats.map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              'px-6 py-4',
              index < stats.length - 1 && 'border-slate-100 sm:border-r',
            )}
          >
            <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 capitalize">
              {value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
