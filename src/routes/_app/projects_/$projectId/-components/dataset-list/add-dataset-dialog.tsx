import * as React from 'react'
import { Plus, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Dataset, Project } from '@/features/dashboard/data'
import { splitOptions, supportedFile } from './types'

export function AddDatasetDialog({
  project,
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: Dataset[]
  onAdd: (dataset: Dataset) => void
}) {
  const [name, setName] = React.useState('')
  const [split, setSplit] = React.useState<Dataset['split']>('Train')
  const [source, setSource] = React.useState<'files' | 'bucket'>('files')
  const [files, setFiles] = React.useState<File[]>([])
  const [bucket, setBucket] = React.useState('')
  const [error, setError] = React.useState('')

  function chooseFiles(fileList: FileList | null) {
    if (!fileList) return
    const next = Array.from(fileList)
    if (next.some((file) => !supportedFile.test(file.name))) {
      setError('Choose CSV, JSON, JSONL, Parquet, ZIP, JPG, or PNG files.')
      return
    }
    setFiles(next)
    setError('')
    if (!name && next[0]) setName(next[0].name.replace(/\.[^.]+$/, ''))
  }

  function reset() {
    setName('')
    setSplit('Train')
    setSource('files')
    setFiles([])
    setBucket('')
    setError('')
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Enter a dataset name.')
    if (
      existing.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return setError('This dataset name already exists in the project.')
    }
    if (source === 'files' && files.length === 0)
      return setError('Select at least one file.')
    if (source === 'bucket' && !/^s3:\/\/[^\s]+$/.test(bucket)) {
      return setError('Enter a bucket path such as s3://my-bucket/dataset.')
    }
    const bytes = files.reduce((total, file) => total + file.size, 0)
    onAdd({
      id: `dataset-${crypto.randomUUID().slice(0, 8)}`,
      projectId: project.id,
      name: trimmed,
      modality: project.task.includes('Image')
        ? 'image'
        : project.task.includes('Text')
          ? 'text'
          : 'tabular',
      split,
      items: source === 'bucket' ? 1200 : files.length,
      size:
        source === 'bucket'
          ? '24 MB'
          : `${(bytes / 1024 / 1024).toFixed(2)} MB`,
      classes: 0,
      version: 1,
      status: 'Processing',
      created: 'Just now',
      files: source === 'bucket' ? [bucket] : files.map((file) => file.name),
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add dataset</DialogTitle>
          <DialogDescription>
            Add local data files or connect a mock cloud bucket.
          </DialogDescription>
        </DialogHeader>
        <form id="add-dataset-form" onSubmit={submit} className="grid gap-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="dataset-name">Dataset name</FieldLabel>
              <Input
                id="dataset-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. retail-shelf-v2"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Source</FieldLabel>
                <Select
                  value={source}
                  onValueChange={(value) =>
                    setSource(value as 'files' | 'bucket')
                  }
                >
                  <SelectTrigger aria-label="Dataset source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="files">Local files</SelectItem>
                    <SelectItem value="bucket">Cloud bucket</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select
                  value={split}
                  onValueChange={(value) => setSplit(value as Dataset['split'])}
                >
                  <SelectTrigger aria-label="Dataset type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {splitOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {source === 'files' ? (
              <Field>
                <FieldLabel
                  htmlFor="dataset-files"
                  className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-slate-50 text-center"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    chooseFiles(event.dataTransfer.files)
                  }}
                >
                  <Upload className="size-6 text-indigo-600" />
                  <span className="font-medium">
                    {files.length
                      ? `${files.length} file${files.length === 1 ? '' : 's'} selected`
                      : 'Drop files here or click to browse'}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    CSV, JSONL, Parquet, ZIP, JPG, PNG
                  </span>
                  <Input
                    id="dataset-files"
                    aria-label="Dataset files"
                    type="file"
                    multiple
                    className="sr-only"
                    accept=".csv,.json,.jsonl,.parquet,.zip,.jpg,.jpeg,.png"
                    onChange={(event) => chooseFiles(event.target.files)}
                  />
                </FieldLabel>
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="bucket-path">Bucket path</FieldLabel>
                <Input
                  id="bucket-path"
                  value={bucket}
                  onChange={(event) => setBucket(event.target.value)}
                  placeholder="s3://my-bucket/dataset"
                />
              </Field>
            )}
            {error && <FieldError role="alert">{error}</FieldError>}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-dataset-form">
            <Plus />
            Add dataset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
