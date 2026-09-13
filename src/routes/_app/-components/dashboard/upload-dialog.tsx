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
import type { Activity } from '@/features/dashboard/data'

export function UploadDialog({
  open,
  onOpenChange,
  organizationId,
  onUpload,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onUpload: (activity: Activity) => void
}) {
  const [name, setName] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const allowed = [
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
    ]
    if (!name.trim()) return setError('Enter a dataset name.')
    if (!file) return setError('Choose a CSV, ZIP, JPG, or PNG file.')
    if (
      !allowed.includes(file.type) &&
      !/\.(csv|zip|jpe?g|png)$/i.test(file.name)
    )
      return setError('Choose a CSV, ZIP, JPG, or PNG file.')
    onUpload({
      id: `upload-${Date.now()}`,
      orgId: organizationId,
      icon: 'dataset',
      lead: `Dataset ${name.trim()}`,
      text: `uploaded (${file.name})`,
      time: 'Just now',
      action: 'View',
    })
    toast.success(`${name.trim()} uploaded successfully.`)
    setName('')
    setFile(null)
    setError('')
    onOpenChange(false)
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
              Add a local file to the current organization. This demo stores
              metadata only.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-2">
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
                accept=".csv,.zip,.jpg,.jpeg,.png"
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
            <Button type="submit">
              <Upload />
              Upload dataset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
