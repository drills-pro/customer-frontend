import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { useDemo } from '../features/drills/store'
import { addActivity } from '../features/drills/data'
import {
  Badge,
  Card,
  Empty,
  Facts,
  Missing,
  PageHead,
  Progress,
} from '../features/drills/components/display'
import { Button, Filter, Tabs } from '../features/drills/components/forms'
import { Confirm } from '../features/drills/components/overlays'
import { DownloadButton } from '../features/drills/components/actions'
import { Chart } from '../features/drills/components/metric-chart'
import { BackLink } from '../features/drills/components/project-navigation'
import {
  datasetLink,
  modelLink,
  trainingLink,
} from '../features/drills/navigation'
import { useProject } from '../features/drills/hooks'

export const Route = createFileRoute('/projects/$projectId/training/$runId')({
  component: RunDetail,
})

function RunDetail() {
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

