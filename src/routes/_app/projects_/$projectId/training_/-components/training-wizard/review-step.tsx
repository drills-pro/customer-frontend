import { Button } from '@/components/ui/button'
import { StepHeading } from './step-heading'

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
    <div className="rounded-lg p-4 ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <Button variant="link" className="text-xs" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <p className="mt-1.5 text-sm font-medium">{value}</p>
    </div>
  )
}

export function ReviewStep({
  datasetName,
  architectureName,
  epochs,
  batchSize,
  learningRate,
  earlyStopping,
  computeName,
  spot,
  onEditStep,
}: {
  datasetName: string
  architectureName: string
  epochs: number
  batchSize: number
  learningRate: string
  earlyStopping: boolean
  computeName: string
  spot: boolean
  onEditStep: (step: number) => void
}) {
  return (
    <section>
      <StepHeading
        title="Review and start"
        description="Double-check your configuration before starting the run."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ReviewBlock
          label="Dataset"
          value={datasetName}
          onEdit={() => onEditStep(0)}
        />
        <ReviewBlock
          label="Model"
          value={architectureName}
          onEdit={() => onEditStep(1)}
        />
        <ReviewBlock
          label="Configuration"
          value={`${epochs} epochs · batch ${batchSize} · ${learningRate} lr${earlyStopping ? ' · early stopping' : ''}`}
          onEdit={() => onEditStep(2)}
        />
        <ReviewBlock
          label="Compute"
          value={`${computeName}${spot ? ' · spot pricing' : ''}`}
          onEdit={() => onEditStep(3)}
        />
      </div>
      <div className="mt-5 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
        Starting this run will immediately begin billing against your workspace
        credits.
      </div>
    </section>
  )
}
