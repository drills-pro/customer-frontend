import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { Image, Plus, Upload } from 'lucide-react'
import { useDemo } from './store'
import { addActivity, date, id, percent } from './data'
import type { Deployment, Model, Project } from './data'
import {
  Badge,
  Card,
  Empty,
  Missing,
  PageHead,
  Progress,
  Table,
} from './components/display'
import { Button, Field, Filter, Tabs, Toolbar } from './components/forms'
import { Modal } from './components/overlays'
import { DownloadButton } from './components/actions'
import { Chart } from './components/metric-chart'
import { BackLink } from './components/project-navigation'
import { deploymentLink, modelLink, runLink } from './navigation'
import { useProject } from './hooks'

export function DeployDialog({
  project,
  model,
  onClose,
}: {
  project: Project
  model?: Model
  onClose: () => void
}) {
  const { state, update, notify } = useDemo()
  const navigate = useNavigate()
  const models = state.models.filter(
    (m) => m.projectId === project.id && m.stage !== 'Archived',
  )
  const [modelId, setModelId] = useState(model?.id || models[0]?.id || '')
  const [name, setName] = useState(model ? `${model.name}-endpoint` : '')
  const [environment, setEnvironment] =
    useState<Deployment['environment']>('Production')
  const [error, setError] = useState('')
  return (
    <Modal title="Create deployment" onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault()
          const selected = models.find((m) => m.id === modelId)
          if (!selected) {
            setError('Choose an available model.')
            return
          }
          if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(name)) {
            setError(
              'Use 2–63 lowercase letters, numbers, or hyphens. Start with a letter or number.',
            )
            return
          }
          if (
            state.deployments.some(
              (d) => d.projectId === project.id && d.name === name,
            )
          ) {
            setError('A deployment with this name already exists.')
            return
          }
          const deploymentId = id('endpoint')
          const now = Date.now()
          update((s) => {
            s.deployments.unshift({
              id: deploymentId,
              projectId: project.id,
              modelId,
              name,
              environment,
              status: 'Deploying',
              requests: 0,
              latency: 0,
              errors: 0,
              cost: 0,
              minReplicas: 1,
              maxReplicas: 10,
              concurrency: 40,
              createdAt: now,
              readyAt: now + 5000,
            })
            const m = s.models.find((item) => item.id === modelId)!
            if (environment === 'Production') m.stage = 'Production'
            addActivity(
              s,
              project.id,
              `Deployment ${name} started`,
              'deployment',
              deploymentId,
            )
          })
          notify(
            'Deployment created. Your demo endpoint will be ready in a few seconds.',
          )
          onClose()
          void navigate(deploymentLink(project.id, deploymentId))
        }}
      >
        <Field label="Endpoint name">
          <input
            autoFocus
            required
            maxLength={63}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="retail-classify-prod"
          />
        </Field>
        <Field label="Model version">
          <select
            required
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {!models.length && <option value="">No models available</option>}
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · v{m.version} · {percent(m.accuracy)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Environment">
          <select
            value={environment}
            onChange={(e) => {
              const value = e.target.value
              if (
                value === 'Production' ||
                value === 'Staging' ||
                value === 'Batch' ||
                value === 'Edge'
              )
                setEnvironment(value)
            }}
          >
            <option>Production</option>
            <option>Staging</option>
            <option>Batch</option>
            <option>Edge</option>
          </select>
        </Field>
        <div className="notice">
          This creates a simulated endpoint. No infrastructure is provisioned
          and no charges apply.
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!models.length}>
            Deploy model
          </Button>
        </div>
      </form>
    </Modal>
  )
}
export function ModelList({ project }: { project: Project }) {
  const { state } = useDemo()
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('')
  const [architecture, setArchitecture] = useState('')
  const models = state.models.filter(
    (m) =>
      m.projectId === project.id &&
      m.name.toLowerCase().includes(query.toLowerCase()) &&
      (!stage || m.stage === stage) &&
      (!architecture || m.architecture === architecture),
  )
  return (
    <>
      <Toolbar query={query} setQuery={setQuery}>
        <Filter
          label="All stages"
          value={stage}
          onChange={setStage}
          options={['Production', 'Staging', 'Archived']}
        />
        <Filter
          label="All architectures"
          value={architecture}
          onChange={setArchitecture}
          options={[
            ...new Set(
              state.models
                .filter((m) => m.projectId === project.id)
                .map((m) => m.architecture),
            ),
          ]}
        />
      </Toolbar>
      <Card>
        <Table
          headers={[
            'Model',
            'Version',
            'Source run',
            'Accuracy',
            'F1',
            'Size',
            'Stage',
            'Deployed',
          ]}
        >
          {models.map((m) => (
            <tr key={m.id}>
              <td>
                <Link {...modelLink(project.id, m.id)}>{m.name}</Link>
              </td>
              <td>
                <code className="tag">v{m.version}</code>
              </td>
              <td>
                <Link {...runLink(project.id, m.runId)} className="muted">
                  {state.runs.find((r) => r.id === m.runId)?.name}
                </Link>
              </td>
              <td>
                <b>{percent(m.accuracy)}</b>
              </td>
              <td>{m.f1.toFixed(3)}</td>
              <td>{m.size}</td>
              <td>
                <Badge status={m.stage} />
              </td>
              <td>
                <span
                  className={
                    state.deployments.some(
                      (d) => d.modelId === m.id && d.status === 'Live',
                    )
                      ? 'success'
                      : 'muted'
                  }
                >
                  ●
                </span>{' '}
                {state.deployments.some(
                  (d) => d.modelId === m.id && d.status === 'Live',
                )
                  ? 'Yes'
                  : 'No'}
              </td>
            </tr>
          ))}
        </Table>
        {!models.length && (
          <Empty
            title="No models found"
            description="A successful training run automatically registers a model here."
          />
        )}
      </Card>
    </>
  )
}
export function Playground({
  project,
  model,
  disabled = false,
  onPrediction,
}: {
  project: Project
  model: Model
  disabled?: boolean
  onPrediction?: () => void
}) {
  const visual = [
    'Image Classification',
    'Object Detection',
    'Segmentation',
  ].includes(project.task)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [sample, setSample] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  function choose(f?: File) {
    if (!f) return
    if (
      !['image/jpeg', 'image/png'].includes(f.type) ||
      f.size > 10 * 1024 * 1024
    ) {
      setError('Choose a JPG or PNG up to 10 MB.')
      return
    }
    setFile(f)
    setSample(false)
    setResult(false)
    setError('')
  }
  const labels = visual
    ? [
        'beverages_cola_330ml',
        'beverages_cola_500ml',
        'beverages_soda_330ml',
        'snacks_chips_large',
        'other',
      ]
    : project.task === 'Text Classification'
      ? [
          'support_billing',
          'support_delivery',
          'support_account',
          'feedback',
          'other',
        ]
      : project.task === 'Tabular Prediction'
        ? ['likely_to_churn', 'retained', 'uncertain', 'low_signal', 'other']
        : project.task === 'Named Entity Recognition'
          ? ['organization', 'person', 'location', 'date', 'other']
          : ['upward_trend', 'stable', 'downward_trend', 'seasonal', 'other']
  return (
    <div className="two-col">
      <Card title="Test this model">
        <div className="pad form-stack">
          {visual ? (
            <label
              className="dropzone prediction-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                choose(e.dataTransfer.files[0])
              }}
            >
              {preview ? (
                <img src={preview} alt="Selected prediction input" />
              ) : (
                <>
                  <Image size={32} />
                  <strong>
                    {sample
                      ? 'Sample shelf image selected'
                      : 'Drop an image here'}
                  </strong>
                  <span>or click to browse · JPG, PNG up to 10 MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png"
                aria-label="Prediction image"
                onChange={(e) => choose(e.target.files?.[0])}
              />
            </label>
          ) : (
            <Field
              label={
                project.task.includes('Text') || project.task.includes('Entity')
                  ? 'Input text'
                  : 'Input features (CSV)'
              }
            >
              <textarea
                rows={5}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setResult(false)
                }}
                placeholder="Enter a sample input to test this model"
              />
            </Field>
          )}
          <button
            className="text-button"
            onClick={() => {
              setSample(true)
              setFile(null)
              setInput(
                visual
                  ? ''
                  : project.task.includes('Text')
                    ? 'I need help with a charge on my account.'
                    : '120, 0.42, 3, 18',
              )
              setError('')
              setResult(false)
            }}
          >
            Use sample input
          </button>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button
            className="full-width"
            disabled={pending || disabled}
            onClick={() => {
              if (!sample && (visual ? !file : !input.trim())) {
                setError('Choose an input or use the sample first.')
                return
              }
              setError('')
              setPending(true)
              setResult(false)
              timer.current = setTimeout(() => {
                setPending(false)
                setResult(true)
                onPrediction?.()
              }, 800)
            }}
          >
            {disabled
              ? 'Endpoint is not live'
              : pending
                ? 'Running prediction…'
                : 'Run prediction'}
          </Button>
          <p className="muted small-text">
            Deterministic demo prediction · no files are uploaded.
          </p>
        </div>
      </Card>
      <Card title="Prediction">
        <div className="pad" aria-live="polite">
          {result ? (
            <>
              <div className="prediction-result">
                <div>
                  <small>Top prediction</small>
                  <strong>{labels[0]}</strong>
                </div>
                <b>96.4%</b>
              </div>
              <div className="distribution">
                {[96.4, 2.1, 0.9, 0.4, 0.2].map((v, i) => (
                  <div key={labels[i]}>
                    <div className="split">
                      <code>{labels[i]}</code>
                      <strong>{v}%</strong>
                    </div>
                    <Progress value={v} />
                  </div>
                ))}
              </div>
              <p className="muted small-text section-space">
                Inference time 82 ms · model v{model.version} · simulated result
              </p>
            </>
          ) : (
            <div className="prediction-empty">
              <Upload size={28} />
              <h3>
                {pending ? 'Analyzing your input…' : 'Ready when you are'}
              </h3>
              <p>Run a prediction to see the sample results.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
export function ModelDetail() {
  const project = useProject()
  const { modelId } = useParams({ strict: false })
  const { state, update, notify } = useDemo()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Playground')
  const [deploy, setDeploy] = useState(false)
  const model = state.models.find(
    (m) => m.id === modelId && m.projectId === project?.id,
  )
  if (!project || !model) return <Missing />
  const run = state.runs.find((r) => r.id === model.runId)
  const versions = state.models.filter(
    (m) => m.projectId === project.id && m.architecture === model.architecture,
  )
  return (
    <>
      <BackLink project={project} section="models" name={model.name} />
      <PageHead
        title={
          <>
            {model.name} <Badge status={model.stage} />
          </>
        }
        description={`Version v${model.version} · ${model.architecture} · PyTorch 2.4 · ${model.size}`}
        actions={
          <>
            <select
              aria-label="Model version"
              value={model.id}
              onChange={(e) =>
                void navigate(modelLink(project.id, e.target.value))
              }
            >
              {versions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · v{m.version}
                </option>
              ))}
            </select>
            <DownloadButton
              name={`${model.name}-manifest.json`}
              content={{ ...model, sample: true }}
            />
            <Button onClick={() => setDeploy(true)}>Deploy →</Button>
          </>
        }
      />
      <Tabs
        tabs={[
          'Performance',
          'Playground',
          'Explainability',
          'Lineage',
          'Files',
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="section-space stack">
        {tab === 'Playground' && (
          <Playground key={model.id} project={project} model={model} />
        )}
        {tab === 'Performance' && (
          <>
            <div className="two-col">
              <Card title="Validation accuracy">
                <div className="pad">
                  <Chart />
                </div>
              </Card>
              <Card title="Validation loss">
                <div className="pad">
                  <Chart kind="loss" />
                </div>
              </Card>
            </div>
            <Card title="Model stage">
              <div className="pad">
                <Field label="Lifecycle stage">
                  <select
                    value={model.stage}
                    onChange={(e) => {
                      const stage = e.target.value
                      if (
                        stage !== 'Production' &&
                        stage !== 'Staging' &&
                        stage !== 'Archived'
                      )
                        return
                      if (
                        stage === 'Archived' &&
                        state.deployments.some(
                          (d) =>
                            d.modelId === model.id && d.status !== 'Paused',
                        )
                      ) {
                        notify(
                          'Pause active deployments before archiving this model.',
                        )
                        return
                      }
                      update((s) => {
                        s.models.find((m) => m.id === model.id)!.stage = stage
                      })
                      notify('Model stage updated.')
                    }}
                  >
                    <option>Production</option>
                    <option>Staging</option>
                    <option>Archived</option>
                  </select>
                </Field>
              </div>
            </Card>
          </>
        )}
        {tab === 'Explainability' && (
          <Card title="Feature importance · illustrative report">
            <div className="pad distribution">
              {[
                'Shape / primary feature',
                'Color / secondary feature',
                'Texture / interaction',
                'Context',
                'Other features',
              ].map((n, i) => (
                <div key={n}>
                  <div className="split">
                    <span>{n}</span>
                    <span>{[42, 28, 16, 9, 5][i]}%</span>
                  </div>
                  <Progress value={[42, 28, 16, 9, 5][i]} />
                </div>
              ))}
              <p className="muted">
                These sample attributions explain the demo result; they are not
                computed from your input.
              </p>
            </div>
          </Card>
        )}
        {tab === 'Lineage' && (
          <Card title="Model lineage">
            <div className="pad lineage">
              <div>
                <span className="lineage-dot">1</span>
                <h3>Dataset</h3>
                <p>
                  {state.datasets.find((d) => d.id === run?.datasetId)?.name}
                </p>
              </div>
              <div>
                <span className="lineage-dot">2</span>
                <h3>Training</h3>
                <Link {...runLink(project.id, model.runId)}>{run?.name}</Link>
              </div>
              <div>
                <span className="lineage-dot">3</span>
                <h3>Registered model</h3>
                <p>
                  {model.name} · v{model.version}
                </p>
                <small>{date(model.createdAt)}</small>
              </div>
            </div>
          </Card>
        )}
        {tab === 'Files' && (
          <Card title="Model files">
            <Table headers={['File', 'Type', '']}>
              {[
                ['model-manifest.json', 'Model metadata'],
                ['metrics.json', 'Evaluation metrics'],
                ['config.json', 'Training configuration'],
              ].map(([name, type], i) => (
                <tr key={name}>
                  <td>
                    <code>{name}</code>
                  </td>
                  <td>{type}</td>
                  <td>
                    <DownloadButton
                      name={name}
                      content={
                        i === 0
                          ? { ...model, sample: true }
                          : i === 1
                            ? {
                                accuracy: model.accuracy,
                                f1: model.f1,
                                sample: true,
                              }
                            : run
                      }
                    />
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        )}
        <div className="three-col">
          {[
            ['Accuracy', percent(model.accuracy)],
            ['Macro F1', model.f1.toFixed(3)],
            ['Inference p95', '82 ms'],
          ].map(([label, value]) => (
            <Card key={label}>
              <div className="pad">
                <p className="muted">{label}</p>
                <p className="metric-value">{value}</p>
                <small className="success">Sample evaluation</small>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {deploy && (
        <DeployDialog
          project={project}
          model={model}
          onClose={() => setDeploy(false)}
        />
      )}
    </>
  )
}
export function DeploymentList({ project }: { project: Project }) {
  const { state } = useDemo()
  const [add, setAdd] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const deployments = state.deployments.filter(
    (d) =>
      d.projectId === project.id &&
      d.name.toLowerCase().includes(query.toLowerCase()) &&
      (!status || d.status === status),
  )
  return (
    <>
      <Toolbar query={query} setQuery={setQuery}>
        <Filter
          label="All statuses"
          value={status}
          onChange={setStatus}
          options={['Live', 'Deploying', 'Paused']}
        />
        <Button onClick={() => setAdd(true)}>
          <Plus size={15} />
          New Deployment
        </Button>
      </Toolbar>
      <div className="two-col">
        {deployments.map((d) => (
          <Card key={d.id}>
            <div className="pad">
              <div className="split">
                <div>
                  <Link
                    {...deploymentLink(project.id, d.id)}
                    className="resource-title"
                  >
                    {d.name}
                  </Link>
                  <p className="muted small-text">
                    {state.models.find((m) => m.id === d.modelId)?.name} ·{' '}
                    <span className="tag">{d.environment}</span>
                  </p>
                </div>
                <Badge status={d.status} />
              </div>
              <div className="deployment-metrics">
                {[
                  [
                    'Requests 24h',
                    Intl.NumberFormat('en-US', { notation: 'compact' }).format(
                      d.requests,
                    ),
                  ],
                  ['p95', d.latency ? `${d.latency}ms` : '—'],
                  ['Errors', `${d.errors}%`],
                  ['Cost/day', `$${d.cost.toFixed(2)}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {!deployments.length && (
        <Empty
          title="No deployments found"
          description="Deploy a trained model to create your first endpoint."
        />
      )}
      {add && <DeployDialog project={project} onClose={() => setAdd(false)} />}
    </>
  )
}
