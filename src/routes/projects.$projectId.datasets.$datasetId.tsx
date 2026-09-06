import { useState } from 'react'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2, File, Image } from 'lucide-react'
import { DownloadButton } from '../features/drills/components/actions'
import {
  Badge,
  Card,
  Empty,
  Facts,
  Missing,
  PageHead,
  Progress,
  Table,
} from '../features/drills/components/display'
import { Button, Filter, Tabs } from '../features/drills/components/forms'
import { Modal } from '../features/drills/components/overlays'
import { BackLink } from '../features/drills/components/project-navigation'
import { date, number } from '../features/drills/data'
import { useProject } from '../features/drills/hooks'
import { trainingLink } from '../features/drills/navigation'
import { useDemo } from '../features/drills/store'

export const Route = createFileRoute(
  '/projects/$projectId/datasets/$datasetId',
)({ component: DatasetDetail })

function DatasetDetail() {
  const project = useProject()
  const { datasetId } = useParams({ strict: false })
  const { state, update, notify } = useDemo()
  const [tab, setTab] = useState('Preview')
  const [classFilter, setClassFilter] = useState('')
  const [splitFilter, setSplitFilter] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const dataset = state.datasets.find(
    (d) => d.id === datasetId && d.projectId === project?.id,
  )
  if (!project || !dataset) return <Missing />
  const classes = ['beverages', 'snacks', 'dairy', 'produce', 'bakery', 'other']
  const count = Math.min(dataset.items, 24)
  const previews = Array.from({ length: count }, (_, i) => ({
    index: i,
    className: classes[i % 6],
    split: i % 10 < 8 ? 'Train' : i % 10 === 8 ? 'Validation' : 'Test',
  })).filter(
    (item) =>
      (!classFilter || item.className === classFilter) &&
      (!splitFilter || item.split === splitFilter),
  )
  const visual = [
    'Image Classification',
    'Object Detection',
    'Segmentation',
  ].includes(project.task)
  return (
    <>
      <BackLink project={project} section="datasets" name={dataset.name} />
      <PageHead
        title={dataset.name}
        description={`${number(dataset.items)} items · ${dataset.classes} classes · ${dataset.size} · v${dataset.version}`}
        actions={
          <>
            <DownloadButton
              name={`${dataset.name}-manifest.json`}
              content={dataset}
            />
            {dataset.status === 'Ready' ? (
              <Button asChild>
                <Link
                  {...trainingLink(project.id)}
                  search={{ dataset: dataset.id }}
                >
                  Create Training →
                </Link>
              </Button>
            ) : (
              <Badge status={dataset.status} />
            )}
          </>
        }
      />
      <Tabs
        tabs={['Preview', 'Statistics', 'Quality', 'Versions']}
        active={tab}
        onChange={setTab}
      />
      {dataset.status === 'Processing' ? (
        <div className="section-space">
          <Empty
            title="Processing dataset"
            description="Preparing sample statistics and preview. This page updates automatically."
          />
        </div>
      ) : dataset.status === 'Error' ? (
        <div className="section-space">
          <Empty
            title="Dataset processing failed"
            description="The legacy import contains invalid labels. Retry to reprocess the demo dataset."
          >
            <Button
              onClick={() => {
                update((s) => {
                  const d = s.datasets.find((item) => item.id === dataset.id)!
                  d.status = 'Processing'
                  d.readyAt = Date.now() + 4000
                })
                notify('Retrying dataset processing.')
              }}
            >
              Retry processing
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="detail-grid">
          <div className="stack">
            {tab === 'Preview' && (
              <Card>
                <div className="card-heading">
                  <div className="actions">
                    <Filter
                      label="All classes"
                      value={classFilter}
                      onChange={setClassFilter}
                      options={classes}
                    />
                    <Filter
                      label="All splits"
                      value={splitFilter}
                      onChange={setSplitFilter}
                      options={['Train', 'Validation', 'Test']}
                    />
                  </div>
                  <small>
                    Showing {previews.length} of {number(dataset.items)} ·
                    sample
                  </small>
                </div>
                {visual ? (
                  <div className="preview-grid">
                    {previews.map(({ index: i, className }) => (
                      <button
                        key={i}
                        className={`sample-tile sample-${i % 6}`}
                        aria-label={`Preview sample ${i + 1}, ${className}`}
                        onClick={() => setSelected(i)}
                      >
                        <Image size={30} strokeWidth={1} />
                        <span>
                          {className}_{i + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Table headers={['Sample', 'Input', 'Label', 'Split']}>
                    {previews.map((p) => (
                      <tr key={p.index}>
                        <td>{p.index + 1}</td>
                        <td>
                          {project.task.includes('Text') ||
                          project.task.includes('Entity')
                            ? [
                                'My order has not arrived',
                                'The product is excellent',
                                'Please update my account',
                              ][p.index % 3]
                            : `${120 + p.index * 7}, ${(p.index * 0.13).toFixed(2)}, ${p.index % 4}`}
                        </td>
                        <td>{p.className}</td>
                        <td>{p.split}</td>
                      </tr>
                    ))}
                  </Table>
                )}
                {!previews.length && (
                  <Empty
                    title="No matching samples"
                    description="Try a different class or split."
                  />
                )}
              </Card>
            )}
            {tab === 'Statistics' && (
              <>
                <Card title="Dataset statistics">
                  <div className="pad">
                    <Facts
                      items={[
                        ['Total items', number(dataset.items)],
                        ['Classes', dataset.classes],
                        ['Size', dataset.size],
                        ['Split', dataset.split],
                        ['Label coverage', '100%'],
                        [
                          'Format',
                          dataset.files[0]?.split('.').pop() || 'Sample data',
                        ],
                      ]}
                    />
                  </div>
                </Card>
                <Card title="Split distribution · sample">
                  <div className="pad stack">
                    {[
                      ['Train', 80],
                      ['Validation', 10],
                      ['Test', 10],
                    ].map(([label, n]) => (
                      <div key={label}>
                        <div className="split">
                          <span>{label}</span>
                          <span>{n}%</span>
                        </div>
                        <Progress value={Number(n)} />
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
            {tab === 'Quality' && (
              <Card title="Quality report · sample">
                <div className="pad stack">
                  <div className="notice success-notice">
                    <CheckCircle2 size={17} />
                    All labels valid. No corrupt files found.
                  </div>
                  <div className="notice warning">
                    <AlertTriangle size={17} />
                    {Math.min(142, Math.floor(dataset.items * 0.008))}{' '}
                    near-duplicates found.
                  </div>
                  <div className="notice warning">
                    Class imbalance ratio 3.2:1. Consider balanced sampling
                    during training.
                  </div>
                  <DownloadButton
                    name={`${dataset.name}-quality.json`}
                    content={{
                      sample: true,
                      corruptFiles: 0,
                      duplicates: Math.min(
                        142,
                        Math.floor(dataset.items * 0.008),
                      ),
                      imbalance: 3.2,
                    }}
                    label="Download report"
                  />
                </div>
              </Card>
            )}
            {tab === 'Versions' && (
              <Card title="Dataset versions">
                <Table headers={['Version', 'Items', 'Status', 'Created', '']}>
                  {Array.from(
                    { length: dataset.version },
                    (_, i) => dataset.version - i,
                  ).map((v) => (
                    <tr key={v}>
                      <td>
                        <span className="tag">
                          v{v}
                          {v === dataset.version ? ' · current' : ''}
                        </span>
                      </td>
                      <td>{number(dataset.items)}</td>
                      <td>
                        <Badge status="Ready" />
                      </td>
                      <td>{date(dataset.createdAt)}</td>
                      <td>
                        <DownloadButton
                          name={`${dataset.name}-v${v}.json`}
                          content={{ ...dataset, version: v, sample: true }}
                        />
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            )}
          </div>
          <div className="stack">
            <Card title="Class distribution">
              <div className="pad distribution">
                {classes.map((c, i) => (
                  <div key={c}>
                    <div className="split">
                      <span>{c}</span>
                      <span>
                        {number(
                          Math.floor(
                            dataset.items *
                              [0.18, 0.16, 0.12, 0.1, 0.05, 0.39][i],
                          ),
                        )}
                      </span>
                    </div>
                    <Progress value={[100, 89, 66, 55, 31, 80][i]} />
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Health check">
              <div className="pad">
                <ul className="quality-list">
                  <li>
                    <CheckCircle2 />
                    No corrupt files
                  </li>
                  <li>
                    <AlertTriangle />
                    Near-duplicates found
                  </li>
                  <li>
                    <AlertTriangle />
                    Class imbalance ratio 3.2:1
                  </li>
                  <li>
                    <CheckCircle2 />
                    All labels valid
                  </li>
                </ul>
                <Button
                  variant="ghost"
                  className="full-width"
                  onClick={() => setTab('Quality')}
                >
                  Review issues
                </Button>
              </div>
            </Card>
            <Card title="Source files">
              <div className="pad file-list">
                {(dataset.files.length ? dataset.files : ['Sample dataset'])
                  .slice(0, 5)
                  .map((f, i) => (
                    <div key={`${f}-${i}`}>
                      <File size={15} />
                      <span>{f}</span>
                    </div>
                  ))}
                <small className="muted">
                  Metadata only · source contents are not retained.
                </small>
              </div>
            </Card>
          </div>
        </div>
      )}
      {selected !== null && (
        <Modal
          title={`Sample ${selected + 1}`}
          onClose={() => setSelected(null)}
        >
          <div className={`sample-tile sample-large sample-${selected % 6}`}>
            <Image size={70} strokeWidth={1} />
          </div>
          <Facts
            items={[
              ['Label', classes[selected % 6]],
              ['Split', selected % 10 < 8 ? 'Train' : 'Validation'],
              ['Source', 'Illustrative sample preview'],
            ]}
          />
        </Modal>
      )}
    </>
  )
}

