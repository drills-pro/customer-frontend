import { Link } from '@tanstack/react-router'
import { Database } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import type { Dataset } from '@/features/dashboard/data'
import { StepHeading } from './step-heading'

export function DatasetStep({
  datasets,
  datasetId,
  setDatasetId,
  projectId,
}: {
  datasets: Dataset[]
  datasetId: string
  setDatasetId: (id: string) => void
  projectId: string
}) {
  return (
    <section>
      <StepHeading
        title="Choose a dataset"
        description="Pick the ready dataset this run will train on."
      />
      {datasets.length ? (
        <>
          <div className="mt-5 grid gap-2.5">
            {datasets.map((dataset) => (
              <Button
                key={dataset.id}
                type="button"
                variant="option"
                onClick={() => setDatasetId(dataset.id)}
                aria-pressed={datasetId === dataset.id}
                className="w-full justify-between gap-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Database className="size-5 shrink-0 text-indigo-600" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {dataset.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {dataset.items.toLocaleString('en-US')} items ·{' '}
                      {dataset.classes} classes · v{dataset.version}
                    </span>
                  </span>
                </span>
                {datasetId === dataset.id && (
                  <span className="text-indigo-600">●</span>
                )}
              </Button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ['Train', '80%'],
              ['Validation', '10%'],
              ['Test', '10%'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md bg-slate-50 p-3 text-center"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Empty className="mt-5 min-h-56 border">
          <EmptyHeader>
            <EmptyTitle>Add a ready dataset first</EmptyTitle>
            <EmptyDescription>
              Upload data and wait for processing to finish before starting
              training.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/projects/$projectId/datasets" params={{ projectId }}>
                Go to datasets
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </section>
  )
}
