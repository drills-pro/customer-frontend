import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Check, Plus, Rocket, Upload } from 'lucide-react'
import { AddDataset } from '../features/drills/Datasets'
import {
    Badge,
    Card,
    Empty,
    Kpi,
    PageHead,
    Progress,
    ProjectIcon,
} from '../features/drills/components/display'
import { Button } from '../features/drills/components/forms'
import { date } from '../features/drills/data'
import {
    activityLink,
    deploymentLink,
    projectLink,
    runLink,
} from '../features/drills/navigation'
import { useDemo } from '../features/drills/store'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
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
                            className='border border-slate-300'
                        >
                            <Upload size={15} />
                            Upload Dataset
                        </Button>
                        <Button asChild>
                            <Link to="/projects/new">
                                <Plus size={16} className='text-white' />
                                <span className='text-white'>New Project</span>
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

