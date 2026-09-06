import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Grid2X2, List, Plus } from 'lucide-react'
import {
  Avatar,
  Card,
  Empty,
  PageHead,
  ProjectIcon,
  Table,
} from '../features/drills/components/display'
import { Button, Filter, Toolbar } from '../features/drills/components/forms'
import { date, taskTypes } from '../features/drills/data'
import { projectLink } from '../features/drills/navigation'
import { useDemo } from '../features/drills/store'

export const Route = createFileRoute('/projects/')({ component: ProjectsPage })

function ProjectsPage() {
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

