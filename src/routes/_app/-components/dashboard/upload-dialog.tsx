import * as React from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

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
import { Spinner } from '@/components/ui/spinner'
import { taskLabel } from '@/features/dashboard/format'
import { useUploadDataset } from '@/features/dashboard/queries'
import { acceptedUploads, uploadKind } from '@/features/datasets/upload-rules'
import type { ApiProject } from '@/features/dashboard/api'

export function UploadDialog({
  open,
  onOpenChange,
  projects,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** A dataset always belongs to a project, so the user has to pick one. */
  projects: ApiProject[]
}) {
  const [projectId, setProjectId] = React.useState('')
  const [name, setName] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState('')
  const upload = useUploadDataset()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const datasetName = name.trim()
    const project = projects.find((item) => item.id === projectId)
    if (!datasetName) return setError('Enter a dataset name.')
    if (!project) return setError('Choose a project.')
    const kind = file ? uploadKind(file) : undefined
    if (!file || !kind) return setError('Choose a ZIP or CSV file.')
    const accepted = acceptedUploads(project.task_type)
    if (!accepted.includes(kind)) {
      return setError(
        accepted.length
          ? `${taskLabel(project.task_type)} projects take a ${accepted.join(' or ').toUpperCase()} file here.`
          : `${taskLabel(project.task_type)} projects cannot be uploaded to from here yet.`,
      )
    }

    setError('')
    upload.mutate(
      { project, name: datasetName, file },
      {
        onSuccess: () => {
          toast.success(`${datasetName} uploaded to ${project.name}.`)
          setName('')
          setFile(null)
          onOpenChange(false)
        },
        onError: (cause) => setError(cause.message),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setError('')
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>Upload dataset</DialogTitle>
            <DialogDescription>
              Add a ZIP of labelled image folders or a CSV to one of your
              projects.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="dataset-project">Project</FieldLabel>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="dataset-project" className="w-full">
                  <SelectValue
                    placeholder={
                      projects.length ? 'Choose a project' : 'No projects yet'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="dataset-name">Dataset name</FieldLabel>
              <Input
                id="dataset-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="retail-products-v3"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="dataset-files">Dataset files</FieldLabel>
              <Input
                id="dataset-files"
                type="file"
                accept=".csv,.zip"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </Field>

            <FieldError>{error}</FieldError>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={upload.isPending}>
              {upload.isPending ? <Spinner /> : <Upload />}
              Upload dataset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
