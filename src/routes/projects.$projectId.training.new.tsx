import { useState } from 'react'
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { useDemo } from '../features/drills/store'
import { addActivity, id } from '../features/drills/data'
import type { Project, Run } from '../features/drills/data'
import {
  Badge,
  Card,
  Empty,
  Facts,
  Missing,
  Steps,
} from '../features/drills/components/display'
import { Button, Field } from '../features/drills/components/forms'
import { DownloadButton } from '../features/drills/components/actions'
import { BackLink } from '../features/drills/components/project-navigation'
import { runLink } from '../features/drills/navigation'
import { useProject } from '../features/drills/hooks'

export const Route = createFileRoute('/projects/$projectId/training/new')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { dataset?: string; clone?: string } => ({
    dataset: typeof search.dataset === 'string' ? search.dataset : undefined,
    clone: typeof search.clone === 'string' ? search.clone : undefined,
  }),
  component: TrainingWizard,
})

const augmentationOptions = [
  'Random flip',
  'Random crop',
  'Color jitter',
  'Rotation ±15°',
  'Mixup',
  'Random erasing',
]

function TrainingWizard() {
  const project = useProject()
  const { state } = useDemo()
  const search = useSearch({ strict: false })
  if (!project) return <Missing />
  const clone = state.runs.find(
    (r) => r.id === search.clone && r.projectId === project.id,
  )
  return (
    <TrainingForm
      key={`${project.id}-${clone?.id || search.dataset || ''}`}
      project={project}
      clone={clone}
      initialDataset={search.dataset}
    />
  )
}

