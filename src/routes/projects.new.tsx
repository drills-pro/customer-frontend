import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, Database } from 'lucide-react'
import { Card, Facts, Steps } from '../features/drills/components/display'
import { Button, Field } from '../features/drills/components/forms'
import { addActivity, id, taskTypes } from '../features/drills/data'
import type { Project } from '../features/drills/data'
import { projectLink } from '../features/drills/navigation'
import { useDemo } from '../features/drills/store'

export const Route = createFileRoute('/projects/new')({
  component: CreateProject,
})

function CreateProject() {
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

