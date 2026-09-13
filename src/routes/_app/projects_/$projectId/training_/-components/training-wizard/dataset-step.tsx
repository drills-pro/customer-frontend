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
import {
  Slider,
  SliderBar,
  SliderDragger,
  SliderMark,
} from '@/components/ui/slider'
import type { Dataset, TrainingSplit } from '@/features/dashboard/data'

const splitColors = ['bg-primary', 'bg-indigo-400', 'bg-indigo-200']

export function DatasetStep({
  datasets,
  datasetId,
  setDatasetId,
  split,
  setSplit,
  projectId,
}: {
  datasets: Dataset[]
  datasetId: string
  setDatasetId: (id: string) => void
  split: TrainingSplit
  setSplit: (split: TrainingSplit) => void
  projectId: string
}) {
  const dataset = datasets.find((item) => item.id === datasetId)
  const sliderMin = 5
  const sliderMax = 95
  const boundaries = [split.train, split.train + split.validation]
  const splitRows = [
    ['Train', split.train],
    ['Validation', split.validation],
    ['Test', split.test],
  ] as const

  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Choose a dataset
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick the ready dataset this run will train on, then set how it's
          split.
        </p>
      </div>
      {datasets.length ? (
        <>
          <div className="mt-6 grid gap-2.5">
            {datasets.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="option"
                onClick={() => setDatasetId(item.id)}
                aria-pressed={datasetId === item.id}
                className="w-full justify-between gap-4 rounded-xl text-left aria-pressed:[&_[data-dataset-icon]]:bg-primary aria-pressed:[&_[data-dataset-icon]]:text-primary-foreground"
              >
                <span className="flex min-w-0 items-center gap-3.5">
                  <span
                    data-dataset-icon
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-primary"
                  >
                    <Database className="size-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {item.items.toLocaleString('en-US')} items ·{' '}
                      {item.classes} classes · v{item.version}
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-primary opacity-0 group-aria-pressed/button:opacity-100"
                />
              </Button>
            ))}
          </div>

          <div className="mt-5 border-t pt-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">
                Train / validation / test split
              </h3>
              <span className="text-xs text-muted-foreground">
                Drag the dividers to adjust
              </span>
            </div>
            <Slider
              min={sliderMin}
              max={sliderMax}
              step={1}
              minStepsBetweenThumbs={5}
              value={boundaries}
              onValueChange={([train, validationEnd]) =>
                setSplit({
                  train,
                  validation: validationEnd - train,
                  test: 100 - validationEnd,
                })
              }
            >
              <SliderBar className="h-8">
                <SliderMark index={0} className="bg-primary">
                  <span className="truncate text-xs font-semibold text-white">
                    Train {split.train}%
                  </span>
                </SliderMark>
                <SliderMark index={1} className="bg-indigo-400">
                  <span className="truncate text-xs font-semibold text-white">
                    {split.validation}%
                  </span>
                </SliderMark>
                <SliderMark index={2} className="bg-indigo-200">
                  <span className="truncate text-xs font-semibold text-white">
                    {split.test}%
                  </span>
                </SliderMark>
              </SliderBar>
              <SliderDragger
                label="Train split"
                valueText={`Train ${split.train}%`}
                className="h-5 w-1 rounded-sm border-0 bg-white"
              />
              <SliderDragger
                label="Validation split"
                valueText={`Validation ${split.validation}%, test ${split.test}%`}
                className="h-5 w-1 rounded-sm border-0 bg-white"
              />
            </Slider>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {splitRows.map(([label, percentage], index) => (
                <div key={label} className="min-w-0 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className={`size-2 shrink-0 rounded-sm ${splitColors[index]}`}
                    />
                    {label}
                  </div>
                  <strong className="mt-0.5 block leading-tight">
                    {percentage}% ·{' '}
                    {Math.round(
                      (dataset?.items ?? 0) * (percentage / 100),
                    ).toLocaleString('en-US')}{' '}
                    items
                  </strong>
                </div>
              ))}
            </div>
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
