import { useState } from 'react'
import { Link, createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useDemo } from '../features/drills/store'
import { date, percent } from '../features/drills/data'
import {
  Badge,
  Card,
  Missing,
  PageHead,
  Progress,
  Table,
} from '../features/drills/components/display'
import { Button, Field, Tabs } from '../features/drills/components/forms'
import { DownloadButton } from '../features/drills/components/actions'
import { Chart } from '../features/drills/components/metric-chart'
import { BackLink } from '../features/drills/components/project-navigation'
import { modelLink, runLink } from '../features/drills/navigation'
import { useProject } from '../features/drills/hooks'
import { DeployDialog, Playground } from '../features/drills/Models'

export const Route = createFileRoute('/projects/$projectId/models/$modelId')({
  component: ModelDetail,
})

function ModelDetail() {
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

