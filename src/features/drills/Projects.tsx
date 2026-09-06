import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  Database,
  Grid2X2,
  List,
  Plus,
  Rocket,
  Upload,
} from 'lucide-react'
import { useDemo } from './store'
import { addActivity, date, id, number, percent, taskTypes } from './data'
import type { Project } from './data'
import {
  Avatar,
  Badge,
  Card,
  Empty,
  Facts,
  Kpi,
  PageHead,
  Progress,
  ProjectIcon,
  Steps,
  Table,
} from './components/display'
import { Button, Field, Filter, Toolbar } from './components/forms'
import { Chart } from './components/metric-chart'
import {
  activityLink,
  deploymentLink,
  modelLink,
  projectLink,
  runLink,
  trainingLink,
} from './navigation'
import { AddDataset } from './Datasets'
import { DeployDialog } from './Models'

export function Dashboard() {
  const { state, update } = useDemo()
  const [upload, setUpload] = useState(false)
  const [allActivity, setAllActivity] = useState(false)
  const projects = state.projects
    .filter((p) => p.orgId === state.orgId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const ids = new Set(projects.map((p) => p.id))
  const runs = state.runs.filter((r) => ids.has(r.projectId))
  const live = runs.filter((r) => r.status === 'Running')
  const deployments = state.deployments.filter((d) => ids.has(d.projectId))
  const activity = state.activities.filter((a) => ids.has(a.projectId))
  const current =
    projects.find((p) => p.id === state.selectedProjectId) || projects.at(0)
  const done = [
    projects.length > 0,
    state.datasets.some((d) => ids.has(d.projectId)),
    runs.some((r) => r.status === 'Completed'),
    deployments.some((d) => d.status === 'Live'),
  ]
  return (
    <>
      <PageHead
        title={
          <>
            Good morning, Alex <span className="wave">👋</span>
          </>
        }
        description="Here is what happened across your workspace."
        actions={
          <>
            <Button
              variant="ghost"
              disabled={!current}
              onClick={() => setUpload(true)}
            >
              <Upload size={15} />
              Upload Dataset
            </Button>
            <Button asChild>
              <Link to="/projects/new">
                <Plus size={16} /> New Project
              </Link>
            </Button>
          </>
        }
      />
      <div className="kpi-grid">
        <Kpi title="Active Projects" value={projects.length} change="+3" />
        <Kpi title="Trainings Running" value={live.length} change="+2" />
        <Kpi
          title="Models Deployed"
          value={
            new Set(
              deployments
                .filter((d) => d.status === 'Live')
                .map((d) => d.modelId),
            ).size
          }
          change="+1"
        />
        <Kpi
          title="Inference Calls"
          value={Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1,
          }).format(deployments.reduce((sum, d) => sum + d.requests, 0))}
          change="+24%"
        />
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <Card
            title="Recent activity"
            action={
              <button
                className="text-button"
                onClick={() => setAllActivity(!allActivity)}
              >
                {allActivity ? 'Show less' : 'View all'}
              </button>
            }
          >
            <ul className="activity-list">
              {activity.slice(0, allActivity ? 80 : 5).map((a, i) => (
                <li key={a.id}>
                  <span className={`activity-icon activity-${i % 4}`}>
                    {a.kind === 'dataset' ? (
                      <Upload size={16} />
                    ) : a.kind === 'deployment' ? (
                      <Rocket size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                  </span>
                  <span className="activity-text">{a.text}</span>
                  <small>{date(a.time)}</small>
                  <Link
                    {...activityLink(a.projectId, a.kind, a.resourceId)}
                    className="text-button"
                  >
                    {a.kind === 'deployment' ? 'Monitor' : 'View'}
                  </Link>
                </li>
              ))}
            </ul>
            {!activity.length && (
              <Empty
                title="A fresh start"
                description="Your workspace activity will appear here."
              />
            )}
          </Card>
          <Card
            title="Your projects"
            action={
              <Link to="/projects" className="text-button">
                View all <ArrowRight size={13} />
              </Link>
            }
          >
            <div className="recent-projects">
              {projects.slice(0, 4).map((p) => (
                <Link
                  {...projectLink(p.id)}
                  key={p.id}
                  className="recent-project"
                >
                  <div>
                    <ProjectIcon project={p} />
                    <strong>{p.name}</strong>
                  </div>
                  <p>
                    {p.task} ·{' '}
                    {state.models.filter((m) => m.projectId === p.id).length}{' '}
                    models
                  </p>
                  <small>Updated {date(p.updatedAt)}</small>
                </Link>
              ))}
            </div>
            {!projects.length && (
              <Empty title="Create your first project">
                <Button asChild>
                  <Link to="/projects/new">New Project</Link>
                </Button>
              </Empty>
            )}
          </Card>
        </div>
        <div className="stack">
          <Card
            title="Live trainings"
            action={
              <span className="live-indicator">
                <i />
                LIVE
              </span>
            }
          >
            <ul className="live-list">
              {live.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <div>
                    <Link {...runLink(r.projectId, r.id)}>{r.name}</Link>
                    <Badge status={r.status} />
                  </div>
                  <Progress value={r.progress} blue />
                  <div>
                    <small>
                      Epoch {Math.floor((r.progress / 100) * r.epochs)}/
                      {r.epochs}
                    </small>
                    <small>{r.progress}% complete</small>
                  </div>
                </li>
              ))}
            </ul>
            {!live.length && (
              <div className="pad muted">No training jobs running.</div>
            )}
          </Card>
          <Card title="Deployment health">
            <ul className="health-list">
              {deployments.slice(0, 3).map((d) => (
                <li key={d.id}>
                  <div>
                    <Link {...deploymentLink(d.projectId, d.id)}>{d.name}</Link>
                    <small>
                      p95 {d.latency || '—'} ms · err {d.errors}%
                    </small>
                  </div>
                  <Badge status={d.status} />
                </li>
              ))}
            </ul>
            {!deployments.length && (
              <div className="pad muted">No deployments yet.</div>
            )}
          </Card>
          {!state.onboardingDismissed && (
            <Card>
              <div className="pad">
                <div className="split">
                  <h2>Getting started</h2>
                  <button
                    className="text-button muted"
                    onClick={() =>
                      update((s) => {
                        s.onboardingDismissed = true
                      })
                    }
                  >
                    Dismiss
                  </button>
                </div>
                <ul className="checklist">
                  {[
                    'Create a project',
                    'Upload a dataset',
                    'Run your first training',
                    'Deploy a model',
                  ].map((t, i) => (
                    <li className={done[i] ? 'done' : ''} key={t}>
                      <span>{done[i] ? <Check size={12} /> : i + 1}</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Progress value={done.filter(Boolean).length * 25} />
              </div>
            </Card>
          )}
        </div>
      </div>
      {upload && current && (
        <AddDataset project={current} onClose={() => setUpload(false)} />
      )}
    </>
  )
}
export function ProjectsPage() {
  const { state } = useDemo()
  const [query, setQuery] = useState('')
  const [task, setTask] = useState('')
  const [sort, setSort] = useState('Recently updated')
  const [view, setView] = useState('grid')
  const projects = state.projects
    .filter(
      (p) =>
        p.orgId === state.orgId &&
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        (!task || p.task === task),
    )
    .sort((a, b) =>
      sort === 'Name A–Z'
        ? a.name.localeCompare(b.name)
        : b.updatedAt - a.updatedAt,
    )
  return (
    <>
      <PageHead
        title="Projects"
        description={
          <>
            {state.projects.filter((p) => p.orgId === state.orgId).length}{' '}
            projects in{' '}
            {state.organizations.find((o) => o.id === state.orgId)?.name}
          </>
        }
        actions={
          <Button asChild>
            <Link to="/projects/new">
              <Plus size={16} /> New Project
            </Link>
          </Button>
        }
      />
      <Toolbar query={query} setQuery={setQuery}>
        <Filter
          label="All task types"
          value={task}
          onChange={setTask}
          options={[...taskTypes]}
        />
        <select
          aria-label="Sort projects"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Recently updated</option>
          <option>Name A–Z</option>
        </select>
        <div className="view-toggle">
          <button
            className={view === 'grid' ? 'selected' : ''}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            <Grid2X2 size={16} />
          </button>
          <button
            className={view === 'list' ? 'selected' : ''}
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            <List size={16} />
          </button>
        </div>
      </Toolbar>
      {view === 'grid' ? (
        <div className="project-grid">
          {projects.map((p) => (
            <Card key={p.id}>
              <div className="pad">
                <div className="project-card-title">
                  <ProjectIcon project={p} />
                  <div>
                    <Link {...projectLink(p.id)}>{p.name}</Link>
                    <small>{p.task}</small>
                  </div>
                </div>
                <p className="project-description">{p.description}</p>
                <div className="project-counts">
                  <span>
                    <b>
                      {
                        state.datasets.filter((d) => d.projectId === p.id)
                          .length
                      }
                    </b>{' '}
                    datasets
                  </span>
                  <span>
                    <b>
                      {state.models.filter((m) => m.projectId === p.id).length}
                    </b>{' '}
                    models
                  </span>
                  <span>
                    <b>
                      {
                        state.deployments.filter(
                          (d) => d.projectId === p.id && d.status === 'Live',
                        ).length
                      }
                    </b>{' '}
                    deployed
                  </span>
                </div>
                <div className="project-card-footer">
                  <div className="avatar-stack">
                    <Avatar small />
                    <Avatar small name="Priya Nair" />
                    <Avatar small name="Sam Cole" />
                  </div>
                  <small>Updated {date(p.updatedAt)}</small>
                </div>
              </div>
            </Card>
          ))}
          <Link to="/projects/new" className="new-project-card">
            <Plus size={25} />
            <span>New project</span>
          </Link>
        </div>
      ) : (
        <Card>
          <Table
            headers={['Project', 'Task type', 'Datasets', 'Models', 'Updated']}
          >
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link {...projectLink(p.id)}>{p.name}</Link>
                </td>
                <td>{p.task}</td>
                <td>
                  {state.datasets.filter((d) => d.projectId === p.id).length}
                </td>
                <td>
                  {state.models.filter((m) => m.projectId === p.id).length}
                </td>
                <td>{date(p.updatedAt)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {!projects.length && (
        <Empty
          title="No matching projects"
          description="Try a different search or create a project."
        />
      )}
    </>
  )
}
export function CreateProject() {
  const { state, update, notify } = useDemo()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [orgId, setOrgId] = useState(state.orgId)
  const [task, setTask] = useState<Project['task']>('Image Classification')
  const [method, setMethod] = useState('Sample dataset')
  const [visibility, setVisibility] = useState('Organization')
  const [region, setRegion] = useState('us-east-1')
  const [error, setError] = useState('')
  function submit() {
    if (!name.trim()) {
      setError('Enter a project name.')
      setStep(0)
      return
    }
    if (
      state.projects.some(
        (p) =>
          p.orgId === orgId &&
          p.name.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      setError('A project with this name already exists in this organization.')
      setStep(0)
      return
    }
    if (step < 2) {
      setStep(step + 1)
      return
    }
    const projectId = id('project')
    const now = Date.now()
    update((s) => {
      s.projects.unshift({
        id: projectId,
        name: name.trim(),
        description: description.trim(),
        task,
        orgId,
        color: '#6366f1',
        visibility,
        region,
        createdAt: now,
        updatedAt: now,
      })
      s.orgId = orgId
      s.selectedProjectId = projectId
      if (method === 'Sample dataset')
        s.datasets.push({
          id: `${projectId}-train`,
          projectId,
          name: 'sample-training-data',
          split: 'Train',
          items: 1200,
          size: '24 MB',
          classes: 12,
          status: 'Ready',
          version: 1,
          files: ['sample-data'],
          createdAt: now,
        })
      addActivity(
        s,
        projectId,
        `Project ${name.trim()} created`,
        'project',
        projectId,
      )
    })
    notify('Project created. Your workspace is ready.')
    void navigate(projectLink(projectId))
  }
  return (
    <>
      <Link to="/projects" className="back-link">
        ← Back to projects
      </Link>
      <div className="wizard-grid">
        <Card>
          <form
            className="pad roomy"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <Steps
              items={['Basics', 'Task type', 'Start method']}
              step={step}
              onStep={setStep}
            />
            <h1 className="section-title">
              {
                [
                  'Create a new project',
                  'What are you building?',
                  'Choose your starting point',
                ][step]
              }
            </h1>
            <p className="muted">
              {
                [
                  'Give your next idea a home.',
                  'This determines available models, metrics and data validation rules.',
                  'Start with example data or bring your own.',
                ][step]
              }
            </p>
            <div className="form-stack">
              {step === 0 ? (
                <>
                  <Field label="Project name">
                    <input
                      autoFocus
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setError('')
                      }}
                      placeholder="e.g. Retail Vision v2"
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What will this project do?"
                    />
                  </Field>
                  <Field label="Organization">
                    <select
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                    >
                      {state.organizations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="two-col">
                    <Field label="Visibility">
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                      >
                        <option>Organization</option>
                        <option>Private</option>
                      </select>
                    </Field>
                    <Field label="Region">
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      >
                        <option>us-east-1</option>
                        <option>ap-southeast-1</option>
                        <option>eu-west-1</option>
                      </select>
                    </Field>
                  </div>
                </>
              ) : step === 1 ? (
                <div className="task-grid">
                  {taskTypes.map((t, i) => (
                    <button
                      type="button"
                      key={t}
                      className={`choice-card ${task === t ? 'selected' : ''}`}
                      aria-pressed={task === t}
                      onClick={() => setTask(t)}
                    >
                      <span className="split">
                        <span className="task-emoji">
                          {['🖼', '🎯', '✂️', '💬', '🏷', '📊', '📈'][i]}
                        </span>
                        {task === t && <Check size={16} />}
                      </span>
                      <strong>{t}</strong>
                      <small>
                        {
                          [
                            'Assign one label per image',
                            'Locate and label objects with boxes',
                            'Pixel-level masks per class',
                            'Sentiment, intent, topic routing',
                            'Extract entities from text',
                            'Regression or classification on rows',
                            'Forecast future values',
                          ][i]
                        }
                      </small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="form-stack">
                  {['Sample dataset', 'Empty project'].map((m) => (
                    <button
                      type="button"
                      key={m}
                      aria-pressed={method === m}
                      className={`choice-card ${method === m ? 'selected' : ''}`}
                      onClick={() => setMethod(m)}
                    >
                      <Database size={22} />
                      <strong>{m}</strong>
                      <small>
                        {m === 'Sample dataset'
                          ? 'Explore the full workflow with 1,200 ready-to-use sample items.'
                          : 'Upload your own file metadata after creating the project.'}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions spread">
              <Button
                variant="ghost"
                onClick={() =>
                  step ? setStep(step - 1) : void navigate({ to: '/projects' })
                }
              >
                Back
              </Button>
              <Button type="submit">
                {step === 2 ? 'Create project' : 'Continue →'}
              </Button>
            </div>
          </form>
        </Card>
        <Card>
          <div className="pad">
            <h2>Summary</h2>
            <Facts
              items={[
                ['Name', name || 'Untitled project'],
                [
                  'Owner',
                  state.organizations.find((o) => o.id === orgId)?.name,
                ],
                ['Visibility', visibility],
                ['Task type', task],
                ['Region', region],
                ['Start method', method],
              ]}
            />
            <div className="notice warning">
              Task type cannot be changed after the first training run.
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
export function ProjectOverview({ project }: { project: Project }) {
  const { state } = useDemo()
  const [deploy, setDeploy] = useState(false)
  const datasets = state.datasets.filter((d) => d.projectId === project.id)
  const runs = state.runs.filter((r) => r.projectId === project.id)
  const models = state.models
    .filter((m) => m.projectId === project.id)
    .sort((a, b) => b.accuracy - a.accuracy)
  const deployments = state.deployments.filter(
    (d) => d.projectId === project.id,
  )
  const best = models.at(0)
  return (
    <>
      <Card>
        <div className="pad">
          <h2>Pipeline</h2>
          <div className="pipeline">
            {[
              [
                'Data',
                `${datasets.filter((d) => d.status === 'Ready').length} datasets ready`,
                'datasets',
                datasets.some((d) => d.status === 'Ready'),
              ],
              [
                'Train',
                `${runs.length} runs · ${runs.filter((r) => r.status === 'Running').length} running`,
                'training',
                runs.some((r) => r.status === 'Completed'),
              ],
              [
                'Evaluate',
                best ? `Best ${percent(best.accuracy)} acc` : 'No models yet',
                'models',
                !!best,
              ],
              [
                'Deploy',
                `${deployments.filter((d) => d.status === 'Live').length} live endpoints`,
                'deployments',
                deployments.some((d) => d.status === 'Live'),
              ],
            ].map(([title, sub, section, done], i) => (
              <Link
                {...projectLink(project.id, String(section))}
                key={String(title)}
                className={done ? 'done' : ''}
              >
                <span className="pipeline-step">
                  {done ? <Check size={15} /> : i + 1}
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{sub}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
      <div className="dashboard-grid">
        <div className="stack">
          <Card
            title="Best model"
            action={best ? <Badge status="Completed" /> : undefined}
          >
            {best ? (
              <div className="pad best-model">
                <div>
                  <Link {...modelLink(project.id, best.id)}>
                    <h3>{best.name}</h3>
                  </Link>
                  <p className="muted">
                    From completed training · v{best.version}
                  </p>
                </div>
                <div className="metric-row">
                  {[
                    ['Accuracy', percent(best.accuracy)],
                    ['F1', best.f1.toFixed(3)],
                    ['Latency', '82 ms'],
                    ['Size', best.size],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setDeploy(true)}>Deploy →</Button>
              </div>
            ) : (
              <Empty
                title="Train your first model"
                description="Start with a dataset and turn it into a model."
              >
                <Button asChild>
                  <Link {...trainingLink(project.id)}>Create Training</Link>
                </Button>
              </Empty>
            )}
          </Card>
          <Card title="Validation accuracy over runs">
            <div className="pad">
              <Chart />
            </div>
          </Card>
        </div>
        <div className="stack">
          <Card title="Project info">
            <div className="pad">
              <Facts
                items={[
                  ['Created', date(project.createdAt)],
                  [
                    'Owner',
                    state.organizations.find((o) => o.id === project.orgId)
                      ?.name,
                  ],
                  ['Task', project.task],
                  ['Framework', 'PyTorch 2.4'],
                  ['Region', project.region],
                  ['Visibility', project.visibility],
                ]}
              />
            </div>
          </Card>
          <Card title="Resource usage">
            <div className="pad">
              <Facts
                items={[
                  ['Datasets', number(datasets.length)],
                  ['Models', number(models.length)],
                  [
                    'Live endpoints',
                    number(
                      deployments.filter((d) => d.status === 'Live').length,
                    ),
                  ],
                ]}
              />
              <div className="usage">
                <div>
                  <span>GPU hours · sample</span>
                  <span>42 / 100</span>
                </div>
                <Progress value={42} />
              </div>
            </div>
          </Card>
          <Card title="Team">
            <div className="pad team-list">
              {[
                ['Alex Rivera', 'Owner'],
                ['Priya Nair', 'Editor'],
                ['Sam Cole', 'Viewer'],
              ].map(([n, r]) => (
                <div key={n}>
                  <Avatar name={n} />
                  <div>
                    <strong>{n}</strong>
                    <small>{r}</small>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {deploy && best && (
        <DeployDialog
          project={project}
          model={best}
          onClose={() => setDeploy(false)}
        />
      )}
    </>
  )
}
export function ProjectSettings({ project }: { project: Project }) {
  const { state, update, notify } = useDemo()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [task, setTask] = useState(project.task)
  const [error, setError] = useState('')
  const locked = state.runs.some((r) => r.projectId === project.id)
  return (
    <div className="settings-layout">
      <nav>
        <span className="selected">General</span>
      </nav>
      <Card title="General">
        <form
          className="pad form-stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (
              !name.trim() ||
              state.projects.some(
                (p) =>
                  p.id !== project.id &&
                  p.orgId === project.orgId &&
                  p.name.toLowerCase() === name.trim().toLowerCase(),
              )
            ) {
              setError('Enter a unique project name.')
              return
            }
            update((s) => {
              const p = s.projects.find((item) => item.id === project.id)!
              p.name = name.trim()
              p.description = description.trim()
              p.task = task
              p.updatedAt = Date.now()
            })
            setError('')
            notify('Project settings saved.')
          }}
        >
          <Field label="Project name">
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field
            label="Task type"
            hint={
              locked
                ? 'Locked after the first training run.'
                : 'Choose the type of model you want to build.'
            }
          >
            <select
              disabled={locked}
              value={task}
              onChange={(e) => {
                const selected = taskTypes.find((t) => t === e.target.value)
                if (selected) setTask(selected)
              }}
            >
              {taskTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button
              variant="ghost"
              onClick={() => {
                setName(project.name)
                setDescription(project.description)
                setTask(project.task)
                setError('')
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
