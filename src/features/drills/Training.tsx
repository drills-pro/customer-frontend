import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useDemo } from './store'
import { addActivity, id, percent } from './data'
import type { Project, Run } from './data'
import {
  Badge,
  Card,
  Empty,
  Facts,
  Missing,
  PageHead,
  Progress,
  Steps,
  Table,
} from './components/display'
import { Button, Field, Filter, Tabs, Toolbar } from './components/forms'
import { Confirm, Modal } from './components/overlays'
import { DownloadButton } from './components/actions'
import { Chart } from './components/metric-chart'
import { BackLink } from './components/project-navigation'
import { datasetLink, modelLink, runLink, trainingLink } from './navigation'
import { useProject } from './hooks'

export function TrainingList({ project }: { project: Project }) {
  const { state, update, notify } = useDemo()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [dataset, setDataset] = useState('')
  const [author, setAuthor] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [compare, setCompare] = useState(false)
  const runs = state.runs.filter(
    (r) =>
      r.projectId === project.id &&
      r.name.toLowerCase().includes(query.toLowerCase()) &&
      (!status || r.status === status) &&
      (!dataset ||
        state.datasets.find((d) => d.id === r.datasetId)?.name === dataset) &&
      (!author || r.author === author),
  )
  const selection = state.runs.filter(
    (r) => selected.includes(r.id) && r.projectId === project.id,
  )
  function clone() {
    const copies = selection.map((r) => ({
      ...r,
      id: id('run'),
      name: `${r.name}-copy`,
      createdAt: Date.now(),
      startedAt: Date.now(),
      duration: 30000,
      progress: 0,
      status: 'Queued' as const,
      accuracy: 0,
      author: 'AR',
    }))
    update((s) => {
      s.runs.unshift(...copies)
      copies.forEach((r) =>
        addActivity(
          s,
          project.id,
          `Training ${r.name} queued`,
          'training',
          r.id,
        ),
      )
    })
    notify(`${copies.length} training run(s) cloned.`)
    setSelected([])
  }
  return (
    <>
      <Toolbar query={query} setQuery={setQuery}>
        <Filter
          label="All statuses"
          value={status}
          onChange={setStatus}
          options={['Queued', 'Running', 'Completed', 'Failed', 'Stopped']}
        />
        <Filter
          label="All datasets"
          value={dataset}
          onChange={setDataset}
          options={state.datasets
            .filter((d) => d.projectId === project.id)
            .map((d) => d.name)}
        />
        <Filter
          label="Anyone"
          value={author}
          onChange={setAuthor}
          options={['AR', 'PN', 'SC']}
        />
        <Button asChild>
          <Link {...trainingLink(project.id)}>
            <Plus size={15} /> Create Training
          </Link>
        </Button>
      </Toolbar>
      <Card>
        <Table
          headers={[
            <input
              type="checkbox"
              aria-label="Select all visible runs"
              checked={
                runs.length > 0 && runs.every((r) => selected.includes(r.id))
              }
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...new Set([...selected, ...runs.map((r) => r.id)])]
                    : selected.filter(
                        (selectedId) => !runs.some((r) => r.id === selectedId),
                      ),
                )
              }
            />,
            'Run',
            'Status',
            'Architecture',
            'Dataset',
            'Best metric',
            'Progress',
            'By',
            '',
          ]}
        >
          {runs.map((r) => (
            <tr
              key={r.id}
              className={selected.includes(r.id) ? 'selected-row' : ''}
            >
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${r.name}`}
                  checked={selected.includes(r.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, r.id]
                        : selected.filter((selectedId) => selectedId !== r.id),
                    )
                  }
                />
              </td>
              <td>
                <Link {...runLink(project.id, r.id)}>{r.name}</Link>
              </td>
              <td>
                <Badge status={r.status} />
              </td>
              <td>{r.architecture}</td>
              <td>
                <Link
                  {...datasetLink(project.id, r.datasetId)}
                  className="muted"
                >
                  {state.datasets.find((d) => d.id === r.datasetId)?.name}
                </Link>
              </td>
              <td>
                <b>{r.accuracy ? `${percent(r.accuracy)} acc` : '—'}</b>
              </td>
              <td>{r.progress}%</td>
              <td>
                <span className="initials">{r.author}</span>
              </td>
              <td>
                <button
                  className="text-button"
                  onClick={() =>
                    void navigate({
                      ...trainingLink(project.id),
                      search: { clone: r.id },
                    })
                  }
                >
                  Clone
                </button>
              </td>
            </tr>
          ))}
        </Table>
        {!runs.length && (
          <Empty
            title="No training runs found"
            description="Create a run or adjust your filters."
          />
        )}
      </Card>
      {selection.length > 0 && (
        <div className="selection-bar">
          <span>
            {selection.length} run{selection.length !== 1 ? 's' : ''} selected
          </span>
          <div className="actions">
            <button onClick={() => setSelected([])}>Clear</button>
            <button onClick={clone}>Clone</button>
            <Button
              disabled={selection.length < 2}
              onClick={() => setCompare(true)}
            >
              Compare runs
            </Button>
          </div>
        </div>
      )}
      {compare && (
        <Modal title="Compare training runs" onClose={() => setCompare(false)}>
          <Table headers={['Metric', ...selection.map((r) => r.name)]}>
            {[
              'Architecture',
              'Status',
              'Accuracy',
              'Epochs',
              'Batch size',
              'Learning rate',
            ].map((label) => (
              <tr key={label}>
                <td>{label}</td>
                {selection.map((r) => (
                  <td key={r.id}>
                    {label === 'Architecture' ? (
                      r.architecture
                    ) : label === 'Status' ? (
                      <Badge status={r.status} />
                    ) : label === 'Accuracy' ? (
                      percent(r.accuracy)
                    ) : label === 'Epochs' ? (
                      r.epochs
                    ) : label === 'Batch size' ? (
                      r.batchSize
                    ) : (
                      r.learningRate
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </Table>
          <p className="muted section-space">
            Metrics are illustrative and use each run’s saved configuration.
          </p>
        </Modal>
      )}
    </>
  )
}
const augmentationOptions = [
  'Random flip',
  'Random crop',
  'Color jitter',
  'Rotation ±15°',
  'Mixup',
  'Random erasing',
]
export function TrainingWizard() {
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
export function RunDetail() {
  const project = useProject()
  const { runId } = useParams({ strict: false })
  const { state, update, notify } = useDemo()
  const [tab, setTab] = useState('Metrics')
  const [stop, setStop] = useState(false)
  const [autoscroll, setAutoscroll] = useState(true)
  const [level, setLevel] = useState('')
  const logRef = useRef<HTMLPreElement>(null)
  const run = state.runs.find(
    (r) => r.id === runId && r.projectId === project?.id,
  )
  useEffect(() => {
    if (autoscroll && logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight
  }, [run?.progress, autoscroll, tab])
  if (!project || !run) return <Missing />
  const dataset = state.datasets.find((d) => d.id === run.datasetId)
  const model = state.models.find((m) => m.runId === run.id)
  const epoch = Math.floor((run.progress / 100) * run.epochs)
  const active = run.status === 'Running' || run.status === 'Queued'
  const logLines = [
    `INFO  Loading dataset ${dataset?.name} (${dataset?.items} items)`,
    `INFO  Building ${run.architecture} with pretrained weights`,
    `INFO  Optimizer=AdamW lr=${run.learningRate} scheduler=cosine`,
    ...Array.from(
      { length: epoch },
      (_, i) =>
        `INFO  Epoch ${i + 1}/${run.epochs}  loss=${(3.812 / (i + 1)).toFixed(3)}  val_acc=${(0.412 + (0.53 * (i + 1)) / run.epochs).toFixed(3)}  312 items/s`,
    ),
    ...(run.status === 'Failed'
      ? [
          'ERROR CUDA out of memory. Try a smaller batch size or larger instance.',
        ]
      : run.status === 'Stopped'
        ? ['WARN  Run stopped by Alex Rivera.']
        : run.status === 'Completed'
          ? ['INFO  Checkpoint saved. Model registered successfully.']
          : ['INFO  Waiting for next training step…']),
  ]
    .filter((l) => !level || l.startsWith(level))
    .join('\n')
  const logs = (
    <Card
      title="Logs"
      action={
        <div className="actions">
          <label className="checkbox-label small-text">
            <input
              type="checkbox"
              checked={autoscroll}
              onChange={(e) => setAutoscroll(e.target.checked)}
            />
            Autoscroll
          </label>
          <Filter
            label="All levels"
            value={level}
            onChange={setLevel}
            options={['INFO', 'WARN', 'ERROR']}
          />
          <DownloadButton name={`${run.name}.log`} content={logLines} />
        </div>
      }
    >
      <pre ref={logRef} className="code-block logs">
        {logLines || 'No logs at this level.'}
      </pre>
    </Card>
  )
  return (
    <>
      <BackLink project={project} section="training" name={run.name} />
      <PageHead
        title={
          <>
            {run.name} <Badge status={run.status} />
          </>
        }
        description={`Started by ${run.author === 'AR' ? 'Alex Rivera' : 'Priya Nair'} · ${run.architecture} · Demo training`}
        actions={
          <>
            <Button asChild variant="ghost">
              <Link {...trainingLink(project.id)} search={{ clone: run.id }}>
                Clone
              </Link>
            </Button>
            {active && (
              <Button variant="danger" onClick={() => setStop(true)}>
                Stop run
              </Button>
            )}
            {model && (
              <Button asChild>
                <Link {...modelLink(project.id, model.id)}>View model →</Link>
              </Button>
            )}
          </>
        }
      />
      <Card>
        <div className="run-stats pad">
          {[
            ['Epoch', `${epoch} / ${run.epochs}`],
            ['Step', `${Math.floor(run.progress * 120)} / 12,000`],
            ['Throughput', active ? '312 items/s' : '—'],
            ['GPU util', active ? '94%' : '0%'],
            ['GPU memory', active ? '18.2 / 24 GB' : '0 / 24 GB'],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <Progress value={run.progress} blue />
      </Card>
      <Tabs
        tabs={['Metrics', 'Logs', 'Config', 'Artifacts']}
        active={tab}
        onChange={setTab}
      />
      <div className="section-space stack">
        {tab === 'Metrics' && (
          <>
            <div className="two-col">
              <Card title="Loss">
                <div className="pad">
                  <Chart kind="loss" />
                </div>
              </Card>
              <Card title="Accuracy">
                <div className="pad">
                  <Chart />
                </div>
              </Card>
            </div>
            {logs}
          </>
        )}
        {tab === 'Logs' && logs}
        {tab === 'Config' && (
          <Card
            title="Saved configuration"
            action={
              <DownloadButton name={`${run.name}-config.json`} content={run} />
            }
          >
            <div className="pad">
              <Facts
                items={[
                  [
                    'Dataset',
                    <Link {...datasetLink(project.id, run.datasetId)}>
                      {dataset?.name}
                    </Link>,
                  ],
                  ['Architecture', run.architecture],
                  ['Epochs', run.epochs],
                  ['Batch size', run.batchSize],
                  ['Learning rate', run.learningRate],
                  ['Augmentations', run.augmentations.join(', ') || 'None'],
                  [
                    'Early stopping',
                    run.earlyStopping ? 'Enabled' : 'Disabled',
                  ],
                  ['Compute', run.compute],
                ]}
              />
            </div>
          </Card>
        )}
        {tab === 'Artifacts' &&
          (model ? (
            <Card title="Run artifacts">
              <div className="pad stack">
                <div className="split">
                  <span>model-manifest.json</span>
                  <DownloadButton
                    name={`${model.name}-manifest.json`}
                    content={{ ...model, sample: true }}
                  />
                </div>
                <div className="split">
                  <span>metrics.json</span>
                  <DownloadButton
                    name="metrics.json"
                    content={{
                      accuracy: model.accuracy,
                      f1: model.f1,
                      sample: true,
                    }}
                  />
                </div>
                <Link
                  {...modelLink(project.id, model.id)}
                  className="text-button"
                >
                  Open registered model →
                </Link>
              </div>
            </Card>
          ) : (
            <Empty
              title="No artifacts yet"
              description={
                run.status === 'Failed'
                  ? 'This run failed before saving a checkpoint. Clone it with a smaller batch size.'
                  : 'Artifacts appear after a successful training run.'
              }
            />
          ))}
      </div>
      {stop && (
        <Confirm
          title="Stop this training run?"
          description="Progress will be saved, but no model will be registered. You can clone this configuration to train again."
          label="Stop run"
          onClose={() => setStop(false)}
          onConfirm={() => {
            update((s) => {
              const r = s.runs.find((item) => item.id === run.id)!
              r.status = 'Stopped'
              addActivity(
                s,
                project.id,
                `Training ${r.name} stopped`,
                'training',
                r.id,
              )
            })
            notify('Training stopped.')
          }}
        />
      )}
    </>
  )
}
