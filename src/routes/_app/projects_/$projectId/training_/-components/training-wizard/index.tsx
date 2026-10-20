import * as React from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { RouteBreadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isNotFound } from '@/api/errors'
import { PageError, PageLoading } from '@/components/shared/query-states'
import type { ApiArchitecture, ApiComputeOption } from '@/features/catalog/api'
import { useArchitectures, useComputeOptions } from '@/features/catalog/queries'
import { useProjectDetail } from '@/features/dashboard/context'
import type {
  Dataset,
  TrainingRun,
  TrainingScheduler,
  TrainingSplit,
} from '@/features/dashboard/data'
import { useProjectDatasets } from '@/features/datasets/queries'
import { formatDuration, formatLearningRate } from '@/features/training/format'
import {
  useStartTraining,
  useTrainingEstimate,
  useTrainingRun,
} from '@/features/training/queries'
import { ComputeStep } from './compute-step'
import { ConfigureStep } from './configure-step'
import { DatasetStep } from './dataset-step'
import { ModelStep } from './model-step'
import { ReviewStep } from './review-step'
import { steps } from './types'

const defaultSplit: TrainingSplit = { train: 80, validation: 10, test: 10 }
const route = getRouteApi('/_app/projects_/$projectId/training_/new')

/**
 * Loads what the form's first render needs: the ready datasets, the model and
 * compute catalogs, and the run being cloned. The form starts from them once.
 */
export function TrainingWizard() {
  const { dataset: initialDatasetId, clone: cloneId } = route.useSearch()
  const { project } = useProjectDetail()
  const datasets = useProjectDatasets(project.id, { readyOnly: true })
  const architectures = useArchitectures(project.taskType)
  const computeOptions = useComputeOptions()
  const clone = useTrainingRun(project.id, cloneId ?? '', {
    enabled: Boolean(cloneId),
  })

  // A run to clone that no longer exists just means starting from defaults.
  const cloneError =
    clone.error && !isNotFound(clone.error) ? clone.error : null
  const error =
    datasets.error ?? architectures.error ?? computeOptions.error ?? cloneError
  if (error) {
    return (
      <PageError
        title="Could not load the training options"
        error={error}
        onRetry={() => {
          void datasets.refetch()
          void architectures.refetch()
          void computeOptions.refetch()
          if (cloneId) void clone.refetch()
        }}
      />
    )
  }
  if (
    !datasets.data ||
    !architectures.data?.length ||
    !computeOptions.data?.length ||
    (cloneId && clone.isPending)
  ) {
    return <PageLoading />
  }

  return (
    <TrainingWizardForm
      datasets={datasets.data}
      architectures={architectures.data}
      computeOptions={computeOptions.data}
      clone={clone.data}
      initialDatasetId={initialDatasetId}
    />
  )
}

