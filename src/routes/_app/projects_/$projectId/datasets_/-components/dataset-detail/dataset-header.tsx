import { Link } from '@tanstack/react-router'
import { Download, FileText, Image as ImageIcon, Table2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntityHeader } from '@/components/shared/entity-header'
import { cn } from 'cn'

import { downloadJson, itemNoun } from './helpers'
import { useCurrentDataset } from './use-current-dataset'

const modalityIcon = {
  image: ImageIcon,
  text: FileText,
  tabular: Table2,
} as const

export function DatasetHeader() {
  const { dataset, project } = useCurrentDataset()
  const isReady = dataset.status === 'Ready'

  return (
    <EntityHeader
      icon={modalityIcon[dataset.modality]}
      name={dataset.name}
      badges={
        <>
          <Badge className="border-0 bg-primary-muted font-semibold text-primary">
            v{dataset.version}
          </Badge>
          <Badge
            className={cn(
              'border-0 font-semibold',
              isReady
                ? 'bg-success-muted text-success'
                : dataset.status === 'Error'
                  ? 'bg-destructive-muted text-destructive'
                  : 'bg-warning-muted text-warning',
            )}
          >
            {isReady ? '✓ Ready' : dataset.status}
          </Badge>
        </>
      }
      meta={
        <>
          {dataset.modality} dataset · {dataset.items.toLocaleString('en-US')}{' '}
          {itemNoun(dataset)} · {dataset.classes}{' '}
          {dataset.modality === 'text' ? 'labels' : 'classes'} · {dataset.size}
        </>
      }
      actions={
        <>
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
        </>
      }
      stats={[
        {
          label: itemNoun(dataset).replace(/^./, (c) => c.toUpperCase()),
          value: dataset.items.toLocaleString('en-US'),
        },
        {
          label: dataset.modality === 'text' ? 'Labels' : 'Classes',
          value: dataset.classes || 'Pending',
        },
        { label: 'Storage', value: dataset.size },
        {
          label: 'Split',
          value: <span className="capitalize">{dataset.split}</span>,
        },
      ]}
    />
  )
}
