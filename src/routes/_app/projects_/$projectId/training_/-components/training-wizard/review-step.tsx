import { Button } from '@/components/ui/button'
import type {
  TrainingScheduler,
  TrainingSplit,
} from '@/features/dashboard/data'
import { formatLearningRate } from '@/features/training/format'

export function ReviewBlock({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold">{value}</p>
      </div>
      <Button
        variant="link"
        className="shrink-0 text-xs"
        onClick={onEdit}
        aria-label={`Edit ${label.toLowerCase()}`}
      >
        Edit
      </Button>
    </div>
  )
}

export function ReviewStep({
  datasetName,
  split,
  architectureName,
  epochs,
  batchSize,
  learningRate,
  scheduler,
  earlyStopping,
  computeName,
  spot,
  onEditStep,
}: {
  datasetName: string
  split: TrainingSplit
  architectureName: string
  epochs: number
  batchSize: number
  learningRate: number
  scheduler: TrainingScheduler
  earlyStopping: boolean
  computeName: string
  spot: boolean
  onEditStep: (step: number) => void
}) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Review and start
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Double-check your configuration before starting the run.
        </p>
      </div>
      <div className="mt-6 grid gap-2.5">
        <ReviewBlock
          label="Dataset"
          value={datasetName}
          onEdit={() => onEditStep(0)}
        />
        <ReviewBlock
          label="Split"
          value={`${split.train}% / ${split.validation}% / ${split.test}%`}
          onEdit={() => onEditStep(0)}
        />
        <ReviewBlock
          label="Model"
          value={architectureName}
          onEdit={() => onEditStep(1)}
        />
        <ReviewBlock
          label="Configuration"
          value={`${epochs} epochs · batch ${batchSize} · lr ${formatLearningRate(learningRate)} (${scheduler})${earlyStopping ? ' · early stopping' : ''}`}
          onEdit={() => onEditStep(2)}
        />
        <ReviewBlock
          label="Compute"
          value={`${computeName}${spot ? ' · spot' : ''}`}
          onEdit={() => onEditStep(3)}
        />
      </div>
      <div className="mt-5 rounded-lg bg-warning-muted p-3 text-xs text-warning">
        Starting this run will immediately begin billing against your workspace
        credits.
      </div>
    </section>
  )
}
