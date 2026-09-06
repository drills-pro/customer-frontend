import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  AlertTriangle,
  CheckCircle2,
  File,
  Image,
  Plus,
  Upload,
} from 'lucide-react'
import { useDemo } from './store'
import { addActivity, date, id, number } from './data'
import type { Dataset, Project } from './data'
import {
  Badge,
  Card,
  Empty,
  Facts,
  Missing,
  PageHead,
  Progress,
  Table,
} from './components/display'
import { Button, Field, Filter, Tabs, Toolbar } from './components/forms'
import { Modal } from './components/overlays'
import { DownloadButton } from './components/actions'
import { BackLink } from './components/project-navigation'
import { datasetLink, trainingLink } from './navigation'
import { useProject } from './hooks'

export function AddDataset({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const { state, update, notify } = useDemo()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [split, setSplit] = useState<Dataset['split']>('Train')
  const [files, setFiles] = useState<File[]>([])
  const [source, setSource] = useState('files')
  const [bucket, setBucket] = useState('')
  const [error, setError] = useState('')
  function choose(list: FileList | null) {
    if (!list) return
    const chosen = Array.from(list)
    if (
      chosen.some((f) => !/\.(csv|jsonl?|parquet|zip|jpe?g|png)$/i.test(f.name))
    ) {
      setError('Choose CSV, JSON, JSONL, Parquet, ZIP, JPG, or PNG files.')
      return
    }
    setFiles(chosen)
    setError('')
    if (!name && chosen[0]) setName(chosen[0].name.replace(/\.[^.]+$/, ''))
  }
  function submit() {
    if (!name.trim()) {
      setError('Enter a dataset name.')
      return
    }
    if (
      state.datasets.some(
        (d) =>
          d.projectId === project.id &&
          d.name.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      setError('This dataset name already exists in the project.')
      return
    }
    if (source === 'files' && !files.length) {
      setError('Select at least one file.')
      return
    }
    if (source === 'bucket' && !/^s3:\/\/[^\s]+$/.test(bucket)) {
      setError('Enter a bucket path such as s3://my-bucket/dataset.')
      return
    }
    const datasetId = id('dataset')
    const now = Date.now()
    const bytes = files.reduce((s, f) => s + f.size, 0)
    update((s) => {
      s.datasets.unshift({
        id: datasetId,
        name: name.trim(),
        projectId: project.id,
        split,
        items: source === 'sample' || source === 'bucket' ? 1200 : files.length,
        size:
          source === 'sample' || source === 'bucket'
            ? '24 MB'
            : `${(bytes / 1024 / 1024).toFixed(2)} MB`,
        classes: 12,
        status: 'Processing',
        version: 1,
        files:
          source === 'files'
            ? files.map((f) => f.name)
            : [source === 'sample' ? 'sample-dataset' : bucket],
        createdAt: now,
        readyAt: now + 4000,
      })
      addActivity(
        s,
        project.id,
        `Dataset ${name.trim()} added for processing`,
        'dataset',
        datasetId,
      )
    })
    notify('Dataset added. Demo processing takes a few seconds.')
    onClose()
    void navigate(datasetLink(project.id, datasetId))
  }
  return (
    <Modal title="Add dataset" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="form-stack"
      >
        <Field label="Dataset name">
          <input
            autoFocus
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. retail-shelf-v2"
          />
        </Field>
        <div className="two-col">
          <Field label="Source">
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="files">Local files</option>
              <option value="bucket">Cloud bucket (mock)</option>
              <option value="sample">Sample dataset</option>
            </select>
          </Field>
          <Field label="Split">
            <select
              value={split}
              onChange={(e) => {
                const s = ['Train', 'Validation', 'Test', 'Unsplit'].find(
                  (value) => value === e.target.value,
                )
                if (s) setSplit(s as Dataset['split'])
              }}
            >
              <option>Train</option>
              <option>Validation</option>
              <option>Test</option>
              <option>Unsplit</option>
            </select>
          </Field>
        </div>
        {source === 'files' ? (
          <label
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              choose(e.dataTransfer.files)
            }}
          >
            <Upload size={26} />
            <strong>
              {files.length
                ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                : 'Drop your files here'}
            </strong>
            <span>or click to browse · CSV, JSONL, Parquet, ZIP, JPG, PNG</span>
            <input
              type="file"
              multiple
              accept=".csv,.json,.jsonl,.parquet,.zip,.jpg,.jpeg,.png"
              onChange={(e) => choose(e.target.files)}
              aria-label="Dataset files"
            />
          </label>
        ) : source === 'bucket' ? (
          <Field
            label="Bucket path"
            hint="Demo connection only. No cloud credentials or network access required."
          >
            <input
              required
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="s3://my-bucket/dataset"
            />
          </Field>
        ) : (
          <div className="notice">
            1,200 sample items with 12 classes, ready for any demo workflow.
          </div>
        )}
        {files.length > 0 && source === 'files' && (
          <p className="muted file-names">
            {files.map((f) => f.name).join(', ')}
          </p>
        )}
        <p className="muted small-text">
          Only file names and metadata are saved. Dataset previews and
          statistics are sample data.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add dataset</Button>
        </div>
      </form>
    </Modal>
  )
}
export function DatasetList({ project }: { project: Project }) {
  const { state } = useDemo()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [split, setSplit] = useState('')
  const [add, setAdd] = useState(false)
  const datasets = state.datasets.filter(
    (d) =>
      d.projectId === project.id &&
      d.name.toLowerCase().includes(query.toLowerCase()) &&
      (!status || d.status === status) &&
      (!split || d.split === split),
  )
  return (
    <>
      <Toolbar query={query} setQuery={setQuery}>
        <Filter
          label="All types"
          value={split}
          onChange={setSplit}
          options={['Train', 'Validation', 'Test', 'Unsplit']}
        />
        <Filter
          label="All statuses"
          value={status}
          onChange={setStatus}
          options={['Ready', 'Processing', 'Error']}
        />
      </Toolbar>
      <Card>
        <Table
          headers={[
            'Name',
            'Type',
            'Items',
            'Size',
            'Classes',
            'Status',
            'Created',
          ]}
        >
          {datasets.map((d) => (
            <tr key={d.id}>
              <td>
                <Link {...datasetLink(project.id, d.id)}>{d.name}</Link>
              </td>
              <td>
                <span className="tag">{d.split}</span>
              </td>
              <td>{number(d.items)} items</td>
              <td>{d.size}</td>
              <td>{d.classes || '—'}</td>
              <td>
                <Badge status={d.status} />
              </td>
              <td>{date(d.createdAt)}</td>
            </tr>
          ))}
        </Table>
        {!datasets.length && (
          <Empty
            title="No datasets found"
            description="Add a dataset or adjust your filters."
          />
        )}
      </Card>
      <div className="section-space">
        <Empty
          title="Add more training data"
          description="Drag and drop files, or connect a cloud bucket. Supports CSV, JSONL, Parquet, ZIP, COCO and YOLO formats."
        >
          <Button onClick={() => setAdd(true)}>
            <Plus size={16} />
            Add Dataset
          </Button>
        </Empty>
      </div>
      {add && <AddDataset project={project} onClose={() => setAdd(false)} />}
    </>
  )
}
export function DatasetDetail() {
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
