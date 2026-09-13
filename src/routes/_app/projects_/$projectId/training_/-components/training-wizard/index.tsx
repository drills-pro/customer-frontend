import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardLayout } from '@/features/dashboard/context'
import type { Dataset, Project, TrainingRun } from '@/features/dashboard/data'
import {
  architecturesFor,
  computeOptions,
  estimateTraining,
  formatDuration,
  trainingYaml,
} from '@/features/dashboard/training'
import { ComputeStep } from './compute-step'
import { ConfigureStep } from './configure-step'
import { DatasetStep } from './dataset-step'
import { ModelStep } from './model-step'
import { ReviewStep } from './review-step'
import { SummaryRow } from './summary-row'
import { steps } from './types'
import type { ConfigureMode } from './types'

export function TrainingWizard({
  project,
  organizationName,
  datasets,
  initialDatasetId,
  clone,
}: {
  project: Project
  organizationName: string
  datasets: Dataset[]
  initialDatasetId?: string
  clone?: TrainingRun
}) {
  const navigate = useNavigate()
  const { preferences, updatePreferences } = useDashboardLayout()
  const architectures = architecturesFor(project)
  const [step, setStep] = React.useState(0)
  const [maxStepReached, setMaxStepReached] = React.useState(0)
  const goToStep = (index: number) => {
    setStep(index)
    setMaxStepReached((current) => Math.max(current, index))
  }
  const [datasetId, setDatasetId] = React.useState(
    clone
      ? clone.datasetId
      : (datasets.find((item) => item.id === initialDatasetId)?.id ??
          datasets.at(0)?.id ??
          ''),
  )
  const initialArchitecture =
    architectures.find((item) => item.name === clone?.architecture) ??
    architectures[0]
  const [architectureId, setArchitectureId] = React.useState(
    initialArchitecture.id,
  )
  const [epochs, setEpochs] = React.useState(clone?.epochs ?? 30)
  const [batchSize, setBatchSize] = React.useState(clone?.batchSize ?? 32)
  const [learningRate, setLearningRate] = React.useState<
    'auto' | 'low' | 'high'
  >(clone?.learningRate ?? 'auto')
  const [selectedAugmentations, setSelectedAugmentations] = React.useState<
    string[]
  >(clone?.augmentations ?? ['Random flip', 'Random crop', 'Rotation ±15°'])
  const [earlyStopping, setEarlyStopping] = React.useState(
    clone?.earlyStopping ?? true,
  )
  const [mode, setMode] = React.useState<ConfigureMode>('simple')
  const [optimizer, setOptimizer] = React.useState(clone?.optimizer ?? 'AdamW')
  const [weightDecay, setWeightDecay] = React.useState(
    clone?.weightDecay ?? '0.01',
  )
  const [warmupSteps, setWarmupSteps] = React.useState(
    clone?.warmupSteps ?? 500,
  )
  const [mixedPrecision, setMixedPrecision] = React.useState(
    clone?.mixedPrecision ?? 'bf16',
  )
  const [instanceId, setInstanceId] = React.useState(
    clone?.instanceId ?? 'a10g-1',
  )
  const [spot, setSpot] = React.useState(clone?.spot ?? false)
  const [starting, setStarting] = React.useState(false)

  const dataset = datasets.find((item) => item.id === datasetId)
  const architecture =
    architectures.find((item) => item.id === architectureId) ?? architectures[0]
  const compute =
    computeOptions.find((item) => item.id === instanceId) ?? computeOptions[0]
  const estimate = dataset
    ? estimateTraining(dataset, architecture, epochs, batchSize, compute, spot)
    : { hours: 0, cost: 0 }
  const yaml = trainingYaml({
    datasetName: dataset?.name ?? '',
    architecture: architecture.id,
    epochs,
    batchSize,
    learningRate,
    augmentations: selectedAugmentations,
    earlyStopping,
    optimizer,
    weightDecay,
    warmupSteps,
    mixedPrecision,
    instanceId,
    spot,
  })

  function toggleAugmentation(value: string) {
    setSelectedAugmentations((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    )
  }

  async function startTraining() {
    if (!dataset || starting) return
    setStarting(true)
    const runId = `run-${crypto.randomUUID().slice(0, 8)}`
    const projectRunCount = preferences.trainingRuns.filter(
      (run) => run.projectId === project.id,
    ).length
    const runName = `${architecture.id}-${projectRunCount + 1}`
    const run: TrainingRun = {
      id: runId,
      projectId: project.id,
      datasetId: dataset.id,
      name: runName,
      architecture: architecture.name,
      status: 'Running',
      epochs,
      batchSize,
      learningRate,
      augmentations: selectedAugmentations,
      earlyStopping,
      optimizer,
      weightDecay,
      warmupSteps,
      mixedPrecision,
      instanceId: compute.id,
      instanceName: compute.name,
      spot,
      estimatedHours: estimate.hours,
      estimatedCost: estimate.cost,
      progress: 40,
      step: 4_820,
      totalSteps: 12_000,
      throughput: dataset.modality === 'image' ? '312 img/s' : '312 items/s',
      gpuUtilization: compute.id === 'cpu' ? '0%' : '94%',
      gpuMemory: compute.id === 'cpu' ? '0 / 0 GB' : '18.2 / 24 GB',
      author: 'Alex Rivera',
      startedAt: Date.now(),
    }
    updatePreferences({
      trainingRuns: [run, ...preferences.trainingRuns],
      uploads: [
        {
          id: `training-${runId}`,
          orgId: project.orgId,
          icon: 'success',
          lead: `Training ${runName}`,
          text: 'started',
          time: 'Just now',
          action: 'View',
        },
        ...preferences.uploads,
      ],
    })
    toast.success(`Training ${runName} started.`)
    await navigate({
      to: '/projects/$projectId/training/$runId',
      params: { projectId: project.id, runId },
    })
  }

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>{organizationName}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{project.name}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New training run</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create training
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a new model training run for {project.name}.
        </p>
      </div>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-4">
        <Card size="sm" className="gap-0">
          <CardContent className="grid">
            {steps.map((label, index) => (
              <Button
                key={label}
                type="button"
                variant="ghost"
                disabled={index > maxStepReached}
                onClick={() => setStep(index)}
                aria-label={label}
                aria-current={step === index ? 'step' : undefined}
                className={`h-auto w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-sm font-normal transition-colors disabled:pointer-events-none disabled:opacity-50 ${step === index ? 'bg-indigo-50 font-medium text-indigo-700 hover:bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${index < step ? 'bg-emerald-500 text-white' : index === step ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {index < step ? <Check className="size-3.5" /> : index + 1}
                </span>
                {label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card size="flush" className="min-w-0 lg:col-span-2">
          <CardContent className="p-6">
            {step === 0 && (
              <DatasetStep
                datasets={datasets}
                datasetId={datasetId}
                setDatasetId={setDatasetId}
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
                mode={mode}
                setMode={setMode}
                epochs={epochs}
                setEpochs={setEpochs}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                learningRate={learningRate}
                setLearningRate={setLearningRate}
                selectedAugmentations={selectedAugmentations}
                toggleAugmentation={toggleAugmentation}
                earlyStopping={earlyStopping}
                setEarlyStopping={setEarlyStopping}
                optimizer={optimizer}
                setOptimizer={setOptimizer}
                weightDecay={weightDecay}
                setWeightDecay={setWeightDecay}
                warmupSteps={warmupSteps}
                setWarmupSteps={setWarmupSteps}
                mixedPrecision={mixedPrecision}
                setMixedPrecision={setMixedPrecision}
                yaml={yaml}
              />
            )}
            {step === 3 && (
              <ComputeStep
                instanceId={instanceId}
                setInstanceId={setInstanceId}
                spot={spot}
                setSpot={setSpot}
              />
            )}
            {step === 4 && (
              <ReviewStep
                datasetName={dataset?.name ?? 'Not selected'}
                architectureName={architecture.name}
                epochs={epochs}
                batchSize={batchSize}
                learningRate={learningRate}
                earlyStopping={earlyStopping}
                computeName={compute.name}
                spot={spot}
                onEditStep={goToStep}
              />
            )}

            <div className="mt-8 flex justify-between border-t pt-5">
              {step === 0 ? (
                <Button variant="outline" asChild>
                  <Link
                    to="/projects/$projectId/datasets"
                    params={{ projectId: project.id }}
                  >
                    Cancel
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => goToStep(step - 1)}>
                  <ChevronLeft />
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button disabled={!dataset} onClick={() => goToStep(step + 1)}>
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

        <aside className="grid gap-4">
          <Card size="lg">
            <CardHeader>
              <CardTitle>Run summary</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryRow label="Dataset" value={dataset?.name ?? '—'} />
              <SummaryRow label="Split" value="80 / 10 / 10" />
              <SummaryRow label="Model" value={architecture.name} />
              <SummaryRow label="Epochs" value={String(epochs)} />
              <SummaryRow label="Batch size" value={String(batchSize)} />
              <SummaryRow
                label="Instance"
                value={`${compute.name}${spot ? ' (spot)' : ''}`}
              />
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
              <p className="mt-2 text-xs text-muted-foreground">
                Billed per second. You are charged only for actual runtime.
                {spot ? ' Spot pricing applied.' : ''}
              </p>
              <div className="mt-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800">
                Expected metric {architecture.accuracy} based on similar runs.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