function TrainingWizardForm({
  datasets,
  architectures,
  computeOptions,
  clone,
  initialDatasetId,
}: {
  datasets: Dataset[]
  architectures: ApiArchitecture[]
  computeOptions: ApiComputeOption[]
  clone: TrainingRun | undefined
  initialDatasetId: string | undefined
}) {
  const navigate = useNavigate()
  const { project } = useProjectDetail()
  const startRun = useStartTraining(project.id)
  const [step, setStep] = React.useState(0)
  const [datasetId, setDatasetId] = React.useState(
    clone
      ? clone.datasetId
      : (datasets.find((item) => item.id === initialDatasetId)?.id ??
          datasets.at(0)?.id ??
          ''),
  )
  const [split, setSplit] = React.useState<TrainingSplit>(
    clone?.split ?? defaultSplit,
  )
  const initialArchitecture =
    architectures.find((item) => item.name === clone?.architecture) ??
    architectures[0]
  const [architectureId, setArchitectureId] = React.useState(
    initialArchitecture.id,
  )
  const [epochs, setEpochs] = React.useState(clone?.epochs ?? 30)
  const [batchSize, setBatchSize] = React.useState(clone?.batchSize ?? 32)
  const [learningRate, setLearningRate] = React.useState(
    clone?.learningRate ?? 1e-3,
  )
  const [scheduler, setScheduler] = React.useState<TrainingScheduler>(
    clone?.scheduler ?? 'cosine',
  )
  const [selectedAugmentations, setSelectedAugmentations] = React.useState<
    string[]
  >(clone?.augmentations ?? ['Random flip'])
  const [earlyStopping, setEarlyStopping] = React.useState(
    clone?.earlyStopping ?? true,
  )
  const [instanceId, setInstanceId] = React.useState(
    clone?.instanceId ?? 'a10g-1',
  )
  const [spot, setSpot] = React.useState(clone?.spot ?? false)
  const starting = startRun.isPending

  const dataset = datasets.find((item) => item.id === datasetId)
  const architecture =
    architectures.find((item) => item.id === architectureId) ?? architectures[0]
  // A cloned run may name an instance that is no longer offered.
  const compute =
    computeOptions.find((item) => item.id === instanceId) ?? computeOptions[0]
  const estimated = useTrainingEstimate(
    project.id,
    dataset && {
      dataset_id: dataset.id,
      architecture_id: architecture.id,
      epochs,
      batch_size: batchSize,
      instance_id: compute.id,
      spot,
    },
  ).data
  const estimate = {
    hours: estimated?.hours ?? 0,
    cost: estimated?.cost_usd ?? 0,
  }
  const summaryRows = [
    ['Dataset', dataset?.name ?? '—'],
    ['Split', `${split.train} / ${split.validation} / ${split.test}`],
    ['Model', architecture.name],
    ['Epochs', String(epochs)],
    ['Learning rate', `${formatLearningRate(learningRate)}, ${scheduler}`],
    ['Batch size', String(batchSize)],
    ['Instance', `${compute.name}${spot ? ' (spot)' : ''}`],
  ] as const

  function toggleAugmentation(value: string) {
    setSelectedAugmentations((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    )
  }

  function startTraining() {
    if (!dataset || starting) return
    startRun.mutate(
      {
        dataset_id: dataset.id,
        architecture_id: architecture.id,
        config: {
          epochs,
          batch_size: batchSize,
          split,
          learning_rate: learningRate,
          scheduler,
          augmentations: selectedAugmentations,
          early_stopping: earlyStopping,
          instance_id: compute.id,
          spot,
        },
      },
      {
        onSuccess: (run) => {
          toaster.create({
            type: 'success',
            title: `Training ${run.name} started.`,
          })
          void navigate({
            to: '/projects/$projectId/training/$runId',
            params: { projectId: project.id, runId: run.id },
          })
        },
      },
    )
  }

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1180px] min-w-0 flex-1 p-4 sm:p-6 xl:py-10"
    >
      <RouteBreadcrumbs className="mb-4" />

      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create training
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a new model training run for {project.name}.
        </p>
      </div>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <nav aria-label="Training steps" className="grid gap-0.5">
          {steps.map((label, index) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              disabled={index > step}
              onClick={() => setStep(index)}
              aria-label={label}
              aria-current={step === index ? 'step' : undefined}
              className="h-auto w-full justify-start gap-2.5 rounded-lg px-3 py-2.5 text-left font-normal text-muted-foreground disabled:opacity-100 aria-[current=step]:bg-primary-muted aria-[current=step]:font-semibold aria-[current=step]:text-primary"
            >
              <span
                className={`flex size-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  index < step
                    ? 'bg-success text-background'
                    : index === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < step ? <Check className="size-3" /> : index + 1}
              </span>
              {label}
            </Button>
          ))}
        </nav>

        <Card size="flush" className="min-w-0">
          <CardContent className="p-6">
            {step === 0 && (
              <DatasetStep
                datasets={datasets}
                datasetId={datasetId}
                setDatasetId={setDatasetId}
                split={split}
                setSplit={setSplit}
                projectId={project.id}
              />
            )}
            {step === 1 && (
              <ModelStep
                architectures={architectures}
                architectureId={architectureId}
                setArchitectureId={setArchitectureId}
              />
            )}
            {step === 2 && (
              <ConfigureStep
                epochs={epochs}
                setEpochs={setEpochs}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                learningRate={learningRate}
                setLearningRate={setLearningRate}
                scheduler={scheduler}
                setScheduler={setScheduler}
                selectedAugmentations={selectedAugmentations}
                toggleAugmentation={toggleAugmentation}
                earlyStopping={earlyStopping}
                setEarlyStopping={setEarlyStopping}
              />
            )}
            {step === 3 && (
              <ComputeStep
                computeOptions={computeOptions}
                instanceId={compute.id}
                setInstanceId={setInstanceId}
                spot={spot}
                setSpot={setSpot}
              />
            )}
            {step === 4 && (
              <ReviewStep
                datasetName={dataset?.name ?? 'Not selected'}
                split={split}
                architectureName={architecture.name}
                epochs={epochs}
                batchSize={batchSize}
                learningRate={learningRate}
                scheduler={scheduler}
                earlyStopping={earlyStopping}
                computeName={compute.name}
                spot={spot}
                onEditStep={setStep}
              />
            )}

            <div className="mt-8 flex justify-between border-t pt-5">
              {step === 0 ? (
                <span />
              ) : (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft />
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button disabled={!dataset} onClick={() => setStep(step + 1)}>
                  Continue
                  <ChevronRight />
                </Button>
              ) : (
                <Button disabled={!dataset || starting} onClick={startTraining}>
                  {starting ? 'Starting run…' : 'Start training'}
                  <ChevronRight />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <aside className="grid min-w-0 gap-4">
          <Card size="lg">
            <CardHeader>
              <CardTitle>Run summary</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 py-1.5 text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card size="lg">
            <CardHeader>
              <CardTitle>Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-baseline gap-2">
                <strong className="text-3xl font-semibold">
                  ${estimate.cost.toFixed(2)}
                </strong>
                <span className="text-sm text-muted-foreground">
                  ≈ {formatDuration(estimate.hours)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Billed per second. You are charged only for actual runtime.
                {spot ? ' Spot pricing applied.' : ''}
              </p>
              <div className="mt-3 rounded-lg bg-success-muted p-3 text-xs text-success">
                Expected metric {architecture.expected_accuracy} based on
                similar runs.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