function TrainingForm({
  project,
  clone,
  initialDataset,
}: {
  project: Project
  clone?: Run
  initialDataset?: string
}) {
  const { state, update, notify } = useDemo()
  const navigate = useNavigate()
  const datasets = state.datasets.filter(
    (d) => d.projectId === project.id && d.status === 'Ready',
  )
  const architectures =
    project.task === 'Image Classification'
      ? [
          'EfficientNet-B4',
          'ResNet-50',
          'ViT-Base/16',
          'ConvNeXt-Tiny',
          'MobileNetV3',
        ]
      : project.task === 'Object Detection'
        ? ['YOLOv8', 'Faster R-CNN']
        : project.task === 'Segmentation'
          ? ['U-Net', 'DeepLabV3']
          : project.task === 'Tabular Prediction'
            ? ['XGBoost', 'Random Forest']
            : project.task === 'Time Series'
              ? ['LSTM', 'Temporal Transformer']
              : ['BERT', 'DistilBERT']
  const [step, setStep] = useState(0)
  const [datasetId, setDatasetId] = useState(
    clone?.datasetId ||
      datasets.find((d) => d.id === initialDataset)?.id ||
      datasets[0]?.id ||
      '',
  )
  const [architecture, setArchitecture] = useState(
    clone?.architecture || architectures[0],
  )
  const [epochs, setEpochs] = useState(clone?.epochs || 30)
  const [batch, setBatch] = useState(clone?.batchSize || 32)
  const [lr, setLr] = useState(clone?.learningRate || '1e-3')
  const [augmentations, setAugmentations] = useState(
    clone?.augmentations || ['Random flip', 'Random crop', 'Rotation ±15°'],
  )
  const [early, setEarly] = useState(clone?.earlyStopping ?? true)
  const [compute, setCompute] = useState(clone?.compute || '1× A10G')
  const [name, setName] = useState(clone ? `${clone.name}-copy` : '')
  const [mode, setMode] = useState('Simple')
  const [error, setError] = useState('')
  const dataset = datasets.find((d) => d.id === datasetId)
  const config = {
    dataset: dataset?.name,
    architecture,
    epochs,
    batch_size: batch,
    learning_rate: lr,
    augmentation: augmentations,
    early_stopping: early,
    compute,
  }
  const yaml = `dataset: ${dataset?.name || ''}\narchitecture: ${architecture}\nepochs: ${epochs}\nbatch_size: ${batch}\nlearning_rate: ${lr}\nearly_stopping: ${early}\ncompute: ${compute}\naugmentation:\n${augmentations.map((a) => `  - ${a}`).join('\n')}`
  function submit() {
    if (!dataset) {
      setError('Select a ready dataset before continuing.')
      setStep(0)
      return
    }
    if (
      !Number.isFinite(epochs) ||
      epochs < 1 ||
      epochs > 100 ||
      !Number.isInteger(epochs)
    ) {
      setError('Epochs must be a whole number between 1 and 100.')
      setStep(2)
      return
    }
    setError('')
    if (step < 4) {
      setStep(step + 1)
      return
    }
    const runId = id('run')
    const runName =
      name.trim() ||
      `${architecture.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${state.runs.filter((r) => r.projectId === project.id).length + 1}`
    const now = Date.now()
    update((s) => {
      s.runs.unshift({
        id: runId,
        projectId: project.id,
        datasetId,
        name: runName,
        architecture,
        epochs,
        batchSize: batch,
        learningRate: lr,
        augmentations,
        earlyStopping: early,
        compute,
        status: 'Queued',
        progress: 0,
        accuracy: 0,
        startedAt: now,
        createdAt: now,
        duration: 30000,
        author: 'AR',
      })
      addActivity(
        s,
        project.id,
        `Training ${runName} queued`,
        'training',
        runId,
      )
    })
    notify('Training queued. This demo run completes in about 30 seconds.')
    void navigate(runLink(project.id, runId))
  }
  return (
    <>
      <BackLink project={project} section="training" name="New run" />
      <div className="training-wizard">
        <Card>
          <Steps
            items={['Dataset', 'Model', 'Configure', 'Compute', 'Review']}
            step={step}
            onStep={setStep}
          />
        </Card>
        <Card>
          <form
            className="pad roomy"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div className="split">
              <h1 className="section-title">
                {
                  [
                    'Select a dataset',
                    'Choose a model',
                    'Configure training',
                    'Choose compute',
                    'Review your training',
                  ][step]
                }
              </h1>
              {step === 2 && (
                <div className="segmented">
                  {['Simple', 'Advanced', 'YAML'].map((m) => (
                    <button
                      type="button"
                      key={m}
                      className={m === mode ? 'selected' : ''}
                      onClick={() => setMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-stack">
              {step === 0 && (
                <>
                  {datasets.length ? (
                    datasets.map((d) => (
                      <label
                        key={d.id}
                        className={`choice-card radio-card ${datasetId === d.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="dataset"
                          checked={datasetId === d.id}
                          onChange={() => setDatasetId(d.id)}
                        />
                        <span>
                          <strong>
                            {d.name} <span className="tag">v{d.version}</span>
                          </strong>
                          <small>
                            {d.items.toLocaleString('en-US')} items · {d.split}{' '}
                            · {d.size}
                          </small>
                        </span>
                        <Badge status={d.status} />
                      </label>
                    ))
                  ) : (
                    <Empty
                      title="Add a ready dataset first"
                      description="Upload data or add a sample dataset to start training."
                    >
                      <Button asChild>
                        <Link
                          to="/projects/$projectId/$section"
                          params={{
                            projectId: project.id,
                            section: 'datasets',
                          }}
                        >
                          Go to datasets
                        </Link>
                      </Button>
                    </Empty>
                  )}
                  <div className="notice">
                    Sample split: 80% train / 10% validation / 10% test.
                  </div>
                </>
              )}
              {step === 1 &&
                architectures.map((a, i) => (
                  <label
                    key={a}
                    className={`choice-card radio-card ${a === architecture ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="architecture"
                      checked={a === architecture}
                      onChange={() => setArchitecture(a)}
                    />
                    <span>
                      <strong>
                        {a}{' '}
                        {i === 0 && <span className="tag">Recommended</span>}
                      </strong>
                      <small>
                        Pretrained weights ·{' '}
                        {i === 0
                          ? 'Balanced accuracy and speed'
                          : 'Ready for fine-tuning'}
                      </small>
                    </span>
                  </label>
                ))}
              {step === 2 &&
                (mode === 'YAML' ? (
                  <>
                    <p className="muted">
                      Generated from your configuration. Use Simple or Advanced
                      to edit.
                    </p>
                    <pre className="code-block">{yaml}</pre>
                    <DownloadButton
                      name="training-config.yaml"
                      content={yaml}
                    />
                  </>
                ) : (
                  <>
                    <Field
                      label={`Epochs${mode === 'Simple' ? ` · ${epochs}` : ''}`}
                      hint="More epochs improve accuracy but increase cost."
                    >
                      <input
                        type={mode === 'Simple' ? 'range' : 'number'}
                        min={1}
                        max={100}
                        value={epochs}
                        onChange={(e) => setEpochs(Number(e.target.value))}
                      />
                    </Field>
                    <div className="two-col">
                      <Field label="Batch size">
                        <select
                          value={batch}
                          onChange={(e) => setBatch(Number(e.target.value))}
                        >
                          {[8, 16, 32, 64, 128].map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Learning rate">
                        <select
                          value={lr}
                          onChange={(e) => setLr(e.target.value)}
                        >
                          <option value="1e-3">Auto (1e-3, cosine)</option>
                          <option value="1e-4">Low (1e-4)</option>
                          <option value="1e-2">High (1e-2)</option>
                        </select>
                      </Field>
                    </div>
                    {[
                      'Image Classification',
                      'Object Detection',
                      'Segmentation',
                    ].includes(project.task) && (
                      <div>
                        <h3>Data augmentation</h3>
                        <div className="augmentation-grid">
                          {augmentationOptions.map((a) => (
                            <label key={a}>
                              <span>{a}</span>
                              <input
                                type="checkbox"
                                role="switch"
                                checked={augmentations.includes(a)}
                                onChange={(e) =>
                                  setAugmentations(
                                    e.target.checked
                                      ? [...augmentations, a]
                                      : augmentations.filter((v) => v !== a),
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={early}
                        onChange={(e) => setEarly(e.target.checked)}
                      />
                      Enable early stopping (patience 5)
                    </label>
                    {mode === 'Advanced' && (
                      <div className="notice">
                        Optimizer: AdamW · Scheduler: cosine · Warmup: 500
                        steps. These defaults are used by the simulator.
                      </div>
                    )}
                  </>
                ))}
              {step === 3 && (
                <>
                  {['1× A10G', '1× T4', '2× A100', 'CPU'].map((c, i) => (
                    <label
                      className={`choice-card radio-card ${compute === c ? 'selected' : ''}`}
                      key={c}
                    >
                      <input
                        type="radio"
                        name="compute"
                        checked={compute === c}
                        onChange={() => setCompute(c)}
                      />
                      <span>
                        <strong>{c}</strong>
                        <small>
                          {
                            [
                              '24 GB GPU memory',
                              '16 GB GPU memory',
                              '160 GB GPU memory',
                              '8 vCPU · 32 GB memory',
                            ][i]
                          }{' '}
                          · {project.region}
                        </small>
                      </span>
                    </label>
                  ))}
                  <div className="notice">
                    Compute and costs are simulated. No resources will be
                    provisioned.
                  </div>
                </>
              )}
              {step === 4 && (
                <>
                  <Field label="Run name">
                    <input
                      autoFocus
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={`${architecture.toLowerCase()}-run`}
                    />
                  </Field>
                  <Facts
                    items={[
                      ['Dataset', dataset?.name],
                      ['Model', architecture],
                      ['Epochs', epochs],
                      ['Batch size', batch],
                      ['Compute', compute],
                      ['Early stopping', early ? 'Enabled' : 'Disabled'],
                    ]}
                  />
                  <div className="notice success-notice">
                    Ready to train. The demo run will complete in about 30
                    seconds and register a model automatically.
                  </div>
                </>
              )}
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="form-actions spread">
              <Button
                variant="ghost"
                onClick={() =>
                  step
                    ? setStep(step - 1)
                    : void navigate({
                        to: '/projects/$projectId/$section',
                        params: { projectId: project.id, section: 'training' },
                      })
                }
              >
                ← Back
              </Button>
              <Button type="submit" disabled={!datasets.length}>
                {step === 4 ? 'Start training' : 'Continue →'}
              </Button>
            </div>
          </form>
        </Card>
        <div className="stack">
          <Card title="Run summary">
            <div className="pad">
              <Facts
                items={[
                  ['Dataset', dataset?.name || 'Not selected'],
                  ['Split', '80 / 10 / 10'],
                  ['Model', architecture],
                  ['Epochs', epochs],
                  ['Batch size', batch],
                  ['Instance', compute],
                ]}
              />
            </div>
          </Card>
          <Card title="Estimate">
            <div className="pad">
              <p className="estimate">
                ${(epochs * (compute === '2× A100' ? 0.48 : 0.16)).toFixed(2)}{' '}
                <small>sample cost</small>
              </p>
              <p className="muted small-text">
                No charges. The demo simulates a complete training job.
              </p>
              <div className="notice success-notice">
                Expected accuracy 92–95% based on sample runs.
              </div>
            </div>
          </Card>
          <DownloadButton
            name="training-config.json"
            content={config}
            label="Export configuration"
          />
        </div>
      </div>
    </>
  )
}

