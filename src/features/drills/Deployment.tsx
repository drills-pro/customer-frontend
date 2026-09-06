import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useDemo } from './store'
import { addActivity, number } from './data'
import type { Deployment } from './data'
import { Playground } from './Models'
import { Badge, Card, Facts, Missing, PageHead } from './components/display'
import { Button, Field, Tabs } from './components/forms'
import { Confirm, Modal } from './components/overlays'
import { CopyButton, DownloadButton } from './components/actions'
import { Chart } from './components/metric-chart'
import { BackLink } from './components/project-navigation'
import { modelLink } from './navigation'
import { useProject } from './hooks'

export function ScalingForm({
  deployment,
  onClose,
}: {
  deployment: Deployment
  onClose?: () => void
}) {
  const { update, notify } = useDemo()
  const [min, setMin] = useState(deployment.minReplicas)
  const [max, setMax] = useState(deployment.maxReplicas)
  const [concurrency, setConcurrency] = useState(deployment.concurrency)
  const [error, setError] = useState('')
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault()
        if (
          ![min, max, concurrency].every(Number.isInteger) ||
          min < 1 ||
          max > 20 ||
          min > max ||
          concurrency < 1 ||
          concurrency > 1000
        ) {
          setError(
            'Use 1–20 replicas, with minimum ≤ maximum, and concurrency between 1 and 1,000.',
          )
          return
        }
        update((s) => {
          const d = s.deployments.find((item) => item.id === deployment.id)!
          d.minReplicas = min
          d.maxReplicas = max
          d.concurrency = concurrency
          addActivity(
            s,
            d.projectId,
            `Scaling updated for ${d.name}`,
            'deployment',
            d.id,
          )
        })
        setError('')
        notify('Scaling settings saved.')
        onClose?.()
      }}
    >
      <div className="two-col">
        <Field label="Min replicas">
          <input
            required
            type="number"
            min={1}
            max={20}
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
          />
        </Field>
        <Field label="Max replicas">
          <input
            required
            type="number"
            min={1}
            max={20}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Target concurrency">
        <input
          required
          type="number"
          min={1}
          max={1000}
          value={concurrency}
          onChange={(e) => setConcurrency(Number(e.target.value))}
        />
      </Field>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="notice">
        Scaling is simulated. No additional compute resources are created.
      </div>
      <div className="form-actions">
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit">Save scaling</Button>
      </div>
    </form>
  )
}
export function DeploymentDetail() {
  const project = useProject()
  const { deploymentId } = useParams({ strict: false })
  const { state, update, notify } = useDemo()
  const [tab, setTab] = useState('Integration')
  const [language, setLanguage] = useState('Python')
  const [confirm, setConfirm] = useState<'pause' | 'redeploy' | null>(null)
  const [scaling, setScaling] = useState(false)
  const deployment = state.deployments.find(
    (d) => d.id === deploymentId && d.projectId === project?.id,
  )
  const model = state.models.find((m) => m.id === deployment?.modelId)
  if (!project || !deployment || !model) return <Missing />
  const endpoint = `https://api.drills.example/v1/ep/${deployment.id}/predict`
  const snippets: Record<string, string> = {
    cURL: `# Example only — demo endpoint\ncurl -X POST '${endpoint}' \\\n  -H 'Authorization: Bearer YOUR_API_KEY' \\\n  -F 'image=@shelf.jpg'`,
    Python: `# Example only — demo endpoint\nimport requests\n\nurl = "${endpoint}"\nheaders = {"Authorization": "Bearer YOUR_API_KEY"}\n\nwith open("shelf.jpg", "rb") as file:\n    response = requests.post(url, headers=headers, files={"image": file})\n\nprint(response.json())\n# {"label": "beverages_cola_330ml", "confidence": 0.964, "latency_ms": 82}`,
    JavaScript: `// Example only — demo endpoint\nconst body = new FormData();\nbody.append('image', fileInput.files[0]);\n\nconst response = await fetch('${endpoint}', {\n  method: 'POST',\n  headers: { Authorization: 'Bearer YOUR_API_KEY' },\n  body,\n});\n\nconsole.log(await response.json());`,
    Go: `// Example only — demo endpoint\npackage main\n\nimport ("bytes"; "fmt"; "io"; "mime/multipart"; "net/http"; "os")\n\nfunc main() {\n  file, err := os.Open("shelf.jpg")\n  if err != nil { panic(err) }; defer file.Close()\n  var body bytes.Buffer\n  writer := multipart.NewWriter(&body)\n  part, err := writer.CreateFormFile("image", "shelf.jpg")\n  if err != nil { panic(err) }\n  if _, err = io.Copy(part, file); err != nil { panic(err) }\n  if err = writer.Close(); err != nil { panic(err) }\n  req, err := http.NewRequest("POST", "${endpoint}", &body)\n  if err != nil { panic(err) }\n  req.Header.Set("Authorization", "Bearer YOUR_API_KEY")\n  req.Header.Set("Content-Type", writer.FormDataContentType())\n  res, err := http.DefaultClient.Do(req)\n  if err != nil { panic(err) }; defer res.Body.Close()\n  fmt.Println(res.Status)\n}`,
  }
  const metrics = (
    <Card title="Live metrics">
      <div className="pad">
        <Facts
          items={[
            ['Requests (24h)', number(deployment.requests)],
            ['p50 latency', deployment.latency ? '61 ms' : '—'],
            ['p95 latency', `${deployment.latency} ms`],
            ['p99 latency', deployment.latency ? '218 ms' : '—'],
            ['Error rate', `${deployment.errors}%`],
            [
              'Replicas',
              `${deployment.minReplicas} / ${deployment.maxReplicas}`,
            ],
            ['Cost today', `$${deployment.cost.toFixed(2)}`],
          ]}
        />
        <p className="muted small-text">Sample metrics</p>
      </div>
    </Card>
  )
  const scalingCard = (
    <Card title="Autoscaling">
      <div className="pad">
        <Facts
          items={[
            ['Min replicas', deployment.minReplicas],
            ['Max replicas', deployment.maxReplicas],
            ['Target concurrency', deployment.concurrency],
          ]}
        />
        <Button
          className="full-width"
          variant="ghost"
          onClick={() => setScaling(true)}
        >
          Edit scaling
        </Button>
      </div>
    </Card>
  )
  const log = `INFO  Endpoint ${deployment.name}\nINFO  Model ${model.name} v${model.version}\nINFO  Environment ${deployment.environment}\nINFO  Status ${deployment.status}\nINFO  Replicas ${deployment.minReplicas}–${deployment.maxReplicas}\n${state.activities
    .filter((a) => a.resourceId === deployment.id)
    .map((a) => `INFO  ${a.text}`)
    .join('\n')}`
  return (
    <>
      <BackLink
        project={project}
        section="deployments"
        name={deployment.name}
      />
      <PageHead
        title={
          <>
            {deployment.name} <Badge status={deployment.status} />
          </>
        }
        description={
          <span className="endpoint-address">
            <code>{endpoint}</code>
            <CopyButton value={endpoint} label="Copy URL" />
          </span>
        }
        actions={
          <>
            {deployment.status === 'Paused' ? (
              <Button
                variant="ghost"
                onClick={() => {
                  update((s) => {
                    const d = s.deployments.find(
                      (item) => item.id === deployment.id,
                    )!
                    d.status = 'Deploying'
                    d.readyAt = Date.now() + 3000
                    addActivity(
                      s,
                      project.id,
                      `Deployment ${d.name} resuming`,
                      'deployment',
                      d.id,
                    )
                  })
                  notify('Resuming demo deployment.')
                }}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="ghost"
                disabled={deployment.status === 'Deploying'}
                onClick={() => setConfirm('pause')}
              >
                Pause
              </Button>
            )}
            <Button
              disabled={deployment.status === 'Deploying'}
              onClick={() => setConfirm('redeploy')}
            >
              Redeploy
            </Button>
          </>
        }
      />
      <Tabs
        tabs={['Monitoring', 'Playground', 'Integration', 'Logs', 'Settings']}
        active={tab}
        onChange={setTab}
      />
      <div className="section-space">
        {tab === 'Integration' && (
          <div className="dashboard-grid">
            <div className="stack">
              <Card>
                <div className="card-heading">
                  <div className="segmented">
                    {Object.keys(snippets).map((l) => (
                      <button
                        key={l}
                        className={language === l ? 'selected' : ''}
                        onClick={() => setLanguage(l)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <CopyButton value={snippets[language]} />
                </div>
                <pre className="code-block integration-code">
                  {snippets[language]}
                </pre>
              </Card>
              <Card title="Request volume · last 24h">
                <div className="pad">
                  <Chart kind="requests" />
                </div>
              </Card>
            </div>
            <div className="stack">
              {metrics}
              {scalingCard}
            </div>
          </div>
        )}
        {tab === 'Monitoring' && (
          <div className="dashboard-grid">
            <div className="stack">
              <Card title="Request volume · last 24h">
                <div className="pad">
                  <Chart kind="requests" />
                </div>
              </Card>
              <Card title="Endpoint details">
                <div className="pad">
                  <Facts
                    items={[
                      [
                        'Model',
                        <Link {...modelLink(project.id, model.id)}>
                          {model.name} v{model.version}
                        </Link>,
                      ],
                      ['Environment', deployment.environment],
                      ['Status', <Badge status={deployment.status} />],
                      ['Region', project.region],
                    ]}
                  />
                </div>
              </Card>
            </div>
            <div className="stack">
              {metrics}
              {scalingCard}
            </div>
          </div>
        )}
        {tab === 'Playground' && (
          <Playground
            key={deployment.id}
            project={project}
            model={model}
            disabled={deployment.status !== 'Live'}
            onPrediction={() =>
              update((s) => {
                const d = s.deployments.find(
                  (item) => item.id === deployment.id,
                )!
                d.requests += 1
                d.latency = 82
              })
            }
          />
        )}
        {tab === 'Logs' && (
          <Card
            title="Deployment logs"
            action={
              <DownloadButton name={`${deployment.name}.log`} content={log} />
            }
          >
            <pre className="code-block logs">{log}</pre>
          </Card>
        )}
        {tab === 'Settings' && (
          <Card title="Scaling settings">
            <div className="pad">
              <ScalingForm key={deployment.id} deployment={deployment} />
            </div>
          </Card>
        )}
      </div>
      {scaling && (
        <Modal title="Edit autoscaling" onClose={() => setScaling(false)}>
          <ScalingForm
            deployment={deployment}
            onClose={() => setScaling(false)}
          />
        </Modal>
      )}
      {confirm && (
        <Confirm
          title={
            confirm === 'pause'
              ? 'Pause this deployment?'
              : 'Redeploy this model?'
          }
          description={
            confirm === 'pause'
              ? 'The playground will be unavailable until you resume this endpoint.'
              : 'The endpoint will briefly enter Deploying while the same model version is restarted.'
          }
          label={confirm === 'pause' ? 'Pause deployment' : 'Redeploy'}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            update((s) => {
              const d = s.deployments.find((item) => item.id === deployment.id)!
              d.status = confirm === 'pause' ? 'Paused' : 'Deploying'
              if (confirm === 'redeploy') d.readyAt = Date.now() + 5000
              addActivity(
                s,
                project.id,
                `Deployment ${d.name} ${confirm === 'pause' ? 'paused' : 'redeploying'}`,
                'deployment',
                d.id,
              )
            })
            notify(
              confirm === 'pause' ? 'Deployment paused.' : 'Redeploying model.',
            )
          }}
        />
      )}
    </>
  )
}
